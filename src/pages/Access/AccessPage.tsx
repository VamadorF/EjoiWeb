import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { fromWebAuthResponse, type RawAuthResponse } from '~/features/auth/authWeb.adapter';
import { CAMPAIGN_LANDING_URL, isOAuthConfigured, MOCK_API } from '~/platform/env';
import { httpClient } from '~/platform/http';
import * as session from '~/platform/session';
import { setMockDemoLoggedIn } from '~/platform/mockApi';
import { AppIcon } from '~/components/AppIcon';
import { Logo } from '~/components/Logo';
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

const ACCESS_PORTRAITS = {
  left: '/portraits/ilustrado-femenino.webp',
  center: '/portraits/realista-femenino.webp',
  right: '/portraits/realista-masculino.webp',
} as const;

const VALUE_PILLS = [
  { key: 'pill_safe', icon: 'shield-checkmark-outline', tone: 'brand' },
  { key: 'pill_support', icon: 'heart-outline', tone: 'lav' },
  { key: 'pill_habits', icon: 'trending-up-outline', tone: 'ok' },
] as const;

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

  const showDevOAuthBanner =
    import.meta.env.DEV &&
    !isOAuthConfigured.google &&
    !isAppleSignInConfigured();

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
    if (MOCK_API) setMockDemoLoggedIn();
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

  return (
    <div className="access-page" data-testid="page-acceso">
      <DesktopShell header={<Logo height={28} />}>
        <div className="access-layout">
          <section className="access-brand" aria-labelledby="access-brand-heading">
            <div className="access-brand__portraits" aria-hidden>
              <img
                className="avatar access-brand__portrait access-brand__portrait--side"
                src={ACCESS_PORTRAITS.left}
                alt=""
                width={96}
                height={96}
                decoding="async"
              />
              <img
                className="avatar avatar--132 access-brand__portrait access-brand__portrait--center"
                src={ACCESS_PORTRAITS.center}
                alt=""
                width={132}
                height={132}
                decoding="async"
              />
              <img
                className="avatar access-brand__portrait access-brand__portrait--side"
                src={ACCESS_PORTRAITS.right}
                alt=""
                width={96}
                height={96}
                decoding="async"
              />
            </div>
            <h1 id="access-brand-heading" className="access-brand__tagline">
              {t('auth.login.value_tagline')}
            </h1>
            <ul className="access-brand__pills">
              {VALUE_PILLS.map(({ key, icon, tone }) => (
                <li key={key}>
                  <span className={`pill access-brand__pill access-brand__pill--${tone}`}>
                    <AppIcon name={icon} className="access-brand__pill-icon" />
                    {t(`auth.login.${key}`)}
                  </span>
                </li>
              ))}
            </ul>
            {founderCount !== null ? (
              <p className="access-brand__social">
                {t('web:access.social_proof', { count: founderCount })}
              </p>
            ) : null}
          </section>

          <section className="access-auth" aria-labelledby="access-auth-title">
            <div className="access-auth__card card" aria-busy={busy || undefined}>
              {MOCK_API ? (
                <p className="banner--info" role="status">
                  <AppIcon name="sparkles-outline" />
                  {t('web:access.mock_banner')}
                </p>
              ) : null}
              {showDevOAuthBanner ? (
                <p className="banner--warn" role="status">
                  <AppIcon name="alert-circle-outline" />
                  {t('web:access.dev_no_provider')}
                </p>
              ) : null}

              <p className="label">{t('web:access.step')}</p>
              <div
                className="access-auth__progress"
                role="progressbar"
                aria-valuemin={1}
                aria-valuemax={3}
                aria-valuenow={1}
                aria-label={t('web:access.step')}
              >
                <span className="access-auth__progress-seg access-auth__progress-seg--done" />
                <span className="access-auth__progress-seg" />
                <span className="access-auth__progress-seg" />
              </div>

              <h2 id="access-auth-title" className="access-auth__title">
                {returning ? (
                  t('web:access.returning_title')
                ) : (
                  <>
                    {t('auth.login.headline_prefix')}
                    <span className="access-auth__highlight">{t('auth.login.headline_highlight')}</span>
                    {t('auth.login.headline_suffix')}
                  </>
                )}
              </h2>
              {!returning ? (
                <p className="access-auth__subtitle">{t('auth.login.subtitle')}</p>
              ) : null}

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
                    className="btn btn--secondary btn--l access-auth__provider-btn"
                    onClick={() => void handleApple()}
                    disabled={busy}
                  >
                    <AppIcon name="logo-apple" />
                    {t('web:access.apple_continue')}
                  </button>
                ) : null}
                {MOCK_API ? (
                  <button
                    type="button"
                    className="btn btn--secondary btn--l access-auth__provider-btn"
                    onClick={() => void handleMockLogin()}
                    disabled={busy}
                  >
                    {t('web:access.mock_login')}
                  </button>
                ) : null}
              </div>

              <p className="access-auth__account-line">
                {t('web:access.account_prompt')}{' '}
                <button
                  type="button"
                  className="btn btn--text access-auth__account-btn"
                  onClick={focusProviders}
                  disabled={busy}
                >
                  {t('web:access.sign_in')}
                </button>
                <span className="access-auth__account-sep" aria-hidden>
                  {' · '}
                </span>
                <button
                  type="button"
                  className="btn btn--text access-auth__account-btn"
                  onClick={toggleInvite}
                  disabled={busy}
                >
                  {t('web:access.have_code')}
                </button>
              </p>

              {showInvite ? (
                <div className="field">
                  <label className="field__label" htmlFor="access-invite-code">
                    {t('auth.login.invite_code')}
                  </label>
                  <input
                    id="access-invite-code"
                    ref={inviteInputRef}
                    className="field__control"
                    type="text"
                    autoComplete="off"
                    placeholder={t('web:access.invite_placeholder')}
                    value={inviteCode}
                    disabled={busy}
                    onChange={(e) => setInviteCode(e.target.value)}
                    onBlur={() => void onInviteBlur()}
                  />
                  {inviteMessage === 'ok' && inviterName ? (
                    <p className="field__help" role="status">
                      {t('web:access.invite_valid', { name: inviterName })}
                    </p>
                  ) : null}
                  {inviteMessage === 'invalid' ? (
                    <p className="field__help field__help--err" role="status">
                      {t('web:access.invite_invalid')}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {error ? (
                <p className="banner--error" role="alert">
                  <AppIcon name="alert-circle-outline" />
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
            </div>
          </section>
        </div>
      </DesktopShell>
    </div>
  );
}
