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
