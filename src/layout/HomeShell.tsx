import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet, useLocation } from 'react-router';

import { AppIcon } from '~/components/AppIcon';
import { AnniversaryBanner } from '~/features/companion/AnniversaryBanner';
import { ChatSessionProvider, useChatSession } from '~/features/chat/ChatSessionProvider';
import { ChatHeader } from '~/features/chat/ChatHeader';
import { CompanionReactionBubble } from '~/features/reactions/CompanionReactionBubble';
import { formatPresenceSubtitle } from '~/features/presence/formatPresenceSubtitle';
import { usePresence } from '~/features/presence/usePresence';
import { SideMenu, type HomeTabId } from '~/features/chat/SideMenu';
import { useCreationStatus } from '~/features/chat/useCreationStatus';
import { useProfile } from '~/features/chat/useProfile';
import { useQuota } from '~/features/chat/useQuota';
import { stylePortraitSrc } from '~/features/creation/portraits';

import { SkipToContent } from './SkipToContent';

import './HomeShell.css';

const TAB_ROUTES: readonly { id: HomeTabId; to: string; icon: string; labelKey: string }[] = [
  { id: 'chat', to: '/chat', icon: 'chatbubble-outline', labelKey: 'home.tabs.chat' },
  { id: 'perfil', to: '/perfil', icon: 'person-outline', labelKey: 'home.tabs.profile' },
  { id: 'recuerdos', to: '/recuerdos', icon: 'book-outline', labelKey: 'home.tabs.memories' },
];

function tabFromPath(pathname: string): HomeTabId {
  if (pathname.startsWith('/perfil')) return 'perfil';
  if (pathname.startsWith('/recuerdos')) return 'recuerdos';
  return 'chat';
}

function HomeTabNav({ activeTab }: { activeTab: HomeTabId }) {
  const { t } = useTranslation();
  const { t: tWeb } = useTranslation('web');
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const index = TAB_ROUTES.findIndex((tab) => tab.id === activeTab);
    const next =
      event.key === 'ArrowRight'
        ? (index + 1) % TAB_ROUTES.length
        : (index - 1 + TAB_ROUTES.length) % TAB_ROUTES.length;
    tabRefs.current[next]?.focus();
    tabRefs.current[next]?.click();
  };

  return (
    <div
      className="home-shell__tabs"
      role="tablist"
      tabIndex={0}
      aria-label={tWeb('tabs.aria')}
      onKeyDown={onKeyDown}
      data-testid="home-tabs"
    >
      {TAB_ROUTES.map((tab, index) => (
        <NavLink
          key={tab.id}
          ref={(el) => {
            tabRefs.current[index] = el;
          }}
          to={tab.to}
          role="tab"
          aria-selected={activeTab === tab.id}
          className={({ isActive }) =>
            isActive ? 'home-shell__tab home-shell__tab--active' : 'home-shell__tab'
          }
        >
          {activeTab === tab.id ? <AppIcon name={tab.icon} className="home-shell__tab-icon" /> : null}
          <span>{t(tab.labelKey)}</span>
        </NavLink>
      ))}
    </div>
  );
}

type HomeShellFrameProps = {
  activeTab: HomeTabId;
  menuOpen: boolean;
  onCloseMenu: () => void;
  menu: ReactNode;
  header: ReactNode;
  banner?: ReactNode;
  children: ReactNode;
};

