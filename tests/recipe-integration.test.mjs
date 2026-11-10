import test from 'node:test';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {skillTiers,tierRecipes,normalizeRecipeDetail} from '../scripts/recipe-normalize.mjs';
import {parseArgs,gatherRecipes} from '../scripts/import-recipes.mjs';
import {aggregateRealMaterials,canPlanReal} from '../src/lib/real-crafting.mjs';
const config={region:'eu',namespace:'static-forever-eu',locale:'en_GB'};
test('tier traversal reads nested categories without inventing per-recipe skill chances',()=>{
 const tiers=skillTiers({skill_tiers:[{id:30,name:'Classic'}]}, {id:171});
 assert.equal(tiers[0].professionId,171);
 const recipes=tierRecipes({categories:[{name:'Potions',recipes:[{id:100,name:'Healing'}]},{name:'Elixirs',categories:[{name:'Power',recipes:[{id:101,name:'Power Potion'}]}]}]},tiers[0]);
 assert.deepEqual(recipes.map(r=>r.id),[100,101]);
 assert.equal('skillRequirement' in recipes[0],false);
});
test('missing and ambiguous reagents cannot enter crafting plan',()=>{
 const record={id:100,name:'Potion',professionId:171,tierId:30,tierName:'Classic'};
 const missing=normalizeRecipeDetail({id:100,name:'Potion'},record);
 const incomplete=normalizeRecipeDetail({id:100,reagents:[{reagent:{id:55,name:'Flower'},quantity:2},{reagent:{id:77},quantity:1}]},record);
 assert.equal(canPlanReal(missing),false);assert.equal(canPlanReal(incomplete),false);
 assert.deepEqual(aggregateRealMaterials([{recipeId:100,quantity:3}],[incomplete]),[]);
});
test('verified quantities aggregate by item IDs with no name collision',()=>{
 const record={id:100,name:'Potion'};
 const r1=normalizeRecipeDetail({id:100,reagents:[{reagent:{id:5,name:'Herb'},quantity:2},{reagent:{id:6,name:'Vial'},quantity:1}]},record);
 const r2=normalizeRecipeDetail({id:101,reagents:[{reagent:{id:5,name:'Herb'},quantity:4}]},{id:101,name:'Potion 2'});
 const aggregate=aggregateRealMaterials([{recipeId:100,quantity:3},{recipeId:101,quantity:2}],[r1,r2]);
 assert.equal(aggregate.find(x=>x.itemId===5).quantity,14);
 assert.equal(aggregate.find(x=>x.itemId===6).quantity,3);
 assert.equal(canPlanReal(r1),true);
});
test('allowlisted endpoints permit skill tiers and recipes, but not arbitrary URLs',async()=>{
 const {endpointUrl}=await import('../scripts/import-blizzard.mjs');
 assert.match(endpointUrl(config,'/data/wow/profession/171/skill-tier/30'),/skill-tier\/30/);
 assert.match(endpointUrl(config,'/data/wow/recipe/100'),/recipe\/100/);
 assert.throws(()=>endpointUrl(config,'/profile/wow/character/123'));
 assert.throws(()=>endpointUrl(config,'/data/wow/item/55'));
});
test('staged import discovers recipes, fetches detail within limit and reports errors',async()=>{
 const map={
  '/data/wow/profession/index':{professions:[{id:171,name:'Alchemy'}]},
  '/data/wow/profession/171':{id:171,skill_tiers:[{id:30,name:'Forever Alchemy'}]},
  '/data/wow/profession/171/skill-tier/30':{categories:[{name:'Potions',recipes:[{id:100,name:'Healing'},{id:101,name:'Mana'}]}]},
  '/data/wow/recipe/100':{id:100,reagents:[{reagent:{id:5,name:'Herb'},quantity:2}]}
 };
 const fetcher=async url=>{const path=new URL(url).pathname;return map[path]?{ok:true,json:async()=>map[path]}:{ok:false,status:404};};
 const base=await mkdtemp(path.join(tmpdir(),'everpath-test-'));
 const snapshot=await gatherRecipes({config,token:'FAKE_TOKEN',fetcher,maxRecipes:2,base,delayMs:0,retries:0,sleep:async()=>{}});
 assert.equal(snapshot.recipes.length,2);assert.equal(snapshot.coverage.withMaterials,1);
 assert.equal(snapshot.recipes[1].status,'unavailable');assert.equal(snapshot.errors.length,1);
 assert.equal(JSON.stringify(snapshot).includes('FAKE_TOKEN'),false);
});
test('CLI imports all by default and supports test-only caps',()=>{
 assert.equal(parseArgs([]).maxRecords,Infinity);
 assert.equal(parseArgs(['--max-recipes','45']).maxRecords,45);
 assert.throws(()=>parseArgs(['--max-recipes','-1']));
 assert.throws(()=>parseArgs(['--unknown','10']));
});
