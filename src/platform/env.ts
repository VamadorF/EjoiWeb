const env = import.meta.env;

export const GOOGLE_CLIENT_ID = String(env.VITE_GOOGLE_CLIENT_ID ?? '');
export const GOOGLE_WEB_CLIENT_ID = GOOGLE_CLIENT_ID;
export const GOOGLE_ANDROID_CLIENT_ID = '';
export const GOOGLE_IOS_CLIENT_ID = '';
export const APPLE_CLIENT_ID = String(env.VITE_APPLE_SERVICES_ID ?? '');
export const API_URL = String(env.VITE_API_URL ?? '/api');
export const REFERRALS_API_URL = String(env.VITE_REFERRALS_API_URL ?? 'https://ejoi-be-referrals.onrender.com');
export const REFERRAL_INVITE_BASE_URL = String(env.VITE_REFERRAL_INVITE_BASE_URL ?? 'https://www.ejoi.cl/invite');
export const SOCKET_URL = String(env.VITE_SOCKET_URL ?? '');
export const IMAGE_API_URL = String(env.VITE_IMAGE_API_URL ?? '');
export const ENABLE_WEBSOCKET = false;
/** true cuando VITE_MOCK_API=true: respuestas locales sin eJoi-BE */
export const MOCK_API = (env.VITE_MOCK_API ?? 'false') === 'true';

export const IS_DEVELOPMENT = import.meta.env.DEV;
export const ENABLE_SUBSCRIPTION_MOCK = IS_DEVELOPMENT;
export const ENABLE_PAYWALL_FEATURE = true;
export const ENABLE_CHAT_IMAGES = false;
export const ENABLE_TTS = false;
export const ENABLE_DEV_PANEL = false;
export const ENABLE_FOUNDER_BADGES = IS_DEVELOPMENT;
export const CAMPAIGN_ENABLED = IS_DEVELOPMENT;
export const CAMPAIGN_LANDING_URL = 'https://www.ejoi.cl';
export const FORCE_SPONTANEOUS_PICTURE = false;
export const REVENUECAT_IOS_API_KEY = '';
export const REVENUECAT_ANDROID_API_KEY = '';

export const ENABLE_ETHNICITY = (env.VITE_ENABLE_ETHNICITY ?? 'true') === 'true';
export const ENABLE_AGE = (env.VITE_ENABLE_AGE ?? 'true') === 'true';

export const isOAuthConfigured = {
  google: GOOGLE_CLIENT_ID.length > 0,
  apple: APPLE_CLIENT_ID.length > 0,
};
