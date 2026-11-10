#!/usr/bin/env node
/**
 * Blizzard Game Data API capability probe.
 * Intentionally does NOT publish to the UI. It tests which resources exist
 * in the user's explicitly selected game namespace and records a summary.
 * Credentials must remain on the developer machine / server.
 */
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';

export const ENDPOINTS = Object.freeze([
  {key:'professions', path:'/data/wow/profession/index', kind:'index'},
  {key:'pets', path:'/data/wow/pet/index', kind:'index'},
]);
const REGIONS = new Set(['eu','us','kr','tw']);
export function validateConfig({region,namespace,locale}) {
  if (!REGIONS.has(region)) throw Error('Unsupported region');
  if (!/^static-[a-z0-9-]{3,80}$/.test(namespace) || !namespace.endsWith(`-${region}`)) throw Error('Namespace must be a static namespace ending with selected region');
  if (!/^[a-z]{2}_[A-Z]{2}$/.test(locale)) throw Error('Invalid locale');
  return {region,namespace,locale};
}
export function gameDataUrl({region,namespace,locale}, endpoint) {
  if(!ENDPOINTS.some(x=>x.path===endpoint))throw Error('Endpoint not allowlisted');
  const url = new URL(`https://${region}.api.blizzard.com${endpoint}`);
  url.searchParams.set('namespace',namespace);
  url.searchParams.set('locale',locale);
  return url;
}
export function summarizeResponse(key, body) {
  if (!body || typeof body!=='object' || Array.isArray(body)) throw Error('Unexpected response: expected JSON object');
  const rootKeys=Object.keys(body).slice(0,25);
  const collections=Object.entries(body).filter(([,v])=>Array.isArray(v)).map(([name,v])=>({name,count:v.length,firstEntryKeys: v.length&&typeof v[0]==='object'&&v[0] ? Object.keys(v[0]).slice(0,14):[]}));
  return {key,rootKeys,collections};
}
export function probeConfiguration(env) {
  return validateConfig({
    region: env.BLIZZARD_REGION||'eu',
    namespace: env.BLIZZARD_NAMESPACE||`static-forever-${env.BLIZZARD_REGION||'eu'}`,
    locale: env.BLIZZARD_LOCALE||'en_GB'
  });
}
async function authToken(clientId,secret) {
  const credentials=Buffer.from(`${clientId}:${secret}`).toString('base64');
  const response=await fetch('https://oauth.battle.net/token',{
    method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Authorization:`Basic ${credentials}`},
    body:new URLSearchParams({grant_type:'client_credentials'}),signal:AbortSignal.timeout(15000)
  });
  if(!response.ok)throw Error(`OAuth returned HTTP ${response.status}`);
  const data=await response.json();
  if(typeof data.access_token!=='string')throw Error('OAuth response missing token');
  return data.access_token;
}
export async function probeAll({config,token,fetcher=fetch}) {
  const results=[];
  for(const endpoint of ENDPOINTS) {
    try {
      const response=await fetcher(gameDataUrl(config,endpoint.path),{
        headers:{Authorization:`Bearer ${token}`,Accept:'application/json'},signal:AbortSignal.timeout(18000)
      });
      if(!response.ok){results.push({key:endpoint.key,status:'unavailable',httpStatus:response.status});continue;}
      const summary=summarizeResponse(endpoint.key,await response.json());
      results.push({key:endpoint.key,status:'response-received',httpStatus:response.status,...summary});
    } catch(e) {
      results.push({key:endpoint.key,status:'error',message:e instanceof Error?e.message:'Unknown fetch error'});
    }
  }
  return results;
}
async function main() {
  const config=probeConfiguration(process.env);
  const dryRun=process.argv.includes('--dry-run');
  const id=process.env.BLIZZARD_CLIENT_ID,secret=process.env.BLIZZARD_CLIENT_SECRET;
  if(!dryRun&&(!id||!secret))throw Error('Set BLIZZARD_CLIENT_ID and BLIZZARD_CLIENT_SECRET in your terminal environment; never use VITE_ for credentials.');
  const checkedAt=new Date().toISOString();
  const results=dryRun?ENDPOINTS.map(e=>({key:e.key,status:'not-queried',requestUrl:gameDataUrl(config,e.path).toString()})):
    await probeAll({config,token:await authToken(id,secret)});
  const report={checkedAt,gameVersion:'UNVERIFIED_FOR_WOW_FOREVER',config,results,note:'HTTP 200 does not prove the payload belongs to Forever. Do not publish data without game-version and licensing checks.'};
  const dir=path.resolve('imports');await mkdir(dir,{recursive:true});
  const file=path.join(dir,dryRun?'api-probe-dry-run.json':'api-probe-report.json');
  await writeFile(file,JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
  console.log(`Report saved in ${file}`);
}
if(process.argv[1] && new URL(`file://${path.resolve(process.argv[1])}`).href===import.meta.url) {
 main().catch(error=>{console.error(error instanceof Error?error.message:'Unknown error');process.exitCode=1});
}
