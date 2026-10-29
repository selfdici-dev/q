// Fabriqué par outils/dessins/images.py : ne pas modifier à la main.
// Clé : le nom du bonhomme (js/poses.js). slug : nom des images
// (img/ex/<slug>-<n>.webp) ; n : nombre d'images ; w, h : leur taille (px) ;
// segs : pour chaque passage d'une pose clé à la suivante, dans l'ordre joué
// par le bonhomme, ses images de la pose de départ à la pose d'arrivée ;
// side : le côté dessiné (l'autre côté est le même dessin en miroir).
export const DRAWINGS = {
  'Crunch vélo': { slug: 'crunch-velo', n: 4, w: 800, h: 559, segs: [[0, 1, 2, 3], [3, 2, 1, 0]] },
  'Roue abdominale à genoux': { slug: 'roue', n: 5, w: 800, h: 439, segs: [[0, 1, 2, 3, 4], [4, 3, 2, 1, 0]] },
  'Russian twist': { slug: 'russian-twist', n: 5, w: 700, h: 600, segs: [[0, 1, 2], [2, 1, 0], [0, 3, 4], [4, 3, 0]] },
  'Crunch inversé': { slug: 'crunch-inverse', n: 5, w: 767, h: 600, segs: [[0, 1, 2, 3, 4], [4, 3, 2, 1, 0]] },
  'Planche latérale': { slug: 'planche-laterale', n: 5, w: 718, h: 600, segs: [[0, 1, 2, 3, 4], [4, 3, 2, 1, 0]], side: 'droite' },
  'Hollow hold genoux pliés': { slug: 'hollow', n: 3, w: 800, h: 578, segs: [[0, 1, 2], [2, 1, 0]] },
  'Pompes (sur parallettes)': { slug: 'pompes-parallettes', n: 5, w: 800, h: 528, segs: [[0, 1, 2, 3, 4], [4, 3, 2, 1, 0]] },
  'Rowing penché à l’élastique': { slug: 'rowing', n: 5, w: 505, h: 600, segs: [[0, 1, 2, 3, 4], [4, 3, 2, 1, 0]] },
  'Pompes pike': { slug: 'pompes-pike', n: 5, w: 782, h: 600, segs: [[0, 1, 2, 3, 4], [4, 3, 2, 1, 0]] },
  'Tirage assis à l’élastique': { slug: 'tirage-assis', n: 5, w: 730, h: 600, segs: [[0, 1, 2, 3, 4], [4, 3, 2, 1, 0]] },
  'Pompes serrées': { slug: 'pompes-serrees', n: 5, w: 800, h: 399, segs: [[0, 1, 2, 3, 4], [4, 3, 2, 1, 0]] },
  'Curl biceps à l’élastique': { slug: 'curl', n: 5, w: 276, h: 600, segs: [[0, 1, 2, 3, 4], [4, 3, 2, 1, 0]] },
  'Élévations latérales à l’élastique': { slug: 'elevations-laterales', n: 5, w: 576, h: 600, segs: [[0, 1, 2, 3, 4], [4, 3, 2, 1, 0]] },
  'L-sit': { slug: 'l-sit', n: 5, w: 720, h: 600, segs: [[0, 1, 2], [2, 3, 4], [4, 3, 2], [2, 1, 0]] },
  'Shadow boxing': { slug: 'shadow-boxing', n: 5, w: 590, h: 600, segs: [[0, 1, 2], [2, 1, 0], [0, 3, 4], [4, 3, 0]] },
  'Burpees sans saut': { slug: 'burpees', n: 10, w: 675, h: 600, segs: [[0, 9, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 1], [1, 9, 0]] },
  'Shadow boxing (esquives et crochets)': { slug: 'esquives-crochets', n: 7, w: 508, h: 600, segs: [[0, 5, 1], [1, 2], [2, 0], [0, 6, 3], [3, 4], [4, 0]] },
  'Mountain climbers rapides': { slug: 'mountain-climbers', n: 5, w: 800, h: 441, segs: [[0, 1], [1, 2], [2, 1], [1, 0], [0, 3], [3, 4], [4, 3], [3, 0]] },
  'Fentes arrière alternées': { slug: 'fentes-arriere', n: 5, w: 579, h: 600, segs: [[0, 1], [1, 2], [2, 1], [1, 0], [0, 3], [3, 4], [4, 3], [3, 0]] },
  'Suspension à la barre': { slug: 'suspension', n: 3, w: 393, h: 600, segs: [[0, 1, 2], [2, 1, 0]] },
  'Tractions': { slug: 'tractions', n: 5, w: 438, h: 600, segs: [[0, 1, 2, 3, 4], [4, 3, 2, 1, 0]] },
  'Tractions australiennes': { slug: 'tractions-australiennes', n: 5, w: 731, h: 600, segs: [[0, 1, 2, 3, 4], [4, 3, 2, 1, 0]] },
  'Relevés de genoux suspendu': { slug: 'releves-genoux', n: 5, w: 431, h: 600, segs: [[0, 1, 2, 3, 4], [4, 3, 2, 1, 0]] },
  'Chat-vache': { slug: 'chat-vache', n: 3, w: 800, h: 512, segs: [[0, 1, 2], [2, 1, 0]] },
  'Montées de genoux lentes': { slug: 'montees-genoux', n: 5, w: 474, h: 600, segs: [[0, 1, 2], [2, 3, 4], [4, 3, 2], [2, 1, 0]] },
  'Pompes sur les genoux': { slug: 'pompes-genoux', n: 5, w: 800, h: 490, segs: [[0, 1, 2, 3, 4], [4, 3, 2, 1, 0]] },
  'Fente basse': { slug: 'fente-basse', n: 5, w: 731, h: 600, segs: [[0, 1, 2, 3, 4], [4, 3, 2, 1, 0]], side: 'droite' },
  'Superman': { slug: 'superman', n: 4, w: 800, h: 252, segs: [[0, 1, 2, 3], [3], [3, 2, 1, 0], [0]] },
  'Pont fessier': { slug: 'pont-fessier', n: 5, w: 800, h: 381, segs: [[0, 1, 2, 3, 4], [4, 3, 2, 1, 0]] },
  'Tirage superman': { slug: 'tirage-superman', n: 3, w: 800, h: 250, segs: [[0, 1, 2], [2], [2, 1, 0]] },
  'Chin tucks': { slug: 'chin-tucks', n: 3, w: 732, h: 600, segs: [[0, 1, 2], [2], [2], [2, 1, 0], [0]] },
  'Passage d’épaules à l’élastique': { slug: 'passage-epaules', n: 5, w: 658, h: 600, segs: [[0, 1, 2], [2, 3, 4], [4, 3, 2], [2, 1, 0]] },
  'Écarté arrière à l’élastique': { slug: 'ecarte-arriere', n: 5, w: 649, h: 600, segs: [[0, 1, 2, 3, 4], [4, 3, 2, 1, 0]] },
  'Étirement des pectoraux mains dans le dos': { slug: 'etirement-pectoraux', n: 3, w: 419, h: 600, segs: [[0, 1, 2], [2, 1, 0]] },
  'Shadow boxing rapide': { slug: 'shadow-boxing', n: 5, w: 590, h: 600, segs: [[0, 1, 2], [2, 1, 0, 3, 4], [4, 3, 0]] },
};
