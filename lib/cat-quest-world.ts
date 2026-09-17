import * as T from 'three';
import {buildings,districts,pickups,type Point} from './cat-walk-world';
import {neighbours,type Neighbour} from './cat-neighbours';

export const hopRings=[{x:0,z:23},{x:0,z:9},{x:16,z:3}];
export function createQuestWorld(scene:T.Scene){
 const root=new T.Group();root.name='Cat Street — a pocket-sized festival';scene.add(root);
 const mats=new Map<number,T.MeshStandardMaterial>(),textures:T.Texture[]=[];
 const mat=(c:number)=>{if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:1}));return mats.get(c)!};
 const cube=new T.BoxGeometry(1,1,1),ballGeo=new T.SphereGeometry(1,14,10),cyl=new T.CylinderGeometry(1,1,1,16);
 const staticParts:T.Mesh[]=[],animatedParts:T.Mesh[]=[];let moving=false;
 const mesh=(g:T.BufferGeometry,c:number,x:number,y:number,z:number,sx:number,sy:number,sz:number,parent:T.Object3D=root)=>{const m=new T.Mesh(g,mat(c));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);(moving?animatedParts:staticParts).push(m);return m};
 const box=(c:number,x:number,y:number,z:number,w:number,h:number,d:number,p:T.Object3D=root)=>mesh(cube,c,x,y,z,w,h,d,p);
 const ball=(c:number,x:number,y:number,z:number,a:number,b:number,d:number,p:T.Object3D=root)=>mesh(ballGeo,c,x,y,z,a,b,d,p);
 const cylinder=(c:number,x:number,y:number,z:number,r:number,h:number,p:T.Object3D=root)=>mesh(cyl,c,x,y,z,r,h,r,p);
 function label(text:string,width:number,color='#69317e',background='#fff9e9'){
  const c=document.createElement('canvas');c.width=768;c.height=144;const g=c.getContext('2d')!;g.fillStyle=background;g.beginPath();g.roundRect(3,3,762,138,42);g.fill();g.fillStyle=color;g.textAlign='center';g.textBaseline='middle';g.font='700 42px Arial';g.fillText(text,384,74,700);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;textures.push(t);const s=new T.Sprite(new T.SpriteMaterial({map:t,transparent:true,depthWrite:false,toneMapped:false}));s.scale.set(width,width*144/768,1);return s;
 }
 // A single toy-town island, with cream paths instead of tall streets and asphalt.
 box(0x735593,0,-1.35,0,61,2.5,61);box(0xa68cc0,0,-.32,0,61,.45,61);box(0x8bcdb0,0,-.05,0,60,.2,60);
 box(0xc6e8ec,0,-2.8,0,220,.3,220);
 for(const n of [-16,0,16]){box(0xffedc7,n,.073,0,6,.025,60);box(0xffedc7,0,.079,n,60,.025,6)}
 box(0xffedc7,0,.08,23,59,.03,9);box(0xffedc7,0,.08,-19,59,.03,3);
 // Soft colour identifies each district without cluttering the walkways.
 const zonePads=[[-16,16],[-16,-8],[0,-16],[16,7],[0,8]];
 const zoneLights:T.Mesh[]=[];
 zonePads.forEach(([x,z],i)=>{const ring=new T.Mesh(new T.RingGeometry(2.4,2.65,64),new T.MeshBasicMaterial({color:districts[i].color,transparent:true,opacity:.45,side:T.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.set(x,.101,z);root.add(ring);zoneLights.push(ring)});
 const windowMats=districts.map(()=>new T.MeshStandardMaterial({color:0xaad9d1,roughness:1}));
 for(const [i,b] of buildings.entries()){
  const g=new T.Group();g.position.set(b.x,0,b.z);root.add(g);const palette=[0xb895da,0xffae98,0x7fc9c6,0xeac77b,0xc6acd9];const height=1.55+(i%3)*.28;
  box(0xfff9e8,0,.12,0,b.w+.55,.2,b.d+.55,g);box(palette[i%5],0,height/2+.2,0,b.w,height,b.d,g);
  box(0x835198,0,height+.22,0,b.w+.15,.22,b.d+.15,g);box(palette[i%5],0,height+.4,0,b.w-.3,.17,b.d-.3,g);
  const front=b.d/2+.035;
  for(const side of [-1,1]){box(0x497b8b,side*1.7,.98,front,1.8,1.1,.06,g);const pane=box(0xffd18c,side*1.7,.98,front+.04,1.55,.89,.035,g);pane.material=windowMats[b.x<-12?(b.z>0?0:1):b.x>12?3:b.z<-12?2:4];box(0xfff2dc,side*1.7,.98,front+.075,.07,1.1,.04,g)}
  box(0x674174,0,.72,front,.9,1.2,.06,g);ball(0xffc455,.24,.78,front+.055,.045,.045,.04,g);
  for(let j=0;j<10;j++){const awning=box(j%2?0xfff6da:0xff963b,-b.w/2+(j+.5)*b.w/10,height+.12,front+.37,b.w/10,.10,.95,g);awning.rotation.x=.12;box(j%2?0xfff6da:0xff963b,-b.w/2+(j+.5)*b.w/10,height-.01,front+.84,b.w/10,.21,.055,g)}
  const title=label(b.name,4.6);title.position.set(0,height+.95,.1);g.add(title);
  // Each roof becomes a tiny display: an orchard, a bakery, a book stall or a studio.
  if(i%3===0){cylinder(0xe6a27c,-1.8,height+.61,-1.3,.5,.38,g);ball(0x4b9d79,-1.8,height+1.1,-1.3,.64,.62,.64,g);ball(0xffb940,-1.55,height+1.25,-.9,.12,.12,.12,g)}
  else if(i%3===1){for(let j=0;j<3;j++)box([0xffba52,0xf292a7,0xb5d977][j],-1.6+j*.7,height+.55,-1.4,.55,.24,1.1,g)}
  else{box(0xffd784,-1.5,height+.6,-1.5,1.1,.3,.8,g);ball(0xfff1d1,-1.5,height+.87,-1.5,.35,.23,.3,g)}
  for(const side of [-1,1]){box(0xe29482,side*(b.w/2-.45),.35,front,.58,.5,.4,g);ball(0x4f9f73,side*(b.w/2-.45),.75,front,.39,.36,.29,g);ball(0xffcc72,side*(b.w/2-.45),1.0,front,.16,.14,.13,g)}
 }
 function tree(x:number,z:number,i:number){cylinder(0x9d6c66,x,1,z,.14,1.8);ball(i%2?0x60af90:0x79b68b,x,2.1,z,.9,1.0,.9);ball(0xa5d3a1,x-.32,2.48,z-.13,.5,.55,.5);cylinder(0xd4e5bb,x,.15,z,.8,.1)}
 for(let i=-27;i<=27;i+=6){tree(i,28,Math.round(i));tree(-28,i,0);tree(28,i,1)}
 for(const x of [-11,11]){box(0xb8dfaa,x,.12,23,9,.06,6);tree(x-3,25,0);tree(x+3,25,1);for(let i=0;i<5;i++)ball([0xffc777,0xfb8fa9,0xb88ad1][i%3],x-2+i,.28,26,.18,.15,.18)}
 // Lanterns and pennants on a perimeter promenade. Their bases sit outside the play limits.
 for(const x of [-30,30])for(const z of [-23,-7,9,24]){cylinder(0x90709d,x,1.4,z,.06,2.8);ball(0xffd789,x,2.8,z,.25,.31,.25)}
 const pennantGeo=new T.ConeGeometry(.22,.48,3);for(let i=0;i<36;i++){const flag=mesh(pennantGeo,[0xffa455,0xa777c5,0xffd878,0xe799b9][i%4],-28+i*1.6,3.1+Math.sin(i/35*Math.PI)*-.5,-29.5,1,1,.18);flag.rotation.z=Math.PI}
 // Round bollards show the edge of the island; they do not obstruct any saved route.
 for(let n=-28;n<=28;n+=4){cylinder(0xf3dfac,n,.2,-30,.14,.4);cylinder(0xf3dfac,n,.2,30,.14,.4)}
 function batch(parts:T.Mesh[]){root.updateMatrixWorld(true);const buckets=new Map<string,T.Mesh[]>();for(const m of parts){const key=m.geometry.uuid+':'+(m.material as T.Material).uuid;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key)!.push(m)}return [...buckets.values()].map(objects=>{const a=objects[0],instance=new T.InstancedMesh(a.geometry,a.material,objects.length);instance.castShadow=true;instance.receiveShadow=true;instance.frustumCulled=false;root.add(instance);objects.forEach((m,i)=>{instance.setMatrixAt(i,m.matrixWorld);m.visible=false});return {instance,objects}})}
 batch(staticParts);moving=true;
 const citizens=neighbours.map((info,i)=>{const person=new T.Group();person.position.set(info.route[0].x,0,info.route[0].z);person.name=info.name;root.add(person);const skin=[0xbd845e,0xd6a37d,0xa66f55,0xbc8b65,0xd7ae8b][i],color=new T.Color(info.color).getHex();
  ball(color,0,1.1,0,.27,.39,.23,person);ball(skin,0,1.72,0,.25,.27,.24,person);ball(0x513b5b,0,1.88,-.03,.26,.15,.25,person);for(const s of [-1,1]){ball(0x392b45,s*.085,1.73,.219,.025,.027,.02,person);ball(0x55446c,s*.14,.57,0,.105,.36,.12,person);ball(0xfff5df,s*.14,.17,.07,.15,.12,.21,person)}
  const arm=new T.Group();arm.position.set(.31,1.32,0);person.add(arm);ball(color,0,-.17,0,.10,.23,.10,arm);ball(skin,0,-.42,0,.08,.12,.08,arm);ball(color,-.31,1.12,0,.10,.3,.10,person);
  if(i===1){cylinder(0xfff5e7,0,2.04,0,.26,.12,person);ball(0xfff5e7,0,2.17,0,.25,.17,.23,person)}
  const badge=label(info.name,1.4,'#653277',info.color);badge.position.y=2.6;person.add(badge);return {info,person,arm,badge,next:1,phase:i,wait:0};
 });
 const sparkMat=new T.MeshStandardMaterial({color:0xffbb36,emissive:0xffb52f,emissiveIntensity:.2,roughness:.45});const sparkGeo=new T.OctahedronGeometry(.38);const tokens=new Map<string,T.Group>();
 for(const p of pickups){const g=new T.Group();g.position.set(p.x,1.0,p.z);const gem=new T.Mesh(sparkGeo,sparkMat);gem.castShadow=true;g.add(gem);const ring=new T.Mesh(new T.TorusGeometry(.58,.035,6,32),mat(new T.Color(districts[p.district].color).getHex()));ring.rotation.x=Math.PI/2;ring.position.y=-.87;g.add(ring);root.add(g);tokens.set(p.id,g)}
 const pads=hopRings.map(p=>{const ring=new T.Mesh(new T.TorusGeometry(1.05,.07,8,48),new T.MeshStandardMaterial({color:0xb272dc,emissive:0x8a39aa,emissiveIntensity:.1}));ring.rotation.x=Math.PI/2;ring.position.set(p.x,.19,p.z);root.add(ring);return ring});
 const butterflies=Array.from({length:6},(_,i)=>{const b=new T.Group();root.add(b);for(const side of [-1,1])ball(i%2?0xffad39:0xc77bc2,side*.08,0,0,.1,.015,.12,b);return b});
 const confetti=Array.from({length:28},(_,i)=>{const m=box([0xffab42,0x9c62b7,0xffd77f,0x76d6c0][i%4],0,-10,0,.09,.13,.04);m.userData={age:2};return m});
 const balloons=Array.from({length:5},(_,i)=>{const g=new T.Group();root.add(g);for(let j=0;j<3;j++){ball([0xffaf50,0xb17bcd,0xf0a5c2][j],(j-1)*.45,2.9+j*.3,0,.33,.43,.33,g);cylinder(0xffefd5,(j-1)*.45,1.45+j*.3,0,.012,2.5,g)}g.position.set(i<3?-30:30,0,-20+i*10);return g});
 const animationBatches=batch(animatedParts);
 const targetRing=new T.Mesh(new T.RingGeometry(.6,.7,48),new T.MeshBasicMaterial({color:0x7d278e,transparent:true,opacity:.8,side:T.DoubleSide,depthWrite:false}));targetRing.rotation.x=-Math.PI/2;targetRing.position.y=.13;targetRing.visible=false;root.add(targetRing);
 let elapsed=0;const collection=new Set<string>();
 function nearest(p:Point):Neighbour|null{let best:Neighbour|null=null,d=2.8;for(const n of citizens){const dist=Math.hypot(n.person.position.x-p.x,n.person.position.z-p.z);if(dist<d){d=dist;best=n.info}}return best}
 function setCollected(ids:string[]){collection.clear();ids.forEach(id=>collection.add(id));for(const [id,m]of tokens)m.visible=!collection.has(id);districts.forEach((_,i)=>{const complete=pickups.filter(p=>p.district===i&&collection.has(p.id)).length>=3;(zoneLights[i].material as T.MeshBasicMaterial).opacity=complete?.95:.4;zoneLights[i].scale.setScalar(complete?1.12:1)});windowMats.forEach((m,i)=>{const lit=pickups.filter(p=>p.district===i&&collection.has(p.id)).length>=3;m.color.setHex(lit?0xffd18c:0xaad9d1);m.emissive.setHex(lit?0xffa33c:0x000000);m.emissiveIntensity=lit?.35:0})}
 function celebrate(p:Point){confetti.forEach((m,i)=>{const a=i*2.4;m.position.set(p.x,1,p.z);m.scale.set(.09,.13,.04);m.userData={age:0,vx:Math.cos(a)*(1+i%3*.25),vz:Math.sin(a)*(1+i%3*.25)}})}
 function update(dt:number,p:Point,paused:boolean,calm:boolean){if(!paused)elapsed+=dt;const t=calm?0:elapsed;
  for(const [i,n]of citizens.entries()){const dist=Math.hypot(n.person.position.x-p.x,n.person.position.z-p.z);const close=dist<4;n.badge.visible=dist<17;
   if(!paused&&!close){n.wait=Math.max(0,n.wait-dt);if(n.wait===0){const target=n.info.route[n.next],dx=target.x-n.person.position.x,dz=target.z-n.person.position.z,len=Math.hypot(dx,dz);if(len<.08){n.next=(n.next+1)%n.info.route.length;n.wait=2}else{n.person.position.x+=dx/len*Math.min(len,dt*.55);n.person.position.z+=dz/len*Math.min(len,dt*.55);n.person.rotation.y=Math.atan2(dx,dz);n.phase+=dt*5}}}
   if(close&&!paused)n.person.rotation.y=Math.atan2(p.x-n.person.position.x,p.z-n.person.position.z);n.person.position.y=calm||paused?0:Math.abs(Math.sin(n.phase))*.035;n.arm.rotation.z=close?2.1+(calm?0:Math.sin(t*5)*.17):-.15;
  }
  for(const [id,g]of tokens){if(collection.has(id))continue;g.children[0].rotation.y=t*.8;g.position.y=1.03+Math.sin(t*2+g.position.x)*.10}
  pads.forEach((pad,i)=>{pad.scale.setScalar(calm?1:1+Math.sin(t*2+i)*.05)});
  butterflies.forEach((b,i)=>{b.position.set((i%2?-11:11)+Math.sin(t*.6+i)*2,1.2+Math.cos(t+i)*.3,24+Math.cos(t*.7+i)*2);b.rotation.y=t+i;b.scale.x=calm?1:.4+Math.abs(Math.sin(t*10))*.6});
  balloons.forEach((b,i)=>{b.rotation.z=calm?0:Math.sin(t+i)*.035});
  for(const m of confetti){if(!paused)m.userData.age+=dt;const age=m.userData.age;if(age<1&&!calm){if(!paused){m.position.x+=m.userData.vx*dt;m.position.z+=m.userData.vz*dt;m.position.y+=(2.6-age*5)*dt;m.rotation.z+=dt*3}m.scale.set(.09*(1-age),.13*(1-age),.04*(1-age))}else m.scale.setScalar(0)}
  targetRing.rotation.z=t;root.updateMatrixWorld(true);for(const {instance,objects}of animationBatches){objects.forEach((m,i)=>instance.setMatrixAt(i,m.matrixWorld));instance.instanceMatrix.needsUpdate=true}
 }
 return {root,update,nearest,setCollected,celebrate,target(p:Point|null){targetRing.visible=!!p;if(p){targetRing.position.x=p.x;targetRing.position.z=p.z}},dispose(){textures.forEach(t=>t.dispose())}};
}
