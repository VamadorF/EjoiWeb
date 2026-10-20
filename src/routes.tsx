import { lazy } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';

const AccessPage = lazy(() => import('~/pages/AccessPage'));
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

export const router = createBrowserRouter(routeConfig);
