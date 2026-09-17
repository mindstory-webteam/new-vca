import * as T from 'three';

/** Fully volumetric feline rig. Local +Z is forward; all four paws meet y=0. */
export async function createLogoCat() {
 const root = new T.Group(); root.name = 'Viral Cat — neighbourhood explorer';
 const body = new T.Group(); root.add(body);
 const fur = new T.MeshStandardMaterial({color:0x792890,roughness:.72});
 const lightFur = new T.MeshStandardMaterial({color:0xad60ba,roughness:.78});
 const muzzleMat = new T.MeshStandardMaterial({color:0xe2b5e7,roughness:.8});
 const dark = new T.MeshStandardMaterial({color:0x361347,roughness:.58});
 const orange = new T.MeshStandardMaterial({color:0xff9017,roughness:.38,metalness:.12});
 const gold = new T.MeshStandardMaterial({color:0xffca55,roughness:.35});
 const eyeWhite = new T.MeshStandardMaterial({color:0xfff5db,roughness:.3});
 const irisMat = new T.MeshStandardMaterial({color:0xe6a42d,roughness:.28});
 const noseMat = new T.MeshStandardMaterial({color:0xd866a4,roughness:.5});
 const lensMat = new T.MeshPhysicalMaterial({color:0xe95909,roughness:.16,metalness:.32,clearcoat:1});
 const ball = new T.SphereGeometry(1,28,20);
 const lowBall = new T.SphereGeometry(1,14,10);
 function ellipsoid(parent:T.Object3D,mat:T.Material,x:number,y:number,z:number,rx:number,ry:number,rz:number,detail=true) {
  const mesh=new T.Mesh(detail?ball:lowBall,mat);mesh.position.set(x,y,z);mesh.scale.set(rx,ry,rz);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
 }
 function curve(parent:T.Object3D,points:number[][],radius:number,mat:T.Material,segments=24) {
  const geometry=new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p as [number,number,number]))),segments,radius,8,false);
  const mesh=new T.Mesh(geometry,mat);mesh.castShadow=true;parent.add(mesh);return mesh;
 }
 ellipsoid(body,fur,0,1.02,-.25,.54,.58,.95);
 ellipsoid(body,fur,0,.99,-.81,.57,.54,.53);
 ellipsoid(body,lightFur,0,.97,.46,.35,.4,.14);
 const legs:T.Group[]=[];
 for(const rear of [false,true]) for(const side of [-1,1]) {
  const leg=new T.Group();leg.name=(rear?'hind':'front')+(side<0?' left paw':' right paw');leg.position.set(side*(rear?.4:.36),.82,rear?-.88:.43);body.add(leg);
  ellipsoid(leg,fur,0,-.23,0,rear?.23:.18,.35,.21);
  ellipsoid(leg,fur,0,-.49,.025,.16,.23,.17);
  ellipsoid(leg,lightFur,0,-.65,.11,.225,.17,.3);
  // Small toe seams help the feet read as paws at the follow-camera distance.
  for(const n of [-1,1]) curve(leg,[[n*.075,-.65,.392],[n*.077,-.59,.372]],.008,fur,4);
  legs.push(leg);
 }
 const head=new T.Group();head.name='Expressive feline face';head.position.set(0,1.62,.67);body.add(head);
 ellipsoid(head,fur,0,.08,0,.69,.61,.6);
 // Rounded, thick triangular ears with a smaller lilac inner ear.
 const earShape=new T.Shape();earShape.moveTo(-.29,0);earShape.quadraticCurveTo(-.27,.16,-.08,.68);earShape.quadraticCurveTo(0,.83,.075,.67);earShape.quadraticCurveTo(.25,.17,.29,0);earShape.quadraticCurveTo(0,-.14,-.29,0);
 const earGeo=new T.ExtrudeGeometry(earShape,{depth:.17,bevelEnabled:true,bevelSize:.06,bevelThickness:.06,bevelSegments:4,steps:1,curveSegments:12});earGeo.translate(0,0,-.14);
 const ears:T.Group[]=[];
 for(const side of [-1,1]) {
  const ear=new T.Group();ear.position.set(side*.46,.43,-.03);ear.rotation.z=-side*.2;head.add(ear);
  const outer=new T.Mesh(earGeo,fur);outer.castShadow=true;ear.add(outer);
  const inner=new T.Mesh(earGeo,lightFur);inner.scale.set(.57,.65,.15);inner.position.set(0,.065,.12);ear.add(inner);ears.push(ear);
  ellipsoid(head,lightFur,side*.53,-.16,.19,.23,.26,.3);
 }
 const eyes:T.Group[]=[];
 for(const side of [-1,1]) {
  const eye=new T.Group();eye.position.set(side*.275,.10,.492);eye.rotation.y=side*.15;head.add(eye);
  ellipsoid(eye,dark,0,0,0,.237,.265,.14);
  ellipsoid(eye,eyeWhite,0,0,.045,.205,.227,.115);
  ellipsoid(eye,irisMat,-side*.013,-.005,.13,.123,.174,.055);
  ellipsoid(eye,dark,-side*.013,-.003,.176,.036,.136,.023);
  ellipsoid(eye,eyeWhite,-.045,.077,.191,.036,.043,.015,false);
  ellipsoid(eye,eyeWhite,.042,-.056,.19,.016,.019,.009,false);eyes.push(eye);
  ellipsoid(head,muzzleMat,side*.17,-.255,.538,.255,.185,.2);
  // Three fine whiskers on each cheek, each lifted off the muzzle surface.
  for(let i=0;i<3;i++) curve(head,[[side*.31,-.22-i*.055,.61],[side*.59,-.19-i*.07,.65],[side*.89,-.12-i*.13,.57]],.009,muzzleMat,10);
 }
 ellipsoid(head,noseMat,0,-.215,.736,.09,.066,.045);
 curve(head,[[0,-.266,.734],[0,-.315,.722],[-.065,-.344,.708],[-.11,-.32,.70]],.013,dark,12);
 curve(head,[[0,-.315,.722],[.065,-.344,.708],[.11,-.32,.70]],.013,dark,10);
 // Orange goggles sit above the eyes, preserving both the brand cue and a readable cat face.
 const goggles=new T.Group();goggles.position.set(0,.465,.49);goggles.rotation.x=-.36;head.add(goggles);
 for(const side of [-1,1]) {
  ellipsoid(goggles,orange,side*.225,0,0,.245,.135,.115);
  ellipsoid(goggles,lensMat,side*.225,0,.087,.19,.09,.045);
  ellipsoid(goggles,gold,side*.23,.035,.122,.1,.013,.006,false);
 }
 ellipsoid(goggles,orange,0,0,0,.1,.053,.08);
 curve(head,[[-.53,.45,.46],[-.64,.36,.10],[-.43,.29,-.49],[0,.29,-.6],[.43,.29,-.49],[.64,.36,.10],[.53,.45,.46]],.054,orange,32);
 // A soft bandana and a round cat tag sit below the chin.
 const bandana=new T.Mesh(new T.ConeGeometry(.24,.37,3),orange);bandana.rotation.z=Math.PI;bandana.position.set(0,1.04,.83);body.add(bandana);
 const tag=new T.Mesh(new T.CylinderGeometry(.095,.095,.035,20),gold);tag.rotation.x=Math.PI/2;tag.position.set(0,.93,.88);body.add(tag);
 const tail=new T.Group();tail.name='Curled tail';tail.position.set(0,1.1,-1.04);body.add(tail);
 curve(tail,[[0,0,0],[.08,.12,-.35],[.22,.44,-.62],[.31,.91,-.68],[.28,1.28,-.55],[.15,1.39,-.32],[.04,1.27,-.2]],.135,fur,34);
 ellipsoid(tail,lightFur,.04,1.27,-.2,.137,.14,.137);
 const shadow=new T.Mesh(new T.CircleGeometry(1,32),new T.MeshBasicMaterial({color:0x351443,transparent:true,opacity:.14,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.scale.set(.75,1.3,1);shadow.position.set(0,.11,-.2);root.add(shadow);
 let previousTime=0,gait=0,smoothedSpeed=0;
 function update(time:number,speed:number,jump:number,yaw:number,calm=false) {
  const dt=Math.min(.05,Math.max(0,time-previousTime));previousTime=time;
  smoothedSpeed=T.MathUtils.damp(smoothedSpeed,speed,10,dt);gait+=dt*smoothedSpeed*2.45;
  const strength=Math.min(smoothedSpeed/4.6,1.3),running=smoothedSpeed>5;
  // Diagonal pairs alternate in a four-legged walk; the whole spine responds to running.
  legs.forEach((leg,i)=>{const phase=gait+(i===0||i===3?0:Math.PI);leg.rotation.x=Math.sin(phase)*.48*strength;leg.position.y=.82+Math.max(0,Math.cos(phase))*.055*strength;if(jump>.06)leg.rotation.x+=(i<2?-.32:.3)});
  body.position.y=jump+(calm?0:Math.abs(Math.sin(gait))*strength*.065+Math.sin(time*2)*.012);
  body.rotation.x=running?Math.sin(gait*2)*.035:0;
  head.rotation.x=jump>.05?-.12:calm?0:Math.sin(time*1.5)*.025;
  head.rotation.y=speed<.1&&!calm?Math.sin(time*.58)*.13:0;
  head.rotation.z=calm?0:Math.sin(gait)*strength*.023;
  tail.rotation.z=calm?0:Math.sin(time*2.1)*.17;tail.rotation.x=running?-.15:0;
  ears.forEach((ear,i)=>ear.rotation.x=calm?0:Math.pow(Math.max(0,Math.sin(time*1.6+i*2)),18)*.16);
  const blink=calm?1:1-.94*Math.pow(Math.max(0,Math.sin(time*1.2)),40);eyes.forEach(eye=>eye.scale.y=blink);
  const turn=Math.atan2(Math.sin(yaw-root.rotation.y),Math.cos(yaw-root.rotation.y));root.rotation.y+=turn*(1-Math.exp(-dt*12));
  shadow.material.opacity=.14/(1+jump);shadow.scale.set(.75+jump*.12,1.3+jump*.12,1);
 }
 // Geometry and materials are owned and disposed by the surrounding game scene.
 return {root,update,dispose() {}};
}
