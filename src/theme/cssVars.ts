import { UxV2, type UxV2ColorMode } from '@/shared/theme/tokens';

import { BREAKPOINTS } from './breakpoints';
import { initTheme, THEME_TRANSITION_MS } from './theme';

const STYLE_ID = 'ejoi-css-vars';

function toKebab(key: string): string {
  return key.replace(/([A-Z])/g, '-$1').toLowerCase();
}

export function colorVarName(key: string): string {
  return `--c-${toKebab(key)}`;
}

function colorBlock(mode: 'light' | 'dark', colors: UxV2ColorMode): string {
  const lines = [
    `  color-scheme: ${mode};`,
    ...Object.entries(colors).map(
      ([key, value]) => `  ${colorVarName(key)}: ${value};`,
    ),
  ];
  return `:root[data-theme="${mode}"] {\n${lines.join('\n')}\n}`;
}

function scalarBlock(
  prefix: string,
  record: Record<string, number>,
  unit: 'px' | 'ms',
): string {
  return Object.entries(record)
    .map(([key, value]) => `  --${prefix}-${toKebab(key)}: ${value}${unit};`)
    .join('\n');
}

function layoutMediaQueries(): string {
  const { REFERENCE, MEDIUM } = BREAKPOINTS;
  const belowReference = REFERENCE - 1;
  const belowLarge = BREAKPOINTS.LARGE - 1;
  const belowMedium = MEDIUM - 1;

  return `
@media (max-width: ${belowReference}px) {
  :root {
    --shell-preview-w: 360px;
    --create-style-thumb-max-h: 140px;
  }
}
@media (max-width: ${belowLarge}px) {
  .desktop-shell {
    grid-template-areas:
      "header header"
      "strip strip"
      "main main"
      "footer footer";
    grid-template-rows: var(--shell-header-h) var(--shell-preview-strip-h) minmax(0, 1fr) var(--shell-footer-h);
    grid-template-columns: 1fr;
  }
  .desktop-shell__preview {
    grid-area: strip;
    display: flex;
    flex-direction: row;
    align-items: center;
    height: var(--shell-preview-strip-h);
    max-height: var(--shell-preview-strip-h);
    min-height: var(--shell-preview-strip-h);
    border-left: none;
    border-bottom: var(--border-card) solid var(--c-line);
    padding: 0 var(--radius-card);
    overflow: hidden;
  }
  .creation-preview {
    flex-direction: row;
    align-items: center;
    gap: 0.75rem;
    height: 100%;
    width: 100%;
  }
  .creation-preview-shell__title,
  .creation-preview__title,
  .creation-preview__name,
  .creation-preview__empty-text,
  .creation-preview__greeting {
    display: none;
  }
  .creation-preview-shell.card {
    width: 100%;
    box-shadow: none;
    border: none;
    background: transparent;
    padding: 0;
  }
  .creation-preview__portrait-wrap {
    flex: 0 0 auto;
    height: 100%;
    min-height: 0;
  }
  .creation-preview__portrait {
    height: calc(var(--shell-preview-strip-h) - 12px);
    width: auto;
    max-height: calc(var(--shell-preview-strip-h) - 12px);
    aspect-ratio: 3 / 4;
  }
  .creation-preview__tags {
    flex: 1;
    min-width: 0;
    flex-wrap: nowrap;
    overflow-x: auto;
  }
}
@media (max-width: ${belowMedium}px) {
  .desktop-shell {
    grid-template-areas:
      "header"
      "main"
      "footer";
    grid-template-rows: var(--shell-header-h) minmax(0, 1fr) var(--shell-footer-h);
  }
  .desktop-shell__preview {
    display: none;
  }
  .chat-shell {
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(0, 1fr);
    padding: 0 16px;
  }
  .home-shell {
    padding: 0 16px;
  }
  .chat-shell__profile {
    display: none;
  }
  .chat-shell__profile--drawer-open {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 40;
    max-width: min(320px, 90vw);
    margin: 0;
    border-radius: 0;
    box-shadow: var(--state-hover-shadow);
  }
  .chat-shell__profile--drawer-open {
    left: auto;
    right: 0;
    max-width: min(360px, 92vw);
  }
}`;
}

