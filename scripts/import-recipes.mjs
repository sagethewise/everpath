#!/usr/bin/env node
/** Complete-by-default recipe import. Persistent cached responses allow safe resumption. */
import path from 'node:path';
import {getToken,fetchData} from './import-blizzard.mjs';
import {probeConfiguration} from './probe-blizzard.mjs';
import {normalizeEntries} from './blizzard-normalize.mjs';
import {skillTiers,tierRecipes,normalizeRecipeDetail,summarizeCoverage} from './recipe-normalize.mjs';
import {SyncCache,ThrottledRequester,options,atomicJson,sanitizedError,summary} from './sync-engine.mjs';

const unavailable=record=>({...record,status:'unavailable',materialsStatus:'missing-or-incomplete',reagents:[],skillRequirement:null,craftedItemId:null});
const validConfig=c=>/^static-forever-(eu|us|kr|tw)$/.test(c.namespace)&&c.namespace.endsWith(`-${c.region}`);
export const parseArgs=options;
export async function gatherRecipes({config,token,fetcher=fetch,base=process.cwd(),maxRecords=Infinity,maxRecipes,delayMs=250,retries=4,refresh=false,sleep,random}={}){
 if(!validConfig(config))throw Error('Explicit Forever namespace matching region required');
 const cache=await new SyncCache({filename:path.join(base,'imports/cache/recipes.json'),...config}).load();
 const requester=new ThrottledRequester({cache,delayMs,retries,refresh,sleep,random,fetchRequest:pathname=>fetchData({config,token,pathname,fetcher})});
 const errors=[],tiers=[],allRecords=new Map(),perProfession=new Map();
 const request=async pathname=>{try{return (await requester.get(pathname,{force:pathname.endsWith("/index")})).value;}catch(err){errors.push({path:pathname,...sanitizedError(err)});return null;}};
 const index=await request('/data/wow/profession/index');
 if(!index)throw Error('Profession index unavailable; previous public dataset unchanged.');
 const professions=normalizeEntries(index,'professions');
 for(const profession of professions){
  const detail=await request(`/data/wow/profession/${profession.id}`);if(!detail)continue;
  for(const tier of skillTiers(detail,profession)){
   const raw=await request(`/data/wow/profession/${profession.id}/skill-tier/${tier.id}`);
   tiers.push({...tier,minimumSkill:Number.isSafeInteger(raw?.minimum_skill_level)?raw.minimum_skill_level:null,maximumSkill:Number.isSafeInteger(raw?.maximum_skill_level)?raw.maximum_skill_level:null});
   if(!raw)continue;
   for(const record of tierRecipes(raw,tier)){
    if(allRecords.has(record.id))continue;
    allRecords.set(record.id,record);
    if(!perProfession.has(profession.id))perProfession.set(profession.id,[]);
    perProfession.get(profession.id).push(record);
   }
  }
 }
 // Fair distribution also applies in optional, development-only bounded runs.
 const limit=maxRecipes??maxRecords;
 const queues=[...perProfession.values()].map(list=>[...list]);const selected=[];
 while(selected.length<limit&&queues.some(q=>q.length))for(const q of queues)if(q.length&&selected.length<limit)selected.push(q.shift());
 const recipes=[];
 for(const record of selected){
  const detail=await request(`/data/wow/recipe/${record.id}`);
  recipes.push(detail?normalizeRecipeDetail(detail,record):unavailable(record));
 }
 const missingDetails=recipes.filter(x=>x.status==='unavailable').length;
 const discovered=allRecords.size;
 const result={schemaVersion:1,status:'api-imported-unverified',source:'Blizzard Game Data API',region:config.region,namespace:config.namespace,locale:config.locale,importedAt:new Date().toISOString(),limited:selected.length<discovered,selectionStrategy:'round-robin-by-profession',discoveredRecipes:discovered,professions:professions.map(({id,name})=>({id,name})),tiers,recipes,errors};
 result.coverage={...summarizeCoverage(result),...summary({discovered,processed:recipes.length-missingDetails,metrics:requester.metrics,errors}),missingDetails,cachedResponses:cache.count(),indexComplete:errors.every(e=>!e.path.startsWith('/data/wow/profession/'))};
 return result;
}
export async function writeSnapshot(snapshot,base=process.cwd()){
 const output=path.join(base,'src/data/blizzard-recipes.json');const report=path.join(base,'imports/blizzard-recipes-report.json');
 await atomicJson(output,snapshot);
 await atomicJson(report,{importedAt:snapshot.importedAt,namespace:snapshot.namespace,coverage:snapshot.coverage,errors:snapshot.errors});
 return {output,report};
}
async function main(){
 const config=probeConfiguration({...process.env,BLIZZARD_NAMESPACE:process.env.BLIZZARD_NAMESPACE||'static-forever-eu'});
 const opts=options(process.argv.slice(2));
 const token=await getToken({id:process.env.BLIZZARD_CLIENT_ID,secret:process.env.BLIZZARD_CLIENT_SECRET});
 const snapshot=await gatherRecipes({config,token,...opts});
 const paths=await writeSnapshot(snapshot);
 console.log(`Recipes: ${snapshot.coverage.processed}/${snapshot.discoveredRecipes} successful detail responses; ${snapshot.coverage.withMaterials} with verified full materials. Cached ${snapshot.coverage.cached}; fetched ${snapshot.coverage.downloaded}; retried ${snapshot.coverage.retries}.`);
 console.log(`Complete: ${snapshot.coverage.complete&&snapshot.coverage.indexComplete}. Report: ${paths.report}`);
 if(snapshot.errors.length)console.warn(`There were ${snapshot.errors.length} endpoint errors. Run the same command again to resume.`);
}
if(process.argv[1]&&new URL(`file://${path.resolve(process.argv[1])}`).href===import.meta.url)main().catch(e=>{console.error(e.message);process.exitCode=1});
