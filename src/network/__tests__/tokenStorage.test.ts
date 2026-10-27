import * as SecureStore from 'expo-secure-store';

import {
  clearRefreshToken,
  getRefreshToken,
  saveRefreshToken,
} from '../tokenStorage';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('tokenStorage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('saves the refresh token in secure storage', async () => {
    await saveRefreshToken('refresh-456');

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'cchess.refreshToken',
      'refresh-456',
    );
  });

  it('reads the stored refresh token back', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('refresh-456');

    await expect(getRefreshToken()).resolves.toBe('refresh-456');
  });

  it('resolves null when nothing is stored', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

    await expect(getRefreshToken()).resolves.toBeNull();
  });

  it('deletes the stored refresh token', async () => {
    await clearRefreshToken();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
      'cchess.refreshToken',
    );
  });
});
