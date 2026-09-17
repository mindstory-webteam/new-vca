import * as T from 'three';
import {clearPath,pickups,PICKUP_RADIUS,RUN_SPEED,SPAWN,WALK_SPEED,type Point} from '@/lib/cat-walk-world';
import {createOriginalCatSprite} from '@/lib/original-cat-sprite';
import {createQuestWorld,hopRings} from '@/lib/cat-quest-world';
import {CAMERA_OFFSET,START_HEADING,findWalkRoute,followHeading} from '@/lib/cat-quest-motion';
import type {Neighbour} from '@/lib/cat-neighbours';
export type WalkInput={x:number;y:number;run:boolean;jump:boolean};
export type WalkEngine={pause:(v:boolean)=>void;restore:(position:Point,collected:string[])=>void;input:WalkInput;orbit:(dx:number,dy:number)=>void;resetCamera:()=>void;interact:()=>void;dispose:()=>void};
type Callbacks={onSample:(p:Point)=>void;onPickup:(id:string)=>void;onFrame:(p:Point,cameraYaw:number,heading:number)=>void;onLost:()=>void;onNearby:(person:Neighbour|null)=>void;onTalk:(person:Neighbour)=>void;onMoment:(message:string)=>void};

export async function createWalkEngine(host:HTMLElement,callbacks:Callbacks):Promise<WalkEngine>{
 const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,window.innerWidth<760?1.3:1.7));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const canvas=renderer.domElement;canvas.className='cat-walk-canvas';canvas.tabIndex=0;canvas.setAttribute('role','application');canvas.setAttribute('aria-label','Cat Street Pocket Adventure. Click a path to explore. W or up goes forward, S or down reverses, A and D steer and turn the view. Space hops. E talks. Q and R orbit the camera. Escape pauses.');host.appendChild(canvas);
 const scene=new T.Scene();scene.background=new T.Color(0xd9e4ed);scene.add(new T.HemisphereLight(0xfff9eb,0x8a71a0,2.8));const sun=new T.DirectionalLight(0xfff1d3,2.6);sun.position.set(-22,36,14);sun.castShadow=true;sun.shadow.mapSize.set(window.innerWidth<760?1024:1536,window.innerWidth<760?1024:1536);Object.assign(sun.shadow.camera,{left:-38,right:38,top:38,bottom:-38,far:110});sun.shadow.normalBias=.04;scene.add(sun);
 const world=createQuestWorld(scene);let cat:Awaited<ReturnType<typeof createOriginalCatSprite>>;
 try{cat=await createOriginalCatSprite();scene.add(cat.root)}catch(error){disposeScene();renderer.dispose();canvas.remove();throw error}
 const camera=new T.OrthographicCamera(-20,20,11,-11,.1,180);
 const input:WalkInput={x:0,y:0,run:false,jump:false},keys=new Set<string>();
 let position={...SPAWN},previous={...SPAWN},collected=new Set<string>(),heading=START_HEADING,cameraYaw=CAMERA_OFFSET,orbitOffset=0,pitch=.94,paused=true,disposed=false,last=0,clock=0,sampleTime=0,hudTime=0,jump=0,jumpVelocity=0,nearbyId:string|null=null,route:Point[]=[],dragging=false,dragged=false,dragX=0,dragY=0,pointerId=-1,visible=true;
 const calm=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.reducedMotion==='true';
 const point=(p:Point)=>({x:Number(p.x.toFixed(4)),z:Number(p.z.toFixed(4))});
 function sample(){callbacks.onSample(point(position));previous={...position};sampleTime=0}
 function cancelRoute(){route=[];world.target(null)}
 function clearInput(){cancelRoute();keys.clear();input.x=0;input.y=0;input.run=false;input.jump=false;dragging=false;if(pointerId>=0&&canvas.hasPointerCapture(pointerId))canvas.releasePointerCapture(pointerId);pointerId=-1}
 function interact(){if(paused)return;const who=world.nearest(position);if(who){cancelRoute();callbacks.onTalk(who)}}
 function orbit(dx:number,dy:number){orbitOffset-=dx*.006;pitch=T.MathUtils.clamp(pitch+dy*.003,.73,1.1)}
 const raycaster=new T.Raycaster(),ground=new T.Plane(new T.Vector3(0,1,0),-.1),hit=new T.Vector3();
 function goTo(clientX:number,clientY:number){if(paused)return;const b=canvas.getBoundingClientRect();raycaster.setFromCamera(new T.Vector2((clientX-b.left)/b.width*2-1,-(clientY-b.top)/b.height*2+1),camera);if(!raycaster.ray.intersectPlane(ground,hit))return;const next=findWalkRoute(position,{x:hit.x,z:hit.z});if(next.length){route=next;world.target(route.at(-1)!)}else callbacks.onMoment('Choose one of the cream paths to explore.')}
 const down=(e:PointerEvent)=>{if(e.button!==0)return;dragging=true;dragged=false;dragX=e.clientX;dragY=e.clientY;pointerId=e.pointerId;canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true})};
 const move=(e:PointerEvent)=>{if(!dragging)return;const dx=e.clientX-dragX,dy=e.clientY-dragY;if(Math.hypot(dx,dy)>5||dragged){dragged=true;orbit(dx,dy);dragX=e.clientX;dragY=e.clientY}};
 const up=(e:PointerEvent)=>{if(dragging&&!dragged)goTo(e.clientX,e.clientY);dragging=false;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);pointerId=-1};
 const cancel=()=>{dragging=false;dragged=false;pointerId=-1};
 const keydown=(e:KeyboardEvent)=>{if(paused||!host.contains(document.activeElement))return;const accepted=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft','ShiftRight','KeyE','KeyQ','KeyR'];if(!accepted.includes(e.code))return;e.preventDefault();if(e.code==='KeyE'){if(!e.repeat)interact();return}if(e.code==='Space'){if(!e.repeat)input.jump=true;return}keys.add(e.code)};
 const keyup=(e:KeyboardEvent)=>keys.delete(e.code);
 const lost=(e:Event)=>{e.preventDefault();paused=true;clearInput();renderer.setAnimationLoop(null);callbacks.onLost()};
 canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',cancel);canvas.addEventListener('webglcontextlost',lost);window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);window.addEventListener('blur',clearInput);
 function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);const half=w<600?11.8:11;camera.left=-half*w/h;camera.right=half*w/h;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix()}
 const observer=new ResizeObserver(resize);observer.observe(host);resize();
 const focus=new T.Vector3(position.x,0,position.z-2),desiredFocus=new T.Vector3(),cameraPosition=new T.Vector3();
 function render(ms:number){if(disposed)return;const dt=Math.min(.035,last?(ms-last)/1000:.016);last=ms;clock+=dt;const reduced=calm();let speed=0;
  if(!paused){
   const steering=T.MathUtils.clamp(input.x+(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0),-1,1);
   const forward=T.MathUtils.clamp(input.y+(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0),-1,1);
   if(Math.abs(steering)>.08||Math.abs(forward)>.08)cancelRoute();
   heading-=steering*dt*2.25;
   if(keys.has('KeyQ'))orbitOffset+=dt*1.5;if(keys.has('KeyR'))orbitOffset-=dt*1.5;
   const pace=input.run||keys.has('ShiftLeft')||keys.has('ShiftRight')?RUN_SPEED:WALK_SPEED;
   let dx=0,dz=0;
   if(route.length){const target=route[0],x=target.x-position.x,z=target.z-position.z,d=Math.hypot(x,z);if(d<.035){sample();route.shift();if(!route.length)world.target(null)}else{const step=Math.min(d,pace*dt);dx=x/d*step;dz=z/d*step;heading=followHeading(heading,Math.atan2(x,z),dt,10)}}
   else {dx=Math.sin(heading)*forward*pace*dt;dz=Math.cos(heading)*forward*pace*dt}
   if(dx||dz){const before={...position},next={x:position.x+dx,z:position.z+dz};if(clearPath(position,next))position=next;else{if(route.length)cancelRoute();const xOnly={x:position.x+dx,z:position.z};if(clearPath(position,xOnly))position=xOnly;const zOnly={x:position.x,z:position.z+dz};if(clearPath(position,zOnly))position=zOnly}speed=Math.hypot(position.x-before.x,position.z-before.z)/dt;if(!clearPath(previous,position)){callbacks.onSample(point(before));sample()}}
   if(input.jump){input.jump=false;if(jump===0){jumpVelocity=6.4;const pad=hopRings.find(p=>Math.hypot(p.x-position.x,p.z-position.z)<1.5);if(pad){if(!reduced)world.celebrate(position);callbacks.onMoment('Perfect pounce! Keep following your curiosity.')}}}
   if(jump>0||jumpVelocity>0){jumpVelocity-=17*dt;jump=Math.max(0,jump+jumpVelocity*dt)}
   for(const p of pickups){if(!collected.has(p.id)&&Math.hypot(p.x-position.x,p.z-position.z)<=PICKUP_RADIUS){sample();collected.add(p.id);world.setCollected([...collected]);if(!reduced)world.celebrate(position);callbacks.onPickup(p.id)}}
   sampleTime+=dt;if(sampleTime>.14&&Math.hypot(position.x-previous.x,position.z-previous.z)>.01)sample();
  }
  cat.root.position.set(position.x,0,position.z);cat.update(paused?0:dt,speed,jump,heading,reduced);
  // Movement heading is independent from camera yaw, so holding a turn never feeds back into movement.
  cameraYaw=followHeading(cameraYaw,heading-Math.PI+CAMERA_OFFSET+orbitOffset,dt,reduced?100:4.5);
  desiredFocus.set(position.x+Math.sin(heading)*2.0,.1,position.z+Math.cos(heading)*2.0);focus.lerp(desiredFocus,1-Math.exp(-dt*7));cameraPosition.set(focus.x+Math.sin(cameraYaw)*38*Math.cos(pitch),focus.y+38*Math.sin(pitch),focus.z+Math.cos(cameraYaw)*38*Math.cos(pitch));camera.position.copy(cameraPosition);camera.lookAt(focus);
  world.update(dt,position,paused,reduced);const neighbour=paused?null:world.nearest(position);if((neighbour?.id||null)!==nearbyId){nearbyId=neighbour?.id||null;callbacks.onNearby(neighbour)}
  hudTime+=dt;if(hudTime>.12){hudTime=0;callbacks.onFrame({...position},cameraYaw,heading)}renderer.render(scene,camera);
 }
 function syncVisibility(){if(!document.hidden&&visible){last=0;renderer.setAnimationLoop(render)}else{clearInput();renderer.setAnimationLoop(null)}}
 const visibility=new IntersectionObserver(entries=>{visible=!!entries[0]?.isIntersecting;syncVisibility()});visibility.observe(host);document.addEventListener('visibilitychange',syncVisibility);renderer.setAnimationLoop(render);
 function disposeScene(){const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();scene.traverse(o=>{const m=o as T.Mesh;if(m.geometry)geometries.add(m.geometry);if(Array.isArray(m.material))m.material.forEach(a=>materials.add(a));else if(m.material)materials.add(m.material)});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());world.dispose()}
 return {input,orbit,interact,resetCamera(){orbitOffset=0;pitch=.94},pause(v){const wasRunning=!paused;paused=v;if(v&&wasRunning)sample();clearInput();cancelRoute();callbacks.onFrame({...position},cameraYaw,heading);if(v){nearbyId=null;callbacks.onNearby(null)}else{last=0;canvas.focus({preventScroll:true})}},restore(p,ids){position={...p};previous={...p};collected=new Set(ids);world.setCollected(ids);jump=0;jumpVelocity=0;cancelRoute();nearbyId=null;callbacks.onNearby(null)},dispose(){disposed=true;renderer.setAnimationLoop(null);observer.disconnect();visibility.disconnect();document.removeEventListener('visibilitychange',syncVisibility);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',cancel);canvas.removeEventListener('webglcontextlost',lost);window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',clearInput);disposeScene();cat.dispose();renderer.dispose();canvas.remove()}};
}
