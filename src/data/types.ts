export type Material = [name:string, quantity:number];
export interface Profession {id:string;name:string;icon:string;tone:string;desc:string;max:number}
export interface Recipe {id:string;profession:string;name:string;level:number;skillTo:number;crafts:number;materials:Material[];icon:string}
export interface Pet {id:string;name:string;kind:string;source:string;location:string;rarity:string;icon:string;tone:string}
export type CatalogOrigin='demo'|'verified';
export interface Catalog<T>{origin:CatalogOrigin;source:string;version:string;verifiedAt:string|null;entries:T[]}
