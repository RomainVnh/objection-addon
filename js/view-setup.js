/* Écrans d'avant les plaidoiries : accueil, inscription, préparation de la manche. */
import { S, ui } from './state.js';
import { MIN_PLAYERS, MAX_PLAYERS, defi } from './data.js';
import { esc, nameOf, plural, player, ordinal } from './utils.js';
import { ICON } from './icons.js';
import { finalOrder, secondsFor, witnessFor } from './game.js';
import { topbar, menuBtn, homeBtn, frame } from './view-common.js';

// ----- Accueil -----

const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/** Bouton d'installation (PWA) ou explication pour iPhone. */
function installBlock() {
  if (isStandalone()) return '';
  if (ui.installEvt) return `<button class="btn block" data-act="install">${ICON.download} Install the app</button>`;
  if (isIOS()) return `<button class="btn link" data-act="open-sheet" data-sheet="install-ios">${ICON.download} Install on iPhone</button>`;
  return '';
}

export function homeView() {
  const inGame = S.players.length >= MIN_PLAYERS && S.phase !== 'register';
  return `
    <section class="screen full">
      <div class="home">
        <div class="home-card" role="img" aria-label="Objection! card back"></div>
        <div class="home-text">
          <div class="eyebrow">Courtroom timer</div>
          <p class="muted">Player sign-up, timed pleas, objections and voting: the judge runs the round from a single phone.</p>
          <div class="home-actions">
            ${inGame ? `<button class="btn primary big block" data-act="resume">Resume · round ${S.roundNo}</button>` : ''}
            <button class="btn ${inGame ? '' : 'primary big'} block" data-act="new-game">${inGame ? 'New game' : 'Start'}</button>
            <button class="btn link" data-act="open-sheet" data-sheet="help">How does it work?</button>
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
        <div class="main"><span class="name">${name}</span>${i === 0 ? `<span class="tag">${ICON.gavelMini} Judge · round 1</span>` : ''}</div>
        <div class="end">
          <button class="mini-btn" data-act="move" data-id="${p.id}" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="Move ${name} up">${ICON.up}</button>
          <button class="mini-btn" data-act="move" data-id="${p.id}" data-dir="1" ${i === n - 1 ? 'disabled' : ''} aria-label="Move ${name} down">${ICON.down}</button>
          <button class="mini-btn" data-act="remove" data-id="${p.id}" aria-label="Remove ${name}">${ICON.trash}</button>
        </div>
      </li>`;
    })
    .join('');
  // Places encore libres jusqu'au minimum, pour montrer où va le prochain joueur.
  const empty = Array.from(
    { length: Math.max(0, MIN_PLAYERS - n) },
    (_, k) => `<li class="empty-seat"><span class="seat">${n + k + 1}</span><span>${n + k === 0 ? 'The judge for the first round' : 'Next player, on the left'}</span></li>`,
  ).join('');
  const next = n === 0 ? 'The first player to sign up will be the judge for the first round.' : `Next up: the player sitting to the left of <strong>${esc(S.players[n - 1].name)}</strong>.`;
  const missing = MIN_PLAYERS - n;
  return `
    <section class="screen">
      ${topbar('New game', 'Sign-up', homeBtn(), menuBtn('settings'))}
      ${frame(
        'Who’s playing?',
        `<div class="clockwise">${ICON.clockwise}<span>Everyone signs up in turn, <strong>going clockwise</strong>. ${next}</span></div>
        <form class="add-row" data-form="add-player">
          <input class="field" id="name-input" name="name" maxlength="16" autocomplete="off" autocapitalize="words" enterkeyhint="done"
            placeholder="${full ? 'Table full' : `Player ${n + 1}`}" value="${esc(ui.draft)}" ${full ? 'disabled' : ''} aria-label="Player name" />
          <button class="btn primary" type="submit" ${full ? 'disabled' : ''}>Add</button>
        </form>`,
      )}
      <ul class="rows">${rows}${empty}</ul>
      <p class="muted small center">3 or 4 players by the rules, up to ${MAX_PLAYERS} possible.<br />Each player gets ${plural(S.settings.objectionsPerPlayer, 'Objection card')} for the whole game.</p>
      <div class="spacer"></div>
      <div class="dock">
        <button class="btn primary big block" data-act="start-game" ${missing > 0 ? 'disabled' : ''}>
          ${missing > 0 ? `${plural(missing, 'more player')} to sign up` : 'Open the hearing'}
        </button>
      </div>
    </section>`;
}

