import { Suspense } from 'react';
import { RouterProvider } from 'react-router';

import { WebSessionProvider } from '~/features/auth/useWebSession';

import { router } from './routes';

export default function App() {
  return (
    <WebSessionProvider>
      <Suspense fallback={null}>
        <RouterProvider router={router} />
      </Suspense>
    </WebSessionProvider>
  );
}
