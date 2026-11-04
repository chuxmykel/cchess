import { UciTransport } from '../engine/types';

// A UCI engine's channel with no engine behind it: every command sent is
// kept, and a test plays the engine's side with `print`.
export function makeFakeUciTransport() {
  const listeners = new Set<(line: string) => void>();
  const sent: string[] = [];
  const transport: UciTransport & {
    sent: string[];
    print: (...lines: string[]) => void;
  } = {
    sent,
    send: (command) => sent.push(command),
    onLine: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    print: (...lines) =>
      lines.forEach((line) => listeners.forEach((listener) => listener(line))),
  };
  return transport;
}
