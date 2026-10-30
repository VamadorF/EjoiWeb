import { kvGetJSON, kvSetJSON } from '~/platform/keyValue';

export type ReactionEmoji = '❤️' | '🔥' | '😂' | '😮' | '😢' | '👍';

export const REACTION_EMOJIS: ReactionEmoji[] = ['❤️', '🔥', '😂', '😮', '😢', '👍'];

const STORAGE_KEY = 'chat_message_reactions_v1';

type ReactionsByMessage = Record<string, ReactionEmoji>;
type ReactionsState = Record<string, ReactionsByMessage>;

let cache: ReactionsState | null = null;

export async function loadMessageReactions(): Promise<ReactionsState> {
  if (cache) return cache;
  cache = (await kvGetJSON<ReactionsState>(STORAGE_KEY)) ?? {};
  return cache;
}

async function persist(next: ReactionsState) {
  cache = next;
  await kvSetJSON(STORAGE_KEY, next);
}

export async function getMessageReaction(
  companionId: string,
  messageId: string,
): Promise<ReactionEmoji | undefined> {
  const all = await loadMessageReactions();
  return all[companionId]?.[messageId];
}

export async function setMessageReaction(
  companionId: string,
  messageId: string,
  emoji: ReactionEmoji,
): Promise<void> {
  const all = await loadMessageReactions();
  const forCompanion = { ...(all[companionId] ?? {}), [messageId]: emoji };
  await persist({ ...all, [companionId]: forCompanion });
}

export function resetMessageReactionsCacheForTests() {
  cache = null;
}
