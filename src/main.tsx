import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';

import App from './App';
import i18n from '~/i18n';
import { MOCK_API } from '~/platform/env';
import { installMockFetch } from '~/platform/mockApi';
import { applyCssVars } from '~/theme/cssVars';
import '~/theme/global.css';
import '~/theme/ui.css';

if (MOCK_API) {
  installMockFetch();
  console.info('[eJoi] Modo mock API activo (VITE_MOCK_API=true). Desactívalo para usar eJoi-BE.');
}

applyCssVars();

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element #root not found');
}

createRoot(root).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </StrictMode>,
);
