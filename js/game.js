/* Règles d'une manche : ordre de passage, chrono, objection, vote et points. */
import { S, ui, commit } from './state.js';
import { INTRO_MS, END_MS, FINALE_MS, defi } from './data.js';
import { player, buzz, wakeOn, wakeOff } from './utils.js';
import { sfx } from './sound.js';
import { playObjectionFx } from './fx.js';

// ----- Manche -----

/** Le juge tourne dans le sens des aiguilles d'une montre : le premier inscrit commence. */
export function newRound() {
  const n = S.players.length;
  const base = S.players.map((_, k) => S.players[(S.roundNo - 1 + k) % n].id);
  S.round = {
    no: S.roundNo,
    judge: base[0],
    base, // ordre autour de la table, à partir du juge
    objection: null, // { by, target }
    defis: {}, // joueur -> id de sa carte Défi
    positions: {}, // carte Ordre de passage : joueur -> place choisie
    witness: {}, // carte Témoin surprise : joueur -> témoin
    copies: [], // joueurs signalés pour copie (ne reçoivent pas de voix)
    segs: [], // tours de parole
    seg: 0,
    sub: null, // countdown | intro | talk | end | finale
    subEnds: 0,
    paused: null, // temps restant quand le chrono est en pause
    voteStage: 'intro',
    votes: [],
    voteIdx: 0,
    result: null,
    startedAt: Date.now(),
  };
  ui.voteSel = null;
}

export function startGame() {
  for (const p of S.players) {
    p.score = 0;
    p.objLeft = S.settings.objectionsPerPlayer;
  }
  S.history = [];
  S.roundNo = 1;
  newRound();
  S.phase = 'prep';
  sfx.unlock();
  sfx.gavel(2);
  commit();
}

export const silenced = (id) => S.round?.objection?.target === id;
/** Les joueurs qui plaident (et votent) : tous sauf celui visé par l'objection. */
export const pleaders = () => S.round.base.filter((id) => !silenced(id));

/** Ordre de passage : à partir du juge, puis les cartes « Ordre de passage » prennent leur place. */
export function finalOrder() {
  const r = S.round;
  const list = pleaders();
  const out = Array(list.length).fill(null);
  const fixed = list.filter((id) => r.defis[id] === 'ordre-de-passage' && r.positions[id]);
  for (const id of fixed) {
    let p = Math.min(list.length, r.positions[id]) - 1;
    while (out[p] !== null) p = (p + 1) % list.length;
    out[p] = id;
  }
  for (const id of list.filter((id) => !fixed.includes(id))) out[out.indexOf(null)] = id;
  return out;
}

export function secondsFor(id) {
  const s = S.settings;
  return { 'temps-reduit': s.reducedSeconds, prolongation: s.prolongSeconds }[S.round.defis[id]] ?? s.pleaSeconds;
}

/** Témoin surprise actif pour ce joueur (le témoin ne doit pas être réduit au silence). */
export const witnessFor = (id) => (S.round.defis[id] === 'temoin-surprise' && !silenced(S.round.witness[id]) ? S.round.witness[id] : null);

function buildSegs() {
  const segs = [];
  for (const id of finalOrder()) {
    const w = witnessFor(id);
    if (w) segs.push({ kind: 'witness', speaker: w, for: id, total: S.settings.witnessSeconds * 1000 });
    segs.push({ kind: 'plea', speaker: id, total: secondsFor(id) * 1000 });
  }
  return segs.map((s) => ({ ...s, base: s.total, result: null, spoke: 0, mods: [] }));
}

/** Le défi à respecter pendant la plaidoirie (pas les cartes d'ordre ou de témoin, déjà jouées). */
export function pleaDefi(seg) {
  if (seg.kind !== 'plea') return null;
  const d = defi(S.round.defis[seg.speaker]);
  return d && !['ordre-de-passage', 'temoin-surprise'].includes(d.id) ? d : null;
}

/** Temps prévu pour un tour : celui de départ, ou plus si une Prolongation l'a allongé. */
export const allowed = (seg) => Math.max(seg.base, seg.total);

// ----- Chrono -----

export const remaining = (now = Date.now()) => {
  const r = S.round;
  return r.paused != null ? r.paused : Math.max(0, r.subEnds - now);
};

function enterSub(sub, now = Date.now()) {
  const r = S.round;
  if (sub === 'countdown' && S.settings.countdown <= 0) sub = 'intro';
  r.sub = sub;
  r.paused = null;
  ui.lastDigit = null;
  ui.lastSecond = null;
  document.body.classList.toggle('fast-rays', ['countdown', 'intro', 'finale'].includes(sub));
  const durations = { countdown: S.settings.countdown * 1000, intro: INTRO_MS, talk: r.segs[r.seg].total, end: END_MS, finale: FINALE_MS };
  r.subEnds = now + durations[sub];
  if (sub === 'intro') sfx.whoosh();
  if (sub === 'talk') {
    sfx.go();
    buzz(60);
  }
  if (sub === 'finale') {
    sfx.gavel(3);
    buzz([80, 60, 80, 60, 160]);
  }
}

export function launch() {
  if (pleaders().length < 2) return;
  const r = S.round;
  r.segs = buildSegs();
  r.seg = 0;
  r.launchedAt = Date.now();
  S.phase = 'run';
  sfx.unlock();
  enterSub('countdown');
  wakeOn();
  commit();
}

