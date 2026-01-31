/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useState } from 'react';
import type { ThemeContextType } from '@/types/types';
import {
  getTheme as getStoredTheme,
  setTheme as persistTheme,
} from '@utils/localStorage';

export const themeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeContextType['theme']>(() => {
    const stored = getStoredTheme();
    return stored ?? 'light';
  });
  const setTheme = useCallback((next: ThemeContextType['theme']) => {
    setThemeState(next);
    persistTheme(next);
  }, []);

  return (
    <themeContext.Provider value={{ theme, setTheme }}>
      {children}
    </themeContext.Provider>
  );
}
