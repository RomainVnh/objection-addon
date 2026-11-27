/* Écrans d'avant les plaidoiries : accueil, inscription, préparation de la manche. */
import { S, ui } from './state.js';
import { MIN_PLAYERS, MAX_PLAYERS, defi } from './data.js';
import { esc, nameOf, plural, player } from './utils.js';
import { ICON } from './icons.js';
import { finalOrder, secondsFor, witnessFor } from './game.js';
import { topbar, menuBtn, homeBtn, frame } from './view-common.js';

// ----- Accueil -----

const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/** Bouton d'installation (PWA) ou explication pour iPhone. */
function installBlock() {
  if (isStandalone()) return '';
  if (ui.installEvt) return `<button class="btn block" data-act="install">${ICON.download} Installer l’appli</button>`;
  if (isIOS()) return `<button class="btn link" data-act="open-sheet" data-sheet="install-ios">${ICON.download} Installer sur l’iPhone</button>`;
  return '';
}

export function homeView() {
  const inGame = S.players.length >= MIN_PLAYERS && S.phase !== 'register';
  return `
    <section class="screen full">
      <div class="home">
        <div class="home-card" role="img" aria-label="Dos de carte Objection !"></div>
        <div class="home-text">
          <div class="eyebrow">Chrono du tribunal</div>
          <p class="muted">Inscription des joueurs, plaidoiries chronométrées, objections et vote : le juge pilote la manche depuis un seul téléphone.</p>
          <div class="home-actions">
            ${inGame ? `<button class="btn primary big block" data-act="resume">Reprendre · manche ${S.roundNo}</button>` : ''}
            <button class="btn ${inGame ? '' : 'primary big'} block" data-act="new-game">${inGame ? 'Nouvelle partie' : 'Commencer'}</button>
            <button class="btn link" data-act="open-sheet" data-sheet="help">Comment ça marche ?</button>
            ${installBlock()}
          </div>
        </div>
      </div>
    </section>`;
}

// ----- Inscription -----

export function registerView() {
  const n = S.players.length;
  const full = n >= MAX_PLAYERS;
  const rows = S.players
    .map((p, i) => {
      const name = esc(p.name);
      return `
      <li class="row ${i === 0 ? 'is-judge' : ''} ${ui.newId === p.id ? 'is-new' : ''}">
        <span class="seat">${i + 1}</span>
        <div class="main"><span class="name">${name}</span>${i === 0 ? `<span class="tag">${ICON.gavelMini} Juge · manche 1</span>` : ''}</div>
        <div class="end">
          <button class="mini-btn" data-act="move" data-id="${p.id}" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="Monter ${name}">${ICON.up}</button>
          <button class="mini-btn" data-act="move" data-id="${p.id}" data-dir="1" ${i === n - 1 ? 'disabled' : ''} aria-label="Descendre ${name}">${ICON.down}</button>
          <button class="mini-btn" data-act="remove" data-id="${p.id}" aria-label="Retirer ${name}">${ICON.trash}</button>
        </div>
      </li>`;
    })
    .join('');
  // Places encore libres jusqu'au minimum, pour montrer où va le prochain joueur.
  const empty = Array.from(
    { length: Math.max(0, MIN_PLAYERS - n) },
    (_, k) => `<li class="empty-seat"><span class="seat">${n + k + 1}</span><span>${n + k === 0 ? 'Le juge de la première manche' : 'Joueur suivant, à gauche'}</span></li>`,
  ).join('');
  const next = n === 0 ? 'Le premier inscrit sera le juge de la première manche.' : `Au tour du joueur assis à gauche de <strong>${esc(S.players[n - 1].name)}</strong>.`;
  const missing = MIN_PLAYERS - n;
  return `
    <section class="screen">
      ${topbar('Nouvelle partie', 'Inscription', homeBtn(), menuBtn('settings'))}
      ${frame(
        'Qui joue ?',
        `<div class="clockwise">${ICON.clockwise}<span>Chacun s'inscrit à son tour, <strong>dans le sens des aiguilles d'une montre</strong>. ${next}</span></div>
        <form class="add-row" data-form="add-player">
          <input class="field" id="name-input" name="name" maxlength="16" autocomplete="off" autocapitalize="words" enterkeyhint="done"
            placeholder="${full ? 'Table complète' : `Joueur ${n + 1}`}" value="${esc(ui.draft)}" ${full ? 'disabled' : ''} aria-label="Prénom du joueur" />
          <button class="btn primary" type="submit" ${full ? 'disabled' : ''}>Ajouter</button>
        </form>`,
      )}
      <ul class="rows">${rows}${empty}</ul>
      <p class="muted small center">3 ou 4 joueurs selon les règles, jusqu'à ${MAX_PLAYERS} possible.<br />Chacun reçoit ${plural(S.settings.objectionsPerPlayer, 'carte')} Objection pour toute la partie.</p>
      <div class="spacer"></div>
      <div class="dock">
        <button class="btn primary big block" data-act="start-game" ${missing > 0 ? 'disabled' : ''}>
          ${missing > 0 ? `Encore ${plural(missing, 'joueur')} à inscrire` : 'Ouvrir l’audience'}
        </button>
      </div>
    </section>`;
}

