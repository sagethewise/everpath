export type AcquisitionMethod='gathering'|'vendor'|'drop'|'crafting'|'quest'|'reputation'|'fishing'|'unknown';
export interface LocationInfo {zoneName:string;mapId?:string;x?:number;y?:number;note?:string}
export type EvidenceLevel='forever-verified'|'community-report'|'classic-reference';
export interface AcquisitionRecord {evidenceLevel?:EvidenceLevel;id:string;entityType:'item'|'pet';entityId:number;method:AcquisitionMethod;sourceTitle:string;sourceUrl:string;license:string;reviewedAt:string;description?:string;location?:LocationInfo}
export interface GameMap {id:string;zoneName:string;imagePath:string;width:number;height:number}
export interface AcquisitionCatalog {schemaVersion:number;gameVersion:'forever';updatedAt:string|null;records:AcquisitionRecord[];maps:GameMap[]}
export declare const ACQUISITION_TYPES:readonly AcquisitionMethod[];
export declare function validateAcquisition(input:unknown):AcquisitionCatalog;
export declare function getAcquisition(records:AcquisitionRecord[],entityType:'item'|'pet',entityId:number):AcquisitionRecord[];
export declare function byMethod(records:AcquisitionRecord[]):Record<string,number>;
