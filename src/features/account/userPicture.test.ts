import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { User } from '@/features/auth/types';

import * as session from '~/platform/session';

import { persistPictureCandidates } from './userPicture';

const user = { id: 'u1', email: 'a@b.c', name: 'Ana', picture: 'old' };

describe('persistPictureCandidates', () => {
  beforeEach(() => {
    session.clearSession();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('escribe picture en el usuario ya guardado y conserva el resto', () => {
    session.setUserDataJson(JSON.stringify(user));
    expect(persistPictureCandidates(['data:new'], session.getUserDataJson(), null)).toBe('saved');
    const stored = JSON.parse(session.getUserDataJson()!) as User;
    expect(stored.picture).toBe('data:new');
    expect(stored.name).toBe('Ana');
    expect(stored.email).toBe('a@b.c');
  });

  it('si el primero no cabe guarda un recorte menor; si ninguno cabe deja la foto', () => {
    session.setUserDataJson(JSON.stringify(user));
    const real = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (String(value).includes('HUGE')) throw new DOMException('quota', 'QuotaExceededError');
      return real.call(this, key, value);
    });

    expect(persistPictureCandidates(['HUGE', 'small'], session.getUserDataJson(), null)).toBe('shrunk');
    expect(JSON.parse(session.getUserDataJson()!).picture).toBe('small');

    session.setUserDataJson(JSON.stringify(user));
    expect(persistPictureCandidates(['HUGE', 'HUGE-2'], session.getUserDataJson(), null)).toBe('full');
    expect(JSON.parse(localStorage.getItem('ejoi_user_data')!).picture).toBe('old');
  });

  it('un candidato vacío no borra la foto actual', () => {
    session.setUserDataJson(JSON.stringify(user));
    expect(persistPictureCandidates([''], session.getUserDataJson(), null)).toBe('full');
    expect(JSON.parse(session.getUserDataJson()!).picture).toBe('old');
  });
});
