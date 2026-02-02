import { useContext } from 'react';
import { uiContext } from '@context/UiContext';
import type { UiContextType } from '@/types/types';

export function useUi(): UiContextType {
  const ctx = useContext(uiContext);
  if (!ctx) {
    throw new Error('useUi must be used inside UiProvider');
  }
  return ctx;
}
