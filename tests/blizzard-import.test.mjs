import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeEntries,normalizeSnapshot,extractDetailSummary} from '../scripts/blizzard-normalize.mjs';
import {collect,endpointUrl,getToken} from '../scripts/import-blizzard.mjs';
const config={region:'eu',namespace:'static-forever-eu',locale:'en_GB'};
const pindex={professions:[{id:171,name:'Alchemy',key:{href:'https://example.invalid/?access_token=DO_NOT_COPY'}},{id:171,name:'Duplicate'},{id:null,name:'no id'}]};
const pets={pets:[{id:101,name:'Test pet'},{id:102,name:'Second pet'}]};
test('normalization retains only stable IDs and names, not remote URLs or credentials',()=>{
 assert.deepEqual(normalizeEntries(pindex,'professions'),[{id:171,name:'Alchemy',detailPath:'/data/wow/profession/171'}]);
 const snapshot=normalizeSnapshot({professions:pindex,pets,...config,importedAt:'2026-11-10T00:00:00Z'});
 assert.equal(snapshot.status,'api-imported-unverified');
 assert.equal(JSON.stringify(snapshot).includes('DO_NOT_COPY'),false);
 assert.equal(snapshot.pets.length,2);
});
test('detail parsing does not fabricate reagent or pet source information',()=>{
 const profession=extractDetailSummary({id:171,name:'Alchemy',skill_tiers:[{id:100,name:'Classic' }]},'profession');
 assert.deepEqual(profession.skillTiers,[{id:100,name:'Classic'}]);
 const pet=extractDetailSummary({id:101,name:'Test pet',foo:'x'},'pet');
 assert.equal(pet.source,'not-supplied');
 assert.equal('location' in pet,false);
});
test('endpoint URL allowlist and namespace pinned to eu',()=>{
 assert.match(endpointUrl(config,'/data/wow/pet/101'),/static-forever-eu/);
 assert.throws(()=>endpointUrl(config,'/profile/wow/character/index'));
 assert.throws(()=>endpointUrl(config,'/data/wow/pet/../profession/index'));
});
test('mock import queries indexes, samples details, and keeps HTTP failure isolated',async()=>{
 const calls=[];
 const fetcher=async(url)=>{
  const path=new URL(String(url)).pathname;calls.push(path);
  const map={ '/data/wow/profession/index':pindex,'/data/wow/pet/index':pets,'/data/wow/profession/171':{id:171,name:'Alchemy',skill_tiers:[{id:1,name:'Classic'}]}};
  return map[path]?{ok:true,json:async()=>map[path]}:{ok:false,status:404};
 };
 const snapshot=await collect({config,token:'TEST_TOKEN',fetcher,detailLimit:2});
 assert.equal(snapshot.professions.length,1);assert.equal(snapshot.pets.length,2);
 assert.equal(snapshot.detailChecks[0].status,'received');
 assert.equal(snapshot.detailChecks[1].status,'unavailable');
 assert.equal(calls.length,5);
});
test('auth rejects missing secret before HTTP request',async()=>{
 await assert.rejects(()=>getToken({id:'x',secret:'',fetcher:()=>{throw Error('network was called')}}),/Missing Blizzard credentials/);
});
