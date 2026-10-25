import * as SecureStore from 'expo-secure-store';

import { clearTokens, getTokens, saveTokens } from '../tokenStorage';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const TOKENS = {
  accessToken: 'access-123',
  refreshToken: 'refresh-456',
  userId: 'user-789',
};

describe('tokenStorage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('saves all three values under their own keys', async () => {
    await saveTokens(TOKENS);

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'cchess.accessToken',
      TOKENS.accessToken,
    );
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'cchess.refreshToken',
      TOKENS.refreshToken,
    );
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'cchess.userId',
      TOKENS.userId,
    );
  });

  it('returns the stored tokens when all three are present', async () => {
    (SecureStore.getItemAsync as jest.Mock)
      .mockResolvedValueOnce(TOKENS.accessToken)
      .mockResolvedValueOnce(TOKENS.refreshToken)
      .mockResolvedValueOnce(TOKENS.userId);

    await expect(getTokens()).resolves.toEqual(TOKENS);
  });

  it('returns null if any value is missing', async () => {
    (SecureStore.getItemAsync as jest.Mock)
      .mockResolvedValueOnce(TOKENS.accessToken)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(TOKENS.userId);

    await expect(getTokens()).resolves.toBeNull();
  });

  it('deletes all three keys', async () => {
    await clearTokens();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
      'cchess.accessToken',
    );
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
      'cchess.refreshToken',
    );
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('cchess.userId');
  });
});
