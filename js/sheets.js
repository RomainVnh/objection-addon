/* Fenêtres du bas : objection, défis, cartes temps, menus, scores, réglages, aide. */
import { S, ui } from './state.js';
import { DEFIS, defi, cardImg } from './data.js';
import { esc, nameOf, plural } from './utils.js';
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
        title: 'Qui pose la carte Objection ?',
        sub: 'La première carte posée sur la table compte.',
        body: options(
          S.players
            .map((p) => opt('obj-by', esc(p.name), { desc: p.objLeft ? `${plural(p.objLeft, 'carte')} Objection en main` : 'Plus de carte Objection', attrs: `data-id="${p.id}"`, disabled: !p.objLeft }))
            .join(''),
        ),
      };
    }
    return {
      title: `${nameOf(sh.by)} fait objection contre…`,
      sub: 'Ni soi-même, ni le juge de la manche.',
      body:
        options(
          S.players
            .filter((p) => p.id !== sh.by)
            .map((p) => opt('obj-target', esc(p.name), { desc: p.id === r.judge ? 'Juge : ne peut pas être visé' : plural(p.score, 'point'), attrs: `data-id="${p.id}"`, disabled: p.id === r.judge }))
            .join(''),
        ) + actions(`<button class="btn small" data-act="obj-reset">Changer de joueur</button>`),
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
      title: `Défi de ${nameOf(sh.id)}`,
      sub: 'Touche la carte qu’il ou elle a piochée.',
      body: `${options(opt('set-defi', 'Aucun défi noté', { attrs: `data-id="${sh.id}" data-defi=""`, selected: !cur }))}
        <div class="eyebrow group-title">Immédiat · change le chrono ou l’ordre</div>${grid(true)}
        <div class="eyebrow group-title">Pendant la plaidoirie</div>${grid(false)}`,
    };
  },

  position(sh, r) {
    const k = pleaders().length;
    const desc = (i) => (i === 0 ? 'Avant tout le monde' : i === k - 1 ? 'En dernier' : '');
    return {
      title: `${nameOf(sh.id)} plaide en…`,
      sub: 'Carte Ordre de passage',
      body: options(
        Array.from({ length: k }, (_, i) => opt('set-position', `${i + 1}${i ? 'e' : 're'} position`, { desc: desc(i), attrs: `data-id="${sh.id}" data-pos="${i + 1}"`, selected: r.positions[sh.id] === i + 1 })).join(''),
      ),
    };
  },

  witness(sh, r) {
    return {
      title: `Qui témoigne pour ${nameOf(sh.id)} ?`,
      sub: `Cet adversaire parlera ${S.settings.witnessSeconds} secondes en sa faveur, juste avant son tour.`,
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
      title: `Carte jouée par ${nameOf(r.segs[r.seg].speaker)}`,
      sub: 'Le chrono s’ajuste tout de suite.',
      body: options(`
        ${opt('card-reduce', `Temps réduit · ${s.reducedSeconds} s`, { desc: `Le chrono descend à ${s.reducedSeconds} secondes.`, disabled: remaining() <= s.reducedSeconds * 1000, img: 'temps-reduit' })}
        ${opt('card-prolong', `Prolongation · +${s.prolongSeconds - s.pleaSeconds} s`, { desc: `Le joueur parle ${s.prolongSeconds} s au lieu de ${s.pleaSeconds}.`, img: 'prolongation' })}
        ${opt('fail', 'Défi raté', { desc: 'Le défi n’est pas respecté (mot interdit…) : la plaidoirie s’arrête tout de suite.', cls: 'danger' })}`),
    };
  },

  card(sh) {
    const d = defi(sh.id);
    return { title: d ? esc(d.nom) : 'Carte', sub: d ? esc(d.effet) : '', body: `<div class="card-zoom">${cardImg(sh.id)}</div>` };
  },

  'run-menu'() {
    const s = S.settings;
    return {
      title: 'Options de la manche',
      body: options(`
        ${opt('toggle', `Sons : ${s.sound ? 'activés' : 'coupés'}`, { attrs: 'data-k="sound"', selected: s.sound })}
        ${opt('toggle', `Vibrations : ${s.vibrate ? 'activées' : 'coupées'}`, { attrs: 'data-k="vibrate"', selected: s.vibrate })}
        ${opt('abort-run', 'Arrêter les plaidoiries', { desc: 'Revenir à la préparation de la manche. Les temps sont perdus.', cls: 'danger' })}`),
    };
  },

  menu() {
    const nav = (title, desc, sheet, cls = 'nav') => opt('open-sheet', title, { desc, attrs: `data-sheet="${sheet}"`, cls });
    return {
      title: 'Menu du juge',
      body: options(`
        ${nav('Scores et cartes Objection', 'Corriger un score ou un nombre de cartes.', 'scores')}
        ${nav('Réglages', 'Temps, décompte, score pour gagner, sons.', 'settings')}
        ${nav('Comment ça marche ?', 'Le déroulé d’une manche en 5 étapes.', 'help')}
        ${opt('home', 'Accueil', { desc: 'La partie reste sauvegardée.', cls: 'nav' })}
        ${nav('Nouvelle partie', 'Effacer les joueurs et les scores.', 'confirm-new', 'danger nav')}`),
    };
  },

  scores() {
    const stepper = (p, k, what) => {
      const name = esc(p.name);
      return `<div class="cell"><div class="stepper narrow">
        <button class="mini-btn" data-act="adj" data-id="${p.id}" data-k="${k}" data-d="-1" aria-label="Retirer ${what} à ${name}">−</button>
        <output>${p[k]}</output>
        <button class="mini-btn" data-act="adj" data-id="${p.id}" data-k="${k}" data-d="1" aria-label="Ajouter ${what} à ${name}">+</button>
      </div></div>`;
    };
    const cells = S.players.map((p) => `<div class="cell"><strong>${esc(p.name)}</strong></div>${stepper(p, 'score', 'un point')}${stepper(p, 'objLeft', 'une carte Objection')}`).join('');
    return {
      title: 'Scores et cartes Objection',
      sub: 'Pour corriger une erreur de saisie.',
      body: `<div class="score-grid"><div class="h eyebrow">Joueur</div><div class="h eyebrow">Points</div><div class="h eyebrow">Objections</div>${cells}</div>`,
    };
  },

  settings() {
    const step = (k, label, min, max, inc = 1, unit = '') => `
      <div class="setting-row"><span>${label}</span><div class="stepper">
        <button class="mini-btn" data-act="set" data-k="${k}" data-d="${-inc}" data-min="${min}" data-max="${max}" aria-label="Moins">−</button>
        <output>${S.settings[k]}${unit}</output>
        <button class="mini-btn" data-act="set" data-k="${k}" data-d="${inc}" data-min="${min}" data-max="${max}" aria-label="Plus">+</button></div></div>`;
    const tog = (k, label) => `<div class="setting-row"><span>${label}</span><button class="toggle" role="switch" aria-checked="${S.settings[k]}" data-act="toggle" data-k="${k}" aria-label="${label}"></button></div>`;
    return {
      title: 'Réglages',
      body: `
        <div class="eyebrow group-title">Chronos</div>
        ${step('pleaSeconds', 'Plaidoirie', 10, 120, 5, ' s')}
        ${step('countdown', 'Décompte avant chaque joueur', 0, 10, 1, ' s')}
        ${step('reducedSeconds', 'Carte Temps réduit', 5, 30, 1, ' s')}
        ${step('prolongSeconds', 'Carte Prolongation', 20, 120, 5, ' s')}
        ${step('witnessSeconds', 'Carte Témoin surprise', 5, 30, 1, ' s')}
        <div class="eyebrow group-title">Partie</div>
        ${step('scoreToWin', 'Points pour gagner', 1, 15)}
        ${step('objectionsPerPlayer', 'Cartes Objection par joueur', 0, 6)}
        <div class="eyebrow group-title">Ambiance</div>
        ${tog('sound', 'Sons')}
        ${tog('vibrate', 'Vibrations')}
        <p class="small muted" style="margin-top:12px">Les cartes Objection par joueur comptent à partir de la prochaine partie.</p>
        ${actions(`<button class="btn small" data-act="reset-settings">Revenir aux valeurs des règles</button>`)}`,
    };
  },

  'confirm-new'() {
    return {
      title: 'Nouvelle partie ?',
      sub: 'Les joueurs et les scores seront effacés.',
      body: `<div class="sheet-actions"><button class="btn" data-act="close-sheet">Annuler</button><button class="btn primary" data-act="new-game-confirm">Recommencer</button></div>`,
    };
  },

  'install-ios'() {
    return {
      title: 'Installer sur l’iPhone',
      sub: 'Dans Safari, en trois gestes :',
      body: `<ol class="help-steps">
        <li><div>Touche le bouton <strong>Partager</strong> ${ICON.share.replace('<svg', '<svg width="18" height="18" style="vertical-align:-3px"')} en bas de l'écran.</div></li>
        <li><div>Choisis <strong>Sur l'écran d'accueil</strong>.</div></li>
        <li><div>Touche <strong>Ajouter</strong> : l'appli s'ouvre ensuite en plein écran.</div></li>
      </ol>`,
    };
  },

  help() {
    const s = S.settings;
    return {
      title: 'Comment ça marche ?',
      body: `<ol class="help-steps">
        <li><div><strong>Inscription.</strong> Chacun s'inscrit à son tour, dans le sens des aiguilles d'une montre. Le premier inscrit est le premier juge, puis le rôle passe au joueur de gauche à chaque manche.</div></li>
        <li><div><strong>Préparation.</strong> Le juge lit la question. Une carte Objection peut réduire un adversaire au silence (ni plaidoirie, ni vote, ni voix). Puis chacun pioche un Défi : les cartes immédiates se notent dans l'appli.</div></li>
        <li><div><strong>Plaidoiries.</strong> Le juge lance le chrono : décompte de ${s.countdown} s, nom du joueur, puis ${s.pleaSeconds} s de parole. Tout s'enchaîne jusqu'au dernier joueur.</div></li>
        <li><div><strong>Vote.</strong> Chacun désigne à son tour le plus convaincant. En cas d'égalité, le vote du juge compte double. Avec la carte Point double, ton vote compte pour 2 voix.</div></li>
        <li><div><strong>Point.</strong> Le plus de voix marque 1 point. Premier à ${s.scoreToWin} points : victoire.</div></li>
      </ol>
      <p class="small muted" style="margin-top:16px">Astuce : ajoute la page à l'écran d'accueil du téléphone pour l'ouvrir en plein écran.</p>`,
    };
  },
};

export function sheetView() {
  const sh = ui.sheet;
  if (!sh || !SHEETS[sh.type]) return '';
  const { title, sub = '', body } = SHEETS[sh.type](sh, S.round);
  return `<div class="backdrop" data-act="close-sheet"></div>
    <div class="panel" role="dialog" aria-modal="true" aria-label="${title.replace(/<[^>]+>/g, '')}"><div class="grab"></div>
      <div class="sheet-head"><h3>${title}</h3><button class="icon-btn" data-act="close-sheet" aria-label="Fermer">${ICON.close}</button></div>
      ${sub ? `<p class="small muted sheet-sub">${sub}</p>` : ''}
      ${body}
    </div>`;
}
