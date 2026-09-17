'use client';
import Link from 'next/link';
import {useCallback,useEffect,useRef,useState} from 'react';
import {ArrowDown,ArrowUpRight,ChevronLeft,ChevronRight,Glasses,MapPin,MoveHorizontal,Pause,Play,Sparkles,ScanEye,RotateCcw} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {OriginalCatArt} from './cat-mascot';
import {bound,heroFrame,heroSlideProgress} from '@/lib/hero-motion';
import {gsap,ScrollTrigger} from '@/lib/gsap';

const slides=[
  {label:'Get found nearby',first:'Big love.',second:'Local impact.',body:'We know the neighbourhood. Let’s make sure it knows you.',word:'LOCAL',tag:'Cat Radar',note:'Be the name nearby.',service:'local-discovery',cta:'Find my Cat',href:'/cat-lab'},
  {label:'Tell your story',first:'Real people.',second:'Great stories.',body:'Your people. Your products. Your personality. Content that feels right around here.',word:'STORY',tag:'Cat Personality',note:'Give them a reason to care.',service:'content-production',cta:'Explore our services',href:'/services'},
  {label:'Bring people closer',first:'Get closer.',second:'Grow together.',body:'Turn local curiosity into a visit, a booking or a good conversation.',word:'GROW',tag:'Cat Signal',note:'Your next customer is closer.',service:'local-campaigns',cta:'Let’s talk about your business',href:'/contact'},
];


