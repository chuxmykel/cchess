import { AppSocket } from '../network/socketClient';

export type FakeSocket = {
  socket: AppSocket;
  trigger: (event: string, payload: unknown) => void;
};

// A minimal stand-in for an AppSocket, for tests that only need
// emit/on/off/disconnect - records on() handlers per event and lets a test
// fire one via trigger() to simulate a server push.
export function createFakeSocket(): FakeSocket {
  const handlers = new Map<string, Set<(payload: unknown) => void>>();
  const socket = {
    connected: true,
    auth: {},
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn((event: string, handler: (payload: unknown) => void) => {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event)!.add(handler);
    }),
    off: jest.fn((event: string, handler: (payload: unknown) => void) => {
      handlers.get(event)?.delete(handler);
    }),
  };

  function trigger(event: string, payload: unknown) {
    // Mirrors socket.io-client's own behavior: `connected` flips the
    // instant a disconnect happens, independent of whether any listener is
    // still around to observe the event itself.
    if (event === 'disconnect') {
      socket.connected = false;
    }
    if (event === 'connect') {
      socket.connected = true;
    }
    handlers.get(event)?.forEach((handler) => handler(payload));
  }

  return { socket: socket as unknown as AppSocket, trigger };
}
