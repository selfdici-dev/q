// La Salle suit l'heure : lumière dorée le matin, rien de changé en journée,
// coucher de soleil le soir, heure bleue, puis nuit étoilée après 23 h, la
// salle qui s'endort (un rappel doux d'aller au lit). Une couche de lumière
// posée sur n'importe quel décor, sous le faisceau du poste choisi (qui reste
// allumé). Rien n'est stocké : tout vient de l'heure du téléphone.
// Logique pure (sans DOM), testée par tests/daylight.test.js.
import { HUB, P, r1 } from './iso.js';

// Les moments de la journée, de minuit à minuit : [début (heure), id, nom].
const SLOTS = [[0, 'nuit'], [6, 'matin'], [11, 'jour'], [17, 'soir'], [21, 'crepuscule'], [23, 'nuit']];
export const PHASE_NAMES = { matin: 'Matin', jour: 'Journée', soir: 'Coucher de soleil', crepuscule: 'Heure bleue', nuit: 'Nuit' };

// Le moment d'une heure « HH:MM » (une heure illisible : la journée, sans effet).
export function dayPhase(hhmm) {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(hhmm ?? ''));
  const h = m ? Number(m[1]) : NaN;
  if (!(h >= 0 && h < 24) || Number(m[2]) > 59) return 'jour';
  return SLOTS.filter(([from]) => h >= from).at(-1)[1];
}

// Les rayons du soleil : de longues bandes en biais qui traversent la pièce,
// venues d'en haut à gauche le matin, d'en haut à droite le soir.
const RAYS = [[-30, 70, 26], [-20, 10, 40], [30, -30, 18], [95, -45, 30], [170, -60, 16]]; // départ x, y, largeur
function rays(u, right, color, animate) {
  const [dx, dy] = [0.87, 0.5];
  const [nx, ny] = [-dy, dx];
  const flip = (x) => (right ? HUB.w - x : x);
  const band = ([sx, sy, w], i) => {
    const a = [sx + (nx * w) / 2, sy + (ny * w) / 2], b = [sx - (nx * w) / 2, sy - (ny * w) / 2];
    const end = (p) => [p[0] + dx * 620, p[1] + dy * 620];
    const d = [a, b, end(b), end(a)].map(([x, y]) => `${r1(flip(x))} ${r1(y)}`).join('L');
    const shimmer = animate ? `<animate attributeName="opacity" values="1;0.55;1" dur="${7 + i * 1.3}s" begin="${-i * 1.7}s" repeatCount="indefinite"/>` : '';
    return `<path d="M${d}Z" fill="url(#${u('rays')})">${shimmer}</path>`;
  };
  return {
    defs: `<linearGradient id="${u('rays')}" gradientUnits="userSpaceOnUse" x1="${flip(0)}" y1="20" x2="${flip(320)}" y2="330"><stop offset="0" stop-color="${color}" stop-opacity="0.18"/><stop offset="0.55" stop-color="${color}" stop-opacity="0.06"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient>`,
    svg: `<g class="tod-rays">${RAYS.map(band).join('')}</g>`,
  };
}

// Le ciel de nuit, au-dessus des murs : des étoiles qui scintillent et un
// croissant de lune (coupé dans un masque, pour aller sur tous les fonds),
// sauf si le décor a déjà sa lune ou son soleil (moon : false).
const STARS = [[18, 30, 1.1], [52, 14, 0.8], [88, 40, 1], [122, 12, 0.7], [150, 52, 0.9], [210, 50, 0.8], [238, 18, 1.1], [270, 44, 0.7],
  [306, 16, 0.9], [342, 36, 1], [14, 92, 0.8], [40, 128, 0.7], [70, 76, 1], [108, 96, 0.7], [254, 92, 0.8], [292, 68, 0.9], [344, 120, 0.8], [330, 76, 0.7]];
