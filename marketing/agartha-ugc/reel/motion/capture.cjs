// Renders a motion-graphic HTML file (see hero-motion.html / golden-motion.html)
// to an exact-length PNG frame sequence via headless Chromium.
//
// Usage: node capture.cjs <html-file> <frame-count> <out-dir>
// Then:  ffmpeg -framerate 30 -i <out-dir>/frame_%05d.png -frames:v <frame-count> \
//          -c:v libx264 -pix_fmt yuv420p -crf 18 out.mp4
//
// The HTML file must expose window.setFrame(ms) (see the two examples in this
// folder) so each screenshot lands on a deterministic point in the animation
// instead of relying on real-time playback + video recording.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const FPS = 30;
// Playwright's bundled Chromium download is skipped in some sandboxes
// (PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1); CHROMIUM_PATH points at a
// pre-installed browser in that case.
const CHROMIUM_PATH = process.env.CHROMIUM_PATH || undefined;

async function capture(htmlFile, frames, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch(CHROMIUM_PATH ? { executablePath: CHROMIUM_PATH } : {});
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.resolve(htmlFile));
  await page.waitForTimeout(150);
  for (let i = 0; i < frames; i++) {
    const ms = (i / FPS) * 1000;
    await page.evaluate((t) => window.setFrame(t), ms);
    const fname = path.join(outDir, `frame_${String(i).padStart(5, '0')}.png`);
    await page.screenshot({ path: fname });
  }
  await browser.close();
}

async function main() {
  const [, , htmlFile, frameCount, outDir] = process.argv;
  await capture(htmlFile, parseInt(frameCount, 10), outDir);
  console.log('done', htmlFile, frameCount, outDir);
}

main().catch((e) => { console.error(e); process.exit(1); });
