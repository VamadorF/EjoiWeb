import { describe, expect, it, beforeEach } from 'vitest';

import {
  addAvatarVariant,
  canGenerateMoreAvatars,
  clearAvatarSession,
  prepareAvatarSession,
  remainingAvatarGenerations,
  selectAvatarVariant,
} from './avatarSession';

describe('avatarSession', () => {
  beforeEach(() => {
    clearAvatarSession();
  });

  it('limita a 5 variantes por sesión', () => {
    for (let i = 0; i < 5; i += 1) {
      addAvatarVariant({ url: `https://example.com/${i}.webp` });
    }
    expect(canGenerateMoreAvatars()).toBe(false);
    expect(remainingAvatarGenerations()).toBe(0);
  });

  it('reinicia variantes cuando cambia el prompt', () => {
    prepareAvatarSession('a');
    addAvatarVariant({ url: 'https://example.com/1.webp' });
    expect(prepareAvatarSession('b')).toBe('profile_changed');
    expect(remainingAvatarGenerations()).toBe(5);
  });

  it('permite elegir variante', () => {
    prepareAvatarSession('k');
    const first = addAvatarVariant({ url: 'https://example.com/a.webp' });
    const second = addAvatarVariant({ url: 'https://example.com/b.webp' });
    selectAvatarVariant(first.id);
    expect(second.id).not.toBe(first.id);
    selectAvatarVariant(first.id);
    expect(prepareAvatarSession('k')).toBe('resume');
  });
});
