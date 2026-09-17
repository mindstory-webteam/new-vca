import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ArrowLeft} from 'lucide-react';
import {readingNotes} from '@/lib/reading-notes';
import {articles} from '@/lib/content';
import {PageIntro,InlineCta} from '@/components/shared';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const a=articles.find(x=>x.slug===slug);return {title:a?.title||'Local knowledge',description:a?.intro,alternates:{canonical:'/learn/'+slug}}}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const a=articles.find(x=>x.slug===slug);if(!a)notFound();return <><div className="container"><Link className="back-link" href="/learn"><ArrowLeft size={16}/> Local knowledge</Link></div><PageIntro eyebrow={a.type+' / '+a.time} title={a.title} description={a.intro}/><article className="reading-column content-area">{a.sections.map(([t,p],i)=><section key={t}><h2>{t}.</h2><p>{p}</p></section>)}{readingNotes[slug]&&<><section className="reading-example"><h2>A little example.</h2><p>{readingNotes[slug].example}</p></section><section className="reading-takeaways"><h2>Three useful next steps.</h2><ul>{readingNotes[slug].checklist.map(x=><li key={x}>{x}</li>)}</ul></section></>}</article><InlineCta/></>}
