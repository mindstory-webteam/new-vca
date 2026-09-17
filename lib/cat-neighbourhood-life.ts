import * as T from 'three';
import {buildings,type Point} from './cat-walk-world';
import {neighbours,type Neighbour} from './cat-neighbours';

/** Background life is visual and nonblocking; it never creates reward events. */
export function createNeighbourhoodLife(scene:T.Scene) {
 const root=new T.Group();root.name='The people and small moments of Cat Street';scene.add(root);
 const textures:T.Texture[]=[];
 const materials=new Map<number,T.MeshStandardMaterial>();
 const mat=(c:number)=>{if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:c,roughness:.78}));return materials.get(c)!};
 const sphereGeo=new T.SphereGeometry(1,14,10),boxGeo=new T.BoxGeometry(1,1,1),cylinderGeo=new T.CylinderGeometry(1,1,1,12);
 const staticMeshes:T.Mesh[]=[],movingMeshes:T.Mesh[]=[];
 let dynamic=false;
 function mesh(parent:T.Object3D,geo:T.BufferGeometry,c:number,x:number,y:number,z:number,sx:number,sy:number,sz:number) {const m=new T.Mesh(geo,mat(c));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);(dynamic?movingMeshes:staticMeshes).push(m);return m}
 const ball=(p:T.Object3D,c:number,x:number,y:number,z:number,a:number,b:number,d:number)=>mesh(p,sphereGeo,c,x,y,z,a,b,d);
 const box=(p:T.Object3D,c:number,x:number,y:number,z:number,a:number,b:number,d:number)=>mesh(p,boxGeo,c,x,y,z,a,b,d);
 const cylinder=(p:T.Object3D,c:number,x:number,y:number,z:number,r:number,h:number)=>mesh(p,cylinderGeo,c,x,y,z,r,h,r);
 // Shopfront detail stays within the existing building collision footprints.
 for(const [i,b] of buildings.entries()) {
  for(const side of [-1,1]) {
   const x=b.x+side*(b.w/2-.5),z=b.z+b.d/2+.13;
   box(root,0xb66644,x,.42,z,.65,.64,.44);
   for(let n=0;n<4;n++){const xx=x+(n%2-.5)*.28,zz=z+(Math.floor(n/2)-.5)*.15;ball(root,0x5c9151,xx,.83,zz,.23,.27,.19);ball(root,[0xffbe47,0xf48dc3,0xf6e2a9][i%3],xx,1.04,zz,.12,.11,.12)}
  }
  // Rooftop gardens and pennant poles bring life above the shop awnings.
  box(root,0x85489b,b.x-2,b.h+.8,b.z-2,.8,.55,.8);ball(root,0x619970,b.x-2,b.h+1.3,b.z-2,.55,.55,.55);
  for(let n=0;n<3;n++) {box(root,0xd3c6d9,b.x-1+n,b.h+.52,b.z+.6,.76,.08,1.3);box(root,0x475575,b.x-1+n,b.h+.58,b.z+.6,.66,.04,1.16)}
 }
 // A planted boundary makes the limits of the playable neighbourhood visible.
 for(let i=-28;i<=28;i+=2.8)for(const side of [-1,1]) {
  ball(root,0x527e62,side*30,.56,i,1,.64,1.6);
  if(Math.abs(i)>4)ball(root,0x62916a,i,.5,side*30,1.6,.58,.9);
 }
 // Distant city blocks, beyond the playable streets.
 for(let i=0;i<15;i++){const h=7+(i*7%9);box(root,[0xa1b9cd,0xb7a3d0,0x95b9b6][i%3],-44+i*6,h/2,-39-(i%3)*3,4.5,h,4);for(let y=2;y<h-1;y+=2)box(root,0xe2dbcf,-44+i*6,y,-36.94-(i%3)*3,2.9,.65,.03)}
 // A little garden fountain beyond the eastern boundary: the safe route stays open.
 cylinder(root,0xe9cbae,34,.28,17,2.8,.45);cylinder(root,0x68c9cd,34,.54,17,2.48,.09);cylinder(root,0xc0a4be,34,1.1,17,.42,1.15);cylinder(root,0xebccaf,34,1.62,17,1,.19);
 // Cafe counter displays are behind the front window.
 for(const b of buildings.filter(b=>b.kind==='cafe')) {const z=b.z+b.d/2-.1;box(root,0xab7151,b.x+1.4,1.05,z,2.5,.16,.5);for(let n=0;n<5;n++)ball(root,0xf0bc65,b.x+.45+n*.45,1.23,z,.17,.13,.18)}
 // Static scenery uses instancing; animated rigs are batched separately below.
 function batch(objects:T.Mesh[]) {root.updateMatrixWorld(true);const groups=new Map<string,T.Mesh[]>();for(const m of objects){const key=m.geometry.uuid+':'+(m.material as T.Material).uuid;if(!groups.has(key))groups.set(key,[]);groups.get(key)!.push(m)}return [...groups.values()].map(objects=>{const first=objects[0],instance=new T.InstancedMesh(first.geometry,first.material,objects.length);instance.castShadow=true;instance.receiveShadow=true;instance.frustumCulled=false;root.add(instance);objects.forEach((m,i)=>{instance.setMatrixAt(i,m.matrixWorld);m.visible=false});return {instance,objects}})}
 batch(staticMeshes);dynamic=true;
 const citizens=neighbours.map((info,i)=>{
  const person=new T.Group();person.name=info.name;person.position.set(info.route[0].x,0,info.route[0].z);root.add(person);
  const skin=[0xb57551,0xd69a70,0xa36648,0xba815c,0xe3b78a][i],shirt=new T.Color(info.color).getHex(),hair=[0x343044,0x52352e,0x272a3a,0x44312d,0x754634][i];
  const torso=new T.Group();torso.position.y=1.12;person.add(torso);
  ball(torso,shirt,0,0,0,.3,.43,.22);cylinder(torso,skin,0,.42,0,.105,.19);
  const head=new T.Group();head.position.y=.73;torso.add(head);
  ball(head,skin,0,0,0,.24,.29,.23);ball(head,hair,0,.14,-.025,.255,.19,.25);ball(head,skin,0,-.015,.234,.06,.062,.06);
  for(const side of [-1,1]){ball(head,0x292336,side*.081,.035,.206,.024,.029,.016);ball(head,skin,side*.235,0,0,.055,.08,.05)}
  if(i===0||i===2)ball(head,hair,0,.08,-.23,.20,.26,.15);
  if(i===1){cylinder(head,0xfff0db,0,.29,0,.26,.10);ball(head,0xfff0db,0,.41,0,.27,.2,.25)}
  if(i===4){ball(head,hair,0,.1,-.33,.13,.13,.24);for(const side of [-1,1]){const glass=new T.Mesh(new T.TorusGeometry(.065,.012,6,12),mat(0x5b3e6e));glass.position.set(side*.081,.035,.224);head.add(glass);movingMeshes.push(glass)}}
  const arms:T.Group[]=[],legs:T.Group[]=[];
  for(const side of [-1,1]) {
   const arm=new T.Group();arm.position.set(side*.29,.23,0);torso.add(arm);ball(arm,shirt,side*.025,-.17,0,.10,.23,.105);ball(arm,skin,side*.025,-.41,0,.076,.14,.075);ball(arm,skin,side*.025,-.53,0,.081,.084,.085);arms.push(arm);
   const leg=new T.Group();leg.position.set(side*.14,.86,0);person.add(leg);ball(leg,0x514664,0,-.32,0,.105,.34,.12);ball(leg,0xf5e4d0,0,-.73,.045,.13,.105,.22);legs.push(leg);
  }
  if(i===1){box(torso,0xf6ede0,0,-.10,.207,.37,.53,.025);box(torso,0xf3983a,0,-.13,.23,.21,.13,.025)}
  if(i===2){box(torso,0x33334e,0,.08,.30,.33,.21,.15);const lens=cylinder(torso,0x8ec5cf,0,.08,.43,.095,.06);lens.rotation.x=Math.PI/2}
  if(i===0||i===4){const book=box(arms[0],0xfff3d6,-.025,-.41,.115,.24,.31,.055);book.rotation.z=-.1;box(arms[0],0x894a9f,-.025,-.41,.148,.17,.03,.012)}
  if(i===3){box(arms[0],0xeeb14d,-.025,-.65,0,.27,.31,.16);box(arms[0],0xffd482,-.025,-.44,0,.13,.06,.035)}
  const labelCanvas=document.createElement('canvas');labelCanvas.width=320;labelCanvas.height=104;const ctx=labelCanvas.getContext('2d')!;ctx.fillStyle='#fff6e9';ctx.beginPath();ctx.roundRect(5,5,310,94,30);ctx.fill();ctx.textAlign='center';ctx.fillStyle='#613076';ctx.font='bold 32px Arial';ctx.fillText(info.name,160,44);ctx.font='18px Arial';ctx.fillText('SAY HELLO',160,76);
  const texture=new T.CanvasTexture(labelCanvas);texture.colorSpace=T.SRGBColorSpace;textures.push(texture);const label=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:true,transparent:true}));label.position.y=2.73;label.scale.set(1.45,.47,1);person.add(label);
  const ring=new T.Mesh(new T.RingGeometry(.42,.47,32),new T.MeshBasicMaterial({color:shirt,transparent:true,opacity:.7,side:T.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.12;person.add(ring);
  return {info,person,torso,head,arms,legs,label,ring,waypoint:1,walkTime:i*2,wait:1+i*.4,moving:false};
 });
 // Pennants respond to the breeze above the streets.
 const flags:T.Object3D[]=[];
 for(const b of buildings.filter((_,i)=>i%2===0)) {cylinder(root,0x72677c,b.x+2,b.h+1.35,b.z,.04,2);const flag=box(root,[0xffa240,0x86439d,0xffd67a][flags.length%3],b.x+2.5,b.h+1.88,b.z,1,.48,.025);flags.push(flag)}
 const clouds:T.Group[]=[];
 for(let i=0;i<5;i++){const cloud=new T.Group();cloud.position.set(-30+i*15,19+(i%2)*4,-25+(i%3)*18);root.add(cloud);for(let j=0;j<4;j++)ball(cloud,0xfff8ed,(j-1.5)*1.7,j%2*.5,0,2,1+(j%2)*.6,1.3);clouds.push(cloud)}
 const birds:T.Group[]=[];
 for(let i=0;i<6;i++){const bird=new T.Group();root.add(bird);ball(bird,0xffeecb,0,0,0,.085,.085,.22);const wings=[-1,1].map(side=>{const wing=ball(bird,0x776086,side*.17,0,0,.22,.025,.11);return wing});bird.userData.wings=wings;birds.push(bird)}
 const butterflies:T.Group[]=[];
 for(let i=0;i<5;i++){const fly=new T.Group();root.add(fly);for(const side of [-1,1])ball(fly,[0xffb73f,0xf891b7,0xac79d5][i%3],side*.07,0,0,.08,.014,.11);butterflies.push(fly)}
 const fountainDrops:T.Mesh[]=[];for(let i=0;i<16;i++)fountainDrops.push(ball(root,0x8ee7e1,34,2,17,.055,.10,.055));
 const sparkles=Array.from({length:18},()=>{const p=ball(root,0xffca4a,0,-10,0,.07,.07,.07);p.userData={age:1};return p});
 const batches=batch(movingMeshes);let elapsed=0,nearby:Neighbour|null=null;
 function nearest(position:Point){let found:typeof citizens[number]|undefined,distance=2.65;for(const npc of citizens){const d=Math.hypot(npc.person.position.x-position.x,npc.person.position.z-position.z);if(d<distance){found=npc;distance=d}}return found}
 function update(dt:number,player:Point,paused:boolean,calm:boolean) {
  if(!paused)elapsed+=dt;const time=calm?0:elapsed;
  const close=paused?undefined:nearest(player);nearby=close?.info||null;
  for(const [i,npc] of citizens.entries()) {
   const {person,info}=npc;const distance=Math.hypot(person.position.x-player.x,person.position.z-player.z);const greeting=!paused&&distance<4;
   npc.moving=false;
   if(!paused&&!greeting) {
    npc.wait=Math.max(0,npc.wait-dt);
    if(npc.wait===0){const to=info.route[npc.waypoint],dx=to.x-person.position.x,dz=to.z-person.position.z,len=Math.hypot(dx,dz);if(len<.06){npc.waypoint=(npc.waypoint+1)%info.route.length;npc.wait=2.5+i*.3}else{const step=Math.min(len,dt*(i===4?.85:.58));person.position.x+=dx/len*step;person.position.z+=dz/len*step;const angle=Math.atan2(dx,dz);person.rotation.y+=Math.atan2(Math.sin(angle-person.rotation.y),Math.cos(angle-person.rotation.y))*(1-Math.exp(-dt*7));npc.walkTime+=dt*5;npc.moving=true}}
   }
   if(greeting){const angle=Math.atan2(player.x-person.position.x,player.z-person.position.z);person.rotation.y+=Math.atan2(Math.sin(angle-person.rotation.y),Math.cos(angle-person.rotation.y))*(1-Math.exp(-dt*5))}
   npc.legs.forEach((leg,j)=>leg.rotation.x=npc.moving?Math.sin(npc.walkTime+j*Math.PI)*.32:0);
   npc.arms.forEach((arm,j)=>{arm.rotation.x=npc.moving?-Math.sin(npc.walkTime+j*Math.PI)*.24:0;arm.rotation.z=j===1&&greeting?2.1+(calm?0:Math.sin(time*6)*.22):(j===0?.12:-.12)});
   npc.torso.position.y=1.12+(npc.moving?Math.abs(Math.sin(npc.walkTime))*.035:calm?0:Math.sin(time*1.7+i)*.014);
   npc.head.rotation.z=greeting?-.08:0;npc.label.material.opacity=distance<10?1:.68;npc.label.visible=distance<14;npc.ring.visible=close===npc;
  }
  flags.forEach((flag,i)=>{flag.rotation.y=calm?0:Math.sin(time*2+i)*.22;flag.rotation.x=calm?0:Math.sin(time*3+i)*.08});
  clouds.forEach((cloud,i)=>{cloud.position.x=-30+i*15+(calm?0:Math.sin(time*.022+i)*3)});
  birds.forEach((bird,i)=>{const a=time*.15+i*1.047;bird.position.set(Math.cos(a)*(13+i),8+i%3,Math.sin(a)*(12+i));bird.rotation.y=-a;const wings=bird.userData.wings as T.Mesh[];wings.forEach((w,j)=>w.rotation.z=(j?1:-1)*(calm?.25:Math.sin(time*7+i)*.7))});
  butterflies.forEach((fly,i)=>{fly.position.set((i%2?-11:11)+Math.sin(time*.7+i)*1.5,1.3+Math.cos(time+i)*.4,24+Math.cos(time*.5+i)*1.5);fly.rotation.y=time+i;fly.scale.x=calm?1:.4+Math.abs(Math.sin(time*12))*.6});
  fountainDrops.forEach((drop,i)=>{const t=(time*.6+i/16)%1,a=i*2.4;drop.position.set(34+Math.cos(a)*t*1.7,1.8+Math.sin(t*Math.PI)*1.1-t*.9,17+Math.sin(a)*t*1.7)});
  for(const p of sparkles){p.userData.age+=paused?0:dt;const a=p.userData.age as number;if(a<.8&&!calm){if(!paused){p.position.x+=p.userData.vx*dt;p.position.z+=p.userData.vz*dt;p.position.y+=((1-a)*3-1)*dt}p.scale.setScalar(.07*(1-a/.8))}else p.scale.setScalar(0)}
  root.updateMatrixWorld(true);for(const {instance,objects}of batches){objects.forEach((m,i)=>instance.setMatrixAt(i,m.matrixWorld));instance.instanceMatrix.needsUpdate=true}
  return nearby;
 }
 function celebrate(p:Point){sparkles.forEach((s,i)=>{const a=i*Math.PI*2/sparkles.length;s.position.set(p.x,1,p.z);s.userData={age:0,vx:Math.cos(a)*1.8,vz:Math.sin(a)*1.8};s.scale.setScalar(.07)})}
 return {update,celebrate,nearest:(p:Point)=>nearest(p)?.info||null,dispose(){textures.forEach(t=>t.dispose())}};
}
