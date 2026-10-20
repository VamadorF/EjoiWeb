import { DesktopShell } from '~/layout/DesktopShell';
import { OptionGrid } from '~/layout/OptionGrid';

const GENDERS = ['Femenino', 'Masculino', 'Neutro'] as const;

export default function CreateQuienPage() {
  return (
    <DesktopShell
      header={<span>Crear eJoi</span>}
      footer={<span>Continuar</span>}
      preview={<span>Vista previa</span>}
    >
      <OptionGrid cols={3}>
        {GENDERS.map((label) => (
          <button key={label} type="button">
            {label}
          </button>
        ))}
      </OptionGrid>
    </DesktopShell>
  );
}
