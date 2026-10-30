import {
  generateCompanionImage as generateCompanionImageUpstream,
  IMAGE_GENERATE_FETCH_TIMEOUT_MS,
  type GenerateImageRequest,
  type GenerateImageResponse,
} from '../app-shared/features/companion/api/image.api';

import { IMAGE_API_URL, MOCK_API } from './env';
import { getAuthToken, getUserData } from './secure';

export type { GenerateImageRequest, GenerateImageResponse };
export { IMAGE_GENERATE_FETCH_TIMEOUT_MS };

const MOCK_PORTRAIT_PATH = '/portraits/realista-femenino.webp';

function mockPortrait(prompt: string): GenerateImageResponse {
  const fileUrl =
    typeof window !== 'undefined'
      ? new URL(MOCK_PORTRAIT_PATH, window.location.origin).href
      : MOCK_PORTRAIT_PATH;
  return {
    fileUrl,
    storagePath: 'mock/portrait.webp',
    revisedPrompt: prompt,
  };
}

export async function generateCompanionImage(
  request: GenerateImageRequest,
): Promise<GenerateImageResponse> {
  if (MOCK_API) return mockPortrait(request.prompt);
  return generateCompanionImageUpstream(request);
}

type ReferenceType = 'image/png' | 'image/webp' | 'image/jpeg';

const EXT_BY_TYPE: Record<ReferenceType, string> = {
  'image/png': 'png',
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
};

/** Misma regla que `resolveCompanionReferenceImage` en la app: extensión sin firma, JPEG por defecto. */
function referenceType(url: string, blobType: string): ReferenceType {
  if (blobType in EXT_BY_TYPE) return blobType as ReferenceType;
  const pathOnly = url.split('?')[0]!.toLowerCase();
  if (pathOnly.endsWith('.png')) return 'image/png';
  if (pathOnly.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

/** Mismo id que usa `generateCompanionImage` para la carpeta de GCS: usuario guardado o claim del JWT. */
async function resolveImageUserId(token: string | null): Promise<string | undefined> {
  try {
    const stored = JSON.parse((await getUserData()) ?? '{}') as { id?: string; userId?: string };
    const fromStorage = stored.id?.trim() || stored.userId?.trim();
    if (fromStorage) return fromStorage;
  } catch {
    // sigue con el JWT
  }
  try {
    const segment = token?.split('.')[1];
    if (!segment) return undefined;
    const payload = JSON.parse(atob(segment.replace(/-/g, '+').replace(/_/g, '/'))) as {
      userId?: string;
      sub?: string;
    };
    return payload.userId?.trim() || payload.sub?.trim() || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Edita el retrato actual con POST /image/generate-with-image (imagen de referencia + prompt),
 * para cambios que deben conservar persona, ropa y escena (SCRUM-192).
 */
export async function editCompanionImageWithReference(request: {
  prompt: string;
  referenceUrl: string;
}): Promise<GenerateImageResponse> {
  if (MOCK_API) return mockPortrait(request.prompt);

  const controller = new AbortController();
  const abortTimer = setTimeout(() => controller.abort(), IMAGE_GENERATE_FETCH_TIMEOUT_MS);
  try {
    const reference = await fetch(request.referenceUrl, { signal: controller.signal });
    if (!reference.ok) {
      throw new Error(`No se pudo descargar el retrato de referencia: HTTP ${reference.status}`);
    }
    const blob = await reference.blob();
    const type = referenceType(request.referenceUrl, blob.type);

    const token = await getAuthToken();
    const userId = await resolveImageUserId(token);
    if (!userId) throw new Error('No se pudo obtener el id de usuario para editar la imagen');

    const body = new FormData();
    body.append('prompt', request.prompt);
    body.append('uuid', userId);
    body.append('image', new Blob([blob], { type }), `companion-reference.${EXT_BY_TYPE[type]}`);

    const response = await fetch(`${IMAGE_API_URL}/image/generate-with-image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body,
      signal: controller.signal,
    });
    const payload = (await response.json().catch(() => ({}))) as {
      fileUrl?: string;
      storagePath?: string;
      message?: string;
    };
    if (!response.ok) {
      throw new Error(payload.message || `Image edit failed: HTTP ${response.status}`);
    }
    const fileUrl = payload.fileUrl?.trim();
    if (!fileUrl) throw new Error('No image URL received from image API');
    return { fileUrl, storagePath: payload.storagePath?.trim() || undefined };
  } finally {
    clearTimeout(abortTimer);
  }
}
