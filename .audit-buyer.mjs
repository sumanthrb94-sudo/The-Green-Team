import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'http://localhost:3301';
const OUT = '/tmp/claude-0/-home-user-The-Green-Team/de3e9eba-edd3-596d-a92c-fbc8b45665ba/scratchpad/audit/buyer';
fs.mkdirSync(OUT, { recursive: true });
const EXEC = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const VIEWPORTS = {
  mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  desktop: { viewport: { width: 1440, height: 900 } },
};
const phases = process.argv.slice(2);
const want = p => phases.length === 0 || phases.includes(p);

const log = [];
const findings = [];
const L = (...a) => { const s = a.map(x => (typeof x === 'string' ? x : JSON.stringify(x))).join(' '); console.log(s); log.push(s); };
const F = (sev, area, summary, evidence) => { findings.push({ sev, area, summary, evidence }); L(`!! [${sev}] ${area}: ${summary} ${evidence ? '— ' + evidence : ''}`); };
const OK = (msg) => L(`   ok: ${msg}`);

const browser = await chromium.launch({ executablePath: EXEC });

// Per-page diagnostics
const diag = new Map();
function attach(page, label) {
  const rec = { errors: [], pageerrors: [], failed: [], pricingReqs: [], apiPosts: [] };
  diag.set(label, rec);
  page.on('console', m => { if (m.type() === 'error') rec.errors.push(`${page.url()} :: ${m.text().slice(0, 400)}`); });
  page.on('pageerror', e => rec.pageerrors.push(`${page.url()} :: ${String(e).slice(0, 400)}`));
  page.on('requestfailed', r => {
    const u = r.url();
    if (/googleapis|gstatic|google\.com|googletagmanager|recaptcha|firebase/.test(u)) return; // blocked on purpose
    rec.failed.push(`${u} :: ${r.failure()?.errorText}`);
  });
  page.on('request', r => {
    if (r.url().includes('/api/pricing')) rec.pricingReqs.push(`${r.method()} ${r.url()}`);
    if (r.url().includes('/api/') && r.method() !== 'GET') rec.apiPosts.push(`${r.method()} ${r.url()} ${r.postData()?.slice(0, 200)}`);
  });
  return rec;
}
function reportDiag(label) {
  const r = diag.get(label);
  if (!r) return;
  for (const e of r.errors) F('Low', `console/${label}`, 'console.error', e);
  for (const e of r.pageerrors) F('High', `pageerror/${label}`, 'uncaught exception', e);
  for (const e of r.failed) F('Low', `netfail/${label}`, 'request failed', e);
}

async function mk(vp, { fresh = false, dark = false } = {}) {
  const ctx = await browser.newContext({ ...VIEWPORTS[vp], locale: 'en-IN', permissions: ['clipboard-read', 'clipboard-write'] });
  if (!fresh) await ctx.addInitScript(() => { try { sessionStorage.setItem('gt_splash_seen', '1'); localStorage.setItem('gt_welcome_v2', '1'); } catch {} });
  if (dark) await ctx.addInitScript(() => { try { localStorage.setItem('gt_dark', 'true'); } catch {} });
  // Never reach Firestore/Resend: mock every non-GET API call, and /api/pricing.
  await ctx.route('**/api/**', route => {
    const req = route.request();
    const u = new URL(req.url());
    if (req.method() === 'GET' && (u.pathname === '/api/activity')) return route.continue();
    if (u.pathname.startsWith('/api/pricing')) return route.fulfill({ status: 401, contentType: 'application/json', body: '{"error":"sign_in_required"}' });
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  // Keep Firebase/Google out of the sandbox entirely (no OTP is ever sent).
  await ctx.route(/(identitytoolkit|securetoken|firestore|firebaseinstallations|firebase)\.googleapis\.com|www\.google\.com\/recaptcha|gstatic\.com\/recaptcha|recaptcha\.net|googletagmanager|google-analytics/, route => route.abort());
  return ctx;
}
const shot = (page, name, full = false) => page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: full }).then(() => path.join(OUT, name + '.png'));
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ───────────────────────── 1. Entry / splash ───────────────────────── */
if (want('splash')) for (const vp of ['mobile', 'desktop']) {
  L(`\n=== SPLASH ${vp} ===`);
  const ctx = await mk(vp, { fresh: true });
  const page = await ctx.newPage();
  attach(page, `splash-${vp}`);
  const t0 = Date.now();
  await page.goto(BASE + '/', { waitUntil: 'commit' });
  const splash = page.locator('.gt-splash');
  const seenEarly = await splash.count();
  L('splash present in initial HTML:', seenEarly > 0);
  await sleep(600);
  await shot(page, `01-splash-${vp}`);
  const bodyLocked = await page.evaluate(() => document.body.classList.contains('modal-open'));
  L('body locked during splash:', bodyLocked);
  let goneAt = null;
  for (let i = 0; i < 80; i++) {
    if ((await splash.count()) === 0) { goneAt = Date.now() - t0; break; }
    await sleep(100);
  }
  L('splash gone after ms:', goneAt);
  if (goneAt == null) F('Blocker', 'Splash', 'splash never lifted within 8s', `${vp}`);
  else if (goneAt > 5600) F('High', 'Splash', `splash held ${goneAt}ms (> 5s ceiling)`, vp);
  const unlocked = await page.evaluate(() => !document.body.classList.contains('modal-open') && getComputedStyle(document.body).overflow !== 'hidden');
  L('body scroll unlocked after:', unlocked);
  if (!unlocked) F('High', 'Splash', 'body still scroll-locked after splash', vp);
  const ss = await page.evaluate(() => sessionStorage.getItem('gt_splash_seen'));
  L('sessionStorage gt_splash_seen:', ss);
  await shot(page, `02-home-after-splash-${vp}`);
  // reload: must not replay
  await page.reload({ waitUntil: 'domcontentloaded' });
  await sleep(400);
  const again = await splash.count();
  const vis = again ? await splash.isVisible() : false;
  L('splash after reload present/visible:', again, vis);
  if (vis) F('High', 'Splash', 'splash replays on reload', vp);
  // scroll works?
  await page.evaluate(() => window.scrollTo(0, 600));
  await sleep(200);
  const y = await page.evaluate(() => window.scrollY);
  L('scrollY after scrollTo(600):', y);
  if (y < 100) F('High', 'Splash', 'page cannot scroll after splash', vp);
  reportDiag(`splash-${vp}`);
  await ctx.close();
}

