import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {SyncCache,ThrottledRequester,options,readJson} from '../scripts/sync-engine.mjs';
import {gatherRecipes} from '../scripts/import-recipes.mjs';
import {gatherPets} from '../scripts/import-pets.mjs';
const config={region:'eu',namespace:'static-forever-eu',locale:'en_GB'};
const folder=()=>mkdtemp(path.join(tmpdir(),'everpath-full-sync-'));
const response=(records,counts)=>async url=>{const pathname=new URL(url).pathname;counts[pathname]=(counts[pathname]??0)+1;return records[pathname]?{ok:true,json:async()=>records[pathname]}:{ok:false,status:404,headers:{get:()=>null}}};
test('unbounded recipe import discovers and processes every recipe by default',async()=>{
 const base=await folder(),counts={};const data={
 '/data/wow/profession/index':{professions:[{id:1,name:'Tailoring'}]},
 '/data/wow/profession/1':{skill_tiers:[{id:2,name:'Classic'}]},
 '/data/wow/profession/1/skill-tier/2':{recipes:[{id:11,name:'A'},{id:12,name:'B'},{id:13,name:'C'}]},
 '/data/wow/recipe/11':{id:11,name:'A'},'/data/wow/recipe/12':{id:12,name:'B'},'/data/wow/recipe/13':{id:13,name:'C'}};
 const opts={config,token:'test',fetcher:response(data,counts),base,delayMs:0,retries:0,sleep:async()=>{}};
 const first=await gatherRecipes(opts);
 assert.equal(first.discoveredRecipes,3);assert.equal(first.recipes.length,3);assert.equal(first.coverage.complete,true);
 const second=await gatherRecipes(opts);
 assert.equal(second.coverage.cached,5);assert.equal(second.coverage.downloaded,1);assert.equal(counts['/data/wow/recipe/11'],1);
 assert.equal(counts['/data/wow/profession/index'],2);
});
test('interrupted recipe download resumes missing entries without redownloading successes',async()=>{
 const base=await folder(),counts={};const data={
 '/data/wow/profession/index':{professions:[{id:1,name:'Tailoring'}]},
 '/data/wow/profession/1':{skill_tiers:[{id:2,name:'Classic'}]},
 '/data/wow/profession/1/skill-tier/2':{recipes:[{id:11,name:'A'},{id:12,name:'B'}]},
 '/data/wow/recipe/11':{id:11,name:'A'}};
 const opts={config,token:'test',base,delayMs:0,retries:0,sleep:async()=>{},fetcher:response(data,counts)};
 const first=await gatherRecipes(opts);
 assert.equal(first.coverage.complete,false);assert.equal(first.coverage.missingDetails,1);
 data['/data/wow/recipe/12']={id:12,name:'B'};
 const second=await gatherRecipes(opts);
 assert.equal(second.coverage.complete,true);assert.equal(counts['/data/wow/recipe/11'],1);assert.equal(counts['/data/wow/recipe/12'],2);
});
test('429 retries and then saves successful results; terminal 404 is not retried',async()=>{
 const base=await folder(),cache=await new SyncCache({filename:path.join(base,'cache.json'),...config}).load();let attempts=0;
 const engine=new ThrottledRequester({cache,delayMs:0,retries:3,sleep:async()=>{},random:()=>0,fetchRequest:async()=>{attempts++;if(attempts<3)throw Object.assign(new Error('HTTP 429'),{retryAfterSeconds:1});return {id:4};}});
 assert.equal((await engine.get('/data/wow/pet/4')).value.id,4);assert.equal(engine.metrics.retries,2);assert.equal(engine.metrics.requests,3);
 assert.equal((await engine.get('/data/wow/pet/4')).cached,true);assert.equal(attempts,3);
 const rejected=new ThrottledRequester({cache,delayMs:0,retries:4,sleep:async()=>{},fetchRequest:async()=>{throw Error('HTTP 404');}});
 await assert.rejects(rejected.get('/data/wow/pet/5'),/404/);assert.equal(rejected.metrics.requests,1);
});
test('cache rejects namespace mismatch',async()=>{
 const base=await folder(),filename=path.join(base,'cache.json');
 const first=await new SyncCache({filename,...config}).load();await first.put('test',{id:1});
 await assert.rejects(new SyncCache({filename,...config,namespace:'static-forever-us'}).load(),/different/);
});
test('pets import reads full index, retains all records and reuses detail cache',async()=>{
 const base=await folder(),counts={};const data={
 '/data/wow/pet/index':{pets:[{id:1,name:'Bird'},{id:2,name:'Cat'}]},
 '/data/wow/pet/1':{id:1,name:'Bird'},'/data/wow/pet/2':{id:2,name:'Cat'},
 '/data/wow/media/pet/1':{assets:[]},'/data/wow/media/pet/2':{assets:[]}};
 const opts={config,token:'test',base,delayMs:0,retries:0,sleep:async()=>{},fetcher:response(data,counts)};
 const first=await gatherPets(opts);assert.equal(first.coverage.discovered,2);assert.equal(first.coverage.complete,true);
 const second=await gatherPets(opts);assert.equal(second.coverage.cached,4);assert.equal(counts['/data/wow/pet/1'],1);
});
test('CLI defaults to unlimited and validates values',()=>{
 assert.equal(options([]).maxRecords,Infinity);
 assert.equal(options(['--max-records','3']).maxRecords,3);
 assert.throws(()=>options(['--delay-ms','-1']));
 assert.throws(()=>options(['--retries','13']));
});
