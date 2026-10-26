---
name: run-ios-simulator
description: Launch cchess in the iOS Simulator and drive it (tap, drag-and-drop, screenshots) to verify a change actually works. Use whenever asked to run, start, or screenshot the app, or to confirm a change works in the real app on this machine — not just the Jest/RNTL test suite. For the machine-specific environment gotchas (no Simulator.app, no GUI automation permissions, Node version mismatch, Maestro quirks), see the global `ios-simulator-setup` skill — this skill only covers what's specific to cchess.
---

# Run cchess in the iOS Simulator

This assumes the `ios-simulator-setup` skill's environment facts and
general steps (booting the simulator, screenshotting, driving Maestro).
What follows is only what's specific to cchess: the project path, its
testIDs, how to get from launch into a live game (which now needs a
backend and an opponent), and known-good example flows.

**Last verified: 2026-10-26.** Added and ran the account flows (create
account, sign out, sign in) against a local `cchess-be`, after Home and
Profile gained a guest sign-in prompt and Recent Games started loading
from the server. Before that, re-ran every game example flow below on
`iPhone 18 Pro` (iOS 27.0) against a local `cchess-be` with
`scripts/opponent.js`, after the LiveGame screen gained a header, a move
list, a ☰ game menu, a bottom toolbar and a game-over card, with the board
centered between them - the drag coordinates were re-measured. `tap-move.yaml` wasn't re-run (it taps
by testID only, unaffected by the layout change).

## Project specifics

- **Pinned node version**: `22.16.0` (see `.nvmrc`).
  ```bash
  source ~/.nvm/nvm.sh && nvm use
  ```
- **Boot and start the app**:
  ```bash
  cd /Users/chux_fortress/projects/personal/cchess
  npx expo start --ios
  ```
  Watch the log for `iOS Bundled ... AppEntry.js`. If it says `Port 8081
is running this app in another window`, an Expo server for this project
  is already up - that's fine, reuse it (Maestro deep-links to
  `exp://127.0.0.1:8081` either way).
- **Backend**: a live game needs `cchess-be` (sibling repo,
  `../cchess-be`) running at `http://localhost:3000`, or wherever
  `EXPO_PUBLIC_SERVER_URL` points. A 404 from `curl localhost:3000/` means
  it's up. Ask the user to start it rather than starting it yourself.

## Getting into a live game

A fresh launch shows the **Home** tab. Start New Game opens **LiveGame**
in its seeking phase - the waiting card over an empty board - until a
second player seeks the same time control; the game then starts on the
same screen. Nothing reaches a game without an opponent.

1. `maestro --device <UDID> test .maestro/common/to-new-game.yaml` -
   clears state, launches, dismisses the dev menu, taps Play. Lands on
   **New Game** (default time control 5+0).
2. Tap `start-new-game-button` - the app is now seeking.
3. Start the scripted opponent (see below) - it seeks 5+0, gets matched
   with the app, and the game starts in place.

`examples/to-board.yaml` is steps 1-2 plus waiting for the board. Start
the opponent while it waits, or before it - either order matches.

### The scripted opponent: `npm run opponent`

`scripts/opponent.js` creates a guest, seeks, plays a random legal move
whenever it's its turn, declines draw offers, and exits once the game is
over. Run it in the background (it stays alive for the whole game):

```bash
nohup npm run opponent --silent -- --color w > /tmp/opponent.log 2>&1 &
```

- `--time 3+2` - seek a different time control (must match the app's
  selection).
