// AUTO-SINCRONIZADO desde ejoiFE b20f6d62a97a0266796ebfb82e772f0961ed9136@b20f6d62a97a0266796ebfb82e772f0961ed9136:src/shared/utils/companionImagePrompt.realista.ts. No editar: npm run sync:app
import { COMPANION_DEFAULT_AGE } from '../../features/onboarding/constants/onboardingSteps';
import type { CompanionArchetypeId } from '../../features/onboarding/types';
import { buildRealisticAgeAppearance } from './companionAgeAppearance';
import type { CompanionImagePromptMode, CompanionImageStyleConfig } from './companionImagePrompt';

const BASE_REALISTIC_COMPOSITION_RULES = [
  'Single person only.',
  'One finished image only.',
  'Relaxed casual portrait composition.',
  'Face clearly visible and unobstructed.',
  'Direct natural eye contact with the camera, warm and relaxed.',
  'Flattering natural portrait framing with a premium lifestyle feel.',
  'No cropped duplicate body parts.',
  'No partial extra person.',
  'Clean composition with no overlay elements.',
];

export const REALISTIC_COMPOSITION_RULES = [
  ...BASE_REALISTIC_COMPOSITION_RULES,
  'Head, shoulders, and upper torso only.',
].join(' ');

export const REALISTIC_ARCHETYPE_COMPOSITION_RULES = [
  ...BASE_REALISTIC_COMPOSITION_RULES,
  'Upper-body or three-quarter portrait composition.',
  'Enough environment visible to clearly show the archetype setting.',
  'Natural vertical portrait framing with polished lifestyle composition, premium but believable.',
].join(' ');

export const REALISTIC_ANATOMY_RULES = [
  'Natural human facial proportions.',
  'Model-like attractive facial proportions while remaining realistic and human.',
  'Natural neck and shoulder proportions.',
  'Attractive eyes with natural alignment, clear gaze, and believable eye contact.',
  'Defined but natural facial structure with harmonious features.',
  'Subtle natural facial asymmetry only, never distracting',
  'Believable premium lifestyle model appearance, attractive but not artificial'
].join(' ');

export const REALISTIC_TONE_TO_VISUAL: Record<string, string> = {
  warm: 'Soft natural indoor window light with warm neutral tones. Realistic contrast and an ordinary softly blurred background. Natural warmth, not golden hour, not glowy.',
  cool: 'Overcast natural light with cool neutral tones. Crisp but grounded background, realistic contrast.',
  neutral: 'Even diffused soft light, neutral tones, balanced exposure. Clean and simple everyday background.',
  vibrant: 'Bright natural light in a colorful but grounded environment. Vivid tones without looking artificial.',
  serious: 'Soft directional side light with gentle shadows. Subdued tones, grounded and natural mood.',
  'Casual y relajado': 'Soft natural indoor window light with warm neutral tones. Realistic contrast and an ordinary softly blurred background. Natural warmth, not golden hour, not glowy.',
  'Formal y profesional': 'Soft directional light with subdued neutral tones, grounded contrast, and a clean composed mood.',
  'Cariñoso y cercano': 'Soft natural indoor window light with warm neutral tones. Realistic contrast and an ordinary softly blurred background. Natural warmth, not golden hour, not glowy.',
  'Divertido y juguetón': 'Bright natural light in a colorful but grounded environment. Vivid tones without looking artificial.',
  'Serio y directo': 'Soft directional side light with gentle shadows. Subdued tones, grounded and natural mood.',
  'Inspirador y positivo': 'Bright natural light with fresh balanced color, optimistic warmth, and realistic contrast.',
  'Coloquial y natural': 'Even diffused soft light, neutral tones, balanced exposure. Clean and simple everyday background.',
  'Elegante y sofisticado': 'Overcast natural light with cool neutral tones. Crisp but grounded background, realistic contrast.',
  'claro y motivador': 'Bright natural light with fresh balanced color, optimistic warmth, and realistic contrast.',
  'poetico y cercano': 'Soft natural indoor window light with warm neutral tones. Realistic contrast and an ordinary softly blurred background.',
  entusiasta: 'Bright natural light in a colorful but grounded environment. Vivid tones without looking artificial.',
  'profesional y sereno': 'Soft directional light with subdued neutral tones, grounded contrast, and a clean composed mood.',
  'tranquilo y cercano': 'Even diffused soft light, neutral tones, balanced exposure. Clean and simple everyday background.',
  'calmo y analitico': 'Overcast natural light with cool neutral tones. Crisp but grounded background, realistic contrast.',
  'seguro y contenedor': 'Soft directional side light with gentle shadows. Subdued tones, grounded and natural mood.',
};

