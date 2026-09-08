/**
 * First-touch and last-touch attribution, captured in the browser and carried
 * until the visitor actually converts.
 *
 * Why this is needed at all: eleven of the twenty-six leads in Firestore say
 * `source: unspecified`, because the forms only ever knew which form they were.
 * They never knew that the person arrived from an Instagram reel three days
 * ago, landed on /sanctuaries/agartha, and came back direct today. That is the
 * fact that decides where the marketing money goes, and it was being thrown
 * away at the moment of the only conversion the business has.
 *
 * Two touches, because they answer different questions:
 *   - first touch  → which channel *found* this buyer (what to spend on)
 *   - last touch   → what they were doing when they decided (what to fix)
 *
 * Same consent gate as the rest of this folder. If analytics is refused there
 * is nothing to attach and the lead is written exactly as it is today, with the
 * form's own source and nothing else — a refusal must cost the visitor nothing
 * and must not be worked around.
 */
import { channelOf, referrerHost } from './channel';
import { readConsent } from '@/lib/consent';
import { sessionRef } from './ref';

const FIRST_KEY = 'gt_first'; // localStorage — survives the visitor going away and coming back
const LAST_KEY = 'gt_last'; // sessionStorage — this visit only

export interface Touch {
  channel: string;
  referrer: string;
  landing: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  at: string;
}

/** What travels with a lead. Flat and short — it is stored on every lead row. */
export interface Attribution {
  firstChannel: string;
  firstLanding: string;
  firstAt: string;
  lastChannel: string;
  lastLanding: string;
  /** The session reference, so a lead can be opened as a full session trace. */
  ref?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

const readJson = <T,>(store: Storage, key: string): T | null => {
  try {
    const raw = store.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

const writeJson = (store: Storage, key: string, value: unknown) => {
  try {
    store.setItem(key, JSON.stringify(value));
  } catch {
    /* attribution is never worth an exception */
  }
};

function currentTouch(): Touch {
  const q = new URLSearchParams(window.location.search);
  const utmSource = q.get('utm_source') ?? undefined;
  const host = referrerHost(document.referrer || undefined, window.location.host);
  return {
    channel: channelOf(host, utmSource),
    referrer: host,
    landing: window.location.pathname.slice(0, 120),
    ...(utmSource ? { utmSource: utmSource.slice(0, 40) } : {}),
    ...(q.get('utm_medium') ? { utmMedium: q.get('utm_medium')!.slice(0, 40) } : {}),
    ...(q.get('utm_campaign') ? { utmCampaign: q.get('utm_campaign')!.slice(0, 60) } : {}),
    at: new Date().toISOString(),
  };
}

/**
 * Record the touch for this visit. Called once per page load from PageTracker.
 *
 * First touch is written once and never overwritten — that is the whole point
 * of it. Last touch is rewritten only when this load actually came from
 * somewhere (a referrer or a UTM); an internal navigation must not overwrite
 * "arrived from Instagram" with "arrived from Direct", which is the classic way
 * attribution quietly turns everything into Direct.
 */
export function recordTouch(): void {
  if (typeof window === 'undefined' || readConsent() !== 'granted') return;
  const touch = currentTouch();

  if (!readJson<Touch>(localStorage, FIRST_KEY)) writeJson(localStorage, FIRST_KEY, touch);

  const external = touch.referrer !== 'direct' || Boolean(touch.utmSource);
  if (external || !readJson<Touch>(sessionStorage, LAST_KEY)) {
    writeJson(sessionStorage, LAST_KEY, touch);
  }
}

/**
 * The attribution to attach to a form submission, or `undefined` when analytics
 * was refused or nothing was ever recorded.
 */
export function attribution(): Attribution | undefined {
  if (typeof window === 'undefined' || readConsent() !== 'granted') return undefined;
  const first = readJson<Touch>(localStorage, FIRST_KEY);
  const last = readJson<Touch>(sessionStorage, LAST_KEY) ?? first;
  if (!first || !last) return undefined;
  return {
    firstChannel: first.channel,
    firstLanding: first.landing,
    firstAt: first.at,
    lastChannel: last.channel,
    lastLanding: last.landing,
    ...(sessionRef() ? { ref: sessionRef() } : {}),
    ...(last.utmSource ? { utmSource: last.utmSource } : {}),
    ...(last.utmMedium ? { utmMedium: last.utmMedium } : {}),
    ...(last.utmCampaign ? { utmCampaign: last.utmCampaign } : {}),
  };
}
