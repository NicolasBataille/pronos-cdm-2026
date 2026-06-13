export interface ThemeDef {
  id: string;
  label: string;
  scheme: "dark" | "light";
  /** Couleurs pour l'aperçu du sélecteur : [fond, surface, accent] */
  swatch: [string, string, string];
  /** Thème secret : masqué tant qu'il n'est pas débloqué */
  hidden?: boolean;
}

export const THEMES: ThemeDef[] = [
  { id: "ardoise", label: "Ardoise", scheme: "dark", swatch: ["#14161b", "#1e222a", "#9d8cff"] },
  { id: "sunset", label: "Coucher de soleil", scheme: "dark", swatch: ["#1a1310", "#271d18", "#ff8f3d"] },
  { id: "ocean", label: "Océan", scheme: "dark", swatch: ["#0c1620", "#142532", "#2dd4bf"] },
  { id: "neon", label: "Néon", scheme: "dark", swatch: ["#0a0b0a", "#151614", "#c4f223"] },
  { id: "creme", label: "Crème", scheme: "light", swatch: ["#f3efe4", "#fbf8f0", "#d6492f"] },
  { id: "retro", label: "Rétro", scheme: "light", swatch: ["#e9e0cd", "#f3ecda", "#234b8f"] },
  { id: "tigre", label: "Tigre", scheme: "dark", swatch: ["#150d05", "#23170b", "#ff7a14"], hidden: true },
];

export const DEFAULT_THEME = "ardoise";
export const THEME_STORAGE_KEY = "cdm-theme";
export const TIGRE_STORAGE_KEY = "cdm-tigre-unlocked";
/** Émis quand un thème caché est débloqué ou que le thème change hors du picker */
export const THEME_EVENT = "cdm-theme-change";

export function applyTheme(id: string): void {
  document.documentElement.dataset.theme = id;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch {
    /* localStorage indisponible */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(THEME_EVENT));
  }
}

export function getStoredTheme(): string {
  if (typeof document !== "undefined" && document.documentElement.dataset.theme) {
    return document.documentElement.dataset.theme;
  }
  return DEFAULT_THEME;
}

export function isTigreUnlocked(): boolean {
  try {
    return localStorage.getItem(TIGRE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function unlockTigre(): void {
  try {
    localStorage.setItem(TIGRE_STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** Thèmes visibles dans le sélecteur (les cachés n'apparaissent qu'une fois débloqués). */
export function visibleThemes(): ThemeDef[] {
  const unlocked = isTigreUnlocked();
  return THEMES.filter((t) => !t.hidden || unlocked);
}
