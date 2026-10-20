import type { ReactNode } from 'react';

import './ChatShell.css';

export type ChatShellProps = {
  menu?: ReactNode;
  profile?: ReactNode;
  children: ReactNode;
};

export function ChatShell({ menu, profile, children }: ChatShellProps) {
  return (
    <div className="chat-shell">
      <nav className="chat-shell__menu" data-testid="chat-menu">
        {menu}
      </nav>
      <section className="chat-shell__read" data-testid="chat-read">
        {children}
      </section>
      <aside className="chat-shell__profile" data-testid="chat-profile">
        {profile}
      </aside>
    </div>
  );
}
