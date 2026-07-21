#!/usr/bin/env bash
set -euo pipefail
[[ "${CONFIRM_DEMO_SEED:-}" == 'yes' ]] || { echo 'Set CONFIRM_DEMO_SEED=yes to seed an isolated demo database.' >&2; exit 2; }
echo 'No implicit demo identities are bundled; create a demo tenant through controlled administration.'
