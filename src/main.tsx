import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import { applyCssVars, getInitialTheme } from '~/theme/cssVars';
import '~/i18n';
import '~/theme/global.css';

applyCssVars();
document.documentElement.dataset.theme = getInitialTheme();

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element #root not found');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
