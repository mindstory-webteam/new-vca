'use client';
import {forwardRef,useEffect,useImperativeHandle,useRef,useState} from 'react';
import type {RefObject} from 'react';
import {CatMascot} from '@/components/cat-mascot';
export type CatAction='spin'|'wave'|'jump'|'reset';
export type CatSceneHandle={act:(action:CatAction)=>void};
type Engine={act:(action:CatAction)=>void;wake:()=>void;dispose:()=>void};
export const CatThreeScene=forwardRef<CatSceneHandle,{progress:RefObject<number>;reduced:boolean;onReady:(ready:boolean)=>void;onReaction:(message:string)=>void}>(function CatThreeScene({progress,reduced,onReady,onReaction},ref){
 const host=useRef<HTMLDivElement>(null),engine=useRef<Engine|null>(null);const [ready,setReady]=useState(false);const latest=useRef({reduced,onReady,onReaction});latest.current={reduced,onReady,onReaction};
 useImperativeHandle(ref,()=>({act:action=>engine.current?.act(action)}),[]);
 useEffect(()=>{engine.current?.wake()},[reduced]);
 useEffect(()=>{const element=host.current;if(!element)return;let cancelled=false,booting=false;let resourceCleanup:(()=>void)|undefined;
 async function boot(){if(booting)return;booting=true;try{
  const [T,{createViralCat,sampleCatCamera},{RoomEnvironment}]=await Promise.all([import('three'),import('@/lib/cat-model'),import('three/addons/environments/RoomEnvironment.js')]);if(cancelled)return;
  const renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.65));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  const canvas=renderer.domElement;canvas.setAttribute('aria-label','Interactive 3D Viral Cat. Drag to turn. Use arrow keys to rotate, Enter to wave and R to reset.');canvas.setAttribute('role','img');canvas.tabIndex=0;canvas.className='cat-webgl-canvas';element!.appendChild(canvas);
  const scene=new T.Scene();const camera=new T.PerspectiveCamera(36,1,.1,60);const pmrem=new T.PMREMGenerator(renderer);const room=new RoomEnvironment();const envTarget=pmrem.fromScene(room,.045);scene.environment=envTarget.texture;scene.environmentIntensity=.75;room.dispose();pmrem.dispose();
  const mascot=createViralCat();scene.add(mascot.root);
  scene.add(new T.HemisphereLight(0xffffff,0x53236d,2.1));
  const key=new T.DirectionalLight(0xffe7ce,3.5);key.position.set(-4,6,7);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-4;key.shadow.camera.right=4;key.shadow.camera.top=5;key.shadow.camera.bottom=-4;key.shadow.normalBias=.035;scene.add(key);
  const fill=new T.DirectionalLight(0xd6bbff,2.7);fill.position.set(5,3,3);scene.add(fill);
  const rim=new T.DirectionalLight(0xffac40,4.2);rim.position.set(3,4,-4);scene.add(rim);
  const floor=new T.Mesh(new T.PlaneGeometry(20,20),new T.ShadowMaterial({opacity:.2}));floor.rotation.x=-Math.PI/2;floor.position.y=-2.27;floor.receiveShadow=true;scene.add(floor);
  const orbit=new T.Group();orbit.position.set(0,-.35,-.2);scene.add(orbit);const ringMaterial=new T.MeshBasicMaterial({color:0xffbb66,transparent:true,opacity:.25});
  for(let i=0;i<3;i++){const ring=new T.Mesh(new T.TorusGeometry(2.5+i*.27,.009,6,100),ringMaterial);ring.rotation.set(1.18+i*.2,.2+i*.4,i*.45);orbit.add(ring)}
  const pointData=new Float32Array(150);for(let i=0;i<50;i++){const a=i*2.399963;const radius=3+(i%7)*.4;pointData[i*3]=Math.cos(a)*radius;pointData[i*3+1]=Math.sin(a*.91)*3.5;pointData[i*3+2]=Math.sin(a)*radius-1.5}const dustGeometry=new T.BufferGeometry();dustGeometry.setAttribute('position',new T.BufferAttribute(pointData,3));const dust=new T.Points(dustGeometry,new T.PointsMaterial({color:0xe7bfff,size:.022,transparent:true,opacity:.48,sizeAttenuation:true}));scene.add(dust);
  const ray=new T.Raycaster(),pointer=new T.Vector2();let hoverX=0,hoverY=0,dragYaw=0,dragPitch=0,velocity=0,spin=0,spinTarget=0,renderProgress=progress.current,lastTime=0,clock=0,waveStart=-20,jumpStart=-20,glowStart=-20,visible=true,sceneChapter=-1,frameDrawn=false,dragging=false,pressed=false,moved=false,startX=0,startY=0,lastX=0,lastY=0,dirty=true;
  function act(action:CatAction){if(action==='reset'){dragYaw=0;dragPitch=0;velocity=0;spin=0;spinTarget=0;latest.current.onReaction('Back to a familiar face.')}else if(action==='spin'){if(latest.current.reduced)dragYaw+=Math.PI/2;else spinTarget+=Math.PI*2;latest.current.onReaction('Every side has a story.')}else if(action==='wave'){waveStart=clock;latest.current.onReaction('Hello, neighbour.')}else{jumpStart=clock;latest.current.onReaction('A little leap of curiosity.')}dirty=true;wake()}
  function pick(event:PointerEvent){const bounds=canvas.getBoundingClientRect();pointer.set(((event.clientX-bounds.left)/bounds.width)*2-1,-((event.clientY-bounds.top)/bounds.height)*2+1);ray.setFromCamera(pointer,camera);return ray.intersectObject(mascot.root,true)[0]}
  const down=(event:PointerEvent)=>{if(event.button!==0||!pick(event))return;pressed=true;moved=false;startX=lastX=event.clientX;startY=lastY=event.clientY;velocity=0;canvas.setPointerCapture(event.pointerId);canvas.classList.add('is-dragging')};
  const move=(event:PointerEvent)=>{const b=canvas.getBoundingClientRect();if(event.pointerType==='mouse'){hoverX=((event.clientX-b.left)/b.width-.5)*2;hoverY=((event.clientY-b.top)/b.height-.5)*2}if(pressed){const dx=event.clientX-lastX,dy=event.clientY-lastY;if(Math.abs(event.clientX-startX)+Math.abs(event.clientY-startY)>6)moved=true;if(moved){dragging=true;dragYaw+=dx*.012;dragPitch=T.MathUtils.clamp(dragPitch+dy*.004,-.3,.3);velocity=dx*.009}lastX=event.clientX;lastY=event.clientY}dirty=true;wake()};
  const up=(event:PointerEvent)=>{if(!pressed)return;pressed=false;dragging=false;canvas.classList.remove('is-dragging');if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);if(!moved){const hit=pick(event);if(hit?.object.name==='visor'){glowStart=clock;waveStart=clock;latest.current.onReaction('Cat Vision. Looking local.')}else act('wave')}dirty=true};
  const cancel=()=>{pressed=false;dragging=false;velocity=0;canvas.classList.remove('is-dragging')};const leave=()=>{if(!pressed){hoverX=0;hoverY=0;dirty=true}};
  const keyboard=(event:KeyboardEvent)=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();dragYaw+=(event.key==='ArrowRight'?1:-1)*.3;dirty=true;wake()}else if(event.key==='Enter'||event.key===' '){event.preventDefault();act('wave')}else if(event.key.toLowerCase()==='r')act('reset')};
  const resize=()=>{const w=element!.clientWidth,h=element!.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=camera.aspect<.8?42:36;camera.updateProjectionMatrix();dirty=true;wake()};
  function render(ms:number){const dt=Math.min(.045,lastTime?(ms-lastTime)/1000:.016);lastTime=ms;clock+=dt;const calm=latest.current.reduced;if(calm&&!dirty&&frameDrawn){renderer.setAnimationLoop(null);return}dirty=false;
   const target=calm?0:progress.current;const nextChapter=Math.min(3,Math.floor(target*4));if(nextChapter!==sceneChapter){if(nextChapter===3&&!calm)waveStart=clock;if(nextChapter===1&&!calm)glowStart=clock;sceneChapter=nextChapter}renderProgress=calm?0:T.MathUtils.lerp(renderProgress,target,1-Math.exp(-dt*7));const pose=sampleCatCamera(renderProgress);
   if(!pressed&&!calm){dragYaw+=velocity;velocity*=Math.exp(-dt*7)}else velocity=0;spin=calm?spinTarget:T.MathUtils.lerp(spin,spinTarget,1-Math.exp(-dt*4.3));
   const wavePhase=T.MathUtils.clamp((clock-waveStart)/2.5,0,1),wave=calm?0:Math.sin(wavePhase*Math.PI);const jumpPhase=T.MathUtils.clamp((clock-jumpStart)/1.05,0,1),jump=calm?0:Math.sin(jumpPhase*Math.PI)*.68;const breathe=calm?0:Math.sin(clock*1.8)*.028;
   mascot.root.position.set(Math.sin(renderProgress*Math.PI*2)*.12,pose.lift+breathe+jump,0);mascot.root.rotation.set(dragPitch,pose.yaw+dragYaw+spin,pose.roll+(calm?0:Math.sin(clock*.8)*.012));mascot.root.scale.setScalar(pose.scale);mascot.root.scale.y*=1+Math.sin(jumpPhase*Math.PI)*.045;
   mascot.head.rotation.y=calm?0:T.MathUtils.lerp(mascot.head.rotation.y,hoverX*.13,dt*5);mascot.head.rotation.x=calm?0:T.MathUtils.lerp(mascot.head.rotation.x,hoverY*.075-Math.sin(wavePhase*Math.PI*2)*.025,dt*5);mascot.head.rotation.z=calm?0:Math.sin(clock*.9)*.018;
   mascot.armRight.rotation.z=wave*(2.2+Math.sin(clock*12)*.17);mascot.armRight.rotation.x=-wave*.32;mascot.armRight.position.z=wave*.53;mascot.tail.rotation.z=calm?0:Math.sin(clock*2.4)*.12;mascot.tail.rotation.y=calm?0:Math.sin(clock*1.8)*.08;mascot.earLeft.rotation.z=.17+(calm?0:Math.sin(clock*2.2)*.025);mascot.earRight.rotation.z=-.17+(calm?0:Math.sin(clock*2.2+.5)*.025);
   const glow=calm?0:Math.max(0,1-(clock-glowStart)/1.4);mascot.glass.emissive.setHex(0xff8500);mascot.glass.emissiveIntensity=glow*.3;
   camera.position.set(...pose.camera);camera.lookAt(...pose.look);orbit.rotation.y=calm?0:clock*.025+renderProgress*.7;dust.rotation.y=calm?0:clock*.012;renderer.render(scene,camera);
   if(!frameDrawn){frameDrawn=true;setReady(true);latest.current.onReady(true)}
  }
  function wake(){if(visible&&!document.hidden&&!cancelled){lastTime=0;renderer.setAnimationLoop(render)}}
  const visibility=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){dirty=true;wake()}else renderer.setAnimationLoop(null)},{rootMargin:'80px'});visibility.observe(element!);
  const documentVisibility=()=>{if(document.hidden)renderer.setAnimationLoop(null);else{dirty=true;wake()}};document.addEventListener('visibilitychange',documentVisibility);
  const observer=new ResizeObserver(resize);observer.observe(element!);canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',cancel);canvas.addEventListener('pointerleave',leave);canvas.addEventListener('keydown',keyboard);
  const lost=(event:Event)=>{event.preventDefault();renderer.setAnimationLoop(null);setReady(false);latest.current.onReady(false)};canvas.addEventListener('webglcontextlost',lost);
  resourceCleanup=()=>{renderer.setAnimationLoop(null);visibility.disconnect();observer.disconnect();document.removeEventListener('visibilitychange',documentVisibility);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',cancel);canvas.removeEventListener('pointerleave',leave);canvas.removeEventListener('keydown',keyboard);canvas.removeEventListener('webglcontextlost',lost);scene.traverse(obj=>{const mesh=obj as typeof mascot.lens;if(mesh.geometry)mesh.geometry.dispose();const mat=mesh.material;if(Array.isArray(mat))mat.forEach(m=>m.dispose());else mat?.dispose()});envTarget.dispose();renderer.dispose();canvas.remove()};
  engine.current={act,wake:()=>{dirty=true;wake()},dispose:resourceCleanup};resize();wake();
 }catch{resourceCleanup?.();latest.current.onReady(false)}}
 const warmup=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){void boot();warmup.disconnect()}},{rootMargin:'550px'});warmup.observe(element);return()=>{cancelled=true;warmup.disconnect();engine.current?.dispose();engine.current=null};
 },[progress]);
 return <div className={'cat-real-scene '+(ready?'scene-ready':'')} ref={host}>{!ready&&<div className="cat-scene-fallback"><CatMascot/></div>}</div>
});
