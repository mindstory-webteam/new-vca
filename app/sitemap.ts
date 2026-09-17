import type {MetadataRoute} from 'next';
import {services,industries,articles} from '@/lib/content';
import {siteOrigin} from '@/lib/contact';
export default function sitemap():MetadataRoute.Sitemap{return ['', '/play','/services','/your-business','/about','/work','/contact','/learn','/areas','/cat-lab','/cat-lab/check','/cat-lab/ideas','/privacy','/how-we-work','/local-growth',...services.map(s=>'/services/'+s.slug),...industries.map(i=>'/your-business/'+i.id),...industries.map(i=>'/work/'+i.id),...articles.map(a=>'/learn/'+a.slug)].map(path=>({url:siteOrigin+path}))}
