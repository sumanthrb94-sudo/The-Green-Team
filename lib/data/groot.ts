/**
 * Groot's fixed copy.
 *
 * The knowledge base that used to live here — a hand-written 6.9 KB blob resent
 * on every turn — is gone. It drifted out of sync with the site (it never
 * mentioned Dates County and described the portfolio as a single property), which
 * is precisely what retrieval replaces: the bot now reads the same Firestore
 * records the website renders. See lib/rag/corpus.ts and lib/ai/persona.ts.
 */

export const GROOT_GREETING =
  "I'm Groot, adviser for The Green Team. Ask me about pricing, plot sizes, air quality or approvals across our three sanctuaries — or tell me when you'd like to visit one and I'll set it up.";

/** Shown only when the assistant cannot be reached at all. */
export const GROOT_FALLBACK =
  "I can't reach my knowledge base right now, so I'd rather not guess. An adviser can answer this straight away on WhatsApp.";

/** Offered as one-tap openers before the first message. */
export const GROOT_SUGGESTIONS = [
  'What do plots at Agartha cost?',
  'Book me a site visit',
  'Which sanctuary has the cleanest air?',
  'Is it RERA approved?',
] as const;
