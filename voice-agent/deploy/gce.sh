#!/usr/bin/env bash
# Deploy the voice agent to a GCE VM in Mumbai.
#
# Why a VM and not Cloud Run: Cloud Run accepts HTTP, gRPC and WebSocket
# inbound only — no raw UDP. WebRTC media is UDP, so on Cloud Run the browser
# connects, signalling succeeds, and the call is silent. The alternative is a
# TURN server relaying media, which is a second box anyway.
#
# Cloud Run is still right for the phone leg — Plivo streams audio over a
# WebSocket. See deploy/cloudrun.sh.
#
#     ./deploy/gce.sh setup     service account, static IP, VM, firewall
#     ./deploy/gce.sh deploy    build and run the container   (needs AGENT_DOMAIN)
#     ./deploy/gce.sh check     health check the live agent
#     ./deploy/gce.sh logs      tail the agent log
#     ./deploy/gce.sh ip        print the public IP

set -euo pipefail

PROJECT="${GOOGLE_CLOUD_PROJECT:-thegreenteam-17cfc}"
ZONE="${ZONE:-asia-south1-a}"
REGION="${ZONE%-*}"
VM="${VM:-voice-agent}"
MACHINE="${MACHINE:-e2-small}"          # ~₹1,150/mo. e2-medium past ~8 calls.
DOMAIN="${AGENT_DOMAIN:-}"              # e.g. agent.thegreenteam.in
SA="voice-agent@${PROJECT}.iam.gserviceaccount.com"

# aioice binds UDP with port 0, so media lands wherever the kernel's ephemeral
# range points — by default 32768-60999, which is far wider than we want open.
# We narrow the kernel range on the VM to match this firewall rule instead.
# Keep these two numbers identical or media is silently dropped.
MEDIA_PORT_LO=10000
MEDIA_PORT_HI=20000

_ip() {
  gcloud compute instances describe "${VM}" --project "${PROJECT}" --zone "${ZONE}" \
    --format='value(networkInterfaces[0].accessConfigs[0].natIP)' 2>/dev/null
}

_ssh() {
  gcloud compute ssh "${VM}" --project "${PROJECT}" --zone "${ZONE}" --command "$1"
}

case "${1:-deploy}" in

setup)
  echo "==> enabling APIs"
  gcloud services enable compute.googleapis.com secretmanager.googleapis.com \
      firestore.googleapis.com --project "${PROJECT}"

  echo "==> service account (least privilege — read secrets, write Firestore)"
  gcloud iam service-accounts create voice-agent \
      --display-name="Telugu voice agent" --project "${PROJECT}" 2>/dev/null || true
  gcloud projects add-iam-policy-binding "${PROJECT}" --quiet \
      --member="serviceAccount:${SA}" --role="roles/secretmanager.secretAccessor" >/dev/null
  gcloud projects add-iam-policy-binding "${PROJECT}" --quiet \
      --member="serviceAccount:${SA}" --role="roles/datastore.user" >/dev/null

  # Reserve the address BEFORE the VM, then attach it — otherwise the VM gets
  # an ephemeral IP that changes on stop/start and breaks the DNS record.
  echo "==> reserving static IP in ${REGION}"
  gcloud compute addresses create voice-agent-ip --project "${PROJECT}" \
      --region "${REGION}" 2>/dev/null || true
  STATIC_IP=$(gcloud compute addresses describe voice-agent-ip \
      --project "${PROJECT}" --region "${REGION}" --format='value(address)')

  echo "==> creating VM ${VM} (${MACHINE}) at ${STATIC_IP}"
  gcloud compute instances create "${VM}" \
    --project "${PROJECT}" --zone "${ZONE}" \
    --machine-type "${MACHINE}" \
    --image-family=debian-12 --image-project=debian-cloud \
    --boot-disk-size=20GB \
    --service-account="${SA}" \
    --scopes=https://www.googleapis.com/auth/cloud-platform \
    --address="${STATIC_IP}" \
    --tags=voice-agent 2>/dev/null || echo "    (VM already exists)"

  echo "==> firewall: HTTPS in, UDP ${MEDIA_PORT_LO}-${MEDIA_PORT_HI} for WebRTC media"
  gcloud compute firewall-rules create voice-agent-web \
    --project "${PROJECT}" --allow=tcp:80,tcp:443 \
    --target-tags=voice-agent --description="agent HTTPS" 2>/dev/null || true
  gcloud compute firewall-rules create voice-agent-media \
    --project "${PROJECT}" --allow="udp:${MEDIA_PORT_LO}-${MEDIA_PORT_HI}" \
    --target-tags=voice-agent --description="WebRTC media" 2>/dev/null || true

  cat <<EOF

==> VM is up at ${STATIC_IP}

Two things to do by hand before deploying:

  1. DNS — in GoDaddy add an A record:
         agent.thegreenteam.in   A   ${STATIC_IP}

  2. Secret — the VM reads it from Secret Manager, never from a file:
         printf '%s' '<sarvam key>' | gcloud secrets create SARVAM_API_KEY \\
             --data-file=- --project ${PROJECT}

Then:
     AGENT_DOMAIN=agent.thegreenteam.in ./deploy/gce.sh deploy

A certificate is mandatory — browsers refuse getUserMedia on a plain-HTTP
origin, so the agent cannot be demoed over the bare IP. Caddy issues one
automatically once the A record resolves.
EOF
  ;;

