/** Normalize Blizzard indices safely. Pure functions used by tests and importer. */
const isObject=(x)=>Boolean(x)&&typeof x==='object'&&!Array.isArray(x);
const safeString=(v)=>typeof v==='string'?v.trim():'';
export function normalizeEntries(body,key){
  if(!isObject(body)||!Array.isArray(body[key]))throw Error(`Invalid Blizzard ${key} index`);
  const seen=new Set();
  return body[key].map(entry=>{
    if(!isObject(entry)||!Number.isSafeInteger(entry.id)||entry.id<=0||!safeString(entry.name))return null;
    if(seen.has(entry.id))return null;
    seen.add(entry.id);
    return {id:entry.id,name:safeString(entry.name),detailPath:`/data/wow/${key==='pets'?'pet':'profession'}/${entry.id}`};
  }).filter(Boolean);
}
export function extractDetailSummary(body,kind){
  if(!isObject(body))return {status:'invalid-body'};
  const id=Number.isInteger(body.id)?body.id:null;
  if(kind==='profession'){
    const tiers=Array.isArray(body.skill_tiers)?body.skill_tiers:[];
    return {status:'received',id,name:safeString(body.name)||null,skillTiers:tiers.map(t=>({id:Number.isInteger(t?.id)?t.id:null,name:safeString(t?.name)||null})).filter(t=>t.id)};
  }
  return {status:'received',id,name:safeString(body.name)||null,fields:Object.keys(body).filter(k=>!k.startsWith('_')).slice(0,40),source:typeof body.source==='object'?'structured':(typeof body.source==='string'?'text':'not-supplied')};
}
export function normalizeSnapshot({professions,pets,region,namespace,locale,importedAt,detailChecks=[]}){
  if(!namespace.endsWith(`-${region}`))throw Error('Region/namespace mismatch');
  return {status:'api-imported-unverified',source:'Blizzard Game Data API',region,namespace,locale,importedAt,validation:'Game version, companion classification, acquisition methods and recipe materials require review',professions:normalizeEntries(professions,'professions'),pets:normalizeEntries(pets,'pets'),detailChecks};
}
