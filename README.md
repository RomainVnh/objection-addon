# Objection ! · Chrono du tribunal

Application compagnon du jeu de cartes **Objection !** (règles v2), en HTML, CSS et JavaScript natifs, sans aucune dépendance ni étape de compilation.

Elle gère :

- **l'inscription des joueurs**, chacun à son tour, dans le sens des aiguilles d'une montre. Le premier inscrit est le juge de la première manche, puis le rôle passe au joueur de gauche ;
- **la préparation de la manche** par le juge : carte **Objection** (avec son animation ; le joueur visé passe en gris, ne plaide pas, ne vote pas et ne peut pas recevoir de voix), et cartes **Défi** (Temps réduit, Prolongation, Ordre de passage, Témoin surprise, Voix double et les 9 défis de plaidoirie) ;
- **les plaidoiries enchaînées** : le juge lance le chrono quand il veut, puis tout s'enchaîne jusqu'au dernier joueur. Pour chaque tour : décompte de 5 s, apparition du nom, grand chrono, puis écran « Temps écoulé ! ». Pendant un tour : « J'ai fini » (passe le temps restant), cartes Temps réduit ou Prolongation, « Défi raté » (coupe la parole) et pause ;
- **la fin de manche et le vote** : écran « Fin des plaidoiries », puis « L'heure du vote ! ». Chaque joueur désigne à son tour le plus convaincant, sans pouvoir voter pour lui-même ni pour un joueur sous objection. La copie signalée est gérée, l'égalité est tranchée par le vote du juge, et la carte Voix double compte ;
- **les scores**, les temps de parole de chacun et la victoire au score choisi (5 points par défaut).

Tout se réinitialise à chaque manche, sauf les scores et les cartes Objection restantes. La partie est sauvegardée dans le navigateur : si la page se recharge, elle reprend au même endroit, chrono en pause.

## Publier

Déposer **tout le dossier** `dev - Addon/` sur n'importe quel hébergeur statique :

- **Netlify Drop** (le plus simple) : glisser le dossier sur <https://app.netlify.com/drop> ;
- **GitHub Pages** : pousser le dossier dans un dépôt, puis activer Pages ;
- **Vercel**, **OVH**, **o2switch** ou un FTP classique : envoyer les fichiers tels quels.

Il n'y a rien à installer ni à compiler. Le site fonctionne aussi hors connexion une fois chargé : les sons sont générés par le navigateur.

Sur téléphone, « Ajouter à l'écran d'accueil » ouvre l'application en plein écran.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `index.html` | Page unique |
| `styles.css` | Direction artistique du dos de carte, mise en page mobile, tablette et ordinateur, portrait et paysage |
| `js/main.js` | Démarrage : affichage des écrans, boucle du chrono, clics et clavier |
| `js/data.js` | Réglages par défaut et liste des cartes |
| `js/state.js` | Partie sauvegardée dans le navigateur, état de l'interface |
| `js/game.js` | Règles d'une manche : ordre de passage, chrono, objection, vote, points |
| `js/actions.js` | Ce que fait chaque bouton (`data-act="…"`) |
| `js/view-setup.js` | Écrans d'accueil, d'inscription et de préparation |
| `js/view-run.js` | Écran des plaidoiries (décompte, chrono, fin du temps) |
| `js/view-vote.js` | Écrans du vote, du verdict et de la victoire |
| `js/view-common.js` | Morceaux d'interface partagés (en-tête, cadres, options, scores) |
| `js/sheets.js` | Fenêtres du bas (objection, défis, menus, réglages, aide) |
| `js/fx.js` | Animations des cartes et confettis |
| `js/sound.js`, `js/icons.js`, `js/utils.js` | Sons, icônes, petits outils |
| `js/pwa.js` | Installation sur l'écran d'accueil |
| `assets/dos-de-carte.jpg` | Dos de carte affiché sur l'accueil |
| `manifest.webmanifest`, `assets/icon-*.png`, `assets/apple-touch-icon.png` | Application installable (PWA) |

## Réglages (menu du juge)

Temps de plaidoirie (30 s), décompte (5 s), cartes Temps réduit (10 s), Prolongation (40 s) et Témoin surprise (10 s), points pour gagner (5), cartes Objection par joueur (2), sons et vibrations. Le juge peut aussi corriger un score ou un nombre de cartes Objection à tout moment.

## Tester en local

Le code est découpé en modules JavaScript : il faut passer par un petit serveur (ouvrir `index.html` en double-cliquant ne marche pas) :

```bash
python3 -m http.server 8000
```

puis ouvrir <http://localhost:8000>.

## Versions

L'historique des versions est suivi avec git.

Après une modification de `styles.css` ou de `js/main.js`, augmenter le numéro `?v=` dans `index.html`, pour que les téléphones chargent bien la nouvelle version.

## Application installable (PWA)

- **Android, Chrome, Edge :** le bouton « Installer l’appli » apparaît sur l’accueil.
- **iPhone (Safari) :** « Installer sur l’iPhone » explique la marche à suivre : Partager, puis « Sur l’écran d’accueil ».
- L’appli a besoin d’une connexion : il n’y a pas de mode hors ligne.
- L’installation demande un hébergement en **https** (Netlify, Vercel, GitHub Pages le font d’office).
