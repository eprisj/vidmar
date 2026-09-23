#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
KEY="$HOME/.ssh/vidmar_deploy"
HOST="root@173.242.49.73"

echo "Building static export..."
cd "$SCRIPT_DIR"
# the catalogue is baked into /catalog and /book with a cached fetch; a
# fresh build must ask the API again, not reuse the last build's answer
rm -rf .next/cache/fetch-cache

# The admin's address is a secret and this repository is public, so its
# pages live in app/_admin (an underscore folder is never a route) and are
# copied to the secret path only for the build. The path comes from a file
# kept outside the repo (~/.vidmar-admin, ADMIN_URL=...) or VIDMAR_ADMIN_PATH.
# Without it the site builds and deploys with no admin at all.
ADMIN_PATH="${VIDMAR_ADMIN_PATH:-$(sed -n 's#^ADMIN_URL=.*/##p' "$HOME/.vidmar-admin" 2>/dev/null)}"
if [ -n "$ADMIN_PATH" ]; then
  rm -rf "app/$ADMIN_PATH"
  cp -R app/_admin "app/$ADMIN_PATH"
  trap 'rm -rf "$SCRIPT_DIR/app/$ADMIN_PATH"' EXIT
else
  echo "!! no admin path (~/.vidmar-admin): building WITHOUT the admin" >&2
fi
npm run build

echo "Syncing out/ to VPS (/var/www/vidmar)..."
rsync -avz --delete \
  -e "ssh -i $KEY" \
  "$SCRIPT_DIR/out/" \
  "$HOST:/var/www/vidmar/" \
  --exclude=".DS_Store"

echo "✓ vidmar.com.ua deployed"
