# E2E flows (Maestro)

Real device/simulator tests, as opposed to the Jest/RNTL suite in `src/`,
which only *simulates* React Native's PanResponder gesture protocol. These
flows drive the actual app running in a real iOS Simulator via Apple's
XCTest instrumentation, so they catch things the simulated tests structurally
can't.

## Prerequisites

1. **Maestro installed** at `~/.maestro/bin/maestro` - not an npm dependency
   (there is no official npm package for it);
2. **`expo start` running locally**, serving on the default port 8081.
   Every flow deep-links via `exp://127.0.0.1:8081` (see
   `common/launch-fresh.yaml`), so this has to already be up:
   ```bash
   source ~/.nvm/nvm.sh && nvm use 22.16.0   # see the skill doc - this matters
   npx expo start --ios
   ```
3. **A simulator booted** with the project open at least once (so Expo Go
   is installed) - `expo start --ios` handles this itself.

## Running

```bash
npm run test:e2e              # every flow in this directory
maestro test .maestro/tap-to-move.yaml   # a single flow, while iterating
```

Each flow is independent and self-contained: `common/launch-fresh.yaml`
(included via `runFlow`) force-quits and clears Expo Go's state, then
deep-links back into the project, guaranteeing a brand new `ChessEngine`
instance (fresh game) for every flow - no flow depends on another's
leftover state, and they can run in any order.

## What's covered, and what isn't

WIP (TBD)

## Gotchas discovered writing these (read before adding more)

- **Tap the dev-menu's "X" (`id: xmark`), never "Continue".** Continue
  doesn't dismiss the first-launch overlay - it advances into the actual
  dev tools menu (Reload/Go home/Source code explorer/...), which then
  sits on top of the board and silently absorbs whatever the next tap's
  screen coordinates happen to land on. This produced a very confusing
  failure (a tap aimed at a board square opened "Source code explorer"
  instead) before being traced back to this.
- **`assertVisible` after launch is a required synchronization barrier,
  not optional.** `tapOn`/`swipe` don't wait for the board to be
  interactive, only for Maestro's own target element to resolve - a flow
  that starts interacting immediately after the launch subflow, without
  that assertion, races ahead and silently misses.
- **Only drag a piece whose color actually moves next.** A black piece is
  correctly non-draggable (disabled) until white has moved - dragging one
  on move one looks exactly like a broken swipe (nothing happens) but is
  the app correctly refusing it. `drag-and-drop.yaml` originally tried to
  drag d7 (black) first and chased a phantom "swipe doesn't work" bug for
  a while before this was spotted.
- **Swipe needs literal point coordinates, not selectors.** `start:
  {id: ...}` parses but silently does the wrong thing on this Maestro
  version (2.10.0) - use `start`/`end` as `"x,y"` point strings in points
  (not screenshot pixels), computed from a `maestro hierarchy` bounds
  dump. These are specific to iPhone 18 Pro / iOS 27.0's layout -
  recompute for any other device or board state.
