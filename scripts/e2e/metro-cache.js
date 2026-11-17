#!/usr/bin/env node
// A caching proxy in front of Metro, for the e2e flows - started by
// scripts/e2e/run.sh on $E2E_METRO_PORT, Metro behind it on $METRO_PORT:
//
//   node scripts/e2e/metro-cache.js
//
// Every flow launches the app afresh, and every launch asks Metro for the
// same bundle and assets again - which on a busy hosted runner it took a
// minute or more over, at times past what Expo Go waits ("Could not
// connect to development server", "Failed to load all assets"). Nothing
// changes during a run, so each GET answered 200 is kept and answered
// from memory after; everything else - the manifest, which Metro writes
// from the request's Host (passed on as it is, so its URLs come back
// here) - goes straight through.
const http = require('node:http');

const PORT = Number(process.env.E2E_METRO_PORT ?? 8091);
const METRO_PORT = Number(process.env.METRO_PORT ?? PORT + 2);

// Files only: a bundle, a source map, an asset - never the manifest.
const CACHEABLE = /\.(bundle|map)(\?|$)|^\/assets\//;

/** @type {Map<string, {status: number, headers: http.IncomingHttpHeaders, body: Buffer}>} */
const cache = new Map();
// Requests for a file already on its way from Metro wait for that one
// answer, rather than each asking Metro to build it again.
/** @type {Map<string, http.ServerResponse[]>} */
const waiting = new Map();

function forward(request, response, keep) {
  const upstream = http.request(
    {
      host: '127.0.0.1',
      port: METRO_PORT,
      method: request.method,
      path: request.url,
      headers: request.headers,
    },
    (answer) => {
      if (!keep || answer.statusCode !== 200) {
        response.writeHead(answer.statusCode ?? 502, answer.headers);
        answer.pipe(response);
        // Those waiting on it ask Metro themselves.
        if (keep) release(request);
        return;
      }
      const chunks = [];
      answer.on('data', (chunk) => chunks.push(chunk));
      answer.on('end', () => {
        const entry = {
          status: 200,
          headers: answer.headers,
          body: Buffer.concat(chunks),
        };
        cache.set(request.url, entry);
        console.log(`cached ${request.url}`);
        send(response, entry);
        for (const other of waiting.get(request.url) ?? []) send(other, entry);
        waiting.delete(request.url);
      });
    },
  );
  upstream.on('error', (error) => {
    response.writeHead(502, { 'Content-Type': 'text/plain' });
    response.end(`metro-cache: ${error.message}`);
    if (keep) release(request);
  });
  request.pipe(upstream);
}

function release(request) {
  const others = waiting.get(request.url) ?? [];
  waiting.delete(request.url);
  for (const other of others) forward(request, other, true);
}

function send(response, { status, headers, body }) {
  // Sent whole, so its length is known - not chunked as Metro may have.
  const { 'transfer-encoding': _, ...rest } = headers;
  response.writeHead(status, { ...rest, 'content-length': body.length });
  response.end(body);
}

const server = http.createServer((request, response) => {
  const keep = request.method === 'GET' && CACHEABLE.test(request.url ?? '');
  const hit = keep && cache.get(request.url);
  if (hit) return send(response, hit);
  if (keep && waiting.has(request.url)) {
    waiting.get(request.url).push(response);
    return;
  }
  if (keep) waiting.set(request.url, []);
  forward(request, response, keep);
});

server.listen(PORT, () => {
  console.log(`metro-cache on ${PORT}, in front of Metro on ${METRO_PORT}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
