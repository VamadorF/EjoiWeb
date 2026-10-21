import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router';

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
  const location = useLocation();
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
    if ((location.state as { returning?: boolean } | null)?.returning) {
      setReturning(true);
    }
  }, [location.state]);

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
      <DesktopShell
        header={
          <Link to="/" className="btn btn--text access-page__back">
            {t('web:access.back_home')}
          </Link>
        }
      >
        <div className="access-auth">
          <section className="access-auth__card card" aria-labelledby="access-auth-title">
            <div className="access-auth__card-inner" aria-busy={busy || undefined}>
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

              <Logo height={32} className="access-auth__logo" />

              <h1 id="access-auth-title" className="access-auth__title">
                {returning ? t('web:access.returning_title') : t('web:access.title')}
              </h1>
              {!returning ? (
                <p className="access-auth__subtitle">{t('web:access.subtitle')}</p>
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

              <hr className="access-auth__sep" />

              <button
                type="button"
                className="btn btn--text access-auth__code-btn"
                onClick={toggleInvite}
                disabled={busy}
              >
                {t('web:access.have_code')}
              </button>

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
