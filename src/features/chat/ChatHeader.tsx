import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { PresenceState } from '@/features/presence/types';

import { presenceDotModifier } from '~/features/presence/formatPresenceSubtitle';

import './ChatHeader.css';

export type ChatHeaderProps = {
  title: string;
  subtitle?: string;
  portraitUrl?: string | null;
  presenceState?: PresenceState;
  leadingSlot?: ReactNode;
  quotaSlot?: ReactNode;
  reactionSlot?: ReactNode;
};

export function ChatHeader({
  title,
  subtitle,
  portraitUrl,
  presenceState = 'online',
  leadingSlot,
  quotaSlot,
  reactionSlot,
}: ChatHeaderProps) {
  const { t: tWeb } = useTranslation('web');
  const displaySubtitle = subtitle ?? tWeb('chat.online');
  const presenceClass = presenceDotModifier(presenceState);

  return (
    <header className="chat-header" data-testid="chat-conv-header">
      {leadingSlot ? <div className="chat-header__leading">{leadingSlot}</div> : null}
      <div className="chat-header__peer">
        {portraitUrl ? (
          <div className="chat-header__avatar-wrap">
            <img src={portraitUrl} alt="" className="avatar avatar--44 chat-header__avatar" />
            <span
              className={`chat-header__presence ${presenceClass}`}
              data-presence={presenceState}
              aria-hidden="true"
            />
            {reactionSlot}
          </div>
        ) : null}
        <div className="chat-header__text">
          <p className="chat-header__name">{title}</p>
          <p className="chat-header__subtitle" data-testid="chat-header-subtitle">
            {displaySubtitle}
          </p>
        </div>
      </div>
      {quotaSlot ? <div className="chat-header__quota">{quotaSlot}</div> : null}
    </header>
  );
}