/** Nombres de variables definidas en buildCssVarsText (para cssGuard.test.ts). */
export function definedCssVarNames(): Set<string> {
  const names = new Set<string>();
  for (const m of buildCssVarsText().matchAll(/--([a-z0-9-]+)\s*:/g)) {
    names.add(`--${m[1]}`);
  }
  return names;
}

function webTypographyAndLayoutTokens(): string {
  // ponytail: tipografía, espaciado y elevación definidos en la web; moverlos a tokens.ts de ejoiFE cuando la app los necesite
  const fontStack = 'Apis, "Noto Color Emoji", system-ui, sans-serif';
  return [
    `  --font-title1: 800 28px/34px ${fontStack};`,
    '  --ls-title1: -0.2px;',
    `  --font-title2: 700 22px/28px ${fontStack};`,
    `  --font-option: 700 17px/24px ${fontStack};`,
    `  --font-button: 700 17px/24px ${fontStack};`,
    `  --font-body: 400 16px/24px ${fontStack};`,
    `  --font-secondary: 400 15px/22px ${fontStack};`,
    `  --font-caption: 400 13px/18px ${fontStack};`,
    `  --font-label: 700 12px/16px ${fontStack};`,
    '  --ls-label: 1.2px;',
    '  --space-1: 4px;',
    '  --space-2: 8px;',
    '  --space-3: 12px;',
    '  --space-4: 16px;',
    '  --space-5: 20px;',
    '  --space-6: 24px;',
    '  --space-7: 32px;',
    '  --space-8: 48px;',
    '  --gutter: 32px;',
    '  --elev-1: 0 1px 4px color-mix(in srgb, var(--c-ink) 8%, transparent);',
    '  --elev-2: 0 12px 30px color-mix(in srgb, var(--c-ink) 8%, transparent);',
    '  --elev-3: 0 24px 60px color-mix(in srgb, var(--c-ink) 22%, transparent);',
    '  --elev-cta: 0 6px 16px color-mix(in srgb, var(--c-brand) 25%, transparent);',
    '  --elev-sel: 0 6px 18px color-mix(in srgb, var(--c-brand) 14%, transparent);',
    '  --c-on-brand: #FFFFFF;',
  ].join('\n');
}

const darkElevNone = `:root[data-theme="dark"] {
  --elev-1: none;
  --elev-2: none;
  --elev-3: none;
  --elev-cta: none;
  --elev-sel: none;
}`;

type ThemePaint = Partial<Record<keyof UxV2ColorMode, string>>;

function paintBlock(selector: string, paint: ThemePaint): string {
  const lines = Object.entries(paint)
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
    .map(([key, value]) => `  ${colorVarName(key)}: ${value};`);
  return `${selector} {\n${lines.join('\n')}\n}`;
}

