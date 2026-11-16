# E2E flows (Maestro)

Real-device tests, on the iOS Simulator and the Android emulator, against a
real cchess-be - as opposed to the Jest/RNTL suite in `src/`, which only
_simulates_ native gestures and mocks the server. These flows drive the
actual app in Expo Go, so they catch what the simulated tests structurally
can't.

## Running

```bash
npm run test:e2e:ios         # every flow, on the booted iOS Simulator
npm run test:e2e:android     # every flow, on the cchess-e2e emulator
scripts/e2e/run.sh --platform android .maestro/game-resign.yaml   # one flow
scripts/e2e/run.sh --platform ios --shard 2/3                     # a CI shard
KEEP=1 scripts/e2e/run.sh ...   # leave the backend up afterwards
```

`scripts/e2e/run.sh` does everything, and takes it all down again:

1. **The backend** - cchess-be from `../cchess-be` (`$CCHESS_BE_DIR`),
   migrated and seeded, on `127.0.0.1:3100`: by default
   `../cchess-infra/test/e2e-stack.sh` (the Docker image production runs,
   `compose.e2e.yaml`); with `--backend native`, cchess-be run directly on
   a Postgres already running (`scripts/e2e/backend-native.sh` - CI's
   macOS runner has no Docker).
2. **The device** - the booted simulator (or `$E2E_IOS_DEVICE`, iPhone 18
   Pro, booted), or the emulator: the one open if there is one, else
   `cchess-e2e` booted without a window.
