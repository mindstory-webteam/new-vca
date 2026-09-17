export type Direction='U'|'R'|'D'|'L';
export type Cell={x:number;y:number};
export type PuzzleState={cat:Cell;crates:Cell[];moves:number};
export const puzzles=[
 {name:'The café around the corner',task:'Help a new café get found.',parcel:'PIN',color:'#ffc36d',par:8,map:['#######','#.....#','#...o.#','#..$..#','#.@...#','#.....#','#######'],lesson:'A correct map pin, opening hours and a clear way to call help nearby customers find the door.',delivered:'A clear map pin brings people to the right doorstep.'},
 {name:'Something worth sharing',task:'Get the bakery’s story out.',parcel:'POST',color:'#f2aaad',par:15,map:['#######','#.....#','#o..#.#','#..$..#','#.#...#','#...@.#','#######'],lesson:'Show the people and care behind the product. A real moment, followed by a clear invitation, gives a post a purpose.',delivered:'A real story gives someone a reason to stop scrolling.'},
 {name:'Hello, neighbours',task:'Bring the message closer to home.',parcel:'LOCAL',color:'#b69bd9',par:20,map:['########','#......#','#.o.#..#','#...$..#','#..#...#','#.$..o.#','#..@...#','########'],lesson:'Start with people who can actually visit. Match the message and timing to their routine, then check the enquiries it brings.',delivered:'The right local audience matters more than a very large one.'},
 {name:'A little help goes a long way',task:'Make it easy to say yes.',parcel:'HELLO',color:'#8ed0bd',par:23,map:['########','#......#','#.o..o.#','#..#...#','#..$$..#','#..@...#','#......#','########'],lesson:'Helpful replies turn questions into next steps. Share accurate details, check availability and follow up with permission.',delivered:'A useful reply can turn a question into a visit.'},
 {name:'Look what grew',task:'Put the useful signals in place.',parcel:'GROW',color:'#c0d790',par:32,map:['#########','#.......#','#.o...o.#','#...#...#','#..$$$..#','#.......#','#...o...#','#...@...#','#########'],lesson:'Views, enquiries and purchases tell different stories. Track each one separately, then use the outcomes to choose your next move.',delivered:'Count enquiries and confirmed visits as well as views.'}
] as const;
export const sameCell=(a:Cell,b:Cell)=>a.x===b.x&&a.y===b.y;
export const deltas:Record<Direction,Cell>={U:{x:0,y:-1},R:{x:1,y:0},D:{x:0,y:1},L:{x:-1,y:0}};
export function startPuzzle(stage:number):PuzzleState{const p=puzzles[stage];if(!p)throw Error('Choose a puzzle.');const crates:Cell[]=[];let cat:Cell|undefined;p.map.forEach((row,y)=>[...row].forEach((cell,x)=>{if(cell==='$')crates.push({x,y});if(cell==='@')cat={x,y}}));if(!cat)throw Error('Missing cat');return {cat,crates,moves:0}}
export function goals(stage:number):Cell[]{const result:Cell[]=[];puzzles[stage].map.forEach((row,y)=>[...row].forEach((c,x)=>{if(c==='o')result.push({x,y})}));return result}
export function floor(stage:number,c:Cell){const row=puzzles[stage]?.map[c.y];return !!row&&c.x>=0&&c.x<row.length&&row[c.x]!=='#'}
export function deliveredCount(stage:number,s:PuzzleState){return s.crates.filter(c=>goals(stage).some(g=>sameCell(c,g))).length}
export function complete(stage:number,s:PuzzleState){return deliveredCount(stage,s)===s.crates.length}
export function movePuzzle(stage:number,state:PuzzleState,direction:Direction):PuzzleState|null{
 const d=deltas[direction];if(!d)return null;const target={x:state.cat.x+d.x,y:state.cat.y+d.y};if(!floor(stage,target))return null;
 const crates=state.crates.map(c=>({...c})),box=crates.findIndex(c=>sameCell(c,target));if(box>=0){const beyond={x:target.x+d.x,y:target.y+d.y};if(!floor(stage,beyond)||crates.some(c=>sameCell(c,beyond)))return null;crates[box]=beyond}
 return {cat:target,crates,moves:state.moves+1};
}
export function stuckCrate(stage:number,state:PuzzleState){return state.crates.some(c=>!goals(stage).some(g=>sameCell(g,c))&&(!floor(stage,{x:c.x-1,y:c.y})||!floor(stage,{x:c.x+1,y:c.y}))&&(!floor(stage,{x:c.x,y:c.y-1})||!floor(stage,{x:c.x,y:c.y+1})))}
export function validatePuzzle(stage:number,moves:string){if(!Number.isInteger(stage)||stage<0||stage>=puzzles.length||!moves.length||moves.length>400||!/^[URDL]+$/.test(moves))throw Error('Use the moves shown in the puzzle.');let state=startPuzzle(stage);for(const direction of moves){if(complete(stage,state))throw Error('The puzzle was already finished.');const next=movePuzzle(stage,state,direction as Direction);if(!next)throw Error('A move passes through a wall or another parcel.');state=next}if(!complete(stage,state))throw Error('Deliver every parcel before saving this puzzle.');return {score:moves.length<=puzzles[stage].par?200:150,state}}