/* ───────────────────────── 2. Home ───────────────────────── */
if (want('home')) for (const vp of ['mobile', 'desktop']) {
  L(`\n=== HOME ${vp} ===`);
  const ctx = await mk(vp);
  const page = await ctx.newPage();
  const rec = attach(page, `home-${vp}`);
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await shot(page, `03-home-${vp}-full`, true);
  // Header
  const hdr = page.locator('header');
  const hdrLinks = await hdr.locator('a').evaluateAll(as => as.map(a => ({ t: a.textContent.trim(), h: a.getAttribute('href'), vis: !!(a.offsetWidth || a.offsetHeight) })));
  L('header links:', hdrLinks);
  const hdrBtns = await hdr.locator('button').evaluateAll(bs => bs.map(b => ({ t: b.getAttribute('aria-label') || b.textContent.trim(), vis: !!(b.offsetWidth || b.offsetHeight) })));
  L('header buttons:', hdrBtns);
  if (vp === 'desktop') {
    const need = ['/contact?interest=list-property', '/contact'];
    for (const h of need) if (!hdrLinks.some(l => l.h === h && l.vis)) F('Medium', 'Nav', `desktop header missing visible link ${h}`, vp);
    if (!hdrBtns.some(b => b.t === 'Sign in' && b.vis)) F('Medium', 'Nav', 'desktop header missing Sign in', vp);
  } else {
    if (!hdrBtns.some(b => b.t === 'Open menu' && b.vis)) F('High', 'Nav', 'mobile hamburger missing', vp);
  }
  // Hero CTAs
  const hero = page.locator('section').first();
  const heroLinks = await hero.locator('a').evaluateAll(as => as.map(a => ({ t: a.textContent.trim().slice(0, 40), h: a.getAttribute('href') })));
  L('hero links:', heroLinks);
  // Momentum strip
  const strip = page.locator('[aria-label="Current activity"]');
  L('momentum strip present:', await strip.count(), (await strip.count()) ? await strip.innerText() : '');
  // Bento
  const bento = page.locator('#sanctuaries a[href^="/sanctuaries/"]');
  L('bento tiles:', await bento.count(), await bento.evaluateAll(as => as.map(a => a.getAttribute('href'))));
  if ((await bento.count()) < 3) F('Medium', 'Home', 'bento shows fewer than 3 sanctuaries', vp);
  // ListWithUs
  L('list-it-with-us link:', await page.locator('a[href="/contact?interest=list-property"]').count());
  // Adviser call form
  await page.locator('#adviser-call').scrollIntoViewIfNeeded();
  await page.fill('#ac-name', 'Audit Buyer');
  await page.fill('#ac-phone', '9876543210');
  await page.locator('#adviser-call button', { hasText: '₹1 Cr – ₹2 Cr' }).click();
  await shot(page, `04-adviser-form-${vp}`);
  await page.locator('#adviser-call button[type=submit]').click();
  try {
    await page.locator('#adviser-call', { hasText: "Done. We'll call you." }).waitFor({ timeout: 5000 });
    OK('adviser call form success state');
  } catch { F('High', 'Home/AdviserCall', 'no success state after mocked submit', vp); }
  await shot(page, `05-adviser-success-${vp}`);
  // Newsletter
  await page.locator('#nl-highlight-email').scrollIntoViewIfNeeded();
  await page.fill('#nl-highlight-email', 'audit@example.com');
  await page.locator('#nl-highlight-email').press('Enter');
  try {
    await page.getByText('You are on the list.').waitFor({ timeout: 5000 });
    OK('newsletter success state');
  } catch { F('High', 'Home/Newsletter', 'no success state after mocked submit', vp); }
  await shot(page, `06-newsletter-success-${vp}`);
  L('api posts:', rec.apiPosts);
  // Footer
  const footer = await page.locator('footer a').evaluateAll(as => as.map(a => ({ t: a.textContent.trim().slice(0, 30), h: a.getAttribute('href'), target: a.getAttribute('target') })));
  L('footer links:', footer);
  // Welcome gate & sticky CTA presence
  L('sticky mobile CTA visible:', await page.locator('a[href*="wa.me"]:visible').count());
  reportDiag(`home-${vp}`);
  await ctx.close();
}

/* ───────────────────────── 2b. Crawl ───────────────────────── */
if (want('crawl')) {
  L('\n=== CRAWL ===');
  const ctx = await mk('desktop');
  const page = await ctx.newPage();
  attach(page, 'crawl');
  const seeds = ['/', '/list', '/explore/villas', '/explore/plots', '/explore/investments', '/sanctuaries/agartha', '/sanctuaries/syl', '/sanctuaries/dates-county', '/contact', '/standard', '/map', '/blog'];
  const hrefs = new Map();
  for (const s of seeds) {
    const resp = await page.goto(BASE + s, { waitUntil: 'domcontentloaded' });
    L(`seed ${s} -> ${resp?.status()}`);
    if (!resp || resp.status() !== 200) F('High', 'Crawl', `seed ${s} returned ${resp?.status()}`, s);
    const as = await page.locator('a[href]').evaluateAll(as => as.map(a => a.getAttribute('href')));
    for (const h of as) { if (!hrefs.has(h)) hrefs.set(h, new Set()); hrefs.get(h).add(s); }
  }
  const internal = [...hrefs.keys()].filter(h => h.startsWith('/') && !h.startsWith('//'));
  const external = [...hrefs.keys()].filter(h => !h.startsWith('/') && !h.startsWith('#'));
  L('internal unique hrefs:', internal.length, 'external:', external);
  const broken = [];
  for (const h of internal.sort()) {
    const u = BASE + h.split('#')[0];
    let status;
    try { const r = await fetch(u, { redirect: 'manual' }); status = r.status; if ([301, 302, 307, 308].includes(status)) status = `${status}->${r.headers.get('location')}`; }
    catch (e) { status = 'ERR ' + e.message; }
    L(`  ${h} -> ${status}   (from ${[...hrefs.get(h)].join(',')})`);
    if (typeof status === 'number' && status >= 400) broken.push(h);
    if (typeof status === 'string' && status.startsWith('ERR')) broken.push(h);
  }
  // anchors: verify target ids exist on page
  for (const h of internal.filter(x => x.includes('#'))) {
    const [p, id] = h.split('#');
    await page.goto(BASE + p, { waitUntil: 'domcontentloaded' });
    const ok = await page.locator(`#${CSS.escape ? id : id}`).count().catch(() => 0);
    if (!ok) F('Medium', 'Crawl', `anchor ${h} has no target element`, [...hrefs.get(h)].join(','));
  }
  for (const b of broken) F('High', 'Crawl', `broken internal link ${b}`, [...hrefs.get(b)].join(','));
  reportDiag('crawl');
  await ctx.close();
}

