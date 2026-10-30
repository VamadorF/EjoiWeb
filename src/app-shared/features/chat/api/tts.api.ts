// AUTO-SINCRONIZADO desde ejoiFE a1e61e3d072b6cc9e8b074adda33480eb1d3a1f2@a1e61e3d072b6cc9e8b074adda33480eb1d3a1f2:src/features/chat/api/tts.api.ts. No editar: npm run sync:app
/**
 * API TTS (ElevenLabs vía backend).
 * Contrato: POST /tts/synthesize — el backend resuelve voiceKey → ElevenLabs ID.
 */

import { httpClient } from '@/shared/services/http/client';

export type TtsSynthesizeResponse = {
  audioUrl: string;
};

export type TtsSynthesizeRequest = {
  messageId: string;
  /**
   * Opcional. Valores: ALEJANDRO | NORAH | CRISTINA | DAVID_DEEP | DAVID_INTENSE | LIZY | ABEL.
   * Si se omite, el backend usa preferencia en BD o default (NORAH).
   */
  voiceKey?: string;
};

const TTS_TIMEOUT_MS = 60000;

export const synthesizeAssistantSpeech = async (
  body: TtsSynthesizeRequest
): Promise<TtsSynthesizeResponse> => {
  const { data } = await httpClient.request<TtsSynthesizeResponse>('/tts/synthesize', {
    method: 'POST',
    body,
    suppressFatalBoundary: true,
    timeoutMs: TTS_TIMEOUT_MS,
  });
  if (!data?.audioUrl || typeof data.audioUrl !== 'string') {
    throw new Error('[tts.api] Respuesta sin audioUrl válida');
  }
  return data;
};
