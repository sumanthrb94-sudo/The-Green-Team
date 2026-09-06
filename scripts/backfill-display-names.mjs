/**
 * Copy each member's name from Firestore onto their Firebase Auth record.
 *
 *   node --env-file=.env.local scripts/backfill-display-names.mjs        # report
 *   node --env-file=.env.local scripts/backfill-display-names.mjs --write
 *
 * Until now the profile step wrote the name to `users/{uid}.name` and nowhere
 * else, while every greeting in the app — the menu, the avatar initial, the
 * chatbot — reads `displayName` off the Firebase Auth user. A Google account
 * arrives with one, so nobody noticed; a phone-OTP account does not, so those
 * members were greeted by their own phone number no matter what they had typed.
 *
 * /api/profile now sets it at the moment a name is saved. This is for the
 * accounts that were created before that, and only ever fills a blank — it will
 * not overwrite a name a provider already gave.
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const WRITE = process.argv.includes('--write');

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});
const db = getFirestore();
const auth = getAuth();

const mask = s => (s ? s.slice(0, 6) + '…' + s.slice(-2) : '—');
/** Leftovers from the test suites — real people only. */
const isTestAccount = s => Boolean(s) && /e2e|\.test$|\.invalid$|example\./i.test(s);

async function main() {
  const snap = await db.collection('users').get();
  let filled = 0, already = 0, noName = 0, failed = 0, skipped = 0;

  for (const doc of snap.docs) {
    const d = doc.data();
    const name = (d.name ?? d.displayName ?? '').toString().trim();

    let record;
    try {
      record = await auth.getUser(doc.id);
    } catch {
      continue; // a Firestore row whose auth account is gone
    }

    if (record.displayName) { already++; continue; }
    if (isTestAccount(record.email) || isTestAccount(doc.id)) { skipped++; continue; }
    if (!name) {
      noName++;
      console.log(`  ·  no name on file      ${mask(record.email ?? record.phoneNumber)}`);
      continue;
    }

    if (WRITE) {
      try {
        await auth.updateUser(doc.id, { displayName: name });
        filled++;
        console.log(`  ✅ set "${name}"        ${mask(record.email ?? record.phoneNumber)}`);
      } catch (err) {
        failed++;
        console.log(`  ❌ failed for ${mask(record.email ?? record.phoneNumber)}: ${String(err).slice(0, 80)}`);
      }
    } else {
      filled++;
      console.log(`  →  would set "${name}"  ${mask(record.email ?? record.phoneNumber)}`);
    }
  }

  console.log(
    `\n${WRITE ? 'Filled' : 'Would fill'} ${filled} · already had one ${already} · no name stored ${noName}${failed ? ` · failed ${failed}` : ''}`
  );
  if (!WRITE && filled) console.log('Re-run with --write to apply.\n');
  process.exit(failed ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
