import type { ThemeContextType } from '@/types/types';
import { useStore } from '@/store/useStore';
import { useShallow } from 'zustand/react/shallow';

export function useTheme(): ThemeContextType {
  return useStore(
    useShallow((state) => ({
      theme: state.theme,
      setTheme: state.setTheme,
    }))
  );
}
