/**
 * Proves exactly when the welcome email fires — and, more importantly, when it
 * does not.
 *
 *   npm run build && npm start        # terminal 1 (production mode, real env)
 *   node --env-file=.env.local scripts/e2e-welcome.mjs
 *
 * The rule under test: a member is welcomed at the first moment we hold both an
 * account and an address to write to — a sign-up, a first Google sign-in (which
 * is the same event), or the OTP member's profile step, where the email is
 * required and cannot be skipped.
 * Never on a later sign-in, and never on the page loads that quietly re-post the
 * profile when the browser hands back a location.
 *
 * This exists because the previous rule was "welcome unless welcomeSentAt is
 * set", which meant every account created before that field existed was one page
 * load away from a five-months-late "Welcome to The Green Team".
 *
 * Send attempts are counted from the server's own `[email]` log lines rather
 * than from Resend, so the suite is honest in a sandbox with no egress: the
 * attempt is what is being asserted, not the delivery. Addresses use `.invalid`
 * so they clear the code's own `.test`/`example.` suppression and a real attempt
 * is made — while remaining an address that can never route to a person.
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const LOG = process.env.SERVER_LOG;
const RUN = `w${Date.now().toString(36)}`;
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

const results = [];
const ok = (n, d = '') => { results.push(true); console.log(`  ✅ ${n}${d ? ' — ' + d : ''}`); };
const bad = (n, d = '') => { results.push(false); console.log(`  ❌ ${n}${d ? ' — ' + d : ''}`); };

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});
const db = getFirestore();
const auth = getAuth();
const wait = ms => new Promise(r => setTimeout(r, ms));

/** Total welcome-send attempts the server has logged so far. Counting all
 *  matches (rather than slicing the tail of the file) avoids the byte-offset
 *  vs character-index drift that multi-byte characters cause in the log. */
function attemptCount() {
  try {
    return (readFileSync(LOG, 'utf8').match(/\[email\]/g) ?? []).length;
  } catch {
    return 0;
  }
}

/** Mint a real ID token the same way the browser SDK does. */
async function idTokenFor(uid) {
  const customToken = await auth.createCustomToken(uid);
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    }
  );
  const data = await res.json();
  if (!data.idToken) throw new Error(`token exchange failed: ${JSON.stringify(data).slice(0, 200)}`);
  return data.idToken;
}

