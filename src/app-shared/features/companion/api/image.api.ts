// AUTO-SINCRONIZADO desde ejoiFE 9234854dc9f9992b39b7f61dfb0e02b768be467d@9234854dc9f9992b39b7f61dfb0e02b768be467d:src/features/companion/api/image.api.ts. No editar: npm run sync:app
/**
 * API para generación de imágenes del companion
 * Usa el backend eJoi-BE-Image (DALL-E)
 */

import { IMAGE_API_URL } from '@/app/config/env';
import { getAuthToken, getUserData } from '@/shared/services/storage/secure';
import { logger, summarizeUrlForLog } from '@/shared/utils/logger';

export interface GenerateImageRequest {
  prompt: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
}

export interface GenerateImageResponse {
  fileUrl: string;
  /** Path estable del objeto en GCS (sin firma). El backend lo re-firma en cada lectura. */
  storagePath?: string;
  revisedPrompt?: string;
}

/**
 * Timeout nativo del POST /image/generate.
 *
 * `fetch()` (whatwg-fetch) deja XMLHttpRequest.timeout = 0. En RN 0.81 iOS eso
 * llega a NSURLRequest.timeoutInterval = 0 → CFNetwork usa 60s y corta si DALL-E
 * + cold start de Render no mandan bytes hasta el JSON final.
 *
 * XMLHttpRequest.timeout (ms) sí se envía a RCTNetworking y RCTConvert lo pasa
 * a segundos (`NSTimeInterval / 1000`). 120s es el tope que este stack permite
 * por request sin tocar AppDelegate / timeoutIntervalForRequest global.
 */
export const IMAGE_GENERATE_FETCH_TIMEOUT_MS = 120_000;

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof Error && error.name === 'AbortError') ||
    (typeof DOMException !== 'undefined' &&
      error instanceof DOMException &&
      error.name === 'AbortError')
  );
}

type RawGenerateImageResponse = {
  fileUrl?: string;
  imageUrl?: string;
  storagePath?: string;
  data?: { fileUrl?: string; imageUrl?: string; storagePath?: string };
};

function extractImageUrl(payload: RawGenerateImageResponse | null | undefined): string | undefined {
  if (!payload) return undefined;
  const nested = payload.data;
  return (
    payload.fileUrl?.trim() ||
    payload.imageUrl?.trim() ||
    nested?.fileUrl?.trim() ||
    nested?.imageUrl?.trim() ||
    undefined
  );
}

function extractStoragePath(payload: RawGenerateImageResponse | null | undefined): string | undefined {
  if (!payload) return undefined;
  return payload.storagePath?.trim() || payload.data?.storagePath?.trim() || undefined;
}

function decodeJwtUserId(token: string): string | undefined {
  try {
    const segment = token.split('.')[1];
    if (!segment) return undefined;
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = typeof atob === 'function' ? atob(base64) : '';
    if (!decoded) return undefined;
    const payload = JSON.parse(decoded) as { userId?: string; sub?: string };
    return payload.userId?.trim() || payload.sub?.trim() || undefined;
  } catch {
    return undefined;
  }
}

type NativeJsonResponse = {
  ok: boolean;
  status: number;
  statusText: string;
  text: () => Promise<string>;
};

/**
 * POST JSON con timeout nativo. No usar `fetch` aquí: no expone xhr.timeout y
 * iOS mata el socket a los 60s sin body.
 */
