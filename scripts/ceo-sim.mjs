/**
 * Entry-to-exit simulation of the whole product, as three people.
 *
 *   npm run build && npm start                    # terminal 1
 *   node --env-file=.env.local scripts/ceo-sim.mjs
 *
 * Pass A  a stranger with a phone, who has never heard of us
 * Pass B  a member who signed in
 * Pass C  an administrator running the business
 * Pass D  what the business actually holds right now
 *
 * It is not a pass/fail suite — those are e2e-smoke and e2e-welcome. This walks
 * every route the way a person would, and writes down what it finds: dead links,
 * console errors, pages that scroll sideways on a phone, missing metadata, slow
 * responses, and anything that is wired but not switched on. Every record it
 * creates is deleted before it exits.
 *
 * To reach the admin pages it needs an account whose address is in ADMIN_EMAILS,
 * so start the server with SIM_ADMIN_EMAIL added to that list. Without it the
 * admin pass is skipped and says so rather than quietly reporting nothing.
 */
import { chromium } from 'playwright';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const OUT = process.env.SIM_OUT ?? '.';
const ADMIN_EMAIL = process.env.SIM_ADMIN_EMAIL ?? 'ceo-sim-admin@greenteam-sim.invalid';
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const RUN = `sim${Date.now().toString(36)}`;

const findings = [];
const note = (area, severity, title, detail = '') => {
  findings.push({ area, severity, title, detail });
  const icon = { blocker: '🛑', major: '⚠️ ', minor: '·', ok: '✅', info: 'ℹ️ ' }[severity] ?? '·';
  console.log(`  ${icon} [${area}] ${title}${detail ? ' — ' + detail : ''}`);
};

function chromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!root) return undefined;
  for (const build of ['chromium-1194', 'chromium']) {
    const p = path.join(root, build, 'chrome-linux', 'chrome');
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

/** Real ID token, minted the same way the browser SDK gets one. */
async function idTokenFor(uid) {
  const customToken = await auth.createCustomToken(uid);
  const r = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: customToken, returnSecureToken: true }) }
  );
  const d = await r.json();
  if (!d.idToken) throw new Error(`token exchange failed: ${JSON.stringify(d).slice(0, 160)}`);
  return d.idToken;
}

/** Public routes a stranger can reach, in the order they would meet them. */
const PUBLIC_ROUTES = [
  '/', '/list', '/explore/villas', '/explore/plots', '/explore/investments',
  '/sanctuaries/agartha', '/sanctuaries/syl', '/sanctuaries/dates-county',
  '/map', '/standard', '/blog', '/reviews', '/contact', '/adviser-call',
  '/membership', '/preinvestor-gold', '/syl', '/account',
];

const ADMIN_ROUTES = ['/admin', '/admin/leads', '/admin/properties', '/admin/users', '/admin/newsletter', '/admin/reviews', '/admin/chats', '/admin/analytics'];

/** Walk one route and report everything visibly wrong with it. */
async function inspect(page, route, { mobile }) {
  const errors = [];
  const onErr = m => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); };
  // Two request failures are the harness, not the product, and drown out real
  // ones if kept: the analytics beacon is sent via sendBeacon on pagehide, so
  // tearing the page down cancels it; and `?_rsc=` is Next prefetching a route
  // we navigate away from. Neither is visible to, or affects, a real visitor.
  const harnessNoise = u => /\/api\/track|[?&]_rsc=/.test(u);
  const onFail = r => { if (!harnessNoise(r.url())) errors.push(`REQUEST FAILED ${r.url().slice(0, 90)}`); };
  page.on('console', onErr);
  page.on('requestfailed', onFail);

  const t0 = Date.now();
  let status = 0;
  try {
    const res = await page.goto(`${BASE}${route}`, { waitUntil: 'load', timeout: 45000 });
    status = res?.status() ?? 0;
  } catch (e) {
    page.off('console', onErr); page.off('requestfailed', onFail);
    return { route, mobile, status: 0, ms: Date.now() - t0, fatal: String(e).slice(0, 120) };
  }
  const ms = Date.now() - t0;
  await page.waitForTimeout(mobile ? 2200 : 1600);

  const info = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('img')];
    return {
      title: document.title,
      desc: document.querySelector('meta[name="description"]')?.content ?? '',
      canonical: document.querySelector('link[rel="canonical"]')?.href ?? '',
      h1: [...document.querySelectorAll('h1')].map(h => h.textContent.trim().slice(0, 60)),
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      imgNoAlt: imgs.filter(i => !i.getAttribute('alt') && i.getAttribute('alt') !== '').length,
      imgTotal: imgs.length,
      jsonld: document.querySelectorAll('script[type="application/ld+json"]').length,
      links: [...document.querySelectorAll('a[href^="/"]')].map(a => a.getAttribute('href')),
      textLen: document.body.innerText.length,
    };
  });

  page.off('console', onErr); page.off('requestfailed', onFail);
  return { route, mobile, status, ms, ...info, errors: [...new Set(errors)] };
}

