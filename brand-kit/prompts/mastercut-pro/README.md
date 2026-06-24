# MasterCut Pro — Real Estate Edition
## Brand Mint Studios · The Green Team series

This folder is the **real-estate adaptation** of the MasterCut Pro
pipeline used for Brand Mint's Episodes 08–11. The architecture is
identical — same matte / 3D caption / grade / bug-over-watermark /
outro chain — but the prompt skeleton and the series voice are tuned
for forest-adjacent editorial real estate (The Green Team channel
partnering for MODCON Builders' AGARTHA project).

When you run the existing `scripts/run.sh` in this clip's directory,
drop the raw Omni clip in and you get a finished reel out. The only
thing that changes shot-to-shot is `caption-template.html` (text +
beat timing) and the spoken line in the Omni prompt.

## What's in this folder

| File | Role |
|------|------|
| `README.md` | This file. |
| `omni-skeleton.md` | The locked talking-head prompt — swap only the **LINE** + the **3-beat split**. |
| `tuning-notes.md` | How to nudge `caption-template.html` per clip (head-Y, beat timing, bug placement). |
| `series-prompts/GT01–GT08.md` | 8 ready-to-run episode briefs. Each file has: spoken line, 3 caption beats with crown / front / hero, and a 1-line hook. |

## Brand-voice differences vs Brand Mint Studios

| | Brand Mint (web / app) | The Green Team (real estate) |
|---|---|---|
| Wardrobe | Charcoal tee | Forest-green or olive linen shirt / blazer |
| Interior | Design studio, mint accents | Wooden shelves, single neutral painting, warm window |
| Pacing | Confident, brisk | Measured, calm authority |
| Hero color | Mint #00C896 | Gold #c8a951 |
| Crown color | Green | Olive (darker) |
| Vibe | Founder energy | Curator quietude |

## The locked Omni prompt skeleton

See `omni-skeleton.md`. Copy it verbatim, swap only:
- `[YOUR LINE]` — the founder's spoken line (8–10s of speech, ~25–35 words)
- nothing else

## The series at a glance

| Ep | Topic | Heroes (caption payoff words) |
|----|-------|------|
| GT01 | What a channel partner does | tour → check → curate |
| GT02 | The forest filter | acres → AQI → filter |
| GT03 | The institutional reality | hype → reserve → records |
| GT04 | Why AGARTHA specifically | mist → mark → AGARTHA |
| GT05 | Pricing transparency | numbers → contracts → honest |
| GT06 | ₹237 cr Raidurgam vs ₹3 cr forest | 237 → 3 → choice |
| GT07 | What we never sell | flip → assured → never |
| GT08 | The DM workflow | comment → brief → DM |

Each episode caps at 10s of speech. Same 3-beat formula every time
so viewers can finish a beat and swipe to the next reel without
losing the hero word.

## Reuse

Run anywhere — open the relevant `GT0X.md`, paste the spoken line
into Gemini Omni, paste the 3-beat split into `caption-template.html`,
then `./run.sh raw.mp4`. The final reel is broadcast-ready.
