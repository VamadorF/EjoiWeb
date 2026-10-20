import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router';

import * as session from '~/platform/session';

import { resolvePostLoginPath } from './api/auth.api';

type BootState = 'loading' | 'ready';

type WebSessionContextValue = {
  boot: BootState;
  isAuthenticated: boolean;
  markAuthenticated: () => void;
  markLoggedOut: () => void;
};

const WebSessionContext = createContext<WebSessionContextValue | null>(null);

export function WebSessionProvider({ children }: { children: ReactNode }) {
  const [boot, setBoot] = useState<BootState>('loading');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await session.refresh();
        if (!cancelled) setIsAuthenticated(true);
      } catch {
        session.clearSession();
        if (!cancelled) setIsAuthenticated(false);
      } finally {
        if (!cancelled) setBoot('ready');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const markAuthenticated = useCallback(() => setIsAuthenticated(true), []);
  const markLoggedOut = useCallback(() => {
    session.clearSession();
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({ boot, isAuthenticated, markAuthenticated, markLoggedOut }),
    [boot, isAuthenticated, markAuthenticated, markLoggedOut],
  );

  return <WebSessionContext.Provider value={value}>{children}</WebSessionContext.Provider>;
}

export function useWebSession(): WebSessionContextValue {
  const ctx = useContext(WebSessionContext);
  if (!ctx) {
    throw new Error('useWebSession debe usarse dentro de WebSessionProvider');
  }
  return ctx;
}

export function SessionRouting() {
  const { boot, isAuthenticated } = useWebSession();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (boot !== 'ready') return;

    if (!isAuthenticated) {
      if (location.pathname !== '/acceso' && location.pathname !== '/') {
        navigate('/acceso', { replace: true });
      }
      return;
    }

    if (location.pathname === '/acceso' || location.pathname === '/') {
      void resolvePostLoginPath().then((path) => {
        if (location.pathname !== path) navigate(path, { replace: true });
      });
    }
  }, [boot, isAuthenticated, location.pathname, navigate]);

  return null;
}
