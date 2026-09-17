import * as THREE from 'three';

/** A lightweight, articulated 3D interpretation of the supplied Viral Cat mark. */
export function createViralCat(){
 const root=new THREE.Group();root.name='Viral Cat';
 const purple=new THREE.MeshPhysicalMaterial({color:0x792890,roughness:.34,metalness:.05,clearcoat:.65,clearcoatRoughness:.24});
 const innerPurple=new THREE.MeshPhysicalMaterial({color:0x381147,roughness:.48,clearcoat:.3});
 const orange=new THREE.MeshPhysicalMaterial({color:0xf78b12,roughness:.27,metalness:.1,clearcoat:1,clearcoatRoughness:.13});
 const gold=new THREE.MeshPhysicalMaterial({color:0xffb52c,roughness:.2,metalness:.3,clearcoat:1});
 const glass=new THREE.MeshPhysicalMaterial({color:0xff930f,roughness:.13,metalness:.18,clearcoat:1,clearcoatRoughness:.08,reflectivity:.8,envMapIntensity:1.8});
 const darkFrame=new THREE.MeshPhysicalMaterial({color:0xb64409,roughness:.3,clearcoat:.8});
 const sphere=new THREE.SphereGeometry(1,40,28);
 function ellipsoid(parent:THREE.Object3D,material:THREE.Material,position:number[],scale:number[],name=''){const mesh=new THREE.Mesh(sphere,material);mesh.position.set(...position as [number,number,number]);mesh.scale.set(...scale as [number,number,number]);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
 function tube(parent:THREE.Object3D,points:number[][],radius:number,material:THREE.Material,name=''){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p as [number,number,number])));const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,40,radius,12,false),material);mesh.name=name;mesh.castShadow=true;parent.add(mesh);return mesh}
 // Pear-shaped body and confident stance.
 const body=ellipsoid(root,purple,[0,-.57,0],[.68,.9,.49],'body');
 ellipsoid(root,purple,[-.39,-1.53,.015],[.265,.66,.29],'left leg').rotation.z=-.12;
 ellipsoid(root,purple,[.39,-1.53,.015],[.265,.66,.29],'right leg').rotation.z=.12;
 ellipsoid(root,purple,[-.45,-2.05,.19],[.4,.22,.53],'left foot');
 ellipsoid(root,purple,[.45,-2.05,.19],[.4,.22,.53],'right foot');
 const armLeft=new THREE.Group();armLeft.position.set(-.46,-.18,0);root.add(armLeft);
 tube(armLeft,[[0,0,0],[-.36,-.18,0],[-.46,-.38,.1],[-.28,-.59,.28],[-.1,-.65,.35]],.15,purple,'left arm');
 ellipsoid(armLeft,purple,[-.12,-.65,.35],[.21,.24,.2],'left paw');
 const armRight=new THREE.Group();armRight.position.set(.46,-.18,0);root.add(armRight);
 tube(armRight,[[0,0,0],[.36,-.18,0],[.46,-.38,.1],[.28,-.59,.28],[.1,-.65,.35]],.15,purple,'right arm');
 ellipsoid(armRight,purple,[.12,-.65,.35],[.21,.24,.2],'right paw');
 const tail=new THREE.Group();tail.position.set(.36,-1.0,-.29);root.add(tail);
 tube(tail,[[0,0,0],[.48,-.22,-.1],[1.02,-.23,-.05],[1.4,.08,.015],[1.4,.52,.04],[1.23,.65,.08]],.17,purple,'tail');
 ellipsoid(tail,purple,[1.23,.65,.08],[.174,.174,.174],'tail tip');
 // Oversized head, pointed ears and a gently flattened lower face.
 const head=new THREE.Group();head.position.set(0,.69,0);root.add(head);
 ellipsoid(head,purple,[0,.38,0],[1.37,.97,.76],'head');
 function ear(sign:number){const pivot=new THREE.Group();pivot.position.set(sign*.89,1.01,-.03);pivot.rotation.z=sign*-.17;head.add(pivot);const shape=new THREE.Shape();shape.moveTo(-.41,-.22);shape.bezierCurveTo(-.42,.12,-.17,.75,-.08,.92);shape.bezierCurveTo(.03,1.1,.22,.62,.4,-.22);shape.quadraticCurveTo(0,-.41,-.41,-.22);const geometry=new THREE.ExtrudeGeometry(shape,{depth:.22,bevelEnabled:true,bevelSegments:4,steps:1,bevelSize:.1,bevelThickness:.13,curveSegments:18});geometry.translate(0,0,-.16);const outside=new THREE.Mesh(geometry,purple);outside.castShadow=true;pivot.add(outside);const inside=new THREE.Mesh(new THREE.ShapeGeometry(shape,20),innerPurple);inside.position.set(0,.035,.205);inside.scale.set(.63,.71,1);pivot.add(inside);return pivot}
 const earLeft=ear(-1),earRight=ear(1);
 // The visor is a sculpted, curved solid surface, including a nose notch.
 const visorShape=new THREE.Shape();visorShape.moveTo(-1.27,.58);visorShape.bezierCurveTo(-.85,.73,.76,.74,1.26,.58);visorShape.bezierCurveTo(1.51,.5,1.51,.12,1.47,-.2);visorShape.bezierCurveTo(1.43,-.59,1.16,-.62,.54,-.53);visorShape.bezierCurveTo(.22,-.51,.23,-.32,0,-.32);visorShape.bezierCurveTo(-.23,-.32,-.22,-.51,-.54,-.53);visorShape.bezierCurveTo(-1.16,-.62,-1.43,-.59,-1.47,-.2);visorShape.bezierCurveTo(-1.51,.12,-1.51,.5,-1.27,.58);
 function visorLayer(material:THREE.Material,scale:number,offset:number,depth:number){const geometry=new THREE.ExtrudeGeometry(visorShape,{depth,bevelEnabled:true,bevelSegments:4,bevelSize:.055,bevelThickness:.055,curveSegments:24,steps:1});const p=geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i);p.setZ(i,p.getZ(i)+.25*(1-(x/1.58)**2))}geometry.computeVertexNormals();const mesh=new THREE.Mesh(geometry,material);mesh.scale.set(scale,scale,1);mesh.position.set(0,.38,offset);mesh.castShadow=true;mesh.name='visor';head.add(mesh);return mesh}
 visorLayer(darkFrame,1.015,.5,.18);visorLayer(orange,1,.56,.19);visorLayer(gold,.952,.752,.048);const lens=visorLayer(glass,.885,.82,.035);
 const strap=new THREE.Mesh(new THREE.TorusGeometry(1.3,.105,12,64),orange);strap.rotation.x=Math.PI/2;strap.scale.set(1,.64,1);strap.position.set(0,.55,-.02);head.add(strap);
 ellipsoid(head,orange,[-1.44,.47,.1],[.13,.35,.26],'left strap clasp');ellipsoid(head,orange,[1.44,.47,.1],[.13,.35,.26],'right strap clasp');
 root.userData.brand='Viral Cat';
 return {root,head,body,armLeft,armRight,tail,earLeft,earRight,lens,glass};
}

