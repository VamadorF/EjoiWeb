// AUTO-SINCRONIZADO desde ejoiFE 9234854dc9f9992b39b7f61dfb0e02b768be467d@9234854dc9f9992b39b7f61dfb0e02b768be467d:src/features/memories/adapters/memories.adapter.ts. No editar: npm run sync:app
import i18n from '@/shared/i18n';
import { Memory, SharedMomentResponse, SharedMomentType } from '../types';

const EMOJI_BY_TYPE: Record<SharedMomentType, string> = {
  FIRST_MEETING: '🌅',
  FIRST_MEMORY_SAVED: '💫',
  FIRST_DEEP_CONVERSATION: '🌙',
  RELATIONSHIP_SHIFT: '🤗',
};

const MOOD_KEY_BY_TYPE: Record<SharedMomentType, string> = {
  FIRST_MEETING: 'memories.moods.first_meeting',
  FIRST_MEMORY_SAVED: 'memories.moods.first_memory_saved',
  FIRST_DEEP_CONVERSATION: 'memories.moods.first_deep_conversation',
  RELATIONSHIP_SHIFT: 'memories.moods.relationship_shift',
};

const FALLBACK_EMOJI = '✨';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function getRelativeDate(date: Date, now: Date): string {
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / MS_PER_DAY);

  if (diffDays === 0) return i18n.t('memories.relative.today');
  if (diffDays === 1) return i18n.t('memories.relative.yesterday');
  if (diffDays < 7) return i18n.t('memories.relative.days_ago', { count: diffDays });
  if (diffDays < 14) return i18n.t('memories.relative.one_week_ago');
  if (diffDays < 30) return i18n.t('memories.relative.weeks_ago', { count: Math.floor(diffDays / 7) });
  if (diffDays < 60) return i18n.t('memories.relative.one_month_ago');
  return i18n.t('memories.relative.months_ago', { count: Math.floor(diffDays / 30) });
}

function getFullDate(date: Date): string {
  const day = date.getDate();
  const month = i18n.t(`memories.months.${date.getMonth()}` as const) as string;
  const year = date.getFullYear();
  return i18n.t('memories.full_date', { day, month, year });
}

function getCategory(date: Date, now: Date): Memory['category'] {
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / MS_PER_DAY);

  if (diffDays < 7) return 'week';
  if (diffDays < 30) return 'month';
  return 'older';
}

export function fromSharedMomentToMemory(moment: SharedMomentResponse): Memory {
  const now = new Date();
  const happenedAt = new Date(moment.happenedAt);
  const type = moment.type as SharedMomentType;
  const moodKey = MOOD_KEY_BY_TYPE[type] ?? 'memories.moods.fallback';

  return {
    id: moment.id,
    title: moment.title,
    preview: moment.description,
    emoji: EMOJI_BY_TYPE[type] ?? FALLBACK_EMOJI,
    mood: i18n.t(moodKey) as string,
    date: getRelativeDate(happenedAt, now),
    fullDate: getFullDate(happenedAt),
    isFavorite: moment.importance >= 5,
    importance: moment.importance,
    category: getCategory(happenedAt, now),
  };
}

export function fromSharedMomentsToMemories(moments: SharedMomentResponse[]): Memory[] {
  return moments.map(fromSharedMomentToMemory);
}
