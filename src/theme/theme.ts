import { useCallback, useEffect, useState } from 'react';

export const THEME_STORAGE_KEY = 'ejoi.theme';
export const MOTION_STORAGE_KEY = 'ejoi.motion';

/**
 * Ids de la app (ejoiFE): `system` es el `auto` del drawer; claro/oscuro usan el pack `default`.
 * `romantic` | `minimal` | `kawaii` son ThemePackId. Cyber no está en THEME_PACKS.
 * `aurora`, `pulse`, `liquid` y `aparicion` son solo web.
 */
export const THEME_CHOICES = [
  { id: 'system', labelKey: 'drawer.theme_auto', web: false },
  { id: 'light', labelKey: 'drawer.theme_light', web: false },
  { id: 'dark', labelKey: 'drawer.theme_dark', web: false },
  { id: 'romantic', labelKey: 'drawer.pack_romantic', web: false },
  { id: 'minimal', labelKey: 'drawer.pack_minimal', web: false },
  { id: 'kawaii', labelKey: 'drawer.pack_kawaii', web: false },
  { id: 'aurora', labelKey: 'theme.aurora', web: true },
  { id: 'pulse', labelKey: 'theme.pulse', web: true },
  { id: 'liquid', labelKey: 'theme.liquid', web: true },
  { id: 'aparicion', labelKey: 'theme.aparicion', web: true },
] as const;

export type ThemePreference = (typeof THEME_CHOICES)[number]['id'];
export type ResolvedTheme = 'light' | 'dark';

const VALID = new Set<string>(THEME_CHOICES.map((choice) => choice.id));

export function readThemePreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw && VALID.has(raw)) return raw as ThemePreference;
  } catch {
    /* storage blocked */
  }
  return 'system';
}

export function writeThemePreference(pref: ThemePreference): void {
  try {
    if (pref === 'system') {
      localStorage.removeItem(THEME_STORAGE_KEY);
      return;
    }
    localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    /* storage blocked */
  }
}

export function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function readMotionChoice(): 'on' | 'off' | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(MOTION_STORAGE_KEY);
    if (raw === 'on' || raw === 'off') return raw;
  } catch {
    /* storage blocked */
  }
  return null;
}

/** Misma regla que el script de index.html. La clave gana a `prefers-reduced-motion`. */
export function motionEnabled(): boolean {
  const choice = readMotionChoice();
  if (choice === 'on') return true;
  if (choice === 'off') return false;
  return !prefersReducedMotion();
}

function paintMotion(): void {
  document.documentElement.dataset.motion = motionEnabled() ? 'on' : 'off';
}

type MotionListener = (enabled: boolean) => void;

const motionListeners = new Set<MotionListener>();
let motionQuery: MediaQueryList | null = null;

function notifyMotion(): void {
  const enabled = motionEnabled();
  motionListeners.forEach((fn) => fn(enabled));
}

function onSystemMotionChange(): void {
  if (readMotionChoice()) return;
  paintMotion();
  notifyMotion();
}

function syncMotionListener(): void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
  if (!motionQuery) motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  motionQuery.removeEventListener('change', onSystemMotionChange);
  if (!readMotionChoice()) motionQuery.addEventListener('change', onSystemMotionChange);
}

