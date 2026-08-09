"""Render the Telugu script through Sarvam voices so you can pick one.

This is the first thing to run. Everything else in this repo is plumbing until
you know which voice you're shipping.

    export SARVAM_API_KEY=...
    python3 -m tools.voice_preview                    # 3 clips x 4 voices
    python3 -m tools.voice_preview --all              # all 17 clips
    python3 -m tools.voice_preview --voices anushka,vidya --clips 05-proof-price

Writes .wav files to out/ named <voice>__<clip>.wav. Listen on a phone
speaker, not studio monitors — the call is 8 kHz and that is what your
customer hears.
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

API_URL = "https://api.sarvam.ai/text-to-speech"
CLIPS = Path(__file__).resolve().parents[2] / "scripts/voice/modcon-telugu-cold-call.clips.json"
OUT = Path(__file__).resolve().parent.parent / "out"

# bulbul:v3 speakers. The v2 names (anushka, vidya, manisha, abhilash) are
# rejected by v3. Full v3 list includes aditya, ritu, ashutosh, priya, neha,
# rahul, pooja, rohan, simran, kavya, amit, dev. These four are worth
# auditioning for a female sales register; swap in your cloned id when you
# have one.
DEFAULT_VOICES = ["priya", "kavya", "ritu", "neha"]

# The clips that expose the most failure modes: numerals + initialisms,
# warmth under pushback, and the flat voicemail register.
DEFAULT_CLIPS = ["01-opening", "05-proof-price", "07c-price"]


def load_clips() -> list[dict]:
    if not CLIPS.exists():
        sys.exit(f"clips file not found: {CLIPS}")
    return json.loads(CLIPS.read_text())["clips"]


def synth(text: str, voice: str, model: str, api_key: str) -> bytes:
    """One TTS request. Returns WAV bytes.

    Sarvam has moved the text field between API versions, so try the current
    shape and fall back rather than failing on a field name.
    """
    headers = {
        "api-subscription-key": api_key,
        "Content-Type": "application/json",
    }
    base = {
        "target_language_code": "te-IN",
        "speaker": voice,
        "model": model,
        "enable_preprocessing": False,
    }

    last_error = None
    for payload in ({**base, "text": text}, {**base, "inputs": [text]}):
        req = urllib.request.Request(
            API_URL, data=json.dumps(payload).encode(), headers=headers, method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=90) as res:
                body = json.loads(res.read())
        except urllib.error.HTTPError as err:
            detail = err.read().decode(errors="replace")[:400]
            last_error = f"HTTP {err.code}: {detail}"
            # 401/403 is a key problem, not a schema problem — stop retrying.
            if err.code in (401, 403):
                break
            continue
        except urllib.error.URLError as err:
            sys.exit(f"network error reaching Sarvam: {err.reason}")

        audios = body.get("audios") or body.get("audio")
        if not audios:
            last_error = f"no audio in response: {json.dumps(body)[:300]}"
            continue
        return base64.b64decode(audios[0] if isinstance(audios, list) else audios)

    raise RuntimeError(last_error or "unknown TTS failure")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--voices", default=",".join(DEFAULT_VOICES),
                        help="comma-separated Sarvam speaker ids, or your cloned voice id")
    parser.add_argument("--clips", default=",".join(DEFAULT_CLIPS),
                        help="comma-separated clip ids from the clips json")
    parser.add_argument("--all", action="store_true", help="render every clip")
    parser.add_argument("--model", default=os.getenv("SARVAM_TTS_MODEL", "bulbul:v3"))
    parser.add_argument("--out", default=str(OUT))
    args = parser.parse_args()

    api_key = os.getenv("SARVAM_API_KEY")
    if not api_key:
        sys.exit("SARVAM_API_KEY is not set.\n"
                 "    export SARVAM_API_KEY=...   then run this again.")

    all_clips = load_clips()
    wanted = None if args.all else set(args.clips.split(","))
    clips = [c for c in all_clips if wanted is None or c["id"] in wanted]
    if not clips:
        sys.exit(f"no clips matched {args.clips}. Available: "
                 + ", ".join(c["id"] for c in all_clips))

    voices = [v.strip() for v in args.voices.split(",") if v.strip()]
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    total = len(voices) * len(clips)
    print(f"\nRendering {len(clips)} clip(s) x {len(voices)} voice(s) "
          f"= {total} files, model {args.model}\n")

    written = failed = 0
    for voice in voices:
        for clip in clips:
            path = out_dir / f"{voice}__{clip['id']}.wav"
            try:
                path.write_bytes(synth(clip["text"], voice, args.model, api_key))
                written += 1
                print(f"  ok    {path.name}  ({clip['label']})")
            except RuntimeError as err:
                failed += 1
                print(f"  FAIL  {voice} / {clip['id']}: {err}")

    print(f"\n{written} written, {failed} failed → {out_dir}")
    if written:
        print("\nListen through a phone speaker, not monitors. Score against the")
        print("checklist in scripts/voice/modcon-telugu-cold-call.md — numerals,")
        print("initialisms, the సర్ at clause ends, and warmth on 07c-price.\n")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
