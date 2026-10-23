import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router';

import type { OnboardingData } from '@/features/onboarding/types';

import { AppIcon } from '~/components/AppIcon';
import { useCreationStatus } from '~/features/chat/useCreationStatus';
import { getSelectedAvatarVariant } from '~/features/creation/avatarSession';
import {
  emptyOnboardingData,
  getOnboardingDraftRecord,
  mergeDraftIntoData,
} from '~/features/creation/onboardingDraft.api';
import { stylePortraitSrc } from '~/features/creation/portraits';
import { buildCreateCompanionPayload } from '~/features/creation/startCreation';
import { CREATION_MIN_DISPLAY_MS } from '~/platform/mocks/creation';
import { httpClient } from '~/platform/http';

import './CreatingPage.css';

const CREATION_STEP_KEYS = [
  ['personality', 'chat.step_personality'],
  ['interests', 'chat.step_interests'],
  ['greeting', 'chat.step_greeting'],
  ['portrait', 'chat.step_portrait'],
] as const;

export default function CreatingPage() {
  const { t } = useTranslation('web');
  const { t: tc } = useTranslation();
  const navigate = useNavigate();
  const [retryKey, setRetryKey] = useState(0);
  const [minDisplayDone, setMinDisplayDone] = useState(false);
  const [draftData, setDraftData] = useState<OnboardingData | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const navigatedRef = useRef(false);

  const { state, steps, profile, settled } = useCreationStatus(retryKey);

  useEffect(() => {
    const timer = window.setTimeout(() => setMinDisplayDone(true), CREATION_MIN_DISPLAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let active = true;
    void getOnboardingDraftRecord()
      .then((draft) => {
        if (!active) return;
        if (draft?.data) {
          setDraftData(mergeDraftIntoData(emptyOnboardingData(), draft.data));
        }
        setDraftLoaded(true);
      })
      .catch(() => {
        if (active) setDraftLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (navigatedRef.current || !minDisplayDone || state !== 'ready') return;
    navigatedRef.current = true;
    navigate('/crear/lista', { replace: true });
  }, [minDisplayDone, navigate, state]);

  const companionName =
    profile?.name?.trim() || draftData?.companionName?.trim() || tc('companion.creando.default_name');

  const portraitSrc = useMemo(() => {
    const selected = getSelectedAvatarVariant();
    if (selected?.url) return selected.url;
    if (profile?.avatarUrl) return profile.avatarUrl;
    if (draftData) return stylePortraitSrc(draftData.visualStyle, draftData.gender);
    return null;
  }, [draftData, profile?.avatarUrl]);

  const retryCreation = useCallback(async () => {
    if (!draftData) return;
    void httpClient
      .post('/companion/me', buildCreateCompanionPayload(draftData))
      .catch(() => undefined);
    setRetryKey((k) => k + 1);
  }, [draftData]);

  const portraitFocused = minDisplayDone && state === 'ready';

  if (!draftLoaded) return null;

  // Justo tras el POST el BE aún responde `none`: volver solo cuando el sondeo lo confirma.
  if (state === 'none' && settled) {
    return <Navigate to="/crear/revision" replace />;
  }

  if (state === 'error') {
    return (
      <div className="creating-page" data-testid="create-creating-page">
        <div className="creating-page__inner creating-page__inner--error" data-testid="create-creating-error">
          <div className="creating-page__error-icon" aria-hidden="true">
            <AppIcon name="alert-circle-outline" />
          </div>
          <h1 className="creating-page__error-title">
            {t('creating.error_title', { name: companionName })}
          </h1>
          <p className="creating-page__error-body">{tc('companion.creando.timeout_error')}</p>
          <div className="creating-page__error-actions">
            <button type="button" className="btn btn--primary btn--l" onClick={() => void retryCreation()}>
              {t('chat.error_retry')}
            </button>
            <button
              type="button"
              className="btn btn--text btn--m"
              onClick={() => navigate('/crear/revision')}
            >
              {t('chat.error_review')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="creating-page" data-testid="create-creating-page">
      <div className="creating-page__inner">
        <div className="creating-page__hero">
          <div
            className={
              portraitFocused
                ? 'creating-page__ring creating-page__ring--done'
                : 'creating-page__ring'
            }
          >
            {portraitSrc ? (
              <img
                src={portraitSrc}
                alt=""
                className={
                  portraitFocused
                    ? 'avatar avatar--168 creating-page__portrait'
                    : 'avatar avatar--168 avatar--blur creating-page__portrait'
                }
              />
            ) : (
              <span className="avatar avatar--168 creating-page__portrait creating-page__portrait--empty" />
            )}
          </div>
          <h1 className="creating-page__title">{t('chat.creating_title', { name: companionName })}</h1>
        </div>
        <ul className="creating-page__steps">
          {CREATION_STEP_KEYS.map(([key, labelKey]) => (
            <li
              key={key}
              className={steps[key] ? 'creating-page__step creating-page__step--done' : 'creating-page__step'}
            >
              {steps[key] ? (
                <AppIcon name="checkmark-circle" className="creating-page__step-icon creating-page__step-icon--done" />
              ) : (
                <span className="spinner creating-page__step-spinner" aria-hidden="true" />
              )}
              {t(labelKey)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
