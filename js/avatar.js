// Ton double : un buste en médaillon (de la tête aux hanches) qui évolue avec
// ton niveau (8 paliers, un par rang) et dont l'anneau s'allume avec ta chaîne.
// Formes pleines et lisses, visage net (sans traits), cheveux foncés teintés
// par l'accent, contre-jour coloré. Couleurs : uniquement des jetons CSS avec
// valeur de secours, posés en ligne (aucune règle CSS nécessaire).
// Tout est calculé depuis tes données, rien n'est stocké. Logique pure (sans
// DOM), testée par tests/avatar.test.js.
import { RANKS } from './logic.js';

const clamp = (v) => Math.max(0, Math.min(1, v));
const round = (v) => Math.round(v * 10) / 10;
export const STAGES = RANKS.length; // 8 paliers, un par rang (tous les 2 niveaux)

// Ce que le double gagne à chaque palier (affiché dans la fiche « Ton double »).
export const STAGE_GAINS = [
  'Le point de départ : tête un peu rentrée, rien de dessiné.',
  'Il se redresse.',
  'La poitrine se dessine.',
  'Les premiers abdos apparaissent.',
  'La mâchoire se marque.',
  'La taille s’affine, les abdos sont nets.',
  'Le V du bas du ventre se dessine.',
  'Silhouette complète : droit, sec, défini.',
];

// level : niveau (1, 2, 3…) ; chain : jours de chaîne en cours.
export function avatarParams(level, chain = 0) {
  const stage = Math.min(STAGES - 1, Math.floor((Math.max(1, level) - 1) / 2));
  const t = stage / (STAGES - 1);
  // Niveau du palier suivant : un rang = 2 niveaux.
  const nextLevel = stage < STAGES - 1 ? (stage + 1) * 2 + 1 : null;
  return {
    stage,
    rank: RANKS[stage],
    nextLevel,
    nextGain: nextLevel ? STAGE_GAINS[stage + 1] : null,
    lift: round(4 * clamp(stage / 2)), // se redresse (paliers 0 → 2) : tête plus haute, cou dégagé
    waist: round(12.5 - 2.5 * t), // demi-largeur de taille : s'affine
    pecs: clamp((stage - 1) / 2), // poitrine dessinée (palier 2+)
    abs: clamp((stage - 2) / 3), // abdos (palier 3+)
    jaw: clamp((stage - 3) / 2), // mâchoire (palier 4+)
    vline: clamp((stage - 5) / 1.5), // V du bas du ventre (palier 6+)
    aura: Math.round((0.12 + 0.68 * clamp(chain / 21)) * 100) / 100, // 3 semaines de chaîne = aura pleine
    charge: Math.round(clamp(chain / 21) * 100), // aura en % (affiché) : 100 % à 3 semaines
  };
}

// Le double change-t-il d'allure en passant de prevLevel à level ?
// (un palier tous les 2 niveaux, plus rien après le dernier)
export function evolved(prevLevel, level) {
  return avatarParams(level).stage > avatarParams(prevLevel).stage;
}

// Couleurs : uniquement des jetons CSS, chacun avec une valeur de secours,
// posés en style en ligne (le dessin marche sans aucune règle CSS).
const FIG = 'var(--figure, #f2f0ff)';
const BG = 'var(--bg, #000)';
const A1 = 'var(--accent, #7c5cff)';
const A2 = 'var(--accent-2, #22d3ee)';
const CX = 60; // axe du corps
const CY = 82; // centre du médaillon
const RING = 50; // rayon de l'anneau
const ZOOM = 1.24; // le buste est dessiné à l'échelle 1, puis agrandi dans le médaillon
const TOP = 30.8; // haut du crâne au dernier palier (repère du zoom)…
const TOP_AT = 21; // …placé ici : la tête dépasse un peu de l'anneau

// Identifiants uniques dans <defs> : le héros et la fiche peuvent être affichés ensemble.
let uid = 0;

