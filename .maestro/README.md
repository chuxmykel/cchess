# E2E flows (Maestro)

Real device/simulator tests, as opposed to the Jest/RNTL suite in `src/`,
which only _simulates_ React Native's PanResponder gesture protocol. These
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

Each flow is independent and self-contained: every flow starts with
`runFlow: common/launch-fresh.yaml`, `common/to-new-game.yaml`, or
`common/to-board.yaml` (whichever gets it to the screen it actually
needs - see "Navigation path" below), all of which force-quit and clear
Expo Go's state, then deep-link back into the project. No flow depends
on another's leftover state, and they can run in any order.

## What's covered, and what isn't

- **Navigation**: `common/launch-fresh.yaml` (→ Home), `to-new-game.yaml`
  (→ New Game), and `to-board.yaml` (→ a fresh game's board) are the
  layered entry points every flow builds on - see "Navigation path"
  below.
- **Board/gameplay**: tap-to-move, drag-and-drop, captures, and an
  off-board drag snapping back (`tap-to-move.yaml`, `drag-and-drop.yaml`,
  `capture.yaml`, `off-board-drag.yaml`, `new-game-renders.yaml`).
- **New Game screen**: picking a time control from the bottom sheet
  (`time-control-selection.yaml`), dismissing the sheet via its backdrop
  without changing the selection (`bottom-sheet-dismiss.yaml`), and the
  "Coming Soon" buttons' disabled-look-but-still-tappable toast
  (`coming-soon-toast.yaml`).
- **Not covered**: Home itself (Friends carousel, Recent Games, Profile -
  no interactive behavior worth a real-device flow yet, mostly
  TODO-stubbed handlers; `common/launch-fresh.yaml` is ready for this
  once there's something worth asserting on), the bottom sheet's
  drag-to-dismiss gesture (covered at the hook level instead - see
  `src/hooks/__tests__/useBottomSheet.test.tsx` - a real swipe gesture
  through Maestro wasn't attempted here).

## Navigation path: launch lands on Home, not the board

A fresh launch shows the **Home** tab (Friends carousel, Recent Games
list, a "Play" bar pinned above the tab bar), not the chessboard. Three
common flows cover progressively deeper navigation, each building on
the last:

1. `common/launch-fresh.yaml` - clear state, deep-link in, dismiss the
   dev-menu overlay. Lands on **Home**. The base every other common flow
   (and any future Home-screen flow) builds on.
2. `common/to-new-game.yaml` - runs `launch-fresh.yaml`, then taps
   `play-button`. Lands on the **New Game** screen.
3. `common/to-board.yaml` - runs `to-new-game.yaml`, then taps
   `start-new-game-button`. Lands on the **Game** screen's chessboard.

Use whichever one matches what the flow actually needs - a flow testing
only the New Game screen should `runFlow: common/to-new-game.yaml`
directly rather than `to-board.yaml`, and a flow testing only Home
should use `launch-fresh.yaml` directly. `to-board.yaml` in particular
is meant only for flows that actually need the board (its own game
state) - pulling it into something that doesn't need a started game
just adds navigation the flow has to wait through for no reason.

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
- **Board-layout coordinates silently go stale when _navigation_ around
  the board changes, even though nothing in `ChessBoard`/`Game` itself
  did.** Found this session: the drag-and-drop/off-board-drag swipe
  coordinates (piece-e2's center, piece-g1's center) were still the
  values from commit `d88824f`, written back when Game was reached
  through a root **drawer** navigator. `e3656a3` later replaced that
  with a stack nested under bottom tabs, and further commits added a
  Home header and a pinned Play bar - nobody re-captured the
  coordinates after. `Game`'s container is `flex: 1, justifyContent:
"center", alignItems: "center"` - the board is centered in whatever
  height its container gets, not fixed-position, so a different
  enclosing navigator/chrome changes where that centered board lands on
  screen with zero changes to board code. Recomputed via `maestro
hierarchy`: piece-e2's center moved from `(226,613)` to `(226,562)`,
  piece-g1's from `(326,663)` to `(326,613)`.
  Maestro reports `COMPLETED` for a swipe even when its start point
  misses the piece entirely - there's no error, the board just silently
  doesn't change. If a drag flow "succeeds" but nothing moved, don't
  trust the old numbers; re-dump `maestro hierarchy` and recompute -
  and check whether it's really the board that changed, or something
  further up the navigation tree.
- **A literal `+` in an `id:` or `text:` matcher is a regex quantifier,
  not a character - both silently fail to match.** Every time-control
  testID/label containing `+` (e.g. `time-control-option-bullet-1+0`,
  or the text `"5+0"`) needs it escaped as `\\+` in the YAML string, or
  Maestro reports "Element not found" / the assertion fails even though
  the element is clearly on screen.
- **`text:` matches the _complete_ accessibility string, not a
  substring - and iOS merges sibling Text nodes under one accessible
  Pressable into a single comma-joined string.** The time control
  trigger's icon, label, and caret are three separate `<Text>` children,
  but because the parent `Pressable` is one accessible element, Maestro
  sees them as one merged string: `"🔥, Blitz · 5+0, ⏷"`. Asserting
  `text: "Blitz · 5+0"` (or even just `"Blitz"`) fails - only the full
  merged string, comma-joined with the icon and caret, matches. This
  makes trigger-label assertions brittle (tied to the exact merge
  format); prefer asserting on testIDs instead, and leave exact label
  text to the RTL component tests, which don't have this merging
  behavior.
- **A full-screen backdrop's `testID` doesn't necessarily tap where you
  think.** The bottom sheet's backdrop `Pressable` covers the entire
  screen (so `BottomSheet`'s own RTL test can press it directly), but
  the sheet's content renders on top of it and visually covers most of
  that area. Maestro resolves `id: "bottom-sheet-backdrop"` to a tap at
  the center of its (full-screen) bounds, which lands on the sheet
  content instead of the actually-dimmed area - the tap gets absorbed
  by whatever's on top, not an error, so it looks like a no-op rather
  than a wrong-target tap. Use a literal point coordinate in the region
  that's visibly still dimmed instead (see `bottom-sheet-dismiss.yaml`).
