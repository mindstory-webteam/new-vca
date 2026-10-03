import {CAT_FRAMES,type CatPose} from './cat-frames';

/**
 * Plays the cat frames (public/cat-frames/Layer N.avif) toward the cursor.
 * - Each pose in CAT_FRAMES looks toward one direction.
 * - Moving to the next/previous pose plays the real in-between frames
 *   from the video (forwards or backwards), so turns look natural.
 * - Bigger jumps cross-fade into the target pose's turn.
 */
export type CatAction='wave'|'laugh'|'peek'|'reset'|'next';
export type CatEngine={play:(action:CatAction)=>void;destroy:()=>void};
type Options={src?:(frame:number)=>string;idleAfterMs?:number;prepare?:(img:HTMLImageElement)=>CanvasImageSource};

/**
 * Removes a white background: near-white pixels connected to the image edge
 * become transparent (soft edges), white highlights inside the cat stay.
 */
export function keyWhitePixels(p:Uint8ClampedArray,w:number,h:number){
  const n=w*h,d=new Uint8Array(n),bg=new Uint8Array(n),stack=new Int32Array(n);let sp=0;
  for(let i=0;i<n;i++){const o=i*4;d[i]=255-Math.min(p[o],p[o+1],p[o+2])}
  const push=(i:number)=>{if(!bg[i]&&d[i]<45){bg[i]=1;stack[sp++]=i}};
  for(let x=0;x<w;x++){push(x);push((h-1)*w+x)}
  for(let y=0;y<h;y++){push(y*w);push(y*w+w-1)}
  while(sp){const i=stack[--sp],x=i%w;if(x>0)push(i-1);if(x<w-1)push(i+1);if(i>=w)push(i-w);if(i<n-w)push(i+w)}
  for(let i=0;i<n;i++){
    if(!bg[i])continue;
    let t=(d[i]-6)/39;t=t<0?0:t>1?1:t;const a=t*t*(3-2*t);const o=i*4;
    if(a<=0.001){p[o+3]=0;continue}
    for(let c=0;c<3;c++)p[o+c]=Math.max(0,Math.min(255,(p[o+c]-(1-a)*255)/a)); // remove white fringe
    p[o+3]=Math.round(a*255);
  }
}

const IDLE=0; // index of the "thinking" pose

