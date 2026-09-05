/**
 * Page-weight and Core Web Vitals check against a running site.
 *
 *   npm run build && npm start           # or point at production
 *   node scripts/speed-test.mjs
 *   node scripts/speed-test.mjs https://thegreenteam.in
 *
 * Uses the Chromium that Playwright already ships rather than adding a
 * Lighthouse dependency: it measures the two things that actually regressed
 * here — transferred bytes, and LCP — on a throttled connection resembling
 * the mobile networks most of this site's traffic arrives on.
 *
 * Exits non-zero when a budget is breached, so it can gate a deploy.
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:3000';
const ROUTES = ['/', '/list', '/adviser-call', '/sanctuaries/agartha', '/blog'];

// Budgets, not aspirations: 2.5s is Google's "good" LCP threshold, and 2.5 MB
// of images on a single route is what this site shipped before compression.
const BUDGET = { totalKB: 2500, imageKB: 1800, lcpMs: 2500 };

// Roughly a good 4G connection — the realistic case, not cable.
const NET = { downloadThroughput: (4 * 1024 * 1024) / 8, uploadThroughput: (1024 * 1024) / 8, latency: 80 };

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
});
const rows = [];
let failed = false;

for (const route of ROUTES) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await ctx.newPage();

  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, ...NET });

  let total = 0;
  let images = 0;
  page.on('response', async res => {
    try {
      const len = Number(res.headers()['content-length'] ?? 0);
      const type = res.request().resourceType();
      total += len;
      if (type === 'image') images += len;
    } catch {
      /* a response that vanished mid-flight is not worth failing the run over */
    }
  });

  const t0 = Date.now();
  await page.goto(BASE + route, { waitUntil: 'load', timeout: 60_000 });
  const loadMs = Date.now() - t0;

  // LCP settles after load; give the observer a moment before reading it.
  const lcp = await page.evaluate(
    () =>
      new Promise(resolve => {
        let last = 0;
        new PerformanceObserver(list => {
          for (const e of list.getEntries()) last = e.startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        setTimeout(() => resolve(Math.round(last)), 1200);
      })
  );

  const totalKB = Math.round(total / 1024);
  const imageKB = Math.round(images / 1024);
  const bad = totalKB > BUDGET.totalKB || imageKB > BUDGET.imageKB || lcp > BUDGET.lcpMs;
  if (bad) failed = true;

  rows.push({ route, totalKB, imageKB, lcp, loadMs, bad });
  await ctx.close();
}

await browser.close();

console.log(`\n${BASE}   (mobile viewport, ~4G throttling)\n`);
console.log('  route                     total     images      LCP     load');
for (const r of rows) {
  console.log(
    `  ${r.bad ? '✗' : '✓'} ${r.route.padEnd(24)}${String(r.totalKB + 'KB').padStart(7)}${String(r.imageKB + 'KB').padStart(11)}${String(r.lcp + 'ms').padStart(9)}${String(r.loadMs + 'ms').padStart(9)}`
  );
}
console.log(
  `\nbudget: total ≤ ${BUDGET.totalKB}KB · images ≤ ${BUDGET.imageKB}KB · LCP ≤ ${BUDGET.lcpMs}ms`
);
console.log(failed ? '\nFAIL — a route is over budget.\n' : '\nAll routes within budget.\n');
process.exit(failed ? 1 : 0);
