import { create } from 'zustand';
import type { BoardsState, BoardsAction, User, UiToast } from '@/types/types';
import { boardsReducer } from '@/utils/boardsReducer';
import {
  getTheme,
  setTheme as persistTheme,
  getAuth,
  setAuth as persistAuth,
} from '@/utils/localStorage';

const storedTheme = getTheme();
const storedAuth = getAuth();

export type AppStore = BoardsState & {
  dispatch: (action: BoardsAction) => void;

  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;

  user: User | null;
  isLoggedIn: boolean;
  login: (user: User) => void;
  logout: () => void;

  loadingKeys: string[];
  toasts: UiToast[];
  addLoadingKey: (key: string) => void;
  removeLoadingKey: (key: string) => void;
  addToast: (toast: UiToast) => void;
  removeToast: (id: string) => void;
};

export const useStore = create<AppStore>((set) => ({
  boards: [],
  dispatch: (action: BoardsAction) => {
    set((state) => boardsReducer(state, action));
  },

  theme: storedTheme ?? 'light',
  setTheme: (theme: 'light' | 'dark') => {
    set({ theme });
    persistTheme(theme);
  },

  user: storedAuth?.isLoggedIn && storedAuth.user ? storedAuth.user : null,
  isLoggedIn: storedAuth?.isLoggedIn ?? false,
  login: (user: User) => {
    set({ user, isLoggedIn: true });
    persistAuth({ isLoggedIn: true, user });
  },
  logout: () => {
    set({ user: null, isLoggedIn: false });
    persistAuth({ isLoggedIn: false, user: null });
  },

  loadingKeys: [],
  toasts: [],
  addLoadingKey: (key: string) => {
    set((state) => {
      if (state.loadingKeys.includes(key)) return state;
      return { loadingKeys: [...state.loadingKeys, key] };
    });
  },
  removeLoadingKey: (key: string) => {
    set((state) => ({
      loadingKeys: state.loadingKeys.filter((k) => k !== key),
    }));
  },
  addToast: (toast: UiToast) => {
    set((state) => ({ toasts: [...state.toasts, toast] }));
  },
  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
