import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router';

import type { Gender } from '@/features/onboarding/types';
import { formatGenderedTrait } from '@/shared/utils/genderedText';

import { useCreationStatus } from '~/features/chat/useCreationStatus';
import { fetchCompanionProfile, type CompanionProfile } from '~/features/chat/useProfile';
import { getOnboardingDraftRecord } from '~/features/creation/onboardingDraft.api';
import { readyTitleI18nKey } from '~/features/creation/readyTitle';

import './ReadyPage.css';

const MAX_INTEREST_CHIPS = 5;

export default function ReadyPage() {
  const { t } = useTranslation();
  const { t: tw } = useTranslation('web');
  const navigate = useNavigate();
  const { state, profile: creationProfile } = useCreationStatus(0);
  const [profile, setProfile] = useState<CompanionProfile | null>(null);
  const [gender, setGender] = useState<Gender | ''>('');

  useEffect(() => {
    if (state !== 'ready') return;
    void fetchCompanionProfile()
      .then(setProfile)
      .catch(() => undefined);
  }, [state]);

  useEffect(() => {
    let active = true;
    void getOnboardingDraftRecord()
      .then((draft) => {
        if (!active || !draft?.data?.gender) return;
        setGender(draft.data.gender as Gender);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const mergedProfile = profile ?? creationProfile;
  const resolvedGender: Gender | '' = (profile?.gender as Gender | undefined) ?? gender;
  const name = mergedProfile?.name?.trim() || tw('create.no_name');
  const persona = (profile?.persona ?? '').trim();
  const interests = profile?.interests ?? [];
  const boundaries = profile?.boundaries ?? [];

  const visibleInterests = interests.slice(0, MAX_INTEREST_CHIPS);
  const extraInterests = Math.max(0, interests.length - MAX_INTEREST_CHIPS);

  const title = t(readyTitleI18nKey(resolvedGender), { name });

  const subtitle = useMemo(
    () => (persona ? formatGenderedTrait(persona, resolvedGender || 'femenino') : ''),
    [persona, resolvedGender],
  );

  if (state === 'creating' || state === 'error') {
    return <Navigate to="/crear/creando" replace />;
  }

  if (state !== 'ready') {
    return <div className="ready-page" data-testid="create-ready-loading" aria-busy="true" />;
  }

  const avatarUrl = mergedProfile?.avatarUrl ?? undefined;

  return (
    <div className="ready-page" data-testid="create-ready-page">
      <div className="ready-page__column">
        <div className="ready-page__hero ready-page__hero--1">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="ready-page__avatar" />
          ) : (
            <span className="ready-page__avatar ready-page__avatar--empty" aria-hidden="true" />
          )}
        </div>

        <h1 className="ready-page__title ready-page__hero--2" data-testid="create-ready-title">
          {title}
        </h1>

        {subtitle ? <p className="ready-page__subtitle ready-page__hero--3">{subtitle}</p> : null}

        <section className="ready-page__card ready-page__hero--4" aria-labelledby="ready-interests-heading">
          <h2 id="ready-interests-heading" className="ready-page__card-title">
            {tw('chat.profile_interests')}
          </h2>
          {visibleInterests.length ? (
            <ul className="ready-page__chips">
              {visibleInterests.map((interest) => (
                <li key={interest}>
                  <span className="pill">{interest}</span>
                </li>
              ))}
              {extraInterests > 0 ? (
                <li>
                  <span className="pill">+{extraInterests}</span>
                </li>
              ) : null}
            </ul>
          ) : (
            <p className="ready-page__empty">{tw('ready.no_interests')}</p>
          )}
        </section>

        <section className="ready-page__card ready-page__hero--5" aria-labelledby="ready-boundaries-heading">
          <h2 id="ready-boundaries-heading" className="ready-page__card-title">
            {tw('chat.profile_boundaries')}
          </h2>
          {boundaries.length ? (
            <ul className="ready-page__boundaries">
              {boundaries.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="ready-page__empty">{tw('ready.no_boundaries')}</p>
          )}
        </section>

        <button
          type="button"
          className="btn btn--primary btn--l ready-page__cta ready-page__hero--6"
          data-testid="create-ready-cta"
          onClick={() => navigate('/chat', { replace: true })}
        >
          {t('companion.ready.start_chat')}
        </button>
      </div>
    </div>
  );
}
