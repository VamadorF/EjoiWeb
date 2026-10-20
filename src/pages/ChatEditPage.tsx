import { ChatShell } from '~/layout/ChatShell';

export default function ChatEditPage() {
  return (
    <ChatShell menu={<span>Menú</span>} profile={<span>Editar perfil</span>}>
      <span>Editar eJoi (placeholder)</span>
    </ChatShell>
  );
}
