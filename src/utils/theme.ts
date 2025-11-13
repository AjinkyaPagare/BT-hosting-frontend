const THEME_STORAGE_KEY = "theme-preference";

export type ThemePreference = "light" | "dark";

export const getStoredTheme = (): ThemePreference | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      return stored;
    }
  } catch (error) {
    console.error("Unable to access theme from localStorage", error);
  }

  return null;
};

export const resolveInitialTheme = (): ThemePreference => {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = getStoredTheme();
  if (storedTheme) {
    return storedTheme;
  }

  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
};

export const applyTheme = (theme: ThemePreference) => {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
};

export const storeTheme = (theme: ThemePreference) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.error("Unable to store theme preference", error);
  }
};
