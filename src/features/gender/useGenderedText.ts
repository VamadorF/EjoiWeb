import { useMemo } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import { formatEthnicityByGender } from '@/shared/utils/ethnicityLabel';
import {
  applyGender,
  createGenderedTextHelper,
  type GenderKey,
} from '@/shared/utils/genderedText';

const NEUTRAL_COMPANION_FALLBACK = 'compañía';

export type GenderedTextApi = ReturnType<typeof createGenderedTextWith>;

export function createGenderedTextWith(
  gender: GenderKey,
  t: TFunction,
  tWeb?: TFunction,
): {
  t: (text: string) => string;
  tg: (key: string, params?: Record<string, unknown>) => string;
  companion: () => string;
  trait: (value: string) => string;
  ethnicity: (value?: string) => string | undefined;
  article: (type?: 'el' | 'un') => string;
  suffix: () => string;
  gender: GenderKey;
  hasGender: boolean;
} {
  const helper = createGenderedTextHelper(gender);
  const tw = tWeb ?? t;

  return {
    ...helper,
    companion: () =>
      gender
        ? helper.companion()
        : (tw('wizard.neutral_companion', {
            ns: 'web',
            defaultValue: NEUTRAL_COMPANION_FALLBACK,
          }) as string),
    tg: (key: string, params?: Record<string, unknown>) => {
      const translated = t(key, params) as string;
      return applyGender(translated, gender);
    },
    ethnicity: (value?: string) => formatEthnicityByGender(value, gender) ?? value,
  };
}

export function useGenderedTextWith(gender: GenderKey) {
  const { t } = useTranslation();
  const { t: tWeb } = useTranslation('web');
  return useMemo(() => createGenderedTextWith(gender, t, tWeb), [gender, t, tWeb]);
}
