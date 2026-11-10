import {ArrowRight, Hammer, PawPrint, Layers, Target, Infinity as InfinityIcon,BookOpen} from 'lucide-react';
import type {Page} from '../components/Layout';

export function Home({navigate}:{navigate:(p:Page)=>void}){
 return <main className="ep-home">
  <section className="cinematic-hero">
   <div className="cinematic-hero__inner">
    <div className="cinematic-copy">
     <span className="cinematic-eyebrow">WORLD OF WARCRAFT: FOREVER</span>
     <h1>Less Searching.<br/><span>More Adventuring.</span></h1>
     <p>A modern, simple companion for your<br className="desktop-break"/> journey in Azeroth Forever.</p>
     <div className="cinematic-actions">
      <button className="cinematic-btn cinematic-btn--gold" onClick={()=>navigate('professions')}><Hammer size={22}/> Explore Professions <ArrowRight size={19}/></button>
      <button className="cinematic-btn cinematic-btn--aqua" onClick={()=>navigate('pets')}><PawPrint size={22}/> Discover Companion Pets <ArrowRight size={19}/></button>
     </div>
    </div>
   </div>
  </section>
  <section className="cinematic-features" aria-label="Explore Everpath tools">
   <button onClick={()=>navigate('professions')} className="cinematic-feature cinematic-feature--craft"><span className="cinematic-feature__image"/><span className="cinematic-feature__icon"><Hammer size={23}/></span><span className="cinematic-feature__copy"><strong>Professions &amp; Crafting</strong><small>Level up your professions, explore recipes,<br/> plan crafts and track what you need.</small></span><span className="cinematic-feature__arrow"><ArrowRight size={23}/></span></button>
   <button onClick={()=>navigate('pets')} className="cinematic-feature cinematic-feature--pets"><span className="cinematic-feature__image"/><span className="cinematic-feature__icon"><PawPrint size={23}/></span><span className="cinematic-feature__copy"><strong>Companion Pets</strong><small>Discover collectible pets, learn how to get<br/> them and build your collection.</small></span><span className="cinematic-feature__arrow"><ArrowRight size={23}/></span></button>
  </section>
  <section className="ep-story-teaser" aria-label="The story of Forever"><div className="ep-story-teaser__art" aria-hidden="true"/><div className="ep-story-teaser__content"><span className="eyebrow">THE STORY OF FOREVER</span><h2>Old lands. New roads.<br/><span>An Azeroth worth rediscovering.</span></h2><p>After Warcraft III and before the events of Molten Core, World of Warcraft: Forever returns to the original continents. Explore a renewed level 1–60 world where discovery, crafting and community shape the journey.</p><button className="ep-story-cta" onClick={()=>navigate('story')}><BookOpen size={18}/> Discover the story <ArrowRight size={17}/></button><small>Based on Blizzard’s official Forever setting. Read our source-linked overview.</small></div></section>
  <section className="cinematic-benefits" aria-label="Everpath features"><div><Target/><span><strong>Focused Tools</strong><small>Only what you need.</small></span></div><div><Layers/><span><strong>Clean &amp; Modern</strong><small>Easy to use, everywhere.</small></span></div><div><InfinityIcon/><span><strong>Built for Forever</strong><small>For the WoW: Forever community.</small></span></div></section>
  <div className="cinematic-disclaimer"></div>
 </main>
}