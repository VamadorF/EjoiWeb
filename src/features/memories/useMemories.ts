import { useCallback, useMemo, useState } from 'react';

import { fromSharedMomentsToMemories } from '@/features/memories/adapters/memories.adapter';
import type { Memory, SharedMomentResponse } from '@/features/memories/types';

export function useMemories(sharedMoments: SharedMomentResponse[] | undefined) {
  const [favoriteToggles, setFavoriteToggles] = useState<Record<string, boolean>>({});

  const baseMemories: Memory[] = useMemo(
    () => (sharedMoments?.length ? fromSharedMomentsToMemories(sharedMoments) : []),
    [sharedMoments],
  );

  const memories: Memory[] = useMemo(
    () =>
      baseMemories.map((m) => {
        const override = favoriteToggles[m.id];
        if (override === undefined) return m;
        return { ...m, isFavorite: override };
      }),
    [baseMemories, favoriteToggles],
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      setFavoriteToggles((prev) => {
        const current = prev[id];
        const base = baseMemories.find((m) => m.id === id);
        const baseFav = base?.isFavorite ?? false;

        if (current === undefined) {
          return { ...prev, [id]: !baseFav };
        }
        if (current === baseFav) {
          const rest = { ...prev };
          delete rest[id];
          return rest;
        }
        return { ...prev, [id]: !current };
      });
    },
    [baseMemories],
  );

  const groupedMemories = useMemo(
    () => ({
      week: memories.filter((m) => m.category === 'week'),
      month: memories.filter((m) => m.category === 'month'),
      older: memories.filter((m) => m.category === 'older'),
    }),
    [memories],
  );

  const featuredMemory = useMemo(() => {
    if (!memories.length) return null;
    const fav = memories.find((m) => m.isFavorite);
    if (fav) return fav;
    return memories.reduce((best, m) => (m.importance > best.importance ? m : best), memories[0]!);
  }, [memories]);

  return {
    memories,
    groupedMemories,
    featuredMemory,
    toggleFavorite,
  };
}
