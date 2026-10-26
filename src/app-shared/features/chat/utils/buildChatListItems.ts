// AUTO-SINCRONIZADO desde ejoiFE 9234854dc9f9992b39b7f61dfb0e02b768be467d@9234854dc9f9992b39b7f61dfb0e02b768be467d:src/features/chat/utils/buildChatListItems.ts. No editar: npm run sync:app
import { formatMessageDate } from './formatMessageDate';
import type { Message } from '../types';

export type ChatListItem =
  | { type: 'date'; id: string; label: string }
  | {
      type: 'message';
      id: string;
      message: Message;
      compactTop: boolean;
      isLastInGroup: boolean;
    }
  | {
      type: 'first_message_quick_replies';
      id: string;
      quickReplies: string[];
    };

const sortMessages = (messages: Message[]) =>
  [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

export const buildChatListItems = (
  rawMessages: Message[],
): ChatListItem[] => {
  const messages = sortMessages(
    rawMessages.filter((m) => m.role === 'user' || m.role === 'assistant')
  );

  const items: ChatListItem[] = [];

  let lastDateLabel = '';
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const label = formatMessageDate(message.createdAt);
    if (label !== lastDateLabel) {
      lastDateLabel = label;
      items.push({ type: 'date', id: `date-${label}-${message.id}`, label });
    }

    const prev = messages[i - 1];
    const next = messages[i + 1];
    const compactTop =
      i > 0 && prev && prev.role === message.role && formatMessageDate(prev.createdAt) === label;
    const isLastInGroup =
      !next || next.role !== message.role || formatMessageDate(next.createdAt) !== label;

    items.push({
      type: 'message',
      id: message.id,
      message,
      compactTop,
      isLastInGroup,
    });
  }

  return items;
};
