#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
KEY="$HOME/.ssh/vidmar_deploy"
HOST="root@173.242.49.73"

echo "Building static export..."
cd "$SCRIPT_DIR"
npm run build

echo "Syncing out/ to VPS (/var/www/vidmar)..."
rsync -avz --delete \
  -e "ssh -i $KEY" \
  "$SCRIPT_DIR/out/" \
  "$HOST:/var/www/vidmar/" \
  --exclude=".DS_Store"

echo "✓ vidmar.com.ua deployed"
