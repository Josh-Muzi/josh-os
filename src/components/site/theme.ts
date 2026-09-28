export type Theme = "light" | "dark";

export const THEME_KEY = "joshos:theme";
export const THEME_COLOR: Record<Theme, string> = {
  light: "#ffffff",
  dark: "#0d1210",
};

/** The theme currently applied to <html> (set by the head script). */
export function currentTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLOR[theme]);
}

/** localStorage throws when storage is blocked; treat that as no choice. */
export function readStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

export function storeTheme(theme: Theme) {
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage blocked: the choice lasts for this visit only.
  }
}
