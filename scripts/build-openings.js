/* global __dirname */
// Builds src/domain/openings.json - the names analysis shows for an opening -
// from lichess's opening list (github.com/lichess-org/chess-openings, CC0),
// pinned to one commit so the same file comes out every time:
//   node scripts/build-openings.js
// Each line's moves are played out and the position they reach is keyed by
// its EPD (a FEN's first four fields), so an opening is found however its
// moves were ordered. Where two lines reach one position, the first listed
// keeps it.
const fs = require('fs');
const path = require('path');
const { Chess } = require('chess.js');

const COMMIT = '712a58be746c143f4ab935b68acc50f4bac813eb';
const BASE = `https://raw.githubusercontent.com/lichess-org/chess-openings/${COMMIT}`;
const OUT = path.join(__dirname, '..', 'src', 'domain', 'openings.json');

function epd(fen) {
  return fen.split(' ').slice(0, 4).join(' ');
}

async function main() {
  const openings = {};
  for (const volume of ['a', 'b', 'c', 'd', 'e']) {
    const response = await fetch(`${BASE}/${volume}.tsv`);
    if (!response.ok) throw new Error(`${volume}.tsv: ${response.status}`);
    const rows = (await response.text()).trim().split('\n').slice(1);
    for (const row of rows) {
      const [eco, name, pgn] = row.split('\t');
      const chess = new Chess();
      chess.loadPgn(pgn);
      const key = epd(chess.fen());
      if (!(key in openings)) openings[key] = [eco, name];
    }
  }
  fs.writeFileSync(OUT, JSON.stringify(openings) + '\n');
  console.log(`${Object.keys(openings).length} openings -> ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
