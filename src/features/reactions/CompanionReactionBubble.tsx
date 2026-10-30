import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { InstantReaction } from '@/features/chat/types';
import { getRandomEmojiForReaction } from '@/features/chat/utils/reactionEmojiCatalog';
import { REACTION_KIND_TO_BG } from '~/theme/reactionColors';

import './CompanionReactionBubble.css';

export type CompanionReactionBubbleProps = {
  reaction: InstantReaction | null;
  companionName: string;
  /** Emoji ya elegido para este beat. Si no viene, se sortea uno del catálogo. */
  glyph?: string;
};

export function CompanionReactionBubble({ reaction, companionName, glyph: glyphProp }: CompanionReactionBubbleProps) {
  const { t } = useTranslation();
  const [glyph, setGlyph] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!reaction) {
      setVisible(false);
      setGlyph('');
      return;
    }
    if (glyphProp) {
      setGlyph(glyphProp);
    } else if (reaction.kind === 'typing') {
      setGlyph('…');
    } else {
      setGlyph(getRandomEmojiForReaction(reaction.kind) ?? '✨');
    }
    setVisible(true);
  }, [glyphProp, reaction]);

  const a11yLabel = useMemo(() => {
    if (!reaction) return undefined;
    const labelKey = `chat.instant_reaction.kinds.${reaction.kind}`;
    return t('chat.instant_reaction.a11y_label', {
      name: companionName,
      label: t(labelKey),
    });
  }, [companionName, reaction, t]);

  if (!reaction) return null;

  const bg = REACTION_KIND_TO_BG[reaction.kind] ?? REACTION_KIND_TO_BG.thinking;
  const punchy = reaction.interactionPhase === 'assistant_message';

  return (
    <span
      className={`chat-reaction-bubble${visible ? ' chat-reaction-bubble--in' : ''}${
        punchy ? ' chat-reaction-bubble--punchy' : ''
      }`}
      style={{ backgroundColor: bg }}
      role="img"
      aria-label={a11yLabel}
      data-testid="chat-instant-reaction"
    >
      {glyph}
    </span>
  );
}
