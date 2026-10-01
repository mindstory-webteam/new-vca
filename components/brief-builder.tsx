'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {useSearchParams} from 'next/navigation';
import {ArrowLeft,ArrowRight,Check,CheckCircle,Loader2,ClipboardList} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Checkbox} from '@/components/ui/checkbox';
import {services,industries,goals} from '@/lib/content';
import {
  submitToBigin,
  createLeadId,
  splitName,
  orNull,
  mapServicesToBigin,
  mapBudgetToBigin,
  parseBudgetAmount,
  closingDateFromTiming,
} from '@/lib/bigin';

const TIMINGS=['Let’s discuss','As soon as possible','Within a month','In the next 2–3 months','Just exploring'];

// Same ranges as the Bigin "Monthly/Project Budget" field, so they map exactly.
const BUDGET_OPTIONS=['Below ₹25K/month','₹25K–₹50K/month','₹50K–₹1L/month','₹1L–₹3L/month','₹3L+/month','Let’s discuss'];

/** Reads a display name from a content list item, whatever it is called. */
function labelOf(list:readonly {id:string}[],id:string){
  const item=list.find(x=>x.id===id) as {name?:string;label?:string;title?:string}|undefined;
  return item?.name||item?.label||item?.title||id;
}

type SiteResult={ok:true;reference:string}|{ok:false;error:string};

