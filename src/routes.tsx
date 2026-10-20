import { lazy } from 'react';
import { createBrowserRouter, Navigate, Outlet, type RouteObject } from 'react-router';

import { SessionRouting } from '~/features/auth/useWebSession';

const AccessPage = lazy(() => import('~/pages/Access/AccessPage'));
const CreateQuienPage = lazy(() => import('~/pages/CreateQuienPage'));
const CreateComoPage = lazy(() => import('~/pages/CreateComoPage'));
const ChatPage = lazy(() => import('~/pages/ChatPage'));
const ChatEditPage = lazy(() => import('~/pages/ChatEditPage'));

export const routeConfig: RouteObject[] = [
  { path: '/', element: <Navigate to="/acceso" replace /> },
  { path: '/acceso', element: <AccessPage /> },
  { path: '/crear/quien', element: <CreateQuienPage /> },
  { path: '/crear/como', element: <CreateComoPage /> },
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
