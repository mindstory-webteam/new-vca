'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {ArrowUpRight,Check,CheckCircle,Copy,Loader2,MapPin,PawPrint,Sparkles} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Label} from '@/components/ui/label';
import {Checkbox} from '@/components/ui/checkbox';
import {industries} from '@/lib/content';
import {buildLocalCaption} from '@/lib/cat-interactions';

export {LocalStoryCarousel as LocalLens} from '@/components/local-story-carousel';

export function CaptionRemixer(){
  const [industry,setIndustry]=useState('food'),[tone,setTone]=useState('friendly'),[action,setAction]=useState('visit'),[business,setBusiness]=useState(''),[location,setLocation]=useState(''),[detail,setDetail]=useState(''),[budget,setBudget]=useState(''),[copied,setCopied]=useState(false),[copyError,setCopyError]=useState('');
  const [name,setName]=useState(''),[email,setEmail]=useState(''),[phone,setPhone]=useState(''),[consent,setConsent]=useState(false);
  const [submissionId,setSubmissionId]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[reference,setReference]=useState('');

  const caption=buildLocalCaption({industry,tone,business,location,detail,action});

  useEffect(()=>{setCopied(false);setCopyError('')},[caption]);
  useEffect(()=>{setSubmissionId(crypto.randomUUID())},[]);

  async function copy(){
    try{await navigator.clipboard.writeText(caption);setCopied(true)}
    catch{setCopyError('Select the caption in the preview to copy it.')}
  }

  async function submit(e:React.FormEvent){
    e.preventDefault();
    if(busy||!submissionId)return;
    if(!consent){setError('Please agree to share these details for your enquiry.');return}
    setBusy(true);setError('');
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
      const result=await response.json() as {saved?:boolean;reference?:string;error?:string};
      if(!response.ok||!result.saved||!result.reference)throw new Error(result.error||'Could not save your brief. Please try again.');
      setReference(result.reference);
    }catch(err){
      setError(err instanceof Error?err.message:'Could not save your brief. Please try again.');
    }finally{
      setBusy(false);
    }
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
            <div className="remix-success" role="status">
              <CheckCircle size={34}/>
              <h3>Your brief is saved.</h3>
              <p>Keep this reference for your next conversation.</p>
              <strong>{reference}</strong>
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
  </section>
}