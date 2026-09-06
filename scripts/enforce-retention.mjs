/**
 * Delete what we said we would delete.
 *
 *   node --env-file=.env.local scripts/enforce-retention.mjs          # report
 *   node --env-file=.env.local scripts/enforce-retention.mjs --write
 *
 * Section 8(7) of the DPDP Act requires erasure once the purpose is served, and
 * the Privacy Policy publishes a period for every kind of record. A published
 * retention period that nothing enforces is not a policy, it is a sentence — so
 * this is the thing that makes those numbers true. Run it monthly.
 *
 * The periods below must match lib/data/legal.ts. If you change one, change both.
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const WRITE = process.argv.includes('--write');
const DAY = 24 * 60 * 60 * 1000;

/** Each rule states the promise it enforces, so the two cannot drift silently. */
const RULES = [
  {
    collection: 'analytics_events',
    field: 'createdAt',
    days: 425, // ~14 months
    promise: 'Analytics: "Fourteen months, then deleted automatically."',
  },
  {
    collection: 'conversations',
    field: 'startedAt',
    days: 365,
    promise: 'Chat transcripts: "Twelve months."',
  },
  {
    collection: 'leads',
    field: 'createdAt',
    days: 365 * 3,
    promise: 'Enquiries: "Three years from your last contact with us."',
  },
];

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});
const db = getFirestore();

async function main() {
  console.log(`\nRetention${WRITE ? '' : ' (dry run)'}\n`);
  let total = 0;

  for (const rule of RULES) {
    const cutoff = new Date(Date.now() - rule.days * DAY);
    let snap;
    try {
      snap = await db
        .collection(rule.collection)
        .where(rule.field, '<', cutoff)
        .limit(500)
        .get();
    } catch (err) {
      // A missing index or a collection that does not exist yet is not a
      // failure worth stopping the whole run for.
      console.log(`  ⚠️  ${rule.collection}: could not query — ${String(err).slice(0, 80)}`);
      continue;
    }

    console.log(`  ${rule.collection.padEnd(18)} older than ${String(rule.days).padStart(4)} days: ${snap.size}`);
    console.log(`  ${''.padEnd(18)} ${rule.promise}`);

    if (WRITE && snap.size) {
      // Batched, because a month of analytics can be thousands of rows.
      let batch = db.batch();
      let n = 0;
      for (const doc of snap.docs) {
        batch.delete(doc.ref);
        if (++n % 400 === 0) { await batch.commit(); batch = db.batch(); }
      }
      if (n % 400) await batch.commit();
      console.log(`  ${''.padEnd(18)} 🧹 deleted ${snap.size}`);
    }
    total += snap.size;
    console.log('');
  }

  console.log(
    total === 0
      ? 'Nothing is past its retention period.\n'
      : `${WRITE ? 'Deleted' : 'Would delete'} ${total} record${total === 1 ? '' : 's'}.` +
          (WRITE ? ' Re-run to clear any beyond the 500-per-collection page.\n' : ' Re-run with --write to apply.\n')
  );
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
