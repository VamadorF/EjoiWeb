import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

import type { OnboardingData } from '@/features/onboarding/types';

import { ENABLE_AGE, ENABLE_ETHNICITY } from '~/platform/env';

import type { CompanionProfile } from './useProfile';
import type { SubscriptionMe } from './useQuota';

import './ProfilePanel.css';

const GENDER_LABELS: Record<string, string> = {
  femenino: 'Femenino',
  masculino: 'Masculino',
  neutro: 'Neutro',
};

const STYLE_LABELS: Record<string, string> = {
  realista: 'Realista',
  anime: 'Ilustrado',
};

const INTENSITY_KEYS: Record<string, 'create.presence_soft' | 'create.presence_balanced' | 'create.presence_intense'> =
  {
    soft: 'create.presence_soft',
    balanced: 'create.presence_balanced',
    intense: 'create.presence_intense',
  };

export type ProfilePanelDraft = Pick<
  OnboardingData,
  'companionName' | 'persona' | 'intensity' | 'interests' | 'boundaries' | 'visualStyle' | 'gender' | 'ethnicity' | 'age'
>;

export type ProfilePanelProps = {
  profile?: CompanionProfile | null;
  draft?: ProfilePanelDraft | null;
  subscription?: SubscriptionMe | null;
  quotaLoading?: boolean;
  profileLoading?: boolean;
  profileError?: boolean;
  onRetryProfile?: () => void;
  portraitUrl?: string | null;
  portraitBlur?: boolean;
  portraitPendingLabel?: string | null;
  onRetryPortrait?: () => void;
  showOnline?: boolean;
};

function mergeProfileView(
  profile: CompanionProfile | null | undefined,
  draft: ProfilePanelDraft | null | undefined,
): {
  name: string;
  persona?: string;
  intensity?: string;
  interests: string[];
  boundaries: string[];
  visualStyle?: string;
  gender?: string;
  ethnicity?: string;
  age?: number;
} {
  return {
    name: profile?.name?.trim() || draft?.companionName?.trim() || 'tu eJoi',
    persona: profile?.persona ?? draft?.persona,
    intensity: profile?.intensity ?? draft?.intensity,
    interests: profile?.interests?.length ? profile.interests : (draft?.interests ?? []),
    boundaries: profile?.boundaries?.length ? profile.boundaries : (draft?.boundaries ?? []),
    visualStyle: profile?.visualStyle ?? draft?.visualStyle,
    gender: profile?.gender ?? draft?.gender,
    ethnicity: profile?.ethnicity?.trim() || draft?.ethnicity?.trim(),
    age: profile?.age ?? draft?.age,
  };
}

export function ProfilePanel({
  profile,
  draft,
  subscription,
  quotaLoading,
  profileLoading,
  profileError,
  onRetryProfile,
  portraitUrl,
  portraitBlur,
  portraitPendingLabel,
  onRetryPortrait,
  showOnline,
}: ProfilePanelProps) {
  const { t } = useTranslation('web');
  const view = mergeProfileView(profile, draft);
  const intensityKey = view.intensity ? INTENSITY_KEYS[view.intensity] : undefined;
  const appearanceParts: string[] = [];
  if (view.visualStyle) {
    appearanceParts.push(STYLE_LABELS[view.visualStyle] ?? view.visualStyle);
  }
  if (view.gender) {
    appearanceParts.push(GENDER_LABELS[view.gender] ?? view.gender);
  }
  if (ENABLE_AGE && typeof view.age === 'number') {
    appearanceParts.push(t('chat.profile_age', { count: view.age }));
  }
  if (ENABLE_ETHNICITY && view.ethnicity) {
    appearanceParts.push(view.ethnicity);
  }

  const quotaExhausted =
    subscription != null &&
    (subscription.isFreeTierExhausted || subscription.messagesRemaining <= 0);

  return (
    <div className="chat-profile-panel" data-testid="chat-profile-card">
      {profileLoading ? (
        <div className="chat-profile-panel__skeleton" data-testid="chat-profile-loading" aria-busy="true">
          <div className="chat-profile-panel__skeleton-block" />
          <div className="chat-profile-panel__skeleton-line" />
          <div className="chat-profile-panel__skeleton-line chat-profile-panel__skeleton-line--short" />
        </div>
      ) : null}

      {profileError ? (
        <div className="chat-profile-panel__error" role="alert" data-testid="chat-profile-error">
          <p>{t('chat.profile_load_error')}</p>
          {onRetryProfile ? (
            <button type="button" onClick={onRetryProfile}>
              {t('chat.retry')}
            </button>
          ) : null}
        </div>
      ) : null}

      {!profileLoading ? (
        <>
          {portraitUrl ? (
            <div className="chat-profile-card__portrait-wrap">
              <img
                src={portraitUrl}
                alt=""
                className={`chat-profile-card__portrait${portraitBlur ? ' chat-profile-card__portrait--blur' : ''}`}
              />
              {portraitBlur && portraitPendingLabel ? (
                <span className="chat-profile-card__portrait-label">{portraitPendingLabel}</span>
              ) : null}
            </div>
          ) : null}

          <h2 className="chat-profile-panel__name">{view.name}</h2>
          {showOnline ? <p className="chat-page__online">{t('chat.online')}</p> : null}

          {view.persona ? (
            <section className="chat-profile-panel__section">
              <h3 className="chat-profile-panel__label">{t('chat.profile_personality')}</h3>
              <p className="chat-profile-panel__text">{view.persona}</p>
            </section>
          ) : null}

          {intensityKey ? (
            <section className="chat-profile-panel__section">
              <h3 className="chat-profile-panel__label">{t('chat.profile_presence')}</h3>
              <p className="chat-profile-panel__text">{t(intensityKey)}</p>
            </section>
          ) : null}

          {view.interests.length > 0 ? (
            <section className="chat-profile-panel__section">
              <h3 className="chat-profile-panel__label">{t('chat.profile_interests')}</h3>
              <ul className="chat-page__choices">
                {view.interests.map((interest) => (
                  <li key={interest} className="chat-page__choice">
                    {interest}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {view.boundaries.length > 0 ? (
            <section className="chat-profile-panel__section">
              <h3 className="chat-profile-panel__label">{t('chat.profile_boundaries')}</h3>
              <ul className="chat-page__choices">
                {view.boundaries.map((boundary) => (
                  <li key={boundary} className="chat-page__choice">
                    {boundary}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {appearanceParts.length > 0 ? (
            <section className="chat-profile-panel__section">
              <h3 className="chat-profile-panel__label">{t('chat.profile_appearance')}</h3>
              <p className="chat-profile-panel__text">{appearanceParts.join(' · ')}</p>
            </section>
          ) : null}

          {onRetryPortrait ? (
            <button type="button" className="chat-profile-card__retry" onClick={onRetryPortrait}>
              {t('chat.portrait_retry')}
            </button>
          ) : null}

          <Link to="/chat/editar" className="chat-profile-panel__edit">
            {t('menu.edit')}
          </Link>

          {!quotaLoading && subscription != null ? (
            <p
              className={
                quotaExhausted ? 'chat-profile-panel__quota chat-profile-panel__quota--out' : 'chat-profile-panel__quota'
              }
              data-testid="chat-quota"
            >
              {quotaExhausted
                ? t('chat.quota_out')
                : t('chat.quota_left', { count: subscription.messagesRemaining })}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
