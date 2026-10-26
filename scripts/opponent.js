#!/usr/bin/env node
// A scripted guest opponent for driving LiveGame against a local cchess-be,
// since reaching a real game through matchmaking needs a second player.
// Creates a guest session, seeks a game, and plays a random legal move
// whenever it's its turn. Draw offers are declined automatically.
//
// Usage (Node 22, see .nvmrc):
//   npm run opponent                     # seek 5+0, take either color
//   npm run opponent -- --color w        # only accept white (bot is white,
//                                        # so the app plays black)
//   npm run opponent -- --time 3+2 --delay 300
//
// Colors are assigned at random by the server, so --color can't request
// one - instead, if the bot is matched with the other color it aborts the
// game straight away and exits with code 2. Start a fresh seek from the
// app and run this again until it lands the color you want.
//
// Exit codes: 0 once the game is over, 1 on a connection/auth/matchmaking
// error, 2 if --color was given and the bot got the other color.
//
// The server URL comes from EXPO_PUBLIC_SERVER_URL, as for the app itself
// (src/network/env.ts), defaulting to http://localhost:3000.
const { parseArgs } = require('node:util');
const { io } = require('socket.io-client');
const { Chess } = require('chess.js');

const SERVER_URL =
  process.env.EXPO_PUBLIC_SERVER_URL ?? 'http://localhost:3000';

const { values: args } = parseArgs({
  options: {
    color: { type: 'string' },
    time: { type: 'string', default: '5+0' },
    delay: { type: 'string', default: '800' },
  },
});

const [minutes, incrementSeconds] = args.time.split('+').map(Number);
const moveDelayMs = Number(args.delay);
if (args.color && !['w', 'b'].includes(args.color)) {
  console.error('--color must be "w" or "b"');
  process.exit(1);
}
if (Number.isNaN(minutes) || Number.isNaN(incrementSeconds)) {
  console.error('--time must look like "5+0"');
  process.exit(1);
}

function log(...parts) {
  console.log('[opponent]', ...parts);
}

async function createGuestSession() {
  const response = await fetch(`${SERVER_URL}/auth/guest`, { method: 'POST' });
  if (!response.ok) {
    throw new Error(`POST /auth/guest failed: ${response.status}`);
  }
  return response.json();
}

async function main() {
  const session = await createGuestSession();
  const myUserId = session.user.id;
  log('guest', myUserId);

  const socket = io(SERVER_URL, {
    auth: { token: session.accessToken },
    transports: ['websocket'],
  });

  let gameId = null;
  let myColor = null;

  function exit(code) {
    socket.disconnect();
    process.exit(code);
  }

  function playIfMyTurn(fen, turn) {
    if (!gameId || turn !== myColor) return;
    const moves = new Chess(fen).moves({ verbose: true });
    if (moves.length === 0) return;
    const move = moves[Math.floor(Math.random() * moves.length)];
    setTimeout(() => {
      log('plays', move.san);
      socket.emit('game:move', {
        gameId,
        from: move.from,
        to: move.to,
        promotion: move.promotion,
      });
    }, moveDelayMs);
  }

  socket.on('connect', () => {
    log(`connected to ${SERVER_URL}, seeking ${args.time}`);
    socket.emit('matchmaking:seek', {
      minutes,
      incrementSeconds,
      rated: false,
    });
  });

  socket.on('connect_error', (error) => {
    console.error('[opponent] connect_error', error.message);
    exit(1);
  });
  socket.on('auth:error', ({ message }) => {
    console.error('[opponent] auth:error', message);
    exit(1);
  });
  socket.on('matchmaking:error', ({ message }) => {
    console.error('[opponent] matchmaking:error', message);
    exit(1);
  });
  socket.on('game:error', ({ message }) => log('game:error', message));

  socket.on('game:created', (snapshot) => {
    gameId = snapshot.id;
    myColor = snapshot.white.id === myUserId ? 'w' : 'b';
    log('matched in game', gameId, 'as', myColor === 'w' ? 'white' : 'black');

    if (args.color && args.color !== myColor) {
      log('wrong color, aborting - start a new seek and retry');
      socket.emit('game:abort', { gameId });
      // Give the abort a moment to reach the server before disconnecting.
      setTimeout(() => exit(2), 500);
      return;
    }

    socket.emit('game:join', { gameId });
    playIfMyTurn(snapshot.fen, snapshot.turn);
  });

  socket.on('game:move', (payload) => {
    if (payload.gameId !== gameId) return;
    log('move', payload.move.san);
    playIfMyTurn(payload.fen, payload.turn);
  });

  socket.on('game:drawOffered', () => {
    log('declining draw offer');
    socket.emit('game:drawRespond', { gameId, accept: false });
  });

  socket.on('game:over', (snapshot) => {
    if (snapshot.id !== gameId) return;
    log('game over:', snapshot.result, snapshot.resultReason);
    exit(0);
  });
}

main().catch((error) => {
  console.error('[opponent]', error.message);
  process.exit(1);
});
