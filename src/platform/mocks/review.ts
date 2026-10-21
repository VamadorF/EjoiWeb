/** Retratos distintos para e2e / mock API (contador por sesión de prueba). */
export const MOCK_REVIEW_PORTRAIT_PATHS = [
  '/portraits/realista-femenino.webp',
  '/portraits/realista-masculino.webp',
  '/portraits/ilustrado-femenino.webp',
  '/portraits/ilustrado-masculino.webp',
  '/portraits/realista-femenino.webp',
] as const;

let generationIndex = 0;

export function resetReviewMockGenerations(): void {
  generationIndex = 0;
}

export function nextMockReviewPortraitPath(): string {
  const path = MOCK_REVIEW_PORTRAIT_PATHS[generationIndex % MOCK_REVIEW_PORTRAIT_PATHS.length]!;
  generationIndex += 1;
  return path;
}

export function mockReviewPortraitUrl(origin?: string): string {
  const path = nextMockReviewPortraitPath();
  if (origin) return new URL(path, origin).href;
  return path;
}
