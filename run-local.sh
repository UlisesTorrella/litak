#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
websocket_dir="$(cd "$project_dir/../litak-ws" 2>/dev/null && pwd || true)"
cd "$project_dir"

# This 2021 SBT/Scala toolchain predates current JDKs and requires Java 11.
if [[ -x /opt/homebrew/opt/openjdk@11/bin/java ]]; then
  export JAVA_HOME=/opt/homebrew/opt/openjdk@11
  export PATH="$JAVA_HOME/bin:$PATH"
fi

for command_name in java sbt node yarn brew mongosh redis-cli nc; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Missing required command: $command_name" >&2
    exit 1
  fi
done

if [[ -z "$websocket_dir" ]]; then
  echo "Missing sibling repository: $project_dir/../litak-ws" >&2
  exit 1
fi

if ! redis-cli ping >/dev/null 2>&1; then
  echo "Starting Redis..."
  brew services start redis
fi

if ! mongosh --quiet --eval 'db.runCommand({ ping: 1 }).ok' mongodb://127.0.0.1:27017/admin 2>/dev/null | grep -q '^1$'; then
  echo "Starting MongoDB..."
  brew services start mongodb/brew/mongodb-community@5.0
fi

echo "Waiting for MongoDB and Redis..."
for attempt in {1..30}; do
  if redis-cli ping >/dev/null 2>&1 && \
    mongosh --quiet --eval 'db.runCommand({ ping: 1 }).ok' mongodb://127.0.0.1:27017/admin 2>/dev/null | grep -q '^1$'; then
    break
  fi
  if [[ "$attempt" == 30 ]]; then
    echo "MongoDB or Redis did not become ready." >&2
    exit 1
  fi
  sleep 1
done

if [[ ! -f conf/application.conf ]]; then
  cp conf/application.conf.default conf/application.conf
fi
if [[ ! -f .sbtopts ]]; then
  cp .sbtopts.default .sbtopts
fi

if [[ ! -f public/compiled/lobby.js ]]; then
  echo "Building the lobby frontend bundle..."
  yarn --cwd ui/lobby dev
fi
if [[ ! -f public/compiled/serviceWorker.js ]]; then
  echo "Building the service worker frontend bundle..."
  yarn --cwd ui/serviceWorker dev
fi

websocket_pid=""
if nc -z 127.0.0.1 9664 >/dev/null 2>&1; then
  echo "Using the WebSocket server already running at ws://localhost:9664"
else
  echo "Starting Litak WebSocket server at ws://localhost:9664"
  (
    cd "$websocket_dir"
    exec sbt -Dcsrf.origin=http://localhost:9663 run
  ) &
  websocket_pid=$!
fi

cleanup() {
  if [[ -n "$websocket_pid" ]]; then
    kill "$websocket_pid" 2>/dev/null || true
    wait "$websocket_pid" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

if [[ -n "$websocket_pid" ]]; then
  echo "Waiting for the WebSocket server..."
  for attempt in {1..120}; do
    if nc -z 127.0.0.1 9664 >/dev/null 2>&1; then
      break
    fi
    if ! kill -0 "$websocket_pid" 2>/dev/null; then
      echo "The WebSocket server exited before opening port 9664." >&2
      exit 1
    fi
    if [[ "$attempt" == 120 ]]; then
      echo "The WebSocket server did not become ready." >&2
      exit 1
    fi
    sleep 1
  done
fi

echo "Starting Litak at http://localhost:9663"
./lila run
