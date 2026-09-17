'use client';
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
import {gsap,ScrollTrigger} from '@/lib/gsap';
export function SiteMotion(){const path=usePathname();useEffect(()=>{
 let context:gsap.Context|undefined;let frame=0;
 function setup(){context?.revert();const main=document.getElementById('main');if(!main)return;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.reducedMotion==='true';if(reduced)return;
 context=gsap.context(()=>{
  const compact=matchMedia('(max-width:760px)').matches;
  main!.querySelectorAll<HTMLElement>('.section-heading,.service-page-heading,.contact-channels').forEach(el=>{gsap.from(el,{y:compact?14:28,duration:.75,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 94%',once:true}})});
  main!.querySelectorAll<HTMLElement>('.creative-card,.check-preview,.mini-den,.service-visual').forEach((el,i)=>{gsap.fromTo(el,{y:compact?8:22+(i%3)*12},{y:compact?-8:-24-(i%3)*10,ease:'none',scrollTrigger:{trigger:el,start:'top bottom',end:'bottom top',scrub:1.2}})});
 },main);
 ScrollTrigger.refresh();
 }
 frame=requestAnimationFrame(setup);const observer=new MutationObserver(setup);observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-reduced-motion']});const media=matchMedia('(prefers-reduced-motion: reduce)');media.addEventListener('change',setup);
 return()=>{cancelAnimationFrame(frame);observer.disconnect();media.removeEventListener('change',setup);context?.revert()};
},[path]);return null}
