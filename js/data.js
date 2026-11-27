/* Données fixes du jeu : réglages par défaut et cartes. */

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 6;
export const INTRO_MS = 1500; // apparition du nom
export const END_MS = 2000; // « Temps écoulé ! »
export const FINALE_MS = 2600; // « Fin des plaidoiries »

export const DEFAULTS = {
  scoreToWin: 5,
  pleaSeconds: 30,
  countdown: 5,
  reducedSeconds: 10,
  prolongSeconds: 40,
  witnessSeconds: 10,
  objectionsPerPlayer: 2,
  sound: true,
  vibrate: true,
};

/** Les 14 types de cartes Défi. « immediat » : la carte change le chrono ou l'ordre de passage. */
export const DEFIS = [
  { id: 'temps-reduit', nom: 'Reduced time', immediat: true, effet: 'You only have 10 seconds instead of 30 to plead.' },
  { id: 'prolongation', nom: 'Overtime', immediat: true, effet: 'You get 40 seconds instead of 30.' },
  { id: 'ordre-de-passage', nom: 'Turn order', immediat: true, effet: 'You choose right away when you speak in this round.' },
  { id: 'temoin-surprise', nom: 'Surprise witness', immediat: true, effet: 'An opponent speaks for 10 seconds in your favour just before your turn.' },
  { id: 'voix-double', nom: 'Double vote', immediat: true, effet: 'Your vote counts double this round.' },
  { id: 'mime', nom: 'Mime', effet: 'You defend your answer by miming, without saying a word.' },
  { id: 'ressort', nom: 'Bounce', effet: 'You plead while jumping on the spot from start to finish.' },
  { id: 'comedie-musicale', nom: 'Musical', effet: 'You plead by singing.' },
  { id: 'robot', nom: 'Robot', effet: 'You plead with a robot voice and robot moves.' },
  { id: 'commentateur', nom: 'Sports commentator', effet: 'You defend your answer as if you were commentating the end of a match.' },
  { id: 'avocat-du-diable', nom: 'Devil’s advocate', effet: 'You defend the worst possible answer with a completely straight face.' },
  { id: 'mot-interdit', nom: 'Forbidden word', effet: 'The player on your right chooses a common word. If you say it, your plea stops.' },
  { id: 'chuchotement', nom: 'Whisper', effet: 'You plead in a whisper for your whole turn.' },
  { id: 'dos-a-la-cour', nom: 'Back to the court', effet: 'You plead with your back turned to the other players.' },
];

export const defi = (id) => DEFIS.find((d) => d.id === id) || null;

/** Nom affiché d'une carte (Défi, Objection ou Point double). */
const OTHER_CARDS = { objection: 'Objection!', 'point-double': 'Double point' };
export const cardName = (id) => defi(id)?.nom ?? OTHER_CARDS[id] ?? id;

/** Visuel final d'une carte : assets/cartes/<id>.jpg */
export const cardImg = (id, cls = '') =>
  `<img class="card-img ${cls}" src="assets/cartes/${id}.jpg" alt="${cardName(id)} card" loading="lazy" decoding="async" draggable="false" />`;
