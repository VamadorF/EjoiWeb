import { describe, expect, it } from 'vitest';

import { fromWebAuthResponse } from './authWeb.adapter';
import { googleSubFromIdToken } from './decodeJwtPayload';

describe('fromWebAuthResponse', () => {
  it('acepta access token web sin refresh_token', () => {
    const result = fromWebAuthResponse({
      access_token: 'at-1',
      expires_in: 900,
      user: { userId: 'u1', email: 'a@ejoi.cl', name: 'Ana' },
    });
    expect(result.accessToken).toBe('at-1');
    expect(result.user.id).toBe('u1');
    expect(result.refreshToken).toBeUndefined();
  });

  it('devuelve el refresh_token cuando el backend lo manda en el cuerpo', () => {
    const result = fromWebAuthResponse({
      access_token: 'at-1',
      refresh_token: 'rt-1',
      user: { userId: 'u1', email: 'a@ejoi.cl', name: 'Ana' },
    });
    expect(result.refreshToken).toBe('rt-1');
  });
});

describe('googleSubFromIdToken', () => {
  it('extrae sub del payload', () => {
    const header = btoa(JSON.stringify({ alg: 'none' }));
    const payload = btoa(JSON.stringify({ sub: 'google-sub-99' }));
    const token = `${header}.${payload}.sig`;
    expect(googleSubFromIdToken(token)).toBe('google-sub-99');
  });
});
