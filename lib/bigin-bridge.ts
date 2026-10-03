'use client';

/**
 * Sends a lead to Bigin from any React form.
 * It opens /bigin-submit.html (your real Bigin form, hidden) in an invisible
 * iframe, passes the answers in, and Bigin's own script submits them.
 */

export const BIGIN_SERVICES=['Digital Marketing','SEO','Website Development','Video Production','Influencer Marketing','AI Videos'] as const;
export const BIGIN_BUDGETS=['Below ₹25K','₹25K–₹50K','₹50K–₹1L','₹1L–₹3L','₹3L+'] as const;

const DEFAULTS={pipeline:'Sales Pipeline Standard 1',stage:'Qualification',leadSource:'Official Website',leadQuality:'Not Assessed'};

export type BiginLead={
  leadId:string;
  leadName:string;
  firstName:string;
  lastName:string;
  mobile:string;
  companyName:string;
  location?:string;
  amount?:string;
  service?:string;      // one of BIGIN_SERVICES or '-None-'
  budget?:string;       // one of BIGIN_BUDGETS or '-None-'
  closingDate:string;   // YYYY-MM-DD
  description:string;   // Bigin "Description"
  stageQuestions:string;// Bigin "Stage Questions"
  consent:boolean;
  leadPageUrl?:string;
  utmSource?:string;
  utmCampaign?:string;
  utmContent?:string;
  leadSource?:string;
  leadQuality?:string;
};

/* ---------- helpers ---------- */

export function orNull(v:unknown){const t=String(v??'').trim();return t||'null'}
const cut=(v:unknown,max:number)=>String(v??'').slice(0,max);

export function splitName(full:string){
  const parts=full.trim().split(/\s+/).filter(Boolean);
  if(!parts.length)return {firstName:'',lastName:'null'};
  if(parts.length===1)return {firstName:'',lastName:parts[0]};
  return {firstName:parts.slice(0,-1).join(' '),lastName:parts[parts.length-1]};
}

export function createLeadId(){
  const d=new Date();
  const ymd=String(d.getFullYear()).slice(2)+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0');
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rnd=new Uint8Array(5);crypto.getRandomValues(rnd);
  return 'VC-'+ymd+'-'+Array.from(rnd,n=>chars[n%chars.length]).join('');
}

/** All amounts in a budget text, e.g. "₹25,000 – ₹50,000" -> [25000, 50000] */
function amountsIn(text:string){
  const out:number[]=[];
  const re=/(\d+(?:\.\d+)?)\s*(k|lakhs?|lacs?|l|cr|crore)?/gi;
  let m:RegExpExecArray|null;
  const clean=text.replace(/,/g,'');
  while((m=re.exec(clean))){
    let v=parseFloat(m[1]);const u=(m[2]||'').toLowerCase();
    if(u==='k')v*=1e3;else if(u.startsWith('l'))v*=1e5;else if(u.startsWith('cr'))v*=1e7;
    if(v>0)out.push(v);
  }
  return out;
}

/** Highest amount in the budget text, for Bigin "Amount". */
export function parseBudgetAmount(budget:string){
  const a=amountsIn(budget);
  return a.length?String(Math.round(Math.max(...a))).slice(0,16):'';
}

/** Any budget text -> the Bigin "Monthly/Project Budget" option. */
export function mapBudgetToBigin(budget:string){
  const norm=(s:string)=>s.toLowerCase().replace(/\/\s*month/g,'').replace(/[-—]/g,'–').replace(/\s+/g,'');
  const exact=BIGIN_BUDGETS.find(b=>norm(b)===norm(budget));
  if(exact)return exact;
  const a=amountsIn(budget);
  if(!a.length)return '-None-';
  if(/above|over|more than|\+/i.test(budget)){
    const v=Math.min(...a);
    if(v>=300000)return '₹3L+';
    if(v>=100000)return '₹1L–₹3L';
    if(v>=50000)return '₹50K–₹1L';
    if(v>=25000)return '₹25K–₹50K';
    return 'Below ₹25K';
  }
  const v=Math.max(...a);
  if(v<=25000)return 'Below ₹25K';
  if(v<=50000)return '₹25K–₹50K';
  if(v<=100000)return '₹50K–₹1L';
  if(v<=300000)return '₹1L–₹3L';
  return '₹3L+';
}

