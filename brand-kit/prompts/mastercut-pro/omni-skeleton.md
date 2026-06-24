# LOCKED OMNI PROMPT SKELETON
## Real Estate Edition · The Green Team founder talking-head

Copy this verbatim into Gemini Omni. Swap only the bracketed `[YOUR LINE]`.
Do not vary wardrobe, framing, camera, or lighting language — that's
how the series stays cohesive and identity-stable across all 8
episodes (the same founder must be recognisable in GT01 and GT08).

---

```
Generate a photorealistic, cinematic vertical 9:16 talking-head video
at 1080×1920, 24fps, 8-10 seconds — the same confident, warm Indian
real-estate curator in his early 30s, neat hair, clean tidy face,
genuine measured expressions (calm authority, subtle brow lifts,
alive micro-expressions, NEVER salesy, NEVER excited hype); plain
forest-green or olive linen shirt (collar open), modern minimal
interior softly out of focus — wooden shelves with a few objects,
a single neutral painting, warm late-afternoon window light from
camera-left; head-and-shoulders, centered, generous negative space
above the hair AND around the head (required for the caption layers);
50mm look, eye level, locked-off and perfectly steady — no push,
no zoom, no drift, no parallax; he says: "[YOUR LINE]"; flattering
soft window key, healthy glowing skin, deep greens, filmic editorial
grade, slight golden highlight on the right cheek; warm closing
half-smile, half-second silent hold. Clean audio, no music.
ABSOLUTELY NO on-screen text, captions, watermarks, logos, or
graphics — completely clean plate.
```

---

## Why each phrase is locked

| Phrase | Why it's there |
|---|---|
| "the same … curator in his early 30s" | Identity anchor. The "same" word + age range = stable character across episodes. |
| "neat hair, clean tidy face" | Stops the model from generating stubble / messy hair drift between episodes. |
| "measured expressions, NEVER salesy" | Editorial real-estate voice. Big difference vs MasterCut original. |
| "forest-green or olive linen shirt (collar open)" | Brand wardrobe. Olive ties to the leaf-logo palette. |
| "wooden shelves, single neutral painting" | Curator-not-broker interior signal. |
| "generous negative space above the hair AND around the head" | Required for the 3D crown caption to land cleanly. |
| "50mm look, eye level, locked-off" | Permits matte alignment frame-to-frame for `composite.py`. |
| "no push, no zoom, no drift, no parallax" | Critical — any camera move breaks subject-matte registration. |
| "deep greens, filmic editorial grade" | Skin tone + brand grade. |
| "ABSOLUTELY NO … completely clean plate" | The matte + 3D caption pipeline requires a blank plate. |

## What changes per episode

Only the `[YOUR LINE]`. Always 8–10 seconds of speech, ~25–35 words,
delivered at a measured pace. The 3-beat caption split for each episode
is in the corresponding `series-prompts/GT0X.md`.
