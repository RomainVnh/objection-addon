/* Sons synthétisés (Web Audio, rien à télécharger). */
import { S } from './state.js';

let ctx = null;
const audio = () => {
  if (!S.settings.sound) return null;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
};
const tone = (freq, dur, { type = 'sine', gain = 0.2, at = 0, slide = null } = {}) => {
  const c = audio();
  if (!c) return;
  const t = c.currentTime + at;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
};
const noise = (dur, { gain = 0.2, at = 0, from = 400, to = 2400, type = 'bandpass' } = {}) => {
  const c = audio();
  if (!c) return;
  const t = c.currentTime + at;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(from, t);
  f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(c.destination);
  src.start(t);
};
const thump = (at = 0, gain = 0.8) => {
  tone(170, 0.25, { gain, at, slide: 45 });
  noise(0.05, { gain: gain * 0.5, at, from: 2500, to: 3000, type: 'highpass' });
};

export const sfx = {
  unlock: () => audio(),
  tick: () => tone(1250, 0.06, { type: 'square', gain: 0.06 }),
  tickLast: () => tone(1650, 0.08, { type: 'square', gain: 0.08 }),
  go: () => {
    tone(660, 0.12, { type: 'triangle', gain: 0.18 });
    tone(990, 0.22, { type: 'triangle', gain: 0.18, at: 0.1 });
  },
  whoosh: () => noise(0.45, { gain: 0.16, from: 300, to: 3000 }),
  gavel: (n = 1) => {
    for (let i = 0; i < n; i++) thump(i * 0.22);
  },
  timeUp: () => {
    tone(220, 0.7, { type: 'sawtooth', gain: 0.14 });
    tone(233, 0.7, { type: 'sawtooth', gain: 0.1 });
    thump(0, 0.6);
  },
  fail: () => {
    tone(300, 0.18, { type: 'square', gain: 0.12 });
    tone(200, 0.35, { type: 'square', gain: 0.12, at: 0.18 });
  },
  /** Glissando descendant : le temps fond. */
  timeDown: () => {
    tone(880, 0.55, { type: 'triangle', gain: 0.16, slide: 220 });
    tone(440, 0.55, { type: 'sine', gain: 0.1, at: 0.05, slide: 110 });
    thump(0.5, 0.5);
  },
  /** Montée en arpège : du temps en plus. */
  powerUp: () => [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, { type: 'triangle', gain: 0.14, at: i * 0.07 })),
  /** Deux tintements : voix double. */
  double: () => {
    tone(988, 0.25, { type: 'sine', gain: 0.16 });
    tone(1319, 0.35, { type: 'sine', gain: 0.16, at: 0.16 });
  },
  /** Carte qui glisse ou se retourne. */
  swish: () => noise(0.35, { gain: 0.14, from: 2500, to: 600 }),
  objection: () => {
    [220, 277, 330, 440].forEach((f) => tone(f * 0.9, 0.75, { type: 'sawtooth', gain: 0.08, slide: f }));
    thump(0, 0.7);
  },
  fanfare: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, { type: 'triangle', gain: 0.16, at: i * 0.13 })),
  murmur: () => noise(1.6, { gain: 0.12, from: 350, to: 700 }),
};
