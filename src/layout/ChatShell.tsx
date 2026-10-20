import { useState, type ReactNode } from 'react';

import { SkipToContent } from './SkipToContent';

import './ChatShell.css';

export type ChatShellProps = {
  menu?: ReactNode;
  profile?: ReactNode;
  children: ReactNode;
};

export function ChatShell({ menu, profile, children }: ChatShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      <SkipToContent />
      <div className="chat-shell">
        {menuOpen ? (
          <button
            type="button"
            className="chat-shell__scrim"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
          />
        ) : null}
        {profileOpen ? (
          <button
            type="button"
            className="chat-shell__scrim"
            aria-label="Cerrar perfil"
            onClick={() => setProfileOpen(false)}
          />
        ) : null}
        <nav
          className={
            menuOpen ? 'chat-shell__menu chat-shell__menu--drawer-open' : 'chat-shell__menu'
          }
          data-testid="chat-menu"
        >
          {menu}
        </nav>
        <div className="chat-shell__mobile-bar">
          <button
            type="button"
            className="chat-shell__mobile-toggle"
            data-testid="chat-menu-toggle"
            aria-expanded={menuOpen}
            onClick={() => {
              setProfileOpen(false);
              setMenuOpen((open) => !open);
            }}
          >
            Menú
          </button>
          <button
            type="button"
            className="chat-shell__mobile-toggle"
            data-testid="chat-profile-toggle"
            aria-expanded={profileOpen}
            onClick={() => {
              setMenuOpen(false);
              setProfileOpen((open) => !open);
            }}
          >
            Perfil
          </button>
        </div>
        <section id="main-content" className="chat-shell__read" data-testid="chat-read" tabIndex={-1}>
          {children}
        </section>
        <aside
          className={
            profileOpen
              ? 'chat-shell__profile chat-shell__profile--drawer-open'
              : 'chat-shell__profile'
          }
          data-testid="chat-profile"
        >
          {profile}
        </aside>
      </div>
    </>
  );
}
