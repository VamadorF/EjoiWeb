import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import type { Memory } from '@/features/memories/types';

import { AppIcon } from '~/components/AppIcon';
import { useProfile } from '~/features/chat/useProfile';
import { useMemories } from '~/features/memories/useMemories';

import '../HomeTabPage.css';
import './MemoriesPage.css';

function MemoryCard({
  memory,
  expanded,
  onToggle,
}: {
  memory: Memory;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button type="button" className="memories-page__card" onClick={onToggle}>
      <p className="memories-page__card-title">
        <span aria-hidden="true">{memory.emoji} </span>
        {memory.title}
      </p>
      <p className="memories-page__card-date">{memory.date}</p>
      <p className="memories-page__card-preview">{expanded ? memory.preview : memory.preview.slice(0, 120)}</p>
      <span className="memories-page__mood">{memory.mood}</span>
      {expanded ? <p className="memories-page__card-date">{memory.fullDate}</p> : null}
    </button>
  );
}

export default function MemoriesPage() {
  const { t } = useTranslation();
  const { data: profile } = useProfile(true);
  const { memories, groupedMemories, featuredMemory } = useMemories(profile?.sharedMoments);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const companionName = profile?.name?.trim() || 'tu eJoi';
  const hasNoMemories = memories.length === 0;

  const sections = useMemo(
    () =>
      [
        { key: 'week', title: t('home.memories.section_this_week'), icon: 'calendar-outline', items: groupedMemories.week },
        { key: 'month', title: t('home.memories.section_this_month'), icon: 'time-outline', items: groupedMemories.month },
        { key: 'older', title: t('home.memories.section_older'), icon: 'archive-outline', items: groupedMemories.older },
      ] as const,
    [groupedMemories.month, groupedMemories.older, groupedMemories.week, t],
  );

  return (
    <div className="home-tab-page memories-page" data-testid="home-recuerdos-tab">
      <div className="home-tab-page__inner">
        <header className="memories-page__book">
          <div className="memories-page__spine" aria-hidden="true" />
          <div>
            <h2 className="memories-page__book-title">{t('home.memories.book_title')}</h2>
            <p className="memories-page__book-subtitle">
              {t('home.memories.book_subtitle', { name: companionName })}
            </p>
          </div>
        </header>

        {!hasNoMemories ? (
          <div className="memories-page__stats">
            <div className="memories-page__stat">
              <span className="memories-page__stat-n">{memories.length}</span>
              <span className="memories-page__stat-label">{t('home.memories.stat_moments')}</span>
            </div>
            <div className="memories-page__stat">
              <span className="memories-page__stat-n">{groupedMemories.week.length}</span>
              <span className="memories-page__stat-label">{t('home.memories.stat_this_week')}</span>
            </div>
            <div className="memories-page__stat">
              <span className="memories-page__stat-n">{memories.filter((m) => m.isFavorite).length}</span>
              <span className="memories-page__stat-label">{t('home.memories.stat_favorites')}</span>
            </div>
          </div>
        ) : null}

        {hasNoMemories ? (
          <div className="memories-page__empty">
            <h3>{t('chat.v2.memories_empty_title')}</h3>
            <p>{t('chat.v2.memories_empty_body')}</p>
            <Link to="/chat" className="btn btn--primary btn--m">
              {t('chat.v2.memories_empty_cta')}
            </Link>
          </div>
        ) : null}

        {featuredMemory ? (
          <section className="memories-page__section">
            <h3 className="memories-page__section-title">
              <AppIcon name="star-outline" />
              {t('home.memories.section_special')}
            </h3>
            <div className="memories-page__featured">
              <p className="memories-page__card-title">
                <span aria-hidden="true">{featuredMemory.emoji} </span>
                {featuredMemory.title}
              </p>
              <p className="memories-page__card-preview">{featuredMemory.preview}</p>
              <p className="memories-page__card-date">{featuredMemory.fullDate}</p>
            </div>
          </section>
        ) : null}

        {sections.map(({ key, title, icon, items }) =>
          items.length > 0 ? (
            <section key={key} className="memories-page__section">
              <h3 className="memories-page__section-title">
                <AppIcon name={icon} />
                {title}
              </h3>
              {items.map((memory) => (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  expanded={expandedId === memory.id}
                  onToggle={() =>
                    setExpandedId((current) => (current === memory.id ? null : memory.id))
                  }
                />
              ))}
            </section>
          ) : null,
        )}
      </div>
    </div>
  );
}
