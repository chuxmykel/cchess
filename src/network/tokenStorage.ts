import * as SecureStore from 'expo-secure-store';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  userId: string;
};

const ACCESS_TOKEN_KEY = 'cchess.accessToken';
const REFRESH_TOKEN_KEY = 'cchess.refreshToken';
const USER_ID_KEY = 'cchess.userId';

export async function saveTokens(tokens: AuthTokens): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
    SecureStore.setItemAsync(USER_ID_KEY, tokens.userId),
  ]);
}

export async function getTokens(): Promise<AuthTokens | null> {
  const [accessToken, refreshToken, userId] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.getItemAsync(USER_ID_KEY),
  ]);
  if (!accessToken || !refreshToken || !userId) {
    return null;
  }
  return { accessToken, refreshToken, userId };
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_ID_KEY),
  ]);
}
