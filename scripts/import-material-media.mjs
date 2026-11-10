#!/usr/bin/env node
/** Import one icon per distinct reagent item; no guessed resource coordinates. */
import path from 'node:path';
import {getToken,fetchData} from './import-blizzard.mjs';
import {probeConfiguration} from './probe-blizzard.mjs';
import {SyncCache,ThrottledRequester,options,atomicJson,readJson,sanitizedError} from './sync-engine.mjs';
export function materialIds(recipes){return [...new Set((recipes||[]).flatMap(r=>(r.reagents||[]).map(x=>x.itemId)).filter(x=>Number.isSafeInteger(x)&&x>0))].sort((a,b)=>a-b)}
export function iconAsset(body){const item=(Array.isArray(body?.assets)?body.assets:[]).find(x=>x.key==='icon')||(Array.isArray(body?.assets)?body.assets:[])[0];return typeof item?.value==='string'&&/^https:\/\/[^\s]+$/i.test(item.value)?item.value:null}
export async function syncMaterialMedia({config,token,base=process.cwd(),fetcher=fetch,limit=Infinity,delayMs=250,retries=4,refresh=false,sleep,random}={}){
 const recipeFile=await readJson(path.join(base,'src/data/blizzard-recipes.json'));
 if(!recipeFile||recipeFile.status!=='api-imported-unverified')throw Error('Run npm run api:recipes first.');
 const ids=materialIds(recipeFile.recipes);const cache=await new SyncCache({filename:path.join(base,'imports/cache/material-media.json'),...config}).load();
 const engine=new ThrottledRequester({cache,delayMs,retries,refresh,sleep,random,fetchRequest:pathname=>fetchData({config,token,pathname,fetcher})});
 const errors=[];const icons={};let done=0;
 for(const id of ids.slice(0,limit)){
  try {const {value}=await engine.get(`/data/wow/media/item/${id}`);icons[String(id)]=iconAsset(value);}
  catch(e){errors.push({itemId:id,...sanitizedError(e)});icons[String(id)]=null;}
  done++;if(done%50===0)console.log(`[Material icons] ${done}/${Math.min(ids.length,limit)} checked`);
 }
 const result={schemaVersion:1,status:'api-imported-unverified',namespace:config.namespace,importedAt:new Date().toISOString(),discovered:ids.length,processed:done,icons};
 await atomicJson(path.join(base,'src/data/material-media.json'),result);
 await atomicJson(path.join(base,'imports/material-media-report.json'),{namespace:config.namespace,discovered:ids.length,processed:done,withIcons:Object.values(icons).filter(Boolean).length,cached:engine.metrics.cached,downloaded:engine.metrics.downloaded,errors});
 return result;
}
async function main(){const config=probeConfiguration({...process.env,BLIZZARD_NAMESPACE:process.env.BLIZZARD_NAMESPACE||'static-forever-eu'});const opts=options(process.argv.slice(2));const token=await getToken({id:process.env.BLIZZARD_CLIENT_ID,secret:process.env.BLIZZARD_CLIENT_SECRET});const r=await syncMaterialMedia({config,token,limit:opts.maxRecords,...opts});console.log(`Imported ${Object.values(r.icons).filter(Boolean).length} icon URLs for ${r.processed}/${r.discovered} distinct materials.`)}
if(process.argv[1]&&new URL(`file://${path.resolve(process.argv[1])}`).href===import.meta.url)main().catch(e=>{console.error(e.message);process.exitCode=1});
