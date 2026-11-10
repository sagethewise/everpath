import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Pet discover and collection share Blizzard imported index, no demo catalog',()=>{const pets=read('src/views/Pets.tsx');assert.match(pets,/const all=blizzardSnapshot\.pets/);assert.doesNotMatch(pets,/petCatalog|DemoNotice|blizzard'\>/);assert.match(pets,/bpet:/);});
test('Professions and level up source imported recipe records',()=>{const src=read('src/views/Professions.tsx');assert.match(src,/liveRecipeData\.recipes/);assert.doesNotMatch(src,/recipeCatalog|professionCatalog|suggestedRecipes|DemoNotice/);});
test('Horde uses a distinct castle image asset',()=>{assert.match(read('src/factions.css'),/--f-page-image:url\('\/assets\/horde-castle\.png'\)/);assert.ok(readFileSync(new URL('../public/assets/horde-castle.png',import.meta.url)).length>1000);});
