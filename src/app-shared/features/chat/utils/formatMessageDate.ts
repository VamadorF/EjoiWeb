// AUTO-SINCRONIZADO desde ejoiFE a1e61e3d072b6cc9e8b074adda33480eb1d3a1f2@a1e61e3d072b6cc9e8b074adda33480eb1d3a1f2:src/features/chat/utils/formatMessageDate.ts. No editar: npm run sync:app
import i18n from '@/shared/i18n';

export const formatMessageDate = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return i18n.t('chat.date.today');
  if (d.toDateString() === yesterday.toDateString()) return i18n.t('chat.date.yesterday');
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};
