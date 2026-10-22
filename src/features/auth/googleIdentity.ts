import { GOOGLE_CLIENT_ID } from '~/platform/env';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: string;
              size?: string;
              theme?: string;
              text?: string;
              shape?: string;
              logo_alignment?: string;
              locale?: string;
              width?: number;
            },
          ) => void;
        };
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-ejoi-gis]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.dataset.ejoiGis = '1';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar Google Identity Services'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

let credentialHandler: ((idToken: string) => void) | null = null;
let gisInitialized = false;

export async function mountGoogleButton(
  container: HTMLElement,
  onCredential: (idToken: string) => void,
  mode: 'light' | 'dark' = 'light',
): Promise<void> {
  if (!GOOGLE_CLIENT_ID) return;
  await loadGoogleScript();
  const gis = window.google?.accounts?.id;
  if (!gis) return;

  // GIS avisa si se llama a initialize() más de una vez: se inicializa una vez y el callback se actualiza aparte.
  credentialHandler = onCredential;
  if (!gisInitialized) {
    gisInitialized = true;
    gis.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (response.credential) credentialHandler?.(response.credential);
      },
    });
  }

  // Branding de Google: botón oficial sin deformarlo (GIS acepta 200–400px de ancho); negro en modo oscuro.
  const renderWidth = Math.round(Math.min(400, Math.max(200, container.getBoundingClientRect().width || 320)));
  container.replaceChildren();
  gis.renderButton(container, {
    type: 'standard',
    theme: mode === 'dark' ? 'filled_black' : 'outline',
    size: 'large',
    text: 'continue_with',
    shape: 'pill',
    logo_alignment: 'left',
    locale: 'es',
    width: renderWidth,
  });
}
