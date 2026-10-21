import { useTranslation } from 'react-i18next';
import { NavLink, useNavigate } from 'react-router';

import { Logo } from '~/components/Logo';
import { AppIcon } from '~/components/AppIcon';
import { logoutWeb } from '~/features/auth/api/auth.api';
import { useSectionDialog } from '~/features/edit/useSectionDialog';
import { OptionGroup } from '~/layout/OptionGroup';
import { type ThemePreference, useThemePreference } from '~/theme/theme';

import './SideMenu.css';

const THEME_OPTIONS: readonly { id: ThemePreference; labelKey: string }[] = [
  { id: 'system', labelKey: 'theme.system' },
  { id: 'light', labelKey: 'theme.light' },
  { id: 'dark', labelKey: 'theme.dark' },
];

export function SideMenu() {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const { preference, setPreference } = useThemePreference();
  const { dialogRef, open, close } = useSectionDialog();

  const logout = async () => {
    await logoutWeb();
    navigate('/acceso', { replace: true });
  };

  return (
    <nav className="chat-side-menu" aria-label={t('menu.chat')}>
      <Logo height={28} className="chat-side-menu__logo" />
      <NavLink
        to="/chat"
        end
        className={({ isActive }) =>
          isActive ? 'chat-side-menu__row chat-side-menu__row--active' : 'chat-side-menu__row'
        }
      >
        <AppIcon name="chatbubble-ellipses-outline" />
        {t('menu.chat')}
      </NavLink>
      <NavLink
        to="/chat/editar"
        className={({ isActive }) =>
          isActive ? 'chat-side-menu__row chat-side-menu__row--active' : 'chat-side-menu__row'
        }
      >
        <AppIcon name="create-outline" />
        {t('menu.edit')}
      </NavLink>
      <button
        type="button"
        className="chat-side-menu__row"
        data-testid="chat-settings-open"
        onClick={(e) => open(e.currentTarget)}
      >
        <AppIcon name="settings-outline" />
        {t('menu.settings')}
      </button>
      <button type="button" className="chat-side-menu__row chat-side-menu__logout" onClick={() => void logout()}>
        <AppIcon name="log-out-outline" />
        {t('menu.logout')}
      </button>

      <dialog ref={dialogRef} className="chat-settings-dialog" data-testid="chat-settings-dialog">
        <h2 className="chat-settings-dialog__title">{t('menu.settings')}</h2>
        <div className="chat-settings-dialog__body">
          <span id="chat-settings-theme-label" className="label">
            {t('theme.label')}
          </span>
          <OptionGroup
            mode="radio"
            aria-labelledby="chat-settings-theme-label"
            layout="inline"
            className="seg chat-settings-dialog__seg"
          >
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="radio"
                className="seg__item"
                aria-checked={preference === opt.id}
                onClick={() => setPreference(opt.id)}
              >
                {t(opt.labelKey)}
              </button>
            ))}
          </OptionGroup>
        </div>
        <div className="chat-settings-dialog__actions">
          <button type="button" className="btn btn--secondary btn--m" onClick={close}>
            {t('edit.cancel')}
          </button>
        </div>
      </dialog>
    </nav>
  );
}
