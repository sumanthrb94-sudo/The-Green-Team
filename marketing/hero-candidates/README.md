# Homepage hero candidates

Four generated options for `public/hero-backdrop.jpg`. **02-god-rays is installed.**

Measured against what the slot actually demands — the backdrop renders at 55%
opacity behind a left-to-right dark gradient with the headline on the left:

| Candidate | Left 40% (headline zone) | Left noise | Right @55% opacity | Separation |
| --- | --- | --- | --- | --- |
| 01 golden hour | 15.2 | 6.1 | 48.4 | 5.31x |
| **02 god-rays (installed)** | **9.0** | **3.5** | 41.2 | **7.48x** |
| 03 dawn mist | 23.2 | 13.5 | **69.7** | 5.14x |
| 04 canopy | 12.2 | 11.5 | 50.0 | 6.85x |

Luminance 0-255. Lower left + lower noise = a cleaner substrate for white type.
Higher right@55% = the image still reads after the overlay darkens it.

**Why 02:** its headline zone is near-black at 9.0 with less than half the
texture of any other option. Its dimmer right side matters less than it looks —
the three property cards sit over that area on desktop, and on mobile the right
is cropped out entirely, so a calm dark left is worth more than a bright right.

**03 is the best photograph and the worst hero.** Brightest and busiest left, so
it fights the headline hardest. Kept for use elsewhere — it would make a strong
blog header or social card, where nothing is overlaid on it.

## Switching

    node scripts/set-hero.mjs marketing/hero-candidates/04-canopy.jpg
    rm -rf .next && npm run build

That regenerates the responsive variants and the image manifest together; the
home page is on ISR, so the rebuild is what actually publishes the change.
