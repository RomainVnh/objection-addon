/* Petits outils partagés. */
import { S, ui } from './state.js';

export const $ = (sel) => document.querySelector(sel);
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const uid = () => Math.random().toString(36).slice(2, 9);
export const player = (id) => S.players.find((p) => p.id === id);
export const nameOf = (id) => esc(player(id)?.name ?? '?');
export const secs = (ms) => Math.max(0, Math.ceil(ms / 1000));
export const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
/** 1st, 2nd, 3rd, 4th… */
export const ordinal = (n) => `${n}<sup>${{ 1: 'st', 2: 'nd', 3: 'rd' }[n] || 'th'}</sup>`;
/** Losanges de progression : faits, en cours, à venir. */
export const diamonds = (count, current) => `<div class="diamonds">${Array.from({ length: count }, (_, i) => `<i class="${i < current ? 'done' : i === current ? 'now' : ''}"></i>`).join('')}</div>`;

/** Vibration (le navigateur ne l'autorise qu'après un vrai toucher de l'écran). */
export function buzz(pattern) {
  if (!S.settings.vibrate || !navigator.vibrate || !(navigator.userActivation?.hasBeenActive ?? true)) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* rien */
  }
}

/** Garde l'écran allumé pendant les plaidoiries (si le navigateur le permet). */
export async function wakeOn() {
  if (!('wakeLock' in navigator) || ui.wake) return;
  try {
    ui.wake = await navigator.wakeLock.request('screen');
    ui.wake.addEventListener('release', () => (ui.wake = null));
  } catch {
    ui.wake = null;
  }
}
export function wakeOff() {
  ui.wake?.release().catch(() => {});
  ui.wake = null;
}
