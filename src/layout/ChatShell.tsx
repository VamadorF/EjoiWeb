import type { ReactNode } from 'react';

import { SkipToContent } from './SkipToContent';

import './ChatShell.css';

export type ChatShellProps = {
  menu?: ReactNode;
  profile?: ReactNode;
  children: ReactNode;
};

export function ChatShell({ menu, profile, children }: ChatShellProps) {
  return (
    <>
      <SkipToContent />
      <div className="chat-shell">
        <nav className="chat-shell__menu" data-testid="chat-menu">
          {menu}
        </nav>
        <section id="main-content" className="chat-shell__read" data-testid="chat-read" tabIndex={-1}>
          {children}
        </section>
        <aside className="chat-shell__profile" data-testid="chat-profile">
          {profile}
        </aside>
      </div>
    </>
  );
}
