import {readFile} from 'node:fs/promises';
import {validateAcquisition,byMethod} from '../src/lib/acquisition.mjs';
const path=process.argv[2]||'src/data/acquisition.json';
const data=validateAcquisition(JSON.parse(await readFile(path,'utf8')));
console.log(JSON.stringify({validated:true,records:data.records.length,maps:data.maps.length,methods:byMethod(data.records)},null,2));