/** Service names -> the one Bigin "Service Interested In?" option. */
export function mapServicesToBigin(names:string[]){
  const rules:[RegExp,string][]=[
    [/\bseo\b|search/i,'SEO'],
    [/\bai\b|artificial/i,'AI Videos'],
    [/influenc|creator|collab/i,'Influencer Marketing'],
    [/web|site|landing/i,'Website Development'],
    [/video|reel|film|shoot|production|photo|content/i,'Video Production'],
    [/social|\bads?\b|campaign|marketing|digital|brand|media|local|caption/i,'Digital Marketing'],
  ];
  for(const n of names){const hit=BIGIN_SERVICES.find(b=>b.toLowerCase()===n.toLowerCase());if(hit)return hit}
  for(const n of names)for(const [re,v] of rules)if(re.test(n))return v;
  return '-None-';
}

/** Bigin "Closing Date" is required: estimate it from a timing answer. */
export function closingDateFromTiming(timing:string){
  const days:Record<string,number>={'As soon as possible':7,'Within a month':30,'In the next 2–3 months':90,'Just exploring':180};
  const d=new Date();d.setDate(d.getDate()+(days[timing]??30));
  return d.toLocaleDateString('en-CA');
}

/** UTM values from the current page URL. */
export function readUtm(){
  const q=new URLSearchParams(window.location.search);
  return {source:q.get('utm_source')||'',medium:q.get('utm_medium')||'',campaign:q.get('utm_campaign')||'',content:q.get('utm_content')||'',term:q.get('utm_term')||''};
}

/* ---------- send ---------- */

function toFields(l:BiginLead):Record<string,string>{
  return {
    'POTENTIALCF12':cut(l.leadId,255),                  // Lead ID
    'Potential Name':cut(l.leadName,120),               // Lead Name *
    'Contacts.Last Name':cut(l.lastName,80),            // Last Name *
    'Contacts.First Name':cut(l.firstName,40),          // First Name
    'Contacts.Mobile':cut(orNull(l.mobile),30),         // Mobile *
    'POTENTIALCF11':cut(l.location,255),                // Location
    'Accounts.Account Name':cut(l.companyName,200),     // Company Name *
    'Amount':cut(l.amount,16),                          // Amount
    'POTENTIALCF1':l.service||'-None-',                 // Service Interested In?
    'POTENTIALCF3':l.budget||'-None-',                  // Monthly/Project Budget
    'Contacts.Description':cut(l.description,32000),    // Description
    'Description':cut(l.stageQuestions,32000),          // Stage Questions
    'POTENTIALCF4':cut(l.leadPageUrl,255),              // Lead Page URL
    'POTENTIALCF5':cut(l.utmSource,255),                // UTM Source
    'POTENTIALCF7':cut(l.utmCampaign,255),              // UTM Campaign
    'POTENTIALCF6':cut(l.utmContent,255),               // UTM Content
    'POTENTIALCF10':l.leadQuality||DEFAULTS.leadQuality,// Lead Quality *
    'Lead Source':l.leadSource||DEFAULTS.leadSource,    // Lead Source *
    'Pipeline':DEFAULTS.pipeline,                       // Sub-Pipeline *
    'Stage':DEFAULTS.stage,                             // Stage *
  };
}

/** Resolves true when Bigin received the lead. Never throws. */
export function sendLeadToBigin(lead:BiginLead,timeoutMs=25000):Promise<boolean>{
  return new Promise(resolve=>{
    if(typeof window==='undefined')return resolve(false);
    const id=crypto.randomUUID();
    const frame=document.createElement('iframe');
    frame.src='/bigin-submit.html';
    frame.title='Bigin';
    frame.setAttribute('aria-hidden','true');
    frame.tabIndex=-1;
    frame.style.cssText='position:absolute;width:1px;height:1px;border:0;left:-9999px;top:0;visibility:hidden';

    let done=false;
    const finish=(ok:boolean)=>{
      if(done)return;done=true;
      clearTimeout(timer);
      window.removeEventListener('message',onMessage);
      setTimeout(()=>frame.remove(),1000);
      resolve(ok);
    };
    function onMessage(e:MessageEvent){
      if(e.origin!==window.location.origin||e.source!==frame.contentWindow)return;
      const m=e.data as {type?:string;id?:string;ok?:boolean;errors?:string[]};
      if(m?.type==='vc-bigin:ready'){
        frame.contentWindow?.postMessage({type:'vc-bigin:submit',id,fields:toFields(lead),closingDate:lead.closingDate,consent:lead.consent},window.location.origin);
      }else if(m?.type==='vc-bigin:result'&&m.id===id){
        if(!m.ok)console.warn('Bigin rejected the lead:',m.errors);
        finish(Boolean(m.ok));
      }
    }
    const timer=setTimeout(()=>{console.warn('Bigin did not reply in time.');finish(false)},timeoutMs);
    window.addEventListener('message',onMessage);
    document.body.appendChild(frame);
  });
}