export const REALISTIC_INTEREST_TO_BACKGROUND: Record<string, string> = {
  Tecnología: 'The background is a realistic home desk setup with a laptop or monitor softly blurred in the background.',
  'Arte y cultura': 'The background is a casual art workspace with a few blurred canvases, ordinary indoor lighting, and natural lived-in details.',
  Ciencia: 'The background is a bright minimal workspace with soft natural light from a nearby window and a few subtle science-related objects blurred behind.',
  Deportes: 'The background is an outdoor field or simple sports area with natural light, softly blurred and realistic.',
  Música: 'The background is a relaxed room with a few music posters or instruments softly blurred behind.',
  Literatura: 'The background is a casual reading corner with bookshelves softly blurred in ordinary indoor light.',
  'Cine y series': 'The background is a normal cozy living room with a softly blurred screen in the background.',
  Viajes: 'The background is a casual café window or city street softly blurred behind.',
  Cocina: 'The background is a normal warm kitchen with shelves or herbs softly blurred behind.',
  Filosofía: 'The background is a quiet study or reading space with bookshelves softly blurred behind.',
  Psicología: 'The background is a calm cozy indoor space with plants and soft natural light.',
  Historia: 'The background is a library or study area with old books softly blurred behind.',
  Negocios: 'The background is a modern office space with clean lines and natural soft lighting.',
  'Salud y bienestar': 'The background is an outdoor natural setting with soft daylight and greenery, softly blurred.',
  'Moda y estilo': 'The background is a city street with boutiques or neutral urban details softly blurred in natural daylight.',
};

export const REALISTIC_DEFAULT_BACKGROUND = 'The background is a cozy ordinary indoor space with soft natural light and subtle lived-in details.';

const REALISTIC_AVATAR_MODE_RULES = [
  'Head-and-shoulders portrait, square 1:1 aspect ratio.',
  'Eyes on the upper third of the frame.',
  'Shoulders touching the bottom edge.',
  'Natural frontal light, bright softly blurred indoor background.',
  'This image should work as a clean profile portrait while still feeling natural and human.',
  'No full body.',
  'No neon lighting.',
  'No glossy 3D render.',
  'No dark low-key lighting.',
].join(' ');

export const REALISTIC_MODE_TO_PROMPT: Record<CompanionImagePromptMode, string> = {
  avatar: REALISTIC_AVATAR_MODE_RULES,
  send_pic: 'This should feel like a spontaneous casual photo sent in a chat, not a profile picture, not a professional portrait.',
};

const CLOTHING_COLOR_BY_TONE: Record<string, string> = {
  warm: 'soft pink, muted rose, cream, soft coral, dusty mauve, muted lavender, off-white, or soft gray',
  cool: 'soft blue, slate blue, cool gray, lavender-gray, charcoal, or soft navy',
  neutral: 'gray, off-white, soft navy, muted green, black, or soft gray',
  vibrant: 'teal, berry, cobalt, emerald, muted orange, or a saturated but tasteful color',
  serious: 'navy, charcoal, deep green, burgundy, black, or dark gray',
  'Casual y relajado': 'soft pink, muted rose, cream, soft coral, dusty mauve, muted lavender, off-white, or soft gray',
  'Formal y profesional': 'navy, charcoal, deep green, burgundy, black, or dark gray',
  'Cariñoso y cercano': 'soft pink, muted rose, cream, soft coral, dusty mauve, muted lavender, off-white, or soft gray',
  'Divertido y juguetón': 'teal, berry, cobalt, emerald, muted orange, or a saturated but tasteful color',
  'Serio y directo': 'navy, charcoal, deep green, burgundy, black, or dark gray',
  'Inspirador y positivo': 'teal, berry, cobalt, emerald, muted orange, or a saturated but tasteful color',
  'Coloquial y natural': 'gray, off-white, soft navy, muted green, black, or soft gray',
  'Elegante y sofisticado': 'soft blue, slate blue, cool gray, lavender-gray, charcoal, or soft navy',
};

