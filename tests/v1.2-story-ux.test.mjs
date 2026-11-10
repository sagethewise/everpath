import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('story page uses official narrative with source references',()=>{
 const story=read('src/views/Story.tsx');
 assert.match(story,/Forsaken Kingdom/);
 assert.match(story,/before Molten Core/);
 assert.match(story,/news\.blizzard\.com/);
 assert.match(story,/Official sources/);
});
test('home has story teaser and direct story navigation',()=>{
 assert.match(read('src/views/Home.tsx'),/navigate\('story'\)/);
 assert.match(read('src/components/Layout.tsx'),/\['story','Our Story'/);
 assert.match(read('src/main.tsx'),/page==='story'/);
});
test('profession guided planning keeps skill claims qualified',()=>{
 const page=read('src/views/Professions.tsx');
 assert.match(page,/Target skill/);
 assert.match(page,/crafting does not guarantee a skill-up/);
 assert.match(page,/canPlanReal\(r\)/);
 assert.match(page,/Add craft/);
});
test('pet collection has how-to and ownership filters',()=>{
 const pets=read('src/views/Pets.tsx');
 assert.match(pets,/How to use Companion Pets/);
 assert.match(pets,/ownershipFilter==='missing'/);
 assert.match(pets,/ownershipFilter==='owned'/);
 assert.match(pets,/validateCollection/);
});