export type CatCameraFrame={p:number;camera:[number,number,number];look:[number,number,number];yaw:number;roll:number;lift:number;scale:number};
export const catCameraFrames:CatCameraFrame[]=[
 {p:0,camera:[-.55,.75,9.6],look:[0,.25,0],yaw:-.4,roll:-.05,lift:0,scale:1},
 {p:.17,camera:[.35,1.1,8.9],look:[0,.4,0],yaw:.28,roll:.04,lift:.12,scale:1},
 {p:.33,camera:[1.1,1.65,5.7],look:[0,1.25,0],yaw:-.15,roll:-.035,lift:.08,scale:1},
 {p:.51,camera:[-1.7,1.45,8.4],look:[0,.35,0],yaw:Math.PI*.88,roll:.1,lift:.35,scale:.97},
 {p:.69,camera:[.9,.8,9.5],look:[0,.3,0],yaw:Math.PI*2-.4,roll:-.08,lift:.2,scale:1},
 {p:.84,camera:[-.5,.55,8.4],look:[0,.35,0],yaw:Math.PI*2+.3,roll:.04,lift:.05,scale:1},
 {p:1,camera:[.3,.8,9.5],look:[0,.25,0],yaw:Math.PI*2,roll:0,lift:0,scale:1},
];
export function sampleCatCamera(progress:number){const p=THREE.MathUtils.clamp(progress,0,1);let i=0;while(i<catCameraFrames.length-2&&p>catCameraFrames[i+1].p)i++;const a=catCameraFrames[i],b=catCameraFrames[i+1];const t=THREE.MathUtils.smootherstep((p-a.p)/(b.p-a.p),0,1);const n=(x:number,y:number)=>THREE.MathUtils.lerp(x,y,t);return {camera:a.camera.map((x,j)=>n(x,b.camera[j])) as [number,number,number],look:a.look.map((x,j)=>n(x,b.look[j])) as [number,number,number],yaw:n(a.yaw,b.yaw),roll:n(a.roll,b.roll),lift:n(a.lift,b.lift),scale:n(a.scale,b.scale)}}
