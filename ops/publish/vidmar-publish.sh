#!/usr/bin/env bash
# Rebuilds vidmar.com.ua on the server when the admin asks for it.
#
# The API answers POST /admin/publish by writing $STATE_DIR/request.json;
# vidmar-publish.path sees the file and starts this script. It builds the
# static export from a clean checkout of the repository, with the admin
# copied to its secret path, and syncs out/ into the web root: the same
# thing deploy.sh does from a laptop. Progress goes to status.json, which
# the API hands back to the admin. A request made during a build is picked
# up by the loop at the end, so a save during a build is never lost.
set -Eeuo pipefail

STATE_DIR="${STATE_DIR:-/var/lib/vidmar-publish}"
SRC_DIR="${SRC_DIR:-/srv/vidmar-build}"
REPO_URL="${REPO_URL:-https://github.com/eprisj/vidmar.git}"
BRANCH="${BRANCH:-main}"
WEB_ROOT="${WEB_ROOT:-/var/www/vidmar}"
ADMIN_PATH="${VIDMAR_ADMIN_PATH:-}"
HERE="$(cd "$(dirname "$0")" && pwd)"

REQ="$STATE_DIR/request.json"
RUN="$STATE_DIR/running.json"
STATUS="$STATE_DIR/status.json"
LOG="$STATE_DIR/last.log"

status() { node "$HERE/status.mjs" "$STATUS" "$@"; }

exec 9>"$STATE_DIR/lock"
flock -n 9 || exit 0

STEP=""
on_err() {
  status fail "$STEP" "$LOG" || true
  rm -f "$RUN"
}
trap on_err ERR

# the number of book pages in a tree (book/<slug>.html), not counting the
# "missing" stand-in an unreachable API bakes: the guard against an empty shelf
book_pages() { find "$1/book" -mindepth 1 -maxdepth 1 -name '*.html' ! -name 'missing.html' ! -name 'index.html' 2>/dev/null | wc -l; }

build_once() {
  mv "$REQ" "$RUN"
  status begin "$RUN"
  : >"$LOG"

  STEP="не вдалося оновити код із GitHub"
  if [ ! -d "$SRC_DIR/.git" ]; then
    git clone --branch "$BRANCH" "$REPO_URL" "$SRC_DIR" >>"$LOG" 2>&1
  fi
  cd "$SRC_DIR"
  git fetch --depth 50 origin "$BRANCH" >>"$LOG" 2>&1
  git reset --hard FETCH_HEAD >>"$LOG" 2>&1
  # the last run's admin copy and anything else untracked; dependencies and the build cache stay
  git clean -fdx -e node_modules -e .next >>"$LOG" 2>&1
  COMMIT="$(git rev-parse HEAD)"

  STEP="не вдалося встановити залежності"
  LOCK_SUM="$(sha256sum package-lock.json | cut -d' ' -f1)"
  if [ ! -d node_modules ] || [ "$(cat "$STATE_DIR/lock.sha" 2>/dev/null)" != "$LOCK_SUM" ]; then
    npm ci --no-audit --no-fund >>"$LOG" 2>&1
    echo "$LOCK_SUM" >"$STATE_DIR/lock.sha"
  fi

  STEP="помилка під час збирання сайту"
  # the catalogue is baked with a cached fetch: a fresh build must ask the API again
  rm -rf .next/cache/fetch-cache
  cp -R app/_admin "app/$ADMIN_PATH"
  npm run build >>"$LOG" 2>&1

  STEP="API не віддав каталог під час збирання – сайт не чіпали"
  # an unreachable API bakes no books at all; publishing that would take every
  # book page off the site, so a build that lost them all stops here
  if [ "$(book_pages out)" -eq 0 ] && [ "$(book_pages "$WEB_ROOT")" -gt 0 ]; then
    echo "!! no book pages in out/, $(book_pages "$WEB_ROOT") on the site" >>"$LOG"
    false
  fi
  if [ ! -e "out/$ADMIN_PATH.html" ] && [ ! -e "out/$ADMIN_PATH/index.html" ]; then
    STEP="адмінка не зібралася – сайт не чіпали"
    false
  fi

  STEP="не вдалося викласти файли на сайт"
  # SELinux: /usr/bin/rsync started by systemd enters rsync_t, which may not
  # read the build or write the web root. install.sh puts a copy next to this
  # script (bin_t, no domain change); fall back to the system rsync elsewhere.
  RSYNC="$(dirname "$0")/rsync"; [ -x "$RSYNC" ] || RSYNC=rsync
  "$RSYNC" -a --delete --exclude=".DS_Store" out/ "$WEB_ROOT/" >>"$LOG" 2>&1

  status ok "$COMMIT"
  rm -f "$RUN"
  echo "published $COMMIT" >>"$LOG"
}

# Without the admin's path the build has no admin, and rsync --delete would
# take the live one off the site; a path that differs from the live one (a
# typo in publish.env) would quietly move it. Both stop before anything runs.
# ADMIN_PATH_MOVE=1 allows a deliberate move to a new path, once.
if [ -z "$ADMIN_PATH" ]; then
  rm -f "$REQ"
  STEP="на сервері не задано VIDMAR_ADMIN_PATH (/etc/vidmar/publish.env) – сайт не чіпали"
  : >"$LOG"
  false
fi
if [ -e "$WEB_ROOT/index.html" ] && [ ! -e "$WEB_ROOT/$ADMIN_PATH.html" ] && [ "${ADMIN_PATH_MOVE:-}" != 1 ]; then
  rm -f "$REQ"
  STEP="адмінки за шляхом із publish.env на сайті немає – перевірте VIDMAR_ADMIN_PATH; сайт не чіпали"
  : >"$LOG"
  false
fi

while [ -e "$REQ" ]; do
  build_once
done
