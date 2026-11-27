/* Actions des boutons : chaque bouton porte data-act="nom", et la fonction du même nom est appelée. */
import { S, ui, save, commit, render, renderSheet, openSheet, closeSheet, resetGame } from './state.js';
import { DEFAULTS } from './data.js';
import { player, nameOf, buzz, wakeOn, wakeOff } from './utils.js';
import { sfx } from './sound.js';
import { playCardFx, playDefiFx } from './fx.js';
import * as game from './game.js';

const round = () => S.round;
const currentSeg = () => S.round.segs[S.round.seg];

/** Ferme la fenêtre du bas, sauvegarde et redessine. */
const done = () => {
  ui.sheet = null;
  commit();
};

export const ACTS = {
  // ----- Navigation -----
  home() {
    ui.home = true;
    ui.sheet = null;
    wakeOff();
    if (S.phase === 'run' && round().paused == null) round().paused = game.remaining();
    commit();
  },
  resume() {
    if (!ui.home) return game.resume();
    ui.home = false;
    sfx.unlock();
    if (S.phase === 'run') wakeOn();
    render();
  },
  'new-game'() {
    if (S.players.length && S.phase !== 'register') return openSheet({ type: 'confirm-new' });
    ui.home = false;
    S.phase = 'register';
    commit();
  },
  'new-game-confirm'() {
    resetGame();
    ui.home = false;
    ui.draft = '';
    done();
  },
  'open-sheet': (el) => openSheet({ type: el.dataset.sheet, id: el.dataset.id }),
  'close-sheet': closeSheet,
  async install() {
    const evt = ui.installEvt;
    if (!evt) return;
    evt.prompt();
    await evt.userChoice.catch(() => {});
    ui.installEvt = null;
    render();
  },

  // ----- Inscription -----
  move(el) {
    const i = S.players.findIndex((p) => p.id === el.dataset.id);
    const j = i + Number(el.dataset.dir);
    if (j < 0 || j >= S.players.length) return;
    [S.players[i], S.players[j]] = [S.players[j], S.players[i]];
    commit();
  },
  remove(el) {
    S.players = S.players.filter((p) => p.id !== el.dataset.id);
    commit();
  },
  'start-game': game.startGame,
  replay() {
    document.body.classList.remove('fast-rays');
    game.startGame();
  },

  // ----- Préparation : objection et défis -----
  'obj-by': (el) => openSheet({ type: 'objection', by: el.dataset.id }),
  'obj-reset': () => openSheet({ type: 'objection' }),
  'obj-target'(el) {
    const by = ui.sheet.by;
    closeSheet();
    game.applyObjection(by, el.dataset.id);
  },
  'cancel-objection': game.cancelObjection,
  'set-defi'(el) {
    const r = round();
    const { id, defi: d } = el.dataset;
    if (d) r.defis[id] = d;
    else delete r.defis[id];
    if (d !== 'ordre-de-passage') delete r.positions[id];
    if (d !== 'temoin-surprise') delete r.witness[id];
    // Ces deux cartes demandent un choix de plus : la place, ou le témoin.
    const next = { 'ordre-de-passage': 'position', 'temoin-surprise': 'witness' }[d];
    if (next) {
      ui.sheet = { type: next, id };
      return commit();
    }
    done();
    if (d) playDefiFx(id);
  },
  'set-position'(el) {
    round().positions[el.dataset.id] = Number(el.dataset.pos);
    done();
    playDefiFx(el.dataset.id);
  },
  'set-witness'(el) {
    round().witness[el.dataset.id] = el.dataset.w;
    done();
    playDefiFx(el.dataset.id);
  },

  // ----- Plaidoiries -----
  launch: game.launch,
  pause: game.pause,
  skip() {
    round().paused = null;
    if (round().sub !== 'talk') return game.advance();
    game.finishTalk('done');
    commit();
  },
  fail() {
    closeSheet();
    if (round().sub !== 'talk') return;
    const seg = currentSeg();
    const d = game.pleaDefi(seg);
    seg.mods.push('Challenge failed');
    game.finishTalk('fail');
    commit();
    if (d) playCardFx({ card: d.id, motion: 'fail', tone: 'red', stamp: 'Failed!', line: `${nameOf(seg.speaker)} failed their challenge`, sub: 'The plea stops right away.', shake: true, vibrate: [90, 60, 90], ms: 1900 });
  },
  'card-reduce'() {
    const seg = currentSeg();
    const s = S.settings.reducedSeconds;
    game.setRemaining(Math.min(game.remaining(), s * 1000));
    seg.mods.push('Reduced time');
    done();
    playCardFx({ card: 'temps-reduit', motion: 'drop', tone: 'hot', badge: `${s} s`, line: `Only ${s} seconds left for ${nameOf(seg.speaker)}!`, sound: 'timeDown', shake: true, vibrate: [60, 40, 120], ms: 1800 });
  },
  'card-prolong'() {
    const seg = currentSeg();
    const extra = S.settings.prolongSeconds - S.settings.pleaSeconds;
    game.setRemaining(game.remaining() + extra * 1000);
    seg.mods.push('Overtime');
    done();
    playCardFx({ card: 'prolongation', motion: 'grow', badge: `+${extra} s`, line: `${nameOf(seg.speaker)} gets ${extra} more seconds`, sound: 'powerUp', ms: 1800 });
  },
  'abort-run'() {
    game.stopRun();
    done();
  },

  // ----- Vote -----
  'toggle-copy'(el) {
    const c = round().copies;
    const i = c.indexOf(el.dataset.id);
    if (i >= 0) c.splice(i, 1);
    else c.push(el.dataset.id);
    commit();
  },
  'start-vote'() {
    Object.assign(round(), { voteStage: 'ballot', voteIdx: 0, votes: [] });
    ui.voteSel = null;
    ui.voteDouble = false;
    commit();
  },
  pick(el) {
    ui.voteSel = el.dataset.id;
    buzz(20);
    render();
  },
  'toggle-double'() {
    ui.voteDouble = !ui.voteDouble;
    render();
    if (!ui.voteDouble) return buzz(20);
    const voter = nameOf(game.voters()[round().voteIdx]);
    playCardFx({
      card: 'point-double',
      motion: 'double',
      badge: '×2',
      line: ui.voteSel ? `${voter} gives 2 votes to ${nameOf(ui.voteSel)}` : `${voter} plays the Double point card`,
      sub: 'Their vote counts as 2 votes instead of 1.',
      sound: 'double',
      vibrate: [50, 60, 50],
    });
  },
  cast: () => game.castVote(ui.voteSel),
  'cast-none': () => game.castVote(null),
  'vote-back'() {
    const r = round();
    if (r.voteIdx === 0) {
      r.voteStage = 'intro';
      return commit();
    }
    r.voteIdx -= 1;
    const prev = r.votes.pop();
    ui.voteSel = prev?.target ?? null;
    ui.voteDouble = !!prev?.double;
    commit();
  },
  'next-round'() {
    S.roundNo += 1;
    game.newRound();
    S.phase = 'prep';
    commit();
  },
  victory() {
    S.phase = 'victory';
    sfx.fanfare();
    commit();
  },

  // ----- Scores et réglages -----
  adj(el) {
    const p = player(el.dataset.id);
    p[el.dataset.k] = Math.max(0, p[el.dataset.k] + Number(el.dataset.d));
    commit();
  },
  set(el) {
    const { k, d, min, max } = el.dataset;
    S.settings[k] = Math.min(Number(max), Math.max(Number(min), S.settings[k] + Number(d)));
    commit();
  },
  toggle(el) {
    S.settings[el.dataset.k] = !S.settings[el.dataset.k];
    save();
    // Pendant les plaidoiries, on ne redessine que la fenêtre pour ne pas relancer les animations.
    if (S.phase === 'run' && !ui.home) renderSheet();
    else render();
  },
  'reset-settings'() {
    S.settings = { ...DEFAULTS, sound: S.settings.sound, vibrate: S.settings.vibrate };
    commit();
  },
};
