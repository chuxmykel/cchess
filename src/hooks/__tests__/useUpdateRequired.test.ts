import { act, renderHook } from '@testing-library/react-native';

import { getAppConfig } from '../../network/restClient';
import { appVersion, useUpdateRequired } from '../useUpdateRequired';

jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getAppConfig: jest.fn(),
}));

describe('useUpdateRequired', () => {
  it.each([
    ['older than the minimum', '99.0.0', true],
    ['the minimum or newer', '0.0.0', false],
  ])('when the app is %s', async (_, minimumVersion, required) => {
    (getAppConfig as jest.Mock).mockResolvedValue({ minimumVersion });
    const { result } = await renderHook(() => useUpdateRequired());
    await act(async () => {});
    expect(result.current).toBe(required);
  });

  it("carries on when the server can't be reached", async () => {
    (getAppConfig as jest.Mock).mockRejectedValue(new Error('offline'));
    const { result } = await renderHook(() => useUpdateRequired());
    await act(async () => {});
    expect(result.current).toBe(false);
  });

  it("reads the app's version from app.json", () => {
    expect(appVersion()).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
