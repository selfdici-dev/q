// Bonshommes animés : chaque exercice est décrit par 2 poses ou plus, en
// angles. Le moteur calcule les articulations avec des os de longueur fixe
// (aucun membre ne s'étire, même entre deux poses) et produit un SVG animé en
// boucle (SMIL, sans JavaScript). Logique pure (sans DOM), testée par
// tests/figures.test.js.
import { baseName } from './data.js';
import { POSES } from './poses.js';

// Cadre 120 × 80, sol (tapis) à y = 70. Angles en degrés : 0 = vers la droite,
// 90 = vers le bas, 180 = vers la gauche, -90 = vers le haut.
export const VIEW = { w: 120, h: 80, floor: 70 };
export const BONES = { torso: 22, neck: 8, head: 5, upperArm: 12, forearm: 11, thigh: 15, shin: 14 };
export const WHEEL = 3.5; // rayon de la roue abdominale : mains à y = 66.5 pour qu'elle touche le sol
export const JOINTS = ['hip', 'shoulder', 'head', 'elbowN', 'handN', 'elbowF', 'handF', 'kneeN', 'footN', 'kneeF', 'footF'];
// [clé de la pose, articulation de départ, milieu, bout, os 1, os 2]
export const LIMBS = [
  ['armN', 'shoulder', 'elbowN', 'handN', 'upperArm', 'forearm'],
  ['armF', 'shoulder', 'elbowF', 'handF', 'upperArm', 'forearm'],
  ['legN', 'hip', 'kneeN', 'footN', 'thigh', 'shin'],
  ['legF', 'hip', 'kneeF', 'footF', 'thigh', 'shin'],
];

const rad = (deg) => (deg * Math.PI) / 180;
const step = ([x, y], deg, len) => [x + Math.cos(rad(deg)) * len, y + Math.sin(rad(deg)) * len];
const round = (v) => Math.round(v * 10) / 10;

// Deux os qui doivent atteindre une cible (main posée au sol, pied au tapis) :
// le coude ou le genou se plie du côté `bend` (1 ou -1).
function reach(base, target, l1, l2, bend = 1) {
  const dist = Math.min(Math.max(Math.hypot(target[0] - base[0], target[1] - base[1]), Math.abs(l1 - l2) + 0.01), l1 + l2 - 0.01);
  const phi = Math.atan2(target[1] - base[1], target[0] - base[0]);
  const a = Math.acos((l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist));
  const mid = [base[0] + Math.cos(phi + bend * a) * l1, base[1] + Math.sin(phi + bend * a) * l1];
  const b = Math.atan2(target[1] - mid[1], target[0] - mid[0]);
  return [mid, [mid[0] + Math.cos(b) * l2, mid[1] + Math.sin(b) * l2]];
}

// Pose → coordonnées des 11 articulations.
// - torso / neck : angles hanche → épaule, épaule → tête.
// - tilt (facultatif) : angle propre de la tête (sens du regard), par défaut
//   celui du cou ; sert quand la tête recule sans tourner (chin tucks).
// - armN, armF, legN, legF : [angle os 1, angle os 2], ou { to: [x, y], bend }
//   pour poser la main ou le pied à un point précis (N = côté caméra).
// - anchor (par défaut 'hip') est placé en `at` ; ce ne peut pas être un
//   membre décrit par { to }.
export function solve(p) {
  const j = { hip: [0, 0] };
  j.shoulder = step(j.hip, p.torso, BONES.torso);
  j.head = step(j.shoulder, p.neck ?? p.torso, BONES.neck);
  for (const [key, base, mid, end, b1, b2] of LIMBS) {
    if (!Array.isArray(p[key])) continue;
    j[mid] = step(j[base], p[key][0], BONES[b1]);
    j[end] = step(j[mid], p[key][1], BONES[b2]);
  }
  const anchor = p.anchor ?? 'hip';
  if (!j[anchor]) throw new Error(`Ancre « ${anchor} » impossible : elle dépend d'une cible { to }.`);
  const [tx, ty] = p.at ?? [60, VIEW.floor];
  const dx = tx - j[anchor][0];
  const dy = ty - j[anchor][1];
  for (const k of Object.keys(j)) j[k] = [j[k][0] + dx, j[k][1] + dy];
  for (const [key, base, mid, end, b1, b2] of LIMBS) {
    if (Array.isArray(p[key])) continue;
    [j[mid], j[end]] = reach(j[base], p[key].to, BONES[b1], BONES[b2], p[key].bend ?? 1);
  }
  const out = {};
  for (const k of JOINTS) out[k] = [round(j[k][0]), round(j[k][1])];
  if (p.tilt !== undefined) out.tilt = p.tilt;
  return out;
}

// Pose intermédiaire : on interpole les angles (par le plus court chemin) et
// les points visés, jamais les coordonnées, donc les os gardent leur taille.
const lerp = (a, b, t) => a + (b - a) * t;
const lerpAngle = (a, b, t) => a + ((((b - a) % 360) + 540) % 360 - 180) * t;
const lerpPoint = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

export function between(a, b, t) {
  const p = { ...a, torso: lerpAngle(a.torso, b.torso, t), neck: lerpAngle(a.neck ?? a.torso, b.neck ?? b.torso, t) };
  if (a.at && b.at) p.at = lerpPoint(a.at, b.at, t);
  if (a.tilt !== undefined || b.tilt !== undefined) p.tilt = lerpAngle(a.tilt ?? a.neck ?? a.torso, b.tilt ?? b.neck ?? b.torso, t);
  for (const [key] of LIMBS) {
    p[key] = Array.isArray(a[key])
      ? [lerpAngle(a[key][0], b[key][0], t), lerpAngle(a[key][1], b[key][1], t)]
      : { to: lerpPoint(a[key].to, b[key].to, t), bend: a[key].bend };
  }
  return p;
}

// Ordre des poses : aller-retour (A → B → A) par défaut, ou boucle (A → B → C → A).
function order(fig) {
  const f = fig.frames;
  if (f.length === 1) return [f[0], f[0]];
  return fig.loop === 'cycle' ? [...f, f[0]] : [...f, ...f.slice(0, -1).reverse()];
}

// Rythme du geste. Par défaut, chaque passage d'une pose à la suivante a la
// même part du cycle (durée dur) et commence par un arrêt hold (part du
// passage). Avec un rythme réel : tempo = secondes de chaque passage, dans
// l'ordre joué (aller puis retour : pompes [2, 1], on descend en 2 s et on
// remonte en 1 s, comme la consigne) ; pause = secondes d'arrêt sur chaque
// pose avant de repartir (0,25 s par défaut). La durée du cycle en découle.
// Renvoie { dur, seg } : seg[i] = { t0, len, hold } en part du cycle.
export function beats(fig) {
  const n = order(fig).length - 1;
  if (!fig.tempo) {
    const hold = fig.hold ?? 0.15;
    return { dur: fig.dur ?? 2, seg: Array.from({ length: n }, (_, i) => ({ t0: i / n, len: 1 / n, hold })) };
  }
  const pause = fig.pause ?? fig.tempo.map(() => 0.25);
  if (fig.tempo.length !== n || pause.length !== n) throw new Error(`tempo et pause : ${n} durées attendues`);
  const secs = fig.tempo.map((m, i) => m + pause[i]);
  const dur = secs.reduce((a, b) => a + b, 0);
  let acc = 0;
  const seg = secs.map((sec, i) => {
    const t0 = acc / dur;
    acc += sec;
    return { t0, len: sec / dur, hold: pause[i] / sec };
  });
  return { dur: Math.round(dur * 100) / 100, seg };
}

// Images clés de l'animation : chaque pose est tenue (arrêt du passage), puis
// on glisse vers la suivante en SUB petits pas, avec une courbe douce (lente
// au départ et à l'arrivée).
const SUB = 6;
const ease = (u) => 0.5 - Math.cos(Math.PI * u) / 2;

