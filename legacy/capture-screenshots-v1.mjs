/**
 * Documentation screenshot runner.
 *
 *   npm run dev:demo          # terminal 1 — starts the demo build on :4173
 *   npm run screenshots       # terminal 2 — writes docs/screenshots/*.jpg
 *
 * The demo build (vite.demo.config.ts) aliases every `firebase/*` import to the
 * in-memory stand-ins in scripts/demo-firebase/, so the app boots already signed
 * in and every screenshot below is an authenticated session — admin wherever the
 * dashboard is involved, member elsewhere. Only the three auth-flow shots at the
 * end start signed out, because that is what they document.
 *
 * Env overrides:
 *   BASE_URL         default http://localhost:4173
 *   CHROMIUM_PATH    explicit Chromium binary (needed when the sandbox ships a
 *                    browser build that differs from the installed Playwright)
 */
import { chromium } from 'playwright';
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import path from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const OUT = path.resolve(process.cwd(), 'docs/screenshots');
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };
const QUALITY = 82;

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

/* ── Offline basemap tile ──────────────────────────────────────────────────
   Raster map tiles are not reachable from the documentation sandbox. Rather
   than shipping map screenshots with empty gaps, tile requests are served this
   neutral 256×256 grid so the Leaflet overlays the app actually renders — AQI
   field, RRR corridor ring, sanctuary markers — stay readable. Captions say so
   wherever it appears. */