// ----- Préparation de la manche -----

/** Bouton « + Challenge » d'un joueur, ou le nom de sa carte. */
function defiChip(id) {
  const r = S.round;
  const d = defi(r.defis[id]);
  let label = d ? esc(d.nom) : '+ Challenge';
  if (d?.id === 'ordre-de-passage' && r.positions[id]) label += ` · ${ordinal(r.positions[id])}`;
  if (d?.id === 'temoin-surprise' && r.witness[id]) label += ` · ${nameOf(r.witness[id])}`;
  return `<button class="defi-chip ${d ? 'set' : ''} ${d?.immediat ? 'immediat' : ''}" data-act="open-sheet" data-sheet="defi" data-id="${id}">${label}</button>`;
}

function objectionBlock() {
  const r = S.round;
  if (r.objection) {
    return `<div class="objection-done">
      <div><strong>${nameOf(r.objection.by)}</strong> objected to <strong>${nameOf(r.objection.target)}</strong>.<div class="small muted">Total silence for this round.</div></div>
      <button class="btn small" data-act="cancel-objection">Cancel</button>
    </div>`;
  }
  const left = S.players.some((p) => p.objLeft > 0);
  return `<p class="small muted lead">Right after the question is read, before the challenges. Only one per round.</p>
    <button class="objection-btn logo-text" data-act="open-sheet" data-sheet="objection" ${left ? '' : 'disabled'}>Objection!</button>
    ${left ? '' : '<p class="small muted center" style="margin-top:12px">No Objection cards left in play.</p>'}`;
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
        <div class="main"><span class="name">${nameOf(id)}</span><div class="meta">${id === r.judge ? `<span class="tag">${ICON.gavelMini} Judge</span>` : ''}${defiChip(id)}</div></div>
        <div class="secs">${secondsFor(id)}<small>s</small></div>
      </div>`,
    )
    .join('');
  const silencedRow = r.objection
    ? `<div class="row is-silenced"><span class="seat off">–</span><div class="main"><span class="name">${nameOf(r.objection.target)}</span><div class="meta"><span class="tag grey">Objection: silenced</span></div></div><div class="secs">0<small>s</small></div></div>`
    : '';
  return `
    <section class="screen wide">
      ${topbar(`Round ${r.no} · first to ${S.settings.scoreToWin} pts`, 'Setup', '', menuBtn())}
      <div class="two-col">
        <div class="stack">
          <section class="frame judge-card">
            <div class="gavel-badge">${ICON.gavel}</div>
            <div style="min-width:0">
              <div class="eyebrow">Judge for this round</div>
              <div class="logo-text judge-name">${esc(player(r.judge).name)}</div>
              <p class="small muted">Draw a Case card, pick one of its two questions and read it aloud.</p>
            </div>
          </section>
          ${frame('Objection', objectionBlock())}
        </div>
        ${frame(
          'Challenges and speaking order',
          `<p class="small muted lead">Everyone draws a Challenge card. <strong>Immediate</strong> cards change the timer or the order: tap “+ Challenge” to record them.</p>
           <div class="rows">${rows}${silencedRow}</div>`,
        )}
      </div>
      <div class="spacer"></div>
      <div class="dock">
        <button class="btn primary big block" data-act="launch">Start the pleas</button>
        <p class="hint">${plural(order.length, 'plea')} · about ${minutes} min</p>
      </div>
    </section>`;
}
