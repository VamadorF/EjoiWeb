import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, useNavigate } from 'react-router';

import { AppIcon } from '~/components/AppIcon';
import { ThemePreferenceControl } from '~/components/ThemePreferenceControl';
import { useMotionEnabled } from '~/theme/theme';
import { readSessionUser, resolveUserInitials } from '~/features/account/useCurrentUser';
import { logoutWeb } from '~/features/auth/api/auth.api';
import { fetchSubscriptionMe } from '~/features/chat/useQuota';

import '~/features/chat/SideMenu.css';
import './ThemeSettingsMenu.css';

export type ThemeSettingsMenuProps = {
  /** Clases extra en el botón (p. ej. ocultar en un layout concreto). */
  className?: string;
};

type AccountIdentity = {
  name: string;
  initials: string;
  plan: string;
  picture?: string;
};

/** Engranaje fijo: cuenta (lo que estaba en el sidebar) y tema. */
export function ThemeSettingsMenu({ className = '' }: ThemeSettingsMenuProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { enabled: motionOn, setEnabled: setMotionOn } = useMotionEnabled();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const logoutDialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const loadGen = useRef(0);
  const [identity, setIdentity] = useState<AccountIdentity | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const close = () => dialogRef.current?.close();

  const open = () => {
    const gen = ++loadGen.current;
    const user = readSessionUser();
    const name = user?.name?.trim() || user?.email || '';
    setIdentity(
      name
        ? {
            name,
            initials: resolveUserInitials(user?.name, user?.email),
            plan: 'Plan básico',
            picture: user?.picture,
          }
        : null,
    );
    dialogRef.current?.showModal();
    if (!user) return;
    void fetchSubscriptionMe()
      .then((sub) => {
        if (loadGen.current !== gen) return;
        const plan = sub.planLabel?.trim() || 'Plan básico';
        setIdentity((prev) => (prev ? { ...prev, plan } : prev));
      })
      .catch(() => {});
  };

  const openLogout = () => {
    logoutDialogRef.current?.showModal();
  };

  const closeLogout = () => {
    if (loggingOut) return;
    logoutDialogRef.current?.close();
  };

  const confirmLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutWeb();
      navigate('/', { replace: true });
    } finally {
      setLoggingOut(false);
      logoutDialogRef.current?.close();
      close();
    }
  };

  return (
    <>
      <button
        type="button"
        className={`theme-settings-trigger btn btn--icon ${className}`.trim()}
        aria-label={t('drawer.title')}
        aria-haspopup="dialog"
        data-testid="theme-settings-trigger"
        onClick={open}
      >
        <AppIcon name="settings-outline" />
      </button>

      <dialog
        ref={dialogRef}
        className="theme-settings-dialog"
        aria-labelledby={titleId}
        data-testid="theme-settings-dialog"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
      >
        <div className="theme-settings-dialog__panel card">
          <header className="theme-settings-dialog__header">
            <h2 id={titleId} className="theme-settings-dialog__title">
              {t('drawer.title')}
            </h2>
            <button
              type="button"
              className="btn btn--icon btn--text theme-settings-dialog__close"
              aria-label={t('common.close')}
              onClick={close}
            >
              <AppIcon name="close-outline" />
            </button>
          </header>

          <div className="theme-settings-dialog__account">
            {identity ? (
              <div className="home-side-menu__header">
                <div
                  className="home-side-menu__avatar"
                  aria-label={t('drawer.user_avatar_a11y', { name: identity.name })}
                >
                  {identity.picture ? (
                    <img src={identity.picture} alt="" />
                  ) : (
                    identity.initials
                  )}
                </div>
                <div className="home-side-menu__user">
                  <p className="home-side-menu__name">{identity.name}</p>
                  <p className="home-side-menu__plan">{identity.plan}</p>
                </div>
              </div>
            ) : null}
            <nav className="home-side-menu__nav" aria-label={t('drawer.subtitle')}>
              <NavLink
                to="/chat/editar"
                end
                className={({ isActive }) =>
                  isActive ? 'home-side-menu__row home-side-menu__row--active' : 'home-side-menu__row'
                }
                onClick={close}
              >
                <AppIcon name="create-outline" />
                {t('menu.edit', { ns: 'web', defaultValue: 'Editar eJoi' })}
              </NavLink>
              <Link to="/cuenta" className="home-side-menu__row" onClick={close}>
                <AppIcon name="shield-checkmark-outline" />
                {t('drawer.manage_account')}
              </Link>
              <button type="button" className="home-side-menu__row home-side-menu__switch" onClick={openLogout}>
                <AppIcon name="log-out-outline" />
                {t('auth.switch_account')}
              </button>
            </nav>
          </div>

          <label className="theme-motion">
            <span className="label">{t('theme.motion', { ns: 'web', defaultValue: 'Animaciones' })}</span>
            <input
              type="checkbox"
              role="switch"
              className="theme-motion__switch"
              checked={motionOn}
              data-testid="motion-toggle"
              onChange={(event) => setMotionOn(event.target.checked)}
            />
          </label>
          <ThemePreferenceControl showSectionLabel compact />
        </div>
      </dialog>

      <dialog
        ref={logoutDialogRef}
        className="home-side-menu__logout-dialog"
        data-testid="logout-confirm-dialog"
        onCancel={(event) => {
          if (loggingOut) event.preventDefault();
        }}
      >
        <h2 className="home-side-menu__logout-title">{t('logout.title')}</h2>
        <p>{t('logout.message')}</p>
        <div className="home-side-menu__logout-actions">
          <button type="button" className="btn btn--secondary btn--m" onClick={closeLogout} disabled={loggingOut}>
            {t('common.cancel')}
          </button>
          <button type="button" className="btn btn--primary btn--m" onClick={() => void confirmLogout()} disabled={loggingOut}>
            {loggingOut ? t('logout.loading') : t('logout.confirm')}
          </button>
        </div>
      </dialog>
    </>
  );
}
