/** Source-aware normalization; never fabricates pet acquisition or coordinates. */
const text=x=>typeof x==='string'?x.trim().slice(0,500):'';
export function resolvePetMedia(body){
 const assets=Array.isArray(body?.assets)?body.assets:[];
 for(const asset of assets){
  const u=asset?.value;
  if(typeof u==='string' && /^https:\/\/[^\s]+$/i.test(u))return u;
 }
 return null;
}
export function normalizePet(index,detail,mediaUrl){
 const valid=detail && (!Number.isInteger(detail.id)||detail.id===index.id);
 const source=valid?(text(detail.source?.name)||text(detail.source)||text(detail.source_description)):'';
 const zone=valid?(text(detail.zone?.name)||text(detail.location?.name)):'';
 return {id:index.id,name:text(valid&&detail.name)||index.name,imageUrl:mediaUrl,source:source||null,zone:zone||null,description:valid?(text(detail.description)||null):null,verifiedDetail:Boolean(valid),provenance:'Blizzard Game Data API',companionEligibility:'unverified'};
}
