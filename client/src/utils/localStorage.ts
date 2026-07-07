const THEME = "app_theme";

const THEMES = ["light", "dark"] as const;
export type StoredTheme = (typeof THEMES)[number];

export function getTheme(): StoredTheme | undefined {
  try {
    const raw = localStorage.getItem(THEME);
    if (!raw) return undefined;
    const value = raw.toLowerCase();
    return THEMES.includes(value as StoredTheme)
      ? (value as StoredTheme)
      : undefined;
  } catch {
    return undefined;
  }
}

export function setTheme(theme: StoredTheme) {
  try {
    localStorage.setItem(THEME, theme);
  } catch (error) {
    console.error("Error setting theme in localStorage:", error);
  }
}
