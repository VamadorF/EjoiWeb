import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { SharedMomentResponse } from '@/features/memories/types';

import { useProfile } from '~/features/chat/useProfile';
import { kvGetItem, kvSetItem } from '~/platform/keyValue';

import { useGenderedTextWith } from '~/features/gender/useGenderedText';

import { useFirstMeetingAnniversary } from './useFirstMeetingAnniversary';

import './AnniversaryBanner.css';

function dismissKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `anniversary_dismissed_${y}-${m}-${d}`;
}

type AnniversaryBannerProps = {
  sharedMoments?: SharedMomentResponse[];
};

export function AnniversaryBanner({ sharedMoments }: AnniversaryBannerProps) {
  const { t } = useTranslation();
  const { data: profile } = useProfile(true);
  const gendered = useGenderedTextWith((profile?.gender ?? '') as '' | 'femenino' | 'masculino' | 'neutro');
  const { isAnniversary, yearsTogether } = useFirstMeetingAnniversary(sharedMoments);
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isAnniversary) {
      setDismissed(null);
      return;
    }
    const key = dismissKey(new Date());
    void kvGetItem(key).then((value) => setDismissed(value === '1'));
  }, [isAnniversary]);

  if (!isAnniversary || dismissed === null || dismissed) {
    return null;
  }

  const titleKey = yearsTogether === 1 ? 'home.anniversary.title_one' : 'home.anniversary.title_other';
  const subtitle = gendered.tg('home.anniversary.subtitle');

  const handleDismiss = () => {
    setDismissed(true);
    void kvSetItem(dismissKey(new Date()), '1');
  };

  return (
    <div className="anniversary-banner" data-testid="home-anniversary-banner">
      <div className="anniversary-banner__card">
        <div className="anniversary-banner__copy">
          <p className="anniversary-banner__title">{t(titleKey, { count: yearsTogether })}</p>
          <p className="anniversary-banner__subtitle">{subtitle}</p>
        </div>
        <button
          type="button"
          className="anniversary-banner__close"
          aria-label={t('home.anniversary.close')}
          onClick={handleDismiss}
        >
          ×
        </button>
      </div>
    </div>
  );
}