// ponytail: romantic/minimal/kawaii están en packs.ts de ejoiFE, no en UxV2. Solo chrome; el resto hereda claro/oscuro. Subir a tokens.ts si la app los vuelve a mostrar en el drawer.
const PACK_PAINT: Record<'romantic' | 'minimal' | 'kawaii', { light: ThemePaint; dark: ThemePaint }> = {
  romantic: {
    light: {
      bg: '#fff8f3',
      surface: '#ffffff',
      surface2: '#fce9dc',
      ink: '#3a1c2c',
      ink2: '#7a4f63',
      brand: '#d63384',
      brandText: '#d63384',
      brandLogo: '#d63384',
      brandPressed: '#a02865',
      selBorder: '#d63384',
      selFill: '#ffd9e8',
      selInk: '#a02865',
      lav: '#c89b3c',
      lavTint: '#f4dfba',
      line: '#f3d9ca',
      lineStrong: '#e7b9a4',
    },
    dark: {
      bg: '#1a0f12',
      surface: '#1f1216',
      surface2: '#28161c',
      ink: '#f7e6ea',
      ink2: '#d8aebe',
      brand: '#ff6b9d',
      brandText: '#ffb3c8',
      brandLogo: '#ff6b9d',
      brandPressed: '#d63384',
      selBorder: '#ff6b9d',
      selFill: 'rgba(255, 107, 157, 0.22)',
      selInk: '#ffb3c8',
      lav: '#f5c266',
      lavTint: 'rgba(245, 194, 102, 0.18)',
      line: 'rgba(255, 200, 162, 0.12)',
      lineStrong: 'rgba(255, 200, 162, 0.20)',
    },
  },
  minimal: {
    light: {
      bg: '#ffffff',
      surface: '#fafafa',
      surface2: '#f6f6f6',
      ink: '#0a0a0a',
      ink2: '#5c5c5c',
      brand: '#1a1a1a',
      brandText: '#1a1a1a',
      brandLogo: '#1a1a1a',
      brandPressed: '#000000',
      selBorder: '#1a1a1a',
      selFill: '#ededed',
      selInk: '#1a1a1a',
      lav: '#666666',
      lavTint: '#dedede',
      line: '#ececec',
      lineStrong: '#d4d4d4',
    },
    dark: {
      bg: '#0a0a0a',
      surface: '#121212',
      surface2: '#181818',
      ink: '#f5f5f5',
      ink2: '#b3b3b3',
      brand: '#3a3a3a',
      brandText: '#f5f5f5',
      brandLogo: '#f5f5f5',
      brandPressed: '#1f1f1f',
      selBorder: '#f5f5f5',
      selFill: 'rgba(245, 245, 245, 0.10)',
      selInk: '#f5f5f5',
      lav: '#a3a3a3',
      lavTint: 'rgba(245, 245, 245, 0.16)',
      line: 'rgba(255, 255, 255, 0.10)',
      lineStrong: 'rgba(255, 255, 255, 0.18)',
    },
  },
  kawaii: {
    light: {
      bg: '#fff0f5',
      surface: '#ffffff',
      surface2: '#fde4ef',
      ink: '#5a3656',
      ink2: '#866b8a',
      brand: '#ff69b4',
      brandText: '#ff69b4',
      brandLogo: '#ff69b4',
      brandPressed: '#e04ea0',
      selBorder: '#ff69b4',
      selFill: '#ffd4e8',
      selInk: '#e04ea0',
      lav: '#c8a2ff',
      lavTint: '#e6d6ff',
      line: '#f9d4e6',
      lineStrong: '#f0b3d0',
    },
    dark: {
      bg: '#1a0d26',
      surface: '#1f1131',
      surface2: '#251539',
      ink: '#ffe3f1',
      ink2: '#d4b3c8',
      brand: '#ff8fc7',
      brandText: '#ffb3d9',
      brandLogo: '#ff8fc7',
      brandPressed: '#d96aaa',
      selBorder: '#ff8fc7',
      selFill: 'rgba(255, 143, 199, 0.22)',
      selInk: '#ffd4e8',
      lav: '#a87fd6',
      lavTint: 'rgba(212, 179, 255, 0.20)',
      line: 'rgba(255, 179, 217, 0.14)',
      lineStrong: 'rgba(255, 179, 217, 0.22)',
    },
  },
};

