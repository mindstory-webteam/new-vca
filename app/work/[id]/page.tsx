import Link from 'next/link';
import Image from 'next/image';
import {notFound} from 'next/navigation';
import {ArrowUpRight,ArrowLeft,Check} from 'lucide-react';
import {PageIntro} from '@/components/shared';
import {workProjects} from '@/lib/work-projects';

export function generateStaticParams(){return workProjects.map(p=>({id:p.id}))}

export async function generateMetadata({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const p=workProjects.find(x=>x.id===id);
  return {
    title:p?`${p.brand} — Client Work`:'Project not found',
    description:p?.impact,
    alternates:{canonical:'/work/'+id},
    openGraph:p?{images:[p.image]}:undefined
  };
}

export default async function Page({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const p=workProjects.find(x=>x.id===id);
  if(!p)notFound();
  const next=workProjects[(workProjects.indexOf(p)+1)%workProjects.length];
  return <>
    <div className="container portfolio-back">
      <Link href="/work"><ArrowLeft size={17}/> All projects</Link>
      <span>CLIENT WORK / {p.businessType.toUpperCase()}</span>
    </div>
    <PageIntro eyebrow={p.brand.toUpperCase()} title={p.title} description={p.focus}/>
    <section className="container case-study-hero">
      <div className="portfolio-image portfolio-image-lg">
        <Image src={p.image} alt={p.imageAlt} fill sizes="(max-width: 768px) 100vw, 50vw" priority/>
      </div>
      <div className="case-study-overview">
        <h2>Our starting point,<br/><em>and where it led.</em></h2>
        <dl>
          <div><dt>Business type</dt><dd>{p.businessType}</dd></div>
          <div><dt>Focus</dt><dd>{p.focus}</dd></div>
          <div><dt>Our starting point</dt><dd>{p.start}</dd></div>
        </dl>
        <Link className="text-link" href={'/services/'+p.service}>Explore the related service <ArrowUpRight size={18}/></Link>
      </div>
    </section>
    <section className="container section case-study-story">
      <article><h2>Where our work made an impact</h2><p>{p.impact}</p></article>
      <article><h2>The difference in every detail</h2><p>{p.difference}</p></article>
    </section>
    <section className="case-study-deliverables">
      <div className="container preparation-grid">
        <div><h2>{p.resultsTitle}</h2></div>
        <div><ul className="client-results">{p.results.map(r=><li key={r}><Check size={18}/> {r}</li>)}</ul></div>
      </div>
    </section>
    <section className="container case-next">
      <div><h2>{next.brand}</h2></div>
      <Link href={'/work/'+next.id} className="text-link">See the next project <ArrowUpRight/></Link>
    </section>
  </>;
}