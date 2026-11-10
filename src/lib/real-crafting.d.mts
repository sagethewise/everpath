import type {LiveRecipe} from '../data/recipes-imported';
export function canPlanReal(recipe: LiveRecipe): boolean;
export function aggregateRealMaterials(plan:{recipeId:number;quantity:number}[], recipes:LiveRecipe[]): {itemId:number;name:string;quantity:number}[];
