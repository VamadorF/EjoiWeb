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
  const { LARGE, MEDIUM } = BREAKPOINTS;
  return `
@media (max-width: ${LARGE}px) {
  .desktop-shell {
    grid-template-columns: minmax(0, 1fr) min(420px, 36vw);
  }
}
@media (max-width: ${MEDIUM}px) {
  .desktop-shell {
    grid-template-columns: 1fr;
    grid-template-areas:
      "header"
      "main"
      "footer";
  }
  .desktop-shell__preview {
    display: none;
  }
  .chat-shell {
    grid-template-columns: 1fr;
    padding: 0 16px;
  }
  .chat-shell__menu,
  .chat-shell__profile {
    display: none;
  }
}`;
}

export function buildCssVarsText(): string {
  const rootScalars = [
    scalarBlock('radius', UxV2.radius, 'px'),
    scalarBlock('size', UxV2.size, 'px'),
    scalarBlock('border', UxV2.border, 'px'),
    scalarBlock('motion', UxV2.motion, 'ms'),
    `  --bp-reference: ${BREAKPOINTS.REFERENCE}px;`,
    `  --bp-large: ${BREAKPOINTS.LARGE}px;`,
    `  --bp-medium: ${BREAKPOINTS.MEDIUM}px;`,
    '  --shell-header-h: 72px;',
    '  --shell-footer-h: 88px;',
    '  --shell-preview-w: 420px;',
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
