import type { ThemeContextType } from '@/types/types';
import { themeContext } from '@context/ThemeContext';
import { useContext } from 'react';

export function useTheme(): ThemeContextType {
  const ctx = useContext(themeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
