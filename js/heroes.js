// Les personnages de la Salle, façon jeu vidéo : un perso par poste (teint,
// coiffure, débardeur aux couleurs de la séance), rendu en 3D puis dessiné en
// « toon » (aplats, contour, ombre au sol) par outils/dessins/jeu.py. Ils jouent
// leurs images au rythme exact du bonhomme, comme les dessins des exercices.
// Logique pure (sans DOM), testée par tests/heroes.test.js.
import { drawingFor, drawingSVG } from './drawings.js';
import { HEROES } from './heroes-data.js';

export { HEROES };
export const HERO_DIR = 'img/jeu/';

// Le perso d'un exercice (ou null) : { key, d, fig, mirror }, comme drawingFor.
export const heroFor = (name = '') => drawingFor(name, HEROES);

// Le perso en SVG, cadré comme ses images ; immobile : sa pose de départ.
export const heroSVG = (name, { animate = true } = {}) => drawingSVG(name, { animate, ghost: false, set: HEROES, dir: HERO_DIR });
