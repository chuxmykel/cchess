import { act, renderHook } from '@testing-library/react-native';

import { useServerMaintenance } from '../useServerMaintenance';
import { getMaintenance } from '../../network/restClient';
import { createFakeSocket } from '../../testUtils/fakeSocket';

jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getMaintenance: jest.fn(),
}));

const STARTS_AT = '2026-11-17T14:05:00.000Z';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe('useServerMaintenance', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('is null with none scheduled', async () => {
    (getMaintenance as jest.Mock).mockResolvedValue({ startsAt: null });
    const { socket } = createFakeSocket();
    const { result } = await renderHook(() => useServerMaintenance(socket));

    expect(result.current).toBeNull();
  });

  it('asks the server on launch', async () => {
    (getMaintenance as jest.Mock).mockResolvedValue({ startsAt: STARTS_AT });
    const { socket } = createFakeSocket();
    const { result } = await renderHook(() => useServerMaintenance(socket));

    expect(result.current).toEqual(new Date(STARTS_AT));
  });

  it('follows the pushes', async () => {
    (getMaintenance as jest.Mock).mockResolvedValue({ startsAt: null });
    const { socket, trigger } = createFakeSocket();
    const { result } = await renderHook(() => useServerMaintenance(socket));

    await act(() => trigger('server:maintenance', { startsAt: STARTS_AT }));
    expect(result.current).toEqual(new Date(STARTS_AT));

    await act(() => trigger('server:maintenance', { startsAt: null }));
    expect(result.current).toBeNull();
  });

  it('asks again on reconnecting: a restart forgets it', async () => {
    (getMaintenance as jest.Mock).mockResolvedValue({ startsAt: STARTS_AT });
    const { socket, trigger } = createFakeSocket();
    const { result } = await renderHook(() => useServerMaintenance(socket));
    expect(result.current).toEqual(new Date(STARTS_AT));

    (getMaintenance as jest.Mock).mockResolvedValue({ startsAt: null });
    await act(() => trigger('connect', undefined));
    expect(getMaintenance).toHaveBeenCalledTimes(2);
    expect(result.current).toBeNull();
  });

  it('keeps a push over the answer to an earlier request', async () => {
    const answer = deferred<{ startsAt: string | null }>();
    (getMaintenance as jest.Mock).mockReturnValue(answer.promise);
    const { socket, trigger } = createFakeSocket();
    const { result } = await renderHook(() => useServerMaintenance(socket));

    await act(() => trigger('server:maintenance', { startsAt: STARTS_AT }));
    await act(async () => answer.resolve({ startsAt: null }));
    expect(result.current).toEqual(new Date(STARTS_AT));
  });

  it('shows nothing new when the server is out of reach', async () => {
    (getMaintenance as jest.Mock).mockRejectedValue(new Error('offline'));
    const { socket } = createFakeSocket();
    const { result } = await renderHook(() => useServerMaintenance(socket));

    expect(result.current).toBeNull();
  });
});