3. **Metro** on 8091, the app's server built in as the device reaches the
   host: `127.0.0.1` on the simulator, `10.0.2.2` on the emulator (no
   `adb reverse`: Maestro's driver clears those rules).
4. **The bot server** on 4100 (`scripts/e2e/bot-server.js`), through which
   flows start and stop scripted opponents.
5. **The flows** - all of `.maestro/*.yaml` but the screenshot tour, those
   given, or a shard's share - with a JUnit report, logs and Maestro's
   artifacts in `.e2e-logs/`.

Its ports are clear of a dev backend (3000) and Metro (8081), so a run never
talks to them. The simulator itself is shared, though: a run relaunches Expo
Go and clears its keychain over and over, signing out whatever account was
in use there.

## One-time setup

- **Maestro** 2.10.0, at `~/.maestro/bin/maestro` - not an npm dependency:
  `curl -Ls "https://get.maestro.mobile.dev" | bash`.
- **Docker** (for the backend's stack), and cchess-be and cchess-infra
  checked out beside this repo.
- **iOS**: Xcode with the iPhone 18 Pro / iOS 27 simulator. Expo Go installs
  itself the first time. CI's macOS image has Xcode 26 only, so it runs the
  iPhone 17 Pro (iOS 26) - the same 402x874 points, so the flows' iOS
  points hold on both.
- **Android**: the emulator, from Android's SDK command-line tools - not
  the Android Studio app, nor Gradle or the NDK: the app runs in Expo Go,
  which installs itself, so nothing's compiled. Java 17 or later (Maestro
  needs it too), then about 2.5 GB to download:

  ```bash
  brew install --cask android-commandlinetools   # just to bootstrap sdkmanager
  export ANDROID_HOME=$HOME/Library/Android/sdk
  sdkmanager --sdk_root=$ANDROID_HOME "cmdline-tools;latest" "platform-tools" "emulator" \
    "system-images;android-35;google_apis;arm64-v8a"
  # The SDK's own avdmanager: Homebrew's looks for images in its own folder.
  echo no | $ANDROID_HOME/cmdline-tools/latest/bin/avdmanager create avd \
    -n cchess-e2e -k "system-images;android-35;google_apis;arm64-v8a" -d pixel_8
  sed -i '' 's/^hw.keyboard=no/hw.keyboard=yes/' ~/.android/avd/cchess-e2e.avd/config.ini
  ```

  and in your shell's profile:

  ```bash
  export ANDROID_HOME=$HOME/Library/Android/sdk
  export PATH=$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH
  ```

  `emulator -avd cchess-e2e` opens it in a window to click through, as the
  iOS Simulator is used (`hw.keyboard=yes` lets the Mac's keyboard type
  into it); `npm start` then `a` opens the app there. CI's emulator is the
  same Pixel 8 profile on x86_64.

## What's covered

Every flow starts from a fresh app, as a new guest (`common/launch-fresh`),
after stopping any opponent an earlier flow left; so no flow depends on
another, and they run in any order, or split across shards.

| Area           | Flows                                                                                                                                                                                                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| New Game       | `bottom-sheet-dismiss`, `coming-soon-toast`, `time-control-selection`, `new-game-settings` (Rated for a guest and an account, the saved time control)                                                                                                                             |
| The board      | `new-game-renders`, `tap-to-move`, `drag-and-drop`, `off-board-drag`, `capture`, `premove`, `game-promotion`                                                                                                                                                                      |
| A live game    | `game-resign` (and the result card), `game-draw-offered`, `game-draw-received`, `game-abort`, `game-first-move-timeout`, `game-flag`, `game-rematch`, `game-new-opponent`, `game-chat`, `game-back-blocked` (Android's back, iOS's swipe), `game-resume` (after the app's closed) |
| Accounts       | `account-create` (a name taken, then free), `account-sign-in-out` (a wrong password, then signing out)                                                                                                                                                                            |
| Friends        | `social-friend-profile`, `social-direct-message`, `social-challenge-sent`, `social-challenge-received`, `social-find-player` (and a friend request), `social-watch-friend`                                                                                                        |
| Daily games    | `daily-seek`, `daily-play-move` (move confirmation), `daily-conditional-moves`, `daily-analysis-notes` (and the opening explorer from it), `daily-list`                                                                                                                           |
| Review         | `game-review`, `review-settings-retry`                                                                                                                                                                                                                                            |
| Analysis       | `analysis-variations`, `analysis-paste-fen`, `analysis-paste-pgn`, `analysis-set-up-position`, `analysis-from-your-games`, `analysis-settings`, `opening-explorer`                                                                                                                |
| History, stats | `history-games-list` (its filters), `history-game-viewer` (and a bookmark), `stats-rating`                                                                                                                                                                                        |
| Elsewhere      | `tabs`, `settings-appearance` (kept after a relaunch), `settings-licenses`                                                                                                                                                                                                        |

Tags pick subsets while iterating (`maestro test --include-tags=...`):
`opponent` (a scripted opponent), `account` (signed in), `engine` (the
analysis engine, downloaded on first use - the internet, not just the
backend), `slow` (a minute or so of waiting on a clock).

Not covered: things a flow can't judge - how something looks (the
screenshot tour, below, is for that), sounds, haptics, the review's voice;
and native sheets that differ by platform (sharing a game).

## The backend's fixtures

The e2e backend is seeded (cchess-be's `e2e-fixtures` seeder, after its
bots) with:

- **`e2e_main`** - the account flows sign in as (`common/sign-in.yaml`) -
  and **`e2e_friend`**, friends; and the bots, `bot_1`..`bot_5`. Every
  password is `password`.
- e2e_main's finished games: a blitz loss with a queen blundered out of the
  book (6...Qxg5??) - the newest, which the review flows open - wins,
  losses and a draw across bullet, blitz and rapid over the last month,
  and an aborted game.
- Two daily games in progress: e2e_main to move against e2e_friend (1. e4
  e5), and bot_2 to move (1. d4). Flows tell them apart by the opponent's
  name - the list's order changes once a move's played.

A run's flows share one backend, so a flow that changes a fixture (playing
the daily move) changes it for the flows after it; none depends on another
having done so.

## Opponents

`common/to-board.yaml` starts a game against a scripted opponent - a guest
seeking the app's default 5+0, as black - through the bot server, and flows
pass their own (`BOT_ARGS`) for other games: `--moves d5,...` to play known
moves first (so a capture, a promotion or a pre-move happens where the flow
expects), `--draw accept|decline`, `--offer-draw`, `--idle`, `--chat`,
`--games 2` for a rematch, `--time 1+0`. `common/friend-online.yaml` signs
in and starts e2e_friend in friend mode (`--friend e2e_main`: answering
messages "You said: ...", accepting challenges; `FRIEND_ARGS: --challenge`
to send one). `scripts/opponent.js --help` has them all. A bot stopped by
the next flow aborts its game, or resigns it once both have moved, so no
game outlives its flow. Bots start after `sign-in.yaml`, whose fresh launch
stops every bot.

## Device-specific coordinates

A swipe can't be aimed by testID (`start: {id: ...}` parses but does the
wrong thing on Maestro 2.10.0), so the drags' ends are points per platform,
written into the flows for each platform under `runFlow: when: platform:`

