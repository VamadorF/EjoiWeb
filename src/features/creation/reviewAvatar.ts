import { generateCompanionImage } from '@/features/companion/api/image.api';
import type { OnboardingData } from '@/features/onboarding/types';
import { generateCompanionImagePrompt } from '@/shared/utils/companionImagePrompt';

import { buildCompanionAvatarImageRequest } from '~/features/chat/usePortraitGeneration';

import { addAvatarVariant, type GeneratedAvatar } from './avatarSession';

export async function generateReviewAvatar(data: OnboardingData): Promise<GeneratedAvatar | null> {
  const prompt = generateCompanionImagePrompt(data, 'avatar');
  const image = await generateCompanionImage(buildCompanionAvatarImageRequest(prompt));
  if (!image.fileUrl) return null;
  const result = { url: image.fileUrl, storagePath: image.storagePath };
  addAvatarVariant(result);
  return result;
}
