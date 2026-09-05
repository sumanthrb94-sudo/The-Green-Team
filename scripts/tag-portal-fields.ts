/**
 * Push the portal discovery fields — category, stage, investment — onto the
 * live `properties` documents.
 *
 *   npx tsx --env-file=.env.local scripts/tag-portal-fields.ts          # dry run
 *   npx tsx --env-file=.env.local scripts/tag-portal-fields.ts --write  # apply
 *
 * Why: the public site reads properties from Firestore, not from
 * lib/data/sanctuaries.ts, so tagging the in-code entries alone changes nothing
 * live — the browse pages would filter on fields the live documents do not
 * have and show every category as empty. This copies exactly those three
 * fields from the in-code source onto each live document and touches nothing
 * else, so admin edits to every other field survive.
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { SANCTUARIES } from '../lib/data/sanctuaries';

const WRITE = process.argv.includes('--write');
const FIELDS = ['category', 'stage', 'investment'] as const;

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  }),
});
const db = getFirestore();

async function main() {
  let changed = 0;
  for (const s of SANCTUARIES) {
    const ref = db.collection('properties').doc(s.id);
    const snap = await ref.get();
    if (!snap.exists) {
      console.log(`↷ ${s.id}: no live document`);
      continue;
    }
    const cur = snap.data()!;
    const patch: Record<string, unknown> = {};
    for (const f of FIELDS) {
      const next = (s as unknown as Record<string, unknown>)[f];
      if (next !== undefined && cur[f] !== next) patch[f] = next;
    }
    if (!Object.keys(patch).length) {
      console.log(`✓ ${s.id}: already tagged`);
      continue;
    }
    console.log(`${s.id}: ${JSON.stringify(patch)}`);
    if (WRITE) {
      await ref.set(patch, { merge: true });
      changed++;
    }
  }
  console.log(WRITE ? `\napplied to ${changed} document(s).` : '\n(dry run — pass --write to apply)');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
