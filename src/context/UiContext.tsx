/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useReducer } from 'react';
import type { UiContextType, UiState, UiToast } from '@/types/types';
import { uiReducer } from '@utils/uiReducer';

export const uiContext = createContext<UiContextType | null>(null);

const initialState: UiState = {
  loadingKeys: [],
  toasts: [],
};

export function UiProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [state, dispatch] = useReducer(uiReducer, initialState);

  const startLoading = useCallback(
    (key: string) => {
      dispatch({ type: 'START_LOADING', payload: { key } });
    },
    [dispatch]
  );

  const stopLoading = useCallback(
    (key: string) => {
      dispatch({ type: 'STOP_LOADING', payload: { key } });
    },
    [dispatch]
  );

  const showToast = useCallback(
    ({ type, message }: Omit<UiToast, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      dispatch({
        type: 'SHOW_TOAST',
        payload: { id, type, message },
      });
    },
    [dispatch]
  );

  const isLoading = useCallback(
    (key?: string) => {
      if (key) {
        return state.loadingKeys.includes(key);
      }
      return state.loadingKeys.length > 0;
    },
    [state.loadingKeys]
  );

  const value: UiContextType = {
    state,
    dispatch,
    showToast,
    startLoading,
    stopLoading,
    isLoading,
  };

  return <uiContext.Provider value={value}>{children}</uiContext.Provider>;
}
