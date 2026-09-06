/**
 * Every fact the legal pages assert, in one place.
 *
 * The policies are only worth anything if they are true, so nothing here is
 * invented. Details that only the company can supply — the registered entity
 * name, its RERA agent registration, the named officers — are `TBD` until
 * somebody fills them in, and every page renders a visible notice while any of
 * them is still blank rather than quietly printing a plausible-looking blank.
 *
 * NOT LEGAL ADVICE. These documents were drafted against the Digital Personal
 * Data Protection Act 2023, the IT Act 2000 and its rules, and RERA 2016, but
 * they must be reviewed by a qualified Indian advocate before they are relied
 * on. The obligations they create are real.
 */
import { BUSINESS, SITE_URL } from './contact';

/** A value the company must supply. Rendered as an obvious gap, never guessed. */
export const TBD = '[TO BE COMPLETED]' as const;

export const LEGAL = {
  /** The registered entity that actually contracts — not the brand name. */
  entityName: TBD,
  entityType: TBD, // e.g. 'a partnership firm' / 'a private limited company'
  cin: TBD, // CIN / LLPIN / firm registration number
  gstin: TBD,
  registeredAddress: TBD,
  /**
   * Telangana RERA agent registration. A real-estate agent may not facilitate
   * the sale of a RERA-registered project without one (RERA 2016, s.9), and
   * every advertisement must carry it.
   */
  reraAgentRegNo: TBD,
  reraAuthority: 'Telangana Real Estate Regulatory Authority (TG-RERA)',
  reraWebsite: 'https://rera.telangana.gov.in',

  /**
   * DPDP Act 2023 s.8(9): a Data Fiduciary must publish the contact of the
   * Data Protection Officer, or of the person able to answer questions about
   * processing. A Significant Data Fiduciary must appoint a DPO based in India;
   * an ordinary fiduciary must still name someone.
   */
  dpo: { name: TBD, title: 'Data Protection Officer', email: 'privacy@thegreenteam.in' },

  /**
   * IT (Intermediary Guidelines) Rules 2021, r.3(2): a Grievance Officer must
   * be named, must acknowledge a complaint within 24 hours and dispose of it
   * within 15 days. DPDP s.13 separately requires a readily available means of
   * grievance redressal.
   */
  grievanceOfficer: { name: TBD, title: 'Grievance Officer', email: 'grievance@thegreenteam.in' },

  /** Consumer Protection (E-Commerce) Rules 2020 timeline, adopted as our own. */
  grievanceAckHours: 24,
  grievanceResolutionDays: 15,
  /** DPDP s.11 — a request for access or erasure gets an answer in this time. */
  dataRequestDays: 30,

  /** Where a complaint goes if we fail. */
  dataProtectionBoard: 'Data Protection Board of India',
  consumerHelpline: 'National Consumer Helpline · 1915 · consumerhelpline.gov.in',

  governingLaw: 'the laws of India',
  jurisdiction: 'the courts at Hyderabad, Telangana',

  /** Bump when the substance changes; shown at the head of every policy. */
  effectiveFrom: '6 September 2026',
  version: '1.0',
} as const;

/** True while any legally required detail is still missing. */
export const legalDetailsIncomplete = (): boolean =>
  JSON.stringify(LEGAL).includes(TBD);

