// Ton double : un personnage vu de face qui évolue avec ton niveau (8 paliers,
// un par rang) et dont l'aura suit ta chaîne. Tout est calculé depuis tes
// données, rien n'est stocké. Logique pure (sans DOM), testée par
// tests/avatar.test.js.
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
  };
}

// SVG du double (viewBox 120 × 160), couleurs par les jetons CSS :
// --figure (corps), --accent (aura). animate=false : immobile.
export function avatarSVG(p, { animate = true } = {}) {
  const l = p.lift;
  const w = p.waist;
  // Il se redresse : la tête monte, les épaules se relâchent, le cou se dégage.
  const s0 = round(42 + l * 0.5); // ligne des épaules
  const hy = round(21.5 - l * 0.7); // centre de la tête
  const line = (d, o) => (o > 0 ? `<path class="av-line" d="${d}" opacity="${round(o)}"/>` : '');
  const breathe = animate ? '<animateTransform attributeName="transform" type="scale" additive="sum" values="1 1;1.012 1.018;1 1" dur="4.5s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.45;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>' : '';
  const torso = `M46 ${s0 + 1} C41 ${s0 + 1} 39.5 ${s0 + 5} 40 ${s0 + 9} L42.5 ${s0 + 16} Q44.5 ${round(s0 + 26)} ${60 - w} 79 Q${round(60 - w - 1.5)} 86 49.5 92 L70.5 92 Q${round(60 + w + 1.5)} 86 ${60 + w} 79 Q75.5 ${round(s0 + 26)} 77.5 ${s0 + 16} L80 ${s0 + 9} C80.5 ${s0 + 5} 79 ${s0 + 1} 74 ${s0 + 1} Q60 ${s0 - 2} 46 ${s0 + 1} Z`;
  const side = (m) => {
    const x = (v) => round(60 + (v - 60) * m); // m = 1 : côté gauche de l'image, -1 : miroir
    return `<path class="av-limb" d="M${x(41.6)} ${s0 + 8} L${x(39.4)} ${s0 + 30}" stroke-width="6.6"/>
      <path class="av-limb" d="M${x(39.4)} ${s0 + 30} L${x(40.4)} ${s0 + 49}" stroke-width="5.2"/>
      <circle class="av-fill" cx="${x(40.6)}" cy="${s0 + 51}" r="2.9"/>
      <path class="av-limb" d="M${x(54.6)} 91 L${x(53.6)} 120" stroke-width="10"/>
      <path class="av-limb" d="M${x(53.6)} 120 L${x(53.2)} 145" stroke-width="7.2"/>
      <ellipse class="av-fill" cx="${x(52.2)}" cy="148" rx="4.2" ry="2"/>`;
  };
  const rows = [s0 + 22, s0 + 28.5, s0 + 35].map((r) => `M55.2 ${r} Q57.4 ${r + 1} 59.3 ${r} M60.7 ${r} Q62.6 ${r + 1} 64.8 ${r}`).join(' ');
  return `<svg class="avatar" viewBox="0 0 120 160" aria-hidden="true">
    <defs><radialGradient id="av-aura"><stop offset="0" stop-color="var(--accent)" stop-opacity="0.55"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></radialGradient></defs>
    <circle class="av-aura" cx="60" cy="80" r="58" fill="url(#av-aura)" opacity="${p.aura}"/>
    <circle class="av-ring" cx="60" cy="80" r="56" opacity="${round(p.aura * 0.9)}"/>
    <ellipse class="av-ground" cx="60" cy="150" rx="22" ry="3"/>
    <g class="av-body">
      ${side(1)}${side(-1)}
      <rect class="av-fill" x="56" y="${round(hy + 6)}" width="8" height="${round(s0 - hy - 3)}" rx="3"/>
      <g class="av-torso" style="transform-origin:60px 92px">${breathe}
        <path class="av-fill" d="${torso}"/>
        ${line(`M47.5 ${s0 + 12} Q53.5 ${s0 + 17} 59.4 ${s0 + 13.5} M60.6 ${s0 + 13.5} Q66.5 ${s0 + 17} 72.5 ${s0 + 12}`, p.pecs)}
        ${line(`M60 ${s0 + 18} L60 84 ${rows}`, p.abs * 0.85)}
        ${line(`M${round(60 - w + 1.5)} 78 Q55.5 87 58.5 92 M${round(60 + w - 1.5)} 78 Q64.5 87 61.5 92`, p.vline)}
      </g>
      <ellipse class="av-fill" cx="60" cy="${hy}" rx="8.3" ry="9.6"/>
      ${line(`M52.4 ${round(hy + 3)} Q53.6 ${round(hy + 7)} 56.6 ${round(hy + 9)} M67.6 ${round(hy + 3)} Q66.4 ${round(hy + 7)} 63.4 ${round(hy + 9)}`, p.jaw)}
    </g>
  </svg>`;
}
