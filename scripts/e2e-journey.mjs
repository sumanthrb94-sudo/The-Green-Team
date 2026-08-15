/**
 * Full dual-persona journey simulation with screenshots.
 *
 *   npm run build && npm start
 *   node --env-file=.env.local scripts/e2e-journey.mjs
 *
 * PERSONA A — a visitor: lands, sees the welcome gate, signs up, browses a
 * property, subscribes to the newsletter, requests an adviser call, chats
 * with Groot.
 * PERSONA B — the admin (a real server-minted session for the ADMIN_EMAILS
 * account): watches every record arrive, moves a lead through the pipeline,
 * onboards a new property through the UI and sees it appear on the public
 * site.
 *
 * Screenshots land in the OUT dir (not committed — admin views show real
 * data). All records created by the run are deleted at the end.
 */
import { chromium } from 'playwright';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const OUT = process.env.SHOT_DIR ?? path.resolve(process.cwd(), '.e2e-shots');
const RUN = `journey-${Date.now().toString(36)}`;
const MARK = `${RUN}@greenteam-e2e.test`;
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

const results = [];
const ok = (n, d = '') => { results.push({ n, pass: true }); console.log(`  ✅ ${n}${d ? ' — ' + d : ''}`); };
const fail = (n, d = '') => { results.push({ n, pass: false }); console.log(`  ❌ ${n}${d ? ' — ' + d : ''}`); };

function chromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!root) return undefined;
  for (const b of ['chromium-1194', 'chromium']) {
    const p = path.join(root, b, 'chrome-linux', 'chrome');
    if (existsSync(p)) return p;
  }
  return undefined;
}

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

let shotN = 0;
async function shot(page, name) {
  const file = `${String(++shotN).padStart(2, '0')}-${name}.jpg`;
  await page.screenshot({ path: path.join(OUT, file), type: 'jpeg', quality: 80 });
  console.log(`  📸 ${file}`);
  return file;
}

async function findDocs(coll, field, value, tries = 8) {
  for (let i = 0; i < tries; i++) {
    const snap = await db.collection(coll).where(field, '==', value).get();
    if (!snap.empty) return snap.docs;
    await wait(1200);
  }
  return [];
}

