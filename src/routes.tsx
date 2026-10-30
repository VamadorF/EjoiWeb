import { lazy } from 'react';
import { Navigate, createBrowserRouter, Outlet, type RouteObject } from 'react-router';

import { GlassFilter } from '~/components/LiquidButton';
import { ThemeSettingsMenu } from '~/components/ThemeSettingsMenu';
import { SessionRouting } from '~/features/auth/useWebSession';
import { useThemePreference } from '~/theme/theme';

const WelcomePage = lazy(() => import('~/pages/Welcome/WelcomePage'));
const CreateCrearRedirect = lazy(() => import('~/pages/CreateWizard/CreateCrearRedirect'));
const CreateWizardPage = lazy(() => import('~/pages/CreateWizard/CreateWizardPage'));
const CreateReviewPage = lazy(() => import('~/pages/Review/CreateReviewPage'));
const CreatingPage = lazy(() => import('~/pages/Creating/CreatingPage'));
const ReadyPage = lazy(() => import('~/pages/Ready/ReadyPage'));
const ChatPage = lazy(() => import('~/pages/ChatPage'));
const ChatEditPage = lazy(() => import('~/pages/ChatEditPage'));
const HomeRouteLayout = lazy(() => import('~/layout/HomeShell'));
const ProfilePage = lazy(() => import('~/pages/Profile/ProfilePage'));
const MemoriesPage = lazy(() => import('~/pages/Memories/MemoriesPage'));
const AccountPage = lazy(() => import('~/pages/Account/AccountPage'));
const SubscriptionPage = lazy(() => import('~/pages/Subscription/SubscriptionPage'));

export const routeConfig: RouteObject[] = [
  { path: '/', element: <WelcomePage /> },
  /** Compatibilidad enlaces viejos; orquestador de sesión solo trata `/` como bienvenida pública. */
  { path: '/acceso', element: <Navigate to="/" replace /> },
  { path: '/crear', element: <CreateCrearRedirect /> },
  { path: '/crear/creando', element: <CreatingPage /> },
  { path: '/crear/lista', element: <ReadyPage /> },
  { path: '/crear/revision', element: <CreateReviewPage /> },
  { path: '/crear/:wizardStep/:screen', element: <CreateWizardPage /> },
  { path: '/crear/:wizardStep', element: <CreateWizardPage /> },
  { path: '/crear/quien', element: <Navigate to="/crear/paso-1/genero" replace /> },
  { path: '/crear/como', element: <Navigate to="/crear/paso-4/nombre" replace /> },
  {
    element: <HomeRouteLayout />,
    children: [
      { path: '/chat', element: <ChatPage /> },
      { path: '/perfil', element: <ProfilePage /> },
      { path: '/recuerdos', element: <MemoriesPage /> },
    ],
  },
  /** Ruta autenticada fuera del shell Home (orquestador de sesión). */
  { path: '/cuenta', element: <AccountPage /> },
  { path: '/cuenta/suscripcion', element: <SubscriptionPage /> },
  { path: '/chat/editar', element: <ChatEditPage /> },
];

function RootLayout() {
  const { preference } = useThemePreference();
  return (
    <>
      {preference === 'liquid' ? <GlassFilter /> : null}
      <SessionRouting />
      <ThemeSettingsMenu />
      <Outlet />
    </>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: routeConfig,
  },
]);
