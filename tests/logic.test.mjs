import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from 'node:fs';
const types=readFileSync(new URL('../src/data/types.ts',import.meta.url),'utf8');
const script=readFileSync(new URL('../scripts/sync-blizzard.mjs',import.meta.url),'utf8');
test('catalog defines explicit source and verification provenance',()=>{assert.match(types,/origin:CatalogOrigin/);assert.match(types,/verifiedAt:string\|null/)});
test('Blizzard credentials stay out of client and are server-only',()=>{assert.match(script,/process\.env\.BLIZZARD_CLIENT_SECRET/);assert.doesNotMatch(script,/VITE_BLIZZARD_CLIENT_SECRET/);assert.match(script,/UNVERIFIED_FOR_FOREVER/)});
test('import does not overwrite active application data',()=>{assert.match(script,/blizzard-diagnostic\.json/);assert.doesNotMatch(script,/src\/data\/demo/)});
test('no remote API calls in frontend',()=>{for(const p of ['main.tsx','views/Home.tsx','views/Professions.tsx','views/Pets.tsx']){const text=readFileSync(new URL('../src/'+p,import.meta.url),'utf8');assert.doesNotMatch(text,/api\.blizzard\.com|client_secret/i)}});
