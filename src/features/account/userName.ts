export const USER_NAME_MAX_LENGTH = 80;

export const sanitizeUserNameInput = (raw: string): string =>
  raw
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\p{Cc}/gu, '')
    .replace(/\p{Zs}/gu, ' ');

const ALLOWED_NAME = /^[\p{L}\p{M} '’.-]+$/u;
const HAS_LETTER = /\p{L}/u;
const STACKED_MARKS = /\p{M}{3,}/u;

const hasValidCharacters = (value: string): boolean =>
  ALLOWED_NAME.test(value) && HAS_LETTER.test(value) && !STACKED_MARKS.test(value);

export type UserNameValidation =
  | { ok: true; value: string }
  | { ok: false; reason: 'empty' | 'invalid_chars' | 'too_long' };

export const validateUserName = (raw: string): UserNameValidation => {
  const value = sanitizeUserNameInput(raw).trim();
  if (value.length === 0) return { ok: false, reason: 'empty' };
  if (!hasValidCharacters(value)) return { ok: false, reason: 'invalid_chars' };
  if (value.length > USER_NAME_MAX_LENGTH) return { ok: false, reason: 'too_long' };
  return { ok: true, value };
};
