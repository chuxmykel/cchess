#!/usr/bin/env node
// A scripted opponent for driving LiveGame against a local cchess-be.
// Run with --help (or -h) for usage, options and exit codes.
const { parseArgs } = require('node:util');
const { io } = require('socket.io-client');
const { Chess } = require('chess.js');

const HELP = `OPPONENT(1)                    cchess scripts                   OPPONENT(1)

NAME
       opponent - a scripted chess opponent for driving cchess's LiveGame

SYNOPSIS
       npm run opponent -- [--guest | --casual] [--color w|b] [--time M+I]
                           [--delay MS] [--chat] [--idle]
       npm run opponent -- --friend USERNAME [--challenge] [--time M+I]
       npm run opponent -- -h | --help

DESCRIPTION
       Reaching a real game through matchmaking needs a second player. This
       script is that player: it signs in to a local cchess-be as the
       real_user_bot account (or a fresh guest), seeks a game, and plays a
       random legal move whenever it's its turn. Draw offers are declined.

       real_user_bot seeks a rated game unless --casual is given; a guest
       always seeks a casual one. Seeks only pair when both are rated or
       both casual, so match the choice made on the app's New Game screen.
       Any opponent rating is accepted. The app can't be signed in as
       real_user_bot itself - that would put one account on both sides.

       Requires Node 22 (see .nvmrc).

OPTIONS
       --time M+I
              Seek (or challenge at) M minutes plus I seconds a move; write
              Ns+I for a start of N seconds instead, e.g. 15s+0. It must
              match the app's time control. Default: 5+0.

       --delay MS
              Milliseconds to wait before each move. Default: 800.

       --color w|b
              The color the bot must get. The server assigns colors at
              random, so this can't request one: if the bot is matched with
              the other color it aborts the game and exits with status 2.
              --color w makes the app play black.

       --guest
              Play as a new guest instead of real_user_bot (always casual).

       --casual
              Seek a casual game instead of a rated one.

       --chat Say "Good luck!" when the game starts, and answer chat.

       --idle Never move, so the game is aborted for want of a first move.

       --friend USERNAME
              Befriend USERNAME instead of seeking: accept its friend request
              (or send one), answer its messages, and accept and play its
              challenges, until stopped.

       --challenge
              With --friend, also challenge USERNAME at --time.

       -h, --help
              Show this help and exit.

EXIT STATUS
       Friend mode keeps running until stopped. Otherwise:

       0      The game is over.
       1      A connection, sign-in or matchmaking error, including
              real_user_bot not existing on this server.
       2      --color was given and the bot got the other color.

ENVIRONMENT
       EXPO_PUBLIC_SERVER_URL
              The server to play on, as for the app itself
              (src/network/env.ts). Default: http://localhost:3000.

EXAMPLES
       Seek 5+0 and take either color:
              npm run opponent

       Make the app play black, retrying from a fresh seek until it lands:
              npm run opponent -- --color w

       A quick casual 3+2 opponent:
              npm run opponent -- --casual --time 3+2 --delay 300

       Act as glicko_65163's friend, and challenge it:
              npm run opponent -- --friend glicko_65163 --challenge
`;

const SERVER_URL =
  process.env.EXPO_PUBLIC_SERVER_URL ?? 'http://localhost:3000';
const BOT_ACCOUNT = { usernameOrEmail: 'real_user_bot', password: 'password' };

