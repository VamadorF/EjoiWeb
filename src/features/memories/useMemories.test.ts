import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { SharedMomentResponse } from '@/features/memories/types';

import { useMemories } from './useMemories';

const moment: SharedMomentResponse = {
  id: 'm1',
  userId: 'u1',
  companionId: 'c1',
  conversationId: null,
  type: 'FIRST_MEETING',
  title: 'Hola',
  description: 'Primer dia',
  happenedAt: new Date().toISOString(),
  importance: 5,
  sourceMessageId: null,
  createdAt: new Date().toISOString(),
};

describe('useMemories', () => {
  it('expone recuerdos y favorito destacado', () => {
    const { result } = renderHook(() => useMemories([moment]));
    expect(result.current.memories).toHaveLength(1);
    expect(result.current.featuredMemory?.id).toBe('m1');
  });
});
