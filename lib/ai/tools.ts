import 'server-only';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { WHATSAPP } from '@/lib/data/contact';
import type { Sanctuary } from '@/lib/data/sanctuaries';
import { getPortfolio, getPropertyById } from '@/lib/server/portfolio';
import { subscribeEmail } from '@/lib/server/newsletter';
import type { GeminiTool } from '@/lib/ai/gemini';
import type { ActionPayload, ToolName } from '@/lib/rag/types';

/**
 * The five things Groot can actually do, plus their executors.
 *
 * Everything crossing this boundary is model output, so nothing reaches
 * Firestore un-normalised and nothing here throws: a rejected call comes back as
 * `ok: false` with an `error` the model can read and recover from mid-conversation,
 * because a dropped exception would abort the reply stream and lose the lead.
 *
 * The documents written match the shapes /api/leads and /api/newsletter already
 * produce — the admin pipeline, CSV export and status workflow read them blind.
 */

export interface ToolResult {
  ok: boolean;
  /** Fed back to Gemini as the functionResponse body. Keep it small. */
  forModel: Record<string, unknown>;
  /** Rendered by the client as a card. */
  payload: ActionPayload;
  leadId?: string;
  /** Sanitised args for the transcript — never raw model output. */
  storedArgs: Record<string, string>;
}

/* ------------------------------------------------------------------ */
/* Declarations                                                        */
/* ------------------------------------------------------------------ */

