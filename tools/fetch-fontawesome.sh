#!/usr/bin/env bash
# Font Awesome 6.5.2 — self-hosted (project rule: no external CDN for icons).
# Binary webfonts are not stored in git; run this once after cloning.
set -e
DEST="$(dirname "$0")/../apps/game-client/public/fontawesome"
mkdir -p "$DEST/css" "$DEST/webfonts"
BASE="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2"
for f in css/all.min.css webfonts/fa-solid-900.woff2 webfonts/fa-regular-400.woff2 webfonts/fa-brands-400.woff2; do
  curl -sL -o "$DEST/$f" "$BASE/$f"
  echo "fetched $f"
done
