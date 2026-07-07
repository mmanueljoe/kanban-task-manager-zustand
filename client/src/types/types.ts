export type ThemeContextType = {
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
};

export type UiToast = {
  id: string;
  type: "success" | "error" | "info";
  message: string;
};

export type UiState = {
  loadingKeys: string[];
  toasts: UiToast[];
};

export type UiContextType = {
  state: UiState;
  showToast: (params: Omit<UiToast, "id">) => void;
  startLoading: (key: string) => void;
  stopLoading: (key: string) => void;
  isLoading: (key?: string) => boolean;
  dismissToast: (id: string) => void;
};

export type UiActionsType = {
  showToast: (params: Omit<UiToast, "id">) => void;
  startLoading: (key: string) => void;
  stopLoading: (key: string) => void;
  isLoading: (key?: string) => boolean;
  dismissToast: (id: string) => void;
};
