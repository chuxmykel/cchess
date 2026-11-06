---
name: run-ios-simulator
description: Launch cchess in the iOS Simulator and drive it (tap, drag-and-drop, screenshots) to verify a change actually works. Use whenever asked to run, start, or screenshot the app, or to confirm a change works in the real app on this machine — not just the Jest/RNTL test suite. For the machine-specific environment gotchas (no Simulator.app, no GUI automation permissions, Node version mismatch, Maestro quirks), see the global `ios-simulator-setup` skill — this skill only covers what's specific to cchess.
---

# Run cchess in the iOS Simulator

This assumes the `ios-simulator-setup` skill's environment facts and
general steps (booting the simulator, screenshotting, driving Maestro).
What follows is only what's specific to cchess: the project path, its
testIDs, how to get from launch into a live game (which now needs a
backend and an opponent), and known-good example flows.

**Last verified: 2026-10-27.** Ran the friends features end to end with
`scripts/opponent.js --friend`: a friend request accepted from Home, the
friend card's live status, messages both ways and clearing them, the
profile, challenges both ways into a game, captured pieces, the game
viewer (result card, stepping back, post-game chat), watching a friend's
game, and the full game list - the new example flows below are the ones
used. Earlier that day: checked the Phase 2 additions by hand
with `scripts/opponent.js` (`--chat` included): lobby stats on the
waiting card, the first-move countdown and abort, the opponent's online
dot, chat both ways, and bookmarking from the ⋯ menu. `drag-move-black.yaml`
and `resign.yaml` still pass unchanged - the player bars kept their
height, so the drag coordinates hold. On 2026-10-26: added and ran the account flows (create
account, sign out, sign in) against a local `cchess-be`, after Home and
Profile gained a guest sign-in prompt and Recent Games started loading
from the server. Before that, re-ran every game example flow below on
`iPhone 18 Pro` (iOS 27.0) against a local `cchess-be` with
`scripts/opponent.js`, after the LiveGame screen gained a header, a move
list, a ☰ game menu, a bottom toolbar and a game-over card, with the board
centered between them - the drag coordinates were re-measured. `tap-move.yaml` wasn't re-run (it taps
by testID only, unaffected by the layout change).

## Project specifics

- **Pinned node version**: `22.16.0` (see `.nvmrc`).
  ```bash
  source ~/.nvm/nvm.sh && nvm use
  ```
- **Boot and start the app**:
  ```bash
  cd /Users/chux_fortress/projects/personal/cchess
  npx expo start --ios
  ```
  Watch the log for `iOS Bundled ... AppEntry.js`. If it says `Port 8081
is running this app in another window`, an Expo server for this project
  is already up - that's fine, reuse it (Maestro deep-links to
  `exp://127.0.0.1:8081` either way).
- **Backend**: a live game needs `cchess-be` (sibling repo,
  `../cchess-be`) running at `http://localhost:3000`, or wherever
  `EXPO_PUBLIC_SERVER_URL` points. A 404 from `curl localhost:3000/` means
  it's up. Ask the user to start it rather than starting it yourself.

## Getting into a live game

A fresh launch shows the **Home** tab. Start New Game opens **LiveGame**
in its seeking phase - the waiting card over an empty board - until a
second player seeks the same time control; the game then starts on the
same screen. Nothing reaches a game without an opponent.

1. `maestro --device <UDID> test .maestro/common/to-new-game.yaml` -
   clears state, launches, dismisses the dev menu, taps Play. Lands on
   **New Game** (default time control 5+0).
2. Tap `start-new-game-button` - the app is now seeking.
3. Start the scripted opponent (see below) - it seeks 5+0, gets matched
   with the app, and the game starts in place. Its seek must be rated or
   casual to match the app's (see "Rated or casual" below).

`examples/to-board.yaml` is steps 1-2 plus waiting for the board. Start
the opponent while it waits, or before it - either order matches.

### The scripted opponent: `npm run opponent`

