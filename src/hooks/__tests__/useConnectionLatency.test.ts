import { act, renderHook } from '@testing-library/react-native';

import {
  CONNECTION_LATENCY_STATUS,
  PING_INTERVAL_MS,
  useConnectionLatency,
} from '../useConnectionLatency';
import { AppSocket } from '../../network/socketClient';

type AckBehaviorCallback = (error: Error | null) => void;
type AckBehavior = (callback: AckBehaviorCallback) => void;

function createFakeSocket(ackBehavior: AckBehavior): AppSocket {
  const emit = jest.fn((_event: string, _arg: unknown, callback: unknown) => {
    ackBehavior(callback as AckBehaviorCallback);
  });
  return {
    connected: true,
    on: jest.fn(),
    off: jest.fn(),
    timeout: jest.fn().mockReturnValue({ emit }),
  } as unknown as AppSocket;
}

describe('useConnectionLatency', () => {
  it('reports disconnected when there is no socket', async () => {
    const { result } = await renderHook(() => useConnectionLatency(null));

    expect(result.current).toEqual({
      latencyMs: null,
      status: CONNECTION_LATENCY_STATUS.DISCONNECTED,
    });
  });

  it('reports a latency sample once the server acks', async () => {
    const socket = createFakeSocket((callback) => callback(null));

    const { result } = await renderHook(() => useConnectionLatency(socket));

    expect(result.current.status).toBe(CONNECTION_LATENCY_STATUS.OK);
    expect(typeof result.current.latencyMs).toBe('number');
  });

  it('skips a sample when the ack returns an error, then recovers on the next interval tick', async () => {
    jest.useFakeTimers();

    let shouldAckWithError = true;
    const latencyMs = 25;
    const ackBehavior: AckBehavior = (callback) => {
      if (shouldAckWithError) {
        callback(new Error('timeout'));
      } else {
        setTimeout(() => callback(null), latencyMs);
      }
    };
    const socket = createFakeSocket(ackBehavior);

    const { result } = await renderHook(() => useConnectionLatency(socket));

    // The missed first sample doesn't push a stale/error state - still the
    // initial 'measuring' value, waiting on a real sample.
    expect(result.current).toEqual({
      latencyMs: null,
      status: CONNECTION_LATENCY_STATUS.MEASURING,
    });

    shouldAckWithError = false;

    await act(() => {
      jest.advanceTimersByTime(PING_INTERVAL_MS + latencyMs);
    });

    expect(result.current.status).toBe(CONNECTION_LATENCY_STATUS.OK);
    expect(typeof result.current.latencyMs).toBe('number');
    expect(result.current.latencyMs).toBe(latencyMs);
    jest.useRealTimers();
  });
});
