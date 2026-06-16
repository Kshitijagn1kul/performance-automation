
#!/usr/bin/env bash
# sources .env (if present) and runs k6 with passed arguments
set -euo pipefail

# Safely export simple KEY=VALUE pairs from .env (ignores comments and empty lines)
if [ -f .env ]; then
  TMPEFILE=$(mktemp)
  # keep only KEY=VALUE lines, strip CR, ignore comments/empty lines
  sed 's/\r$//' .env | sed -n '/^[[:space:]]*#/d;/^[[:space:]]*$/d;p' | grep -E '^[A-Za-z_][A-Za-z0-9_]*=' > "$TMPEFILE"

  # Read each line and export safely (no arbitrary command execution)
  while IFS='=' read -r key val; do
    # preserve values with = in them
    rest=$(printf '%s' "$val")
    export "$key"="$rest"
  done < "$TMPEFILE"

  rm -f "$TMPEFILE"
fi

# Start k6 as a child process so we can forward signals for graceful shutdown
k6 "$@" &
K6_PID=$!

trap 'kill -INT "${K6_PID}" 2>/dev/null || true' INT TERM

wait "${K6_PID}"
exit $?
