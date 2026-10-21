import { APPLE_CLIENT_ID } from '~/platform/env';

declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: {
          clientId: string;
          scope: string;
          redirectURI: string;
          usePopup: boolean;
        }) => void;
        signIn: () => Promise<{
          authorization?: { id_token?: string; code?: string };
          user?: { email?: string; name?: { firstName?: string; lastName?: string } };
        }>;
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadAppleScript(): Promise<void> {
  if (window.AppleID?.auth) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src =
      'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
    script.async = true;
    script.dataset.ejoiApple = '1';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar Apple JS'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function isAppleSignInConfigured(): boolean {
  return APPLE_CLIENT_ID.length > 0;
}

export async function signInWithApple(): Promise<{
  identityToken: string;
  email?: string;
  name?: string;
}> {
  if (!APPLE_CLIENT_ID) {
    throw new Error('Apple Sign In no configurado');
  }
  await loadAppleScript();
  const auth = window.AppleID?.auth;
  if (!auth) {
    throw new Error('Apple JS no disponible');
  }

  auth.init({
    clientId: APPLE_CLIENT_ID,
    scope: 'name email',
    redirectURI: `${window.location.origin}/`,
    usePopup: true,
  });

  const result = await auth.signIn();
  const identityToken = result.authorization?.id_token;
  if (!identityToken) {
    throw new Error('Apple no devolvió identity token');
  }

  const first = result.user?.name?.firstName ?? '';
  const last = result.user?.name?.lastName ?? '';
  const name = `${first} ${last}`.trim() || undefined;

  return {
    identityToken,
    email: result.user?.email,
    name,
  };
}
