import test from 'node:test';import assert from 'node:assert/strict';
import {validateAcquisition} from '../src/lib/acquisition.mjs';
const record={id:'foreverdb-one',entityType:'item',entityId:123,method:'gathering',sourceTitle:'Reviewed source',sourceUrl:'https://foreverdb.net',license:'attribution required / approved API key',reviewedAt:'2026-11-10',evidenceLevel:'classic-reference',location:{zoneName:'Example zone'}};
const catalog=(r)=>({schemaVersion:1,gameVersion:'forever',records:[r],maps:[]});
test('zone-only Classic reference may be displayed with warning',()=>assert.equal(validateAcquisition(catalog(record)).records[0].evidenceLevel,'classic-reference'));
test('Classic reference cannot quietly become a precise Forever map pin',()=>assert.throws(()=>validateAcquisition({...catalog({...record,location:{zoneName:'Example zone',mapId:'m',x:50,y:50}}),maps:[{id:'m',zoneName:'Example zone',imagePath:'/assets/maps/verified.png',width:500,height:500}]}),/Classic reference/));
test('unsupported evidence labels rejected',()=>assert.throws(()=>validateAcquisition(catalog({...record,evidenceLevel:'guaranteed'}))));
