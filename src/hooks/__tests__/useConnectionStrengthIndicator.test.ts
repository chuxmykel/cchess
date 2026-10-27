import { renderHook } from '@testing-library/react-native';

import {
  useConnectionStrengthIndicator,
  BAR_COUNT,
  GOOD_LATENCY_MS,
  FAIR_LATENCY_MS,
  BAD_LATENCY_MS,
} from '../useConnectionStrengthIndicator';
import {
  CONNECTION_LATENCY_STATUS,
  useConnectionLatency,
  ConnectionLatencyStatus,
} from '../useConnectionLatency';
import { useAuthSession } from '../../context/AuthSessionContext';
import { makeAuthSession } from '../../testUtils/authSession';

jest.mock('../useConnectionLatency');
jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));

function mockLatency(
  status: ConnectionLatencyStatus,
  latencyMs: number | null,
) {
  (useAuthSession as jest.Mock).mockReturnValue(makeAuthSession());
  (useConnectionLatency as jest.Mock).mockReturnValue({ status, latencyMs });
}

describe('useConnectionStrengthIndicator', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each<[number, number]>([
    [GOOD_LATENCY_MS - 1, 4],
    [GOOD_LATENCY_MS, 3],
    [FAIR_LATENCY_MS - 1, 3],
    [FAIR_LATENCY_MS, 2],
    [BAD_LATENCY_MS - 1, 2],
    [BAD_LATENCY_MS, 1],
  ])('lights %ims as %i bars', async (latencyMs, expectedBars) => {
    mockLatency(CONNECTION_LATENCY_STATUS.OK, latencyMs);

    const { result } = await renderHook(() => useConnectionStrengthIndicator());

    expect(result.current.litBars).toBe(expectedBars);
    expect(result.current.litBars).toBeLessThanOrEqual(BAR_COUNT);
  });

  it.each<[ConnectionLatencyStatus, number | null]>([
    [CONNECTION_LATENCY_STATUS.MEASURING, null],
    [CONNECTION_LATENCY_STATUS.DISCONNECTED, null],
  ])('lights no bars while %s', async (status, latencyMs) => {
    mockLatency(status, latencyMs);

    const { result } = await renderHook(() => useConnectionStrengthIndicator());

    expect(result.current.litBars).toBe(0);
  });

  it.each<[ConnectionLatencyStatus, number | null, string]>([
    [CONNECTION_LATENCY_STATUS.OK, 42, '42ms'],
    [CONNECTION_LATENCY_STATUS.MEASURING, null, 'Measuring…'],
    [CONNECTION_LATENCY_STATUS.DISCONNECTED, null, 'Offline'],
  ])('labels %s as %s', async (status, latencyMs, expectedLabel) => {
    mockLatency(status, latencyMs);

    const { result } = await renderHook(() => useConnectionStrengthIndicator());

    expect(result.current.label).toBe(expectedLabel);
  });

  it('exposes a closed popover by default', async () => {
    mockLatency(CONNECTION_LATENCY_STATUS.OK, 42);

    const { result } = await renderHook(() => useConnectionStrengthIndicator());

    expect(result.current.popover.visible).toBe(false);
  });
});