const { values: args } = parseArgs({
  options: {
    color: { type: 'string' },
    time: { type: 'string', default: '5+0' },
    delay: { type: 'string', default: '800' },
    guest: { type: 'boolean', default: false },
    casual: { type: 'boolean', default: false },
    chat: { type: 'boolean', default: false },
    idle: { type: 'boolean', default: false },
    friend: { type: 'string' },
    challenge: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

if (args.help) {
  console.log(HELP);
  process.exit(0);
}

// "5+3" is 5 minutes plus 3 seconds a move; "15s+0" starts at 15 seconds.
const [base = '', increment = ''] = args.time.split('+');
const initialSeconds = base.endsWith('s')
  ? Number(base.slice(0, -1))
  : Math.round(Number(base) * 60);
const incrementSeconds = Number(increment);
const moveDelayMs = Number(args.delay);
if (args.color && !['w', 'b'].includes(args.color)) {
  console.error('--color must be "w" or "b"');
  process.exit(1);
}
if (
  !Number.isInteger(initialSeconds) ||
  initialSeconds < 1 ||
  !Number.isInteger(incrementSeconds)
) {
  console.error('--time must look like "5+0" or "15s+0"');
  process.exit(1);
}

function log(...parts) {
  console.log('[opponent]', ...parts);
}

async function request(method, path, { body, token } = {}) {
  const response = await fetch(`${SERVER_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body && JSON.stringify(body),
  });
  if (!response.ok) {
    const error = new Error(`${method} ${path} failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function postJson(path, body) {
  return request('POST', path, { body });
}

// Friend mode: become friends with args.friend, then answer its messages
// and challenges.
async function befriend(token) {
  const { incoming } = await request('GET', '/friends/requests', { token });
  const theirRequest = incoming.find(
    (pending) => pending.user.username === args.friend,
  );
  if (theirRequest) {
    await request('POST', `/friends/requests/${theirRequest.id}/accept`, {
      token,
    });
    log('accepted the friend request from', args.friend);
    return;
  }
  try {
    await request('POST', '/friends/requests', {
      token,
      body: { username: args.friend },
    });
    log('sent a friend request to', args.friend);
  } catch (error) {
    // 409: already friends, or a request is already waiting.
    if (error.status !== 409) throw error;
    log('already friends (or a request is pending) with', args.friend);
  }
}

async function signInAsBot() {
  try {
    return await postJson('/auth/login', BOT_ACCOUNT);
  } catch (error) {
    throw new Error(
      `${error.message} - create the ${BOT_ACCOUNT.usernameOrEmail} account ` +
        'on this server (password "password"), or pass --guest',
    );
  }
}

async function main() {
  const session = args.guest
    ? await postJson('/auth/guest')
    : await signInAsBot();
  const myUserId = session.user.id;
  log(args.guest ? 'guest' : 'signed in as', session.user.username);

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
    if (!gameId || turn !== myColor || args.idle) return;
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

  const token = session.accessToken;
  const friendMode = Boolean(args.friend);

  socket.on('connect', () => {
    if (friendMode) {
      log(`connected to ${SERVER_URL} as a friend of ${args.friend}`);
      befriend(token)
        .then(async () => {
          if (!args.challenge) return;
          await request('POST', '/challenges', {
            token,
            body: {
              opponentUsername: args.friend,
              initialSeconds,
              incrementSeconds,
              rated: !args.casual,
            },
          });
          log(`challenged ${args.friend} to ${args.time}`);
        })
        .catch((error) => {
          console.error('[opponent]', error.message);
          exit(1);
        });
      return;
    }
    const mode = args.guest || args.casual ? 'casual' : 'rated';
    log(`connected to ${SERVER_URL}, seeking ${args.time} ${mode}`);
    socket.emit('matchmaking:seek', {
      initialSeconds,
      incrementSeconds,
      rated: !args.guest && !args.casual,
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
    if (args.chat) {
      socket.emit('game:chat', { gameId, text: 'Good luck!' });
    }
    playIfMyTurn(snapshot.fen, snapshot.turn);
  });

  socket.on('game:chat', (message) => {
    if (message.gameId !== gameId || message.userId === myUserId) return;
    log('chat:', message.text);
    if (args.chat) {
      socket.emit('game:chat', { gameId, text: `You said: ${message.text}` });
    }
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
    if (friendMode) {
      gameId = null;
      return;
    }
    exit(0);
  });

  socket.on('friend:requestReceived', (pending) => {
    if (!friendMode || pending.user.username !== args.friend) return;
    request('POST', `/friends/requests/${pending.id}/accept`, { token })
      .then(() => log('accepted the friend request from', args.friend))
      .catch((error) => log('could not accept:', error.message));
  });

  socket.on('challenge:received', (challenge) => {
    if (!friendMode || challenge.challenger.username !== args.friend) return;
    log('accepting the challenge from', args.friend);
    request('POST', `/challenges/${challenge.id}/accept`, { token }).catch(
      (error) => log('could not accept:', error.message),
    );
  });

  socket.on('dm:message', (message) => {
    if (!friendMode || message.senderId === myUserId) return;
    log('message:', message.text);
    request('POST', `/messages/${args.friend}`, {
      token,
      body: { text: `You said: ${message.text}` },
    }).catch((error) => log('could not reply:', error.message));
  });
}

main().catch((error) => {
  console.error('[opponent]', error.message);
  process.exit(1);
});
