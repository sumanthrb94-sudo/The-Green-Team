# Agartha reel — two videos, real footage only

Two separate deliverables in this folder now. They don't share footage or
audio — different clip, different voiceover, different purpose. Both are
1080×1920 (portrait), 30fps.

## Files

| File | What it is |
| --- | --- |
| `agartha-reel-directed.mp4` | The main 25.5s reel — no captions. |
| `agartha-reel-directed-captioned.mp4` | Same reel with captions burned in. |
| `agartha-aerial-reveal.mp4` | Standalone 18.1s piece: the aerial drone shot + its own voiceover + outro. |
| `captions-exact.srt` | Exact-timed captions for the main reel only. |

## `agartha-reel-directed.mp4` / `-captioned.mp4` — the main reel

25.5s, built from **5 real Gemini-generated clips run at generous, natural
lengths** (roughly 3.6–5.9s each) cut together as straight transitions,
synced to the original 23.96s voiceover
(`naturepropertybuntystylevoiceoverenIN.wav`) plus a 1.9s brand outro.

| Time | Shot | Source |
| --- | --- | --- |
| 0.0–4.73s | Arrival — thatched villa | real motion |
| 4.73–8.30s | Wide establishing | real motion |
| 8.30–12.67s | Bamboo arch path | real motion |
| 12.67–18.60s | Aerial drone reveal | real motion |
| 18.60–23.60s | Pergola courtyard | real motion |
| 23.60–25.50s | Brand outro | — |

An earlier version sliced these same 5 clips into short, line-matched
slivers (2–6s each, picked so each shot's exact duration matched one
specific spoken line). That was rejected — the clips are each ~10s of real
footage, more than enough to run as generous, natural-feeling transitions
without slicing them down to match every sentence. This version does that:
every shot is real motion end to end, no shot is confined to a single line,
and there's no fabricated content standing in for a shot that doesn't
exist. Two lines in the audio ("that roof is actually alive, that's grass
growing on top of the house") no longer have a shot built specifically for
them — whichever real clip is playing when that line lands is what's on
screen, same as any other line in the same shot's span. That's a
deliberate trade for "real footage only, generously used" over "a bespoke
shot for every line."

The `motion/` folder (HTML/CSS motion graphics for the living-roof and
golden-hour beats, built earlier when there was no real footage for those
angles) is no longer used in this cut — kept on disk since it's still a
valid technique if a future edit wants a bespoke shot for a beat with no
real video.

## `agartha-aerial-reveal.mp4` — the aerial shot, on its own

18.1s. One continuous real Gemini clip — an overhead drone shot pulling
back from a fire-pit courtyard to reveal the full twin-cottage property
inside its forest clearing — paired with its own voiceover
(`naturepropertyfourshotbuntystyleenIN_1.wav`, 16.2s), written specifically
to narrate this shot. This is a standalone piece, not part of the main
reel above.

The real clip is 10.0s; the voiceover runs 16.2s. Rather than freeze on
the last frame for the remaining 6.2s, the video continues with a slow,
subtle zoom on that final frame — same framing, no jump at the handoff —
so the shot keeps breathing until the 1.9s brand outro closes it out at
16.2s.

## Both videos

Every real clip carries a Green Team logo badge over its Gemini watermark,
sized and positioned to match the watermark's own footprint. The arrival
clip's badge sits at a different screen position than the other four
(925,1105 vs. 865,1683) — it's a blur-composited landscape source with its
watermark in a different spot, not an inconsistency.

No pricing, currency figures, or RERA numbers anywhere in either video.
