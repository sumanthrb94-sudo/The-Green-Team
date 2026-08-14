import 'server-only';
import { adminDb } from '@/lib/firebase/admin';
import type { Sanctuary } from '@/lib/data/sanctuaries';

/**
 * Live Firestore-managed properties (admin-created), merged after the in-code
 * flagship sanctuaries on public pages. Server-side read via the Admin SDK, so
 * client Firestore rules can stay locked down.
 */
export async function getLiveProperties(): Promise<Sanctuary[]> {
  try {
    const snap = await adminDb()
      .collection('properties')
      .where('status', '==', 'live')
      .get();
    return snap.docs
      .map(d => ({ id: d.id, ...(d.data() as Omit<Sanctuary, 'id'>) }))
      .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  } catch {
    return []; // missing env / offline build — flagship portfolio still renders
  }
}
