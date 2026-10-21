import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';

import { legalDocuments } from '@/features/auth/assets/legalDocuments';
import { fromWebAuthResponse, type RawAuthResponse } from '~/features/auth/authWeb.adapter';
import { isOAuthConfigured, MOCK_API } from '~/platform/env';
import { httpClient } from '~/platform/http';
import * as session from '~/platform/session';
import { setMockDemoLoggedIn } from '~/platform/mockApi';
import { AppIcon } from '~/components/AppIcon';
import { Logo } from '~/components/Logo';
import {
  finishLoginAfterProvider,
  loginWithApple,
  loginWithGoogle,
} from '~/features/auth/api/auth.api';
import { decodeJwtPayload, googleSubFromIdToken } from '~/features/auth/decodeJwtPayload';
import { mountGoogleButton } from '~/features/auth/googleIdentity';
import { isAppleSignInConfigured, signInWithApple } from '~/features/auth/appleIdentity';
import { useWebSession } from '~/features/auth/useWebSession';

import { LegalDocumentModal } from './LegalDocumentModal';
import './WelcomePage.css';

const VALUE_PILLS = [
  { key: 'pill_safe', icon: 'shield-checkmark-outline', tone: 'brand' },
  { key: 'pill_support', icon: 'heart-outline', tone: 'lav' },
  { key: 'pill_habits', icon: 'trending-up-outline', tone: 'ok' },
] as const;

type LegalKey = 'terms' | 'privacy';

function profileFromIdToken(idToken: string) {
  const payload = decodeJwtPayload(idToken);
  return {
    email: typeof payload?.email === 'string' ? payload.email : undefined,
    name: typeof payload?.name === 'string' ? payload.name : undefined,
    picture: typeof payload?.picture === 'string' ? payload.picture : undefined,
    sub: typeof payload?.sub === 'string' ? payload.sub : undefined,
  };
}

export default function WelcomePage() {
  const { t } = useTranslation(['translation', 'web']);
  const navigate = useNavigate();
  const location = useLocation();
  const { markAuthenticated } = useWebSession();
  const googleHostRef = useRef<HTMLDivElement>(null);
  const providersGroupId = useId();

  const [returning, setReturning] = useState(false);
  const [legalKey, setLegalKey] = useState<LegalKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showDevOAuthBanner =
    import.meta.env.DEV &&
    !isOAuthConfigured.google &&
    !isAppleSignInConfigured();

  useEffect(() => {
    document.documentElement.classList.add('welcome-route');
    return () => document.documentElement.classList.remove('welcome-route');
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

  const enterReturning = () => {
    setReturning(true);
    navigate('/', { replace: true, state: { returning: true } });
  };

  const legalDoc =
    legalKey === 'terms'
      ? legalDocuments.termsAndConditions
      : legalKey === 'privacy'
        ? legalDocuments.privacyPolicy
        : null;

  return (
    <div className="welcome-page" data-testid="page-bienvenida">
      <div id="main-content" className="welcome-page__column" tabIndex={-1}>
        <section className="welcome-hero" aria-labelledby="welcome-title">
          <Logo width={104} className="welcome-hero__logo" />

          <h1 id="welcome-title" className="welcome-hero__title">
            {returning ? (
              t('web:access.returning_title')
            ) : (
              <>
                {t('auth.login.headline_prefix')}
                <span className="welcome-hero__highlight">{t('auth.login.headline_highlight')}</span>
                {t('auth.login.headline_suffix')}
              </>
            )}
          </h1>

          {!returning ? (
            <p className="welcome-hero__subtitle">{t('auth.login.subtitle')}</p>
          ) : null}

          {!returning ? (
            <ul className="welcome-hero__pills">
              {VALUE_PILLS.map(({ key, icon, tone }) => (
                <li key={key}>
                  <span className={`welcome-hero__pill welcome-hero__pill--${tone}`}>
                    <AppIcon name={icon} className="welcome-hero__pill-icon" />
                    {t(`auth.login.${key}`)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="welcome-actions" aria-busy={busy || undefined} aria-label={t('web:access.sign_in')}>
          {showDevOAuthBanner ? (
            <p className="banner--warn" role="status">
              <AppIcon name="alert-circle-outline" />
              {t('web:access.dev_no_provider')}
            </p>
          ) : null}

          <div id={providersGroupId} className="welcome-actions__providers">
            {isOAuthConfigured.google ? (
              <div className="welcome-actions__google" data-busy={busy || undefined}>
                <span className="btn btn--l welcome-actions__google-face" aria-hidden="true">
                  <span className="welcome-actions__google-badge">
                    <img src="/logos/google-g.svg" alt="" width={18} height={18} />
                  </span>
                  {t('auth.login.continue_google')}
                </span>
                {/* Botón real de GIS (id_token) invisible encima de la cara visual. */}
                <div ref={googleHostRef} className="welcome-actions__google-host" />
              </div>
            ) : null}
            {isAppleSignInConfigured() ? (
              <button
                type="button"
                className="btn btn--l welcome-actions__apple"
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
                className="btn btn--secondary btn--l"
                onClick={() => void handleMockLogin()}
                disabled={busy}
              >
                {t('web:access.mock_login')}
              </button>
            ) : null}
          </div>

          {!returning ? (
            <button type="button" className="btn btn--text" onClick={enterReturning}>
              {t('web:access.sign_in')}
            </button>
          ) : null}

          {/* ponytail: DA-21 — código deshabilitado como LoginScreen app; confirmar con PO si se reactiva */}
          <button
            type="button"
            className="btn btn--text welcome-actions__invite"
            disabled
            aria-disabled="true"
            aria-label={t('auth.login.invite_code_a11y')}
          >
            {t('auth.login.invite_code')}
          </button>

          {error ? (
            <p className="banner--error" role="alert">
              <AppIcon name="alert-circle-outline" />
              {error}
            </p>
          ) : null}

          <p className="welcome-actions__legal">
            {t('auth.login.terms_prefix')}{' '}
            <button type="button" onClick={() => setLegalKey('terms')}>
              {t('auth.login.terms_link')}
            </button>
            {t('auth.login.and_privacy')}
            <button type="button" onClick={() => setLegalKey('privacy')}>
              {t('auth.login.privacy_link')}
            </button>
            {t('auth.login.terms_suffix')}
          </p>
        </section>
      </div>

      <LegalDocumentModal doc={legalDoc} onClose={() => setLegalKey(null)} />
    </div>
  );
}
