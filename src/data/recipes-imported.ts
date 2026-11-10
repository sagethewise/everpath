import snapshot from './blizzard-recipes.json';
export interface LiveReagent {itemId:number;name:string;quantity:number}
export interface LiveRecipe {id:number;name:string;professionId:number;tierId:number;tierName:string;category:string;status:string;materialsStatus:string;reagents:LiveReagent[];skillRequirement:number|null;craftedItemId:number|null}
export interface LiveTier {id:number;professionId:number;name:string;minimumSkill:number|null;maximumSkill:number|null}
export interface RecipeImport {status:string;namespace:string;importedAt:string|null;limited:boolean;discoveredRecipes:number;professions:{id:number;name:string}[];tiers:LiveTier[];recipes:LiveRecipe[];coverage:{recipes:number;withMaterials:number;errors:number}}
export const liveRecipeData=snapshot as RecipeImport;
export const liveRecipeReady=liveRecipeData.status==='api-imported-unverified' && liveRecipeData.recipes.length>0;
