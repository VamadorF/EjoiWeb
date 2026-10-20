import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { legalDocuments } from '@/features/auth/assets/legalDocuments';
import { fromWebAuthResponse, type RawAuthResponse } from '~/features/auth/authWeb.adapter';
import { CAMPAIGN_LANDING_URL, isOAuthConfigured, MOCK_API } from '~/platform/env';
import { httpClient } from '~/platform/http';
import * as session from '~/platform/session';
import { AppIcon } from '~/components/AppIcon';
import { DesktopShell } from '~/layout/DesktopShell';
import {
  finishLoginAfterProvider,
  getFounderCount,
  loginWithApple,
  loginWithGoogle,
  previewReferralCode,
} from '~/features/auth/api/auth.api';
import { decodeJwtPayload, googleSubFromIdToken } from '~/features/auth/decodeJwtPayload';
import { mountGoogleButton } from '~/features/auth/googleIdentity';
import { isAppleSignInConfigured, signInWithApple } from '~/features/auth/appleIdentity';
import {
  clearPendingReferralCode,
  getPendingReferralCode,
  setPendingReferralCode,
} from '~/features/auth/referralCode';
import { useWebSession } from '~/features/auth/useWebSession';

import './AccessPage.css';

const LEGAL_TERMS_URL = `${CAMPAIGN_LANDING_URL}/terminos`;
const LEGAL_PRIVACY_URL = `${CAMPAIGN_LANDING_URL}/privacidad`;

function profileFromIdToken(idToken: string) {
  const payload = decodeJwtPayload(idToken);
  return {
    email: typeof payload?.email === 'string' ? payload.email : undefined,
    name: typeof payload?.name === 'string' ? payload.name : undefined,
    picture: typeof payload?.picture === 'string' ? payload.picture : undefined,
    sub: typeof payload?.sub === 'string' ? payload.sub : undefined,
  };
}

