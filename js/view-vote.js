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
      return `<button class="defi-chip ${copy ? 'set' : ''}" data-act="toggle-copy" data-id="${id}">${nameOf(id)}${copy ? ' · copy' : ''}</button>`;
    })
    .join('');
  return `
    <section class="screen full">
      <div class="stack" style="width:min(520px,100%);justify-items:center">
        <div class="band-wrap"><div class="intro"><div class="band"><span class="logo-text" style="font-size:clamp(42px,12vw,96px)">Time to vote!</span></div></div></div>
        <p class="muted" style="max-width:34ch">In turn, everyone picks the player who convinced them most. You can’t vote for yourself or for a silenced player.</p>
        ${r.objection ? `<span class="tag grey">${nameOf(r.objection.target)}: objection, no vote</span>` : ''}
        ${frame('Copying reported?', `<p class="small muted lead">If the majority agrees a player reused someone else’s answer, that player can’t receive votes.</p><div class="chip-row">${chips}</div>`, 'style="width:100%"')}
        <button class="btn primary big block" data-act="start-vote">Start the vote</button>
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
      const why = silenced(id) ? 'Objection' : r.copies.includes(id) ? 'Copy' : '';
      return `<button class="candidate ${sel === id ? 'selected' : ''}" data-act="pick" data-id="${id}" ${why ? 'disabled' : ''}>
        ${sel === id ? `<span class="check">${ICON.check}</span>` : ''}
        <span class="seat">${S.players.findIndex((p) => p.id === id) + 1}</span><span class="label">${nameOf(id)}</span>${why ? `<span class="why">${why}</span>` : ''}
      </button>`;
    })
    .join('');
  const doubleDesc = !ui.voteDouble ? 'Your vote counts as 2 votes instead of 1.' : sel ? `Your vote gives 2 votes to ${nameOf(sel)}.` : 'Pick the player who will get your 2 votes.';
  const doubleCard = opt('toggle-double', 'Double point card', { desc: doubleDesc, selected: ui.voteDouble, cls: 'double-card', img: 'point-double', attrs: `aria-pressed="${ui.voteDouble}"` });
  const backBtn = `<button class="icon-btn" data-act="vote-back" aria-label="Previous vote">${ICON.back}</button>`;
  return `
    <section class="screen">
      ${topbar(`Vote ${r.voteIdx + 1} / ${vs.length}`, diamonds(vs.length, r.voteIdx), backBtn)}
      <div class="voter-head">
        <div class="eyebrow">Pass the phone to</div>
        <div class="logo-text name-big" style="font-size:clamp(36px,11vw,72px)">${nameOf(voter)}</div>
        <div class="chip-row" style="margin-top:6px">${voter === r.judge ? `<span class="tag">${ICON.gavelMini} Judge: breaks ties</span>` : ''}${r.defis[voter] === 'voix-double' ? '<span class="tag cream">Double vote</span>' : ''}</div>
        <p class="muted">Who convinced you most?</p>
      </div>
      <div class="candidates">${cands}</div>
      ${anyEligible ? doubleCard : ''}
      <div class="spacer"></div>
      <div class="dock">
        ${anyEligible ? `<button class="btn primary big block" data-act="cast" ${sel ? '' : 'disabled'}>Confirm my vote</button>` : `<button class="btn big block" data-act="cast-none">Nobody to vote for: skip</button>`}
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
    majority: `${nameOf(res.winner)} has the most votes and scores 1 point.`,
    judge: `Tie! The judge’s vote counts double: ${nameOf(res.winner)} scores 1 point.`,
    tie: 'Tie, and the judge voted for another player: nobody scores.',
    none: 'No votes: nobody scores.',
  }[res.reason];
  const doubles = r.votes.filter((v) => v.double);
  const doubleNote = doubles.length
    ? `<div class="double-note">${cardImg('point-double', 'pill-img')}<div><strong>Double point!</strong><div class="small muted">${doubles.map((v) => `${nameOf(v.voter)}’s vote for ${nameOf(v.target)} counted as 2 votes.`).join(' ')}</div></div></div>`
    : '';
  const times = r.segs
    .map((s) => {
      const how = { time: 'time’s up', done: 'finished', fail: 'challenge failed' }[s.result] || '';
      return `<div class="time-row"><span class="who">${nameOf(s.speaker)}${s.kind === 'witness' ? ` <span class="small muted">· witness</span>` : ''}</span><span class="val small"><strong>${secs(s.spoke)} s</strong> / ${secs(allowed(s))} s · <span class="muted">${how}</span></span></div>`;
    })
    .join('');
  const champ = champion();
  const nextJudge = S.players[S.roundNo % S.players.length];
  return `
    <section class="screen wide">
      ${topbar(`Round ${r.no}`, 'The verdict', '', menuBtn())}
      <div class="two-col">
        <div class="stack">
          ${frame(
            '',
            `<div class="verdict">
               <div class="eyebrow">${res.winner ? 'Most convincing' : 'No point this round'}</div>
               <div class="logo-text name-big" style="font-size:clamp(34px,10vw,64px)">${res.winner ? nameOf(res.winner) : 'Tie'}</div>
               <p>${msg}</p>
             </div>`,
          )}
          ${doubleNote}
          ${frame('The votes', `<div class="tally">${tally}</div>`)}
        </div>
        <div class="stack">
          ${frame('Scores', scoreRows(res.winner))}
          ${frame('Speaking time', `<div class="times">${times || '<p class="muted small">No pleas.</p>'}</div>`)}
        </div>
      </div>
      <div class="spacer"></div>
      <div class="dock">
        ${
          champ
            ? `<button class="btn gold big block" data-act="victory">${esc(champ.name)} wins the game!</button>`
            : `<button class="btn primary big block" data-act="next-round">Next round</button><p class="hint">New judge: <strong>${esc(nextJudge.name)}</strong>, to the left of ${nameOf(r.judge)}</p>`
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
  return `<div class="time-row"><span class="who">${esc(p.name)}</span><span class="val small">${plural(wins, 'round')} · ${plural(votes, 'vote')} · ${Math.round(spoke / 1000)} s</span></div>`;
}

export function victoryView() {
  const champ = champion() || [...S.players].sort((a, b) => b.score - a.score)[0];
  return `
    <div class="confetti" id="confetti"></div>
    <section class="screen wide">
      <div class="verdict" style="padding-top:calc(16px + var(--safe-t))">
        ${ICON.gavelBig}
        <div class="eyebrow">Victory in ${plural(S.history.length, 'round')}</div>
        <div class="intro"><div class="logo-text name-big" style="font-size:clamp(42px,13vw,96px)">${esc(champ.name)}</div></div>
        <p class="muted">wins the trial with ${plural(champ.score, 'point')}!</p>
      </div>
      <div class="two-col">
        ${frame('Scores', scoreRows())}
        ${frame('The game in numbers', `<div class="times">${S.players.map(statsOf).join('')}</div><p class="small muted center" style="margin-top:10px">Rounds won · votes received · speaking time</p>`)}
      </div>
      <div class="spacer"></div>
      <div class="dock">
        <button class="btn primary big block" data-act="replay">Play again · same players</button>
        <button class="btn link" data-act="new-game">New game</button>
      </div>
    </section>`;
}
