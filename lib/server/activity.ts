import 'server-only';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';

/**
 * Live activity for the public "momentum" strip.
 *
 * Every figure here is real. The design rule that keeps it honest AND never
 * shows an embarrassing zero: a metric is *omitted* while it is below a
 * threshold, and *shown with its true value* once it clears it. Omission is not
 * a claim; a fabricated floor would be. Nothing here is ever inflated above the
 * truth — enquiry counts are rounded DOWN to an "N+" band, never up.
 *
 * So on a cold start the strip simply shows fewer chips (the ones that are
 * already real: enquiries, sanctuaries, and reserved units once the admin sets
 * them). As the reels drive traffic, the visitor chip crosses its threshold and
 * appears on its own. The strip gets stronger by itself, without anyone editing
 * a number.
 */

export interface ActivityItem {
  id: string;
  label: string;
  /** The stat's headline — already a string, e.g. "20+" or "18 of 52". */
  value: string;
  /** True for the scarcity line, which the UI styles more prominently. */
  emphasis?: boolean;
}

/** Round DOWN to a band, so "23" shows as "20+" — always ≤ the truth. */
function bandDown(n: number, step: number): number {
  return Math.floor(n / step) * step;
}

const READ_CAP = 20000;

export async function getActivity(): Promise<{ items: ActivityItem[]; at: string }> {
  const db = adminDb();
  const items: ActivityItem[] = [];

  // --- Reserved units (real scarcity, admin-entered) — the strongest chip.
  // Summed across live properties from the `reserved` field the admin sets.
  try {
    const props = await db.collection('properties').where('status', '==', 'live').get();
    let reserved = 0;
    let units = 0;
    props.forEach(d => {
      const v = d.data();
      reserved += Number(v.reserved) || 0;
      units += Number(v.plots) || 0;
    });
    if (reserved > 0 && units > 0) {
      items.push({ id: 'reserved', label: 'units reserved', value: `${reserved} of ${units}`, emphasis: true });
    }
    if (props.size > 0) {
      items.push({ id: 'sanctuaries', label: props.size === 1 ? 'curated sanctuary' : 'curated sanctuaries', value: String(props.size) });
    }
  } catch (err) {
    console.error('[activity] properties:', err);
  }

  // --- Visitors this week (real, from first-party analytics). Hidden until it
  // clears a threshold so it never reads "2 exploring".
  try {
    const weekAgo = new Date(Date.now() - 7 * 86_400_000);
    const snap = await db
      .collection('analytics_events')
      .where('at', '>=', Timestamp.fromDate(weekAgo))
      .limit(READ_CAP)
      .get();
    const vids = new Set<string>();
    snap.forEach(d => {
      const v = d.data();
      if (v.bot !== true && typeof v.vid === 'string') vids.add(v.vid);
    });
    const VISITOR_MIN = 25; // below this it isn't "momentum" yet — omit it
    if (vids.size >= VISITOR_MIN) {
      items.push({ id: 'visitors', label: 'exploring this week', value: `${bandDown(vids.size, 10)}+` });
    }
  } catch (err) {
    console.error('[activity] visitors:', err);
  }

  // --- Enquiries to date (real leads). Shown once there are enough to band.
  try {
    const leads = (await db.collection('leads').count().get()).data().count;
    const ENQUIRY_MIN = 10;
    if (leads >= ENQUIRY_MIN) {
      items.push({ id: 'enquiries', label: 'enquiries and counting', value: `${bandDown(leads, 10)}+` });
    }
  } catch (err) {
    console.error('[activity] leads:', err);
  }

  return { items, at: new Date().toISOString() };
}
