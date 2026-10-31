#!/data/data/com.termux/files/usr/bin/bash
# Starts PhishGuard AI on an Android phone (Termux), reachable only over Tailscale.
# Usage: bash scripts/start-phone.sh [--rebuild]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/backend/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing backend/.env — copy backend/.env.example and fill it in (see docs/PHONE_HOSTING.md)." >&2
  exit 1
fi

# Keep the CPU awake while the server runs, so Android doesn't suspend it
command -v termux-wake-lock >/dev/null && termux-wake-lock

# The server binds to the Tailscale IP in HOST. Interface listing can be restricted on Android,
# so this is only a hint; Node reports EADDRNOTAVAIL if the address really isn't there.
HOST_IP="$(grep -E '^HOST=' "$ENV_FILE" | cut -d= -f2 | tr -d '[:space:]' || true)"
if [ -n "$HOST_IP" ] && ! { ip -4 addr 2>/dev/null; ifconfig 2>/dev/null; } | grep -q "$HOST_IP"; then
  echo "Note: couldn't confirm Tailscale address $HOST_IP is active. If startup fails, connect the Tailscale app." >&2
fi

if [ "${1:-}" = "--rebuild" ] || [ ! -f "$ROOT/frontend/dist/index.html" ]; then
  echo "Building frontend..."
  (cd "$ROOT/frontend" && npm run build:phone)
fi

cd "$ROOT/backend"
exec npm run start:phone