`scripts/opponent.js` signs in as the `bot_1` account (or `--user`; password
`password`), seeks, plays the move `scripts/opponent-ai.js` picks at
`--level` (default `hard`) whenever it's its turn,
accepts draw offers half the time (a coin flip) and declines the rest,
and exits once the game is over - or after
`--games N`, offering a rematch between games and accepting the app's
(if one is declined, or none starts within 15s, it seeks again).
`npm run opponent -- --help` prints its man page, with every option and
exit status. Run it in the background (it stays alive for the whole
game):

```bash
nohup npm run opponent --silent -- --color w > /tmp/opponent.log 2>&1 &
```

- `--guest` - play as a fresh guest instead of an account.
- `--casual` - seek a casual game as the bot's account.
- `--user bot_2` - sign in as another account instead (password
  `password`); cchess-be's `npm run seed:run` creates `bot_1`-`bot_5`,
  one per bot when running several at once.
- `--level easy|medium|hard` - `hard` can take ~4s a move in a busy
  middlegame, on top of `--delay`; use `easy` (well under 100ms) when a
  flow is waiting on the bot's replies.
- **Rated or casual**: seeks pair only when both are rated or both
  casual. New Game defaults to Rated when signed in (`rated-switch` on),
  and a guest app can only seek casual. So a signed-in app on the default
  needs the bot with no flags; a guest app, or a signed-in one with Rated
  switched off, needs `--casual` or `--guest`. A mismatch
  just leaves both seeking. The bot accepts any opponent rating, but the
  app's own rating range (default ±500) still has to include the bot's
  rating. The app must not be signed in as the bot's account itself, or both
  sides are the same account - sign out (`examples/sign-out.yaml`) or use
  another account.
- `--time 3+2` - seek a different time control (must match the app's
  selection).
- `--delay 300` - ms before each bot move (default 800).
- `--chat` - the bot says "Good luck!" once matched and answers each
  message with "You said: ...".
- `--idle` - the bot never moves, so the game is aborted once its
  first-move deadline passes (30s).
- `--friend <username>` - friend mode: instead of seeking, the bot
  makes sure it's friends with that account (accepting its request, or
  sending one the app accepts), answers its direct messages with "You
  said: ...", and accepts its challenges and plays them. It keeps
  running between games - stop it by its PID.
- `--challenge` (with `--friend`) - the bot also challenges the account
  at `--time`, rated unless `--casual`. The challenge expires after 2
  minutes; start the bot again for another.
- `--color w|b` - the color the **bot** asks for in its seek or
  challenge; the server gives it that color, pairing a seek only with one
  that wants the other color or doesn't mind. So `--color w` means "make
  the app play black" - first time, no retrying. (The app's own seek
  should leave "Play as" on Random, or pick the other color.) Rematches
  swap colors as usual.