/* ───────────────────────── 3. Mobile menu ───────────────────────── */
if (want('menu')) {
  L('\n=== MOBILE MENU ===');
  const ctx = await mk('mobile');
  const page = await ctx.newPage();
  attach(page, 'menu');
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Open menu' }).click();
  const drawer = page.getByRole('dialog', { name: 'Menu' });
  await drawer.waitFor({ timeout: 3000 });
  await sleep(500);
  await shot(page, `07-mobile-menu`);
  const txt = await drawer.innerText();
  L('drawer text:', txt.replace(/\n+/g, ' | ').slice(0, 600));
  for (const need of ['Sign in / Join', 'List your property', 'Villas', 'Plots & Farmland', 'Investments', 'Sanctuary Map', 'Journal', 'Contact']) if (!txt.includes(need)) F('Medium', 'MobileMenu', `missing "${need}"`, '');
  const links = await drawer.locator('a').evaluateAll(as => as.map(a => a.getAttribute('href')));
  L('drawer links:', links);
  // overflow: does drawer overflow viewport? check bottom of last element
  const overflow = await drawer.evaluate(el => ({ sh: el.scrollHeight, ch: el.clientHeight }));
  L('drawer scroll/client height:', overflow);
  // Navigate via Villas; menu should close
  await drawer.getByRole('link', { name: 'Villas', exact: true }).click();
  await page.waitForURL('**/explore/villas', { timeout: 5000 }).catch(() => F('High', 'MobileMenu', 'Villas link did not navigate', ''));
  await sleep(600);
  L('drawer after navigate:', await page.getByRole('dialog', { name: 'Menu' }).count());
  if (await page.getByRole('dialog', { name: 'Menu' }).count()) F('Medium', 'MobileMenu', 'drawer stays open after navigation', '');
  // Sign in / Join opens auth
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('dialog', { name: 'Menu' }).getByText('Sign in / Join').click();
  await sleep(500);
  const auth = page.getByRole('dialog', { name: 'Sign in' });
  L('auth modal open from menu:', await auth.count(), 'menu still open:', await page.getByRole('dialog', { name: 'Menu' }).count());
  if (!(await auth.count())) F('High', 'MobileMenu', 'Sign in / Join does not open auth modal', '');
  await shot(page, `08-mobile-menu-signin`);
  reportDiag('menu');
  await ctx.close();
}

/* ───────────────────────── 4. Sign-in modal ───────────────────────── */
if (want('auth')) for (const vp of ['mobile', 'desktop']) {
  L(`\n=== AUTH ${vp} ===`);
  const ctx = await mk(vp);
  const page = await ctx.newPage();
  attach(page, `auth-${vp}`);
  await page.goto(BASE + '/list', { waitUntil: 'networkidle' });
  if (vp === 'desktop') await page.getByRole('button', { name: 'Sign in' }).click();
  else { await page.getByRole('button', { name: 'Sign in' }).click(); }
  const dlg = page.getByRole('dialog', { name: 'Sign in' });
  await dlg.waitFor({ timeout: 3000 });
  await sleep(500);
  await shot(page, `09-auth-${vp}`);
  L('has +91 prefix:', await dlg.getByText('+91').count(), 'google btn:', await dlg.getByText('Continue with Google').count());
  const phone = dlg.getByLabel('Mobile number');
  await phone.fill('9876543210');
  await dlg.getByRole('button', { name: /Send OTP/ }).click();
  let msg = '';
  for (let i = 0; i < 40; i++) {
    await sleep(250);
    const err = dlg.locator('p.text-error');
    if (await err.count()) { msg = await err.innerText(); break; }
    if (await dlg.getByText('Enter the code').count()) { msg = 'OTP STEP'; break; }
  }
  L('after Send OTP:', msg || '(no error, no otp step within 10s)');
  await shot(page, `10-auth-otp-result-${vp}`);
  if (!msg) F('High', 'Auth', 'Send OTP: no feedback within 10s (button state?)', `${vp}: btn text=${await dlg.getByRole('button', { name: /Send|Sending/ }).innerText().catch(() => '?')}`);
  else if (msg !== 'OTP STEP' && !/Network error|Something went wrong|try again|not enabled|Verification failed/.test(msg)) F('Medium', 'Auth', `unfriendly OTP error: ${msg}`, vp);
  if (msg === 'OTP STEP') {
    L('otp step text:', await dlg.innerText());
    await dlg.getByText('Change number').click();
    L('back on phone step:', await dlg.getByText('Sign in to The Green Team').count());
  }
  // invalid number validation
  await phone.fill('12345');
  await dlg.getByRole('button', { name: /Send OTP/ }).click();
  await sleep(300);
  L('invalid-number msg:', await dlg.locator('p.text-error').innerText().catch(() => 'none'));
  // Escape closes
  await page.keyboard.press('Escape');
  await sleep(500);
  L('modal after Escape:', await dlg.count());
  if (await dlg.count()) F('Medium', 'Auth', 'Escape does not close modal', vp);
  // backdrop click closes
  await page.getByRole('button', { name: 'Sign in' }).click();
  await dlg.waitFor();
  await page.mouse.click(5, 5);
  await sleep(500);
  L('modal after backdrop click:', await dlg.count());
  // body scroll lock while modal open?
  await page.getByRole('button', { name: 'Sign in' }).click();
  await dlg.waitFor();
  const lock = await page.evaluate(() => getComputedStyle(document.body).overflow);
  L('body overflow while auth open:', lock);
  reportDiag(`auth-${vp}`);
  await ctx.close();
}

