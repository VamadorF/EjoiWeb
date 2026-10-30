import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  MOTION_STORAGE_KEY,
  motionEnabled,
  readThemePreference,
  resetThemeForTests,
  resolveEffectiveTheme,
  setMotionEnabled,
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
    document.documentElement.removeAttribute('data-theme-id');
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
    expect(document.documentElement.dataset.themeId).toBe('default');
    setThemePreference('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.classList.contains('theme-transition')).toBe(true);
  });

  it('persiste packs de la app y temas web en la misma clave', () => {
    writeThemePreference('romantic');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('romantic');
    expect(readThemePreference()).toBe('romantic');
    writeThemePreference('aurora');
    expect(readThemePreference()).toBe('aurora');
    localStorage.setItem(THEME_STORAGE_KEY, 'cyber');
    expect(readThemePreference()).toBe('system');
  });

  it('packs siguen el esquema del sistema; aurora y pulso tienen base fija', () => {
    expect(resolveEffectiveTheme('romantic')).toBe('light');
    expect(resolveEffectiveTheme('kawaii')).toBe('light');
    expect(resolveEffectiveTheme('aurora')).toBe('dark');
    expect(resolveEffectiveTheme('pulse')).toBe('light');
    setThemePreference('minimal');
    expect(document.documentElement.dataset.themeId).toBe('minimal');
    setThemePreference('aurora');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.dataset.themeId).toBe('aurora');
  });

  it('liquid glass persiste, es claro y no pisa los packs', () => {
    writeThemePreference('romantic');
    expect(readThemePreference()).toBe('romantic');
    writeThemePreference('liquid');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('liquid');
    expect(readThemePreference()).toBe('liquid');
    expect(resolveEffectiveTheme('liquid')).toBe('light');
    setThemePreference('liquid');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.dataset.themeId).toBe('liquid');
  });

  it('aparición sigue el esquema del sistema', () => {
    expect(resolveEffectiveTheme('aparicion')).toBe('light');
    setThemePreference('aparicion');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.dataset.themeId).toBe('aparicion');
  });

  it('reduced motion aplica el tema sin cruce', () => {
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: query.includes('reduce'),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as MediaQueryList);
    setThemePreference('pulse');
    expect(document.documentElement.classList.contains('theme-transition')).toBe(false);
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.dataset.themeId).toBe('pulse');
  });

  it('motion arranca encendido y la clave ejoi.motion apaga el cruce', () => {
    expect(motionEnabled()).toBe(true);
    setMotionEnabled(false);
    expect(localStorage.getItem(MOTION_STORAGE_KEY)).toBe('off');
    expect(document.documentElement.dataset.motion).toBe('off');
    setThemePreference('aurora');
    expect(document.documentElement.classList.contains('theme-transition')).toBe(false);
    expect(document.documentElement.dataset.themeId).toBe('aurora');
  });

  it('reduced motion sin elección arranca apagado; encender a mano gana', () => {
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: query.includes('reduce'),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as MediaQueryList);
    expect(motionEnabled()).toBe(false);
    setMotionEnabled(true);
    expect(localStorage.getItem(MOTION_STORAGE_KEY)).toBe('on');
    expect(motionEnabled()).toBe(true);
    expect(document.documentElement.dataset.motion).toBe('on');
    setThemePreference('dark');
    expect(document.documentElement.classList.contains('theme-transition')).toBe(true);
  });
});
