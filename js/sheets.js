/* Fenêtres du bas : objection, défis, cartes temps, menus, scores, réglages, aide. */
import { S, ui } from './state.js';
import { DEFIS, defi, cardImg } from './data.js';
import { esc, nameOf, plural, ordinal } from './utils.js';
import { ICON } from './icons.js';
import { pleaders, remaining } from './game.js';
import { opt } from './view-common.js';

const options = (html) => `<div class="options">${html}</div>`;
const actions = (html) => `<div class="sheet-actions" style="grid-template-columns:1fr">${html}</div>`;

/** Chaque fenêtre renvoie { title, sub, body }. */
const SHEETS = {
  objection(sh, r) {
    if (!sh.by) {
      return {
        title: 'Who is playing the Objection card?',
        sub: 'The first card laid on the table counts.',
        body: options(
          S.players
            .map((p) => opt('obj-by', esc(p.name), { desc: p.objLeft ? `${plural(p.objLeft, 'Objection card')} in hand` : 'No Objection cards left', attrs: `data-id="${p.id}"`, disabled: !p.objLeft }))
            .join(''),
        ),
      };
    }
    return {
      title: `${nameOf(sh.by)} objects to…`,
      sub: 'Not yourself, and not the judge of the round.',
      body:
        options(
          S.players
            .filter((p) => p.id !== sh.by)
            .map((p) => opt('obj-target', esc(p.name), { desc: p.id === r.judge ? 'Judge: cannot be targeted' : plural(p.score, 'point'), attrs: `data-id="${p.id}"`, disabled: p.id === r.judge }))
            .join(''),
        ) + actions(`<button class="btn small" data-act="obj-reset">Change player</button>`),
    };
  },

  defi(sh, r) {
    const cur = r.defis[sh.id] || null;
    const grid = (immediat) =>
      `<div class="card-grid">${DEFIS.filter((d) => !!d.immediat === immediat)
        .map(
          (d) => `<button class="card-pick ${cur === d.id ? 'selected' : ''}" data-act="set-defi" data-id="${sh.id}" data-defi="${d.id}" aria-label="${esc(d.nom)} : ${esc(d.effet)}" aria-pressed="${cur === d.id}">
            ${cardImg(d.id)}${cur === d.id ? `<span class="check">${ICON.check}</span>` : ''}<span class="card-name">${esc(d.nom)}</span>
          </button>`,
        )
        .join('')}</div>`;
    return {
      title: `${nameOf(sh.id)}’s challenge`,
      sub: 'Tap the card they drew.',
      body: `${options(opt('set-defi', 'No challenge recorded', { attrs: `data-id="${sh.id}" data-defi=""`, selected: !cur }))}
        <div class="eyebrow group-title">Immediate · changes the timer or the order</div>${grid(true)}
        <div class="eyebrow group-title">During the plea</div>${grid(false)}`,
    };
  },

  position(sh, r) {
    const k = pleaders().length;
    const desc = (i) => (i === 0 ? 'Before everyone else' : i === k - 1 ? 'Last' : '');
    return {
      title: `${nameOf(sh.id)} pleads in…`,
      sub: 'Turn order card',
      body: options(
        Array.from({ length: k }, (_, i) => opt('set-position', `${ordinal(i + 1)} position`, { desc: desc(i), attrs: `data-id="${sh.id}" data-pos="${i + 1}"`, selected: r.positions[sh.id] === i + 1 })).join(''),
      ),
    };
  },

  witness(sh, r) {
    return {
      title: `Who testifies for ${nameOf(sh.id)}?`,
      sub: `This opponent will speak for ${S.settings.witnessSeconds} seconds in their favour, just before their turn.`,
      body: options(
        pleaders()
          .filter((p) => p !== sh.id)
          .map((p) => opt('set-witness', nameOf(p), { attrs: `data-id="${sh.id}" data-w="${p}"`, selected: r.witness[sh.id] === p }))
          .join(''),
      ),
    };
  },

  cards(sh, r) {
    const s = S.settings;
    return {
      title: `Card played by ${nameOf(r.segs[r.seg].speaker)}`,
      sub: 'The timer adjusts right away.',
      body: options(`
        ${opt('card-reduce', `Reduced time · ${s.reducedSeconds} s`, { desc: `The timer drops to ${s.reducedSeconds} seconds.`, disabled: remaining() <= s.reducedSeconds * 1000, img: 'temps-reduit' })}
        ${opt('card-prolong', `Overtime · +${s.prolongSeconds - s.pleaSeconds} s`, { desc: `The player speaks for ${s.prolongSeconds} s instead of ${s.pleaSeconds}.`, img: 'prolongation' })}
        ${opt('fail', 'Challenge failed', { desc: 'The challenge was broken (forbidden word…): the plea stops right away.', cls: 'danger' })}`),
    };
  },

  card(sh) {
    const d = defi(sh.id);
    return { title: d ? esc(d.nom) : 'Card', sub: d ? esc(d.effet) : '', body: `<div class="card-zoom">${cardImg(sh.id)}</div>` };
  },

  'run-menu'() {
    const s = S.settings;
    return {
      title: 'Round options',
      body: options(`
        ${opt('toggle', `Sound: ${s.sound ? 'on' : 'off'}`, { attrs: 'data-k="sound"', selected: s.sound })}
        ${opt('toggle', `Vibration: ${s.vibrate ? 'on' : 'off'}`, { attrs: 'data-k="vibrate"', selected: s.vibrate })}
        ${opt('abort-run', 'Stop the pleas', { desc: 'Go back to the round setup. Times are lost.', cls: 'danger' })}`),
    };
  },

  menu() {
    const nav = (title, desc, sheet, cls = 'nav') => opt('open-sheet', title, { desc, attrs: `data-sheet="${sheet}"`, cls });
    return {
      title: 'Judge’s menu',
      body: options(`
        ${nav('Scores and Objection cards', 'Fix a score or a number of cards.', 'scores')}
        ${nav('Settings', 'Times, countdown, winning score, sound.', 'settings')}
        ${nav('How does it work?', 'A round in 5 steps.', 'help')}
        ${opt('home', 'Home', { desc: 'The game stays saved.', cls: 'nav' })}
        ${nav('New game', 'Clear players and scores.', 'confirm-new', 'danger nav')}`),
    };
  },

  scores() {
    const stepper = (p, k, what) => {
      const name = esc(p.name);
      return `<div class="cell"><div class="stepper narrow">
        <button class="mini-btn" data-act="adj" data-id="${p.id}" data-k="${k}" data-d="-1" aria-label="Remove ${what} from ${name}">−</button>
        <output>${p[k]}</output>
        <button class="mini-btn" data-act="adj" data-id="${p.id}" data-k="${k}" data-d="1" aria-label="Add ${what} to ${name}">+</button>
      </div></div>`;
    };
    const cells = S.players.map((p) => `<div class="cell"><strong>${esc(p.name)}</strong></div>${stepper(p, 'score', 'a point')}${stepper(p, 'objLeft', 'an Objection card')}`).join('');
    return {
      title: 'Scores and Objection cards',
      sub: 'To fix an input mistake.',
      body: `<div class="score-grid"><div class="h eyebrow">Player</div><div class="h eyebrow">Points</div><div class="h eyebrow">Objections</div>${cells}</div>`,
    };
  },

  settings() {
    const step = (k, label, min, max, inc = 1, unit = '') => `
      <div class="setting-row"><span>${label}</span><div class="stepper">
        <button class="mini-btn" data-act="set" data-k="${k}" data-d="${-inc}" data-min="${min}" data-max="${max}" aria-label="Less">−</button>
        <output>${S.settings[k]}${unit}</output>
        <button class="mini-btn" data-act="set" data-k="${k}" data-d="${inc}" data-min="${min}" data-max="${max}" aria-label="More">+</button></div></div>`;
    const tog = (k, label) => `<div class="setting-row"><span>${label}</span><button class="toggle" role="switch" aria-checked="${S.settings[k]}" data-act="toggle" data-k="${k}" aria-label="${label}"></button></div>`;
    return {
      title: 'Settings',
      body: `
        <div class="eyebrow group-title">Timers</div>
        ${step('pleaSeconds', 'Plea', 10, 120, 5, ' s')}
        ${step('countdown', 'Countdown before each player', 0, 10, 1, ' s')}
        ${step('reducedSeconds', 'Reduced time card', 5, 30, 1, ' s')}
        ${step('prolongSeconds', 'Overtime card', 20, 120, 5, ' s')}
        ${step('witnessSeconds', 'Surprise witness card', 5, 30, 1, ' s')}
        <div class="eyebrow group-title">Game</div>
        ${step('scoreToWin', 'Points to win', 1, 15)}
        ${step('objectionsPerPlayer', 'Objection cards per player', 0, 6)}
        <div class="eyebrow group-title">Atmosphere</div>
        ${tog('sound', 'Sound')}
        ${tog('vibrate', 'Vibration')}
        <p class="small muted" style="margin-top:12px">Objection cards per player apply from the next game.</p>
        ${actions(`<button class="btn small" data-act="reset-settings">Back to the rules’ values</button>`)}`,
    };
  },

  'confirm-new'() {
    return {
      title: 'New game?',
      sub: 'Players and scores will be cleared.',
      body: `<div class="sheet-actions"><button class="btn" data-act="close-sheet">Cancel</button><button class="btn primary" data-act="new-game-confirm">Start over</button></div>`,
    };
  },

  'install-ios'() {
    return {
      title: 'Install on iPhone',
      sub: 'In Safari, in three steps:',
      body: `<ol class="help-steps">
        <li><div>Tap the <strong>Share</strong> button ${ICON.share.replace('<svg', '<svg width="18" height="18" style="vertical-align:-3px"')} at the bottom of the screen.</div></li>
        <li><div>Choose <strong>Add to Home Screen</strong>.</div></li>
        <li><div>Tap <strong>Add</strong>: the app then opens full screen.</div></li>
      </ol>`,
    };
  },

  help() {
    const s = S.settings;
    return {
      title: 'How does it work?',
      body: `<ol class="help-steps">
        <li><div><strong>Sign-up.</strong> Everyone signs up in turn, going clockwise. The first player is the first judge, then the role passes to the player on the left each round.</div></li>
        <li><div><strong>Setup.</strong> The judge reads the question. An Objection card can silence an opponent (no plea, no vote, no votes received). Then everyone draws a Challenge: immediate cards are recorded in the app.</div></li>
        <li><div><strong>Pleas.</strong> The judge starts the timer: ${s.countdown} s countdown, player name, then ${s.pleaSeconds} s to speak. Everything runs on until the last player.</div></li>
        <li><div><strong>Vote.</strong> In turn, everyone picks the most convincing player. In case of a tie, the judge’s vote counts double. With the Double point card, your vote counts as 2 votes.</div></li>
        <li><div><strong>Point.</strong> The player with the most votes scores 1 point. First to ${s.scoreToWin} points wins.</div></li>
      </ol>
      <p class="small muted" style="margin-top:16px">Tip: add the page to your phone’s home screen to open it full screen.</p>`,
    };
  },
};

export function sheetView() {
  const sh = ui.sheet;
  if (!sh || !SHEETS[sh.type]) return '';
  const { title, sub = '', body } = SHEETS[sh.type](sh, S.round);
  return `<div class="backdrop" data-act="close-sheet"></div>
    <div class="panel" role="dialog" aria-modal="true" aria-label="${title.replace(/<[^>]+>/g, '')}"><div class="grab"></div>
      <div class="sheet-head"><h3>${title}</h3><button class="icon-btn" data-act="close-sheet" aria-label="Close">${ICON.close}</button></div>
      ${sub ? `<p class="small muted sheet-sub">${sub}</p>` : ''}
      ${body}
    </div>`;
}
