/* Écrans de fin de manche : heure du vote, bulletin, verdict, victoire. */
import { S, ui } from './state.js';
import { cardImg } from './data.js';
import { esc, nameOf, secs, plural, diamonds } from './utils.js';
import { ICON } from './icons.js';
import { voters, canReceive, silenced, voteWeight, allowed, champion } from './game.js';
import { topbar, menuBtn, frame, opt, scoreRows } from './view-common.js';

export function voteIntroView() {
  const r = S.round;
  const chips = voters()
    .map((id) => {
      const copy = r.copies.includes(id);
      return `<button class="defi-chip ${copy ? 'set' : ''}" data-act="toggle-copy" data-id="${id}">${nameOf(id)}${copy ? ' · copie' : ''}</button>`;
    })
    .join('');
  return `
    <section class="screen full">
      <div class="stack" style="width:min(520px,100%);justify-items:center">
        <div class="band-wrap"><div class="intro"><div class="band"><span class="logo-text" style="font-size:clamp(42px,12vw,96px)">L’heure du vote&nbsp;!</span></div></div></div>
        <p class="muted" style="max-width:34ch">Chacun désigne, à son tour, le joueur qui l'a le plus convaincu. On ne vote ni pour soi, ni pour un joueur réduit au silence.</p>
        ${r.objection ? `<span class="tag grey">${nameOf(r.objection.target)} : objection, pas de vote</span>` : ''}
        ${frame('Copie signalée ?', `<p class="small muted lead">Si la majorité estime qu'un joueur a repris la réponse d'un autre, il ne peut pas recevoir de voix.</p><div class="chip-row">${chips}</div>`, 'style="width:100%"')}
        <button class="btn primary big block" data-act="start-vote">Commencer le vote</button>
      </div>
    </section>`;
}

export function ballotView() {
  const r = S.round;
  const vs = voters();
  const voter = vs[r.voteIdx];
  const sel = ui.voteSel;
  const others = r.base.filter((id) => id !== voter);
  const anyEligible = others.some(canReceive);
  const cands = others
    .map((id) => {
      const why = silenced(id) ? 'Objection' : r.copies.includes(id) ? 'Copie' : '';
      return `<button class="candidate ${sel === id ? 'selected' : ''}" data-act="pick" data-id="${id}" ${why ? 'disabled' : ''}>
        ${sel === id ? `<span class="check">${ICON.check}</span>` : ''}
        <span class="seat">${S.players.findIndex((p) => p.id === id) + 1}</span><span class="label">${nameOf(id)}</span>${why ? `<span class="why">${why}</span>` : ''}
      </button>`;
    })
    .join('');
  const doubleDesc = !ui.voteDouble ? 'Ton vote compte pour 2 voix au lieu d’une.' : sel ? `Ton vote donne 2 voix à ${nameOf(sel)}.` : 'Choisis le joueur qui recevra tes 2 voix.';
  const doubleCard = opt('toggle-double', 'Carte Point double', { desc: doubleDesc, selected: ui.voteDouble, cls: 'double-card', img: 'point-double', attrs: `aria-pressed="${ui.voteDouble}"` });
  const backBtn = `<button class="icon-btn" data-act="vote-back" aria-label="Vote précédent">${ICON.back}</button>`;
  return `
    <section class="screen">
      ${topbar(`Vote ${r.voteIdx + 1} / ${vs.length}`, diamonds(vs.length, r.voteIdx), backBtn)}
      <div class="voter-head">
        <div class="eyebrow">Passe le téléphone à</div>
        <div class="logo-text name-big" style="font-size:clamp(36px,11vw,72px)">${nameOf(voter)}</div>
        <div class="chip-row" style="margin-top:6px">${voter === r.judge ? `<span class="tag">${ICON.gavelMini} Juge : départage les égalités</span>` : ''}${r.defis[voter] === 'voix-double' ? '<span class="tag cream">Voix double</span>' : ''}</div>
        <p class="muted">Qui t'a le plus convaincu ?</p>
      </div>
      <div class="candidates">${cands}</div>
      ${anyEligible ? doubleCard : ''}
      <div class="spacer"></div>
      <div class="dock">
        ${anyEligible ? `<button class="btn primary big block" data-act="cast" ${sel ? '' : 'disabled'}>Valider mon vote</button>` : `<button class="btn big block" data-act="cast-none">Personne à désigner : passer</button>`}
      </div>
    </section>`;
}

