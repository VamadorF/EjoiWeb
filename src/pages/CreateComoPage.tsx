import { DesktopShell } from '~/layout/DesktopShell';
import { OptionGrid } from '~/layout/OptionGrid';

export default function CreateComoPage() {
  return (
    <DesktopShell
      header={<span>Estilo visual</span>}
      footer={<span>Continuar</span>}
      preview={<span>Vista previa</span>}
    >
      <OptionGrid cols={4}>
        <button type="button">Realista</button>
        <button type="button">Ilustrado</button>
      </OptionGrid>
    </DesktopShell>
  );
}
