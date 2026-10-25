# cChess

A chess app for iOS (more to come), built with React Native and Expo.
Pieces move either by tap (tap a piece, then tap a destination square) or
by drag-and-drop; all rules enforcement (legal moves, check/checkmate/
stalemate, castling, en passant, promotion) is delegated to
[chess.js](https://github.com/jhlywa/chess.js).

## Features

WIP (TBD)

## Tech stack

- [Expo](https://expo.dev) SDK 58 / React Native 0.88 / React 19
- TypeScript
- [chess.js](https://github.com/jhlywa/chess.js) - chess rules engine
- React Navigation (native-stack + bottom-tabs)
- [socket.io-client](https://socket.io/docs/v4/client-api/) /
  `expo-secure-store` - live connection to `cchess-be` and on-device
  guest-session token storage
- react-native-reanimated / react-native-gesture-handler - animation and
  gesture primitives
- Jest + [@testing-library/react-native](https://callstack.github.io/react-native-testing-library/) -
  unit and component tests
- [Maestro](https://maestro.mobile.dev) - end-to-end tests against a real
  iOS Simulator

## Project structure

```
src/
├── domain/                           Pure, framework-agnostic chess logic - no
│                                     React/RN imports, plain Jest-testable with no rendering
│   ├── ChessEngine.ts                Facade over chess.js: attemptMove, legal moves,
│   │                                 turn/check/game-over status
│   │
│   ├── boardCoordinates.ts           Square <-> pixel math
│   │
│   ├── castlingSquares.ts            Castling rook from/to squares
│   │
│   └── types.ts                      DomainPiece, AppliedMove, MoveResult, etc.
│
├── network/                          A second framework-agnostic layer - talking to
│   │                                 cchess-be (the Socket.IO/NestJS backend)
│   ├── env.ts                        SERVER_URL, defaulting to http://localhost:3000
│   ├── restClient.ts                 Guest-session REST calls
│   ├── socketClient.ts               The one AppSocket singleton (connect/disconnect/get)
│   ├── socketEvents.ts               Every client<->server event's payload types
│   └── tokenStorage.ts               expo-secure-store wrapper for the token pair
│
├── hooks/                            React state/animation/online-play layer
│   ├── useChessGame.ts               The single state machine for an in-progress game
│   │                                 (a reducer owning a ChessEngine instance)
│   │
│   ├── usePieceAnimations.ts         Bridges domain pieces to stable Animated.Value objects for smooth tweening
│   │
│   ├── useDragGuide.ts               The drag-and-drop guide's Animated position/opacity
│   │
│   ├── useValidMoveIndicators.ts     Per-square legal-move indicator opacities
│   │
│   ├── useAuthSessionBootstrap.ts    Guest session + socket bootstrap (backs AuthSessionContext)
│   │
│   ├── useMatchmaking.ts             Seek/cancel + game:created, for the Matchmaking screen
│   │
│   ├── useOnlineChessGame.ts         Drives an in-progress online game on top of useChessGame
│   │                                 (delegates server-push handling to useGameServerEvents)
│   │
│   └── ...                          useGameSnapshot, useGameClock, useConnectionLatency,
│                                     usePopoverMenu, useToast, useBottomSheet, etc.
│
├── context/                           Every React context, one top-level directory
│   ├── ChessGameContext.tsx          Scoped Context (not global state) delivering
│   │                                 useChessGame's state/handlers down to ChessBoard
│   ├── AuthSessionContext.tsx        The one genuinely app-wide context - guest
│   │                                 session + socket connection, mounted in App.tsx
│   └── LiveGame/
│       └── OnlineChessGameContext.tsx   The online counterpart, backed by useOnlineChessGame
│
├── components/                       Presentational only - consumes the hooks/context above
│   ├── ChessBoard/
│   │   ├── index.tsx                 Composes the board from context + the hooks
│   │   │
│   │   ├── BoardSurface/             The checkered rows of squares
│   │   │
│   │   ├── Pieces/                   Renders each piece
│   │   │   └── Piece/                Owns raw gesture capture (tap vs. drag)
│   │   │
│   │   ├── PieceDragAndDropGuide/    The circular guide shown while dragging
│   │   │
│   │   ├── ValidMoveIndicators/      Per-square legal-move highlight dots
│   │   │   └── ValidMoveIndicator/   A single square's highlight dot
│   │   │
│   │   ├── Row/                      One rank of 8 squares
│   │   │
│   │   └── Square/                   One square, with coordinate labels
│   │
│   ├── GameClock/, GameControls/,    In-game UI - clock display, resign/abort/draw
│   │   GameOverBanner/,              controls, result banner, result/piece icons,
│   │   GameResultIcon/,              connection-strength indicator, promotion picker
│   │   GameTypeIcon/,
│   │   ConnectionStrengthIndicator/,
│   │   PromotionMenu/
│   │
│   ├── Button/, Avatar/,             Shared presentational primitives reused
│   │   BottomSheet/, Popover/,       across more than one screen
│   │   PopoverMenu/, SectionHeader/,
│   │   Toast/, TimeControlSelector/
│   │
│   └── HomeHeader/,                  Home-screen-specific pieces
│       FriendsCarousel/,
│       RecentGamesList/
│
├── screens/
│   ├── Home/, HomeStack/,            App.tsx -> HomeStack (HomeTabs, Matchmaking,
│   │   HomeTabs/, HomeTabStack/,     LiveGame) -> HomeTabs (bottom tabs: HomeTabStack,
│   │   Profile/                      Profile) -> HomeTabStack (Home, NewGame)
│   │
│   ├── NewGame/                      Time-control picker; navigates into Matchmaking
│   │
│   ├── Matchmaking/                  Seeks a match, shows a connection-strength readout
│   │                                 while waiting, replaces into LiveGame once matched
│   │
│   └── LiveGame/                     The server-driven online game screen - hosts the
│                                     board behind an OnlineChessGameContext provider
│
├── constants/                        Board size, piece image lookups, square list, board
│                                     themes, time controls, error-message fallbacks
│
├── utils/animation.ts                RN Animated helpers (castling animation, piece ids)
│
└── testUtils/                        Jest/RNTL helpers: gesture simulation, Animated value
                                      reads, a text board visualizer, a fake AppSocket,
                                      a GameSnapshot fixture builder, a safe-area wrapper
```

Business logic (chess rules, move legality, selection/turn state, and now
online-game orchestration) is deliberately kept out of presentational
components - see `src/domain/`, `src/network/`, and `src/hooks/`.
Animated-value bookkeeping is kept separate too, in
`usePieceAnimations`/`useDragGuide`/`useValidMoveIndicators`. That separation
is what makes the rules and state machines unit-testable without rendering
anything, and keeps everything under `components/` purely presentational.

## Getting started

### Prerequisites

- **Node.js 22.16.0**, pinned in `.nvmrc` - run `nvm use` before anything
  else..
- The Expo CLI is a project dependency, invoked via `npx expo` /
  `npm run <script>` - no global install needed.
- A way to actually run the app: Xcode + an iOS Simulator.
- [Maestro](https://maestro.mobile.dev) installed separately
  (`curl -Ls "https://get.maestro.mobile.dev" | bash`), only if you want to
  run the end-to-end suite - see `.maestro/README.md`.
- A running `cchess-be` instance (the Socket.IO/NestJS backend) for guest
  auth, matchmaking, and live games to actually work - the app falls back
  to `http://localhost:3000` if `EXPO_PUBLIC_SERVER_URL` isn't set (see
  `.env.example`).

### Install

```bash
nvm use
npm install
```

### Run

```bash
npm start        # start the Metro bundler - press i, or scan the QR code with Expo Go
npm run ios      # start the bundler and open directly in the iOS Simulator
```

## Testing

Two deliberately separate layers:

|                    | Unit/component (Jest)                                                        | End-to-end (Maestro)                                |
| ------------------ | ---------------------------------------------------------------------------- | --------------------------------------------------- |
| Run with           | `npm test`                                                                   | `npm run test:e2e`                                  |
| Covers             | Chess rules, the game state machine, gesture→callback translation, rendering | Real native gestures driving the actual running app |
| Needs a simulator? | No                                                                           | Yes - a booted iOS Simulator + `expo start` running |

```bash
npm test                 # full Jest suite
npm test -- --watch      # watch mode
npm run test:e2e         # full Maestro suite - see .maestro/README.md for setup
```

Chess rules (legality, check/checkmate, castling, en passant, promotion)
are unit-tested directly against `ChessEngine` with no rendering involved -
see `src/domain/__tests__/`. `src/network/`'s pure infra (REST client,
socket client, token storage) is tested the same way, in
`src/network/__tests__/`. The gesture layer (tap/drag → the right move
being attempted) is tested by simulating React Native's PanResponder
protocol via RNTL - see `src/components/ChessBoard/index.spec.tsx`. Neither
layer re-does the other's job: rules bugs belong in a `ChessEngine` test,
gesture-translation bugs belong in a `ChessBoard` test, and "does this
actually work on a real device" questions belong in a Maestro flow.

## Development notes

- This is an Expo managed-workflow project - there are no native `ios/`/
  `android/` directories checked in; `expo prebuild` would generate them on
  demand if a bare workflow is ever needed.
- Board color themes live in `src/constants/boardThemes.ts` (`chess.com`,
  `lichess.org`, `monochrome`, `powderblue`, `test`) - only `test` is
  currently wired up as the active theme, in `src/screens/LiveGame/index.tsx`.
