import {useEffect,useRef,useState} from 'react';
import {MapPin, ExternalLink, X, Compass, Info, Layers} from 'lucide-react';
import {acquisitionCatalog,findSources} from '../data/acquisition';
import type {AcquisitionRecord} from '../lib/acquisition.mjs';
import 'leaflet/dist/leaflet.css';
import type {LatLngBoundsExpression,LatLngExpression} from 'leaflet';

function MapPanel({records}:{records:AcquisitionRecord[]}) {
 const container=useRef<HTMLDivElement>(null);
 const maps=acquisitionCatalog.maps;
 const candidate=records.find(r=>r.location?.mapId&&maps.some(m=>m.id===r.location?.mapId));
 const selected=maps.find(m=>m.id===candidate?.location?.mapId);
 const [ready,setReady]=useState(false);
 useEffect(()=>{
  setReady(false);
  if(!selected||!container.current)return;
  let disposed=false;
  let cleanup:undefined|(()=>void);
  void import('leaflet').then(L=>{
    if(disposed||!container.current)return;
    const bounds:LatLngBoundsExpression=[[0,0],[selected.height,selected.width]];
    const map=L.map(container.current,{crs:L.CRS.Simple,minZoom:-5,maxZoom:2,zoomControl:true,attributionControl:false});
    L.imageOverlay(selected.imagePath,bounds,{alt:`${selected.zoneName} zone map`}).addTo(map);
    map.fitBounds(bounds);
    for(const r of records){
      const loc=r.location;
      if(loc?.mapId!==selected.id||loc.x===undefined||loc.y===undefined)continue;
      const point:LatLngExpression=[selected.height*(1-loc.y/100),selected.width*loc.x/100];
      const label=document.createElement('span');label.textContent=`${r.method}: ${r.description||loc.note||selected.zoneName}`;
      L.circleMarker(point,{radius:7,color:'#f6cf8b',fillColor:'#18abc6',fillOpacity:.9,weight:2}).bindPopup(label).addTo(map);
    }
    setReady(true);cleanup=()=>map.remove();
  }).catch(()=>setReady(false));
  return()=>{disposed=true;cleanup?.()};
 },[selected,records]);
 if(!selected)return <div className="ep-map-unavailable"><Compass size={36}/><strong>Interactive map awaiting verified locations</strong><p>WoW Forever coordinates and legally usable map artwork have not been approved yet. No estimated pins are shown.</p><small>Source records can still provide confirmed zones and external references.</small></div>;
 return <div className="ep-map-stage"><div ref={container} className="ep-leaflet-map" aria-label={`${selected.zoneName} map with verified source pins`}/>{!ready&&<span className="ep-map-loading">Loading verified zone map…</span>}</div>;
}
export function AcquisitionExplorer({entityType,entityId,name,onClose}:{entityType:'item'|'pet';entityId:number;name:string;onClose:()=>void}){
 const records=findSources(entityType,entityId);
 const [mode,setMode]=useState<'sources'|'map'>('sources');
 return <div className="modal-backdrop ep-source-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><section className="ep-source-dialog" role="dialog" aria-modal="true" aria-label={`Sources for ${name}`}>
 <header className="ep-source-header"><div><span className="eyebrow">EVERPATH · ACQUISITION EXPLORER</span><h2>{name}</h2><p>Where to find it — using attributed, reviewed game-version records.</p></div><button onClick={onClose} className="ep-source-close" aria-label="Close source explorer"><X size={21}/></button></header>
 <nav className="ep-source-tabs" aria-label="Source explorer views"><button className={mode==='sources'?'active':''} onClick={()=>setMode('sources')}><Layers size={16}/> Sources</button><button className={mode==='map'?'active':''} onClick={()=>setMode('map')}><MapPin size={16}/> Map</button></nav>
 {mode==='sources'?<div className="ep-source-content">{records.length?records.map(r=><article className="ep-source-entry" key={r.id}><div className="ep-source-entry-head"><strong>{r.method.replace(/^./,x=>x.toUpperCase())}</strong><span>{r.location?.zoneName||'Location unspecified'}</span></div><p>{r.description||'No further acquisition instructions supplied.'}</p><div className={`ep-source-confidence ep-source-confidence--${r.evidenceLevel||'unknown'}`}>{r.evidenceLevel==='forever-verified'?'✓ Observed in Forever':r.evidenceLevel==='community-report'?'◌ Community report — verify in-game':r.evidenceLevel==='classic-reference'?'⚠ Classic reference — not confirmed in Forever':'Evidence level not recorded'}</div><div className="ep-source-evidence">Evidence: <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer">{r.sourceTitle} <ExternalLink size={12}/></a> · Checked {r.reviewedAt} · Data/rights: {r.license}{r.sourceUrl.startsWith("https://foreverdb.net/")&&<> · <a href="https://foreverdb.net" target="_blank" rel="noopener noreferrer">Data from ForeverDB.net <ExternalLink size={12}/></a></>}</div></article>):<div className="ep-source-empty"><Info size={28}/><h3>Acquisition source not verified yet</h3><p>Blizzard currently provides the item or pet identity, but this build has no reviewed vendor, gathering, drop, quest or zone data for this entry. We won't guess a location.</p><div className="ep-source-research"><strong>Where to research next</strong><a href={entityType==='item'?'https://foreverdb.net/developers':'https://forever.wowfun.fyi/en/pets/'} target="_blank" rel="noopener noreferrer">{entityType==='item'?'ForeverDB gathering and vendor data ↗':'WoWFun Forever pet source directory ↗'}</a><small>External community reference only. Availability and locations may be unverified.</small></div></div>}</div>:<MapPanel records={records}/>}
 <footer className="ep-source-footer">Game version: Forever · {records.length} reviewed source{records.length===1?'':'s'} · No guessed coordinates</footer>
 </section></div>
}
