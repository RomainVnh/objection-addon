/* Application installable (PWA) : bouton « Installer l’appli » sur l'accueil. */
import { ui, render } from './state.js';

const refreshHome = () => ui.home && render();

export function setupPwa() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // on garde l'invitation pour notre propre bouton « Installer »
    ui.installEvt = e;
    refreshHome();
  });
  window.addEventListener('appinstalled', () => {
    ui.installEvt = null;
    refreshHome();
  });

  // L'appli n'a plus de mode hors ligne : on retire l'ancien service worker et son cache
  // sur les appareils qui l'avaient déjà installé.
  navigator.serviceWorker?.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
  window.caches?.keys().then((keys) => keys.filter((k) => k.startsWith('objection-')).forEach((k) => caches.delete(k)));
}
