import test from 'node:test';import assert from 'node:assert/strict';
import {validateAcquisition,getAcquisition} from '../src/lib/acquisition.mjs';
const base={schemaVersion:1,gameVersion:'forever',records:[],maps:[]};
test('empty but explicitly unverified location catalog is valid',()=>assert.equal(validateAcquisition(base).records.length,0));
test('unattributed source is rejected',()=>assert.throws(()=>validateAcquisition({...base,records:[{id:'a',entityType:'item',entityId:3,method:'gathering'}]})));
test('bogus coordinates cannot be published',()=>assert.throws(()=>validateAcquisition({...base,records:[{id:'a',entityType:'pet',entityId:3,method:'vendor',sourceTitle:'Report',sourceUrl:'https://example.org',license:'CC-BY',reviewedAt:'2026-11-10',location:{zoneName:'Zone',mapId:'missing',x:25,y:50}}]})));
test('entity locations never leak across item and pet IDs',()=>assert.deepEqual(getAcquisition([{entityType:'item',entityId:2},{entityType:'pet',entityId:2}], 'pet',2),[{entityType:'pet',entityId:2}]));
