# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A chess app for iOS (more platforms planned), built with React Native (0.86) +
Expo SDK 57 + React 19 + TypeScript. Pieces move by tap-to-move or
drag-and-drop; all chess rules enforcement (legality, check/checkmate/
stalemate, castling, en passant, promotion) is delegated to
[chess.js](https://github.com/jhlywa/chess.js) via `src/domain/ChessEngine.ts`.

## Commands

```bash
nvm use                  # Node 22.16.0 is pinned in .nvmrc - always run this first
npm install

npm start                # start Metro; press i or scan the QR code with Expo Go
npm run ios              # start Metro and open directly in the iOS Simulator

npm test                 # full Jest suite
npm test -- --watch      # watch mode
npm test -- path/to/file.test.ts          # a single file
npm test -- -t "name of test or describe" # filter by test name

npm run test:e2e         # full Maestro e2e suite (see .maestro/README.md)
maestro test .maestro/tap-to-move.yaml    # a single Maestro flow, while iterating
```

Maestro e2e requires `expo start` already running (deep-links via
`exp://127.0.0.1:8081`) and a booted simulator with Expo Go installed. It's
a separate, non-npm install (`curl -Ls "https://get.maestro.mobile.dev" | bash`).
For driving the app end-to-end on this machine, use the `run-ios-simulator`
skill (project specifics: testIDs, navigation path, known-good example flows)
together with the global `ios-simulator-setup` skill (machine gotchas).

There are no lint/typecheck npm scripts configured; `tsconfig.json` extends
`expo/tsconfig.base` with `strict: false`.

## Architecture

The codebase is layered strictly bottom-up, and each layer is deliberately
blind to the ones above it:

```
domain/        pure chess logic, zero React/RN imports, plain Jest-testable
  -> hooks/     React state + animation layer, no chess-rules knowledge
    -> components/   presentational only, consumes hooks/context above
      -> screens/     wires components + navigation together
```

- **`src/domain/`** - framework-agnostic chess logic.
  - `ChessEngine.ts` - a facade over chess.js: `attemptMove`, legal moves,
    turn/check/game-over status. Returns a `MoveResult` discriminated union
    (`"illegal"` | `"needs-promotion-choice"` | `"ok"`) rather than throwing,
    so callers don't need try/catch to handle illegal moves or pending
    promotions.
  - `types.ts` - `DomainPiece`, `DomainMove`, `AppliedMove`, `MoveResult`,
    etc. `AppliedMove` carries everything the UI needs to animate a move
    (capture square, castling rook from/to, en passant/promotion flags)
    without re-deriving it from the engine.
  - `boardCoordinates.ts` - square <-> pixel math.
  - `castlingSquares.ts` - castling rook from/to squares.

- **`src/hooks/useChessGame.ts`** - the single state machine for an
  in-progress game: a reducer owning one `ChessEngine` instance plus
  selection/turn/promotion UI state. `handleSquareTap` encodes the
  select-then-move tap interaction; drag-and-drop calls `attemptMove`
  directly. Other hooks (`usePieceAnimations`, `useDragGuide`,
  `useValidMoveIndicators`, `usePieceGesture`) bridge domain state to
  `Animated.Value`s for tweening/gesture handling and know nothing about
  chess rules themselves.

- **`src/screens/Game/ChessGameContext.tsx`** - wraps `useChessGame` in a
  React Context scoped to the Game screen only (not app-wide state) purely
  to avoid prop-drilling from `Game` -> `ChessBoard` -> `Piece`.

- **`src/components/ChessBoard/`** - composes the board from
  `ChessGameContext` + the hooks above; everything under it
  (`BoardSurface`, `Pieces/Piece`, `Row`, `Square`,
  `PieceDragAndDropGuide`, `ValidMoveIndicators`) is purely presentational
  and renders only what it's given as props/context.

- **Navigation** (React Navigation, nested stacks/tabs):
  `App.tsx` (root native-stack) -> `HomeStack` (`HomeTabs`, `Game`) ->
  `HomeTabs` (bottom tabs: `HomeTabStack`, `Profile`) -> `HomeTabStack`
  (native-stack: `Home`, `NewGame`). A fresh launch lands on the `Home`
  tab (not the board) - the path to a game is Home -> New Game -> Start
  New Game -> Game.

- **`src/constants/`** - board size, piece image lookups
  (`PIECES['wk' | 'bq' | ...]`), castling squares, time controls, etc.

- **`src/utils/`** - RN `Animated` helpers (`animation.ts`: castling
  animation, piece ids) and color helpers (`color.ts`), independent of the
  chess domain.

- **`src/testUtils/`** - Jest/RNTL helpers: simulated PanResponder gestures
  (`panResponderGesture.ts`), `Animated.Value` read helpers, and a
  text-based board visualizer for debugging board state in test failures.

## Testing

Two deliberately separate layers - don't let one re-do the other's job:

| | Unit/component (Jest) | End-to-end (Maestro) |
|---|---|---|
| Run with | `npm test` | `npm run test:e2e` |
| Covers | Chess rules, game state machine, gesture -> callback translation, rendering | Real native gestures driving the actual running app |
| Needs a simulator? | No | Yes |

- Chess rules (legality, check/checkmate, castling, en passant, promotion)
  are unit-tested directly against `ChessEngine`, no rendering involved -
  see `src/domain/__tests__/`.
- The gesture layer (tap/drag -> the right move being attempted) is tested
  by simulating React Native's PanResponder protocol via RNTL - see
  `src/components/ChessBoard/index.spec.tsx` and `testUtils/panResponderGesture.ts`.
- "Does this actually work on a real device" questions belong in a Maestro
  flow under `.maestro/`, not a Jest test.

## Conventions

- Business/chess logic never lives in a component or screen - it belongs in
  `src/domain/` or `src/hooks/useChessGame.ts`. Keep `components/ChessBoard/`
  purely presentational when adding to it.
- Animated-value bookkeeping is kept in its own hooks
  (`usePieceAnimations`/`useDragGuide`/`useValidMoveIndicators`), separate
  from game-state logic.
- This is an Expo managed-workflow project - no native `ios`/`android`
  directories are checked in. `expo prebuild` would generate them on demand
  if a bare workflow is ever needed.
- Board color themes are defined inline in `src/screens/Game/index.tsx`
  (`chess.com`, `lichess.org`, `monochrome`, `powderblue`, `test`) - only
  `test` is currently wired up as active.
