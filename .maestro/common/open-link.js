// Opens LINK on the run's iOS simulator, without waiting for it to open -
// see POST /open in scripts/e2e/bot-server.js, which scripts/e2e/run.sh
// starts. launch-fresh.yaml waits for the app itself.
const base = typeof BOT_URL !== 'undefined' ? BOT_URL : 'http://127.0.0.1:4100';
const response = http.post(base + '/open', {
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: LINK }),
});
if (!response.ok)
  throw new Error('bot server: ' + response.status + ' ' + response.body);
