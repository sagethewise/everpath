import {professions,recipes,pets} from './demo';
import type {Catalog,Profession,Recipe,Pet} from './types';
export const professionCatalog:Catalog<Profession>={origin:'demo',source:'Illustrative Classic-inspired examples',version:'demo-1',verifiedAt:null,entries:professions};
export const recipeCatalog:Catalog<Recipe>={origin:'demo',source:'Illustrative Classic-inspired examples',version:'demo-1',verifiedAt:null,entries:recipes};
export const petCatalog:Catalog<Pet>={origin:'demo',source:'Illustrative Classic-inspired examples',version:'demo-1',verifiedAt:null,entries:pets};
export const isVerified=(catalog:Catalog<unknown>):boolean=>catalog.origin==='verified'&&Boolean(catalog.verifiedAt);
