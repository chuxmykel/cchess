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

npm run lint             # eslint . (flat config: eslint-config-expo + prettier)
npm run lint:fix
npm run format           # prettier --write .
npm run format:check
```

Maestro e2e requires `expo start` already running (deep-links via
`exp://127.0.0.1:8081`) and a booted simulator with Expo Go installed. It's
a separate, non-npm install (`curl -Ls "https://get.maestro.mobile.dev" | bash`).
For driving the app end-to-end on this machine, use the `run-ios-simulator`
skill (project specifics: testIDs, navigation path, known-good example flows)
together with the global `ios-simulator-setup` skill (machine gotchas).

There's no typecheck npm script - run `npx tsc --noEmit` directly.
`tsconfig.json` extends `expo/tsconfig.base` with `strict: false`.

GitHub Actions runs lint, the Jest suite, and the Maestro e2e suite on every
push to `main` and on every PR (`.github/workflows/{lint,test,e2e}.yml`,
each a separate workflow file).

## Architecture

The codebase is layered strictly bottom-up, and each layer is deliberately
blind to the ones above it:

```
domain/        pure chess logic, zero React/RN imports, plain Jest-testable
network/       pure networking infra (REST/socket clients, event types), same style
  -> hooks/     React state, animation, and online-play orchestration layer
    -> context/   thin Providers wrapping a same-purpose hook, for prop-drilling
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

- **`src/network/`** - a second framework-agnostic layer, mirroring
  `domain/`'s pure-infra style but for talking to `cchess-be` (the
  NestJS/Socket.IO backend): `env.ts` (`SERVER_URL`, defaulting to
  `http://localhost:3000`), `restClient.ts` (guest-session REST calls),
  `socketClient.ts` (the one `AppSocket` singleton - `connectSocket`/
  `disconnectSocket`/`getSocket`, plus `waitForServerRejection` for
  detecting a stale token that connects but then gets kicked),
  `socketEvents.ts` (every client<->server event's payload types,
  confirmed against a live backend instance rather than just inferred -
  see that file's own header comment), and `tokenStorage.ts`
  (`expo-secure-store` wrapper for the access/refresh token pair).

- **`src/hooks/`** - two families, both consumed by `components/`/`screens/`
  above them:
  - The local chess state machine: `useChessGame.ts` (a reducer owning
    one `ChessEngine` instance plus selection/turn/promotion UI state -
    `handleSquareTap` encodes the select-then-move tap interaction,
    drag-and-drop calls `attemptMove` directly) plus the hooks that
    bridge its state to `Animated.Value`s for tweening/gesture handling
    (`usePieceAnimations`, `useDragGuide`, `useValidMoveIndicators`,
    `usePieceGesture`) - none of these know chess rules themselves.
  - Online-play orchestration, each wrapping the `network/` layer:
    `useAuthSessionBootstrap` (guest session + socket bootstrap, backs
    `AuthSessionContext`), `useMatchmaking` (seek/cancel/`game:created`
    for the `Matchmaking` screen), `useGameSnapshot` (the `game:join`
    fetch that seeds a `LiveGame` mount), `useOnlineChessGame` (drives an
    in-progress game on top of `useChessGame`, delegating server-push
    handling to `useGameServerEvents` - status/result/clocks/draw offers,
    and replaying the opponent's moves idempotently via a fen comparison
    against the echo of our own), `useGameClock` (client-side ticking
    between authoritative server clock updates), and
    `useConnectionLatency`/`useConnectionStrengthIndicator` (the ack-ping
    round-trip sample and its bars/label derivation).
  - Small reusable UI-state hooks with no game-domain knowledge at all:
    `usePopoverMenu`, `useToast`/`useToastBubbleAnimation`,
    `useBottomSheet`, `useCaretRotation`, `useGameScreenGestureLock`.

- **`src/context/`** - every file that defines a React context lives here,
  one top-level directory, rather than scattered across the layers that
  consume them.
  - `ChessGameContext.tsx` - wraps `useChessGame` in a Context scoped to a
    single game screen instance (not app-wide state) purely to avoid
    prop-drilling into `ChessBoard` -> `Piece`. Shared by every game-type
    screen, not just one - `LiveGame/OnlineChessGameContext.tsx` also
    provides through it.
  - `LiveGame/OnlineChessGameContext.tsx` - the online counterpart, backed
    by `useOnlineChessGame`; nested under `LiveGame/` since it's specific
    to that one screen.
  - `AuthSessionContext.tsx` - wraps `useAuthSessionBootstrap` the same way
    the two above wrap their own hooks; the one piece of genuinely app-wide
    state here (guest session + socket connection), mounted once in
    `App.tsx`, rather than scoped to a single screen.

- **`src/components/ChessBoard/`** - composes the board from
  `ChessGameContext` + the hooks above; everything under it
  (`BoardSurface`, `Pieces/Piece`, `Row`, `Square`,
  `PieceDragAndDropGuide`, `ValidMoveIndicators`) is purely presentational
  and renders only what it's given as props/context.

- **`src/components/`** (everything else) - also purely presentational,
  consuming hooks/context the same way: in-game UI (`GameClock`,
  `GameControls`, `GameOverBanner`, `GameResultIcon`, `GameTypeIcon`,
  `PromotionMenu`, `ConnectionStrengthIndicator`), shared primitives used
  across screens (`Button`, `Avatar`, `BottomSheet`, `Popover`/
  `PopoverMenu`, `SectionHeader`, `Toast`, `TimeControlSelector`), and
  `Home`-screen-specific pieces (`HomeHeader`, `FriendsCarousel`,
  `RecentGamesList`).

- **Navigation** (React Navigation, nested stacks/tabs):
  `App.tsx` (root native-stack) -> `HomeStack` (`HomeTabs`, `Matchmaking`,
  `LiveGame`) -> `HomeTabs` (bottom tabs: `HomeTabStack`, `Profile`) ->
  `HomeTabStack` (native-stack: `Home`, `NewGame`). A fresh launch lands on
  the `Home` tab (not the board) - the path to a game is Home -> New Game
  -> Start New Game -> Matchmaking -> LiveGame. `LiveGame` is named for what
  it is today - a server-driven online game - not a generic "any game"
  screen; a future local/offline game would get its own screen rather than
  being folded into this one.

- **`src/constants/`** - board size, piece image lookups
  (`PIECES['wk' | 'bq' | ...]`), castling squares, time controls, board
  themes (`boardThemes.ts`), user-facing error-message fallbacks
  (`errorMessages.ts`), home-screen placeholder data (`friends.ts`,
  `recentGames.ts`), etc.

- **`src/utils/`** - RN `Animated` helpers (`animation.ts`: castling
  animation, piece ids) and color helpers (`color.ts`), independent of the
  chess domain.

- **`src/testUtils/`** - Jest/RNTL helpers: simulated PanResponder gestures
  (`panResponderGesture.ts`), `Animated.Value` read helpers, a text-based
  board visualizer for debugging board state in test failures, a fake
  `AppSocket` for hooks that talk to the server (`fakeSocket.ts`), a
  `GameSnapshot` fixture builder (`gameSnapshot.ts`), and a safe-area
  wrapper for components that read insets (`safeArea.tsx`).

## Testing

Two deliberately separate layers - don't let one re-do the other's job:

|                    | Unit/component (Jest)                                                       | End-to-end (Maestro)                                |
| ------------------ | --------------------------------------------------------------------------- | --------------------------------------------------- |
| Run with           | `npm test`                                                                  | `npm run test:e2e`                                  |
| Covers             | Chess rules, game state machine, gesture -> callback translation, rendering | Real native gestures driving the actual running app |
| Needs a simulator? | No                                                                          | Yes                                                 |

- Chess rules (legality, check/checkmate, castling, en passant, promotion)
  are unit-tested directly against `ChessEngine`, no rendering involved -
  see `src/domain/__tests__/`. `src/network/`'s pure infra (REST client,
  socket client, token storage) is tested the same no-rendering way, in
  `src/network/__tests__/`.
