/* global Buffer */
// Prints what src/constants/engine.ts pins for a stockfish.js release - each
// engine file's SHA-256 and size - after checking that every source serves
// the same bytes:
//   node scripts/pin-stockfish.js 19.0.1
// The app downloads these on first use rather than shipping them, and keeps
// a file only if its hash matches (see src/engine/engineFiles.ts).
const crypto = require('crypto');

const version = process.argv[2];
if (!version) {
  console.error('usage: node scripts/pin-stockfish.js <version, e.g. 19.0.1>');
  process.exit(1);
}
const major = version.split('.')[0];
const sources = [
  `https://github.com/nmrugg/stockfish.js/releases/download/v${version}`,
  `https://unpkg.com/stockfish@${version}/bin`,
];
const files = [
  `stockfish-${major}-lite-single.js`,
  `stockfish-${major}-lite-single.wasm`,
];

async function fetchBytes(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  for (const name of files) {
    const hashes = new Set();
    let bytes = 0;
    for (const source of sources) {
      const data = await fetchBytes(`${source}/${name}`);
      hashes.add(crypto.createHash('sha256').update(data).digest('hex'));
      bytes = data.length;
    }
    if (hashes.size !== 1) {
      throw new Error(`${name}: the sources serve different bytes`);
    }
    console.log(`${name}\n  sha256: '${[...hashes][0]}'\n  bytes: ${bytes}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
