// La salle de l'onglet Salle, en maquette vue de dessus, façon jeu vidéo :
// une pièce en biais (isométrique) habillée du décor choisi (decors.js : la
// salle aux murs sombres, le temple grec, le grand hall…, chacun avec son
// écran ou sa plaque qui affiche la séance choisie), une borne d'arcade,
// et une plateforme par séance, chacune avec son matériel et son bonhomme :
// P à la barre de traction, C au sac de boxe, M sur son tapis de yoga, A sur
// son tapis avec la roue, B sur ses parallettes. Le poste choisi s'allume
// (contour qui pulse, faisceau de lumière, poussières qui montent) et son
// bonhomme bouge ; les autres attendent, immobiles.
// Logique pure : une chaîne SVG et les zones à toucher, testées par
// tests/gym.test.js.
import { figureFor, figureSVG, focusFor, solve, barAt, VIEW } from './figures.js';
import { WORKOUTS } from './data.js';
import { HUB, HW, P, r1, pts, poly, flat, box } from './iso.js';
import { decorArt } from './decors.js';

export { HUB };
// couleurs des séances sur le fond sombre de la salle
export const COLORS = { A: '#9fd08f', B: '#7cc4e4', C: '#e98a6b', M: '#c3a3e0', P: '#e7c76b' };

// Postes : séance, exercice montré, coin (X, Y) de la plateforme (S × S
// dalles, PH de haut), échelle du bonhomme. Au fond P, au milieu M, A et C,
// devant B.
const S = 2.3, PH = 0.14;
export const STATIONS = [
  { id: 'P', ex: 'Tractions (selon ton niveau)', X: 0.4, Y: 0.4, s: 1.04 },
  { id: 'M', ex: 'Fente basse (droite)', X: 0.4, Y: 4.3, s: 1.06 },
  { id: 'A', ex: 'Crunch vélo', X: 2.35, Y: 2.35, s: 1.04 },
  { id: 'C', ex: 'Shadow boxing', X: 4.3, Y: 0.4, s: 1.06 },
  { id: 'B', ex: 'Pompes (sur parallettes)', X: 4.4, Y: 4.4, s: 1.04 },
];
const center = (st) => [st.X + S / 2, st.Y + S / 2];
const targetOf = (name) => WORKOUTS.flatMap((w) => w.exercises).find((e) => e.name === name)?.target ?? '';
const shortName = (id) => (WORKOUTS.find((w) => w.id === id)?.name ?? '').split(' · ')[1] ?? '';

// Le bonhomme d'un poste, pieds sur sa plateforme, centré. box : sa place
// dans la salle [x, y, largeur, hauteur].
function place(st, animate) {
  const f = figureFor(st.ex);
  const svg = figureSVG(f.fig, { mirror: f.mirror, fit: true, animate, help: false, focus: focusFor(targetOf(st.ex)) });
  const [bx, by, bw, bh] = svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
  const [x, y] = P(...center(st), PH);
  const tx = x - (bx + bw / 2) * st.s;
  const ty = y - VIEW.floor * st.s;
  return { f, inner: svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, ''), tx, ty, box: [tx + bx * st.s, ty + by * st.s, bw * st.s, bh * st.s] };
}

// Zones à toucher (unités de la salle) : de la tête du bonhomme au bord avant
// de sa plateforme, ZW de large ; une zone ne mord pas sur celle de dessus
// (13 d'écart, car l'appli les agrandit de 6 de chaque côté).
const ZW = 80;
export function hubLayout() {
  const zones = STATIONS.map((st) => {
    const [, figTop] = place(st, false).box;
    const [x, y] = P(...center(st), PH);
    return { id: st.id, x: x - ZW / 2, top: figTop - 4, bottom: y + 18 };
  });
  for (const z of [...zones].sort((a, b) => a.bottom - b.bottom)) {
    for (const u of zones) {
      const sideBySide = Math.abs(u.x - z.x) >= ZW + 12;
      if (u !== z && !sideBySide && u.bottom < z.bottom && z.top < u.bottom + 13) z.top = u.bottom + 13;
    }
  }
  return zones.map((z) => ({ id: z.id, box: [r1(z.x), r1(z.top), ZW, r1(z.bottom - z.top)] }));
}

