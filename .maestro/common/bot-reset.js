// Stops every scripted opponent left from an earlier flow - see
// scripts/e2e/bot-server.js, which scripts/e2e/run.sh starts.
const base = typeof BOT_URL !== 'undefined' ? BOT_URL : 'http://127.0.0.1:4100';
const response = http.delete(base + '/bots');
if (!response.ok)
  throw new Error('bot server: ' + response.status + ' ' + response.body);
