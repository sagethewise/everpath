import raw from './acquisition.json';
import {validateAcquisition} from '../lib/acquisition.mjs';
import type {AcquisitionCatalog,AcquisitionRecord} from '../lib/acquisition.mjs';
export const acquisitionCatalog=validateAcquisition(raw) as AcquisitionCatalog;
export function findSources(type:'pet'|'item',id:number):AcquisitionRecord[]{return acquisitionCatalog.records.filter(r=>r.entityType===type&&r.entityId===id)}