function postJsonWithNativeTimeout(
  url: string,
  headers: Record<string, string>,
  body: string,
  timeoutMs: number,
  signal: AbortSignal,
): Promise<NativeJsonResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.timeout = timeoutMs;
    xhr.responseType = 'text';

    let settled = false;
    const cleanup = () => {
      signal.removeEventListener('abort', onAbort);
    };
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };

    const onAbort = () => {
      xhr.abort();
      const error = new Error('Aborted');
      error.name = 'AbortError';
      fail(error);
    };

    if (signal.aborted) {
      onAbort();
      return;
    }

    signal.addEventListener('abort', onAbort);

    xhr.onload = () => {
      if (settled) return;
      settled = true;
      cleanup();
      const status = xhr.status;
      const raw = typeof xhr.response === 'string' ? xhr.response : String(xhr.response ?? '');
      resolve({
        ok: status >= 200 && status < 300,
        status,
        statusText: xhr.statusText || '',
        text: async () => raw,
      });
    };

    xhr.ontimeout = () => {
      const error = new Error(`Image generation timed out after ${timeoutMs}ms`);
      error.name = 'AbortError';
      fail(error);
    };

    xhr.onerror = () => {
      fail(new TypeError('Network request failed'));
    };

    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }

    xhr.send(body);
  });
}

async function resolveUserIdForImageApi(token: string | null): Promise<string | undefined> {
  const stored = await getUserData();
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as { id?: string; userId?: string };
      const fromStorage = parsed.id?.trim() || parsed.userId?.trim();
      if (fromStorage) return fromStorage;
    } catch {
      // fall through to JWT
    }
  }
  if (token) {
    return decodeJwtUserId(token);
  }
  return undefined;
}

/**
 * Genera una imagen usando el backend eJoi-BE-Image (DALL-E 3)
 */
export const generateCompanionImage = async (
  request: GenerateImageRequest
): Promise<GenerateImageResponse> => {
  const token = await getAuthToken();
  const userId = await resolveUserIdForImageApi(token);
  if (!userId) {
    logger.error('[CompanionImage][generate] sin userId (storage ni JWT)');
    throw new Error('No se pudo obtener el id de usuario para generar la imagen');
  }
  logger.info('[CompanionImage][generate] inicio POST /image/generate', {
    hasAuthToken: Boolean(token),
    userId,
    promptLength: request.prompt?.length ?? 0,
    size: request.size ?? '1024x1024',
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const abortTimer = setTimeout(() => controller.abort(), IMAGE_GENERATE_FETCH_TIMEOUT_MS);
  let response: NativeJsonResponse;
  try {
    response = await postJsonWithNativeTimeout(
      `${IMAGE_API_URL}/image/generate`,
      headers,
      JSON.stringify({
        prompt: request.prompt,
        userId,
        uuid: userId,
        size: request.size ?? '1024x1024',
        quality: request.quality ?? 'standard',
        style: request.style ?? 'vivid',
      }),
      IMAGE_GENERATE_FETCH_TIMEOUT_MS,
      controller.signal,
    );
  } catch (error) {
    if (isAbortError(error)) {
      logger.error('[CompanionImage][generate] timeout', {
        timeoutMs: IMAGE_GENERATE_FETCH_TIMEOUT_MS,
      });
      throw new Error(`Image generation timed out after ${IMAGE_GENERATE_FETCH_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(abortTimer);
  }

  const rawText = await response.text();
  let parsed: RawGenerateImageResponse = {};
  try {
    parsed = rawText ? (JSON.parse(rawText) as RawGenerateImageResponse) : {};
  } catch {
    logger.error('[CompanionImage][generate] JSON inválido', { rawText: rawText.slice(0, 200) });
  }

  if (!response.ok) {
    logger.error('[CompanionImage][generate] falló', {
      status: response.status,
      statusText: response.statusText,
      body: parsed,
    });
    throw new Error(
      (parsed as { message?: string })?.message ||
        `Image generation failed: ${response.statusText}`
    );
  }

  const fileUrl = extractImageUrl(parsed);
  if (!fileUrl) {
    logger.error('[CompanionImage][generate] respuesta sin URL de imagen', parsed);
    throw new Error('No image URL received from image API');
  }
  const storagePath = extractStoragePath(parsed);
  logger.info('[CompanionImage][generate] éxito', {
    fileUrl: summarizeUrlForLog(fileUrl),
    hasStoragePath: Boolean(storagePath),
    keys: Object.keys(parsed),
  });
  return {
    fileUrl,
    storagePath,
    revisedPrompt: (parsed as { revisedPrompt?: string }).revisedPrompt,
  };
};
