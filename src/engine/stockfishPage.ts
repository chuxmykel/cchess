// The engine's WebView page. The app posts it `boot`, with the engine's glue
// script and its WASM (base64), and it starts one Worker per search slot - the
// glue is written to run as a Worker, finding its WASM at the URL in its own
// `#fragment`, given here as a blob of the bytes, so nothing is fetched. Then
// it carries UCI both ways: `{ type: 'uci', slot, command }` in, a
// `{ type: 'line', slot, line }` out for each line a slot's engine prints
// that analysis reads.
export const STOCKFISH_PAGE = `<!doctype html>
<html><head><meta charset="utf-8"></head><body><script>
(function () {
  var workers = {};
  function send(message) {
    window.ReactNativeWebView.postMessage(JSON.stringify(message));
  }
  // Only what analysis reads (see parseUciLine) crosses to the app: each
  // message is work for its JS thread, which also runs the board. An info
  // line without a line of moves, or with only a bound for a score, is left
  // here.
  function isWanted(line) {
    if (line.indexOf('info ') !== 0) return true;
    return line.indexOf(' pv ') !== -1 &&
      line.indexOf(' lowerbound') === -1 &&
      line.indexOf(' upperbound') === -1;
  }
  function boot(message) {
    var binary = atob(message.wasmBase64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    var wasmUrl = URL.createObjectURL(
      new Blob([bytes], { type: 'application/wasm' })
    );
    var glueUrl = URL.createObjectURL(
      new Blob([message.glueJs], { type: 'text/javascript' })
    );
    message.slots.forEach(function (slot) {
      var worker = new Worker(glueUrl + '#' + encodeURIComponent(wasmUrl));
      worker.onmessage = function (event) {
        if (typeof event.data === 'string' && isWanted(event.data)) {
          send({ type: 'line', slot: slot, line: event.data });
        }
      };
      worker.onerror = function (event) {
        send({ type: 'error', slot: slot, message: String(event.message) });
      };
      workers[slot] = worker;
    });
    send({ type: 'booted' });
  }
  function receive(event) {
    var message;
    try { message = JSON.parse(event.data); } catch (e) { return; }
    if (message.type === 'boot') {
      try { boot(message); }
      catch (e) { send({ type: 'error', message: String(e) }); }
    } else if (message.type === 'uci' && workers[message.slot]) {
      workers[message.slot].postMessage(message.command);
    }
  }
  // iOS delivers posted messages to window, Android to document.
  window.addEventListener('message', receive);
  document.addEventListener('message', receive);
  send({ type: 'ready' });
})();
</script></body></html>`;
