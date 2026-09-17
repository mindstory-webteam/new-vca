import type { Metadata } from 'next';
import './globals.css';
import './experience-v7.css';
import './cat-street.css';
import './cat-walk.css';
import './cat-puzzle.css';
import {siteOrigin,contact} from '@/lib/contact';
import { SiteShell } from '@/components/site-shell';
export const metadata:Metadata={metadataBase:new URL(siteOrigin),title:{default:'Viral Cat — Big love for local business',template:'%s | Viral Cat'},description:'Your hyperlocal marketing expert. Discover content, local campaigns and creator connections. A chapter of Mindstory.',icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;450;500;550;600;650;700&family=Manrope:wght@400;500;600;650;700;750;800&display=swap" rel="stylesheet"/></head><body><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({'@context':'https://schema.org','@type':'Organization','@id':siteOrigin+'/#organisation',name:'Viral Cat',url:siteOrigin,logo:siteOrigin+'/assets/viral-cat-logo.png',telephone:contact.phone,email:contact.email}).replace(/</g,'\\u003c')}}/><SiteShell>{children}</SiteShell></body></html>}