- `--delay 300` - ms before each bot move (default 800).
- `--color w|b` - the color the **bot** must get. The server assigns
  colors at random (a coin flip in `cchess-be`'s matchmaking service), so
  this can't request one. If the bot gets the other color it aborts and
  exits with code 2. So `--color w` means "make the app play black."
- Exit codes: 0 when the game ends, 1 for connection/auth/matchmaking
  errors, 2 for the wrong color.

To force a color, retry until it lands. A fresh launch each time clears
the aborted game off the app's screen:

```bash
for i in 1 2 3 4 5 6 7 8; do
  maestro --device $UDID test .claude/skills/run-ios-simulator/examples/to-new-game-and-seek.yaml >/dev/null 2>&1 || continue
  nohup npm run opponent --silent -- --color w > /tmp/opponent.log 2>&1 &
  until grep -qE "matched|error" /tmp/opponent.log; do sleep 0.5; done; sleep 1
  grep -q "wrong color" /tmp/opponent.log || break
done
```

**Stopping the opponent mid-game** (`pkill -f scripts/opponent.js`) makes
the server end the game by abandonment a few moments later, and the app
shows a "You won - By Abandonment" banner. To end a game deliberately,
resign or abort from the app (see `examples/resign.yaml` /
`examples/abort.yaml`) - the opponent then exits on its own.

## Known testIDs

- **Navigation**: `play-button` (Home), `time-control-trigger` and
  `start-new-game-button` (New Game). The tab bar has no testIDs and its
  labels aren't matched by text - tap Home at (100, 817) and Profile at
  (301, 817).
- **Home**: `avatar-button` (header, opens Profile), `recent-games-loading`,
  `game-row-<gameId>`, `recent-games-retry`. Guests see `sign-in-prompt`
  (with `sign-in-button` / `create-account-button`) where signed-in
  players see Friends.
- **Profile**: `profile-screen`, `rating-<category>`, `sign-out-button`;
  guests get the same `sign-in-prompt`.
- **Sign in / Create account**: `sign-in-screen` / `create-account-screen`,
  inputs `username-or-email-input`, `username-input`, `email-input`,
  `password-input`, plus `account-form-submit`, `account-form-error` and
  `account-form-switch` (to the other form).
- **Board**: `chessboard`, `square-<file><rank>`, `piece-<file><rank>`,
  `valid-move-<square>`, `drag-guide` - from
  `src/components/ChessBoard/`. These are always named by the real
  square, whichever way the board faces.
- **LiveGame while seeking**: `seeking-content`, `seek-card`,
  `matchmaking-cancel-button` (centered in the bottom bar, where the
  game's toolbar sits).
- **LiveGame**:
  - Header: `game-header`, `game-header-menu` (⋯), `share-game-item`
    (in that menu), `game-header-back` (only once the game is over).
  - Move list (under the header): `move-list`, `move-<ply>` (tap to view
    that position; the current one is `selected`).
  - Player bars: `player-bar-w` / `player-bar-b`.
  - Earlier positions: `earlier-position` wraps a `static-chessboard`
    drawn over the live board while browsing. It stays mounted but hidden
    (and out of the accessibility tree) while live, so `piece-<square>`
    always resolves to the visible board.
  - Toolbar (`game-toolbar`, in the bottom bar): `game-menu-button` (☰),
    `toolbar-resign-button` (⚑, enabled once both sides have moved),
    `previous-move-button` / `next-move-button`.
  - ☰ menu (an action sheet): `flip-board-action`, `abort-game-action`
    (until black's first move) / `resign-action`, `offer-draw-action`,
    `action-sheet-cancel`.
  - Draw offers: `draw-offer-prompt` with `accept-draw-button` /
    `decline-draw-button`.
  - Game over: `game-over-overlay`, `game-over-card`,
    `new-opponent-button`.
  - Loading: `live-game-skeleton`.

  These come from `src/screens/LiveGame/LiveGameContent.tsx` and the
  components it renders.

If any of these change, dump `maestro --device <UDID> hierarchy` instead
of trusting this list.

## Board orientation and drag coordinates

The board starts from the app player's own side: white at the bottom
when the app is white, black at the bottom (files h→a, rank 1 on top)
when it's black. The ☰ menu's Flip board (`flip.yaml`) toggles it. Taps by testID work in
any orientation. **Swipe coordinates don't** - the same square is at a
different point once the board is flipped or the app plays the other
color.

Measured on iPhone 18 Pro (iOS 27.0): the board runs from x 0-402 and
y 264-666 in points, about 50.25pt per square - the same on the
seeking phase, which shares the game's layout. Point centers:

| Square | App is white, unflipped | App is black, unflipped |
| ------ | ----------------------- | ----------------------- |
| e7     | (226, 339)              | (175, 590)              |
| e5     | (226, 440)              | (175, 490)              |
| g1     | (326, 641)              | (75, 289)               |
| f3     | (276, 540)              | (125, 389)              |

The black-side column was measured from a hierarchy dump during a live
game on 2026-10-26. The white-side numbers are calculated from the same
board bounds. The board is centered between the move list and the bottom
bar, so it moves whenever anything above or below it changes height -
dump the hierarchy and re-check before trusting either column on another
device or after any layout change.

## Known-good example flows

All in `examples/`. Run them in this order against one app session, with
the opponent started during step 1:

1. `to-board.yaml` - fresh launch → New Game → Start New Game, then waits
   up to 20s for `game-toolbar` (i.e. a matched game). Needs the
   opponent.
   (`to-new-game-and-seek.yaml` is the same without the wait, for the
   retry loop above.)
2. `drag-move-black.yaml` - with the app as black: drags e7→e5 using the
   black-side coordinates, then asserts `piece-e5`. Only legal once the
   bot (white) has moved, which it does by itself within about a second.
3. `flip.yaml` - ☰ → Flip board.
4. `resign.yaml` - resigns with the toolbar's ⚑ and waits for
   `game-over-card`. Needs both sides to have moved.

`abort.yaml` (☰ → Abort game → confirm, then waits for "Game aborted")
is the alternative to step 4 straight after step 1, before black's first
move.

`tap-move.yaml` (e2→e4 by testID) works in any orientation, but only
when the app is white and it's white's turn.

Account flows (no opponent needed, just the backend):

- `create-account.yaml` - from a guest's sign-in prompt on Home or
  Profile, creates an account. Needs a fresh `-e USERNAME=...` each run.
- `sign-out.yaml` - from either tab, signs out to a new guest.
- `sign-in.yaml` - from a guest's prompt, signs back in
  (`-e USERNAME=...`, password `secret123` unless `-e PASSWORD=...`).
- `dismiss-save-password.yaml` - used by the two above (see Gotchas).

Run them as create-account → sign-out → sign-in with the same USERNAME.

## Gotchas

- **A "fresh" launch doesn't sign you out.** `launchApp: clearState`
  clears Expo Go's data but not the iOS keychain, where the refresh token
  lives - so after an account flow, later "fresh" launches (including
  `to-board.yaml`) resume that account. Run `sign-out.yaml` to get back
  to a guest.
- **iOS password prompts swallow input and are invisible to Maestro.**
  Focusing Create account's password field opens "Use Strong Password?",
  which eats the typing that follows; leaving a filled-in password form
  opens "Save Password?". Both are iOS UI, missing from `maestro
hierarchy` and from Maestro's own screenshots (`xcrun simctl io booted
screenshot` shows them), so the app looks frozen. `create-account.yaml`
  and `dismiss-save-password.yaml` close them by point. Typing into a
  secure field a second time is unreliable for the same reason - reopen
  the form instead of retyping.

- **Swipes that miss still report `COMPLETED`.** If a drag flow
  "succeeds" but the board didn't change, the coordinates are stale or
  for the wrong orientation (see the table above). Re-dump the hierarchy.
  Asserting `piece-<target>` right after the swipe catches this, as
  `drag-move-black.yaml` does.
- **`tapOn: "Resign"` hits the toolbar's ⚑, not the alert's button.** The
  ⚑'s accessibility label is also "Resign", so the confirmation alert
  just stays open. `resign.yaml` taps the alert's button by point.
  (`tapOn: "Abort"` is unambiguous, so `abort.yaml` taps by text.)
- **Menu and sheet actions run only once their menu has finished
  closing.** On iOS, presenting the share sheet or an Alert while a
  modal is still animating away silently does nothing, so the ☰ sheet
  and the ⋯ menu hold the chosen action until their modal reports it's
  gone (`src/hooks/useRunAfterDismiss.ts`). Wait for the result (as the
  flows do with `extendedWaitUntil`) rather than asserting right after
  the tap.
- **`tapOn: { id: "xmark", optional: true }` reports `WARNED`** when the
  dev-menu overlay isn't there (a reload instead of a fresh install).
  That's expected.
- **The game-over back chevron (`game-header-back`) lands on New Game,
  not Home** - the tab's own stack still has New Game on top, so
  `play-button` isn't there; `start-new-game-button` is. "New opponent"
  instead goes straight back into matchmaking with the same time
  control.
- **Only move your own color on your own turn.** In LiveGame the app's
  pieces are draggable only when it's the app's turn and the game is
  active. Dragging at any other time looks exactly like a broken swipe.
