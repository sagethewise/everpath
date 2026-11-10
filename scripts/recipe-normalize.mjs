/** Convert explicit Blizzard data to provenance-labelled records. No inferred skill chances or materials. */
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const validId = n => Number.isSafeInteger(n) && n > 0;
const title = x => typeof x === 'string' ? x.trim().slice(0,200) : '';
export function skillTiers(body, profession) {
  if (!object(body)) return [];
  return (Array.isArray(body.skill_tiers) ? body.skill_tiers : [])
    .filter(t => validId(t?.id))
    .map(t => ({ id:t.id, professionId:profession.id, name:title(t.name) || `Tier #${t.id}` }));
}
export function tierRecipes(body, tier) {
  if (!object(body)) return [];
  const collected = new Map();
  function walk(node, category='') {
    if (!object(node)) return;
    for (const r of Array.isArray(node.recipes) ? node.recipes : []) {
      if (validId(r?.id) && !collected.has(r.id)) collected.set(r.id, {id:r.id, name:title(r.name)||`Recipe #${r.id}`, professionId:tier.professionId, tierId:tier.id, tierName:tier.name, category});
    }
    for (const group of Array.isArray(node.categories) ? node.categories : []) walk(group, title(group.name)||category);
  }
  walk(body);
  return [...collected.values()];
}
/** A recipe with missing or ambiguous reagent data is NOT craftable in our UI. */
export function normalizeRecipeDetail(raw, indexRecord) {
  const obj=object(raw)?raw:{};
  const hasArray=Array.isArray(obj.reagents);
  const items=[];let complete=hasArray && obj.reagents.length > 0;
  if (hasArray) for (const row of obj.reagents) {
    const item=row?.reagent ?? row?.item;
    const id=item?.id, name=title(item?.name), quantity=row?.quantity;
    if (!validId(id) || !name || !Number.isSafeInteger(quantity) || quantity < 1) {complete=false;continue;}
    items.push({itemId:id,name,quantity});
  }
  if (hasArray && items.length!==obj.reagents.length) complete=false;
  const idMismatch = validId(obj.id) && obj.id !== indexRecord.id;
  return {
    ...indexRecord,
    name: title(obj.name) || indexRecord.name,
    status: idMismatch?'id-mismatch':!object(raw)?'unavailable':'received',
    materialsStatus: complete && !idMismatch?'complete':'missing-or-incomplete',
    reagents: complete&&!idMismatch ? items:[],
    // Real per-recipe skill thresholds cannot be inferred from tier minimum/maximum.
    skillRequirement: Number.isSafeInteger(obj.required_skill_level) ? obj.required_skill_level : null,
    craftedItemId: validId(obj.crafted_item?.id)?obj.crafted_item.id:null
  };
}
export function summarizeCoverage(snapshot) {
  const recipes=snapshot.recipes||[];
  return {professions:snapshot.professions?.length||0,tiers:snapshot.tiers?.length||0,recipes:recipes.length,withMaterials:recipes.filter(r=>r.materialsStatus==='complete').length,missingMaterials:recipes.filter(r=>r.materialsStatus!=='complete').length,errors:snapshot.errors?.length||0,limited:Boolean(snapshot.limited)};
}
