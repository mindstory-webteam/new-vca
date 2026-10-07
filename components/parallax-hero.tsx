'use client';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,Glasses,MapPin,MessageCircleHeart,RotateCcw,ScanEye,Sparkles} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {CursorCat,type CursorCatHandle} from './cursor-cat';
import RotatingText,{type RotatingTextRef} from './rotating-text';
import {gsap} from '@/lib/gsap';

const slides=[
  {first:'Big love.',second:'Local impact.',body:'Be the name your neighbourhood knows.',tag:'Cat Radar',note:'Be the name nearby.',service:'local-discovery',cta:'Find my Cat',href:'/cat-lab'},
  {first:'Real people.',second:'Great stories.',body:'Content that feels like home.',tag:'Cat Personality',note:'Give them a reason to care.',service:'content-production',cta:'Our services',href:'/services'},
  {first:'Get closer.',second:'together.',body:'Turn curiosity into customers.',tag:'Cat Signal',note:'Your next customer is closer.',service:'local-campaigns',cta:'Let’s talk',href:'/contact'},
];
const chipIcons=[<MapPin key="a" size={17}/>,<Sparkles key="b" size={17}/>,<MessageCircleHeart key="c" size={17}/>];

// How long each slide stays on screen (milliseconds)
const SLIDE_DURATION=5000;