export function BriefBuilder(){
  const query=useSearchParams();
  const queryKey=query.toString();
  const [step,setStep]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState(''),[reference,setReference]=useState(''),[submissionId,setSubmissionId]=useState('');
  const [data,setData]=useState({business:'',name:'',email:'',phone:'',location:'',industry:'food',goal:'visits',services:[] as string[],requirement:'',timing:'Let’s discuss',links:'',budget:'',assessment:'',consent:false});

  useEffect(()=>{
    setSubmissionId(crypto.randomUUID());
    setData(d=>({...d,
      industry:industries.some(i=>i.id===query.get('industry'))?query.get('industry')!:'food',
      goal:goals.some(i=>i.id===query.get('goal'))?query.get('goal')!:'visits',
      location:(query.get('location')||'').slice(0,150),
      services:(query.get('services')||'').split(',').filter(s=>services.some(v=>v.slug===s)),
      requirement:(query.get('idea')||'').slice(0,4000),
      assessment:(query.get('assessment')||'').slice(0,4000)
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[queryKey]);

  function field<K extends keyof typeof data>(k:K,v:typeof data[K]){setData(d=>({...d,[k]:v}));setError('')}

  function advance(e:React.FormEvent){
    e.preventDefault();setError('');setStep(s=>s+1);
    document.querySelector('.brief-layout')?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  /** 1. Save on the website (your /api/briefs). */
  async function saveToSite():Promise<SiteResult>{
    try{
      const response=await fetch('/api/briefs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,submissionId})});
      const result=await response.json() as {saved?:boolean;reference?:string;error?:string};
      if(!response.ok||!result.saved||!result.reference)return {ok:false,error:result.error||'Could not save your brief.'};
      return {ok:true,reference:result.reference};
    }catch{
      return {ok:false,error:'Could not save your brief. Please try again.'};
    }
  }

  /** 2. Send the same brief to Bigin. Every empty field goes as "null". */
  async function sendToBigin(leadId:string){
    const serviceNames=data.services.map(slug=>services.find(s=>s.slug===slug)?.name).filter((n):n is string=>Boolean(n));
    const industryName=labelOf(industries,data.industry);
    const goalName=goals.find(g=>g.id===data.goal)?.name||'Something else';
    const {firstName,lastName}=splitName(data.name);

    const description=[
      data.requirement.trim()||'null',
      '',
      `Email: ${orNull(data.email)}`,
      `Phone: ${orNull(data.phone)}`,
      `Website / social links: ${orNull(data.links)}`,
    ].join('\n');

    const stageQuestions=[
      `Website reference: ${leadId}`,
      `Business: ${orNull(data.business)}`,
      `Location: ${orNull(data.location)}`,
      `Industry: ${orNull(industryName)}`,
      `Main priority: ${orNull(goalName)}`,
      `Services: ${serviceNames.join(', ')||'null'}`,
      `Timing: ${orNull(data.timing)}`,
      `Budget: ${orNull(data.budget)}`,
      `Email: ${orNull(data.email)}`,
      `Links: ${orNull(data.links)}`,
      '',
      'Presence check answers:',
      data.assessment.trim()||'null',
    ].join('\n');

    try{
      await submitToBigin({
        leadId,
        firstName,
        lastName,
        mobile:data.phone,
        email:data.email,
        companyName:data.business,
        location:data.location,
        amount:parseBudgetAmount(data.budget),
        service:mapServicesToBigin(serviceNames),
        budget:mapBudgetToBigin(data.budget),
        closingDate:closingDateFromTiming(data.timing),
        description,
        stageQuestions,
        consent:data.consent,
        leadPageUrl:window.location.href,
        utmSource:query.get('utm_source')||'',
        utmCampaign:query.get('utm_campaign')||'',
        utmContent:query.get('utm_content')||'',
      });
      return true;
    }catch(e){
      console.warn('Bigin submission failed',e);
      return false;
    }
  }

  async function submit(){
    if(busy||!submissionId)return;
    if(!data.consent){setError('Please agree to share these details for your enquiry.');return}
    setBusy(true);setError('');

    const site=await saveToSite();
    const ref=site.ok?site.reference:createLeadId();
    const biginOk=await sendToBigin(ref);

    if(site.ok||biginOk){
      if(!site.ok)console.warn('Website save failed, brief reached Bigin:',site.error);
      setReference(ref);
    }else{
      setError(site.error);
    }
    setBusy(false);
  }

  if(reference)return <div className="brief-success"><CheckCircle size={54}/><h2>Your brief is saved.</h2><p>Thanks, {data.name.split(' ')[0]}. Your business details and requirements have been recorded.</p><div className="reference"><span>YOUR REFERENCE</span><strong>{reference}</strong></div><p className="small-note">Your brief is ready for review. Service availability, timing and the next conversation still need to be confirmed.</p><div className="button-row"><Button asChild className="button purple"><Link href="/learn">Explore local knowledge</Link></Button></div></div>;

  return <div className="brief-layout">
    <aside className="brief-aside">
      <span className="icon-tile"><ClipboardList/></span>
      <h2>Tell us<br/>your story.</h2>
      <p>A few useful details help us understand where to start.</p>
      <ol>{['Your business','Your requirement','Review & send'].map((s,i)=><li key={s} className={step===i?'active':step>i?'completed':''}><span>{step>i?<Check size={17}/>:i+1}</span>{s}</li>)}</ol>
      <div className="small-note">Your details are only saved when you send this brief.</div>
    </aside>

    <div className="brief-form">
      {step===0&&<form onSubmit={advance}>
        <h2>First, the essentials.</h2>
        <div className="form-grid">
          <div className="field"><Label htmlFor="business">Business name *</Label><Input id="business" autoComplete="organization" required minLength={2} maxLength={150} value={data.business} onChange={e=>field('business',e.target.value)} placeholder="What’s your business called?"/></div>
          <div className="field"><Label htmlFor="location">Town or neighbourhood *</Label><Input id="location" required minLength={2} maxLength={150} value={data.location} onChange={e=>field('location',e.target.value)} placeholder="Where are you based?"/></div>
          <div className="field"><Label htmlFor="budget">Monthly budget <span>(optional)</span></Label><Input id="budget" list="budget-options" maxLength={60} value={data.budget} onChange={e=>field('budget',e.target.value)} placeholder="Choose a range or type your own"/><datalist id="budget-options">{BUDGET_OPTIONS.map(b=><option key={b} value={b}/>)}</datalist></div>
          <div className="field"><Label htmlFor="name">Your name *</Label><Input id="name" autoComplete="name" required minLength={2} maxLength={120} value={data.name} onChange={e=>field('name',e.target.value)} placeholder="What should we call you?"/></div>
          <div className="field"><Label htmlFor="email">Email address *</Label><Input id="email" type="email" autoComplete="email" required maxLength={200} value={data.email} onChange={e=>field('email',e.target.value)} placeholder="you@yourbusiness.com"/></div>
          <div className="field"><Label htmlFor="phone">Phone number <span>(optional)</span></Label><Input id="phone" type="tel" autoComplete="tel" maxLength={30} pattern="[0-9+().\-\s]*" value={data.phone} onChange={e=>field('phone',e.target.value)} placeholder="Include your country code"/></div>
        </div>
        <Button type="submit" className="button purple">Tell us what you need <ArrowRight/></Button>
      </form>}

      {step===1&&<form onSubmit={advance}>
        <h2>What’s next for your business?</h2>
        <div className="field"><Label htmlFor="brief-goal">Your main priority</Label><select id="brief-goal" value={data.goal} onChange={e=>field('goal',e.target.value)}>{goals.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}<option value="other">Something else</option></select></div>
        <fieldset className="field"><legend>Services you’re curious about <span>(optional)</span></legend><div className="service-checkboxes">{services.map(s=><label key={s.slug}><Checkbox checked={data.services.includes(s.slug)} onCheckedChange={()=>field('services',data.services.includes(s.slug)?data.services.filter(x=>x!==s.slug):[...data.services,s.slug])}/>{s.name}</label>)}</div></fieldset>
        <div className="field"><Label htmlFor="requirement">Tell us a little more *</Label><Textarea id="requirement" rows={5} minLength={10} maxLength={4000} required value={data.requirement} onChange={e=>field('requirement',e.target.value)} placeholder="What do you want to work on? What should we know about your business?"/><small>At least 10 characters. Include any selected idea you want to explore.</small></div>
        <div className="form-grid">
          <div className="field"><Label htmlFor="timing">When are you thinking?</Label><select id="timing" value={data.timing} onChange={e=>field('timing',e.target.value)}>{TIMINGS.map(x=><option key={x}>{x}</option>)}</select></div>
          <div className="field"><Label htmlFor="links">Website or social links <span>(optional)</span></Label><Input id="links" value={data.links} maxLength={1000} onChange={e=>field('links',e.target.value)} placeholder="Your website or social profile"/></div>
        </div>
        {data.assessment&&<div className="attached-assessment"><CheckCircle size={18}/><span>Your presence check answers are included.</span><Button type="button" variant="ghost" size="sm" onClick={()=>field('assessment','')}>Remove</Button></div>}
        <div className="tool-nav"><Button type="button" variant="ghost" onClick={()=>setStep(0)}><ArrowLeft/> Back</Button><Button type="submit" className="button purple">Review my brief <ArrowRight/></Button></div>
      </form>}

      {step===2&&<div>
        <h2>One last look.</h2>
        <dl className="brief-review">
          <div><dt>Business</dt><dd>{data.business}<small>{data.location}</small></dd></div>
          <div><dt>Contact</dt><dd>{data.name}<small>{data.email}{data.phone&&' · '+data.phone}</small></dd></div>
          <div><dt>Priority</dt><dd>{goals.find(g=>g.id===data.goal)?.name||'Something else'}</dd></div>
          <div><dt>Services</dt><dd>{data.services.map(slug=>services.find(s=>s.slug===slug)?.name).join(', ')||'Help me decide'}</dd></div>
          <div><dt>Your requirement</dt><dd className="preserve-lines">{data.requirement}</dd></div>
          <div><dt>Timing</dt><dd>{data.timing}</dd></div>
          {data.budget&&<div><dt>Budget</dt><dd>{data.budget}</dd></div>}
          {data.links&&<div><dt>Your links</dt><dd>{data.links}</dd></div>}
          {data.assessment&&<div><dt>Presence check</dt><dd className="preserve-lines small-note">{data.assessment}</dd></div>}
        </dl>
        <label className="consent"><Checkbox checked={data.consent} onCheckedChange={v=>field('consent',v===true)}/><span>I agree to share these details so Viral Cat can review and respond to my enquiry. <Link href="/privacy">Privacy information</Link></span></label>
        {error&&<p className="error-message" role="alert">{error}</p>}
        <div className="tool-nav"><Button variant="ghost" disabled={busy} onClick={()=>setStep(1)}><ArrowLeft/> Edit details</Button><Button className="button purple" disabled={busy||!data.consent||!submissionId} onClick={submit}>{busy?<Loader2 className="spin"/>:<ArrowRight/>}{busy?'Saving your brief…':'Send my brief'}</Button></div>
      </div>}
    </div>
  </div>;
}