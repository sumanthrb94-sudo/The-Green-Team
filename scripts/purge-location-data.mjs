/**
 * Delete every precise coordinate we ever collected.
 *
 *   node --env-file=.env.local scripts/purge-location-data.mjs          # report
 *   node --env-file=.env.local scripts/purge-location-data.mjs --write
 *
 * The app used to ask the browser for a member's exact position a second after
 * they signed in, store it on their profile, and show it to an administrator as
 * a coordinate pair and a map link. There was no stated purpose and no benefit
 * to the member, which is precisely what DPDP s.6(1) does not allow: consent is
 * limited to the personal data necessary for the purpose it was given for, and
 * there was no purpose to be necessary for.
 *
 * The collection is gone from the code. This removes what it already took —
 * stopping the tap is not the same as emptying the bucket, and s.8(7) requires
 * erasure once the data is no longer needed.
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const WRITE = process.argv.includes('--write');
const FIELDS = ['lat', 'lng', 'locationAccuracy'];

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});
const db = getFirestore();

async function main() {
  const snap = await db.collection('users').get();
  let affected = 0;

  for (const doc of snap.docs) {
    const d = doc.data();
    const present = FIELDS.filter(f => d[f] !== undefined);
    if (!present.length) continue;
    affected++;
    const who = d.email ?? d.phone ?? doc.id;
    const where = d.lat !== undefined ? `${Number(d.lat).toFixed(3)}, ${Number(d.lng).toFixed(3)}` : present.join('+');
    console.log(`  ${WRITE ? '🧹 cleared' : '→  would clear'}  ${String(who).slice(0, 34).padEnd(34)} ${where}`);
    if (WRITE) {
      await doc.ref.update(Object.fromEntries(FIELDS.map(f => [f, FieldValue.delete()])));
    }
  }

  console.log(
    affected === 0
      ? '\nNo stored coordinates found — nothing to erase.\n'
      : `\n${WRITE ? 'Erased' : 'Would erase'} coordinates from ${affected} profile${affected === 1 ? '' : 's'}.` +
          (WRITE ? '\n' : '\nRe-run with --write to apply.\n')
  );
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
