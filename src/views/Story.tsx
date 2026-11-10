import {ArrowRight, BookOpen, Compass, Map, Users, ExternalLink} from 'lucide-react';
import type {Page} from '../components/Layout';

const official = [
 {title:'Where your story begins',url:'https://news.blizzard.com/en-us/article/24315643/return-to-azeroth-in-world-of-warcraft-forever'},
 {title:'Forever: What’s Next',url:'https://worldofwarcraft.blizzard.com/en-us/news/24303862/world-of-warcraft-forever-whats-next-panel-recap'},
 {title:'World of Warcraft: Forever — Now Live',url:'https://worldofwarcraft.blizzard.com/en-gb/news/24315820/'}
];
export function Story({navigate}:{navigate:(p:Page)=>void}){
 return <main className="page-body page-body--wide ep-story-page">
  <div className="bread">Home › The Story of Forever</div>
  <section className="page-hero ep-story-hero"><div><span className="eyebrow">AZEROTH REIMAGINED</span><h1>The world you knew.<br/><span>Paths yet untaken.</span></h1><p>Discover the setting of World of Warcraft: Forever — and why the journey matters as much as the destination.</p></div></section>
  <section className="ep-story-intro"><div><span className="eyebrow">A NEW CHAPTER</span><h2>Return to the beginning. Find something new.</h2></div><div><p>World of Warcraft: Forever returns adventurers to the original continents of the Eastern Kingdoms and Kalimdor. Set in Azeroth’s early era after Warcraft III: Reforged – Forsaken Kingdom and before Molten Core, it invites players into a familiar world whose stories are not yet finished.</p><p>Its expanded level 1–60 journey opens new routes, quests and places to explore. Rather than rushing to an end point, Forever emphasizes preparation, exploration, effort and the friendships forged along the road.</p><p className="ep-story-attribution">An original Everpath summary of Blizzard’s published setting and design philosophy. Not a reproduction of Blizzard’s text.</p></div></section>
  <section className="ep-story-pillars" aria-label="The pillars of Forever"><article><Compass/><h3>A world worth exploring</h3><p>Original Azeroth grows with new paths and stories while keeping its familiar spirit.</p></article><article><Map/><h3>The journey counts</h3><p>Leveling, crafting, discovery and finding your way remain meaningful parts of play.</p></article><article><Users/><h3>Adventure together</h3><p>Community and cooperation are as important as the rewards at the end of the road.</p></article></section>
  <section className="ep-story-actions"><div><span className="eyebrow">PICK YOUR NEXT STEP</span><h2>Make your own path.</h2><p>Everpath focuses on two practical parts of that adventure: professions and collectible companions.</p></div><div className="ep-story-buttons"><button className="cinematic-btn cinematic-btn--gold" onClick={()=>navigate('professions')}>Plan your crafts <ArrowRight size={17}/></button><button className="cinematic-btn cinematic-btn--aqua" onClick={()=>navigate('pets')}>Explore pets <ArrowRight size={17}/></button></div></section>
  <section className="ep-story-sources"><h2><BookOpen size={20}/> Official sources</h2><p>Story setting and game features can evolve with official updates. These Blizzard sources informed the overview above.</p><div>{official.map(s=><a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">{s.title} <ExternalLink size={14}/></a>)}</div></section>
 </main>
}
