---
name: run-ios-simulator
description: Launch cchess in the iOS Simulator and drive it (tap, drag-and-drop, screenshots) to verify a change actually works. Use whenever asked to run, start, or screenshot the app, or to confirm a change works in the real app on this machine — not just the Jest/RNTL test suite. For the machine-specific environment gotchas (no Simulator.app, no GUI automation permissions, Node version mismatch, Maestro quirks), see the global `ios-simulator-setup` skill — this skill only covers what's specific to cchess.
---

# Run cchess in the iOS Simulator

This assumes the `ios-simulator-setup` skill's environment facts and
general steps (booting the simulator, screenshotting, driving Maestro).
What follows is only what's specific to cchess: the project path, its
testIDs, and known-good example flows.

**Last verified: 2026-10-03.** Re-ran the full flow (fresh `expo start
--ios` boot, `tap-move.yaml`, `drag-move.yaml`, screenshots, and the Jest
suite) end-to-end after being told the environment had changed. Every
command below still worked exactly as documented.

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

## Known testIDs

The square/piece testIDs this skill's examples reference
(`square-<file><rank>`, `piece-<file><rank>`, `chessboard`) come from
`src/components/ChessBoard/index.tsx` and
`src/components/ChessBoard/Pieces/Piece/index.tsx`. If those change,
re-run `ios-simulator-setup`'s `hierarchy` dump step rather than trusting
this doc.

## Known-good example flows

- `examples/tap-move.yaml` — select e2, tap e4, moves the pawn.
- `examples/drag-move.yaml` — point-coordinate swipe drag of a piece.

Both were verified end-to-end against a running `expo start --ios`
session on `iPhone 18 Pro` (iOS 27.0) in this environment, initially and
again on re-verification (2026-10-03) — same device type, same bounds,
same outcome both times.
