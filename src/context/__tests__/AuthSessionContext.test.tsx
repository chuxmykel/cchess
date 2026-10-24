import { renderHook } from '@testing-library/react-native';

import { useAuthSession } from '../AuthSessionContext';

describe('useAuthSession', () => {
  it('throws when used outside the provider', async () => {
    const { result } = await renderHook(() => {
      try {
        return useAuthSession();
      } catch (error) {
        return error;
      }
    });

    expect(result.current).toBeInstanceOf(Error);
  });
});
