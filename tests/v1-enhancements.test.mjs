import test from 'node:test';import assert from 'node:assert/strict';
import {gatherRecipes} from '../scripts/import-recipes.mjs';
import {normalizePet,resolvePetMedia} from '../scripts/pet-normalize.mjs';
import {gatherPets} from '../scripts/import-pets.mjs';
const config={region:'eu',namespace:'static-forever-eu',locale:'en_GB'};
test('round robin includes more than the first profession within recipe cap',async()=>{
 const payload={ '/data/wow/profession/index':{professions:[{id:1,name:'Tailoring'},{id:2,name:'Alchemy'}]},'/data/wow/profession/1':{skill_tiers:[{id:11,name:'T1'}]},'/data/wow/profession/2':{skill_tiers:[{id:22,name:'T2'}]},'/data/wow/profession/1/skill-tier/11':{recipes:[{id:101,name:'A'},{id:102,name:'B'}]},'/data/wow/profession/2/skill-tier/22':{recipes:[{id:201,name:'C'},{id:202,name:'D'}]}};
 for(const id of [101,102,201,202])payload[`/data/wow/recipe/${id}`]={id,name:`R${id}`};
 const fetcher=async url=>({ok:Boolean(payload[new URL(url).pathname]),status:404,json:async()=>payload[new URL(url).pathname]});
 const data=await gatherRecipes({config,token:'TEST',fetcher,maxRecipes:2,sleep:async()=>{}});
 assert.deepEqual(data.recipes.map(r=>r.professionId),[1,2]);assert.equal(data.selectionStrategy,'round-robin-by-profession');
});
test('pet media accepts https assets only and source fields are not invented',()=>{
 assert.equal(resolvePetMedia({assets:[{value:'javascript:bad'},{value:'https://images.test/pet.jpg'}]}),'https://images.test/pet.jpg');
 assert.equal(normalizePet({id:1,name:'Pet'},null,null).source,null);
});
test('pet detail import preserves source and media',async()=>{
 const payload={'/data/wow/pet/index':{pets:[{id:1,name:'Little One'}]},'/data/wow/pet/1':{id:1,name:'Little One',source:{name:'Vendor'},zone:{name:'Durotar'}},'/data/wow/media/pet/1':{assets:[{key:'icon',value:'https://cdn.test/1.jpg'}]}};
 const fetcher=async url=>({ok:Boolean(payload[new URL(url).pathname]),status:404,json:async()=>payload[new URL(url).pathname]});
 const data=await gatherPets({config,token:'TEST',fetcher,sleep:async()=>{},delayMs:0});
 assert.equal(data.pets[0].source,'Vendor');assert.equal(data.pets[0].zone,'Durotar');assert.equal(data.pets[0].imageUrl,'https://cdn.test/1.jpg');
});

test('pet media endpoint is allowlisted but arbitrary external URLs are not',async()=>{
 const {endpointUrl}=await import('../scripts/import-blizzard.mjs');
 assert.match(endpointUrl(config,'/data/wow/media/pet/123'),/media\/pet\/123/);
 assert.throws(()=>endpointUrl(config,'https://example.com/steal'));
});
