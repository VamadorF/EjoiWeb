import type { Gender } from '@/features/onboarding/types';

export type ReadyTitleKey =
  | 'companion.ready.title_feminine'
  | 'companion.ready.title_masculine'
  | 'companion.ready.title_neutral'
  | 'companion.ready.title_default';

export function readyTitleI18nKey(gender: Gender | '' | undefined): ReadyTitleKey {
  switch (gender) {
    case 'femenino':
      return 'companion.ready.title_feminine';
    case 'masculino':
      return 'companion.ready.title_masculine';
    case 'neutro':
      return 'companion.ready.title_neutral';
    default:
      return 'companion.ready.title_default';
  }
}
