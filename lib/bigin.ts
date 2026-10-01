/**
 * Bigin Web-to-Record bridge — "Viral Cat Official Website" form.
 *
 * Every form on the site can call `submitToBigin({...})`. It builds the exact
 * field set the Bigin embed sends, fills every missing field, and posts it
 * through a hidden <form> + <iframe> (the same way Bigin's own embed works,
 * so there are no CORS problems).
 *
 * Missing values:
 *   - Text fields               -> "null"
 *   - Picklists (optional)      -> "-None-"   (Bigin's own empty value; "null" would be rejected)
 *   - Lead Quality (mandatory)  -> "Not Assessed"
 *   - Lead Source (mandatory)   -> guessed from utm_source, else "Official Website"
 *   - Amount (number field)     -> "0"        ("null" fails Bigin's number validation)
 *   - Closing Date (mandatory)  -> today + 30 days
 *
 * Browser-only: call it from a client component / event handler.
 */

export const BIGIN_CONFIG = {
  /**
   * Bigin injects the action URL at runtime. Verify it once:
   * open a page with the original Bigin embed, then in the console run
   *   document.forms['BiginWebToRecordForm7522188000000748001'].action
   * and paste the result here if it differs (e.g. bigin.zoho.in).
   */
  actionUrl: 'https://bigin.zoho.com/crm/WebToRecordForm',
  tokens: {
    xnQsjsdp: '43130f9502c3eab3785bf4603eb9034bca0897051fa16c7a11f4f6cd431de6e1',
    zc_gad: '',
    xmIwtLD:
      '6388d2eeba70e0251d514fe44dc570be64e82eab60b6e0bd6581092e616bd308b0c4c2cc7703099179179a00ded6df25',
    actionType: 'UG90ZW50aWFscw==',
    rmsg: 'true',
    returnURL: 'null',
  },
  pipeline: 'Sales Pipeline Standard 1',
  timeoutMs: 15000,
} as const;

export const NULL_TEXT = 'null';
export const NONE = '-None-';

export const SERVICES = [
  'Digital Marketing',
  'SEO',
  'Website Development',
  'Video Production',
  'Influencer Marketing',
  'AI Videos',
] as const;

export const BUDGETS = ['Below ₹25K', '₹25K–₹50K', '₹50K–₹1L', '₹1L–₹3L', '₹3L+'] as const;

export const LEAD_QUALITIES = ['Not Assessed', 'Qualified', 'Unqualified', 'Spam'] as const;

export const LEAD_SOURCES = [
  'Meta Ads',
  'Google Ads',
  'WhatsApp Campaign',
  'Advertisement',
  'Cold Call',
  'Employee Referral',
  'External Referral',
  'Online Store',
  'Partner',
  'Official Website',
  'Public Relations',
  'Sales Email Alias',
  'Seminar Partner',
  'Internal Seminar',
  'Trade Show',
  'Web Download',
  'Web Research',
  'Chat',
  'WhatsApp Organic',
  'WHATSAPP - Mindstory Digital Partner',
] as const;

export const STAGES = [
  'Qualification',
  'Needs Analysis',
  'Proposal/Price Quote',
  'Negotiation/Review',
  'Closed Won',
  'Closed Lost',
  'Junk',
] as const;

export type BiginLead = {
  leadId?: string;
  leadName?: string;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  /** Bigin form has no email field, so it is added to the Description. */
  email?: string;
  location?: string;
  companyName?: string;
  amount?: string | number | null;
  service?: string;
  budget?: string;
  closingDate?: string | Date;
  description?: string;
  stageQuestions?: string;
  consent?: boolean;
  leadPageUrl?: string;
  utmSource?: string;
  utmCampaign?: string;
  utmContent?: string;
  leadQuality?: string;
  leadSource?: string;
  stage?: string;
};

/* ---------- small helpers ---------- */

const clean = (v: unknown) =>
  (v === undefined || v === null ? '' : String(v)).replace(/\s+/g, ' ').trim();

const text = (v: unknown, max: number) => {
  const s = clean(v);
  return s ? s.slice(0, max) : NULL_TEXT;
};

const longText = (v: unknown) => {
  const s = (v === undefined || v === null ? '' : String(v)).trim();
  return s ? s.slice(0, 32000) : NULL_TEXT;
};

const pick = (v: unknown, list: readonly string[], fallback: string) => {
  const s = clean(v);
  return list.includes(s) ? s : fallback;
};

