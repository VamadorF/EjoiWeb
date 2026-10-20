import { normalizeInterestText } from '~/platform/mockGreeting';

export type TextSegment = { text: string; highlight?: boolean };

/** Resalta en el texto las apariciones de intereses (misma normalización que el backend). */
export function splitInterestHighlights(text: string, basedOn: string[]): TextSegment[] {
  if (!text || basedOn.length === 0) return [{ text }];

  const termNorms = [...new Set(basedOn.map(normalizeInterestText))];
  const highlight = new Array<boolean>(text.length).fill(false);

  for (let start = 0; start < text.length; start++) {
    let bestEnd = -1;
    for (let end = text.length; end > start; end--) {
      const slice = text.slice(start, end);
      if (termNorms.includes(normalizeInterestText(slice))) {
        bestEnd = end;
        break;
      }
    }
    if (bestEnd > start) {
      for (let i = start; i < bestEnd; i++) highlight[i] = true;
      start = bestEnd - 1;
    }
  }

  const segments: TextSegment[] = [];
  let i = 0;
  while (i < text.length) {
    const isHl = highlight[i];
    let j = i + 1;
    while (j < text.length && highlight[j] === isHl) j++;
    segments.push({ text: text.slice(i, j), highlight: isHl || undefined });
    i = j;
  }
  return segments.length ? segments : [{ text }];
}
