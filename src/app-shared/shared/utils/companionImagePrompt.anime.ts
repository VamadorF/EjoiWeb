// AUTO-SINCRONIZADO desde ejoiFE b20f6d62a97a0266796ebfb82e772f0961ed9136@b20f6d62a97a0266796ebfb82e772f0961ed9136:src/shared/utils/companionImagePrompt.anime.ts. No editar: npm run sync:app
import type { CompanionArchetypeId } from '../../features/onboarding/types';
import type { CompanionImagePromptMode, CompanionImageStyleConfig } from './companionImagePrompt';
import { buildAnimeAgeDescriptor } from './companionAgeAppearance';
import { COMPANION_DEFAULT_AGE } from '../../features/onboarding/constants/onboardingSteps';

export const ANIME_COMPOSITION_RULES = [
  'Single character only.',
  'One finished anime illustration only.',
  'Upper-body or three-quarter anime portrait composition.',
  'Face clearly visible and unobstructed.',
  'Both eyes clearly visible.',
  'Character centered with enough soft anime background visible.',
  'Clean readable silhouette.',
  'No duplicate character.',
  'No cropped duplicate body parts.',
  'No panels, collage, UI overlay, or decorative frame.',
].join(' ');

export const ANIME_ARCHETYPE_COMPOSITION_RULES = [
  'Single character only.',
  'One finished anime illustration only.',
  'Upper-body or three-quarter anime portrait composition.',
  'Face clearly visible and unobstructed.',
  'Both eyes clearly visible.',
  'Character centered with enough archetype environment visible.',
  'Clean readable silhouette.',
  'No duplicate character.',
  'No cropped duplicate body parts.',
  'No panels, collage, UI overlay, or decorative frame.',
].join(' ');

export const ANIME_ANATOMY_RULES = [
  'Elegant stylized anime facial proportions.',
  'Expressive detailed anime eyes with layered iris colors, glossy highlights, and subtle reflective depth.',
  'Clean stylized neck and shoulder proportions.',
  'Balanced anime face shape.',
  'Dynamic layered hair silhouette with many separated strands, sharp highlights, and deep shadow shapes.',
  'Polished character-design anatomy.',
  'Attractive but tasteful anime character presentation.',
  'High-detail modern anime key visual face rendering, with clean line art and refined cel shading.',
].join(' ');

const ANIME_AVATAR_MODE_RULES = [
  'Head-and-shoulders portrait, square 1:1 aspect ratio.',
  'Eyes on the upper third of the frame.',
  'Shoulders touching the bottom edge.',
  'Natural frontal light, bright softly blurred indoor background.',
  'This image should work as a polished anime companion portrait while remaining clean, elegant, and visually readable.',
  'No full body.',
  'No neon lighting.',
  'No glossy 3D render.',
  'No dark low-key lighting.',
].join(' ');

export const ANIME_MODE_TO_PROMPT: Record<CompanionImagePromptMode, string> = {
  avatar: ANIME_AVATAR_MODE_RULES,
  send_pic: 'This should feel like a spontaneous anime-style picture sent in a chat, while still preserving a polished character illustration look.',
};

export const ANIME_TONE_TO_VISUAL: Record<string, string> = {
  warm:
    'Clean warm-neutral anime lighting with peach highlights, cool violet-gray shadows, and balanced skin tones. Avoid yellow or orange color grading.',
  cool:
    'Cool blue-violet anime lighting with crisp shadows, clean rim light, bright eye highlights, and refined modern contrast.',
  neutral:
    'Balanced modern anime lighting with cool-toned shadows, clean highlights, crisp contrast, and no yellow cast.',
  vibrant:
    'Vivid modern anime lighting with saturated accent colors, crisp cel shading, bright highlights, and clean cool shadows.',
  serious:
    'Dramatic modern anime lighting with deeper cool shadows, subtle rim light, controlled contrast, and no muddy warm tint.',

  'Casual y relajado':
    'Clean warm-neutral anime lighting with peach highlights, cool violet-gray shadows, and balanced skin tones. Avoid yellow or orange color grading.',
  'Formal y profesional':
    'Cool blue-violet anime lighting with crisp shadows, clean rim light, bright eye highlights, and refined modern contrast.',
  'Cariñoso y cercano':
    'Soft warm-neutral anime lighting with gentle peach highlights, cool shadow balance, and luminous but non-yellow skin.',
  'Divertido y juguetón':
    'Vivid modern anime lighting with saturated accent colors, crisp cel shading, bright highlights, and clean cool shadows.',
  'Serio y directo':
    'Dramatic modern anime lighting with deeper cool shadows, subtle rim light, controlled contrast, and no muddy warm tint.',
  'Inspirador y positivo':
    'Bright clean anime lighting with vivid accents, cool balanced shadows, and fresh saturated colors without yellow skin.',
  'Coloquial y natural':
    'Balanced modern anime lighting with cool-toned shadows, clean highlights, crisp contrast, and no yellow cast.',
  'Elegante y sofisticado':
    'Cool blue-violet anime lighting with refined contrast, clean rim light, glossy eye highlights, and polished modern atmosphere.',
};

