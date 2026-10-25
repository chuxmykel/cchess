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

**Last verified: 2026-10-25.** Played full live games against a local
`cchess-be` as both white and black using `scripts/opponent.js`,
including tap and drag moves with the board flipped, and confirmed every
example flow below on `iPhone 18 Pro` (iOS 27.0).

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

A fresh launch shows the **Home** tab. Start New Game goes to the
**Matchmaking** screen, which waits until a second player seeks the same
time control. Nothing reaches the board without an opponent.

1. `maestro --device <UDID> test .maestro/common/to-new-game.yaml` -
   clears state, launches, dismisses the dev menu, taps Play. Lands on
   **New Game** (default time control 5+0).
2. Tap `start-new-game-button` - the app is now seeking.
3. Start the scripted opponent (see below) - it seeks 5+0, gets matched
   with the app, and the app moves on to **LiveGame**.

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
resign from the app (see `examples/resign.yaml`) - the opponent then
exits on its own.

## Known testIDs

- **Navigation**: `play-button` (Home), `time-control-trigger` and
  `start-new-game-button` (New Game).
- **Board**: `chessboard`, `square-<file><rank>`, `piece-<file><rank>`,
  `valid-move-<square>`, `drag-guide` - from
  `src/components/ChessBoard/`. These are always named by the real
  square, whichever way the board faces.
- **LiveGame**: `flip-board-button`, `player-row-w` / `player-row-b`,
  `abort-button` (before any move) / `resign-button`,
  `offer-draw-button`, `accept-draw-button` / `decline-draw-button`,
  `game-over-banner`, `game-over-done-button` - from
  `src/screens/LiveGame/index.tsx` and the components it renders.

If any of these change, dump `maestro --device <UDID> hierarchy` instead
of trusting this list.

## Board orientation and drag coordinates

The board starts from the app player's own side: white at the bottom
when the app is white, black at the bottom (files h→a, rank 1 on top)
when it's black. `flip-board-button` toggles it. Taps by testID work in
any orientation. **Swipe coordinates don't** - the same square is at a
different point once the board is flipped or the app plays the other
color.

Measured on iPhone 18 Pro (iOS 27.0): the board runs from x 0-402 and
y 119-520 in points, about 50.25pt per square. Point centers:

| Square | App is white, unflipped | App is black, unflipped |
| ------ | ----------------------- | ----------------------- |
| e7     | (226, 195)              | (175, 446)              |
| e5     | (226, 295)              | (175, 345)              |
| g1     | (326, 496)              | (75, 144)               |
| f3     | (276, 395)              | (125, 245)              |

The black-side column, plus g1/f3 with the white board flipped (also
75,144 and 125,245), were measured from a hierarchy dump during live
games. The white-side numbers are calculated from the same board bounds.
Dump the hierarchy and re-check before trusting either column on another
device or after any layout change.

## Known-good example flows

All in `examples/`. Run them in this order against one app session, with
the opponent started during step 1:

1. `to-board.yaml` - fresh launch → New Game → Start New Game, then waits
   up to 20s for `flip-board-button` (i.e. a matched game). Needs the
   opponent.
   (`to-new-game-and-seek.yaml` is the same without the wait, for the
   retry loop above.)
2. `drag-move-black.yaml` - with the app as black: drags e7→e5 using the
   black-side coordinates, then asserts `piece-e5`. Only legal once the
   bot (white) has moved, which it does by itself within about a second.
3. `flip.yaml` - taps `flip-board-button`.
4. `resign.yaml` - resigns and waits for `game-over-banner`.

`tap-move.yaml` (e2→e4 by testID) works in any orientation, but only
when the app is white and it's white's turn.

## Gotchas

- **Swipes that miss still report `COMPLETED`.** If a drag flow
  "succeeds" but the board didn't change, the coordinates are stale or
  for the wrong orientation (see the table above). Re-dump the hierarchy.
  Asserting `piece-<target>` right after the swipe catches this, as
  `drag-move-black.yaml` does.
- **`tapOn: "Resign"` hits the screen's Resign button, not the alert's.**
  Both say "Resign", and Maestro picks the one underneath, so the
  confirmation alert just stays open. `resign.yaml` taps the alert's
  button by point instead.
- **`tapOn: { id: "xmark", optional: true }` reports `WARNED`** when the
  dev-menu overlay isn't there (a reload instead of a fresh install).
  That's expected.
- **After `game-over-done-button`, don't assume you're back on Home** -
  `play-button` wasn't found right after tapping Done once. Start the
  next game with a fresh launch (`to-board.yaml` /
  `to-new-game-and-seek.yaml`) instead.
- **Only move your own color on your own turn.** In LiveGame the app's
  pieces are draggable only when it's the app's turn and the game is
  active. Dragging at any other time looks exactly like a broken swipe.
