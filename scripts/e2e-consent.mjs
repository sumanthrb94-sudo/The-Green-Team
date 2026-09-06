/**
 * Proves the consent gate is real, not decorative.
 *
 *   NEXT_PUBLIC_GA_ID=G-XXXX npm run build      # at BUILD time, not run time:
 *   NEXT_PUBLIC_GA_ID=G-XXXX npm start           # Next inlines NEXT_PUBLIC_* into
 *   node --env-file=.env.local scripts/e2e-consent.mjs   # the bundle when it builds
 *
 * The claim under test is the one the Privacy and Cookie policies make: nothing
 * is measured until the visitor says yes. A banner that appears while the tags
 * have already loaded is worse than no banner — it documents the breach. So
 * this watches the actual network, not the UI, and it runs with a Google
 * Analytics id configured, because with no id the gate would pass vacuously —
 * check 3 exists precisely to catch that, and it fails loudly if the id was not
 * compiled in.
 *
 * Every check is on the wire: no request to a Google analytics host, and no
 * beacon to our own /api/track, may leave the page before consent is given.
 */
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const results = [];
const ok = (n, d = '') => { results.push(true); console.log(`  ✅ ${n}${d ? ' — ' + d : ''}`); };
const bad = (n, d = '') => { results.push(false); console.log(`  ❌ ${n}${d ? ' — ' + d : ''}`); };

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

const isTracker = url =>
  /googletagmanager\.com|google-analytics\.com|analytics\.google\.com|clarity\.ms/.test(url);
const isOurBeacon = url => url.includes('/api/track');

/** Open a page that records every tracking request it tries to make. */
async function watched(ctx) {
  const page = await ctx.newPage();
  const seen = { trackers: [], beacons: [] };
  page.on('request', r => {
    const u = r.url();
    if (isTracker(u)) seen.trackers.push(u);
    if (isOurBeacon(u)) seen.beacons.push(u);
  });
  return { page, seen };
}

async function main() {
  console.log(`\nConsent gate · ${BASE}\n`);
  const browser = await chromium.launch({ executablePath: chromiumPath() });

  // ── 1. A first-time visitor, who has answered nothing ─────────────────────
  console.log('▶ 1. Before any answer');
  let ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('gt_splash_seen', '1'); } catch {} });
  let { page, seen } = await watched(ctx);
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await page.waitForTimeout(3500);
  // Navigate too — a beacon is sent on pagehide, which is the likeliest leak.
  await page.goto(`${BASE}/list`, { waitUntil: 'load' });
  await page.waitForTimeout(2500);

  seen.trackers.length === 0
    ? ok('no third-party analytics request is made')
    : bad('a tracker loaded before consent', seen.trackers[0].slice(0, 90));
  seen.beacons.length === 0
    ? ok('our own beacon stays silent too')
    : bad('the first-party beacon fired before consent', `${seen.beacons.length} sent`);

  const bannerVisible = await page.locator('text=We would like to count visits').isVisible().catch(() => false);
  bannerVisible ? ok('the banner is asking') : bad('no consent banner shown');

  const refuseCount = await page.locator('button:has-text("No thanks")').count();
  const acceptCount = await page.locator('button:has-text("Accept")').count();
  refuseCount === 1 && acceptCount === 1
    ? ok('refusing is one click, exactly like accepting')
    : bad('the two answers are not equally available', `refuse=${refuseCount} accept=${acceptCount}`);

  // ── 2. Refusing must keep it silent, and must persist ─────────────────────
  console.log('\n▶ 2. After refusing');
  await page.locator('button:has-text("No thanks")').click();
  await page.waitForTimeout(600);
  seen.trackers.length = 0; seen.beacons.length = 0;
  await page.goto(`${BASE}/standard`, { waitUntil: 'load' });
  await page.waitForTimeout(3000);
  seen.trackers.length === 0 && seen.beacons.length === 0
    ? ok('still nothing measured')
    : bad('something fired after a refusal', `${seen.trackers.length} trackers, ${seen.beacons.length} beacons`);

  const stillAsking = await page.locator('text=We would like to count visits').isVisible().catch(() => false);
  !stillAsking ? ok('and the banner stops asking') : bad('the banner reappeared after an answer');
  await ctx.close();

  // ── 3. Accepting must actually turn it on ─────────────────────────────────
  console.log('\n▶ 3. After accepting');
  ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('gt_splash_seen', '1'); } catch {} });
  ({ page, seen } = await watched(ctx));
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  await page.locator('button:has-text("Accept")').click();
  await page.waitForTimeout(1200);
  await page.goto(`${BASE}/list`, { waitUntil: 'load' });
  await page.waitForTimeout(3000);
  seen.trackers.length > 0
    ? ok('analytics loads once accepted', `${seen.trackers.length} requests`)
    : bad(
        'accepting changed nothing',
        'either the gate is stuck shut, or NEXT_PUBLIC_GA_ID was not set when the app was BUILT'
      );

  // ── 4. The policy page can take the answer back ───────────────────────────
  console.log('\n▶ 4. Withdrawing from the cookie policy');
  await page.goto(`${BASE}/cookies`, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const shows = await page.locator('text=Analytics is on').isVisible().catch(() => false);
  shows ? ok('the policy shows the current answer') : bad('the policy does not reflect the choice');

  await page.locator('button:has-text("Refuse and delete")').click();
  await page.waitForTimeout(900);
  const cookies = await ctx.cookies();
  const gaLeft = cookies.filter(c => /^_ga|^_clck|^_clsk/.test(c.name));
  gaLeft.length === 0
    ? ok('refusing deletes the analytics cookies already set')
    : bad('analytics cookies survived a refusal', gaLeft.map(c => c.name).join(', '));

  seen.trackers.length = 0;
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await page.waitForTimeout(3000);
  seen.trackers.length === 0
    ? ok('and nothing loads on the next page')
    : bad('a tracker returned after withdrawal', seen.trackers[0].slice(0, 90));

  // ── 5. The documents exist and say who is responsible ─────────────────────
  console.log('\n▶ 5. The documents');
  for (const [route, needle] of [
    ['/privacy', 'Data Fiduciary'],
    ['/terms', 'RERA agent registration'],
    ['/cookies', 'Strictly necessary'],
  ]) {
    const r = await fetch(`${BASE}${route}`);
    const html = await r.text();
    r.ok && html.includes(needle)
      ? ok(`${route} is served and complete`, `${Math.round(html.length / 1024)} KB`)
      : bad(`${route} missing or incomplete`, `HTTP ${r.status}`);
  }

  await browser.close();
  const passed = results.filter(Boolean).length;
  console.log(`\n━━━ CONSENT GATE: ${passed}/${results.length} checks passed ━━━\n`);
  process.exit(passed === results.length ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });
