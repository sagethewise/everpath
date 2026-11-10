export const EVIDENCE_LEVELS = Object.freeze(['forever-verified','community-report','classic-reference']);
export const ACQUISITION_TYPES = Object.freeze(['gathering','vendor','drop','crafting','quest','reputation','fishing','unknown']);
const safe=(s)=>typeof s==='string'&&s.trim().length>0;
/** All published location records must carry reviewable evidence; no guessed pins. */
export function validateAcquisition(input){
  if(!input || input.schemaVersion!==1 || input.gameVersion!=='forever' || !Array.isArray(input.records) || !Array.isArray(input.maps)) throw Error('Invalid Forever acquisition catalog');
  const ids=new Set();const mapIds=new Set();
  for(const map of input.maps){
    if(!safe(map.id)||mapIds.has(map.id)||!safe(map.zoneName)||!safe(map.imagePath)||!map.imagePath.startsWith('/assets/maps/')||!Number.isFinite(map.width)||!Number.isFinite(map.height)||map.width<=0||map.height<=0)throw Error('Invalid map metadata');
    mapIds.add(map.id);
  }
  for(const r of input.records){
    if(!safe(r.id)||ids.has(r.id)||!['item','pet'].includes(r.entityType)||!Number.isSafeInteger(r.entityId)||r.entityId<=0||!ACQUISITION_TYPES.includes(r.method)||!safe(r.sourceTitle)||!safe(r.sourceUrl)||!/^https:\/\//.test(r.sourceUrl)||!safe(r.license)||!safe(r.reviewedAt)||!/^\d{4}-\d{2}-\d{2}$/.test(r.reviewedAt))throw Error('Invalid acquisition record');
    if(r.evidenceLevel!=null&&!EVIDENCE_LEVELS.includes(r.evidenceLevel))throw Error('Invalid source evidence level');
    if(r.evidenceLevel==='classic-reference'&&r.location?.x!=null)throw Error('Classic reference cannot publish map pins as Forever locations');
    ids.add(r.id);
    if(r.location!=null){
      const l=r.location;
      if(!safe(l.zoneName))throw Error('Zone name required');
      if(l.x!=null||l.y!=null){
        if(!safe(l.mapId)||!mapIds.has(l.mapId)||!Number.isFinite(l.x)||!Number.isFinite(l.y)||l.x<0||l.x>100||l.y<0||l.y>100)throw Error('Invalid or unreferenced map coordinate');
      }
    }
  }
  return input;
}
export function getAcquisition(records,entityType,entityId){return records.filter(r=>r.entityType===entityType&&r.entityId===entityId)}
export function byMethod(records){return records.reduce((acc,r)=>(acc[r.method]=(acc[r.method]??0)+1,acc),{})}
