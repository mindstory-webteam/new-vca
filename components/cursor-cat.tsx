'use client';
import {forwardRef,useEffect,useImperativeHandle,useRef} from 'react';
import {createCatEngine,type CatAction,type CatEngine} from '@/lib/cat-engine';
import {CAT_FRAMES} from '@/lib/cat-frames';

export type CursorCatHandle={play:(action:CatAction)=>void};

/**
 * The Viral Cat from the video, turning to look at the cursor frame by frame.
 * interactive: clicking the cat makes it wave / laugh (leave off when a parent button handles clicks).
 */
export const CursorCat=forwardRef<CursorCatHandle,{className?:string;interactive?:boolean;label?:string}>(function CursorCat({className='',interactive=false,label='Viral Cat, looking toward your cursor'},ref){
  const canvas=useRef<HTMLCanvasElement>(null);
  const engine=useRef<CatEngine|null>(null);

  useImperativeHandle(ref,()=>({play:action=>engine.current?.play(action)}),[]);
  useEffect(()=>{
    if(!canvas.current)return;
    engine.current=createCatEngine(canvas.current);
    return()=>{engine.current?.destroy();engine.current=null};
  },[]);

  const ratio=`${CAT_FRAMES.width+CAT_FRAMES.pad*2} / ${CAT_FRAMES.height}`;

  const inner=<>
    <canvas ref={canvas} className="cursor-cat-canvas" style={{aspectRatio:ratio}} aria-hidden="true"/>
    <style>{`
      .cursor-cat{position:relative;display:block;width:100%;line-height:0}
      .cursor-cat-canvas{display:block;width:100%;height:auto;
        -webkit-mask-image:linear-gradient(to bottom,#000 82%,transparent 100%);mask-image:linear-gradient(to bottom,#000 82%,transparent 100%);
        will-change:transform;transform-origin:50% 90%}
      button.cursor-cat{border:0;background:none;padding:0;cursor:pointer}
      button.cursor-cat:focus-visible{outline:3px solid #7b2fa8;outline-offset:6px;border-radius:24px}
    `}</style>
  </>;

  return interactive
    ?<button type="button" className={'cursor-cat '+className} aria-label={label+'. Click to say hello.'} onClick={()=>engine.current?.play('next')}>{inner}</button>
    :<span className={'cursor-cat '+className} role="img" aria-label={label}>{inner}</span>;
});