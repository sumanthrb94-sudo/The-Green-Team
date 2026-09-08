/**
 * End-to-end check of the analytics pipeline, against a real browser and real
 * Firestore.
 *
 * The pipeline is unusually hard to eyeball: everything is fire-and-forget, the
 * most valuable record is sent while the page is being destroyed, and a silent
 * write failure looks exactly like "nobody clicked anything" — which is a bug
 * that has already happened once in this codebase. So this drives Chromium
 * through a real visit and then reads Firestore to check what actually landed.
 *
 * Usage:  npm start -- --port 3210
 *         BASE=http://localhost:3210 node --env-file=.env.local scripts/e2e-analytics.mjs
 *
 * Every record it writes is deleted at the end, pass or fail.
 */
import path from 'node:path';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const BASE = process.env.BASE ?? 'http://localhost:3000';

/** The sandbox ships a pinned Chromium; Playwright's own default path is absent. */
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

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}
const db = getFirestore();

let pass = 0;
let fail = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${name}${detail ? ` — ${detail}` : ''}`);
  ok ? pass++ : fail++;
};

const written = [];

async function run() {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36',
  });
  const page = await ctx.newPage();

  // Accept analytics first — everything below is consent-gated by design, and a
  // run that skipped this would pass by collecting nothing.
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  // The banner mounts after hydration, so wait for it rather than probing once
  // — an immediate isVisible() check races it and silently skips the click,
  // which makes every assertion below pass vacuously by collecting nothing.
  const accept = page.locator('button:has-text("Accept")').first();
  await accept.waitFor({ state: 'visible', timeout: 10_000 });
  await accept.click();
  await page.waitForTimeout(800);

  const ref = await page.evaluate(() => sessionStorage.getItem('gt_ref'));
  check('a session reference is minted after consent', /^GT-[0-9A-Z]{6}$/.test(ref ?? ''), ref ?? 'none');
  if (!ref) throw new Error('no reference — nothing downstream can be checked');

  // First touch banked.
  const first = await page.evaluate(() => localStorage.getItem('gt_first'));
  check('first-touch attribution is recorded', Boolean(first), first?.slice(0, 80) ?? 'none');

  // Read a property page, scroll it, so a pageview with real engagement and
  // section dwell is produced.
  await page.goto(`${BASE}/sanctuaries/agartha`, { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel(0, 700);
    await page.waitForTimeout(400);
  }

  // The WhatsApp link must carry the reference by the time it is followed.
  const waHref = await page.evaluate(() => {
    const a = document.querySelector('a[href*="wa.me"]');
    if (!a) return null;
    // Same capture-phase path a real tap takes, without leaving the site.
    a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    return a.getAttribute('href');
  });
  check('a WhatsApp link exists on the property page', Boolean(waHref));
  // Decoded the way WhatsApp reads it — as a URI component, where '%20' is a
  // space and a literal '+' is a plus sign. An assertion that tolerated '+'
  // would have passed the encoding bug this caught.
  const waText = waHref ? decodeURIComponent(new URL(waHref).searchParams.get('text') ?? '') : '';
  check(
    'the WhatsApp message carries the reference',
    waText.includes(`Ref: ${ref}`),
    waText.slice(-40).replace(/\n/g, '⏎')
  );
  check(
    'the rest of the message is not re-encoded',
    !waText.includes('+') && waText.includes(' '),
    waText.slice(0, 50)
  );

  // Leave, so pagehide flushes the pageview and the section dwell.
  await page.goto(`${BASE}/contact`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await browser.close();

  // Give the beacons a moment to land in Firestore.
  await new Promise(r => setTimeout(r, 2500));

  const snap = await db.collection('analytics_events').where('ref', '==', ref).limit(100).get();
  snap.docs.forEach(d => written.push(d.ref));
  const rows = snap.docs.map(d => d.data());
  check('events reached Firestore stamped with the reference', rows.length > 0, `${rows.length} rows`);

  const names = new Set(rows.map(r => (r.type === 'pageview' ? 'pageview' : r.name)));
  check('the pageview was recorded', names.has('pageview'), [...names].join(', '));
  check('the WhatsApp tap was recorded', names.has('whatsapp_click'));
  check('section dwell was recorded', names.has('section_dwell'));

  const wa = rows.find(r => r.name === 'whatsapp_click');
  check('the tap row carries the reference in meta too', wa?.meta?.ref === ref, wa?.meta?.ref ?? 'none');

  const pv = rows.find(r => r.type === 'pageview' && r.path === '/sanctuaries/agartha');
  check('engaged time was measured', (pv?.engagedMs ?? 0) > 0, `${pv?.engagedMs ?? 0}ms`);
  check('scroll depth was measured', (pv?.scrollPct ?? 0) > 0, `${pv?.scrollPct ?? 0}%`);
  check('the device was classified as mobile', pv?.device === 'mobile', pv?.device);
  check('the visit was not flagged as a bot', pv?.bot === false);

  const dwell = rows.filter(r => r.name === 'section_dwell');
  check(
    'dwell rows name a section and a duration',
    dwell.length > 0 && dwell.every(d => d.meta?.s && Number(d.meta?.ms) > 0),
    dwell.map(d => `${d.meta?.s}:${Math.round(Number(d.meta?.ms) / 1000)}s`).join(' ')
  );
}

try {
  await run();
} catch (err) {
  console.error('\n  suite aborted:', err.message);
  fail++;
} finally {
  // Always clean up: these are synthetic rows and they would otherwise sit in
  // the real dashboard as a visitor who never existed.
  for (const ref of written) await ref.delete().catch(() => {});
  console.log(`\n  cleaned up ${written.length} test records`);
  console.log(`\n  ${pass} passed, ${fail} failed\n`);
  process.exit(fail ? 1 : 0);
}