// La borne d'arcade, contre le mur de gauche entre P et M : elle ouvre les jeux.
// Face avant (vers la salle) : écran, tableau de commande, fronton doré.
const ARC = { X: 0.15, Y: 3.1, w: 0.75, d: 0.8, h: 2.3 };
function arcadeCab(animate) {
  const { X, Y, w, d, h } = ARC;
  const fx = X + w + 0.002; // la face avant
  const face = (y0, y1, z0, z1, fill, extra = '') => poly([P(fx, y0, z0), P(fx, y1, z0), P(fx, y1, z1), P(fx, y0, z1)], fill, extra);
  const blink = animate ? '<animate attributeName="opacity" values="1;0.55;1" dur="2.4s" repeatCount="indefinite"/>' : '';
  // petites cases de couleur à l'écran (un air de Blocs)
  const bits = [[0.25, 1.45, '#7cc4e4'], [0.4, 1.45, '#7cc4e4'], [0.4, 1.3, '#e98a6b'], [0.55, 1.3, '#9fd08f'], [0.25, 1.15, '#e7c76b'], [0.55, 1.15, '#c3a3e0']]
    .map(([dy, z, col]) => face(Y + dy, Y + dy + 0.13, z, z + 0.13, col)).join('');
  return `<g class="hub-arcade">${box(X, Y, 0, w, d, h, ['#2a1f45', '#140e24', '#21183a'])}`
    + `${box(X - 0.03, Y - 0.03, h, w + 0.06, d + 0.06, 0.26, ['#ffd27a', '#a8721c', '#e3a33a'])}`
    + `${face(Y + 0.1, Y + d - 0.1, 1.0, 1.75, '#0b1424', ' stroke="#3a2f5c" stroke-width="0.8"')}<g>${bits}${blink}</g>`
    + `${box(X + w, Y + 0.06, 0.78, 0.22, d - 0.12, 0.1, ['#3a2d63', '#1a1330', '#2b2150'])}`
    + `<circle cx="${r1(P(X + w + 0.12, Y + 0.3, 0.98)[0])}" cy="${r1(P(X + w + 0.12, Y + 0.3, 0.98)[1])}" r="1.6" fill="#e98a6b"/>`
    + `<circle cx="${r1(P(X + w + 0.12, Y + 0.55, 0.92)[0])}" cy="${r1(P(X + w + 0.12, Y + 0.55, 0.92)[1])}" r="1.2" fill="#7cc4e4"/>`
    + `<circle cx="${r1(P(X + w + 0.12, Y + 0.68, 0.92)[0])}" cy="${r1(P(X + w + 0.12, Y + 0.68, 0.92)[1])}" r="1.2" fill="#9fd08f"/></g>`;
}

// Zone à toucher de la borne (unités de la salle) : son fronton et le haut de
// son écran, sans mordre sur les zones des postes.
export function arcadeZone() {
  const [cx] = P(ARC.X + ARC.w, ARC.Y + ARC.d / 2, 0);
  const [, top] = P(ARC.X + ARC.w, ARC.Y + ARC.d / 2, ARC.h + 0.26);
  return [r1(cx - 22), r1(top - 8), 34, 30];
}

// L'étiquette du poste choisi cache-t-elle la pastille d'un autre poste ?
// Rectangles [gauche, haut, largeur, hauteur] ; pad : marge (la lueur de la
// pastille du jour dépasse un peu).
export function covers(tag, badge, pad = 4) {
  const [x1, y1, w1, h1] = tag;
  const [x2, y2, w2, h2] = badge;
  return x1 < x2 + w2 + pad && x2 < x1 + w1 + pad && y1 < y2 + h2 + pad && y2 < y1 + h1 + pad;
}