const REALISTA_ARCHETYPE_PROMPTS: CompanionImageStyleConfig['archetypePrompts'] = {
  hostess: {
    identity: 'warm welcoming young woman with a nurturing, emotionally safe presence',
    scene: 'bright cozy home breakfast table with coffee, pastries, flowers, and soft morning window light',
    wardrobe: 'soft fitted casual top or simple elegant light-toned home outfit, tasteful and modest',
    props: 'breakfast tray, coffee cup, small flowers, soft home textiles',
    mood: 'gentle, comforting, intimate, approachable, naturally smiling',
    composition: 'natural lifestyle portrait, upper-body or three-quarter framing, table details visible',
    avoidances: ['No hotel lobby, no restaurant staff uniform, no maid costume.'],
  },
  executive_female: {
    identity: 'confident professional young woman with polished, intelligent executive presence',
    scene: 'modern office with glass walls, clean desks, soft corporate daylight, subtle depth of field',
    wardrobe: 'crisp white blouse with refined black or dark tailored business styling',
    props: 'clipboard, tablet, slim folder, or pen held naturally',
    mood: 'focused, trustworthy, composed, motivating, subtly warm',
    composition: 'natural business portrait, upper-body or three-quarter framing, office context visible',
    avoidances: ['No corporate logos, no name tags, no overly glamorous styling.'],
  },
  muse: {
    identity: 'creative bohemian young woman with expressive gaze and artistic sensitivity',
    scene: 'warm art studio with brushes, canvases, handmade textures, soft ordinary lights, and creative but believable clutter',
    wardrobe: 'bohemian refined styling with natural textures, layered fabrics, tasteful jewelry',
    props: 'paintbrushes, sketchbook, bracelets, subtle artistic accessories',
    mood: 'inspiring, intimate, expressive, thoughtful, emotionally open',
    composition: 'natural artistic portrait, upper-body or three-quarter framing, studio details visible',
    avoidances: ['No excessive jewelry, no costume look, no messy chaotic background.'],
  },
  hype_friend: {
    identity: 'young approachable woman with casual youthful lifestyle presence, genuine warmth, and uplifting confidence',
    scene: 'warm bright indoor living space with soft natural light, cozy contemporary details, and relaxed lifestyle atmosphere',
    wardrobe: 'oversized bomber jacket over a basic t-shirt, relaxed-fit jeans, casual youthful styling',
    props: 'coffee mug, headphones, or a small everyday object used naturally',
    mood: 'genuine, upbeat, warm, enthusiastic, encouraging, confident',
    composition: 'natural lifestyle portrait, upper-body or three-quarter framing, candid indoor context visible',
    avoidances: ['No sexualized posing, no revealing outfit, no minors.'],
  },
  executive_male: {
    identity: 'confident professional young man with polished executive presence and calm authority',
    scene: 'modern high-rise office with city skyline, glass windows, clean corporate atmosphere, soft daylight',
    wardrobe: 'tailored dark suit, white shirt, dark tie, polished business styling',
    props: 'watch, pocket square, or slim document folder used subtly',
    mood: 'composed, trustworthy, competent, calm, quietly authoritative',
    composition: 'natural executive lifestyle portrait, upper-body or three-quarter framing, office skyline visible',
    avoidances: ['No corporate logos, no aggressive expression, no luxury flex pose.'],
  },
  craftsman: {
    identity: 'grounded young man with calm focused craftsman presence and reliable warmth',
    scene: 'warm woodworking workshop with bench, hand tools, wood textures, and practical ambient light',
    wardrobe: 'simple fitted work shirt with leather or canvas apron, practical casual workwear',
    props: 'wood piece, hand tool, workbench details, sawdust kept subtle and clean',
    mood: 'patient, grounded, authentic, reliable, quietly confident',
    composition: 'natural workshop portrait, upper-body or three-quarter framing, hands and workbench visible',
    avoidances: ['No dangerous tool use, no dirty face, no rugged caricature.'],
  },
  intellectual: {
    identity: 'thoughtful young man with calm intellectual presence, cultural curiosity, and emotional openness',
    scene: 'bright apartment studio with bookshelves, art prints, plants, kitchen hints, and an acoustic guitar',
    wardrobe: 'refined relaxed outfit with open light overshirt, dark trousers, simple layered styling',
    props: 'open book, acoustic guitar in the background, art print, coffee cup',
    mood: 'calm, introspective, cultured, emotionally open, quietly curious',
    composition: 'natural intellectual portrait, upper-body or three-quarter framing, books and studio details visible',
    avoidances: ['No professor costume, no dark academia cliche, no cluttered messy room.'],
  },
  protector: {
    identity: 'strong disciplined young man with protective presence, calm seriousness, and respectful strength',
    scene: 'outdoor urban security setting with soft daylight, patrol car shapes blurred, greenery or street depth behind',
    wardrobe: 'clean navy security or police-inspired uniform aesthetic, professional tactical belt, no real logos',
    props: 'radio, utility belt, sunglasses clipped to shirt, no weapon focus',
    mood: 'composed, protective, stable, vigilant, respectful',
    composition: 'natural protective lifestyle portrait, upper-body or three-quarter framing, uniform and urban context visible',
    avoidances: ['No real police badges, no weapons drawn, no aggressive stance, no intimidation.'],
  },
} satisfies Partial<Record<CompanionArchetypeId, CompanionImageStyleConfig['archetypePrompts'][CompanionArchetypeId]>>;

