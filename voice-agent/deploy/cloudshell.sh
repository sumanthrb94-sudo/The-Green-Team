#!/usr/bin/env bash
# Run the agent directly in Cloud Shell. No Docker, no Cloud Build, no Cloud
# Run, no IAM — the fastest way to actually hear it.
#
#     export SARVAM_API_KEY='...'
#     bash deploy/cloudshell.sh
#
# Then click "Web Preview" (the ◻ icon, top right of Cloud Shell) → "Preview
# on port 8080". That opens an HTTPS URL, which is what the browser requires
# before it will hand over a microphone.
#
# The widget is served from the same origin as the agent, so there is no CORS
# to configure here.

set -euo pipefail

AGENT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${AGENT}"

if [[ -z "${SARVAM_API_KEY:-}" ]]; then
  echo "SARVAM_API_KEY is not set."
  echo "    export SARVAM_API_KEY='<your key>'    then run this again"
  exit 1
fi

if [[ ! -d .venv ]]; then
  echo "==> creating venv (first run only, ~2-3 minutes)"
  python3 -m venv .venv
  ./.venv/bin/pip install -q -U pip setuptools wheel
  echo "==> installing dependencies"
  ./.venv/bin/pip install -q -r requirements-deploy.txt
fi

echo "==> checking Sarvam"
./.venv/bin/python -m tools.preflight || echo "    ^ starting anyway"

cat <<'EOF'

======================================================================
  Now click "Web Preview" at the top right of Cloud Shell
  (the ◻ icon) and choose "Preview on port 8080".

  A new tab opens on an https:// URL. Click the button, bottom right.
======================================================================

EOF

# Firestore writes need credentials; without them a session still runs, it
# just cannot log the outcome. Keep going rather than failing the demo.
export GOOGLE_CLOUD_PROJECT="${GOOGLE_CLOUD_PROJECT:-thegreenteam-17cfc}"
export AGENT_PROJECT="${AGENT_PROJECT:-portfolio}"

exec ./.venv/bin/uvicorn agent.server:app --host 0.0.0.0 --port 8080