const amount = (v: unknown) => {
  const s = clean(v).replace(/[,₹\s]/g, '');
  return /^\d+(\.\d{1,2})?$/.test(s) ? s : '0';
};

const pad = (n: number) => String(n).padStart(2, '0');

const isoDate = (v: unknown) => {
  let d: Date | null = null;
  if (v instanceof Date) d = v;
  else {
    const s = clean(v);
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) d = new Date(+m[1], +m[2] - 1, +m[3]);
    else if (s) d = new Date(s);
  }
  if (!d || Number.isNaN(d.getTime())) {
    d = new Date();
    d.setDate(d.getDate() + 30);
  }
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** "value" or "null" — handy when building summary text. */
export const orNull = (v: unknown) => clean(v) || NULL_TEXT;

/** Reference shown to the visitor and stored in Bigin's "Lead ID" field. */
export function createLeadId() {
  const d = new Date();
  const stamp = `${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `VC-${stamp}-${rand}`;
}

/** "Anu Mary Joseph" -> first "Anu Mary", last "Joseph". One word -> last name only. */
export function splitName(full: string) {
  const parts = clean(full).split(' ').filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: '', lastName: parts[0] };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] };
}

export function guessLeadSource(utmSource?: string) {
  const s = clean(utmSource).toLowerCase();
  if (!s) return 'Official Website';
  if (/meta|facebook|^fb$|instagram|^ig$/.test(s)) return 'Meta Ads';
  if (/google|gads|adwords|youtube/.test(s)) return 'Google Ads';
  if (/whatsapp|^wa$/.test(s)) return 'WhatsApp Campaign';
  return 'Official Website';
}

/* ---------- mappers for the site's own form values ---------- */

const SERVICE_KEYWORDS: [RegExp, string][] = [
  [/\bai\b|artificial/i, 'AI Videos'],
  [/influenc|creator/i, 'Influencer Marketing'],
  [/\bseo\b|search|google business|maps|listing/i, 'SEO'],
  [/web|site|landing/i, 'Website Development'],
  [/video|reel|film|shoot|production|photo/i, 'Video Production'],
  [/social|digital|\bads?\b|marketing|campaign|content|brand|local/i, 'Digital Marketing'],
];

/** Picks the closest Bigin "Service Interested In?" value for the selected services. */
export function mapServicesToBigin(names: string[]) {
  const list = names.map(clean).filter(Boolean);
  const exact = list.find((n) => (SERVICES as readonly string[]).includes(n));
  if (exact) return exact;
  for (const [re, value] of SERVICE_KEYWORDS) if (list.some((n) => re.test(n))) return value;
  return NONE;
}

/** "₹25K–₹50K/month", "40000", "1.5 lakh" -> rupees as a number. */
export function parseBudgetAmount(input?: string): number | null {
  const s = clean(input).toLowerCase().replace(/,/g, '');
  const m = s.match(/(\d+(?:\.\d+)?)\s*(crores?|cr|lakhs?|lacs?|l|thousand|k)?(?![a-z])/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const unit = m[2] || '';
  const mult = /^c/.test(unit) ? 1e7 : /^l/.test(unit) ? 1e5 : /^(k|thousand)/.test(unit) ? 1e3 : 1;
  const value = Math.round(n * mult);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** Maps any budget text to a Bigin "Monthly/Project Budget" option. */
export function mapBudgetToBigin(input?: string) {
  const s = clean(input);
  const label = BUDGETS.find((b) => s === b || s.startsWith(b));
  if (label) return label;
  const value = parseBudgetAmount(s);
  if (value === null) return NONE;
  const v = /below|under|less|up ?to|</i.test(s) ? value - 1 : value;
  if (v < 25000) return 'Below ₹25K';
  if (v < 50000) return '₹25K–₹50K';
  if (v < 100000) return '₹50K–₹1L';
  if (v < 300000) return '₹1L–₹3L';
  return '₹3L+';
}

/** Turns "As soon as possible", "Within a month"… into a Closing Date. */
export function closingDateFromTiming(timing?: string) {
  const t = clean(timing).toLowerCase();
  let days = 30;
  if (/soon|asap|immediate|urgent/.test(t)) days = 7;
  else if (/month/.test(t) && /2|3|two|three/.test(t)) days = 75;
  else if (/month/.test(t)) days = 30;
  else if (/explor/.test(t)) days = 90;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

/* ---------- payload + submit ---------- */

/** Builds the full Bigin payload. Every field is present and filled. */
export function buildBiginFields(lead: BiginLead) {
  const leadId = clean(lead.leadId) || createLeadId();
  const person = [clean(lead.firstName), clean(lead.lastName)].filter(Boolean).join(' ');
  const leadName =
    clean(lead.leadName) || [clean(lead.companyName), person].filter(Boolean).join(' – ');
  const pageUrl =
    lead.leadPageUrl ?? (typeof window !== 'undefined' ? window.location.href : '');

  let description = (lead.description ?? '').toString().trim();
  const email = clean(lead.email);
  if (email && !description.includes(email)) {
    description = `${description || NULL_TEXT}\n\nEmail: ${email}`;
  }

  const fields: Record<string, string> = {
    ...BIGIN_CONFIG.tokens,
    POTENTIALCF12: text(leadId, 255), // Lead ID
    'Potential Name': text(leadName, 120), // Lead Name *
    'Contacts.Last Name': text(lead.lastName, 80), // Last Name *
    'Contacts.First Name': text(lead.firstName, 40), // First Name
    'Contacts.Mobile': text(lead.mobile, 30), // Mobile *
    POTENTIALCF11: text(lead.location, 255), // Location
    'Accounts.Account Name': text(lead.companyName, 200), // Company Name *
    Amount: amount(lead.amount), // Amount (number)
    POTENTIALCF1: pick(lead.service, SERVICES, NONE), // Service Interested In?
    POTENTIALCF3: pick(lead.budget, BUDGETS, NONE), // Monthly/Project Budget
    'Closing Date': isoDate(lead.closingDate), // Closing Date *
    'Contacts.Description': longText(description), // Description
    Description: longText(lead.stageQuestions), // Stage Questions
    POTENTIALCF4: text(pageUrl, 255), // Lead Page URL
    POTENTIALCF5: text(lead.utmSource, 255), // UTM Source
    POTENTIALCF7: text(lead.utmCampaign, 255), // UTM Campaign
    POTENTIALCF6: text(lead.utmContent, 255), // UTM Content
    POTENTIALCF10: pick(lead.leadQuality, LEAD_QUALITIES, 'Not Assessed'), // Lead Quality *
    'Lead Source': pick(lead.leadSource, LEAD_SOURCES, guessLeadSource(lead.utmSource)), // *
    Pipeline: BIGIN_CONFIG.pipeline,
    Stage: pick(lead.stage, STAGES, 'Qualification'),
  };

  if (lead.consent !== false) fields.privacyTool = 'on';

  return { leadId, fields };
}

/**
 * Posts the lead to Bigin. Resolves with the Lead ID once Bigin answers.
 * The response is cross-origin, so its body can't be read; a load of the
 * hidden frame is treated as success.
 */
export function submitToBigin(lead: BiginLead): Promise<{ leadId: string }> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('submitToBigin must run in the browser.'));
  }
  if (lead.consent === false) {
    return Promise.reject(new Error('Consent is required before sending.'));
  }

  const { leadId, fields } = buildBiginFields(lead);
  const frameName = `bigin-frame-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const iframe = document.createElement('iframe');
  iframe.name = frameName;
  iframe.title = 'Bigin submission';
  iframe.tabIndex = -1;
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = 'position:absolute;width:0;height:0;border:0;visibility:hidden;';

  const form = document.createElement('form');
  form.action = BIGIN_CONFIG.actionUrl;
  form.method = 'POST';
  form.enctype = 'multipart/form-data';
  form.acceptCharset = 'UTF-8';
  form.target = frameName;
  form.style.display = 'none';

  Object.entries(fields).forEach(([name, value]) => {
    // textarea keeps line breaks in long answers
    const el = document.createElement('textarea');
    el.name = name;
    el.value = value;
    form.appendChild(el);
  });

  document.body.appendChild(iframe);
  document.body.appendChild(form);

  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () =>
      window.setTimeout(() => {
        iframe.remove();
        form.remove();
      }, 1000);

    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Bigin did not respond in time.'));
    }, BIGIN_CONFIG.timeoutMs);

    iframe.addEventListener('load', () => {
      // Ignore the frame's own initial about:blank load.
      let stillBlank = false;
      try {
        stillBlank = iframe.contentWindow?.location.href === 'about:blank';
      } catch {
        stillBlank = false; // cross-origin = Bigin answered
      }
      if (stillBlank || settled) return;
      settled = true;
      window.clearTimeout(timer);
      cleanup();
      resolve({ leadId });
    });

    form.submit();
  });
}