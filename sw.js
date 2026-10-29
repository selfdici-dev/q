// Cache hors ligne. Incrémente VERSION à chaque modification des fichiers.
const VERSION = 'cap-v106';
const FILES = [
  './', './index.html', './css/styles.css', './css/luxe.css', './css/cuivre.css', './manifest.webmanifest',
  './js/app.js', './js/logic.js', './js/data.js',
  './js/money.js', './js/finance-data.js', './js/quotes.js', './js/summary.js',
  './js/backup.js', './js/figures.js', './js/poses.js', './js/avatar.js', './js/tree.js', './js/icons.js', './js/room.js', './js/gym.js',
  './js/drawings.js', './js/drawings-data.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png',
];
// Dessins des exercices (img/ex/<slug>-<n>.webp, n images par geste ; liste
// écrite par outils/dessins/images.py) : un cache à part, IMG, gardé d'une
// version à l'autre pour ne pas les retélécharger. Change IMG si on refait des
// images sous le même nom.
const IMG = 'cap-img-v1';
const DRAWN = { 'pompes-parallettes': 5, rowing: 5, 'pompes-pike': 5, 'tirage-assis': 5, 'pompes-serrees': 5, curl: 5, 'elevations-laterales': 5, 'l-sit': 5 };
const IMAGES = Object.entries(DRAWN).flatMap(([slug, n]) => Array.from({ length: n }, (_, k) => `./img/ex/${slug}-${k}.webp`));

self.addEventListener('install', (e) => {
  e.waitUntil(Promise.all([
    caches.open(VERSION).then((c) => c.addAll(FILES)),
    // dessins : seulement ceux qui manquent ; sans réseau, ils viendront plus tard
    caches.open(IMG).then(async (c) => {
      const have = new Set((await c.keys()).map((r) => new URL(r.url).pathname));
      await c.addAll(IMAGES.filter((f) => !have.has(new URL(f, self.location.href).pathname)));
    }).catch(() => {}),
  ]).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== IMG).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Réseau d'abord (pour recevoir les mises à jour), cache si hors ligne.
// « no-cache » : le navigateur redemande toujours au serveur si le fichier a
// changé, au lieu de resservir sa copie gardée jusqu'à 10 min (GitHub Pages).
// Sans ça, une mise à jour pouvait ne pas s'afficher tout de suite.
// Dessins : le cache d'abord (ils ne changent pas), sinon le réseau.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).pathname.includes('/img/ex/')) {
    e.respondWith(
      caches.open(IMG).then((c) => c.match(e.request, { ignoreSearch: true }).then((hit) => hit ?? fetch(e.request).then((res) => {
        if (res.ok) c.put(e.request, res.clone());
        return res;
      }))),
    );
    return;
  }
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
