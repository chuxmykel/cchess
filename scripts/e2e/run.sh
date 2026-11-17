#!/bin/sh
# The Maestro e2e suite, end to end, on one platform:
#
#   scripts/e2e/run.sh --platform ios|android [--backend docker|native]
#                      [--shard I/N] [flow.yaml ...]
#
# 1. the backend: cchess-infra's e2e stack (docker, the default - the
#    image production runs), or cchess-be run directly (native - for CI's
#    macOS runner, which has no Docker); either seeded with the e2e
#    accounts and games, on 127.0.0.1:$E2E_API_PORT;
# 2. the device: a booted iOS Simulator, or the cchess-e2e emulator - the
#    one open if there is one, or else booted without a window;
# 3. Metro on $E2E_METRO_PORT, the app built against that backend, and the
#    bot server the flows start their opponents through;
# 4. the flows - every one under .maestro/, or those given, or this
#    shard's share of them - with a JUnit report in $E2E_LOG_DIR;
# 5. everything it started taken down again (KEEP=1 leaves the backend).
#
# Its ports are clear of a dev backend (3000) and Metro (8081), so it never
# talks to them. Logs: .e2e-logs/ (or $E2E_LOG_DIR).
set -eu

cd "$(dirname "$0")/../.."
ROOT=$(pwd)

platform=
backend=docker
shard=
while [ $# -gt 0 ]; do
  case "$1" in
    --platform) platform=$2; shift 2 ;;
    --backend) backend=$2; shift 2 ;;
    --shard) shard=$2; shift 2 ;;
    -h|--help) sed -n '2,22p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    --) shift; break ;;
    -*) echo "unknown option: $1" >&2; exit 2 ;;
    *) break ;;
  esac
done
# The host as the device sees it: the simulator shares this machine's
# 127.0.0.1; the emulator reaches it as 10.0.2.2 (`adb reverse` would let
# it use 127.0.0.1 too, but Maestro's driver clears those rules).
case "$platform" in
  ios) APP_ID=host.exp.Exponent HOST=127.0.0.1 ;;
  android) APP_ID=host.exp.exponent HOST=10.0.2.2 ;;
  *) echo "usage: $0 --platform ios|android [--backend docker|native] [--shard I/N] [flow ...]" >&2; exit 2 ;;
esac

export E2E_API_PORT="${E2E_API_PORT:-3100}"
export E2E_METRO_PORT="${E2E_METRO_PORT:-8091}"
export E2E_BOT_PORT="${E2E_BOT_PORT:-4100}"
export E2E_LOG_DIR="${E2E_LOG_DIR:-$ROOT/.e2e-logs}"
export CCHESS_INFRA_DIR="${CCHESS_INFRA_DIR:-$ROOT/../cchess-infra}"
export CCHESS_BE_DIR="${CCHESS_BE_DIR:-$ROOT/../cchess-be}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$HOME/.maestro/bin:$PATH"
# The app's server, built into its bundle; the bots, here, use 127.0.0.1.
export EXPO_PUBLIC_SERVER_URL="http://$HOST:$E2E_API_PORT"
AVD="${E2E_AVD:-cchess-e2e}"
IOS_DEVICE="${E2E_IOS_DEVICE:-iPhone 18 Pro}"
mkdir -p "$E2E_LOG_DIR"

log() { printf '\n== %s\n' "$*"; }
port_free() { ! lsof -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1; }

started_emulator=
installer_pid=
metro_pid=
bot_pid=
cleanup() {
  code=$?
  if [ -n "$bot_pid" ]; then kill "$bot_pid" 2>/dev/null || true; fi
  if [ -n "$installer_pid" ]; then kill "$installer_pid" 2>/dev/null || true; fi
  if [ -n "$metro_pid" ]; then kill "$metro_pid" 2>/dev/null || true; fi
  if [ -n "$started_emulator" ]; then adb -s "$device" emu kill >/dev/null 2>&1 || true; fi
  if [ "${KEEP:-}" != 1 ]; then
    if [ "$backend" = docker ]; then
      "$CCHESS_INFRA_DIR/test/e2e-stack.sh" logs > "$E2E_LOG_DIR/backend.log" 2>&1 || true
      "$CCHESS_INFRA_DIR/test/e2e-stack.sh" down >/dev/null 2>&1 || true
    else
      scripts/e2e/backend-native.sh down >/dev/null 2>&1 || true
    fi
  fi
  exit $code
}
device=
trap cleanup EXIT INT TERM

for port in "$E2E_API_PORT" "$E2E_METRO_PORT" "$E2E_BOT_PORT"; do
  port_free "$port" || { echo "port $port is in use - is another e2e run going?" >&2; exit 1; }
done

log "backend ($backend) on 127.0.0.1:$E2E_API_PORT"
if [ "$backend" = docker ]; then
  "$CCHESS_INFRA_DIR/test/e2e-stack.sh" up
  "$CCHESS_INFRA_DIR/test/e2e-stack.sh" check
else
  scripts/e2e/backend-native.sh up
fi

