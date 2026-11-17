#!/usr/bin/env node
// Scripted opponents on demand, for the Maestro e2e flows - which can make
// HTTP requests (runScript's `http`) but can't start a process. Started by
// scripts/e2e/run.sh, on 127.0.0.1:$E2E_BOT_PORT (4100):
//
//   POST   /bots   {"args": ["--guest", "--color", "w"]}
//                  starts scripts/opponent.js with those args; answers {id}
//   GET    /bots   every bot started, whether it's still running, and the
//                  end of its output
//   DELETE /bots   stops them all - each flow starts with this, so no bot
//                  from one flow plays in the next
//   POST   /open   {"url": "exp://..."} opens it on the run's iOS simulator
//                  ($E2E_SIMULATOR) without waiting: Maestro's openLink
//                  waits on `simctl openurl`, which a slow simulator times
//                  out (POSIX error 60), failing the flow - optional or not
//
// Each bot plays on $EXPO_PUBLIC_SERVER_URL, as the app does, and logs to
// $E2E_LOG_DIR/bot-<id>.log.
const { spawn } = require('node:child_process');
const { createWriteStream, mkdirSync } = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const PORT = Number(process.env.E2E_BOT_PORT ?? 4100);
const LOG_DIR =
  process.env.E2E_LOG_DIR ?? path.join(__dirname, '../../.e2e-logs');
const OPPONENT = path.join(__dirname, '../opponent.js');
const TAIL_LINES = 20;

mkdirSync(LOG_DIR, { recursive: true });

/** @type {Map<number, {args: string[], child: import('node:child_process').ChildProcess, exited: boolean, code: number | null, tail: string[]}>} */
const bots = new Map();
let nextId = 1;

function start(args) {
  const id = nextId++;
  const log = createWriteStream(path.join(LOG_DIR, `bot-${id}.log`));
  log.write(`$ opponent ${args.join(' ')}\n`);
  const child = spawn(process.execPath, [OPPONENT, ...args], {
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const bot = { args, child, exited: false, code: null, tail: [] };
  const keep = (chunk) => {
    log.write(chunk);
    bot.tail.push(...chunk.toString().split('\n').filter(Boolean));
    bot.tail.splice(0, Math.max(0, bot.tail.length - TAIL_LINES));
  };
  child.stdout.on('data', keep);
  child.stderr.on('data', keep);
  child.on('exit', (code) => {
    bot.exited = true;
    bot.code = code;
    log.end(`[exited ${code}]\n`);
  });
  bots.set(id, bot);
  return id;
}

function stopAll() {
  const running = [...bots.values()].filter((bot) => !bot.exited);
  return Promise.all(
    running.map(
      (bot) =>
        new Promise((resolve) => {
          bot.child.once('exit', resolve);
          bot.child.kill('SIGTERM');
          // One that ignores SIGTERM is taken down after a second.
          setTimeout(() => bot.child.kill('SIGKILL'), 1000).unref();
        }),
    ),
  ).then(() => running.length);
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => (body += chunk));
    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function reply(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(body));
}

// Started and left: the flow, waiting for the app, sees how it went.
function openOnSimulator(url) {
  const device = process.env.E2E_SIMULATOR;
  if (!device) throw new Error('no E2E_SIMULATOR to open it on');
  const child = spawn('xcrun', ['simctl', 'openurl', device, url], {
    stdio: 'ignore',
  });
  child.on('error', (error) => console.error(`openurl ${url}: ${error}`));
  child.on('exit', (code) => {
    if (code) console.error(`openurl ${url} exited ${code}`);
  });
}

const server = http.createServer(async (request, response) => {
  try {
    if (request.url === '/open' && request.method === 'POST') {
      const { url } = await readJson(request);
      if (typeof url !== 'string')
        return reply(response, 400, { error: 'url must be a string' });
      openOnSimulator(url);
      return reply(response, 202, { opening: url });
    }
    if (request.url !== '/bots')
      return reply(response, 404, { error: 'not found' });
    switch (request.method) {
      case 'POST': {
        const { args = [] } = await readJson(request);
        if (!Array.isArray(args) || !args.every((a) => typeof a === 'string')) {
          return reply(response, 400, {
            error: 'args must be a list of strings',
          });
        }
        return reply(response, 201, { id: start(args) });
      }
      case 'GET':
        return reply(
          response,
          200,
          [...bots].map(([id, bot]) => ({
            id,
            args: bot.args,
            running: !bot.exited,
            code: bot.code,
            tail: bot.tail,
          })),
        );
      case 'DELETE':
        return reply(response, 200, { stopped: await stopAll() });
      default:
        return reply(response, 405, { error: 'method not allowed' });
    }
  } catch (error) {
    reply(response, 500, { error: String(error) });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`bot server on http://127.0.0.1:${PORT}, bots log to ${LOG_DIR}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    stopAll().then(() => server.close(() => process.exit(0)));
  });
}
