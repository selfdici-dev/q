// La salle interactive de l'onglet Salle : un seul décor (celui de room.js)
// et un poste par séance, chacun avec son bonhomme et son matériel : barre au
// mur (P), tapis de yoga (M), sac de boxe (C), tapis (A), parallettes (B).
// Le bonhomme du poste choisi bouge ; les autres attendent, immobiles.
// Logique pure : une chaîne SVG et les zones à toucher, testées par
// tests/gym.test.js.
import { roomSVG } from './room.js';
import { figureFor, figureSVG, focusFor, solve, barAt, VIEW } from './figures.js';
import { WORKOUTS } from './data.js';

export const HUB = { w: 360, h: 312, floor: 0.49 };

// Postes : séance, exercice montré, centre (x) et sol (y) dans la salle,
// échelle (unités du bonhomme → unités de la salle). Au fond, sous les trois
// spots : P, M, C ; devant : A et B, plus grands.
export const STATIONS = [
  { id: 'P', ex: 'Tractions (selon ton niveau)', x: 62, y: 190, s: 1.16, rack: true },
  { id: 'M', ex: 'Fente basse (droite)', x: 172, y: 190, s: 1.16 },
  { id: 'C', ex: 'Shadow boxing', x: 250, y: 190, s: 1.16, bag: true },
  { id: 'A', ex: 'Crunch vélo', x: 94, y: 290, s: 1.55 },
  { id: 'B', ex: 'Pompes (sur parallettes)', x: 262, y: 290, s: 1.55 },
];

const r1 = (v) => Math.round(v * 10) / 10;
const targetOf = (name) => WORKOUTS.flatMap((w) => w.exercises).find((e) => e.name === name)?.target ?? '';

// Le bonhomme d'un poste, posé pieds au sol (y = 70 chez lui → y du poste),
// centré sur le poste. box : sa place dans la salle [x, y, largeur, hauteur].
function place(st, animate) {
  const f = figureFor(st.ex);
  const svg = figureSVG(f.fig, { mirror: f.mirror, fit: true, animate, help: false, focus: focusFor(targetOf(st.ex)) });
  const [bx, by, bw, bh] = svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
  const tx = st.x - (bx + bw / 2) * st.s;
  const ty = st.y - VIEW.floor * st.s;
  return { inner: svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, ''), tx, ty, box: [tx + bx * st.s, ty + by * st.s, bw * st.s, bh * st.s] };
}

// Zones à toucher et place de l'étiquette de chaque poste (unités de la salle).
export function hubLayout() {
  return STATIONS.map((st) => {
    const { box } = place(st, false);
    return { id: st.id, box: box.map(r1) };
  });
}

// Sac de boxe pendu au plafond, devant les poings du bonhomme (en unités du
// bonhomme : le direct touche vers x = 86).
function bag(p, st, id) {
  const cx = r1(p.tx + 93 * st.s);
  const top = r1(p.ty + 13 * st.s);
  const bottom = r1(p.ty + 52 * st.s);
  const w = r1(13 * st.s);
  const hook = r1(HUB.h * 0.07);
  const band = (y) => `<rect x="${r1(cx - w / 2)}" y="${r1(y)}" width="${w}" height="${r1(1.6 * st.s)}" fill="#c98059" fill-opacity="0.85"/>`;
  return `<g class="hub-bag"><path d="M${cx} ${hook}V${r1(top - 5)}L${r1(cx - w * 0.38)} ${top}M${r1(cx - 0.01)} ${r1(top - 5)}L${r1(cx + w * 0.38)} ${top}" stroke="#8a7a6b" stroke-width="0.9" fill="none"/>`
    + `<rect x="${r1(cx - w / 2)}" y="${top}" width="${w}" height="${r1(bottom - top)}" rx="${r1(w * 0.42)}" fill="url(#${id}-bag)"/>`
    + `${band(top + (bottom - top) * 0.14)}${band(bottom - (bottom - top) * 0.2)}</g>`;
}

// Barre de traction sur ses deux montants : la barre (dessinée par le
// bonhomme, vue un peu de biais) et un poteau sous chaque bout, jusqu'au sol
// (le bout du fond se pose un peu plus loin, donc plus haut).
function rack(p, st) {
  const f = figureFor(st.ex);
  const ends = barAt(solve(f.fig.frames[0])).map(([x, y]) => [r1(p.tx + x * st.s), r1(p.ty + y * st.s)]);
  const [[x1, y1], [x2, y2]] = ends;
  const post = (x, y, floor, w) => `<rect x="${r1(x - w / 2)}" y="${y}" width="${w}" height="${r1(floor - y)}" rx="${r1(w / 2)}"/>`;
  return `<g class="hub-rack">${post(x2, y2, r1(st.y - 6 * st.s), 2)}${post(x1, y1, r1(st.y + 2), 2.4)}</g>`;
}

// La salle entière : le décor, puis les postes du fond, puis ceux de devant.
// pick : poste choisi (son bonhomme bouge si animate) ; id : préfixe des
// identifiants internes.
export function hubSVG({ pick = 'A', animate = true, id = 'hub' } = {}) {
  const room = roomSVG({ w: HUB.w, h: HUB.h, floor: HUB.floor, logo: [0.5, 0.15], size: 0.85, id }).replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const stations = STATIONS.map((st) => {
    const on = st.id === pick;
    const p = place(st, on && animate);
    const [, , bw] = p.box;
    const pool = `<ellipse class="hub-pool" cx="${st.x}" cy="${r1(st.y + 4 * st.s)}" rx="${r1(bw / 2 + 8)}" ry="${r1(6 * st.s)}"/>`;
    return `<g class="hub-st st-${st.id} wo-${st.id}${on ? ' on' : ''}">${pool}${st.bag ? bag(p, st, id) : ''}${st.rack ? rack(p, st) : ''}<g class="fig" transform="translate(${r1(p.tx)} ${r1(p.ty)}) scale(${st.s})">${p.inner}</g></g>`;
  });
  return `<svg class="hub-scene" viewBox="0 0 ${HUB.w} ${HUB.h}" aria-hidden="true">
<defs><linearGradient id="${id}-bag" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1c120c"/><stop offset="0.38" stop-color="#6b4430"/><stop offset="1" stop-color="#20140e"/></linearGradient></defs>
${room}${stations.join('')}</svg>`;
}