function extraThemeCss(): string {
  const packs = (Object.keys(PACK_PAINT) as (keyof typeof PACK_PAINT)[]).flatMap((id) =>
    (['light', 'dark'] as const).map((mode) =>
      paintBlock(`:root[data-theme="${mode}"][data-theme-id="${id}"]`, PACK_PAINT[id][mode]),
    ),
  );
  const web = [
    `:root[data-theme-id="aurora"] {
  --theme-aurora-bg: #1a1430;
  --theme-aurora-surface: #261c3e;
  --c-bg: var(--theme-aurora-bg);
  --c-surface: var(--theme-aurora-surface);
  --c-surface2: #312652;
  --c-ink: #f4eefe;
  --c-ink2: #cbbbe0;
  --c-line: #4a3d6b;
  --c-line-strong: #6a5a90;
  --c-brand: #c9a6ff;
  --c-brand-text: #e4d4ff;
  --c-brand-logo: #9ee7de;
  --c-brand-pressed: #a07ae6;
  --c-sel-border: #9ee7de;
  --c-sel-fill: #2a2048;
  --c-sel-ink: #e4d4ff;
  --c-lav: #7ee0d6;
  --c-lav-tint: #16383a;
  --c-lav-ink: #b6fff4;
}`,
    `:root[data-theme-id="pulse"] {
  --theme-pulse-brand: #d00954;
  --theme-pulse-bg: #fff4f8;
  --c-bg: var(--theme-pulse-bg);
  --c-surface: #ffffff;
  --c-surface2: #ffe3ee;
  --c-ink: #2b1220;
  --c-ink2: #7a4a62;
  --c-line: #f3c9d8;
  --c-line-strong: #e7a8c0;
  --c-brand: var(--theme-pulse-brand);
  --c-brand-text: var(--theme-pulse-brand);
  --c-brand-logo: var(--theme-pulse-brand);
  --c-brand-pressed: #8e0639;
  --c-sel-border: var(--theme-pulse-brand);
  --c-sel-fill: #fde8f0;
  --c-sel-ink: #8e0639;
  --c-lav: #7a6cf0;
  --c-lav-tint: #eeeaff;
  --c-lav-ink: #4336a8;
  --c-creating-ring: var(--theme-pulse-brand);
}`,
    `:root[data-theme-id="liquid"] {
  --c-bg: #d5e3f4;
  --c-surface: rgba(255, 255, 255, 0.38);
  --c-surface2: rgba(255, 255, 255, 0.24);
  --c-ink: #172033;
  --c-ink2: #3d516b;
  --c-line: rgba(255, 255, 255, 0.55);
  --c-line-strong: rgba(255, 255, 255, 0.78);
  --c-brand: #3d5fd4;
  --c-brand-text: #243e86;
  --c-brand-logo: #3d5fd4;
  --c-brand-pressed: #2c49aa;
  --c-sel-border: rgba(255, 255, 255, 0.9);
  --c-sel-fill: rgba(255, 255, 255, 0.45);
  --c-sel-ink: #172033;
  --c-lav: #6aa4ff;
  --c-lav-tint: rgba(255, 255, 255, 0.32);
  --c-lav-ink: #1d3f86;
}`,
  ];
  return [...packs, ...web].join('\n\n');
}

export function buildCssVarsText(): string {
  const rootScalars = [
    scalarBlock('radius', UxV2.radius, 'px'),
    scalarBlock('size', UxV2.size, 'px'),
    scalarBlock('border', UxV2.border, 'px'),
    scalarBlock('motion', UxV2.motion, 'ms'),
    webTypographyAndLayoutTokens(),
    `  --bp-reference: ${BREAKPOINTS.REFERENCE}px;`,
    `  --bp-large: ${BREAKPOINTS.LARGE}px;`,
    `  --bp-medium: ${BREAKPOINTS.MEDIUM}px;`,
    '  --shell-header-h: 72px;',
    '  --shell-footer-h: 88px;',
    '  --shell-preview-w: 360px;',
    '  --shell-preview-strip-h: 72px;',
    '  --chat-menu-w: 320px;',
    '  --chat-read-min: 680px;',
    '  --chat-read-max: 720px;',
    '  --chat-profile-w: 320px;',
    `  --motion-theme: ${THEME_TRANSITION_MS}ms;`,
    '  --state-hover-bg: color-mix(in srgb, var(--c-ink) 6%, var(--c-surface));',
    '  --state-hover-border: var(--c-line-strong);',
    '  --state-hover-shadow: 0 2px 8px color-mix(in srgb, var(--c-ink) 10%, transparent);',
    '  --bg-brand-gradient: linear-gradient(135deg, var(--c-sel-fill), var(--c-lav-tint));',
    '  --presence-online: var(--c-ok);',
    '  --presence-typing: var(--c-lav-ink);',
    '  --presence-listening: var(--c-brand);',
    '  --presence-thinking: var(--c-lav);',
    '  --presence-recording: var(--c-warn);',
    '  --presence-away: var(--c-ink2);',
    '  --presence-offline: var(--c-err);',
    '  --presence-reconnecting: var(--c-warn);',
  ].join('\n');

  return [
    `:root {\n${rootScalars}\n}`,
    colorBlock('light', UxV2.light),
    colorBlock('dark', UxV2.dark),
    darkElevNone,
    extraThemeCss(),
    layoutMediaQueries(),
  ].join('\n\n');
}

export function applyCssVars(): void {
  let el = document.getElementById(STYLE_ID);
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = buildCssVarsText();
  initTheme();
}
