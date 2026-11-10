/** Persistent, incremental Blizzard data sync. The cache is private and NEVER contains auth tokens. */
import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import path from 'node:path';

export const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export function options(argv=[]){
 const out={delayMs:250,maxRecords:Infinity,refresh:false,retries:4};
 for(let i=0;i<argv.length;i++){
  const flag=argv[i];
  if(flag==='--refresh'){out.refresh=true;continue;}
  const prop={'--delay-ms':'delayMs','--max-records':'maxRecords','--retries':'retries','--max-recipes':'maxRecords','--limit':'maxRecords'}[flag];
  if(!prop)throw Error(`Unknown option ${flag}`);
  const value=Number(argv[++i]);if(!Number.isSafeInteger(value)||value<0)throw Error(`Invalid ${flag}`);
  out[prop]=value;
 }
 if(out.delayMs>60000||out.retries>12||out.maxRecords===0)throw Error('Option outside supported bounds');
 return out;
}
export async function atomicJson(filepath,data){
 await mkdir(path.dirname(filepath),{recursive:true});
 const temporary=`${filepath}.${process.pid}.tmp`;
 await writeFile(temporary,JSON.stringify(data,null,2)+'\n');
 await rename(temporary,filepath);
}
export async function readJson(filepath){try{return JSON.parse(await readFile(filepath,'utf8'));}catch(e){if(e?.code==='ENOENT')return null;throw e;}}
const stamp=()=>new Date().toISOString();
export class SyncCache{
 constructor({filename,namespace,region,locale}){this.filename=filename;this.config={namespace,region,locale};this.data={schemaVersion:1,...this.config,createdAt:stamp(),updatedAt:stamp(),entries:{}};this.queue=Promise.resolve();}
 async load(){
  const previous=await readJson(this.filename);
  if(previous){
   if(previous.namespace!==this.config.namespace||previous.region!==this.config.region||previous.locale!==this.config.locale)throw Error('Sync cache belongs to a different region, locale or namespace. Move it aside before changing configuration.');
   if(previous.schemaVersion!==1||typeof previous.entries!=='object'||!previous.entries)throw Error('Invalid sync cache format');
   this.data=previous;
  }
  return this;
 }
 get(key){return this.data.entries[key]?.value??null;}
 has(key){return Object.hasOwn(this.data.entries,key);}
 async put(key,value){
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Only JSON object responses may be cached');
  this.data.entries[key]={savedAt:stamp(),value};this.data.updatedAt=stamp();
  await atomicJson(this.filename,this.data);
 }
 count(){return Object.keys(this.data.entries).length;}
}
function parseStatus(error){const match=String(error?.message??'').match(/HTTP (\d{3})/);return match?Number(match[1]):null;}
export function isTransient(error){const status=parseStatus(error);return status===429||status===408||status>=500||status===null;}
export function retryAfterMs(error){const seconds=Number(error?.retryAfterSeconds);return Number.isFinite(seconds)&&seconds>=0?Math.min(seconds*1000,120000):0;}
export class ThrottledRequester{
 constructor({fetchRequest,cache,delayMs=250,retries=4,sleep=pause,refresh=false,random=Math.random}){
  this.fetchRequest=fetchRequest;this.cache=cache;this.delayMs=delayMs;this.retries=retries;this.sleep=sleep;this.refresh=refresh;this.random=random;
  this.metrics={requests:0,cached:0,downloaded:0,retries:0,failed:0};
 }
 async get(pathname,{force=false}={}){
  if(!force&&!this.refresh&&this.cache.has(pathname)){this.metrics.cached++;return {value:this.cache.get(pathname),cached:true};}
  for(let attempt=0;attempt<=this.retries;attempt++){
   await this.sleep(this.delayMs);
   this.metrics.requests++;
   try{
    const value=await this.fetchRequest(pathname);
    await this.cache.put(pathname,value);
    this.metrics.downloaded++;
    return {value,cached:false};
   }catch(err){
    if(!isTransient(err)||attempt===this.retries){this.metrics.failed++;throw err;}
    this.metrics.retries++;
    const delay=Math.max(retryAfterMs(err),Math.min(30000,750*2**attempt+Math.floor(this.random()*300)));
    await this.sleep(delay);
   }
  }
 }
}
export function sanitizedError(error){const status=parseStatus(error);return {status:status??'network-or-data-error'};}
export function summary({discovered,processed,metrics,errors}){return {discovered,processed,remaining:Math.max(0,discovered-processed),...metrics,errors:errors.length,complete:discovered===processed&&errors.length===0};}
