"""Check everything a live conversation needs, before you're in front of a client.

    python3 -m tools.preflight

Exercises the real APIs with the real credentials — the failures this catches
(bad key, wrong voice id, unreachable LLM) are exactly the ones that otherwise
surface as thirty seconds of silence during a demo.
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request

TTS_URL = "https://api.sarvam.ai/text-to-speech"
PASS, FAIL, WARN = "  ok  ", " FAIL ", " warn "


class Check:
    def __init__(self) -> None:
        self.failed = 0
        self.warned = 0

    def ok(self, name: str, detail: str = "") -> None:
        print(f"[{PASS}] {name}" + (f" — {detail}" if detail else ""))

    def fail(self, name: str, detail: str, fix: str = "") -> None:
        self.failed += 1
        print(f"[{FAIL}] {name} — {detail}")
        if fix:
            print(f"         fix: {fix}")

    def warn(self, name: str, detail: str) -> None:
        self.warned += 1
        print(f"[{WARN}] {name} — {detail}")


def _post(url: str, payload: dict, headers: dict, timeout: int = 60):
    req = urllib.request.Request(
        url, data=json.dumps(payload).encode(), headers=headers, method="POST"
    )
    with urllib.request.urlopen(req, timeout=timeout) as res:
        return json.loads(res.read())


def check_env(c: Check) -> str | None:
    key = os.getenv("SARVAM_API_KEY")
    if not key:
        c.fail("SARVAM_API_KEY", "not set",
               "export SARVAM_API_KEY=... or set it in voice-agent/.env")
        return None
    c.ok("SARVAM_API_KEY", f"set ({len(key)} chars)")
    return key


def check_tts(c: Check, key: str) -> None:
    voice = os.getenv("SARVAM_VOICE_ID", "anushka")
    model = os.getenv("SARVAM_TTS_MODEL", "bulbul:v3")
    headers = {"api-subscription-key": key, "Content-Type": "application/json"}
    payload = {
        "text": "నమస్కారం సర్.",
        "target_language_code": "te-IN",
        "speaker": voice,
        "model": model,
    }

    started = time.perf_counter()
    try:
        body = _post(TTS_URL, payload, headers)
    except urllib.error.HTTPError as err:
        detail = err.read().decode(errors="replace")[:200]
        if err.code in (401, 403):
            c.fail(f"TTS {model}", f"auth rejected: {detail}",
                   "check the key is live and has credits")
        elif "speaker" in detail.lower() or "voice" in detail.lower():
            c.fail(f"TTS voice '{voice}'", detail,
                   "run tools.voice_preview to find a working speaker id")
        else:
            c.fail(f"TTS {model}", f"HTTP {err.code}: {detail}")
        return
    except urllib.error.URLError as err:
        c.fail("TTS", f"network: {err.reason}")
        return

    ms = (time.perf_counter() - started) * 1000
    audios = body.get("audios") or body.get("audio")
    if not audios:
        c.fail(f"TTS {model}", f"no audio returned: {json.dumps(body)[:200]}")
        return

    c.ok(f"TTS {model}", f"voice '{voice}', {ms:.0f} ms for one short line")
    if voice in ("anushka", "vidya", "manisha", "abhilash"):
        c.warn("voice", f"'{voice}' is a stock speaker — clone a real voice "
                        "before showing this to a client")


def check_llm(c: Check, key: str) -> None:
    provider = os.getenv("LLM_PROVIDER", "sarvam").lower()
    if provider == "gemini":
        if os.getenv("GOOGLE_API_KEY"):
            c.ok("LLM", "gemini configured")
        else:
            c.fail("LLM", "LLM_PROVIDER=gemini but GOOGLE_API_KEY is not set")
        return

    base = os.getenv("SARVAM_LLM_BASE_URL", "https://api.sarvam.ai/v1")
    model = os.getenv("SARVAM_LLM_MODEL", "sarvam-30b")
    try:
        body = _post(
            f"{base.rstrip('/')}/chat/completions",
            {"model": model,
             "messages": [{"role": "user", "content": "Reply with the word OK."}],
             "max_tokens": 5},
            {"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            timeout=45,
        )
    except urllib.error.HTTPError as err:
        c.fail(f"LLM {model}", f"HTTP {err.code}: {err.read().decode(errors='replace')[:200]}",
               "check SARVAM_LLM_MODEL and SARVAM_LLM_BASE_URL")
        return
    except urllib.error.URLError as err:
        c.fail(f"LLM {model}", f"network: {err.reason}")
        return

    reply = (body.get("choices") or [{}])[0].get("message", {}).get("content", "")
    c.ok(f"LLM {model}", f"replied {reply.strip()[:30]!r}")


def check_pipeline(c: Check) -> None:
    """The parts that need no network — cheap, and they catch config drift."""
    try:
        from agent.prompt import PORTFOLIO, build_system_prompt
        from telugu.normalize import normalize
    except ImportError as err:
        c.fail("imports", str(err), "pip install -r requirements.txt")
        return

    out = normalize("ధర ₹68.7 L, AQI 12")
    if any(ch.isdigit() for ch in out):
        c.fail("normalizer", f"digits survived: {out}")
    else:
        c.ok("normalizer", "digits and initialisms converted to Telugu words")

    prompt = build_system_prompt(project=PORTFOLIO, channel="web")
    missing = [n for n in ("Agartha", "SYL Residences", "Dates County")
               if n not in prompt]
    if missing:
        c.fail("prompt", f"missing projects: {', '.join(missing)}")
    else:
        c.ok("prompt", f"all three projects loaded, {len(prompt)} chars")

    if os.getenv("RERA_AGENT_REG_NO"):
        c.ok("RERA", "registration number set")
    else:
        c.warn("RERA", "no agent registration number — the agent will defer "
                       "if asked, which is correct until TG-RERA clears")


def main() -> None:
    print("\nPreflight — Telugu voice agent\n")
    c = Check()

    check_pipeline(c)
    key = check_env(c)
    if key:
        check_tts(c, key)
        check_llm(c, key)

    print()
    if c.failed:
        print(f"{c.failed} failure(s) — fix these before the demo.\n")
        sys.exit(1)
    if c.warned:
        print(f"ready, with {c.warned} warning(s).\n")
    else:
        print("ready.\n")


if __name__ == "__main__":
    main()