// ——— matériel ———
// Tour de traction autour des deux bouts de la barre du bonhomme P : montants,
// pieds, dossier, poignées de dips.
function tower(id, p, st, floorY) {
  const s = st.s;
  const [[x1, y1], [x2, y2]] = barAt(solve(p.f.fig.frames[0])).map(([x, y]) => [p.tx + x * s, p.ty + y * s]);
  const post = (x, y, f, w) => `<rect x="${r1(x - w / 2)}" y="${r1(y - 5 * s)}" width="${r1(w * 1.35)}" height="${r1(f - y + 5 * s)}" rx="${r1(w * 0.3)}" fill="url(#${id}-metal)"/>`;
  const foot = (x, f, w) => `<rect x="${r1(x - 7 * s)}" y="${r1(f - w)}" width="${r1(14 * s)}" height="${r1(w)}" rx="${r1(w / 2)}" fill="#2a2522"/>`;
  const dip = (x, y, dir) => `<rect x="${r1(dir > 0 ? x : x - 7 * s)}" y="${r1(y)}" width="${r1(7 * s)}" height="${r1(1.6 * s)}" rx="${r1(0.8 * s)}" fill="url(#${id}-metalh)"/>`;
  const back = floorY - 5 * s;
  return `<g class="hub-tower">${post(x2, y2, back, 2.6 * s)}${foot(x2, back, 1.6 * s)}`
    + `<rect x="${r1(Math.min(x1, x2) + 2 * s)}" y="${r1(y2 + 22 * s)}" width="${r1(Math.abs(x1 - x2) - 4 * s)}" height="${r1(14 * s)}" rx="${r1(2 * s)}" fill="url(#${id}-pad)" opacity="0.9"/>`
    + `${dip(x2, y2 + 38 * s, -1)}${post(x1, y1, floorY, 3 * s)}${foot(x1, floorY, 1.8 * s)}${dip(x1, y1 + 38 * s, 1)}</g>`;
}

// Sac de boxe pendu à une potence fixée au mur, devant les poings du bonhomme C.
function bag(id, p, st) {
  const s = st.s;
  const cx = r1(p.tx + 93 * s), top = r1(p.ty + 13 * s), bottom = r1(p.ty + 52 * s), w = r1(13 * s);
  const ceil = r1(P(7.4, 0.2, HW)[1] + 6);
  const band = (y) => `<rect x="${r1(cx - w / 2)}" y="${r1(y)}" width="${w}" height="${r1(w * 0.12)}" fill="#c98059" fill-opacity="0.9"/>`;
  return `<g class="hub-bag"><path d="M${r1(cx - w * 1.4)} ${ceil}H${r1(cx + w * 0.3)}" stroke="#3a3532" stroke-width="${r1(w * 0.22)}" stroke-linecap="round"/>`
    + `<path d="M${cx} ${ceil}V${r1(top - w * 0.4)}L${r1(cx - w * 0.38)} ${top}M${cx} ${r1(top - w * 0.4)}L${r1(cx + w * 0.38)} ${top}" stroke="#8a7a6b" stroke-width="${r1(w * 0.07)}" fill="none"/>`
    + `<rect x="${r1(cx - w / 2)}" y="${top}" width="${w}" height="${r1(bottom - top)}" rx="${r1(w * 0.42)}" fill="url(#${id}-bag)"/>`
    + `${band(top + (bottom - top) * 0.12)}${band(bottom - (bottom - top) * 0.2)}</g>`;
}

// Porte-élastiques : un montant et tes 4 élastiques (noir, violet, vert, orange).
function bands(x, y, s) {
  const loops = ['#1b1a1a', '#6d4bb3', '#4f8a43', '#e07a2e'].map((c, i) => {
    const hx = x + (i - 1.5) * 3.4 * s;
    return `<path d="M${r1(hx)} ${r1(y - 40 * s)}c${r1(-1.6 * s)} ${r1(6 * s)} ${r1(-1.4 * s)} ${r1(20 * s)} 0 ${r1(26 * s)}c${r1(1.4 * s)} ${r1(-6 * s)} ${r1(1.6 * s)} ${r1(-20 * s)} 0 ${r1(-26 * s)}" fill="none" stroke="${c}" stroke-width="${r1(1.3 * s)}" stroke-linecap="round"/>`;
  }).join('');
  return `<g class="hub-bands"><rect x="${r1(x - 8 * s)}" y="${r1(y - 43 * s)}" width="${r1(16 * s)}" height="${r1(2 * s)}" rx="${r1(s)}" fill="#3a3532"/><rect x="${r1(x - 0.9 * s)}" y="${r1(y - 42 * s)}" width="${r1(1.8 * s)}" height="${r1(42 * s)}" fill="#2a2522"/><rect x="${r1(x - 6 * s)}" y="${r1(y - 1.2 * s)}" width="${r1(12 * s)}" height="${r1(1.4 * s)}" rx="${r1(0.7 * s)}" fill="#2a2522"/>${loops}</g>`;
}