export function timeline(fig) {
  const specs = order(fig);
  const n = specs.length - 1;
  const { seg } = beats(fig);
  const keys = [];
  for (let i = 0; i < n; i++) {
    const { t0, len, hold } = seg[i];
    keys.push({ t: t0, joints: solve(specs[i]) });
    for (let k = 0; k < SUB; k++) {
      const u = k / SUB;
      keys.push({ t: t0 + len * (hold + (1 - hold) * u), joints: solve(between(specs[i], specs[i + 1], ease(u))) });
    }
  }
  keys.push({ t: 1, joints: solve(specs[n]) });
  return keys;
}

// Cadre serré autour de tout le mouvement (pour grossir le bonhomme à
// l'écran), sol compris, avec une marge. Sans sol (suspendu à la barre) : le
// cadre s'arrête sous le corps.
export function frameBox(keys, wheel = false, pad = 5, ground = true) {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const { joints } of keys) {
    for (const k of JOINTS) {
      const r = k === 'head' ? BONES.head : k === 'handN' && wheel ? WHEEL : 2;
      x0 = Math.min(x0, joints[k][0] - r);
      x1 = Math.max(x1, joints[k][0] + r);
      y0 = Math.min(y0, joints[k][1] - r);
      y1 = Math.max(y1, joints[k][1] + r);
    }
  }
  const bottom = ground ? VIEW.floor + 7 : Math.min(VIEW.floor + 7, y1 + pad);
  const top = Math.min(y0 - pad, bottom - 30); // au moins 30 de haut : un bonhomme couché ne devient pas géant
  return [round(x0 - pad), round(top), round(x1 - x0 + 2 * pad), round(bottom - top)];
}

// Parties du corps qu'on peut allumer (muscle travaillé), du fond vers
// l'avant. [nom, de, à, épaisseur, côté] — liste gardée telle quelle : les
// noms servent à focusFor ; le dessin, lui, est fait de pièces (plus bas).
export const BODY = [
  ['forearmF', 'elbowF', 'handF', 3.2, 'F'],
  ['upperArmF', 'shoulder', 'elbowF', 4.1, 'F'],
  ['shinF', 'kneeF', 'footF', 3.9, 'F'],
  ['thighF', 'hip', 'kneeF', 5.4, 'F'],
  ['waist', 'hip', 'mid', 6.6, ''],
  ['chest', 'mid', 'top', 7.8, ''],
  ['neck', 'shoulder', 'head', 3.4, ''],
  ['thighN', 'hip', 'kneeN', 5.4, 'N'],
  ['shinN', 'kneeN', 'footN', 3.9, 'N'],
  ['upperArmN', 'shoulder', 'elbowN', 4.1, 'N'],
  ['forearmN', 'elbowN', 'handN', 3.2, 'N'],
];

// Muscle travaillé, d'après l'objectif de l'exercice (« Bas des abdos · la
// tablette » → la taille) : ces parties s'allument.
const FOCUS = [
  [/abdos|grand droit|tablette|gainage|obliques|taille|ventre|muscle profond/i, ['waist']],
  [/pectoraux|buste|haut du dos|omoplates|poitrine|\bdos\b/i, ['chest']],
  [/colonne|étirement du dos|détente du dos/i, ['waist', 'chest']],
  [/épaules|carrure/i, ['upperArmN', 'upperArmF']],
  [/triceps/i, ['upperArmN', 'upperArmF']], // le triceps est à l'arrière du bras, pas dans l'avant-bras
  [/\bbras\b/i, ['upperArmN', 'upperArmF', 'forearmN', 'forearmF']],
  [/\bcou\b|mâchoire|tête/i, ['neck']],
  [/hanches|fessiers/i, ['thighN', 'thighF']],
];

export function focusFor(target = '') {
  return [...new Set(FOCUS.filter(([re]) => re.test(target)).flatMap(([, bones]) => bones))];
}

// ——— Le mannequin ———
// Chaque pièce (bras, avant-bras, main, cuisse, jambe, pied, buste, cou,
// tête) est une forme fixe, dessinée une fois dans le repère de son os : x le
// long de l'os, y en travers, l'avant du corps (ventre, genou, visage, dessus
// du pied) du côté des y négatifs. À l'écran, on ne fait que la déplacer et
// la tourner, en chaîne (épaule → coude → poignet) : les os gardent leur
// longueur et les articulations restent jointes, même entre deux images.
const HEAD = 4.5; // rayon du crâne
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const deg = (r) => (r * 180) / Math.PI;
const angleOf = (a, b) => deg(Math.atan2(b[1] - a[1], b[0] - a[0]));
const norm = (a) => ((((a + 180) % 360) + 360) % 360) - 180; // entre -180 et 180
const r2 = (v) => Math.round(v * 100) / 100;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
// Suite d'angles sans saut de 360° (l'animation tourne par le bon côté).
const unwrap = (list) => list.reduce((out, a) => [...out, out.length ? a + Math.round((out.at(-1) - a) / 360) * 360 : a], []);

// Profils [x, demi-largeur devant, demi-largeur derrière] ; a, b : arrondi au
// départ et au bout. Cuisse plus épaisse que le mollet, mollet bombé derrière,
// bras qui s'affine vers le poignet ; buste : fesses, taille, cage thoracique.
const SHAPES = {
  thigh: { a: 2.6, b: 1.8, pts: [[0.6, 3.3, 3.5], [4.5, 3.4, 3.3], [9.5, 2.85, 2.8], [13.4, 2.3, 2.3]] },
  shin: { a: 1.7, b: 1.2, pts: [[0.6, 2.25, 2.35], [3.6, 2.05, 2.85], [8.5, 1.65, 1.95], [12.9, 1.25, 1.3]] },
  upperArm: { a: 2.6, b: 1.5, pts: [[0.3, 2.85, 2.9], [3.5, 2.6, 2.6], [8, 2.15, 2.2], [11, 1.8, 1.85]] },
  forearm: { a: 1.5, b: 1.1, pts: [[0.5, 1.85, 1.9], [3.5, 1.95, 2.05], [8, 1.5, 1.55], [10.4, 1.25, 1.25]] },
  hand: { a: 1.0, b: 1.1, pts: [[0.3, 1.2, 1.2], [1.5, 1.42, 1.42], [2.7, 1.25, 1.25]] },
  neck: { a: 0.6, b: 1.0, pts: [[0, 1.65, 1.75], [5.6, 1.55, 1.6]] },
  torso: { a: 2.4, b: 1.9, pts: [[-0.6, 3.1, 4.2], [1.6, 3.3, 4.6], [4.4, 3.1, 3.4], [7.4, 2.95, 2.8], [10.4, 3.4, 3.0], [13.4, 4.3, 3.6], [16.4, 5.0, 4.1], [19.2, 4.7, 4.2], [21.4, 3.6, 3.5]] },
  // muscles qui travaillent : un fuseau dans la pièce (le bord reste clair)
  thighM: { a: 1.8, b: 1.5, pts: [[1.8, 2.35, 2.5], [5, 2.5, 2.4], [9.5, 2.05, 1.95], [11.8, 1.5, 1.5]] },
  shinM: { a: 1.4, b: 1.2, pts: [[1.6, 1.45, 1.95], [3.9, 1.35, 2.2], [8, 1.1, 1.45], [10.2, 0.8, 0.95]] },
  upperArmM: { a: 1.7, b: 1.3, pts: [[1.2, 1.85, 1.95], [4, 1.8, 1.85], [7.6, 1.5, 1.55], [9.3, 1.2, 1.2]] },
  forearmM: { a: 1.2, b: 1.0, pts: [[1.4, 1.3, 1.35], [3.6, 1.4, 1.5], [7, 1.05, 1.1], [8.4, 0.8, 0.8]] },
  neckM: { a: 0.6, b: 0.8, pts: [[0.6, 1.1, 1.2], [4.8, 1.0, 1.1]] },
  abs: { a: 1.4, b: 1.5, pts: [[3.4, 2.55, 0.2], [7.4, 2.5, 0.4], [11.8, 2.8, 0.2]] },
  chest: { a: 1.6, b: 1.4, pts: [[13.4, 3.55, 2.85], [16.4, 4.15, 3.25], [19.2, 3.85, 3.35], [20.6, 2.9, 2.7]] },
  glutes: { a: 1.6, b: 1.6, pts: [[-0.4, -0.3, 3.6], [1.6, -0.6, 4.0], [3.6, -0.4, 2.9]] },
};
// Vue de face : buste plus large (épaules), symétrique ; le ventre est une
// tablette au milieu (pas une bande qui fait le tour comme un short).
const FRONT = {
  torso: { a: 2.3, b: 1.9, pts: [[-0.6, 4.5, 4.5], [1.6, 4.9, 4.9], [4.4, 4.3, 4.3], [7.4, 3.75, 3.75], [10.4, 4.1, 4.1], [13.4, 5.2, 5.2], [16.4, 6.1, 6.1], [19.2, 6.6, 6.6], [21.4, 6.0, 6.0]] },
  abs: { a: 1.6, b: 1.6, pts: [[3.8, 2.4, 2.4], [8, 2.5, 2.5], [12.2, 2.6, 2.6]] },
  chest: { a: 1.8, b: 1.4, pts: [[13.6, 4.3, 4.3], [16.4, 5.0, 5.0], [19.2, 5.4, 5.4], [20.8, 4.9, 4.9]] },
};
const SHOULDER_OUT = 3.9; // de face : écart de chaque épaule au milieu du buste
const HIP_OUT = 2.3; // … et de chaque hanche (à l'horizontale : les pieds restent posés)

