/* Animations plein écran des cartes jouées, et confettis de la victoire. */
import { S, ui } from './state.js';
import { cardImg } from './data.js';
import { $, esc, nameOf, buzz } from './utils.js';
import { sfx } from './sound.js';

/**
 * Affiche une carte jouée par-dessus l'écran.
 * motion : slam | drop | grow | double | slide | flip | fail ; tone : red | hot | gold | blue (couleur du halo).
 */
export function playCardFx({ card, line, sub = '', badge = '', stamp = '', motion = 'slam', tone = 'gold', sound = null, vibrate = 80, flash = false, shake = false, ms = 2300 }) {
  sfx[sound]?.();
  buzz(vibrate);
  const fx = $('#fx');
  fx.innerHTML = `${flash ? '<div class="flash"></div>' : ''}
    <div class="fx-layer tone-${tone}" style="--fx-ms:${ms}ms">
      <div class="fx-stage motion-${motion}">
        ${motion === 'double' ? cardImg(card, 'fx-card ghost') : ''}${cardImg(card, 'fx-card')}
        ${badge ? `<div class="fx-badge logo-text">${badge}</div>` : ''}
        ${stamp ? `<div class="fx-stamp logo-text">${stamp}</div>` : ''}
      </div>
      <div class="target">${line}</div>
      ${sub ? `<div class="muted small">${sub}</div>` : ''}
    </div>`;
  if (shake) {
    const app = $('#app');
    app.classList.remove('shake');
    void app.offsetWidth; // relance l'animation
    app.classList.add('shake');
  }
  clearTimeout(ui.fxTimer);
  ui.fxTimer = setTimeout(() => (fx.innerHTML = ''), ms + 100);
}

export function playObjectionFx(line, sub) {
  playCardFx({ card: 'objection', line: esc(line), sub: esc(sub), tone: 'red', sound: 'objection', vibrate: [120, 60, 220], flash: true, shake: true });
}

const ordinal = (n) => (n === 1 ? 're' : 'e');

/** Animation d'une carte Défi « immédiat » au moment où on la note. */
export function playDefiFx(id) {
  const r = S.round;
  const who = nameOf(id);
  const st = S.settings;
  const pos = r.positions[id];
  const fx = {
    'temps-reduit': { motion: 'drop', tone: 'hot', badge: `${st.reducedSeconds} s`, line: `${who} n’aura que ${st.reducedSeconds} secondes`, sound: 'timeDown', shake: true, vibrate: [60, 40, 120] },
    prolongation: { motion: 'grow', badge: `${st.prolongSeconds} s`, line: `${who} aura ${st.prolongSeconds} secondes`, sound: 'powerUp' },
    'voix-double': { motion: 'double', badge: '×2', line: `Le vote de ${who} compte double`, sound: 'double', vibrate: [50, 60, 50] },
    'ordre-de-passage': pos && { motion: 'slide', tone: 'blue', badge: `${pos}<sup>${ordinal(pos)}</sup>`, line: `${who} plaidera en ${pos}${ordinal(pos)} position`, sound: 'swish' },
    'temoin-surprise': r.witness[id] && { motion: 'flip', tone: 'blue', line: `${nameOf(r.witness[id])} témoignera pour ${who}`, sub: `${st.witnessSeconds} secondes, juste avant son tour`, sound: 'swish' },
  }[r.defis[id]];
  if (fx) playCardFx({ card: r.defis[id], ...fx });
}

export function confetti() {
  const box = $('#confetti');
  if (!box || box.childElementCount) return;
  const colors = ['#f5ecd9', '#f4c542', '#8a5a2b', '#e8dbbd'];
  box.innerHTML = Array.from(
    { length: 70 },
    (_, i) =>
      `<i style="left:${Math.random() * 100}%;background:${colors[i % colors.length]};--dx:${(Math.random() - 0.5) * 200}px;animation-duration:${2.5 + Math.random() * 2.5}s;animation-delay:${Math.random() * 1.5}s"></i>`,
  ).join('');
}
