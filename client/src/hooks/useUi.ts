import { useContext } from 'react';
import { uiContext } from '@context/ui-context';
import { useStore } from '@/store/useStore';
import type { AppStore } from '@/store/useStore';
import type { UiContextType, UiActionsType, UiToast } from '@/types/types';

export function useUi(): UiContextType {
  const ctx = useContext(uiContext);
  if (!ctx) {
    throw new Error('useUi must be used inside UiProvider');
  }
  return ctx;
}

export function useLoadingKeys(): string[] {
  const selector = (state: AppStore): string[] => state.loadingKeys;
  const result = useStore(selector);

  return result;
}

export function useToasts(): UiToast[] {
  const selector = (state: AppStore): UiToast[] => state.toasts;
  const result = useStore(selector);
  return result;
}

export function useUiActions(): UiActionsType {
  const ctx = useContext(uiContext);

  if (ctx === null) {
    throw new Error('useUiActions must be used inside UiProvider');
  }

  const result: UiActionsType = {
    showToast: ctx.showToast,
    startLoading: ctx.startLoading,
    stopLoading: ctx.stopLoading,
    isLoading: ctx.isLoading,
    dismissToast: ctx.dismissToast,
  };

  return result;
}
