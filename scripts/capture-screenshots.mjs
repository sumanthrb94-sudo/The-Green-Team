/**
 * Documentation screenshot runner for v2 (Next.js).
 *
 *   DEMO_ADMIN=1 DEMO_DATA=1 npm run dev     # terminal 1 (dev-only demo flags)
 *   npm run screenshots                       # terminal 2 → docs/screenshots/
 *
 * DEMO_ADMIN / DEMO_DATA only work under `next dev` and swap the admin session
 * and admin datasets for fictional records, so no real client data ever lands
 * in the repo. Public pages are the real application.
 *
 * Env: BASE_URL (default http://localhost:3000), CHROMIUM_PATH.
 */
import { chromium } from 'playwright';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import path from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const OUT = path.resolve(process.cwd(), 'docs/screenshots');
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

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

/* Neutral basemap tile for sandboxes that block the tile CDN. */
function placeholderTile() {
  const S = 256, rows = [];
  for (let y = 0; y < S; y++) {
    const row = Buffer.alloc(S * 3 + 1);
    for (let x = 0; x < S; x++) {
      const grid = x % 64 === 0 || y % 64 === 0;
      const [r, g, b] = grid ? [50, 62, 46] : [32, 42, 30];
      row[1 + x * 3] = r; row[2 + x * 3] = g; row[3 + x * 3] = b;
    }
    rows.push(row);
  }
  const crcT = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = b => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(d.length);
    const body = Buffer.concat([Buffer.from(t), d]);
    const cb = Buffer.alloc(4); cb.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, cb]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(S, 0); ihdr.writeUInt32BE(S, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(Buffer.concat(rows), { level: 9 })), chunk('IEND', Buffer.alloc(0)),
  ]);
}
const TILE = placeholderTile();

let step = 0;
const shots = [];
const warnings = [];

async function shot(page, name, caption, { expect, fullPage = false } = {}) {
  if (expect) {
    const ok = await page.locator(expect).first().waitFor({ state: 'visible', timeout: 9000 }).then(() => true).catch(() => false);
    if (!ok) warnings.push(`${name}: expected "${expect}" not visible`);
  }
  const file = `${String(++step).padStart(2, '0')}-${name}.jpg`;
  await page.screenshot({ path: path.join(OUT, file), type: 'jpeg', quality: 82, fullPage });
  shots.push({ file, caption });
  console.log(`  ✓ ${file}`);
}

async function waitImages(page, timeout = 10000) {
  await page
    .waitForFunction(
      () => [...document.images].filter(i => {
        const r = i.getBoundingClientRect();
        return r.top < innerHeight + 300 && r.width > 0;
      }).every(i => i.complete),
      null, { timeout }
    )
    .catch(() => warnings.push('waitImages timeout'));
  await page.waitForTimeout(500);
}

async function go(page, route, wait = 2200) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(wait);
  await waitImages(page);
}

async function scrollTo(page, y, wait = 1300) {
  await page.evaluate(t => window.scrollTo({ top: t, behavior: 'instant' }), y);
  await page.waitForTimeout(wait);
  await waitImages(page);
}