- Exit codes: 0 when the game ends, 1 for connection/auth/matchmaking
  errors (including the bot's account not existing on that server).

To try a particular position - a promotion, an endgame - set
`GAME_START_FEN` in `cchess-be`'s `.env` and restart it: every new game
starts there (see `.env.example`). Remove it afterwards.

**Stopping the opponent mid-game** (`kill <pid>` - save `$!` when you
start it; `pkill -f` is blocked here) makes
the server end the game by abandonment a few moments later, and the app
shows a "You won - By Abandonment" banner. To end a game deliberately,
resign or abort from the app (see `examples/resign.yaml` /
`examples/abort.yaml`) - the opponent then exits on its own.

## Known testIDs

- **Navigation**: `play-button` (Home), `time-control-trigger` and
  `start-new-game-button` (New Game).
- **New Game options**: the "Game Settings" cog under the time control
  (`game-settings-trigger`) opens a sheet with `rated-switch` (on by
  default; always off for guests), for signed-in players the
  `rating-range-below-slider` / `rating-range-above-slider` sliders (their
  values in `rating-range-below` / `rating-range-above`, "−∞" / "+∞" when
  open), an "Open" checkbox beside each (`rating-range-below-open` /
  `rating-range-above-open`), and `game-settings-done`. Both sliders run
  from 0 on the left to 500 on the right, in steps of 50, and move by
  swiping their thumb: with the sheet open on iPhone 18 Pro the lower one
  runs along y ≈ 653, from x ≈ 34 to x ≈ 300. A guest tapping
  `rated-switch` gets a "Sign in to play rated games." toast at the
  bottom, over the sheet's Done button, gone after 2s - a
  `takeScreenshot` step straight after the tap catches it; a separate
  `simctl` screenshot is too late. The tab bar has three tabs - Home,
  Analysis, Profile. Only Analysis has a testID (`analysis-tab`), and
  the labels aren't matched by text - tap Home at (67, 817) and Profile
  at (335, 817) (measured 2026-11-03 on iPhone 18 Pro).
- **Home**: `avatar-button` (header, opens Profile), `friends-loading`,
  `recent-games-loading`,
  `game-row-<gameId>` (opens the game viewer), `recent-games-retry`,
  `recent-games-see-all` (the full list), `recent-games-empty`. Guests
  see `sign-in-prompt` (with `sign-in-button` /
  `create-account-button`) where signed-in players see Friends:
  `friends-see-all`, `friends-empty` with its `add-friends-prompt`
  button (no friends yet), and per friend `friend-card-<userId>` (opens
  their profile) with `friend-online-<id>`, `friend-unread-<id>`,
  `friend-watch-<id>` (📺, while they're playing) and
  `friend-menu-button-<id>` → `friend-message-<id>` /
  `friend-challenge-<id>`. In the header, `notifications-button` (🔔)
  with `notifications-badge` (incoming challenges plus friend requests)
  opens `notifications-menu` (or `notifications-empty`), holding
  `challenge-card-<id>` with `accept-challenge-<id>` (✓) /
  `decline-challenge-<id>` (✕) (or `cancel-challenge-<id>` for your
  own), and `friend-request-<id>` with `accept-friend-<id>` /
  `decline-friend-<id>`. Tap outside the popup to close it.
- **Your games** (Home, between Friends and Recent Games - only with a
  daily game in progress or a seek waiting): `your-games`,
  `your-games-see-all` (See All, → `daily-games-list`: its
  `daily-games-your-move-filter` chip, the `daily-games-sort` dropdown
  with `daily-games-sort-<yourMove|timeLeft|lastMove|opponent>`, and a
  `daily-game-<gameId>-your-move` pawn on cards on your move) with its
  `-count`,
  `your-games-loading`, `daily-game-<gameId>` (opens the game) with
  `daily-game-<gameId>-board` (faded while it's the opponent's move) and
  `daily-game-<gameId>-time-left`, and `daily-seek-<seekId>` with its
  ✕ `daily-seek-<seekId>-cancel`. Daily time controls are
  `time-control-option-daily-<n> day(s)` (e.g.
  `time-control-option-daily-3 days`) in New Game, and
  `challenge-time-<n> day(s)` in the challenge sheet.
- **Daily game**: the LiveGame header, move list, player bars and board
  testIDs below; the toolbar's `game-menu-button`, `chat-button`,
  `toolbar-analysis-button`, ‹ ›. ☰ holds `next-game-action`,
  `offer-draw-action` / `accept-draw-action`, `resign-action` (or
  `abort-game-action`), `conditional-moves-action` (on the opponent's
  move), `daily-game-settings-action` and `flip-board-action`. With moves confirmed, a move shows
  `confirm-move-bar` with `cancel-move-button` / `confirm-move-button`
  over the toolbar. Conditional moves (a screen): `conditional-moves`,
  its board, `conditional-moves-empty` or `conditional-line-<n>` (tap to
  edit) with `delete-conditional-line-<n>`, `conditional-moves-error`,
  and `confirm-conditional-moves-button`, `add-conditional-line-button`,
  `delete-conditional-move-button`.
  Once over, `rematch-button` sends a daily challenge (the opponent's
  `challenge-card-<id>` in 🔔); `rematch-status` then shows it.
  Settings: `daily-game-settings`, `daily-setting-confirmMoves` (on by
  default, so a fresh install confirms every move).
- **Daily analysis**: `daily-analysis` - the game's `move-list` /
  `move-<ply>` and `player-name-<color>` (no clocks) -
  `daily-analysis-toolbar` with `opening-explorer-button`,
  `notes-button` (→ the `game-notes` screen: `notes-input`,
  `notes-status`; `header-back` saves and returns), `flip-board-button`,
  `reset-analysis-button`, ‹ ›.
- **Opening explorer** (a screen, from either analysis board's
  `opening-explorer-button`): `opening-explorer`, its own board,
  the `move-list`, `explorer-opening`, rows `explorer-move-<uci>` (book
  moves, with `explorer-games-<uci>` and `explorer-results-<uci>`) or
  `explorer-empty` ("No results"), and `opening-explorer-toolbar`
  (`flip-board-button`, ‹ ›). `header-back` returns to the analysis,
  on the line explored.
- **Challenge sheet**: `challenge-sheet`, `challenge-time-<label>` (e.g.
  `challenge-time-3+2`), `challenge-rated-switch`,
  `send-challenge-button`, `challenge-error`.
- **Friends**: `friends-screen`, the player search `user-search-input`
  (with `user-search-clear`) and its dropdown `user-search-results`
  holding `user-search-result-<username>` (opens their profile, where
  `profile-add-friend` sends a request) or `user-search-empty`, tabs `tab-online` / `tab-all` / `tab-requests`,
  `friend-row-<id>` with its ⋯ `friend-row-menu-<id>`
  (`remove-friend-<id>` in it), and the request cards above.
- **A player's profile**: `user-profile-screen`, `profile-presence`,
  `profile-totals`, `profile-score`, `profile-watch` (disabled unless
  they're in a game) and `profile-challenge` for anyone, then for
  friends `profile-message` and `profile-remove-friend`, otherwise
  `profile-add-friend` / `profile-cancel-request` /
  `profile-accept-request`, `activity-list`, `profile-games-see-all`.
  Its `rating-<category>` rows open the rating stats.
- **Rating stats**: `rating-stats-screen`, `rating-stats-rating`,
  `rating-stats-change` (the ▲/▼ points for the period), the period tabs
  `tab-1w` / `tab-1m` / `tab-3m` / `tab-1y` / `tab-all`, `rating-chart`
  or `rating-chart-empty`, `rating-highest` / `rating-lowest`,
  `category-stats` with `stats-games`, `stats-wins`, `stats-draws`,
  `stats-losses`, `stats-time-played`, `stats-best-win` /
  `stats-worst-loss` (open the game), `stats-win-streak`,
  `stats-losing-streak`. The header title is `rating-category-picker`,
  opening `rating-category-<category>` options.
- **Conversation**: `conversation-screen`, `conversation-presence`,
  `message-list`, `message-<id>`, `load-older-messages`,
  `message-input`, `send-message-button`, and
  `clear-conversation-button` (🗑, in the header; confirm "Delete").
- **Game list** ("Game history" for yours): `games-list`,
  `game-row-<gameId>`, `games-error`, and the dropdowns
  `games-result-filter` (`-all`, `-win`, `-draw`, `-loss`) and
  `games-type-filter` (`-all`, `-bullet` ... `-daily`).
- **Game viewer**: `game-viewer`, `game-header-subtitle` ("2 minutes
  ago", or "Playing now" while watching), the LiveGame header, move
  list, player bars and toolbar testIDs below (no resign; no chat unless
  it's your game), `game-over-dismiss` on the result card,
  `new-opponent-action` in ☰, `chat-closed` once the chat's 14 days are
  up, and `game-viewer-error`.
- **Empty states** elsewhere: `notifications-empty`, `online-empty`,
  `all-friends-empty`, `requests-empty`, `games-empty`,
  `activity-empty`, `profile-games-empty`, `messages-empty`,
  `chat-empty`.
- **Profile**: `profile-screen`, `rating-<category>` (opens your rating
  stats), `sign-out-button`, `appearance-row` (opens Appearance),
  `licenses-row` (opens `licenses-screen`); guests get the same
  `sign-in-prompt`.
- **Appearance**: `appearance-settings`, the radio buttons
  `color-scheme-<system|light|dark>`, and `board-theme-<name>` (`test` -
  the default blue - `chess.com`, `lichess.org`, `powderblue`,
  `monochrome`). Saved on the device, in Expo Go's data: set them back to
  System and `test` after trying others. To see System follow iOS, switch
  the simulator with `xcrun simctl ui booted appearance dark` (and back
  with `light`).
- **Analysis** (no backend needed, except to pick one of your games):
  - `analysis-home` with `analysis-new`, `analysis-set-up`,
    `analysis-pick-game` (a `games-list`) and `analysis-paste`
    (`paste-game-input`, `paste-game-analyse`, `paste-game-error`).
  - The board, `analysis-board`: the usual `square-*`/`piece-*`, then
    `eval-bar` (`eval-bar-score`), `engine-line-<n>`
    (`engine-line-<n>-score`), `engine-depth`, `engine-downloading` /
    `engine-error` (`engine-retry`), `arrow-<from><to>`, `opening-name`,
    the move list `analysis-move-<nodeId>` (long-press for
    `promote-variation-action` / `delete-variation-action`), and the
    toolbar's `game-menu-button` (☰: `new-analysis-action`,
    `edit-position-action`, `analysis-settings-action`, which opens the
    settings screen), `opening-explorer-button`, `flip-board-button` and
    ‹ ›.
    Tapping `engine-line-<n>` plays its first move. The board is over the
    tabs, so there's no tab bar there; `header-back` returns to the tab.
  - Settings (a screen, `analysis-settings`; `header-back` returns):
    `analysis-setting-<name>` switches (`evalBar`, `bestMoveArrows`,
    `threatArrows`, `sounds`), under `evalBar` the radio buttons
    `eval-bar-position-<top|right|bottom|left>`, and the sliders
    `engine-line-count-slider` (0-3, shown in `engine-line-count`) and
    `search-time-slider` (1-20 s then Unlimited, shown in
    `search-time`).
  - The position editor: `set-up-position` with `editor-tool-hand` (and
    `editor-tool-hand-bottom`, the same tool in the lower row)
    (drag a piece by swiping from its square, off the board to remove it),
    `editor-tool-<wk…bp>`, `editor-tool-erase` (`-bottom` likewise), the board's own `piece-<square>`
    inside `editor-board` (verified 2026-11-05),
    `editor-error-<code>`, and its toolbar: `set-up-menu` (an action
    sheet: `editor-start-position`, `editor-clear`, and `set-up-cancel`
    when opened over an analysis), `set-up-flip`, `set-up-analyse`, and
    `set-up-options` (a sheet: `editor-turn-<w|b>` radio buttons,
    `editor-castling-<KQkq>` checkboxes, `position-setup-done`). On iPhone 18 Pro the editor's board runs
    y 247-649 (opened from the tab; measured 2026-11-05), 50.25pt a
    square: e2 is at (226, 573).
  - From a finished game: `analyse-button` on the result card, or
    `analyse-action` in ☰.
  - The engine downloads the first time it's used. `clearState` wipes
    it, so a fresh launch downloads it again: give `engine-line-0` up to
    30s.
- **Sign in / Create account**: `sign-in-screen` / `create-account-screen`,
  inputs `username-or-email-input`, `username-input`, `email-input`,
  `password-input` (its eye button, which shows or hides the password, is
  `password-input-visibility-toggle`). On Create account the username
  field shows `username-checking`, then `username-available` or
  `username-taken`, about half a second after typing stops. Plus
  `account-form-submit`,
  `account-form-error` and `account-form-switch` (to the other form).
- **Board**: `chessboard`, `square-<file><rank>`, `piece-<file><rank>`,
  `valid-move-<square>`, `drag-guide`, `last-move-from`/`-to`, and
  `premove-from`/`-to` (a move queued on the opponent's turn; give the
  bot `--delay 10000` so there's time to queue one - Maestro's own steps
  take seconds; `.maestro/premove.yaml`) - from
  `src/lib/chessboard/` (the board library; the app's boards are in
  `src/components/Board/`), the pieces layer `chessboard-pieces`. These are always named by the real
  square, whichever way the board faces.
- **LiveGame while seeking**: `seeking-content`, `seek-card` (with
  `seek-card-rating-range` for signed-in players, and
  `seek-card-lobby-stats` - players online, games in play - once the
  server sends them),
  `matchmaking-cancel-button` (centered in the bottom bar, where the
  game's toolbar sits).
- **LiveGame**:
  - Header: `game-header`, `game-header-menu` (⋯), with
    `share-game-item` and `bookmark-game-item` ("Bookmark this game" /
    "Remove bookmark") in that menu - tap them by testID, their text
    doesn't match - and `game-header-back` (only once the game is over).
  - Move list (under the header): `move-list`, `move-<ply>` (tap to view
    that position; the current one is `selected`).
  - Player bars: `player-bar-w` / `player-bar-b`, with
    `presence-<color>` (the opponent's dot, labelled "Online" or
    "Offline") and `first-move-countdown-<color>` ("N seconds to play the
    first move", on the side to move until both sides have moved). In
    its place once both have moved: `captured-pieces-<color>`, with
    `captured-piece-<color>` per piece and `material-score-<color>`
    ("+N") for the side ahead. `player-name-<color>` opens that player's
    profile over the game; the header's back chevron (`header-back`, on every screen with the
    shared header)
    returns to it. Tap it by that exact id - `id: "player-name-.*"` with
    an index matched the wrong element.
  - Earlier positions: `earlier-position` wraps a `static-chessboard`
    drawn over the live board while browsing. It stays mounted but hidden
    (and out of the accessibility tree) while live, so `piece-<square>`
    always resolves to the visible board.
  - Toolbar (`game-toolbar`, in the bottom bar): `game-menu-button` (☰),
    `toolbar-resign-button` (⚑, enabled once both sides have moved),
    `chat-button` (with `chat-button-badge` counting unread messages),
    `previous-move-button` / `next-move-button`.
  - Chat (a sheet): `chat-sheet`, `chat-message-<id>`, `chat-input`,
    `chat-send-button`.
  - ☰ menu (an action sheet): `flip-board-action`, `abort-game-action`
    (until black's first move) / `resign-action`, `offer-draw-action`,
    `action-sheet-cancel`.
  - Draw offers: `draw-offer-prompt` with `accept-draw-button` /
    `decline-draw-button` for the opponent's. Offers and declines also
    show in the chat as `chat-notice-<message id>`. `offer-draw-action` only
    appears once both sides have moved.
  - Game over: `game-over-overlay`, `game-over-card`,
    `new-opponent-button`, and for rematches `rematch-button`, then
    `rematch-status` with `rematch-cancel-button` (our offer) or
    `rematch-accept-button` / `rematch-decline-button` (theirs).
    `game-over-dismiss` hides the card to show the final position; ☰ then
    has `show-result-action` to bring it back, and `new-opponent-action`.
    A rematch plays in place; `series-points-w` / `series-points-b` show
    each side's points ("1.5") across the bottom of their avatars
    (`player-avatar-w` / `player-avatar-b`).
  - Loading: `live-game-skeleton`.

  These come from `src/screens/LiveGame/LiveGameContent.tsx` and the
  components it renders.

If any of these change, dump `maestro --device <UDID> hierarchy` instead
of trusting this list.

## Board orientation and drag coordinates

The board starts from the app player's own side: white at the bottom
when the app is white, black at the bottom (files h→a, rank 1 on top)
when it's black. The ☰ menu's Flip board (`flip.yaml`) toggles it. Taps by testID work in
any orientation. **Swipe coordinates don't** - the same square is at a
different point once the board is flipped or the app plays the other
color.

Measured on iPhone 18 Pro (iOS 27.0): the board runs from x 0-402 and
y 260-662 in points, about 50.25pt per square - the same on the
seeking phase, which shares the game's layout. Point centers:

| Square | App is white, unflipped | App is black, unflipped |
| ------ | ----------------------- | ----------------------- |
| e7     | (226, 335)              | (175, 587)              |
| e5     | (226, 436)              | (175, 486)              |
| g1     | (326, 637)              | (75, 285)               |
| f3     | (276, 536)              | (125, 386)              |

The board's bounds were measured from a hierarchy dump during a live
game on 2026-10-29; the centers are calculated from them. The board sits low
in the room between the move list and the bottom bar (`GameBoardArea`:
24pt from each player bar, the room left over split 1:2 above and
below, under a 64pt `GameHeader`), so it moves whenever anything above or below it changes height -
dump the hierarchy and re-check before trusting either column on another
device or after any layout change.

## Known-good example flows

All in `examples/`. Run them in this order against one app session, with
the opponent started during step 1:

1. `to-board.yaml` - fresh launch → New Game → Start New Game, then waits
   up to 20s for `game-toolbar` (i.e. a matched game). Needs the
   opponent.
   (`to-new-game-and-seek.yaml` is the same without the wait, for the
   retry loop above.)
2. `drag-move-black.yaml` - with the app as black: drags e7→e5 using the
   black-side coordinates, then asserts `piece-e5`. Only legal once the
   bot (white) has moved, which it does by itself within about a second.
3. `flip.yaml` - ☰ → Flip board.
4. `resign.yaml` - resigns with the toolbar's ⚑ and waits for
   `game-over-card`. Needs both sides to have moved.

`abort.yaml` (☰ → Abort game → confirm, then waits for "Game aborted")
is the alternative to step 4 straight after step 1, before black's first
move.

`tap-move.yaml` (e2→e4 by testID) works in any orientation, but only
when the app is white and it's white's turn.

Account flows (no opponent needed, just the backend):

- `create-account.yaml` - from a guest's sign-in prompt on Home or
  Profile, creates an account. Needs a fresh `-e USERNAME=...` each run.
- `sign-out.yaml` - from either tab, signs out to a new guest.
- `sign-in.yaml` - from a guest's prompt, signs back in
  (`-e USERNAME=...`, password `password` unless `-e PASSWORD=...`).
  Every test account uses `password`, including the seeded `bot_1`-`bot_5`,
  `real_user_bot` and `glicko_65163`.
- `dismiss-save-password.yaml` - used by the two above (see Gotchas).

Run them as create-account → sign-out → sign-in with the same USERNAME.

Friends flows (signed in as `glicko_65163`, with the bot in friend mode -
see each file's header for how to start it):

- `accept-friend-request.yaml` - accepts the bot's request from Home.
- `send-message.yaml` - Message from the friend card, and the bot's
  reply.
- `accept-challenge-and-play.yaml` - accepts the bot's challenge and
  plays two moves as whichever color the app gets.
- `view-game.yaml` - opens the newest recent game in the viewer and
  steps back a move.
- `watch-friend.yaml` - watches the friend's game from their card.

## Gotchas

- **Expo Go's floating ⚙ can sit right over the toolbar's `›`**
  (bottom right), so tapping `next-move-button` opens the dev menu
  instead (seen 2026-11-05 on the analysis board). Step forward by
  tapping a move in the move list (`analysis-move-<n>`, `move-<ply>`)
  instead, and close the menu with its ✕ if it opens.
- **The software keyboard only shows with DeviceHub's hardware keyboard
  disconnected.** With it connected, a focused input takes Maestro's
  `inputText` but no keyboard appears, so nothing that moves with the
  keyboard (the chat sheet) can be checked. It's a DeviceHub setting the
  user toggles - its preferences are sandboxed, so `defaults write` from
  here can't change it. Ask for it when a check needs the keyboard.

- **Relaunching mid-game goes straight back into the game.** The app
  asks the server for a game in progress once it's signed in, and opens
  it in `LiveGame` - so a `stopApp` + `openLink` lands on `game-toolbar`,
  not Home. Let the game end first (or wait for it to be aborted) to
  get back to Home.

- **Each side has 30 seconds for its first move, or the game is
  aborted.** Every `maestro test` run spends several seconds starting
  up, so a chain of separate runs before the app's first move can use up
  the time - the game then shows "Game aborted". Play the first move in
  the same flow that waits for the game, or straight after it.
- **The result card covers the middle of the board.** Once a game ends
  (an abort included), a tap meant for a square like e4 lands on "New
  opponent" and starts a seek - check for `game-over-card` before tapping
  squares.
- **"Save Password?" can appear after `sign-in.yaml` finishes**, over
  Home, so the next tap misses. Tap "Not Now" at (127, 547).
- **Only the hardware keyboard is used on this simulator**, so no
  on-screen keyboard shows when typing in chat - the chat sheet's
  keyboard handling can't be checked here.
- **A "fresh" launch doesn't sign you out.** `launchApp: clearState`
  clears Expo Go's data but not the iOS keychain, where the refresh token
  lives - so after an account flow, later "fresh" launches (including
  `to-board.yaml`) resume that account. Run `sign-out.yaml` to get back
  to a guest.
- **iOS password prompts swallow input and are invisible to Maestro.**
  Focusing Create account's password field opens "Use Strong Password?",
  which eats the typing that follows; leaving a filled-in password form
  opens "Save Password?". Both are iOS UI, missing from `maestro
hierarchy` and from Maestro's own screenshots (`xcrun simctl io booted
screenshot` shows them), so the app looks frozen. `create-account.yaml`
  and `dismiss-save-password.yaml` close them by point. Typing into a
  secure field a second time is unreliable for the same reason - reopen
  the form instead of retyping.

- **Swipes that miss still report `COMPLETED`.** If a drag flow
  "succeeds" but the board didn't change, the coordinates are stale or
  for the wrong orientation (see the table above). Re-dump the hierarchy.
  Asserting `piece-<target>` right after the swipe catches this, as
  `drag-move-black.yaml` does.
- **`tapOn: "Resign"` hits the toolbar's ⚑, not the alert's button.** The
  ⚑'s accessibility label is also "Resign", so the confirmation alert
  just stays open. `resign.yaml` taps the alert's button by point.
  (`tapOn: "Abort"` is unambiguous, so `abort.yaml` taps by text.)
- **Menu and sheet actions run only once their menu has finished
  closing.** On iOS, presenting the share sheet or an Alert while a
  modal is still animating away silently does nothing, so the ☰ sheet
  and the ⋯ menu hold the chosen action until their modal reports it's
  gone (`src/hooks/useRunAfterDismiss.ts`). Wait for the result (as the
  flows do with `extendedWaitUntil`) rather than asserting right after
  the tap.
- **`tapOn: { id: "xmark", optional: true }` reports `WARNED`** when the
  dev-menu overlay isn't there (a reload instead of a fresh install).
  That's expected.
- **The game-over back chevron (`game-header-back`) lands on New Game,
  not Home** - the tab's own stack still has New Game on top, so
  `play-button` isn't there; `start-new-game-button` is. "New opponent"
  instead goes straight back into matchmaking with the same time
  control.
- **Only move your own color on your own turn.** In LiveGame the app's
  pieces are draggable only when it's the app's turn and the game is
  active. Dragging at any other time looks exactly like a broken swipe.
