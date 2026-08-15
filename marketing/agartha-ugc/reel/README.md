# Agartha reel — directed cut, matched to the voiceover

25.5s vertical (1080×1920). Every cut lands on what the line playing at that
moment is actually about — this is an edit, not a montage of pretty shots
laid end to end.

## Files

| File | What it is |
| --- | --- |
| `agartha-reel-directed.mp4` | The reel — no captions. |
| `agartha-reel-directed-captioned.mp4` | Same reel with captions burned in at exact timing (see below). |
| `captions-exact.srt` | The exact-timed caption file on its own. |

## The edit — shot chosen because the line names it

| Time | Line | On screen | Why this shot |
| --- | --- | --- | --- |
| 0.0–2.6s | "I keep coming back to this one." | Clip 1 — real motion, arrival | Opens on actual camera movement, not a still — strongest hook |
| 2.6–4.7s | "Forty minutes out of Hyderabad," | **Wide establishing — real motion** | Location beat, slow reveal of the villa facade |
| 4.7–10.7s | "...loudest thing is the birds." / "This forest was already here —" | **Bamboo arch path — real motion** | Both lines are about the forest — one continuous walking-pace push down the path, not two arbitrary cuts |
| 10.7–18.6s | "they built around it." / "That roof is actually alive," / "...grass growing on top of the house." | Hero shot — the living roof (Ken Burns) | Three consecutive lines all describe this exact image. Held ~8s with a continuous slow push-in — this is the reveal, it earns the screen time |
| 18.6–21.4s | "Come see it yourself, at this hour." | Golden-hour fire pit (Ken Burns) | "This hour" is the line's whole joke — has to be golden hour on screen when it lands |
| 21.4–23.6s | "Message us, we'll walk you through it." | **Pergola courtyard — real motion** | Intimate closing beat, real camera push toward the stone wall and terracotta pots |
| 23.6–25.5s | (voice out) | Brand outro | Tail lands after the CTA, not competing with it |

Cut points sit in the real silence gaps between lines (from the same
`silencedetect` pass used for the captions) — cuts happen where the voice
actually pauses, not on an arbitrary clock.

Three of the six property shots are now real Gemini-generated video (wide
establishing, bamboo path, pergola courtyard) instead of Ken Burns over a
still — generated from `GEMINI-VIDEO-MASTER-PROMPT.md`, trimmed to the
continuous segment with the cleanest motion, then re-encoded to exactly the
duration each slot needs so the total runtime and every caption timestamp
stay unchanged. Each carries a small Green Team badge in the bottom-right
corner in place of the Gemini watermark, sized and positioned to match the
watermark's own footprint so it reads as an intentional brand mark. The
remaining two property shots (hero roof, golden-hour fire pit) are still
Ken Burns over the original stills — their prompts are in
`GEMINI-VIDEO-MASTER-PROMPT.md`, waiting on generation.

## Earlier attempts, now removed

Two prior generations lived in this folder and are gone, not just
superseded:

1. A cut that included a second Gemini clip — a man standing static in
   frame while the voiceover played over him. Removed entirely; nothing
   about that clip was ever going to sync.
2. A "hyper motion" cut that swapped his slot for six stills at fixed,
   even durations, alternating zoom in/out with no relationship to the
   audio. Property-only, but still just wallpaper — the shot changed
   because a clock ran out, not because the sentence changed. This file
   replaces it: every shot length here comes from how long its line
   actually takes to say, not a fixed grid.

## Audio

Your real uploaded recording (`naturepropertybuntystylevoiceoverenIN.wav`,
23.96s) is the sole audio track, padded with silence to the 25.5s tail.

No pricing, currency figures, or RERA numbers anywhere in frame or in the
script — the only number in the whole reel is the spoken "forty minutes."
