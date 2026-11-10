/**
 * Opt-in ForeverDB staging only. Never write unreviewed community coordinates
 * into src/data/acquisition.json. API key stays in local process environment.
 * Usage: node --env-file=.env scripts/stage-foreverdb.mjs
 */
import {mkdir,writeFile,rename} from 'node:fs/promises';
import {resolve} from 'node:path';
const key=process.env.FOREVERDB_API_KEY;
if (!key) { console.error('FOREVERDB_API_KEY missing. Request access at https://foreverdb.net/developers; no data was fetched.');process.exit(1); }
const root='https://foreverdb.net';
const paths=['/api/v1/meta','/api/v1/gathering/herbalism','/api/v1/gathering/mining','/api/v1/gathering/skinning','/api/v1/gathering/fishing','/api/v1/zones?limit=100&offset=0'];
const output=resolve('imports/staging/foreverdb');await mkdir(output,{recursive:true});
const status=[];
const delay=(n)=>new Promise(ok=>setTimeout(ok,n));
for(let i=0;i<paths.length;i++){
 const path=paths[i]; const name=['meta','herbalism','mining','skinning','fishing','zones'][i];let result;
 for(let attempt=0;attempt<4;attempt++){
  try{
   const response=await fetch(root+path,{headers:{'X-API-Key':key,'Accept':'application/json'},signal:AbortSignal.timeout(20000)});
   if(response.status===429 || response.status>=500){if(attempt===3)throw Error(`HTTP ${response.status}`);const retrySeconds=Math.min(30,Number(response.headers.get('retry-after'))||0);await delay(Math.max(retrySeconds*1000,1500*2**attempt));continue;}
   if(!response.ok)throw Error(`HTTP ${response.status}`);
   result=await response.json();break;
  }catch(error){if(attempt===3){status.push({endpoint:path,status:'failed',error:String(error)});break;}await delay(1500*2**attempt);}
 }
 if(result){const dest=resolve(output,name+'.json');const tmp=dest+'.tmp';await writeFile(tmp,JSON.stringify(result,null,2)+'\n');await rename(tmp,dest);status.push({endpoint:path,status:'staged',file:`imports/staging/foreverdb/${name}.json`});console.log(`Staged ${name}; unpublished, requires provenance & record-level review.`)}
 await delay(1100);
}
await writeFile(resolve(output,'report.json'),JSON.stringify({stagedAt:new Date().toISOString(),provider:'ForeverDB',attributionRequired:true,apiKeyStored:false,note:'Source is mixed Forever and Classic; staged data is NOT approved for site display.',status},null,2)+'\n');
console.log('Review imports/staging/foreverdb/report.json; staging files never affect the published acquisition catalog.');
if(status.some(s=>s.status==='failed'))process.exitCode=1;
