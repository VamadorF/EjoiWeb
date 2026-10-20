import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import { applyCssVars } from '~/theme/cssVars';
import '~/i18n';
import '~/theme/global.css';

applyCssVars();

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element #root not found');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
