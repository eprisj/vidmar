#!/usr/bin/env bash
# Sets up publishing from the admin on the VPS, once. Run as root from this
# folder of a checkout of the site's repository:
#
#   VIDMAR_ADMIN_PATH=<the admin's secret path> ./install.sh
#
# The path is the last part of ADMIN_URL in ~/.vidmar-admin on the laptop
# that runs deploy.sh. Safe to run again: it keeps an existing publish.env
# unless VIDMAR_ADMIN_PATH is given, and re-installs the script and units.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
WEB_ROOT="${WEB_ROOT:-/var/www/vidmar}"
STATE_DIR=/var/lib/vidmar-publish
LIB=/usr/local/lib/vidmar-publish
ENV_FILE=/etc/vidmar/publish.env
API_UNIT="${API_UNIT:-vidmar-api}"

say() { printf '\n== %s\n' "$*"; }
die() { printf '!! %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" = 0 ] || die "run as root"

say "tools"
command -v git >/dev/null && command -v rsync >/dev/null || apt-get install -y git rsync
command -v node >/dev/null || die "Node 20+ is needed for the build: install it (e.g. NodeSource) and run again"
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 20 ] || die "Node $NODE_MAJOR is too old for Next 16: 20+ is needed"
echo "node $(node -v), $(git --version), $(rsync --version | head -1)"

say "the admin's path"
if [ -n "${VIDMAR_ADMIN_PATH:-}" ]; then
  ADMIN_PATH="$VIDMAR_ADMIN_PATH"
elif [ -f "$ENV_FILE" ]; then
  ADMIN_PATH="$(sed -n 's/^VIDMAR_ADMIN_PATH=//p' "$ENV_FILE")"
fi
[ -n "${ADMIN_PATH:-}" ] || die "give the admin's path: VIDMAR_ADMIN_PATH=<path> ./install.sh"
if [ -e "$WEB_ROOT/index.html" ] && [ ! -e "$WEB_ROOT/$ADMIN_PATH.html" ]; then
  die "$WEB_ROOT has no $ADMIN_PATH.html: is the path right? (the build checks this too)"
fi
echo "ok, the live admin is there"

say "user, group, folders"
getent group vidmar-publish >/dev/null || groupadd --system vidmar-publish
id vidmar-build >/dev/null 2>&1 ||
  useradd --system --create-home --home-dir /srv/vidmar-build-home --shell /usr/sbin/nologin -g vidmar-publish vidmar-build
install -d -o vidmar-build -g vidmar-publish -m 2775 "$STATE_DIR"
install -d -o vidmar-build -g vidmar-publish /srv/vidmar-build
install -d "$WEB_ROOT"
# the build syncs into the web root as vidmar-build; deploy.sh from the laptop
# keeps that owner too (it checks for this user)
chown -R vidmar-build:vidmar-publish "$WEB_ROOT"

say "the API may ask for builds"
API_USER="$(systemctl show -p User --value "$API_UNIT" 2>/dev/null || true)"
API_USER="${API_USER:-root}"
if [ "$API_USER" = root ]; then
  echo "$API_UNIT runs as root: it can write $STATE_DIR already"
elif id -nG "$API_USER" | grep -qw vidmar-publish; then
  echo "$API_USER is in vidmar-publish already"
else
  usermod -aG vidmar-publish "$API_USER"
  echo "$API_USER added to vidmar-publish; restarting $API_UNIT so it gets the group"
  systemctl restart "$API_UNIT"
fi

say "script, settings, units"
install -d "$LIB"
install -m 755 "$HERE/vidmar-publish.sh" "$HERE/status.mjs" "$LIB/"
install -d -m 750 -g vidmar-publish /etc/vidmar
if [ -f "$ENV_FILE" ] && [ -z "${VIDMAR_ADMIN_PATH:-}" ]; then
  echo "keeping $ENV_FILE"
else
  sed "s#^VIDMAR_ADMIN_PATH=.*#VIDMAR_ADMIN_PATH=$ADMIN_PATH#; s#^WEB_ROOT=.*#WEB_ROOT=$WEB_ROOT#" \
    "$HERE/publish.env.example" >"$ENV_FILE"
  chgrp vidmar-publish "$ENV_FILE"
  chmod 640 "$ENV_FILE"
  echo "wrote $ENV_FILE"
fi
install -m 644 "$HERE/vidmar-publish.path" "$HERE/vidmar-publish.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now vidmar-publish.path

say "memory"
MEM_MB="$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)"
SWAP_MB="$(awk '/SwapTotal/ {print int($2/1024)}' /proc/meminfo)"
echo "${MEM_MB} MB RAM, ${SWAP_MB} MB swap"
if [ $((MEM_MB + SWAP_MB)) -lt 2048 ]; then
  echo "!! a Next build wants 1-1.5 GB; add swap, e.g.:"
  echo "   fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile && echo '/swapfile none swap sw 0 0' >> /etc/fstab"
fi

say "done"
cat <<EOF
The first build (clone + npm ci) takes a few minutes. To try it now:
  echo '{"by":"root","at":"'"\$(date -Is)"'"}' > $STATE_DIR/request.json
  journalctl -fu vidmar-publish
  cat $STATE_DIR/status.json
Or press "Опублікувати" in the admin once the API with /admin/publish is deployed.
EOF
