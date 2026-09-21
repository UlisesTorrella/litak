#!/usr/bin/env bash
set -euo pipefail

deploy_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$deploy_dir"

if [[ ! -f .env.production ]]; then
  echo "Missing $deploy_dir/.env.production" >&2
  echo "Copy .env.production-ip.example and replace every placeholder first." >&2
  exit 1
fi

if grep -Eq '203\.0\.113\.10|replace_with_|example\.com' .env.production; then
  echo ".env.production still contains example values or secret placeholders." >&2
  exit 1
fi

for command_name in docker; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Missing required command: $command_name" >&2
    exit 1
  fi
done

compose=(docker compose --env-file .env.production -f compose.production.yml)

echo "Pulling private production images..."
"${compose[@]}" pull

echo "Starting Litak..."
"${compose[@]}" up --detach --remove-orphans

echo "Removing superseded image layers..."
docker image prune --force >/dev/null

echo
"${compose[@]}" ps
echo
echo "Recent application logs:"
"${compose[@]}" logs --tail 30 litak litak-ws caddy