deploy)
  if [[ -z "${DOMAIN}" ]]; then
    echo "AGENT_DOMAIN is not set."
    echo "    AGENT_DOMAIN=agent.thegreenteam.in ./deploy/gce.sh deploy"
    echo "(getUserMedia needs HTTPS — a bare IP will not work.)"
    exit 1
  fi

  # Warn early rather than after a five-minute build.
  RESOLVED=$(getent hosts "${DOMAIN}" 2>/dev/null | awk '{print $1}' | head -1 || true)
  EXPECTED=$(_ip)
  if [[ -n "${EXPECTED}" && "${RESOLVED}" != "${EXPECTED}" ]]; then
    echo "!!  ${DOMAIN} resolves to '${RESOLVED:-nothing}', VM is ${EXPECTED}."
    echo "!!  Caddy cannot get a certificate until this matches. Continuing anyway."
    echo
  fi

  echo "==> syncing source"
  gcloud compute scp --project "${PROJECT}" --zone "${ZONE}" --recurse --compress \
    ./agent ./requirements.txt ./Dockerfile "${VM}:~/voice-agent/"

  echo "==> installing runtime, building, starting"
  # SARVAM_VOICE_ID is expanded HERE, not on the VM — on the remote shell it
  # would be unset and silently fall back to the stock speaker.
  VOICE_ID="${SARVAM_VOICE_ID:-anushka}"

  _ssh "
    set -euo pipefail

    if ! command -v docker >/dev/null; then
      sudo apt-get update -qq
      sudo apt-get install -y -qq docker.io debian-keyring debian-archive-keyring apt-transport-https curl
    fi
    if ! command -v caddy >/dev/null; then
      curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
        | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
      echo 'deb [signed-by=/usr/share/keyrings/caddy-stable-archive-keyring.gpg] https://dl.cloudsmith.io/public/caddy/stable/deb/debian any-version main' \
        | sudo tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
      sudo apt-get update -qq && sudo apt-get install -y -qq caddy
    fi

    # aioice binds port 0, so pin the kernel's ephemeral range to the ports the
    # firewall actually opens. Without this, media is dropped and the call is
    # silent with no error anywhere.
    echo 'net.ipv4.ip_local_port_range = ${MEDIA_PORT_LO} ${MEDIA_PORT_HI}' \
      | sudo tee /etc/sysctl.d/60-webrtc-ports.conf >/dev/null
    sudo sysctl -q --system

    SARVAM=\$(gcloud secrets versions access latest --secret=SARVAM_API_KEY 2>/dev/null || true)
    if [ -z \"\$SARVAM\" ]; then
      echo 'SARVAM_API_KEY secret not readable. Create it, and check the VM'\''s'
      echo 'service account has roles/secretmanager.secretAccessor.'
      exit 1
    fi

    cd ~/voice-agent
    sudo docker build -q -t voice-agent .
    sudo docker rm -f voice-agent 2>/dev/null || true

    # Host networking: aiortc must bind the media ports directly. Mapping an
    # ephemeral range through Docker's NAT breaks ICE candidate gathering.
    sudo docker run -d --name voice-agent --restart unless-stopped \
      --network host \
      -e SARVAM_API_KEY=\"\$SARVAM\" \
      -e SARVAM_VOICE_ID='${VOICE_ID}' \
      -e GOOGLE_CLOUD_PROJECT='${PROJECT}' \
      -e PUBLIC_HOST='${DOMAIN}' \
      -e ALLOWED_ORIGINS='https://${DOMAIN},https://thegreenteam.in,https://www.thegreenteam.in' \
      voice-agent

    printf '%s {\n  reverse_proxy localhost:8080\n}\n' '${DOMAIN}' \
      | sudo tee /etc/caddy/Caddyfile >/dev/null
    sudo systemctl restart caddy

    sleep 5
    sudo docker ps --filter name=voice-agent --format '    container: {{.Status}}'
  "

  echo
  echo "==> deployed. Verifying…"
  sleep 5
  "$0" check || true

  cat <<EOF

==> Set this in Vercel and redeploy the site:
        VITE_AGENT_HOST=https://${DOMAIN}
        SARVAM_VOICE_ID currently: ${VOICE_ID}
EOF
  ;;

check)
  [[ -z "${DOMAIN}" ]] && { echo "set AGENT_DOMAIN to check"; exit 1; }
  echo "==> https://${DOMAIN}/healthz"
  if curl -fsS --max-time 20 "https://${DOMAIN}/healthz"; then
    echo
    echo "==> widget: $(curl -s -o /dev/null -w '%{http_code}' "https://${DOMAIN}/web/widget.js")"
    echo "==> agent is live"
  else
    echo
    echo "not reachable yet. Usual causes, in order:"
    echo "  1. DNS not propagated — dig ${DOMAIN} should return $(_ip)"
    echo "  2. Caddy still getting the certificate — wait a minute, then retry"
    echo "  3. Container failed to start — ./deploy/gce.sh logs"
    exit 1
  fi
  ;;

logs)
  _ssh "sudo docker logs -f --tail 100 voice-agent"
  ;;

ip)
  _ip
  ;;

*)
  echo "usage: $0 {setup|deploy|check|logs|ip}"; exit 1 ;;
esac