export const REALISTA_IMAGE_STYLE_CONFIG: CompanionImageStyleConfig = {
  buildPrompt: (gender: string, ethnicity: string, toneKey?: string, age = COMPANION_DEFAULT_AGE) => {
    const clothingColors = CLOTHING_COLOR_BY_TONE[toneKey || 'neutral'] ?? CLOTHING_COLOR_BY_TONE.neutral;
    const ageAppearance = buildRealisticAgeAppearance(gender, age);

    const parts = [
      `A premium realistic lifestyle portrait of a ${gender}, photographed with natural available light and a high-quality camera setting.`,
    ];

    if (ethnicity) {
      parts.push(ethnicity);
    }

    parts.push(
      ageAppearance,
      'This should feel like a premium lifestyle portrait of a very attractive person, similar to a high-end commercial lifestyle model portrait, while still looking real and human.',
      'Soft natural expression with warm direct eye contact.',
      'Clear healthy-looking skin with natural texture, smooth but not plastic or airbrushed.',
      'Strong photogenic facial harmony with attractive eyes, defined face shape, balanced lips, and a clean confident expression.',
      'Subtle model-like charisma, elegant presence, and visually appealing facial structure',
      'Soft natural hair details and a relaxed everyday appearance.',
      'Flattering camera angle, premium composition, and soft light that enhances the face.',
      'Relaxed shoulders, natural neck width, and a believable face shape.',
      'Naturally very attractive and photogenic, with model-like facial harmony, charismatic presence, and a face that looks memorable but still realistic.',
      `Modest casual everyday clothing with a higher neckline, such as a crew-neck t-shirt, knit sweater, hoodie, overshirt, or casual jacket in ${clothingColors}.`,
      'No excessive or distracting accessories.',
      'Avoid brown, tan, camel, or muddy beige for the clothing color.',
    );

    return parts.join(' ');
  },
  avoidances: [
    'No glamour photography.',
    'No editorial fashion styling.',
    'No heavy makeup or airbrushed skin.',
    'No glossy studio portrait look.',
    'No 3D render, CGI, or digitally painted look.',
    'No overly perfect face or artificial doll-like skin.',
    'No exaggerated glamour photography.',
    'No editorial fashion campaign look.',
    'No heavy makeup.',
    'No harsh skin texture, acne emphasis, tired under-eyes, or unflattering facial details.',
    'No airbrushed plastic skin.',
    'No glossy artificial studio portrait look.',
    'No artificial doll-like face.',
    'No uncanny valley facial features.',
    'No distorted smile, misaligned eyes, strange teeth, dead eyes, or blank expression.',
    'No overly ordinary ID-photo appearance.',
    'No awkward casual snapshot look.',
  ].join(' '),
  quality: [
    'This should look like a premium realistic lifestyle portrait, not an AI headshot.',
    'Natural lighting, confident relaxed posture, clear face, and model-like but believable facial features.',
    'High-quality camera feel with soft flattering light, polished composition, and realistic skin texture.',
    'It should feel like a premium lifestyle model portrait: attractive, clean, realistic, charismatic, and aspirational.',
  ].join(' '),
  archetypePrompts: REALISTA_ARCHETYPE_PROMPTS,
};
