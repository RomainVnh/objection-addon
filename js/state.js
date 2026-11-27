/* État de la partie (sauvegardé dans le navigateur) et état de l'interface (non sauvegardé). */
import { DEFAULTS } from './data.js';

const STORE = 'objection-chrono-v1';

const fresh = (settings) => ({
  v: 1,
  settings: { ...DEFAULTS, ...settings },
  players: [],
  phase: 'register', // register | prep | run | vote | results | victory
  roundNo: 0,
  round: null,
  history: [],
  savedAt: Date.now(),
});

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE));
    if (s?.v !== 1 || !Array.isArray(s.players)) return null;
    s.settings = { ...DEFAULTS, ...s.settings };
    // Une manche rechargée en plein chrono repart en pause, au même endroit.
    const r = s.round;
    if (s.phase === 'run' && r && r.paused == null) r.paused = Math.max(0, r.subEnds - (s.savedAt || Date.now()));
    return s;
  } catch {
    return null;
  }
}

export const S = load() || fresh();

/** Efface les joueurs et les scores, garde les réglages. */
export function resetGame() {
  const next = fresh(S.settings);
  for (const k of Object.keys(S)) delete S[k];
  Object.assign(S, next);
}

export function save() {
  try {
    S.savedAt = Date.now();
    localStorage.setItem(STORE, JSON.stringify(S));
  } catch {
    /* stockage indisponible (navigation privée) : on continue sans sauvegarde */
  }
}

export const ui = {
  home: true, // écran d'accueil affiché
  sheet: null, // fenêtre du bas ouverte : { type, id, by }
  draft: '', // prénom en cours de saisie
  voteSel: null, // joueur choisi pendant le vote
  voteDouble: false, // carte Point double activée pour ce vote
  lastDigit: null,
  lastSecond: null,
  lastTick: Date.now(),
  lastSave: 0,
  wake: null,
  focus: null,
  newId: null,
  screenKey: null,
  installEvt: null,
  fxTimer: null,
};

// Le rendu est branché par main.js : commit() sauvegarde puis redessine.
let renderFn = () => {};
let renderSheetFn = () => {};
export const setRenderers = (render, renderSheet) => ((renderFn = render), (renderSheetFn = renderSheet));
export const render = () => renderFn();
export const renderSheet = () => renderSheetFn();

export function commit() {
  save();
  renderFn();
}
export function openSheet(sheet) {
  ui.sheet = sheet;
  renderSheetFn();
}
export const closeSheet = () => openSheet(null);
