import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import ts from 'typescript';
const require=createRequire(import.meta.url);
function load(path,imports={}){const js=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const m={exports:{}};new Function('require','module','exports',js)(name=>name in imports?imports[name]:require(name),m,m.exports);return m.exports}
const content=load('lib/content.ts'),pages=load('lib/service-pages.ts').servicePages;let unavailable=false;
// In-memory stand-in for the file storage in lib/server.ts.
const store=new Map();
const helpers={
 findBrief:async id=>{if(unavailable)throw new Error('Storage unavailable');return store.get(id)||null},
 saveBrief:async record=>{if(unavailable)throw new Error('Storage unavailable');if(store.has(record.submissionId))return store.get(record.submissionId);store.set(record.submissionId,record);return record},
 json:(data,status=200)=>Response.json(data,{status}),
 sameOrigin:r=>r.headers.get('origin')===new URL(r.url).origin,
 body:r=>r.json()
};
const route=load('app/api/briefs/route.ts',{'@/lib/server':helpers,'@/lib/content':content});
const send=data=>route.POST(new Request('https://site.test/api/briefs',{method:'POST',headers:{origin:'https://site.test','content-type':'application/json'},body:JSON.stringify(data)}));
const base={name:'Test Person',business:'Neighbourhood Shop',email:'person@example.test',phone:'',location:'Thrissur',requirement:'Please help with our local business.',industry:'other',goal:'other',timing:'Let’s discuss',links:'',assessment:'',consent:true};
const titles=new Set(),descriptions=new Set();
for(const s of content.services){const page=pages[s.slug];assert.ok(page&&page.faqs.length>=3&&page.steps.length===3);assert.ok(!titles.has(page.title));assert.ok(!descriptions.has(page.description));titles.add(page.title);descriptions.add(page.description);const submissionId=crypto.randomUUID(),payload={...base,submissionId,services:[s.slug]};const response=await send(payload);assert.equal(response.status,201);const result=await response.json();assert.equal(result.saved,true);assert.ok(result.reference);const stored=store.get(submissionId);assert.deepEqual(stored.services,[s.slug]);assert.equal(stored.email,base.email);assert.equal(stored.requirement,base.requirement);const repeated=await(await send(payload)).json();assert.equal(repeated.reference,result.reference)}
assert.equal(store.size,6);
for(const invalid of [{email:'invalid'},{name:' '},{requirement:'short'},{consent:false},{services:['non-existent-service']}])assert.equal((await send({...base,submissionId:crypto.randomUUID(),services:['local-strategy'],...invalid})).status,400);
for (const goal of ['visits','enquiries','launch']) {
 const submissionId=crypto.randomUUID();
 const attribution={source:'/local-growth',goal,utm_source:'meta',utm_medium:'paid-social',utm_campaign:'neighbourhood-introduction'};
 const payload={...base,submissionId,goal,services:['local-campaigns'],assessment:JSON.stringify(attribution)};
 const response=await send(payload);assert.equal(response.status,201);
 const result=await response.json();assert.ok(result.reference);
 const stored=store.get(submissionId);
 assert.equal(stored.goal,goal);assert.deepEqual(JSON.parse(stored.assessment),attribution);
 const repeated=await(await send(payload)).json();assert.equal(repeated.reference,result.reference);
}
console.log('Passed: campaign goals and source attribution are saved with enquiry references; retries do not create duplicates.');
unavailable=true;const failed=await send({...base,submissionId:crypto.randomUUID(),services:['local-strategy']});assert.equal(failed.status,503);assert.ok((await failed.json()).error);
console.log('Passed: all six service enquiry payloads persist the selected service; duplicate retries reuse the reference; invalid input is rejected; storage failures return errors. Six unique SEO descriptions and complete service content verified.');
