# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A chess app for iOS (more platforms planned), built with React Native (0.88) +
Expo SDK 58 + React 19 + TypeScript. Pieces move by tap-to-move or
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

npm run test:e2e         # Maestro e2e suite, excluding needs-live-server flows (see .maestro/README.md)
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

A husky pre-commit hook (`.husky/pre-commit`, installed by `npm install`
via the `prepare` script) runs lint-staged - `eslint --fix` + `prettier
--write` on staged files, config under `"lint-staged"` in `package.json` -
then a full `tsc --noEmit`. It switches to the `.nvmrc` Node first when
nvm is installed, since lint-staged/ESLint don't run on this machine's
older default Node. lint-staged is held at 16.x: 17+ needs Node >=
22.22.1, newer than the pinned 22.16.0.

GitHub Actions runs lint and the Jest suite on every push to `main` and on
every PR (`.github/workflows/{lint,test}.yml`). The Maestro e2e suite
(`e2e.yml`) only runs when started by hand from the Actions tab
("Run workflow"): it takes too long to hold up every PR.

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
  `http://localhost:3000`), `restClient.ts` (every REST call, on one
  axios instance whose response interceptor turns failures into
  `ApiError`s carrying the server's own message - auth: guest, sign in,
  register, refresh, logout; plus `/users/me`, game history and PGN),
  `accessToken.ts` (reads a JWT access token's expiry),
  `socketClient.ts` (the one `AppSocket` singleton - `connectSocket`/
  `disconnectSocket`/`getSocket`, plus `updateSocketToken` so later
  reconnects use a refreshed token without dropping the connection),
  `socketEvents.ts` (every client<->server event's payload types,
  confirmed against a live backend instance rather than just inferred -
  see that file's own header comment), and `tokenStorage.ts`
  (`expo-secure-store` wrapper for the refresh token - access tokens
  last 15 minutes, so every launch trades the stored refresh token for a
  fresh pair instead of keeping one).

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
    `useAuthSessionLifecycle` (backs `AuthSessionContext`: on launch
    resumes the stored account via `/auth/refresh`, falling back to a new
    guest only when the server rejects it; then sign in, create account
    and sign out, each swapping the tokens and reconnecting the socket -
    the newest session to succeed wins, and replaced ones are revoked;
    access tokens last 15 minutes, so REST calls go through `authorized`,
    which refreshes a token about to expire or rejected with a 401 and
    retries once, one refresh at a time since refresh tokens rotate, and a
    socket kicked by the server for a stale token is refreshed and
    reconnected once),
    `useRecentGames` (the player's finished games, from `GET /games`),
    `useUsernameAvailability` (whether a sign-up username is free, asked
    of `GET /users/:username` once typing pauses and the name fits the
    server's rules),
    `useMatchmaking` (seek/cancel, reporting
    `game:created` or an error back to its caller), `useGameSession` (a
    game screen's two phases - seeking an opponent, then playing the
    matched game), `useGameSnapshot` (the `game:join` fetch that seeds a
    game once matched), `useOnlineChessGame` (drives an
    in-progress game on top of `useChessGame`, delegating server-push
    handling to `useGameServerEvents` - status/result/clocks/draw offers,
    and replaying the opponent's moves idempotently via a fen comparison
    against the echo of our own), `useGameClock` (client-side ticking
    between authoritative server clock updates), and
    `useConnectionLatency`/`useConnectionStrengthIndicator` (the ack-ping
    round-trip sample and its bars/label derivation), `useMoveNavigation`
    (stepping back/forward through a game's moves to view earlier
    positions, snapping back to live on a new move), and `useGameShare`
    (fetches a game's PGN and opens the native share sheet).
  - Small reusable UI-state hooks with no game-domain knowledge at all:
    `usePopoverMenu`, `useToast`/`useToastBubbleAnimation`,
    `useBottomSheet`, `useCaretRotation`, `useGameScreenGestureLock`,
    `useSwipeBackUntilGameLoads` (keeps a game screen's swipe-back gesture
    available until its game has loaded), `useRunAfterDismiss` (holds a
    menu/sheet action until its modal has finished closing - on iOS,
    presenting the share sheet or an Alert while a modal is still
    animating away silently does nothing), and `useAsyncAction` (runs a
    server request for a form or button: in-flight state, no double
    submits, and the server's message or a fallback on failure).

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
  - `AuthSessionContext.tsx` - wraps `useAuthSessionLifecycle` the same
    way the two above wrap their own hooks; the one piece of genuinely
    app-wide state here (the signed-in account or guest, its socket, and
    the actions that switch between them), mounted once in `App.tsx`,
    rather than scoped to a single screen.

- **`src/components/ChessBoard/`** - composes the board from
  `ChessGameContext` + the hooks above; everything under it
  (`BoardSurface`, `Pieces/Piece`, `Row`, `Square`,
  `PieceDragAndDropGuide`, `ValidMoveIndicators`) is purely presentational
  and renders only what it's given as props/context. `StaticBoard` is a
  separate read-only board drawn straight from a FEN (no game state,
  animation or gestures), used for viewing earlier positions.

- **`src/components/`** (everything else) - also purely presentational,
  consuming hooks/context the same way: in-game UI (`GameHeader`,
  `MoveList`, `GameToolbar`, `BottomBar`, `GameClock`, `GameOverCard`, `GameResultIcon`,
  `GameTypeIcon`, `PlayerBar` (name, rating and clock), `RatingDiff` (a
  green/red/grey "+12"/"−12"/"±0", on the game-over card and in Recent
  Games), `PromotionMenu`, `DrawOfferPrompt`,
  `SeekCard`, `LiveGameSkeleton`, `ConnectionStrengthIndicator`), shared
  primitives used across screens (`Button`, `Avatar`, `BottomSheet`,
  `ActionSheet`, `Placeholder`, `Popover`/`PopoverMenu`, `SectionHeader`,
  `Toast`, `TimeControlSelector`, `TextField`/`PasswordField`, and
  `Icon` - every icon in the app goes through it, a thin wrapper over
  `@expo/vector-icons`' MaterialCommunityIcons, so the set can be
  swapped in one place), account UI
  (`AccountForm`, the layout shared by Sign in and Create account;
  `SignInPrompt`, shown to guests on Home and Profile; `RatingsList`;
  `UsernameAvailabilityIndicator`, the ✓/✕ beside the sign-up username),
  and `Home`-screen-specific pieces (`HomeHeader`, `FriendsCarousel`,
  `RecentGamesList`).

- **Navigation** (React Navigation, nested stacks/tabs):
  `App.tsx` (root native-stack) -> `HomeStack` (`HomeTabs`, `LiveGame`,
  `SignIn`, `CreateAccount`) ->
  `HomeTabs` (bottom tabs: `HomeTabStack`, `Profile`) -> `HomeTabStack`
  (native-stack: `Home`, `NewGame`). A fresh launch lands on the `Home` tab
  (not the board) - the path to a game is Home -> New Game -> Start New
  Game -> LiveGame. `LiveGame` covers the whole online game in one screen:
  it opens seeking an opponent (a waiting card over an empty board), then
  plays the matched game in place, with no navigation in between - and
  "New opponent" puts it back to seeking. `LiveGame` is named for what
  it is today - a server-driven online game - not a generic "any game"
  screen; a future local/offline game would get its own screen rather than
  being folded into this one. Guests reach `SignIn`/`CreateAccount`
  from the prompt on Home or Profile; both pop back on success. They're
  pushed over the tabs, so nobody can sign in or out mid-game -
  `LiveGame` covers the tabs and locks swipe-back while playing.

- **`src/constants/`** - board size, piece image lookups
  (`PIECES['wk' | 'bq' | ...]`), castling squares, time controls, board
  themes (`boardThemes.ts`), the app's accent and muted colors
  (`colors.ts`, a start on a fuller theme), account rules mirrored from
  the server (`account.ts`), user-facing error-message fallbacks
  (`errorMessages.ts`), home-screen placeholder data (`friends.ts`,
  until friends are backed by the server), etc.

- **`src/utils/`** - RN `Animated` helpers (`animation.ts`: castling
  animation, piece ids), color helpers (`color.ts`) and `formatRating`
  (`rating.ts`: "1520", or "1520?" while provisional), independent of the
  chess domain. Dates are formatted with `date-fns` rather than helpers
  here.

- **`src/testUtils/`** - Jest/RNTL helpers: simulated PanResponder gestures
  (`panResponderGesture.ts`), `Animated.Value` read helpers, a text-based
  board visualizer for debugging board state in test failures, a fake
  `AppSocket` for hooks that talk to the server (`fakeSocket.ts`), a
  `GameSnapshot` fixture builder (`gameSnapshot.ts`), `makeAuthSession`/
  `makeBootstrappingAuthSession` for mocking `useAuthSession`
  (`authSession.ts`), `makeAccessToken` for a JWT that expires when a test
  needs (`accessToken.ts`), a `GameSummary` builder (`gameSummary.ts`), a safe-area
  wrapper for components that read insets (`safeArea.tsx`),
  `waitForSheetToClose` (`modal.ts`), and shared mock modules for
  `jest.mock` factories (`ConnectionStrengthIndicatorStub.tsx`,
  `popoverMenuStartingOpen.ts`, and `focusEffectRunsOnMount.ts` for
  screens that use `useFocusEffect`). `jest-setup.js` makes the mocked
  `Modal` report `onDismiss` when it hides, as iOS does, so actions that
  wait on it run in tests too, and renders `@expo/vector-icons` as plain
  `Text`s keeping their props (icon fonts can't load under Jest) - so
  tests assert which icon shows by its `name` prop, via a `testID`.

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