export function HomeShellFrame({
  activeTab,
  menuOpen,
  onCloseMenu,
  menu,
  header,
  banner,
  children,
}: HomeShellFrameProps) {
  const menuPanelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const panel = menuPanelRef.current;
    const focusables = panel?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    focusables?.[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseMenu();
        return;
      }
      if (event.key !== 'Tab' || !focusables?.length) return;
      const list = Array.from(focusables);
      const first = list[0]!;
      const last = list[list.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen, onCloseMenu]);

  return (
    <>
      <SkipToContent />
      <div className="home-shell">
        {menuOpen ? (
          <button
            type="button"
            className="home-shell__scrim"
            aria-label="Cerrar menú"
            onClick={onCloseMenu}
          />
        ) : null}
        <nav
          ref={menuPanelRef}
          className={
            menuOpen ? 'home-shell__menu home-shell__menu--drawer-open' : 'home-shell__menu'
          }
          data-testid="chat-menu"
        >
          {menu}
        </nav>
        <div className="home-shell__main">
          {header}
          <HomeTabNav activeTab={activeTab} />
          {banner}
          <section id="main-content" className="home-shell__read" data-testid="chat-read" tabIndex={-1}>
            {children}
          </section>
        </div>
      </div>
    </>
  );
}

function HomeShellHeader({
  menuOpen,
  onMenuToggle,
}: {
  menuOpen: boolean;
  onMenuToggle: () => void;
}) {
  const { t } = useTranslation();
  const { t: tWeb } = useTranslation('web');
  const { profile, state } = useCreationStatus(0);
  const isReady = state === 'ready';
  const { data: profileData } = useProfile(isReady);
  const { data: subscription, isLoading: quotaLoading } = useQuota(isReady);
  const companionPresence = usePresence('companion');
  const { current: instantReaction } = useChatSession();

  const companionName = profileData?.name?.trim() || profile?.name?.trim() || 'tu eJoi';
  const samplePortrait =
    profileData?.visualStyle && profileData?.gender
      ? stylePortraitSrc(
          profileData.visualStyle as Parameters<typeof stylePortraitSrc>[0],
          profileData.gender as Parameters<typeof stylePortraitSrc>[1],
        )
      : null;
  const portraitUrl = profileData?.avatarUrl ?? profile?.avatarUrl ?? samplePortrait;
  const messagesRemaining = subscription?.messagesRemaining;

  const leadingSlot = (
    <button
      type="button"
      className="chat-header__menu-btn"
      data-testid="chat-menu-toggle"
      aria-expanded={menuOpen}
      aria-label={t('drawer.open_menu')}
      onClick={onMenuToggle}
    >
      <AppIcon name="menu-outline" />
    </button>
  );

  const quotaSlot =
    isReady && !quotaLoading && messagesRemaining != null ? (
      <p data-testid="chat-quota">{tWeb('chat.quota_remaining', { count: messagesRemaining })}</p>
    ) : null;

  const presenceSubtitle = isReady ? formatPresenceSubtitle(companionPresence, t) : undefined;

  return (
    <ChatHeader
      title={companionName}
      portraitUrl={portraitUrl}
      subtitle={presenceSubtitle}
      presenceState={isReady ? companionPresence.state : 'offline'}
      leadingSlot={leadingSlot}
      quotaSlot={quotaSlot}
      reactionSlot={
        instantReaction ? (
          <CompanionReactionBubble reaction={instantReaction} companionName={companionName} />
        ) : null
      }
    />
  );
}

const homeQueryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function HomeRouteContent() {
  const location = useLocation();
  const activeTab = tabFromPath(location.pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: profileData } = useProfile(true);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <ChatSessionProvider>
      <HomeShellFrame
        activeTab={activeTab}
        menuOpen={menuOpen}
        onCloseMenu={closeMenu}
        menu={<SideMenu activeTab={activeTab} drawerMode={menuOpen} onCloseDrawer={closeMenu} />}
        header={
          <HomeShellHeader menuOpen={menuOpen} onMenuToggle={() => setMenuOpen((open) => !open)} />
        }
        banner={<AnniversaryBanner sharedMoments={profileData?.sharedMoments} />}
      >
        <Outlet />
      </HomeShellFrame>
    </ChatSessionProvider>
  );
}

export default function HomeRouteLayout() {
  return (
    <QueryClientProvider client={homeQueryClient}>
      <HomeRouteContent />
    </QueryClientProvider>
  );
}

