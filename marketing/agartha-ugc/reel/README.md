# Agartha 20s reel — assembled cut

Built from the two Gemini-generated clips you supplied, combined into a single
20-second vertical (1080×1920) ad with a brand outro.

## Files

| File | What it is |
| --- | --- |
| `agartha-reel-20s.mp4` | The assembled 20s reel, no captions. Clip 1 (0–9s) + Clip 2 (9–18s) + 2s brand outro (18–20s). Original ambient audio from both source clips is kept and cross-faded. |
| `agartha-reel-20s-captioned.mp4` | Same cut with burned-in captions of the voiceover script, safe-margined for Reels/TikTok/Shorts UI. |
| `captions.srt` | The caption file on its own, editable in any editor. |

## How it was built

1. Your two uploads were each normalized to 1080×1920 and trimmed to 9s:
   - the landscape clip got a blurred-fill background so nothing was cropped
     or stretched;
   - the portrait clip was scaled and center-cropped to fill the frame.
2. A 2-second brand outro was generated from `logo-the-green-team-original.svg`
   — the leaf mark scales and fades in on the site's actual primary green
   (`#2d3a1d`) — and appended.
3. Captions were burned in at an **estimated** timing: durations are
   distributed across the script by character count, which approximates
   natural speech pacing but is not a real transcript alignment.

## The one honest limitation

This container's network access is proxied and blocks the model-hosting
endpoints, so no local transcription tool could load — the captions here are
timed by estimate, not by aligning to the real spoken audio.

**Two ways to get exact sync**, both quick:

1. **Fastest** — drop `agartha-reel-20s.mp4` (or the ElevenLabs voiceover
   take) into CapCut / Premiere / any editor with auto-captions. Both
   transcribe and time-align in under a minute and let you nudge word-by-word.
2. Re-export the ElevenLabs voiceover from its flow, run it through any
   transcription service you have access to (browser-based Whisper, an
   external API), and I can rebuild `captions.srt` from the real timestamps
   if you paste them back.

## Voiceover

The spoken track was generated separately via ElevenLabs (voice: *Halle —
Natural Lifestyle Influencer*, chosen for its lifestyle-reel register) from
the exact script burned into the captions here. Open the flow to listen,
regenerate with a different voice, or download the audio: it renders as an
editable canvas rather than a plain file, so grab it from there and drop it
under `agartha-reel-20s.mp4` in your editor — the visual cut has no
voiceover baked in on purpose, so you can swap voices without re-rendering
video.

No pricing, currency figures, or RERA numbers appear anywhere in frame or in
the script — the only number in the whole reel is the spoken "forty minutes."