/* ───────────────────────── 5. /list ───────────────────────── */
if (want('list')) for (const vp of ['mobile', 'desktop']) {
  L(`\n=== LIST ${vp} ===`);
  const ctx = await mk(vp);
  const page = await ctx.newPage();
  attach(page, `list-${vp}`);
  await page.goto(BASE + '/list', { waitUntil: 'networkidle' });
  await shot(page, `11-list-${vp}`, true);
  const count = async () => parseInt(await page.locator('p:has-text("propert")').first().locator('span').first().innerText(), 10);
  const cards = () => page.locator('article');
  L('initial count label:', await count(), 'cards:', await cards().count());
  if ((await count()) !== (await cards().count())) F('High', 'List', 'result count label != cards rendered', vp);
  const cardInfo = await cards().evaluateAll(cs => cs.map(c => ({ title: c.querySelector('h3')?.textContent.trim(), price: c.querySelector('p')?.textContent.trim(), links: [...c.querySelectorAll('a')].map(a => a.getAttribute('href')) })));
  L('cards:', cardInfo);
  for (const c of cardInfo) {
    const id = c.links[0]?.split('/').pop();
    if (!c.links.some(h => h === `/sanctuaries/${id}`)) F('High', 'List', `card ${c.title} View details href wrong`, JSON.stringify(c.links));
    if (!c.links.some(h => h?.startsWith('/contact?interest=') && h.includes(`property=${id}`))) F('High', 'List', `card ${c.title} Enquire href wrong`, JSON.stringify(c.links));
  }
  // search
  const search = page.getByLabel('Search listings');
  await search.fill('Narsapur');
  await sleep(600);
  L('search "Narsapur":', await count(), page.url());
  if (!page.url().includes('q=Narsapur')) F('Medium', 'List', 'URL not updated with q= after search', page.url());
  await search.fill('zzzz-nothing');
  await sleep(600);
  L('bad query count:', await count(), 'empty state:', await page.getByText('Nothing matches those filters yet.').count());
  await shot(page, `12-list-empty-${vp}`);
  if (!(await page.getByText('Nothing matches those filters yet.').count())) F('Medium', 'List', 'empty state not rendered', vp);
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await sleep(600);
  L('after Clear filters:', await count(), page.url(), 'search value:', await search.inputValue());
  // type chips
  await page.getByRole('button', { name: 'Plots', exact: true }).click();
  await sleep(500);
  L('chip Plots:', await count(), page.url());
  const plotTitles = await cards().locator('h3').allInnerTexts();
  L('plot cards:', plotTitles);
  if (plotTitles.some(t => /SYL/.test(t))) F('High', 'List', 'Plots chip still shows SYL (villas)', vp);
  await page.getByRole('button', { name: 'Villas', exact: true }).click();
  await sleep(500);
  L('chip Villas:', await count(), await cards().locator('h3').allInnerTexts(), page.url());
  await page.getByRole('button', { name: 'Investments', exact: true }).click();
  await sleep(500);
  L('chip Investments:', await count(), await cards().locator('h3').allInnerTexts(), page.url());
  await page.getByRole('button', { name: 'All properties' }).click();
  await sleep(400);
  if (vp === 'desktop') {
    await page.getByLabel('Budget').selectOption('lt1cr');
    await sleep(400);
    L('budget <1Cr:', await count(), await cards().locator('h3').allInnerTexts(), page.url());
    await page.getByLabel('Budget').selectOption('gt2cr');
    await sleep(400);
    L('budget >2Cr:', await count(), await cards().locator('h3').allInnerTexts(), page.url());
    await page.getByLabel('Budget').selectOption('');
    await page.getByLabel('Stage').selectOption('completed');
    await sleep(400);
    L('stage completed:', await count(), await cards().locator('h3').allInnerTexts(), page.url());
    await page.getByLabel('Stage').selectOption('');
    await page.getByLabel('Sort').selectOption('price-asc');
    await sleep(400);
    L('sort price-asc:', await cards().locator('h3').allInnerTexts(), await cards().locator('p').evaluateAll(ps => ps.filter(p => p.className.includes('text-xl')).map(p => p.textContent)), page.url());
    await page.getByLabel('Sort').selectOption('price-desc');
    await sleep(400);
    L('sort price-desc:', await cards().locator('h3').allInnerTexts());
    await page.getByLabel('Sort').selectOption('aqi');
    await sleep(400);
    L('sort aqi:', await cards().locator('h3').allInnerTexts(), await cards().locator('li').evaluateAll(ls => ls.filter(l => l.textContent.includes('AQI')).map(l => l.textContent.trim())));
    await shot(page, `13-list-filtered-${vp}`);
    L('Clear all present:', await page.getByRole('button', { name: 'Clear all' }).count());
  } else {
    await page.getByRole('button', { name: 'Filters' }).click();
    await sleep(500);
    await shot(page, `13-list-filter-sheet-${vp}`);
    const sheet = page.getByRole('dialog', { name: 'Filters' });
    await sheet.getByRole('button', { name: 'Under ₹1 Cr' }).click();
    await sheet.getByRole('button', { name: 'Cleanest air first' }).click();
    await sleep(400);
    const showBtn = sheet.getByRole('button', { name: /Show \d+ result/ });
    L('sheet show button:', await showBtn.innerText(), page.url());
    await showBtn.click();
    await sleep(400);
    L('after sheet:', await count(), await cards().locator('h3').allInnerTexts(), page.url());
    L('filter badge:', await page.getByRole('button', { name: /Filters/ }).innerText());
    await shot(page, `14-list-filtered-${vp}`);
  }
  // deep link
  await page.goto(BASE + '/list?type=plots&sort=aqi&budget=lt1cr', { waitUntil: 'networkidle' });
  await sleep(500);
  L('deep link:', await count(), await cards().locator('h3').allInnerTexts());
  L('deep link chip Plots pressed:', await page.getByRole('button', { name: 'Plots', exact: true }).getAttribute('aria-pressed'));
  if (vp === 'desktop') {
    L('deep link sort value:', await page.getByLabel('Sort').inputValue(), 'budget:', await page.getByLabel('Budget').inputValue());
  } else {
    L('deep link badge:', await page.getByRole('button', { name: /Filters/ }).innerText());
  }
  await shot(page, `15-list-deeplink-${vp}`);
  // shortlist
  await page.goto(BASE + '/list', { waitUntil: 'networkidle' });
  const heart = cards().first().getByRole('button', { name: /shortlist/ });
  L('heart initial:', await heart.getAttribute('aria-label'));
  await heart.click();
  await sleep(200);
  L('heart after click:', await heart.getAttribute('aria-label'), 'ls:', await page.evaluate(() => localStorage.getItem('gt_shortlist')));
  await page.reload({ waitUntil: 'networkidle' });
  await sleep(300);
  L('heart after reload:', await cards().first().getByRole('button', { name: /shortlist/ }).getAttribute('aria-label'));
  if ((await cards().first().getByRole('button', { name: /shortlist/ }).getAttribute('aria-label')) !== 'Remove from shortlist') F('Medium', 'List', 'shortlist not persisted across reload', vp);
  await shot(page, `16-list-shortlisted-${vp}`);
  // Any place to VIEW the shortlist?
  const shortlistLinks = await page.locator('a[href*="shortlist"], a[href*="saved"]').count();
  L('links to a shortlist page:', shortlistLinks);
  // Check "How we choose" link and heading
  reportDiag(`list-${vp}`);
  await ctx.close();
}

