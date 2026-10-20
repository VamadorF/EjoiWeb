import { useTranslation } from 'react-i18next';
import { NavLink, useNavigate } from 'react-router';

import { logoutWeb } from '~/features/auth/api/auth.api';

export function SideMenu() {
  const { t } = useTranslation('web');
  const navigate = useNavigate();

  const logout = async () => {
    await logoutWeb();
    navigate('/acceso', { replace: true });
  };

  return (
    <nav className="chat-side-menu" aria-label={t('menu.chat')}>
      <NavLink
        to="/chat"
        end
        className={({ isActive }) =>
          isActive ? 'chat-side-menu__link chat-side-menu__link--active' : 'chat-side-menu__link'
        }
      >
        {t('menu.chat')}
      </NavLink>
      <NavLink
        to="/chat/editar"
        className={({ isActive }) =>
          isActive ? 'chat-side-menu__link chat-side-menu__link--active' : 'chat-side-menu__link'
        }
      >
        {t('menu.edit')}
      </NavLink>
      <button type="button" className="chat-side-menu__logout" onClick={() => void logout()}>
        {t('menu.logout')}
      </button>
    </nav>
  );
}
