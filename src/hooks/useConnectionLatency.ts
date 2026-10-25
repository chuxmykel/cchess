import { useEffect, useState } from 'react';

import { AppSocket } from '../network/socketClient';

export const CONNECTION_LATENCY_STATUS = {
  MEASURING: 'measuring',
  OK: 'ok',
  DISCONNECTED: 'disconnected',
} as const;

export type ConnectionLatencyStatus =
  (typeof CONNECTION_LATENCY_STATUS)[keyof typeof CONNECTION_LATENCY_STATUS];

export type ConnectionLatencyResult =
  | { status: typeof CONNECTION_LATENCY_STATUS.MEASURING; latencyMs: null }
  | { status: typeof CONNECTION_LATENCY_STATUS.OK; latencyMs: number }
  | { status: typeof CONNECTION_LATENCY_STATUS.DISCONNECTED; latencyMs: null };

export const PING_INTERVAL_MS = 3000;
const PING_ACK_TIMEOUT_MS = 2000;

// Pings the server over the live socket connection to sample round-trip
// latency, via socket.io's ack-timeout emit.
export function useConnectionLatency(
  socket: AppSocket | null,
): ConnectionLatencyResult {
  const [result, setResult] = useState<ConnectionLatencyResult>({
    latencyMs: null,
    status: CONNECTION_LATENCY_STATUS.MEASURING,
  });

  useEffect(() => {
    if (!socket) {
      return;
    }

    function handleDisconnect() {
      setResult({
        latencyMs: null,
        status: CONNECTION_LATENCY_STATUS.DISCONNECTED,
      });
    }

    socket.on('disconnect', handleDisconnect);

    function pingOnce() {
      if (!socket.connected) {
        return;
      }
      const sentAt = Date.now();
      socket
        .timeout(PING_ACK_TIMEOUT_MS)
        .emit('ping', sentAt, (error: Error | null) => {
          if (error) {
            return;
          }
          const acknowledgedAt = Date.now();
          setResult({
            latencyMs: acknowledgedAt - sentAt,
            status: CONNECTION_LATENCY_STATUS.OK,
          });
        });
    }

    pingOnce();
    const interval = setInterval(pingOnce, PING_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket]);

  if (!socket) {
    return { latencyMs: null, status: CONNECTION_LATENCY_STATUS.DISCONNECTED };
  }

  return result;
}