/* ───────────────────────── 6. explore ───────────────────────── */
if (want('explore')) for (const vp of ['mobile', 'desktop']) {
  L(`\n=== EXPLORE ${vp} ===`);
  const ctx = await mk(vp);
  const page = await ctx.newPage();
  attach(page, `explore-${vp}`);
  for (const cat of ['villas', 'plots', 'investments']) {
    await page.goto(BASE + '/explore/' + cat, { waitUntil: 'networkidle' });
    const titles = await page.locator('article h3').allInnerTexts();
    const chips = await page.locator('button[aria-pressed]').count();
    const cnt = await page.locator('p:has-text("propert")').first().innerText();
    L(`/explore/${cat}:`, cnt, titles, 'type chips visible:', chips, 'h1:', await page.locator('h1').innerText());
    await shot(page, `17-explore-${cat}-${vp}`, true);
    if (cat === 'villas' && titles.some(t => !/SYL/.test(t))) F('High', 'Explore', 'villas shows non-villa', titles.join(','));
    if (cat === 'plots' && titles.some(t => /SYL/.test(t))) F('High', 'Explore', 'plots shows SYL', titles.join(','));
    // locked: search should not expose type param; URL shouldn't get type=
    await page.getByLabel('Search listings').fill('Agartha');
    await sleep(600);
    L(`  search Agartha on ${cat}:`, await page.locator('article h3').allInnerTexts(), page.url());
    if (page.url().includes('type=')) F('Low', 'Explore', 'locked category leaks type= into URL', page.url());
    await page.goto(BASE + `/explore/${cat}?type=villas`, { waitUntil: 'networkidle' });
    L(`  ${cat}?type=villas override attempt:`, await page.locator('article h3').allInnerTexts());
  }
  const r404 = await page.goto(BASE + '/explore/nope', { waitUntil: 'domcontentloaded' });
  L('/explore/nope status:', r404?.status());
  await shot(page, `18-explore-404-${vp}`);
  reportDiag(`explore-${vp}`);
  await ctx.close();
}

