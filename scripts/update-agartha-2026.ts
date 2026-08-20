/**
 * Push the 2026 client brochure/layout data into the live `properties`
 * collection.
 *
 *   npx tsx --env-file=.env.local scripts/update-agartha-2026.ts          # dry run
 *   npx tsx --env-file=.env.local scripts/update-agartha-2026.ts --write  # apply
 *
 * Why this exists rather than `seed-properties.ts --force`: that script
 * rewrites every field of all three properties from code, which would silently
 * discard anything an admin has edited in the dashboard since seeding. This
 * touches only the fields the new brochure and master plan actually change, on
 * only the properties they concern, and writes a JSON backup of the prior
 * documents first so the change is reversible.
 *
 * Source documents (client, 2026):
 *   AGARTHAEBroucher_under30mb.pdf  — price, unit size, amenities, distances
 *   Agartha_Final_layout.pdf        — the 37-plot master plan
 *   modcon_SYL1.pdf                 — SYL clubhouse + commercial programme
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { SANCTUARIES } from '../lib/data/sanctuaries';
import fs from 'node:fs';

const WRITE = process.argv.includes('--write');

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  }),
});
const db = getFirestore();

/** Only these fields are touched. Anything else in the document is left alone. */
const FIELDS = [
  'memberPrice',
  'plots',
  'plotRange',
  'commute',
  'description',
  'amenityAcres',
  'features',
  'sitePlanSrc',
] as const;

async function main() {
  const backup: Record<string, unknown> = {};
  let changed = 0;

  for (const id of ['agartha', 'syl'] as const) {
    const source = SANCTUARIES.find(s => s.id === id);
    if (!source) throw new Error(`no in-code source for ${id}`);

    const ref = db.collection('properties').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      console.log(`↷ ${id}: no live document — run seed-properties.ts first`);
      continue;
    }
    const current = snap.data()!;
    backup[id] = current;

    const patch: Record<string, unknown> = {};
    for (const f of FIELDS) {
      const next = (source as unknown as Record<string, unknown>)[f];
      if (next === undefined) continue;
      if (JSON.stringify(current[f]) !== JSON.stringify(next)) patch[f] = next;
    }

    if (Object.keys(patch).length === 0) {
      console.log(`✓ ${id}: already current`);
      continue;
    }

    console.log(`\n${id} — ${Object.keys(patch).length} field(s) change:`);
    for (const [k, v] of Object.entries(patch)) {
      const before = JSON.stringify(current[k]);
      const after = JSON.stringify(v);
      const trim = (s: string) => (s && s.length > 90 ? s.slice(0, 90) + '…' : s);
      console.log(`  ${k}`);
      console.log(`    was: ${trim(before)}`);
      console.log(`    now: ${trim(after)}`);
    }

    if (WRITE) {
      await ref.set(patch, { merge: true });
      changed++;
    }
  }

  const path = `/tmp/properties-backup-${Date.now()}.json`;
  fs.writeFileSync(path, JSON.stringify(backup, null, 2));
  console.log(`\nbackup of prior documents: ${path}`);
  console.log(WRITE ? `\napplied to ${changed} document(s).` : '\n(dry run — pass --write to apply)');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
