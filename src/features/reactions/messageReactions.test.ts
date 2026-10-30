import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as kv from '~/platform/keyValue';

import {
  getMessageReaction,
  resetMessageReactionsCacheForTests,
  setMessageReaction,
} from './messageReactions';

describe('messageReactions', () => {
  beforeEach(() => {
    resetMessageReactionsCacheForTests();
    vi.spyOn(kv, 'kvGetJSON').mockResolvedValue({});
    vi.spyOn(kv, 'kvSetJSON').mockResolvedValue(undefined);
  });

  it('persiste reacción por mensaje y companion', async () => {
    await setMessageReaction('c1', 'm1', '❤️');
    expect(kv.kvSetJSON).toHaveBeenCalled();
    vi.mocked(kv.kvGetJSON).mockResolvedValue({ c1: { m1: '❤️' } });
    resetMessageReactionsCacheForTests();
    await expect(getMessageReaction('c1', 'm1')).resolves.toBe('❤️');
  });

  it('reemplaza la reacción del mismo mensaje', async () => {
    await setMessageReaction('c1', 'm1', '❤️');
    await setMessageReaction('c1', 'm1', '😂');
    await expect(getMessageReaction('c1', 'm1')).resolves.toBe('😂');
    const saved = vi.mocked(kv.kvSetJSON).mock.calls.at(-1)?.[1] as { c1: Record<string, string> };
    expect(saved.c1).toEqual({ m1: '😂' });
  });
});