async function main() {
  console.log(`\n════ ENTRY-TO-EXIT SIMULATION · ${BASE} ════\n`);
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const created = [];
  const report = { pages: [], api: [], data: {}, setup: [] };

  /* ─────────────── PASS A · a stranger, on a phone and a laptop ─────────── */
  console.log('▶ PASS A — a stranger who has never heard of us\n');
  for (const mobile of [true, false]) {
    const ctx = await browser.newContext(
      mobile
        ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
        : { viewport: { width: 1440, height: 900 } }
    );
    // The launch splash is once-per-session and would otherwise dominate every
    // screenshot; a returning visitor does not see it either.
    await ctx.addInitScript(() => { try { sessionStorage.setItem('gt_splash_seen', '1'); } catch {} });
    const page = await ctx.newPage();
    for (const route of PUBLIC_ROUTES) {
      const r = await inspect(page, route, { mobile });
      report.pages.push(r);
      const tag = mobile ? 'mobile' : 'desktop';
      if (r.fatal) note('pages', 'blocker', `${route} did not load (${tag})`, r.fatal);
      else if (r.status >= 400) note('pages', 'blocker', `${route} → HTTP ${r.status} (${tag})`);
      else {
        if (r.overflow > 1) note('layout', 'major', `${route} scrolls sideways on ${tag}`, `${r.overflow}px past the viewport`);
        if (r.errors.length) note('console', 'major', `${route} logs errors (${tag})`, r.errors[0]);
        if (!mobile) {
          if (!r.h1.length) note('seo', 'major', `${route} has no <h1>`);
          else if (r.h1.length > 1) note('seo', 'minor', `${route} has ${r.h1.length} <h1> elements`);
          if (!r.desc) note('seo', 'major', `${route} has no meta description`);
          if (r.imgNoAlt) note('a11y', 'minor', `${route}: ${r.imgNoAlt}/${r.imgTotal} images have no alt`);
          if (r.ms > 3000) note('speed', 'major', `${route} took ${r.ms}ms to load`);
        }
      }
    }
    await ctx.close();
  }

  // Every internal link on every page, actually followed.
  const linked = [...new Set(report.pages.flatMap(p => p.links ?? []))]
    .map(h => h.split('#')[0])
    .filter(h => h && h.startsWith('/') && !h.startsWith('//'));
  console.log(`\n  checking ${linked.length} distinct internal links…`);
  let dead = 0;
  for (const href of linked) {
    const res = await fetch(`${BASE}${href}`, { redirect: 'manual' }).catch(() => null);
    if (!res) { note('links', 'major', `${href} — request failed`); dead++; continue; }
    if (res.status >= 400) { note('links', 'blocker', `${href} → HTTP ${res.status}`); dead++; }
  }
  if (!dead) note('links', 'ok', `all ${linked.length} internal links resolve`);

  // The things a search engine and a crawler ask for first.
  for (const [file, label] of [['/robots.txt', 'robots.txt'], ['/sitemap.xml', 'sitemap.xml']]) {
    const r = await fetch(`${BASE}${file}`).catch(() => null);
    const body = r && r.ok ? await r.text() : '';
    r?.ok && body.length > 20
      ? note('seo', 'ok', `${label} served`, `${body.length} bytes`)
      : note('seo', 'major', `${label} missing or empty`);
  }

  /* ─────────────── PASS B · a member ────────────────────────────────────── */
  console.log('\n▶ PASS B — a member who signed in\n');
  const memberEmail = `${RUN}-member@greenteam-sim.invalid`;
  const member = await auth.createUser({ uid: `${RUN}-m`, email: memberEmail, displayName: 'Sim Member' });
  created.push(member.uid);
  const memberToken = await idTokenFor(member.uid);

  const api = async (label, path, init = {}) => {
    const t0 = Date.now();
    const res = await fetch(`${BASE}${path}`, { ...init, headers: { Origin: BASE, ...(init.headers ?? {}) } }).catch(e => ({ ok: false, status: 0, err: String(e) }));
    const ms = Date.now() - t0;
    let body = null;
    try { body = await res.json?.(); } catch {}
    report.api.push({ label, path, status: res.status, ms });
    return { res, body, ms };
  };

  const prof = await api('profile create', '/api/profile', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${memberToken}` }, body: JSON.stringify({ name: 'Sim Member', city: 'Hyderabad' }),
  });
  prof.res.ok ? note('member', 'ok', 'sign-up creates a profile', `isNew=${prof.body?.isNew}`) : note('member', 'blocker', 'profile create failed', `HTTP ${prof.res.status}`);

  const read = await api('profile read', '/api/profile', { headers: { Authorization: `Bearer ${memberToken}` } });
  read.body?.name === 'Sim Member' ? note('member', 'ok', 'the profile reads back') : note('member', 'major', 'profile did not read back');

  // Unit pricing is the reason to have an account at all: it must be shut to a
  // stranger and open to a member, or the membership means nothing.
  const memberSess = await fetch(`${BASE}/api/session`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: BASE }, body: JSON.stringify({ idToken: memberToken }),
  });
  const memberCookie = (memberSess.headers.get('set-cookie') ?? '').split(';')[0];
  const anonPrice = await api('pricing anon', '/api/pricing/agartha');
  const memberPrice = await api('pricing member', '/api/pricing/agartha', { headers: { Cookie: memberCookie } });
  anonPrice.res.status === 401 || anonPrice.res.status === 403
    ? note('member', 'ok', 'unit pricing is closed to a stranger', `HTTP ${anonPrice.res.status}`)
    : note('member', 'blocker', 'unit pricing is readable without an account', `HTTP ${anonPrice.res.status}`);
  memberPrice.res.ok ? note('member', 'ok', 'unit pricing opens for a member') : note('member', 'major', 'a member cannot read unit pricing', `HTTP ${memberPrice.res.status}`);

  const sub = await api('briefing on', '/api/newsletter', { method: 'POST', headers: { Authorization: `Bearer ${memberToken}` } });
  sub.res.ok ? note('member', 'ok', 'the briefing can be switched on') : note('member', 'major', 'briefing subscribe failed', `HTTP ${sub.res.status}`);
  const unsub = await api('briefing off', '/api/newsletter', { method: 'DELETE', headers: { Authorization: `Bearer ${memberToken}` } });
  unsub.res.ok ? note('member', 'ok', 'and switched off again') : note('member', 'major', 'briefing unsubscribe failed', `HTTP ${unsub.res.status}`);

  // An enquiry — the thing the whole site exists to produce.
  const lead = await api('enquiry', '/api/leads', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Sim Buyer', phone: '+91 90000 09999', email: memberEmail, intent: 'Sim enquiry', source: 'adviser-call' }),
  });
  lead.res.ok ? note('member', 'ok', 'an enquiry is accepted', `${lead.ms}ms`) : note('member', 'blocker', 'the enquiry form is broken', `HTTP ${lead.res.status}`);

  // Groot: the second conversion path.
  const chat = await fetch(`${BASE}/api/chat`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: BASE },
    body: JSON.stringify({ messages: [{ role: 'user', text: 'What does Agartha cost?' }] }),
  }).catch(() => null);
  if (!chat) note('groot', 'blocker', 'the chatbot did not respond at all');
  else if (!chat.ok) note('groot', 'major', `the chatbot returned HTTP ${chat.status}`);
  else {
    const text = await chat.text();
    const grounded = /\d/.test(text) && !/recharging/i.test(text);
    grounded ? note('groot', 'ok', 'the chatbot answers with real figures', `${text.length} bytes streamed`)
             : note('groot', 'major', 'the chatbot answered without any figure', text.slice(0, 120));
  }

  /* ─────────────── PASS C · the administrator ───────────────────────────── */
  console.log('\n▶ PASS C — the administrator\n');
  const adminUser = await auth.createUser({ uid: `${RUN}-a`, email: ADMIN_EMAIL, displayName: 'Sim Admin' }).catch(async () => auth.getUserByEmail(ADMIN_EMAIL));
  if (adminUser.uid.startsWith(RUN)) created.push(adminUser.uid);
  const adminToken = await idTokenFor(adminUser.uid);
  const sess = await fetch(`${BASE}/api/session`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: BASE }, body: JSON.stringify({ idToken: adminToken }),
  });
  const sessBody = await sess.json().catch(() => ({}));
  const cookie = (sess.headers.get('set-cookie') ?? '').split(';')[0];

  if (!sessBody.isAdmin) {
    note('admin', 'info', 'admin pass skipped', `${ADMIN_EMAIL} is not in ADMIN_EMAILS on this server`);
  } else {
    note('admin', 'ok', 'the admin session is granted');
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addCookies([{ name: cookie.split('=')[0], value: cookie.split('=').slice(1).join('='), url: BASE }]);
    await ctx.addInitScript(() => { try { sessionStorage.setItem('gt_splash_seen', '1'); } catch {} });
    const page = await ctx.newPage();
    for (const route of ADMIN_ROUTES) {
      const r = await inspect(page, route, { mobile: false });
      report.pages.push(r);
      if (r.fatal || r.status >= 400) note('admin', 'blocker', `${route} did not load`, r.fatal ?? `HTTP ${r.status}`);
      else {
        if (r.errors.length) note('admin', 'major', `${route} logs errors`, r.errors[0]);
        if (r.textLen < 400) note('admin', 'info', `${route} is an empty state`, `${r.textLen} chars — the collection behind it has no rows yet`);
        if (r.ms > 3000) note('admin', 'major', `${route} took ${r.ms}ms`);
      }
    }
    // The export is how the business gets its own data out.
    const exp = await fetch(`${BASE}/api/admin/export?collection=leads`, { headers: { Cookie: cookie, Origin: BASE } });
    exp.ok ? note('admin', 'ok', 'the leads export works', `${(await exp.text()).length} bytes`) : note('admin', 'major', `leads export → HTTP ${exp.status}`);
    await ctx.close();
  }

  /* ─────────────── PASS D · what the business actually holds ────────────── */
  console.log('\n▶ PASS D — the state of the business\n');
  for (const coll of ['properties', 'leads', 'users', 'newsletter', 'reviews', 'conversations', 'kb_chunks']) {
    const c = await db.collection(coll).count().get().then(s => s.data().count).catch(() => -1);
    report.data[coll] = c;
    note('data', c > 0 ? 'info' : 'major', `${coll}: ${c < 0 ? 'unreadable' : c}`);
  }

  /* ─────────────── PASS E · what is wired but not switched on ───────────── */
  console.log('\n▶ PASS E — configuration\n');
  const ENV = [
    ['RESEND_API_KEY', 'email delivery', 'blocker'],
    ['GEMINI_API_KEY', 'the chatbot', 'major'],
    ['RESEND_SEGMENT_NEWSLETTER', 'briefing audience', 'major'],
    ['RESEND_SEGMENT_MEMBERS', 'members audience', 'major'],
    ['ADMIN_EMAILS', 'admin access', 'blocker'],
    ['ANALYTICS_SALT', 'IP hashing in analytics', 'major'],
    ['NEXT_PUBLIC_GA_ID', 'Google Analytics', 'major'],
    ['NEXT_PUBLIC_CLARITY_ID', 'session recording', 'minor'],
    ['NEXT_PUBLIC_GSC_VERIFICATION', 'Search Console', 'major'],
  ];
  for (const [key, what, sev] of ENV) {
    process.env[key]
      ? note('setup', 'ok', `${key} is set`, what)
      : note('setup', sev, `${key} is NOT set`, `${what} is off`);
    report.setup.push({ key, what, set: Boolean(process.env[key]) });
  }

  /* ─────────────── clean up every trace ─────────────────────────────────── */
  console.log('\n▶ Cleanup\n');
  let removed = 0;
  for (const coll of ['leads', 'newsletter']) {
    const snap = await db.collection(coll).where('email', '==', memberEmail).get();
    for (const d of snap.docs) { await d.ref.delete(); removed++; }
  }
  for (const uid of created) {
    await db.collection('users').doc(uid).delete().catch(() => {});
    await auth.deleteUser(uid).catch(() => {});
  }
  note('cleanup', 'ok', `removed ${removed} records and ${created.length} test accounts`);

  await browser.close();

  const counts = findings.reduce((a, f) => ({ ...a, [f.severity]: (a[f.severity] ?? 0) + 1 }), {});
  console.log(`\n════ ${findings.length} observations — ${counts.blocker ?? 0} blockers, ${counts.major ?? 0} major, ${counts.minor ?? 0} minor, ${counts.ok ?? 0} healthy ════\n`);
  writeFileSync(path.join(OUT, 'ceo-sim-report.json'), JSON.stringify({ base: BASE, at: new Date().toISOString(), findings, report }, null, 2));
  console.log(`written: ${path.join(OUT, 'ceo-sim-report.json')}\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
