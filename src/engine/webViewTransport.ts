import { EngineSlot, UciTransport } from './types';

// The UCI channel of each engine in the WebView page (see stockfishPage):
// commands go out as `uci` messages for a slot, and the page's `line`
// messages come back to that slot's listeners.
export function createSlotTransports(
  post: (message: string) => void,
  slots: readonly EngineSlot[],
): {
  transports: Record<EngineSlot, UciTransport>;
  receive: (message: { slot?: EngineSlot; line?: string }) => void;
} {
  const listeners = new Map<EngineSlot, Set<(line: string) => void>>(
    slots.map((slot) => [slot, new Set()]),
  );
  const transports = Object.fromEntries(
    slots.map((slot): [EngineSlot, UciTransport] => [
      slot,
      {
        send: (command) => post(JSON.stringify({ type: 'uci', slot, command })),
        onLine: (listener) => {
          listeners.get(slot)?.add(listener);
          return () => listeners.get(slot)?.delete(listener);
        },
      },
    ]),
  ) as Record<EngineSlot, UciTransport>;
  return {
    transports,
    receive: ({ slot, line }) => {
      if (!slot || line === undefined) return;
      listeners.get(slot)?.forEach((listener) => listener(line));
    },
  };
}
