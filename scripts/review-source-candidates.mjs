/** Publish ONLY explicitly approved and individually referenced candidate facts.
 * Input: imports/reviewed-sources.json: { records: [{...acquisitionRecord, approved:true}] }
 * No automatic mapping from third-party API schemas; that requires review.
 */
import {readFile,writeFile,rename} from 'node:fs/promises';
import {validateAcquisition} from '../src/lib/acquisition.mjs';
const src=process.argv[2]||'imports/reviewed-sources.json';
const dest='src/data/acquisition.json';
const draft=JSON.parse(await readFile(src,'utf8'));
if(!Array.isArray(draft.records))throw Error('Reviewed file must contain records[]');
if(draft.records.some(x=>x.approved!==true))throw Error('Every proposed record requires approved: true after source/rights review');
if(draft.records.some(x=>!x.evidenceLevel))throw Error('Every record requires a verified evidenceLevel');
const old=validateAcquisition(JSON.parse(await readFile(dest,'utf8')));
const merged=new Map(old.records.map(x=>[x.id,x]));
for(const entry of draft.records){const {approved,...r}=entry;merged.set(r.id,r);}
const next=validateAcquisition({...old,updatedAt:new Date().toISOString().slice(0,10),records:[...merged.values()]});
const tmp=dest+'.tmp';await writeFile(tmp,JSON.stringify(next,null,2)+'\n');await rename(tmp,dest);
console.log(`Published ${draft.records.length} explicitly approved sources (${next.records.length} total). No unapproved coordinate was imported.`);
