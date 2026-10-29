// Dessins des exercices : le croquis au crayon d'un corps en 3D (muscles
// travaillés en rouge), quelques images par mouvement, jouées au rythme exact
// du bonhomme (mêmes poses clés, même tempo : voir beats dans figures.js).
// Logique pure (sans DOM), testée par tests/drawings.test.js. Les images
// (img/ex/<slug>-<n>.webp) sont fabriquées par outils/dessins (voir son README).
import { baseName } from './data.js';
import { POSES } from './poses.js';
import { beats } from './figures.js';
import { DRAWINGS } from './drawings-data.js';

export { DRAWINGS };
export const DIR = 'img/ex/';

// Le dessin d'un exercice, sous le même nom que son bonhomme (ou null).
// Côtés : le dessin montre `side` ; « (gauche) » / « (droite) » de l'autre
// côté, c'est le même dessin en miroir.
export function drawingFor(name = '') {
  const key = name in DRAWINGS ? name : baseName(name);
  const d = DRAWINGS[key];
  if (!d || !POSES[key]) return null;
  const side = /\((gauche|droite)\)\s*$/.exec(name)?.[1];
  return { key, d, fig: POSES[key], mirror: Boolean(side && d.side && side !== d.side) };
}

// Quand montrer chaque image, en part du cycle du bonhomme : pendant l'arrêt
// sur une pose clé, la première image du passage ; puis chaque image quand le
// geste (adouci comme celui du bonhomme) arrive à mi-chemin entre elle et la
// précédente. segs[i] : les images du passage i, dans l'ordre joué.
const r4 = (v) => Math.round(v * 1e4) / 1e4;
export function drawingTimeline(d, fig) {
  const { seg } = beats(fig);
  if (seg.length !== d.segs.length) throw new Error(`${d.slug} : ${seg.length} passages attendus, ${d.segs.length} décrits`);
  const keys = [];
  seg.forEach(({ t0, len, hold }, i) => {
    const f = d.segs[i];
    keys.push({ t: r4(t0), frame: f[0] });
    const m = f.length - 1;
    for (let k = 1; k <= m; k++) {
      const u = Math.acos(1 - (2 * (k - 0.5)) / m) / Math.PI; // ease(u) = (k - ½) / m
      keys.push({ t: r4(t0 + len * (hold + (1 - hold) * u)), frame: f[k] });
    }
  });
  return keys.filter((k, i) => i === 0 || k.frame !== keys[i - 1].frame);
}

// Le dessin en SVG, cadré comme ses images. Animé : les images se relaient
// (SMIL, sans JavaScript), en boucle au rythme du bonhomme. Immobile
// (animate: false) : la pose de départ, et l'arrivée du premier passage en
// transparence (ghost), comme le contour d'arrivée du bonhomme.
export function drawingSVG(name, { animate = true, ghost = true } = {}) {
  const r = drawingFor(name);
  if (!r) return '';
  const { d, fig, mirror } = r;
  const img = (k, attrs = '', inner = '') => `<image href="${DIR}${d.slug}-${k}.webp" width="${d.w}" height="${d.h}"${attrs}>${inner}</image>`;
  let scene;
  if (animate) {
    const { dur } = beats(fig);
    const keys = drawingTimeline(d, fig);
    const frames = [...new Set(keys.map((k) => k.frame))];
    scene = frames.length === 1 ? img(frames[0]) : frames.map((f) => {
      // à chaque changement d'image : 1 pour elle, 0 pour les autres (valeurs tenues)
      const on = keys.map((k) => (k.frame === f ? 1 : 0));
      const at = keys.filter((_, i) => i === 0 || on[i] !== on[i - 1]);
      const values = at.map((k) => (k.frame === f ? 1 : 0));
      const anim = `<animate attributeName="opacity" dur="${dur}s" repeatCount="indefinite" calcMode="discrete" keyTimes="${at.map((k) => k.t).join(';')}" values="${values.join(';')}"/>`;
      return img(f, ` opacity="${values[0]}"`, anim);
    }).join('');
  } else {
    const start = d.segs[0][0];
    const end = d.segs[0].at(-1);
    scene = (ghost && end !== start ? img(end, ' opacity="0.35"') : '') + img(start);
  }
  if (mirror) scene = `<g transform="translate(${d.w} 0) scale(-1 1)">${scene}</g>`;
  return `<svg class="fig draw" viewBox="0 0 ${d.w} ${d.h}" aria-hidden="true">${scene}</svg>`;
}
