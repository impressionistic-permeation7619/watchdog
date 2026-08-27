#!/bin/sh
# Cursor spawns hooks with its own extension-host environment, not the
# project's nix devshell — `node`/`pnpm` are absent from PATH there
# (verified live: direnv IS present at /run/current-system/sw/bin/direnv,
# node/pnpm are not). Try node directly first (covers non-Nix setups where
# it's globally installed), then fall back to `direnv exec` to pick up the
# flake devshell — its shellHook banner goes to stderr, so stdout stays
# clean JSON. If neither resolves, print `{}` so the (non-failClosed)
# caller hook still gets valid JSON and fails open.
set -eu

root=$(cd "$(dirname "$0")/../.." && pwd)

if command -v node >/dev/null 2>&1; then
  exec node "$@"
fi

if command -v direnv >/dev/null 2>&1; then
  exec direnv exec "$root" node "$@"
fi

printf '{}'
