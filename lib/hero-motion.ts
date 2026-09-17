export const bound=(value:number,min=0,max=1)=>Math.max(min,Math.min(max,value));
export function heroFrame(progress:number) {
  const p=bound(Number.isFinite(progress)?progress:0);
  return {progress:p,slide:Math.min(2,Math.floor(p*3)),yaw:Math.sin(p*Math.PI*2)*12,roll:Math.sin(p*Math.PI*2)*-3,depth:Math.sin(p*Math.PI)*70,scale:1+Math.sin(p*Math.PI)*.1,travel:Math.sin(p*Math.PI*2)*-24};
}
export const heroSlideProgress=(index:number)=>(bound(index,0,2)+.14)/3;
