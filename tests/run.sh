#!/bin/bash
# Runs the automatic permission check locally or in CI:
# builds the plugin, makes the test media, starts a throwaway Jellyfin in Docker with the plugin installed,
# runs tests/permission-check.mjs, then removes the container.
#   tests/run.sh [jellyfin image]      (default jellyfin/jellyfin:12.1)
set -euo pipefail
cd "$(dirname "$0")/.."
IMAGE="${1:-jellyfin/jellyfin:12.1}"
VERSION="0.0.0.1"
W="$PWD/tests/.work"
./build.sh "$VERSION" "test build" >/dev/null
rm -rf "$W/config" && mkdir -p "$W/config/plugins"
cp -r "dist/Jelly Cinema_$VERSION" "$W/config/plugins/"
tests/make-media.sh "$W/media" >/dev/null
NAME=jc-permission-check
docker rm -f "$NAME" >/dev/null 2>&1 || true
trap 'docker logs "$NAME" > "$W/jellyfin.log" 2>&1 || true; docker rm -f "$NAME" >/dev/null 2>&1 || true' EXIT
docker run -d --name "$NAME" -p 8096:8096 -v "$W/config:/config" -v "$W/media:/media:ro" "$IMAGE" >/dev/null
(cd tests && [ -d node_modules/playwright ] || npm install --no-save --silent playwright@1.64.1)
node tests/permission-check.mjs "http://localhost:8096"
