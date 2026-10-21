import { lazy } from 'react';
import { createBrowserRouter, Outlet, type RouteObject } from 'react-router';

import { SessionRouting } from '~/features/auth/useWebSession';

const HomePage = lazy(() => import('~/pages/Home/HomePage'));
const AccessPage = lazy(() => import('~/pages/Access/AccessPage'));
const CreateWhoPage = lazy(() => import('~/pages/CreateMobile/CreateWhoEntry'));
const CreateHowPage = lazy(() => import('~/pages/CreateMobile/CreateHowEntry'));
const ChatPage = lazy(() => import('~/pages/ChatPage'));
const ChatEditPage = lazy(() => import('~/pages/ChatEditPage'));

export const routeConfig: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '/acceso', element: <AccessPage /> },
  { path: '/crear/quien', element: <CreateWhoPage /> },
  { path: '/crear/como', element: <CreateHowPage /> },
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
