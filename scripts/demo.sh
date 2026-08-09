#!/usr/bin/env bash
# Start the voice agent and the website together, for a live demo.
#
#     export SARVAM_API_KEY=...
#     ./scripts/demo.sh
#
# Then open http://localhost:3000 and click the button in the bottom-right.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AGENT="${ROOT}/voice-agent"

if [[ -z "${SARVAM_API_KEY:-}" ]]; then
  if [[ -f "${AGENT}/.env" ]] && grep -q '^SARVAM_API_KEY=".\+"' "${AGENT}/.env"; then
    echo "==> using SARVAM_API_KEY from voice-agent/.env"
  else
    echo "SARVAM_API_KEY is not set."
    echo
    echo "  export SARVAM_API_KEY=...        then run this again"
    echo "  (or put it in voice-agent/.env — copy .env.example)"
    exit 1
  fi
fi

# --- agent -----------------------------------------------------------------
if [[ ! -d "${AGENT}/.venv" ]]; then
  echo "==> creating voice-agent venv (first run, takes a few minutes)"
  python3 -m venv "${AGENT}/.venv"
  "${AGENT}/.venv/bin/pip" install -q -U pip setuptools wheel
  "${AGENT}/.venv/bin/pip" install -q -r "${AGENT}/requirements.txt"
fi

# Preflight reports, it does not block. If something is off you still get a
# running agent and a specific error to chase — being stopped at the door is
# worse than being told what is wrong.
echo "==> preflight"
( cd "${AGENT}" && set -a && [[ -f .env ]] && . ./.env; set +a; \
  "${AGENT}/.venv/bin/python" -m tools.preflight ) || {
  echo
  echo "    ^ starting anyway. Set REQUIRE_PREFLIGHT=1 to stop on failures."
  [[ "${REQUIRE_PREFLIGHT:-}" == "1" ]] && exit 1
}

echo "==> starting voice agent on :8080"
( cd "${AGENT}" && "${AGENT}/.venv/bin/uvicorn" agent.server:app --port 8080 ) &
AGENT_PID=$!

# Kill the agent when this script exits, however it exits.
trap 'echo; echo "==> stopping"; kill ${AGENT_PID} 2>/dev/null || true' EXIT INT TERM

# --- website ---------------------------------------------------------------
if [[ ! -d "${ROOT}/node_modules" ]]; then
  echo "==> installing site dependencies"
  ( cd "${ROOT}" && npm install --silent )
fi

echo "==> starting website on :3000"
echo
echo "    Open http://localhost:3000 and click the button, bottom-right."
echo "    Watch this terminal for 'time-to-first-audio' — budget is 800 ms."
echo

cd "${ROOT}" && npm run dev
