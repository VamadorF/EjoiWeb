import { useState, type ReactNode } from 'react';

import { SkipToContent } from './SkipToContent';

import './ChatShell.css';

export type ChatShellProps = {
  profile?: ReactNode;
  children: ReactNode;
};

export function ChatShell({ profile, children }: ChatShellProps) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      <SkipToContent />
      <div className="chat-shell">
        {profileOpen ? (
          <button
            type="button"
            className="chat-shell__scrim"
            aria-label="Cerrar perfil"
            onClick={() => setProfileOpen(false)}
          />
        ) : null}
        <div className="chat-shell__mobile-bar">
          <button
            type="button"
            className="chat-shell__mobile-toggle"
            data-testid="chat-profile-toggle"
            aria-expanded={profileOpen}
            onClick={() => setProfileOpen((open) => !open)}
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
