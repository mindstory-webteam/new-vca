'use client';
import {useEffect,useId,useState} from 'react';
import {ArrowUpRight,CheckCircle,Loader2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Checkbox} from '@/components/ui/checkbox';
import {contact} from '@/lib/contact';
import {
  sendLeadToBigin,
  createLeadId,
  splitName,
  orNull,
  mapServicesToBigin,
  mapBudgetToBigin,
  parseBudgetAmount,
  closingDateFromTiming,
  readUtm,
} from '@/lib/bigin-bridge';

type EnquiryData={name:string;business:string;location:string;email:string;phone:string;requirement:string;budget:string};

export function ServiceEnquiry({slug,name}:{slug:string;name:string}){
  const id=useId();
  const [submissionId,setSubmissionId]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[reference,setReference]=useState(''),[consent,setConsent]=useState(false);
  useEffect(()=>setSubmissionId(crypto.randomUUID()),[]);

  /** 1. Save on the website (/api/briefs), like before. */
  async function saveToSite(d:EnquiryData):Promise<{ok:true;reference:string}|{ok:false;error:string}>{
    try{
      const response=await fetch('/api/briefs',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          submissionId,
          name:d.name,
          business:d.business,
          location:d.location,
          email:d.email,
          phone:d.phone,
          requirement:d.requirement,
          industry:'other',
          goal:'other',
          services:[slug],
          timing:'Let’s discuss',
          links:'',
          budget:d.budget,
          assessment:'',
          consent:true
        })
      });
      const result=await response.json().catch(()=>({})) as {saved?:boolean;reference?:string;error?:string};
      if(!response.ok||!result.saved||!result.reference)return {ok:false,error:result.error||'We could not save your enquiry. Please try again.'};
      return {ok:true,reference:result.reference};
    }catch{
      return {ok:false,error:'We could not save your enquiry. Your details are still here.'};
    }
  }

  /** 2. Send the same enquiry to Bigin. Extra fields go into Description as text. */
  function sendToBigin(leadId:string,d:EnquiryData){
    const {firstName,lastName}=splitName(d.name);
    const utm=readUtm();
    const pageUrl=window.location.href;

    const description=[
      'SERVICE PAGE ENQUIRY',
      `Reference: ${leadId}`,
      `Submitted: ${new Date().toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}`,
      `Service page: ${name} (/services/${slug})`,
      '',
      'REQUIREMENT',
      orNull(d.requirement),
      '',
      'CONTACT',
      `Name: ${orNull(d.name)}`,
      `Email: ${orNull(d.email)}`,
      `Phone: ${orNull(d.phone)}`,
      '',
      'BUSINESS',
      `Business: ${orNull(d.business)}`,
      `Town or neighbourhood: ${orNull(d.location)}`,
      `Budget (as entered): ${orNull(d.budget)}`,
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
      `Form: Service page – ${name}`,
      `Business: ${orNull(d.business)}`,
      `Location: ${orNull(d.location)}`,
      `Service: ${name}`,
      `Budget: ${orNull(d.budget)}`,
      `Email: ${orNull(d.email)}`,
      '',
      'Requirement:',
      orNull(d.requirement),
    ].join('\n');

    return sendLeadToBigin({
      leadId,
      leadName:`${d.business.trim()} – ${d.name.trim()} (${name})`,
      firstName,
      lastName,
      mobile:d.phone,
      companyName:d.business.trim()||d.name.trim(),
      location:d.location,
      amount:parseBudgetAmount(d.budget),
      service:mapServicesToBigin([name,slug]),
      budget:mapBudgetToBigin(d.budget),
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

  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(busy)return;
    const form=new FormData(event.currentTarget);
    if(!consent){setError('Please agree to share these details for your enquiry.');return}
    const text=(k:string)=>String(form.get(k)??'').trim();
    const data:EnquiryData={name:text('name'),business:text('business'),location:text('location'),email:text('email'),phone:text('phone'),requirement:text('requirement'),budget:text('budget')};
    setBusy(true);setError('');

    const site=await saveToSite(data);
    const ref=site.ok?site.reference:createLeadId();
    const biginOk=await sendToBigin(ref,data);

    if(site.ok||biginOk){
      if(!site.ok)console.warn('Website save failed, enquiry reached Bigin:',site.error);
      setReference(ref);
    }else{
      setError(site.error);
    }
    setBusy(false);
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