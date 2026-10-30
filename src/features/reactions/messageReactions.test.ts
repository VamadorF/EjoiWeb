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
});
