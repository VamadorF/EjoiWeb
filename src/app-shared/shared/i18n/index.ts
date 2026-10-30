// AUTO-SINCRONIZADO desde ejoiFE a1e61e3d072b6cc9e8b074adda33480eb1d3a1f2@a1e61e3d072b6cc9e8b074adda33480eb1d3a1f2:src/shared/i18n/index.ts. No editar: npm run sync:app
/**
 * Configuración de i18next para la app.
 *
 * Estrategia actual: solo español. La infraestructura queda lista para añadir
 * más idiomas en el futuro (basta con agregar `resources` y, opcionalmente,
 * `expo-localization` para detectar el locale del dispositivo).
 *
 * Convivencia con `genderedText`: el copy en `es.json` puede contener términos
 * neutros (`compañer@`, `un/a`, …) y el helper `useGenderedText().tg(key)`
 * los resuelve a la variante correcta tras traducir.
 */

import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from './locales/es.json';
import achievementsEs from './locales/achievements.es.json';
import rewardsEs from './locales/rewards.es.json';
import campaignEs from './locales/campaign.es.json';
import uxv2AuthEs from './locales/uxv2-auth.es.json';
import uxv2OnboardingEs from './locales/uxv2-onboarding.es.json';
import uxv2CompanionEs from './locales/uxv2-companion.es.json';
import uxv2ChatEs from './locales/uxv2-chat.es.json';

const translationEs = {
  ...es,
  auth: {
    ...es.auth,
    login: {
      ...es.auth.login,
      ...uxv2AuthEs.login,
    },
  },
  onboarding: {
    ...es.onboarding,
    v2: {
      ...es.onboarding.v2,
      ...uxv2OnboardingEs.v2,
    },
  },
  home: {
    ...es.home,
    achievements: achievementsEs,
    rewards: rewardsEs,
  },
  campaign: campaignEs,
  companion: {
    ...es.companion,
    creando: {
      ...es.companion.creando,
      ...uxv2CompanionEs.creando,
    },
    ready: {
      ...es.companion.ready,
      ...uxv2CompanionEs.ready,
    },
  },
  chat: {
    ...es.chat,
    v2: uxv2ChatEs.v2,
  },
};

const i18n = createInstance();

void i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: {
    es: { translation: translationEs },
  },
  lng: 'es',
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
