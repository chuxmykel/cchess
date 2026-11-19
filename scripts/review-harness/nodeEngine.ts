// The app's analysis engine - the same pinned Stockfish build - run in Node
// instead of a WebView: one child process per engine, talking UCI over its
// stdin and stdout, behind the app's own UciEngine.
import { ChildProcess, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';

import { ENGINE_FILES } from '../../src/constants/engine';
import { UciEngine } from '../../src/engine/UciEngine';
import type { UciTransport } from '../../src/engine/types';

// Downloads the engine's files into `dir` unless they're there already, each
// checked against the SHA-256 the app pins.
export async function ensureEngine(dir: string): Promise<string> {
  mkdirSync(dir, { recursive: true });
  for (const spec of [ENGINE_FILES.glue, ENGINE_FILES.wasm]) {
    const path = join(dir, spec.name);
    if (!existsSync(path) || sha256(readFileSync(path)) !== spec.sha256) {
      const response = await fetch(spec.urls[0]);
      if (!response.ok) {
        throw new Error(`${spec.name}: HTTP ${response.status}`);
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      if (sha256(bytes) !== spec.sha256) {
        throw new Error(`${spec.name}: not the pinned build`);
      }
      writeFileSync(path, bytes);
    }
  }
  return join(dir, ENGINE_FILES.glue.name);
}

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

export type NodeEngine = { engine: UciEngine; close: () => void };

export function startEngine(gluePath: string): NodeEngine {
  const child: ChildProcess = spawn(process.execPath, [gluePath], {
    stdio: ['pipe', 'pipe', 'inherit'],
  });
  const listeners = new Set<(line: string) => void>();
  createInterface({ input: child.stdout! }).on('line', (line) => {
    listeners.forEach((listener) => listener(line));
  });
  const transport: UciTransport = {
    send: (command) => child.stdin!.write(`${command}\n`),
    onLine: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  return {
    engine: new UciEngine(transport),
    close: () => {
      child.stdin!.end('quit\n');
      child.kill();
    },
  };
}
