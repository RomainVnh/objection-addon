/* Morceaux d'interface réutilisés par tous les écrans. */
import { S } from './state.js';
import { cardImg } from './data.js';
import { esc } from './utils.js';
import { ICON } from './icons.js';

/** En-tête : bouton à gauche, titre centré, bouton à droite. Le titre peut être du HTML (losanges). */
export const topbar = (eyebrow, title, left = '', right = '', cls = '') => `
  <header class="topbar ${cls}">
    <div>${left}</div>
    <div class="center"><div class="eyebrow">${eyebrow}</div>${title.startsWith('<') ? `<div>${title}</div>` : `<h1 class="title">${title}</h1>`}</div>
    <div>${right}</div>
  </header>`;

export const menuBtn = (sheet = 'menu') => `<button class="icon-btn" data-act="open-sheet" data-sheet="${sheet}" aria-label="Menu">${ICON.menu}</button>`;
export const homeBtn = () => `<button class="icon-btn" data-act="home" aria-label="Home">${ICON.back}</button>`;
export const frame = (title, body, extra = '') => `<section class="frame" ${extra}>${title ? `<h2 class="frame-title">${title}</h2>` : ''}${body}</section>`;

/**
 * Bouton d'option (listes des fenêtres du bas).
 * o : { desc, attrs, disabled, selected, cls ('nav' = flèche, 'danger'), img (id de carte) }
 */
export const opt = (act, title, o = {}) => `
  <button class="option ${o.selected ? 'selected' : ''} ${o.cls || ''} ${o.img ? 'has-img' : ''}" data-act="${act}" ${o.attrs || ''} ${o.disabled ? 'disabled' : ''}>
    ${o.img ? cardImg(o.img, 'opt-img') : ''}
    <div><div class="t">${title}</div>${o.desc ? `<div class="d">${o.desc}</div>` : ''}</div>
    <span class="ok">${o.cls?.includes('nav') ? ICON.chevron : ICON.check}</span>
  </button>`;

/** Lignes des scores, du meilleur au moins bon. */
export function scoreRows(highlight) {
  const max = Math.max(...S.players.map((p) => p.score));
  const pips = (p) => Array.from({ length: S.settings.scoreToWin }, (_, i) => `<i class="${i < p.score ? 'on' : ''}"></i>`).join('');
  const rows = [...S.players].sort((a, b) => b.score - a.score).map(
    (p) => `
      <div class="row ${p.score === max && max > 0 ? 'is-leader' : ''}">
        <span class="seat">${S.players.indexOf(p) + 1}</span>
        <div class="main"><span class="name">${esc(p.name)}</span><div class="pips">${pips(p)}</div></div>
        <div class="pts">${highlight === p.id ? '<span class="plus">+1</span>' : ''}${p.score}</div>
      </div>`,
  );
  return `<div class="rows">${rows.join('')}</div>`;
}