- points on the iPhone 18 Pro, pixels on the Pixel 8 (`drag-and-drop`,
  `off-board-drag`, `common/tap-backdrop`, and iOS's own sheets and keyboard
  in `common/`). Not as env (`${...}`): given several flows, Maestro checks
  them all before substituting env, and a point that's only `${...}` fails
  to parse. The drags' are the squares' centres from
  `maestro hierarchy` on a fresh game's board. They go stale silently when
  anything moves the board on screen - a taller header, a different player
  bar - and Maestro reports a swipe that missed its piece as COMPLETED, the
  board just not changing; so when a drag "passes" but no move appears,
  re-dump the hierarchy and recompute.

## Gotchas (read before adding more)

- **Check moves in the move list, not by a piece's testID.** Android
  reports a view where it's laid out, not where a transform has moved it,
  and every piece is laid out on a8 and moved by a transform: so on Android
  only one `piece-*` is ever found. `move-<ply>` with the move's SAN as
  `text` works on both (`id: move-1`, `text: e4`).
- **Expo Go's floating dev-menu button** sits over the app's top right
  corner - over a header's buttons, taking their taps - unless the link
  says `__expo_disable_fab=1`, as every flow's does.
- **Expo Go's dev menu.** On iOS it's kept away by the link's
  `__expo_disable_onboarding=1`, and closed by its X (`id: xmark`) if it
  shows anyway - never "Continue", which opens the dev tools menu over the
  app, absorbing taps. Android's opens a moment _after_ the app has
  loaded, over Home, labelled "Close"; `launch-fresh.yaml` waits for both.
- **A synchronization barrier after launching.** `tapOn`/`swipe` don't wait
  for the app to be interactive, only for their own target - so the common
  flows end on an assertion that the screen is there.
- **A literal `+` in an `id:` or `text:` matcher is a regex quantifier** -
  escape it, `"time-control-option-bullet-1\\+0"`, or the match silently
  fails.
- **`text:` matches the whole accessible string**, and iOS merges sibling
  texts under one accessible Pressable into one comma-joined string (the
  time control trigger reads `"🔥, Blitz · 5+0, ⏷"`); prefer testIDs, or a
  regex (`".*3\\+2.*"`).
- **A full-screen backdrop's testID taps its centre**, which may be under
  the sheet on top of it - tap a point in the dimmed part instead
  (`common/tap-backdrop.yaml`).
- **Only one side's pieces can be moved, and only on its turn** - a piece
  that doesn't move may be the app correctly refusing it.
- **Start bots after signing in** - the fresh launch stops every bot.
- **iOS's own sheets** - "Use Strong Password?" over a new password field,
  "Save Password?" after a sign-in form goes - are missing from Maestro's
  hierarchy: they're closed by point, in
  `account-create.yaml` and `common/dismiss-save-password.yaml`.
- **Leaving a screen is a tap on its back button**, through
  `common/header-back.yaml` (or a sheet's Cancel): the app's own chevron on
  iOS (`header-back`), Android's native arrow ("Navigate up") there, as
  header items are iOS's alone. Maestro's `back` is Android's alone, and
  closes an open keyboard before it leaves anything.
- **A sheet past 75% of the screen scrolls**, and `tapOn` doesn't: reach
  what's below the fold with `scrollUntilVisible` first.
- **Closing the keyboard** goes through `common/dismiss-keyboard.yaml`:
  `hideKeyboard` on iOS fails when the simulator has no on-screen keyboard
  up, so there it's a tap on empty space; on Android it's a back press,
  which can leave the screen as well, so only where nothing else - a tap
  on the header's back, above the keyboard - would close it.
- **A move's text differs**: iOS reads a move token as "1. Ra8#", Android
  as "Ra8#" - match with a regex, `".*Ra8#"`.
- **A card's texts are its own**: both platforms read a pressable card's
  texts as its label, so match the card by `id` and a `text` regex
  (`".*bot_2.*"`) - `containsDescendants` finds nothing under it on iOS.

## The screenshot tour

`screens-tour.yaml` visits the app's screens and screenshots each, for
comparing the platforms side by side - not a test, and left out of runs:

```bash
scripts/e2e/run.sh --platform android .maestro/screens-tour.yaml
```

The screenshots land in `.e2e-logs/maestro/`.

## In CI

`.github/workflows/e2e.yml` runs every flow on both platforms, on every PR
and push to `main`/`develop`, each in three shards: Android on Linux
(Docker for the backend, KVM for the emulator), iOS on macOS (cchess-be run
directly, on Postgres 18). Each shard uploads its `.e2e-logs/`.
