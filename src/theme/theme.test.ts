import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  readThemePreference,
  resetThemeForTests,
  resolveEffectiveTheme,
  setThemePreference,
  THEME_STORAGE_KEY,
  writeThemePreference,
} from './theme';

function stubThemeStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  });
}

describe('theme', () => {
  beforeEach(() => {
    stubThemeStorage();
    document.documentElement.removeAttribute('data-theme');
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
    resetThemeForTests();
  });

  afterEach(() => {
    resetThemeForTests();
    vi.unstubAllGlobals();
  });

  it('por defecto usa system y resuelve con prefers-color-scheme', () => {
    expect(readThemePreference()).toBe('system');
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList);
    expect(resolveEffectiveTheme('system')).toBe('dark');
  });

  it('persiste preferencia manual', () => {
    writeThemePreference('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(readThemePreference()).toBe('dark');
    expect(resolveEffectiveTheme()).toBe('dark');
  });

  it('system no persiste override (sigue al dispositivo)', () => {
    writeThemePreference('dark');
    writeThemePreference('system');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    expect(readThemePreference()).toBe('system');
  });

  it('aplica data-theme al cambiar preferencia', () => {
    setThemePreference('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    setThemePreference('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
