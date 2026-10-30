import type { VisualStyle } from '@/features/onboarding/types';
import { hairColorToEnglish } from '@/shared/utils/companionImagePrompt';

/**
 * Prompt de edición con imagen de referencia: solo cambia el color de cabello y conserva
 * persona, ojos, ropa y escena del retrato actual (SCRUM-192).
 */
export function buildHairColorEditPrompt(hairColor: string, visualStyle: VisualStyle): string | null {
  const english = hairColorToEnglish(hairColor);
  if (!english) return null;

  const style = visualStyle === 'anime' ? ' Keep the same anime illustration style.' : '';
  return (
    `Edit the reference image. Change only the hair color to natural ${english} hair. ` +
    'Keep everything else exactly the same: the same person, face and facial features, eye color, skin tone, ' +
    'expression, hairstyle and hair length, outfit and clothing colors, accessories, pose, framing, background and lighting.' +
    `${style} No text. No logos. One person only.`
  );
}
