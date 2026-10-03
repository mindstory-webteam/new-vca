// Frame map for the cursor-following cat, using the 90 frames in /public/cat-frames/
// named 'Layer 1.avif' … 'Layer 90.avif' (Layer N = every 5th frame of the cat video).
// x / y = the cursor direction each pose looks toward (-1 left/up … 1 right/down).
// Edit x / y here if you want a pose to react to a different area of the screen.
export type CatPose={id:string;x:number;y:number;hold:number;into:number[]};
export const CAT_FRAMES={
  path:'/cat-frames/',
  file:'Layer {n}.avif', // {n} = layer number
  removeWhite:true, // the layers have a white background: cut it out in the browser
  crop:{x:380,y:120,w:1140,h:952}, // area of the 1930×1072 layer that holds the cat
  width:640,
  height:534,
  pad:70, // side space so the body can stay planted while frames shift
  frameMs:85, // time per layer during turns and clips (lower = faster)
  poses:[
    {id:'idle',x:0.0,y:0.0,hold:5,into:[]},
    {id:'p066',x:0.6,y:0.5,hold:14,into:[11,12]},
    {id:'p090',x:0.1,y:0.0,hold:18,into:[16]},
    {id:'p114',x:-0.6,y:-0.65,hold:24,into:[21,22,23]},
    {id:'p144',x:0.6,y:-0.65,hold:30,into:[26,27,28]},
    {id:'p180',x:0.9,y:0.05,hold:37,into:[32,33,34]},
    {id:'p216',x:-0.6,y:0.5,hold:44,into:[39,40,41]},
    {id:'p255',x:-0.9,y:0.05,hold:52,into:[48,49,50]},
  ] as CatPose[],
  clips:{
    wave:[54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69],
    laugh:[79,80,81,82,83,84,85],
  } as Record<'wave'|'laugh',number[]>,
  /** horizontal correction per layer (px at 640 wide) so the body doesn't drift */
  dx:{1:14,2:14,3:14,4:14,5:14,6:14,7:14,8:14,9:14,10:14,11:18,12:31,13:35,14:35,15:35,16:34,17:32,18:32,19:32,20:32,21:34,22:39,23:40,24:40,25:40,26:20,27:-27,28:-32,29:-32,30:-32,31:-32,32:-33,33:-30,34:-30,35:-30,36:-30,37:-30,38:-30,39:-15,40:-8,41:-11,42:-1,43:-1,44:-7,45:-5,46:0,47:-4,48:-12,49:-11,50:-9,51:-8,52:-8,53:-8,54:-6,55:34,56:5,57:0,58:-29,59:-37,60:-39,61:-39,62:-34,63:-29,64:-37,65:-37,66:-37,67:-24,68:-9,69:-2,70:0,71:0,72:0,73:0,74:-1,75:1,76:1,77:1,78:1,79:1,80:7,81:14,82:15,83:10,84:11,85:11,86:11,87:11,88:11,89:11,90:11} as Record<number,number>,
};