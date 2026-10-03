'use client';
import {useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {ArrowUpRight} from 'lucide-react';
import {workProjects} from '@/lib/work-projects';
import {Button} from '@/components/ui/button';

const categories=Array.from(new Set(workProjects.map(p=>p.category)));

export function WorkGallery(){
  const [filter,setFilter]=useState('all');
  const items=workProjects.filter(p=>filter==='all'||filter===p.category);
  return <>
    <div className="portfolio-toolbar">
      <div className="filter-row" role="group" aria-label="Filter projects">
        <Button variant={filter==='all'?'default':'outline'} aria-pressed={filter==='all'} onClick={()=>setFilter('all')}>All projects</Button>
        {categories.map(c=><Button key={c} variant={filter===c?'default':'outline'} aria-pressed={filter===c} onClick={()=>setFilter(c)}>{c}</Button>)}
      </div>
      <p role="status">{items.length} {items.length===1?'project':'projects'}</p>
    </div>
    <div className="portfolio-grid">
      {items.map((p,i)=>
        <Link className="portfolio-card" key={p.id} href={'/work/'+p.id}>
          <div className="portfolio-image">
            <Image src={p.image} alt={p.imageAlt} fill sizes="(max-width: 768px) 100vw, 50vw" priority={i<2}/>
          </div>
          <div className="portfolio-card-caption">
            <div><p>{p.businessType}</p><h3>{p.brand} — {p.title}</h3></div>
            <span className="portfolio-link-icon"><ArrowUpRight size={23}/></span>
          </div>
        </Link>
      )}
    </div>
  </>;
}