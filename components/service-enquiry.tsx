'use client';
import {useEffect,useId,useState} from 'react';
import {ArrowUpRight,CheckCircle,Loader2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Checkbox} from '@/components/ui/checkbox';
import {contact} from '@/lib/contact';

export function ServiceEnquiry({slug,name}:{slug:string;name:string}){
  const id=useId();
  const [submissionId,setSubmissionId]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[reference,setReference]=useState(''),[consent,setConsent]=useState(false);
  useEffect(()=>setSubmissionId(crypto.randomUUID()),[]);

  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(busy)return;
    const form=new FormData(event.currentTarget);
    if(!consent){setError('Please agree to share these details for your enquiry.');return}
    setBusy(true);setError('');
    try{
      const response=await fetch('/api/briefs',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          submissionId,
          name:form.get('name'),
          business:form.get('business'),
          location:form.get('location'),
          email:form.get('email'),
          phone:form.get('phone')||'',
          requirement:form.get('requirement'),
          industry:'other',
          goal:'other',
          services:[slug],
          timing:'Let’s discuss',
          links:'',
          budget:form.get('budget')||'',
          assessment:'',
          consent:true
        })
      });
      const result=await response.json() as {saved?:boolean;reference?:string;error?:string};
      if(!response.ok||!result.saved||!result.reference)throw new Error(result.error||'We could not save your enquiry. Please try again.');
      setReference(result.reference);
    }catch(e){
      setError(e instanceof Error?e.message:'We could not save your enquiry. Your details are still here.');
    }finally{
      setBusy(false);
    }
  }

  return <section className="service-enquiry-section" id="service-enquiry">
    <div className="container service-enquiry-layout">
      <div>
        <h2>Curious about<br/><em>{name.toLowerCase()}?</em></h2>
        <p>Tell us what’s happening at your business. Your enquiry will include this service.</p>
        <a className="service-contact-phone" href={contact.phoneHref}>{contact.phone}<ArrowUpRight size={20}/></a>
        <a className="service-contact-email" href={contact.emailHref}>{contact.email}</a>
      </div>
      {reference?
        <div className="service-enquiry-success" role="status">
          <CheckCircle size={42}/>
          <h3>Your enquiry is saved.</h3>
          <p>Keep this reference for your next conversation.</p>
          <strong>{reference}</strong>
          <p>Scope and timing will be confirmed with you.</p>
          <Button asChild className="button purple"><a href={contact.phoneHref}>Call Viral Cat <ArrowUpRight/></a></Button>
        </div>
      :
        <form className="service-enquiry-form" onSubmit={submit}>
          <p className="service-enquiry-tag">Your interest: <strong>{name}</strong></p>
          <div className="form-grid">
            {[
              {key:'name',label:'Your name',type:'text',auto:'name',max:120},
              {key:'business',label:'Business name',type:'text',auto:'organization',max:150},
              {key:'email',label:'Email address',type:'email',auto:'email',max:200},
              {key:'location',label:'Town or neighbourhood',type:'text',auto:'address-level2',max:150}
            ].map(f=>
              <div className="field" key={f.key}>
                <Label htmlFor={id+f.key}>{f.label} *</Label>
                <Input id={id+f.key} name={f.key} type={f.type} autoComplete={f.auto} required minLength={f.type==='email'?undefined:2} maxLength={f.max}/>
              </div>
            )}
          </div>
          <div className="field">
            <Label htmlFor={id+'phone'}>Phone number <span>(optional)</span></Label>
            <Input id={id+'phone'} name="phone" type="tel" autoComplete="tel" maxLength={40}/>
          </div>
          <div className="field">
            <Label htmlFor={id+'budget'}>Monthly budget <span>(optional)</span></Label>
            <Input id={id+'budget'} name="budget" list={id+'budget-options'} maxLength={60} placeholder="Choose a range or type your own"/>
            <datalist id={id+'budget-options'}>
              <option value="Under ₹25,000/month"/>
              <option value="₹25,000 – ₹50,000/month"/>
              <option value="₹50,000 – ₹1,00,000/month"/>
              <option value="Above ₹1,00,000/month"/>
              <option value="Let’s discuss"/>
            </datalist>
          </div>
          <div className="field">
            <Label htmlFor={id+'requirement'}>What would you like help with? *</Label>
            <Textarea id={id+'requirement'} name="requirement" required minLength={10} maxLength={4000} rows={4} placeholder="Tell us about your business and what you want to work on."/>
          </div>
          <label className="consent">
            <Checkbox checked={consent} onCheckedChange={value=>setConsent(value===true)}/>
            <span>I agree to share these details for this enquiry. <a href="/privacy">Privacy information</a></span>
          </label>
          {error&&<p className="error-message" role="alert">{error}</p>}
          <Button type="submit" className="button purple" disabled={busy||!submissionId}>{busy?<Loader2 className="spin"/>:<ArrowUpRight/>}{busy?'Saving your enquiry…':'Send my enquiry'}</Button>
          <p className="service-form-note">Your details are saved only when you submit this form.</p>
        </form>
      }
    </div>
  </section>
}