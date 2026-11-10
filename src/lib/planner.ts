import type {Recipe,Material} from '../data/types';
export interface PlanItem {recipeId:string;quantity:number}
export const clampSkill=(n:number,max=300)=>Math.max(1,Math.min(max,Number.isFinite(n)?Math.floor(n):1));
export function calculateMaterials(plan:PlanItem[],recipes:Recipe[]):Material[]{
  const byId=new Map(recipes.map(r=>[r.id,r]));const totals=new Map<string,number>();
  for(const item of plan){const recipe=byId.get(item.recipeId);if(!recipe)continue;
    const quantity=Math.max(0,Math.min(9999,Math.floor(item.quantity)||0));
    for(const [name,amount] of recipe.materials){totals.set(name,(totals.get(name)||0)+amount*quantity)}
  }
  return [...totals].sort((a,b)=>a[0].localeCompare(b[0]));
}
export function suggestedRecipes(profession:string,skill:number,recipes:Recipe[]):Recipe[]{
  return recipes.filter(r=>r.profession===profession&&r.skillTo>skill).sort((a,b)=>a.level-b.level);
}
export const shoppingText=(materials:Material[])=>'Everpath · Crafting materials (demo; not game-verified)\n'+materials.map(([name,n])=>`${name} ×${n}`).join('\n');
