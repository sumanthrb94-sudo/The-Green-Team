/**
 * Seed the three flagship sanctuaries into the live `properties` collection so
 * the admin dashboard manages them like any other listing.
 *
 *   npx tsx --env-file=.env.local scripts/seed-properties.ts
 *
 * Idempotent: uses fixed doc ids (agartha / syl / dates-county) and merges, so
 * re-running never duplicates and never clobbers later admin edits to fields
 * that already exist — pass --force to overwrite everything from code.
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { SANCTUARIES } from '../lib/data/sanctuaries';

const force = process.argv.includes('--force');

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  }),
});
const db = getFirestore();

async function main() {
  for (const [i, s] of SANCTUARIES.entries()) {
    const { id, ...data } = s;
    const ref = db.collection('properties').doc(id);
    const existing = await ref.get();
    if (existing.exists && !force) {
      console.log(`↷ ${id} already seeded — skipping (use --force to overwrite)`);
      continue;
    }
    await ref.set(
      {
        ...data,
        status: 'live',
        order: i,
        ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
      },
      { merge: true }
    );
    console.log(`✓ seeded ${id} — ${s.title}`);
  }
  const count = (await db.collection('properties').count().get()).data().count;
  console.log(`\nproperties collection now holds ${count} documents`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