/* ───────────────────────── 7. PDP ───────────────────────── */
if (want('pdp')) for (const vp of ['mobile', 'desktop']) for (const id of ['agartha', 'syl', 'dates-county']) {
  L(`\n=== PDP ${id} ${vp} ===`);
  const ctx = await mk(vp);
  const page = await ctx.newPage();
  const rec = attach(page, `pdp-${id}-${vp}`);
  const resp = await page.goto(BASE + '/sanctuaries/' + id, { waitUntil: 'networkidle' });
  L('status:', resp?.status(), 'title:', await page.title());
  await shot(page, `20-pdp-${id}-${vp}-top`);
  await shot(page, `20-pdp-${id}-${vp}-full`, true);
  // Gated pricing leak check: page HTML + all JS fetched should not carry per-unit totals
  const html = await page.content();
  const expected = { agartha: [726 * 8500, 968 * 8500, 1210 * 8500, 2057 * 8500, 4840 * 8500], syl: [3882 * 6999, 3950 * 6999, 4165 * 6999, 4720 * 6999, 7000 * 6999], 'dates-county': [200 * 18000, 300 * 18000, 500 * 18000, 600 * 18000] }[id];
  const fmt = n => (n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : `₹${(n / 1e5).toFixed(1)} L`);
  const leaks = [];
  for (const n of expected) {
    for (const s of [fmt(n), n.toLocaleString('en-IN'), String(n)]) if (html.includes(s)) leaks.push(s);
  }
  // note: '₹90.0 L' for dates 500 plot is the public entry price, exclude exact public headline
  L('price-sheet strings found in HTML:', leaks);
  L('pricing API requests (logged out):', rec.pricingReqs);
  if (rec.pricingReqs.length) F('Medium', 'PDP/Pricing', 'logged-out client requests /api/pricing', rec.pricingReqs.join(','));
  const gate = page.locator('text=See the price for every');
  L('gate visible:', await gate.count());
  if (!(await gate.count())) F('High', 'PDP/Pricing', 'sign-in gate not rendered for logged-out user', id);
  // Sign-in button label in gate says Google but modal is phone-first
  L('gate CTA text:', await page.locator('#insights button').first().innerText().catch(() => '?'));
  // Tabs
  const tabs = page.getByRole('tab');
  L('tabs:', await tabs.allInnerTexts());
  const tabBar = page.locator('div.sticky.top-14');
  L('tab bar sticky box:', await tabBar.boundingBox());
  // Jump to Pricing tab, check scroll-spy
  await page.getByRole('tab', { name: 'Pricing' }).click();
  await sleep(1200);
  const insTop = await page.locator('#insights').evaluate(el => el.getBoundingClientRect().top);
  const barBottom = await tabBar.evaluate(el => el.getBoundingClientRect().bottom);
  L('after Pricing tab: #insights top', insTop, 'bar bottom', barBottom, 'selected:', await page.locator('[role=tab][aria-selected=true]').innerText());
  if (insTop < barBottom - 4) F('High', 'PDP/Tabs', 'section heading hidden under sticky bar after tab jump', `${id} ${vp}: sectionTop=${insTop} barBottom=${barBottom}`);
  if ((await page.locator('[role=tab][aria-selected=true]').innerText()) !== 'Pricing') F('Medium', 'PDP/Tabs', 'scroll-spy did not select tapped tab', `${id} ${vp}`);
  await shot(page, `21-pdp-${id}-${vp}-pricing-tab`);
  // Compact row visible?
  const compact = page.locator('div.sticky.top-14 > div').first();
  L('compact row aria-hidden:', await compact.getAttribute('aria-hidden'), 'text:', (await compact.innerText()).replace(/\n/g, ' | '));
  // share (clipboard fallback)
  await page.evaluate(() => { delete navigator.share; });
  const shareBtn = page.getByRole('button', { name: /Share|Link copied/ });
  await shareBtn.click();
  await sleep(300);
  L('share label after click:', await shareBtn.getAttribute('aria-label'), 'clipboard:', await page.evaluate(() => navigator.clipboard.readText()).catch(e => 'ERR ' + e.message));
  // shortlist from compact row
  const h = page.locator('div.sticky.top-14').getByRole('button', { name: /shortlist/ });
  await h.click();
  L('compact shortlist:', await h.getAttribute('aria-label'), await page.evaluate(() => localStorage.getItem('gt_shortlist')));
  await h.click();
  // Scroll-spy on manual scroll to Location
  await page.locator('#location').scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 40));
  await sleep(800);
  L('spy after scroll to #location:', await page.locator('[role=tab][aria-selected=true]').innerText());
  // Key facts + pricing strip
  L('key facts present:', await page.locator('#overview dl, #overview [class*=grid]').count());
  const strip = page.locator('a[href="#insights"]');
  L('pricing strip link:', await strip.count(), await strip.innerText().catch(() => ''));
  L('Bookings from:', await page.locator('#overview').getByText('Bookings from').count());
  // Gallery lightbox
  await page.locator('#gallery').scrollIntoViewIfNeeded();
  const gcount = await page.locator('#gallery button').count();
  L('gallery thumbs:', gcount, 'hero says:', await page.locator('a[href="#gallery"]').innerText());
  await page.locator('#gallery button').first().click();
  await sleep(500);
  const lb = page.locator('div.fixed.inset-0.z-\\[9990\\]');
  L('lightbox open:', await lb.count());
  await shot(page, `22-pdp-${id}-${vp}-lightbox`);
  await page.getByRole('button', { name: 'Next' }).click();
  await sleep(300);
  L('lightbox counter:', await lb.locator('p').innerText().catch(() => '?'));
  await page.keyboard.press('Escape');
  await sleep(400);
  L('lightbox after Escape:', await lb.count());
  if (await lb.count()) { await page.getByRole('button', { name: 'Close' }).first().click(); await sleep(400); L('lightbox after Close btn:', await lb.count()); }
  L('body overflow while/after lightbox:', await page.evaluate(() => getComputedStyle(document.body).overflow));
  // Site plan
  if (await page.locator('#plan').count()) {
    await page.locator('#plan').scrollIntoViewIfNeeded();
    const dots = page.locator('#plan button[aria-label^="Plot"], #plan button[aria-label^="Villament"], #plan button[aria-label^="Unit"]');
    L('site plan dots:', await dots.count());
    if (await dots.count()) {
      await dots.first().click();
      await sleep(500);
      const snap = await page.locator('#plan').getByText('Investment Snapshot').count();
      const snapText = snap ? await page.locator('#plan >> text=Investment Snapshot').locator('..').innerText() : '';
      L('snapshot open:', snap, snapText.replace(/\n/g, ' | ').slice(0, 300));
      if (/Today|Indicative price/.test(snapText)) F('High', 'PDP/SitePlan', 'per-unit price shown to logged-out user in site plan', id);
      await shot(page, `23-pdp-${id}-${vp}-siteplan`);
      const dotSizes = await dots.evaluateAll(bs => bs.map(b => b.getBoundingClientRect().width));
      L('dot px sizes min/max:', Math.min(...dotSizes), Math.max(...dotSizes));
      if (Math.min(...dotSizes) < 12 && vp === 'mobile') F('Medium', 'PDP/SitePlan', `site-plan dots as small as ${Math.min(...dotSizes).toFixed(0)}px on mobile — hard to tap`, id);
    }
    await page.locator('#plan').getByRole('button', { name: 'Features' }).click();
    await sleep(300);
    L('feature hotspots:', await page.locator('#plan button.w-8').count());
  } else L('no site plan section');
  // amenities / location
  L('amenities:', await page.locator('#features').count(), 'location:', await page.locator('#location').count(), 'map link:', await page.locator('#location a[href="/map"]').count());
  // EMI
  if (await page.locator('#emi').count()) {
    await page.locator('#emi').scrollIntoViewIfNeeded();
    const emiVal = () => page.locator('#emi').getByText('Monthly EMI').locator('..').locator('p').nth(1).innerText();
    const before = await emiVal();
    const s = page.locator('#emi input[type=range]').first();
    await s.focus();
    await s.press('ArrowRight');
    await s.press('ArrowRight');
    // also set via evaluate for reliability
    await page.locator('#emi input[type=range]').nth(2).evaluate(el => { const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(el, '10'); el.dispatchEvent(new Event('input', { bubbles: true })); });
    await sleep(300);
    const after = await emiVal();
    L('EMI before/after:', before, after, 'note:', await page.locator('#emi').getByText('Indicative only').innerText());
    if (before === after) F('Medium', 'PDP/EMI', 'EMI did not recompute on slider change', id);
    await shot(page, `24-pdp-${id}-${vp}-emi`);
  } else L('no EMI section');
  // Developer card + form
  await page.locator('#contact').scrollIntoViewIfNeeded();
  const form = page.locator('#contact form');
  L('form interest:', await form.getByLabel('Interest').inputValue(), 'property:', await form.getByLabel('Property').inputValue());
  L('developer:', await page.locator('#contact').getByText('Developer', { exact: true }).locator('..').innerText().catch(() => '?'));
  L('brochure link:', await page.locator('#contact a[href$=".pdf"], #contact a:has-text("brochure")').evaluateAll(as => as.map(a => a.getAttribute('href'))));
  await form.getByLabel('Your name').fill('Audit Buyer');
  await form.getByRole('button', { name: /Send message/ }).click();
  await sleep(300);
  L('validation w/o phone/email:', await form.locator('p.text-error').innerText().catch(() => 'none'));
  await form.getByLabel('Your phone number').fill('9876543210');
  await form.getByRole('button', { name: /Send message/ }).click();
  try { await page.locator('#contact').getByText('Thank you — message received.').waitFor({ timeout: 5000 }); OK('PDP contact form success'); } catch { F('High', 'PDP/Contact', 'no success after mocked submit', id); }
  L('lead payload:', rec.apiPosts.filter(p => p.includes('/api/leads')));
  await shot(page, `25-pdp-${id}-${vp}-lead-success`);
  // reviews form
  await page.locator('#reviews').scrollIntoViewIfNeeded();
  const rf = page.locator('#reviews form');
  await rf.getByLabel('Your name').fill('Audit');
  await rf.getByLabel('Your review').fill('Visited, good.');
  await rf.getByRole('button', { name: 'Submit Review' }).click();
  await sleep(300);
  L('review no-rating msg:', await rf.locator('p').last().innerText().catch(() => '?'));
  await rf.getByRole('radio', { name: '4 stars' }).click();
  await rf.getByRole('button', { name: 'Submit Review' }).click();
  try { await page.locator('#reviews').getByText('Thank you.').waitFor({ timeout: 5000 }); OK('review success'); } catch { F('Medium', 'PDP/Reviews', 'no success after mocked review submit', id); }
  // similar cards
  L('similar cards:', await page.locator('#similar article h3').allInnerTexts());
  // mobile action bar
  if (vp === 'mobile') {
    const bar = page.locator('div.md\\:hidden.fixed.bottom-0');
    const wa = bar.locator('a[href*="wa.me"]');
    const waHref = await wa.getAttribute('href');
    const tel = await bar.locator('a[href^="tel:"]').getAttribute('href');
    L('action bar wa:', decodeURIComponent(waHref || ''), 'tel:', tel);
    const names = { agartha: 'Agartha', syl: 'SYL', 'dates-county': 'Dates County' };
    if (!waHref || !decodeURIComponent(waHref).includes(names[id])) F('High', 'PDP/ActionBar', 'WhatsApp href lacks property text', id);
    if (tel !== 'tel:+919700144003') F('Medium', 'PDP/ActionBar', `tel href ${tel}`, id);
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(300);
    await bar.getByRole('button', { name: 'Enquire' }).click();
    await sleep(1200);
    const ct = await page.locator('#contact').evaluate(el => el.getBoundingClientRect().top);
    L('after Enquire: #contact top', ct, 'barBottom', await tabBar.evaluate(el => el.getBoundingClientRect().bottom));
    if (ct < (await tabBar.evaluate(el => el.getBoundingClientRect().bottom)) - 4) F('High', 'PDP/ActionBar', 'Enquire scrolls #contact under sticky bar', id);
    await shot(page, `26-pdp-${id}-mobile-enquire`);
    // Does the action bar overlap the footer / other fixed elements? Check bottom padding / Groot bubble overlap
    const fixed = await page.evaluate(() => [...document.querySelectorAll('*')].filter(e => getComputedStyle(e).position === 'fixed' && e.offsetWidth && e.offsetHeight).map(e => ({ cls: e.className.toString().slice(0, 60), r: e.getBoundingClientRect().toJSON() })));
    L('fixed elements:', fixed.map(f => `${f.cls} @ y${Math.round(f.r.y)} h${Math.round(f.r.height)} x${Math.round(f.r.x)} w${Math.round(f.r.width)}`));
  }
  // WhatsApp CTAs in invest panel
  L('invest wa links:', await page.locator('#insights a[href*="wa.me"]').evaluateAll(as => as.map(a => decodeURIComponent(a.getAttribute('href')).slice(0, 120))));
  // horizontal overflow?
  const hov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  L('horizontal overflow px:', hov);
  if (hov > 2) F('Medium', 'PDP/Layout', `horizontal overflow ${hov}px`, `${id} ${vp}`);
  reportDiag(`pdp-${id}-${vp}`);
  await ctx.close();
}

