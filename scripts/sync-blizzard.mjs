#!/usr/bin/env node
/** Safe, server-side-only diagnostic importer. Does not overwrite the shipped demo catalog. */
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const clientId=process.env.BLIZZARD_CLIENT_ID;
const secret=process.env.BLIZZARD_CLIENT_SECRET;
const region=process.env.BLIZZARD_REGION||'eu';
const namespace=process.env.BLIZZARD_NAMESPACE||`static-classic1x-${region}`;
const apiPath=process.env.BLIZZARD_PATH||'/data/wow/profession/index';
if(!clientId||!secret){console.error('Missing Blizzard credentials. Set BLIZZARD_CLIENT_ID and BLIZZARD_CLIENT_SECRET outside the frontend.');process.exitCode=2}
else if(!['eu','us','kr','tw'].includes(region)|| !/^static-[a-z0-9-]+$/.test(namespace)||!/^\/data\/wow\/[a-z0-9/\-]+$/.test(apiPath)){console.error('Invalid region, namespace or API path.');process.exitCode=2}
else{
  try{
    const body=new URLSearchParams({grant_type:'client_credentials'});
    const auth=Buffer.from(`${clientId}:${secret}`).toString('base64');
    const tokenResponse=await fetch('https://oauth.battle.net/token',{method:'POST',headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/x-www-form-urlencoded'},body,signal:AbortSignal.timeout(15000)});
    if(!tokenResponse.ok)throw new Error(`OAuth failed (${tokenResponse.status})`);
    const token=await tokenResponse.json();
    if(typeof token.access_token!=='string')throw new Error('OAuth access token missing');
    const url=new URL(`https://${region}.api.blizzard.com${apiPath}`);url.searchParams.set('namespace',namespace);url.searchParams.set('locale','en_GB');
    const response=await fetch(url,{headers:{Authorization:`Bearer ${token.access_token}`},signal:AbortSignal.timeout(20000)});
    if(!response.ok)throw new Error(`Game Data HTTP ${response.status}. Namespace or endpoint may not support this game version.`);
    const data=await response.json();
    if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Unexpected data shape');
    const target=path.resolve('imports');await mkdir(target,{recursive:true});
    const file=path.join(target,'blizzard-diagnostic.json');
    await writeFile(file,JSON.stringify({source:'Blizzard Game Data API',region,namespace,apiPath,fetchedAt:new Date().toISOString(),validationStatus:'UNVERIFIED_FOR_FOREVER',data},null,2));
    console.log(`Diagnostic response saved: ${file}`);console.log('NOT imported into the application catalog: manual game-version verification is required.');
  }catch(e){console.error(`Blizzard import failed: ${e instanceof Error?e.message:'Unknown error'}`);process.exitCode=1}
}
