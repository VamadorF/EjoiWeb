import { DATA_RIGHTS_CONTACT_EMAIL } from '@/features/auth/assets/legalDocuments';

export const DATA_RIGHTS = ['access', 'rectification', 'opposition', 'portability', 'block'] as const;

export type DataRight = (typeof DATA_RIGHTS)[number];

export type DataRightsRequestContext = {
  userId?: string;
  email?: string;
  name?: string;
};

const SUBJECTS: Record<DataRight, string> = {
  access: 'Solicitud ARCOP - Acceso a datos personales',
  rectification: 'Solicitud ARCOP - Rectificacion de datos',
  opposition: 'Solicitud ARCOP - Oposicion al tratamiento',
  portability: 'Solicitud ARCOP - Portabilidad de datos',
  block: 'Solicitud ARCOP - Bloqueo temporal',
};

export const toMailtoPlainText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ñÑ]/g, (char) => (char === 'Ñ' ? 'N' : 'n'))
    .replace(/[–—]/g, '-')
    .replace(/[“”«»]/g, '"')
    .replace(/[‘’]/g, "'");

export function buildDataRightsMailto(
  right: DataRight,
  context: DataRightsRequestContext = {},
): string {
  const lines = [
    'Solicito ejercer el siguiente derecho sobre mis datos personales en eJoi.',
    '',
    `Derecho: ${SUBJECTS[right]}`,
    `User ID: ${context.userId?.trim() || 'no disponible en el dispositivo'}`,
    `Nombre: ${context.name?.trim() || 'no disponible en el dispositivo'}`,
    `Email: ${context.email?.trim() || 'no disponible en el dispositivo'}`,
    '',
    'Detalle de la solicitud:',
    '',
  ];

  const subject = toMailtoPlainText(SUBJECTS[right]);
  const body = toMailtoPlainText(lines.join('\n'));

  return `mailto:${DATA_RIGHTS_CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
