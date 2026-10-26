// AUTO-SINCRONIZADO desde ejoiFE 9234854dc9f9992b39b7f61dfb0e02b768be467d@9234854dc9f9992b39b7f61dfb0e02b768be467d:src/shared/theme/tokens.ts. No editar: npm run sync:app
/**
 * UX v2 design tokens (anexo manual + provisionales PO §4.1).
 * Inmutable respecto a theme packs; las vistas v2 leen `UxV2`, no `Colors`.
 */

export type UxV2ColorMode = {
  bg: string;
  surface: string;
  surface2: string;
  ink: string;
  ink2: string;
  line: string;
  lineStrong: string;
  /** Borde de casilla, radio, interruptor apagado y campo. WCAG 1.4.11. */
  controlBorder: string;
  brand: string;
  brandText: string;
  brandLogo: string;
  brandPressed: string;
  selBorder: string;
  selFill: string;
  selInk: string;
  lav: string;
  lavTint: string;
  lavInk: string;
  onLavTint: string;
  ok: string;
  warn: string;
  err: string;
  disBg: string;
  disInk: string;
  focus: string;
  tabInactive: string;
  errBannerBg: string;
  errBannerBorder: string;
  errBannerInk: string;
  warnBannerBg: string;
  warnBannerInk: string;
  skeletonBase: string;
  skeletonHighlight: string;
  scrim: string;
  iconContainerTint: string;
  iconTintBrand: string;
  iconTintLav: string;
  iconTintOk: string;
  creatingRing: string;
};

const light: UxV2ColorMode = {
  bg: '#FBF7F4',
  surface: '#FFFFFF',
  surface2: '#F4EEEA',
  ink: '#2B2A29',
  ink2: '#5C5957',
  line: '#E4DCD6',
  lineStrong: '#CFC4BC',
  controlBorder: '#8A817B',
  brand: '#D00954',
  brandText: '#D00954',
  brandLogo: '#F20A64',
  brandPressed: '#A8073F',
  selBorder: '#D00954',
  selFill: '#FDE8F0',
  selInk: '#8E0639',
  lav: '#BAB0ED',
  lavTint: '#EFECFC',
  lavInk: '#4B3FA0',
  onLavTint: '#2E2670',
  ok: '#1E7A4C',
  warn: '#9A6700',
  err: '#B42318',
  disBg: '#ECE6E2',
  disInk: '#6E6965',
  focus: '#4B3FA0',
  tabInactive: '#4A4745',
  errBannerBg: '#FDECEA',
  errBannerBorder: '#F4C7C2',
  errBannerInk: '#7A1A11',
  warnBannerBg: '#FFF4DC',
  warnBannerInk: '#5C3D00',
  skeletonBase: '#EDE6E1',
  skeletonHighlight: '#F3EEEA',
  scrim: 'rgba(43, 42, 41, 0.45)',
  iconContainerTint: 'rgba(208, 9, 84, 0.12)',
  iconTintBrand: 'rgba(208, 9, 84, 0.12)',
  iconTintLav: 'rgba(75, 63, 160, 0.12)',
  iconTintOk: 'rgba(30, 122, 76, 0.12)',
  creatingRing: '#D00954',
};

/** Oscuro: anexo manual; provisionales §4.1 pendientes de validación Diseño. */
const dark: UxV2ColorMode = {
  bg: '#1B1918',
  surface: '#252220',
  surface2: '#2F2B29',
  ink: '#F3EEEA',
  ink2: '#B9B1AB',
  line: '#3A3532',
  lineStrong: '#554E4A',
  controlBorder: '#857C77',
  brand: '#D00954',
  brandText: '#FF7AA8',
  brandLogo: '#F20A64',
  brandPressed: '#A8073F',
  selBorder: '#FF7AA8',
  selFill: '#3A1F2A',
  selInk: '#FFB3CC',
  lav: '#BAB0ED',
  lavTint: '#2C2840',
  lavInk: '#C9C1F5',
  onLavTint: '#C9C1F5',
  ok: '#4CC38A',
  warn: '#E6B450',
  err: '#FF8A80',
  disBg: '#2F2B29',
  disInk: '#8F8782',
  focus: '#C9C1F5',
  tabInactive: '#B9B1AB',
  errBannerBg: '#3A1F1C',
  errBannerBorder: '#5C2A24',
  errBannerInk: '#FF8A80',
  warnBannerBg: '#3A3020',
  warnBannerInk: '#E6B450',
  skeletonBase: '#2F2B29',
  skeletonHighlight: '#3A3532',
  scrim: 'rgba(0, 0, 0, 0.55)',
  iconContainerTint: 'rgba(255, 122, 168, 0.15)',
  iconTintBrand: 'rgba(255, 122, 168, 0.12)',
  iconTintLav: 'rgba(201, 193, 245, 0.12)',
  iconTintOk: 'rgba(76, 195, 138, 0.12)',
  creatingRing: '#FF7AA8',
};

export const UxV2 = {
  light,
  dark,
  radius: {
    card: 16,
    control: 12,
    checkbox: 6,
    modal: 20,
    pill: 999,
  },
  size: {
    buttonL: 56,
    buttonM: 48,
    buttonS: 40,
    chip: 44,
    touchMin: 44,
    progress: 6,
  },
  border: {
    card: 1,
    control: 1.5,
    selected: 2,
    focusRing: 3,
  },
  motion: {
    press: 100,
    select: 160,
    step: 240,
    progress: 300,
    toast: 4000,
    reduced: 120,
  },
  /** Manual UX v2 l.936–958: escala de avatar en pt. */
  avatar: [24, 32, 40, 44, 48, 96, 132, 168] as const,
} as const;

export type AvatarSize = (typeof UxV2.avatar)[number];

export type UxV2Tokens = typeof UxV2;

export const uxV2Colors = (mode: 'light' | 'dark'): UxV2ColorMode =>
  mode === 'dark' ? UxV2.dark : UxV2.light;
