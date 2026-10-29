// Fabriqué par outils/dessins/images.py : ne pas modifier à la main.
// Clé : le nom du bonhomme (js/poses.js). slug : nom des images
// (img/ex/<slug>-<n>.webp) ; n : nombre d'images ; w, h : leur taille (px) ;
// segs : pour chaque passage d'une pose clé à la suivante, dans l'ordre joué
// par le bonhomme, ses images de la pose de départ à la pose d'arrivée ;
// side : le côté dessiné (l'autre côté est le même dessin en miroir).
export const DRAWINGS = {
  'Pompes (sur parallettes)': { slug: 'pompes-parallettes', n: 5, w: 800, h: 528, segs: [[0, 1, 2, 3, 4], [4, 3, 2, 1, 0]] },
  'Rowing penché à l’élastique': { slug: 'rowing', n: 5, w: 505, h: 600, segs: [[0, 1, 2, 3, 4], [4, 3, 2, 1, 0]] },
  'Pompes pike': { slug: 'pompes-pike', n: 5, w: 782, h: 600, segs: [[0, 1, 2, 3, 4], [4, 3, 2, 1, 0]] },
  'Tirage assis à l’élastique': { slug: 'tirage-assis', n: 5, w: 730, h: 600, segs: [[0, 1, 2, 3, 4], [4, 3, 2, 1, 0]] },
  'Pompes serrées': { slug: 'pompes-serrees', n: 5, w: 800, h: 399, segs: [[0, 1, 2, 3, 4], [4, 3, 2, 1, 0]] },
  'Curl biceps à l’élastique': { slug: 'curl', n: 5, w: 276, h: 600, segs: [[0, 1, 2, 3, 4], [4, 3, 2, 1, 0]] },
  'Élévations latérales à l’élastique': { slug: 'elevations-laterales', n: 5, w: 576, h: 600, segs: [[0, 1, 2, 3, 4], [4, 3, 2, 1, 0]] },
  'L-sit': { slug: 'l-sit', n: 5, w: 720, h: 600, segs: [[0, 1, 2], [2, 3, 4], [4, 3, 2], [2, 1, 0]] },
};
