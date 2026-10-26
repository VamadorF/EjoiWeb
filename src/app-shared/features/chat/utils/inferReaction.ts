// AUTO-SINCRONIZADO desde ejoiFE 9234854dc9f9992b39b7f61dfb0e02b768be467d@9234854dc9f9992b39b7f61dfb0e02b768be467d:src/features/chat/utils/inferReaction.ts. No editar: npm run sync:app
/**
 * Heurística local para inferir la reacción instantánea del compañante a partir
 * del texto que el usuario acaba de enviar.
 *
 * Estrategia: scoring multi-categoría. Cada keyword/patrón aporta puntos a su
 * categoría; gana la categoría de mayor score si supera un umbral mínimo.
 * Algunas señales contextuales (sarcasmo, broma explícita, gritos, preguntas)
 * se aplican como modificadores tras el primer pase.
 *
 * Cobertura específica:
 *   - Modismos chilenos en cada categoría (filete, fome, la raja, qué fome,
 *     cresta, weón, cachai, etc.).
 *   - Marcadores de sarcasmo (claro que sí, sí claro, obviamente, qué original).
 *   - Marcadores de broma/chiste (es chiste, es broma, te sabes el de…).
 *   - Estados emocionales sutiles (cansancio, ansiedad, miedo, aburrimiento).
 *   - Confesiones, hipotéticos, reflexiones, esperanza.
 *   - Comida (rica → celebrate; asquerosa → disgust).
 */

import type { InferReactionInferenceSource, ReactionKind } from '../types';

/** Transiciones donde el nuevo signo choca con el tono previo: exigen score más alto. */
export const CONFLICTING_PAIRS: Partial<Record<ReactionKind, ReactionKind[]>> = {
  tender: ['laugh', 'celebrate', 'love'],
  shock: ['thinking', 'curious'],
};

/**
 * Apócopes y formas coloquiales chilenas → forma expandida antes de quitar tildes.
 * Las claves se resuelven en minúsculas; se recorta puntuación colgante del token.
 */
const CHILEAN_CONTRACTIONS: Record<string, string> = {
  toy: 'estoy',
  stoy: 'estoy',
  ta: 'está',
  tay: 'estás',
  vai: 'vas',
  po: 'pues',
  weon: 'weón',
  weona: 'weona',
  na: 'nada',
};

const tokenLookupKey = (token: string): string =>
  token
    .toLowerCase()
    .replace(/^[\u00bf\u00a1"'([{]+/, '')
    .replace(/[.,;:!?'"')\]}…]+$/u, '');

const expandContractions = (text: string): string =>
  text
    .split(/\s+/)
    .map((w) => {
      const key = tokenLookupKey(w);
      const expanded = key ? CHILEAN_CONTRACTIONS[key] : undefined;
      return expanded ?? w;
    })
    .join(' ');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const normalize = (input: string): string =>
  input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

/** Clave estable para mapear topics del backend (misma lógica que `normalize`). */
const topicLookupKey = (label: string): string => normalize(label);

interface ScoreRule {
  patterns: readonly RegExp[];
  weight: number;
}

/** Boundary "amigable": delimitado por inicio/fin o caracteres no alfanuméricos. */
const wb = (s: string): RegExp => new RegExp(`(?:^|[^a-z0-9])${s}(?:[^a-z0-9]|$)`);

// ---------------------------------------------------------------------------
// Reglas por categoría (con peso)
// ---------------------------------------------------------------------------