export function createCatEngine(canvas:HTMLCanvasElement,opts:Options={}):CatEngine{
  const cfg=CAT_FRAMES;
  const poses:CatPose[]=cfg.poses;
  const src=opts.src||((f:number)=>cfg.path+encodeURIComponent(cfg.file.replace('{n}',String(f))));
  /** crop the layer to the cat, scale it, and remove the white background (once per layer) */
  const prepare=opts.prepare||((img:HTMLImageElement):CanvasImageSource=>{
    const c=document.createElement('canvas');c.width=cfg.width;c.height=cfg.height;
    const x=c.getContext('2d',{willReadFrequently:true})!;
    const k=img.naturalWidth/1930; // in case the layers were exported at another size
    x.drawImage(img,cfg.crop.x*k,cfg.crop.y*k,cfg.crop.w*k,cfg.crop.h*k,0,0,cfg.width,cfg.height);
    if(cfg.removeWhite){const data=x.getImageData(0,0,cfg.width,cfg.height);keyWhitePixels(data.data,cfg.width,cfg.height);x.putImageData(data,0,0)}
    return c;
  });
  const idleAfter=opts.idleAfterMs??7000;
  const ctx=canvas.getContext('2d')!;
  const images=new Map<number,CanvasImageSource>();
  const W=cfg.width+cfg.pad*2,H=cfg.height;

  let poseIdx=IDLE;                // pose we are at (or heading to); -1 = in a clip
  let current=poses[IDLE].hold;    // frame on screen
  let queue:number[]=[];           // frames still to play
  let holdUntil=0;                 // keep the last clip frame for a moment
  let ghost:{frame:number;alpha:number}|null=null; // cross-fade layer
  let target={x:0,y:0},smooth={x:0,y:0},lastMove=-1e9,pointerInside=false;
  let clicks=0,raf=0,last=0,acc=0,visible=true,destroyed=false,dirty=true;
  const reduceQuery=matchMedia('(prefers-reduced-motion: reduce)');
  const reduced=()=>reduceQuery.matches||document.documentElement.dataset.reducedMotion==='true';

  /* ---------- loading: hold frames first, then turns, then clips ---------- */
  const order=[...poses.map(p=>p.hold),...poses.flatMap(p=>p.into),...cfg.clips.wave,...cfg.clips.laugh];
  const seen=new Set<number>();
  (async()=>{
    for(const f of order){
      if(seen.has(f)||destroyed)continue;seen.add(f);
      const img=new Image();img.decoding='async';img.src=src(f);
      try{
        await img.decode();if(destroyed)return;
        images.set(f,prepare(img));if(f===current)dirty=true;
        await new Promise(r=>setTimeout(r,0)); // keep the page responsive while preparing
      }catch{console.warn('Cat frame not found:',img.src)}
    }
  })();

  /* ---------- sizing ---------- */
  function resize(){
    const dpr=Math.min(window.devicePixelRatio||1,2);
    const w=Math.max(1,Math.round(canvas.clientWidth*dpr));
    const h=Math.round(w*H/W);
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;dirty=true}
  }
  const ro=new ResizeObserver(resize);ro.observe(canvas);resize();

  /* ---------- drawing ---------- */
  function drawFrame(f:number,alpha:number){
    const img=images.get(f);if(!img)return false;
    const s=canvas.width/W;
    ctx.globalAlpha=alpha;
    ctx.drawImage(img,(cfg.pad+(cfg.dx[f]||0))*s,0,cfg.width*s,cfg.height*s);
    ctx.globalAlpha=1;
    return true;
  }
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(!drawFrame(current,1)){
      // frame not loaded yet: show the nearest loaded hold frame
      const fallback=poses[Math.max(0,poseIdx)].hold;
      drawFrame(images.has(fallback)?fallback:poses[IDLE].hold,1);
    }
    if(ghost)drawFrame(ghost.frame,ghost.alpha);
  }

  /* ---------- choosing a pose for the cursor ---------- */
  function wantedPose(now:number){
    if(!pointerInside||now-lastMove>idleAfter)return IDLE;
    const {x,y}=target;
    if(Math.hypot(x,y)<0.18)return poses.findIndex(p=>p.id==='p090');
    let best=-1,bestD=Infinity;
    poses.forEach((p,i)=>{if(i===IDLE)return;const d=Math.hypot(p.x-x,p.y-y);if(d<bestD){bestD=d;best=i}});
    // a little stickiness so the cat doesn't flicker on borders
    if(poseIdx>0&&poseIdx!==best){const cur=poses[poseIdx];if(Math.hypot(cur.x-x,cur.y-y)<bestD+0.12)return poseIdx}
    return best;
  }

  function startGhost(){ghost={frame:current,alpha:1}}

  function goTo(next:number){
    if(next===poseIdx||next<0)return;
    const to=poses[next];
    if(reduced()){queue=[to.hold];poseIdx=next;return}
    if(poseIdx>=0&&next===poseIdx+1){
      queue=[...to.into,to.hold];                         // play the real turn forwards
    }else if(poseIdx>=0&&next===poseIdx-1){
      queue=[...poses[poseIdx].into].reverse().concat(to.hold); // play it backwards
    }else{
      startGhost();                                        // bigger jump: cross-fade into the turn
      queue=[...to.into.slice(Math.floor(to.into.length/2)),to.hold];
    }
    poseIdx=next;
  }

  /* ---------- actions (click / hero buttons) ---------- */
  function play(action:CatAction){
    if(action==='next')action=(clicks++%2===0)?'wave':'laugh';
    if(action==='reset'){lastMove=-1e9;goTo(IDLE);return}
    if(reduced()){
      const clip=action==='peek'?[poses[7].hold]:cfg.clips[action as 'wave'|'laugh'];
      queue=[clip[clip.length-1]];poseIdx=-1;holdUntil=performance.now()+1200;return;
    }
    if(action==='peek'){
      // the original footage: look around from pose to pose
      const from=Math.max(2,poseIdx>=0?poseIdx:2);
      const frames:number[]=[];
      if(poseIdx!==from)startGhost();
      for(let k=from+1;k<poses.length;k++){frames.push(...poses[k].into);for(let r=0;r<5;r++)frames.push(poses[k].hold)}
      queue=frames;poseIdx=poses.length-1;holdUntil=performance.now()+frames.length*cfg.frameMs+300;return;
    }
    startGhost();
    queue=[...cfg.clips[action]];poseIdx=-1;
    holdUntil=performance.now()+queue.length*cfg.frameMs+(action==='laugh'?1100:600);
  }

  /* ---------- pointer ---------- */
  function onMove(e:PointerEvent){
    const r=canvas.getBoundingClientRect();if(!r.width)return;
    const cx=r.left+r.width/2,cy=r.top+r.height*0.36; // roughly the cat's eyes
    const sx=Math.max(window.innerWidth*0.32,220),sy=Math.max(window.innerHeight*0.32,200);
    target={x:Math.max(-1,Math.min(1,(e.clientX-cx)/sx)),y:Math.max(-1,Math.min(1,(e.clientY-cy)/sy))};
    lastMove=performance.now();pointerInside=true;
  }
  const onLeave=()=>{pointerInside=false};
  window.addEventListener('pointermove',onMove,{passive:true});
  window.addEventListener('pointerdown',onMove,{passive:true});
  document.documentElement.addEventListener('pointerleave',onLeave);
  window.addEventListener('blur',onLeave);

  const io=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible&&!raf){last=performance.now();raf=requestAnimationFrame(tick)}});
  io.observe(canvas);

  /* ---------- loop ---------- */
  function tick(now:number){
    raf=0;if(destroyed||!visible)return;
    const dt=Math.min(100,now-last);last=now;acc+=dt;
    while(acc>=cfg.frameMs){
      acc-=cfg.frameMs;
      if(queue.length){
        let f=queue.shift()!;
        while(!images.has(f)&&queue.length)f=queue.shift()!; // skip frames still loading
        if(images.has(f)){current=f;dirty=true}
      }else if(now>=holdUntil){
        goTo(wantedPose(now));
      }
    }
    if(ghost){ghost.alpha-=dt/170;dirty=true;if(ghost.alpha<=0)ghost=null}
    // gentle lean toward the cursor between poses
    const k=reduced()?1:Math.min(1,dt/180);
    const tx=pointerInside?target.x:0,ty=pointerInside?target.y:0;
    smooth.x+=(tx-smooth.x)*k;smooth.y+=(ty-smooth.y)*k;
    canvas.style.transform=reduced()?'':`translate(${(smooth.x*8).toFixed(2)}px,${(smooth.y*5).toFixed(2)}px) rotate(${(smooth.x*1.6).toFixed(2)}deg)`;
    if(dirty){draw();dirty=false}
    raf=requestAnimationFrame(tick);
  }
  last=performance.now();raf=requestAnimationFrame(tick);

  return {
    play,
    destroy(){
      destroyed=true;cancelAnimationFrame(raf);ro.disconnect();io.disconnect();
      window.removeEventListener('pointermove',onMove);window.removeEventListener('pointerdown',onMove);
      document.documentElement.removeEventListener('pointerleave',onLeave);window.removeEventListener('blur',onLeave);
    },
  };
}