# Agartha reel — assembled cuts

Built from the two Gemini-generated clips you supplied, combined into a
vertical (1080×1920) ad with a brand outro. There are two generations here —
use the voiceover set, it supersedes the first pass.

## Use these — real voiceover, retimed to it (24.6s)

| File | What it is |
| --- | --- |
| `agartha-reel-voiceover.mp4` | Clip 1 (0–10s) + Clip 2 (10–20s) + brand outro (20–24.6s), audio track is **your real recorded voiceover** — no captions. |
| `agartha-reel-voiceover-captioned.mp4` | Same cut with captions burned in at **exact** timing, taken from the real audio's silence gaps, not an estimate. Safe-margined for Reels/TikTok/Shorts UI. |
| `captions-exact.srt` | The exact-timed caption file on its own. |

The outro grew from 2s to 4.6s to give the CTA line ("Message us, we'll walk
you through it") room to land over the brand card, matching how the real
recording actually paces out — the original 18s budget was a guess before any
real audio existed; the real file ran 23.96s.

### How the exact timing was built

`ffmpeg silencedetect` was run directly on your uploaded `.wav` to find every
real pause in the recording. Long gaps (≥0.85s) reliably line up with the
periods in the script; shorter gaps line up with commas and the dash. Gaps
under 0.35s inside a line are breaths, not caption breaks, and are folded into
whichever line they sit inside. Every caption boundary below is a timestamp
that actually exists in your audio — this is not the character-count estimate
from the first pass.

## First pass — superseded, kept for reference

| File | What it is |
| --- | --- |
| `agartha-reel-20s.mp4` | Original 20s cut, original clip ambience, no voiceover. |
| `agartha-reel-20s-captioned.mp4` | Same cut with captions at **estimated** timing (character-count spread over a guessed 18s window). |
| `captions.srt` | The estimated caption file. |

## Voiceover

Spoken track is your own uploaded recording — `naturepropertybuntystylevoiceoverenIN.wav`,
23.96s, 24kHz mono. Muxed in as the sole audio track (original clip ambience
was dropped for the voiceover cuts, so the voice sits clean with nothing
competing against it).

No pricing, currency figures, or RERA numbers appear anywhere in frame or in
the script — the only number in the whole reel is the spoken "forty minutes."