const RULES: Record<ReactionKind, readonly ScoreRule[]> = {
  // === love ================================================================
  love: [
    {
      weight: 4,
      patterns: [
        wb('te quiero'),
        wb('te amo'),
        wb('te adoro'),
        wb('me encantas'),
        wb('eres lo mejor'),
        wb('eres mi todo'),
        wb('eres lo m[aá]s'),
        wb('estoy enamorad[oa]?'),
        wb('eres mi vida'),
        wb('mi cielo'),
        wb('mi vida'),
      ],
    },
    {
      weight: 2,
      patterns: [
        wb('eres especial'),
        wb('eres important[ea]'),
        wb('me importas'),
        wb('gracias por estar'),
        wb('mi amor'),
        wb('cari[nñ]o|cari[nñ][oa]|carino'),
        wb('me haces feliz'),
        wb('me alegras'),
        wb('me alegras el dia'),
        wb('contigo todo'),
        wb('no quiero perderte'),
        wb('te necesito'),
        wb('chiqui|chiquit[oa]'),
        wb('amorcit[oa]'),
        wb('tesoro'),
      ],
    },
  ],

  // === tender ==============================================================
  tender: [
    {
      weight: 4,
      patterns: [
        wb('estoy mal'),
        wb('me siento mal'),
        wb('estoy triste'),
        wb('me siento triste'),
        wb('me siento solo'),
        wb('me siento sola'),
        wb('me deprimo'),
        wb('estoy deprimid[oa]'),
        wb('estoy depre'),
        wb('no puedo m[aá]s'),
        wb('quiero llorar'),
        wb('estoy llorando'),
        wb('tengo ganas de llorar'),
        wb('me quiero morir'),
        wb('ya no aguanto'),
        wb('estoy harto'),
        wb('estoy harta'),
        wb('estoy chato'),
        wb('estoy chata'),
        wb('me tiene chato'),
        wb('me tiene chata'),
      ],
    },
    {
      weight: 3,
      patterns: [
        wb('lloro|llore|llor[ée]'),
        wb('extra[nñ]o'),
        wb('extra[nñ]ar'),
        wb('te extra[nñ]o'),
        wb('lo extra[nñ]o'),
        wb('la extra[nñ]o'),
        wb('me dej[oó]'),
        wb('me dejaron'),
        wb('me abandon[oó]'),
        wb('se muri[oó]'),
        wb('falleci[oó]'),
        wb('muri[oó]'),
        wb('rompimos'),
        wb('terminamos'),
        wb('me cortaron'),
        wb('me corte con'),
        wb('me dejaron en visto'),
        wb('estoy ansios[oa]'),
        wb('tengo ansiedad'),
        wb('me da ansiedad'),
        wb('ataque de panico'),
        wb('crisis de panico'),
        wb('panic attack'),
      ],
    },
    {
      weight: 2,
      patterns: [
        wb('estoy roto'),
        wb('estoy rota'),
        wb('mal d[ií]a'),
        wb('horrible d[ií]a'),
        wb('me siento perdid[oa]'),
        wb('no se que hacer con mi vida'),
        wb('me duele'),
        wb('dolor'),
        wb('estoy cansad[oa]'),
        wb('agotad[oa]'),
        wb('me muero de sue[nñ]o'),
        wb('no di mas'),
        wb('no doy mas'),
        wb('estoy reventad[oa]'),
        wb('estoy quemad[oa]'),
        wb('burnout'),
        wb('tengo miedo'),
        wb('me da miedo'),
        wb('miedo'),
        wb('asustad[oa]'),
        wb('estoy nervios[oa]'),
        wb('me siento vac[ií][oa]'),
        wb('odio mi vida'),
        wb('odio mi pega'),
        wb('odio el trabajo'),
        wb('mi mascot[ae] est[aá] enferm[oa]'),
        wb('mi gatit[oa]'),
        wb('mi perrit[oa]'),
        wb('lata'),
        wb('que lata'),
        wb('pal pico'),
        wb('cag[aá] pal balde'),
        wb('mala onda'),
      ],
    },
  ],

  // === celebrate ===========================================================
  celebrate: [
    {
      weight: 4,
      patterns: [
        wb('aprob[eé]'),
        wb('me promovieron'),
        wb('me ascendieron'),
        wb('lo logre'),
        wb('lo consegu[ií]'),
        wb('me gradue'),
        wb('me case'),
        wb('me casaron'),
        wb('me dieron el trabajo'),
        wb('consegu[ií] (el|un) trabajo'),
        wb('cumplea[nñ]os'),
        wb('feliz cumplea[nñ]os'),
        wb('es mi cumple'),
        wb('es mi cumplea[nñ]os'),
        wb('me dieron la beca'),
        wb('gane la beca'),
        wb('me publicaron'),
        wb('me aceptaron'),
        wb('me eligieron'),
        wb('quede con el cargo'),
        wb('paso el examen'),
      ],
    },
    {
      weight: 3,
      patterns: [
        wb('estoy feliz'),
        wb('estoy contento'),
        wb('estoy contenta'),
        wb('super feliz'),
        wb('super contenta'),
        wb('super contento'),
        wb('me siento feliz'),
        wb('felicidad'),
        wb('lo mejor que me ha pasado'),
      ],
    },
    {
      weight: 2,
      patterns: [
        wb('gane'),
        wb('me gane'),
        wb('consegu[ií]'),
        wb('me regalaron'),
        wb('me compre'),
        wb('me dieron'),
        wb('lo hice'),
        wb('felicit[oa]me'),
        wb('felicidades'),
        wb('felicitaciones'),
        wb('vamos!?'),
        wb('lets go'),
        wb('vamos? que si'),
        wb('por fin'),
        wb('finalmente lo'),
        wb('termine de'),
        wb('termin[eé] mi'),
        wb('llegue a'),
        wb('llegu[eé] a casa'),
        // Modismos chilenos positivos:
        wb('filete'),
        wb('la raja'),
        wb('bac[aá]n'),
        wb('chori'),
        wb('weno'),
        wb('buena onda'),
        wb('po la raja'),
        wb('lo m[aá]s'),
        wb('regio'),
        wb('genial'),
        wb('exquisit[oa]'),
        wb('rico'),
        wb('riqu[ií]simo'),
        wb('delicios[oa]'),
        wb('estaba buen[ií]simo'),
        wb('me encant[oó]'),
        wb('lo amo'),
        wb('lo adoro'),
      ],
    },
  ],

  // === fire / perfect (hype cotidiano y “cerrado”: 🔥 💯 sin depender sólo 🎉) ==
  fire: [
    {
      weight: 4,
      patterns: [
        wb('me encanta la idea'),
        wb('me encanto la idea'),
        wb('suena brutal'),
        wb('suena increible'),
        wb('suena incre[ií]ble'),
        wb('esto va a estar buenisimo'),
        wb('esto va a estar buen[ií]simo'),
        wb('me prende ese plan'),
        wb('quiero ese plan'),
        wb('necesito ese plan'),
        wb('lit'),
        wb('estuvo lit'),
        wb('on fire'),
        wb('that.?s lit'),
      ],
    },
  ],
  perfect: [
    {
      weight: 5,
      patterns: [
        wb('mil por ciento'),
        wb('mil por mil'),
        wb('mil %'),
        wb('mil poriento'),
      ],
    },
    {
      weight: 4,
      patterns: [
        wb('sellad[ií]simo'),
        wb('selladisimo'),
        wb('plan sellado'),
        wb('sellado ese plan'),
        wb('sellado ese'),
        wb('as[ií] nom[aá]s'),
        wb('as[ií] no m[aá]s'),
        wb('sale perfect'),
        wb('sale perfectamente'),
        wb('perfecto ese plan'),
        wb('perfecto ese'),
        wb('perfecto as[ií]'),
        wb('esto queda mil'),
      ],
    },
  ],

  // === disgust =============================================================
  disgust: [
    {
      weight: 4,
      patterns: [
        wb('asco'),
        wb('asqueros[oa]s?'),
        wb('puaj'),
        wb('guacala'),
        wb('guacatela'),
        wb('me da nauseas'),
        wb('me dan nauseas'),
        wb('vomite'),
        wb('vomit[eé]'),
        wb('repugnante'),
        wb('asqueante'),
        wb('me dio arcadas'),
        wb('me dieron arcadas'),
        wb('hediondo'),
        wb('apesta'),
        wb('huele a muerto'),
      ],
    },
    {
      weight: 2,
      patterns: [
        wb('que asco'),
        wb('que asqueros[oa]'),
        wb('que feo'),
        wb('horrible'),
        wb('inmundo'),
        wb('cochino'),
        wb('cochinad[a]'),
        wb('mugriento'),
      ],
    },
  ],

  // === laugh ===============================================================
  laugh: [
    {
      weight: 4,
      patterns: [
        /\bjaja+\b/,
        /\bjeje+\b/,
        /\bjiji+\b/,
        /\bjojo+\b/,
        /\bjojoji+\b/,
        /\bja{2,}\b/,
        /\bha+ha+\b/,
        /\bjajaja+\b/,
        /\blol\b/,
        /\blmao\b/,
        /\brofl\b/,
        /\bxd+\b/,
        /\bkek+\b/,
        /\balv\b/,
        /:v\b/,
        /\bah[aá][aá]+\b/,
        wb('es chiste'),
        wb('es broma'),
        wb('estoy bromeando'),
        wb('era broma'),
        wb('es talla'),
        wb('era talla'),
        wb('estoy taller[oa]'),
        wb('te sabes el de'),
        wb('te cuento un chiste'),
        wb('cu[aá]l es el colmo'),
        wb('por que (la|el|los|las) .* cruzo'),
      ],
    },
    {
      weight: 8,
      patterns: [
        wb('(?:solo )?(?:te )?estaba (?:molestando|webiando|hueveando|jodiendo)'),
        wb('(?:solo )?te molesto nom[aá]s'),
        wb('nom[aá]s te molestaba'),
        wb('nom[aá]s te molesto'),
      ],
    },
    {
      weight: 3,
      patterns: [
        wb('me cague de risa'),
        wb('me morí de risa'),
        wb('me mor[ií] de risa'),
        wb('me mate de risa'),
        wb('llore de risa'),
        wb('llor[eé] de risa'),
        wb('me hace cagar de risa'),
        wb('mato de risa'),
        wb('matandome de risa'),
        wb('chistoso'),
        wb('graciosis[mn]o'),
        wb('comiqu[ií]simo'),
      ],
    },
    {
      weight: 2,
      patterns: [
        wb('que (chistoso|gracioso|risa|comico|c[oó]mic[oa])'),
        wb('me hace reir'),
        wb('me re[ií]'),
        wb('reirme'),
        wb('re[ií]me un rato'),
        wb('humor'),
        wb('me dio risa'),
      ],
    },
  ],

  // === curious =============================================================
  curious: [
    {
      weight: 4,
      patterns: [
        wb('sabias que'),
        wb('dato curioso'),
        wb('astronomia'),
        wb('astrofisica'),
        wb('astronauta'),
        wb('agujero negro'),
        wb('cosmos'),
        wb('universo'),
        wb('galaxia'),
        wb('via lactea'),
        wb('big bang'),
        wb('cuantica'),
        wb('cuantico'),
        wb('mecanica cuantica'),
        wb('relatividad'),
        wb('einstein'),
        wb('newton'),
        wb('darwin'),
        wb('arqueologia'),
        wb('mitologia'),
        wb('paleontologia'),
        wb('dinosaurios?'),
        wb('biologia'),
        wb('evolucion'),
        wb('genetica'),
        wb('adn|dna'),
        wb('neurociencia'),
        wb('psicologia evolutiva'),
        wb('antropologia'),
        wb('civilizaci[oó]n antigua'),
        wb('historia (antigua|griega|romana|egipcia|medieval)'),
        wb('hieroglif|jeroglif'),
        wb('piramides?'),
        wb('mayas?'),
        wb('aztecas?'),
        wb('incas?'),
        wb('nazca'),
        wb('rapa nui'),
        wb('moai'),
      ],
    },
    {
      weight: 2,
      patterns: [
        wb('planeta'),
        wb('planetas'),
        wb('estrella'),
        wb('estrellas'),
        wb('marte'),
        wb('jupiter'),
        wb('saturno'),
        wb('venus'),
        wb('mercurio'),
        wb('luna'),
        wb('eclipse'),
        wb('meteorito'),
        wb('cometa'),
        wb('ciencia'),
        wb('cientific[oa]s?'),
        wb('investigacion'),
        wb('investigaci[oó]n'),
        wb('estudio nuevo'),
        wb('publicaron un paper'),
        wb('paper'),
        wb('articulo cientifico'),
        wb('misterio'),
        wb('misterios[oa]s?'),
        wb('curios[oa]'),
        wb('inusual'),
        wb('teoria'),
        wb('teor[ií]a'),
        wb('hipotesis'),
        wb('descubrieron'),
        wb('descubrimiento'),
        wb('descubri'),
        wb('investigaron'),
        wb('experimento'),
        wb('vi un documental'),
        wb('le[ií] un articulo'),
        wb('le[ií] un libro'),
        wb('te tengo que confesar'),
        wb('te quiero contar algo'),
        wb('te quiero decir algo'),
        wb('tengo un secreto'),
        wb('te vas a sorprender'),
        wb('mira lo que encontre'),
      ],
    },
  ],

  // === thinking ============================================================
  thinking: [
    {
      weight: 4,
      patterns: [
        wb('que opinas'),
        wb('que piensas'),
        wb('que pensas'),
        wb('cual es tu opinion'),
        wb('cu[aá]l es tu opini[oó]n'),
        wb('crees que'),
        wb('cre[eé]s en'),
        wb('crees en'),
        wb('tiene sentido'),
        wb('sentido de la vida'),
        wb('proposito de la vida'),
        wb('prop[oó]sito de la vida'),
        wb('filosofia'),
        wb('filos[oó]fic[oa]'),
        wb('etica'),
        wb('moral'),
        wb('moralidad'),
        wb('dilema'),
        wb('encrucijada'),
        wb('cu[aá]l es la diferencia entre'),
        wb('por qu[eé] existimos'),
        wb('para qu[eé] estamos aqu[ií]'),
        wb('hay dios'),
        wb('existe dios'),
        wb('despues de la muerte'),
        wb('despu[eé]s de la muerte'),
        wb('libre albedrio'),
      ],
    },
    {
      weight: 3,
      patterns: [
        wb('imaginate'),
        wb('imag[ií]nate'),
        wb('imagina que'),
        wb('imag[ií]nate que'),
        wb('si pudieras'),
        wb('que harias si'),
        wb('qu[eé] har[ií]as si'),
        wb('y si'),
        wb('hipotetic[oa]'),
        wb('hipot[eé]tic[oa]'),
        wb('en teoria'),
        wb('en teor[ií]a'),
      ],
    },
    {
      weight: 2,
      patterns: [
        wb('no se que hacer'),
        wb('no s[eé] qu[eé] hacer'),
        wb('no se si'),
        wb('no s[eé] si'),
        wb('tengo dudas'),
        wb('tengo una duda'),
        wb('estoy pensando'),
        wb('me pregunto'),
        wb('reflexion'),
        wb('reflexionando'),
        wb('reflex[ií]on'),
        wb('necesito pensar'),
        wb('quiero pensar'),
        wb('darle una vuelta'),
        wb('estoy meditando'),
        wb('hmm'),
        wb('mmm'),
        wb('mhm'),
        wb('ojal[aá]'),
        wb('espero que'),
        wb('tengo fe'),
        wb('quiz[aá]s?'),
        wb('quizas'),
        wb('tal vez'),
        wb('a lo mejor'),
        wb('me da que pensar'),
        wb('aydame a decidir'),
        wb('ay[uú]dame a decidir'),
      ],
    },
  ],

  // === surprise ============================================================
  surprise: [
    {
      weight: 4,
      patterns: [
        wb('adivina'),
        wb('adivina que'),
        wb('adivina qu[eé]'),
        wb('no vas a creer'),
        wb('no me lo vas a creer'),
        wb('no creer[aá]s'),
        wb('tengo una sorpresa'),
        wb('tengo noticias'),
        wb('tengo una noticia'),
        wb('tengo novedad'),
        wb('tengo una novedad'),
        wb('me paso algo'),
        wb('me pas[oó] algo'),
        wb('paso algo'),
        wb('pas[oó] algo'),
        wb('mira esto'),
        wb('me acaba de pasar'),
        wb('acaba de pasar'),
        wb('a que no sabes'),
        wb('a que no adivinas'),
      ],
    },
    {
      weight: 2,
      patterns: [
        wb('novedad'),
        wb('sorpresa'),
        wb('imaginate que'),
        wb('finalmente'),
        wb('por fin'),
        wb('al fin'),
        wb('wow'),
        wb('whoa'),
        wb('uau'),
        wb('guau'),
        wb('dios mio'),
        wb('dios m[ií]o'),
        wb('omg'),
        wb('o mi dios'),
        wb('quien lo dir[ií]a'),
        wb('quien iba a decir'),
        wb('jam[aá]s pens[eé]'),
        wb('nunca pens[eé]'),
        wb('jamas pense'),
        wb('nunca pense'),
        wb('te juro'),
        wb('en serio'),
        wb('por fin paso'),
      ],
    },
  ],

  // === shock (también recibe puntos por gritos / signos en runtime) =========
  shock: [
    {
      weight: 3,
      patterns: [
        wb('cresta'),
        wb('chucha'),
        wb('qu[eé] chucha'),
        wb('puta la wea'),
        wb('la wea'),
        wb('la we[oa]'),
        wb('we[oa]n? la we[oa]'),
        wb('ctm'),
        wb('csm'),
        wb('mierda'),
        wb('joder'),
        wb('hostia'),
        wb('coño'),
        wb('co[nñ]o'),
        wb('no manches'),
        wb('no mames'),
        wb('what the hell'),
        wb('wtf'),
        wb('no puede ser'),
        wb('imposible'),
      ],
    },
  ],

  // === question / typing (sólo se llenan en runtime por signos / fallback) ==
  question: [
    { weight: 0, patterns: [] },
  ],
  typing: [
    { weight: 0, patterns: [] },
  ],

  // === moai ================================================================
  // 🗿 Desinterés explícito, aburrimiento fuerte ante el tema, o cara de piedra
  // (complementario a la espontánea tras ~IDLE_AFK_REACTION_MS en el hook).
  moai: [
    {
      weight: 8,
      patterns: [
        wb('me da igual'),
        wb('me da igual (todo|esto|eso)'),
        wb('me da lo mismo'),
        wb('paso igual'),
      ],
    },
    {
      weight: 6,
      patterns: [
        wb('no me interesa(?: nada| mucho)?'),
        wb('cero inter[eé]s'),
        wb('cero interes'),
        wb('sin inter[eé]s en eso'),
        wb('sin inter[eé]s de verdad'),
        wb('no me llama la atenci[oó]n'),
        wb('me aburro'),
        wb('eso me aburre'),
      ],
    },
    {
      weight: 8,
      patterns: [
        wb('\\bes fome\\b'),
        wb('\\besta fome\\b'),
        wb('\\bestuvo fome\\b'),
        wb('me parece fome'),
        wb('me parece (re(contra)\\s*)?fome'),
        wb('que (tan )?fome'),
      ],
    },
    {
      weight: 5,
      patterns: [
        wb('no importa ese tema'),
        wb('paso por alto'),
        wb('paso pagando'),
        wb('eso es muy fome'),
        wb('que fome eso'),
        wb('tan fome'),
        wb('recontra fome'),
        wb('que aburridor'),
        wb('muy pesad[oa]s?'),
        wb('eso es muy pesado'),
        wb('cero ganas(?: de saber)?'),
        wb('me da pereza ese tema'),
        wb('no quiero saber de eso'),
        wb('cambiamos de tema'),
        wb('cambiemos el tema'),
        wb('hay que cambiar de tema'),
        wb('paso de ese tema'),
        wb('paso de eso'),
      ],
    },
    {
      weight: 5,
      patterns: [
        wb('que ladilla'),
        wb('que paja(?: con eso)?'),
        wb('que webiad[oa]'),
      ],
    },
  ],

  bored: [
    { weight: 0, patterns: [] },
  ],
  sleepy: [
    { weight: 0, patterns: [] },
  ],

  // === proud ===============================================================
  // Logros reportados por el usuario. El companion celebra con orgullo.
  proud: [
    {
      weight: 4,
      patterns: [
        wb('me ascendieron'),
        wb('me promovieron'),
        wb('me dieron el ascenso'),
        wb('me dieron el trabajo'),
        wb('me titule'),
        wb('me titul[eé]'),
        wb('me gradue'),
        wb('me gradu[eé]'),
        wb('aprob[eé] el examen'),
        wb('pas[eé] el examen'),
        wb('gane (el|la|un|una) (premio|beca|concurso|competencia|torneo)'),
        wb('publiqu[eé] mi (libro|articulo|paper)'),
        wb('lo logr[eé]'),
        wb('lo consegu[ií]'),
      ],
    },
    {
      weight: 2,
      patterns: [
        wb('estoy orgullos[oa]'),
        wb('me siento orgullos[oa]'),
        wb('me felicitaron'),
        wb('me reconocieron'),
        wb('cumpl[ií] mi meta'),
        wb('cumpl[ií] mi objetivo'),
        wb('por fin lo (hice|consegu[ií])'),
      ],
    },
  ],

  // === shy =================================================================
  // Piropos / halagos dirigidos al companion sobre apariencia o cualidades.
  // Diferente de love (declaración) o tender (consuelo).
  shy: [
    {
      weight: 4,
      patterns: [
        wb('eres (muy )?(linda|hermosa|preciosa|bonita|bella|guapa|guapo|lindo|hermoso|precioso)'),
        wb('te ves (muy )?(linda|hermosa|preciosa|bonita|bella|guapa|guapo|lindo|hermoso|precioso)'),
        wb('que (linda|hermosa|preciosa|bonita|bella|guapa) eres'),
        wb('qu[eé] (linda|hermosa|preciosa|bonita|bella|guapa) eres'),
        wb('te ves (genial|increible|incre[ií]ble|espectacular)'),
        wb('me encanta tu (sonrisa|cara|mirada|voz|forma de ser)'),
      ],
    },
    {
      weight: 2,
      patterns: [
        wb('eres (un|una) (encanto|amor|sol|primor)'),
        wb('me derrito'),
        wb('me sonrojo'),
        wb('me tienes loc[oa]'),
      ],
    },
  ],

  // === nostalgic ===========================================================
  // Recuerdos, añoranzas, referencias a un pasado.
  nostalgic: [
    {
      weight: 4,
      patterns: [
        wb('extra[nñ]o (cuando|aquellos|los tiempos|esos d[ií]as)'),
        wb('extra[nñ]o mucho'),
        wb('echo de menos'),
        wb('como en los viejos tiempos'),
        wb('aquellos tiempos'),
        wb('cuando era (ni[nñ]o|ni[nñ]a|chico|chica|joven|peque[nñ]o|peque[nñ]a)'),
        wb('cuando ten[ií]a (\\d+|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|dieciseis|veinte) a[nñ]os'),
      ],
    },
    {
      weight: 2,
      patterns: [
        wb('recuerdo cuando'),
        wb('me acuerdo de cuando'),
        wb('hace (mucho|tanto) (tiempo|que)'),
        wb('antes (era|eramos|estabamos|todo)'),
        wb('en mis tiempos'),
        wb('me da nostalgia'),
        wb('da nostalgia'),
        wb('extra[nñ]ar'),
      ],
    },
  ],

  // === uncomfortable =======================================================
  // Texto que indica incomodidad. Boundaries declarados se evalúan aparte.
  uncomfortable: [
    {
      weight: 0,
      patterns: [],
    },
  ],

  // === dancing: baile / fiesta (no usar como marcador genérico de «tema afín»).
  dancing: [
    {
      weight: 5,
      patterns: [
        wb('bailamos'),
        wb('bailemos'),
        wb('baile'),
        wb('bailando'),
        wb('bailar'),
        wb('vamos a bailar'),
        wb('ir a bailar'),
        wb('sale a bail'),
        wb('discoteca'),
        wb('karaoke'),
        wb('club noct'),
      ],
    },
  ],
  confused: [
    { weight: 0, patterns: [] },
  ],

  // === greeting ============================================================
  // Saludos planos. Peso moderado (4): supera a typing/question, pero deja
  // ganar reacciones más específicas (love, shy, excited).
  greeting: [
    {
      weight: 4,
      patterns: [
        wb('hola+'),
        wb('holi+'),
        wb('holis'),
        wb('holaa+'),
        wb('hey+'),
        wb('buenas'),
        wb('buenos d[ií]as?'),
        wb('buenos dias'),
        wb('buenas tardes'),
        wb('buenas noches'),
        wb('que tal'),
        wb('qu[eé] tal'),
        wb('que onda'),
        wb('qu[eé] onda'),
        wb('saludos'),
        wb('al[oó]'),
        wb('hi'),
        wb('hello'),
      ],
    },
  ],

  // === farewell ============================================================
  farewell: [
    {
      weight: 5,
      patterns: [
        wb('chao+'),
        wb('chau+'),
        wb('chaolin'),
        wb('adios'),
        wb('adi[oó]s'),
        wb('hasta luego'),
        wb('hasta pronto'),
        wb('hasta ma[nñ]ana'),
        wb('hasta la pr[oó]xima'),
        wb('nos vemos'),
        wb('me voy'),
        wb('ya me voy'),
        wb('me retiro'),
        wb('bye+'),
      ],
    },
  ],

  // === excited =============================================================
  // Entusiasmo expresado por letras repetidas (avaaa, siiii, wowww). El
  // detector de repetición se aplica en runtime; aquí solo dejamos placeholder.
  excited: [
    { weight: 0, patterns: [] },
  ],

  // === agree ===============================================================
  // Confirmaciones cortas. Patrones distintos a SARCASM_MARKERS para no
  // colisionar (claro/obvio quedan como sarcasmo, no como agree).
  agree: [
    {
      weight: 4,
      patterns: [
        wb('vale'),
        wb('dale'),
        wb('ok'),
        wb('okey'),
        wb('okay'),
        wb('sip'),
        wb('por supuesto'),
        wb('de acuerdo'),
        wb('entendido'),
        wb('hecho'),
        wb('exacto'),
        wb('correcto'),
        wb('tal cual'),
        wb('eso es'),
        wb('totalmente'),
        wb('confirmado'),
      ],
    },
  ],

  // === mindblown ===========================================================
  // Incredulidad fuerte. Patrones DISTINTOS a surprise/shock para no
  // doble-disparar (wow / no puede ser / wtf siguen yendo a surprise|shock).
  mindblown: [
    {
      weight: 5,
      patterns: [
        wb('no me lo creo'),
        wb('no lo puedo creer'),
        wb('no puedo creerlo'),
        wb('que locura'),
        wb('qu[eé] locura'),
        wb('alucinante'),
        wb('flipo'),
        wb('flipante'),
        wb('me explota la cabeza'),
        wb('mi mente vuela'),
        wb('mind blown'),
        wb('estoy en shock'),
        wb('me deja sin palabras'),
        wb('quedo flipando'),
      ],
    },
  ],

  // === flirty ==============================================================
  // Piropos juguetones, entre love (declaración) y shy (cumplido a apariencia).
  flirty: [
    {
      weight: 4,
      patterns: [
        wb('mi rey'),
        wb('mi reina'),
        wb('rey m[ií]o'),
        wb('reina m[ií]a'),
        wb('princes[ao]'),
        wb('bombon'),
        wb('bomb[oó]n'),
        wb('guap[ai]s?'),
        wb('me derrites'),
        wb('me matas'),
        wb('que bonit[oa] eres'),
        wb('qu[eé] bonit[oa] eres'),
        wb('que sexy'),
        wb('qu[eé] sexy'),
        wb('eres sexy'),
        wb('te como a besos'),
        wb('ven aca'),
        wb('ven ac[aá]'),
      ],
    },
  ],

  // === playful =============================================================
  // Tono pícaro/lúdico señalado por emojis del usuario. Mantenemos el set
  // de patrones reducido a emojis para no chocar con laugh (jeje/xd ya están
  // ahí) ni con joke markers.
  playful: [
    {
      weight: 4,
      patterns: [
        /😉|😜|😏|😋|🤭|😼|😈/,
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Detectores especiales
// ---------------------------------------------------------------------------

const QUESTION_OPENERS = [
  /^que\b/,
  /^qué\b/,
  /^cual(es)?\b/,
  /^cuál(es)?\b/,
  /^como\b/,
  /^cómo\b/,
  /^cuando\b/,
  /^cuándo\b/,
  /^donde\b/,
  /^dónde\b/,
  /^por que\b/,
  /^por qué\b/,
  /^porque\b/,
  /^porqué\b/,
  /^quien(es)?\b/,
  /^quién(es)?\b/,
  /^cuant[oa]s?\b/,
  /^cuánt[oa]s?\b/,
  /^cachai\b/,
  /^viste\b/,
] as const;

/**
 * Detecta marcadores típicos de sarcasmo en español. El sarcasmo se modela como
 * una señal que suma a `laugh` (humor irónico) y un poco a `thinking` (porque a
 * veces se usa de forma reflexiva). Si nada más destaca, suele ganar `laugh`.
 *
 * Cuidamos los falsos positivos exigiendo que sean expresiones cerradas, no
 * palabras sueltas.
 */
const SARCASM_MARKERS: readonly RegExp[] = [
  wb('si claro'),
  wb('s[ií] claro'),
  wb('claro que si'),
  wb('claro que s[ií]'),
  wb('claro, claro'),
  wb('obvio'),
  wb('obviamente'),
  wb('como no'),
  wb('c[oó]mo no'),
  wb('si po'),
  wb('s[ií] po'),
  wb('na+h'),
  wb('eso explica todo'),
  wb('que sorpresa'),
  wb('qu[eé] sorpresa'),
  wb('que original'),
  wb('qu[eé] original'),
  wb('que novedad'),
  wb('qu[eé] novedad'),
  wb('me sorprende'),
  wb('lo que faltaba'),
  wb('era lo que necesitaba'),
  wb('justo lo que quer[ií]a'),
  wb('what could go wrong'),
  wb('que se le va a hacer'),
  wb('qu[eé] se le va a hacer'),
  /\/s\b/,
] as const;

/**
 * Marcadores fuertes de "esto es un chiste/broma" — disparan `laugh` directo.
 */
const JOKE_MARKERS: readonly RegExp[] = [
  wb('es chiste'),
  wb('era chiste'),
  wb('es broma'),
  wb('era broma'),
  wb('es talla'),
  wb('era talla'),
  wb('estaba bromeando'),
  wb('estoy bromeando'),
  wb('te estoy molestando'),
  wb('te sabes el de'),
  wb('te cuento un chiste'),
  wb('te tengo un chiste'),
  wb('cu[aá]l es el colmo'),
  wb('por que (la|el|los|las) .* cruzo'),
] as const;

const isShouting = (raw: string): boolean => {
  const letters = raw.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, '');
  if (letters.length < 5) return false;
  const upper = letters.replace(/[^A-ZÁÉÍÓÚÑ]/g, '');
  return upper.length / letters.length >= 0.7;
};

const hasMultipleExclamations = (raw: string): boolean => /[!¡][!¡]+|!!+/.test(raw);

const hasQuestionMark = (raw: string): boolean => /[?¿]/.test(raw);

const matchesAny = (haystack: string, patterns: readonly RegExp[]): number =>
  patterns.reduce((acc, p) => (p.test(haystack) ? acc + 1 : acc), 0);

// ---------------------------------------------------------------------------
// Reglas anti-falso-positivo
// ---------------------------------------------------------------------------

/**
 * Si el texto contiene una negación fuerte cerca de una palabra "positiva",
 * desactivamos el matching de love/celebrate para evitar errores grandes.
 * (heurística simple, no sintáctica; cubre los casos más comunes).
 */
const NEGATED_LOVE_PATTERNS: readonly RegExp[] = [
  wb('no te amo'),
  wb('no te quiero'),
  wb('ya no te quiero'),
  wb('ya no te amo'),
  wb('no eres especial'),
] as const;

const NEGATED_CELEBRATE_PATTERNS: readonly RegExp[] = [
  wb('no me gusta'),
  wb('no estoy feliz'),
  wb('no estoy contento'),
  wb('no estoy contenta'),
  wb('no aprob[eé]'),
  wb('no consegu[ií]'),
  wb('no me dieron'),
] as const;

/** Claves = etiquetas exactas de INTEREST_OPTIONS (OnboardingScreen). */
const TOPIC_KEYWORDS: Record<string, readonly RegExp[]> = {
  'Música': [
    wb('musica'),
    wb('musical'),
    wb('musicales'),
    wb('cancion'),
    wb('banda'),
    wb('concierto'),
    wb('playlist'),
    wb('album'),
    wb('artista'),
    wb('letra'),
    wb('broadway'),
    wb('teatro'),
  ],
  'Cine y series': [
    wb('pelicula'),
    wb('serie'),
    wb('cine'),
    wb('netflix'),
    wb('actor'),
    wb('actriz'),
    wb('director'),
    wb('estreno'),
    wb('musical'),
    wb('musicales'),
    wb('broadway'),
  ],
  'Deportes': [wb('partido'), wb('gol'), wb('futbol'), wb('deporte'), wb('entreno'), wb('cancha'), wb('torneo')],
  'Tecnología': [wb('codigo'), wb('programar'), wb('app'), wb('software'), wb('bug'), wb('deploy'), wb('servidor')],
  'Cocina': [wb('comida'), wb('receta'), wb('cocinar'), wb('restaurante'), wb('ingrediente'), wb('plato')],
  'Arte y cultura': [wb('dibujo'), wb('pintura'), wb('arte'), wb('diseno'), wb('ilustracion'), wb('galeria')],
  'Ciencia': [
    wb('ciencia'),
    wb('investigacion'),
    wb('laboratorio'),
    wb('experimento'),
    wb('atomo'),
    wb('genes?'),
    wb('microscopi'),
    wb('bioquimi'),
    wb('fenomeno'),
    wb('astronomi'),
  ],
  'Literatura': [
    wb('novela'),
    wb('literatura'),
    wb('cuento'),
    wb('literari[oa]s?'),
    wb('protagonista'),
    wb('narrativa'),
    wb('obra'),
    wb('poesia'),
    wb('prosa'),
    wb('ensayo'),
    wb('critica literaria'),
  ],
  'Filosofía': [
    wb('filosofia'),
    wb('existencial'),
    wb('etic[ao]'),
    wb('moral'),
    wb('postmodern'),
    wb('ontologi'),
    wb('epistemologi'),
    wb('deontologi'),
  ],
  'Psicología': [
    wb('psicologi'),
    wb('psicolog'),
    wb('psiquiatr'),
    wb('salud mental'),
    wb('motivacion'),
    wb('conducta'),
    wb('conductual'),
    wb('trastorno'),
    wb('autoconocimiento'),
  ],
  'Historia': [
    wb('historia'),
    wb('historico'),
    wb('historica'),
    wb('siglo'),
    wb('imperio'),
    wb('revolucion'),
    wb('colonizacion'),
    wb('guerra'),
    wb('guerras'),
    wb('monarqui'),
    wb('dinast'),
  ],
  'Negocios': [
    wb('negocio'),
    wb('negocios'),
    wb('startup'),
    wb('marketing'),
    wb('pitch'),
    wb('roi'),
    wb('ventas'),
    wb('cliente'),
    wb('inversor'),
    wb('rentabilidad'),
    wb('facturacion'),
    wb('ceo'),
  ],
  'Salud y bienestar': [
    wb('salud'),
    wb('bienestar'),
    wb('hidratacion'),
    wb('meditacion'),
    wb('autocuidado'),
    wb('dormir'),
    wb('descans'),
    wb('vitamina'),
    wb('suplemento'),
    wb('mindfulness'),
    wb('relajacion'),
    wb('postura'),
    wb('ergonomi'),
    wb('dieta'),
    wb('nutricion'),
    wb('ejercicio aerob'),
  ],
  'Moda y estilo': [
    wb('moda'),
    wb('estilo'),
    wb('outfit'),
    wb('vestimenta'),
    wb('accesori'),
    wb('maquillaje'),
    wb('peinado'),
    wb('tendencia'),
    wb('pasarela'),
    wb('marca de ropa'),
    wb('streetwear'),
  ],
  'Viajes': [wb('viaje'), wb('viajar'), wb('pais'), wb('ciudad'), wb('vuelo'), wb('hotel'), wb('turismo')],
};

const INTEREST_BOOSTS: Record<string, Partial<Record<ReactionKind, number>>> = {
  'Música': { fire: 3, celebrate: 2, surprise: 2, curious: 2 },
  'Cine y series': { fire: 3, curious: 3, celebrate: 1, surprise: 1 },
  'Deportes': { celebrate: 3, shock: 2, surprise: 2 },
  'Tecnología': { curious: 3, thinking: 2 },
  'Cocina': { celebrate: 2, curious: 2 },
  'Arte y cultura': { curious: 3, tender: 1, celebrate: 2 },
  'Ciencia': { curious: 3, thinking: 3, surprise: 1 },
  'Literatura': { curious: 3, tender: 2, thinking: 1 },
  'Filosofía': { thinking: 3, curious: 2, tender: 1 },
  'Psicología': { tender: 3, thinking: 2, curious: 1 },
  'Historia': { curious: 3, thinking: 2, surprise: 1 },
  'Negocios': { thinking: 3, curious: 2, celebrate: 1 },
  'Salud y bienestar': { tender: 2, celebrate: 2, curious: 1 },
  'Moda y estilo': { celebrate: 2, curious: 2, surprise: 1 },
  'Viajes': { curious: 3, celebrate: 2, surprise: 2 },
};

/**
 * Topic del assistant clasificado igual que algún interés del companion (`in-domain`):
 * reacciones acordes al **tema** (cine vs música ≠ filosofía vs ciencia), sin usar 💃 como comodín.
 */
const TOPIC_DOMAIN_BOOSTS: Record<
  string,
  Partial<Record<ReactionKind, number>>
> = {
  Música: { fire: 6, curious: 4, playful: 3, perfect: 2 },
  'Cine y series': { fire: 7, curious: 5, perfect: 3 },
  Deportes: { celebrate: 5, shock: 2, surprise: 2 },
  Tecnología: { curious: 6, thinking: 3 },
  Cocina: { celebrate: 4, curious: 3 },
  'Arte y cultura': { curious: 5, celebrate: 3, tender: 2 },
  Ciencia: { curious: 6, thinking: 5, mindblown: 2 },
  Literatura: { curious: 5, tender: 3, thinking: 3 },
  Filosofía: { thinking: 7, curious: 4 },
  Psicología: { thinking: 5, tender: 4 },
  Historia: { curious: 6, thinking: 3 },
  Negocios: { thinking: 6, curious: 3 },
  'Salud y bienestar': { tender: 4, celebrate: 3 },
  'Moda y estilo': { curious: 4, celebrate: 4 },
  Viajes: { curious: 6, celebrate: 3 },
};

const FALLBACK_TOPIC_DOMAIN_BOOST: Partial<Record<ReactionKind, number>> = {
  curious: 5,
  celebrate: 2,
};

/** Orden global de prioridad cuando dos categorías tienen el mismo puntaje. Usado también para el bump post-assistant in-domain (se suma sobre el principal). */
const REACTION_SCORE_PRIORITY: readonly ReactionKind[] = [
  'love',
  'tender',
  'shy',
  'proud',
  'flirty',
  'celebrate',
  'fire',
  'perfect',
  'dancing',
  'disgust',
  'uncomfortable',
  'mindblown',
  'excited',
  'laugh',
  'playful',
  'shock',
  'nostalgic',
  'curious',
  'thinking',
  'confused',
  'surprise',
  'agree',
  'farewell',
  'greeting',
  'question',
  'moai',
  'typing',
  'bored',
  'sleepy',
];

/** Sinónimos del modelo/backend → etiqueta canónica (clave de TOPIC_KEYWORDS / onboarding). */
const TOPIC_SYNONYMS_RAW: Record<string, string> = {
  musica: 'Música',
  music: 'Música',
  cancion: 'Música',
  banda: 'Música',
  concierto: 'Música',

  cine: 'Cine y series',
  pelicula: 'Cine y series',
  movies: 'Cine y series',
  tv: 'Cine y series',
  series: 'Cine y series',
  serie: 'Cine y series',
  streaming: 'Cine y series',

  filosofia: 'Filosofía',
  filosofico: 'Filosofía',
  astronomia: 'Ciencia',
  astrofisica: 'Ciencia',
  astronomo: 'Ciencia',
  astronoma: 'Ciencia',

  tecnologia: 'Tecnología',
  tech: 'Tecnología',
  programacion: 'Tecnología',
  codigo: 'Tecnología',
  software: 'Tecnología',

  deporte: 'Deportes',
  deportes: 'Deportes',
  futbol: 'Deportes',

  cocina: 'Cocina',
  comida: 'Cocina',
  gastronomia: 'Cocina',
  recetas: 'Cocina',

  arte: 'Arte y cultura',
  cultura: 'Arte y cultura',
  diseno: 'Arte y cultura',
  'diseno grafico': 'Arte y cultura',
  diseno_grafico: 'Arte y cultura',

  viajes: 'Viajes',
  viaje: 'Viajes',
  turismo: 'Viajes',
  vacaciones: 'Viajes',
};

const buildTopicNormalizationMap = (): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [syn, canon] of Object.entries(TOPIC_SYNONYMS_RAW)) {
    out[topicLookupKey(syn)] = canon;
  }
  for (const label of Object.keys(TOPIC_KEYWORDS)) {
    out[topicLookupKey(label)] = label;
  }
  return out;
};

const TOPIC_NORMALIZATION = buildTopicNormalizationMap();

const normalizeBackendTopic = (topic: string | null | undefined): string | null => {
  if (topic == null || !String(topic).trim()) return null;
  const key = topicLookupKey(topic);
  return TOPIC_NORMALIZATION[key] ?? null;
};

// ---------------------------------------------------------------------------
// Boundaries y relación temática
// ---------------------------------------------------------------------------

/**
 * Mapa boundary del onboarding → patrones que detectan ese tema en el texto del
 * usuario o en el topic del backend. Las claves usan `topicLookupKey` para
 * tolerar tildes/mayúsculas.
 */
const BOUNDARY_KEYWORDS_RAW: Record<string, readonly RegExp[]> = {
  'no temas sexuales': [
    wb('sexo'),
    wb('sexual'),
    wb('porno'),
    wb('eroti[ck]'),
    wb('caliente'),
    wb('desnud[oa]'),
    wb('nud[oe]s'),
    wb('intimid'),
    wb('cama'),
  ],
  'no lenguaje ofensivo': [
    wb('mierda'),
    wb('puta'),
    wb('puto'),
    wb('idiota'),
    wb('estupid[oa]'),
    wb('pendejo'),
    wb('imbecil'),
    wb('weon ctm'),
  ],
  'evitar temas politicos': [
    wb('politica'),
    wb('politico'),
    wb('presidente'),
    wb('gobierno'),
    wb('eleccion'),
    wb('partido politico'),
    wb('izquierda'),
    wb('derecha'),
    wb('ministro'),
    wb('congreso'),
    wb('parlamento'),
  ],
  'no discusiones religiosas': [
    wb('religion'),
    wb('religios'),
    wb('dios'),
    wb('jesus'),
    wb('biblia'),
    wb('iglesia'),
    wb('rezar'),
    wb('alabado'),
    wb('musulm'),
    wb('cristian'),
    wb('catolic'),
    wb('judio'),
    wb('judia'),
  ],
  'limites emocionales claros': [
    wb('depresion profunda'),
    wb('quiero morir'),
    wb('suicid'),
    wb('autolesion'),
    wb('hacerme dano'),
  ],
  'mantener respeto': [],
  'conversaciones apropiadas': [],
};

const BOUNDARY_KEYWORDS = (() => {
  const out: Record<string, readonly RegExp[]> = {};
  for (const [k, patterns] of Object.entries(BOUNDARY_KEYWORDS_RAW)) {
    out[topicLookupKey(k)] = patterns;
  }
  return out;
})();

const isBoundaryHit = (
  companionBoundaries: readonly string[],
  text: string,
  topic: string | null
): boolean => {
  if (!companionBoundaries.length) return false;
  for (const boundary of companionBoundaries) {
    const key = topicLookupKey(boundary);
    const patterns = BOUNDARY_KEYWORDS[key];
    if (!patterns?.length) continue;
    if (patterns.some((p) => p.test(text))) return true;
    if (topic && patterns.some((p) => p.test(topicLookupKey(topic)))) return true;
  }
  return false;
};

/** Resultado de comparar el topic actual con el dominio del companion. */
export type TopicRelation =
  | 'in-domain'   // topic está en interests del companion
  | 'boundary'    // topic toca un boundary declarado
  | 'alien'       // topic conocido pero fuera del dominio
  | 'unknown';    // sin topic / topic genérico

const isGenericTopic = (label: string | null): boolean => {
  if (!label) return true;
  const k = topicLookupKey(label);
  return k === '' || k === 'conversacion general' || k === 'general' || k === 'otros';
};

export const classifyTopicRelation = (
  topic: string | null | undefined,
  interests: readonly string[],
  boundaries: readonly string[]
): TopicRelation => {
  const norm = normalizeBackendTopic(topic ?? null);
  if (!norm || isGenericTopic(norm)) return 'unknown';

  const inInterests = interests.some(
    (i) => normalizeBackendTopic(i) === norm
  );
  if (inInterests) return 'in-domain';

  for (const b of boundaries) {
    const key = topicLookupKey(b);
    const patterns = BOUNDARY_KEYWORDS[key];
    if (patterns?.some((p) => p.test(topicLookupKey(norm)))) {
      return 'boundary';
    }
  }
  return 'alien';
};

/** Refuerza scores cuando el tema activo coincide con un interés del companion (distinto por cada rubro). */
const applyCompanionTopicDomainBoosts = (
  scores: Partial<Record<ReactionKind, number>>,
  topicRelation: TopicRelation,
  normalizedCanonicalTopic: string | null,
  companionInterests: readonly string[],
  inferenceSource: InferReactionInferenceSource
): void => {
  if (topicRelation !== 'in-domain' || !normalizedCanonicalTopic) return;
  const trimmed = companionInterests.map((x) => x.trim()).filter(Boolean);
  const matchedInterest = trimmed.find(
    (label) => normalizeBackendTopic(label) === normalizedCanonicalTopic
  );
  if (!matchedInterest) return;

  const boosts =
    TOPIC_DOMAIN_BOOSTS[matchedInterest] ?? FALLBACK_TOPIC_DOMAIN_BOOST;
  const entries = Object.entries(boosts).filter(
    (entry): entry is [ReactionKind, number] =>
      typeof entry[1] === 'number' && entry[1] > 0
  );
  if (!entries.length) return;

  const maxWeight = entries.reduce<number>(
    (acc, [, w]) => (w > acc ? w : acc),
    0
  );
  const tied = entries
    .filter(([, w]) => w === maxWeight)
    .map(([kind]) => kind);
  let primary = tied[0];
  let primaryIdx = REACTION_SCORE_PRIORITY.indexOf(primary);
  if (primaryIdx === -1) primaryIdx = 999;
  for (let i = 1; i < tied.length; i++) {
    const k = tied[i];
    let r = REACTION_SCORE_PRIORITY.indexOf(k);
    if (r === -1) r = 999;
    if (r < primaryIdx) {
      primary = k;
      primaryIdx = r;
    }
  }

  const assistantExtra =
    inferenceSource === 'assistant_message' ? 2 : 0;
  for (const [kind, weight] of entries) {
    scores[kind] =
      (scores[kind] ?? 0) + weight + (kind === primary ? assistantExtra : 0);
  }
};

const clampNonNegative = (n: number): number => Math.max(0, n);

/**
 * Ajusta 🔥 cuando el tema activo es música/cine: preguntas deben tender a 🤔/❓,
 * y el desinterés explícito del usuario no debe leerse como hype por el solo hecho del tema.
 */
const applyMediaTopicReactionCalibration = (
  scores: Partial<Record<ReactionKind, number>>,
  topicRelation: TopicRelation,
  normalizedTopic: string | null,
  isQuestion: boolean,
  inferenceSource: InferReactionInferenceSource
): void => {
  if (topicRelation !== 'in-domain' || !normalizedTopic) return;
  const isMediaTopic =
    normalizedTopic === 'Música' || normalizedTopic === 'Cine y series';
  if (!isMediaTopic) return;

  if (isQuestion) {
    scores.fire = clampNonNegative((scores.fire ?? 0) - 10);
    scores.curious = (scores.curious ?? 0) + 5;
    scores.thinking = (scores.thinking ?? 0) + 4;
  }

  const boredomSignal = Math.max(scores.moai ?? 0, scores.disgust ?? 0);
  if (boredomSignal >= 4 && inferenceSource === 'user_message') {
    scores.fire = clampNonNegative((scores.fire ?? 0) - 12);
  }
};

/**
 * Cambios bruscos de tema sin contexto: indicios de que el usuario salta a otra
 * cosa. Útil para reforzar `confused` cuando además el tema queda fuera del
 * dominio o no hay señales fuertes de otra categoría.
 */
const NON_SEQUITUR_PATTERNS: readonly RegExp[] = [
  /\by a ti[,.]?\s+(te|le)\b/,
  /\by tu[,.]?\s+(te|le)\b/,
  /\bcambiando de tema\b/,
  /\ba proposito\b/,
  /\bpor cierto\b/,
  /\bcambio de tema\b/,
] as const;

/**
 * Detecta letras repetidas (≥3 iguales seguidas) como señal de entusiasmo:
 *   "avaaa", "siiii", "wowww", "okkkk", "buenisimoooo".
 * No matchea risas tipo "jajaja" porque alternan ja+ja+ja sin 3 letras
 * iguales contiguas. Se aplica sobre el texto normalizado.
 */
const EXCITED_REPETITION_RE = /([a-zñ])\1{2,}/;

/**
 * Contrato backend: UNA palabra en español, normalizada (minúsculas, sin
 * acento) vía `normalize()`. Lista oficial (omitir `neutral` en el mapa: no boost).
 *
 * alegre | tierno | curioso | sorprendido | nostalgico | jugueton |
 * pensativo | incomodo | orgulloso | confundido | neutral | carinoso |
 * melancolico | divertido | emocionado
 *
 * Sinónimos legacy se mantienen tolerantes a variación del modelo.
 */
const MOOD_TO_REACTION: Record<string, ReactionKind> = {
  // Oficial backend
  carinoso: 'tender',
  tierno: 'tender',
  alegre: 'celebrate',
  curioso: 'curious',
  sorprendido: 'shock',
  nostalgico: 'nostalgic',
  jugueton: 'laugh',
  pensativo: 'thinking',
  incomodo: 'uncomfortable',
  orgulloso: 'proud',
  confundido: 'confused',
  melancolico: 'nostalgic',
  divertido: 'laugh',
  emocionado: 'excited',
  // neutral: sin entrada deliberada — no empuja emoji; gana texto/topic/umbral.

  // Sinónimos / tolerancia (no en contrato estricto pero útiles)
  afectuoso: 'tender',
  feliz: 'celebrate',
  preocupado: 'thinking',
  ansioso: 'thinking',
  asombrado: 'shock',
  intrigado: 'curious',
};

const boostFromAssistantMood = (
  scores: Partial<Record<ReactionKind, number>>,
  assistantMood: string | null | undefined,
  inferenceSource: InferReactionInferenceSource
): void => {
  if (!assistantMood?.trim()) return;
  const key = normalize(assistantMood.trim());
  if (!key) return;
  const kind = MOOD_TO_REACTION[key];
  if (!kind) return;
  const base = 5;
  const extra = inferenceSource === 'assistant_message' ? 2 : 0;
  scores[kind] = (scores[kind] ?? 0) + base + extra;
};

// ---------------------------------------------------------------------------
// Función principal
// ---------------------------------------------------------------------------

const SCORE_THRESHOLD = 2;

/**
 * Calcula scores por categoría y devuelve la reacción ganadora.
 *
 * @param previousReaction — última reacción instantánea mostrada (p. ej. la del
 *   mensaje anterior). Si el nuevo candidato entraría en conflicto emocional
 *   fuerte con esa, se exige un score ≥ `SCORE_THRESHOLD + 3` para cambiar;
 *   si no, se mantiene el tono previo.
 * @param companionInterests — etiquetas exactas del onboarding (`INTEREST_OPTIONS`).
 * @param assistantConversationTopic — topic crudo del backend (último turno
 *   assistant). Se normaliza con `normalizeBackendTopic`.
 * @param companionBoundaries — etiquetas exactas de boundaries del onboarding
 *   (`BOUNDARY_OPTIONS`). Permiten disparar `uncomfortable` cuando el mensaje
 *   del usuario o el topic tocan uno de esos límites.
 * @param assistantMood — UNA palabra (español) del backend; se normaliza sin
 *   acentos. Lista cerrada: ver `MOOD_TO_REACTION` (`neutral` no aplica boost).
 * @param inferenceSource — `assistant_message`: en la Reacción 2 da +2 extra al mood
 *   y otros +2 a la categoría principal del tema in-domain (`TOPIC_DOMAIN_BOOSTS`).
 *
 * Reglas adicionales:
 *  - shock se incrementa por gritos o múltiples signos de exclamación.
 *  - question se incrementa si hay signo de pregunta o palabra interrogativa.
 *  - laugh se incrementa por sarcasmo (peso medio) y por broma explícita (alto).
 *  - thinking recibe un pequeño aporte si hay sarcasmo (suele convivir con
 *    duda/ironía reflexiva), pero rara vez gana solo por eso.
 *  - love/celebrate quedan anuladas si detectamos negación cercana.
 *  - typing es el fallback cuando nada destaca.
 *  - Boost por intereses + topic del backend cuando el texto del usuario coincide
 *    con keywords del tema.
 *  - Interés alineado con el topic ACTIVO (`in-domain`): ver `TOPIC_DOMAIN_BOOSTS`
 *    (cinema ≠ música ≠ filosofía; distinto del boost por texto + keywords).
 *  - `dancing`: baile/fiesta/discoteca en el texto, no tema afín por sí solo.
 *  - `confused`: tema alien / non-sequitur sin señales fuertes de otra categoría.
 *  - `uncomfortable`: el texto o el topic toca un boundary declarado.
 */
export const inferReaction = (
  rawText: string,
  previousReaction?: ReactionKind,
  companionInterests: string[] = [],
  assistantConversationTopic?: string | null,
  companionBoundaries: string[] = [],
  assistantMood?: string | null,
  inferenceSource: InferReactionInferenceSource = 'user_message'
): ReactionKind | null => {
  const raw = (rawText ?? '').trim();
  if (raw.length < 3) return null;

  const text = normalize(expandContractions(raw));

  const scores: Partial<Record<ReactionKind, number>> = {};

  for (const [kind, ruleSets] of Object.entries(RULES) as [
    ReactionKind,
    readonly ScoreRule[],
  ][]) {
    let total = 0;
    for (const ruleSet of ruleSets) {
      for (const pattern of ruleSet.patterns) {
        if (pattern.test(text)) {
          total += ruleSet.weight;
        }
      }
    }
    if (total > 0) scores[kind] = total;
  }

  if (NEGATED_LOVE_PATTERNS.some((p) => p.test(text))) {
    scores.love = 0;
  }
  if (NEGATED_CELEBRATE_PATTERNS.some((p) => p.test(text))) {
    scores.celebrate = 0;
  }

  const sarcasmHits = matchesAny(text, SARCASM_MARKERS);
  if (sarcasmHits > 0) {
    scores.laugh = (scores.laugh ?? 0) + Math.min(4, 2 + sarcasmHits);
    scores.thinking = (scores.thinking ?? 0) + 1;
  }

  if (matchesAny(text, JOKE_MARKERS) > 0) {
    scores.laugh = (scores.laugh ?? 0) + 4;
  }

  const isQuestion =
    hasQuestionMark(raw) || QUESTION_OPENERS.some((p) => p.test(text));
  const shouting = isShouting(raw);
  const exclaim = hasMultipleExclamations(raw);

  if (shouting || exclaim) {
    scores.shock = (scores.shock ?? 0) + 4;
  }

  if (isQuestion) {
    scores.question = (scores.question ?? 0) + 2;
  }

  const normalizedTopic = normalizeBackendTopic(assistantConversationTopic);
  const cleanInterests = companionInterests
    .map((x) => x.trim())
    .filter(Boolean);
  const cleanBoundaries = companionBoundaries
    .map((x) => x.trim())
    .filter(Boolean);

  const topicsToBoost = new Set([
    ...cleanInterests,
    ...(normalizedTopic ? [normalizedTopic] : []),
  ]);

  /** Por cada categoría se toma el máximo entre intereses que matchean (evita duplicar 🔥/❓ cuando conviven música + cine con keywords compartidas). */
  const interestBoostTotals: Partial<Record<ReactionKind, number>> = {};
  for (const interest of topicsToBoost) {
    const keywords = TOPIC_KEYWORDS[interest] ?? [];
    const topicMatch = keywords.some((p) => p.test(text));
    if (topicMatch) {
      const boosts = INTEREST_BOOSTS[interest] ?? {};
      for (const [kind, boost] of Object.entries(boosts) as [ReactionKind, number][]) {
        interestBoostTotals[kind] = Math.max(
          interestBoostTotals[kind] ?? 0,
          boost
        );
      }
    }
  }
  for (const [kind, boost] of Object.entries(interestBoostTotals) as [
    ReactionKind,
    number,
  ][]) {
    scores[kind] = (scores[kind] ?? 0) + boost;
  }

  // --- Relación temática + nuevas categorías -------------------------------
  const topicRelation = classifyTopicRelation(
    normalizedTopic,
    cleanInterests,
    cleanBoundaries
  );

  applyCompanionTopicDomainBoosts(
    scores,
    topicRelation,
    normalizedTopic,
    cleanInterests,
    inferenceSource
  );

  applyMediaTopicReactionCalibration(
    scores,
    topicRelation,
    normalizedTopic,
    isQuestion,
    inferenceSource
  );

  // uncomfortable: texto o topic toca un boundary declarado.
  if (isBoundaryHit(cleanBoundaries, text, normalizedTopic)) {
    scores.uncomfortable = (scores.uncomfortable ?? 0) + 5;
  } else if (topicRelation === 'boundary') {
    scores.uncomfortable = (scores.uncomfortable ?? 0) + 4;
  }

  // confused: tema alien o non-sequitur sin señales fuertes.
  const isNonSequitur = NON_SEQUITUR_PATTERNS.some((p) => p.test(text));
  const maxScoreSoFar = Object.values(scores).reduce<number>(
    (max, s) => (s !== undefined && s > max ? s : max),
    0
  );
  const noStrongSignal = maxScoreSoFar < 3;

  if (topicRelation === 'alien' && noStrongSignal) {
    scores.confused = (scores.confused ?? 0) + 4;
  }
  if (isNonSequitur && noStrongSignal) {
    scores.confused = (scores.confused ?? 0) + 3;
  }

  // excited: letras repetidas como entusiasmo. Se mide sobre el texto
  // normalizado para que también capte "AVAAA" (pasa a "avaaa") y similares.
  if (EXCITED_REPETITION_RE.test(text)) {
    scores.excited = (scores.excited ?? 0) + 4;
  }

  boostFromAssistantMood(scores, assistantMood, inferenceSource);

  let best: ReactionKind | null = null;
  let bestScore = 0;

  // Desempates: ver `REACTION_SCORE_PRIORITY` (misma lista que antes en este archivo).
  for (const kind of REACTION_SCORE_PRIORITY) {
    const score = scores[kind] ?? 0;
    if (score > bestScore) {
      best = kind;
      bestScore = score;
    }
  }

  const ELEVATED_THRESHOLD = SCORE_THRESHOLD + 3;

  let candidate: ReactionKind;
  let candidateScore: number;

  if (best && bestScore >= SCORE_THRESHOLD) {
    candidate = best;
    candidateScore = bestScore;
  } else if (isQuestion) {
    candidate = 'question';
    candidateScore = scores.question ?? 0;
  } else {
    candidate = 'typing';
    candidateScore = 0;
  }

  const conflicts = previousReaction
    ? CONFLICTING_PAIRS[previousReaction] ?? []
    : [];

  if (
    previousReaction &&
    conflicts.includes(candidate) &&
    candidateScore < ELEVATED_THRESHOLD
  ) {
    return previousReaction;
  }

  return candidate;
};

/** Umbral tras el que el companion muestra 🗿 por inactividad (solo si hubo notifyActivity antes). Exportado para el hook. */
export const IDLE_AFK_REACTION_MS = 5 * 60 * 1000;

/**
 * Reacción cuando el usuario deja la conversación inactiva unos minutos tras haber interactuado.
 */
export const SPONTANEOUS_REACTIONS: readonly ReactionKind[] = ['moai'];
