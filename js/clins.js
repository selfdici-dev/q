// Clins d'œil à Game of Thrones. De temps en temps (pas tous les jours, pour
// que ça reste une surprise), une réplique de la série s'invite dans un
// message de Cap : à la fin d'une séance, un jour de reprise, la nuit, aux
// échecs. Et le soir tard, Fantôme, le loup blanc de Jon Snow, dort en boule
// dans la salle. Toujours pour encourager, jamais pour faire honte.
// Rien n'est stocké : tout vient de la date. Logique pure (sans DOM), testée
// par tests/clins.test.js.
import { diffDays } from './logic.js';
import { P, r1 } from './iso.js';

// Les répliques, par moment. {bed} et {wake} : ton coucher visé, ton réveil.
export const CLINS = {
  seance: ['Dracarys !', 'Un Lannister paie toujours ses dettes.', 'Valar Dohaeris : tous les hommes doivent servir.', 'Le Nord se souvient.'],
  reprise: ['Que dit-on au dieu de la flemme ? Pas aujourd’hui.', 'Jon Snow aussi est revenu.', 'Le Nord se souvient : reviens, toi aussi.'],
  nuit: ['La nuit est sombre et pleine de terreurs : au lit (coucher visé {bed}), debout à {wake}.',
    'La nuit tombe, ta garde commence : téléphone en charge, au lit (coucher visé {bed}), debout à {wake}.'],
  perdu: ['Tu ne sais rien, Jon Snow… pour l’instant.'],
  gagne: ['Au jeu des trônes, on gagne ou on meurt.'],
};

// En moyenne, un jour sur combien, pour chaque moment.
const EVERY = { seance: 3, reprise: 2, nuit: 3, perdu: 2, gagne: 2 };
const SEED = { seance: 1, reprise: 2, nuit: 3, perdu: 4, gagne: 5 };

// Un hasard fixe pour un jour (« AAAA-MM-JJ ») : le même toute la journée.
function roll(key, seed) {
  const n = diffDays('2026-01-01', String(key ?? ''));
  if (!Number.isFinite(n)) return NaN;
  const x = Math.sin((n + 1) * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// La réplique du jour pour un moment, ou '' (pas aujourd'hui).
// vars : les valeurs à glisser dans la réplique ({ bed, wake }).
export function clin(moment, key, vars = {}) {
  const list = CLINS[moment];
  if (!list) return '';
  const r = roll(key, SEED[moment]);
  if (!(r < 1 / EVERY[moment])) return '';
  const line = list[Math.floor(roll(key, SEED[moment] + 10) * list.length)];
  return line.replace(/\{(\w+)\}/g, (m, name) => String(vars[name] ?? m));
}

// Fantôme, le loup blanc de Jon Snow : le soir tard et la nuit, il dort en
// boule sur le sol de la salle, entre la borne d'arcade et les postes P, M, A.
export const GHOST = { X: 1.78, Y: 3.62, s: 1.25, phases: ['crepuscule', 'nuit'] };
export const ghostHere = (phase) => GHOST.phases.includes(phase);

// Son dessin (il respire, et des « z » montent s'il peut bouger).
export function ghostSVG(animate = true) {
  const [x, y] = P(GHOST.X, GHOST.Y, 0);
  const breathe = animate ? '<animateTransform attributeName="transform" type="scale" values="1 1;1.02 1.07;1 1" dur="3.6s" repeatCount="indefinite"/>' : '';
  const zs = animate ? [[0, 0], [1.2, 1.4]].map(([b, dx]) => `<text x="${-4 + dx}" y="-13" font-family="system-ui, sans-serif" font-weight="700" font-size="5" fill="#cfd8ff" opacity="0">z`
    + `<animate attributeName="opacity" values="0;0.9;0" dur="2.8s" begin="${b}s" repeatCount="indefinite"/>`
    + `<animateTransform attributeName="transform" type="translate" values="0 0;3 -9" dur="2.8s" begin="${b}s" repeatCount="indefinite"/></text>`).join('') : '';
  return `<g class="hub-ghost" transform="translate(${r1(x)} ${r1(y)}) scale(${GHOST.s})">`
    + '<ellipse cy="0.8" rx="14" ry="3.8" fill="#000" opacity="0.28"/>'
    // le dos, fourrure en touffes ; le ventre dans l'ombre
    + `<g>${breathe}<path d="M-9 -1C-10 -6 -5 -10 0 -10.4L1.2 -11.4L2 -10.4L3.6 -11.2L4.2 -10C8.6 -9.4 12.2 -6.6 12.2 -3.4C12.2 -0.4 9 0.6 5 0.6H-6C-8 0.6 -9 0 -9 -1Z" fill="#eef1f6"/>`
    + '<path d="M-8.8 -1.8C-5 -0.8 2 -0.6 8.4 -1.8C10.8 -2.3 11.9 -3.2 12.2 -3.4C12.2 -0.4 9 0.6 5 0.6H-6C-8 0.6 -9 0 -8.8 -1.8Z" fill="#c9d1dc"/>'
    + '<path d="M-1 -9q2 1.4 4 0.6M4.4 -8.2q2 1.6 4 1M-4 -7.4q1.6 1.4 3.4 1M6 -5.4q1.8 1.2 3.6 0.8" stroke="#d3dae4" stroke-width="0.7" fill="none"/></g>'
    // la queue touffue, enroulée devant
    + '<path d="M11.2 -4.6C14.6 -1.4 10.2 2.4 1 2.4C-4 2.4 -9 1.8 -12.4 0.4L-13.4 -0.6L-11.6 -0.4L-12.2 -1.4L-10.2 -0.6C-6.6 0.4 -1 0.8 4 0C8 -0.6 10.6 -2.2 11.2 -4.6Z" fill="#f8fafc"/>'
    + '<path d="M-2 1.6q3 0.4 6 -0.2M5 0.8q2.6 -0.6 4.4 -2" stroke="#dde3ea" stroke-width="0.6" fill="none"/>'
    // la tête posée sur la queue : museau long, oreilles pointues, œil fermé (rouge, comme le vrai)
    + '<ellipse cx="-8.6" cy="-4" rx="5" ry="3.8" fill="#f3f5f9"/>'
    + '<path d="M-12.4 -5L-17.8 -2.8Q-18.4 -2.1 -17.6 -1.7L-12.2 -1.4Z" fill="#e6eaf0"/><circle cx="-17.7" cy="-2.3" r="0.85" fill="#2a2a33"/>'
    + '<path d="M-11.2 -6.8L-10.3 -11.6L-8.2 -7.2Z" fill="#e6eaf0"/><path d="M-10.6 -7.4L-10.1 -10.2L-9 -7.6Z" fill="#d9c7cd"/>'
    + '<path d="M-7.9 -7.4L-6.2 -11.3L-4.8 -6.8Z" fill="#dfe4eb"/><path d="M-7.2 -7.4L-6.2 -9.8L-5.6 -7.2Z" fill="#d9c7cd"/>'
    + `<path d="M-10.8 -4.4q1 0.8 2 0" stroke="#9b2c2c" stroke-width="0.75" fill="none"/>${zs}</g>`;
}

// Sa zone à toucher, en unités de la salle : [gauche, haut, largeur, hauteur].
export function ghostZone() {
  const [x, y] = P(GHOST.X, GHOST.Y, 0);
  const s = GHOST.s;
  return [r1(x - 18 * s), r1(y - 12 * s), r1(32 * s), r1(15 * s)];
}
