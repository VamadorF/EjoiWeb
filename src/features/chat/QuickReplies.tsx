import { OptionGroup } from '~/layout/OptionGroup';

export type QuickRepliesProps = {
  replies: string[];
  onSelect: (text: string) => void;
};

export function QuickReplies({ replies, onSelect }: QuickRepliesProps) {
  if (replies.length === 0) return null;

  return (
    <div data-testid="chat-quick-replies">
      <OptionGroup
        mode="toggle"
        aria-labelledby="chat-quick-replies-label"
        layout="inline"
        className="chat-quick-replies"
      >
        <span id="chat-quick-replies-label" className="visually-hidden">
          Respuestas rápidas
        </span>
        {replies.map((reply) => (
          <button
            key={reply}
            type="button"
            className="chip chat-quick-replies__chip"
            aria-pressed={false}
            onClick={() => onSelect(reply)}
          >
            {reply}
          </button>
        ))}
      </OptionGroup>
    </div>
  );
}
