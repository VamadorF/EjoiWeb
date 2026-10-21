import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useNavigate } from 'react-router';

import { AppIcon } from '~/components/AppIcon';
import { resolveUserInitials, useCurrentUser } from '~/features/account/useCurrentUser';
import { logoutWeb } from '~/features/auth/api/auth.api';
import { useQuota } from '~/features/chat/useQuota';
export type HomeTabId = 'chat' | 'perfil' | 'recuerdos';

import './SideMenu.css';

const NAV_ITEMS: readonly { tab: HomeTabId; to: string; icon: string; labelKey: string }[] = [
  { tab: 'chat', to: '/chat', icon: 'chatbubble-ellipses-outline', labelKey: 'drawer.nav_chat' },
  { tab: 'perfil', to: '/perfil', icon: 'person-outline', labelKey: 'drawer.nav_profile' },
  { tab: 'recuerdos', to: '/recuerdos', icon: 'book-outline', labelKey: 'drawer.nav_memories' },
];

type SideMenuProps = {
  activeTab?: HomeTabId;
  drawerMode?: boolean;
  onCloseDrawer?: () => void;
};

export function SideMenu({ activeTab, drawerMode = false, onCloseDrawer }: SideMenuProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const { data: subscription } = useQuota(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const logoutDialogRef = useRef<HTMLDialogElement>(null);

  const userInitials = resolveUserInitials(user?.name, user?.email);
  const displayName = user?.name?.trim() || user?.email || t('drawer.title');
  const planLabel = subscription?.planLabel?.trim() || 'Plan básico';

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
      closeLogout();
    }
  };

  const navRowClass = (isActive: boolean) =>
    isActive ? 'home-side-menu__row home-side-menu__row--active' : 'home-side-menu__row';

  return (
    <div className="home-side-menu" aria-label={t('drawer.title')}>
      <div className="home-side-menu__header">
        <div
          className="home-side-menu__avatar"
          aria-label={t('drawer.user_avatar_a11y', { name: displayName })}
        >
          {userInitials}
        </div>
        <div className="home-side-menu__user">
          <p className="home-side-menu__name">{displayName}</p>
          <p className="home-side-menu__plan">{planLabel}</p>
        </div>
        {drawerMode ? (
          <button
            type="button"
            className="home-side-menu__close"
            aria-label={t('common.close')}
            onClick={onCloseDrawer}
          >
            <AppIcon name="close-outline" />
          </button>
        ) : null}
      </div>

      <nav className="home-side-menu__nav">
        {NAV_ITEMS.map(({ tab, to, icon, labelKey }) => (
          <NavLink
            key={tab}
            to={to}
            end={tab === 'chat'}
            className={({ isActive }) => navRowClass(isActive || activeTab === tab)}
            onClick={onCloseDrawer}
          >
            <AppIcon name={icon} />
            {t(labelKey)}
          </NavLink>
        ))}

        <NavLink
          to="/chat/editar"
          className={({ isActive }) => navRowClass(isActive)}
          onClick={onCloseDrawer}
        >
          <AppIcon name="create-outline" />
          {t('menu.edit', { ns: 'web', defaultValue: 'Editar eJoi' })}
        </NavLink>

        <NavLink
          to="/cuenta"
          className={({ isActive }) => navRowClass(isActive)}
          onClick={onCloseDrawer}
        >
          <AppIcon name="shield-checkmark-outline" />
          {t('drawer.manage_account')}
        </NavLink>
      </nav>

      <div className="home-side-menu__footer">
        <button type="button" className="home-side-menu__row home-side-menu__switch" onClick={openLogout}>
          <AppIcon name="log-out-outline" />
          {t('auth.switch_account')}
        </button>
      </div>

      <dialog
        ref={logoutDialogRef}
        className="home-side-menu__logout-dialog"
        data-testid="logout-confirm-dialog"
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
    </div>
  );
}
