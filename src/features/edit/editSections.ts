import type { TFunction } from 'i18next';

import { ENABLE_AGE, ENABLE_ETHNICITY } from '~/platform/env';
import { hairColorLabelKey } from '~/theme/hairSwatches';

import { EDIT_VOICE_OPTIONS } from './voiceOptions';
import type { EditFormSnapshot } from './editPatch';

export type EditSectionId =
  | 'appearance'
  | 'personality'
  | 'presence'
  | 'interests'
  | 'boundaries'
  | 'voice';

export type SummaryRowId =
  | 'style'
  | 'age'
  | 'ethnicity'
  | 'hair'
  | 'personality'
  | 'presence'
  | 'interests'
  | 'boundaries'
  | 'voice';

export type SummaryRowDef = {
  id: SummaryRowId;
  section: EditSectionId;
  labelKey: string;
  testId: string;
  hidden?: boolean;
};

export function appearanceSummaryRows(): SummaryRowDef[] {
  const rows: SummaryRowDef[] = [
    { id: 'style', section: 'appearance', labelKey: 'edit.style', testId: 'edit-row-style' },
  ];
  if (ENABLE_AGE) {
    rows.push({ id: 'age', section: 'appearance', labelKey: 'edit.age', testId: 'edit-row-age' });
  }
  if (ENABLE_ETHNICITY) {
    rows.push({
      id: 'ethnicity',
      section: 'appearance',
      labelKey: 'edit.ethnicity',
      testId: 'edit-row-ethnicity',
    });
  }
  rows.push({ id: 'hair', section: 'appearance', labelKey: 'edit.hair', testId: 'edit-row-hair' });
  return rows;
}

export const conversationSummaryRows: SummaryRowDef[] = [
  { id: 'personality', section: 'personality', labelKey: 'edit.personality', testId: 'edit-row-personality' },
  { id: 'presence', section: 'presence', labelKey: 'edit.presence', testId: 'edit-row-presence' },
  { id: 'interests', section: 'interests', labelKey: 'edit.interests', testId: 'edit-row-interests' },
  { id: 'boundaries', section: 'boundaries', labelKey: 'edit.boundaries', testId: 'edit-row-boundaries' },
  { id: 'voice', section: 'voice', labelKey: 'edit.voice', testId: 'edit-row-voice' },
];

const STYLE_LABEL_KEYS: Record<string, string> = {
  realista: 'create.style_realistic',
  anime: 'create.style_illustrated',
};

function joinList(items: string[], max = 3): string {
  if (items.length === 0) return '—';
  const head = items.slice(0, max);
  const tail = items.length > max ? ` +${items.length - max}` : '';
  return `${head.join(', ')}${tail}`;
}

export function summaryRowValue(
  rowId: SummaryRowId,
  values: EditFormSnapshot,
  t: TFunction<'web'>,
): string {
  switch (rowId) {
    case 'style': {
      const key = STYLE_LABEL_KEYS[values.visualStyle] ?? 'create.style_realistic';
      return t(key);
    }
    case 'age':
      return `${values.age} ${t('create.age_unit')}`;
    case 'ethnicity':
      return values.ethnicity?.trim() || t('edit.no_preference');
    case 'hair': {
      const labelKey = hairColorLabelKey(values.hairColor);
      return labelKey ? t(labelKey) : t('edit.no_preference');
    }
    case 'personality':
      return values.persona?.trim() || '—';
    case 'presence': {
      const id = values.intensity;
      const key =
        id === 'soft'
          ? 'create.presence_soft'
          : id === 'intense'
            ? 'create.presence_intense'
            : 'create.presence_balanced';
      return t(key);
    }
    case 'interests':
      return joinList(values.interests);
    case 'boundaries':
      return joinList(values.boundaries);
    case 'voice': {
      const voice = EDIT_VOICE_OPTIONS.find((v) => v.key === values.voiceKey);
      return voice?.label ?? values.voiceKey;
    }
    default:
      return '—';
  }
}
