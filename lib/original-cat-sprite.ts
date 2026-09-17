import * as T from 'three';
/** The supplied mascot, one intact texture crop. Its colours and proportions never change. */
export async function createOriginalCatSprite(){
 const texture=await new T.TextureLoader().loadAsync('/assets/viral-cat-logo.png');texture.colorSpace=T.SRGBColorSpace;texture.offset.set(0,0);texture.repeat.set(470/1200,1);
 const material=new T.SpriteMaterial({map:texture,transparent:true,alphaTest:.035,depthWrite:false,toneMapped:false});
 const sprite=new T.Sprite(material);sprite.name='Original Viral Cat artwork';sprite.center.set(.5,0);sprite.scale.set(3.25*470/644,3.25,1);sprite.position.y=.13;sprite.renderOrder=3;
 const root=new T.Group();root.add(sprite);
 const shadow=new T.Mesh(new T.CircleGeometry(.82,40),new T.MeshBasicMaterial({color:0x5c3979,transparent:true,opacity:.17,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.105;root.add(shadow);
 const shape=new T.Shape();shape.moveTo(0,.5);shape.lineTo(-.21,0);shape.lineTo(0,.1);shape.lineTo(.21,0);shape.closePath();const arrow=new T.Mesh(new T.ShapeGeometry(shape),new T.MeshBasicMaterial({color:0x7d278e,side:T.DoubleSide}));arrow.rotation.x=-Math.PI/2;
 const direction=new T.Group();direction.position.y=.12;arrow.position.z=-1.1;direction.add(arrow);root.add(direction);
 let t=0;
 function update(dt:number,speed:number,jump:number,heading:number,calm:boolean){t+=dt;const bob=calm?0:Math.abs(Math.sin(t*9))*Math.min(1,speed/4.6)*.14;sprite.position.y=.13+jump+bob;material.rotation=calm?0:Math.sin(t*9)*Math.min(1,speed/4.6)*.035;direction.rotation.y=heading-Math.PI;shadow.scale.setScalar(1+jump*.15);(shadow.material as T.MeshBasicMaterial).opacity=.17/(1+jump)}
 return {root,update,dispose(){texture.dispose()}};
}
