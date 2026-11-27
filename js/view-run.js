/* Écran des plaidoiries : décompte, nom du joueur, chrono, fin du temps, fin de manche. */
import { S, ui } from './state.js';
import { cardImg } from './data.js';
import { $, esc, nameOf, secs, diamonds } from './utils.js';
import { ICON } from './icons.js';
import { sfx } from './sound.js';
import { remaining, pleaDefi, allowed } from './game.js';
import { topbar, menuBtn } from './view-common.js';

/** Carte à montrer pour ce tour : Témoin surprise, ou le défi de la plaidoirie. */
const segCard = (seg) => (seg.kind === 'witness' ? 'temoin-surprise' : pleaDefi(seg)?.id);

function segLabel(seg) {
  if (seg.kind === 'witness') return `Surprise witness for ${nameOf(seg.for)}`;
  const d = pleaDefi(seg);
  return d ? `Challenge: ${esc(d.nom)}` : 'Plea';
}

/** Cadran du chrono : graduations, filet intérieur, arc de temps. */
const dial = `
  <svg class="dial" viewBox="0 0 200 200" aria-hidden="true">
    <circle class="dial-face" cx="100" cy="100" r="96"/>
    <circle class="dial-ticks" cx="100" cy="100" r="96" pathLength="60" stroke-dasharray="0.12 0.88"/>
    <circle class="dial-track" cx="100" cy="100" r="84"/>
    <circle id="ring" class="dial-fg" cx="100" cy="100" r="84" pathLength="1000" stroke-dasharray="1000" stroke-dashoffset="0"/>
    <circle class="dial-inner" cx="100" cy="100" r="74"/>
  </svg>`;

const controls = (inner = '') => `<div class="stage-controls">${inner}</div>`;
const bigBand = (text) => `<div class="band-wrap"><div class="band"><span class="stamp logo-text">${text}</span></div></div>`;

/** Le contenu central et les boutons de chaque étape. */
function stage(r, seg, next) {
  const card = segCard(seg);
  switch (r.sub) {
    case 'countdown':
      return [
        `<div class="eyebrow">${seg.kind === 'witness' ? 'Surprise witness' : r.seg === 0 ? 'First to plead' : 'Next up'}</div>
         <div class="speaker sm logo-text">${nameOf(seg.speaker)}</div>
         <div class="speaker-sub">${seg.kind === 'witness' ? `${secs(seg.total)} s in favour of ${nameOf(seg.for)}` : `${secs(seg.total)} seconds · ${segLabel(seg)}`}</div>
         ${card ? cardImg(card, 'cd-card') : ''}
         <div id="cd" class="cd-box"></div>`,
        controls(`<button class="btn block" data-act="skip">Skip the countdown</button>`),
      ];
    case 'intro':
      return [
        `<div class="intro"><div class="speaker logo-text">${nameOf(seg.speaker)}</div></div>
         <div class="speaker-sub fade-late">${segLabel(seg)}</div>`,
        controls(),
      ];
    case 'talk':
      return [
        `<div class="speaker sm logo-text">${nameOf(seg.speaker)}</div>
         <div class="chip-row">${
           card
             ? `<button class="card-pill" data-act="open-sheet" data-sheet="card" data-id="${card}">${cardImg(card, 'pill-img')}<span>${segLabel(seg)}</span></button>`
             : `<span class="tag line">${segLabel(seg)}</span>`
         }${seg.mods.map((m) => `<span class="tag">${m}</span>`).join('')}</div>
         <div class="timer-wrap" id="tw">${dial}<span class="timer-num logo-text" id="tnum">${secs(remaining())}</span></div>
         <div class="next-up">${next ? `Then <strong>${nameOf(next.speaker)}</strong>${next.kind === 'witness' ? ' (witness)' : ''}` : 'Last plea of the round'}</div>`,
        controls(`
          <button class="btn primary big block" data-act="skip">${ICON.check} I’m done</button>
          ${seg.kind === 'plea' ? `<div class="pair"><button class="btn small" data-act="open-sheet" data-sheet="cards">Time card</button><button class="btn small" data-act="fail">Challenge failed</button></div>` : ''}`),
      ];
    case 'end': {
      const txt = { time: 'Time’s up!', done: 'Plea over', fail: 'Challenge failed!' }[seg.result] || 'Done';
      return [
        `${seg.result === 'time' ? ICON.gavelBig : ''}
         ${bigBand(txt)}
         <div class="speaker-sub fade-late">${nameOf(seg.speaker)} · ${secs(seg.spoke)} s of ${secs(allowed(seg))} s</div>`,
        controls(`<button class="btn block" data-act="skip">${next ? 'Next player' : 'Continue'}</button>`),
      ];
    }
    case 'finale':
      return [
        `${ICON.gavelBig}
         ${bigBand('End of the pleas!')}
         <div class="speaker-sub fade-late">The court withdraws to deliberate…</div>`,
        controls(`<button class="btn block" data-act="skip">Go to the vote</button>`),
      ];
    default:
      return ['', controls()];
  }
}

export function runView() {
  const r = S.round;
  const seg = r.segs[r.seg];
  const paused = r.paused != null;
  const [center, buttons] = stage(r, seg, r.segs[r.seg + 1]);
  const pauseBtn = `<button class="icon-btn" data-act="${paused ? 'resume' : 'pause'}" aria-label="${paused ? 'Resume' : 'Pause'}">${paused ? ICON.play : ICON.pause}</button>`;
  const top = topbar(`Round ${r.no} · ${r.seg + 1} / ${r.segs.length}`, diamonds(r.segs.length, r.seg), pauseBtn, menuBtn('run-menu'), 'stage-top');
  const pauseLayer = paused
    ? `<div class="pause-layer"><div class="inner">
         <div class="band"><span class="logo-text" style="font-size:clamp(46px,14vw,96px)">Paused</span></div>
         <p class="muted" style="margin-top:10px">${nameOf(seg.speaker)} · ${secs(remaining())} s left</p>
         <button class="btn primary big block" data-act="resume">${ICON.play} Resume</button>
         <button class="btn link" data-act="open-sheet" data-sheet="run-menu">Round options</button>
       </div></div>`
    : '';
  return `<section class="stage" data-sub="${r.sub}">${top}<div class="stage-center">${center}</div>${buttons}</section>${pauseLayer}`;
}

/** Met à jour le décompte et le chrono sans redessiner l'écran. */
export function live(now) {
  const r = S.round;
  const rem = remaining(now);
  const running = r.paused == null;
  if (r.sub === 'countdown') {
    const d = secs(rem);
    const box = $('#cd');
    if (!box || d === ui.lastDigit) return;
    ui.lastDigit = d;
    box.innerHTML = `<span class="countdown-num logo-text">${d}</span>`;
    if (d > 0 && running) (d === 1 ? sfx.tickLast : sfx.tick)();
  } else if (r.sub === 'talk') {
    const n = $('#tnum');
    const ring = $('#ring');
    const tw = $('#tw');
    if (!n || !ring || !tw) return;
    const s = secs(rem);
    n.textContent = s;
    ring.setAttribute('stroke-dashoffset', String(1000 * (1 - rem / r.segs[r.seg].total)));
    tw.classList.toggle('urgent', rem <= 10000 && rem > 5000);
    tw.classList.toggle('critical', rem <= 5000);
    tw.classList.toggle('paused', !running);
    if (s !== ui.lastSecond) {
      if (ui.lastSecond != null && s <= 5 && s > 0 && running) sfx.tick();
      ui.lastSecond = s;
    }
  }
}
