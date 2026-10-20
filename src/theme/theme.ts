import { useCallback, useEffect, useState } from 'react';

export const THEME_STORAGE_KEY = 'ejoi.theme';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const VALID: ThemePreference[] = ['system', 'light', 'dark'];

export function readThemePreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw && (VALID as string[]).includes(raw)) return raw as ThemePreference;
  } catch {
    /* storage blocked */
  }
  return 'system';
}

export function writeThemePreference(pref: ThemePreference): void {
  try {
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

export function resolveEffectiveTheme(
  pref: ThemePreference = readThemePreference(),
): ResolvedTheme {
  if (pref === 'light') return 'light';
  if (pref === 'dark') return 'dark';
  return systemPrefersDark() ? 'dark' : 'light';
}

const THEME_TRANSITION_MS = 150;

export function applyResolvedTheme(theme: ResolvedTheme, animate = false): void {
  const root = document.documentElement;
  if (!animate) {
    root.dataset.theme = theme;
    return;
  }
  root.classList.add('theme-transition');
  root.dataset.theme = theme;
  window.setTimeout(() => root.classList.remove('theme-transition'), THEME_TRANSITION_MS);
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
  if (readThemePreference() !== 'system') return;
  applyResolvedTheme(resolveEffectiveTheme('system'), true);
  notifyListeners();
}

function syncSystemListener(preference: ThemePreference): void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
  if (!mediaQuery) {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  }
  mediaQuery.removeEventListener('change', onSystemSchemeChange);
  if (preference === 'system') {
    mediaQuery.addEventListener('change', onSystemSchemeChange);
  }
}

let initialized = false;

/** Solo tests. */
export function resetThemeForTests(): void {
  mediaQuery?.removeEventListener('change', onSystemSchemeChange);
  listeners.clear();
  initialized = false;
}

export function initTheme(): () => void {
  if (typeof window === 'undefined' || initialized) return () => undefined;
  initialized = true;
  const preference = readThemePreference();
  applyResolvedTheme(resolveEffectiveTheme(preference), false);
  syncSystemListener(preference);
  return () => {
    mediaQuery?.removeEventListener('change', onSystemSchemeChange);
    listeners.clear();
    initialized = false;
  };
}

export function setThemePreference(next: ThemePreference): void {
  writeThemePreference(next);
  applyResolvedTheme(resolveEffectiveTheme(next), true);
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
