import { createContext, useContext, type ReactNode } from 'react';

import { PresenceProvider } from '~/features/presence/PresenceProvider';
import { useCompanionReaction, type UseCompanionReactionResult } from '~/features/reactions/useCompanionReaction';

const ChatSessionContext = createContext<UseCompanionReactionResult | null>(null);

export function ChatSessionProvider({ children }: { children: ReactNode }) {
  const reaction = useCompanionReaction({ enabled: true, spontaneousEnabled: true });

  return (
    <PresenceProvider>
      <ChatSessionContext.Provider value={reaction}>{children}</ChatSessionContext.Provider>
    </PresenceProvider>
  );
}

export function useChatSession(): UseCompanionReactionResult {
  const ctx = useContext(ChatSessionContext);
  if (!ctx) {
    throw new Error('useChatSession debe usarse dentro de ChatSessionProvider');
  }
  return ctx;
}