export function ParallaxHero(){
  const host=useRef<HTMLElement>(null),stage=useRef<HTMLDivElement>(null),world=useRef<HTMLDivElement>(null);
  const [active,setActive]=useState(0),[reduced,setReduced]=useState(false),[compact,setCompact]=useState(false),[vision,setVision]=useState(false),[reaction,setReaction]=useState('');
  const [fit,setFit]=useState(true);const reactionCount=useRef(0),timer=useRef<ReturnType<typeof setTimeout>|null>(null),gesture=useRef({x:0,y:0,down:false,moved:false});
  const pinned=!reduced&&!compact&&fit;
  const cinematic=useRef<gsap.core.Timeline|null>(null),catAction=useRef<gsap.core.Timeline|null>(null),pointerTween=useRef<gsap.core.Tween|null>(null),manualTween=useRef<gsap.core.Tween|null>(null),latest=useRef(active);latest.current=active;
  useEffect(()=>{
    const media=matchMedia('(prefers-reduced-motion: reduce)'),small=matchMedia('(max-width: 760px) and (max-height: 739px), (min-width: 761px) and (max-height: 699px)');
    const sync=()=>{setReduced(media.matches||document.documentElement.dataset.reducedMotion==='true');setCompact(small.matches)};
    sync();media.addEventListener('change',sync);small.addEventListener('change',sync);
    const observer=new MutationObserver(sync);observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-reduced-motion']});
    return()=>{media.removeEventListener('change',sync);small.removeEventListener('change',sync);observer.disconnect();if(timer.current)clearTimeout(timer.current)};
  },[]);
  const pose=useCallback((p:number)=>{const scene=world.current;if(!scene)return;const f=heroFrame(p);scene.style.setProperty('--world-yaw',`${reduced?0:f.yaw}deg`);scene.style.setProperty('--world-roll',`${reduced?0:f.roll}deg`);scene.style.setProperty('--world-z',`${reduced?0:f.depth}px`);scene.style.setProperty('--world-scale',String(reduced?1:f.scale));scene.style.setProperty('--world-travel',`${reduced?0:f.travel}px`);scene.style.setProperty('--bg-travel',`${reduced?0:-p*110}px`);host.current?.style.setProperty('--hero-progress',String(p));},[reduced]);
  useEffect(()=>{
    const root=host.current,view=stage.current,scene=world.current;if(!root||!view||!scene)return;
    if(!pinned){pose(heroSlideProgress(latest.current));return}
    const progress={value:0};const context=gsap.context(()=>{
      cinematic.current=gsap.timeline({scrollTrigger:{trigger:root,start:()=>`top ${parseFloat(getComputedStyle(view).top)||0}px`,end:()=>'+='+Math.max(1,root.offsetHeight-view.offsetHeight),scrub:.8,invalidateOnRefresh:true}})
        .to(progress,{value:1,duration:3,ease:'none',onUpdate:()=>{pose(progress.value);const next=heroFrame(progress.value).slide;setActive(previous=>previous===next?previous:next)}},0)
        .to('.hero-scene-word',{xPercent:-20,rotation:-4,duration:3,ease:'none'},0)
        .to('.hero-depth-caption',{y:-100,duration:3,ease:'none'},0)
        .to(view,{'--scene-tint':'#ffe2bf',duration:1.5,ease:'sine.inOut'},0)
        .to(view,{'--scene-tint':'#dec4f0',duration:1.5,ease:'sine.inOut'},1.5);
    },root);
    const frame=requestAnimationFrame(()=>ScrollTrigger.refresh());return()=>{cancelAnimationFrame(frame);context.revert();cinematic.current=null};
  },[pinned,pose]);
  useEffect(()=>{if(reduced)return;const root=host.current;if(!root)return;const context=gsap.context(()=>{gsap.fromTo('.hero-copy-frame h1',{y:22,opacity:.3},{y:0,opacity:1,duration:.7,ease:'power3.out'});gsap.fromTo('.hero-copy-frame p',{y:12,opacity:.4},{y:0,opacity:1,duration:.55,delay:.12,ease:'power2.out'});gsap.fromTo('.hero-service-float',{x:18},{x:0,duration:.7,ease:'back.out(1.3)'})},root);return()=>context.revert()},[active,reduced]);
  useEffect(()=>{if(reduced||!host.current)return;const context=gsap.context(()=>{gsap.fromTo('.cat-arrival',{y:38,rotationY:0,rotation:-3,scale:.96},{y:0,rotationY:0,rotation:0,scale:1,duration:1.15,ease:'power3.out',delay:.15});gsap.fromTo('.hero-scene-word',{y:70},{y:0,duration:1.8,ease:'power3.out'});},host);return()=>context.revert()},[reduced]);
  useEffect(()=>()=>{catAction.current?.kill();pointerTween.current?.kill();manualTween.current?.kill();gsap.killTweensOf(window)},[]);
  useEffect(()=>{const view=stage.current;if(!view)return;const check=()=>{const header=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height'))||88;setFit(view.scrollHeight<=window.innerHeight-header+2)};const observer=new ResizeObserver(check);observer.observe(view);window.addEventListener('resize',check);document.fonts.ready.then(check);check();return()=>{observer.disconnect();window.removeEventListener('resize',check)}},[]);
  function choose(index:number){const next=(index+slides.length)%slides.length;const root=host.current,view=stage.current;if(!pinned||!root||!view){setActive(next);manualTween.current?.kill();const value={p:heroSlideProgress(latest.current)};manualTween.current=gsap.to(value,{p:heroSlideProgress(next),duration:reduced?0:.85,ease:'power2.inOut',onUpdate:()=>pose(value.p)});return}const top=parseFloat(getComputedStyle(view).top)||0;gsap.to(window,{scrollTo:{y:window.scrollY+root.getBoundingClientRect().top-top+(root.offsetHeight-view.offsetHeight)*heroSlideProgress(next),autoKill:true},duration:.95,ease:'power2.inOut',overwrite:'auto'})}
  function resetPointer(){if(!world.current)return;pointerTween.current?.kill();pointerTween.current=gsap.to(world.current,{'--pointer-x':'0deg','--pointer-y':'0deg',duration:reduced?0:.65,ease:'power3.out'})}
  function playCat(action:'pounce'|'peek'|'wave'|'reset'){
    const layer=host.current?.querySelector('.cat-action-layer'),shadow=host.current?.querySelector('.cat-contact-shadow');if(!layer)return;
    catAction.current?.kill();gsap.set(layer,{x:0,y:0,rotation:0,rotationY:0,scale:1,scaleX:1,scaleY:1,transformOrigin:'50% 85%'});if(shadow)gsap.set(shadow,{scale:1,opacity:.65});
    if(action==='reset'){resetPointer();setVision(false);setReaction('Ready for a little curiosity.');}
    else {setReaction(action==='pounce'?'A little leap. A lot of local.':action==='wave'?'Hello, neighbour!':'Follow your curiosity.');if(!reduced){const timeline=gsap.timeline();catAction.current=timeline;
      if(action==='wave'){timeline.to(layer,{rotation:-5,y:-8,duration:.32,ease:'sine.out'}).to(layer,{rotation:4,y:-3,duration:.46,ease:'sine.inOut'}).to(layer,{rotation:0,y:0,duration:.4,ease:'sine.inOut'})}
      else if(action==='pounce'){timeline.to(layer,{y:compact?-30:-52,rotation:-3,duration:.38,ease:'power2.out'}).to(layer,{y:0,rotation:0,duration:.48,ease:'power2.in'});if(shadow)timeline.to(shadow,{scale:.78,opacity:.3,duration:.38},0).to(shadow,{scale:1,opacity:.65,duration:.48},.38)}
      else{timeline.to(layer,{x:16,rotation:4,duration:.45,ease:'sine.inOut'}).to(layer,{x:-12,rotation:-3,duration:.65,ease:'sine.inOut'}).to(layer,{x:0,rotation:0,duration:.45,ease:'sine.inOut'})}
    }}
    if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>setReaction(''),2500);
  }
  function react(){if(gesture.current.moved)return;playCat((['wave','pounce','peek'] as const)[reactionCount.current++%3])}
  function toggleMotion(){const next=!reduced;document.documentElement.dataset.reducedMotion=String(next);try{localStorage.setItem('vc-reduce-motion',next?'1':'0')}catch{}setReduced(next||matchMedia('(prefers-reduced-motion: reduce)').matches)}
  const slide=slides[active];
  return <section ref={host} id="follow-the-cat" className={'parallax-hero hero-fullbleed '+(pinned?'hero-is-pinned':'hero-is-static')+(reduced?' hero-calm':'')} aria-label="Viral Cat introduction">
    <div ref={stage} className="parallax-stage" onPointerMove={event=>{if(reduced||event.pointerType!=='mouse'||!world.current)return;const r=event.currentTarget.getBoundingClientRect();pointerTween.current?.kill();pointerTween.current=gsap.to(world.current,{'--pointer-x':`${(bound((event.clientX-r.left)/r.width)-.5)*8}deg`,'--pointer-y':`${(bound((event.clientY-r.top)/r.height)-.5)*-5}deg`,duration:.5,ease:'power3.out'})}} onPointerLeave={resetPointer}><div className="hero-scene-backdrop" aria-hidden="true"><span className="hero-scene-word">{slide.word}<span>.</span></span></div>

      <div className="parallax-layout container">
        <div className="parallax-copy">

          <div key={active} className="hero-copy-frame" aria-live="polite" aria-atomic="true"><h1>{slide.first}<br/><em>{slide.second}</em></h1><p>{slide.body}</p></div>
          <div className="parallax-actions"><Button asChild className="button purple"><Link href={slide.href}>{slide.cta}<ArrowUpRight/></Link></Button><Link className="hero-secondary" href="/cat-lab/check">Check my local presence <ArrowUpRight size={17}/></Link></div>
          <p className="hero-brand-signoff">A little curious. Very local.<br/><strong>A chapter of MINDSTORY.</strong></p>
        </div>
        <div ref={world} className={'hero-world mascot-original-on '+(vision?'cat-vision-on ':'')+(reaction?'cat-reacting':'')} onPointerMove={event=>{const g=gesture.current;if(g.down&&Math.hypot(event.clientX-g.x,event.clientY-g.y)>10)g.moved=true;}} onPointerLeave={resetPointer} onPointerDown={event=>{gesture.current={x:event.clientX,y:event.clientY,down:true,moved:false}}} onPointerUp={event=>{const g=gesture.current;g.down=false;const dx=event.clientX-g.x,dy=event.clientY-g.y;if(event.pointerType!=='mouse'&&Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.4)choose(active+(dx<0?1:-1))}} onPointerCancel={()=>{gesture.current.down=false;resetPointer()}}>
          <div className="hero-open-scene">

            <span className="cat-interaction-hint"><MoveHorizontal size={16}/> A familiar face. A little curiosity.</span>
            <div className="cat-perspective"><div className="cat-depth-position"><div className="cat-arrival"><div className="cat-action-layer"><div className="cat-logo-sculpture">
              <button className="cat-art-front" onClick={event=>{if(event.detail===0)gesture.current.moved=false;react()}} aria-label="Play with the original Viral Cat mascot"><OriginalCatArt/></button>
            </div></div></div></div><div className="cat-contact-shadow" aria-hidden="true"/></div>

            <Link key={slide.tag} className="hero-service-float" href={'/services/'+slide.service}><span className="float-icon">{active===1?<Sparkles size={22}/>:<MapPin size={22}/>}</span><span><small>{slide.tag}</small><strong>{slide.note}</strong></span><ArrowUpRight size={18}/></Link>
            {vision&&<div className="hero-vision-links"><Link href="/services/local-discovery">Get found <ArrowUpRight size={15}/></Link><Link href="/services/content-production">Tell your story <ArrowUpRight size={15}/></Link><Link href="/services/local-campaigns">Reach nearby <ArrowUpRight size={15}/></Link></div>}
            <span className={'mascot-reaction '+(reaction?'visible':'')} role="status">{reaction}</span>
          </div>
          <div className="hero-playbar cat-animation-controls" aria-label="Play with the Cat"><Button variant="ghost" onClick={()=>playCat('wave')}>Say hello</Button><Button variant="ghost" onClick={()=>playCat('pounce')}><Sparkles size={17}/> Pounce</Button><Button variant="ghost" onClick={()=>playCat('peek')}><ScanEye size={17}/> Peek</Button><Button variant="ghost" aria-pressed={vision} onClick={()=>setVision(!vision)}><Glasses size={18}/> Cat Vision</Button><Button variant="ghost" size="icon" onClick={()=>playCat('reset')} aria-label="Reset Cat animation"><RotateCcw size={17}/></Button></div>
        </div>
      </div>
      <div className="hero-navigation container"><div className="hero-slide-selector" aria-label="Choose an introduction slide">{slides.map((s,i)=><Button key={s.label} variant="ghost" aria-pressed={i===active} onClick={()=>choose(i)} className={active===i?'is-active':''}><strong>{s.label}</strong></Button>)}</div><div className="hero-slider-actions"><Button size="icon" variant="outline" onClick={()=>choose(active-1)} aria-label="Previous hero slide"><ChevronLeft/></Button><Button size="icon" variant="outline" onClick={()=>choose(active+1)} aria-label="Next hero slide"><ChevronRight/></Button><Button size="icon" variant="ghost" onClick={toggleMotion} aria-label={reduced?'Enable animation':'Reduce animation'} aria-pressed={reduced}>{reduced?<Play size={17}/>:<Pause size={17}/>}</Button></div><a href="#neighbourhood" className="hero-scroll-down"><span>{pinned?'Scroll to explore':'Explore the neighbourhood'}</span><ArrowDown size={18}/></a></div>
      <div className="hero-reading-progress" aria-hidden="true"/>
    </div>
  </section>;
}
