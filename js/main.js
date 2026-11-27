/* =========================================================
   Objection ! · Chrono du tribunal
   Application compagnon du jeu de cartes (règles v2).
   JavaScript natif, sans dépendance : il suffit de déposer
   le dossier sur n'importe quel hébergeur statique.

   js/
     main.js        démarrage, rendu, boucle du chrono, écouteurs
     data.js        réglages par défaut et cartes
     state.js       état sauvegardé + état d'interface
     game.js        règles d'une manche (chrono, objection, vote)
     actions.js     ce que fait chaque bouton
     view-*.js      écrans (accueil/inscription/préparation, plaidoiries, vote)
     sheets.js      fenêtres du bas
     fx.js          animations des cartes
     sound.js       sons
     icons.js       icônes
     utils.js       petits outils
     pwa.js         installation sur l'écran d'accueil
   ========================================================= */
import { S, ui, save, commit, setRenderers, closeSheet } from './state.js';
import { MAX_PLAYERS } from './data.js';
import { $, uid, wakeOn } from './utils.js';
import { sfx } from './sound.js';
import { advance, pause, resume } from './game.js';
import { confetti } from './fx.js';
import { ACTS } from './actions.js';
import { homeView, registerView, prepView } from './view-setup.js';
import { runView, live } from './view-run.js';
import { voteIntroView, ballotView, resultsView, victoryView } from './view-vote.js';
import { sheetView } from './sheets.js';
import { setupPwa } from './pwa.js';

// ----- Rendu -----

function view() {
  if (ui.home) return homeView();
  if (S.phase === 'vote') return S.round.voteStage === 'intro' ? voteIntroView() : ballotView();
  const views = { register: registerView, prep: prepView, run: runView, results: resultsView, victory: victoryView };
  return (views[S.phase] || homeView)();
}

/** Clé de l'écran affiché : l'animation d'entrée ne joue que quand elle change. */
function screenKey() {
  if (ui.home) return 'home';
  const r = S.round;
  if (S.phase === 'run') return `run-${r.seg}-${r.sub}`;
  if (S.phase === 'vote') return `vote-${r.voteStage}-${r.voteIdx}`;
  return `${S.phase}-${S.roundNo}`;
}

function render() {
  const app = $('#app');
  app.innerHTML = view();
  const key = screenKey();
  if (key !== ui.screenKey) {
    ui.screenKey = key;
    app.firstElementChild?.classList.add('enter');
    if (key.startsWith('vote-intro') || key === `victory-${S.roundNo}`) document.body.classList.remove('fast-rays');
  }
  ui.newId = null;
  // Les balances des coins (comme sur la carte) seulement sur les écrans aérés.
  document.body.classList.toggle('deco', ui.home || ['run', 'victory'].includes(S.phase) || (S.phase === 'vote' && S.round?.voteStage === 'intro'));
  renderSheet();
  afterRender();
}

function renderSheet() {
  $('#sheet').innerHTML = sheetView();
}

function afterRender() {
  if (ui.focus) {
    const el = document.getElementById(ui.focus);
    if (el) {
      el.focus({ preventScroll: true });
      el.setSelectionRange?.(el.value.length, el.value.length); // curseur en fin de texte
    }
    ui.focus = null;
  }
  // Barres du décompte des voix : animées après l'affichage.
  requestAnimationFrame(() => document.querySelectorAll('.bar > i[data-w]').forEach((i) => (i.style.width = `${i.dataset.w}%`)));
  if (ui.home) return;
  if (S.phase === 'victory') confetti();
  if (S.phase === 'run') live(Date.now());
}

setRenderers(render, renderSheet);

// ----- Boucle du chrono (10 fois par seconde) -----

function tick() {
  const now = Date.now();
  const gap = now - ui.lastTick;
  ui.lastTick = now;
  if (ui.home || S.phase !== 'run' || !S.round) return;
  const r = S.round;
  if (r.paused == null) {
    // Retour après une mise en veille : on met en pause au lieu d'enchaîner les tours à l'aveugle.
    if (gap > 2500) {
      r.paused = Math.max(0, r.subEnds - (now - gap));
      return commit();
    }
    if (now >= r.subEnds) return advance(now);
  }
  live(now);
  if (now - ui.lastSave > 1000) {
    ui.lastSave = now;
    save();
  }
}

// ----- Écouteurs -----

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  const fn = el && !el.disabled && ACTS[el.dataset.act];
  if (!fn) return;
  e.preventDefault();
  sfx.unlock();
  fn(el, e);
});

// Inscription d'un joueur.
document.addEventListener('submit', (e) => {
  const form = e.target.closest('[data-form="add-player"]');
  if (!form) return;
  e.preventDefault();
  const input = form.querySelector('input');
  const name = input.value.trim().replace(/\s+/g, ' ');
  if (!name || S.players.length >= MAX_PLAYERS) return;
  if (S.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
    input.setCustomValidity('Ce prénom est déjà inscrit');
    input.reportValidity();
    return;
  }
  const id = uid();
  S.players.push({ id, name, score: 0, objLeft: S.settings.objectionsPerPlayer });
  Object.assign(ui, { newId: id, draft: '', focus: 'name-input' });
  sfx.unlock();
  sfx.gavel(1);
  commit();
});

document.addEventListener('input', (e) => {
  if (e.target.id !== 'name-input') return;
  ui.draft = e.target.value;
  e.target.setCustomValidity('');
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && ui.sheet) closeSheet();
  // Barre d'espace : pause / reprise du chrono.
  if (e.key === ' ' && !ui.home && S.phase === 'run' && !ui.sheet && e.target === document.body) {
    e.preventDefault();
    S.round.paused != null ? resume() : pause();
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !ui.home && S.phase === 'run') wakeOn();
});

setupPwa();
setInterval(tick, 100);
render();