log "device ($platform)"
if [ "$platform" = android ]; then
  device=$(adb devices | awk '/^emulator-[0-9]+\tdevice$/ {print $1; exit}')
  if [ -z "$device" ]; then
    emulator -avd "$AVD" -no-window -no-snapshot-save -no-boot-anim -no-audio \
      > "$E2E_LOG_DIR/emulator.log" 2>&1 &
    started_emulator=1
    adb wait-for-device
    device=$(adb devices | awk '/^emulator-[0-9]+\tdevice$/ {print $1; exit}')
  fi
  until [ "$(adb -s "$device" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = 1 ]; do sleep 2; done
  # A slow emulator's "isn't responding" dialogs, for a system app, cover
  # the app the flows are driving.
  adb -s "$device" shell settings put global hide_error_dialogs 1
else
  device=$(xcrun simctl list devices booted -j | python3 -I -c '
import json, sys
booted = [d for ds in json.load(sys.stdin)["devices"].values() for d in ds if d["state"] == "Booted"]
print(booted[0]["udid"] if booted else "")')
  if [ -z "$device" ]; then
    # The newest iOS that has it - CI's image has the same phone on several.
    device=$(xcrun simctl list devices available -j | python3 -I -c '
import json, re, sys
name = sys.argv[1]
devices = json.load(sys.stdin)["devices"]
def version(runtime):
    return [int(n) for n in re.findall(r"\d+", runtime.rsplit(".", 1)[-1])]
found = [d for runtime in sorted(devices, key=version, reverse=True)
         for d in devices[runtime] if d["name"] == name]
print(found[0]["udid"] if found else "")' "$IOS_DEVICE")
    [ -n "$device" ] || { echo "no booted simulator, and no '$IOS_DEVICE' to boot" >&2; exit 1; }
    xcrun simctl boot "$device"
  fi
  xcrun simctl bootstatus "$device" -b >/dev/null
fi
echo "using $device"

has_expo_go() {
  if [ "$platform" = android ]; then
    adb -s "$device" shell pm list packages "$APP_ID" | grep -q "$APP_ID"
  else
    xcrun simctl get_app_container "$device" "$APP_ID" >/dev/null 2>&1
  fi
}
# A device without Expo Go (a fresh one, as on CI) gets it from Expo's CLI,
# which installs it as it opens a project there - from an instance of its
# own, stopped once it's in: that opening can time out on a slow simulator,
# and its error ends the whole `expo start`, Metro and all.
if ! has_expo_go; then
  log "Expo Go onto $device"
  CI=1 npx expo start --"$platform" --port "$((E2E_METRO_PORT + 1))" \
    > "$E2E_LOG_DIR/expo-go-install.log" 2>&1 &
  installer_pid=$!
  i=0
  until has_expo_go; do
    i=$((i + 1))
    if [ "$i" -gt 150 ] || ! kill -0 "$installer_pid" 2>/dev/null; then
      echo "Expo Go never installed on $device:" >&2
      tail -30 "$E2E_LOG_DIR/expo-go-install.log" >&2
      exit 1
    fi
    sleep 2
  done
  pkill -P "$installer_pid" 2>/dev/null || true
  kill "$installer_pid" 2>/dev/null || true
  installer_pid=
fi

log "metro on $E2E_METRO_PORT"
# CI=1: no prompts, no file watching.
CI=1 npx expo start --port "$E2E_METRO_PORT" > "$E2E_LOG_DIR/metro.log" 2>&1 &
metro_pid=$!
# Bundled ahead of the first flow, by asking for the bundle directly - so
# that flow doesn't wait on it.
i=0
until curl -fsS -o /dev/null "http://127.0.0.1:$E2E_METRO_PORT/node_modules/expo/AppEntry.bundle?platform=$platform&dev=true&minify=false" 2>/dev/null; do
  i=$((i + 1))
  if [ "$i" -gt 150 ] || ! kill -0 "$metro_pid" 2>/dev/null; then
    echo "Metro never bundled the app:" >&2
    tail -30 "$E2E_LOG_DIR/metro.log" >&2
    exit 1
  fi
  sleep 2
done

log "bot server on $E2E_BOT_PORT"
# The simulator too, which it opens the app's link on for the iOS flows.
EXPO_PUBLIC_SERVER_URL="http://127.0.0.1:$E2E_API_PORT" E2E_SIMULATOR="$device" \
  node scripts/e2e/bot-server.js > "$E2E_LOG_DIR/bot-server.log" 2>&1 &
bot_pid=$!
sleep 1

# The flows: those given, or every one (not the shared ones in common/, nor
# the screenshot tour) - this shard's share of them, dealt round in turn.
if [ $# -gt 0 ]; then
  flows="$*"
else
  flows=
  for flow in .maestro/*.yaml; do
    case "$flow" in */screens-tour.yaml) ;; *) flows="$flows $flow" ;; esac
  done
fi
if [ -n "$shard" ]; then
  index=${shard%/*}
  count=${shard#*/}
  # shellcheck disable=SC2086 # one flow a line
  flows=$(printf '%s\n' $flows | awk -v i="$index" -v n="$count" '(NR - 1) % n == i - 1')
fi

log "flows on $platform${shard:+, shard $shard}"
# shellcheck disable=SC2086 # flows is a word list
maestro --device "$device" test $flows \
  -e "APP_ID=$APP_ID" \
  -e "METRO_URL=exp://$HOST:$E2E_METRO_PORT" \
  -e "BOT_URL=http://127.0.0.1:$E2E_BOT_PORT" \
  --format junit --output "$E2E_LOG_DIR/report-$platform${shard:+-${shard%/*}}.xml" \
  --test-output-dir "$E2E_LOG_DIR/maestro"
