#!/bin/sh
# The README's demo GIFs and screenshots, recorded afresh:
#
#   scripts/demo/record.sh
#
# Runs the demo flows (.maestro/demo/ - kept out of the e2e suite, which
# runs .maestro/*.yaml only) through scripts/e2e/run.sh, against its seeded
# backend, on the iOS Simulator - the booted one, or else an $IOS_DEVICE
# (iPhone 18 Pro) booted here - in dark mode with a clean status bar. Then:
#
# - each recording (Maestro's startRecording) -> docs/media/<name>.gif,
#   through to-gif.sh;
# - each screenshot (takeScreenshot) -> docs/media/screenshots/<name>.png,
#   600 pixels wide.
#
# play runs before review: the review is of the newest game, the one play
# just won. Like the e2e suite, it signs the simulator out of any account.
set -eu

cd "$(dirname "$0")/../.."
ROOT=$(pwd)
out=$ROOT/docs/media
logs=${E2E_LOG_DIR:-$ROOT/.e2e-logs/demo}
rm -rf "$logs"

device=$(xcrun simctl list devices booted -j | python3 -I -c '
import json, sys
booted = [d for ds in json.load(sys.stdin)["devices"].values() for d in ds if d["state"] == "Booted"]
print(booted[0]["udid"] if booted else "")')
if [ -z "$device" ]; then
  device=$(xcrun simctl list devices available | awk -v name="${IOS_DEVICE:-iPhone 18 Pro}" '
    index($0, "    " name " (") == 1 { match($0, /[0-9A-F-]{36}/); print substr($0, RSTART, RLENGTH); exit }')
  [ -n "$device" ] || { echo "no booted simulator, and no ${IOS_DEVICE:-iPhone 18 Pro} to boot" >&2; exit 1; }
  xcrun simctl boot "$device"
fi
xcrun simctl bootstatus "$device" -b >/dev/null
xcrun simctl ui "$device" appearance dark
xcrun simctl status_bar "$device" override --time 9:41 --dataNetwork wifi \
  --wifiBars 3 --cellularMode active --cellularBars 4 \
  --batteryState charged --batteryLevel 100
# iOS 27's lock-screen service crashes over and over on the simulator,
# each crash a macOS "PosterBoard quit unexpectedly" dialog; nothing here
# needs it.
xcrun simctl spawn "$device" launchctl disable "user/$(id -u)/com.apple.PosterBoard" 2>/dev/null || true
xcrun simctl spawn "$device" launchctl bootout "user/$(id -u)/com.apple.PosterBoard" 2>/dev/null || true

# The first Maestro session on a freshly booted simulator can take minutes
# to start its driver.
MAESTRO_DRIVER_STARTUP_TIMEOUT=${MAESTRO_DRIVER_STARTUP_TIMEOUT:-240000} \
  E2E_LOG_DIR=$logs scripts/e2e/run.sh --platform ios \
  .maestro/demo/play.yaml \
  .maestro/demo/review.yaml \
  .maestro/demo/analysis.yaml \
  .maestro/demo/shots-account.yaml \
  .maestro/demo/shots-social.yaml \
  .maestro/demo/shots-tools.yaml

mkdir -p "$out/screenshots"
# The newest of each (run.sh tries a failed flow again).
find "$logs/maestro" -path '*/startRecording/*.mp4' | sort | while read -r video; do
  name=$(basename "$video" .mp4)
  scripts/demo/to-gif.sh "$video" "$out/$name.gif"
  echo "$out/$name.gif"
done
find "$logs/maestro" -path '*/takeScreenshot/*.png' | sort | while read -r shot; do
  name=$(basename "$shot")
  sips --resampleWidth 600 "$shot" --out "$out/screenshots/$name" >/dev/null
  echo "$out/screenshots/$name"
done
