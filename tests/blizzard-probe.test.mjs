import test from 'node:test';
import assert from 'node:assert/strict';
import {ENDPOINTS,gameDataUrl,probeAll,probeConfiguration,summarizeResponse,validateConfig} from '../scripts/probe-blizzard.mjs';
const config={region:'eu',namespace:'static-classic1x-eu',locale:'en_GB'};
test('only explicit static namespace and accepted region',()=>{
 assert.deepEqual(validateConfig(config),config);
 assert.throws(()=>validateConfig({...config,namespace:'../../evil'}));
 assert.throws(()=>validateConfig({...config,region:'unknown'}));
 assert.throws(()=>validateConfig({...config,namespace:'static-classic1x-us'}));
});
test('URL builder is pinned to Blizzard and allowlisted endpoints',()=>{
 const url=gameDataUrl(config,ENDPOINTS[0].path);
 assert.equal(url.hostname,'eu.api.blizzard.com');
 assert.equal(url.searchParams.get('namespace'),'static-classic1x-eu');
 assert.throws(()=>gameDataUrl(config,'/profile/wow/private'));
});
test('summarizer extracts structure without copying full game data',()=>{
 const data=summarizeResponse('pets',{pets:[{id:1,name:'Example',other:'x'}],_links:{}});
 assert.equal(data.collections[0].count,1);
 assert.deepEqual(data.collections[0].firstEntryKeys,['id','name','other']);
 assert.equal('pets' in data,false);
});
test('mock endpoints: record partial API failure instead of contaminating demo catalog',async()=>{
 const fetched=await probeAll({config,token:'test',fetcher:async(url)=>url.pathname.includes('/pet/')?{ok:false,status:404}:{ok:true,status:200,json:async()=>({professions:[{id:1}]})}});
 assert.deepEqual(fetched.map(x=>x.status),['response-received','unavailable']);
 assert.equal(fetched[1].httpStatus,404);
});
test('default probe config uses explicitly selected Forever namespace',()=>{
 assert.equal(probeConfiguration({}).namespace,'static-forever-eu');
});