export const TOOL_DECLARATIONS: GeminiTool = {
  functionDeclarations: [
    {
      name: 'book_site_visit',
      description:
        'Log a site-visit request for one specific sanctuary and hand it to an adviser. Call this only after the user has given both a name and a phone number, has named which sanctuary they want to see, and has agreed to a site visit. Never call it to collect those details — ask for whatever is missing in conversation first. Call it once per confirmed visit; if it has already succeeded in this conversation, do not call it again.',
      parameters: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING', description: "The person's name, exactly as they gave it." },
          phone: {
            type: 'STRING',
            description:
              'Their phone number as they gave it, including the country code if they stated one. 10 to 15 digits.',
          },
          propertyId: {
            type: 'STRING',
            description:
              "The id of the sanctuary they want to visit, taken from the PORTFOLIO block — e.g. 'agartha', 'syl', 'dates-county'. Ask which one if they have not said.",
          },
          preferredWindow: {
            type: 'STRING',
            description:
              'Optional. The day or time window they asked for, in their own words, e.g. "Saturday morning" or "next weekend". Omit entirely if they did not name one — do not invent it.',
          },
        },
        required: ['name', 'phone', 'propertyId'],
      },
    },
    {
      name: 'capture_lead',
      description:
        'Log a callback request so an adviser phones the user back. Call this when the user asks to be contacted, asks for a quote or a discount only a human can give, or agrees to an adviser call — and only once you have both their name and phone number. Use book_site_visit instead when they specifically want to see a property.',
      parameters: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING', description: "The person's name, exactly as they gave it." },
          phone: {
            type: 'STRING',
            description: 'Their phone number as they gave it, including the country code if stated. 10 to 15 digits.',
          },
          interest: {
            type: 'STRING',
            description:
              'Optional. One short line on what they are after, in your own words, e.g. "Agartha corner plot, wants biomorphic build quote". Helps the adviser open the call well.',
          },
          budgetBracket: {
            type: 'STRING',
            description:
              'Optional. The budget they stated, e.g. "₹1 Cr – ₹2 Cr". Only include it if they said it — never estimate it.',
          },
        },
        required: ['name', 'phone'],
      },
    },
    {
      name: 'subscribe_newsletter',
      description:
        'Add an email address to the monthly briefing list. Call this only after the user has explicitly agreed to receive the briefing AND given an email address. Never subscribe someone who mentioned an email address for another reason, and never guess an address.',
      parameters: {
        type: 'OBJECT',
        properties: {
          email: { type: 'STRING', description: 'The email address they gave, exactly as they gave it.' },
          name: { type: 'STRING', description: 'Optional. Their name, if you already know it.' },
        },
        required: ['email'],
      },
    },
    {
      name: 'get_brochure',
      description:
        'Fetch the brochure link for one sanctuary. Read-only and costs the user nothing, so call it freely the moment they ask for a brochure, a PDF, a deck or written details on a specific property. It needs no name, phone number or permission.',
      parameters: {
        type: 'OBJECT',
        properties: {
          propertyId: {
            type: 'STRING',
            description:
              "The id of the sanctuary, taken from the PORTFOLIO block — e.g. 'agartha', 'syl', 'dates-county'.",
          },
        },
        required: ['propertyId'],
      },
    },
    {
      name: 'whatsapp_handoff',
      description:
        'Open a pre-filled WhatsApp thread to a human adviser. Read-only and free — call it whenever the user asks to speak to someone, asks for a phone number or WhatsApp, gets impatient, or asks something the reference material does not cover. It needs no name or phone number.',
      parameters: {
        type: 'OBJECT',
        properties: {
          topic: {
            type: 'STRING',
            description:
              'One short line on what the handoff is about, e.g. "pricing on Agartha plot 3". Logged for the adviser.',
          },
          propertyId: {
            type: 'STRING',
            description:
              "Optional. The id of the sanctuary the question is about — e.g. 'agartha', 'syl', 'dates-county'. Omit for a general enquiry.",
          },
        },
        required: ['topic'],
      },
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Sanitising                                                          */
/* ------------------------------------------------------------------ */

const MAX = { name: 80, phone: 24, email: 120, text: 300, id: 64 } as const;

const EMAIL_RE = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/;

/** Gemini types a phone number as a number often enough to be worth accepting. */
function text(value: unknown, cap: number): string {
  const raw =
    typeof value === 'string' ? value : typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
  return raw.trim().slice(0, cap);
}

function phoneOf(value: unknown): string | null {
  const digits = text(value, MAX.phone).replace(/[\s\-().]/g, '');
  return /^\+?\d{10,15}$/.test(digits) ? digits : null;
}

function emailOf(value: unknown): string | null {
  const lower = text(value, MAX.email).toLowerCase();
  return EMAIL_RE.test(lower) ? lower : null;
}

/** Firestore auto-ids are mixed case, so the id is not lowercased on the way in. */
const idOf = (value: unknown): string => text(value, MAX.id).replace(/[^A-Za-z0-9_-]/g, '');

const compact = (fields: Record<string, string | undefined>): Record<string, string> =>
  Object.fromEntries(Object.entries(fields).filter(([, v]) => !!v)) as Record<string, string>;

/** A brochure url is admin-typed, and it is handed straight to the browser as an href. */
const safeHref = (url?: string): string | undefined =>
  url && /^(https?:\/\/|\/)/i.test(url.trim()) ? url.trim() : undefined;

/* ------------------------------------------------------------------ */
/* Properties and WhatsApp                                             */
/* ------------------------------------------------------------------ */

const WA_BY_PROPERTY: Record<string, { enquire: string; visit: string }> = {
  agartha: { enquire: WHATSAPP.agarthaEnquire, visit: WHATSAPP.agarthaVisit },
  syl: { enquire: WHATSAPP.sylEnquire, visit: WHATSAPP.sylVisit },
  'dates-county': { enquire: WHATSAPP.datesEnquire, visit: WHATSAPP.datesVisit },
};

/** Admin-added properties have no hand-written deep link; the generic thread still reaches an adviser. */
const waLink = (id: string | undefined, kind: 'enquire' | 'visit'): string =>
  (id ? WA_BY_PROPERTY[id]?.[kind] : undefined) ?? WHATSAPP.generic;

async function resolveProperty(value: unknown): Promise<Sanctuary | null> {
  const id = idOf(value);
  if (!id) return null;
  const hit = await getPropertyById(id);
  if (hit) return hit;
  // Models echo the display casing ("Agartha") while the flagship ids are lowercase.
  const lower = id.toLowerCase();
  return lower === id ? null : ((await getPropertyById(lower)) ?? null);
}

/* ------------------------------------------------------------------ */
/* Executors                                                           */
/* ------------------------------------------------------------------ */

function fail(
  error: string,
  message: string,
  storedArgs: Record<string, string> = {},
  cta?: { label: string; href: string }
): ToolResult {
  return {
    ok: false,
    forModel: { error },
    payload: { message, ...(cta ? { ctaLabel: cta.label, ctaHref: cta.href } : {}) },
    storedArgs,
  };
}

async function unknownProperty(storedArgs: Record<string, string>): Promise<ToolResult> {
  const valid = (await getPortfolio()).map(p => `${p.id} (${p.title})`).join('; ');
  return fail(
    `That is not one of our sanctuaries. Valid ids: ${valid}. Ask the user which one they mean, then call again.`,
    'I could not match that to one of our sanctuaries.',
    storedArgs
  );
}

async function addLead(fields: { name: string; phone: string; intent: string; source: string }): Promise<string> {
  const ref = await adminDb().collection('leads').add({
    name: fields.name,
    phone: fields.phone,
    intent: fields.intent,
    source: fields.source,
    status: 'new',
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

const NEED_NAME = 'No usable name was supplied. Ask the user what name this should go under, then call again.';
const NEED_PHONE =
  'The phone number is missing or is not a valid 10–15 digit number. Ask the user to confirm their mobile number, then call again.';

async function bookSiteVisit(args: Record<string, unknown>): Promise<ToolResult> {
  const name = text(args.name, MAX.name);
  const phone = phoneOf(args.phone);
  const when = text(args.preferredWindow, MAX.text);

  if (!name) return fail(NEED_NAME, 'I still need a name for the booking.');
  if (!phone) return fail(NEED_PHONE, 'I still need a valid phone number.', compact({ name }));

  const property = await resolveProperty(args.propertyId);
  if (!property) return unknownProperty(compact({ name, phone }));

  const storedArgs = compact({ name, phone, propertyId: property.id, preferredWindow: when });
  const cta = { label: 'Message us on WhatsApp', href: waLink(property.id, 'visit') };

  try {
    const leadId = await addLead({
      name,
      phone,
      intent: `Site visit - ${property.title}${when ? `, ${when}` : ''}`,
      source: 'groot-site-visit',
    });
    return {
      ok: true,
      leadId,
      forModel: {
        saved: true,
        property: property.title,
        callbackWithin: '24 hours',
        note: 'The interface already shows a confirmation card. Acknowledge in one line; do not repeat the details.',
      },
      payload: {
        message: `Site visit requested for ${property.title}${when ? ` — ${when}` : ''}. An adviser calls you within 24 hours to confirm the slot.`,
        ctaLabel: cta.label,
        ctaHref: cta.href,
      },
      storedArgs,
    };
  } catch {
    return fail(
      'The booking could not be saved. Say so plainly, apologise once, and point them at WhatsApp so the visit is not lost.',
      'I could not save that just now.',
      storedArgs,
      cta
    );
  }
}

async function captureLead(args: Record<string, unknown>): Promise<ToolResult> {
  const name = text(args.name, MAX.name);
  const phone = phoneOf(args.phone);
  const interest = text(args.interest, MAX.text);
  const budget = text(args.budgetBracket, MAX.text);

  if (!name) return fail(NEED_NAME, 'I still need a name before I can log the callback.');
  if (!phone) return fail(NEED_PHONE, 'I still need a valid phone number.', compact({ name }));

  const storedArgs = compact({ name, phone, interest, budgetBracket: budget });
  const cta = { label: 'Message us on WhatsApp', href: WHATSAPP.generic };

  try {
    const leadId = await addLead({
      name,
      phone,
      // Mirrors the adviser-call form's vocabulary so the pipeline reads consistently.
      intent: [interest, budget && `Budget: ${budget}`].filter(Boolean).join(' · ') || 'Adviser call request',
      source: 'groot',
    });
    return {
      ok: true,
      leadId,
      forModel: {
        saved: true,
        callbackWithin: '24 hours',
        note: 'The interface already shows a confirmation card. Acknowledge in one line; do not repeat the details.',
      },
      payload: {
        message: `Callback requested for ${name}. An adviser calls you within 24 hours.`,
        ctaLabel: cta.label,
        ctaHref: cta.href,
      },
      storedArgs,
    };
  } catch {
    return fail(
      'The callback request could not be saved. Say so plainly, apologise once, and offer WhatsApp instead.',
      'I could not save that just now.',
      storedArgs,
      cta
    );
  }
}

async function subscribeNewsletter(args: Record<string, unknown>): Promise<ToolResult> {
  const email = emailOf(args.email);
  const name = text(args.name, MAX.name);

  if (!email) {
    return fail(
      'That email address is missing or malformed. Ask the user to repeat it, then call again.',
      'That email address did not look right.',
      compact({ name })
    );
  }

  const storedArgs = compact({ email, name });

  try {
    // Same function the footer form calls, so a chatbot subscriber lands in
    // Resend and gets the confirmation like everyone else. This used to write
    // to Firestore alone, which put them on a list no broadcast could reach.
    const result = await subscribeEmail({ email, source: 'groot', name });
    if (result.already) {
      return {
        ok: true,
        forModel: {
          alreadySubscribed: true,
          note: 'Nothing new was written. Tell them they are already on the list; do not offer to add them again.',
        },
        payload: { message: `${email} is already on the monthly briefing list.` },
        storedArgs,
      };
    }

    return {
      ok: true,
      forModel: { saved: true, note: 'Confirm in one line. The interface already shows the card.' },
      payload: { message: `${email} added to the monthly briefing.` },
      storedArgs,
    };
  } catch {
    return fail(
      'The subscription could not be saved. Apologise once and offer WhatsApp instead.',
      'I could not save that just now.',
      storedArgs,
      { label: 'Message us on WhatsApp', href: WHATSAPP.generic }
    );
  }
}

async function getBrochure(args: Record<string, unknown>): Promise<ToolResult> {
  const property = await resolveProperty(args.propertyId);
  if (!property) return unknownProperty({});

  const storedArgs = { propertyId: property.id };
  const pageUrl = `/sanctuaries/${property.id}`;
  const brochureUrl = safeHref(property.brochureUrl);

  if (!brochureUrl) {
    return fail(
      `${property.title} has no brochure on file. Do not invent a link — offer the WhatsApp thread so an adviser can send the deck directly.`,
      `No brochure on file for ${property.title} — an adviser can send the deck over WhatsApp.`,
      storedArgs,
      { label: 'Message us on WhatsApp', href: waLink(property.id, 'enquire') }
    );
  }

  return {
    ok: true,
    forModel: { property: property.title, brochureUrl, pageUrl, note: 'The card already carries the link.' },
    payload: {
      message: `${property.title} brochure — the full page is at ${pageUrl}.`,
      ctaLabel: 'Open the brochure',
      ctaHref: brochureUrl,
    },
    storedArgs,
  };
}

async function whatsappHandoff(args: Record<string, unknown>): Promise<ToolResult> {
  const topic = text(args.topic, MAX.text);

  let property: Sanctuary | null = null;
  if (idOf(args.propertyId)) {
    property = await resolveProperty(args.propertyId);
    if (!property) return unknownProperty(compact({ topic }));
  }

  return {
    ok: true,
    forModel: {
      handedOff: true,
      about: property?.title ?? 'general enquiry',
      note: 'The card already shows the WhatsApp button. Tell them an adviser picks it up from there; do not paste the link.',
    },
    payload: {
      message: property
        ? `WhatsApp thread ready for ${property.title} — an adviser replies there.`
        : 'WhatsApp thread ready — an adviser replies there.',
      ctaLabel: 'Message us on WhatsApp',
      ctaHref: waLink(property?.id, 'enquire'),
    },
    storedArgs: compact({ topic, propertyId: property?.id }),
  };
}

export async function executeTool(name: ToolName, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    switch (name) {
      case 'book_site_visit':
        return await bookSiteVisit(args);
      case 'capture_lead':
        return await captureLead(args);
      case 'subscribe_newsletter':
        return await subscribeNewsletter(args);
      case 'get_brochure':
        return await getBrochure(args);
      case 'whatsapp_handoff':
        return await whatsappHandoff(args);
      default:
        return fail(
          `There is no tool called "${String(name)}". Answer from the reference material instead.`,
          'That action is not available.'
        );
    }
  } catch {
    // Throwing here would abort the reply stream mid-sentence; the model apologises instead.
    return fail(
      'The action failed unexpectedly. Apologise once and offer the WhatsApp thread.',
      'Something went wrong on our side.',
      {},
      { label: 'Message us on WhatsApp', href: WHATSAPP.generic }
    );
  }
}
