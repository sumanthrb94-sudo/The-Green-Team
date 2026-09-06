// Static SEO parse of the saved server HTML (no JS executed) via a real DOM.
import { chromium } from 'playwright';
import fs from 'node:fs';

const S = '/tmp/claude-0/-home-user-The-Green-Team/de3e9eba-edd3-596d-a92c-fbc8b45665ba/scratchpad';
const ROUTES = ['/', '/list', '/explore/villas', '/explore/plots', '/explore/investments', '/sanctuaries/agartha', '/sanctuaries/syl', '/sanctuaries/dates-county', '/contact', '/contact?interest=list-property', '/standard', '/map', '/blog', '/blog/what-the-green-team-does', '/admin'];
const fname = p => S + '/html/' + p.replace(/[/?=]/g, '_') + '.html';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ javaScriptEnabled: false });
await ctx.route('**/*', r => r.abort());
const page = await ctx.newPage();
const out = {};
const seenTitles = {}, seenDesc = {};
for (const r of ROUTES) {
  const html = fs.readFileSync(fname(r), 'utf8');
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  const d = await page.evaluate(() => {
    const q = s => [...document.querySelectorAll(s)];
    const meta = n => q(`meta[name="${n}"],meta[property="${n}"]`).map(m => m.content);
    const ld = q('script[type="application/ld+json"]').map(s => { try { return { ok: true, json: JSON.parse(s.textContent) }; } catch (e) { return { ok: false, err: String(e), raw: s.textContent.slice(0, 200) }; } });
    const imgs = q('img');
    const noAlt = imgs.filter(i => !i.hasAttribute('alt')).map(i => i.getAttribute('src')?.slice(0, 80));
    const emptyAlt = imgs.filter(i => i.getAttribute('alt') === '').length;
    const heads = q('h1,h2,h3,h4,h5,h6').map(h => h.tagName + ': ' + h.textContent.trim().replace(/\s+/g, ' ').slice(0, 70));
    const links = q('a[href]').map(a => a.getAttribute('href'));
    const internal = links.filter(h => h.startsWith('/') && !h.startsWith('//'));
    const splash = document.querySelector('.gt-splash');
    const priorityImgs = imgs.filter(i => i.getAttribute('fetchpriority') === 'high').map(i => ({ src: i.getAttribute('src')?.slice(0, 60), sizes: i.getAttribute('sizes'), srcset: (i.getAttribute('srcset') || '').split(',').length, loading: i.getAttribute('loading') }));
    const preloads = q('link[rel="preload"][as="image"]').map(l => l.getAttribute('href')?.slice(0, 60) + ' sizes=' + l.getAttribute('imagesizes'));
    const noDims = imgs.filter(i => !i.hasAttribute('width') && !i.hasAttribute('height') && !(i.style.position === 'absolute')).length;
    const lazyCount = imgs.filter(i => i.getAttribute('loading') === 'lazy').length;
    return {
      lang: document.documentElement.getAttribute('lang'),
      title: document.title,
      titleCount: q('title').length,
      description: meta('description'),
      canonical: q('link[rel="canonical"]').map(l => l.href),
      robots: meta('robots'),
      og: { title: meta('og:title'), desc: meta('og:description'), image: meta('og:image'), url: meta('og:url'), type: meta('og:type') },
      tw: { card: meta('twitter:card'), title: meta('twitter:title'), image: meta('twitter:image') },
      ld,
      h1: q('h1').map(h => h.textContent.trim().replace(/\s+/g, ' ').slice(0, 80)),
      heads,
      imgCount: imgs.length, noAlt, emptyAlt, noDims, lazyCount, priorityImgs, preloads,
      linkCount: links.length, internalCount: internal.length, internalUnique: [...new Set(internal)].length,
      externalNoRel: q('a[target="_blank"]').filter(a => !/noopener|noreferrer/.test(a.rel)).length,
      splash: splash ? { role: splash.getAttribute('role'), ariaLive: splash.getAttribute('aria-live'), index: html_index(splash) } : null,
      h1BeforeSplashEnd: (() => { const h = document.querySelector('h1'); return h ? h.compareDocumentPosition(splash || h) : null; })(),
      textLen: document.body.innerText.length,
      wordCount: document.body.innerText.split(/\s+/).length,
    };
    function html_index(el) { return document.documentElement.outerHTML.indexOf(el.outerHTML.slice(0, 40)); }
  });
  d.htmlBytes = html.length;
  out[r] = d;
  (seenTitles[d.title] ||= []).push(r);
  (seenDesc[d.description[0]] ||= []).push(r);
}
await browser.close();
fs.writeFileSync(S + '/audit/seo/static.json', JSON.stringify(out, null, 1));
// Summary table
for (const [r, d] of Object.entries(out)) {
  console.log(`\n=== ${r}  (${(d.htmlBytes / 1024).toFixed(0)} KB html, ${d.wordCount} words)`);
  console.log(`title(${d.title.length}) [${d.titleCount}]: ${d.title}`);
  console.log(`desc(${(d.description[0] || '').length}) x${d.description.length}: ${(d.description[0] || '').slice(0, 170)}`);
  console.log(`canonical: ${JSON.stringify(d.canonical)} robots: ${JSON.stringify(d.robots)} lang: ${d.lang}`);
  console.log(`og: title=${JSON.stringify(d.og.title)} image=${JSON.stringify(d.og.image)} url=${JSON.stringify(d.og.url)} type=${d.og.type} | tw: ${d.tw.card} img=${JSON.stringify(d.tw.image)}`);
  console.log(`ld-json x${d.ld.length}: ${d.ld.map(l => l.ok ? l.json['@type'] : 'INVALID:' + l.err).join(', ')}`);
  console.log(`h1 x${d.h1.length}: ${JSON.stringify(d.h1)}`);
  console.log(`headings: ${d.heads.slice(0, 40).join(' | ')}`);
  console.log(`imgs ${d.imgCount}, noAlt ${d.noAlt.length} ${JSON.stringify(d.noAlt.slice(0, 5))}, emptyAlt ${d.emptyAlt}, noDims ${d.noDims}, lazy ${d.lazyCount}; priority: ${JSON.stringify(d.priorityImgs)}; preloads: ${JSON.stringify(d.preloads)}`);
  console.log(`links ${d.linkCount}, internal ${d.internalCount} (${d.internalUnique} unique), blank-no-rel ${d.externalNoRel}; splash: ${JSON.stringify(d.splash)}`);
}
console.log('\nDUP TITLES', Object.entries(seenTitles).filter(([, v]) => v.length > 1));
console.log('DUP DESCS', Object.entries(seenDesc).filter(([, v]) => v.length > 1));
