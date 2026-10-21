import { useTranslation } from 'react-i18next';

export type IcebreakersProps = {
  suggestions: string[];
  onSelect: (text: string) => void;
};

export function Icebreakers({ suggestions, onSelect }: IcebreakersProps) {
  const { t } = useTranslation();
  if (suggestions.length === 0) return null;

  return (
    <div className="chat-icebreakers" data-testid="chat-icebreakers">
      <p className="chat-icebreakers__label">{t('chat.icebreaker.section_label')}</p>
      <div className="chat-icebreakers__chips">
        {suggestions.map((text) => (
          <button
            key={text}
            type="button"
            className="chip chat-icebreakers__chip"
            aria-label={t('chat.icebreaker.chip_a11y', { text })}
            onClick={() => onSelect(text)}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
