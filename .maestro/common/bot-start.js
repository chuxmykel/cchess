// Starts a scripted opponent (scripts/opponent.js) with BOT_ARGS, split on
// spaces - `runScript: {file: common/bot-start.js, env: {BOT_ARGS: "--guest
// --color w"}}` - through scripts/e2e/bot-server.js.
const base = typeof BOT_URL !== 'undefined' ? BOT_URL : 'http://127.0.0.1:4100';
const args = (typeof BOT_ARGS !== 'undefined' ? BOT_ARGS : '')
  .split(' ')
  .filter(Boolean);
const response = http.post(base + '/bots', {
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ args: args }),
});
if (!response.ok)
  throw new Error('bot server: ' + response.status + ' ' + response.body);
output.botId = json(response.body).id;
