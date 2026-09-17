export type Point={x:number;z:number};
export const WALK_VERSION=1;
export const SPAWN:Point={x:0,z:22};
export const WORLD_LIMIT=29;
export const WALK_SPEED=4.6;
export const RUN_SPEED=7;
export const SERVER_SPEED=7.5;
export const MOVEMENT_CAP=19;
export const PICKUP_RADIUS=1.5;
export const districts=[
 {name:'Discovery Square',short:'Get found',color:'#ffc354',service:'local-discovery'},
 {name:'Story Lane',short:'Create',color:'#ff9179',service:'content-production'},
 {name:'Local Market',short:'Reach nearby',color:'#bca0ff',service:'local-campaigns'},
 {name:'Hello Corner',short:'Build trust',color:'#67d9cc',service:'social-media'},
 {name:'Insight Park',short:'Learn & grow',color:'#a7d872',service:'local-strategy'},
] as const;
export const pickups=[
 {id:'find-1',district:0,x:-3,z:21,title:'Put your business on the map.',tip:'An accurate map pin helps nearby customers find the actual entrance. Check it from the street, not just your desk.'},
 {id:'find-2',district:0,x:-8,z:17,title:'Keep your hours fresh.',tip:'Update opening hours and holiday changes so a new customer does not arrive at a closed door.'},
 {id:'find-3',district:0,x:-16,z:18,title:'Make the next step obvious.',tip:'A clear call, directions or message button turns local discovery into an easy next action.'},
 {id:'find-4',district:0,x:-16,z:10,title:'Show the real place.',tip:'Recent photos of the entrance, people and products help visitors recognise your business when they arrive.'},
 {id:'story-1',district:1,x:-17,z:1,title:'Start with something familiar.',tip:'A local landmark, everyday moment or common customer question makes your content feel relevant.'},
 {id:'story-2',district:1,x:-16,z:-7,title:'Show it being made.',tip:'Real product demonstrations and behind-the-scenes moments give people evidence, not just a sales claim.'},
 {id:'story-3',district:1,x:-17,z:-16,title:'Give your story a destination.',tip:'Tell people what to do next: visit, book or enquire. One clear invitation is easier to follow than five.'},
 {id:'story-4',district:1,x:-24,z:-16,title:'Let your people be seen.',tip:'Introduce the team and the care behind the service. Familiar faces help a local business feel approachable.'},
 {id:'local-1',district:2,x:-8,z:-16,title:'Start with your real catchment.',tip:'Think about how far customers actually travel. A useful local audience can matter more than a huge distant one.'},
 {id:'local-2',district:2,x:0,z:-18,title:'Match the moment.',tip:'An office lunch crowd and evening shoppers need different messages. Plan around when people can act.'},
 {id:'local-3',district:2,x:8,z:-16,title:'Local relevance beats noise.',tip:'Use an offer or story that fits the neighbourhood. A smaller relevant campaign can be more useful than broad attention.'},
 {id:'local-4',district:2,x:16,z:-16,title:'Test a little before scaling.',tip:'Try a focused campaign, check actual enquiries and adjust. A larger budget cannot fix an unclear message.'},
 {id:'hello-1',district:3,x:16,z:-7,title:'Answer the actual question.',tip:'If someone asks about a price, opening time or location, give a specific helpful answer before asking them to buy.'},
 {id:'hello-2',district:3,x:17,z:1,title:'Only promise what you can deliver.',tip:'Check stock and appointment availability before confirming. A reliable experience protects trust.'},
 {id:'hello-3',district:3,x:16,z:10,title:'Ask for honest feedback.',tip:'Invite real customers to share genuine reviews. Avoid bought reviews or rewards tied to positive ratings.'},
 {id:'hello-4',district:3,x:17,z:18,title:'Follow up with permission.',tip:'Useful follow-ups can help people decide. Respect their preferences and make it easy to stop hearing from you.'},
 {id:'learn-1',district:4,x:8,z:17,title:'Views are attention.',tip:'Reach, views and likes tell you that people noticed. They do not, by themselves, prove a sale or a visit.'},
 {id:'learn-2',district:4,x:1,z:13,title:'Enquiries are a different signal.',tip:'Track useful messages and calls separately from views. Ask what people needed and whether the business could help.'},
 {id:'learn-3',district:4,x:0,z:5,title:'Connect the online and offline story.',tip:'Ask visitors how they found you and record confirmed bookings or purchases. Keep measurement consistent.'},
 {id:'learn-4',district:4,x:0,z:-5,title:'Learn, then improve.',tip:'Use real outcomes to choose the next message, audience or offer. Local growth comes from steady testing and service.'},
] as const;
export const buildings=[
 {x:-24,z:7,w:7,d:10,h:6.1,color:0xc497e7,name:'THE CORNER CAFÉ',kind:'cafe'},
 {x:-24,z:-7,w:7,d:10,h:8.2,color:0xeec07b,name:'STORY STUDIO',kind:'studio'},
 {x:-8,z:7,w:7,d:9,h:5.3,color:0xe5a09b,name:'BAKE & BLOOM',kind:'cafe'},
 {x:-8,z:-7,w:7,d:9,h:7.5,color:0x9bc9ce,name:'LOCAL GOODS',kind:'shop'},
 {x:8,z:7,w:7,d:9,h:6.4,color:0xc1a3de,name:'HELLO SALON',kind:'shop'},
 {x:8,z:-7,w:7,d:9,h:5.5,color:0xdbc785,name:'THE BOOK NOOK',kind:'shop'},
 {x:24,z:7,w:7,d:10,h:7.1,color:0x8bc3b1,name:'NEIGHBOURHOOD GYM',kind:'studio'},
 {x:24,z:-7,w:7,d:10,h:5.2,color:0xc995bd,name:'FRESH DAILY',kind:'shop'},
 {x:-24,z:-24,w:7,d:7,h:7.7,color:0x9cb6d0,name:'VIRAL CAT',kind:'studio'},
 {x:-8,z:-24,w:7,d:7,h:6,color:0xcea9d7,name:'LOCAL MARKET',kind:'shop'},
 {x:8,z:-24,w:7,d:7,h:8,color:0xe0b38c,name:'MADE NEARBY',kind:'shop'},
 {x:24,z:-24,w:7,d:7,h:6.7,color:0x9cbfad,name:'GOOD COMPANY',kind:'cafe'},
] as const;
export function walkable(p:Point){if(!Number.isFinite(p.x)||!Number.isFinite(p.z)||Math.abs(p.x)>WORLD_LIMIT||Math.abs(p.z)>WORLD_LIMIT)return false;return !buildings.some(b=>Math.abs(p.x-b.x)<b.w/2+.42&&Math.abs(p.z-b.z)<b.d/2+.42)}
export function clearPath(a:Point,b:Point){const distance=Math.hypot(b.x-a.x,b.z-a.z);const steps=Math.max(1,Math.ceil(distance/.3));for(let i=1;i<=steps;i++)if(!walkable({x:a.x+(b.x-a.x)*i/steps,z:a.z+(b.z-a.z)*i/steps}))return false;return true}
export function districtCounts(collected:readonly string[]){return districts.map((_,d)=>pickups.filter(p=>p.district===d&&collected.includes(p.id)).length)}
export type WalkState={version:number;sessionId:string;position:Point;collected:string[];at:number;budget:number};
export function safeWalk(raw:string|null|undefined):WalkState|null{try{const v=JSON.parse(raw||'null');if(v?.version===WALK_VERSION&&walkable(v.position)&&Array.isArray(v.collected)&&typeof v.sessionId==='string'&&Number.isFinite(v.at)&&Number.isFinite(v.budget))return {...v,collected:[...new Set<string>(v.collected.filter((id:string)=>pickups.some(p=>p.id===id)))]};return null}catch{return null}}
export function validateWalk(state:WalkState,path:Point[],now:number){let current=state.position;let distance=0;const found=new Set(state.collected);for(const p of path){if(!clearPath(current,p))throw new Error('That route crosses a building or leaves the neighbourhood.');distance+=Math.hypot(p.x-current.x,p.z-current.z);for(const coin of pickups)if(Math.hypot(coin.x-p.x,coin.z-p.z)<=PICKUP_RADIUS)found.add(coin.id);current=p}const allowance=Math.min(MOVEMENT_CAP,state.budget+SERVER_SPEED*Math.max(0,now-state.at)/1000);if(distance>allowance+.00001)throw new Error('Your movement could not be confirmed. Resume from your last saved position.');return {...state,position:current,collected:[...found],at:now,budget:Math.max(0,allowance-distance)}}
