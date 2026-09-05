# Master prompt — Gemini video, matched to the directed cut

Five slots in the current edit are still Ken-Burns-over-a-still-photo. This
replaces each with real generated video, image-referenced to the exact
Agartha photo already in that slot, so the property stays identical — only
the motion becomes real.

**Upload the matching image as the reference for each generation.** Same
image already in `marketing/agartha-ugc/`, numbered below.

---

## Rules that apply to every single one of these (paste with every prompt)

```
STRICTLY NO on-screen text, captions, subtitles, watermark, logo, UI
elements, timestamps, or any overlay of any kind. Plain video only — nothing
rendered on top of the image. No text anywhere in the frame, spoken or
written. No people, no added figures, no vehicles or objects not already
present in the reference image. Photoreal, matching the reference image's
lighting, materials, and colour exactly — do not restyle, do not change
time of day, do not add or remove structural elements. Camera motion only:
no cuts, no transitions, no zoom-blur, no flash frames.
```

Keep this block byte-identical across all five generations — it's what keeps
the property looking like *your* property and not a reinterpretation of it.

---

## The five shots

### 1. Wide establishing — need: **2.14s** (generate the shortest your tool allows, e.g. 4s, then crop to the strongest continuous 2.14s)
Reference: `02-wide-establishing.jpg`
```
Slow lateral dolly, camera moving left to right at walking pace, revealing
the full biomorphic facade, curved ramp and open lawn. Handheld-smooth, not
a locked tripod shot — a very slight, natural drift, like a steadicam rather
than a static frame. Warm daylight, soft moving shade from unseen trees
passing over the building as the camera moves.
```

### 2. Bamboo arch path — need: **5.97s**
Reference: `03-bamboo-arch-path.jpg`
```
Continuous forward walking-pace push down the stone path under the bamboo
archway, planting in green and crimson brushing past on both sides close to
the lens. The camera keeps moving the entire duration — no holds, no pauses.
Dappled light shifting across the path as foliage passes overhead.
```

### 3. Hero — the living roof — need: **7.90s** (the longest hold in the edit; if your tool caps at less, generate two takes and I'll join them)
Reference: `01-hero-green-roof-house.jpg`
```
Slow continuous push-in toward the house, starting on the full facade and
ending closer on the ivy-covered living roof and the tree-shaped timber
door. Constant, unhurried forward motion for the entire duration — this is
a reveal, the roof should be the last and closest thing in frame. Flagstone
path and lily pond visible in the early frames, softly out of focus by the
end as the roof becomes the focus. Warm late-afternoon light.
```

### 4. Golden-hour fire pit — need: **2.77s**
Reference: `05-golden-hour-firepit.jpg`
```
Camera set low near the sunken fire pit, very slow push-in, golden hour
light raking long across the stone benches and pergola. Subtle movement in
the fire — embers, soft heat shimmer — everything else in the frame static
except the camera's slow drift forward.
```

### 5. Pergola courtyard — need: **2.23s**
Reference: `06-pergola-courtyard-detail.jpg`
```
Slow push toward the dark stone wall, terracotta pots and agave in the
pergola courtyard, shallow depth of field increasing as the camera nears —
background softens, foreground stone texture sharpens. Warm light raking
across the surface the whole time.
```

---

## Fitting the output into the edit

Video models don't usually hit an exact duration on request — generate the
shortest length your tool offers per shot, then trim to the number listed
above. Trim from wherever the motion is cleanest and most continuous, not
necessarily the start — a generation with a shaky first half-second is
common; crop that out rather than keeping frame 1 just because it's first.

Send the five files back in this chat, named or in this order, and I'll
drop them into the exact slots they replace, re-mux the real voiceover, and
rebuild both the clean and captioned exports — same edit, same timing, real
motion where the stills are now.
