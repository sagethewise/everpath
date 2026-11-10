import snapshot from './blizzard-import.json';
export interface BlizzardIndexEntry {id:number;name:string;detailPath:string}
export interface BlizzardSnapshot {status:string;source:string;region:string;namespace:string;locale:string;importedAt:string|null;professions:BlizzardIndexEntry[];pets:BlizzardIndexEntry[];detailChecks:{kind:string;requestedId:number;status:string;name?:string|null;skillTiers?:{id:number;name:string|null}[]}[]}
export const blizzardSnapshot=snapshot as BlizzardSnapshot;
export const hasBlizzardIndex=blizzardSnapshot.status==='api-imported-unverified'&&blizzardSnapshot.professions.length>0;
