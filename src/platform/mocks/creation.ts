/** Tiempos de creación simulada (C12) alineados con PAR-WEB-08 (mín. 4 s en UI y mock). */
export const CREATION_READY_MS = 4000;
export const CREATION_MIN_DISPLAY_MS = 4000;
export const CREATION_STEP_GREETING_MS = 1000;
export const CREATION_STEP_PORTRAIT_MS = 2000;

export function creationElapsedMs(
  creatingSince: number,
  state: 'none' | 'creating' | 'ready' | 'error',
): number {
  if (state !== 'creating' || creatingSince <= 0) return 0;
  return Date.now() - creatingSince;
}

export function creationStepsForElapsed(elapsedMs: number) {
  return {
    personality: true,
    interests: true,
    greeting: elapsedMs >= CREATION_STEP_GREETING_MS,
    portrait: elapsedMs >= CREATION_STEP_PORTRAIT_MS,
  };
}

export function isCreationBackendReady(elapsedMs: number): boolean {
  return elapsedMs >= CREATION_READY_MS;
}
