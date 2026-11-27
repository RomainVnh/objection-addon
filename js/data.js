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
  { id: 'temps-reduit', nom: 'Temps réduit', immediat: true, effet: 'Tu n’as que 10 secondes au lieu de 30 pour plaider.' },
  { id: 'prolongation', nom: 'Prolongation', immediat: true, effet: 'Tu as 40 secondes au lieu de 30.' },
  { id: 'ordre-de-passage', nom: 'Ordre de passage', immediat: true, effet: 'Tu choisis tout de suite à quelle place tu plaides.' },
  { id: 'temoin-surprise', nom: 'Témoin surprise', immediat: true, effet: 'Un adversaire parle 10 secondes en ta faveur juste avant ton tour.' },
  { id: 'voix-double', nom: 'Voix double', immediat: true, effet: 'Ton vote compte double pour cette manche.' },
  { id: 'mime', nom: 'Mime', effet: 'Tu défends ta réponse en mimant, sans dire un mot.' },
  { id: 'ressort', nom: 'Ressort', effet: 'Tu plaides en sautant sur place du début à la fin.' },
  { id: 'comedie-musicale', nom: 'Comédie musicale', effet: 'Tu plaides en chantant.' },
  { id: 'robot', nom: 'Robot', effet: 'Tu plaides avec une voix et des gestes de robot.' },
  { id: 'commentateur', nom: 'Commentateur sportif', effet: 'Tu défends ta réponse comme si tu commentais la fin d’un match.' },
  { id: 'avocat-du-diable', nom: 'Avocat du diable', effet: 'Tu défends avec le plus grand sérieux la pire réponse possible.' },
  { id: 'mot-interdit', nom: 'Mot interdit', effet: 'Le joueur à ta droite choisit un mot courant. Si tu le dis, ta plaidoirie s’arrête.' },
  { id: 'chuchotement', nom: 'Chuchotement', effet: 'Tu plaides à voix basse pendant tout ton tour.' },
  { id: 'dos-a-la-cour', nom: 'Dos à la cour', effet: 'Tu plaides en tournant le dos aux autres joueurs.' },
];

export const defi = (id) => DEFIS.find((d) => d.id === id) || null;

/** Nom affiché d'une carte (Défi, Objection ou Point double). */
const OTHER_CARDS = { objection: 'Objection !', 'point-double': 'Point double' };
export const cardName = (id) => defi(id)?.nom ?? OTHER_CARDS[id] ?? id;

/** Visuel final d'une carte : assets/cartes/<id>.jpg */
export const cardImg = (id, cls = '') =>
  `<img class="card-img ${cls}" src="assets/cartes/${id}.jpg" alt="Carte ${cardName(id)}" loading="lazy" decoding="async" draggable="false" />`;