export default function AccessPage() {
  const { t } = useTranslation(['translation', 'web']);
  const navigate = useNavigate();
  const { markAuthenticated } = useWebSession();
  const providersRef = useRef<HTMLDivElement>(null);
  const googleHostRef = useRef<HTMLDivElement>(null);
  const inviteInputRef = useRef<HTMLInputElement>(null);
  const providersGroupId = useId();

  const [returning, setReturning] = useState(false);
  const [showInvite, setShowInvite] = useState(Boolean(getPendingReferralCode()));
  const [inviteCode, setInviteCode] = useState(getPendingReferralCode() ?? '');
  const [inviteMessage, setInviteMessage] = useState<'ok' | 'invalid' | null>(null);
  const [inviterName, setInviterName] = useState<string | null>(null);
  const [founderCount, setFounderCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDark =
    typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark';
  const logoSrc = isDark ? '/logos/invertido.png' : '/logos/principal.png';

  useEffect(() => {
    document.documentElement.classList.add('access-route');
    return () => document.documentElement.classList.remove('access-route');
  }, []);

  useEffect(() => {
    void getFounderCount()
      .then((data) => {
        if (data.claimed > 0) setFounderCount(data.claimed);
      })
      .catch(() => {
        /* DP-46 */
      });
  }, []);

  const runAfterLogin = useCallback(async () => {
    markAuthenticated();
    const path = await finishLoginAfterProvider();
    navigate(path, { replace: true });
  }, [markAuthenticated, navigate]);

  const handleProviderError = useCallback(() => {
    setError(t('web:access.error_generic'));
    setBusy(false);
  }, [t]);

  const handleGoogleCredential = useCallback(
    async (idToken: string) => {
      setBusy(true);
      setError(null);
      try {
        const sub = googleSubFromIdToken(idToken);
        if (!sub) throw new Error('invalid token');
        const profile = profileFromIdToken(idToken);
        await loginWithGoogle({
          provider: 'google',
          providerUserId: sub,
          idToken,
          email: profile.email,
          name: profile.name,
          avatarUrl: profile.picture,
        });
        await runAfterLogin();
      } catch {
        handleProviderError();
      }
    },
    [handleProviderError, runAfterLogin],
  );

  useEffect(() => {
    if (!isOAuthConfigured.google || !googleHostRef.current) return;
    void mountGoogleButton(googleHostRef.current, (token) => {
      void handleGoogleCredential(token);
    });
  }, [handleGoogleCredential]);

  const handleMockLogin = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await httpClient.post<RawAuthResponse>('/auth/mock-login', {});
      const { accessToken, user } = fromWebAuthResponse(response.data);
      session.setSession(accessToken, JSON.stringify(user));
      await runAfterLogin();
    } catch {
      handleProviderError();
    }
  };

  const handleApple = async () => {
    setBusy(true);
    setError(null);
    try {
      const apple = await signInWithApple();
      const profile = profileFromIdToken(apple.identityToken);
      const sub = profile.sub ?? apple.email;
      if (!sub) throw new Error('missing sub');
      await loginWithApple({
        provider: 'apple',
        providerUserId: sub,
        identityToken: apple.identityToken,
        email: apple.email ?? profile.email,
        name: apple.name ?? profile.name,
      });
      await runAfterLogin();
    } catch {
      handleProviderError();
    }
  };

  const focusProviders = () => {
    setReturning(true);
    providersRef.current?.focus();
  };

  const toggleInvite = () => {
    setShowInvite(true);
    requestAnimationFrame(() => inviteInputRef.current?.focus());
  };

  const onInviteBlur = async () => {
    const code = inviteCode.trim();
    if (!code) {
      setInviteMessage(null);
      clearPendingReferralCode();
      return;
    }
    try {
      const preview = await previewReferralCode(code);
      if (preview.valid && preview.inviterName) {
        setPendingReferralCode(code);
        setInviterName(preview.inviterName);
        setInviteMessage('ok');
      } else {
        clearPendingReferralCode();
        setInviterName(null);
        setInviteMessage('invalid');
      }
    } catch {
      setInviteMessage('invalid');
    }
  };

  const authTitle = returning
    ? t('web:access.returning_title')
    : `${t('auth.login.headline_prefix')}${t('auth.login.headline_highlight')}${t('auth.login.headline_suffix')}`;

  return (
    <div className="access-page" data-testid="page-acceso">
      <DesktopShell
        header={
          <img src={logoSrc} alt="eJoi" className="access-brand__logo" width={120} height={40} />
        }
        footer={<span>{legalDocuments.termsAndConditions.title}</span>}
      >
        <div className="access-layout">
          <section className="access-brand" aria-labelledby="access-brand-heading">
            <img src={logoSrc} alt="" className="access-brand__logo" width={160} height={48} />
            <h1 id="access-brand-heading" className="access-brand__tagline">
              {t('auth.login.value_tagline')}
            </h1>
            <ul className="access-brand__seals">
              <li>
                <AppIcon name="checkmark-circle-outline" />
                {t('auth.login.value_seal_1')}
              </li>
              <li>
                <AppIcon name="shield-checkmark-outline" />
                {t('auth.login.value_seal_2')}
              </li>
              <li>
                <AppIcon name="time-outline" />
                {t('auth.login.value_seal_3')}
              </li>
            </ul>
            {founderCount !== null ? (
              <p className="access-brand__social">
                {t('web:access.social_proof', { count: founderCount })}
              </p>
            ) : null}
          </section>

          <section
            className="access-auth"
            aria-labelledby="access-auth-title"
            aria-busy={busy || undefined}
          >
            {MOCK_API ? (
              <p className="access-auth__mock-banner" role="status">
                {t('web:access.mock_banner')}
              </p>
            ) : null}
            <p className="access-auth__step">{t('web:access.step')}</p>
            <h2 id="access-auth-title" className="access-auth__title">
              {authTitle}
            </h2>

            <div className="access-auth__actions">
              <button
                type="button"
                className="access-auth__link"
                onClick={focusProviders}
                disabled={busy}
              >
                {t('web:access.sign_in')}
              </button>
              <button
                type="button"
                className="access-auth__link"
                onClick={toggleInvite}
                disabled={busy}
              >
                {t('web:access.have_code')}
              </button>
            </div>

            <div
              id={providersGroupId}
              ref={providersRef}
              className="access-auth__providers"
              tabIndex={-1}
              aria-label={t('web:access.sign_in')}
            >
              {isOAuthConfigured.google ? (
                <div className="access-auth__google-row">
                  <div ref={googleHostRef} />
                </div>
              ) : null}
              {isAppleSignInConfigured() ? (
                <button
                  type="button"
                  className="access-auth__apple"
                  onClick={() => void handleApple()}
                  disabled={busy}
                >
                  {t('web:access.apple_continue')}
                </button>
              ) : null}
              {MOCK_API ? (
                <button
                  type="button"
                  className="access-auth__mock-login"
                  onClick={() => void handleMockLogin()}
                  disabled={busy}
                >
                  {t('web:access.mock_login')}
                </button>
              ) : null}
            </div>

            {showInvite ? (
              <div className="access-auth__invite">
                <label htmlFor="access-invite-code">{t('auth.login.invite_code')}</label>
                <input
                  id="access-invite-code"
                  ref={inviteInputRef}
                  type="text"
                  autoComplete="off"
                  placeholder={t('web:access.invite_placeholder')}
                  value={inviteCode}
                  disabled={busy}
                  onChange={(e) => setInviteCode(e.target.value)}
                  onBlur={() => void onInviteBlur()}
                />
                {inviteMessage === 'ok' && inviterName ? (
                  <p className="access-auth__invite-msg access-auth__invite-msg--ok" role="status">
                    {t('web:access.invite_valid', { name: inviterName })}
                  </p>
                ) : null}
                {inviteMessage === 'invalid' ? (
                  <p className="access-auth__invite-msg access-auth__invite-msg--err" role="status">
                    {t('web:access.invite_invalid')}
                  </p>
                ) : null}
              </div>
            ) : null}

            {error ? (
              <p className="access-auth__error" role="alert">
                {error}
              </p>
            ) : null}

            <p className="access-auth__legal">
              {t('auth.login.terms_prefix')}{' '}
              <a href={LEGAL_TERMS_URL} target="_blank" rel="noreferrer">
                {t('auth.login.terms_link')}
              </a>
              {t('auth.login.and_privacy')}
              <a href={LEGAL_PRIVACY_URL} target="_blank" rel="noreferrer">
                {t('auth.login.privacy_link')}
              </a>
              {t('auth.login.terms_suffix')}
            </p>
          </section>
        </div>
      </DesktopShell>
    </div>
  );
}
