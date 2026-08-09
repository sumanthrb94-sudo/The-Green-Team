#!/usr/bin/env bash
# Deploy the voice agent to a GCE VM in Mumbai.
#
# Why a VM and not Cloud Run: Cloud Run accepts HTTP, gRPC and WebSocket
# inbound only — no raw UDP. WebRTC media is UDP, so on Cloud Run the browser
# would connect, signalling would succeed, and the call would be silent. The
# alternative is a TURN server relaying media, which is a second box anyway.
# A VM with a public IP and UDP open is the simplest thing that works.
#
# Cloud Run is still right for the phone leg later — Plivo streams audio over
# a WebSocket, which Cloud Run handles fine.
#
#     ./deploy/gce.sh setup     create the VM, firewall and DNS instructions
#     ./deploy/gce.sh deploy    build and run the container on it
#     ./deploy/gce.sh logs      tail the agent log
#     ./deploy/gce.sh ip        print the public IP

set -euo pipefail

PROJECT="${GOOGLE_CLOUD_PROJECT:-thegreenteam-17cfc}"
ZONE="${ZONE:-asia-south1-a}"
VM="${VM:-voice-agent}"
MACHINE="${MACHINE:-e2-small}"          # ~$13/mo. e2-medium if you exceed ~8 calls.
DOMAIN="${AGENT_DOMAIN:-}"              # e.g. agent.thegreenteam.in

# WebRTC media. aiortc picks an ephemeral port in this range per session.
UDP_RANGE="10000-20000"

_ip() {
  gcloud compute instances describe "${VM}" --project "${PROJECT}" --zone "${ZONE}" \
    --format='value(networkInterfaces[0].accessConfigs[0].natIP)'
}

case "${1:-deploy}" in

setup)
  echo "==> creating VM ${VM} (${MACHINE}) in ${ZONE}"
  gcloud compute instances create "${VM}" \
    --project "${PROJECT}" --zone "${ZONE}" \
    --machine-type "${MACHINE}" \
    --image-family=debian-12 --image-project=debian-cloud \
    --boot-disk-size=20GB \
    --scopes=https://www.googleapis.com/auth/cloud-platform \
    --tags=voice-agent

  echo "==> firewall: HTTPS in, and UDP ${UDP_RANGE} for WebRTC media"
  gcloud compute firewall-rules create voice-agent-web \
    --project "${PROJECT}" --allow=tcp:80,tcp:443 \
    --target-tags=voice-agent --description="agent HTTPS" 2>/dev/null || true
  gcloud compute firewall-rules create voice-agent-media \
    --project "${PROJECT}" --allow="udp:${UDP_RANGE}" \
    --target-tags=voice-agent --description="WebRTC media" 2>/dev/null || true

  echo "==> reserving a static IP (so DNS doesn't break on reboot)"
  gcloud compute addresses create voice-agent-ip --project "${PROJECT}" \
    --region "${ZONE%-*}" 2>/dev/null || true

  IP="$(_ip)"
  cat <<EOF

==> VM is up at ${IP}

Next, two things you do by hand:

  1. DNS — in GoDaddy, add an A record:
         agent.thegreenteam.in   A   ${IP}
     Then re-run with AGENT_DOMAIN=agent.thegreenteam.in ./deploy/gce.sh deploy

  2. Secrets — the agent reads them from Secret Manager:
         echo -n '<sarvam key>' | gcloud secrets create SARVAM_API_KEY \\
             --data-file=- --project ${PROJECT}

The browser will not open a microphone on a plain-HTTP origin, so the domain
and certificate are required — this cannot be demoed to a client over the raw
IP. Caddy gets the certificate automatically once DNS resolves.
EOF
  ;;

deploy)
  if [[ -z "${DOMAIN}" ]]; then
    echo "AGENT_DOMAIN is not set."
    echo "    AGENT_DOMAIN=agent.thegreenteam.in ./deploy/gce.sh deploy"
    echo "(getUserMedia needs HTTPS — a bare IP will not work.)"
    exit 1
  fi

  echo "==> syncing source to ${VM}"
  gcloud compute scp --project "${PROJECT}" --zone "${ZONE}" --recurse \
    --compress ./agent ./requirements.txt ./Dockerfile "${VM}:~/voice-agent/"

  echo "==> building and starting on the VM"
  gcloud compute ssh "${VM}" --project "${PROJECT}" --zone "${ZONE}" --command "
    set -e
    if ! command -v docker >/dev/null; then
      sudo apt-get update -qq && sudo apt-get install -y -qq docker.io caddy || {
        sudo apt-get install -y -qq debian-keyring debian-archive-keyring apt-transport-https curl
        curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
        curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
        sudo apt-get update -qq && sudo apt-get install -y -qq caddy
      }
    fi

    SARVAM=\$(gcloud secrets versions access latest --secret=SARVAM_API_KEY 2>/dev/null || echo '')
    if [ -z \"\$SARVAM\" ]; then echo 'SARVAM_API_KEY secret not found'; exit 1; fi

    cd ~/voice-agent
    sudo docker build -q -t voice-agent .
    sudo docker rm -f voice-agent 2>/dev/null || true

    # host networking so aiortc can bind the UDP media ports directly —
    # port-mapping an ephemeral range through Docker's NAT breaks ICE.
    sudo docker run -d --name voice-agent --restart unless-stopped \
      --network host \
      -e SARVAM_API_KEY=\"\$SARVAM\" \
      -e GOOGLE_CLOUD_PROJECT='${PROJECT}' \
      -e PUBLIC_HOST='${DOMAIN}' \
      -e ALLOWED_ORIGINS='https://${DOMAIN},https://thegreenteam.in,https://www.thegreenteam.in' \
      -e SARVAM_VOICE_ID=\"\${SARVAM_VOICE_ID:-anushka}\" \
      voice-agent

    printf '%s {\n  reverse_proxy localhost:8080\n}\n' '${DOMAIN}' | sudo tee /etc/caddy/Caddyfile >/dev/null
    sudo systemctl restart caddy
  "

  echo
  echo "==> live at https://${DOMAIN}"
  echo "==> set this in Vercel, then redeploy the site:"
  echo "        VITE_AGENT_HOST=https://${DOMAIN}"
  ;;

logs)
  gcloud compute ssh "${VM}" --project "${PROJECT}" --zone "${ZONE}" \
    --command "sudo docker logs -f --tail 100 voice-agent"
  ;;

ip)
  _ip
  ;;

*)
  echo "usage: $0 {setup|deploy|logs|ip}"; exit 1 ;;
esac
