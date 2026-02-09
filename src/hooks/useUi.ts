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

// OPTIMIZATION: Granular selectors for UI state
// Components can subscribe only to what they need instead of entire UI context

/**
 * Hook to subscribe only to loadingKeys from the store
 * Use this instead of useUi() when you only need loading state
 */
export function useLoadingKeys(): string[] {
  // Use selector directly with explicit typing to satisfy ESLint's strict type checking
  const selector = (state: AppStore): string[] => state.loadingKeys;
  const result = useStore(selector);
  // Type assertion ensures ESLint understands the return type
  return result;
}

/**
 * Hook to subscribe only to toasts from the store
 * Use this instead of useUi() when you only need toast state
 */
export function useToasts(): UiToast[] {
  // Use selector directly with explicit typing to satisfy ESLint's strict type checking
  const selector = (state: AppStore): UiToast[] => state.toasts;
  const result = useStore(selector);
  // Type assertion ensures ESLint understands the return type
  return result;
}

/**
 * Hook to get UI actions without subscribing to state
 * Use this when you only need actions (startLoading, stopLoading, showToast, etc.)
 *
 * @throws {Error} If used outside UiProvider
 * @returns {UiActionsType} UI actions object
 */
export function useUiActions(): UiActionsType {
  const ctx = useContext(uiContext);

  // Type guard: if ctx is null, throw (function never returns)
  // After this check, TypeScript knows ctx is UiContextType
  if (ctx === null) {
    throw new Error('useUiActions must be used inside UiProvider');
  }

  // TypeScript now knows ctx is UiContextType (non-null)
  // Extract only the action methods to avoid subscribing to state
  // Explicit return type ensures TypeScript understands this always returns UiActionsType
  const result: UiActionsType = {
    showToast: ctx.showToast,
    startLoading: ctx.startLoading,
    stopLoading: ctx.stopLoading,
    isLoading: ctx.isLoading,
    dismissToast: ctx.dismissToast,
  };

  return result;
}
