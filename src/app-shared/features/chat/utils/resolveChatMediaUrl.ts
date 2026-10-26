// AUTO-SINCRONIZADO desde ejoiFE 9234854dc9f9992b39b7f61dfb0e02b768be467d@9234854dc9f9992b39b7f61dfb0e02b768be467d:src/features/chat/utils/resolveChatMediaUrl.ts. No editar: npm run sync:app
import { API_URL } from '@/app/config/env';

/**
 * Normaliza URLs de adjuntos del historial: absolutas se dejan; relativas se prefijan con API_URL.
 * URIs locales (file/content/blob) no se modifican.
 */
export function resolveChatMediaUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string') return '';
  const t = url.trim();
  if (!t) return '';
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith('file:') || t.startsWith('content:') || t.startsWith('blob:')) return t;
  const path = t.startsWith('/') ? t : `/${t}`;
  return `${API_URL.replace(/\/$/, '')}${path}`;
}
