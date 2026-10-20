import { UxV2, type UxV2ColorMode } from '@/shared/theme/tokens';

import { BREAKPOINTS } from './breakpoints';
import { initTheme } from './theme';

const STYLE_ID = 'ejoi-css-vars';

function toKebab(key: string): string {
  return key.replace(/([A-Z])/g, '-$1').toLowerCase();
}

export function colorVarName(key: string): string {
  return `--c-${toKebab(key)}`;
}

function colorBlock(mode: 'light' | 'dark', colors: UxV2ColorMode): string {
  const lines = Object.entries(colors).map(
    ([key, value]) => `  ${colorVarName(key)}: ${value};`,
  );
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
    border-bottom: calc(var(--border-card) * 1px) solid var(--c-line);
    padding: 0 calc(var(--radius-card) * 1px);
    overflow: hidden;
  }
  .creation-preview {
    flex-direction: row;
    align-items: center;
    gap: 0.75rem;
    height: 100%;
    width: 100%;
  }
  .creation-preview__title,
  .creation-preview__name,
  .creation-preview__greeting {
    display: none;
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
  .chat-shell__menu,
  .chat-shell__profile {
    display: none;
  }
  .chat-shell__menu--drawer-open,
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
  const fontStack = 'Apis, system-ui, sans-serif';
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
    '  --shell-preview-w: 420px;',
    '  --shell-preview-strip-h: 72px;',
    '  --chat-menu-w: 264px;',
    '  --chat-read-min: 680px;',
    '  --chat-read-max: 720px;',
    '  --chat-profile-w: 320px;',
    '  --motion-theme: 150ms;',
    '  --state-hover-bg: color-mix(in srgb, var(--c-ink) 6%, var(--c-surface));',
    '  --state-hover-border: var(--c-line-strong);',
    '  --state-hover-shadow: 0 2px 8px color-mix(in srgb, var(--c-ink) 10%, transparent);',
  ].join('\n');

  return [
    `:root {\n${rootScalars}\n}`,
    colorBlock('light', UxV2.light),
    colorBlock('dark', UxV2.dark),
    darkElevNone,
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
