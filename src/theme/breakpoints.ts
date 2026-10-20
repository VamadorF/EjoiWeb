/** Única fuente de breakpoints (CSS inyectado desde cssVars.ts). */
export const BREAKPOINTS = {
  REFERENCE: 1440,
  LARGE: 1280,
  MEDIUM: 1024,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;
