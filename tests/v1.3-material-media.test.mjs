import test from 'node:test';import assert from 'node:assert/strict';
import {materialIds,iconAsset} from '../scripts/import-material-media.mjs';
test('each reagent icon requested only once',()=>assert.deepEqual(materialIds([{reagents:[{itemId:4},{itemId:2}]},{reagents:[{itemId:4},{itemId:7}]}]),[2,4,7]));
test('strict HTTPS for media',()=>{assert.equal(iconAsset({assets:[{key:'icon',value:'https://example.com/a.jpg'}]}),'https://example.com/a.jpg');assert.equal(iconAsset({assets:[{key:'icon',value:'javascript:evil'}]}),null)});