/** Scroll so the property tab bar sits at the top of the viewport. */
async function focusTabs(page) {
  await page.evaluate(() => {
    const el = document.querySelector('[role="tablist"]');
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 66, behavior: 'instant' });
  });
  await page.waitForTimeout(700);
  await waitImages(page);
}

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: chromiumPath() });

  const mk = async viewport => {
    const ctx = await browser.newContext({ viewport, isMobile: viewport === MOBILE, hasTouch: viewport === MOBILE, locale: 'en-IN', timezoneId: 'Asia/Kolkata' });
    await ctx.route(/mt\d?\.google\.com/, r => r.fulfill({ contentType: 'image/png', body: TILE }));
    const page = await ctx.newPage();
    page.on('pageerror', e => warnings.push(`pageerror: ${e.message.slice(0, 120)}`));
    return { ctx, page };
  };

  // ── Desktop: public pages ─────────────────────────────────────────────────
  {
    const { ctx, page } = await mk(DESKTOP);

    await go(page, '/');
    await shot(page, 'home-hero', 'Home — serif hero over the forest backdrop with the KPI strip (server-rendered, real per-route SEO).', { expect: 'h1' });
    await scrollTo(page, 900);
    await shot(page, 'home-what-we-do', 'How it works — find, verify, connect.');
    await scrollTo(page, 2600);
    await shot(page, 'home-sanctuaries', 'Curated portfolio cards — each links to a real /sanctuaries/[id] page (the dead “View Details” of v1 is gone).');
    await scrollTo(page, 4800);
    await shot(page, 'home-trust-journal', 'Trust signals (unmounted dead code in v1, now live) and the journal preview.');
    await scrollTo(page, 999999);
    await shot(page, 'home-footer', 'Newsletter capture and the footer agenda grid — the v1 dead “gallery” link is fixed.');

    await go(page, '/sanctuaries/agartha');
    await shot(page, 'agartha-header', 'MODCON Agartha property page — a real URL with its own metadata and Product JSON-LD.', { expect: 'h1:has-text("Agartha")' });
    await focusTabs(page);
    await shot(page, 'agartha-gallery', 'Gallery tab — all 23 photos served from the repo’s own compressed mirror (Wix CDN dependency removed).');
    await page.locator('button[role="tab"]:has-text("Layout Plan")').click();
    await page.waitForTimeout(1200);
    await focusTabs(page);
    await shot(page, 'agartha-layout', 'Interactive site plan — 36 plot dots on the official layout.');
    const dot = page.locator('button[aria-label^="Plot 3,"]');
    if (await dot.count()) { await dot.click(); await page.waitForTimeout(900); }
    await scrollTo(page, (await page.evaluate(() => window.scrollY)) + 620, 700);
    await shot(page, 'agartha-plot-snapshot', 'Tapping a plot shows its investment snapshot — pre-launch vs today’s rate and the 18-month gain.');
    await page.locator('button[role="tab"]:has-text("Invest")').click();
    await page.waitForTimeout(900);
    await focusTabs(page);
    await shot(page, 'agartha-invest', 'Invest tab — telemetry, the ₹8,500/sq yd price ladder, biomorphic add-on and WhatsApp CTAs.');

    await go(page, '/sanctuaries/syl');
    await page.locator('button[role="tab"]:has-text("Invest")').click();
    await page.waitForTimeout(900);
    await focusTabs(page);
    await shot(page, 'syl-invest', 'SYL Residences Invest tab — pre-investor banner and the ₹4,499/SFT villament ladder. The /syl URL 301s here.');

    await go(page, '/sanctuaries/dates-county');
    await page.locator('button[role="tab"]:has-text("Invest")').click();
    await page.waitForTimeout(900);
    await focusTabs(page);
    await shot(page, 'dates-county-invest', 'Dates County Invest tab — RERA banner and the ₹18,000/sq yd table with the ₹90 L signature plot.');

    await go(page, '/map', 5200);
    await shot(page, 'map', 'The environmental-intelligence map: AQI field, ORR/RRR, sanctuary markers. Basemap tiles are a placeholder grid — the tile CDN is blocked in this sandbox.', { expect: '.leaflet-container' });
    await page.locator('button:has-text("Forests & Lakes")').click();
    await page.waitForTimeout(1500);
    await shot(page, 'map-forests', 'The forests & lakes layer — 18 reserve-forest and protected-lake polygons that were dead code in v1, now behind a working filter pill.');
    const marker = page.locator('.leaflet-marker-icon').first();
    if (await marker.count()) { await marker.click({ force: true }); await page.waitForTimeout(1500); }
    await shot(page, 'map-popup', 'Sanctuary marker popup with a direct route into the property page.');

    await go(page, '/analytics');
    await shot(page, 'analytics', 'Edge + Nature — channel-partner positioning and the pre-investor explainer.');

    await go(page, '/preinvestor-gold');
    await shot(page, 'preinvestor-gold', 'Pre-Investor Gold — the SYL phase roadmap.');

    await go(page, '/membership');
    await shot(page, 'membership', 'Adviser membership application — phone number now actually persists with the lead (v1 dropped it).');

    await go(page, '/blog');
    await shot(page, 'blog-index', 'The Journal index — 10 articles, each a real page now.');

    await go(page, '/blog/aqi-as-an-investment-signal');
    await shot(page, 'blog-article', 'A journal article at its own URL with Article JSON-LD — v1 rendered posts only in a modal with no link, no SEO.');

    // Auth modal
    await go(page, '/');
    await page.locator('nav button[aria-label="Sign in"]').click();
    await page.waitForTimeout(1200);
    await shot(page, 'auth-modal', 'The rebuilt sign-in modal — Google, email/password, phone OTP against the same live Firebase project.', { expect: 'text=Continue with Google' });

    // Groot
    await page.locator('button[aria-label="Close"]').first().click();
    await page.waitForTimeout(800);
    await page.locator('button[aria-label="Chat with Groot"]').click();
    await page.waitForTimeout(1400);
    await shot(page, 'groot', 'Groot, the sanctuary AI advisor — replies now proxied through /api/chat so the knowledge base stays server-side.');

    await ctx.close();
  }

  // ── Desktop: admin (dev-only demo data — fictional records) ───────────────
  {
    const { ctx, page } = await mk(DESKTOP);
    await go(page, '/admin', 3200);
    await shot(page, 'admin-overview', 'Admin overview — live stat cards, 10-week capture chart and lead-source breakdown. All records shown are fictional demo data (DEMO_DATA dev flag).', { expect: 'text=Capture — last 10 weeks' });
    await go(page, '/admin/leads', 2600);
    await shot(page, 'admin-leads', 'Lead pipeline — status tracking (new → contacted → site visit → closed), filters and CSV export. Fictional demo records.');
    await go(page, '/admin/properties', 2600);
    await shot(page, 'admin-properties', 'Property manager — create, edit, publish/unpublish, delete. Live entries join the public portfolio.');
    await go(page, '/admin/newsletter', 2600);
    await shot(page, 'admin-newsletter', 'Newsletter subscribers with capture-source tags and CSV export. Fictional demo records.');
    await go(page, '/admin/users', 2600);
    await shot(page, 'admin-users', 'Registered users — profile, occupation/city, geolocation with a Maps deep link. Fictional demo records.');
    await ctx.close();
  }

  // ── Mobile ────────────────────────────────────────────────────────────────
  {
    const { ctx, page } = await mk(MOBILE);
    await go(page, '/');
    await shot(page, 'mobile-home', 'Mobile home — bottom tab bar and the responsive hero.');
    await go(page, '/sanctuaries/agartha');
    await shot(page, 'mobile-agartha', 'Mobile property page.');
    await go(page, '/blog');
    await shot(page, 'mobile-blog', 'Mobile journal index.');
    await ctx.close();
  }

  await browser.close();
  await writeFile(path.join(OUT, 'index.json'), JSON.stringify(shots, null, 2) + '\n');
  console.log(`\n${shots.length} screenshots → docs/screenshots/`);
  if (warnings.length) {
    console.log('Warnings:');
    for (const w of [...new Set(warnings)]) console.log('  ! ' + w);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
