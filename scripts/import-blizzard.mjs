#!/usr/bin/env node
/** Server-side import of Blizzard index + bounded detail diagnostics. No secrets in output. */
import {writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {probeConfiguration} from './probe-blizzard.mjs';
import {normalizeSnapshot,extractDetailSummary} from './blizzard-normalize.mjs';

export async function getToken({id,secret,fetcher=fetch}){
  if(!id||!secret)throw Error('Missing Blizzard credentials. Run with node --env-file=.env scripts/import-blizzard.mjs');
  const response=await fetcher('https://oauth.battle.net/token',{method:'POST',headers:{Authorization:`Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'client_credentials'}),signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error(`Blizzard OAuth HTTP ${response.status}`);
  const data=await response.json();if(typeof data.access_token!=='string')throw Error('Missing OAuth access token');return data.access_token;
}
export function endpointUrl(config,pathname){
  if(!/^\/data\/wow\/(?:profession(?:\/index|\/[1-9]\d*(?:\/skill-tier\/[1-9]\d*)?)|pet(?:\/index|\/[1-9]\d*)|recipe\/[1-9]\d*|media\/(?:pet|item)\/[1-9]\d*)$/.test(pathname))throw Error('Unexpected endpoint');
  const url=new URL(`https://${config.region}.api.blizzard.com${pathname}`);
  url.searchParams.set('namespace',config.namespace);url.searchParams.set('locale',config.locale);return url.toString();
}
export async function fetchData({config,token,pathname,fetcher=fetch}){
  const response=await fetcher(endpointUrl(config,pathname),{headers:{Authorization:`Bearer ${token}`,Accept:'application/json'},signal:AbortSignal.timeout(18000)});
  if(!response.ok){const error=new Error(`${pathname}: HTTP ${response.status}`);error.retryAfterSeconds=Number(response.headers?.get?.('retry-after'));throw error;}
  const json=await response.json();if(!json||typeof json!=='object'||Array.isArray(json))throw Error(`${pathname}: unexpected JSON`);return json;
}
export async function collect({config,token,fetcher=fetch,detailLimit=3}){
  const professions=await fetchData({config,token,fetcher,pathname:'/data/wow/profession/index'});
  const pets=await fetchData({config,token,fetcher,pathname:'/data/wow/pet/index'});
  const preliminary=normalizeSnapshot({professions,pets,...config,importedAt:new Date().toISOString()});
  const detailChecks=[];
  for(const [kind,entries] of [['profession',preliminary.professions],['pet',preliminary.pets]]){
    for(const entry of entries.slice(0,detailLimit)){
      const pathname=`/data/wow/${kind}/${entry.id}`;
      try {const detail=await fetchData({config,token,fetcher,pathname});detailChecks.push({kind,requestedId:entry.id,...extractDetailSummary(detail,kind)});}
      catch(err){detailChecks.push({kind,requestedId:entry.id,status:'unavailable',message:err instanceof Error?err.message:'Unknown error'});}
    }
  }
  return {...preliminary,detailChecks};
}
async function main(){
  const config=probeConfiguration({...process.env,BLIZZARD_NAMESPACE:process.env.BLIZZARD_NAMESPACE||'static-forever-eu'});
  if(!config.namespace.startsWith('static-forever-'))throw Error('This importer only accepts the explicit static-forever-* namespace.');
  const args=process.argv.slice(2),index=args.indexOf('--detail-limit');
  const detailLimit=index>=0?Number(args[index+1]):3;
  if(!Number.isInteger(detailLimit)||detailLimit<0||detailLimit>10)throw Error('--detail-limit must be 0..10');
  const token=await getToken({id:process.env.BLIZZARD_CLIENT_ID,secret:process.env.BLIZZARD_CLIENT_SECRET});
  const snapshot=await collect({config,token,detailLimit});
  const output=path.resolve('src/data/blizzard-import.json');
  const diagnostics=path.resolve('imports/blizzard-import-report.json');
  await mkdir(path.dirname(diagnostics),{recursive:true});
  await writeFile(output,JSON.stringify(snapshot,null,2)+'\n');
  await writeFile(diagnostics,JSON.stringify({importedAt:snapshot.importedAt,namespace:config.namespace,professionCount:snapshot.professions.length,petCount:snapshot.pets.length,detailChecks:snapshot.detailChecks},null,2)+'\n');
  console.log(`Blizzard index imported: ${snapshot.professions.length} professions / ${snapshot.pets.length} pets`);
  console.log('Data is explicitly labeled API-imported / UNVERIFIED. Recipe materials, acquisition sources and pet classification are not inferred.');
  console.log(`Public JSON: ${output} | Diagnostics: ${diagnostics}`);
}
if(process.argv[1]&&new URL(`file://${path.resolve(process.argv[1])}`).href===import.meta.url){main().catch(err=>{console.error(err.message);process.exitCode=1})}
