'use client';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,Check,CheckCircle,Copy,Loader2,MapPin,PawPrint,RotateCcw,Sparkles} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Label} from '@/components/ui/label';
import {Checkbox} from '@/components/ui/checkbox';
import {industries} from '@/lib/content';
import {buildLocalCaption} from '@/lib/cat-interactions';
import {
  sendLeadToBigin,
  createLeadId,
  splitName,
  orNull,
  mapBudgetToBigin,
  parseBudgetAmount,
  closingDateFromTiming,
  readUtm,
} from '@/lib/bigin-bridge';

export {LocalStoryCarousel as LocalLens} from '@/components/local-story-carousel';

const TONES:Record<string,string>={friendly:'Warm & friendly',playful:'A little playful',clear:'Clear & simple'};
const ACTIONS:Record<string,string>={visit:'Visit the business',enquire:'Start a conversation',appointment:'Ask about an appointment'};

export function CaptionRemixer(){
  const [industry,setIndustry]=useState('food'),[tone,setTone]=useState('friendly'),[action,setAction]=useState('visit'),[business,setBusiness]=useState(''),[location,setLocation]=useState(''),[detail,setDetail]=useState(''),[budget,setBudget]=useState(''),[copied,setCopied]=useState(false),[copyError,setCopyError]=useState('');
  const [name,setName]=useState(''),[email,setEmail]=useState(''),[phone,setPhone]=useState(''),[consent,setConsent]=useState(false);
  const [submissionId,setSubmissionId]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[reference,setReference]=useState('');
  const [refCopied,setRefCopied]=useState(false);
  const thanksRef=useRef<HTMLDivElement>(null);

  const caption=buildLocalCaption({industry,tone,business,location,detail,action});

  useEffect(()=>{setCopied(false);setCopyError('')},[caption]);
  useEffect(()=>{setSubmissionId(crypto.randomUUID())},[]);

  // Bring the thank-you card into view once the brief is saved
  useEffect(()=>{
    if(reference)thanksRef.current?.scrollIntoView({behavior:'smooth',block:'center'});
  },[reference]);

  async function copyReference(){
    try{await navigator.clipboard.writeText(reference);setRefCopied(true);setTimeout(()=>setRefCopied(false),2000)}
    catch{/* the reference stays visible to copy by hand */}
  }

  function startOver(){
    setReference('');setRefCopied(false);setError('');setConsent(false);
    setSubmissionId(crypto.randomUUID());
  }

  async function copy(){
    try{await navigator.clipboard.writeText(caption);setCopied(true)}
    catch{setCopyError('Select the caption in the preview to copy it.')}
  }

  /** 1. Save on the website (/api/briefs), like before. */
  async function saveToSite():Promise<{ok:true;reference:string}|{ok:false;error:string}>{
    try{
      const response=await fetch('/api/briefs',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          submissionId,name,business,email,phone,location,industry,
          goal:'presence',
          services:['content-production','social-media'],
          requirement:`Caption starting point: ${caption}${detail?' Detail: '+detail:''}`,
          timing:'Let’s discuss',links:'',budget,assessment:'',consent:true
        })
      });
      const result=await response.json().catch(()=>({})) as {saved?:boolean;reference?:string;error?:string};
      if(!response.ok||!result.saved||!result.reference)return {ok:false,error:result.error||'Could not save your brief. Please try again.'};
      return {ok:true,reference:result.reference};
    }catch{
      return {ok:false,error:'Could not save your brief. Please try again.'};
    }
  }

  /** 2. Send the same enquiry to Bigin. Extra fields go into Description as text. */
  function sendToBigin(leadId:string){
    const industryName=industries.find(i=>i.id===industry)?.name||industry;
    const {firstName,lastName}=splitName(name);
    const utm=readUtm();
    const pageUrl=window.location.href;
    const company=business.trim()||name.trim();

    const description=[
      'CAPTION REMIXER ENQUIRY',
      `Reference: ${leadId}`,
      `Submitted: ${new Date().toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}`,
      '',
      'CAPTION THEY CREATED',
      caption,
      '',
      'CAPTION SETTINGS',
      `Industry: ${orNull(industryName)}`,
      `Tone: ${TONES[tone]||tone}`,
      `Invite people to: ${ACTIONS[action]||action}`,
      `Their detail: ${orNull(detail)}`,
      '',
      'CONTACT',
      `Name: ${orNull(name)}`,
      `Email: ${orNull(email)}`,
      `Phone: ${orNull(phone)}`,
      '',
      'BUSINESS',
      `Business: ${orNull(business)}`,
      `Neighbourhood: ${orNull(location)}`,
      `Budget (as entered): ${orNull(budget)}`,
      'Services: Content production, Social media',
      'Main priority: Local presence',
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
      'Form: Caption Remixer',
      `Business: ${orNull(business)}`,
      `Location: ${orNull(location)}`,
      `Industry: ${orNull(industryName)}`,
      `Tone: ${TONES[tone]||tone}`,
      `Budget: ${orNull(budget)}`,
      `Email: ${orNull(email)}`,
      '',
      'Caption:',
      caption,
    ].join('\n');

    return sendLeadToBigin({
      leadId,
      leadName:`${company} – ${name.trim()} (Caption Remixer)`,
      firstName,
      lastName,
      mobile:phone,
      companyName:company,
      location,
      amount:parseBudgetAmount(budget),
      service:'Digital Marketing',
      budget:mapBudgetToBigin(budget),
      closingDate:closingDateFromTiming('Let’s discuss'),
      description,
      stageQuestions,
      consent,
      leadPageUrl:pageUrl,
      utmSource:utm.source,
      utmCampaign:utm.campaign,
      utmContent:utm.content,
    });
  }

  async function submit(e:React.FormEvent){
    e.preventDefault();
    if(busy||!submissionId)return;
    if(!consent){setError('Please agree to share these details for your enquiry.');return}
    setBusy(true);setError('');

    const site=await saveToSite();
    const ref=site.ok?site.reference:createLeadId();
    const biginOk=await sendToBigin(ref);

    if(site.ok||biginOk){
      if(!site.ok)console.warn('Website save failed, enquiry reached Bigin:',site.error);
      setReference(ref);
    }else{
      setError(site.error);
    }
    setBusy(false);
  }

  return <section className="remix-section" id="story-remixer" aria-labelledby="remix-title">
    <div className="container">
      <div className="section-heading">
        <div><h2 id="remix-title">Sounds good.<br/><em>Now make it yours.</em></h2></div>
        <p>A few details. A different tone.<br/>Watch your next caption take shape.</p>
      </div>
      <form className="remix-workbench" onSubmit={submit}>
        <div className="remix-controls">
          <div className="form-grid">
            <div className="field"><Label htmlFor="remix-business">Your business name</Label><Input id="remix-business" placeholder="e.g. The Corner Café" maxLength={100} value={business} onChange={e=>setBusiness(e.target.value)}/></div>
            <div className="field"><Label htmlFor="remix-location">Your neighbourhood</Label><Input id="remix-location" placeholder="e.g. Thrissur" maxLength={100} value={location} onChange={e=>setLocation(e.target.value)}/></div>
          </div>
          <div className="field">
            <Label htmlFor="remix-industry">What kind of business?</Label>
            <select id="remix-industry" value={industry} onChange={e=>setIndustry(e.target.value)}>{industries.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</select>
          </div>
          <div className="field">
            <Label htmlFor="remix-budget">Monthly budget <span>(optional)</span></Label>
            <Input id="remix-budget" list="remix-budget-options" maxLength={60} value={budget} onChange={e=>setBudget(e.target.value)} placeholder="Choose a range or type your own"/>
            <datalist id="remix-budget-options">
              <option value="Under ₹25,000/month"/>
              <option value="₹25,000 – ₹50,000/month"/>
              <option value="₹50,000 – ₹1,00,000/month"/>
              <option value="Above ₹1,00,000/month"/>
              <option value="Let’s discuss"/>
            </datalist>
          </div>
          <div className="field"><Label htmlFor="remix-detail">One real detail that makes it yours</Label><Textarea id="remix-detail" rows={2} maxLength={300} placeholder="Your signature dish, a new arrival or something your team does well…" value={detail} onChange={e=>setDetail(e.target.value)}/></div>
          <fieldset className="remix-tone">
            <legend>Set the tone</legend>
            <div>{[['friendly','Warm & friendly'],['playful','A little playful'],['clear','Clear & simple']].map(([id,label])=>
              <Button type="button" variant="outline" key={id} className={tone===id?'selected':''} aria-pressed={tone===id} onClick={()=>setTone(id)}>{label}{tone===id&&<Check size={14}/>}</Button>
            )}</div>
          </fieldset>
          <div className="field remix-action">
            <Label htmlFor="remix-action">Invite people to…</Label>
            <select id="remix-action" value={action} onChange={e=>setAction(e.target.value)}>
              <option value="visit">Visit the business</option>
              <option value="enquire">Start a conversation</option>
              <option value="appointment">Ask about an appointment</option>
            </select>
          </div>
          <div className="form-grid">
            <div className="field"><Label htmlFor="remix-name">Your name *</Label><Input id="remix-name" autoComplete="name" required minLength={2} maxLength={120} value={name} onChange={e=>setName(e.target.value)} placeholder="What should we call you?"/></div>
            <div className="field"><Label htmlFor="remix-email">Email address *</Label><Input id="remix-email" type="email" autoComplete="email" required maxLength={200} value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@yourbusiness.com"/></div>
          </div>
          <div className="field"><Label htmlFor="remix-phone">Phone number <span>(optional)</span></Label><Input id="remix-phone" type="tel" autoComplete="tel" maxLength={40} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Include your country code"/></div>
          <label className="consent">
            <Checkbox checked={consent} onCheckedChange={v=>setConsent(v===true)}/>
            <span>I agree to share these details so Viral Cat can review and respond to my enquiry. <Link href="/privacy">Privacy information</Link></span>
          </label>
          {error&&<p className="error-message" role="alert">{error}</p>}
        </div>
        <div className="remix-preview-wrap">
          <div className="remix-preview">
            <div className="remix-preview-top">
              <div className="remix-avatar"><PawPrint size={23}/></div>
              <div><strong>{business.trim()||'Your business'}</strong><span><MapPin size={12}/>{location.trim()||'Your neighbourhood'}</span></div>
              <span className="remix-preview-label">CAPTION PREVIEW</span>
            </div>
            <div className="remix-caption" aria-label="Live caption preview">
              <span className="remix-quotation" aria-hidden="true">“</span>
              <p>{caption}</p>
            </div>
            <div className="remix-preview-bottom">
              <span><span/> {tone==='friendly'?'Warm & friendly':tone==='playful'?'A little playful':'Clear & simple'}</span>
              <span>{caption.length} characters</span>
            </div>
          </div>
          {reference?
            <div className="remix-thanks" role="status" aria-live="polite" ref={thanksRef}>
              <div className="remix-thanks-head">
                <span className="remix-thanks-icon"><CheckCircle size={28}/></span>
                <div>
                  <h3>Thank you{name.trim()?`, ${name.trim().split(/\s+/)[0]}`:''}!</h3>
                  <p>Your brief is saved. Our team will look at your details and caption idea, then get back to you soon.</p>
                </div>
              </div>

              <div className="remix-thanks-ref">
                <div>
                  <span>Your reference</span>
                  <strong>{reference}</strong>
                </div>
                <button type="button" onClick={copyReference} aria-label="Copy reference">
                  {refCopied?<Check size={16}/>:<Copy size={16}/>} {refCopied?'Copied':'Copy'}
                </button>
              </div>

              <ol className="remix-thanks-steps">
                <li><span>1</span>We read your brief and the caption you created.</li>
                <li><span>2</span>We contact you at <b>{email.trim()||'your email'}</b>{phone.trim()?<> or <b>{phone.trim()}</b></>:null}.</li>
                <li><span>3</span>We agree the next step together. No commitment until then.</li>
              </ol>

              <div className="remix-thanks-actions">
                <Button asChild className="button purple"><Link href="/work">See our work <ArrowUpRight/></Link></Button>
                <Button type="button" variant="outline" onClick={startOver}><RotateCcw size={16}/> Create another caption</Button>
              </div>
            </div>
          :
            <div className="remix-actions">
              <Button type="button" variant="outline" onClick={copy}>{copied?<Check size={17}/>:<Copy size={17}/>} {copied?'Caption copied':'Copy caption'}</Button>
              <Button type="submit" className="button purple" disabled={busy||!submissionId}>{busy?<Loader2 className="spin"/>:<ArrowUpRight/>} {busy?'Saving your brief…':'Send my brief'}</Button>
            </div>
          }
          {copyError&&<p role="status" className="small-note">{copyError}</p>}
          <p className="remix-disclaimer">A curated starting draft using the details you enter. Check your facts and availability before sharing.</p>
        </div>
      </form>
    </div>
  

    <style>{`
      .remix-thanks{background:#fff;border:1px solid rgba(107,42,163,.18);border-radius:22px;padding:28px;margin-top:18px;box-shadow:0 18px 40px rgba(76,29,120,.12);animation:remixThanksIn .45s ease both}
      .remix-thanks-head{display:flex;gap:16px;align-items:flex-start}
      .remix-thanks-icon{flex:none;width:52px;height:52px;border-radius:16px;background:#e9f8f0;color:#1f9a62;display:grid;place-items:center}
      .remix-thanks h3{font-size:clamp(22px,2.4vw,28px);line-height:1.15;margin:2px 0 6px;color:#1b1430}
      .remix-thanks-head p{margin:0;color:#5c5470;font-size:15.5px;line-height:1.55}
      .remix-thanks-ref{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:22px 0 18px;padding:14px 16px;border:1.5px dashed #8b4fc4;border-radius:14px;background:#f6effc}
      .remix-thanks-ref span{display:block;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#6d5a85}
      .remix-thanks-ref strong{display:block;font-size:20px;letter-spacing:.05em;color:#3d1466;word-break:break-all}
      .remix-thanks-ref button{flex:none;display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(107,42,163,.3);background:#fff;color:#5b2391;border-radius:999px;padding:8px 14px;font:inherit;font-size:14px;font-weight:600;cursor:pointer}
      .remix-thanks-ref button:hover{background:#efe3fa}
      .remix-thanks-ref button:focus-visible{outline:2px solid #6b2aa3;outline-offset:2px}
      .remix-thanks-steps{list-style:none;margin:0 0 22px;padding:0;display:grid;gap:10px}
      .remix-thanks-steps li{display:flex;gap:12px;align-items:flex-start;color:#3b3450;font-size:15px;line-height:1.5}
      .remix-thanks-steps li span{flex:none;width:24px;height:24px;border-radius:50%;background:#6b2aa3;color:#fff;font-size:12.5px;font-weight:700;display:grid;place-items:center;margin-top:1px}
      .remix-thanks-steps b{font-weight:600;color:#1b1430;word-break:break-all}
      .remix-thanks-actions{display:flex;flex-wrap:wrap;gap:12px}
      @keyframes remixThanksIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
      @media (prefers-reduced-motion:reduce){.remix-thanks{animation:none}}
      @media (max-width:560px){
        .remix-thanks{padding:22px 18px}
        .remix-thanks-head{flex-direction:column;gap:12px}
        .remix-thanks-ref{flex-direction:column;align-items:flex-start}
        .remix-thanks-actions>*{width:100%;justify-content:center}
      }
    `}</style>
  </section>
}