export function ParallaxHero(){
  const host=useRef<HTMLElement>(null),catLayer=useRef<HTMLDivElement>(null);
  const catArt=useRef<CursorCatHandle>(null),lineA=useRef<RotatingTextRef>(null),lineB=useRef<RotatingTextRef>(null);
  const [active,setActive]=useState(0),[paused,setPaused]=useState(false),[reduced,setReduced]=useState(false),[vision,setVision]=useState(false),[reaction,setReaction]=useState('');
  const reactionCount=useRef(0),bubbleTimer=useRef<ReturnType<typeof setTimeout>|null>(null),catAction=useRef<gsap.core.Timeline|null>(null);

  useEffect(()=>{
    const media=matchMedia('(prefers-reduced-motion: reduce)');
    const sync=()=>setReduced(media.matches||document.documentElement.dataset.reducedMotion==='true');
    sync();media.addEventListener('change',sync);
    const observer=new MutationObserver(sync);observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-reduced-motion']});
    return()=>{media.removeEventListener('change',sync);observer.disconnect();if(bubbleTimer.current)clearTimeout(bubbleTimer.current);catAction.current?.kill()};
  },[]);

  // one timer drives the headline, body, CTA and chip
  useEffect(()=>{if(paused||reduced)return;const id=setTimeout(()=>setActive(a=>(a+1)%slides.length),SLIDE_DURATION);return()=>clearTimeout(id)},[active,paused,reduced]);
  useEffect(()=>{lineA.current?.jumpTo(active);lineB.current?.jumpTo(active)},[active]);

  // entrance: the cat rises from the bottom edge, copy fades up
  useEffect(()=>{if(reduced||!host.current)return;const ctx=gsap.context(()=>{
    const tl=gsap.timeline({defaults:{ease:'power4.out'}});
    tl.fromTo('.vc-halo',{scale:.85,opacity:0},{scale:1,opacity:1,duration:1.6},0)
      .fromTo('.vc-cat-rise',{yPercent:100},{yPercent:0,duration:1.6},.1)
      .fromTo('.vc-reveal',{y:28,opacity:0},{y:0,opacity:1,duration:1,stagger:.09},.25)
      .fromTo('.vc-float',{y:16,opacity:0},{y:0,opacity:1,duration:.9,stagger:.1},1.1);
  },host);return()=>ctx.revert()},[reduced]);

  function playCat(action:'pounce'|'peek'|'wave'|'reset'){
    catArt.current?.play(action==='pounce'?'laugh':action);
    const layer=catLayer.current;if(!layer)return;
    catAction.current?.kill();gsap.set(layer,{x:0,y:0,rotation:0,transformOrigin:'50% 100%'});
    if(action==='reset'){setVision(false);setReaction('Ready for a little curiosity.')}
    else{
      setReaction(action==='pounce'?'A little leap. A lot of local.':action==='wave'?'Hello, neighbour!':'Follow your curiosity.');
      if(!reduced){const tl=gsap.timeline();catAction.current=tl;
        if(action==='wave')tl.to(layer,{rotation:-2.5,y:-8,duration:.32,ease:'sine.out'}).to(layer,{rotation:2,y:-3,duration:.46,ease:'sine.inOut'}).to(layer,{rotation:0,y:0,duration:.4,ease:'sine.inOut'});
        else if(action==='pounce')tl.to(layer,{y:-40,duration:.38,ease:'power2.out'}).to(layer,{y:0,duration:.5,ease:'bounce.out'});
        else tl.to(layer,{x:18,rotation:2,duration:.45,ease:'sine.inOut'}).to(layer,{x:-14,rotation:-2,duration:.65,ease:'sine.inOut'}).to(layer,{x:0,rotation:0,duration:.45,ease:'sine.inOut'});
      }
    }
    if(bubbleTimer.current)clearTimeout(bubbleTimer.current);bubbleTimer.current=setTimeout(()=>setReaction(''),2500);
  }
  const react=()=>playCat((['wave','pounce','peek'] as const)[reactionCount.current++%3]);

  // headline motion: letters rise out of a mask, one after another
  const rt={
    auto:false,
    staggerDuration:reduced?0:.022,
    staggerFrom:'first' as const,
    initial:{y:'105%',opacity:0},animate:{y:0,opacity:1},exit:{y:'-105%',opacity:0},
    transition:reduced?{duration:0}:{type:'spring' as const,damping:30,stiffness:380},
    splitLevelClassName:'vc-rt-word',
  };

  const slide=slides[active];
  return <section ref={host} id="follow-the-cat" className={'vc-hero'+(reduced?' vc-calm':'')+(vision?' vc-vision':'')} aria-label="Viral Cat introduction">
    {/* still background: no motion, no effects */}
    <div className="vc-bg" aria-hidden="true"/>

    {/* RIGHT: full-height stage, cat anchored to the bottom edge */}
    <div className="vc-stage">
      <div className="vc-halo" aria-hidden="true"><span className="vc-ring"/></div>
      <div className="vc-cat-rise">
        <div ref={catLayer} className="vc-cat-layer">
          <button className="vc-cat-btn" onClick={react} aria-label="Play with the Viral Cat mascot"><CursorCat ref={catArt}/></button>
        </div>
      </div>
      <span className={'vc-bubble'+(reaction?' show':'')} role="status">{reaction}</span>

      <div className="vc-chips vc-float">
        {slides.map((s,i)=>(i===active||vision)&&<Link key={s.service} href={'/services/'+s.service} className={'vc-chip'+(i===active?' is-active':'')}>
          <span className="vc-chip-icon">{chipIcons[i]}</span>
          <span><small>{s.tag}</small><strong>{s.note}</strong></span>
          <ArrowUpRight size={14}/>
        </Link>)}
      </div>

      <div className="vc-playbar vc-float" aria-label="Play with the Cat">
        <button onClick={()=>playCat('wave')}>Say hello</button>
        <button onClick={()=>playCat('pounce')}><Sparkles size={14}/> Pounce</button>
        <button onClick={()=>playCat('peek')}><ScanEye size={14}/> Peek</button>
        <button aria-pressed={vision} onClick={()=>setVision(v=>!v)}><Glasses size={15}/> Cat Vision</button>
        <button className="vc-icon" onClick={()=>playCat('reset')} aria-label="Reset Cat animation"><RotateCcw size={14}/></button>
      </div>
    </div>

    {/* LEFT: copy */}
    <div className="vc-inner">
      <div className="vc-copy" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocus={()=>setPaused(true)} onBlur={()=>setPaused(false)}>
        <h1 className="vc-title vc-reveal">
          <RotatingText ref={lineA} texts={slides.map(s=>s.first)} mainClassName="vc-line" {...rt}/>
          <RotatingText ref={lineB} texts={slides.map(s=>s.second)} mainClassName="vc-line vc-line-accent" {...rt}/>
        </h1>
        <p key={'b'+active} className="vc-body">{slide.body}</p>
        <div className="vc-actions vc-reveal">
          <Button asChild className="button purple"><Link href={slide.href}>{slide.cta}<ArrowUpRight/></Link></Button>
          <Link className="vc-secondary" href="/cat-lab/check">Free local check</Link>
        </div>
        <div className="vc-meta vc-reveal">
          <span className="vc-count" aria-hidden="true">
            <b>{String(active+1).padStart(2,'0')}</b>
            <span className="vc-track"><i key={active} style={{animationDuration:SLIDE_DURATION+'ms',animationPlayState:paused||reduced?'paused':'running'}}/></span>
            <span>{String(slides.length).padStart(2,'0')}</span>
          </span>
          <span className="vc-signoff">A chapter of <strong>MINDSTORY</strong></span>
        </div>
      </div>
    </div>

    <style>{`
      /* theme tokens — taken from the cat: purple fur + orange goggles */
      .vc-hero{
        --vc-bg:#f4eefa;--vc-ink:#22132f;--vc-muted:#6f6280;--vc-purple:#7b2fa8;--vc-orange:#f28c28;--vc-lilac:#e6d6f3;
        --vc-line:rgba(34,19,47,.09);--vc-glass:rgba(255,255,255,.66);
        /* cat size: share of the banner height the cat may use (raise for bigger) */
        --cat-height:96;
        position:relative;overflow:hidden;isolation:isolate;font-family:inherit;color:var(--vc-ink);background:var(--vc-bg);
        min-height:max(640px,calc(100svh - var(--header-height,88px)));display:flex;align-items:center;
      }

      /* ── background: soft, still light in the cat's colours ── */
      .vc-bg{position:absolute;inset:0;z-index:-1;pointer-events:none;
        background:
          /* purple glow behind the cat (its fur) */
          radial-gradient(52% 72% at 74% 52%,rgba(160,98,214,.42) 0%,rgba(160,98,214,.16) 45%,rgba(160,98,214,0) 75%),
          /* warm orange touch low on the right (its goggles) */
          radial-gradient(28% 36% at 90% 88%,rgba(242,140,40,.16) 0%,rgba(242,140,40,0) 70%),
          /* peach glow bottom-left, under the copy */
          radial-gradient(42% 55% at 0% 100%,rgba(255,214,176,.75) 0%,rgba(255,214,176,0) 70%),
          /* light lilac wash top-left */
          radial-gradient(45% 50% at 20% 0%,rgba(236,224,247,1) 0%,rgba(236,224,247,0) 70%),
          linear-gradient(180deg,#f7f3fb 0%,#f1e9f8 60%,#ece1f6 100%)}
      /* fine paper grain for a premium finish (static) */
      .vc-bg::after{content:'';position:absolute;inset:0;opacity:.045;mix-blend-mode:multiply;
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}

      /* left copy column */
      .vc-inner{position:relative;z-index:3;width:100%;max-width:1440px;margin:0 auto;padding:clamp(48px,7vh,96px) clamp(20px,5vw,80px);pointer-events:none}
      .vc-copy{width:min(100%,520px);pointer-events:auto}
      .vc-title{margin:0;font-size:clamp(2.8rem,5vw,5.2rem);line-height:1.02;letter-spacing:-.045em;font-weight:700;color:var(--vc-ink)}
      .vc-line{display:flex!important}
      .vc-line-accent{color:var(--vc-purple);font-style:italic}
      .vc-rt-word{overflow:hidden;padding:0 .06em .14em 0;margin-bottom:-.14em}
      .vc-body{margin:24px 0 0;max-width:30ch;font-size:clamp(1.02rem,1.2vw,1.15rem);line-height:1.6;color:var(--vc-muted);animation:vc-in .7s .15s both cubic-bezier(.2,.7,.2,1)}
      @keyframes vc-in{from{opacity:0;transform:translateY(10px)}}
      /* two buttons on one row, same height, same corner radius */
      .vc-actions{display:flex;align-items:center;gap:12px;margin-top:36px}
      .vc-actions > a{display:inline-flex;align-items:center;justify-content:center;gap:10px;height:52px!important;padding:0 26px!important;
        border-radius:14px!important;font-size:1rem;font-weight:600;line-height:1;white-space:nowrap;text-decoration:none;box-sizing:border-box}
      .vc-actions > a svg{width:18px;height:18px;flex:none}
      .vc-secondary{color:var(--vc-ink);background:rgba(255,255,255,.55);border:1px solid rgba(34,19,47,.14);backdrop-filter:blur(8px);transition:background .2s,border-color .2s,color .2s}
      .vc-secondary:hover{background:#fff;border-color:rgba(123,47,168,.35);color:var(--vc-purple)}
      @media (max-width:420px){.vc-actions{flex-direction:column;align-items:stretch}.vc-actions > a{width:100%}}
      .vc-meta{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-top:64px;padding-top:20px;border-top:1px solid var(--vc-line);font-size:.82rem;color:var(--vc-muted)}
      .vc-count{display:inline-flex;align-items:center;gap:12px;font-variant-numeric:tabular-nums;letter-spacing:.04em}
      .vc-count b{color:var(--vc-ink);font-weight:600}
      .vc-track{position:relative;width:64px;height:1px;background:var(--vc-line);overflow:hidden}
      .vc-track i{position:absolute;inset:0;background:var(--vc-ink);transform-origin:left;animation:vc-fill linear forwards}
      @keyframes vc-fill{from{transform:scaleX(0)}to{transform:scaleX(1)}}
      .vc-signoff strong{color:var(--vc-ink);font-weight:600;letter-spacing:.08em}

      /* right stage: full height, edge to edge on the right */
      .vc-stage{position:absolute;top:0;right:0;bottom:0;width:58%;z-index:2;container-type:size}
      /* soft light disc behind the cat's head, with one hairline ring */
      .vc-halo{position:absolute;left:52%;top:46%;width:min(82cqw,76cqh);aspect-ratio:1;border-radius:50%;translate:-50% -50%;
        background:radial-gradient(circle at 50% 46%,rgba(255,255,255,.92) 0%,rgba(255,255,255,.45) 38%,rgba(255,255,255,0) 68%)}
      .vc-ring{position:absolute;inset:-2%;border-radius:50%;border:1px solid rgba(123,47,168,.12)}
      .vc-ring::after{content:'';position:absolute;inset:-1px;border-radius:50%;opacity:0;transition:opacity .4s;
        background:conic-gradient(from 0deg,rgba(242,140,40,.55),transparent 18%);
        -webkit-mask:radial-gradient(closest-side,transparent calc(100% - 2px),#000 calc(100% - 1px));mask:radial-gradient(closest-side,transparent calc(100% - 2px),#000 calc(100% - 1px));
        animation:vc-spin 3s linear infinite}
      .vc-vision .vc-ring::after{opacity:1}
      @keyframes vc-spin{to{rotate:360deg}}

      /* the cat: sits on the bottom edge and fills the height; never wider than the stage */
      .vc-cat-rise{position:absolute;bottom:0;right:-2%;width:min(104cqw,calc(var(--cat-height) * 1cqh * 1.46))}
      .vc-cat-layer{will-change:transform}
      .vc-cat-btn{display:block;width:100%;padding:0;border:0;background:none;cursor:pointer}
      .vc-cat-btn:focus-visible{outline:2px solid var(--vc-purple);outline-offset:-6px;border-radius:24px}
      .vc-cat-btn .cursor-cat,.vc-cat-btn canvas{width:100%!important;height:auto!important;display:block}
      .vc-stage::after{content:'';position:absolute;left:0;right:0;bottom:0;height:12%;background:linear-gradient(to top,#ece1f6,rgba(236,225,246,0));z-index:2;pointer-events:none}

      .vc-bubble{position:absolute;top:10%;left:18%;z-index:4;padding:10px 16px;border-radius:16px 16px 4px 16px;background:var(--vc-ink);color:#fff;font-weight:500;font-size:.9rem;
        opacity:0;transform:translateY(6px);transition:opacity .25s,transform .25s;pointer-events:none;max-width:240px}
      .vc-bubble.show{opacity:1;transform:none}

      .vc-chips{position:absolute;left:4%;top:50%;z-index:4;display:flex;flex-direction:column;align-items:flex-start;gap:10px}
      .vc-chip{display:flex;align-items:center;gap:12px;padding:10px 16px 10px 10px;border-radius:18px;text-decoration:none;color:var(--vc-ink);
        background:var(--vc-glass);border:1px solid rgba(255,255,255,.85);backdrop-filter:blur(16px) saturate(1.4);
        box-shadow:0 1px 0 rgba(255,255,255,.7) inset,0 18px 40px -18px rgba(60,20,100,.4);animation:vc-in .6s both cubic-bezier(.2,.7,.2,1);transition:transform .25s}
      .vc-chip:hover{transform:translateY(-2px)}
      .vc-chip small{display:block;font-size:.68rem;font-weight:600;text-transform:uppercase;letter-spacing:.12em;color:var(--vc-muted)}
      .vc-chip strong{display:block;font-size:.92rem;font-weight:600}
      .vc-chip-icon{display:grid;place-items:center;width:36px;height:36px;border-radius:12px;background:var(--vc-lilac);color:var(--vc-purple);flex:none}
      .vc-chip.is-active .vc-chip-icon{background:var(--vc-orange);color:#fff}

      .vc-playbar{position:absolute;left:50%;bottom:28px;translate:-50% 0;z-index:5;display:flex;gap:2px;padding:4px;border-radius:999px;white-space:nowrap;
        background:var(--vc-glass);border:1px solid rgba(255,255,255,.85);backdrop-filter:blur(16px) saturate(1.4);box-shadow:0 18px 40px -20px rgba(60,20,100,.45)}
      .vc-playbar button{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border:0;border-radius:999px;background:none;font:inherit;font-size:.82rem;font-weight:500;color:var(--vc-muted);cursor:pointer;transition:background .2s,color .2s}
      .vc-playbar button:hover{color:var(--vc-ink);background:rgba(255,255,255,.95)}
      .vc-playbar button[aria-pressed="true"]{background:var(--vc-ink);color:#fff}
      .vc-playbar button:focus-visible{outline:2px solid var(--vc-purple);outline-offset:2px}
      .vc-playbar .vc-icon{padding:8px 10px}

      .vc-calm .vc-ring::after,.vc-calm .vc-body,.vc-calm .vc-chip{animation:none}

      /* tablet & mobile: copy on top, cat rises from the bottom underneath */
      @media (max-width:1024px){
        .vc-hero{flex-direction:column;align-items:stretch;min-height:0}
        .vc-bg{background:
          radial-gradient(80% 45% at 50% 78%,rgba(160,98,214,.40) 0%,rgba(160,98,214,0) 75%),
          radial-gradient(50% 30% at 85% 95%,rgba(242,140,40,.14) 0%,rgba(242,140,40,0) 70%),
          radial-gradient(70% 35% at 0% 30%,rgba(255,214,176,.6) 0%,rgba(255,214,176,0) 70%),
          linear-gradient(180deg,#f7f3fb 0%,#f1e9f8 55%,#ece1f6 100%)}
        .vc-inner{order:1;padding-bottom:12px}
        .vc-copy{width:100%;max-width:600px}
        .vc-meta{margin-top:40px}
        .vc-stage{order:2;position:relative;width:100%;height:min(72svh,620px)}
        .vc-cat-rise{right:auto;left:50%;translate:-50% 0;width:min(110cqw,calc(var(--cat-height) * 1cqh * 1.46))}
        .vc-chips{left:16px;top:auto;bottom:84px}
        .vc-bubble{left:auto;right:6%;top:6%}
      }
      @media (max-width:640px){
        .vc-stage{height:min(60svh,480px)}
        .vc-chips{display:none}
        .vc-playbar{bottom:16px;max-width:calc(100% - 24px);overflow-x:auto;scrollbar-width:none}
        .vc-playbar button{padding:7px 10px}
      }
    `}</style>
  </section>;
}