export const ANIME_INTEREST_TO_BACKGROUND: Record<string, string> = {
  Tecnología: 'The background is a modern anime room with a desk setup, monitor glow, soft blue UI light, and clean cozy atmosphere.',
  'Arte y cultura': 'The background is a modern anime art studio with blurred canvases, soft ambient light, clean colors, and subtle depth.',
  Ciencia: 'The background is a clean anime study room with books, glass panels, soft cool light, and subtle sci-fi details.',
  Música: 'The background is an anime music room with instruments, soft stage-like light, and clean colorful ambience.',
  Literatura: 'The background is a cozy anime library or reading room with bookshelves, warm light, and soft depth.',
  Viajes: 'The background is a modern anime city street with soft evening light, clean perspective, and colorful signs.',
  'Moda y estilo': 'The background is a modern anime city street with boutique lights, clean colors, and stylish atmosphere.',
};

export const ANIME_DEFAULT_BACKGROUND = 'The background is a clean modern anime environment with soft depth, simple shapes, and refined color harmony.';

const ANIME_ARCHETYPE_PROMPTS: CompanionImageStyleConfig['archetypePrompts'] = {
  hostess: {
    identity: 'warm welcoming anime woman with a nurturing and emotionally safe presence',
    scene:
      'cozy sunlit breakfast nook with coffee, pastries, flowers, soft home details, clean warm light, and simple anime background depth',
    wardrobe: 'soft light-toned casual outfit, simple elegant styling, modest neckline',
    props: 'breakfast tray, coffee cup, small flowers',
    mood: 'gentle, comforting, intimate, approachable, soft smile',
    composition:
      'polished modern anime companion portrait with warm clean ambience, soft cel-animation lighting, vibrant clean colors, and upper-body or three-quarter framing',
    avoidances: ['No maid outfit, no exaggerated fanservice, no chibi style.'],
  },

  executive_female: {
    identity: 'polished executive anime woman with intelligent, composed presence',
    scene:
      'modern elegant office interior with glass, clean desks, city light reflections, soft professional lighting, and refined anime atmosphere',
    wardrobe: 'white blouse with refined dark business skirt or tailored office outfit',
    props: 'tablet, folder, or pen held naturally',
    mood: 'focused, trustworthy, composed, motivating, subtly warm',
    composition:
      'polished modern anime executive portrait with refined lighting, crisp highlights, clean color contrast, and upper-body or three-quarter framing',
    avoidances: ['No corporate logos, no fanservice, no exaggerated sparkles.'],
  },

  muse: {
    identity: 'creative bohemian anime woman with expressive eyes and artistic sensitivity',
    scene:
      'warm modern anime art studio with brushes, canvases, handmade textures, soft ambient lights, clean colors, and subtle depth',
    wardrobe: 'bohemian refined outfit with natural textures and tasteful layered details',
    props: 'paintbrushes, sketchbook, bracelets, subtle artistic accessories',
    mood: 'inspiring, intimate, expressive, thoughtful, emotionally open',
    composition:
      'polished modern anime artistic portrait with clean studio ambience, soft rim light, vibrant colors, and upper-body or three-quarter framing',
    avoidances: ['No excessive accessories, no fanservice, no chibi style.'],
  },

  hype_friend: {
    identity: 'young approachable anime hype friend with casual youthful lifestyle presence, genuine warmth, and uplifting confidence',
    scene:
      'warm bright indoor living space with soft natural light, cozy contemporary details, relaxed lifestyle atmosphere, and gentle anime lighting',
    wardrobe: 'oversized bomber jacket over a basic t-shirt, relaxed-fit jeans, casual youthful styling',
    props: 'coffee mug, headphones, or a small everyday object used naturally',
    mood: 'genuine, upbeat, warm, enthusiastic, encouraging, confident',
    composition:
      'natural modern anime lifestyle portrait with soft cel-animation lighting, relaxed candid energy, and upper-body or three-quarter framing',
    avoidances: ['No sexualized posing, no revealing outfit, no chibi style.'],
  },

  executive_male: {
    identity: 'confident executive anime man with polished presence and calm authority',
    scene:
      'modern high-rise office with city skyline, glass windows, clean corporate atmosphere, refined reflections, and soft evening anime light',
    wardrobe: 'tailored dark suit, white shirt, dark tie, polished business styling',
    props: 'watch, pocket square, or slim document folder used subtly',
    mood: 'composed, trustworthy, competent, calm, quietly authoritative',
    composition:
      'polished modern anime executive portrait with city lights, glass reflections, clean rim light, refined color contrast, and upper-body or three-quarter framing',
    avoidances: ['No corporate logos, no villain expression, no exaggerated luxury styling.'],
  },

  craftsman: {
    identity: 'grounded anime man with calm focused craftsman presence and reliable warmth',
    scene:
      'warm woodworking workshop with bench, hand tools, wood textures, practical ambient light, soft depth, and clean golden highlights',
    wardrobe: 'simple work shirt with leather or canvas apron, practical casual workwear',
    props: 'wood piece, hand tool, workbench details',
    mood: 'patient, grounded, authentic, reliable, quietly confident',
    composition:
      'polished modern anime craftsman portrait with warm workshop ambience, clean cel shading, strong readable silhouette, and upper-body or three-quarter framing',
    avoidances: ['No blacksmith armor, no dangerous tool action, no rugged caricature.'],
  },

  intellectual: {
    identity: 'thoughtful anime man with calm intellectual presence, cultural curiosity, and emotional openness',
    scene:
      'bright apartment studio with bookshelves, art prints, plants, kitchen hints, acoustic guitar, soft depth, and warm modern anime ambience',
    wardrobe: 'refined relaxed outfit with open light overshirt, dark trousers, simple layered styling',
    props: 'open book, acoustic guitar in the background, art print, coffee cup',
    mood: 'calm, introspective, cultured, emotionally open, quietly curious',
    composition:
      'calm modern anime portrait inside a luminous personal studio, warm ambient light, soft clean atmosphere, detailed eyes, and upper-body or three-quarter framing',
    avoidances: ['No wizard look, no school uniform, no gloomy academic cliche.'],
  },

  protector: {
    identity: 'strong disciplined anime man with protective presence, calm seriousness, and respectful strength',
    scene:
      'outdoor urban security setting with soft daylight, blurred patrol shapes, greenery or street depth behind, subtle dramatic atmosphere, and clean cool rim light',
    wardrobe: 'clean navy security-inspired uniform aesthetic, professional tactical belt, no real logos',
    props: 'radio, utility belt, sunglasses clipped to shirt, no weapon focus',
    mood: 'composed, protective, stable, vigilant, respectful',
    composition:
      'dramatic modern anime portrait with urban modern atmosphere, cool rim light, strong readable silhouette, clean cel-animation contrast, and upper-body or three-quarter framing',
    avoidances: ['No real police badges, no weapons drawn, no aggressive stance, no military armor or tactical costume.'],
  },
} satisfies Partial<
  Record<
    CompanionArchetypeId,
    CompanionImageStyleConfig['archetypePrompts'][CompanionArchetypeId]
  >
