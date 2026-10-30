// AUTO-SINCRONIZADO desde ejoiFE 64d4aac4c69dbe3ca4d58a65271d9b91a96b60b7@64d4aac4c69dbe3ca4d58a65271d9b91a96b60b7:src/features/chat/types.ts. No editar: npm run sync:app
/**
 * Tipos para feature Chat
 */

import type { PreferenceChange } from '@/features/proactivity/types';

export type { PreferenceChange } from '@/features/proactivity/types';

export type MessageRole = 'user' | 'assistant' | 'system';

export type MessageMetaKind = 'first_message';

export interface MessageMeta {
  kind?: MessageMetaKind;
  basedOnInterests?: string[];
  basedOnPersona?: string | null;
  quickReplies?: string[];
  source?: 'llm' | 'template';
}

export type MessageAttachmentType = 'image';

export interface MessageAttachment {
  type: MessageAttachmentType;
  /** URL remota o URI local (`file://`, `content://`) en optimistic UI */
  url: string;
}

export interface Message {
  id: string;
  companionId: string;
  role: MessageRole;
  message: string;
  createdAt: string;
  updatedAt?: string;
  deliveryStatus?: 'pending' | 'sent' | 'failed';
  clientMessageId?: string;
  attachments?: MessageAttachment[];
  /** Tema clasificado por el backend en la última respuesta assistant (si aplica). */
  topic?: string;
  mood?: string;
  /** Cambio de prefs de proactividad interpretado en este turno (si aplica). */
  preferenceChange?: PreferenceChange;
  /** Metadata opcional del backend (p. ej. primer mensaje y respuestas rápidas). */
  meta?: MessageMeta;
}

export interface ChatHistoryParams {
  companionId?: string;
  limit?: number;
  /** @deprecated Prefer `beforeMessageId`; el backend Nest ignoraba offset. */
  cursor?: string;
  /** @deprecated El backend usaba solo los últimos `limit` mensajes; usar `beforeMessageId`. */
  offset?: number;
  /** UUID del mensaje más antiguo ya cargado; siguiente página = mensajes más viejos (estilo WhatsApp). */
  beforeMessageId?: string;
}

export interface ChatHistoryPage {
  messages: Message[];
  nextCursor?: string | null;
  hasMore: boolean;
}

export interface ClientMessageContext {
  /** Timestamp ISO 8601 con offset local del dispositivo. */
  timestamp: string;
  /** Franja del día derivada de la hora local: 'mañana' | 'tarde' | 'noche'. */
  dayPart: 'mañana' | 'tarde' | 'noche';
  /** Hora local 0-23. */
  hour: number;
  /** Día de la semana en español. */
  weekday: string;
  /** IANA timezone (siempre string; fallback America/Santiago). */
  timezone: string;
}

export interface SendMessageRequest {
  companionId?: string;
  message: string;
  useLongTermMemory?: boolean;
  /** Contexto horario del cliente para que la IA conozca el momento del día. */
  clientContext?: ClientMessageContext;
}

/**
 * Request para POST /chat/spontaneous-image-caption.
 * El backend genera la caption con el LLM y persiste la imagen como un único
 * mensaje `assistant`. `userId`/`userName` se derivan del token.
 *
 * Enviar `imageStoragePath` (preferido) y/o `imageUrl`: el backend deriva el
 * object path estable del que venga.
 */
export interface SpontaneousImageCaptionRequest {
  companionId: string;
  /** Texto de escena/trigger para que el LLM genere la caption (no se persiste). */
  message: string;
  /** URL absoluta (signed) devuelta por POST /image/generate-with-image. */
  imageUrl?: string;
  /** Object path estable en storage (preferido por el backend). */
  imageStoragePath?: string;
}

/** Respuesta de POST /chat/spontaneous-image-caption. */
export interface SpontaneousImageCaptionResult {
  /** Caption generada por el LLM. */
  caption: string;
  /** ID del mensaje `assistant` persistido en el historial. */
  messageId: string;
  /** Object path estable de la imagen persistida. */
  imageStoragePath: string;
  /** URL absoluta y re-firmada (~60 min) de la imagen persistida. */
  imageUrl: string;
  /** Modo de persistencia informado por el backend (p.ej. "permanent"). */
  persistence: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  lastMessage?: Message;
  unreadCount: number;
}

/**
 * Tipos de reacción instantánea del compañante (estilo Animal Crossing).
 * Se muestran como un badge animado sobre el avatar del header al enviar
 * un mensaje, antes de la respuesta de texto del LLM.
 */
export type ReactionKind =
  | 'surprise'      // !
  | 'shock'         // !!
  | 'question'      // ?
  | 'thinking'      // 🤔
  | 'curious'       // 🧐
  | 'typing'        // ...
  | 'tender'        // 🥺
  | 'celebrate'     // 🎉
  | 'fire'          // 🔥 entusiasmo / “sale buenísimo”
  | 'perfect'       // 💯 cerrado total / “mil por mil”
  | 'laugh'         // 😂
  | 'disgust'       // 🤢
  | 'love'          // 💗
  | 'bored'         // 😑 (inactividad / aburrimiento)
  | 'sleepy'        // 😴 (sueño; no es la reacción principal de idle largo)
  | 'moai'          // 🗿 desinterés / muy aburrido(a) / inactividad ~5min
  | 'dancing'       // 💃 baile/fiesta (texto); no “todo tema que le gusta”
  | 'confused'      // 😵‍💫 tema fuera del dominio del companion
  | 'proud'         // 🥹 logro del usuario celebrado por el companion
  | 'shy'           // 🙈 piropos directos al companion
  | 'nostalgic'     // 🌙 recuerdos / añoranzas
  | 'uncomfortable' // 😬 tema roza un boundary declarado del companion
  | 'greeting'      // 👋 saludos sin contenido emocional fuerte
  | 'farewell'      // 👋 despedidas
  | 'excited'       // 🤩 entusiasmo expresado con letras repetidas (avaaa, siii, wowww)
  | 'agree'         // 👍 confirmaciones cortas (vale, dale, ok, exacto)
  | 'mindblown'     // 🤯 incredulidad / asombro fuerte (no me lo creo, alucinante)
  | 'flirty'        // 😘 piropos juguetones intermedios entre love y shy
  | 'playful';      // 😏 tono pícaro/lúdico señalado por emojis del usuario

/**
 * Desde qué texto corre la inferencia de reacción.
 * En `assistant_message` se puede refinar score (solo Reacción 2, post-LLM).
 */
export type InferReactionInferenceSource = 'user_message' | 'assistant_message';

/**
 * Reacción instantánea con metadatos. El backend puede devolverla en el futuro
 * en la respuesta de POST /chat/message; por ahora la genera la heurística local.
 *
 * `interactionPhase` distingue pre-usuario vs post-assistant para haptics/spring.
 */
export interface InstantReaction {
  kind: ReactionKind;
  intensity?: 'low' | 'medium' | 'high';
  /** Indica si la reacción vino del backend (true) o de la heurística cliente. */
  fromServer?: boolean;
  /** Inferencia tras el mensaje del usuario vs tras la respuesta del assistant. */
  interactionPhase?: InferReactionInferenceSource;
}

