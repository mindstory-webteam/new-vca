'use client';
import Link from 'next/link';
import {useState} from 'react';
import {ArrowUpRight,PawPrint,Check,Compass,Sparkles} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Tabs,TabsList,TabsTrigger,TabsContent} from '@/components/ui/tabs';
import {industries,articles} from '@/lib/content';
import {CatIcon,Faqs,TextLink} from './shared';
import {LocalLens,CaptionRemixer} from './interactive-neighbourhood';
import {ParallaxHero} from './parallax-hero';
import {HomePlayground} from './growth-playground';
import {AboutHome} from './studio-sections';
import {HomeServices} from './home-services';
import {GameTeaser} from './cat-street-game';
export function HomeExperience(){const [industry,setIndustry]=useState('food');

return <><ParallaxHero/>
<section id="neighbourhood" className="section container business-section"><div className="section-heading"><div><h2>Made for businesses<br/><em>like yours.</em></h2></div><p>Different doors. Different stories.<br/>One shared opportunity: the people nearby.</p></div><Tabs value={industry} onValueChange={setIndustry} className="industry-tabs"><TabsList className="industry-list">{industries.map(i=><TabsTrigger value={i.id} key={i.id}><CatIcon name={i.icon}/>{i.name}</TabsTrigger>)}</TabsList>{industries.map(i=><TabsContent key={i.id} value={i.id}><div className={'industry-panel panel-'+i.color}><div><h3>{i.headline}</h3><p>{i.focus}</p><TextLink href={'/your-business/'+i.id}>See what could work for you</TextLink></div><div className="industry-idea"><span><Sparkles size={17}/> An idea to try</span><h4>“{i.idea}”</h4><p>{i.detail}</p><small>Illustrative content direction</small></div></div></TabsContent>)}</Tabs></section>
<HomeServices/>
<AboutHome/>
<section className="section container check-section"><div className="check-copy"><h2>How easy are<br/>you to <em>find?</em></h2><p>Six simple questions. A clearer picture of your local presence. A few practical things to do next.</p><Button asChild className="button purple"><Link href="/cat-lab/check">Check my local presence <ArrowUpRight/></Link></Button><small>No account needed. Your results come first.</small></div><div className="check-preview"><div className="check-preview-head"><span><Compass size={19}/> Cat Radar</span><span>A quick check</span></div><div className="check-preview-content"><PawPrint size={36}/><h3>Can a new customer<br/>find their way to you?</h3>{['Accurate opening hours','A clear contact route','Real, recent business content'].map(x=><div className="preview-check" key={x}><span><Check size={16}/></span>{x}</div>)}<div className="check-preview-bottom"><span>Let’s take a closer look.</span><ArrowUpRight/></div></div></div></section>
<LocalLens/>
<section className="section container ideas-home"><div className="section-heading"><div><h2>Picture what we could<br/><em>do for your business.</em></h2></div><TextLink href="/work">Explore creative directions</TextLink></div><div className="creative-grid">{industries.slice(0,3).map((i,n)=><Link href={'/work/'+i.id} className={'creative-card creative-'+i.color} key={i.id}><div className="creative-top"><span>{i.name}</span><ArrowUpRight size={20}/></div><CatIcon name={i.icon} size={34}/><h3>{i.idea}</h3><div className="creative-bottom"><span>VIRAL CAT CONCEPT SERIES</span><span>0{n+1}</span></div></Link>)}</div><p className="caption">Illustrative creative concepts. A little inspiration for your own business.</p></section>
<HomePlayground/>
<GameTeaser/>
<CaptionRemixer/>
<section className="section container"><div className="section-heading"><div><h2>A little local <em>knowledge.</em></h2></div><TextLink href="/learn">Visit the reading corner</TextLink></div><div className="article-grid">{articles.slice(0,3).map((a,i)=><Link className="article-card" href={'/learn/'+a.slug} key={a.slug}><p className="small-label">{a.type}</p><h3>{a.title}</h3><div><span>{a.time}</span><ArrowUpRight size={21}/></div></Link>)}</div></section><Faqs/>
</>}
