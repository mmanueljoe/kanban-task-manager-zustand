import type { Auth } from '@/types/types';

const AUTH = 'user_auth';
const THEME = 'app_theme';

const THEMES = ['light', 'dark'] as const;
export type StoredTheme = (typeof THEMES)[number];

export function getAuth(): Auth | undefined {
  try {
    const raw = localStorage.getItem(AUTH);
    return raw ? (JSON.parse(raw) as Auth) : undefined;
  } catch (error) {
    console.error('Error getting auth from localStorage:', error);
    return undefined;
  }
}

export function setAuth(auth: Auth) {
  try {
    localStorage.setItem(AUTH, JSON.stringify(auth));
  } catch (error) {
    console.error('Error setting auth in localStorage:', error);
  }
}

export function getTheme(): StoredTheme | undefined {
  try {
    const raw = localStorage.getItem(THEME);
    if (!raw) return undefined;
    const value = raw.toLowerCase();
    return THEMES.includes(value as StoredTheme)
      ? (value as StoredTheme)
      : undefined;
  } catch {
    return undefined;
  }
}

export function setTheme(theme: StoredTheme) {
  try {
    localStorage.setItem(THEME, theme);
  } catch (error) {
    console.error('Error setting theme in localStorage:', error);
  }
}