/** Which ones, so the notice can name them instead of being vague. */
export function missingLegalDetails(): string[] {
  const out: string[] = [];
  const walk = (obj: Record<string, unknown>, prefix = '') => {
    for (const [k, v] of Object.entries(obj)) {
      if (v === TBD) out.push(prefix + k);
      else if (v && typeof v === 'object') walk(v as Record<string, unknown>, `${prefix}${k}.`);
    }
  };
  walk(LEGAL as unknown as Record<string, unknown>);
  return out;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* What we actually process. Every row below was verified against the code.   */
/* ────────────────────────────────────────────────────────────────────────── */

export interface DataRow {
  /** DPDP s.5 notice: the personal data. */
  what: string;
  /** DPDP s.5 notice: the purpose. Specific — "business purposes" is not one. */
  why: string;
  /** Consent (s.6) or a legitimate use (s.7). */
  basis: string;
  /** How long we keep it. */
  keptFor: string;
}

export const DATA_WE_HOLD: DataRow[] = [
  {
    what: 'Your name',
    why: 'To address you, and so an adviser calling you knows who they are speaking to.',
    basis: 'Consent, given when you type it into the profile step or an enquiry form.',
    keptFor: 'Until you delete your account, or ask us to erase it.',
  },
  {
    what: 'Your mobile number',
    why: 'To sign you in by one-time password, and for an adviser to call or message you about the enquiry you made.',
    basis: 'Consent. For sign-in it is also necessary to provide the service you asked for (DPDP s.7(a)).',
    keptFor: 'Until you delete your account. Enquiry records are kept for three years for our own accounting and dispute record.',
  },
  {
    what: 'Your email address',
    why: 'To send the account confirmation, pricing sheets and site-visit confirmations you ask for, and the monthly briefing if you switch it on.',
    basis: 'Consent. The briefing is separate consent you can withdraw with one click.',
    keptFor: 'Until you delete your account or unsubscribe.',
  },
  {
    what: 'Your city and occupation, if you give them',
    why: 'To match you to properties in a sensible budget band and location rather than sending everything to everyone.',
    basis: 'Consent. Both fields are optional and the site works without them.',
    keptFor: 'Until you delete your account.',
  },
  {
    what: 'What you asked for in an enquiry — the property, budget band and message',
    why: 'So the adviser who calls you back knows what you want.',
    basis: 'Voluntarily provided for the purpose you provided it for (DPDP s.7(a)).',
    keptFor: 'Three years from your last contact with us.',
  },
  {
    what: 'Your conversations with Groot, our assistant',
    why: 'To answer you, and to see which questions we are failing to answer well.',
    basis: 'Consent, given when you type into the chat window.',
    keptFor: 'Twelve months.',
  },
  {
    what: 'Pages you viewed, the site that referred you, your device type, browser and coarse location, and a rotating visitor identifier',
    why: 'To count visits and see which pages work. We do not build advertising profiles and we do not sell this.',
    basis: 'Consent, given through the cookie banner. Refuse it and this is not collected.',
    keptFor: 'Fourteen months, then deleted automatically.',
  },
  {
    what: 'Your IP address',
    why: 'It reaches our servers with every request and is used to derive coarse location and to stop abuse. We store only a one-way hash of it, never the address itself.',
    basis: 'Necessary for the security of the service.',
    keptFor: 'The hash lives with the analytics record; the address itself is never written down.',
  },
];

export interface Processor {
  name: string;
  role: string;
  where: string;
  policy: string;
}

/** DPDP s.11(1)(b): on request, a Data Principal may know who we shared with. */
export const PROCESSORS: Processor[] = [
  { name: 'Google (Firebase Authentication, Cloud Firestore)', role: 'Stores your account and every record described above; sends the sign-in one-time password.', where: 'India and the United States', policy: 'https://firebase.google.com/support/privacy' },
  { name: 'Vercel', role: 'Serves this website and keeps short-lived server logs.', where: 'Singapore and the United States', policy: 'https://vercel.com/legal/privacy-policy' },
  { name: 'Resend', role: 'Delivers our email and holds the briefing list.', where: 'The United States', policy: 'https://resend.com/legal/privacy-policy' },
  { name: 'Google (Gemini API)', role: 'Generates Groot\'s replies from your message and our property data.', where: 'The United States', policy: 'https://ai.google.dev/gemini-api/terms' },
  { name: 'Google (Analytics, reCAPTCHA)', role: 'Counts visits, and verifies that a sign-in request is not automated. Analytics runs only if you accept it.', where: 'The United States', policy: 'https://policies.google.com/privacy' },
  { name: 'Microsoft (Clarity)', role: 'Aggregated interaction analytics, if you accept it.', where: 'The United States', policy: 'https://privacy.microsoft.com/privacystatement' },
  { name: 'OpenStreetMap and CARTO', role: 'Supply the map tiles. Your IP address reaches them when a map loads.', where: 'The European Union and the United States', policy: 'https://osmfoundation.org/wiki/Privacy_Policy' },
  { name: 'Meta (WhatsApp)', role: 'Carries the conversation if you choose to message us there. What you send is governed by their terms, not ours.', where: 'Outside India', policy: 'https://www.whatsapp.com/legal/privacy-policy' },
];

export interface CookieRow {
  name: string;
  kind: 'Strictly necessary' | 'Analytics';
  why: string;
  life: string;
}

/** Every cookie and browser store this site sets. Verified against the code. */
export const COOKIES: CookieRow[] = [
  { name: '__session', kind: 'Strictly necessary', why: 'Keeps you signed in. Set only after you sign in, and readable only by our server.', life: 'Up to 14 days, or until you sign out.' },
  { name: 'gt_exp', kind: 'Strictly necessary', why: 'Holds a random identifier so a visitor sees a consistent version of a page being tested. It carries nothing about you.', life: '90 days.' },
  { name: 'gt_consent', kind: 'Strictly necessary', why: 'Remembers whether you accepted or refused analytics, so we stop asking.', life: '12 months.' },
  { name: '_ga, _ga_*', kind: 'Analytics', why: 'Google Analytics: counts visits and distinguishes one visitor from another. Set only if you accept analytics.', life: 'Up to 24 months.' },
  { name: '_clck, _clsk', kind: 'Analytics', why: 'Microsoft Clarity: groups interactions into a session. Set only if you accept analytics.', life: 'Up to 12 months.' },
  { name: 'gt_splash_seen, gt_welcome_v2, gt_shortlist, gt_subscribed', kind: 'Strictly necessary', why: 'Stored in your browser, never sent to us: whether you have seen the opening animation, whether a prompt was dismissed, and what you shortlisted.', life: 'Until you clear your browser data.' },
];

export const LEGAL_LINKS = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/privacy/request', label: 'Your Data Rights' },
  { href: '/terms', label: 'Terms of Use' },
  { href: '/cookies', label: 'Cookie Policy' },
] as const;

