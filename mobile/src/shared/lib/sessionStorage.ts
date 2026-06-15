import { Platform } from 'react-native';

const TOKEN_KEY = 'blizz_session_token';
let memoryToken: string | null = null;

function hasWebStorage(): boolean {
  return Platform.OS === 'web' && typeof window !== 'undefined' && Boolean(window.localStorage);
}

export async function saveSessionToken(token: string): Promise<void> {
  memoryToken = token;

  if (hasWebStorage()) {
    window.localStorage.setItem(TOKEN_KEY, token);
  }
}

export async function getSessionToken(): Promise<string | null> {
  if (hasWebStorage()) {
    return window.localStorage.getItem(TOKEN_KEY);
  }

  return memoryToken;
}

export async function clearSessionToken(): Promise<void> {
  memoryToken = null;

  if (hasWebStorage()) {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}
