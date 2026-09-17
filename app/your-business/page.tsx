import Link from 'next/link';
import {ArrowUpRight} from 'lucide-react';
import {PageIntro,CatIcon,InlineCta} from '@/components/shared';
import {industries} from '@/lib/content';
export const metadata={title:'Local Marketing for Your Kind of Business',description:'Explore local marketing directions for cafés, retail, beauty, fitness, education and service businesses.',alternates:{canonical:'/your-business'}};
export default function Page(){return <><PageIntro eyebrow="EVERY BUSINESS HAS A LOCAL STORY" title="Yours is worth" accent="getting to know." description="A café. A showroom. A new studio. We start with the people you serve and the reasons they should choose you."/><section className="container industry-grid content-area">{industries.map(i=><Link key={i.id} href={'/your-business/'+i.id} className={'industry-card '+i.color}><CatIcon name={i.icon} size={32}/><h2>{i.name}</h2><p>{i.headline}</p><span className="text-link">Explore the possibilities <ArrowUpRight size={18}/></span></Link>)}</section><InlineCta/></>}
