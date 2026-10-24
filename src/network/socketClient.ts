import { io, Socket } from 'socket.io-client';

import { SERVER_URL } from './env';
import { ClientToServerEvents, ServerToClientEvents } from './socketEvents';

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;
let connectedWithToken: string | null = null;

export function connectSocket(accessToken: string): AppSocket {
  if (socket && connectedWithToken === accessToken) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io(SERVER_URL, {
    auth: { token: accessToken },
    reconnection: true,
    transports: ['websocket'],
  });
  connectedWithToken = accessToken;

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
  connectedWithToken = null;
}

export function getSocket(): AppSocket | null {
  return socket;
}

// Resolves true if the server kicks this socket (a server-initiated
// disconnect, as opposed to e.g. this client calling .disconnect() itself)
// within timeoutMs of calling this - the signature of an access token the
// gateway accepts at the transport level but then rejects once it actually
// checks it (a stale token from a previous session, connects cleanly and is
// disconnected moments later with reason 'io server disconnect').
//
// At the deadline, the decision is based on the socket's own live
// `connected` state rather than just whether our listener already saw a
// matching 'disconnect' event - a real rejection can still be in flight the
// instant the timer fires, after which it's too late for that event to
// reach a listener we've already torn down. So if the socket hasn't
// (re)connected by the deadline, for any reason, that's treated the same as
// a confirmed rejection rather than optimistically assumed fine; resolves
// false only once verified still/again connected.
export function waitForServerRejection(
  targetSocket: AppSocket,
  timeoutMs: number,
): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      targetSocket.off('disconnect', onDisconnect);
      resolve(!targetSocket.connected);
    }, timeoutMs);

    function onDisconnect(reason: string) {
      if (reason === 'io server disconnect') {
        clearTimeout(timer);
        targetSocket.off('disconnect', onDisconnect);
        resolve(true);
      }
    }

    targetSocket.on('disconnect', onDisconnect);
  });
}
