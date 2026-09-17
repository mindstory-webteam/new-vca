import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import ts from 'typescript';
const require=createRequire(import.meta.url),T=require('three');
const listeners=new Map(),canvasListeners=new Map();let renderFrame,lastCamera,lastScene,time=0;
const context={beginPath(){},roundRect(){},fill(){},fillText(){}};
const canvas={className:'',tabIndex:0,setAttribute(){},focus(){document.activeElement=canvas},setPointerCapture(){},hasPointerCapture(){return false},releasePointerCapture(){},remove(){},getBoundingClientRect:()=>({left:0,top:0,width:1200,height:700}),addEventListener(k,v){canvasListeners.set(k,v)},removeEventListener(){}};
globalThis.window={innerWidth:1200,addEventListener(k,v){listeners.set(k,v)},removeEventListener(){}};globalThis.document={activeElement:canvas,hidden:false,documentElement:{dataset:{}},createElement:()=>({getContext:()=>context}),addEventListener(){},removeEventListener(){}};globalThis.devicePixelRatio=1;globalThis.matchMedia=()=>({matches:false});globalThis.ResizeObserver=class{observe(){}disconnect(){}};globalThis.IntersectionObserver=class{observe(){}disconnect(){}};
class Renderer{domElement=canvas;shadowMap={};setPixelRatio(){}setSize(){}setAnimationLoop(fn){renderFrame=fn}render(scene,camera){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);lastCamera=camera;lastScene=scene}dispose(){}}
class Loader{async loadAsync(){return new T.Texture()}}
const three={...T,WebGLRenderer:Renderer,TextureLoader:Loader};const cache=new Map();
function load(file){if(cache.has(file))return cache.get(file);const js=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const m={exports:{}};new Function('require','module','exports',js)(name=>name==='three'?three:name.startsWith('@/lib/')?load('lib/'+name.slice(6)+'.ts'):name.startsWith('./')?load('lib/'+name.slice(2)+'.ts'):require(name),m,m.exports);cache.set(file,m.exports);return m.exports}
const world=load('lib/cat-walk-world.ts'),motion=load('lib/cat-quest-motion.ts');
for(const target of world.pickups){const path=motion.findWalkRoute(world.SPAWN,target);assert.ok(path.length,'Every spark has a tap route');let p=world.SPAWN;for(const q of path){assert.ok(world.clearPath(p,q));p=q}assert.ok(Math.hypot(p.x-target.x,p.z-target.z)<.01)}
assert.ok(Math.abs(motion.turnDelta(Math.PI-.02,-Math.PI+.02))<.05,'Camera crosses angle wrap by shortest path');
const host={clientWidth:1200,clientHeight:700,appendChild(){},contains:a=>a===canvas};let sampleQueue=[],latest={...world.SPAWN},camYaw=0,heading=Math.PI,pickupCount=0,nearby=null;
const engine=await load('lib/cat-walk-engine.ts').createWalkEngine(host,{onSample:p=>sampleQueue.push(p),onPickup:()=>pickupCount++,onFrame:(p,y,h)=>{latest=p;camYaw=y;heading=h},onNearby:n=>nearby=n,onTalk(){},onMoment(){},onLost(){throw Error('Unexpected loss')}});
let state={version:1,sessionId:'test',position:{...world.SPAWN},collected:[],at:0,budget:19};
function frames(n){for(let i=0;i<n;i++){time+=1000/60;renderFrame(time);if(Math.round(time*60/1000)%54===0&&sampleQueue.length){state=world.validateWalk(state,sampleQueue,time);sampleQueue=[]}}}
frames(10);engine.pause(false);const initial=camYaw;engine.input.x=1;frames(50);assert.ok(Math.abs(motion.turnDelta(initial,camYaw))>1,'Steering rotates the view while stationary');assert.ok(Math.hypot(latest.x-world.SPAWN.x,latest.z-world.SPAWN.z)<.01,'Steering alone does not move the cat');engine.input.x=0;engine.input.y=1;frames(35);assert.ok(Math.hypot(latest.x-world.SPAWN.x,latest.z-world.SPAWN.z)>1,'Forward movement follows heading');engine.pause(true);const stopped={...latest};frames(30);assert.deepEqual(latest,stopped,'Pause stops movement');
engine.restore(world.SPAWN,[]);state={...state,position:{...world.SPAWN},collected:[],at:time,budget:19};sampleQueue=[];engine.pause(false);frames(1);
const target=world.pickups.find(p=>p.id==='local-4');const screen=new T.Vector3(target.x,.1,target.z).project(lastCamera);const event={button:0,clientX:(screen.x+1)*600,clientY:(1-screen.y)*350,pointerId:1};canvasListeners.get('pointerdown')(event);canvasListeners.get('pointerup')(event);frames(1300);
assert.ok(Math.hypot(latest.x-target.x,latest.z-target.z)<.2,'Click route navigates around buildings to destination');assert.ok(pickupCount>0,'Route collects eligible sparks');
const other=new T.Vector3(world.SPAWN.x,.1,world.SPAWN.z).project(lastCamera);const again={...event,clientX:(other.x+1)*600,clientY:(1-other.y)*350};canvasListeners.get('pointerdown')(again);canvasListeners.get('pointerup')(again);frames(10);listeners.get('blur')();frames(10);const blurred={...latest};frames(40);assert.deepEqual(latest,blurred,'Window blur cancels an automatic route');
const art=lastScene.getObjectByName('Original Viral Cat artwork');assert.ok(art?.isSprite);assert.equal(art.material.map.repeat.x,470/1200);assert.equal(art.material.map.repeat.y,1);assert.ok(Math.abs(art.scale.x/art.scale.y-470/644)<1e-10,'Original mascot proportions are preserved');
lastScene.traverse(o=>{if(o.isInstancedMesh)assert.ok([...o.instanceMatrix.array].every(Number.isFinite),'Scene matrices remain finite')});engine.dispose();
console.log('Passed: 20 reachable click routes, shortest camera turns, steering view changes, forward movement, pause, click navigation around buildings, valid server movement samples, spark pickup and exact mascot crop/proportions.');
