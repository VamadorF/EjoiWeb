import { lazy } from 'react';
import { Navigate, createBrowserRouter, Outlet, type RouteObject } from 'react-router';

import { SessionRouting } from '~/features/auth/useWebSession';

const HomePage = lazy(() => import('~/pages/Home/HomePage'));
const AccessPage = lazy(() => import('~/pages/Access/AccessPage'));
const CreateCrearRedirect = lazy(() => import('~/pages/CreateWizard/CreateCrearRedirect'));
const CreateWizardPage = lazy(() => import('~/pages/CreateWizard/CreateWizardPage'));
const ChatPage = lazy(() => import('~/pages/ChatPage'));
const ChatEditPage = lazy(() => import('~/pages/ChatEditPage'));

export const routeConfig: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '/acceso', element: <AccessPage /> },
  { path: '/crear', element: <CreateCrearRedirect /> },
  { path: '/crear/:wizardStep', element: <CreateWizardPage /> },
  { path: '/crear/quien', element: <Navigate to="/crear/paso-1" replace /> },
  { path: '/crear/como', element: <Navigate to="/crear/paso-4" replace /> },
  { path: '/chat', element: <ChatPage /> },
  { path: '/chat/editar', element: <ChatEditPage /> },
];

function RootLayout() {
  return (
    <>
      <SessionRouting />
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
