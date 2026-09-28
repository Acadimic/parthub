#!/usr/bin/env sh
# Remove every installed dependency and build output in the monorepo, then install fresh from
# the lockfile and rebuild packages/shared so its consumers typecheck against a real dist.
#
#   sh tools/reinstall.sh               # delete + pnpm install --frozen-lockfile + build:shared
#   sh tools/reinstall.sh --reset-lock  # also delete pnpm-lock.yaml and re-resolve every range
#   sh tools/reinstall.sh --dry-run     # print what would be removed, change nothing
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT"

DRY_RUN=0
RESET_LOCK=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --reset-lock) RESET_LOCK=1 ;;
    -h | --help)
      sed -n '2,7p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "unknown option: $arg" >&2
      exit 2
      ;;
  esac
done

# Claude Code and other Volta-managed tools shadow the pinned Node, so resolve the pin explicitly.
NODE_VERSION=$(node -p "require('./package.json').volta.node")
if command -v volta >/dev/null 2>&1; then
  run() { env -u _VOLTA_TOOL_RECURSION volta run --node "$NODE_VERSION" -- "$@"; }
else
  echo "volta not found; using the Node on PATH ($(node -v)), pinned is $NODE_VERSION" >&2
  run() { "$@"; }
fi

remove() {
  for path in "$@"; do
    [ -e "$path" ] || continue
    if [ "$DRY_RUN" -eq 1 ]; then
      echo "would remove $path"
    else
      echo "removing $path"
      rm -rf "$path"
    fi
  done
}

echo "== build output"
remove apps/*/.next apps/*/dist packages/*/dist apps/*/next-env.d.ts
# shellcheck disable=SC2046 -- paths come from find and contain no whitespace in this repo
remove $(find . -name '*.tsbuildinfo' -not -path '*/node_modules/*' 2>/dev/null)

echo "== node_modules"
# -prune stops find descending into a node_modules it has already listed.
# shellcheck disable=SC2046
remove $(find . -type d -name node_modules -prune 2>/dev/null)

if [ "$RESET_LOCK" -eq 1 ]; then
  echo "== lockfile"
  remove pnpm-lock.yaml
fi

if [ "$DRY_RUN" -eq 1 ]; then
  echo "dry run: nothing removed, nothing installed"
  exit 0
fi

echo "== install (node $NODE_VERSION)"
if [ "$RESET_LOCK" -eq 1 ]; then
  run pnpm install
else
  run pnpm install --frozen-lockfile
fi

echo "== build:shared"
run pnpm build:shared

echo "done: dependencies reinstalled and packages/shared rebuilt"
