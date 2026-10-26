// AUTO-SINCRONIZADO desde ejoiFE 9234854dc9f9992b39b7f61dfb0e02b768be467d@9234854dc9f9992b39b7f61dfb0e02b768be467d:src/features/chat/api/tts.api.ts. No editar: npm run sync:app
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