- The gesture layer (tap/drag -> the right move being attempted) is tested
  by simulating React Native's PanResponder protocol via RNTL - see
  `src/components/ChessBoard/index.spec.tsx` and `testUtils/panResponderGesture.ts`.
- "Does this actually work on a real device" questions belong in a Maestro
  flow under `.maestro/`, not a Jest test.

## Conventions

- Business/chess logic never lives in a component or screen - it belongs in
  `src/domain/` (rules) or `src/hooks/` (state machines, both the local
  `useChessGame.ts` and the online-play hooks). Raw server communication
  belongs in `src/network/`, not inlined into a hook. Keep
  `components/ChessBoard/` purely presentational when adding to it.
- Animated-value bookkeeping is kept in its own hooks
  (`usePieceAnimations`/`useDragGuide`/`useValidMoveIndicators`), separate
  from game-state logic.
- This is an Expo managed-workflow project - no native `ios`/`android`
  directories are checked in. `expo prebuild` would generate them on demand
  if a bare workflow is ever needed.
- Board color themes live in `src/constants/boardThemes.ts`
  (`chess.com`, `lichess.org`, `monochrome`, `powderblue`, `test`) - only
  `test` is currently wired up as active.
- `eslint-plugin-react-hooks`'s React-Compiler-readiness rules
  (`react-hooks/refs`, `react-hooks/set-state-in-effect`) are kept at their
  default `error` severity project-wide - this project doesn't have
  `babel-plugin-react-compiler` installed, so they're purely predictive.
  Where an existing pattern is intentionally safe under React's current,
  non-compiled runtime (a lazy-inited `useRef(...).current`, an
  always-latest ref written via `useLayoutEffect` instead of inline during
  render), silence it with a short, scoped `eslint-disable` /
  `eslint-disable-next-line` comment explaining why - not a blanket `warn`
  override, and not a rewrite of working code. Revisit only if the React
  Compiler is ever actually enabled.
