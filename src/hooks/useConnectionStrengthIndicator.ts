import { useAuthSession } from '../context/AuthSessionContext';
import {
  CONNECTION_LATENCY_STATUS,
  ConnectionLatencyStatus,
  useConnectionLatency,
} from './useConnectionLatency';
import { usePopoverMenu, PopoverMenu } from './usePopoverMenu';

export const BAR_COUNT = 4;

export const GOOD_LATENCY_MS = 400;
export const FAIR_LATENCY_MS = 600;
export const BAD_LATENCY_MS = 800;
const POPOVER_WIDTH = 140;
const POPOVER_HEIGHT = 36;

function barsLitFor(latencyMs: number): number {
  if (latencyMs < GOOD_LATENCY_MS) {
    return 4;
  }
  if (latencyMs < FAIR_LATENCY_MS) {
    return 3;
  }
  if (latencyMs < BAD_LATENCY_MS) {
    return 2;
  }
  return 1;
}

function labelFor(
  status: ConnectionLatencyStatus,
  latencyMs: number | null,
): string {
  switch (status) {
    case CONNECTION_LATENCY_STATUS.OK:
      return `${latencyMs}ms`;
    case CONNECTION_LATENCY_STATUS.DISCONNECTED:
      return 'Offline';
    case CONNECTION_LATENCY_STATUS.MEASURING:
    default:
      return 'Measuring…';
  }
}

export type UseConnectionStrengthIndicatorResult = {
  litBars: number;
  label: string;
  popover: PopoverMenu;
};

export function useConnectionStrengthIndicator(): UseConnectionStrengthIndicatorResult {
  const authSession = useAuthSession();
  const socket = authSession.isReady ? authSession.socket : null;
  const latencyResult = useConnectionLatency(socket);
  const popover = usePopoverMenu(POPOVER_WIDTH, {
    placement: 'right',
    menuHeight: POPOVER_HEIGHT,
  });
  const litBars =
    latencyResult.status === CONNECTION_LATENCY_STATUS.OK
      ? barsLitFor(latencyResult.latencyMs)
      : 0;
  const label = labelFor(latencyResult.status, latencyResult.latencyMs);

  return { litBars, label, popover };
}