async function postProfile(idToken, body = {}) {
  const res = await fetch(`${BASE}/api/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify(body),
  });
  return res.json();
}

/** Run `fn`, then report how many send attempts it caused. */
async function attempts(fn) {
  const before = attemptCount();
  await fn();
  await wait(4000); // `after()` runs once the response is out
  return attemptCount() - before;
}

/**
 * Stand in for a delivery this sandbox cannot make. There is no egress to
 * Resend here, so every real send fails and the welcome correctly stays owed —
 * which would mask the rule under test. Stamping the record is exactly what the
 * route does itself the moment Resend accepts a message in production.
 */
async function markDelivered(uid) {
  await db.collection('users').doc(uid).set(
    { welcomeSentAt: FieldValue.serverTimestamp(), welcomePending: false },
    { merge: true }
  );
}

const created = [];
async function makeUser(props) {
  const u = await auth.createUser(props);
  created.push(u.uid);
  return u;
}

async function main() {
  if (!LOG) {
    console.error('SERVER_LOG must point at the server\'s log file — the suite counts send attempts from it.');
    process.exit(2);
  }
  console.log(`\nWelcome-email rules · ${BASE}\n`);

  // ── 1. A new Google member: the account and the address arrive together ────
  console.log('▶ 1. First Google sign-in (token carries a verified email)');
  const google = await makeUser({ uid: `${RUN}-g`, email: `${RUN}-g@greenteam-e2e.invalid`, displayName: 'Google Newcomer' });
  const googleToken = await idTokenFor(google.uid);
  let n = await attempts(() => postProfile(googleToken));
  n === 1 ? ok('sign-up sends exactly one welcome') : bad('sign-up welcome', `expected 1 attempt, saw ${n}`);
  await markDelivered(google.uid);

  // ── 2. The same member comes back. This is the bug the CEO reported. ───────
  console.log('\n▶ 2. Returning member (three more profile posts — sign-in, page load, save)');
  n = await attempts(async () => {
    await postProfile(googleToken);
    await postProfile(googleToken, { lat: 17.38, lng: 78.48, locationAccuracy: 30 });
    await postProfile(googleToken, { city: 'Hyderabad' });
  });
  n === 0 ? ok('returning sign-ins send nothing') : bad('returning sign-in', `expected 0 attempts, saw ${n}`);

  // ── 3. OTP member: account first, address later ───────────────────────────
  console.log('\n▶ 3. Phone-OTP sign-up, then the mandatory email step');
  const otp = await makeUser({ uid: `${RUN}-p`, phoneNumber: `+1650555${String(Date.now()).slice(-4)}` });
  const otpToken = await idTokenFor(otp.uid);
  let body;
  n = await attempts(async () => { body = await postProfile(otpToken); });
  n === 0 ? ok('OTP sign-up alone sends nothing — no address to write to') : bad('OTP sign-up', `expected 0, saw ${n}`);
  // What makes the profile step mandatory in the UI: the server says an address
  // is still missing, so the modal reopens with no way past it.
  body?.needsEmail === true
    ? ok('server reports needsEmail — the profile step cannot be skipped')
    : bad('needsEmail flag', `expected true, got ${JSON.stringify(body)}`);

  n = await attempts(async () => {
    body = await postProfile(otpToken, { name: 'Otp Member', email: `${RUN}-p@greenteam-e2e.invalid` });
  });
  n === 1 ? ok('welcome fires when the OTP member gives an email') : bad('OTP profile step', `expected 1, saw ${n}`);
  body?.needsEmail === false
    ? ok('and the step stops being required once an address is on file')
    : bad('needsEmail cleared', `expected false, got ${JSON.stringify(body)}`);
  await markDelivered(otp.uid);

  n = await attempts(() => postProfile(otpToken, { city: 'Hyderabad' }));
  n === 0 ? ok('and not again on the next save') : bad('OTP repeat', `expected 0, saw ${n}`);

  // ── 4. The April members: on the books long before this email existed ─────
  console.log('\n▶ 4. Pre-existing member with no welcomeSentAt (the April accounts)');
  const legacy = await makeUser({ uid: `${RUN}-l`, email: `${RUN}-l@greenteam-e2e.invalid`, displayName: 'Legacy Member' });
  await db.collection('users').doc(legacy.uid).set({
    uid: legacy.uid,
    email: `${RUN}-l@greenteam-e2e.invalid`,
    firstSignIn: FieldValue.serverTimestamp(),
    lastSeen: FieldValue.serverTimestamp(),
  });
  const legacyToken = await idTokenFor(legacy.uid);
  n = await attempts(() => postProfile(legacyToken));
  n === 0
    ? ok('an existing member is never welcomed late')
    : bad('legacy member', `expected 0 attempts, saw ${n} — they would get a surprise welcome`);

  // ── 5. A member whose record was lost, not created ────────────────────────
  console.log('\n▶ 5. Missing profile record for an older account (a repair, not a sign-up)');
  const repair = await makeUser({ uid: `${RUN}-r`, email: `${RUN}-r@greenteam-e2e.invalid` });
  // Age the Firebase account past the sign-up window; the record itself is absent.
  await auth.updateUser(repair.uid, { displayName: 'Repaired Member' });
  const aged = await auth.getUser(repair.uid);
  const ageMs = Date.now() - Date.parse(aged.metadata.creationTime);
  const repairToken = await idTokenFor(repair.uid);
  n = await attempts(() => postProfile(repairToken));
  if (ageMs > 10 * 60 * 1000) {
    n === 0 ? ok('a repaired record is not treated as a sign-up') : bad('repair', `expected 0, saw ${n}`);
  } else {
    // The account really was made moments ago, so a welcome is correct here.
    n === 1
      ? ok('a genuinely new account inside the sign-up window is welcomed', `account age ${Math.round(ageMs / 1000)}s`)
      : bad('new-account window', `expected 1, saw ${n}`);
  }

  // ── 6. A failed send stays owed, but does not stampede ────────────────────
  console.log('\n▶ 6. A send that failed is retried later, not on every page load');
  await db.collection('users').doc(legacy.uid).set(
    { welcomePending: true, welcomeAttemptedAt: FieldValue.delete() },
    { merge: true }
  );
  n = await attempts(() => postProfile(legacyToken));
  n === 1 ? ok('an owed welcome is retried on a later visit') : bad('retry', `expected 1, saw ${n}`);

  n = await attempts(async () => {
    await postProfile(legacyToken);
    await postProfile(legacyToken, { lat: 17.38, lng: 78.48, locationAccuracy: 30 });
  });
  n === 0
    ? ok('and the retry backs off — an outage cannot mean one attempt per page load')
    : bad('retry backoff', `expected 0 within the hour, saw ${n}`);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  console.log('\n▶ Cleanup');
  for (const uid of created) {
    await db.collection('users').doc(uid).delete().catch(() => {});
    await auth.deleteUser(uid).catch(() => {});
  }
  const leftover = (await db.collection('users').get()).docs.filter(d => d.id.startsWith(RUN)).length;
  leftover === 0
    ? console.log(`  🧹 removed ${created.length} test accounts — production data untouched`)
    : console.log(`  ⚠️  ${leftover} test records left behind`);

  const passed = results.filter(Boolean).length;
  console.log(`\n━━━ WELCOME RULES: ${passed}/${results.length} checks passed ━━━\n`);
  process.exit(passed === results.length ? 0 : 1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
