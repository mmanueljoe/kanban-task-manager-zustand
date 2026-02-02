import type { UiAction, UiState } from '@/types/types';

export function uiReducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case 'START_LOADING': {
      const { key } = action.payload;
      if (state.loadingKeys.includes(key)) return state;
      return {
        ...state,
        loadingKeys: [...state.loadingKeys, key],
      };
    }
    case 'STOP_LOADING': {
      const { key } = action.payload;
      return {
        ...state,
        loadingKeys: state.loadingKeys.filter((k) => k !== key),
      };
    }
    case 'SHOW_TOAST':
      return {
        ...state,
        toasts: [...state.toasts, action.payload],
      };
    case 'DISMISS_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== action.payload.id),
      };
    default:
      return state;
  }
}
