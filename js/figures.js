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

// Images clés de l'animation : chaque pose est tenue `hold` (part d'une
// étape), puis on glisse vers la suivante en SUB petits pas, avec une courbe
// douce (lente au départ et à l'arrivée).
const SUB = 6;
const ease = (u) => 0.5 - Math.cos(Math.PI * u) / 2;

export function timeline(fig) {
  const specs = order(fig);
  const n = specs.length - 1;
  const hold = fig.hold ?? 0.15;
  const keys = [];
  for (let i = 0; i < n; i++) {
    const t0 = i / n;
    keys.push({ t: t0, joints: solve(specs[i]) });
    for (let k = 0; k < SUB; k++) {
      const u = k / SUB;
      keys.push({ t: t0 + (hold + (1 - hold) * u) / n, joints: solve(between(specs[i], specs[i + 1], ease(u))) });
    }
  }
  keys.push({ t: 1, joints: solve(specs[n]) });
  return keys;
}

// Cadre serré autour de tout le mouvement (pour grossir le bonhomme à
// l'écran), sol compris, avec une marge.
export function frameBox(keys, wheel = false, pad = 5) {
  let [x0, y0, x1] = [Infinity, Infinity, -Infinity];
  for (const { joints } of keys) {
    for (const k of JOINTS) {
      const r = k === 'head' ? BONES.head : k === 'handN' && wheel ? WHEEL : 2;
      x0 = Math.min(x0, joints[k][0] - r);
      x1 = Math.max(x1, joints[k][0] + r);
      y0 = Math.min(y0, joints[k][1] - r);
    }
  }
  const bottom = VIEW.floor + 7;
  const top = Math.min(y0 - pad, bottom - 30); // au moins 30 de haut : un bonhomme couché ne devient pas géant
  return [round(x0 - pad), round(top), round(x1 - x0 + 2 * pad), round(bottom - top)];
}

// Corps « mannequin » : un trait par os, chacun avec son épaisseur (cuisse
// plus épaisse que le mollet, poitrine plus large que la taille). Le tronc est
// coupé en deux (taille, poitrine) pour pouvoir allumer l'un ou l'autre.
// [nom, de, à, épaisseur, côté] — dessinés dans cet ordre (le fond d'abord).
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
const HEAD = 4.5; // rayon dessiné (un peu plus petit que BONES.head : le cou reste visible)
// Points du tronc : 'mid' (taille) et 'top' (haut de la poitrine, un peu sous
// l'épaule pour laisser voir le cou), en proportion de la hanche à l'épaule.
const ALONG = { mid: 0.45, top: 0.86 };
const point = (j, k) => (k in ALONG ? [round(j.hip[0] + (j.shoulder[0] - j.hip[0]) * ALONG[k]), round(j.hip[1] + (j.shoulder[1] - j.hip[1]) * ALONG[k])] : j[k]);

// Muscle travaillé, d'après l'objectif de l'exercice (« Bas des abdos · la
// tablette » → la taille) : ces os s'allument en or.
const FOCUS = [
  [/abdos|grand droit|tablette|gainage|obliques|taille|ventre|muscle profond/i, ['waist']],
  [/pectoraux|buste|haut du dos|omoplates|poitrine|\bdos\b/i, ['chest']],
  [/colonne|étirement du dos|détente du dos/i, ['waist', 'chest']],
  [/épaules|carrure/i, ['upperArmN', 'upperArmF']],
  [/triceps|\bbras\b/i, ['upperArmN', 'upperArmF', 'forearmN', 'forearmF']],
  [/\bcou\b|mâchoire|tête/i, ['neck']],
  [/hanches|fessiers/i, ['thighN', 'thighF']],
];

export function focusFor(target = '') {
  return [...new Set(FOCUS.filter(([re]) => re.test(target)).flatMap(([, bones]) => bones))];
}

// SVG du bonhomme. animate=false : première pose, immobile (mouvement réduit).
// fit=true : cadre serré autour du mouvement au lieu du cadre fixe 120 × 80.
// focus : os à allumer (voir focusFor).
export function figureSVG(fig, { animate = true, mirror = false, fit = false, focus = [] } = {}) {
  const keys = timeline(fig);
  const still = !animate || fig.frames.length === 1;
  const times = keys.map((k) => round(k.t * 1000) / 1000).join(';');
  const anim = (attr, values) => (still ? '' : `<animate attributeName="${attr}" dur="${fig.dur ?? 2}s" repeatCount="indefinite" keyTimes="${times}" values="${values.join(';')}"/>`);
  const first = keys[0].joints;
  const bone = ([name, from, to, width]) => {
    const [a, b] = [point(first, from), point(first, to)];
    const track = (k, i) => anim(k, keys.map(({ joints }) => point(joints, i ? to : from)[k.endsWith('x1') || k.endsWith('x2') ? 0 : 1]));
    return `<line class="fig-bone${focus.includes(name) ? ' fig-focus' : ''}" stroke-width="${width}" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}">${track('x1', 0)}${track('y1', 0)}${track('x2', 1)}${track('y2', 1)}</line>`;
  };
  const far = fig.front ? [] : BODY.filter((b) => b[4] === 'F');
  const rest = BODY.filter((b) => !far.includes(b));
  const head = `<circle class="fig-head" cx="${first.head[0]}" cy="${first.head[1]}" r="${HEAD}">${anim('cx', keys.map((k) => k.joints.head[0]))}${anim('cy', keys.map((k) => k.joints.head[1]))}</circle>`;
  // Roue abdominale : tenue dans les mains (centre de la roue = mains).
  const wheel = fig.wheel ? `<circle class="fig-wheel" cx="${first.handN[0]}" cy="${first.handN[1]}" r="${WHEEL}">${anim('cx', keys.map((k) => k.joints.handN[0]))}${anim('cy', keys.map((k) => k.joints.handN[1]))}</circle>` : '';
  const body = `${far.length ? `<g class="fig-far">${far.map(bone).join('')}</g>` : ''}${rest.map(bone).join('')}${head}${wheel}`;
  const [bx, by, bw, bh] = fit ? frameBox(keys, fig.wheel) : [0, 0, VIEW.w, VIEW.h];
  // En miroir, le cadre serré est retourné lui aussi autour de l'axe x = 60.
  const vx = fit && mirror ? round(VIEW.w - bx - bw) : bx;
  return `<svg class="fig" viewBox="${vx} ${by} ${bw} ${bh}" aria-hidden="true"><rect class="fig-mat" x="${vx + 2}" y="${VIEW.floor + 2.5}" width="${bw - 4}" height="3" rx="1.5"/>${mirror ? `<g transform="translate(${VIEW.w} 0) scale(-1 1)">${body}</g>` : body}</svg>`;
}

// Bonhomme d'un exercice d'après son nom ; « (gauche) » = image en miroir.
export function figureFor(name) {
  const fig = POSES[baseName(name)];
  return fig ? { fig, mirror: /\(gauche\)\s*$/.test(name) } : null;
}
