// Fabriqué par outils/dessins/jeu.py : ne pas modifier à la main.
// Les personnages de la Salle, façon jeu vidéo (img/jeu/<slug>-<n>.webp), sous le
// nom de leur bonhomme (js/poses.js) : n images de w × h px ; segs : comme dans
// js/drawings-data.js (les images de chaque passage, au rythme du bonhomme) ;
// side : le côté rendu. Mesures en part de l'image : ground (le sol, sous les
// pieds), top (le haut du corps), center (le milieu des appuis), reach (jusqu'où
// vont les gants) ; unit : une unité du corps 3D (≈ 1 dm), en px de l'image.
export const HEROES = {
  'Tractions': { slug: 'tractions', n: 5, w: 216, h: 380, segs: [[0, 1, 2, 3, 4], [4, 3, 2, 1, 0]], ground: 0.988, top: 0.019, center: 0.586, unit: 15.1 },
  'Fente basse': { slug: 'fente-basse', n: 5, w: 354, h: 380, segs: [[0, 1, 2, 3, 4], [4, 3, 2, 1, 0]], side: 'droite', ground: 0.985, top: 0.019, center: 0.457, unit: 27.14 },
  'Crunch vélo': { slug: 'crunch-velo', n: 4, w: 460, h: 291, segs: [[0, 1, 2, 3], [3, 2, 1, 0]], ground: 0.875, top: 0.021, center: 0.511, unit: 28.59 },
  'Shadow boxing': { slug: 'shadow-boxing', n: 5, w: 342, h: 380, segs: [[0, 1, 2], [2, 1, 0], [0, 3, 4], [4, 3, 0]], ground: 0.983, top: 0.018, center: 0.554, unit: 19.84, reach: 0.972 },
  'Pompes (sur parallettes)': { slug: 'pompes-parallettes', n: 5, w: 460, h: 269, segs: [[0, 1, 2, 3, 4], [4, 3, 2, 1, 0]], ground: 0.977, top: 0.023, center: 0.507, unit: 25.05 },
};
