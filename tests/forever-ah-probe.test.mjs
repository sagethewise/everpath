import test from 'node:test';
import assert from 'node:assert/strict';
import {configFrom,endpoint,identifiers,summarize,inspect} from '../scripts/probe-forever-ah.mjs';

test('Forever AH probe uses a dynamic Forever namespace independently of static recipe imports',()=>{
 const config=configFrom({BLIZZARD_REGION:'eu',BLIZZARD_NAMESPACE:'static-forever-eu'});
 assert.equal(config.namespace,'dynamic-forever-eu');
 assert.match(endpoint(config,'/data/wow/ruleset/1/auctions/'),/dynamic-forever-eu/);
 assert.throws(()=>endpoint(config,'/data/wow/item/index'),/allowlisted/);
 assert.throws(()=>configFrom({BLIZZARD_REGION:'invalid'}),/region/);
});
test('summaries never retain auction listings',()=>{
 const data={auctions:[{id:1,item:{id:333},quantity:22,unit_price:100}],name:'Example'};
 const result=summarize(data);
 assert.equal(result.collections[0].count,1);
 assert.equal(JSON.stringify(result).includes('333'),false);
 assert.deepEqual(identifiers({rulesets:[{id:1},{id:2}]},'rulesets'),[1,2]);
});
test('index probe stays bounded and does not guess a house ID',async()=>{
 const requests=[];
 const fetcher=async url=>{
  const pathname=new URL(url).pathname;requests.push(pathname);
  const body=pathname.endsWith('/index')?{rulesets:[{id:1}]}:{auctions:[{id:113,name:'Alliance'}]};
  return {ok:true,status:200,json:async()=>body};
 };
 const report=await inspect({config:configFrom({BLIZZARD_REGION:'eu'}),token:'fake-test-token',fetcher});
 assert.deepEqual(requests,['/data/wow/ruleset/index','/data/wow/ruleset/1/auctions/']);
 assert.deepEqual(report.auctionHouseIds,[113]);
});
test('explicit house probe only examines listed house IDs',async()=>{
 const requests=[];
 const fetcher=async url=>{
  const pathname=new URL(url).pathname;requests.push(pathname);
  const body=pathname.endsWith('/index')?{rulesets:[{id:1}]}:{auctions:[{id:113}]};
  return {ok:true,status:200,json:async()=>body};
 };
 const report=await inspect({config:configFrom({BLIZZARD_REGION:'eu'}),token:'fake-test-token',fetcher,houseId:999});
 assert.equal(requests.length,2);
 assert.match(report.houseProbeSkipped,/not in API index/);
});
