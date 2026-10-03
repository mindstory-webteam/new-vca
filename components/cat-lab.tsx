'use client';
import {useEffect,useId,useState} from 'react';
import Link from 'next/link';
import {ArrowUpRight,ArrowRight,ArrowLeft,Check,CheckCircle,Loader2,Printer,RotateCcw,Lightbulb,MapPin,Sparkles} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Checkbox} from '@/components/ui/checkbox';
import {Slider} from '@/components/ui/slider';
import {Progress} from '@/components/ui/progress';
import {CatIcon} from '@/components/shared';
import {services,industries,goals,checks} from '@/lib/content';
import {recommendServices} from '@/lib/finder';
import {industryPages} from '@/lib/industry-pages';
import {sendLeadToBigin,createLeadId,splitName,orNull,mapServicesToBigin,mapBudgetToBigin,parseBudgetAmount,closingDateFromTiming,readUtm} from '@/lib/bigin-bridge';
type ModelContext={registerTool:(tool:{name:string;title:string;description:string;inputSchema:object;annotations:object;execute:(input:unknown)=>unknown},options:{signal:AbortSignal})=>void|Promise<void>};

/* =====================================================
   Shared sending: website (/api/briefs) + Bigin
   ===================================================== */
type Contact={name:string;business:string;email:string;phone:string;location:string;budget:string;requirement:string};
type BriefSend={
  form:string;                    // e.g. "Service Finder"
  submissionId:string;
  contact:Contact;
  consent:boolean;
  serviceNames:string[];          // services shown to the visitor
  details:[string,string][];      // extra fields for Bigin Description
  sitePayload:Record<string,unknown>; // same body the website saved before
};
type SendResult={ok:true;reference:string}|{ok:false;error:string};

