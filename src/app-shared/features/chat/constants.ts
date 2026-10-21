// AUTO-SINCRONIZADO desde ejoiFE b20f6d62a97a0266796ebfb82e772f0961ed9136@b20f6d62a97a0266796ebfb82e772f0961ed9136:src/features/chat/constants.ts. No editar: npm run sync:app
export const MESSAGE_MAX_LENGTH = 840;

/**
 * Prefijo del mensaje trigger interno de fotos espontáneas.
 * El backend puede persistirlo en el historial; el cliente lo filtra para no mostrarlo.
 */
export const SPONTANEOUS_PICTURE_TRIGGER_PREFIX = '[foto_espontanea]';

/** Tamaño máximo recomendado para adjuntos (validación cliente). */
export const CHAT_IMAGE_MAX_BYTES = 12 * 1024 * 1024;

/**
 * Cuántos mensajes pide cada página en `GET /chat/history` (`limit`).
 * En el backend (`eJoi-BE`): si no mandas `limit`, el default es **50**; el máximo por petición es **200** (`chat.service` → `take`).
 * Aquí usamos 30 por tamaño de respuesta; podés subirlo (p. ej. 50) para menos viajes de red.
 */
export const CHAT_HISTORY_PAGE_SIZE = 30;

/** POST /chat/message espera respuesta del LLM; Render cold-start puede superar 30s. */
export const CHAT_MESSAGE_TIMEOUT_MS = 120_000;

/** Reintentos ante cold-start / errores transitorios del backend. */
export const CHAT_MESSAGE_MAX_ATTEMPTS = 3;
