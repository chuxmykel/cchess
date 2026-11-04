import { EngineFileSpec } from '../../constants/engine';
import {
  EngineDownloadError,
  EngineStore,
  ensureEngineFiles,
} from '../engineFiles';

const GLUE: EngineFileSpec = {
  name: 'engine.js',
  urls: ['https://primary/engine.js', 'https://mirror/engine.js'],
  sha256: 'glue-hash',
  bytes: 100,
};
const WASM: EngineFileSpec = {
  name: 'engine.wasm',
  urls: ['https://primary/engine.wasm', 'https://mirror/engine.wasm'],
  sha256: 'wasm-hash',
  bytes: 300,
};

// A store in memory: each URL serves the content given for it (its hash,
// standing in for the bytes), or fails when it's missing.
function fakeStore(
  served: Record<string, string>,
  stored: Record<string, string> = {},
) {
  const files = { ...stored };
  const store: EngineStore & { files: typeof files } = {
    files,
    hashOf: jest.fn(async (name: string) => files[name] ?? null),
    download: jest.fn(async (url: string, name: string, onBytes) => {
      if (!(url in served)) throw new Error('offline');
      onBytes(name === GLUE.name ? 50 : 150);
      files[name] = served[url];
    }),
    remove: jest.fn((name: string) => {
      delete files[name];
    }),
  };
  return store;
}

describe('ensureEngineFiles', () => {
  it('downloads each file and keeps it once its hash matches', async () => {
    const store = fakeStore({
      'https://primary/engine.js': 'glue-hash',
      'https://primary/engine.wasm': 'wasm-hash',
    });

    await ensureEngineFiles(store, [GLUE, WASM]);

    expect(store.files).toEqual({
      'engine.js': 'glue-hash',
      'engine.wasm': 'wasm-hash',
    });
  });

  it('downloads nothing when the files are already there - offline included', async () => {
    const store = fakeStore(
      {},
      { 'engine.js': 'glue-hash', 'engine.wasm': 'wasm-hash' },
    );

    await ensureEngineFiles(store, [GLUE, WASM]);

    expect(store.download).not.toHaveBeenCalled();
  });

  it('replaces a stored file that is not the pinned one', async () => {
    const store = fakeStore(
      { 'https://primary/engine.wasm': 'wasm-hash' },
      { 'engine.js': 'glue-hash', 'engine.wasm': 'old-version' },
    );

    await ensureEngineFiles(store, [GLUE, WASM]);

    expect(store.download).toHaveBeenCalledTimes(1);
    expect(store.files['engine.wasm']).toBe('wasm-hash');
  });

  it('tries the mirror when the first source fails or serves other bytes', async () => {
    const store = fakeStore({
      'https://primary/engine.js': 'tampered',
      'https://mirror/engine.js': 'glue-hash',
      'https://mirror/engine.wasm': 'wasm-hash',
    });

    await ensureEngineFiles(store, [GLUE, WASM]);

    expect(store.files).toEqual({
      'engine.js': 'glue-hash',
      'engine.wasm': 'wasm-hash',
    });
  });

  it('fails, keeping nothing unverified, when no source serves the file', async () => {
    const store = fakeStore({ 'https://primary/engine.js': 'tampered' });

    await expect(ensureEngineFiles(store, [GLUE, WASM])).rejects.toBeInstanceOf(
      EngineDownloadError,
    );
    expect(store.files).toEqual({});
  });

  it('reports progress across all the files, by their size', async () => {
    const store = fakeStore({
      'https://primary/engine.js': 'glue-hash',
      'https://primary/engine.wasm': 'wasm-hash',
    });
    const onProgress = jest.fn();

    await ensureEngineFiles(store, [GLUE, WASM], onProgress);

    expect(onProgress.mock.calls.map(([fraction]) => fraction)).toEqual([
      50 / 400,
      100 / 400,
      250 / 400,
      1,
    ]);
  });
});