// Plante en pot pour le coin yoga.
function plant(id, x, y, s) {
  const leaf = (dx, dy, rot, sc) => `<ellipse cx="${r1(x + dx * s)}" cy="${r1(y + dy * s)}" rx="${r1(5 * s * sc)}" ry="${r1(3 * s * sc)}" transform="rotate(${rot} ${r1(x + dx * s)} ${r1(y + dy * s)})" fill="url(#${id}-leaf)"/>`;
  return `<g class="hub-plant">${leaf(-5, -20, -35, 1)}${leaf(5, -22, 30, 1.05)}${leaf(-2, -27, -80, 0.9)}${leaf(7, -14, 15, 0.85)}${leaf(-7, -13, -15, 0.85)}<path d="M${r1(x - 5 * s)} ${r1(y - 10 * s)}H${r1(x + 5 * s)}L${r1(x + 4 * s)} ${r1(y)}H${r1(x - 4 * s)}Z" fill="#b8714c"/><rect x="${r1(x - 5.4 * s)}" y="${r1(y - 11 * s)}" width="${r1(10.8 * s)}" height="${r1(1.6 * s)}" rx="${r1(0.6 * s)}" fill="#d08a62"/></g>`;
}

// Roue abdominale posée au sol.
function wheel(x, y) {
  return `<g class="hub-wheel"><circle cx="${r1(x)}" cy="${r1(y - 3.1)}" r="3.3" fill="#3a3532" stroke="#c98059" stroke-width="0.6"/><rect x="${r1(x - 5)}" y="${r1(y - 3.8)}" width="10" height="1.5" rx="0.75" fill="#2a2522"/></g>`;
}