export const CONTACT_LINE = `${BUSINESS.email} · ${BUSINESS.phone} · ${SITE_URL}`;

/* ────────────────────────────────────────────────────────────────────────── */
/* The notice shown where personal data is actually collected (DPDP s.5).     */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Section 5 requires a notice accompanying or preceding the request for
 * consent, in clear and plain language: what is collected, what for, and how to
 * exercise your rights. A link to a policy is not a notice — this is the text
 * that sits beside the button, where the person actually is.
 *
 * The version travels with each record, so if the wording changes we can still
 * say which notice a given person was shown. That is the evidence half of
 * consent, and without it "they consented" is an assertion rather than a fact.
 */
export const COLLECTION_NOTICE_VERSION = 1;

export const COLLECTION_NOTICE = {
  version: COLLECTION_NOTICE_VERSION,
  /** Enumerated purposes, stored on the record alongside the version. */
  purposes: ['respond-to-enquiry', 'arrange-site-visit', 'share-with-named-developer'] as const,
  /** What the person reads. Kept to two sentences on purpose. */
  text:
    'We use your name and number only to answer this enquiry, and we pass them to the developer of a project when you ask us to arrange a visit. We keep the enquiry for three years, we never sell your details, and you can ask us to erase them at any time.',
  /** DPDP s.9 — this service is not for children, and we say so where it counts. */
  ageLine: 'By continuing you confirm you are 18 or over.',
} as const;

/** Stamped onto every record created from a form that showed the notice. */
export interface ConsentRecord {
  noticeVersion: number;
  purposes: string[];
  givenAt: string;
  /** How it was given, so the record is self-describing a year from now. */
  method: 'form-submission';
}

export const consentRecord = (): ConsentRecord => ({
  noticeVersion: COLLECTION_NOTICE.version,
  purposes: [...COLLECTION_NOTICE.purposes],
  givenAt: new Date().toISOString(),
  method: 'form-submission',
});