// ----- Préparation de la manche -----

/** Bouton « + Défi » d'un joueur, ou le nom de sa carte. */
function defiChip(id) {
  const r = S.round;
  const d = defi(r.defis[id]);
  let label = d ? esc(d.nom) : '+ Défi';
  if (d?.id === 'ordre-de-passage' && r.positions[id]) label += ` · ${r.positions[id]}<sup>e</sup>`;
  if (d?.id === 'temoin-surprise' && r.witness[id]) label += ` · ${nameOf(r.witness[id])}`;
  return `<button class="defi-chip ${d ? 'set' : ''} ${d?.immediat ? 'immediat' : ''}" data-act="open-sheet" data-sheet="defi" data-id="${id}">${label}</button>`;
}

function objectionBlock() {
  const r = S.round;
  if (r.objection) {
    return `<div class="objection-done">
      <div><strong>${nameOf(r.objection.by)}</strong> a fait objection contre <strong>${nameOf(r.objection.target)}</strong>.<div class="small muted">Silence total pour cette manche.</div></div>
      <button class="btn small" data-act="cancel-objection">Annuler</button>
    </div>`;
  }
  const left = S.players.some((p) => p.objLeft > 0);
  return `<p class="small muted lead">Juste après la lecture de la question, avant les défis. Une seule par manche.</p>
    <button class="objection-btn logo-text" data-act="open-sheet" data-sheet="objection" ${left ? '' : 'disabled'}>Objection !</button>
    ${left ? '' : '<p class="small muted center" style="margin-top:12px">Plus aucune carte Objection en jeu.</p>'}`;
}

export function prepView() {
  const r = S.round;
  const order = finalOrder();
  const talkSeconds = order.reduce((sum, id) => sum + secondsFor(id) + (witnessFor(id) ? S.settings.witnessSeconds : 0), 0);
  const minutes = Math.max(1, Math.round((talkSeconds + order.length * (S.settings.countdown + 3.5)) / 60));
  const rows = order
    .map(
      (id, i) => `
      <div class="row ${id === r.judge ? 'is-judge' : ''}">
        <span class="seat">${i + 1}</span>
        <div class="main"><span class="name">${nameOf(id)}</span><div class="meta">${id === r.judge ? `<span class="tag">${ICON.gavelMini} Juge</span>` : ''}${defiChip(id)}</div></div>
        <div class="secs">${secondsFor(id)}<small>s</small></div>
      </div>`,
    )
    .join('');
  const silencedRow = r.objection
    ? `<div class="row is-silenced"><span class="seat off">–</span><div class="main"><span class="name">${nameOf(r.objection.target)}</span><div class="meta"><span class="tag grey">Objection : silence</span></div></div><div class="secs">0<small>s</small></div></div>`
    : '';
  return `
    <section class="screen wide">
      ${topbar(`Manche ${r.no} · objectif ${S.settings.scoreToWin} pts`, 'Préparation', '', menuBtn())}
      <div class="two-col">
        <div class="stack">
          <section class="frame judge-card">
            <div class="gavel-badge">${ICON.gavel}</div>
            <div style="min-width:0">
              <div class="eyebrow">Juge de la manche</div>
              <div class="logo-text judge-name">${esc(player(r.judge).name)}</div>
              <p class="small muted">Pioche une carte Affaire, choisis une des deux questions et lis-la à voix haute.</p>
            </div>
          </section>
          ${frame('Objection', objectionBlock())}
        </div>
        ${frame(
          'Défis et ordre de passage',
          `<p class="small muted lead">Chacun pioche une carte Défi. Les cartes <strong>immédiat</strong> changent le chrono ou l'ordre : touche « + Défi » pour les noter.</p>
           <div class="rows">${rows}${silencedRow}</div>`,
        )}
      </div>
      <div class="spacer"></div>
      <div class="dock">
        <button class="btn primary big block" data-act="launch">Lancer les plaidoiries</button>
        <p class="hint">${plural(order.length, 'plaidoirie')} · environ ${minutes} min</p>
      </div>
    </section>`;
}