async function saveToSite(body:Record<string,unknown>):Promise<SendResult>{
  try{
    const response=await fetch('/api/briefs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const result=await response.json().catch(()=>({})) as {saved?:boolean;reference?:string;error?:string};
    if(!response.ok||!result.saved||!result.reference)return {ok:false,error:result.error||'We could not save your brief. Please try again.'};
    return {ok:true,reference:result.reference};
  }catch{
    return {ok:false,error:'We could not save your brief. Your details are still here.'};
  }
}

function sendToBigin(leadId:string,b:BriefSend){
  const c=b.contact;
  const {firstName,lastName}=splitName(c.name);
  const utm=readUtm();
  const pageUrl=window.location.href;
  const servicesText=b.serviceNames.join(', ')||'Help me decide';

  // Every field without its own Bigin column goes into Description as text
  const description=[
    `${b.form.toUpperCase()} ENQUIRY`,
    `Reference: ${leadId}`,
    `Submitted: ${new Date().toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}`,
    '',
    'REQUIREMENT',
    orNull(c.requirement),
    '',
    b.form.toUpperCase()+' DETAILS',
    ...b.details.map(([k,v])=>`${k}: ${orNull(v)}`),
    `Services: ${servicesText}`,
    '',
    'CONTACT',
    `Name: ${orNull(c.name)}`,
    `Email: ${orNull(c.email)}`,
    `Phone: ${orNull(c.phone)}`,
    '',
    'BUSINESS',
    `Business: ${orNull(c.business)}`,
    `Town or neighbourhood: ${orNull(c.location)}`,
    `Budget (as entered): ${orNull(c.budget)}`,
    'Timing: Let’s discuss',
    '',
    'TRACKING',
    `Page: ${pageUrl}`,
    `UTM source: ${orNull(utm.source)}`,
    `UTM medium: ${orNull(utm.medium)}`,
    `UTM campaign: ${orNull(utm.campaign)}`,
    `UTM content: ${orNull(utm.content)}`,
    `UTM term: ${orNull(utm.term)}`,
  ].join('\n');

  const stageQuestions=[
    `Website reference: ${leadId}`,
    `Form: ${b.form}`,
    `Business: ${orNull(c.business)}`,
    `Location: ${orNull(c.location)}`,
    `Services: ${servicesText}`,
    `Budget: ${orNull(c.budget)}`,
    `Email: ${orNull(c.email)}`,
    ...b.details.map(([k,v])=>`${k}: ${orNull(v)}`),
    '',
    'Requirement:',
    orNull(c.requirement),
  ].join('\n');

  return sendLeadToBigin({
    leadId,
    leadName:`${c.business.trim()||c.name.trim()} – ${c.name.trim()} (${b.form})`,
    firstName,
    lastName,
    mobile:c.phone,
    companyName:c.business.trim()||c.name.trim(),
    location:c.location,
    amount:parseBudgetAmount(c.budget),
    service:mapServicesToBigin(b.serviceNames),
    budget:mapBudgetToBigin(c.budget),
    closingDate:closingDateFromTiming('Let’s discuss'),
    description,
    stageQuestions,
    consent:b.consent,
    leadPageUrl:pageUrl,
    utmSource:utm.source,
    utmCampaign:utm.campaign,
    utmContent:utm.content,
  });
}

/** Saves on the website and sends to Bigin. Succeeds if either one worked. */
async function sendBrief(b:BriefSend):Promise<SendResult>{
  const site=await saveToSite({submissionId:b.submissionId,...b.sitePayload});
  const reference=site.ok?site.reference:createLeadId();
  const biginOk=await sendToBigin(reference,b);
  if(site.ok||biginOk){
    if(!site.ok)console.warn('Website save failed, brief reached Bigin:',site.error);
    return {ok:true,reference};
  }
  return {ok:false,error:site.error};
}

const serviceNamesFor=(slugs:string[])=>slugs.map(slug=>services.find(s=>s.slug===slug)?.name).filter((n):n is string=>Boolean(n));

/* =====================================================
   Service Finder
   ===================================================== */
export function ServiceFinder(){const id=useId();const [industry,setIndustry]=useState('food'),[goal,setGoal]=useState('visits');const chosen=goals.find(g=>g.id===goal)!;const selected=recommendServices(industry,goal);
 const [stage,setStage]=useState<'recommend'|'form'|'done'>('recommend');
 const [name,setName]=useState(''),[business,setBusiness]=useState(''),[email,setEmail]=useState(''),[location,setLocation]=useState(''),[phone,setPhone]=useState(''),[budget,setBudget]=useState(''),[requirement,setRequirement]=useState(''),[consent,setConsent]=useState(false);
 const [submissionId,setSubmissionId]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[reference,setReference]=useState('');
 useEffect(()=>{setSubmissionId(crypto.randomUUID())},[]);
 useEffect(()=>{const context=(document as Document&{modelContext?:ModelContext}).modelContext;if(!context?.registerTool)return;const lifecycle=new AbortController();try{void Promise.resolve(context.registerTool({name:'configure_service_finder',title:'Find Viral Cat services',description:'Update the visible service finder using a business category and goal, and return the suggested starting services. Does not submit a brief.',inputSchema:{type:'object',properties:{industry:{type:'string',enum:industries.map(i=>i.id)},goal:{type:'string',enum:goals.map(g=>g.id)}},required:['industry','goal'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input:unknown){const v=input as {industry?:string;goal?:string};if(!v||!industries.some(i=>i.id===v.industry)||!goals.some(g=>g.id===v.goal))throw new Error('Choose a valid business category and goal.');setIndustry(v.industry!);setGoal(v.goal!);return new Promise(resolve=>requestAnimationFrame(()=>resolve({industry:v.industry,goal:v.goal,services:recommendServices(v.industry!,v.goal!).map(s=>({name:s.name,slug:s.slug}))}))) }},{signal:lifecycle.signal})).catch(()=>{})}catch{}return()=>lifecycle.abort()},[]);
 async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(busy||!submissionId)return;if(!consent){setError('Please agree to share these details for your enquiry.');return}setBusy(true);setError('');
  const result=await sendBrief({
   form:'Service Finder',submissionId,consent,
   contact:{name,business,email,phone,location,budget,requirement},
   serviceNames:selected.map(s=>s.name),
   details:[['Industry',industries.find(i=>i.id===industry)?.name||industry],['Main priority',chosen.name]],
   sitePayload:{name,business,email,phone,location,industry,goal,services:selected.map(s=>s.slug),requirement,timing:'Let’s discuss',links:'',budget,assessment:'',consent:true}
  });
  if(result.ok){setReference(result.reference);setStage('done')}else setError(result.error);
  setBusy(false)}
 return <div className="finder-layout"><div className="finder-controls"><h3>What do you do?</h3><div className="choice-grid">{industries.map(i=><button type="button" key={i.id} className={'choice-card '+(industry===i.id?'selected':'')} onClick={()=>setIndustry(i.id)} aria-pressed={industry===i.id}><CatIcon name={i.icon} size={22}/>{i.name}{industry===i.id&&<Check size={16}/>}</button>)}</div><h3>What’s on your mind?</h3><div className="goal-options">{goals.map(g=><button type="button" key={g.id} className={goal===g.id?'selected':''} onClick={()=>setGoal(g.id)} aria-pressed={goal===g.id}><span className="radio-dot"/>{g.name}</button>)}</div></div><div className="finder-result" aria-live="polite">
 {stage==='recommend'&&<><span className="quiet-caption">A few ways we could help</span><h2>Say hello to<br/>your Cat crew.</h2><p>For {industries.find(i=>i.id===industry)?.label}, with a focus on {chosen.name.toLowerCase()}.</p><p className="finder-industry-reason">{industryPages[industry]?.priorities[0]}</p><div className="recommendations">{selected.map((s,i)=><Link key={s.slug} href={'/services/'+s.slug}><span className="icon-tile"><CatIcon name={s.icon}/></span><div><small>{s.cat}</small><h4>{s.name}</h4><p>{s.short}</p></div><ArrowUpRight size={18}/></Link>)}</div><p className="small-note">A suggested starting point. Your location and actual business needs shape the final scope.</p><Button type="button" className="button purple" onClick={()=>setStage('form')}>Use this mix in my brief <ArrowRight/></Button></>}
 {stage==='form'&&<form onSubmit={submit}><span className="quiet-caption">A few ways we could help</span><h2>Tell us a<br/>little about you.</h2><p>Your enquiry will include {selected.map(s=>s.name).join(', ')}.</p><div className="form-grid"><div className="field"><Label htmlFor={id+'name'}>Your name *</Label><Input id={id+'name'} autoComplete="name" required minLength={2} maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></div><div className="field"><Label htmlFor={id+'business'}>Business name *</Label><Input id={id+'business'} autoComplete="organization" required minLength={2} maxLength={150} value={business} onChange={e=>setBusiness(e.target.value)}/></div><div className="field"><Label htmlFor={id+'email'}>Email address *</Label><Input id={id+'email'} type="email" autoComplete="email" required maxLength={200} value={email} onChange={e=>setEmail(e.target.value)}/></div><div className="field"><Label htmlFor={id+'location'}>Town or neighbourhood *</Label><Input id={id+'location'} autoComplete="address-level2" required minLength={2} maxLength={150} value={location} onChange={e=>setLocation(e.target.value)}/></div></div><div className="field"><Label htmlFor={id+'phone'}>Phone number <span>(optional)</span></Label><Input id={id+'phone'} type="tel" autoComplete="tel" maxLength={40} value={phone} onChange={e=>setPhone(e.target.value)}/></div><div className="field"><Label htmlFor={id+'budget'}>Monthly budget <span>(optional)</span></Label><Input id={id+'budget'} list={id+'budget-options'} maxLength={60} value={budget} onChange={e=>setBudget(e.target.value)} placeholder="Choose a range or type your own"/><datalist id={id+'budget-options'}><option value="Under ₹25,000/month"/><option value="₹25,000 – ₹50,000/month"/><option value="₹50,000 – ₹1,00,000/month"/><option value="Above ₹1,00,000/month"/><option value="Let’s discuss"/></datalist></div><div className="field"><Label htmlFor={id+'requirement'}>What would you like help with? *</Label><Textarea id={id+'requirement'} required minLength={10} maxLength={4000} rows={4} value={requirement} onChange={e=>setRequirement(e.target.value)} placeholder="Tell us about your business and what you want to work on."/></div><label className="consent"><Checkbox checked={consent} onCheckedChange={v=>setConsent(v===true)}/><span>I agree to share these details for this enquiry. <Link href="/privacy">Privacy information</Link></span></label>{error&&<p className="error-message" role="alert">{error}</p>}<div className="button-row"><Button type="button" variant="ghost" onClick={()=>setStage('recommend')}><ArrowLeft/> Back</Button><Button type="submit" className="button purple" disabled={busy||!submissionId}>{busy?<Loader2 className="spin"/>:<ArrowUpRight/>} {busy?'Saving your brief…':'Send my brief'}</Button></div></form>}
 {stage==='done'&&<div className="finder-success" role="status"><CheckCircle size={42}/><h2>Your brief is saved.</h2><p>Keep this reference for your next conversation.</p><strong>{reference}</strong><p className="small-note">Scope and timing will be confirmed with you.</p></div>}
 </div></div>}

/* =====================================================
   Presence Check
   ===================================================== */
export function PresenceCheck(){const id=useId();const [answers,setAnswers]=useState<(string|null)[]>(Array(6).fill(null)),[step,setStep]=useState(0),[done,setDone]=useState(false);const [stage,setStage]=useState<'results'|'form'|'sent'>('results');
 const [name,setName]=useState(''),[business,setBusiness]=useState(''),[email,setEmail]=useState(''),[location,setLocation]=useState(''),[phone,setPhone]=useState(''),[budget,setBudget]=useState(''),[requirement,setRequirement]=useState(''),[consent,setConsent]=useState(false);
 const [submissionId,setSubmissionId]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[reference,setReference]=useState('');
 useEffect(()=>{setSubmissionId(crypto.randomUUID())},[]);
 const yes=answers.filter(a=>a==='yes').length;const gaps=checks.filter((_,i)=>answers[i]!=='yes');const selected=[...new Set(gaps.map(c=>services[c.service].slug))];const summary=checks.map((c,i)=>`${c.q} ${answers[i]||'Unanswered'}`).join('\n');
 function reset(){setAnswers(Array(6).fill(null));setStep(0);setDone(false);setStage('results')}
 async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(busy||!submissionId)return;if(!consent){setError('Please agree to share these details for your enquiry.');return}setBusy(true);setError('');
  const result=await sendBrief({
   form:'Presence Check',submissionId,consent,
   contact:{name,business,email,phone,location,budget,requirement},
   serviceNames:serviceNamesFor(selected),
   details:[['Score',`${yes} of 6 foundations in place`],['Answers','\n'+summary]],
   sitePayload:{name,business,email,phone,location,industry:'other',goal:'other',services:selected,requirement,timing:'Let’s discuss',links:'',budget,assessment:summary,consent:true}
  });
  if(result.ok){setReference(result.reference);setStage('sent')}else setError(result.error);
  setBusy(false)}
 return <div className="check-tool">{!done?<><div className="tool-progress"><span>QUESTION {step+1} OF 6</span><span>{Math.round(step/6*100)}% complete</span></div><Progress value={step/6*100}/><div className="question-area"><span className="question-number">0{step+1}</span><h2>{checks[step].q}</h2><p>{checks[step].hint}</p><div className="answer-options">{[['yes','Yes, we do'],['no','Not yet'],['unsure','I’m not sure']].map(([id,label])=><Button key={id} variant="outline" className={answers[step]===id?'chosen':''} aria-pressed={answers[step]===id} onClick={()=>setAnswers(a=>a.map((v,i)=>i===step?id:v))}>{label}{answers[step]===id&&<Check size={18}/>}</Button>)}</div></div><div className="tool-nav"><Button variant="ghost" disabled={step===0} onClick={()=>setStep(s=>s-1)}><ArrowLeft/> Back</Button><Button className="button purple" disabled={!answers[step]} onClick={()=>step===5?setDone(true):setStep(s=>s+1)}>{step===5?'See my next steps':'Next question'}<ArrowRight/></Button></div></>:<>
 {stage==='results'&&<div className="check-results" aria-live="polite"><div className="results-heading"><div className="result-ring" style={{'--score':`${yes/6*100}%`} as React.CSSProperties}><span><strong>{yes}<small>/ 6</small></strong>foundations in place</span></div><div><h2>{yes===6?'A useful foundation. Keep building.':'A little focus can go a long way.'}</h2><p>{yes} {yes===1?'area feels':'areas feel'} covered based on your answers. {gaps.length?`Here are ${gaps.length} practical next steps to explore.`:'Keep your information current and review how people respond.'}</p></div></div><p className="disclosure">This is a self-assessment based on your answers. It is not a live website or Google profile audit, and it does not predict business results.</p><div className="result-actions">{checks.map((c,i)=><article className={answers[i]==='yes'?'covered':''} key={c.q}><span>{answers[i]==='yes'?<CheckCircle size={22}/>:<Lightbulb size={22}/>}</span><div><small>{answers[i]==='yes'?'KEEP IT UP':answers[i]==='unsure'?'WORTH CHECKING':'YOUR NEXT STEP'}</small><h3>{c.action}</h3>{answers[i]!=='yes'&&<Link className="text-link" href={'/services/'+services[c.service].slug}>Explore {services[c.service].name.toLowerCase()} <ArrowUpRight size={16}/></Link>}</div><Button variant="ghost" size="sm" onClick={()=>{setDone(false);setStep(i)}}>Edit answer</Button></article>)}</div><div className="button-row"><Button type="button" className="button purple" onClick={()=>setStage('form')}>Include this in my brief <ArrowRight/></Button><Button variant="outline" onClick={()=>window.print()}><Printer/> Print my snapshot</Button><Button variant="ghost" onClick={reset}><RotateCcw/> Start again</Button></div></div>}
 {stage==='form'&&<form className="check-results" onSubmit={submit}><div className="results-heading"><div className="result-ring" style={{'--score':`${yes/6*100}%`} as React.CSSProperties}><span><strong>{yes}<small>/ 6</small></strong>foundations in place</span></div><div><h2>Tell us a<br/>little about you.</h2><p>Your brief will include your {yes} of 6 snapshot and {selected.length?selected.map(slug=>services.find(s=>s.slug===slug)?.name).filter(Boolean).join(', '):'a general review'}.</p></div></div><div className="form-grid"><div className="field"><Label htmlFor={id+'name'}>Your name *</Label><Input id={id+'name'} autoComplete="name" required minLength={2} maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></div><div className="field"><Label htmlFor={id+'business'}>Business name *</Label><Input id={id+'business'} autoComplete="organization" required minLength={2} maxLength={150} value={business} onChange={e=>setBusiness(e.target.value)}/></div><div className="field"><Label htmlFor={id+'email'}>Email address *</Label><Input id={id+'email'} type="email" autoComplete="email" required maxLength={200} value={email} onChange={e=>setEmail(e.target.value)}/></div><div className="field"><Label htmlFor={id+'location'}>Town or neighbourhood *</Label><Input id={id+'location'} autoComplete="address-level2" required minLength={2} maxLength={150} value={location} onChange={e=>setLocation(e.target.value)}/></div></div><div className="field"><Label htmlFor={id+'phone'}>Phone number <span>(optional)</span></Label><Input id={id+'phone'} type="tel" autoComplete="tel" maxLength={40} value={phone} onChange={e=>setPhone(e.target.value)}/></div><div className="field"><Label htmlFor={id+'budget'}>Monthly budget <span>(optional)</span></Label><Input id={id+'budget'} list={id+'budget-options'} maxLength={60} value={budget} onChange={e=>setBudget(e.target.value)} placeholder="Choose a range or type your own"/><datalist id={id+'budget-options'}><option value="Under ₹25,000/month"/><option value="₹25,000 – ₹50,000/month"/><option value="₹50,000 – ₹1,00,000/month"/><option value="Above ₹1,00,000/month"/><option value="Let’s discuss"/></datalist></div><div className="field"><Label htmlFor={id+'requirement'}>What would you like help with? *</Label><Textarea id={id+'requirement'} required minLength={10} maxLength={4000} rows={4} value={requirement} onChange={e=>setRequirement(e.target.value)} placeholder="Tell us about your business and what you want to work on."/></div><label className="consent"><Checkbox checked={consent} onCheckedChange={v=>setConsent(v===true)}/><span>I agree to share these details for this enquiry. <Link href="/privacy">Privacy information</Link></span></label>{error&&<p className="error-message" role="alert">{error}</p>}<div className="button-row"><Button type="button" variant="ghost" onClick={()=>setStage('results')}><ArrowLeft/> Back</Button><Button type="submit" className="button purple" disabled={busy||!submissionId}>{busy?<Loader2 className="spin"/>:<ArrowUpRight/>} {busy?'Saving your brief…':'Send my brief'}</Button></div></form>}
 {stage==='sent'&&<div className="check-results finder-success" role="status"><CheckCircle size={42}/><h2>Your brief is saved.</h2><p>Keep this reference for your next conversation.</p><strong>{reference}</strong><p className="small-note">Scope and timing will be confirmed with you.</p><div className="button-row"><Button variant="ghost" onClick={reset}><RotateCcw/> Start again</Button></div></div>}
 </>}</div>}

