#!/usr/bin/env bash
set -euo pipefail

: "${LITAK_PUBLIC_IP:?Export LITAK_PUBLIC_IP before running this script}"
: "${LITAK_ADMIN_EMAIL:?Export LITAK_ADMIN_EMAIL before running this script}"

deploy_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
env_file="$deploy_dir/.env.production"

if [[ -e "$env_file" ]]; then
  echo "$env_file already exists; refusing to overwrite production secrets." >&2
  exit 1
fi

if ! command -v openssl >/dev/null 2>&1; then
  echo "Missing required command: openssl" >&2
  exit 1
fi

umask 077
mongo_password="$(openssl rand -hex 32)"
redis_password="$(openssl rand -hex 32)"
play_secret="$(openssl rand -hex 64)"
password_secret="$(openssl rand -base64 16)"

cat >"$env_file" <<EOF
LITAK_DOMAIN=$LITAK_PUBLIC_IP
LITAK_WS_DOMAIN=$LITAK_PUBLIC_IP:9664
LITAK_BASE_URL=http://$LITAK_PUBLIC_IP
LITAK_ORIGIN=http://$LITAK_PUBLIC_IP
LITAK_SITE_ADDRESS=http://$LITAK_PUBLIC_IP
LITAK_WS_ADDRESS=http://$LITAK_PUBLIC_IP:9664
LITAK_PUBLIC_IP=$LITAK_PUBLIC_IP
LITAK_ADMIN_EMAIL=$LITAK_ADMIN_EMAIL
ACME_EMAIL=$LITAK_ADMIN_EMAIL

MONGO_USER=litak
MONGO_PASSWORD=$mongo_password
REDIS_PASSWORD=$redis_password
LITAK_PLAY_SECRET=$play_secret
LITAK_PASSWORD_SECRET=$password_secret

LITAK_IMAGE=ghcr.io/ulisestorrella/litak:latest
LITAK_WS_IMAGE=ghcr.io/ulisestorrella/litak-ws:latest
EOF

echo "Created $env_file with mode 600 and newly generated secrets."

