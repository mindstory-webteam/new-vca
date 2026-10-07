'use client';

import React,{useEffect,useRef} from 'react';
import * as THREE from 'three';

interface GridDistortionProps{
  imageSrc:string;
  grid?:number;        // distortion cells per side (higher = finer ripples)
  mouse?:number;       // cursor radius, as a share of the grid
  strength?:number;    // how hard the cursor pushes
  relaxation?:number;  // how fast it settles back (0.9 = quick, 0.97 = slow)
  disabled?:boolean;   // reduced motion: draw the image still, no distortion
  className?:string;
}

const vertexShader=`
varying vec2 vUv;
void main(){
  vUv=uv;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
}`;

// uCover crops the image like CSS "object-fit: cover" so it never stretches
const fragmentShader=`
uniform sampler2D uDataTexture;
uniform sampler2D uTexture;
uniform vec2 uCover;
varying vec2 vUv;
void main(){
  vec4 offset=texture2D(uDataTexture,vUv);
  vec2 uv=(vUv-0.5)*uCover+0.5;
  gl_FragColor=texture2D(uTexture,uv-0.02*offset.rg);
}`;

/**
 * Grid distortion that listens to the cursor on the whole window,
 * so it still reacts when content sits on top of it (pointer-events:none on the wrapper is fine).
 */
const GridDistortion:React.FC<GridDistortionProps>=({imageSrc,grid=15,mouse=0.1,strength=0.15,relaxation=0.9,disabled=false,className=''})=>{
  const containerRef=useRef<HTMLDivElement>(null);

  useEffect(()=>{
    const container=containerRef.current;if(!container)return;

    const scene=new THREE.Scene();
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.setClearColor(0x000000,0);
    renderer.domElement.style.display='block';
    container.innerHTML='';
    container.appendChild(renderer.domElement);

    const camera=new THREE.OrthographicCamera(0,0,0,0,-1000,1000);
    camera.position.z=2;

    let imageAspect=1,ready=false,visible=true,raf=0;
    const uniforms={
      uTexture:{value:null as THREE.Texture|null},
      uDataTexture:{value:null as THREE.DataTexture|null},
      uCover:{value:new THREE.Vector2(1,1)},
    };

    const size=grid;
    const data=new Float32Array(4*size*size); // starts flat (no initial scramble)
    const dataTexture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat,THREE.FloatType);
    dataTexture.magFilter=THREE.LinearFilter;dataTexture.minFilter=THREE.LinearFilter;
    dataTexture.needsUpdate=true;
    uniforms.uDataTexture.value=dataTexture;

    const material=new THREE.ShaderMaterial({uniforms,vertexShader,fragmentShader,transparent:true});
    const geometry=new THREE.PlaneGeometry(1,1,size-1,size-1);
    const plane=new THREE.Mesh(geometry,material);
    scene.add(plane);

    const handleResize=()=>{
      const {width,height}=container.getBoundingClientRect();
      if(!width||!height)return;
      const aspect=width/height;
      renderer.setSize(width,height,false);
      renderer.domElement.style.width='100%';renderer.domElement.style.height='100%';
      plane.scale.set(aspect,1,1);
      camera.left=-aspect/2;camera.right=aspect/2;camera.top=.5;camera.bottom=-.5;
      camera.updateProjectionMatrix();
      if(aspect>imageAspect)uniforms.uCover.value.set(1,imageAspect/aspect);
      else uniforms.uCover.value.set(aspect/imageAspect,1);
      if(ready)renderer.render(scene,camera);
    };

    new THREE.TextureLoader().load(imageSrc,texture=>{
      texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;
      texture.wrapS=THREE.ClampToEdgeWrapping;texture.wrapT=THREE.ClampToEdgeWrapping;
      texture.colorSpace=THREE.SRGBColorSpace;
      imageAspect=texture.image.width/texture.image.height;
      uniforms.uTexture.value=texture;ready=true;
      handleResize();
      container.dataset.ready='true';
    });

    const ro=new ResizeObserver(handleResize);ro.observe(container);

    const m={x:-10,y:-10,prevX:0,prevY:0,vX:0,vY:0,has:false};
    const onMove=(e:PointerEvent)=>{
      if(e.pointerType!=='mouse')return;
      const r=container.getBoundingClientRect();
      const x=(e.clientX-r.left)/r.width,y=1-(e.clientY-r.top)/r.height;
      if(x<0||x>1||y<0||y>1){m.has=false;m.vX=m.vY=0;return}
      if(m.has){m.vX=x-m.prevX;m.vY=y-m.prevY}
      Object.assign(m,{x,y,prevX:x,prevY:y,has:true});
    };
    const onLeave=()=>{m.has=false;m.vX=m.vY=0};
    if(!disabled){window.addEventListener('pointermove',onMove,{passive:true});document.documentElement.addEventListener('pointerleave',onLeave)}

    const io=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible&&!raf&&!disabled)raf=requestAnimationFrame(animate)});
    io.observe(container);

    function animate(){
      raf=0;if(!visible)return;
      const d=dataTexture.image.data as Float32Array;
      for(let i=0;i<size*size;i++){d[i*4]*=relaxation;d[i*4+1]*=relaxation}
      if(m.has){
        const gx=size*m.x,gy=size*m.y,maxDist=size*mouse;
        for(let i=0;i<size;i++)for(let j=0;j<size;j++){
          const distSq=(gx-i)**2+(gy-j)**2;
          if(distSq<maxDist*maxDist){
            const idx=4*(i+size*j),power=Math.min(maxDist/Math.sqrt(distSq||1e-4),10);
            d[idx]=Math.max(-60,Math.min(60,d[idx]+strength*100*m.vX*power));
            d[idx+1]=Math.max(-60,Math.min(60,d[idx+1]-strength*100*m.vY*power));
          }
        }
        m.vX*=.9;m.vY*=.9; // stop pushing when the cursor rests
      }
      dataTexture.needsUpdate=true;
      if(ready)renderer.render(scene,camera);
      raf=requestAnimationFrame(animate);
    }
    if(!disabled)raf=requestAnimationFrame(animate);

    return()=>{
      cancelAnimationFrame(raf);ro.disconnect();io.disconnect();
      window.removeEventListener('pointermove',onMove);document.documentElement.removeEventListener('pointerleave',onLeave);
      geometry.dispose();material.dispose();dataTexture.dispose();uniforms.uTexture.value?.dispose();
      renderer.dispose();renderer.forceContextLoss();
      if(container.contains(renderer.domElement))container.removeChild(renderer.domElement);
      delete container.dataset.ready;
    };
  },[grid,mouse,strength,relaxation,imageSrc,disabled]);

  return <div ref={containerRef} className={className} style={{position:'relative',overflow:'hidden',width:'100%',height:'100%',minWidth:0,minHeight:0}}/>;
};

export default GridDistortion;