// le haut de la scène, au-dessus des murs (les étoiles restent dans le ciel)
const SKY = (() => {
  const [l, c, r] = [P(0, 7.3, 3), P(0, 0, 3), P(7.3, 0, 3)];
  return `M0 0H${HUB.w}V${r1(r[1])}L${r1(c[0])} ${r1(c[1])}L${r1(l[0])} ${r1(l[1])}Z`;
})();
function night(u, animate, moon) {
  const stars = STARS.map(([x, y, rad], i) => `<circle cx="${x}" cy="${y}" r="${rad}" fill="#fff6dc"${animate ? '' : ` opacity="${0.55 + (i % 3) * 0.15}"`}>${animate ? `<animate attributeName="opacity" values="0.9;0.25;0.9" dur="${2.4 + (i % 5) * 0.7}s" begin="${-(i % 7) * 0.6}s" repeatCount="indefinite"/>` : ''}</circle>`).join('');
  return {
    defs: `<clipPath id="${u('sky-clip')}"><path d="${SKY}"/></clipPath>
${moon ? `<mask id="${u('moon-cut')}"><rect x="290" y="78" width="44" height="44" fill="#fff"/><circle cx="318" cy="96" r="10" fill="#000"/></mask>
<radialGradient id="${u('moon-glow')}"><stop offset="0" stop-color="#fff2c4" stop-opacity="0.35"/><stop offset="1" stop-color="#fff2c4" stop-opacity="0"/></radialGradient>` : ''}
<radialGradient id="${u('arc-glow')}"><stop offset="0" stop-color="#8f7cff" stop-opacity="0.38"/><stop offset="1" stop-color="#8f7cff" stop-opacity="0"/></radialGradient>`,
    sky: `<g class="tod-sky" clip-path="url(#${u('sky-clip')})">${stars}${moon ? `<circle cx="312" cy="100" r="26" fill="url(#${u('moon-glow')})"/><circle cx="312" cy="100" r="11" fill="#fff0c2" mask="url(#${u('moon-cut')})"/>` : ''}</g>`,
  };
}

// La lueur de l'écran de la borne d'arcade, quand la salle est dans le noir.
function arcadeGlow(u, strength) {
  const [x, y] = P(0.95, 3.5, 1.4);
  return `<ellipse class="tod-arcade" cx="${r1(x)}" cy="${r1(y)}" rx="46" ry="38" fill="url(#${u('arc-glow')})" opacity="${strength}"/>`;
}

// La couche de lumière d'un moment, pour la salle (préfixe u des identifiants) :
// defs (dégradés), over (posé sur la pièce, sous le faisceau du poste choisi).
// moon : false si le décor a déjà sa lune ou son soleil. En journée : rien,
// le décor tel quel.
export function daylightArt(phase, { u = (n) => `tod-${n}`, animate = true, moon = true } = {}) {
  const tint = (stops, [x1, y1, x2, y2]) => `<linearGradient id="${u('tint')}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient>`;
  const veil = `<rect width="${HUB.w}" height="${HUB.h}" fill="url(#${u('tint')})"/>`;
  if (phase === 'matin') {
    const r = rays(u, false, '#ffe7b0', animate);
    return {
      defs: tint([[0, '#ffc874', 0.26], [0.55, '#ffc874', 0.07], [1, '#ffc874', 0]], [0, 0, 1, 1]) + r.defs,
      over: `<g class="hub-tod tod-matin">${veil}${r.svg}</g>`,
    };
  }
  if (phase === 'soir') {
    const r = rays(u, true, '#ffb27a', animate);
    return {
      defs: tint([[0, '#ff8d55', 0.3], [0.5, '#ff6f7d', 0.12], [1, '#4a2f7a', 0.16]], [1, 0, 0, 1]) + r.defs,
      over: `<g class="hub-tod tod-soir">${veil}${r.svg}</g>`,
    };
  }
  if (phase === 'crepuscule' || phase === 'nuit') {
    const deep = phase === 'nuit';
    const n = night(u, animate, moon);
    return {
      defs: tint(deep ? [[0, '#040a1f', 0.62], [0.45, '#071232', 0.5], [1, '#030716', 0.56]] : [[0, '#3b2f7d', 0.34], [0.5, '#24306e', 0.26], [1, '#141c46', 0.32]], [0, 0, 0, 1]) + n.defs,
      over: `<g class="hub-tod tod-${phase}">${veil}${deep ? n.sky : ''}${arcadeGlow(u, deep ? 1 : 0.6)}</g>`,
    };
  }
  return { defs: '', over: '' };
}

// Le mot du soir et de la nuit, sous la salle : doux, jamais une interdiction.
// bed, wake : ton coucher visé et ton réveil, déjà écrits (« 23 h 30 », « 8 h »).
export function nightHint(phase, bed = 'minuit', wake = '8 h') {
  if (phase === 'nuit') return `La salle s’endort : au lit (coucher visé ${bed}), debout à ${wake}. Demain, elle t’attend.`;
  if (phase === 'crepuscule') return 'Heure bleue : la salle baisse ses lumières. Prépare tes vêtements de demain.';
  return '';
}
