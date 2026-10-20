import {
  generateCompanionImage as generateCompanionImageUpstream,
  IMAGE_GENERATE_FETCH_TIMEOUT_MS,
  type GenerateImageRequest,
  type GenerateImageResponse,
} from '../app-shared/features/companion/api/image.api';

import { MOCK_API } from './env';

export type { GenerateImageRequest, GenerateImageResponse };
export { IMAGE_GENERATE_FETCH_TIMEOUT_MS };

const MOCK_PORTRAIT_PATH = '/portraits/realista-femenino.webp';

export async function generateCompanionImage(
  request: GenerateImageRequest,
): Promise<GenerateImageResponse> {
  if (MOCK_API) {
    const fileUrl =
      typeof window !== 'undefined'
        ? new URL(MOCK_PORTRAIT_PATH, window.location.origin).href
        : MOCK_PORTRAIT_PATH;
    return {
      fileUrl,
      storagePath: 'mock/portrait.webp',
      revisedPrompt: request.prompt,
    };
  }
  return generateCompanionImageUpstream(request);
}
