# Agartha reel — property only, no human on camera

24.6s vertical (1080×1920), your real voiceover, zero live-action human. Every
earlier cut that included a person is deleted from this folder, not just
superseded — the second Gemini clip showed a man standing static in frame
while unrelated audio played over him, which read as broken lip-sync because
it was: nothing was ever syncing his mouth to anything. Rather than try to
fake that, the human clip is gone and replaced with property-only motion.

## Files

| File | What it is |
| --- | --- |
| `agartha-reel-nohuman.mp4` | The reel — no captions. |
| `agartha-reel-nohuman-captioned.mp4` | Same reel with captions burned in at exact timing (see below). |
| `captions-exact.srt` | The exact-timed caption file on its own. |

## Timeline (24.6s total)

| Time | Content |
| --- | --- |
| 0–10s | Clip 1 as originally supplied — the arrival/property render, no person in it. |
| 10–20s | **New** — a 6-shot "hyper motion" Ken Burns sequence over your Agartha stills (`marketing/agartha-ugc/01–06*.jpg`), alternating zoom-in/zoom-out with a slight pan on each, ~1.67s per still. Property only. |
| 20–24.6s | Brand outro — the Green Team leaf mark scaling in on the site's actual primary green (`#2d3a1d`). |

## Audio

Your real uploaded recording (`naturepropertybuntystylevoiceoverenIN.wav`,
23.96s) is the sole audio track, padded with silence to the tail. Nothing was
time-stretched or reworked to fit a video — the video was rebuilt to fit the
real audio.

## Captions — exact, not estimated

Timing comes from `ffmpeg silencedetect` run directly on your `.wav`: long
gaps (≥0.85s) line up with the periods in the script, shorter ones with the
commas and the dash, and anything under 0.35s is a breath folded into
whichever line it sits inside. Every boundary in `captions-exact.srt` is a
timestamp that exists in the real recording.

No pricing, currency figures, or RERA numbers anywhere in frame or in the
script — the only number in the whole reel is the spoken "forty minutes."
