// AUTO-SINCRONIZADO desde ejoiFE b20f6d62a97a0266796ebfb82e772f0961ed9136@b20f6d62a97a0266796ebfb82e772f0961ed9136:src/features/chat/utils/resolveChatMediaUrl.ts. No editar: npm run sync:app
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