/** Fin d'une plaidoirie : 'time' (temps écoulé), 'done' (a fini) ou 'fail' (défi raté). */
export function finishTalk(result, now = Date.now()) {
  const seg = S.round.segs[S.round.seg];
  seg.result = result;
  seg.spoke = Math.max(0, seg.total - remaining(now));
  if (result === 'time') {
    sfx.timeUp();
    buzz([200, 100, 200]);
  } else if (result === 'fail') {
    sfx.fail();
    buzz([90, 60, 90]);
  } else {
    sfx.gavel(1);
    buzz(60);
  }
  enterSub('end', now);
}

/** Passe à l'étape suivante : décompte → nom → chrono → fin du temps → joueur suivant… → vote. */
export function advance(now = Date.now()) {
  const r = S.round;
  if (r.sub === 'countdown') enterSub('intro', now);
  else if (r.sub === 'intro') enterSub('talk', now);
  else if (r.sub === 'talk') finishTalk('time', now);
  else if (r.sub === 'end') {
    if (r.seg < r.segs.length - 1) {
      r.seg++;
      enterSub('countdown', now);
    } else enterSub('finale', now);
  } else if (r.sub === 'finale') {
    S.phase = 'vote';
    r.voteStage = 'intro';
    document.body.classList.remove('fast-rays');
    wakeOff();
    sfx.murmur();
  }
  commit();
}

export function pause() {
  const r = S.round;
  if (r.paused != null) return;
  r.paused = remaining();
  commit();
}

export function resume() {
  const r = S.round;
  if (r.paused == null) return;
  r.subEnds = Date.now() + r.paused;
  r.paused = null;
  sfx.unlock();
  commit();
}

/** Change le temps restant de la plaidoirie en cours. */
export function setRemaining(ms) {
  const r = S.round;
  r.segs[r.seg].total += ms - remaining();
  if (r.paused != null) r.paused = ms;
  else r.subEnds = Date.now() + ms;
}

export function stopRun() {
  const r = S.round;
  r.segs = [];
  r.sub = null;
  r.paused = null;
  S.phase = 'prep';
  document.body.classList.remove('fast-rays');
  wakeOff();
}

// ----- Objection -----

export function applyObjection(by, target) {
  const r = S.round;
  r.objection = { by, target };
  player(by).objLeft = Math.max(0, player(by).objLeft - 1);
  // Le joueur réduit au silence perd son défi, et ne peut plus être témoin.
  delete r.defis[target];
  delete r.positions[target];
  delete r.witness[target];
  for (const k of Object.keys(r.witness)) if (r.witness[k] === target) delete r.witness[k];
  commit();
  playObjectionFx(`${player(target).name} est réduit au silence`, 'Pas de plaidoirie, pas de vote, aucune voix possible.');
}

export function cancelObjection() {
  const r = S.round;
  if (!r.objection) return;
  const by = player(r.objection.by);
  if (by) by.objLeft += 1;
  r.objection = null;
  commit();
}

// ----- Vote -----

export const voters = () => S.round.segs.filter((s) => s.kind === 'plea').map((s) => s.speaker);
export const canReceive = (id) => !silenced(id) && !S.round.copies.includes(id);
/** Poids d'un vote : ×2 avec la carte Voix double, ×2 avec la carte Point double. */
export const voteWeight = (v, defis = S.round.defis) => (defis[v.voter] === 'voix-double' ? 2 : 1) * (v.double ? 2 : 1);

export function castVote(target) {
  const r = S.round;
  r.votes.push({ voter: voters()[r.voteIdx], target, ...(target && ui.voteDouble ? { double: true } : {}) });
  ui.voteSel = null;
  ui.voteDouble = false;
  sfx.gavel(1);
  if (r.voteIdx < voters().length - 1) r.voteIdx += 1;
  else computeResult();
  commit();
}

function computeResult() {
  const r = S.round;
  if (r.result) return;
  const weights = {};
  for (const v of r.votes) if (v.target) weights[v.target] = (weights[v.target] || 0) + voteWeight(v);
  const max = Math.max(0, ...Object.values(weights));
  const leaders = max > 0 ? Object.keys(weights).filter((k) => weights[k] === max) : [];
  let winner = null;
  let reason = 'none';
  if (leaders.length === 1) {
    winner = leaders[0];
    reason = 'majority';
  } else if (leaders.length > 1) {
    // Égalité : le vote du juge compte double. S'il a voté pour un autre joueur, personne ne marque.
    const jv = r.votes.find((v) => v.voter === r.judge);
    if (jv && leaders.includes(jv.target)) {
      winner = jv.target;
      reason = 'judge';
    } else reason = 'tie';
  }
  if (winner) player(winner).score += 1;
  r.result = { weights, leaders, winner, reason };
  S.history.push({
    no: r.no,
    judge: r.judge,
    objection: r.objection,
    defis: { ...r.defis },
    segs: r.segs.map(({ kind, speaker, for: f, total, base, spoke, result, mods }) => ({ kind, speaker, for: f, total, base, spoke, result, mods })),
    votes: r.votes,
    copies: r.copies,
    winner,
    reason,
    durationMs: Date.now() - r.startedAt,
  });
  S.phase = 'results';
  sfx.gavel(winner ? 2 : 1);
  if (winner) setTimeout(sfx.fanfare, 350);
}

export const champion = () => S.players.find((p) => p.score >= S.settings.scoreToWin) || null;