const lerp = (a, b, k) => a + (b - a) * k;
const pt = ([x, y], m = 1) => `${round(CX + m * x)} ${round(y)}`;
const op = (v) => Math.round(clamp(v) * 100) / 100;

// Contour symétrique : on donne la moitié droite (x = écart à l'axe), de l'axe
// en haut à l'axe en bas ; segments [p] (droite) ou [c1, c2, p] (courbe).
function sym(start, segs) {
  const ends = [start, ...segs.map((s) => s[s.length - 1])];
  let d = `M${pt(start)}`;
  for (const s of segs) d += s.length === 3 ? ` C${pt(s[0])} ${pt(s[1])} ${pt(s[2])}` : ` L${pt(s[0])}`;
  for (let i = segs.length - 1; i >= 0; i--) {
    const s = segs[i];
    d += s.length === 3 ? ` C${pt(s[1], -1)} ${pt(s[0], -1)} ${pt(ends[i], -1)}` : ` L${pt(ends[i], -1)}`;
  }
  return `${d}Z`;
}

// Tracé (ouvert ou fermé) d'un côté : m = 1 à droite de l'image, -1 en miroir.
function side(m, start, segs, close = false) {
  return `M${pt(start, m)}${segs.map((s) => (s.length === 3 ? ` C${pt(s[0], m)} ${pt(s[1], m)} ${pt(s[2], m)}` : s.length === 2 ? ` Q${pt(s[0], m)} ${pt(s[1], m)}` : ` L${pt(s[0], m)}`)).join('')}${close ? 'Z' : ''}`;
}
const both = (start, segs) => `${side(1, start, segs)} ${side(-1, start, segs)}`;

// Trait effilé (plus épais au milieu, fin aux bouts), des deux côtés : une
// courbe p0 → p3 doublée par la même courbe décalée de w le long de sa normale.
function taper([p0, c1, c2, p3], w, dir = 1) {
  const dx = p3[0] - p0[0];
  const dy = p3[1] - p0[1];
  const k = (w / 0.75 / Math.hypot(dx, dy)) * dir;
  const off = ([x, y]) => [x - dy * k, y + dx * k];
  return both(p0, [[c1, c2, p3], [off(c2), off(c1), p0]]).replace(/ M/g, 'Z M') + 'Z';
}

