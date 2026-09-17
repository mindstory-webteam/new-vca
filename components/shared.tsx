'use client';
import Link from 'next/link';
import {MapPin,Camera,MessageCircle,Radar,Megaphone,Users,ArrowUpRight,PawPrint,Utensils,ShoppingBag,Sparkles,Dumbbell,GraduationCap,Wrench} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Accordion,AccordionItem,AccordionTrigger,AccordionContent} from '@/components/ui/accordion';
import {faqs} from '@/lib/content';
export const iconMap={territory:MapPin,personality:Camera,voice:MessageCircle,radar:Radar,signal:Megaphone,circle:Users,food:Utensils,retail:ShoppingBag,beauty:Sparkles,fitness:Dumbbell,education:GraduationCap,services:Wrench};
export function CatIcon({name,size=24}:{name:string,size?:number}){const Icon=iconMap[name as keyof typeof iconMap]||PawPrint;return <Icon size={size} strokeWidth={1.65}/>}
export function PageIntro({title,accent,description}:{eyebrow:string,title:string,accent?:string,description:string}){return <section className="page-intro container"><h1>{title}{accent&&<><br/><em>{accent}</em></>}</h1><p className="lead">{description}</p></section>}
export function Faqs(){return <section className="section container faq-section"><div><h2>Questions before<br/>we get started?</h2><p>Here are a few things clients often ask us.</p></div><Accordion type="single" collapsible className="faq-list">{faqs.map(([q,a],i)=><AccordionItem value={String(i)} key={q}><AccordionTrigger>{q}</AccordionTrigger><AccordionContent>{a}</AccordionContent></AccordionItem>)}</Accordion></section>}
export function InlineCta({title='Have a local story to tell?',text='Tell us a little about your business. We’ll find a useful place to start.'}:{title?:string,text?:string}){return <section className="container"><div className="inline-cta"><div><h3>{title}</h3><p>{text}</p></div><Button asChild className="button purple"><Link href="/contact">Build my brief <ArrowUpRight/></Link></Button></div></section>}
export function TextLink({href,children}:{href:string,children:React.ReactNode}){return <Link href={href} className="text-link">{children}<ArrowUpRight size={18}/></Link>}