/* ───────────────────────── 8. contact ───────────────────────── */
if (want('contact')) for (const vp of ['mobile', 'desktop']) {
  L(`\n=== CONTACT ${vp} ===`);
  const ctx = await mk(vp);
  const page = await ctx.newPage();
  const rec = attach(page, `contact-${vp}`);
  await page.goto(BASE + '/contact', { waitUntil: 'networkidle' });
  L('h1:', await page.locator('h1').innerText());
  await shot(page, `30-contact-${vp}`, true);
  let form = page.locator('form');
  await form.getByLabel('Your name').fill('Audit');
  await form.getByRole('button', { name: /Send message/ }).click();
  await sleep(300);
  L('validation:', await form.locator('p.text-error').innerText().catch(() => 'none'));
  await form.getByLabel('Your email').fill('a@b.co');
  await form.getByRole('button', { name: /Send message/ }).click();
  try { await page.getByText('Thank you — message received.').waitFor({ timeout: 5000 }); OK('contact success'); } catch { F('High', 'Contact', 'no success', vp); }
  L('wa CTA in success:', await page.locator('a[href*="wa.me"]:visible').first().getAttribute('href'));
  await shot(page, `31-contact-success-${vp}`);
  L('posts:', rec.apiPosts);
  await page.goto(BASE + '/contact?interest=list-property&property=agartha', { waitUntil: 'networkidle' });
  L('h1 dev:', await page.locator('h1').innerText());
  form = page.locator('form');
  L('prefill interest:', await form.getByLabel('Interest').inputValue(), 'property:', await form.getByLabel('Property').inputValue());
  await shot(page, `32-contact-list-property-${vp}`);
  await page.goto(BASE + '/contact?interest=plots&property=dates-county', { waitUntil: 'networkidle' });
  L('prefill plots:', await page.locator('form').getByLabel('Interest').inputValue(), await page.locator('form').getByLabel('Property').inputValue());
  await page.goto(BASE + '/contact?interest=bogus&property=bogus', { waitUntil: 'networkidle' });
  L('bogus prefill:', await page.locator('form').getByLabel('Interest').inputValue(), await page.locator('form').getByLabel('Property').inputValue(), await page.locator('h1').innerText());
  const chan = await page.locator('a[href^="tel:"], a[href^="mailto:"], a[href*="wa.me"]').evaluateAll(as => as.map(a => a.getAttribute('href')));
  L('channels:', chan);
  reportDiag(`contact-${vp}`);
  await ctx.close();
}