/** Find a short route, then remember its remaining steps for instant follow-up hints. */
const hintCache=new Map<string,Direction>();
const stateKey=(stage:number,s:PuzzleState)=>stage+':'+s.cat.x+','+s.cat.y+'@'+s.crates.map(c=>c.x+','+c.y).sort().join('|');
export async function puzzleHint(stage:number,state:PuzzleState):Promise<Direction|null>{
 if(complete(stage,state)||stuckCrate(stage,state))return null;
 const cached=hintCache.get(stateKey(stage,state));if(cached)return cached;
 const key=(c:Cell)=>c.x+','+c.y,targets=goals(stage);
 function reach(s:PuzzleState){const occupied=new Set(s.crates.map(key)),paths=new Map<string,string>([[key(s.cat),'']]),queue=[s.cat];for(let i=0;i<queue.length;i++)for(const dir of ['U','R','D','L'] as Direction[]){const d=deltas[dir],p={x:queue[i].x+d.x,y:queue[i].y+d.y},k=key(p);if(floor(stage,p)&&!occupied.has(k)&&!paths.has(k)){paths.set(k,paths.get(key(queue[i]))!+dir);queue.push(p)}}return paths}
 const distance=(a:Cell,b:Cell)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
 function estimate(s:PuzzleState){function match(i:number,used:number):number{if(i===s.crates.length)return 0;return Math.min(...targets.map((g,j)=>used&(1<<j)?Infinity:distance(s.crates[i],g)+match(i+1,used|(1<<j))))}return match(0,0)+Math.max(0,Math.min(...s.crates.map(c=>distance(s.cat,c)))-1)}
 type Node={state:PuzzleState;path:string;cost:number;rank:number};
 const heap:Node[]=[];
 function push(n:Node){heap.push(n);let i=heap.length-1;while(i>0){const parent=(i-1)>>1;if(heap[parent].rank<=n.rank)break;heap[i]=heap[parent];i=parent}heap[i]=n}
 function pop(){const first=heap[0],last=heap.pop()!;if(heap.length){let i=0;while(i*2+1<heap.length){let child=i*2+1;if(child+1<heap.length&&heap[child+1].rank<heap[child].rank)child++;if(heap[child].rank>=last.rank)break;heap[i]=heap[child];i=child}heap[i]=last}return first}
 push({state,path:'',cost:0,rank:estimate(state)});const best=new Map([[stateKey(stage,state),0]]);
 for(let count=0;heap.length&&count<60000;count++){
  if(count%80===79)await new Promise(resolve=>setTimeout(resolve,0));const node=pop();if(node.cost!==best.get(stateKey(stage,node.state)))continue;
  if(complete(stage,node.state)){let cursor=state;if(hintCache.size>10000)hintCache.clear();for(const direction of node.path){hintCache.set(stateKey(stage,cursor),direction as Direction);cursor=movePuzzle(stage,cursor,direction as Direction)!}return node.path[0] as Direction}
  const reachable=reach(node.state);
  for(const [index,box]of node.state.crates.entries())for(const dir of ['U','R','D','L'] as Direction[]){const d=deltas[dir],behind={x:box.x-d.x,y:box.y-d.y},beyond={x:box.x+d.x,y:box.y+d.y},walk=reachable.get(key(behind));if(walk===undefined||!floor(stage,beyond)||node.state.crates.some(c=>sameCell(c,beyond)))continue;
   const crates=node.state.crates.map((c,i)=>i===index?beyond:c),next={cat:box,crates,moves:0};if(stuckCrate(stage,next))continue;const cost=node.cost+walk.length+1,k=stateKey(stage,next);if(cost>=(best.get(k)??Infinity))continue;best.set(k,cost);push({state:next,path:node.path+walk+dir,cost,rank:cost+estimate(next)});
  }
 }
 return null;
}
