'use client';
import {useState} from 'react';
import Link from 'next/link';
import {Search,ArrowUpRight} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {articles} from '@/lib/content';
const topics=[['all','All reads'],['what-hyperlocal-marketing-means','Local basics'],['prepare-for-a-content-shoot','Content'],['from-enquiry-to-customer','Enquiries'],['local-launch-checklist','Launches']];
export function LearnLibrary(){const [search,setSearch]=useState(''),[topic,setTopic]=useState('all');const filtered=articles.filter(a=>(topic==='all'||a.slug===topic)&&(a.title+' '+a.intro+' '+a.type).toLowerCase().includes(search.toLowerCase()));return <><div className="reading-toolbar"><div className="search-field"><Search size={20}/><Input aria-label="Search local knowledge articles" placeholder="What are you curious about?" value={search} onChange={e=>setSearch(e.target.value)}/></div><div className="reading-topics" role="group" aria-label="Filter reading topics">{topics.map(([id,label])=><Button key={id} variant="ghost" aria-pressed={topic===id} onClick={()=>setTopic(id)}>{label}</Button>)}</div></div><div className="reading-list">{filtered.map((a,n)=><Link className="reading-row" key={a.slug} href={'/learn/'+a.slug}><span className="reading-row-number">0{articles.indexOf(a)+1}</span><div><h3>{a.title}</h3><p>{a.intro}</p></div><ArrowUpRight size={30}/></Link>)}</div>{!filtered.length&&<div className="empty-state" role="status"><h3>No articles found.</h3><p>Try another topic or search for “content”, “local” or “enquiry”.</p><Button variant="outline" onClick={()=>{setSearch('');setTopic('all')}}>Show all reads</Button></div>}</>}
