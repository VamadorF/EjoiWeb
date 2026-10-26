// AUTO-SINCRONIZADO desde ejoiFE 9234854dc9f9992b39b7f61dfb0e02b768be467d@9234854dc9f9992b39b7f61dfb0e02b768be467d:src/features/chat/utils/formatMessageDate.ts. No editar: npm run sync:app
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
