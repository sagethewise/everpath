#!/usr/bin/env node
/** Complete-by-default pet metadata + media synchronization. */
import path from 'node:path';
import {getToken,fetchData} from './import-blizzard.mjs';
import {probeConfiguration} from './probe-blizzard.mjs';
import {normalizeEntries} from './blizzard-normalize.mjs';
import {normalizePet,resolvePetMedia} from './pet-normalize.mjs';
import {SyncCache,ThrottledRequester,options,atomicJson,sanitizedError,summary} from './sync-engine.mjs';

export async function gatherPets({config,token,fetcher=fetch,base=process.cwd(),maxRecords=Infinity,limit,delayMs=250,retries=4,refresh=false,sleep,random}={}){
 if(!/^static-forever-(eu|us|kr|tw)$/.test(config.namespace)||!config.namespace.endsWith(`-${config.region}`))throw Error('Explicit Forever namespace required');
 const cache=await new SyncCache({filename:path.join(base,'imports/cache/pets.json'),...config}).load();
 const requestEngine=new ThrottledRequester({cache,delayMs,retries,refresh,sleep,random,fetchRequest:pathname=>fetchData({config,token,fetcher,pathname})});
 const errors=[];
 const request=async pathname=>{try{return (await requestEngine.get(pathname,{force:pathname.endsWith("/index")})).value;}catch(e){errors.push({path:pathname,...sanitizedError(e)});return null;}};
 const index=await request('/data/wow/pet/index');if(!index)throw Error('Pet index unavailable; previous public dataset unchanged.');
 const all=normalizeEntries(index,'pets');const entries=all.slice(0,limit??maxRecords),pets=[];
 for(const entry of entries){
  const detail=await request(`/data/wow/pet/${entry.id}`);
  const media=await request(`/data/wow/media/pet/${entry.id}`);
  pets.push(normalizePet(entry,detail,resolvePetMedia(media)));
 }
 const unavailablePaths=new Set(errors.map(e=>e.path));
 const processed=entries.filter(p=>!unavailablePaths.has(`/data/wow/pet/${p.id}`)&&!unavailablePaths.has(`/data/wow/media/pet/${p.id}`)).length;
 const result={schemaVersion:1,status:'api-imported-unverified',namespace:config.namespace,region:config.region,locale:config.locale,importedAt:new Date().toISOString(),pets,errors,limited:entries.length<all.length};
 result.coverage={...summary({discovered:all.length,processed,metrics:requestEngine.metrics,errors}),withImages:pets.filter(p=>p.imageUrl).length,withSources:pets.filter(p=>p.source).length,withZones:pets.filter(p=>p.zone).length};
 return result;
}
export async function writePets(result,base=process.cwd()){
 const output=path.join(base,'src/data/blizzard-pets.json'),report=path.join(base,'imports/blizzard-pets-report.json');
 await atomicJson(output,result);
 await atomicJson(report,{namespace:result.namespace,importedAt:result.importedAt,coverage:result.coverage,errors:result.errors});
 return {output,report};
}
async function main(){
 const config=probeConfiguration({...process.env,BLIZZARD_NAMESPACE:process.env.BLIZZARD_NAMESPACE||'static-forever-eu'});
 const opts=options(process.argv.slice(2));
 const token=await getToken({id:process.env.BLIZZARD_CLIENT_ID,secret:process.env.BLIZZARD_CLIENT_SECRET});
 const result=await gatherPets({config,token,...opts});
 const paths=await writePets(result);
 console.log(`Pets: ${result.coverage.processed}/${result.coverage.discovered} complete detail+media checks; ${result.coverage.withImages} images, ${result.coverage.withSources} source fields. Cached ${result.coverage.cached}; fetched ${result.coverage.downloaded}.`);
 console.log(`Report: ${paths.report}`);
 if(result.errors.length)console.warn(`${result.errors.length} endpoint errors; rerun to retry failed records.`);
}
if(process.argv[1]&&new URL(`file://${path.resolve(process.argv[1])}`).href===import.meta.url)main().catch(e=>{console.error(e.message);process.exitCode=1});
