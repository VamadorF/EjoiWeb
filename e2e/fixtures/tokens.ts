/** JWT mínimo (sin firma) para pruebas e2e con userId en payload. */
export function fakeAccessToken(userId: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ userId, sub: userId })).toString('base64url');
  return `${header}.${payload}.e2e`;
}

export const E2E_USER_ID = 'e2e-scrum-116';
export const E2E_TEST_SESSION_SECRET = 'playwright-local-secret';
