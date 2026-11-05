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
engine/        the analysis engine's infra (UCI over a transport, its files), same style
theme/         the style guide: scales, light/dark colors, makeStyles
  -> hooks/     React state, animation, and online-play orchestration layer
    -> context/   thin Providers wrapping a same-purpose hook, for prop-drilling
      -> components/   presentational only, consumes hooks/context above
        -> screens/     wires components + navigation together

lib/chessboard/  the board, written as a package of its own: outside the
                 layering, it uses nothing in src/ - only components/Board/
                 uses it (ESLint's import/no-restricted-paths holds both ends)
```

- **`src/domain/`** - framework-agnostic chess logic.
  - `ChessEngine.ts` - a facade over chess.js: `attemptMove`, legal moves
    (one piece's, or `getLegalTargets` - every move of the side to move, by
    the square it starts from), turn/check/game-over status. Returns a `MoveResult` discriminated union
    (`"illegal"` | `"needs-promotion-choice"` | `"ok"`) rather than throwing,
    so callers don't need try/catch to handle illegal moves or pending
    promotions.
  - `types.ts` - `DomainPiece`, `DomainMove`, `AppliedMove`, `MoveResult`,
    etc. `AppliedMove` carries everything the UI needs to animate a move
    (capture square, castling rook from/to, en passant/promotion flags)
    without re-deriving it from the engine.
  - `castlingSquares.ts` - castling rook from/to squares.
  - `kingInDanger.ts` - `kingInDanger(fen, defeated)`: the king a board
    marks in danger - the side that lost the game, however it lost,
    fallen; or else the side to move's king in check, fallen only on mate
    - for the boards to make it glow red and tip over (the board's `check`).
      `players.ts`' `defeatedColor(result)` gives the side that lost.
  - `material.ts` - `capturedMaterial(fen, moves)`: every piece each side
    has captured, from the moves, least valuable first, and the score - how far ahead in
    material, counted on the board so promotions count - for the side
    ahead, as shown under the players' names (`materialImbalance(fen)`
    is that board count).
  - `players.ts` - a game's sides: `otherColor` (a worklet too, for the
    drag), and `playerOf`, `ratingDiffOf` and `colorPlayedBy` (the side a
    user played, or null), for anything shaped like a game - a snapshot,
    or the live game's own fields.
  - `premoveTargets.ts` - `premoveTargets(fen, color)`: where each of a
    side's pieces might be queued to go while the opponent thinks - every
    square it could reach on an empty board, a pawn's captures and
    castling (while the FEN allows) included, as lichess's board offers;
    whether it's a move is only known once the opponent's is in. And
    `isPromotionPremove`, a pawn queued to its last rank (made a queen).
  - `moveSound.ts` - `moveSound(san)`: the sound a move makes - checkmate,
    check, castle, capture or a plain move, the first that applies - read
    off its SAN (`AppliedMove` carries it); `stepSound`, that of stepping
    through a game - forward, the move landed on, back, a plain move, or a
    check when the position landed on is one; and
    `gameOverSound(reason)`, a game's end - none for mate, which sounded
    with its move. `stepSoundTo(fromPly, toPly, landedSan)` is the same
    step for an analysis, whose moves branch.
  - Analysis:
    - `analysisTree.ts` - an analysis's moves as an immutable tree:
      each `AnalysisNode` is a position (its move, FEN and ply, counted
      as the FEN does so a set-up position numbers on), its first child
      the line it continues, any others variations. `addMove` goes to a
      move already there rather than adding it twice; plus
      `treeFromMoves`, `pathTo`, `lineThrough`, `promoteVariation`,
      `deleteFrom`, and `toMoveListTokens` - the move list as it reads,
      variations in brackets after the move they replace.
    - `uci.ts` - `parseUciLine`: the UCI lines analysis uses (`info` with
      a score and a line of moves, `bestmove`, the handshake).
    - `evalScore.ts` - `EngineScore`, always from white's side
      (`toWhitePov`), `formatScore` ("+0.34", "-#2", "1-0" once mated),
      `evalBarFraction` (lichess's winning-chances curve), `finalScore`
      (a position with no moves left: mate or level), `pvToSan`, and
      `numberMoves` (a line's moves numbered from where it starts - "4..."
      for one beginning with black's).
    - `threat.ts` - `nullMoveFen`: the move passed to the other side, for
      what it threatens; null in check.
    - `pgnImport.ts` - `parseImport(text)`: a pasted FEN or PGN (from its
      `[FEN]` tag if it has one) as a start and UCI moves; the main line
      only, its comments taken out first - chess.js can't read two in a
      row, as lichess writes them.
    - `positionSetup.ts` - a position set up by hand: `setupToFen`/
      `setupFromFen`, `availableCastling` (king and rook on their
      squares), and `validateSetup` (one king a side, no pawns on the back
      ranks, at most 16 a side, the side not to move not in check).
    - `openings.ts` - `openingAt(fens)`: the opening a line is in, the
      deepest named position along it, keyed by EPD so transpositions
      match - from `openings.json`, lichess's CC0 opening list built by
      `node scripts/build-openings.js` (pinned to a commit; kept out of
      Prettier).

- **`src/network/`** - a second framework-agnostic layer, mirroring
  `domain/`'s pure-infra style but for talking to `cchess-be` (the
  NestJS/Socket.IO backend): `env.ts` (`SERVER_URL`, defaulting to
  `http://localhost:3000`), `restClient.ts` (every REST call, on one
  axios instance whose response interceptor turns failures into
  `ApiError`s carrying the server's own message - auth: guest, sign in,
  register, refresh, logout; plus `/users/me`, game history (yours or a
  player's, a page at a time), a single game, PGN, bookmarks, player
  search, profiles, a player's friends, activity and rating stats, friends and friend requests, challenges, and direct messages),
  `accessToken.ts` (reads a JWT access token's expiry),
  `socketClient.ts` (the one `AppSocket` singleton - `connectSocket`/
  `disconnectSocket`/`getSocket`, plus `updateSocketToken` so later
  reconnects use a refreshed token without dropping the connection),
  `socketEvents.ts` (every client<->server event's payload types,
  confirmed against a live backend instance rather than just inferred -
  see that file's own header comment), and `tokenStorage.ts`
  (`expo-secure-store` wrapper for the refresh token - access tokens
  last 15 minutes, so every launch trades the stored refresh token for a
  fresh pair instead of keeping one), `analysisSettingsStorage.ts`
  (the analysis board's settings in AsyncStorage, over their defaults),
  and `appearanceSettingsStorage.ts` (Appearance's, the same way - a
  value no longer offered falls back to its default).

- **`src/engine/`** - the analysis engine: Stockfish 19, the lite
  single-threaded WASM build of stockfish.js (GPL-3.0), **downloaded on
  first use rather than shipped**, so the app binary holds no GPL code -
  and run in a hidden `react-native-webview`, so it works in Expo Go.
  - `types.ts` - `AnalysisEngine` (`analyse(request, onUpdate)`, returning
    a stop), `EngineUpdate`, and `UciTransport`, so another engine (native,
    or on a server) could stand in.
  - `UciEngine.ts` - analysis over UCI: a new position stops the search
    running and waits for its `bestmove` before starting, so a line from
    the old position is never shown for the new; of several asked for
    meanwhile, only the latest runs.
  - `engineFiles.ts` - `ensureEngineFiles(store, files, onProgress)`:
    each file kept only if its SHA-256 matches the pin, from its sources
    in turn (the author's GitHub release, then unpkg - jsDelivr refuses
    the package, it's over 150 MB), and nothing downloaded once they're
    there, so analysis works offline after the first time.
    `engineStore.ts` is the device's store: the documents folder (never
    cleared by iOS, kept through updates), one folder per version.
    `constants/engine.ts` pins the version, URLs, hashes and sizes;
    `node scripts/pin-stockfish.js <version>` prints them, checking every
    source serves the same bytes.
  - `stockfishPage.ts` - the WebView page: booted with the glue script
    and the WASM (base64), it starts one Worker per search slot (the
    position's own, and the threat), giving each its WASM as a blob URL
    in the Worker URL's `#fragment`, where the glue looks for it. Only the
    lines analysis reads cross to the app - every message is work for the
    JS thread that also runs the board. `webViewTransport.ts` is each slot's `UciTransport` over
    `postMessage`.

- **`src/hooks/`** - two families, both consumed by `components/`/`screens/`
  above them:
  - The local chess state machine: `useChessGame.ts` (a reducer owning
    one `ChessEngine` instance plus turn/promotion state - a move, tapped or
    dragged, comes from the board through `attemptMove`, and a move already
    decided - the opponent's, from the server - passes its promotion piece
    to `attemptMove` rather than asking; it also keeps `legalTargets`, every
    legal move of the side to move, and `movableColor`, whose pieces can be
    picked up - the board's `movable`; what it returns is
    the same object until the game changes, so a screen re-rendering for
    something else - the engine's lines - doesn't re-render the board).
    Selecting a piece by tap, and everything that animates the pieces, is
    the board library's (`src/lib/chessboard/`, below).
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
    `useResumeActiveGame` (once per account the app signs in as, asks for
    a game still in progress and reopens it - after the app restarts
    mid-game, say; `HomeStack` opens it in `LiveGame`),
    `useUsernameAvailability` (whether a sign-up username is free, asked
    of `GET /users/:username` once typing pauses and the name fits the
    server's rules),
    `useMatchmaking` (seek/cancel with the time control, rated choice and
    rating range, reporting `game:created` or an error back to its
    caller), `useGameSession` (a game screen's two phases - seeking an
    opponent, then playing the matched game - keeping the seek so "New
    opponent" reuses its rated choice and range), `useLobbyStats`
    (players online and games in play, pushed while seeking),
    `useGameSnapshot` (the `game:join` fetch that seeds a game once
    matched, joining again after a reconnect so the server stops counting
    the player as gone), `useOnlineChessGame` (drives an
    in-progress game on top of `useChessGame` - only your own pieces, on
    your turn, can be picked up or show their moves - delegating server-push
    handling to `useGameServerEvents` - status/result/clocks/draw offers
    and the first-move deadline, and replaying the opponent's moves
    idempotently via a fen comparison against the echo of our own, and
    taking a move of ours the server refuses (its `game:error` names
    `game:move`) back to the last position it confirmed, and taking the
    whole game from the `game:state` a rejoin after a reconnect brings -
    moves missed while away, the board put straight there - and
    owning the opponent's presence (`useOpponentPresence`) and the game's
    chat (`useGameChat`: history, new messages, and the unread count -
    from how far the server says you've read, every draw note counting
    until seen, yours too - marking it read there with `game:chatRead`
    while open; `useGameChatSheet` adds the sheet it's read in, open or
    not, for `ChatSheet` - the game viewer's own games use it too) and
    rematches (`useRematch`: offering one, answering the opponent's, and
    handing over the new game when the server starts it, which `LiveGame`
    then plays in place), the game sounds (`useGameSounds.ts`,
    with `expo-audio` - one player per sound, shared app-wide; muted by the
    silent switch, mixing with other apps' audio: `useMoveSounds`, each
    move's as it's applied, either side's; `useMoveNavigationSounds`,
    stepping through a game's moves, in `LiveGame` and `GameViewer`, plus a
    watched game's moves as they arrive; `useGameStartSound`, a new game
    opening; and `useGameOverSound`, a game ending while it's shown),
    `usePremove` (a move queued on the opponent's turn - by drag or tap,
    marked on the board - sent with `game:premove` for the server to hold
    and play the moment their move lands, charged a fixed 0.1s rather than
    a round trip, or drop if no longer legal; one at a time, gone here once
    their move arrives, cancelled with `game:premoveCancel` - by a tap
    anywhere else, or on rejoining after a reconnect. The move the server
    plays comes back as a push like the opponent's, so
    `useOnlineChessGame` sends no move that reaches the position the server
    last confirmed),
    `useGameClock` (client-side ticking
    between authoritative server clock updates; paused until both sides
    have moved), `useFirstMoveCountdown` (seconds left to play the first
    move), and
    `useConnectionLatency`/`useConnectionStrengthIndicator` (the ack-ping
    round-trip sample and its bars/label derivation), `useMoveNavigation`
    (stepping back/forward through a game's moves to view earlier
    positions, snapping back to live on a new move, and the move that led
    to the position shown, for the board to mark), `useGameShare`
    (fetches a game's PGN and opens the native share sheet), and
    `useGameBookmark` (whether you've bookmarked the game, toggled
    optimistically), and `useGameViewer` (one game to look through, fetched
    once and - while it's still being played - watched with `game:watch`;
    `clocksAtPly` gives each side's clock at any position), and
    `useFollowPlayer` (a player's next game as it starts, from
    `user:follow` - so the viewer, opened from a Watch button, moves on with
    that player).
  - Analysis: `useAnalysisTree` (the tree and the position looked at in
    it - Forward follows the line you came along, so back and forward
    again returns through a variation, not the main line; promote and
    delete), `useAnalysisBoard` (a `useChessGame` kept on the tree's
    position: its `onMoveApplied` - every move, tapped, dragged or
    promoted - goes into the tree, and a step forward is played as a move,
    anything else a reset that slides; its steps move the board in the same
    render as the tree, using the tree's `peek` at where a step goes - a
    render for the tree and then another for the board made every step lag), `useAnalysisSource` (what an
    analysis starts from - new, set up, a game fetched by id at a ply,
    from your side, or moves brought in), `useEngineAnalysis` (an engine's
    best lines for a position, as SAN with formatted scores: waits 150ms on
    a position before searching, shows progress four times a second, and
    keeps the last position's lines, marked `stale`, until this one's
    come - shown greyed, never drawn or played; each update's lines are
    written as SAN once, 20 moves at most, through a cache of moves
    already written, since chess.js playing them out is costly; the lines'
    room stays the same once the game's over), `useAnalysisSettings`
    (saved as they change), `useAppearanceSettings` (light or dark mode
    and the board's colors, saved the same way - behind `ThemeProvider`), `usePositionEditor` (a piece, the eraser, or
    the hand, which drags pieces), `useAnalysisSounds` (in
    `useGameSounds.ts`) and `useAppIsActive` (searches pause in the
    background; iOS can say 'unknown' at first, counted as active).
  - Friends and everything around them: `useSocial` (backs
    `SocialContext`: friends with their live status, friend requests,
    challenges and unread message counts, kept current from the
    `friend:*`/`challenge:*`/`dm:message` pushes, plus the actions on them;
    accepting a challenge, or hearing one you sent was accepted, starts the
    game), `useFriendActions` (what a friend card or profile offers: their
    profile, a message, a challenge through `ChallengeSheet`, watching
    their game), `useUserProfile` (a player's profile and activity),
    `useUserFriends` (anyone's friends, for their profile and its list),
    `usePagedGames` (game history a page at a time, yours or a player's),
    `useDirectMessages` (one conversation: paged history, new messages,
    marked read while open, sending and clearing), and `useUserSearch`
    (players matching what's typed in Friends' search, asked of
    `GET /users?search=` once typing pauses and at least two letters are
    in, then 20 more at a time as the list nears its end), and `useRatingStats` (a player's rating history and results in one
    category over a period, keeping the last period's shown while the next
    loads).
  - Small reusable UI-state hooks with no game-domain knowledge at all:
    `usePopoverMenu`, `useToast`/`useToastBubbleAnimation`,
    `useBottomSheet`, `useKeyboardHeight` (how much of the screen the
    keyboard covers, as an `Animated.Value` moving in step with it rather
    than state - a re-render can reset a natively driven animation on the
    same view, like a sheet's slide; and a `KeyboardAvoidingView` can't
    move an absolutely positioned sheet),
    `useCaretRotation`, `useGameScreenGestureLock`,
    `usePressAndHoldRepeat` (a button's handlers for an action that
    repeats while held - once as the finger goes down, not as it lifts, then every 100ms after a 400ms hold,
    until let go or disabled - as the toolbar's ‹ › step through moves),
    `useSwipeBackUntilGameLoads` (keeps a game screen's swipe-back gesture
    available until its game has loaded), `useRunAfterDismiss` (holds a
    menu/sheet action until its modal has finished closing - on iOS,
    presenting the share sheet or an Alert while a modal is still
    animating away silently does nothing; an `ActionSheet` action marked
    `immediate`, like Flip board, presents nothing and runs at once), and
    `useAsyncAction` (runs a
    server request for a form or button: in-flight state, no double
    submits, and the server's message or a fallback on failure).

- **`src/context/`** - every file that defines a React context lives here,
  one top-level directory, rather than scattered across the layers that
  consume them.
  - `ChessGameContext.tsx` - wraps `useChessGame` in a Context scoped to a
    single game screen instance (not app-wide state) purely to avoid
    prop-drilling into `GameBoard`. Shared by every game-type
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
  - `SocialContext.tsx` - wraps `useSocial`, mounted in `HomeStack` (inside
    navigation, so a game started from a challenge can open `LiveGame`
    from any screen).
  - `ThemeContext.tsx` - `ThemeProvider`, mounted at the root of
    `App.tsx`, wrapping `useAppearanceSettings`: the theme in use - dark
    while iOS is (`app.json`'s `userInterfaceStyle` is `automatic`),
    unless Appearance says always light or always dark - for `useTheme()`,
    the settings for `useAppearance()`, the chosen board's squares for
    `useBoardColors()` and its pieces' set for `usePieceSetName()`. Outside a provider - a component rendered alone in
    a test - `useTheme`, `useBoardColors` and `usePieceSetName` give the
    light theme, the default board and the default pieces, so tests need no
    wrapper.
  - `AnalysisSettingsContext.tsx` - wraps `useAnalysisSettings`, mounted
    in `HomeStack`, so the analysis board and the settings screen over it
    share one set.
  - `EngineContext.tsx` - `EngineProvider`, mounted in `App.tsx`, and
    `useEngine()`: the analysis engine for the whole app, started while a
    screen uses it (downloading its files the first time, with progress),
    run in a hidden WebView - given a `containerStyle` too, or its
    container takes half the screen - shut down 30s after the last screen
    lets go, and restarted if iOS ends its process. Its status is
    `idle`/`downloading`/`starting`/`ready` (an engine per slot)/`error`,
    with `retry`.

- **`src/lib/chessboard/`** - the board, written as if it were a
  third-party package so another board library could take its place: it
  imports only React Native and the libraries it draws and moves with
  (Reanimated, Gesture Handler, worklets, SVG) - not chess.js, the theme or
  anything else of the app's - and the app sees only its `index.ts`. Like
  chessground, it knows no chess rules: `<Chessboard>` is given a `fen` (only
  its placement is read - `fen.ts`, which draws any placement, kingless
  setups included), `size`, `orientation`, `colors`, `pieceSet` (each
  piece an SVG document, drawn with `react-native-svg`'s `SvgXml`; its own
  `defaultPieceSet` when left out), `movable` (whose pieces can be picked up - a color, `'both'` or none -
  their `dests`, or `free` to go anywhere, off the board too),
  `premovable` (the side waiting on the other's move, whose pieces can be
  picked up to queue one - its `dests`, and the `current` one, marked in
  `colors.premove`), `lastMove`
  (the squares marked), `promotion` (a pawn held on its promotion square),
  `check` (a king glowing red, tipped over once `fallen`), `arrows`,
  `animation` and `viewOnly`, and calls back `onMove(from, to)` - return
  false to refuse it - `onPremove(from, to)` (the piece stays home),
  `onPremoveCancel` (anything else touched while one's queued), `onDropOff`, `onSquarePress`, `onSettled` and
  `onDragLog`. Its own `types.ts` are the same strings as chess.js's, so
  the app's values pass straight in.
  - `Chessboard.tsx` - tap-to-move selection (a movable piece tapped shows
    its dests, one of them tapped plays it, anything else lets go, and a
    new position drops it), and what a drop does: a move goes to `onMove`,
    one refused is sent home at once. The pieces get callbacks that never
    change, though an app's are new on every render: re-rendering a piece
    makes Gesture Handler set its gestures up again, which cancels a drag
    under way. Nor does a move change their props: which pieces can be
    picked up is one shared value for the whole board (`MovableSquares`),
    read by the gestures on the UI thread - as props, whose turn it is
    flipping them re-rendered all 32 on every move. Everything but the
    arrows sits in a memoised core, so an engine's arrows changing don't
    re-render the pieces; `BoardSurface`'s 64 squares are memoised too.
    `viewOnly` draws the pieces with no gestures and lets touches through.
  - `hooks/usePieceTracker.ts` - each piece's position as Reanimated shared
    values, always from white's side - the board turns the whole pieces
    layer round for black, with each piece's image turned back upright, so
    a flip is drawn in the same frame as the squares - each piece kept the
    same piece from one position to the next (`matchPieces.ts`). A new
    position is a move when `lastMove` is new too and the piece on its
    first square has left it: its pieces slide there in 50ms ease-out tweens
    (`constants.ts`) - or are put there at once with `animation.enabled`
    off, as `animatesMoves(gameType)` in `timeControls.ts` says for anything
    under 3+0 - the piece it takes drawn under the one taking it until that
    lands, the pieces just moved over the rest; so castling, en passant and
    promotion need nothing more than the new position. Any other new
    position - a move refused, taken back - is put straight there, or with
    `animation.slideOnSet` - stepping back through an analysis or a game -
    each piece slides from where it stood. A pawn waiting on a promotion
    stands on its promotion square, and a board drawn at a new size puts
    every piece straight onto its square at that size.
  - `hooks/usePieceGesture.ts` - a piece's Gesture Handler pan and tap, run
    on the UI thread, as on lichess: the piece is lifted at once, twice its
    size, a square above the finger, its own square marked while it's held,
    and a drop counts for the square under the finger - where it last
    moved, not where a quick flick lifts, or, when that's no move, the
    square next to it where it was just before it lifted, as a finger
    slides leaving the glass - landing straight on it when it's one of the
    piece's `dests` - set down at once, the piece it takes disappearing
    with it - or going straight home, before JS hears of it.
    `hooks/useDragGuide.ts` holds the guide's shared values - a circle two
    squares across on the drop's square, and the held piece's own square -
    and the piece a drop has taken, hidden until the position moves on;
    `hooks/useValidMoveIndicators.ts`, the dots' `Animated.Value`
    opacities.
  - `components/` - `BoardSurface`/`Row`/`Square`, `LastMoveHighlight`,
    `PieceDragAndDropGuide`, `ValidMoveIndicators`, `Pieces` (`Piece`, or
    `StaticPiece` on a view-only board), `PieceImage` (the piece's SVG, upright for black, a
    king in check glowing red - an iOS shadow, which follows the piece's
    shape - and tipping over 45° once fallen) and `BoardArrows` (square
    centre to square centre in SVG, over the pieces and out of the way of
    touches); `ChessPiece`, exported, draws one piece off the board from a
    set - or in one color, a silhouette. `defaultPieceSet.ts` is the
    board's own pieces, our drawings, generated by
    `node scripts/generate-pieces.js` (each piece a few shapes, filled and
    outlined; another set is another table of shapes there).
    `coordinates.ts` is square <-> pixel math and `isOnBoard`,
    each a worklet (a `'worklet'` string directive, no import), so a drag
    can work out squares on the UI thread.

- **`src/components/Board/`** - the app's boards, and the only app code
  that uses the library, mapping the app's games, theme
  (`useChessboardColors` - the squares from Appearance's board theme, the
  rest from `colors.board`) and the pieces (`pieceSets.ts`: each set
  Appearance offers, by name, and `usePieceSet()`, the one chosen - so far
  only the library's own) onto it - swapping board libraries
  means changing this alone. `GameBoard` plays the game in
  `ChessGameContext`: `movable` is its `movableColor` and `legalTargets`, a
  move goes to `attemptMove`, `premovable` is the online game's (none
  for a local one), the last move marked is the game's, or the
  last one the server has on record while it has made none (on a game
  resumed or a move refused) - for a castle, the king's and rook's starting
  squares (`domain/lastMoveSquares.ts`) - and `check` is
  `domain/kingInDanger.ts`; memoised, so a screen re-rendering around it -
  a clock ticking - doesn't re-render it. `PositionBoard` is read-only,
  drawn straight from a FEN, for viewing earlier positions: stepping
  through a game moves its pieces - sliding, unless it's bullet - rather
  than drawing new images, which flickered. In `LiveGame` it's drawn over
  the live board while stepping back (`EarlierPositionOverlay`), staying up
  when stepping onto the live position until that last move has slid
  there (`onSettled`). `EmptyBoard` is the squares alone, while a game is
  on its way; `SetupBoard` is the position editor's, tapped with its tool,
  or with the hand its pieces dragged freely, off the board to take them
  away; `BoardPieceIcon` is a piece drawn off the board in the chosen set -
  `PromotionMenu`'s choices, `CapturedPieces` (one grey silhouette),
  `ColorChoicePicker`'s kings and the editor's palette - so every piece in
  the app matches. `utils/analysisArrows.ts` picks the analysis board's arrows (each
  engine line's first move in soft green, the best boldest, and the threat
  in soft red).

- **Analysis components** - `EvalBar` (white's share, animated, with the
  score - across the board above or below it, or beside it from white's
  end, as the settings say, the board narrowing for it; it keeps the last
  score while the next position's comes, so stepping through glides from
  one to the next), `EngineLines` (0-3 lines, each its score chip -
  to one decimal - and as much of its SAN as fits, numbered, the numbers
  lighter than the moves as in `VariationMoveList`, a tap playing its
  first move; the depth - or the engine's download
  progress, starting, or a retry), `OpeningName`, `VariationMoveList` (the moves wrapping like
  text, variations bracketed in smaller type, scrolled to keep the current
  move in view; a tap goes there, a long
  press opens Promote variation / Delete from here), `PositionEditor`
  (`SetupBoard` tapped with a piece from the palette or the eraser - or,
  with the hand, its pieces dragged anywhere, off the board to take them
  away - the palette a row of each side's pieces, by its side of the
  board, each row with the hand and the eraser too, on one light grey
  panel (`colors.board.palette`, the same in both modes so black pieces
  show on a dark screen - one panel, not a tile per tool, which looked
  like more squares), and why it can't be analysed yet; the board brings its own
  `GestureHandlerRootView`, so it works in the modal it's also shown in),
  `PositionSetupSheet` (side to move, castling checkboxes offered only
  where possible), `RadioRow` (a few choices as radio buttons in a row),
  `AnalysisSettingsForm` (the eval bar and its side, a 0-3 lines slider,
  a search time slider of 1-20 seconds then Unlimited, the arrows and
  sounds - the `AnalysisSettings` screen), `AppearanceSettingsForm`
  (System/Light/Dark, and the board themes as swatches - the
  `Appearance` screen), and `GameHistoryList` (a
  player's finished games, paged - `GamesList` and the analysis game
  picker share it).

- **`src/components/`** (everything else) - also purely presentational,
  consuming hooks/context the same way: in-game UI (`GameHeader`,
  `MoveList`, `GameToolbar` (with the chat button's unread badge;
  each button held shows what it does in a `ToolbarTooltip` above it,
  kept on screen, with a light haptic tap - all but ‹ ›, which repeat
  while held),
  `BottomBar`, `GameClock`, `GameOverCard`, `GameResultIcon`,
  `GameTypeIcon`, `PlayerBar` (a square avatar - the opponent's online
  badge on its corner, and in a rematch series that side's points, "1.5",
  in a band across its bottom, the initials lifted clear of it - then the name, rating, clock, and under
  the name the first-move countdown or `CapturedPieces`, a line that keeps
  its height empty or not, so the bar never changes size; tapping the
  avatar or name opens that player's profile, and Back returns to the
  game; dimmed only while the result card shows),
  `ChatSheet` (the server's notes of draws offered, declined and
  accepted - chat messages of their own `kind` - as faint lines among the
  messages, naming who; 80%
  of the screen above the keyboard, keeping the newest
  messages in view; read-only once a game's chat has closed), `RatingDiff` (a
  green/red/grey "+12"/"−12"/"±0", on the game-over card and in Recent
  Games), `PromotionMenu` (the
  pieces a pawn can become, on light tiles in a card over the faded
  board; a tap around it puts the pawn back), `DrawOfferPrompt` (the opponent's draw offer, to accept or
  decline; offering one waits, like resigning, until both sides have
  moved - the server refuses either before that),
  `SeekCard` (the waiting card: time control, rating range, lobby stats),
  `LiveGameSkeleton`, `GameBoardArea` (the board between its two player
  bars, 24pt from each, with more of the room left over below them than
  above - clear of the toolbar - and laid out the same seeking, loading and playing,
  so the board never jumps), `PlayerBarsFrame` (a game's two
  `PlayerBar`s in `GameBoardArea`, with whatever board the screen draws
  between them, the side at the bottom facing it), `GameScreenHeader`
  (`GameHeader` with the menu every game has - share it, bookmark it),
  `ConnectionStrengthIndicator`; `LiveGame` and `GameViewer` both build on
  `PlayerBarsFrame`, `GameScreenHeader` and `ChatSheet`), shared
  primitives used across screens (`Button`, `Avatar`, `BottomSheet` -
  fits its content, or with `heightRatio` takes that share of the screen
  above the keyboard for content that fills it, running on behind the
  keyboard while it's up so its rounded corners show the sheet, not a gap;
  closing it closes the keyboard too, and opening it
  re-reads where the keyboard is -
  `ActionSheet`, `Placeholder`, `Popover`/`PopoverMenu`, `SectionHeader`,
  `Toast`, `TimeControlSelector`, `GameSettings` (New Game's "Game
  Settings" cog, opening a sheet with "Play as" - White, Random or Black,
  a `ColorChoicePicker` the challenge sheet shares - a Rated switch (a guest pressing
  it gets a toast to sign in, rendered inside the sheet's modal through
  its `overlay` slot) and a
  `RatingRangeSelector` - two sliders, `@react-native-community/slider`
  (every slider in the app is a `NotchedSlider`: notched at its steps,
  with a haptic tick, `expo-haptics`, as the thumb reaches each),
  for how far below and above your rating an opponent may be, each with
  an "Open" checkbox that leaves that side unlimited, shown as "+∞"),
  `TextField`/`PasswordField`, and
  `Icon` - every icon in the app goes through it, in the theme's text
  color unless given one, a thin wrapper over
  `@react-native-vector-icons/material-design-icons`, its font loaded
  at runtime through `expo-font` so it works in Expo Go, and kept in one
  place so the set can be swapped), account UI
  (`AccountForm`, the layout shared by Sign in and Create account;
  `SignInPrompt`, shown to guests on Home and Profile; `RatingsList`;
  `UsernameAvailabilityIndicator`, the ✓/✕ beside the sign-up username),
  friends UI (`FriendsCarousel`/`FriendCard` - status line, unread
  messages, watch while playing, Message/Challenge menu - `FriendRow`,
  `FriendRequestCard` and `ChallengeCard` (answered with ✓/✕
  `CircleIconButton`s), `NotificationsMenu` (the 🔔 in `HomeHeader`'s
  `accessory` slot, with a badge counting incoming challenges and friend
  requests, opening them in a popup), `UserSearchField` (Friends'
  search box; Home's "Find friends" opens Friends with it focused) and
  `UserSearchResults` (its matches, in place of Friends' tabs while
  searching: a list that scrolls clear of the keyboard, closes it on a
  drag and pages in more, each opening that player's profile, where
  they can be added), `ChallengeSheet`, `ActivityList`, `ProfileFriends` (a profile's
  Friends section: the count beside the title, up to ten friends online
  first, then - on your own, the Profile tab's - an Add friends tile, and
  View All), `FriendListControls`
  (the friends list's "Online" filter and sort dropdown),
  `MessageList`), rating stats UI (`RatingChart` - the rating as a line
  over the period, one point per day (the server sends each day's closing
  rating), drawn with `victory-native` on
  `@shopify/react-native-skia` (held at victory-native 42: 43 needs a
  newer Skia than Expo SDK 58 bundles), where a tap picks the nearest
  point and a hold scrubs, the point picked staying shown - a light
  green, white-ringed dot on the green line, with a grey guide the chart's full
  height - until another is (victory-native resets its press state whenever `data` changes, so
  the data is memoized, the period rounded to the minute; and its press
  only starts after a 100ms hold, so taps are handled separately); `utils/ratingChart.ts` shapes its data -
  `RatingChange`, a green ▲ or red ▼ with the points gained or lost, in
  italics (skewed, since `fontStyle` can't slant the icon font's arrow),
  `RatingCategoryPicker`, the stats header's title, a dropdown that
  switches category,
  `RatingHighLowCard` and `CategoryStatsCard`, whose best win and worst
  loss open the game), more shared primitives (`ActionList`, `SegmentedTabs`,
  `EmptyState` - what every server-backed list shows when it has
  nothing yet: an SVG illustration from its `illustrations.tsx`, drawn
  with `react-native-svg`, a title, a line on what will show up there,
  and an optional action;
  `SectionHeader`'s action is optional, and it can show a count beside
  the title), and `Home`-screen-specific pieces
  (`HomeHeader`, `RecentGamesList`, whose rows open the game viewer).
  `GameOverCard` names the winner instead of "You won" for a game you
  didn't play - and offers "Play 5+0" (the game's time control) rather
  than "New opponent", as does the viewer's ☰ - and can be dismissed,
  with its ✕ or a tap on the board around it (`GameOverOverlay`) - every
  popup closes on a tap outside it. In
  `LiveGame` it also offers a rematch: Rematch, then "Rematch sent"
  (✕ to cancel), "Rematch offered" with ✕ / ✓ for theirs or "Rematch
  declined". Dismissed there, it comes back from ☰ "Show result" (☰ also
  has "New opponent" once the game is over), or by itself when the rematch
  status changes, so an offer is never hidden. A player's profile offers Watch game
  and Challenge to anyone, friend or not - Watch game is a `disabled`
  `ActionList` row while they aren't in a game - and Message only to
  friends. Its `RatingsList` rows - and your own on the Profile tab -
  open `RatingStats` for that category:
  the rating with what it gained or lost over the period, a 1W/1M/3M/1Y/All
  `SegmentedTabs`, the chart, and the two cards. Once a game is over,
  `GameOverCard` and the ☰ of `LiveGame` and `GameViewer` offer Analyse,
  opening `AnalysisBoard` at the move shown. Profile's Appearance row
  opens `Appearance` (anyone's, guests too: it's kept on the device), and
  its Licenses row
  opens `Licenses`: the Stockfish build the app downloads, its GPL-3.0
  and where its source is, and credit for lichess's opening names.

- **Daily games** - chess.com's: 1, 2, 3, 5, 7 or 14 days a move, a game
  type and rating category of their own (`daily`), played alongside live
  games and each other (see cchess-be's README, "Daily games"). A daily
  time control is its days in `initialSeconds`, no increment
  (`constants/timeControls.ts`' `DAILY_DAYS`, `isDailyTimeControl`,
  `daysPerMove`) - New Game's panel and the challenge sheet offer them,
  their row wrapped into threes (`TimeControlSelector/optionRows.ts`).
  - Starting one: New Game's Start posts a daily seek
    (`useSeekDailyGame`) - the game opens if one was waiting for it,
    otherwise it's back to Home to wait. A daily challenge you accept
    opens its game; one you sent, once accepted, doesn't pull you away
    (`useSocial`'s `onGameStarted` has the game type). `useResumeActiveGame`
    resumes live games only (`kind=live`), and a daily game reaching
    `LiveGame` or `GameViewer` (yours, still on) is sent to `DailyGame`.
  - Home's `YourGamesList`, between Friends and Recent Games, shown only
    with a game in progress or a seek waiting: `useDailyGames` (the
    server's order - your move first, then by time left - reloaded on
    focus and on any push touching one) and `useMyDailySeeks`, each game a
    `DailyGameCard` - its board without coordinates (the board's
    `coordinates` prop), faded while it's the opponent's move, ringed
    when it's yours, the opponent and the time left (`useNow` ticking a
    minute) - and each seek a `WaitingSeekCard` with ✕ to withdraw it.
  - `DailyGame`: `useOnlineChessGame` with no pre-moves, its clocks the
    time left on the move (`GameClock`'s `daily`, `utils/timeLeft.ts`'
    `formatTimeLeft`: whole hours rounded up from an hour, minutes under
    one, seconds in the last - the challenge card's countdown uses it
    too), ticking once a second (`useGameClock`'s `tickMs`); Back always
    works. Its toolbar: ☰, chat, Analysis (`GameToolbar`'s `onAnalyse`),
    ‹ ›; ☰: Next game (`nextDailyGame`, through `useDailyGames`' order),
    Offer/Accept draw, Resign or Abort, Settings, Flip board.
  - Move confirmation: `DailyGameSettings` (`constants/dailyGame.ts`,
    `network/dailyGameSettingsStorage.ts`, `useDailyGameSettings`,
    `DailyGameSettingsContext` in `HomeStack`) - on, `useOnlineChessGame`'s
    `confirmMoves` option holds a move on the board, unsent
    (`hasPendingMove`, against the last position the server confirmed,
    taken from its moves), until `confirmMove` sends it or `cancelMove`
    puts it back; `ConfirmMoveBar` is drawn over the toolbar, which keeps
    its place hidden so the screen doesn't move.
  - `DailyAnalysis`: the analysis board with no engine -
    `useAnalysisWorkspace` and `AnalysisView`, which `AnalysisBoardContent`
    builds its engine onto too. Its toolbar: `OpeningExplorerSheet`
    (`useOpeningExplorer`, the server's explorer of games finished here,
    each position asked for once; also in the analysis board's ☰),
    `NotesSheet` (`useGameNotes`, your own, saved once typing pauses and
    on closing), flip, reset (the game fetched again) and ‹ ›.
    `useAnalysisSource` refuses your own daily game in play
    (`'in-play'`) unless `allowDailyInPlay`, which only this screen asks.
  - Conditional moves: in `DailyAnalysis`, the opponent to move, a line
    tried from the game's position (`domain/conditionalMoves.ts`:
    `mainLineNodeId`, `conditionalLine` - cut to end on your reply -
    `lineAsText`) is saved from `ConditionalMovePanel`
    (`useConditionalMoves`, refetched with each move of the game); the
    game shows `ConditionalMovesNote`, listing them to delete.

- **Navigation** (React Navigation, nested stacks/tabs):
  `App.tsx` (root native-stack, inside a `GestureHandlerRootView` for
  the chart's gestures - the board brings its own, so it works wherever
  it's rendered, tests included) -> `HomeStack` (`HomeTabs`, `LiveGame`,
  `DailyGame`, `DailyAnalysis`, `DailyGameSettings`,
  `GameViewer`, `AnalysisBoard`, `AnalysisSettings`, `UserProfile`, `Conversation`, `GamesList`,
  `RatingStats`, `UserFriends`, `FindFriends`, `SignIn`, `CreateAccount`,
  `Appearance`, `Licenses`) ->
  `HomeTabs` (bottom tabs: `HomeTabStack`, `AnalysisStack` - the
  Analysis tab, testID `analysis-tab` - and `Profile`) -> `HomeTabStack`
  (native-stack: `Home`, `NewGame`, `Friends`) and `AnalysisStack`
  (native-stack: `AnalysisHome` - New analysis, Set up position, From
  your games (`PickGame`), Paste PGN or FEN (`PasteGame`)). Each opens
  `AnalysisBoard`, which takes an `AnalysisSource`, over the tabs - so its
  own toolbar is the only one at the bottom (the position editor has its
  own too: a menu - starting position, clear - flip, Analyse, and a sheet
  of whose move and castling) - as does Analyse from a game, which returns
  there on Back. It holds a session - what it's analysing - so New
  analysis and Edit position (the editor in a modal over the analysis,
  which Cancel keeps) change it in place, without navigating. Every screen with a shown
  header uses `screens/plainHeaderOptions.tsx`: no line under it, and a
  plain chevron (`HeaderBackButton`) in place of the native back button,
  whose glass circle iOS 26+ draws - header buttons go in as
  `plainHeaderItem`s, which turn that circle off (`hidesSharedBackground`). A
  player's profile leaves its header title empty until the avatar block
  scrolls out of view, then fades the username in there. Its Friends
  section's View All opens `UserFriends`, every friend - or only those
  online - sorted online first, by name or most recently added; the Profile
  tab's Add friends opens `FindFriends` - the `Friends` screen again, over
  the tabs so Back returns there - with its search focused; a friend there or in the carousel is
  pushed as another `UserProfile`. Route params are typed in
  each navigator's `types.ts`; a tab-stack screen's
  `HomeTabStackScreenProps` can also open the screens over the tabs.
  Profiles, conversations, game lists and rating stats sit over the tabs
  so any screen - a tab, or a game - can open them, and Back returns
  there. Home's friend cards open a friend's
  `UserProfile`; Message opens their `Conversation`; Challenge sends one
  from a sheet, and the friend accepts it from Home, which opens `LiveGame`
  for both. A recent game opens `GameViewer` (any finished game, or a
  friend's game in progress - your own game in progress opens `LiveGame`
  instead), and "See All" opens `Friends` or `GamesList`. Watch opens it
  with `watchedUserId`, that player at the bottom (unless flipped) and
  followed: when their next game starts, the viewer switches to it. A fresh launch lands on the `Home` tab
  (not the board) - the path to a game is Home -> New Game -> Start New
  Game -> LiveGame. New Game picks the time control, Casual or Rated
  (guests can only play casual) and, when signed in, a rating range; the
  server pairs two seeks only when all of them agree. `LiveGame` covers the whole online game in one screen:
  it opens seeking an opponent (a waiting card over an empty board), then
  plays the matched game in place, with no navigation in between - and
  "New opponent" puts it back to seeking. `LiveGame` is named for what
  it is today - a server-driven online game - not a generic "any game"
  screen; a future local/offline game would get its own screen rather than
  being folded into this one. Guests reach `SignIn`/`CreateAccount`
  from the prompt on Home or Profile; both pop back on success. They're
  pushed over the tabs, so nobody can sign in or out mid-game -
  `LiveGame` covers the tabs and locks swipe-back while playing.

- **`src/theme/`** - the app's style guide, every color, space, corner,
  type size and shadow its styles are drawn from. `tokens.ts`: the scales
  that are the same in both modes - `spacing` (a 4pt grid, `xxs` 2 to
  `xxl` 32), `radius`, `fontSize`, `fontWeight`, `fontFamily` (the system
  font, in one place to swap), `typography` (ready-made text styles) and
  `elevation` (three shadow tiers). `themes.ts`: `lightTheme` and
  `darkTheme`, each a `Theme` - those scales plus `colors`, named for what
  they're for (`background`, `surface`, `text`, `textMuted`, `accent`,
  `danger`, `separator`, the `board`'s overlays, the `gameType`s, ...), not
  what they look like, so each mode gives every role its own value.
  `boardThemes.ts`: the boards' square colors, chosen apart from the mode.
  `makeStyles((t) => ({...}))` returns a `useStyles()` hook giving the
  component's StyleSheet for the theme in use, made once per theme; a
  sheet with no colors stays a plain `StyleSheet.create` using the scales
  imported directly. A color passed as a prop (an icon's, a slider's, an
  SVG fill) comes from `useTheme().colors`. `navigationTheme(theme)` is
  React Navigation's theme from ours (headers, tab bar).

- **`src/constants/`** - board size, castling squares, time controls, Appearance's
  settings and their defaults (`appearance.ts` - the piece sets offered,
  by name, among them), seeks (`seek.ts`: the `Seek` that New Game
  hands to LiveGame, and the rating range's default, step and limit),
  the game's sounds (`sounds.ts`, `assets/sounds/*.wav` - synthesized by
  `node scripts/generate-sounds.js`; a recording saved under the same
  name replaces one),
  account rules mirrored from
  the server (`account.ts`) and the chat and direct message limits
  (`chat.ts`), the rating stats periods (`ratingPeriods.ts`), user-facing error-message fallbacks (`errorMessages.ts`),
  the analysis board's settings and their defaults (`analysis.ts`), the
  pinned engine download (`engine.ts`), etc.

- **`src/utils/`** - `dragLog.ts` (`logDrag`: with
  `EXPO_PUBLIC_DEBUG_DRAG=1`, a line in the Metro terminal for every drop -
  how the board judged it, through its `onDragLog`, and what the game made
  of it), color math
  (`color.ts`: `tintColor`, a color mixed toward white or another) and
  rating formatting
  (`rating.ts`: `formatRating` - "1520", or "1520?" while provisional -
  `formatRatingRange`, "1320–2020", `highestRating`, `formatScore`,
  "2½ - 3½", and `formatTimePlayed`) and presence (`presence.ts`:
  "Playing right now"/"Online"/"Active 5 minutes ago", and the order
  friends are listed in), the friend list's orders (`friendSort.ts`) and
  the rating chart's data (`ratingChart.ts`:
  the points, the last rating held to the period's end, and the point
  nearest a tap - victory-native picks the rating axis and its ticks), independent of the chess domain. Dates are formatted with `date-fns` rather than helpers
  here.

- **`src/testUtils/`** - Jest/RNTL helpers: a board piece's gestures,
  fired through Gesture Handler's jest utils - touch, held drag, drag and
  drop, a flick that lifts past where it was drawn, tap - and `settleAnimations` to let animations and the callbacks
  they schedule finish on fake timers (`pieceGestures.ts`), simulated
  PanResponder gestures for the bottom sheet (`panResponderGesture.ts`),
  `Animated.Value` read helpers and `animatedStyleOf` for a Reanimated
  view's drawn style (`animatedValue.ts`), `piecePositionOnScreen` - where
  a board piece is drawn, the pieces layer (`<board testID>-pieces`) turned
  for black included (`boardPosition.ts`), a text-based
  board visualizer for debugging board state in test failures, a fake
  `AppSocket` for hooks that talk to the server (`fakeSocket.ts`), a
  `GameSnapshot` fixture builder (`gameSnapshot.ts`), `makeAuthSession`/
  `makeBootstrappingAuthSession` for mocking `useAuthSession`
  (`authSession.ts`), `makeAccessToken` for a JWT that expires when a test
  needs (`accessToken.ts`), a `GameSummary` builder (`gameSummary.ts`),
  friend/request/challenge/profile/message builders and `makeSocial` for
  mocking `useSocialContext` (`social.ts`), `makeRatingStats`
  (`ratingStats.ts`), `captureKeyboardListeners` to show and hide the
  keyboard (`keyboard.ts`), a safe-area
  wrapper for components that read insets (`safeArea.tsx`),
  `waitForSheetToClose` (`modal.ts`), a UCI channel a test plays the
  engine's side of (`fakeUciTransport.ts`), an `AnalysisEngine` a test
  reports updates through (`fakeEngine.ts` - given to screens by
  `EngineContext.Provider`), and shared mock modules for
  `jest.mock` factories (`ConnectionStrengthIndicatorStub.tsx`,
  `popoverMenuStartingOpen.ts`, and `focusEffectRunsOnMount.ts` for
  screens that use `useFocusEffect`). `jest-setup.js` makes the mocked
  `Modal` report `onDismiss` when it hides, as iOS does, so actions that
  wait on it run in tests too, and renders the icons as plain
  `Text`s keeping their props (icon fonts can't load under Jest) - so
  tests assert which icon shows by its `name` prop, via a `testID`. It
  renders the slider as a plain `View` keeping its props too, so tests
  fire `valueChange` on it directly, and victory-native's
  `CartesianChart` the same way (testID `cartesian-chart`), so tests check
  what a chart was given to plot - Skia can't draw under Jest. And it mocks
  `expo-audio` with one player per sound, and names the sounds
  (`move.wav`, ...) since jest-expo makes every asset `1` - so tests check
  which sound's player played. The engine's WebView is a plain `View`
  keeping its props (fire its `onMessage`), whatever's posted to it kept
  in the mock's `postedMessages`; AsyncStorage is its own jest mock.

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
  by firing Gesture Handler's gestures from Jest - `jest.config.js` loads
  its `jestSetup` - see `src/lib/chessboard/` for the board on its own,
  props in and callbacks out, `src/components/Board/GameBoard.spec.tsx`
  for it playing a real `useChessGame`, and `testUtils/pieceGestures.ts`. Those tests use fake timers: the gestures'
  worklets reach JS through `scheduleOnRN`, and pieces move by timed
  animations.
- "Does this actually work on a real device" questions belong in a Maestro
  flow under `.maestro/`, not a Jest test.

## Conventions

- Business/chess logic never lives in a component or screen - it belongs in
  `src/domain/` (rules) or `src/hooks/` (state machines, both the local
  `useChessGame.ts` and the online-play hooks). Raw server communication
  belongs in `src/network/`, not inlined into a hook.
- The board library (`src/lib/chessboard/`) stays a package: it knows no
  chess rules and imports nothing from the app - what it needs comes in as
  props - and the app reaches it only through `src/components/Board/`, by
  its `index.ts`. ESLint refuses anything else (tests and `testUtils` may
  reach in). A board feature the app needs is a new prop there, mapped from
  the app in the adapter.
- Animated-value and shared-value bookkeeping is kept in its own hooks
  (the library's `usePieceTracker`/`usePieceGesture`/`useDragGuide`/
  `useValidMoveIndicators`), separate from game-state logic. Shared values
  are read and written with `.get()`/`.set()`, not `.value`, which the
  React-Compiler-readiness lint (`react-hooks/immutability`) refuses on a
  hook's arguments.
- This is an Expo managed-workflow project - no native `ios`/`android`
  directories are checked in. `expo prebuild` would generate them on demand
  if a bare workflow is ever needed.
- Styles come from `src/theme/`: no raw colors anywhere else (ESLint's
  `no-restricted-syntax` refuses hex and `rgb()` literals outside it,
  tests aside), and spacing, corners, type and shadows from its scales
  rather than numbers of their own - a layout's own measurements (a
  board's size, an avatar's) aside. A new color is a new role in
  `ThemeColors`, given a value in both themes. Every text style sets a
  color, since React Native's default black disappears in dark mode.
- Board color themes live in `src/theme/boardThemes.ts`
  (`chess.com`, `lichess.org`, `monochrome`, `powderblue`, `test` - shown
  as Green, Wood, Monochrome, Powder blue and Blue), chosen in Appearance;
  `test`, the blue, is the default.
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
