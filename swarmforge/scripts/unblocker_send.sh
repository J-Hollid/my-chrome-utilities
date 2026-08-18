#!/usr/bin/env zsh
set -eu
script_dir=${0:A:h}
exec node "$script_dir/unblocker-control.mjs" send "$@"