function placeholderTile() {
  const S = 256;
  const rows = [];
  for (let y = 0; y < S; y++) {
    const row = Buffer.alloc(S * 3 + 1);
    for (let x = 0; x < S; x++) {
      const grid = x % 64 === 0 || y % 64 === 0;
      const [r, g, b] = grid ? [222, 226, 217] : [233, 236, 229];
      row[1 + x * 3] = r;
      row[2 + x * 3] = g;
      row[3 + x * 3] = b;
    }
    rows.push(row);
  }
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = buf => {
    let c = 0xffffffff;
    for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, crcBuf]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(S, 0);
  ihdr.writeUInt32BE(S, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.concat(rows), { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ── Remote gallery mirror ─────────────────────────────────────────────────
   The Agartha gallery is served from static.wixstatic.com in production, which
   the capture sandbox cannot reach. public/gallery/agartha/ holds compressed
   local copies of exactly those assets (see scripts/compress_gallery.py), so
   remote requests are answered from that mirror — same images, offline. */
const MIRROR_DIR = path.resolve(process.cwd(), 'public/gallery/agartha');
const MIRROR = existsSync(MIRROR_DIR) ? readdirSync(MIRROR_DIR) : [];

function mirrorFor(url) {
  const remote = decodeURIComponent(url.split('/').pop().split('?')[0]);
  const key = remote.split('~mv2')[0];
  return MIRROR.find(f => f.startsWith(key));
}

const TILE = placeholderTile();
const TILE_HOSTS = /(mt\d?\.google\.com|tile\.openstreetmap\.org|basemaps\.|server\.arcgisonline\.com)/;

let step = 0;
const shots = [];
const warnings = [];

async function shot(page, name, caption, { expect } = {}) {
  if (expect) {
    const ok = await page
      .locator(expect)
      .first()
      .waitFor({ state: 'visible', timeout: 8000 })
      .then(() => true)
      .catch(() => false);
    if (!ok) warnings.push(`${name}: expected "${expect}" not visible`);
  }
  const file = `${String(++step).padStart(2, '0')}-${name}.jpg`;
  await page.screenshot({ path: path.join(OUT, file), type: 'jpeg', quality: QUALITY });
  shots.push({ file, caption });
  console.log(`  ✓ ${file}`);
}

async function newSession(browser, { role, viewport = DESKTOP, dark = false }) {
  const isMobile = viewport === MOBILE;
  const ctx = await browser.newContext({
    viewport,
    isMobile,
    hasTouch: isMobile,
    locale: 'en-IN',
    timezoneId: 'Asia/Kolkata',
    permissions: ['geolocation'],
    geolocation: { latitude: 17.4401, longitude: 78.3489 }, // Gachibowli, Hyderabad
  });
  await ctx.addInitScript(
    ([r, d]) => {
      if (r) localStorage.setItem('gt_demo_auth', JSON.stringify({ role: r }));
      else localStorage.removeItem('gt_demo_auth');
      localStorage.setItem('gt_dark', String(d));
    },
    [role, dark]
  );
  await ctx.route(TILE_HOSTS, r => r.fulfill({ contentType: 'image/png', body: TILE }));
  await ctx.route(/static\.wixstatic\.com/, async r => {
    const file = mirrorFor(r.request().url());
    if (!file) return r.abort();
    return r.fulfill({ contentType: 'image/webp', body: await readFile(path.join(MIRROR_DIR, file)) });
  });
  const page = await ctx.newPage();
  page.on('pageerror', e => warnings.push(`page error: ${e.message}`));
  return { ctx, page };
}

/** The app scrolls an inner <main>, not the document, so fullPage is a no-op. */
async function scrollTo(page, y, wait = 1200) {
  await page.evaluate(top => {
    const main = document.querySelector('main');
    if (main) main.scrollTo({ top, behavior: 'instant' });
  }, y);
  await page.waitForTimeout(wait);
}

/** Wait for above-the-fold images to decode — gallery grids lazy-load on open. */
async function waitForImages(page, timeout = 8000) {
  await page
    .waitForFunction(
      () =>
        [...document.images]
          .filter(i => {
            const r = i.getBoundingClientRect();
            return r.top < window.innerHeight + 200 && r.width > 0;
          })
          .every(i => i.complete),
      null,
      { timeout }
    )
    .catch(() => warnings.push('waitForImages: timed out'));
  await page.waitForTimeout(600);
}

async function go(page, route, wait = 2500) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(wait);
}

async function click(page, selector, { wait = 1200, index = 0, last = false } = {}) {
  const all = page.locator(selector);
  const el = last ? all.last() : all.nth(index);
  if ((await el.count()) === 0) {
    warnings.push(`click: no match for ${selector}`);
    return false;
  }
  const ok = await el
    .click({ timeout: 10000 })
    .then(() => true)
    .catch(e => {
      warnings.push(`click failed on ${selector}: ${e.message.split('\n')[0]}`);
      return false;
    });
  await page.waitForTimeout(wait);
  return ok;
}

/** The account avatar is always the last control in the top bar. */
const ACCOUNT_BTN = 'nav button';
const ACCOUNT = { last: true };
const ADMIN_BTN = 'nav button:has-text("Admin")';

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({ executablePath: chromiumPath() });

  // ── Admin session: public surfaces + the full admin dashboard ─────────────
  {
    const { ctx, page } = await newSession(browser, { role: 'admin' });

    await go(page, '/');
    await shot(page, 'home-signed-in', 'Landing page inside an authenticated admin session — the navbar carries the ADMIN badge and the account avatar instead of a sign-in prompt.', { expect: ADMIN_BTN });

    await scrollTo(page, 1100);
    await shot(page, 'home-ecosystem-pillars', 'Home, scrolled: the ecosystem pillars section that frames the AQI / noise / commute thesis.');

    await scrollTo(page, 3200);
    await shot(page, 'home-curated-sanctuaries', 'Home, curated sanctuaries. A signed-in user counts as subscribed, so member pricing renders unblurred with no newsletter gate.');

    await scrollTo(page, 99999);
    await shot(page, 'home-footer', 'Home footer — sitemap-style route links, contact channels and the newsletter capture that writes into the newsletter collection.');

    await scrollTo(page, 0, 600);
    await click(page, ACCOUNT_BTN, ACCOUNT);
    await shot(page, 'account-drawer-admin', 'Account drawer for the signed-in admin: identity block with the “Admin” role line, the Admin Dashboard entry, sanctuary shortcuts and sign-out.', { expect: 'text=Admin Dashboard' });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(700);

    await go(page, '/list');
    await shot(page, 'sanctuaries-list', 'The /list route — all curated sanctuaries with their verified metrics, member price and CTA into the detail overlay.');

    // The detail overlay is opened from the account drawer's sanctuary shortcuts —
    // on /list the card's "View Details" handler is still a stub (see docs).
    await click(page, ACCOUNT_BTN, ACCOUNT);
    await click(page, 'button:has-text("MODCON Agartha")', { wait: 3000 });
    await waitForImages(page);
    await page.mouse.move(720, 500);
    await page.mouse.wheel(0, 620); // past the hero photo, into the grid
    await waitForImages(page);
    await shot(page, 'property-detail-gallery', 'Property detail overlay for MODCON Agartha — header with member pricing, and the Gallery / Layout Plan / Invest tabs. 22 photos are served from the app’s own /public/gallery directory.', { expect: 'h2:has-text("MODCON Agartha")' });

    await click(page, 'button:has-text("Invest")', { wait: 2000, last: true });
    await waitForImages(page);
    await shot(page, 'property-detail-invest', 'The Invest tab of the same overlay — plot economics, price per sq yd and the member band, unblurred because the session is authenticated.');

    await click(page, 'button:has-text("Layout Plan")', { wait: 2500 });
    await waitForImages(page);
    await shot(page, 'property-detail-layout', 'The Layout Plan tab — the interactive site layout with selectable plots rendered over the master plan.');

    await go(page, '/map', 4500);
    await shot(page, 'map-live', 'The /map route: Leaflet with the live AQI field, the RRR corridor ring, key junction markers and the three sanctuaries. The grey grid is a placeholder basemap — raster tiles are blocked in the capture sandbox.', { expect: '.leaflet-container' });

    await click(page, '.leaflet-marker-icon', { wait: 2000 });
    await shot(page, 'map-marker-popup', 'A sanctuary marker popup on the map — summary card with a direct hand-off into the full property overlay.');

    await go(page, '/analytics');
    await shot(page, 'analytics-edge-nature', 'The /analytics route (“Edge + Nature”) — the channel-partner positioning and the pre-investor phase explainer.');

    await scrollTo(page, 1400);
    await shot(page, 'analytics-scrolled', 'Analytics, scrolled — “Four things every property must pass”: forest adjacency, AQI under 25, design quality and a 45-minute commute, the bar every listing is screened against.');

    await go(page, '/syl');
    await shot(page, 'syl-residences', 'The /syl route — the dedicated MODCON SYL Residences page with its own gallery and interactive layout.');

    await go(page, '/preinvestor-gold');
    await shot(page, 'preinvestor-gold', 'The /preinvestor-gold route — the pre-investor tier and what early entry buys.');

    await go(page, '/membership');
    await shot(page, 'membership', 'The /membership route — tiers and the benefits attached to a signed-in membership.');

    await go(page, '/blog');
    await shot(page, 'blog-index', 'The /blog route — the SEO article index rendered from the in-app content collection.');

    // ── Admin dashboard ─────────────────────────────────────────────────────
    await go(page, '/');
    await click(page, ADMIN_BTN, { wait: 2000 });
    await shot(page, 'admin-properties', 'Admin dashboard, Properties tab — Firestore-backed listings with live/draft toggles, edit and delete. Tab counters show how many documents sit behind each collection.', { expect: 'text=Admin Panel' });

    await click(page, 'button:text-matches("^Leads \\\\(\\\\d+\\\\)$")');
    await shot(page, 'admin-leads', 'Admin dashboard, Leads tab — every capture point (property overlay, chatbot, map popup, sign-up) writes here through saveLead(), streamed live via onSnapshot.');

    await click(page, 'button:text-matches("^News \\\\(\\\\d+\\\\)$")');
    await shot(page, 'admin-newsletter', 'Admin dashboard, Newsletter tab — subscribers tagged by the surface that captured them (modal, inline, mobile_quick).');

    await click(page, 'button:text-matches("^Users \\\\(\\\\d+\\\\)$")');
    await shot(page, 'admin-users', 'Admin dashboard, Users tab — profiles written on first sign-in, including the silently captured geolocation and a Google Maps deep link per user.');

    await click(page, 'button:text-matches("^Props \\\\(\\\\d+\\\\)$")', { wait: 800 });
    await click(page, 'button:has-text("Add Property")', { wait: 1400 });
    await shot(page, 'admin-property-form', 'Admin dashboard, property editor — the PropertyInput form that writes a new document into the properties collection and, once marked live, onto the public pages.');

    await ctx.close();
  }

  // ── Member session: non-admin chrome, concierge chatbot ───────────────────
  {
    const { ctx, page } = await newSession(browser, { role: 'member' });

    await go(page, '/');
    await click(page, ACCOUNT_BTN, ACCOUNT);
    await shot(page, 'account-drawer-member', 'The same account drawer for a non-admin member — the role line reads “Member” and the Admin Dashboard entry is gone, because it is gated on the signed-in email.');

    await go(page, '/'); // reload rather than dismiss — the drawer overlays the chat launcher
    await click(page, 'button.fixed.bottom-20', { wait: 1600 });
    await shot(page, 'chatbot-member', 'The concierge chatbot open in a member session — answers are matched against the same sanctuary dataset the pages render from, and enquiries drop into the leads collection.');

    await ctx.close();
  }

  // ── Member session, dark theme ────────────────────────────────────────────
  {
    const { ctx, page } = await newSession(browser, { role: 'member', dark: true });
    await go(page, '/list');
    await shot(page, 'dark-mode-sanctuaries', 'Dark theme, signed in — the preference persists in localStorage and toggles a class on <html>, so every token-driven colour flips at once.');
    await ctx.close();
  }

  // ── Mobile member session ─────────────────────────────────────────────────
  {
    const { ctx, page } = await newSession(browser, { role: 'member', viewport: MOBILE });
    await go(page, '/');
    await shot(page, 'mobile-home-signed-in', 'Mobile (390×844), signed in — the bottom tab bar replaces desktop navigation and the avatar stays in the top bar.');
    await go(page, '/list');
    await shot(page, 'mobile-sanctuaries', 'Mobile sanctuaries list — the same cards reflowed to a single column, member pricing still unlocked.');
    await go(page, '/map', 4500);
    await shot(page, 'mobile-map', 'Mobile map — sanctuary markers plus the metric strip pinned above the tab bar.');
    await ctx.close();
  }

  // ── Signed-out session: the authentication entry points ───────────────────
  {
    const { ctx, page } = await newSession(browser, { role: null });

    await go(page, '/');
    await click(page, ACCOUNT_BTN, ACCOUNT);
    await shot(page, 'account-drawer-signed-out', 'The signed-out account drawer — the state every screenshot above starts from, with the Sign In call to action.');

    await click(page, 'button:has-text("Sign In")', { wait: 1600 });
    await shot(page, 'auth-modal', 'The sign-in modal: Google, email/password and phone OTP, all three wired to Firebase Authentication.', { expect: 'text=Continue with Google' });

    await click(page, 'button:has-text("Continue with Phone")', { wait: 1200 });
    await shot(page, 'auth-phone-otp', 'Phone sign-in — the number is normalised to E.164 (+91 assumed for 10-digit input) before signInWithPhoneNumber, backed by an invisible reCAPTCHA verifier.');

    await click(page, 'button:has-text("Continue with Email")', { wait: 1000 });
    await click(page, 'button:has-text("Sign Up")', { wait: 800 });
    const email = page.locator('#auth-email');
    if (await email.count()) {
      await email.fill('nikhil.varma@example.in');
      const pwd = page.locator('#auth-password');
      if (await pwd.count()) await pwd.fill('demo-password');
      await shot(page, 'auth-email-signup', 'Email sign-up filled in — createUserWithEmailAndPassword runs, then the app immediately upserts a user profile and records a “New Sign-up” lead.');
      await click(page, 'button:has-text("Create Account")', { wait: 3000 });
    }
    await shot(page, 'profile-capture-new-user', 'Straight after sign-up: the profile capture modal that writes name / occupation / city into the users collection and triggers the silent geolocation write.');

    await ctx.close();
  }

  await browser.close();

  await writeFile(path.join(OUT, 'index.json'), JSON.stringify(shots, null, 2) + '\n');
  console.log(`\n${shots.length} screenshots written to docs/screenshots/`);
  if (warnings.length) {
    console.log('\nWarnings:');
    for (const w of [...new Set(warnings)]) console.log('  ! ' + w);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
