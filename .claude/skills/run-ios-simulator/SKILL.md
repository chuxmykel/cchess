---
name: run-ios-simulator
description: Launch cchess in the iOS Simulator and drive it (tap, drag-and-drop, screenshots) to verify a change actually works. Use whenever asked to run, start, or screenshot the app, or to confirm a change works in the real app on this machine — not just the Jest/RNTL test suite. For the machine-specific environment gotchas (no Simulator.app, no GUI automation permissions, Node version mismatch, Maestro quirks), see the global `ios-simulator-setup` skill — this skill only covers what's specific to cchess.
---

# Run cchess in the iOS Simulator

This assumes the `ios-simulator-setup` skill's environment facts and
general steps (booting the simulator, screenshotting, driving Maestro).
What follows is only what's specific to cchess: the project path, its
testIDs, the navigation path from launch to the board, and known-good
example flows.

**Last verified: 2026-10-06.** Re-ran the full flow end-to-end after the
home screen was rebuilt this session (Friends carousel, Recent Games,
tab bar, New Game screen) — the app **no longer lands on the chessboard
at launch**. Confirmed the new navigation path, fixed stale drag
coordinates that had silently gone wrong (see Gotchas), and verified
`examples/to-board.yaml` → `tap-move.yaml` → `drag-move.yaml` chains
correctly on a fresh launch, plus the Jest suite.

## Project specifics

- **Pinned node version**: `22.16.0` (see `.nvmrc`).
  ```bash
  source ~/.nvm/nvm.sh && nvm use 22.16.0
  ```
- **Boot and start the app**:
  ```bash
  cd /Users/chux_fortress/projects/personal/cchess
  npx expo start --ios
  ```
  Watch the log for `Logs for your project will appear below.` and then
  `iOS Bundled ... AppEntry.js` — that's your signal the app is up.

## Navigation path: launch lands on Home, not the board

As of this session, a fresh launch shows the **Home** tab (Friends
carousel, Recent Games list, a "Play" bar pinned above the tab bar) —
it does **not** open directly onto the chessboard the way it used to.
To reach the board:

1. Dismiss the first-launch dev-menu overlay if present (`id: "xmark"`,
   mark it `optional: true` — it only shows on a genuinely fresh
   install/launch).
2. Tap `id: "play-button"` (Home's Play bar) → **New Game** screen
   (time control grid, "Start New Game", "Challenge a Friend", "Play
   Stockfish").
3. Tap `id: "start-new-game-button"` → **Game** screen, the chessboard.

`examples/to-board.yaml` does all three steps in one flow — run it
first, before any board-interaction flow below.

## Known testIDs

- **Navigation**: `play-button` (Home), `start-new-game-button` (New
  Game) — see `src/screens/Home/index.tsx` and
  `src/screens/NewGame/index.tsx`.
- **Board**: `square-<file><rank>`, `piece-<file><rank>`, `chessboard`
  — come from `src/components/ChessBoard/index.tsx` and
  `src/components/ChessBoard/Pieces/Piece/index.tsx`.

If any of these change, re-run `ios-simulator-setup`'s `hierarchy` dump
step rather than trusting this doc.

## Known-good example flows

Run in this order against a single app session (each assumes the
board state the previous one left behind):

1. `examples/to-board.yaml` — dismisses the dev-menu overlay, taps
   Play, then Start New Game. Lands on a fresh board.
2. `examples/tap-move.yaml` — select e2, tap e4. White's move.
3. `examples/drag-move.yaml` — point-coordinate swipe drags the d7
   pawn to d5. Only legal once it's Black's turn, i.e. after step 2.

All three were verified chained end-to-end against a running `expo
start --ios` session on `iPhone 18 Pro` (iOS 27.0) in this environment,
both individually and as one continuous run.

## Gotchas

- **Swipe coordinates in `drag-move.yaml` drift silently.** Maestro
  reports `COMPLETED` for a swipe even when its start point misses the
  piece entirely — it delivered the gesture, it just didn't grab
  anything. There's no error to notice; the board just doesn't change.
  This bit the coordinates in this file directly: a layout shift
  (unrelated to the board itself) moved the on-screen board position,
  and the previously-documented `(175,361)→(175,462)` was off by
  ~50pt. If a drag flow "succeeds" but the screenshot shows no change,
  don't trust the old numbers — re-dump the hierarchy
  (`maestro --device <UDID> hierarchy`) and recompute the center of
  `piece-<square>`'s and `square-<square>`'s `bounds` yourself before
  assuming the move is illegal or the testID is wrong.
- **`tapOn: { id: "xmark", optional: true }` reports `WARNED`, not
  `COMPLETED`, when the element isn't there** — that's expected on a
  reload (vs. a true fresh install) where the dev-menu overlay never
  appears. Don't treat `WARNED` on that specific step as a failure.
