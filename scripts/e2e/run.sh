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
# A shard with none of them - fewer flows than shards, as a run of a few
# chosen flows can be - has nothing to bring up.
if [ -z "$(printf '%s' "$flows" | tr -d '[:space:]')" ]; then
  echo "no flows in ${shard:+shard $shard of }this run"
  exit 0
fi

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
# Tried three times: Expo's CLI downloads Expo Go first, and that download
# can time out on a hosted runner.
install_expo_go() {
  CI=1 npx expo start --"$platform" --port "$((E2E_METRO_PORT + 1))" \
    >> "$E2E_LOG_DIR/expo-go-install.log" 2>&1 &
  installer_pid=$!
  i=0
  until has_expo_go; do
    i=$((i + 1))
    if [ "$i" -gt 150 ] || ! kill -0 "$installer_pid" 2>/dev/null; then
      kill "$installer_pid" 2>/dev/null || true
      installer_pid=
      return 1
    fi
    sleep 2
  done
  pkill -P "$installer_pid" 2>/dev/null || true
  kill "$installer_pid" 2>/dev/null || true
  installer_pid=
}
if ! has_expo_go; then
  log "Expo Go onto $device"
  attempt=1
  until install_expo_go; do
    if [ "$attempt" -ge 3 ]; then
      echo "Expo Go never installed on $device:" >&2
      tail -30 "$E2E_LOG_DIR/expo-go-install.log" >&2
      exit 1
    fi
    attempt=$((attempt + 1))
    echo "Expo Go didn't install; trying again ($attempt of 3)"
  done
fi

log "metro on $E2E_METRO_PORT"
# CI=1: no prompts, no file watching. A production bundle - minified,
# without React's development checks - as people get the app: a hosted
# runner's simulator loads and runs the development one so slowly that
# Home took minutes to show and taps went missing.
# Its transform cache, kept between CI runs, lives in the temp folder:
# E2E_METRO_TMPDIR names one that's cached.
if [ -n "${E2E_METRO_TMPDIR:-}" ]; then
  mkdir -p "$E2E_METRO_TMPDIR"
  export TMPDIR="$E2E_METRO_TMPDIR"
fi
CI=1 npx expo start --no-dev --minify --port "$E2E_METRO_PORT" \
  > "$E2E_LOG_DIR/metro.log" 2>&1 &
metro_pid=$!
# Bundled ahead of the first flow - which would otherwise wait minutes on
# it on a hosted runner - by asking for the very bundle Expo Go loads: its
# address, from the manifest Metro serves Expo Go, has settings of its own
# (lazy, Hermes bytecode), and any other is another bundle.
launch_bundle() {
  curl -fsS -H "expo-platform: $platform" \
    -H "Accept: application/expo+json,application/json" \
    "http://127.0.0.1:$E2E_METRO_PORT/" 2>/dev/null | python3 -I -c '
import json, sys
from urllib.parse import urlsplit, urlunsplit
url = urlsplit(json.load(sys.stdin)["launchAsset"]["url"])
print(urlunsplit(url._replace(netloc="127.0.0.1:" + str(url.port))))'
}
i=0
until url=$(launch_bundle) && curl -fsS -o /dev/null "$url" 2>/dev/null; do
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


# iOS offers to save a password after a sign-in: a card Maestro sees up to
# iOS 26, a sheet it doesn't from 27 - common/dismiss-save-password.yaml
# closes whichever this simulator shows.
save_password=none
if [ "$platform" = ios ]; then
  ios_major=$(xcrun simctl list devices -j | python3 -I -c '
import json, re, sys
udid = sys.argv[1]
for runtime, devices in json.load(sys.stdin)["devices"].items():
    if any(d["udid"] == udid for d in devices):
        print(re.search(r"iOS-(\d+)", runtime).group(1))' "$device")
  if [ "${ios_major:-0}" -ge 27 ]; then save_password=sheet; else save_password=card; fi
fi

log "flows on $platform${shard:+, shard $shard}"
# In batches of $E2E_MAESTRO_BATCH flows (all at once unless set), each a
# Maestro session of its own: on a hosted runner, its iOS driver stops
# answering, or the emulator drops off adb, after a quarter of an hour or
# so, failing every flow after.
batch_size="${E2E_MAESTRO_BATCH:-0}"
# shellcheck disable=SC2086 # flows is a word list
set -- $flows
[ "$batch_size" -gt 0 ] || batch_size=$#
batch=0
status=0
while [ $# -gt 0 ]; do
  batch=$((batch + 1))
  these=
  n=0
  while [ $# -gt 0 ] && [ "$n" -lt "$batch_size" ]; do
    these="$these $1"
    shift
    n=$((n + 1))
  done
  # The emulator can drop off adb for a moment (device offline); give it
  # back to the next batch.
  if [ "$platform" = android ]; then
    i=0
    until [ "$(adb -s "$device" get-state 2>/dev/null)" = device ] || [ "$i" -ge 60 ]; do
      i=$((i + 1))
      sleep 2
    done
  fi
  # shellcheck disable=SC2086 # these is a word list
  maestro --device "$device" test $these \
    -e "APP_ID=$APP_ID" \
    -e "METRO_URL=exp://$HOST:$E2E_METRO_PORT" \
    -e "BOT_URL=http://127.0.0.1:$E2E_BOT_PORT" \
    -e "SAVE_PASSWORD=$save_password" \
    --format junit \
    --output "$E2E_LOG_DIR/report-$platform${shard:+-${shard%/*}}-$batch.xml" \
    --test-output-dir "$E2E_LOG_DIR/maestro" || status=1
done
# Failing, if a batch did: the run's exit code.
[ "$status" -eq 0 ]
