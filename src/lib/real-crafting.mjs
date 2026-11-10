/** Distinguishes reagent identity by Blizzard item id, not locale-sensitive name. */
export function aggregateRealMaterials(plan,recipes){
 const byId=new Map(recipes.map(r=>[r.id,r]));const totals=new Map();
 for(const entry of plan){
  const recipe=byId.get(entry.recipeId);
  if(!recipe || recipe.status!=='received' || recipe.materialsStatus!=='complete' || !Number.isSafeInteger(entry.quantity) || entry.quantity<1)continue;
  for(const material of recipe.reagents){
   if(!Number.isSafeInteger(material.itemId)||!Number.isSafeInteger(material.quantity)||material.quantity<1)continue;
   const value=totals.get(material.itemId)||{itemId:material.itemId,name:material.name,quantity:0};
   value.quantity+=material.quantity*entry.quantity;totals.set(material.itemId,value);
  }
 }
 return [...totals.values()].sort((a,b)=>a.name.localeCompare(b.name));
}
export function canPlanReal(recipe){return recipe?.status==='received'&&recipe?.materialsStatus==='complete'&&Array.isArray(recipe?.reagents)&&recipe.reagents.length>0}
