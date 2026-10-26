import { act, renderHook } from '@testing-library/react-native';

import { useBoardOrientation } from '../useBoardOrientation';

describe('useBoardOrientation', () => {
  it.each(['w', 'b'] as const)(
    "starts from the player's own side (%s)",
    async (myColor) => {
      const { result } = await renderHook(() => useBoardOrientation(myColor));

      expect(result.current.orientation).toBe(myColor);
      expect(result.current.isFlipped).toBe(false);
    },
  );

  it("flips to the opponent's side and back", async () => {
    const { result } = await renderHook(() => useBoardOrientation('b'));

    await act(() => result.current.flip());
    expect(result.current.orientation).toBe('w');
    expect(result.current.isFlipped).toBe(true);

    await act(() => result.current.flip());
    expect(result.current.orientation).toBe('b');
    expect(result.current.isFlipped).toBe(false);
  });
});
