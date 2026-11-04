// The analysis engine the app downloads on first use, rather than ships:
// Stockfish 19, the lite single-threaded WASM build of stockfish.js (GPL-3.0)
// - small, and with no need for SharedArrayBuffer, so it runs in a WebView.
// Pinned by version and SHA-256, so every source must serve the same bytes;
// `node scripts/pin-stockfish.js` prints these for another version.
export const ENGINE_VERSION = 'stockfish-19.0.1-lite-single';

export const ENGINE_SOURCE_URL =
  'https://github.com/nmrugg/stockfish.js/tree/v19.0.1';

export interface EngineFileSpec {
  name: string;
  // Tried in order: the author's release, then a mirror.
  urls: string[];
  sha256: string;
  bytes: number;
}

const RELEASE =
  'https://github.com/nmrugg/stockfish.js/releases/download/v19.0.1';
const MIRROR = 'https://unpkg.com/stockfish@19.0.1/bin';

export const ENGINE_FILES: { glue: EngineFileSpec; wasm: EngineFileSpec } = {
  glue: {
    name: 'stockfish-19-lite-single.js',
    urls: [
      `${RELEASE}/stockfish-19-lite-single.js`,
      `${MIRROR}/stockfish-19-lite-single.js`,
    ],
    sha256: 'ccb130d7ff29408531c47d859a49f91d59d4f482d05a53eb1a3231a4f624c91a',
    bytes: 28230,
  },
  wasm: {
    name: 'stockfish-19-lite-single.wasm',
    urls: [
      `${RELEASE}/stockfish-19-lite-single.wasm`,
      `${MIRROR}/stockfish-19-lite-single.wasm`,
    ],
    sha256: 'ee4f115bdb2d32cadf96cada104a05b5ec257d7ad6f57582190b49bc71f096de',
    bytes: 1845971,
  },
};