export function resultsView() {
  const r = S.round;
  const res = r.result;
  const max = Math.max(1, ...Object.values(res.weights));
  const tally = r.base
    .map((id) => {
      const n = res.weights[id] || 0;
      const out = !canReceive(id);
      return `<div class="tally-row ${res.winner === id ? 'win' : ''} ${out ? 'out' : ''}"><span class="name">${nameOf(id)}</span><div class="bar"><i data-w="${(n / max) * 100}"></i></div><span class="n">${out ? '–' : n}</span></div>`;
    })
    .join('');
  const msg = {
    majority: `${nameOf(res.winner)} a le plus de voix et marque 1 point.`,
    judge: `Égalité ! Le vote du juge compte double : ${nameOf(res.winner)} marque 1 point.`,
    tie: 'Égalité, et le juge a voté pour un autre joueur : personne ne marque.',
    none: 'Aucune voix : personne ne marque.',
  }[res.reason];
  const doubles = r.votes.filter((v) => v.double);
  const doubleNote = doubles.length
    ? `<div class="double-note">${cardImg('point-double', 'pill-img')}<div><strong>Point double !</strong><div class="small muted">${doubles.map((v) => `Le vote de ${nameOf(v.voter)} pour ${nameOf(v.target)} a compté 2 voix.`).join(' ')}</div></div></div>`
    : '';
  const times = r.segs
    .map((s) => {
      const how = { time: 'temps écoulé', done: 'a fini', fail: 'défi raté' }[s.result] || '';
      return `<div class="time-row"><span class="who">${nameOf(s.speaker)}${s.kind === 'witness' ? ` <span class="small muted">· témoin</span>` : ''}</span><span class="val small"><strong>${secs(s.spoke)} s</strong> / ${secs(allowed(s))} s · <span class="muted">${how}</span></span></div>`;
    })
    .join('');
  const champ = champion();
  const nextJudge = S.players[S.roundNo % S.players.length];
  return `
    <section class="screen wide">
      ${topbar(`Manche ${r.no}`, 'Le verdict', '', menuBtn())}
      <div class="two-col">
        <div class="stack">
          ${frame(
            '',
            `<div class="verdict">
               <div class="eyebrow">${res.winner ? 'Le plus convaincant' : 'Pas de point cette manche'}</div>
               <div class="logo-text name-big" style="font-size:clamp(34px,10vw,64px)">${res.winner ? nameOf(res.winner) : 'Égalité'}</div>
               <p>${msg}</p>
             </div>`,
          )}
          ${doubleNote}
          ${frame('Les voix', `<div class="tally">${tally}</div>`)}
        </div>
        <div class="stack">
          ${frame('Scores', scoreRows(res.winner))}
          ${frame('Temps de parole', `<div class="times">${times || '<p class="muted small">Aucune plaidoirie.</p>'}</div>`)}
        </div>
      </div>
      <div class="spacer"></div>
      <div class="dock">
        ${
          champ
            ? `<button class="btn gold big block" data-act="victory">${esc(champ.name)} gagne la partie !</button>`
            : `<button class="btn primary big block" data-act="next-round">Manche suivante</button><p class="hint">Nouveau juge : <strong>${esc(nextJudge.name)}</strong>, à gauche de ${nameOf(r.judge)}</p>`
        }
      </div>
    </section>`;
}

/** Manches gagnées, voix reçues et temps de parole d'un joueur sur toute la partie. */
function statsOf(p) {
  let spoke = 0;
  let votes = 0;
  for (const h of S.history) {
    for (const s of h.segs) if (s.speaker === p.id) spoke += s.spoke;
    for (const v of h.votes) if (v.target === p.id) votes += voteWeight(v, h.defis);
  }
  const wins = S.history.filter((h) => h.winner === p.id).length;
  return `<div class="time-row"><span class="who">${esc(p.name)}</span><span class="val small">${plural(wins, 'manche')} · ${plural(votes, 'voix')} · ${Math.round(spoke / 1000)} s</span></div>`;
}

export function victoryView() {
  const champ = champion() || [...S.players].sort((a, b) => b.score - a.score)[0];
  return `
    <div class="confetti" id="confetti"></div>
    <section class="screen wide">
      <div class="verdict" style="padding-top:calc(16px + var(--safe-t))">
        ${ICON.gavelBig}
        <div class="eyebrow">Victoire en ${plural(S.history.length, 'manche')}</div>
        <div class="intro"><div class="logo-text name-big" style="font-size:clamp(42px,13vw,96px)">${esc(champ.name)}</div></div>
        <p class="muted">remporte le procès avec ${plural(champ.score, 'point')} !</p>
      </div>
      <div class="two-col">
        ${frame('Scores', scoreRows())}
        ${frame('La partie en chiffres', `<div class="times">${S.players.map(statsOf).join('')}</div><p class="small muted center" style="margin-top:10px">Manches gagnées · voix reçues · temps de parole</p>`)}
      </div>
      <div class="spacer"></div>
      <div class="dock">
        <button class="btn primary big block" data-act="replay">Rejouer · mêmes joueurs</button>
        <button class="btn link" data-act="new-game">Nouvelle partie</button>
      </div>
    </section>`;
}
