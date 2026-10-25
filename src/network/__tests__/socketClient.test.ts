import { io } from 'socket.io-client';

import {
  connectSocket,
  disconnectSocket,
  getSocket,
  waitForServerRejection,
} from '../socketClient';
import { createFakeSocket } from '../../testUtils/fakeSocket';

jest.mock('socket.io-client', () => ({
  io: jest.fn(),
}));

describe('socketClient', () => {
  afterEach(() => {
    disconnectSocket();
    jest.clearAllMocks();
  });

  it('connects once and reuses the same socket for the same token', () => {
    const { socket: fakeSocket } = createFakeSocket();
    (io as jest.Mock).mockReturnValue(fakeSocket);

    const first = connectSocket('token-a');
    const second = connectSocket('token-a');

    expect(io).toHaveBeenCalledTimes(1);
    expect(first).toBe(fakeSocket);
    expect(second).toBe(fakeSocket);
    expect(getSocket()).toBe(fakeSocket);
  });

  it('disconnects the old socket and reconnects when the token changes', () => {
    const { socket: firstSocket } = createFakeSocket();
    const { socket: secondSocket } = createFakeSocket();
    (io as jest.Mock)
      .mockReturnValueOnce(firstSocket)
      .mockReturnValueOnce(secondSocket);

    connectSocket('token-a');
    const result = connectSocket('token-b');

    expect(firstSocket.disconnect).toHaveBeenCalledTimes(1);
    expect(io).toHaveBeenCalledTimes(2);
    expect(result).toBe(secondSocket);
    expect(getSocket()).toBe(secondSocket);
  });

  it('getSocket returns null before any connection and after disconnecting', () => {
    expect(getSocket()).toBeNull();

    const { socket: fakeSocket } = createFakeSocket();
    (io as jest.Mock).mockReturnValue(fakeSocket);
    connectSocket('token-a');

    disconnectSocket();

    expect(fakeSocket.disconnect).toHaveBeenCalledTimes(1);
    expect(getSocket()).toBeNull();
  });
});

describe('waitForServerRejection', () => {
  it('resolves true on a server-initiated disconnect', async () => {
    const { socket, trigger } = createFakeSocket();

    const result = waitForServerRejection(socket, 1000);
    trigger('disconnect', 'io server disconnect');

    expect(await result).toBe(true);
  });

  it('resolves true if a non-rejection disconnect is still unresolved once the timeout elapses', async () => {
    jest.useFakeTimers();
    const { socket, trigger } = createFakeSocket();

    const result = waitForServerRejection(socket, 1000);
    trigger('disconnect', 'transport close');
    jest.advanceTimersByTime(1000);

    // Can't confirm this socket is actually usable, so it's treated the
    // same as a confirmed rejection rather than optimistically assumed fine.
    expect(await result).toBe(true);
    jest.useRealTimers();
  });

  it('resolves false if a non-rejection disconnect reconnects before the timeout', async () => {
    jest.useFakeTimers();
    const { socket, trigger } = createFakeSocket();

    const result = waitForServerRejection(socket, 1000);
    trigger('disconnect', 'transport close');
    // socket.io's own reconnection logic (reconnection: true) recovers the
    // transport before the deadline.
    socket.connected = true;
    jest.advanceTimersByTime(1000);

    expect(await result).toBe(false);
    jest.useRealTimers();
  });

  it('resolves true when the socket is disconnected at the deadline even if no disconnect event reached this listener', async () => {
    jest.useFakeTimers();
    const { socket } = createFakeSocket();

    const result = waitForServerRejection(socket, 1000);
    // The exact race this guards against: the server's rejection lands
    // right as the timer fires, flipping the socket's own connection state,
    // but the 'disconnect' event itself never reaches this listener in time
    // (e.g. torn down in the same tick the timer runs).
    socket.connected = false;
    jest.advanceTimersByTime(1000);

    expect(await result).toBe(true);
    jest.useRealTimers();
  });

  it('resolves false once the timeout elapses with no disconnect', async () => {
    jest.useFakeTimers();
    const { socket } = createFakeSocket();

    const result = waitForServerRejection(socket, 1000);
    jest.advanceTimersByTime(1000);

    expect(await result).toBe(false);
    jest.useRealTimers();
  });
});