export function setMotionEnabled(on: boolean): void {
  try {
    localStorage.setItem(MOTION_STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    /* storage blocked */
  }
  paintMotion();
  syncMotionListener();
  notifyMotion();
}

function subscribeMotion(listener: MotionListener): () => void {
  motionListeners.add(listener);
  return () => {
    motionListeners.delete(listener);
  };
}

export function resolveEffectiveTheme(
  pref: ThemePreference = readThemePreference(),
): ResolvedTheme {
  if (pref === 'light' || pref === 'pulse' || pref === 'liquid') return 'light';
  if (pref === 'dark' || pref === 'aurora') return 'dark';
  return systemPrefersDark() ? 'dark' : 'light';
}

/** Pack `default` de la app = claro/oscuro/auto. El resto conserva su id. */
function themeIdFor(pref: ThemePreference): string {
  if (pref === 'system' || pref === 'light' || pref === 'dark') return 'default';
  return pref;
}

function tracksSystemScheme(pref: ThemePreference): boolean {
  return pref === 'system' || pref === 'romantic' || pref === 'minimal' || pref === 'kawaii' || pref === 'aparicion';
}

export const THEME_TRANSITION_MS = 400;

let transitionTimer = 0;

function paintTheme(pref: ThemePreference): void {
  const root = document.documentElement;
  const theme = resolveEffectiveTheme(pref);
  root.dataset.theme = theme;
  root.dataset.themeId = themeIdFor(pref);
  root.style.colorScheme = theme;
}

function applyThemePreference(pref: ThemePreference, animate = false): void {
  const root = document.documentElement;
  const motion = animate && motionEnabled();
  clearTimeout(transitionTimer);
  if (!motion) {
    root.classList.remove('theme-transition');
    paintTheme(pref);
    return;
  }
  root.classList.add('theme-transition');
  void root.offsetWidth;
  paintTheme(pref);
  transitionTimer = window.setTimeout(() => {
    root.classList.remove('theme-transition');
  }, THEME_TRANSITION_MS);
}

type ThemeListener = (preference: ThemePreference, resolved: ResolvedTheme) => void;

const listeners = new Set<ThemeListener>();

function notifyListeners(): void {
  const preference = readThemePreference();
  const resolved = resolveEffectiveTheme(preference);
  listeners.forEach((fn) => fn(preference, resolved));
}

let mediaQuery: MediaQueryList | null = null;

function onSystemSchemeChange(): void {
  const pref = readThemePreference();
  if (!tracksSystemScheme(pref)) return;
  applyThemePreference(pref, true);
  notifyListeners();
}

function syncSystemListener(preference: ThemePreference): void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
  if (!mediaQuery) {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  }
  mediaQuery.removeEventListener('change', onSystemSchemeChange);
  if (tracksSystemScheme(preference)) {
    mediaQuery.addEventListener('change', onSystemSchemeChange);
  }
}

let initialized = false;

/** Solo tests. */
export function resetThemeForTests(): void {
  clearTimeout(transitionTimer);
  transitionTimer = 0;
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('theme-transition');
    document.documentElement.removeAttribute('data-motion');
  }
  mediaQuery?.removeEventListener('change', onSystemSchemeChange);
  motionQuery?.removeEventListener('change', onSystemMotionChange);
  motionQuery = null;
  listeners.clear();
  motionListeners.clear();
  initialized = false;
}

export function initTheme(): () => void {
  if (typeof window === 'undefined' || initialized) return () => undefined;
  initialized = true;
  const preference = readThemePreference();
  applyThemePreference(preference, false);
  paintMotion();
  syncSystemListener(preference);
  syncMotionListener();
  return () => {
    mediaQuery?.removeEventListener('change', onSystemSchemeChange);
    motionQuery?.removeEventListener('change', onSystemMotionChange);
    listeners.clear();
    motionListeners.clear();
    initialized = false;
  };
}

export function setThemePreference(next: ThemePreference): void {
  writeThemePreference(next);
  applyThemePreference(next, true);
  syncSystemListener(next);
  notifyListeners();
}

export function subscribeTheme(listener: ThemeListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useThemePreference(): {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (next: ThemePreference) => void;
} {
  const [state, setState] = useState(() => ({
    preference: readThemePreference(),
    resolved: resolveEffectiveTheme(),
  }));

  useEffect(
    () =>
      subscribeTheme((preference, resolved) => {
        setState({ preference, resolved });
      }),
    [],
  );

  const setPreference = useCallback((next: ThemePreference) => {
    setThemePreference(next);
  }, []);

  return { ...state, setPreference };
}

export function useMotionEnabled(): {
  enabled: boolean;
  setEnabled: (on: boolean) => void;
} {
  const [enabled, setEnabledState] = useState(motionEnabled);
  useEffect(() => subscribeMotion(setEnabledState), []);
  const setEnabled = useCallback((on: boolean) => {
    setMotionEnabled(on);
  }, []);
  return { enabled, setEnabled };
}
