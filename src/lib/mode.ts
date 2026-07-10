export type SiteMode = "classic" | "city";

const KEY = "portfolio-mode";

export function getStoredMode(): SiteMode | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "classic" || v === "city" ? v : null;
  } catch {
    return null;
  }
}

export function setStoredMode(mode: SiteMode) {
  try {
    window.localStorage.setItem(KEY, mode);
  } catch {
    /* storage unavailable — mode just won't persist */
  }
}
