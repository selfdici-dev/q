// Cache hors ligne. Incrémente VERSION à chaque modification des fichiers.
const VERSION = 'cap-v48';
const FILES = [
  './', './index.html', './css/styles.css', './css/luxe.css', './manifest.webmanifest',
  './js/app.js', './js/logic.js', './js/data.js',
  './js/money.js', './js/finance-data.js', './js/quotes.js', './js/summary.js',
  './js/backup.js', './js/figures.js', './js/poses.js', './js/avatar.js', './js/tree.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Réseau d'abord (pour recevoir les mises à jour), cache si hors ligne.
// « no-cache » : le navigateur redemande toujours au serveur si le fichier a
// changé, au lieu de resservir sa copie gardée jusqu'à 10 min (GitHub Pages).
// Sans ça, une mise à jour pouvait ne pas s'afficher tout de suite.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request, e.request.mode === 'navigate' ? undefined : { cache: 'no-cache' })
      .then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })),
  );
});
