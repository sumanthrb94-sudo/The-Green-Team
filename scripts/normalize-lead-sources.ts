/**
 * Canonicalise the `source` field on existing leads.
 *
 *   npx tsx --env-file=.env.local scripts/normalize-lead-sources.ts          # dry run
 *   npx tsx --env-file=.env.local scripts/normalize-lead-sources.ts --write
 *
 * Different versions of the adviser form wrote `adviser-call` and
 * `adviser_call`, which splits a single channel across two rows in the leads
 * view, the CSV export and the analytics attribution — the kind of thing that
 * quietly makes a report wrong rather than obviously broken.
 *
 * `app/api/leads/route.ts` now normalises on write, so this is a one-off
 * backfill for rows created before that. It only rewrites `source`; nothing
 * else on the document is touched, and historically meaningful values (e.g.
 * `membership`, from the retired page) are preserved rather than collapsed —
 * where a lead actually came from is worth keeping.
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const WRITE = process.argv.includes('--write');

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  }),
});
const db = getFirestore();

const canonical = (s: string) => s.trim().toLowerCase().replace(/[\s_]+/g, '-');

async function main() {
  const snap = await db.collection('leads').get();
  const changes: { id: string; from: string; to: string }[] = [];

  for (const doc of snap.docs) {
    const from = String(doc.data().source ?? 'unspecified');
    const to = canonical(from);
    if (from !== to) changes.push({ id: doc.id, from, to });
  }

  console.log(`${snap.size} lead(s) scanned, ${changes.length} need normalising\n`);
  for (const c of changes) console.log(`  ${c.id}  "${c.from}" → "${c.to}"`);

  if (!changes.length) {
    console.log('Nothing to do.');
    return;
  }

  if (WRITE) {
    const batch = db.batch();
    for (const c of changes) batch.update(db.collection('leads').doc(c.id), { source: c.to });
    await batch.commit();
    console.log(`\nApplied to ${changes.length} document(s).`);
  } else {
    console.log('\n(dry run — pass --write to apply)');
  }

  // Report the resulting distribution so the split is visibly gone.
  const after = await db.collection('leads').get();
  const dist: Record<string, number> = {};
  after.forEach(d => {
    const s = String(d.data().source ?? 'unspecified');
    dist[s] = (dist[s] ?? 0) + 1;
  });
  console.log('\nsource distribution:');
  Object.entries(dist)
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => console.log(`  ${k.padEnd(24)} ${v}`));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
