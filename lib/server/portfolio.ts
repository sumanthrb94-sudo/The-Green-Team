import 'server-only';
import { adminDb } from '@/lib/firebase/admin';
import { SANCTUARIES, type Sanctuary } from '@/lib/data/sanctuaries';

/**
 * Single source of truth for the public portfolio: Firestore `properties`
 * (admin-managed) wins; the in-code flagships remain a fallback so the site
 * never renders empty if the database is unreachable. The three flagships are
 * seeded into Firestore (scripts/seed-properties.ts), so admins edit them
 * like any other listing.
 */

function fromDoc(id: string, data: FirebaseFirestore.DocumentData): Sanctuary {
  // Strip non-serializable values (Firestore Timestamps) — RSC → client props
  // must be plain JSON.
  const plain: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === null || ['string', 'number', 'boolean'].includes(typeof v) || Array.isArray(v)) plain[k] = v;
  }
  return { ...(plain as Omit<Sanctuary, 'id'>), id };
}

export async function getPortfolio(): Promise<Sanctuary[]> {
  try {
    const snap = await adminDb().collection('properties').where('status', '==', 'live').get();
    const fs = snap.docs.map(d => fromDoc(d.id, d.data()));
    fs.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    const fallback = SANCTUARIES.filter(s => !fs.some(p => p.id === s.id));
    return [...fs, ...fallback];
  } catch {
    return SANCTUARIES;
  }
}

export async function getPropertyById(id: string): Promise<Sanctuary | undefined> {
  try {
    const snap = await adminDb().collection('properties').doc(id).get();
    if (snap.exists) {
      const data = snap.data()!;
      if (data.status === 'live') return fromDoc(snap.id, data);
    }
  } catch {
    /* fall through to code data */
  }
  return SANCTUARIES.find(s => s.id === id);
}
