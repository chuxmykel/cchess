import { Directory, File, Paths } from 'expo-file-system';

import { ENGINE_FILES, ENGINE_VERSION } from '../constants/engine';
import { EngineStore } from './engineFiles';

// The engine's files on the device: under documents - which iOS never clears,
// and which outlasts app updates - in a folder of their version's own.
function engineRoot(): Directory {
  return new Directory(Paths.document, 'engine');
}

function versionDirectory(): Directory {
  return new Directory(engineRoot(), ENGINE_VERSION);
}

export function createEngineStore(): EngineStore {
  const fileNamed = (name: string) => new File(versionDirectory(), name);
  return {
    async hashOf(name) {
      const file = fileNamed(name);
      return file.exists ? file.digest('SHA-256') : null;
    },
    async download(url, name, onBytes) {
      const directory = versionDirectory();
      if (!directory.exists) directory.create({ intermediates: true });
      await File.createDownloadTask(url, fileNamed(name), {
        // It counts in a BigInt on iOS, whatever its type says.
        onProgress: ({ bytesWritten }) => onBytes(Number(bytesWritten)),
      }).downloadAsync();
    },
    remove(name) {
      const file = fileNamed(name);
      if (file.exists) file.delete();
    },
  };
}

// Deletes engines of other versions, once this one is in place.
export function removeOtherEngineVersions(): void {
  const root = engineRoot();
  if (!root.exists) return;
  for (const entry of root.list()) {
    if (entry instanceof Directory && entry.name !== ENGINE_VERSION) {
      entry.delete();
    }
  }
}

// What the engine page boots from: the glue script, and the WASM it loads.
export async function readEngineFiles(): Promise<{
  glueJs: string;
  wasmBase64: string;
}> {
  const directory = versionDirectory();
  const [glueJs, wasmBase64] = await Promise.all([
    new File(directory, ENGINE_FILES.glue.name).text(),
    new File(directory, ENGINE_FILES.wasm.name).base64(),
  ]);
  return { glueJs, wasmBase64 };
}
