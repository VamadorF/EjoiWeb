import type { OnboardingData } from '@/features/onboarding/types';
import { MAX_COMPANION_AVATAR_VARIANTS } from '@/features/companion/constants/avatarVariants';

export type AvatarCatalogReason = 'pick_after_regen' | 'limit_reached';

export type AvatarVariant = {
  id: string;
  url: string;
  storagePath?: string;
  createdAt: number;
};

type AvatarSessionState = {
  promptKey: string | null;
  variants: AvatarVariant[];
  selectedId: string | null;
  catalogReason: AvatarCatalogReason | null;
  onboardingData: OnboardingData | null;
};

let session: AvatarSessionState = {
  promptKey: null,
  variants: [],
  selectedId: null,
  catalogReason: null,
  onboardingData: null,
};

const createVariantId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const getAvatarSession = (): Readonly<AvatarSessionState> => session;

export const clearAvatarSession = (): void => {
  session = {
    promptKey: null,
    variants: [],
    selectedId: null,
    catalogReason: null,
    onboardingData: null,
  };
};

export const setAvatarSessionOnboardingData = (data: OnboardingData): void => {
  session.onboardingData = data;
};

export const getAvatarSessionOnboardingData = (): OnboardingData | null => session.onboardingData;

export const remainingAvatarGenerations = (): number =>
  Math.max(0, MAX_COMPANION_AVATAR_VARIANTS - session.variants.length);

export const canGenerateMoreAvatars = (): boolean =>
  session.variants.length < MAX_COMPANION_AVATAR_VARIANTS;

export const getSelectedAvatarVariant = (): AvatarVariant | null => {
  if (!session.selectedId) return session.variants[0] ?? null;
  return session.variants.find((v) => v.id === session.selectedId) ?? session.variants[0] ?? null;
};

export const selectAvatarVariant = (variantId: string): void => {
  if (session.variants.some((v) => v.id === variantId)) {
    session.selectedId = variantId;
  }
};

export type GeneratedAvatar = { url: string; storagePath?: string };

export const addAvatarVariant = (avatar: GeneratedAvatar): AvatarVariant => {
  const variant: AvatarVariant = {
    id: createVariantId(),
    url: avatar.url,
    storagePath: avatar.storagePath,
    createdAt: Date.now(),
  };
  session.variants.push(variant);
  session.selectedId = variant.id;
  return variant;
};

export const setAvatarCatalogReason = (reason: AvatarCatalogReason | null): void => {
  session.catalogReason = reason;
};

export const consumeAvatarCatalogReason = (): AvatarCatalogReason | null => {
  const reason = session.catalogReason;
  session.catalogReason = null;
  return reason;
};

export const prepareAvatarSession = (
  promptKey: string,
): 'resume' | 'fresh' | 'profile_changed' => {
  if (session.promptKey === promptKey) {
    return session.variants.length > 0 ? 'resume' : 'fresh';
  }

  const profileChanged = session.promptKey !== null && session.variants.length > 0;

  session = {
    promptKey,
    variants: [],
    selectedId: null,
    catalogReason: null,
    onboardingData: session.onboardingData,
  };

  return profileChanged ? 'profile_changed' : 'fresh';
};