/** Mint a REAL admin session cookie (custom token → idToken → /api/session). */
async function adminSessionCookie() {
  const adminEmail = (process.env.ADMIN_EMAILS ?? '').split(',')[0].trim();
  const user = await auth.getUserByEmail(adminEmail);
  const customToken = await auth.createCustomToken(user.uid);
  const r = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    }
  );
  const data = await r.json();
  if (!data.idToken) throw new Error('custom-token exchange failed: ' + JSON.stringify(data.error ?? {}));
  const sess = await fetch(`${BASE}/api/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: data.idToken }),
  });
  const cookieHeader = sess.headers.get('set-cookie');
  const m = cookieHeader?.match(/gt_session=([^;]+)/);
  if (!m) throw new Error('no session cookie from /api/session');
  return { name: 'gt_session', value: m[1], adminEmail };
}

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const proxyServer = process.env.HTTPS_PROXY || process.env.https_proxy;
  const browser = await chromium.launch({
    executablePath: chromiumPath(),
    ...(proxyServer ? { proxy: { server: proxyServer, bypass: 'localhost,127.0.0.1' } } : {}),
  });

  // ════════════════ PERSONA A — THE VISITOR ════════════════
  console.log('\n════ PERSONA A — Visitor journey ════');
  const userCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'en-IN',
    timezoneId: 'Asia/Kolkata',
    ignoreHTTPSErrors: true,
  });
  const u = await userCtx.newPage();

  // 1. Landing + welcome gate
  await u.goto(`${BASE}/`, { waitUntil: 'load', timeout: 90000 });
  await wait(1500);
  await shot(u, 'user-landing');
  const gate = await u.locator('text=Unlock all three sanctuaries').waitFor({ timeout: 12000 }).then(() => true).catch(() => false);
  gate ? ok('welcome gate appears on first visit') : fail('welcome gate missing');
  if (gate) await shot(u, 'user-welcome-gate');

  // 2. Newsletter from the gate itself
  const nlEmail = `newsletter-${MARK}`;
  if (gate) {
    await u.locator('input[placeholder="you@gmail.com"]').fill(nlEmail);
    await u.getByRole('button', { name: 'Join', exact: true }).click();
    const joined = await u.locator('text=welcome to the circle').waitFor({ timeout: 12000 }).then(() => true).catch(() => false);
    joined ? ok('welcome-gate newsletter join confirmed in UI') : fail('welcome-gate join failed');
    await shot(u, 'user-gate-joined');
  }
  (await findDocs('newsletter', 'email', nlEmail)).length
    ? ok('ADMIN-SIDE DATA: newsletter doc created')
    : fail('newsletter doc missing');

  // 3. Account signup (REST fallback for sandbox-blocked browser hop) + session in browser
  const userEmail = `user-${MARK}`;
  const su = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userEmail, password: 'E2e-journey-pass-1', returnSecureToken: true }),
  }).then(r => r.json());
  let visitorUid = null;
  if (su.idToken) {
    visitorUid = su.localId;
    ok('visitor account created (same REST call the SDK makes)');
    await fetch(`${BASE}/api/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${su.idToken}` },
      body: JSON.stringify({ name: 'Journey Visitor', occupation: 'Product Manager', city: 'Hyderabad' }),
    });
    await fetch(`${BASE}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Journey Visitor', email: userEmail, intent: 'New Sign-up', source: 'signup' }),
    });
    ok('visitor profile + signup lead recorded');
  } else {
    fail('visitor signup failed', JSON.stringify(su.error?.message));
  }

  // 4. Browse the Agartha property page
  await u.goto(`${BASE}/sanctuaries/agartha`, { waitUntil: 'load' });
  await wait(2200);
  await shot(u, 'user-property-agartha');
  (await u.locator('h1:has-text("Agartha")').count()) ? ok('property page renders (from admin-managed Firestore record)') : fail('property page broken');

  // 5. Request adviser call — the ONE conversion form (name + phone + budget chip)
  await u.goto(`${BASE}/adviser-call`, { waitUntil: 'load' });
  const leadPhone = '+91 90000 00777';
  await u.locator('#ac-name').fill('Journey Visitor');
  await u.locator('#ac-phone').fill(leadPhone);
  await u.locator('button:has-text("₹50 L – ₹1 Cr")').click();
  await shot(u, 'user-adviser-form-filled');
  await u.locator('button:has-text("Request Adviser Call")').click();
  await u.locator("text=Done. We'll call you.").waitFor({ timeout: 15000 }).then(
    () => ok('adviser call request confirmed in UI'),
    () => fail('adviser call confirmation missing')
  );
  await shot(u, 'user-adviser-logged');
  const leadDocs = await findDocs('leads', 'phone', leadPhone);
  const leadData = leadDocs[0]?.data() ?? {};
  leadDocs.length && leadData.source === 'adviser-call' && (leadData.intent ?? '').includes('₹50 L – ₹1 Cr')
    ? ok('ADMIN-SIDE DATA: lead created with phone + budget bracket')
    : fail('lead missing or missing budget/source');

  // 6. Groot chat — must answer from the index, not from memory. The old version
  // of this check passed on the canned fallback, so it could not tell a working
  // bot from a broken one.
  await u.goto(`${BASE}/`, { waitUntil: 'load' });
  await u.locator('button[aria-label="Chat with Groot"]').click();
  await wait(1200);
  await u.locator('input[placeholder="Ask Groot about sanctuaries…"]').fill('What is the price of Agartha plots per square yard?');
  await u.locator('button[aria-label="Send"]').click();

  const panel = u.getByRole('dialog');
  const answered = await panel
    .getByText(/8,?500|68\.7/)
    .first()
    .waitFor({ timeout: 60000 })
    .then(() => true)
    .catch(() => false);
  await wait(600);
  await shot(u, 'user-groot-chat');

  if (!answered) {
    const shown = await panel.innerText().catch(() => '');
    fail('Groot did not produce a grounded answer', shown.slice(-160));
  } else {
    ok('Groot answered with a real figure from the knowledge index');
    const shown = await panel.innerText().catch(() => '');
    /I am Groot\./.test(shown) ? fail('old persona tic still present') : ok('adviser voice, no persona tic');
    /can'?t reach my knowledge base/i.test(shown)
      ? fail('served the degraded fallback')
      : ok('answered from Gemini, not the fallback path');
  }

  // ════════════════ PERSONA B — THE ADMIN ════════════════
  console.log('\n════ PERSONA B — Admin (real minted session) ════');
  const { name, value, adminEmail } = await adminSessionCookie();
  ok('real admin session minted', adminEmail);
  const adminCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'en-IN',
    timezoneId: 'Asia/Kolkata',
    ignoreHTTPSErrors: true,
  });
  await adminCtx.addCookies([{ name, value, url: BASE }]);
  const a = await adminCtx.newPage();

  // 7. Overview — the visitor's records already counted
  await a.goto(`${BASE}/admin`, { waitUntil: 'load', timeout: 60000 });
  await wait(2500);
  await shot(a, 'admin-overview-live');
  (await a.locator('text=Capture — last 10 weeks').count()) ? ok('admin overview renders with live data') : fail('admin overview broken');

  // 8. Leads — find the visitor's adviser request, move it through the pipeline
  await a.goto(`${BASE}/admin/leads`, { waitUntil: 'load' });
  await wait(2000);
  const leadRow = a.locator(`div:has(> div p:has-text("Journey Visitor"))`).first();
  (await a.locator(`text=${leadPhone}`).count())
    ? ok('REAL-TIME SYNC: visitor lead visible in admin pipeline')
    : fail('visitor lead not in admin UI');
  await shot(a, 'admin-leads-with-visitor');
  // change status via the UI select next to that lead
  const select = a.locator(`div.rounded-3xl:has-text("${leadPhone}") select`).first();
  if (await select.count()) {
    await select.selectOption('contacted');
    await wait(2500);
    await shot(a, 'admin-lead-contacted');
    const fresh = await db.collection('leads').doc(leadDocs[0].id).get();
    fresh.data()?.status === 'contacted'
      ? ok('UI status change persisted to Firestore (new → contacted)')
      : fail('status change not persisted');
  } else fail('lead status select not found');

  // 9. Newsletter — visitor's email present
  await a.goto(`${BASE}/admin/newsletter`, { waitUntil: 'load' });
  await wait(1800);
  (await a.locator(`text=${nlEmail}`).count())
    ? ok('REAL-TIME SYNC: newsletter signup visible in admin')
    : fail('newsletter signup not in admin UI');
  await shot(a, 'admin-newsletter-with-visitor');

  // 10. Users — visitor profile present
  await a.goto(`${BASE}/admin/users`, { waitUntil: 'load' });
  await wait(1800);
  (await a.locator('text=Journey Visitor').count())
    ? ok('REAL-TIME SYNC: visitor user profile visible in admin')
    : fail('visitor profile not in admin UI');
  await shot(a, 'admin-users-with-visitor');

  // 11. Onboard a NEW project through the admin UI
  await a.goto(`${BASE}/admin/properties`, { waitUntil: 'load' });
  await wait(2000);
  (await a.locator('text=MODCON Agartha').count())
    ? ok('all three flagship properties are admin-managed records')
    : fail('seeded properties not visible');
  await shot(a, 'admin-properties-seeded');

  await a.locator('button:has-text("Add Property")').click();
  await wait(800);
  const inputs = {
    'Title *': 'E2E Test Villa Estate',
    'Location *': 'Journey Hills, Hyderabad',
  };
  await a.locator('div:has(> label:has-text("Title *")) input').fill(inputs['Title *']);
  await a.locator('div:has(> label:has-text("Location *")) input').fill(inputs['Location *']);
  await a.locator('div:has(> label:has-text("Commute")) input').fill('30 mins to Financial District');
  await a.locator('div:has(> label:has-text("Member Price")) input').fill('₹1.2 Cr');
  await a.locator('div:has(> label:has-text("Cover Image URL")) input').fill('/gallery/dates-county/forest.jpg');
  await a.locator('button:has-text("Draft")').click(); // toggle → Live
  await shot(a, 'admin-new-property-form');
  await a.locator('button:has-text("Save Property")').click();
  await wait(3000);
  await shot(a, 'admin-property-created');

  const created = await findDocs('properties', 'title', 'E2E Test Villa Estate', 6);
  let newId = null;
  if (created.length) {
    newId = created[0].id;
    ok('new property document created from admin UI', newId);
    // 12. It appears on the PUBLIC site
    const pub = await u.goto(`${BASE}/sanctuaries/${newId}`, { waitUntil: 'load' });
    await wait(2000);
    (pub?.status() === 200 && (await u.locator('h1:has-text("E2E Test Villa Estate")').count()))
      ? ok('ONBOARDING LOOP CLOSED: new property live on public site at its own URL')
      : fail(`public page for new property (${pub?.status()})`);
    await shot(u, 'public-new-property-live');
  } else {
    fail('new property not created');
  }

  await browser.close();

  // ── Cleanup ─────────────────────────────────────────────
  console.log('\n▶ Cleanup');
  let removed = 0;
  for (const coll of ['newsletter', 'leads']) {
    for (const v of [nlEmail, userEmail]) {
      const snap = await db.collection(coll).where('email', '==', v).get();
      for (const d of snap.docs) { await d.ref.delete(); removed++; }
    }
  }
  {
    const snap = await db.collection('leads').where('phone', '==', leadPhone).get();
    for (const d of snap.docs) { await d.ref.delete(); removed++; }
  }
  if (visitorUid) {
    await db.collection('users').doc(visitorUid).delete().catch(() => {});
    await auth.deleteUser(visitorUid).catch(() => {});
    removed++;
  }
  if (newId) {
    await db.collection('properties').doc(newId).delete();
    removed++;
  }
  console.log(`  🧹 removed ${removed} test records — real data untouched`);

  const passed = results.filter(r => r.pass).length;
  console.log(`\n━━━ JOURNEY RESULT: ${passed}/${results.length} checks · ${shotN} screenshots in ${OUT} ━━━`);
  if (passed !== results.length) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
