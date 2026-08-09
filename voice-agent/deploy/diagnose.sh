#!/usr/bin/env bash
# One command that collects everything needed to work out what is wrong.
# Run it AFTER trying to talk to the agent, in a second Cloud Shell tab:
#
#     bash deploy/diagnose.sh
#
# Then paste the whole output. It contains no secrets — the API key is
# reported only by length.

AGENT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${AGENT}" || exit 1
LOG=/tmp/voice-agent.log

echo "======================= VOICE AGENT DIAGNOSE ======================="
echo "commit:   $(git rev-parse --short HEAD 2>/dev/null) $(git log -1 --format=%s 2>/dev/null | cut -c1-60)"
echo "branch:   $(git rev-parse --abbrev-ref HEAD 2>/dev/null)"
echo "python:   $(python3 --version 2>&1)"
echo "venv:     $([[ -d .venv ]] && echo present || echo MISSING)"
echo "key set:  $([[ -n "${SARVAM_API_KEY:-}" ]] && echo "yes (${#SARVAM_API_KEY} chars)" || echo NO)"
echo "voice:    ${SARVAM_VOICE_ID:-priya (default)}"
echo "llm:      ${SARVAM_LLM_MODEL:-sarvam-105b-conversations (default)}"
echo "vad:      ${VAD_PROFILE:-balanced (default)}"

echo
echo "--- network distance to Sarvam (India) ---"
for i in 1 2 3; do
  t=$(curl -s -o /dev/null -w '%{time_total}' --max-time 10 https://api.sarvam.ai/ 2>/dev/null)
  echo "  attempt ${i}: ${t}s"
done
echo "  (over ~0.3s means this shell is far from Sarvam; every turn pays it 3x)"

echo
echo "--- is the agent running? ---"
if curl -sf --max-time 5 http://localhost:8080/healthz >/dev/null 2>&1; then
  echo "  yes — $(curl -s --max-time 5 http://localhost:8080/healthz)"
else
  echo "  NO. Nothing is listening on :8080."
  echo "  Start it in the other tab:  bash deploy/cloudshell.sh"
fi

echo
echo "--- conversation (what it heard / what it said) ---"
if [[ -f "${LOG}" ]]; then
  grep -E "CALLER »|AGENT  »" "${LOG}" | tail -20 || echo "  (none yet)"
  [[ -z "$(grep -cE 'CALLER »' "${LOG}" 2>/dev/null | grep -v '^0$')" ]] && \
    echo "  NOTE: no CALLER lines means the mic audio never reached the agent."
else
  echo "  no log at ${LOG} — restart with deploy/cloudshell.sh and try again"
fi

echo
echo "--- latency per turn ---"
[[ -f "${LOG}" ]] && grep -E "time-to-first-audio" "${LOG}" | tail -8

echo
echo "--- errors ---"
[[ -f "${LOG}" ]] && grep -iE "error|exception|traceback|refused|failed|closed" "${LOG}" \
  | grep -viE "no error|error_rate" | tail -15

echo
echo "--- websocket sessions ---"
[[ -f "${LOG}" ]] && grep -icE "websocket|/web/ws" "${LOG}" | sed 's/^/  matching log lines: /'
echo "==================================================================="
