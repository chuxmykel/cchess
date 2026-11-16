#!/bin/sh
# cchess-be run directly - no Docker - for the e2e suite where there's
# none: CI's macOS runner. The same code cchess-infra's e2e stack builds
# its image from, against a Postgres already running here (PGHOST etc.,
# as libpq reads them), on a database of its own, made afresh each time:
#
#   scripts/e2e/backend-native.sh up     build, migrate, seed, start, wait
#   scripts/e2e/backend-native.sh down   stop it, and drop its database
#
# The checkout is $CCHESS_BE_DIR (../cchess-be); the api listens on
# 127.0.0.1:$E2E_API_PORT (3100) and logs to $E2E_LOG_DIR/backend.log.
set -eu

cd "$(dirname "$0")/../.."
ROOT=$(pwd)
BE="${CCHESS_BE_DIR:-$ROOT/../cchess-be}"
PORT="${E2E_API_PORT:-3100}"
LOG_DIR="${E2E_LOG_DIR:-$ROOT/.e2e-logs}"
DB="${E2E_DB_NAME:-cchess_e2e}"
PID_FILE="$LOG_DIR/backend.pid"
mkdir -p "$LOG_DIR"

# The api's settings, and nothing from a .env in the checkout: dotenv
# never overwrites what's set, so everything it might read is set here.
export DB_HOST="${PGHOST:-127.0.0.1}" DB_PORT="${PGPORT:-5432}"
export DB_USERNAME="${PGUSER:-$(whoami)}" DB_PASSWORD="${PGPASSWORD:-}"
export DB_NAME="$DB" PORT
export JWT_ACCESS_SECRET=e2e-only-access JWT_REFRESH_SECRET=e2e-only-refresh
export NODE_ENV=test SEED_E2E=1 CLUSTER_WORKERS=1 GAME_START_FEN=''
export LICHESS_TOKEN='' LICHESS_EXPLORER_URL=http://127.0.0.1:9 EXPLORER_MAINTENANCE=false

case "${1:-}" in
  up)
    dropdb --if-exists "$DB"
    createdb "$DB"
    cd "$BE"
    [ -d node_modules ] || npm ci
    npm run build >/dev/null
    node node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js >/dev/null
    node node_modules/typeorm-extension/bin/cli.mjs seed run -d dist/database/data-source.js >/dev/null
    node dist/main.js > "$LOG_DIR/backend.log" 2>&1 &
    echo $! > "$PID_FILE"
    i=0
    until curl -fsS "http://127.0.0.1:$PORT/health" >/dev/null 2>&1; do
      i=$((i + 1))
      if [ "$i" -gt 60 ] || ! kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        echo "the api never answered:" >&2
        tail -30 "$LOG_DIR/backend.log" >&2
        exit 1
      fi
      sleep 1
    done
    echo "e2e api on http://127.0.0.1:$PORT"
    ;;
  down)
    if [ -f "$PID_FILE" ]; then
      kill "$(cat "$PID_FILE")" 2>/dev/null || true
      rm -f "$PID_FILE"
    fi
    sleep 1
    dropdb --if-exists "$DB"
    ;;
  *)
    echo "usage: $0 up|down" >&2
    exit 2
    ;;
esac
