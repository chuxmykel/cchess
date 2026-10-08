# cChess

A chess app for iOS (more to come), built with React Native and Expo.
Pieces move either by tap (tap a piece, then tap a destination square) or
by drag-and-drop; all rules enforcement (legal moves, check/checkmate/
stalemate, castling, en passant, promotion) is delegated to
[chess.js](https://github.com/jhlywa/chess.js).

## Features

WIP (TBD)

## Tech stack

- [Expo](https://expo.dev) SDK 57 / React Native 0.86 / React 19
- TypeScript
- [chess.js](https://github.com/jhlywa/chess.js) - chess rules engine
- React Navigation (drawer + native-stack)
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
├── hooks/                            React state/animation layer - no chess-rules knowledge
│   ├── useChessGame.ts               The single state machine for an in-progress game
│   │                                 (a reducer owning a ChessEngine instance)
│   │
│   ├── usePieceAnimations.ts         Bridges domain pieces to stable Animated.Value objects for smooth tweening
│   │
│   ├── useDragGuide.ts               The drag-and-drop guide's Animated position/opacity
│   │
│   └── useValidMoveIndicators.ts     Per-square legal-move indicator opacities
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
│   └── PromotionMenu/                Pawn-promotion piece picker - a sibling of ChessBoard,
│                                     since it's rendered by the Game screen, not ChessBoard
│
├── screens/
│   ├── Home/                         Drawer home screen + its navigation stack
│   │
│   └── Game/
│       ├── index.tsx                 Hosts the board behind a ChessGameContext provider
│       │
│       └── ChessGameContext.tsx      Scoped React Context (not global state) delivering
│                                     useChessGame's state/handlers down to ChessBoard
│
├── constants/                        Board size, piece image lookups, square list
│
├── utils/animation.ts                RN Animated helpers (castling animation, piece ids)
│
└── testUtils/                        Jest/RNTL helpers: gesture simulation, Animated value
                                      reads, a text board visualizer for debugging
```

Business logic (chess rules, move legality, selection/turn state) is
deliberately kept out of presentational components - see `src/domain/` and
`src/hooks/useChessGame.ts`. Animated-value bookkeeping is kept separate too,
in `usePieceAnimations`/`useDragGuide`/`useValidMoveIndicators`. That
separation is what makes the rules and state machine unit-testable without
rendering anything, and keeps everything under `components/ChessBoard/` purely
presentational.

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
see `src/domain/__tests__/`. The gesture layer (tap/drag → the right move
being attempted) is tested by simulating React Native's PanResponder
protocol via RNTL - see `src/components/ChessBoard/index.spec.tsx`. Neither
layer re-does the other's job: rules bugs belong in a `ChessEngine` test,
gesture-translation bugs belong in a `ChessBoard` test, and "does this
actually work on a real device" questions belong in a Maestro flow.

## Development notes

- This is an Expo managed-workflow project - there are no native `ios/`/
  `android/` directories checked in; `expo prebuild` would generate them on
  demand if a bare workflow is ever needed.
- Board color themes are defined inline in `src/screens/Game/index.tsx`
  (`chess.com`, `lichess.org`, `monochrome`, `powderblue`, `test`) - only
  `test` is currently wired up as the active theme.
