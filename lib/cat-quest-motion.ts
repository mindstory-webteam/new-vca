import {clearPath,walkable,type Point} from './cat-walk-world';
export const START_HEADING=Math.PI;
export const CAMERA_OFFSET=Math.PI/4;
export const turnDelta=(from:number,to:number)=>Math.atan2(Math.sin(to-from),Math.cos(to-from));
export const followHeading=(current:number,target:number,dt:number,rate=5)=>current+turnDelta(current,target)*(1-Math.exp(-rate*dt));
/** Path clicks use the same collision map as saved movement. No teleporting. */
export function findWalkRoute(from:Point,wanted:Point):Point[]{
 const nearby=(p:Point)=>{const list:Point[]=[];for(let dx=-6;dx<=6;dx++)for(let dz=-6;dz<=6;dz++){const q={x:Math.round(p.x)+dx,z:Math.round(p.z)+dz};if(walkable(q))list.push(q)}return list.sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))};
 const start=nearby(from).find(p=>clearPath(from,p)),end=nearby(wanted)[0];if(!start||!end)return[];
 const exact=walkable(wanted)&&clearPath(end,wanted)?wanted:end;
 if(clearPath(from,exact))return [exact];
 const key=(p:Point)=>`${p.x},${p.z}`;const queue=[start],parents=new Map<string,Point|null>([[key(start),null]]);let found=false;
 for(let cursor=0;cursor<queue.length;cursor++){const p=queue[cursor];if(key(p)===key(end)){found=true;break}for(const [x,z]of [[1,0],[-1,0],[0,1],[0,-1]]){const q={x:p.x+x,z:p.z+z},k=key(q);if(!parents.has(k)&&walkable(q)&&clearPath(p,q)){parents.set(k,p);queue.push(q)}}}
 if(!found)return[];const route:Point[]=[exact];let p:Point|null=end;while(p){route.unshift(p);p=parents.get(key(p))||null}
 // Greedily shorten only collision-free segments; retain corners for server sampling.
 const result:Point[]=[];let here=from,index=0;while(index<route.length){let far=index;while(far+1<route.length&&clearPath(here,route[far+1]))far++;if(Math.hypot(route[far].x-here.x,route[far].z-here.z)>.025){result.push(route[far]);here=route[far]}index=far+1}return result;
}
