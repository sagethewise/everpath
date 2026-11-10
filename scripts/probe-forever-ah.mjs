#!/usr/bin/env node
/**
 * Read-only WoW: Forever Auction House capability probe.
 * No AH listings or secrets are written to disk. No live UI integration.
 * Run: npm run api:ah:probe        (index only)
 *      npm run api:ah:probe -- --house-id 113   (one house summary)
 */
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';

const REGIONS=new Set(['eu','us','kr','tw']);
export function configFrom(env){
 const region=(env.BLIZZARD_REGION||'eu').toLowerCase();
 if(!REGIONS.has(region))throw Error('Invalid Blizzard region');
 return {region,namespace:`dynamic-forever-${region}`,locale:env.BLIZZARD_LOCALE||'en_GB'};
}
export function endpoint(config,pathname){
 if(!/^\/data\/wow\/ruleset\/(?:index|[1-9]\d*\/auctions\/(?:[1-9]\d*(?:\/commodities)?)?)$/.test(pathname))
  throw Error('Blocked non-allowlisted path');
 const url=new URL(`https://${config.region}.api.blizzard.com${pathname}`);
 url.searchParams.set('namespace',config.namespace);
 url.searchParams.set('locale',config.locale);
 return url.toString();
}
export function summarize(body){
 if(!body||typeof body!=='object'||Array.isArray(body))return {shape:'unexpected'};
 return {keys:Object.keys(body).slice(0,16),
  collections:Object.entries(body).filter(([,value])=>Array.isArray(value))
   .map(([name,value])=>({name,count:value.length,exampleKeys:value[0]&&typeof value[0]==='object'?Object.keys(value[0]).slice(0,12):[]}))};
}
export function identifiers(body,key){
 return Array.isArray(body?.[key])?body[key].map(entry=>Number(entry?.id)).filter(id=>Number.isSafeInteger(id)&&id>0):[];
}
async function tokenFor(id,secret){
 const response=await fetch('https://oauth.battle.net/token',{
  method:'POST',headers:{Authorization:'Basic '+Buffer.from(`${id}:${secret}`).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},
  body:new URLSearchParams({grant_type:'client_credentials'}),signal:AbortSignal.timeout(15000)
 });
 if(!response.ok)throw Error(`OAuth HTTP ${response.status}`);
 const body=await response.json();
 if(typeof body.access_token!=='string')throw Error('OAuth did not return access token');
 return body.access_token;
}
export async function inspect({config,token,fetcher=fetch,houseId=null}){
 const report={checkedAt:new Date().toISOString(),region:config.region,namespace:config.namespace,checks:[],note:'Capability probe only. Results do not establish ruleset-to-house mapping, price freshness or release rights.'};
 async function request(label,p){
  const url=endpoint(config,p);
  try{
   const response=await fetcher(url,{headers:{Authorization:`Bearer ${token}`,Accept:'application/json'},signal:AbortSignal.timeout(25000)});
   const check={label,httpStatus:response.status,ok:response.ok};
   if(!response.ok){report.checks.push(check);return null}
   const body=await response.json();
   check.summary=summarize(body);
   report.checks.push(check);
   return body;
  }catch(e){report.checks.push({label,ok:false,error:e instanceof Error?e.message:'Request failed'});return null}
 }
 const index=await request('ruleset-index','/data/wow/ruleset/index');
 const ids=identifiers(index,'rulesets');
 report.rulesetIds=ids;
 if(ids.length===0)return report;
 const rulesetId=ids[0];
 report.probedRulesetId=rulesetId;
 const ahIndex=await request('auction-house-index',`/data/wow/ruleset/${rulesetId}/auctions/`);
 report.auctionHouseIds=identifiers(ahIndex,'auctions');
 if(houseId!==null){
  if(!report.auctionHouseIds.includes(houseId)){report.houseProbeSkipped='Requested house ID not in API index';return report}
  // One house only; retain counts/key shapes, never raw auction listings.
  await request('auction-house-detail',`/data/wow/ruleset/${rulesetId}/auctions/${houseId}`);
 }
 return report;
}
async function main(){
 const config=configFrom(process.env);
 const args=process.argv.slice(2);
 const ix=args.indexOf('--house-id');
 const raw=ix>=0?args[ix+1]:null;
 if(ix>=0&&!/^[1-9]\d*$/.test(raw||''))throw Error('Supply a positive integer after --house-id');
 const houseId=ix>=0?Number(raw):null;
 if(houseId!==null&&!Number.isSafeInteger(houseId))throw Error('Invalid house ID');
 const dryRun=args.includes('--dry-run');
 if(dryRun){
  console.log(JSON.stringify({config,plannedPaths:['/data/wow/ruleset/index','/data/wow/ruleset/{id}/auctions/'],houseId,noRequestsMade:true},null,2));
  return;
 }
 const id=process.env.BLIZZARD_CLIENT_ID,secret=process.env.BLIZZARD_CLIENT_SECRET;
 if(!id||!secret)throw Error('Missing Blizzard credentials in .env');
 const token=await tokenFor(id,secret);
 const report=await inspect({config,token,houseId});
 await mkdir(path.resolve('imports'),{recursive:true});
 const output=path.resolve('imports/forever-ah-probe.json');
 await writeFile(output,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
 console.log('Saved capability summary to imports/forever-ah-probe.json. No listing data stored.');
}
if(process.argv[1]&&new URL('file://'+path.resolve(process.argv[1]).replaceAll('\\','/')).href===import.meta.url){
 main().catch(e=>{console.error(e instanceof Error?e.message:'Probe failed');process.exitCode=1});
}
