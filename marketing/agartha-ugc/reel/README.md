# Agartha reel — two videos, motion-graphics production pass

Two separate deliverables in this folder. They don't share footage or
audio — different clip, different voiceover, different purpose. Both are
1080×1920 (portrait), 30fps, and both now carry: real 0.2s cross-dissolve
transitions between shots (not hard cuts), an HTML/CSS motion-graphics
treatment (Web Animations API + headless-Chromium capture, not a flat
`zoompan`) wherever there's no real video to show, and a mixed SFX bed
(wind ambience + transition whooshes, both CC0, sourced from GitHub).

## Files

| File | What it is |
| --- | --- |
| `agartha-reel-directed.mp4` | The main 25.5s reel — no captions. |
| `agartha-reel-directed-captioned.mp4` | Same reel with captions burned in. |
| `agartha-aerial-reveal.mp4` | Standalone 18.1s piece: the aerial drone shot + its own voiceover + outro. |
| `captions-exact.srt` | Exact-timed captions for the main reel only. |
| `motion/` | HTML/CSS motion-graphics sources + the Playwright capture script. |
| `sfx/` | The two CC0 source SFX files, licenses noted below. |

## `agartha-reel-directed.mp4` / `-captioned.mp4` — the main reel

25.5s, synced to the original 23.96s voiceover
(`naturepropertybuntystylevoiceoverenIN.wav`) plus a 1.9s brand outro. Every
shot and cut point is content-matched to the line playing over it.

| Time | Line | Shot | Source |
| --- | --- | --- | --- |
| 0.0–2.6s | "I keep coming back to this one." | Arrival — thatched villa | real motion |
| 2.6–4.73s | "Forty minutes out of Hyderabad," | Wide establishing | real motion |
| 4.73–8.30s | "loudest thing here is the birds." | Bamboo arch path | real motion |
| 8.30–12.67s | "This forest was already here — they built around it." | Aerial drone reveal | real motion |
| 12.67–18.60s | "roof is actually alive... grass growing on top of the house." | Living roof (HTML motion graphic) | still + animation |
| 18.60–21.37s | "Come see it yourself, at this hour." | Golden-hour fire pit (HTML motion graphic) | still + animation |
| 21.37–23.60s | "Message us, we'll walk you through it." | Pergola courtyard | real motion |
| 23.60–25.50s | (voice out) | Brand outro | — |

Four real Gemini clips, at generous line-length durations, plus the two
lines no real clip covers — living roof, golden-hour fire pit — filled by
`motion/hero-motion.html` and `motion/golden-motion.html`: a continuous
push driven by the Web Animations API (not a CSS loop, so every rendered
frame lands on an exact deterministic timestamp), a shifting warm-light
gradient, and animated film grain via an SVG `feTurbulence` filter,
captured frame-by-frame through headless Chromium and encoded to video.
There's a fifth real clip that shows both of these (a person talking to
camera in front of the green-roof house) and it's **deliberately
excluded** — no human-on-camera footage in this reel, per standing
instruction; the motion graphic fills that gap instead of using it.

**Every internal cut between the 7 content shots is a real 0.2s
cross-dissolve** (`ffmpeg xfade`, transition=fade), chained iteratively —
each merge step's actual output duration was measured before computing the
next transition's offset, rather than trusting hand-derived numbers. The
cut into the brand outro is left as a hard cut on purpose; a clean cut to
a distinct brand card reads as intentional, a dissolve into it wouldn't.

*Build note, for whoever touches this next:* the first pass at this
crossfade chain ran 1.27s long (26.77s instead of 25.5s) — extending every
clip's rendered duration at each crossfade-adjacent edge (needed so the
blend has real pixels to work with, not a frozen last frame) was correct,
but the offset formula used each merge step's *measured* duration rather
than the *target nominal* duration, so the extensions weren't actually
consumed by the overlap the way intended — they just passed through as
extra length. Fixed by trimming the surplus off the tail of the
pure-pergola region right before the outro cut, which conveniently landed
almost exactly where the last spoken line ends anyway. If you rebuild this
chain from scratch, drive the offsets off fixed target cumulative
durations, not measured ones, if you want the total to land exactly where
planned without a corrective trim after.

**Arrival clip fix (carried over from the previous pass):** built as a
direct vertical crop of its landscape source (`crop=405:720`, centered,
scaled up) rather than scaled-down-and-blur-padded — full-bleed sharp
portrait, no letterboxing. Its crop window falls entirely outside where
that source's Gemini watermark sits, so this shot carries no logo badge.

## `agartha-aerial-reveal.mp4` — the aerial shot, on its own

18.1s. One continuous real Gemini clip — an overhead drone shot pulling
back from a fire-pit courtyard to reveal the full twin-cottage property
inside its forest clearing — paired with its own voiceover
(`naturepropertyfourshotbuntystyleenIN_1.wav`, 16.2s), written specifically
to narrate this shot. Standalone piece, not part of the main reel above.

The real clip is 10.0s; the voiceover runs 16.2s. The remaining 6.2s is
`motion/aerial-ext-motion.html` — the clip's own last frame, animated with
a slow push-in (no translate; unlike a photo, this source has no extra
margin to drift into) plus the same warm-gradient/film-grain treatment as
the two motion-graphic shots above, so the extension reads as continued
motion rather than a freeze. Verified frame-by-frame that the handoff at
10.0s is seamless — same framing on both sides of the cut.

## SFX — both videos

A low ambient wind bed under the full runtime (fades in/out, ~-20dB
under the voice) plus a short whoosh right at the hard cut into the brand
outro. Both sources are CC0, found by searching GitHub specifically (not
freesound.org, which isn't directly fetchable here without API auth):

- `sfx/wind.ogg` — from
  [`github.com/Muges/ambientsounds`](https://github.com/Muges/ambientsounds),
  originally by felix.blume on Freesound, CC0, no attribution required.
- `sfx/ambi_swoosh.flac` — from Sonic Pi's sample library
  ([`sonic-pi-net/sonic-pi`](https://github.com/sonic-pi-net/sonic-pi)),
  public domain per that repo's own licensing.

Looked specifically for CC0 birdsong on GitHub to match "the loudest thing
here is the birds" — didn't find a verifiably-licensed one there, so it's
not in the mix. Wind is the only ambient bed; don't add unlicensed audio
later without checking it as carefully as these two were.

Mixed with `amix` + `alimiter`; both final files peak under -10dBFS, no
clipping.

## Both videos

Every real clip carries a Green Team logo badge over its Gemini watermark,
sized and positioned to match the watermark's own footprint — except the
arrival clip, whose watermark falls entirely outside its crop window (see
above), so it needs no badge at all.

No pricing, currency figures, or RERA numbers anywhere in either video.