// SVG du double (viewBox 120 × 160). Couleurs : --figure (corps), --bg (fond,
// ombres), --accent → --accent-2 (anneau, contre-jour). animate=false : immobile.
export function avatarSVG(p, { animate = true } = {}) {
  const id = `av${++uid}`;
  const t = p.stage / (STAGES - 1);
  const u = clamp(p.lift / 4); // posture : 0 = tête rentrée, 1 = droit
  const g = clamp((p.aura - 0.12) / 0.68); // charge de l'aura, 0 → 1
  const j = p.jaw;

  // Proportions : la tête monte et le cou se dégage, les épaules s'ouvrent, la taille s'affine.
  const hy = round(46.4 - 2.6 * u); // repère de la tête (haut du crâne = hy - 13, menton = hy + 11)
  const sY = round(64.6 - 0.6 * u); // ligne des épaules
  const S = 25.4 + 1.6 * t; // demi-largeur aux deltoïdes
  const AX = 17.4 + 1.2 * t; // demi-largeur aux aisselles
  const W = p.waist + 3; // demi-largeur de taille
  const nw = 5 + 0.4 * t; // demi-largeur du cou
  const rise = 1.6 * (1 - u); // épaules un peu remontées et enroulées au départ
  const B = sY + 70; // bas du dessin (coupé par le médaillon)

  const torso = sym([0, hy + 4], [
    [[nw, hy + 4]],
    [[nw, hy + 8.5], [nw + 0.1, sY - 6.5], [nw + 0.9, sY - 4]],
    [[nw + 3.5, sY - 1.6 - rise * 0.5], [13.5, sY + 0.4 - rise * 0.6], [19.5, sY + 2.8]],
    [[23, sY + 4.5], [AX + 1.5, sY + 9], [AX, sY + 15]],
    [[AX + 0.2, sY + 23], [W + 1.2, sY + 33], [W, sY + 42]],
    [[W - 0.4, sY + 48], [W + 0.6, sY + 56], [W + 1.8, B]],
    [[0, B]],
  ]);
  const head = sym([0, hy - 13], [
    [[5.3, hy - 13], [8.7, hy - 9.6], [8.7, hy - 4]],
    [[8.7, hy - 1], [8.5, hy + 1], [8.3, hy + 2.6]],
    [[lerp(8.1, 8.4, j), hy + 4.6], [lerp(7.7, 8.2, j), hy + lerp(6.4, 5.8, j)], [lerp(7, 7.9, j), hy + lerp(7.4, 6.8, j)]],
    [[lerp(6, 6.6, j), hy + lerp(8.9, 8.4, j)], [lerp(4.4, 4.6, j), hy + lerp(10.6, 10.1, j)], [lerp(2.5, 2.9, j), hy + lerp(10.9, 10.7, j)]],
    [[1.2, hy + 11.1], [0.6, hy + 11.1], [0, hy + 11.1]],
  ]);
  const ear = (m) => side(m, [8.2, hy - 2.2], [[[9.8, hy - 3.2], [10.5, hy - 0.8], [10.1, hy + 1.6]], [[9.8, hy + 3.4], [9.1, hy + 4.3], [8.2, hy + 4]]], true);
  // Bras relâchés le long du corps : deltoïde arrondi, bras, coude, avant-bras (coupés par le médaillon).
  const armIn = [
    [[S - 10.2, sY + 56], [S - 9.4, sY + 49], [S - 8.7, sY + 42]],
    [[S - 8.6, sY + 36], [S - 9.2, sY + 30], [S - 9, sY + 24]],
    [[S - 8.9, sY + 20], [AX + 0.2, sY + 18], [AX - 0.6, sY + 15.5]],
  ];
  const arm = (m) => side(m, [19, sY + 2.6], [
    [[23.2, sY + 2.4], [S + 0.9, sY + 5.6], [S + 0.7, sY + 12]],
    [[S + 0.5, sY + 17], [S - 0.6, sY + 20.5], [S - 0.9, sY + 24]],
    [[S - 1.1, sY + 29], [S - 0.9, sY + 35], [S - 1.9, sY + 41]],
    [[S - 2.3, sY + 46], [S - 1.6, sY + 52], [S - 2.6, B]],
    [[S - 10.6, B]],
    ...armIn,
    [[AX - 1.2, sY + 10], [16.8, sY + 4.4], [19, sY + 2.6]],
  ], true);
  const armEdge = (m) => side(m, [AX - 0.6, sY + 15.5], [
    [[AX + 0.2, sY + 18], [S - 8.9, sY + 20], [S - 9, sY + 24]],
    [[S - 9.2, sY + 30], [S - 8.6, sY + 36], [S - 8.7, sY + 42]],
    [[S - 9.4, sY + 49], [S - 10.2, sY + 56], [S - 10.6, B]],
  ]);
  // Cheveux : coupe courte moderne, côtés courts, volume sur le dessus, balayée
  // vers la droite (raie à gauche). Teinte : la couleur du corps assombrie +
  // l'accent (foncés sur un corps clair comme sur un corps foncé).
  const hair = `M${pt([-8.4, hy - 1])} C${pt([-9.1, hy - 4.4])} ${pt([-9.5, hy - 8.4])} ${pt([-8.7, hy - 11.2])} C${pt([-7.8, hy - 14.6])} ${pt([-4.2, hy - 16.7])} ${pt([0.6, hy - 16.6])} C${pt([5, hy - 16.5])} ${pt([8.5, hy - 14.4])} ${pt([9.2, hy - 10.8])} C${pt([9.7, hy - 7.8])} ${pt([9.2, hy - 3.6])} ${pt([8.6, hy - 1])} L${pt([8.1, hy - 1])} C${pt([8, hy - 3.4])} ${pt([7.8, hy - 5.4])} ${pt([6.8, hy - 7])} C${pt([5, hy - 8.6])} ${pt([2.2, hy - 8.2])} ${pt([0, hy - 8.6])} C${pt([-2.4, hy - 9])} ${pt([-4.8, hy - 8.4])} ${pt([-6.3, hy - 7])} C${pt([-7.4, hy - 6])} ${pt([-8, hy - 3.8])} ${pt([-8.1, hy - 1])}Z`;
  const strands = `M${pt([-5, hy - 15])} C${pt([-1.6, hy - 16.4])} ${pt([3.6, hy - 15.8])} ${pt([7.4, hy - 12.6])} M${pt([-6.8, hy - 12])} C${pt([-3.4, hy - 14.2])} ${pt([2, hy - 13.8])} ${pt([6, hy - 10.4])} M${pt([-7.4, hy - 8.8])} C${pt([-4.8, hy - 11.2])} ${pt([-0.6, hy - 11.4])} ${pt([3.6, hy - 9.4])}`;
  // Reflet du dessus (lumière en haut à gauche).
  const sheen = `M${pt([-7.6, hy - 11.8])} C${pt([-6.2, hy - 15.2])} ${pt([-1.6, hy - 16.6])} ${pt([2.6, hy - 16])} C${pt([-1, hy - 15])} ${pt([-4.8, hy - 13.6])} ${pt([-7.6, hy - 11.8])}Z`;

  const shade = (o) => `style="fill:${BG}" opacity="${op(o)}"`;
  const ink = (o, w = 1) => `fill="none" stroke-linecap="round" stroke-width="${w}" style="stroke:${BG}" opacity="${op(o)}"`;
  // Trait de définition : des formes effilées nettes + leur ombre douce.
  const mark = (d, o) => (o > 0 ? `<g class="av-mark"><path d="${d}" style="fill:${BG};stroke:${BG}" stroke-width="1.6" filter="url(#${id}-soft)" opacity="${op(o * 0.2)}"/><path d="${d}" ${shade(o * 0.46)}/></g>` : '');

  const pecs = taper([[0.9, sY + 9], [1.6, sY + 19.6], [12.6, sY + 21.4], [AX - 0.8, sY + 14]], 1.2);
  const rows = [[sY + 24, 5.8], [sY + 30.5, 6.8], [sY + 37, 6.6]].map(([r, w]) => taper([[0.7, r + 0.4], [2.4, r + 1.4], [4.6, r + 1], [w, r - 0.4]], 0.75)).join(' ');
  const abs = `M${pt([0, sY + 19.5])} C${pt([0.6, sY + 26])} ${pt([0.6, sY + 35])} ${pt([0, sY + 42])} C${pt([-0.6, sY + 35])} ${pt([-0.6, sY + 26])} ${pt([0, sY + 19.5])}Z ${rows} ${taper([[8.3, sY + 22], [9.2, sY + 28], [9, sY + 33], [7.8, sY + 38.5]], 0.6, -1)}`;
  const vline = taper([[W - 0.6, sY + 39], [W - 2.2, sY + 48], [8, sY + 56], [3.6, B - 2]], 1.1);
  const jawShadow = side(1, [-lerp(7, 7.9, j) + 0.6, hy + 7.4], [[[-5, hy + 10.6], [-2.4, hy + 12.4], [0, hy + 12.6]], [[2.4, hy + 12.4], [5, hy + 10.6], [lerp(7, 7.9, j) - 0.6, hy + 7.4]], [[nw, hy + 12]], [[0, hy + 15]], [[-nw, hy + 12]]], true);
  const scm = taper([[6.6, hy + 9.6], [5.6, hy + 14], [3, sY - 4], [1.6, sY + 0.8]], 0.55);

  const breathe = animate ? `<animateTransform attributeName="transform" type="scale" values="1 1;1.006 1.012;1 1" dur="4.8s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.45;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>` : '';
  const spin = animate ? `<animateTransform attributeName="gradientTransform" type="rotate" values="0 ${CX} ${CY};360 ${CX} ${CY}" dur="14s" repeatCount="indefinite"/>` : '';
  const shimmer = animate ? `<animate attributeName="opacity" values="${op(0.2 + 0.7 * g)};${op(0.12 + 0.45 * g)};${op(0.2 + 0.7 * g)}" dur="3.6s" repeatCount="indefinite"/>` : '';

  // Paliers : 8 petites barres sous le médaillon, allumées jusqu'au palier atteint.
  const pips = Array.from({ length: STAGES }, (_, i) => {
    const x = round(CX - (STAGES * 6 + (STAGES - 1) * 2.6) / 2 + i * 8.6);
    return `<rect class="av-pip" x="${x}" y="145" width="6" height="2.2" rx="1.1" ${i <= p.stage ? `fill="url(#${id}-pip)"` : `style="fill:${FIG}" opacity="0.18"`}/>`;
  }).join('');

  const base = sY + 62; // point fixe de la respiration
  return `<svg class="avatar" viewBox="0 0 120 160" aria-hidden="true">
    <defs>
      <linearGradient id="${id}-ring" gradientUnits="userSpaceOnUse" x1="${CX - 40}" y1="${CY - 48}" x2="${CX + 40}" y2="${CY + 48}"><stop offset="0" style="stop-color:${A1}"/><stop offset="1" style="stop-color:${A2}"/>${spin}</linearGradient>
      <linearGradient id="${id}-pip" gradientUnits="userSpaceOnUse" x1="${CX - 34}" y1="0" x2="${CX + 34}" y2="0"><stop offset="0" style="stop-color:${A1}"/><stop offset="1" style="stop-color:${A2}"/></linearGradient>
      <radialGradient id="${id}-back" gradientUnits="userSpaceOnUse" cx="${CX}" cy="${CY - 16}" r="52"><stop offset="0" style="stop-color:${A1}" stop-opacity="0.6"/><stop offset="0.55" style="stop-color:${A1}" stop-opacity="0.16"/><stop offset="1" style="stop-color:${A2}" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0.45" style="stop-color:${BG}" stop-opacity="0"/><stop offset="1" style="stop-color:${BG}" stop-opacity="0.42"/></linearGradient>
      <clipPath id="${id}-disc"><circle cx="${CX}" cy="${CY}" r="${RING - 1.2}"/><rect x="${CX - RING + 1.2}" y="0" width="${2 * RING - 2.4}" height="${CY}"/></clipPath>
      <clipPath id="${id}-torso"><path d="${torso}"/></clipPath>
      <clipPath id="${id}-arms"><path d="${arm(1)}"/><path d="${arm(-1)}"/></clipPath>
      <g id="${id}-sil"><path d="${torso}"/><path d="${arm(1)}"/><path d="${arm(-1)}"/><path d="${ear(1)}"/><path d="${ear(-1)}"/><path d="${head}"/><path d="${hair}"/></g>
      <filter id="${id}-rim" x="-10%" y="-10%" width="120%" height="120%"><feMorphology in="SourceAlpha" operator="erode" radius="0.9" result="in"/><feComposite in="SourceGraphic" in2="in" operator="out"/><feGaussianBlur stdDeviation="0.45"/><feComposite in2="SourceAlpha" operator="in"/></filter>
      <clipPath id="${id}-head"><path d="${head}"/></clipPath>
      <clipPath id="${id}-hair"><path d="${hair}"/></clipPath>
      <clipPath id="${id}-trunk"><path d="${torso}"/><path d="${arm(1)}"/><path d="${arm(-1)}"/></clipPath>
      <filter id="${id}-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="0.8"/></filter>
      <filter id="${id}-blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2"/></filter>
      <filter id="${id}-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.6"/></filter>
      <filter id="${id}-dark" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.16 0 0 0 0 0 0.16 0 0 0 0 0 0.16 0 0 0 0 0 1 0"/></filter>
      <linearGradient id="${id}-tint" gradientUnits="userSpaceOnUse" x1="0" y1="${sY}" x2="0" y2="${B}"><stop offset="0" style="stop-color:${A1}" stop-opacity="0"/><stop offset="1" style="stop-color:${A1}" stop-opacity="0.1"/></linearGradient>
    </defs>
    <circle class="av-disc" cx="${CX}" cy="${CY}" r="${RING}" style="fill:${BG}"/>
    <circle cx="${CX}" cy="${CY}" r="${RING}" style="fill:${FIG}" opacity="0.05"/>
    <circle class="av-back" cx="${CX}" cy="${CY}" r="${RING}" fill="url(#${id}-back)" opacity="${op(0.35 + 0.65 * g)}"/>
    <circle class="av-glow" cx="${CX}" cy="${CY}" r="${RING}" fill="none" stroke="url(#${id}-ring)" stroke-width="${round(2.5 + 3 * g)}" filter="url(#${id}-glow)" opacity="${op(0.2 + 0.7 * g)}">${shimmer}</circle>
    <circle class="av-frame" cx="${CX}" cy="${CY}" r="${RING}" fill="none" stroke="url(#${id}-ring)" stroke-width="${round(1.2 + 2 * g)}" opacity="${op(0.72 + 0.28 * g)}"/>
    <g clip-path="url(#${id}-disc)">
      <g transform="translate(${CX} ${TOP_AT}) scale(${ZOOM}) translate(${-CX} ${-TOP})">
      <g transform="translate(${CX} ${base})"><g>${breathe}<g transform="translate(${-CX} ${-base})">
        <g class="av-body" style="fill:${FIG}">
          <path d="${torso}"/>
          <g clip-path="url(#${id}-torso)">
            <g filter="url(#${id}-blur)">
              <path d="${side(1, [AX - 2, sY + 12], [[[AX + 4, sY + 30], [W + 4, sY + 46], [W + 5, B + 4]], [[W - 5, B + 4]], [[W - 4, sY + 46], [AX - 7, sY + 30], [AX - 2, sY + 12]]], true)}" ${shade(0.3 + 0.12 * t)}/>
              <path d="${side(-1, [AX - 2, sY + 12], [[[AX + 4, sY + 30], [W + 4, sY + 46], [W + 5, B + 4]], [[W - 4, B + 4]], [[W - 3, sY + 46], [AX - 5, sY + 30], [AX - 2, sY + 12]]], true)}" ${shade(0.12 + 0.08 * t)}/>
              <path d="M${pt([-nw - 1, hy + 4])} L${pt([nw + 1, hy + 4])} L${pt([nw + 0.5, hy + 12])} Q${pt([0, hy + 15.5])} ${pt([-nw - 0.5, hy + 12])}Z" ${shade(0.3)}/>
            </g>
            <g filter="url(#${id}-blur)"><path d="${pecs}" style="fill:${BG};stroke:${BG}" stroke-width="2" opacity="0.14"/></g>
            <path d="${both([1.6, sY + 1.4], [[[6, sY + 3.2], [11, sY + 1.2], [18, sY + 2.6]]])}" ${ink(0.14 + 0.12 * u, 0.8)}/>
            <ellipse cx="${CX}" cy="${sY + 44}" rx="0.8" ry="1.2" ${shade(0.4)}/>
            ${mark(pecs, p.pecs)}
            ${mark(abs, p.abs)}
            ${mark(vline, p.vline)}
            ${j > 0 ? `<g class="av-mark"><path d="${jawShadow}" ${shade(0.24 * j)} filter="url(#${id}-soft)"/><path d="${scm}" ${shade(0.3 * j)}/></g>` : ''}
          </g>
          <path d="${arm(1)}"/><path d="${arm(-1)}"/>
          <g clip-path="url(#${id}-arms)">
            <g filter="url(#${id}-blur)">
              <path d="${side(1, [S - 2, sY + 14], [[[S + 3, sY + 30], [S + 2, sY + 50], [S + 1, B]], [[S - 5, B]], [[S - 6, sY + 40], [S - 6, sY + 30], [S - 2, sY + 14]]], true)}" ${shade(0.3)}/>
              <path d="${side(-1, [S - 8, sY + 18], [[[S - 6, sY + 30], [S - 6, sY + 50], [S - 7, B]], [[S - 12, B]], [[S - 11, sY + 40], [S - 11, sY + 30], [S - 8, sY + 18]]], true)}" ${shade(0.2)}/>
            </g>
          </g>
          <path d="${armEdge(1)}" ${ink(0.6, 0.9)}/><path d="${armEdge(-1)}" ${ink(0.6, 0.9)}/>
          <path d="${both([AX - 0.4, sY + 14.5], [[[AX - 0.6, sY + 9], [19, sY + 6], [20.5, sY + 3.6]]])}" ${ink(0.14, 0.7)}/>
          <rect x="0" y="${sY - 8}" width="120" height="${B - sY + 12}" fill="url(#${id}-tint)" clip-path="url(#${id}-trunk)"/>
          <path d="${ear(1)}"/><path d="${ear(-1)}"/>
          <path d="${both([9.2, hy - 1.4], [[[10.2, hy - 1.2], [9.8, hy + 2.6]]])}" ${ink(0.3, 0.6)}/>
          <path d="${head}"/>
          <g clip-path="url(#${id}-head)">
            <g filter="url(#${id}-blur)"><path d="M${pt([4.6, hy - 10])} C${pt([9.4, hy - 4])} ${pt([9.4, hy + 6])} ${pt([3, hy + 13])} L${pt([12, hy + 13])} L${pt([12, hy - 10])}Z" ${shade(0.32)}/></g>
            <g filter="url(#${id}-blur)"><path d="M${pt([-4, hy - 10])} C${pt([-9, hy - 4])} ${pt([-9, hy + 6])} ${pt([-3, hy + 13])} L${pt([-12, hy + 13])} L${pt([-12, hy - 10])}Z" ${shade(0.12)}/></g>
            <g filter="url(#${id}-soft)"><path d="${both([lerp(7, 7.9, j) - 1.2, hy + 7.2], [[[5, hy + 9.6], [2.6, hy + 10.6]]])}" ${ink(0.08 + 0.1 * j, 1.4)}/><path d="${hair}" transform="translate(0.3 1.3)" ${shade(0.22)}/></g>
          </g>
          <path d="${hair}" filter="url(#${id}-dark)"/>
          <path d="${hair}" style="fill:${A1}" opacity="0.16"/>
          <g clip-path="url(#${id}-hair)"><path d="${sheen}" style="fill:${A2}" opacity="0.28" filter="url(#${id}-soft)"/></g>
          <path d="${strands}" fill="none" stroke-linecap="round" stroke-width="0.5" style="stroke:${FIG}" opacity="0.13"/>
        </g>
        <use href="#${id}-sil" fill="url(#${id}-ring)" filter="url(#${id}-rim)" opacity="${op(0.45 + 0.4 * g)}"/>
      </g></g></g>
      </g>
      <rect x="0" y="${CY}" width="120" height="${RING + 2}" fill="url(#${id}-fade)"/>
    </g>
    ${pips}
  </svg>`;
}
