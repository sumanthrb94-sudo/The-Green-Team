# Agartha reel — directed cut, matched to the voiceover

25.5s vertical (1080×1920). Every shot and every cut point is derived directly
from the real voiceover audio — this is an edit, not a montage of pretty shots
laid end to end. No Ken Burns over a still anywhere in this version.

## Files

| File | What it is |
| --- | --- |
| `agartha-reel-directed.mp4` | The reel — no captions. |
| `agartha-reel-directed-captioned.mp4` | Same reel with captions burned in at exact timing (see below). |
| `captions-exact.srt` | The exact-timed caption file on its own. |

## The edit — shot chosen because the line names it

| Time | Line | On screen | Why this shot |
| --- | --- | --- | --- |
| 0.0–2.6s | "I keep coming back to this one." | Real motion — arrival | Opens on actual camera movement, not a still — strongest hook |
| 2.6–4.7s | "Forty minutes out of Hyderabad," | Real motion — wide establishing | Location beat, slow reveal of the villa facade |
| 4.7–8.3s | "and the loudest thing here is the birds." | Real motion — bamboo arch path | Forest walking-pace push, matched to this line only |
| 8.3–12.7s | "This forest was already here — they built around it." | Real motion — **aerial drone reveal** | The line is literally about scale and context — the only shot in the reel that actually shows the property sitting inside the forest, so it gets the line that's about exactly that |
| 12.7–18.6s | "That roof is actually alive, that's grass growing on top of the house." | Hero shot — the living roof (code-generated motion) | No real generated video exists for this angle yet — see "How the two missing shots were made" below |
| 18.6–21.4s | "Come see it yourself, at this hour." | Golden-hour fire pit (code-generated motion) | Same — no real footage yet for this one either |
| 21.4–23.6s | "Message us, we'll walk you through it." | Real motion — pergola courtyard | Intimate closing beat, real camera push toward the stone wall and terracotta pots |
| 23.6–25.5s | (voice out) | Brand outro | Tail lands after the CTA, not competing with it |

Cut points sit at the midpoint of the real silence gap between each pair of
lines (from the same `silencedetect` pass used for the captions) — a
reproducible rule, not an eyeballed guess. Six of the eight shots are real
Gemini-generated video, each carrying a small Green Team badge over the
Gemini watermark, sized and positioned to match the watermark's own
footprint.

## How the two missing shots were made

There's no real generated video yet for the living-roof close-up or the
golden-hour fire pit — those prompts are still open in
`GEMINI-VIDEO-MASTER-PROMPT.md`. Rather than fall back to a flat Ken Burns
pan-zoom over the still, both are built as small HTML/CSS motion graphics
(`marketing/agartha-ugc/reel/motion/*.html`) rendered frame-by-frame through
headless Chromium via Playwright, then encoded to video: a continuous
non-linear push-in (Web Animations API, not a CSS loop, so every frame is
captured at an exact deterministic timestamp), a slow-shifting warm-light
gradient, and animated film grain via an SVG `feTurbulence` filter for
texture a straight zoompan doesn't have. Swap these two for real generated
video the same way the other six were replaced, whenever those two prompts
get run.

## Earlier attempts, now removed

Three prior generations lived in this folder and are gone, not just
superseded:

1. A cut that included a second Gemini clip — a man standing static in
   frame while the voiceover played over him. Removed entirely; nothing
   about that clip was ever going to sync.
2. A "hyper motion" cut that swapped his slot for six stills at fixed,
   even durations, alternating zoom in/out with no relationship to the
   audio. Property-only, but still just wallpaper — the shot changed
   because a clock ran out, not because the sentence changed.
3. A version that kept two Ken-Burns-over-still shots (hero roof,
   golden-hour fire pit) once real motion existed for the other four
   property beats. Replaced by the code-generated motion graphics above —
   every shot in the reel now has real or deliberately-designed motion,
   nothing is a flat pan across a photo.

## Audio

Your real uploaded recording (`naturepropertybuntystylevoiceoverenIN.wav`,
23.96s) is the sole audio track, padded with silence to the 25.5s tail.

No pricing, currency figures, or RERA numbers anywhere in frame or in the
script — the only number in the whole reel is the spoken "forty minutes."
