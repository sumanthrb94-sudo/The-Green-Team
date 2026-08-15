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

25.5s, synced to the original 23.96s voiceover
(`naturepropertybuntystylevoiceoverenIN.wav`) plus a 1.9s brand outro. Every
shot and cut point is content-matched to the line playing over it.

| Time | Line | Shot | Source |
| --- | --- | --- | --- |
| 0.0–2.6s | "I keep coming back to this one." | Arrival — thatched villa | real motion |
| 2.6–4.73s | "Forty minutes out of Hyderabad," | Wide establishing | real motion |
| 4.73–8.30s | "loudest thing here is the birds." | Bamboo arch path | real motion |
| 8.30–12.67s | "This forest was already here — they built around it." | Aerial drone reveal | real motion |
| 12.67–18.60s | "roof is actually alive... grass growing on top of the house." | Living roof (photo, zoomed) | still |
| 18.60–21.37s | "Come see it yourself, at this hour." | Golden-hour fire pit (photo, zoomed) | still |
| 21.37–23.60s | "Message us, we'll walk you through it." | Pergola courtyard | real motion |
| 23.60–25.50s | (voice out) | Brand outro | — |

Four real Gemini clips, at generous line-length durations, plus a slow zoom
on the two reference photos for the two lines no real clip covers — the
living roof and the golden-hour fire pit. There's a fifth real clip (a
person talking to camera in front of the green-roof house) and it is
**deliberately excluded** — no human-on-camera footage goes in this reel,
per standing instruction; the photo-zoom fills that gap instead of the
excluded clip.

**Arrival clip fix:** earlier builds converted this from its landscape
source by scaling it down and filling the empty top/bottom with a blurred
copy of itself — technically 1080×1920, but visibly a smaller landscape
video pillarboxed inside a portrait frame. Rebuilt as a direct vertical
crop of the landscape source instead (`crop=405:720`, centered, then
scaled up) — full-bleed sharp portrait content, no blur bars. The crop
window also happens to fall entirely to the left of where this source's
Gemini watermark sits, so no logo badge is needed on this shot at all.

The two photo-zoom beats are a plain, confident Ken Burns push (scale
1.0→~1.15 over the shot, `zoompan`) — no grain, no vignette pass. An
earlier version of these two shots used a fancier HTML/CSS motion-graphic
treatment (grain, warm-gradient pulse); that's still in `motion/` if a
future edit wants it back, but it's not what's in the current cut.

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
sized and positioned to match the watermark's own footprint — except the
arrival clip, whose watermark falls entirely outside its crop window (see
above), so it needs no badge at all.

No pricing, currency figures, or RERA numbers anywhere in either video.
