import { useMemo } from 'react';

import type { SharedMomentResponse } from '@/features/memories/types';

export type FirstMeetingAnniversary = {
  isAnniversary: boolean;
  yearsTogether: number;
  firstMeetingDate: Date | null;
};

export function computeFirstMeetingAnniversary(
  sharedMoments: SharedMomentResponse[] | undefined,
): FirstMeetingAnniversary {
  const fm = sharedMoments?.find((m) => m.type === 'FIRST_MEETING');
  if (!fm) {
    return { isAnniversary: false, yearsTogether: 0, firstMeetingDate: null };
  }

  const start = new Date(fm.happenedAt);
  if (Number.isNaN(start.getTime())) {
    return { isAnniversary: false, yearsTogether: 0, firstMeetingDate: null };
  }

  const now = new Date();
  const sameDayAndMonth =
    start.getDate() === now.getDate() && start.getMonth() === now.getMonth();

  let yearsTogether = now.getFullYear() - start.getFullYear();
  if (
    now.getMonth() < start.getMonth() ||
    (now.getMonth() === start.getMonth() && now.getDate() < start.getDate())
  ) {
    yearsTogether -= 1;
  }

  return {
    isAnniversary: sameDayAndMonth && yearsTogether >= 1,
    yearsTogether: Math.max(0, yearsTogether),
    firstMeetingDate: start,
  };
}

export function useFirstMeetingAnniversary(sharedMoments: SharedMomentResponse[] | undefined) {
  return useMemo(() => computeFirstMeetingAnniversary(sharedMoments), [sharedMoments]);
}
