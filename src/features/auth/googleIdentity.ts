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
            options: { type?: string; size?: string; theme?: string; width?: number },
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

export async function mountGoogleButton(
  container: HTMLElement,
  onCredential: (idToken: string) => void,
): Promise<void> {
  if (!GOOGLE_CLIENT_ID) return;
  await loadGoogleScript();
  const gis = window.google?.accounts?.id;
  if (!gis) return;

  gis.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (response) => {
      if (response.credential) onCredential(response.credential);
    },
  });

  container.replaceChildren();
  gis.renderButton(container, { type: 'standard', size: 'large', theme: 'outline', width: 320 });
}
