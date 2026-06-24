# Tuning notes — caption-template.html per real-estate clip

The pipeline's only shot-to-shot variable is `caption-template.html`.
Everything else (`matte.py`, `composite.py`, `render-caps.cjs`,
`run.sh`) stays untouched.

## Editing checklist (5 fields per clip)

1. **`#beh1`, `#beh2`, `#beh3`** — the three CROWN phrases that sit
   ~50% above and ~50% behind the head. Use the values from the
   episode brief. Olive (#3a4a2c) or deep forest (#1a2410) tinted at
   85% opacity sits naturally against the green grade.

2. **`#fro1`, `#fro2`, `#fro3`** — the three FRONT RAIL lines at
   chest level. Wrap the HERO word in `<span class="hero">`. The
   hero class uses gold #c8a951 + italic Caladea — the brand's
   editorial signature.

3. **`render(t)` function** — set `t0/t1` to the actual speech
   boundaries from the audio. For 10-second clips with the
   measured-pace voice, expect ~3.2s per beat: 0–3.2, 3.2–6.4,
   6.4–10.0. Adjust per detected onset.

4. **`#behN { top: ... }`** — measure head-top Y from the first
   matte frame and set the crown's vertical center to that Y.
   For real estate (the curator's typical framing), head-top is
   usually around y=420–480 on a 1080×1920 plate. The default
   `top: 380px` covers most.

5. **`#bug`** — the Green Team leaf logo sits bottom-right at
   `right:80px; bottom:92px` with a 90px badge. That covers the
   Gemini sparkle at ~x552–628 / y1108–1184. If a future Omni
   build moves the watermark, adjust here.

## Brand-mark assets

- `public/logo-the-green-team-original.svg` — leaf mark (used for
  bottom-right bug). Render the white-on-transparent variant at
  90×90 px for the bug position.
- `public/logos/modcon-logo.svg` — only used in the outro card for
  property episodes (GT04, GT06).

## Outro card (`outro.html`)

The outro shows:
- Green Team leaf
- THE GREEN TEAM wordmark
- CHANNEL PARTNER caption (gold)
- thegreenteam.in URL

For property-specific episodes (GT04, GT06), the outro adds an
extra row above with the MODCON wordmark + property name. Use
`outro-modcon.html` instead of `outro.html` for those.

## Audio handling

Omni delivers clean audio. Optional one-pass:

```
ffmpeg -i raw.mp4 -af "loudnorm=I=-16:TP=-1.5:LRA=11" -c:v copy out.mp4
```

This normalizes the founder's voice to broadcast loudness without
re-encoding the video. Useful when episodes are batched and you
want consistent levels across the series.