/* =====================================================
   Idea Lab (no form – unchanged)
   ===================================================== */
export function IdeaLab(){const [industry,setIndustry]=useState('food'),[occasion,setOccasion]=useState('everyday'),[goal,setGoal]=useState('visits'),[result,setResult]=useState<{industry:string;occasion:string;goal:string}|null>(null);const i=industries.find(i=>i.id===(result?.industry||industry))!;const occasionCopy:Record<string,{title:string;copy:string}>={everyday:{title:i.idea,copy:i.detail},launch:{title:'Meet your new neighbour.',copy:`Introduce your ${i.name.toLowerCase()} business, show the people behind it and share exactly where to find you.`},festival:{title:'A local reason to celebrate.',copy:'Connect a relevant local occasion to a real product or experience. Show current availability and keep the invitation specific.'},new:{title:'Something new around here.',copy:'Reveal one new product or service. Show how it works and answer the first question a customer might ask.'}};const concept=occasionCopy[result?.occasion||occasion];const ideas=[{title:concept.title,format:'SHORT VIDEO',copy:concept.copy},{title:'The question we hear most.',format:'CAROUSEL',copy:industryPages[i.id].stories[1]+' Finish with one clear next step for '+goals.find(g=>g.id===(result?.goal||goal))?.name.toLowerCase()+'.'},{title:'Meet the person behind it.',format:'STORY SERIES',copy:industryPages[i.id].stories[2]}];return <div className="idea-lab"><div className="tool-form"><div className="field"><Label htmlFor="idea-industry">My business</Label><select id="idea-industry" value={industry} onChange={e=>setIndustry(e.target.value)}>{industries.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</select></div><div className="field"><Label htmlFor="occasion">The occasion</Label><select id="occasion" value={occasion} onChange={e=>setOccasion(e.target.value)}><option value="everyday">Everyday storytelling</option><option value="launch">A new opening</option><option value="festival">A local occasion</option><option value="new">A new arrival or service</option></select></div><div className="field"><Label htmlFor="idea-goal">My priority</Label><select id="idea-goal" value={goal} onChange={e=>setGoal(e.target.value)}>{goals.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></div><Button className="button purple" onClick={()=>setResult({industry,occasion,goal})}>Find a little inspiration <Sparkles/></Button></div>{result?<div className="idea-results" aria-live="polite"><div className="section-heading"><div><h2>That’s a story<br/>waiting to happen.</h2></div><p>Curated starting ideas for your selections. Each one needs your real business details to make it yours.</p></div><div className="idea-grid">{ideas.map((idea,n)=><article key={n}><span className="quiet-caption">{idea.format}</span><h3>{idea.title}</h3><p>{idea.copy}</p><div className="idea-preparation"><strong>What to gather</strong><p>{industryPages[i.id].inputs[n]}</p></div><Link className="text-link" href={'/contact?industry='+result.industry+'&goal='+result.goal+'&idea='+encodeURIComponent(idea.title+' '+idea.copy)}>Explore this idea <ArrowUpRight size={17}/></Link></article>)}</div></div>:<div className="idea-empty"><Lightbulb size={45}/><h2>Your next idea starts here.</h2><p>Choose your business, occasion and priority. We’ll suggest three useful directions.</p></div>}</div>}

/* =====================================================
   Territory Planner
   ===================================================== */
export function TerritoryPlanner(){const id=useId();const [town,setTown]=useState(''),[radius,setRadius]=useState([5]),[model,setModel]=useState('visits');
 const [stage,setStage]=useState<'plan'|'form'|'sent'>('plan');
 const [name,setName]=useState(''),[business,setBusiness]=useState(''),[email,setEmail]=useState(''),[location,setLocation]=useState(''),[phone,setPhone]=useState(''),[budget,setBudget]=useState(''),[requirement,setRequirement]=useState(''),[consent,setConsent]=useState(false);
 const [submissionId,setSubmissionId]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[reference,setReference]=useState('');
 useEffect(()=>{setSubmissionId(crypto.randomUUID())},[]);
 const modelNote=model==='visits'?'customers visit us':model==='delivery'?'local delivery':'we travel to customers';
 function startForm(){setLocation(town.trim());if(!requirement.trim())setRequirement(`Territory planning: approximately ${radius[0]} km; ${modelNote}.`);setStage('form')}
 async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(busy||!submissionId)return;if(!consent){setError('Please agree to share these details for your enquiry.');return}setBusy(true);setError('');
  const plan=`Territory planning: approximately ${radius[0]} km; ${modelNote}.`;
  const result=await sendBrief({
   form:'Territory Planner',submissionId,consent,
   contact:{name,business,email,phone,location,budget,requirement},
   serviceNames:[],
   details:[['Town entered',town.trim()],['Approximate reach',`${radius[0]} km`],['How they serve customers',modelNote]],
   sitePayload:{name,business,email,phone,location,industry:'other',goal:'other',services:[],requirement,timing:'Let’s discuss',links:'',budget,assessment:plan,consent:true}
  });
  if(result.ok){setReference(result.reference);setStage('sent')}else setError(result.error);
  setBusy(false)}
 function reset(){setStage('plan');setReference('');setError('')}
 return <div className="territory-tool"><div><h2>Where do your<br/>customers come from?</h2><div className="field"><Label htmlFor="town">Your town or neighbourhood</Label><Input id="town" placeholder="e.g. Thrissur, Kerala" value={town} maxLength={150} onChange={e=>setTown(e.target.value)}/></div><div className="field"><Label htmlFor="business-model">How you serve customers</Label><select id="business-model" value={model} onChange={e=>setModel(e.target.value)}><option value="visits">Customers visit our location</option><option value="delivery">We deliver locally</option><option value="service">We travel to customers</option></select></div><div className="field"><Label>Approximate reach: {radius[0]} km</Label><Slider aria-label="Approximate customer reach in kilometres" min={1} max={30} step={1} value={radius} onValueChange={setRadius}/><div className="range-labels"><span>1 km</span><span>30 km</span></div></div>{!town.trim()?<Button className="button purple" disabled>Enter your town to continue <ArrowRight/></Button>:<Button type="button" className="button purple" onClick={startForm}>Discuss my area <ArrowRight/></Button>}<div className="territory-model-note"><strong>{model==='visits'?'Think in travel time.':model==='delivery'?'Start with reliable delivery.':'Plan the journey both ways.'}</strong><p>{model==='visits'?'Consider how far people will travel for your offer, convenient access and nearby alternatives.':model==='delivery'?'Match the area to your delivery capacity, fulfilment times and the experience you can consistently provide.':'Consider travel time, appointment availability and practical boundaries before promising coverage.'}</p></div></div>
 {stage==='plan'&&<div className="territory-visual"><svg viewBox="0 0 400 360" role="img" aria-label={`Illustrative customer reach of ${radius[0]} kilometres around your business`}><circle cx="200" cy="170" r="145" fill="none" stroke="#d7c4df" strokeDasharray="5 8"/><circle cx="200" cy="170" r="95" fill="none" stroke="#e1d3e7"/><circle cx="200" cy="170" r={48+radius[0]*3} fill="#792890" fillOpacity=".09" stroke="#792890" strokeWidth="2"/><path d="M40 170H360M200 20V320" stroke="#d8c9dc" strokeDasharray="3 6"/><circle cx="200" cy="170" r="20" fill="#f78b21"/><text x="200" y="176" textAnchor="middle" fontSize="15" fontWeight="700" fill="#291633">VC</text><text x="200" y="340" textAnchor="middle" fill="#792890" fontSize="16">{radius[0]} km • approximate radius</text></svg><h3>{town.trim()||'Your neighbourhood'}</h3><p>A planning illustration. Actual customer reach depends on roads, travel patterns and your business.</p>{town.trim()&&<a href={'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(town.trim())} target="_blank" rel="noopener noreferrer" className="text-link">Explore this location on Google Maps <ArrowUpRight size={17} style={{width:17,height:17,flexShrink:0}}/></a>}</div>}
 {stage==='form'&&<form className="territory-visual" onSubmit={submit}><h3>Tell us a<br/>little about you.</h3><p>Your enquiry will include this territory plan: approximately {radius[0]} km, {modelNote}.</p><div className="form-grid"><div className="field"><Label htmlFor={id+'name'}>Your name *</Label><Input id={id+'name'} autoComplete="name" required minLength={2} maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></div><div className="field"><Label htmlFor={id+'business'}>Business name *</Label><Input id={id+'business'} autoComplete="organization" required minLength={2} maxLength={150} value={business} onChange={e=>setBusiness(e.target.value)}/></div><div className="field"><Label htmlFor={id+'email'}>Email address *</Label><Input id={id+'email'} type="email" autoComplete="email" required maxLength={200} value={email} onChange={e=>setEmail(e.target.value)}/></div><div className="field"><Label htmlFor={id+'location'}>Town or neighbourhood *</Label><Input id={id+'location'} autoComplete="address-level2" required minLength={2} maxLength={150} value={location} onChange={e=>setLocation(e.target.value)}/></div></div><div className="field"><Label htmlFor={id+'phone'}>Phone number <span>(optional)</span></Label><Input id={id+'phone'} type="tel" autoComplete="tel" maxLength={40} value={phone} onChange={e=>setPhone(e.target.value)}/></div><div className="field"><Label htmlFor={id+'budget'}>Monthly budget <span>(optional)</span></Label><Input id={id+'budget'} list={id+'budget-options'} maxLength={60} value={budget} onChange={e=>setBudget(e.target.value)} placeholder="Choose a range or type your own"/><datalist id={id+'budget-options'}><option value="Under ₹25,000/month"/><option value="₹25,000 – ₹50,000/month"/><option value="₹50,000 – ₹1,00,000/month"/><option value="Above ₹1,00,000/month"/><option value="Let’s discuss"/></datalist></div><div className="field"><Label htmlFor={id+'requirement'}>What would you like help with? *</Label><Textarea id={id+'requirement'} required minLength={10} maxLength={4000} rows={4} value={requirement} onChange={e=>setRequirement(e.target.value)}/></div><label className="consent"><Checkbox checked={consent} onCheckedChange={v=>setConsent(v===true)}/><span>I agree to share these details for this enquiry. <Link href="/privacy">Privacy information</Link></span></label>{error&&<p className="error-message" role="alert">{error}</p>}<div className="button-row"><Button type="button" variant="ghost" onClick={()=>setStage('plan')}><ArrowLeft size={18} style={{width:18,height:18,flexShrink:0}}/> Back</Button><Button type="submit" className="button purple" disabled={busy||!submissionId}>{busy?<Loader2 className="spin" size={18} style={{width:18,height:18,flexShrink:0}}/>:<ArrowUpRight size={18} style={{width:18,height:18,flexShrink:0}}/>} {busy?'Saving your brief…':'Send my brief'}</Button></div></form>}
 {stage==='sent'&&<div className="territory-visual finder-success" role="status"><CheckCircle size={42} style={{width:42,height:42,flexShrink:0}}/><h3>Your brief is saved.</h3><p>Keep this reference for your next conversation.</p><strong>{reference}</strong><p className="small-note">Scope and timing will be confirmed with you.</p><div className="button-row"><Button variant="ghost" onClick={reset}><RotateCcw size={18} style={{width:18,height:18,flexShrink:0}}/> Start again</Button></div></div>}
 </div>}