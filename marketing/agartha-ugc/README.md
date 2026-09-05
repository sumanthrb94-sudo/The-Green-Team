# Agartha UGC ad kit

Reference stills and prompts for generating a short-form UGC video ad for
MODCON Agartha with Gemini.

- `AGARTHA-REEL-10SHOT.md` — **start here.** Ten-shot Instagram review reel:
  one image per generation, cut together. Use this when you want the property
  itself to carry the ad.
- `AGARTHA-UGC-PROMPTS.md` — the earlier talking-head pack: one-shot version,
  five-clip sequence, three script lanes, and fixes for the usual drift failures.
- `0*.jpg` — six backdrops, re-encoded from `public/gallery/agartha/*.webp`
  at 1440px. Numbered in the order the prompts refer to them.

These are architectural **renders**, not photographs of finished homes. Any ad
built from them must not imply completed construction, and — per the brief —
must carry no pricing, rates, appreciation figures or RERA numbers. Every
version lands on the free adviser call or WhatsApp instead.

Nothing here is served by the app; `marketing/` sits outside `public/` and is
not part of the deploy.
