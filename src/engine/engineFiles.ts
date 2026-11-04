import { EngineFileSpec } from '../constants/engine';

// Where the engine's files are kept, behind the little the download needs -
// so it's tested without a real file system (see engineStore.ts for the
// device's).
export interface EngineStore {
  /** The stored file's SHA-256, in lowercase hex, or null if it isn't there. */
  hashOf(name: string): Promise<string | null>;
  download(
    url: string,
    name: string,
    onBytes: (bytesWritten: number) => void,
  ): Promise<void>;
  remove(name: string): void;
}

export class EngineDownloadError extends Error {
  constructor(readonly file: string) {
    super(`Couldn't download ${file}`);
    this.name = 'EngineDownloadError';
  }
}

// Makes sure every engine file is stored and is exactly the pinned one: a file
// already there and matching is kept, so this costs nothing once downloaded -
// and analysis works offline. Anything else is fetched again, from each of its
// sources in turn, and kept only if its hash matches. `onProgress` gets the
// share of all the files' bytes in place, 0 to 1.
export async function ensureEngineFiles(
  store: EngineStore,
  files: EngineFileSpec[],
  onProgress: (fraction: number) => void = () => {},
): Promise<void> {
  const total = files.reduce((sum, file) => sum + file.bytes, 0);
  let done = 0;
  for (const file of files) {
    if ((await store.hashOf(file.name)) !== file.sha256) {
      store.remove(file.name);
      await downloadVerified(store, file, (bytes) =>
        onProgress(Math.min(1, (done + bytes) / total)),
      );
    }
    done += file.bytes;
    onProgress(done / total);
  }
}

async function downloadVerified(
  store: EngineStore,
  file: EngineFileSpec,
  onBytes: (bytes: number) => void,
): Promise<void> {
  for (const url of file.urls) {
    try {
      await store.download(url, file.name, onBytes);
      if ((await store.hashOf(file.name)) === file.sha256) return;
    } catch {
      // On to the next source.
    }
    store.remove(file.name);
  }
  throw new EngineDownloadError(file.name);
}
