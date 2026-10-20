import { ChatShell } from '~/layout/ChatShell';

export default function ChatPage() {
  return (
    <ChatShell menu={<span>Menú</span>} profile={<span>Perfil</span>}>
      <span>Conversación (placeholder)</span>
    </ChatShell>
  );
}
