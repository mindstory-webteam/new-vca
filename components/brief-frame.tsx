'use client';
import {useEffect,useRef,useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {services,industries,goals} from '@/lib/content';

/** Reads a display name from a content list item, whatever it is called. */
function nameOf(item:unknown,fallback:string){
  const x=item as {name?:string;label?:string;title?:string};
  return x?.name||x?.label||x?.title||fallback;
}

/**
 * Shows /public/brief-form.html (plain HTML, CSS and JS) on the contact page.
 * It passes the service, industry and goal lists plus the URL query
 * (?services=, ?idea=, utm_… etc.) into the form and resizes it to fit.
 */
export function BriefFrame(){
  const frame=useRef<HTMLIFrameElement>(null);
  const query=useSearchParams();
  const queryKey=query.toString();
  const [height,setHeight]=useState(760);

  useEffect(()=>{
    function sendConfig(){
      frame.current?.contentWindow?.postMessage({
        type:'vc-brief:config',
        services:services.map(s=>({slug:s.slug,name:nameOf(s,s.slug)})),
        industries:industries.map(i=>({id:i.id,name:nameOf(i,i.id)})),
        goals:goals.map(g=>({id:g.id,name:nameOf(g,g.id)})),
        query:Object.fromEntries(new URLSearchParams(queryKey).entries()),
        pageUrl:window.location.href,
      },window.location.origin);
    }
    function onMessage(e:MessageEvent){
      if(e.origin!==window.location.origin||e.source!==frame.current?.contentWindow)return;
      const m=e.data as {type?:string;height?:number};
      if(!m||typeof m!=='object')return;
      if(m.type==='vc-brief:ready')sendConfig();
      if(m.type==='vc-brief:height'&&typeof m.height==='number')setHeight(Math.max(420,Math.ceil(m.height)));
      if(m.type==='vc-brief:scroll')frame.current?.scrollIntoView({behavior:'smooth',block:'start'});
    }
    window.addEventListener('message',onMessage);
    return()=>window.removeEventListener('message',onMessage);
  },[queryKey]);

  return <iframe
    ref={frame}
    src="/brief-form.html"
    title="Send Viral Cat your brief"
    style={{width:'100%',height,border:0,display:'block',background:'transparent'}}
  />;
}