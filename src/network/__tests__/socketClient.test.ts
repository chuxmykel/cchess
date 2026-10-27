import { io } from 'socket.io-client';

import {
  connectSocket,
  disconnectSocket,
  getSocket,
  updateSocketToken,
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

  it('gives later reconnects a new token without dropping the connection', () => {
    const { socket: fakeSocket } = createFakeSocket();
    (io as jest.Mock).mockReturnValue(fakeSocket);
    connectSocket('token-a');

    updateSocketToken('token-b');

    expect(fakeSocket.auth).toEqual({ token: 'token-b' });
    expect(fakeSocket.disconnect).not.toHaveBeenCalled();
    expect(connectSocket('token-b')).toBe(fakeSocket);
    expect(io).toHaveBeenCalledTimes(1);
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