/* ───────────────────────── 9. exits ───────────────────────── */
if (want('exits')) {
  L('\n=== EXITS ===');
  const ctx = await mk('mobile');
  const page = await ctx.newPage();
  attach(page, 'exits');
  for (const p of ['/', '/sanctuaries/agartha', '/contact']) {
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    const ext = await page.locator('a[href^="http"], a[href^="tel:"], a[href^="mailto:"]').evaluateAll(as => as.map(a => ({ h: decodeURIComponent(a.getAttribute('href')).slice(0, 140), t: a.getAttribute('target'), rel: a.getAttribute('rel'), label: (a.getAttribute('aria-label') || a.textContent.trim()).slice(0, 30) })));
    L(p, ext);
    for (const e of ext) {
      if (e.h.startsWith('http') && !e.h.includes('localhost') && e.t !== '_blank') F('Low', 'Exits', `external link without target=_blank: ${e.h}`, p);
      if (e.h.startsWith('https://wa.me/') && !/^https:\/\/wa\.me\/919700144003\?text=/.test(e.h)) F('Medium', 'Exits', 'malformed wa.me link', e.h);
    }
  }
  reportDiag('exits');
  await ctx.close();
}

/* ───────────────────────── 10. dark mode ───────────────────────── */
if (want('dark')) for (const vp of ['mobile', 'desktop']) {
  L(`\n=== DARK ${vp} ===`);
  const ctx = await mk(vp);
  const page = await ctx.newPage();
  attach(page, `dark-${vp}`);
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Toggle theme' }).click();
  await sleep(500);
  L('html.dark:', await page.evaluate(() => document.documentElement.classList.contains('dark')), 'ls:', await page.evaluate(() => localStorage.getItem('gt_dark')));
  await shot(page, `40-dark-home-${vp}`, true);
  for (const p of ['/list', '/sanctuaries/agartha', '/contact']) {
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    const dark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    L(p, 'dark persisted:', dark);
    if (!dark) F('Medium', 'Theme', 'dark mode not persisted across navigation', p);
    await shot(page, `41-dark-${p.replace(/\W+/g, '_')}-${vp}`, true);
  }
  // Crude contrast scan on PDP: text whose color is nearly the same as its nearest opaque background
  await page.goto(BASE + '/sanctuaries/agartha', { waitUntil: 'networkidle' });
  const low = await page.evaluate(() => {
    const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const [r, g, b, a = 1] = m[1].split(',').map(Number); return { r, g, b, a }; };
    const lum = ({ r, g, b }) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const bgOf = el => { let e = el; while (e) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0.9) return c; e = e.parentElement; } return { r: 255, g: 255, b: 255, a: 1 }; };
    const out = [];
    for (const el of document.querySelectorAll('p, span, h1, h2, h3, a, button, li, dt, dd, label')) {
      if (!el.textContent.trim() || el.children.length > 0 && el.childNodes.length !== 1) continue;
      const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
      const cs = getComputedStyle(el); const fg = parse(cs.color); if (!fg) continue;
      const bg = bgOf(el);
      const a = fg.a; const mix = { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a) };
      const l1 = lum(mix), l2 = lum(bg); const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      if (ratio < 3) out.push({ t: el.textContent.trim().slice(0, 50), ratio: +ratio.toFixed(2), color: cs.color, bg: `rgb(${bg.r},${bg.g},${bg.b})`, size: cs.fontSize });
    }
    return out.sort((a, b) => a.ratio - b.ratio).slice(0, 25);
  });
  L('low-contrast (<3:1) text on dark PDP:', low);
  reportDiag(`dark-${vp}`);
  await ctx.close();
}

/* ───────────────────────── light-mode contrast on home + list ───────────────────────── */
if (want('contrast')) for (const vp of ['mobile']) {
  L(`\n=== LIGHT CONTRAST ${vp} ===`);
  const ctx = await mk(vp);
  const page = await ctx.newPage();
  for (const p of ['/', '/list', '/sanctuaries/agartha']) {
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    const low = await page.evaluate(() => {
      const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const [r, g, b, a = 1] = m[1].split(',').map(Number); return { r, g, b, a }; };
      const lum = ({ r, g, b }) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
      const bgOf = el => { let e = el; while (e) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0.9) return c; e = e.parentElement; } return { r: 255, g: 255, b: 255, a: 1 }; };
      const out = [];
      for (const el of document.querySelectorAll('p, span, h1, h2, h3, a, button, li, dt, dd, label')) {
        if (!el.textContent.trim() || el.children.length > 0 && el.childNodes.length !== 1) continue;
        const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
        const cs = getComputedStyle(el); const fg = parse(cs.color); if (!fg) continue;
        const bg = bgOf(el);
        const a = fg.a; const mix = { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a) };
        const l1 = lum(mix), l2 = lum(bg); const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        if (ratio < 3) out.push({ t: el.textContent.trim().slice(0, 50), ratio: +ratio.toFixed(2), color: cs.color, bg: `rgb(${bg.r},${bg.g},${bg.b})`, size: cs.fontSize });
      }
      return out.sort((a, b) => a.ratio - b.ratio).slice(0, 20);
    });
    L(p, 'low-contrast light:', low);
  }
  await ctx.close();
}

await browser.close();
fs.writeFileSync(path.join(OUT, `log-${phases.join('-') || 'all'}.txt`), log.join('\n'));
L('\n=== FINDINGS ===');
for (const f of findings) L(`[${f.sev}] ${f.area}: ${f.summary} — ${f.evidence}`);