>;

export const ANIME_IMAGE_STYLE_CONFIG: CompanionImageStyleConfig = {
  buildPrompt: (gender: string, ethnicity: string, _toneKey?: string, age = COMPANION_DEFAULT_AGE) => {
    const ageDescriptor = buildAnimeAgeDescriptor(gender, age);
    const parts = [
      `Modern high-quality anime character illustration of ${ageDescriptor}.`,
      ...(ethnicity ? [ethnicity] : []),

      'Polished high-detail modern anime key visual style, not photorealistic.',
      'Contemporary anime character art with crisp confident line art, refined cel shading, and subtle soft gradients.',
      'The rendering should feel closer to a polished anime mobile game character illustration or premium anime key visual, not a flat TV anime screenshot.',
      'Clean sharp outlines with varied line weight.',
      'High-contrast cel shading with cool violet-gray shadow tones.',
      'Avoid yellow, orange, sepia, or muddy color grading.',
      'Skin tones must look clean, luminous, and naturally balanced, never yellow, orange, gray, or muddy.',
      'Expressive detailed anime eyes with layered iris colors, glossy catchlights, soft reflections, and delicate eyelash detail.',
      'Elegant stylized facial proportions with a refined modern anime look.',
      'Dynamic layered hair with many separated strands, glossy highlights, deep shadow shapes, and a clean readable silhouette.',
      'Rich but controlled color palette with saturated accents, crisp highlights, and clean contrast.',
      'Subtle cool rim light and polished anime atmosphere.',
      'Detailed anime face rendering, especially eyes, hair, lashes, and soft blush.',
      'Modern anime companion character design.',
      'Clean anime-style background with soft depth, simple shapes, and refined color harmony.',
      'The image should feel like a polished modern anime character portrait, not a fantasy painting, not splash art, not old-school anime, and not a realistic photo.',

      'Upper-body or three-quarter anime portrait composition.',
      'Face fully visible.',
      'Both eyes clearly visible.',
      'Clean readable silhouette.',
      'Single character only.',
      'No excessive or distracting accessories.',
    ];

    if (gender === 'woman') {
      parts.push(
        'Beautiful modern anime heroine design.',
        'Expressive eyes, delicate facial lines, soft confident expression.',
        'Flowing hair with detailed highlights, separated strands, and a clean silhouette.',
        'Stylish contemporary casual outfit, such as a fitted jacket, soft knit sweater, simple blouse, hoodie, overshirt, or modern streetwear-inspired top. The outfit should look like everyday anime fashion, not fantasy clothing, not armor, not costume-like, and not overly detailed.',
        'Skin tones should look clean and luminous, never yellow, orange, or muddy.',
      );
    } else if (gender === 'man') {
      parts.push(
        'Handsome modern anime male character design.',
        'Clearly masculine stylized features, calm confident expression.',
        'Textured layered hair with natural volume, separated strands, and sharp anime highlights.',
        'Stylish contemporary casual outfit, such as a clean jacket, hoodie, overshirt, knit sweater, simple shirt, or modern streetwear-inspired top. The outfit should look like everyday anime fashion, not fantasy clothing, not armor, not costume-like, and not overly detailed.',
        'Skin tones should look clean and luminous, never yellow, orange, or muddy.',
      );
    } else {
      parts.push(
        'Elegant androgynous modern anime character design.',
        'Balanced soft and defined facial lines.',
        'Layered hair with clean highlights, separated strands, and polished silhouette.',
        'Stylish contemporary casual outfit with clean shapes, simple layers, and modern anime fashion details. Not fantasy clothing, not armor, not costume-like, and not overly detailed.',
        'Skin tones should look clean and luminous, never yellow, orange, or muddy.',
      );
    }

    return parts.join(' ');
  },

  avoidances: [
    'No photorealism.',
    'No photographic skin texture.',
    'No 3D render.',
    'No CGI.',
    'No plastic skin.',
    'No fantasy armor.',
    'No fantasy costume.',
    'No overly ornate outfit.',
    'No painterly brush strokes.',
    'No oil painting look.',
    'No concept art look.',
    'No splash art composition.',
    'No magical aura.',
    'No excessive glowing particles.',
    'No chibi style.',
    'No old-school anime style.',
    'No washed-out colors.',
    'No yellow color cast.',
    'No orange skin.',
    'No sepia lighting.',
    'No muddy yellow or orange skin.',
    'No dull beige-dominant palette.',
    'No flat TV anime screenshot look.',
    'No overly simple face rendering.',
    'No plain flat hair shapes.',
    'No dull brown shadows.',
    'No muddy warm shadows.',
    'No Ghibli-like soft simplified rendering.',
    'No western cartoon style.',
    'No duplicate faces.',
    'No extra cropped heads.',
    'No side panels.',
    'No collage.',
    'No malformed eyes.',
    'No asymmetrical face distortion.',
    'No extra limbs.',
    'No extra hands.',
    'No text.',
    'No watermark.',
    'No framing marks.',
    'No guide lines.',
    'No UI elements.',
    'No interface overlay.',
    'No interface artifacts.',
  ].join(' '),

  quality: [
    'High-quality modern anime key visual illustration.',
    'Sharp clean line art with varied line weight.',
    'Crisp cel shading with controlled soft gradient shadows.',
    'Cool violet-gray shadow tones instead of yellow or orange shadows.',
    'Detailed expressive eyes with layered irises and glossy highlights.',
    'Layered hair highlights with separated strands and deep shadow shapes.',
    'Clean anime lighting with crisp contrast.',
    'Rich saturated accent colors with balanced skin tones.',
    'Clean modern anime character portrait.',
    'Strong readable silhouette.',
    'Polished but not painterly.',
    'Clean full-color digital anime illustration.',
  ].join(' '),

  archetypePrompts: ANIME_ARCHETYPE_PROMPTS,
};
