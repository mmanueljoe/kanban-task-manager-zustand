import { create } from "zustand";
import type { UiToast } from "@/types/types";
import { getTheme, setTheme as persistTheme } from "@/utils/localStorage";

const storedTheme = getTheme();

// Client-only state. Server data (boards/columns/tasks/auth) lives in TanStack
// Query, not here.
export type AppStore = {
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;

  loadingKeys: string[];
  toasts: UiToast[];
  addLoadingKey: (key: string) => void;
  removeLoadingKey: (key: string) => void;
  addToast: (toast: UiToast) => void;
  removeToast: (id: string) => void;
};

export const useStore = create<AppStore>((set) => ({
  theme: storedTheme ?? "light",
  setTheme: (theme: "light" | "dark") => {
    set({ theme });
    persistTheme(theme);
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