// Contour lissé fermé (Catmull-Rom → Bézier), qui passe par tous les points.
function smooth(p) {
  const n = p.length;
  let d = `M${r2(p[0][0])} ${r2(p[0][1])}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [p[(i - 1 + n) % n], p[i], p[(i + 1) % n], p[(i + 2) % n]];
    d += `C${r2(p1[0] + (p2[0] - p0[0]) / 6)} ${r2(p1[1] + (p2[1] - p0[1]) / 6)} ${r2(p2[0] - (p3[0] - p1[0]) / 6)} ${r2(p2[1] - (p3[1] - p1[1]) / 6)} ${r2(p2[0])} ${r2(p2[1])}`;
  }
  return `${d}Z`;
}
// Contour d'un profil : le devant (y < 0), l'arrondi du bout, le dos, l'arrondi du départ.
function contour({ a, b, pts }) {
  const c = Math.SQRT1_2;
  const cap = ([x, f, k], r, s) => {
    const [m, h] = [(k - f) / 2, (f + k) / 2];
    return [[x + s * r * c, m - s * h * c], [x + s * r, m], [x + s * r * c, m + s * h * c]];
  };
  const [e0, e1, e2] = cap(pts.at(-1), b, 1);
  const [s0, s1, s2] = cap(pts[0], a, -1);
  return [...pts.map(([x, f]) => [x, -f]), e0, e1, e2, ...pts.map(([x, , k]) => [x, k]).reverse(), s0, s1, s2];
}
const mix = (s, w, t) => ({ a: s.a + (w.a - s.a) * t, b: s.b + (w.b - s.b) * t, pts: s.pts.map((p, i) => p.map((v, k) => v + (w.pts[i][k] - v) * t)) });

// Tête (repère de la tête : centre du crâne en 0, x vers le haut du crâne,
// visage du côté des y négatifs). φ en degrés : 0 = haut, 90 = visage.
const polar = (phi, r) => [r * Math.cos(rad(phi)), -r * Math.sin(rad(phi))];
const R = HEAD;
const HEADS = {
  // de profil : crâne, front, nez, bouche, menton, nuque (un seul contour)
  side: {
    head: [polar(0, R), polar(32, R), polar(62, R), polar(80, R - 0.1), polar(90, R + 0.1), polar(99, R + 1.15), polar(106, R + 0.25), polar(116, R + 0.25), polar(126, R + 0.15), polar(138, R + 0.5), polar(152, R + 0.35), polar(170, R - 0.5), polar(196, R - 1.1), polar(225, R - 0.1), polar(262, R + 0.1), polar(300, R + 0.1), polar(332, R + 0.05)],
    // cheveux : sur le haut et l'arrière du crâne, la nuque et la tempe dégagées
    hair: [polar(60, R + 0.35), polar(36, R + 0.6), polar(8, R + 0.7), polar(-28, R + 0.7), polar(-66, R + 0.6), polar(-102, R + 0.45), polar(-126, R + 0.2), polar(-134, R - 0.7), polar(-112, R - 1.3), polar(-80, R - 1.7), polar(-30, R - 1.5), polar(12, R - 1.5), polar(44, R - 1.2)],
  },
  front: {
    head: [polar(0, R), polar(40, R), polar(80, R - 0.1), polar(112, R - 0.25), polar(140, R + 0.05), polar(162, R + 0.55), polar(180, R + 0.8), polar(198, R + 0.55), polar(220, R + 0.05), polar(248, R - 0.25), polar(280, R - 0.1), polar(320, R)],
    hair: [polar(96, R + 0.15), polar(64, R + 0.55), polar(28, R + 0.7), polar(0, R + 0.72), polar(-28, R + 0.7), polar(-64, R + 0.55), polar(-96, R + 0.15), polar(-84, R - 0.9), polar(-52, R - 1.5), polar(-18, R - 1.9), polar(18, R - 1.9), polar(52, R - 1.5), polar(84, R - 0.9)],
  },
};
// Pied (chaussure), repère de la cheville : orteils vers x > 0, semelle du
// côté des y positifs (le dessus du pied est « l'avant » de la jambe).
const SHOE = [[-1.5, -0.7], [-1.8, 0.9], [-1.1, 1.9], [1.5, 1.95], [3.6, 1.8], [4.75, 1.3], [5.0, 0.35], [4.2, -0.45], [2.3, -1.05], [0.7, -1.6], [-0.8, -1.5]];
const SOLE = [[-1.85, 0.95], [-1.15, 1.95], [1.5, 2.0], [3.6, 1.85], [4.8, 1.35], [4.95, 0.8], [3.7, 1.15], [1.5, 1.3], [-0.9, 1.25]];
const SHOE_FRONT = [[-0.9, -1.2], [-1.3, 1.4], [0.6, 1.95], [2.5, 1.75], [3.3, 0.7], [2.6, -0.5], [0.9, -1.2]];
export const FLOOR_LIMIT = VIEW.floor + 2.2; // le dessous du pied et de la main peut toucher le tapis, pas s'y enfoncer
const flipY = (pts) => pts.map(([x, y]) => [x, -y]);

// ——— Pieds et mains ———
// Plus bas point de la chaussure posée en `root`, tournée de φ (semelle du côté sgn).
const shoeLow = (root, phi, sgn) => root[1] + Math.max(...SHOE.map(([x, y]) => x * Math.sin(rad(phi)) + y * sgn * Math.cos(rad(phi))));
const TOE = [];
for (const t of [0, 0.75, 1.5, 2.25, 3]) for (const d of [0, 10, 20, 30, 40, 50, 60, 70, 80]) TOE.push([t, d, t + d / 10]);
TOE.sort((a, b) => a[2] - b[2]);

// Angle du pied (degrés, absolu) et recul t de la cheville le long du tibia.
// - en l'air : perpendiculaire au tibia, côté visage, un peu tendu ;
// - à plat ventre : pied tendu (dessus du pied vers le tapis) ;
// - debout, accroupi, sur le dos genoux pliés : à plat sur le tapis si la
//   cheville le permet (flexion de -40° à +60°) ;
// - sinon (pompe, planche, fente arrière) : sur la pointe, talon levé ;
//   la cheville remonte un peu le long du tibia (t) pour que les orteils
//   se posent sans entrer dans le tapis.
// face : 1 (visage du côté x croissants debout), -1 (sur le dos). prone :
// bonhomme couché sur le ventre.
export function footPose(knee, ankle, face = 1, prone = false) {
  const len = dist(knee, ankle) || 1;
  const s = [(ankle[0] - knee[0]) / len, (ankle[1] - knee[1]) / len];
  const phi0 = deg(Math.atan2(-s[0] * face, s[1] * face));
  const plantar = Math.sign(norm(deg(Math.atan2(s[1], s[0])) - phi0)) || 1;
  const at = (d) => phi0 + plantar * d; // d > 0 : pointe tendue ; d < 0 : orteils relevés
  const root = (t) => [ankle[0] - s[0] * t, ankle[1] - s[1] * t];
  const fits = (phi, t = 0) => shoeLow(root(t), phi, face) <= FLOOR_LIMIT;
  const near = ankle[1] >= VIEW.floor - 3;
  const kneeDown = knee[1] >= VIEW.floor - 2 && Math.abs(s[1]) < 0.45;
  const first = (list) => list.find((d) => fits(at(d)));
  // low : plus bas point de la chaussure (vérifié par les tests)
  const done = (phi, t, mode) => ({ phi, t, mode, low: shoeLow(root(t), phi, face) });
  if (prone || (near && kneeDown && !(face < 0 && fits(at(10))))) {
    const d = first([90, 80, 100, 70, 110, 60]);
    if (d !== undefined) return done(at(d), 0, 'tendu');
  }
  if (!near) return done(at(first([12, 25, 40, 60, 80]) ?? 12), 0, 'air');
  const flat = Math.cos(rad(phi0)) >= 0 ? 0 : 180;
  const bend = norm(flat - phi0) * plantar;
  if (bend >= -40 && bend <= 60 && fits(flat)) return done(flat, 0, 'plat');
  for (const [t, d] of TOE) if (fits(at(-d), t)) return done(at(-d), t, 'pointe');
  const best = TOE.reduce((a, b) => (shoeLow(root(b[0]), at(-b[1]), face) < shoeLow(root(a[0]), at(-a[1]), face) ? b : a));
  return done(at(-best[1]), best[0], 'pointe');
}

// Un pied qui change d'appui (tendu → posé) tournerait d'un coup : la
// rotation est répartie sur les images voisines, sans entrer dans le tapis
// (la cheville remonte un peu le long du tibia si besoin).
export function smoothFeet(list, knees, ankles, face = 1) {
  const out = list.map((f) => ({ ...f }));
  const fit = (k, phi) => {
    const len = dist(knees[k], ankles[k]) || 1;
    const s = [(ankles[k][0] - knees[k][0]) / len, (ankles[k][1] - knees[k][1]) / len];
    for (let t = out[k].t; t <= 3; t += 0.25) if (shoeLow([ankles[k][0] - s[0] * t, ankles[k][1] - s[1] * t], phi, face) <= FLOOR_LIMIT) return t;
    return null;
  };
  for (let pass = 0; pass < 4; pass++) {
    for (let i = 1; i < out.length; i++) {
      const d = norm(out[i].phi - out[i - 1].phi);
      if (Math.abs(d) <= 60) continue;
      for (const [k, phi] of [[i - 1, out[i - 1].phi + d / 3], [i, out[i].phi - d / 3]]) {
        const t = fit(k, phi);
        if (t !== null) out[k] = { ...out[k], phi, t, mode: `${out[k].mode}~` };
      }
    }
  }
  return out;
}

// Angle de la main : dans l'axe de l'avant-bras (poing) ; près du tapis,
// elle se pose à plat petit à petit, doigts vers l'avant du bonhomme si
// l'avant-bras est vertical, sinon dans le sens de l'avant-bras.
export function handAngle(elbow, hand, ahead = 1, grip = false) {
  const inline = angleOf(elbow, hand);
  const len = dist(elbow, hand) || 1;
  const [fx, fy] = [(hand[0] - elbow[0]) / len, (hand[1] - elbow[1]) / len];
  const w = grip || fy < 0.25 ? 0 : clamp((hand[1] - (VIEW.floor - 4)) / 2.5, 0, 1);
  if (!w) return inline;
  const flat = Math.abs(fx) < 0.55 ? (ahead > 0 ? 0 : 180) : fx > 0 ? 0 : 180;
  return inline + norm(flat - inline) * w;
}

// ——— Aides : position d'arrivée (fantôme) et flèche du trajet ———
// Ce qu'il faut montrer, par étape du mouvement. Automatique : une étape par
// aller (pompe : descendre), ou une par moitié de boucle quand le geste
// revient à la position de départ au milieu (fentes alternées : une jambe,
// puis l'autre). Champ optionnel d'une pose : `explain` = false (rien), ou
// une liste d'étapes { from, to, joint?, ghost? } (trajet de `joint` de la
// pose `from` à la pose `to`) ou { at, joint, toward } (flèche de `joint`
// vers `toward` sur la pose `at` : coude vers genou au crunch vélo).
export const MOVE_MIN = 5; // en dessous (tenue, respiration) : pas d'aide
const ARROW_MIN = 6; // longueur visible minimale d'une flèche
const WEIGHT = { hip: 0.5, shoulder: 0.75, head: 0.45, elbowN: 0.85, handN: 1, elbowF: 0.75, handF: 0.9, kneeN: 0.9, footN: 1, kneeF: 0.8, footF: 0.9 };
const OFFSET = { head: 7.5, shoulder: 5.8, hip: 5.8, elbowN: 3.8, elbowF: 3.8, kneeN: 4.4, kneeF: 4.4, handN: 3.4, handF: 3.4, footN: 3.8, footF: 3.8 };
const maxDist = (a, b) => Math.max(...JOINTS.map((k) => dist(a[k], b[k])));
const pathLength = (pts) => pts.slice(1).reduce((s, p, i) => s + dist(p, pts[i]), 0);

export function explain(fig) {
  const count = fig.frames.length;
  if (fig.explain === false || count < 2) return [];
  const n = order(fig).length - 1; // nombre d'étapes de la boucle animée
  const cycle = fig.loop === 'cycle';
  const J = fig.frames.map(solve);
  const keys = timeline(fig);
  let raw;
  if (Array.isArray(fig.explain)) raw = fig.explain.map((st) => ({ ...st }));
  else {
    const starts = cycle ? J.map((_, i) => i).filter((i) => i === 0 || maxDist(J[i], J[0]) < 1) : [0];
    raw = [];
    starts.forEach((s, k) => {
      const end = cycle ? starts[k + 1] ?? count : count;
      const cand = [];
      for (let i = s + 1; i < end; i++) cand.push(i);
      const far = Math.max(0, ...cand.map((i) => maxDist(J[i], J[s])));
      if (far >= MOVE_MIN) raw.push({ from: s, to: cand.find((i) => maxDist(J[i], J[s]) >= 0.85 * far) });
    });
  }
  const steps = raw.map((st) => {
    if (st.at !== undefined) return { ...st, posAt: st.at, ghost: false };
    const posFrom = st.from;
    const posTo = st.to > st.from ? st.to : cycle && st.to === 0 ? n : NaN;
    if (!(posTo > posFrom)) throw new Error(`explain : étape impossible (${st.from} → ${st.to})`);
    const pts = (k) => keys.slice(posFrom * (SUB + 1), posTo * (SUB + 1) + 1).map(({ joints }) => joints[k]);
    const score = (k) => WEIGHT[k] * (0.75 * dist(J[st.from][k], J[st.to][k]) + 0.25 * pathLength(pts(k)));
    const joint = st.joint ?? JOINTS.reduce((best, k) => (score(k) > score(best) ? k : best), 'hip');
    const ghost = !fig.front && st.ghost !== false && maxDist(J[st.from], J[st.to]) >= MOVE_MIN;
    return { ...st, posFrom, posTo, joint, ghost };
  });
  // Fenêtre de temps de chaque étape (part du cycle, 0 → 1) : de son début au
  // début de la suivante (selon le rythme du geste).
  const { seg } = beats(fig);
  const start = (st) => (st.posAt !== undefined ? (seg[st.posAt].t0 - 0.5 / steps.length + 1) % 1 : seg[st.posFrom].t0);
  const sorted = [...steps].sort((a, b) => start(a) - start(b));
  return steps.map((st) => {
    const i = sorted.indexOf(st);
    return { ...st, window: [r2(start(st)), r2(start(sorted[(i + 1) % sorted.length]))] };
  });
}

// Flèche lisse le long d'un trajet, décalée de `off` du côté opposé au centre
// du corps (jamais sous le tapis), écartée des têtes (`avoid`), raccourcie aux
// deux bouts. Retourne { d, head, pts } (chemin, pointe) ou null si trop court.
export function arrowPath(points, center, { off = 3.4, avoid = [], trim = 1.4 } = {}) {
  let pts = points.filter((p, i) => i === 0 || dist(p, points[i - 1]) > 0.2);
  if (pts.length < 2 || dist(pts[0], pts.at(-1)) < MOVE_MIN * 0.8) return null;
  for (let pass = 0; pass < 3; pass++) {
    pts = pts.map((p, i) => (i === 0 || i === pts.length - 1 ? p : [(pts[i - 1][0] + 2 * p[0] + pts[i + 1][0]) / 4, (pts[i - 1][1] + 2 * p[1] + pts[i + 1][1]) / 4]));
  }
  const tan = (list, i) => {
    const [a, b] = [list[Math.max(0, i - 1)], list[Math.min(list.length - 1, i + 1)]];
    const l = dist(a, b) || 1;
    return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
  };
  const shift = (side) => pts.map((p, i) => {
    const t = tan(pts, i);
    return [p[0] - t[1] * off * side, p[1] + t[0] * off * side];
  });
  const m = Math.floor(pts.length / 2);
  const tm = tan(pts, m);
  const away = -tm[1] * (pts[m][0] - center[0]) + tm[0] * (pts[m][1] - center[1]) >= 0 ? 1 : -1;
  // jamais sur la tête : les bouts qui la touchent sont coupés, le milieu est
  // écarté du cercle (puis lissé à nouveau)
  const r = HEAD + 2;
  const inside = (p) => avoid.some((h) => dist(p, h) < r);
  const push = (list) => list.map((p) => avoid.reduce((q, h) => {
    const d = dist(q, h);
    return d >= r ? q : d < 0.01 ? [h[0], h[1] - r] : [h[0] + ((q[0] - h[0]) * r) / d, h[1] + ((q[1] - h[1]) * r) / d];
  }, p));
  const soften = (list) => list.map((p, i) => (i === 0 || i === list.length - 1 ? p : [(list[i - 1][0] + 2 * p[0] + list[i + 1][0]) / 4, (list[i - 1][1] + 2 * p[1] + list[i + 1][1]) / 4]));
  const clear = (list) => {
    let out = [...list];
    while (out.length > 2 && inside(out[0])) out.shift();
    while (out.length > 2 && inside(out.at(-1))) out.pop();
    for (let k = 0; k < 3 && out.some(inside); k++) out = soften(push(out));
    return push(out);
  };
  // Côté du décalage : à l'opposé du centre du corps, sauf s'il passe sous
  // le tapis ou si la tête y laisse moins de place que de l'autre côté.
  const low = (list) => Math.max(...list.map((p) => p[1]));
  const [A, B] = [clear(shift(away)), clear(shift(-away))];
  const score = (list) => pathLength(list) - Math.max(0, low(list) - VIEW.floor) * 4;
  pts = score(A) >= score(B) * 0.8 ? A : B;
  pts = pts.map(([x, y]) => [x, Math.min(y, VIEW.floor + 1)]);
  const L = pathLength(pts);
  if (L < ARROW_MIN + 2 * trim) return null; // une flèche minuscule n'aide pas
  const headLen = clamp(L * 0.3, 2.4, 3.6);
  const cut = (list, len) => {
    const out = [...list];
    let left = len;
    while (out.length > 1 && left > 0) {
      const d = dist(out[0], out[1]);
      if (d > left) {
        out[0] = [out[0][0] + ((out[1][0] - out[0][0]) * left) / d, out[0][1] + ((out[1][1] - out[0][1]) * left) / d];
        left = 0;
      } else {
        out.shift();
        left -= d;
      }
    }
    return out;
  };
  const full = pts;
  let base;
  let end;
  for (let extra = 0; extra <= 6; extra += 1) {
    pts = cut(cut(full, trim).reverse(), trim + extra + headLen * 0.85).reverse();
    if (pts.length < 2) return null;
    const tip = cut([...full].reverse(), trim + extra)[0];
    base = pts.at(-1);
    const l = dist(base, tip) || 1;
    end = [base[0] + ((tip[0] - base[0]) * headLen) / l, base[1] + ((tip[1] - base[1]) * headLen) / l];
    if (!inside(end)) break;
  }
  const [ux, uy] = [(end[0] - base[0]) / headLen, (end[1] - base[1]) / headLen];
  const w = headLen * 0.62;
  const head = `M${r2(end[0])} ${r2(end[1])}L${r2(base[0] - uy * w)} ${r2(base[1] + ux * w)}L${r2(base[0] + uy * w)} ${r2(base[1] - ux * w)}Z`;
  // trajet lissé ouvert (Catmull-Rom → Bézier)
  let d = `M${r2(pts[0][0])} ${r2(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [p0, p1, p2, p3] = [pts[Math.max(0, i - 1)], pts[i], pts[i + 1], pts[Math.min(pts.length - 1, i + 2)]];
    d += `C${r2(p1[0] + (p2[0] - p0[0]) / 6)} ${r2(p1[1] + (p2[1] - p0[1]) / 6)} ${r2(p2[0] - (p3[0] - p1[0]) / 6)} ${r2(p2[1] - (p3[1] - p1[1]) / 6)} ${r2(p2[0])} ${r2(p2[1])}`;
  }
  return { d, head, pts: [...pts, end] };
}

// ——— Barre de traction ———
// Les poings la serrent : son axe passe par le milieu du poing proche (un peu
// au-delà du poignet, dans l'axe de l'avant-bras). Vue de biais, elle monte un
// peu vers le fond (BAR_DIR), jusqu'au poing éloigné, et dépasse de BAR_OUT de
// chaque côté. Le poing du fond se place donc un peu en haut à gauche du proche.
export const BAR = 2.6; // épaisseur de la barre
export const BAR_DIR = [-0.94, -0.34];
const BAR_OUT = 5;
const fist = (j, side) => {
  const [e, h] = [j[`elbow${side}`], j[`hand${side}`]];
  const l = dist(e, h) || 1;
  return [h[0] + ((h[0] - e[0]) * 1.4) / l, h[1] + ((h[1] - e[1]) * 1.4) / l];
};
export function barAt(j) {
  const [n, f] = [fist(j, 'N'), fist(j, 'F')];
  const far = Math.max(0, (f[0] - n[0]) * BAR_DIR[0] + (f[1] - n[1]) * BAR_DIR[1]) + BAR_OUT;
  return [[round(n[0] - BAR_DIR[0] * BAR_OUT), round(n[1] - BAR_DIR[1] * BAR_OUT)], [round(n[0] + BAR_DIR[0] * far), round(n[1] + BAR_DIR[1] * far)]];
}

// ——— Squelette de dessin, image par image ———
// Pour chaque image clé : positions (vue de face : épaules et hanches
// écartées du milieu), angles des os, du pied et de la main.
function rig(fig, keys) {
  const face = fig.face ?? 1;
  const j0 = solve(fig.frames[0]);
  const wide = fig.front ? Math.abs((j0.shoulder[1] - j0.hip[1]) / BONES.torso) : 0; // 1 debout, 0 couché
  const prone = !fig.front && face > 0 && Math.abs(j0.shoulder[1] - j0.hip[1]) < 9 && j0.hip[1] > VIEW.floor - 8;
  // de face : chaque pied pointe vers l'extérieur (côté où il est par rapport aux hanches)
  const out = { N: Math.sign(j0.footN[0] - j0.hip[0]) || 1, F: Math.sign(j0.footF[0] - j0.hip[0]) || -1 };
  const view = (j) => {
    const d = { ...j };
    const [ux, uy] = [(j.shoulder[0] - j.hip[0]) / BONES.torso, (j.shoulder[1] - j.hip[1]) / BONES.torso];
    for (const side of ['N', 'F']) {
      const sg = side === 'N' ? wide : -wide;
      const arm = [-uy * SHOULDER_OUT * sg, ux * SHOULDER_OUT * sg];
      const leg = [-uy * HIP_OUT * sg, 0];
      d[`shoulder${side}`] = [j.shoulder[0] + arm[0], j.shoulder[1] + arm[1]];
      d[`hip${side}`] = [j.hip[0] + leg[0], j.hip[1] + leg[1]];
      for (const k of [`elbow${side}`, `hand${side}`]) d[k] = [j[k][0] + arm[0], j[k][1] + arm[1]];
      for (const k of [`knee${side}`, `foot${side}`]) d[k] = [j[k][0] + leg[0], j[k][1] + leg[1]];
    }
    return d;
  };
  const frames = keys.map((k) => view(k.joints));
  const limb = (root, mid, end, tip) => {
    const a1 = unwrap(frames.map((j) => angleOf(j[root], j[mid])));
    const a2 = frames.map((j) => angleOf(j[mid], j[end]));
    const r2s = unwrap(a2.map((a, i) => norm(a - a1[i])));
    const r3s = unwrap(tip.map((p, i) => norm(p.phi - a2[i])));
    return { root: frames.map((j) => j[root]), a1, r2: r2s, r3: r3s, t: tip.map((p) => p.t ?? 0) };
  };
  const grip = !!(fig.parallettes || fig.wheel || fig.bar);
  const hands = (side) => frames.map((j) => ({ phi: fig.front ? angleOf(j[`elbow${side}`], j[`hand${side}`]) : handAngle(j[`elbow${side}`], j[`hand${side}`], Math.sign(j.shoulder[0] - j.hip[0]) || 1, grip) }));
  const feet = (side) => (fig.front
    ? frames.map(() => ({ phi: out[side] > 0 ? 0 : 180, t: 0 }))
    : smoothFeet(frames.map((j) => footPose(j[`knee${side}`], j[`foot${side}`], face, prone)), frames.map((j) => j[`knee${side}`]), frames.map((j) => j[`foot${side}`]), face));
  return {
    face, wide, frames, out,
    hip: frames.map((j) => j.hip),
    torso: unwrap(frames.map((j) => angleOf(j.hip, j.shoulder))),
    shoulder: frames.map((j) => j.shoulder),
    neck: unwrap(frames.map((j) => angleOf(j.shoulder, j.head))),
    // tête tournée à part (tilt) : sinon elle suit le cou
    tilt: frames.some((j) => j.tilt !== undefined) ? unwrap(frames.map((j) => j.tilt ?? angleOf(j.shoulder, j.head))) : null,
    armN: limb('shoulderN', 'elbowN', 'handN', hands('N')),
    armF: limb('shoulderF', 'elbowF', 'handF', hands('F')),
    legN: limb('hipN', 'kneeN', 'footN', feet('N')),
    legF: limb('hipF', 'kneeF', 'footF', feet('F')),
  };
}

// Œil : de profil, un œil du côté du visage ; de face, deux yeux.
function eyeAt(j, side, face, front) {
  const [dx, dy] = j.tilt !== undefined ? [Math.cos(rad(j.tilt)), Math.sin(rad(j.tilt))] : [j.head[0] - j.shoulder[0], j.head[1] - j.shoulder[1]];
  const len = Math.hypot(dx, dy) || 1;
  const [ux, uy] = [dx / len, dy / len];
  const [nx, ny] = [-uy * face, ux * face];
  return front
    ? [round(j.head[0] + 0.8 * ux + side * 1.7 * nx), round(j.head[1] + 0.8 * uy + side * 1.7 * ny)]
    : [round(j.head[0] + 0.9 * ux + 2.6 * nx), round(j.head[1] + 0.9 * uy + 2.6 * ny)];
}

// ——— SVG ———
// figureSVG(fig, options) :
// - animate=false : image fixe (mouvement réduit) : la pose de départ, avec
//   la position d'arrivée (fantôme) et la flèche du trajet ;
// - fit=true : cadre serré autour du mouvement au lieu du cadre 120 × 80 ;
// - focus : parties à allumer (voir focusFor) ; mirror : retourné ;
// - help=false : sans fantôme ni flèche ; pose=i : image fixe de la pose i.
// Le résultat est gardé en mémoire par bonhomme et options ; seuls les
// identifiants internes (dégradés, formes) changent à chaque appel.
const CACHE = new WeakMap();
let uid = 0;
export function figureSVG(fig, options = {}) {
  const key = JSON.stringify(options);
  let memo = CACHE.get(fig);
  if (!memo) CACHE.set(fig, (memo = new Map()));
  if (!memo.has(key)) memo.set(key, draw(fig, options));
  const id = `fg${(++uid).toString(36)}`;
  return memo.get(key).replaceAll('§', id);
}

function draw(fig, { animate = true, mirror = false, fit = false, focus = [], help = true, pose } = {}) {
  const keys = timeline(fig);
  const R0 = rig(fig, keys);
  const { face, wide } = R0;
  const front = !!fig.front;
  // Suspendu à la barre, sans appui au sol : ni tapis ni ombre, et le cadre
  // s'arrête sous le corps.
  const air = !!fig.bar && keys.every(({ joints }) => JOINTS.every((k) => joints[k][1] < VIEW.floor - 3));
  const steps = help && pose === undefined ? explain(fig) : [];
  const still = !animate || fig.frames.length === 1 || pose !== undefined;
  const shown = pose !== undefined ? pose : steps[0]?.posFrom ?? steps[0]?.posAt ?? 0;
  const sel = still ? [shown * (SUB + 1)] : keys.map((_, i) => i);
  const times = keys.map((k) => Math.round(k.t * 10000) / 10000).join(';');
  const timing = `dur="${beats(fig).dur}s" repeatCount="indefinite"`;
  const moving = (v) => v.length > 1 && v.some((x) => x !== v[0]);
  const anim = (attr, values) => (moving(values) ? `<animate attributeName="${attr}" ${timing} keyTimes="${times}" values="${values.join(';')}"/>` : '');
  const turn = (type, values) => (moving(values) ? `<animateTransform attributeName="transform" type="${type}" ${timing} keyTimes="${times}" values="${values.join(';')}"/>` : '');
  const xy = (p) => `${round(p[0])} ${round(p[1])}`;
  // Groupe déplacé puis tourné (valeurs par image ; fixe s'il ne bouge pas).
  const node = (at, ang, inner) => {
    const [p, a] = [at.map(xy), ang.map(round)];
    if (!moving(p) && !moving(a)) return `<g transform="translate(${p[0]}) rotate(${a[0]})">${inner}</g>`;
    const r = moving(a) ? `<g transform="rotate(${a[0]})">${turn('rotate', a)}${inner}</g>` : `<g transform="rotate(${a[0]})">${inner}</g>`;
    return `<g transform="translate(${p[0]})">${turn('translate', p)}${r}</g>`;
  };

  // Formes, définies une fois (dans <defs>) et reprises par <use>.
  // Membres et pied : avant en y < 0 si face = 1 ; buste, cou et tête : l'inverse.
  const limbFlip = face < 0;
  const bodyFlip = face > 0 && !front;
  const forms = {};
  const form = (name, pts) => {
    forms[name] ??= `<path id="§-${name}" d="${smooth(pts)}"/>`;
    return `#§-${name}`;
  };
  const shape = (name) => {
    const body = /^(torso|abs|chest|glutes|neck)/.test(name);
    const src = front && FRONT[name] ? mix(SHAPES[name], FRONT[name], wide) : SHAPES[name];
    const pts = contour(src);
    return form(name, (body ? bodyFlip : limbFlip) ? flipY(pts) : pts);
  };
  const use = (href, cls, fill) => `<use href="${href}"${cls ? ` class="${cls}"` : ''}${fill ? ` fill="${fill}"` : ''}/>`;

  // Peinture : dégradés (relief) côté proche / éloigné, muscle allumé.
  const hot = (name) => focus.includes(name);
  const tone = (far, on, ghost) => (ghost ? '' : `url(#§-${on ? 'h' : 't'}${far && !front ? 'f' : 'n'})`);
  const skin = (ghost) => (ghost ? '' : 'fig-skin');

  // Un membre : os du haut, rotule, os du bas, main ou pied — en chaîne.
  const limb = (key, sel, ghost) => {
    const side = key.at(-1);
    const far = side === 'F' && !front;
    const arm = key.startsWith('arm');
    const L = R0[key];
    const [up, low, L1, L2] = arm ? ['upperArm', 'forearm', BONES.upperArm, BONES.forearm] : ['thigh', 'shin', BONES.thigh, BONES.shin];
    const muscle = (name, part) => (!ghost && hot(`${part}${side}`) ? use(shape(`${name}M`), 'fig-muscle fig-focus', tone(far, true)) : '');
    const t = sel.map((i) => L.t[i]);
    const upper = use(shape(up), skin(ghost), tone(far, false, ghost)) + muscle(up, up);
    // rotule : sous les deux os (elle ne fait que combler le pli du coude ou du genou)
    const knob = `<circle class="${ghost ? '' : 'fig-joint'}" cx="${L1}" r="${arm ? 1.95 : 2.35}"${ghost ? '' : ` fill="${tone(far, false)}"`}/>`;
    let lower = use(shape(low), skin(ghost), tone(far, false, ghost)) + muscle(low, low);
    // Pied sur la pointe : la cheville remonte un peu (le tibia raccourcit d'autant).
    if (!arm && t.some((v) => v > 0)) {
      const k = t.map((v) => round((L2 - v) / L2 * 1000) / 1000);
      lower = moving(k) ? `<g transform="scale(${k[0]} 1)">${turn('scale', k.map((v) => `${v} 1`))}${lower}</g>` : `<g transform="scale(${k[0]} 1)">${lower}</g>`;
    }
    let tip;
    if (arm) tip = use(form('hand', contour(SHAPES.hand)), ghost ? '' : 'fig-hand', tone(far, false, ghost));
    else if (front) tip = use(R0.out[side] > 0 ? form('shoeR', SHOE_FRONT) : form('shoeL', flipY(SHOE_FRONT)), ghost ? '' : 'fig-shoe');
    else {
      const sh = limbFlip ? flipY(SHOE) : SHOE;
      const so = limbFlip ? flipY(SOLE) : SOLE;
      tip = ghost ? use(form('shoe', sh)) : `${use(form('shoe', sh), 'fig-shoe')}${use(form('sole', so), 'fig-sole')}`;
    }
    const end = node(t.map((v) => [L2 - v, 0]), pick2(L.r3, sel), tip);
    const mid = node(sel.map(() => [L1, 0]), pick2(L.r2, sel), `${lower}${end}`);
    return node(pick2(L.root, sel), pick2(L.a1, sel), `${knob}${upper}${mid}`);
  };
  const pick2 = (list, s) => s.map((i) => list[i]);

  const trunk = (sel, ghost) => {
    const regions = ghost ? '' : [
      hot('waist') ? use(shape('abs'), 'fig-muscle fig-focus', tone(false, true)) : '',
      hot('chest') ? use(shape('chest'), 'fig-muscle fig-focus', tone(false, true)) : '',
      !front && (hot('thighN') || hot('thighF')) ? use(shape('glutes'), 'fig-muscle fig-focus', tone(false, true)) : '',
    ].join('');
    const torso = node(pick2(R0.hip, sel), pick2(R0.torso, sel), use(shape('torso'), skin(ghost), tone(false, false, ghost)) + regions);
    const neckM = !ghost && hot('neck') ? use(shape('neckM'), 'fig-muscle fig-focus', tone(false, true)) : '';
    const neck = node(pick2(R0.shoulder, sel), pick2(R0.neck, sel), use(shape('neck'), skin(ghost), tone(false, false, ghost)) + neckM);
    return torso + neck;
  };
  // line : la forme seule (crâne et cheveux), pour le contour du style lisse
  const head = (sel, ghost, line = false) => {
    const h = HEADS[front ? 'front' : 'side'];
    const flip = bodyFlip ? flipY : (p) => p;
    const hair = line ? use(form('hair', flip(h.hair))) : ghost ? '' : use(form('hair', flip(h.hair)), 'fig-hair');
    const inner = `${use(form('head', flip(h.head)), ghost ? '' : 'fig-head', ghost ? '' : `url(#§-sk)`)}${hair}`;
    if (R0.tilt) return node(sel.map((i) => R0.frames[i].head), pick2(R0.tilt, sel), inner);
    return node(pick2(R0.shoulder, sel), pick2(R0.neck, sel), `<g transform="translate(${BONES.neck} 0)">${inner}</g>`);
  };
  const eyes = (sel) => (front ? [1, -1] : [1]).map((s) => {
    const pts = sel.map((i) => eyeAt(R0.frames[i], s, face, front));
    return `<circle class="fig-eye" cx="${pts[0][0]}" cy="${pts[0][1]}" r="0.85">${anim('cx', pts.map((p) => p[0]))}${anim('cy', pts.map((p) => p[1]))}</circle>`;
  }).join('');

  // Élastique tendu entre deux articulations (ex. des pieds aux mains).
  const band = (fig.band ?? []).map(([a, b]) => {
    const d = (j) => `M${xy(j[a])}L${xy(j[b])}`;
    const list = sel.map((i) => d(R0.frames[i]));
    return `<path class="fig-band" d="${list[0]}">${anim('d', list)}</path>`;
  }).join('');
  // Parallettes : un petit tréteau sous chaque main (là où sont les mains au départ).
  const parAt = (k) => {
    if (!fig.parallettes) return '';
    const [x, y] = R0.frames[0][k];
    const top = round(y + 1.2);
    const h = round(Math.max(0.5, VIEW.floor + 1.5 - top));
    return `<g class="fig-par"><rect x="${round(x - 3.2)}" y="${round(top + 1)}" width="1.1" height="${h}" rx="0.4"/><rect x="${round(x + 2.1)}" y="${round(top + 1)}" width="1.1" height="${h}" rx="0.4"/><rect x="${round(x - 4.2)}" y="${round(top + h)}" width="8.4" height="1.2" rx="0.6"/><rect x="${round(x - 3.6)}" y="${top}" width="7.2" height="1.7" rx="0.85"/></g>`;
  };
  // Barre de traction, vue un peu de biais : elle passe dans les deux poings
  // (là où ils sont au départ) et dépasse de chaque côté.
  const barEnds = fig.bar ? barAt(R0.frames[0]) : null;
  const bar = barEnds ? (() => {
    const [p, q] = barEnds;
    const len = dist(p, q);
    return `<g class="fig-bar" transform="translate(${xy(p)}) rotate(${round(angleOf(p, q))})"><rect x="-${BAR / 2}" y="-${BAR / 2}" width="${round(len + BAR)}" height="${BAR}" rx="${BAR / 2}"/></g>`;
  })() : '';
  // Repère fixe (ex. la ligne que la nuque vient toucher aux chin tucks).
  const guide = fig.guide ? `<path class="fig-guide" d="M${fig.guide[0]} ${fig.guide[1]}L${fig.guide[2]} ${fig.guide[3]}"/>` : '';
  // Roue abdominale : tenue dans les mains (centre de la roue = mains).
  const wheel = (() => {
    if (!fig.wheel) return '';
    const pts = sel.map((i) => R0.frames[i].handN);
    const a = (attr, k) => anim(attr, pts.map((p) => round(p[k])));
    return `<g class="fig-wheel"><circle cx="${round(pts[0][0])}" cy="${round(pts[0][1])}" r="${WHEEL}">${a('cx', 0)}${a('cy', 1)}</circle><circle class="fig-hub" cx="${round(pts[0][0])}" cy="${round(pts[0][1])}" r="1.1">${a('cx', 0)}${a('cy', 1)}</circle></g>`;
  })();
  // Ombre au sol, sous tout le corps.
  const spread = (j) => {
    const xs = JOINTS.map((k) => j[k][0]);
    return [round((Math.min(...xs) + Math.max(...xs)) / 2), round((Math.max(...xs) - Math.min(...xs)) / 2 + 4)];
  };
  const sh = sel.map((i) => spread(R0.frames[i]));
  const shadow = `<ellipse class="fig-shadow" cx="${sh[0][0]}" cy="${VIEW.floor + 2.6}" rx="${sh[0][1]}" ry="2.2" fill="url(#§-sh)">${anim('cx', sh.map((s) => s[0]))}${anim('rx', sh.map((s) => s[1]))}</ellipse>`;

  // Le corps entier, dans l'ordre de dessin : de profil, le côté éloigné
  // (plus sombre) d'abord, l'élastique devant les jambes, la tête toujours
  // par-dessus ; de face, les poings devant le visage et l'élastique devant les bras.
  // Style lisse : chaque membre (bras, main ; jambe, pied), le buste avec le
  // cou, et la tête ont un seul contour, tracé d'un bloc sous leurs pièces
  // pleines (calque .fig-o, les formes sans couleur) : pas de trait au coude,
  // au genou ni à la base du cou ; un bras devant le buste garde le sien.
  const lined = (outline, fill) => `<g class="fig-o">${outline}</g>${fill}`;
  const body = (sel, ghost = false) => {
    const t = ghost ? trunk(sel, true) : lined(trunk(sel, true), trunk(sel, false));
    const L = (k) => (ghost ? limb(k, sel, true) : lined(limb(k, sel, true), limb(k, sel, false)));
    const H = ghost ? head(sel, true) : lined(head(sel, true, true), head(sel, false));
    const extra = (s) => (ghost ? '' : s);
    if (front) return `${t}${L('legF')}${L('legN')}${H}${L('armF')}${L('armN')}${extra(band)}`;
    const far = `${L('armF')}${L('legF')}`;
    const near = fig.bar ? `${H}${L('armN')}` : `${L('armN')}${H}`;
    return `${ghost ? far : `<g class="fig-far">${far}</g>`}${t}${L('legN')}${extra(band + parAt('handN') + wheel + bar)}${near}`;
  };

  // Aides : fantôme (contour de la position d'arrivée) et flèche du trajet,
  // chacun visible pendant son étape (une seule étape sur l'image fixe).
  const ghosts = [];
  let ghostLayer = '';
  let moveLayer = '';
  const shownSteps = still ? steps.slice(0, 1) : steps;
  shownSteps.forEach((st, i) => {
    const [a, b0] = st.window;
    const b = b0 === 0 ? 1 : b0;
    let vis = '';
    if (!still && shownSteps.length > 1) {
      // visible de a à b (part du cycle), ou de a à la fin puis du début à b
      const [kt, v] = a < b ? (a === 0 ? [`0;${b}`, '1;0'] : b === 1 ? [`0;${a}`, '0;1'] : [`0;${a};${b}`, '0;1;0']) : [`0;${b};${a}`, '1;0;1'];
      vis = `<animate attributeName="opacity" ${timing} calcMode="discrete" keyTimes="${kt}" values="${v}"/>`;
    }
    if (st.ghost) {
      ghosts.push(`<g id="§-g${i}">${body([st.posTo * (SUB + 1)], true)}</g>`);
      ghostLayer += `<g class="fig-ghost">${vis}<use href="#§-g${i}" class="fig-ghost-edge"/><use href="#§-g${i}" class="fig-ghost-fill"/></g>`;
    }
    let arrow = null;
    if (st.posAt !== undefined) {
      // flèche d'une articulation vers une autre, en arc (coude vers genou)
      const j = R0.frames[st.posAt * (SUB + 1)];
      const [p, q] = [j[st.joint], j[st.toward]];
      const l = dist(p, q) || 1;
      let nrm = [-(q[1] - p[1]) / l, (q[0] - p[0]) / l];
      if (nrm[1] > 0) nrm = [-nrm[0], -nrm[1]]; // l'arc bombe vers le haut
      const mid = [(p[0] + q[0]) / 2 + nrm[0] * l * 0.22, (p[1] + q[1]) / 2 + nrm[1] * l * 0.22];
      const line = [];
      for (let k = 0; k <= 12; k++) {
        const u = k / 12;
        line.push([(1 - u) ** 2 * p[0] + 2 * u * (1 - u) * mid[0] + u * u * q[0], (1 - u) ** 2 * p[1] + 2 * u * (1 - u) * mid[1] + u * u * q[1]]);
      }
      arrow = arrowPath(line, [0, 0], { off: 0, trim: 2.6 });
    } else {
      const ks = R0.frames.slice(st.posFrom * (SUB + 1), st.posTo * (SUB + 1) + 1);
      const j0 = ks[0];
      const center = [(j0.hip[0] + j0.shoulder[0]) / 2, (j0.hip[1] + j0.shoulder[1]) / 2];
      arrow = arrowPath(ks.map((j) => j[st.joint]), center, { off: OFFSET[st.joint], avoid: ks.filter((_, k) => k % 3 === 0 || k === ks.length - 1).map((j) => j.head) });
    }
    if (arrow) moveLayer += `<g class="fig-move">${vis}<path class="fig-move-halo" d="${arrow.d}"/><path class="fig-move-line" d="${arrow.d}"/><path class="fig-move-head" d="${arrow.head}"/></g>`;
  });

  const pars = front ? parAt('handF') + parAt('handN') : parAt('handF');
  const scene = `${air ? '' : shadow}${ghostLayer}${guide}${pars}${body(sel)}${eyes(sel)}${moveLayer}`;

  // Dégradés : en travers de chaque pièce (relief), crâne en boule, ombre douce.
  const lin = (name, cls) => `<linearGradient id="§-${name}" class="${cls}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="fig-s1"/><stop offset="0.32" class="fig-s2"/><stop offset="0.68" class="fig-s3"/><stop offset="1" class="fig-s4"/></linearGradient>`;
  const defs = `<defs>${lin('tn', 'fig-tone')}${focus.length ? lin('hn', 'fig-tone fig-hot') : ''}${front ? '' : `${lin('tf', 'fig-tone fig-back')}${focus.length ? lin('hf', 'fig-tone fig-hot fig-back') : ''}`}<radialGradient id="§-sk" class="fig-tone" cx="0.42" cy="0.38" r="0.62"><stop offset="0" class="fig-s2"/><stop offset="0.55" class="fig-s3"/><stop offset="1" class="fig-s4"/></radialGradient><radialGradient id="§-sh" class="fig-shade"><stop offset="0" class="fig-s1"/><stop offset="1" class="fig-s2"/></radialGradient>${Object.values(forms).join('')}${ghosts.join('')}</defs>`;
  let [bx, by, bw, bh] = fit ? frameBox(keys, fig.wheel, 5, !air) : [0, 0, VIEW.w, VIEW.h];
  if (fit && barEnds) {
    const xs = barEnds.map((p) => p[0]);
    const top = Math.min(by, ...barEnds.map((p) => round(p[1] - BAR)));
    const [x0, x1] = [Math.min(bx, round(Math.min(...xs) - BAR)), Math.max(bx + bw, round(Math.max(...xs) + BAR))];
    [bx, by, bw, bh] = [x0, top, round(x1 - x0), round(by + bh - top)];
  }
  // En miroir, le cadre serré est retourné lui aussi autour de l'axe x = 60.
  const vx = fit && mirror ? round(VIEW.w - bx - bw) : bx;
  const mat = air ? '' : `<rect class="fig-mat" x="${vx + 2}" y="${VIEW.floor + 2.5}" width="${bw - 4}" height="3" rx="1.5"/>`;
  return `<svg class="fig" viewBox="${vx} ${by} ${bw} ${bh}" aria-hidden="true">${defs}${mat}${mirror ? `<g transform="translate(${VIEW.w} 0) scale(-1 1)">${scene}</g>` : scene}</svg>`;
}

// Bonhomme d'un exercice d'après son nom complet, sinon son nom de base.
// Miroir : « (gauche) » pour une pose de profil (tête à droite) ; « (droite) »
// pour une pose de face (couché sur le côté gauche et tourné vers toi, il a la
// tête à droite de l'écran).
export function figureFor(name) {
  const fig = POSES[name] ?? POSES[baseName(name)];
  if (!fig) return null;
  return { fig, mirror: (fig.front ? /\(droite\)\s*$/ : /\(gauche\)\s*$/).test(name) };
}
