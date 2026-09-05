/**
 * Delete analytics events older than a retention window.
 *
 *   npx tsx --env-file=.env.local scripts/prune-analytics.ts            # dry run, 180 days
 *   npx tsx --env-file=.env.local scripts/prune-analytics.ts --write
 *   npx tsx --env-file=.env.local scripts/prune-analytics.ts --days=90 --write
 *
 * Why this exists: `analytics_events` grows one document per pageview and per
 * interaction, forever. Nothing else prunes it, and both Firestore storage and
 * the dashboard's read cost scale with it. Keeping ~6 months is plenty for
 * year-on-year comparison on a site this size.
 *
 * Firestore has no server-side TTL on the free tier, so this is a cron job you
 * run (or wire to a scheduled function) rather than a database setting.
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const WRITE = process.argv.includes('--write');
const daysArg = process.argv.find(a => a.startsWith('--days='));
const DAYS = daysArg ? Math.max(7, Number(daysArg.split('=')[1]) || 180) : 180;

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  }),
});
const db = getFirestore();

async function main() {
  const cutoff = new Date(Date.now() - DAYS * 86_400_000);
  console.log(`Pruning analytics_events older than ${cutoff.toISOString()} (${DAYS} days)`);

  let removed = 0;
  // Batched: a single delete-all would blow the 500-write batch limit and the
  // request deadline once the collection is large.
  for (;;) {
    const snap = await db
      .collection('analytics_events')
      .where('at', '<', Timestamp.fromDate(cutoff))
      .limit(400)
      .get();

    if (snap.empty) break;
    if (!WRITE) {
      console.log(`  would delete ${snap.size} (dry run — pass --write to apply)`);
      break;
    }

    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    removed += snap.size;
    console.log(`  deleted ${removed}…`);
  }

  console.log(WRITE ? `\nDone — ${removed} document(s) removed.` : '\n(dry run)');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