// La salle entière. pick : poste choisi (son bonhomme bouge si animate) ;
// id : préfixe des identifiants internes ; decor : son habillage (decors.js).
export function hubSVG({ pick = 'A', animate = true, id = 'hub', decor = 'salle' } = {}) {
  const u = (n) => `${id}-${n}`;
  // murs, sol, lumière et objets : ceux du décor ; la borne d'arcade est dans tous
  const art = decorArt(decor, { pick, title: shortName(pick), animate, u });

  // les postes, du fond vers l'avant : plateforme bordée de la couleur de la
  // séance, matériel, bonhomme
  const ST = Object.fromEntries(STATIONS.map((st) => [st.id, st]));
  const order = [...STATIONS].sort((a, b) => (a.X + a.Y) - (b.X + b.Y));
  const stations = order.map((st) => {
    const on = st.id === pick;
    const p = place(st, on && animate);
    const [cx, cy] = center(st);
    const col = COLORS[st.id];
    const pulse = on && animate ? '<animate attributeName="stroke-opacity" values="1;0.45;1" dur="1.8s" repeatCount="indefinite"/>' : '';
    const edge = `<path class="hub-edge" d="M${pts([P(st.X + 0.08, st.Y + 0.08, PH), P(st.X + S - 0.08, st.Y + 0.08, PH), P(st.X + S - 0.08, st.Y + S - 0.08, PH), P(st.X + 0.08, st.Y + S - 0.08, PH)])}Z" fill="none" stroke="${col}" stroke-width="${on ? 1.6 : 0.8}" stroke-opacity="${on ? 1 : 0.5}"${on ? ` filter="url(#${u('glow')})"` : ''}>${pulse}</path>`;
    const plat = `<g class="hub-plat">${box(st.X, st.Y, 0, S, S, PH, art.plat)}${edge}</g>`;
    const gear = {
      P: () => tower(id, p, st, P(cx, cy, PH)[1]),
      M: () => flat(cx - 0.9, cy - 0.45, PH + 0.01, 1.8, 0.9, '#7f9f78'),
      A: () => flat(cx - 0.95, cy - 0.5, PH + 0.01, 1.9, 1.0, '#3a3330', ' stroke="#c98059" stroke-width="0.6"'),
      C: () => bag(id, p, st),
      B: () => flat(cx - 0.9, cy - 0.55, PH + 0.01, 1.8, 1.1, `url(#${u('wood')})`),
    }[st.id]();
    const after = {
      P: '', C: '',
      M: plant(id, ...P(st.X + 0.3, st.Y + 2.0, PH), 1.1),
      A: wheel(...P(st.X + 1.95, st.Y + 1.7, PH)),
      B: bands(...P(st.X + 2.1, st.Y + 0.25, PH), 0.9),
    }[st.id];
    return `<g class="hub-st st-${st.id} wo-${st.id}${on ? ' on' : ''}">${plat}${gear}<g class="fig" transform="translate(${r1(p.tx)} ${r1(p.ty)}) scale(${st.s})">${p.inner}</g>${after}</g>`;
  }).join('');

  // faisceau de lumière sur le poste choisi, et des poussières qui y montent
  const [bx, by] = center(ST[pick] ?? ST.A);
  const top = P(bx, by, HW + 1.2), left = P(bx - 1.0, by + 1.0, PH), right = P(bx + 1.0, by - 1.0, PH);
  const beam = `<path class="hub-beam" d="M${r1(top[0] - 6)} ${r1(top[1])}L${r1(top[0] + 6)} ${r1(top[1])}L${r1(right[0])} ${r1(right[1])}L${r1(left[0])} ${r1(left[1])}Z" fill="url(#${u('beam')})"/>`;
  const [fx, fy] = P(bx, by, PH);
  const dust = animate ? `<g class="hub-dust" fill="${art.dust}">${[[-14, 0, 2.6], [-6, 0.9, 3.4], [3, 0.3, 2.9], [10, 1.6, 3.8], [16, 1.1, 3.1], [-1, 2.2, 4.2]].map(([dx, delay, dur]) => `<circle cx="${r1(fx + dx)}" cy="${r1(fy - 6)}" r="0.9" opacity="0"><animate attributeName="cy" values="${r1(fy - 6)};${r1(fy - 78)}" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0.8;0" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/></circle>`).join('')}</g>` : '';

  const [c1, c2] = art.beam;
  return `<svg class="hub-scene" viewBox="0 0 ${HUB.w} ${HUB.h}" aria-hidden="true"><defs>${art.defs}
<linearGradient id="${u('wood')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a5f3e"/><stop offset="1" stop-color="#5e3d26"/></linearGradient>
<linearGradient id="${u('beam')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}" stop-opacity="0.02"/><stop offset="0.7" stop-color="${c2}" stop-opacity="0.12"/><stop offset="1" stop-color="${c2}" stop-opacity="0.3"/></linearGradient>
<linearGradient id="${u('metal')}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1d1a18"/><stop offset="0.45" stop-color="#5a524c"/><stop offset="1" stop-color="#211d1b"/></linearGradient>
<linearGradient id="${u('metalh')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a615a"/><stop offset="1" stop-color="#26211f"/></linearGradient>
<linearGradient id="${u('bag')}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1c120c"/><stop offset="0.38" stop-color="#6b4430"/><stop offset="1" stop-color="#20140e"/></linearGradient>
<linearGradient id="${u('pad')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3330"/><stop offset="1" stop-color="#1c1816"/></linearGradient>
<radialGradient id="${u('leaf')}" cx="0.4" cy="0.3" r="0.8"><stop offset="0" stop-color="#7fae6b"/><stop offset="1" stop-color="#2f5a2c"/></radialGradient>
<radialGradient id="${u('vig')}" cx="0.5" cy="0.42" r="0.75"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${art.vig}"/></radialGradient>
<filter id="${u('glow')}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect width="${HUB.w}" height="${HUB.h}" fill="${art.bg}"/>
${art.back}
${art.floor}${art.edge}<g class="hub-decor">${art.props}${arcadeCab(animate)}</g>
${stations}${art.over}<g class="hub-light">${beam}${dust}</g><rect class="hub-vig" width="${HUB.w}" height="${HUB.h}" fill="url(#${u('vig')})"/></svg>`;
}
