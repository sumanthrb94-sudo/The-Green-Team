# Brand Mint Studios · Green Team Video Engine

Production pipeline for 15–17s vertical Reels in the **v21-empires-beast** system.

Sub-brand: **The Green Team** — independent forest-real-estate curator, Hyderabad.
Parent system: **Brand Mint Studios** (`AI-VIDEO-GENERATION-BRIEF.md`).

## Output spec
- **1080 × 1920 · 60fps · H.264 · CRF 18** (MP4, faststart, AAC stereo)
- **120 BPM canonical**, parameterizable via `--bpm`
- Voiceless — music + on-screen type only (per brief Section 11)
- Each episode renders to ~2.4 MB (well under the 3 MB Reels comfort limit)

## Files

| File | Role |
|---|---|
| `_lib.py` | Brand Mint primitives: palette, beat grid, easing, SVG helpers (text, stat chip, builder card, hand arrow, hand circle), render driver, click-track audio synth, ffmpeg mux. |
| `build_gt_ep01_aqi.py` | EP01 spotlight — "Only 1 in 100 has AQI < 25" → MODCON Agartha reveal. |
| `build_gt_ep02_sanctuaries.py` | EP02 countdown — 3 sanctuaries ranked, Agartha wins. |
| `build_gt_ep03_syl37.py` | EP03 spotlight — "+37% in 18 months" → SYL Residences pre-investor. |

## How to render

```bash
python3 brand-kit/video/build_gt_ep01_aqi.py            # default 120 BPM
python3 brand-kit/video/build_gt_ep02_sanctuaries.py
python3 brand-kit/video/build_gt_ep03_syl37.py
```

Per-episode flags:
```bash
python3 brand-kit/video/build_gt_ep01_aqi.py --bpm 128  # re-render at 128 BPM
```

Each script writes to `out/`:
- `frames_<slug>/f%05d.png` — 60fps PNG sequence
- `_audio_<slug>.wav` — 120 BPM click track (kick + click, ducked -3 dB)
- `brandmint-<slug>-silent.mp4` — silent video (use this in CapCut)
- `brandmint-<slug>-120bpm.mp4` — final mux with click track

Captions + meta live in `posts-ready/post-<slug>/`.

## Beat sync workflow

The pipeline locks the visual grid to the chosen BPM. Two ways to use the output:

1. **Drop your IG-licensed track on top.** Use `brandmint-<slug>-silent.mp4` in
   CapCut / Premiere / Resolve. Pick any track at the same BPM (default 120).
   The visual beats already align — your track's downbeats will land on cuts.
2. **Use the click track as a guide.** `brandmint-<slug>-120bpm.mp4` ships
   with a metronome reference. Match your final music to its tempo, then
   replace the audio track.

To re-render at a different BPM (e.g. you found a 128 BPM song):
```bash
python3 brand-kit/video/build_gt_ep01_aqi.py --bpm 128 --length 14.5
```
Adjust `--length` to keep ~32 beats total (`length_s = 32 * 60 / bpm`).

## Design system

Lifted directly from `src/index.css`:

**Colors (Green Team tokens):**
- `GT_OLIVE_800` `#2d3a1d` — primary olive (brand)
- `GT_OLIVE_900` `#1a2410` — deep olive (forest section, reveal stage)
- `GT_CREAM` `#faf9f6` — paper / light background
- `GT_SAGE` `#a3b18a` — accent (dark theme primary)
- `GT_GOLD` / `GT_GOLD_LIGHT` `#b8860b` / `#c8a951` — premium accents
- `GT_TERRACOTTA` `#8a3d36` — warm contrast / annotations

**Fonts:**
- Display: **Inter Display** (≈ site's Manrope, fallback `Inter`, then `DejaVu Sans`)
- Body: **Inter**
- Serif (editorial pull quotes): **Caladea** (≈ site's Cormorant Garamond)
- Mono: **JetBrains Mono** → `DejaVu Sans Mono`

Install on the render host:
```bash
apt-get install -y fonts-inter fonts-crosextra-caladea
fc-cache -f
```

**Photography (lifted from `public/`):**
- `public/hero-backdrop.jpg` — forest backdrop (HOOK)
- `public/agartha-render.jpg` — aerial render (AWARD)
- `public/gallery/agartha/11.webp` — biophilic house (STATS)
- `public/gallery/agartha/22.webp` — villa render (WINNER REVEAL)
- `public/gallery/syl/1776279315359.webp` + `1776279320251.webp` — SYL biophilic interiors
- `public/gallery/dates-county/temple.jpg` + `forest.jpg` — Dates County
- `brand-kit/logo/the-green-team-monogram.svg` — sub-brand monogram (CTA)

## Brand Mint canon — hard constraints honored

- ✅ No founder face. No competitor names. No invented numbers.
- ✅ Every stat sourced (`thegreenteam.in` site copy + Outlook Business 2024 + RERA P02400002648 / P02400003813).
- ✅ Sub-brand uses its own canonical SVG monogram (`brand-kit/logo/the-green-team-monogram.svg`) — never code-drawn.
- ✅ No emoji in captions.
- ✅ Voice: no banned phrases (`amazing`, `literally`, `game-changer`, etc.).
- ✅ Safe text width 960px respected on all frames.
- ✅ Frame-1 hook visible at t=0 (no fade-in on the headline).
- ✅ White flash + camera shake at every impact beat.
- ✅ Hand-drawn red arrows + circles on every key callout.

## Adding a new episode

1. Copy `build_gt_ep01_aqi.py` to `build_gt_ep04_<slug>.py`.
2. Fill the content brief docstring at the top (Section 7 of the master brief).
3. Verify every claim against a public source — refuse if unverified.
4. Define beat sheet + impact beats.
5. Implement `frame(t_norm, t)` returning the body SVG per time segment.
6. `main()` registers the `RenderSpec` and calls `render_video(...)`.
7. Render → review frames → polish → commit.
