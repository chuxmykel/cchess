import { act, renderHook } from '@testing-library/react-native';
import { AppState } from 'react-native';

import { useAppIsActive } from '../useAppIsActive';

describe('useAppIsActive', () => {
  it('follows the app into the background and back', async () => {
    let onChange: (state: string) => void = () => {};
    jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_type, listener) => {
        onChange = listener as (state: string) => void;
        return { remove: jest.fn() } as never;
      });
    const { result } = await renderHook(() => useAppIsActive());
    expect(result.current).toBe(true);

    await act(async () => onChange('background'));
    expect(result.current).toBe(false);
    await act(async () => onChange('active'));
    expect(result.current).toBe(true);
  });
});
