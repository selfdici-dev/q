// Les décors de la Salle : la même pièce (les mêmes postes, la même borne),
// habillée autrement (murs, sol, lumière, objets, petites animations sans
// son). On choisit librement parmi ceux qu'on a débloqués ; les débloquer est
// dur : des séances, ton niveau, tes records à l'arcade (calculés, jamais
// stockés). Logique pure : des chaînes SVG, testées par tests/decors.test.js.
import { HUB, N, HW, P, SKEW, r1, pts, poly, flat, box, lw, rw, onL, onR } from './iso.js';
import { levelInfo, totalXP } from './logic.js';
import { routineStatus } from './routines.js';

// Du plus facile au plus dur.
export const DECORS = [
  { id: 'salle', name: 'La salle', desc: 'Mur sombre, grille et logo de cuivre, bandes LED.', need: null },
  { id: 'grec', name: 'Temple grec', desc: 'Marbre et colonnes au-dessus des nuages, au coucher du soleil.', need: { kind: 'workouts', n: 15 } },
  { id: 'foret', name: 'Forêt au crépuscule', desc: 'Un ponton de bois sous les arbres, des lucioles, une guirlande.', need: { kind: 'routines', n: 20 } },
  { id: 'dojo', name: 'Dojo', desc: 'Bois, papier de riz, tatamis, lanternes et pétales de cerisier.', need: { kind: 'blocs', n: 3000 } },
  { id: 'toit', name: 'Toit de la ville', desc: 'En haut d’une tour, la nuit, au milieu des gratte-ciel.', need: { kind: 'calc', n: 30 } },
  { id: 'ocean', name: 'Fond marin', desc: 'Des vitres sur la mer, des poissons, des bulles et un trésor.', need: { kind: 'sudoku', n: 10 } },
  { id: 'medieval', name: 'Grand hall', desc: 'Pierre, feu de cheminée, torches, blason noir et or.', need: { kind: 'workouts', n: 40 } },
  { id: 'neon', name: 'Néon rétro', desc: 'Soleil à rayures, palmiers de néon, sol quadrillé qui défile.', need: { kind: 'gems', n: 8 } },
  { id: 'station', name: 'Station spatiale', desc: 'Hublots sur les étoiles et une planète bleue.', need: { kind: 'level', n: 12 } },
  { id: 'arene', name: 'Arène romaine', desc: 'Du sable, des arches, la foule qui t’encourage, des braseros.', need: { kind: 'workouts', n: 60 } },
  { id: 'plage', name: 'Ponton sur la mer', desc: 'Le soleil se couche sur l’eau, les mouettes passent.', need: { kind: 'blocs', n: 6000 } },
  { id: 'sommet', name: 'Sommet', desc: 'En haut de la montagne, sous une aurore boréale.', need: { kind: 'level', n: 20 } },
];

const fmt = (n) => Number(n).toLocaleString('fr-FR');
const NEED = {
  workouts: (h, n) => `${fmt(h)} / ${fmt(n)} séances`,
  level: (h, n) => `niveau ${h} / ${n}`,
  blocs: (h, n) => `${fmt(h)} / ${fmt(n)} points aux Blocs`,
  calc: (h, n) => `${fmt(h)} / ${fmt(n)} points au Calcul éclair`,
  gems: (h, n) => `niveau ${h} / ${n} aux Cristaux`,
  sudoku: (h, n) => `${fmt(h)} / ${fmt(n)} sudokus résolus`,
  routines: (h, n) => `${fmt(h)} / ${fmt(n)} matins avec ta routine`,
};

// Tes chiffres pour les décors, recalculés depuis tes données : séances
// faites (sans M, chacune une fois par jour), niveau, meilleures parties,
// niveaux réussis aux Cristaux, sudokus résolus, matins avec ta routine.
export function decorStats(state) {
  const days = Object.values(state.days ?? {});
  const b = state.games?.blocs ?? {};
  return {
    workouts: days.reduce((n, d) => n + new Set((d.workouts ?? []).filter((w) => w !== 'M')).size, 0),
    level: levelInfo(totalXP(state)).level,
    blocs: Math.max(b.best ?? 0, b.cur?.score ?? 0),
    calc: state.games?.calc?.best ?? 0,
    gems: state.games?.cristaux?.top ?? 0,
    sudoku: Object.values(state.games?.sudoku?.solved ?? {}).reduce((n, x) => n + (Number(x) || 0), 0),
    routines: days.filter((d) => routineStatus(d.routine, 'matin').complete).length,
  };
}

// Où tu en es pour chaque décor. stats : { workouts, level, blocs, calc, gems, sudoku, routines }.
export function decorStatus(stats = {}) {
  return DECORS.map((d) => {
    if (!d.need) return { ...d, unlocked: true, pct: 1, label: 'Ouvert dès le départ' };
    const have = Math.max(0, Math.floor(Number(stats[d.need.kind]) || 0));
    const unlocked = have >= d.need.n;
    return { ...d, unlocked, pct: Math.min(1, have / d.need.n), label: unlocked ? 'Débloqué' : NEED[d.need.kind](Math.min(have, d.need.n), d.need.n) };
  });
}

// Le décor à montrer : celui choisi s'il est débloqué, sinon la salle.
export function decorToShow(chosen, stats) {
  return decorStatus(stats).find((d) => d.id === chosen)?.unlocked ? chosen : 'salle';
}

// Les décors débloqués qu'on ne t'a pas encore annoncés (la salle : jamais).
export function newDecors(seen, stats) {
  const known = new Set(Array.isArray(seen) ? seen : []);
  return decorStatus(stats).filter((d) => d.need && d.unlocked && !known.has(d.id));
}

// ---------- outils de dessin ----------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const stops = (list) => list.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}"${a < 1 ? ` stop-opacity="${a}"` : ''}/>`).join('');
const lin = (id, [x1, y1, x2, y2], list) => `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops(list)}</linearGradient>`;
const rad = (id, list, extra = '') => `<radialGradient id="${id}"${extra}>${stops(list)}</radialGradient>`;
const wallL = (fill) => poly([P(0, 0), P(0, N), P(0, N, HW), P(0, 0, HW)], fill);
const wallR = (fill) => poly([P(0, 0), P(N, 0), P(N, 0, HW), P(0, 0, HW)], fill);
const floorPoly = (fill) => poly([P(0, 0), P(N, 0), P(N, N), P(0, N)], fill);
const tiles = (stroke, op, w = 0.6) => {
  const l = [];
  for (let i = 1; i < N; i++) l.push(`M${pts([P(i, 0), P(i, N)])}M${pts([P(0, i), P(N, i)])}`);
  return `<path d="${l.join('')}" stroke="${stroke}" stroke-opacity="${op}" stroke-width="${w}" fill="none"/>`;
};
const cap = (color, w = 2.2) => `<path d="M${pts([P(0, N, HW), P(0, 0, HW), P(N, 0, HW)])}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
// dessin à plat sur un mur : un repère local (x vers la droite du mur, y vers le bas)
const onRight = (x, z, inner) => { const [a, b] = rw(x, z); return `<g transform="translate(${r1(a)} ${r1(b)}) skewY(${SKEW})">${inner}</g>`; };
const onLeft = (y, z, inner) => { const [a, b] = lw(y, z); return `<g transform="translate(${r1(a)} ${r1(b)}) skewY(${-SKEW})">${inner}</g>`; };
const say = (pick, title, { fill = '#e9a87c', sub = '#f4eee7', size = 6.4, font = 'system-ui, sans-serif', x = 0, anchor = 'start' } = {}) =>
  `<text x="${x}" text-anchor="${anchor}" font-family="${font}" font-weight="800" font-size="${size}" fill="${fill}" letter-spacing="0.6">SÉANCE ${pick}</text>`
  + `<text x="${x}" y="${r1(size * 1.3)}" text-anchor="${anchor}" font-family="${font}" font-weight="700" font-size="${r1(size * 0.875)}" fill="${sub}">${esc(title.replace(/,.*$/, ''))}…</text>`;
// hasard fixe (pour des fenêtres, des étoiles…) : toujours le même dessin
const hash = (k) => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const flame = (x, y, s, animate, k = 0) => {
  const f = `<path d="M${r1(x)} ${r1(y)}c${r1(-2.4 * s)} ${r1(-2.2 * s)} ${r1(-1.6 * s)} ${r1(-5.2 * s)} 0 ${r1(-8 * s)}c${r1(1.7 * s)} ${r1(2.6 * s)} ${r1(2.6 * s)} ${r1(5.4 * s)} 0 ${r1(8 * s)}z" fill="#ffb347"/>`
    + `<path d="M${r1(x)} ${r1(y)}c${r1(-1.2 * s)} ${r1(-1.3 * s)} ${r1(-0.8 * s)} ${r1(-3.1 * s)} 0 ${r1(-4.6 * s)}c${r1(0.9 * s)} ${r1(1.5 * s)} ${r1(1.3 * s)} ${r1(3.2 * s)} 0 ${r1(4.6 * s)}z" fill="#fff1b8"/>`;
  return animate
    ? `<g style="transform-box: fill-box; transform-origin: 50% 100%"><animateTransform attributeName="transform" type="scale" values="1 1;0.92 1.08;1.05 0.94;1 1" dur="${(0.9 + 0.2 * (k % 3)).toFixed(1)}s" repeatCount="indefinite" additive="sum"/>${f}</g>`
    : f;
};
const pulse = (values, dur, animate, extra = '') => (animate ? `<animate attributeName="opacity" values="${values}" dur="${dur}s" repeatCount="indefinite"${extra}/>` : '');
const glow = (x, y, r, id, animate, k = 0) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r}" fill="url(#${id})">${pulse('0.85;1;0.75;0.95;0.85', (1.6 + 0.3 * (k % 3)).toFixed(1), animate)}</circle>`;
// un groupe qui va et vient (nuages, bateau) ou qui tourne un peu autour d'un point (palmes)
const drift = (inner, dx, dur, animate, dy = 0) => (animate ? `<g>${inner}<animateTransform attributeName="transform" type="translate" values="0 0;${dx} ${dy};0 0" dur="${dur}s" repeatCount="indefinite"/></g>` : `<g>${inner}</g>`);
const sway = (inner, x, y, deg, dur, animate) => (animate ? `<g>${inner}<animateTransform attributeName="transform" type="rotate" values="${-deg} ${r1(x)} ${r1(y)};${deg} ${r1(x)} ${r1(y)};${-deg} ${r1(x)} ${r1(y)}" dur="${dur}s" repeatCount="indefinite"/></g>` : `<g>${inner}</g>`);
// des choses qui tombent (pétales, flocons) ou qui montent (braises) : chacune
// part de (x, y), va de (dx, dy) en dur secondes, en tournant de rot degrés
const fall = (list, shape, animate) => (animate ? list.map(([x, y, dx, dy, dur, delay, rot = 0]) => `<g transform="translate(${r1(x)} ${r1(y)})" opacity="0"><g>${shape}${rot ? `<animateTransform attributeName="transform" type="rotate" values="0;${rot}" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/>` : ''}</g>`
  + `<animateTransform attributeName="transform" type="translate" values="${r1(x)} ${r1(y)};${r1(x + dx)} ${r1(y + dy)}" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/>`
  + `<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.85;1" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/></g>`).join('') : '');
const cloud = (x, y, s, lit, shade) => `<g transform="translate(${r1(x)} ${r1(y)}) scale(${s})"><ellipse cy="4" rx="27" ry="6.5" fill="${shade}"/><ellipse cx="-11" cy="0" rx="12" ry="7.5" fill="${lit}"/><ellipse cx="5" cy="-3.5" rx="14" ry="10" fill="${lit}"/><ellipse cx="18" cy="1.5" rx="9" ry="6" fill="${lit}"/></g>`;
const starField = (n, k0, h, fill = '#fff') => Array.from({ length: n }, (_, k) => `<circle cx="${r1(hash(k + k0) * HUB.w)}" cy="${r1(hash(k + k0 + 99) * h)}" r="${hash(k + k0 + 7) > 0.85 ? 1.1 : 0.6}" fill="${fill}" opacity="${r1(0.4 + 0.6 * hash(k + k0 + 3))}"/>`).join('');
// un écriteau sur deux poteaux, au bord droit (y = 0) : il affiche la séance
const signboard = (x0, x1, z0, z1, wood, posts, text) => `${box(x0 + 0.12, -0.14, 0, 0.1, 0.1, z1, posts)}${box(x1 - 0.22, -0.14, 0, 0.1, 0.1, z1, posts)}`
  + `<g class="hub-screen">${onR(x0, x1, z0, z1, wood, ' stroke="#3b2717" stroke-width="0.8"')}${text}</g>`;

// ---------- les décors ----------
// Chacun renvoie : defs, back (fond et murs), floor (sol), edge (pied des murs),
// props (objets posés près des murs), over (par-dessus les postes : lueurs,
// pétales, flocons…), beam (couleurs de la lumière du poste choisi), dust,
// plat (plateformes : dessus, gauche, droite), vig (vignette), bg (fond).

function salle({ u, pick, title }) {
  // grille et logo de cuivre au mur de gauche, au-dessus du poste M (la borne d'arcade cache le milieu)
  const grid = [];
  for (let y = 4.1; y <= 6.55; y += 0.48) grid.push(`M${pts([lw(y, 0.9), lw(y, 2.85)])}`);
  for (let z = 0.9; z <= 2.9; z += 0.48) grid.push(`M${pts([lw(4.1, z), lw(6.5, z)])}`);
  const lc = [5.3, 1.9];
  const needle = [[0, 0.75], [0.5, 0], [0, -0.75], [-0.5, 0]].map(([dy, dz]) => lw(lc[0] + dy, lc[1] + dz));
  const mid = lw(...lc);
  const facet = (a, b, f) => poly([a, b, mid], f);
  const gloves = (() => {
    const [x, y] = rw(6.85, 1.9);
    const g = (dx, rot) => `<g transform="translate(${r1(x + dx)} ${r1(y)}) rotate(${rot})"><path d="M-3 0c0-4 6-4 6 0v5c0 2-6 2-6 0z" fill="#9b3b2a"/><rect x="-2.6" y="5" width="5.2" height="2.4" rx="0.6" fill="#efe7dd"/></g>`;
    return `<g class="hub-gloves"><path d="M${r1(x - 4)} ${r1(y - 3)}L${r1(x)} ${r1(y - 6)}L${r1(x + 4)} ${r1(y - 3)}" stroke="#8a7a6b" stroke-width="0.5" fill="none"/>${g(-3.2, 8)}${g(3.2, -8)}</g>`;
  })();
  const f = (dx, dy) => P(4 + dx, 4 + dy, 0.01);
  return {
    bg: '#0c0a09',
    defs: lin(u('wallL'), [0, 0, 1, 0], [[0, '#120f0d'], [1, '#1c1714']]) + lin(u('wallR'), [0, 0, 1, 0], [[0, '#211b17'], [1, '#16120f']])
      + lin(u('floor'), [0, 0, 0, 1], [[0, '#1d1917'], [1, '#2a2420']])
      + lin(u('ledL'), [0, 0, 1, 0], [[0, '#f2c3a3', 0.22], [1, '#f2c3a3', 0]]) + lin(u('ledR'), [1, 0, 0, 0], [[0, '#f2c3a3', 0.22], [1, '#f2c3a3', 0]])
      + lin(u('mirror'), [0, 0, 1, 1], [[0, '#2a2a2e'], [0.5, '#17181b'], [1, '#222326']]),
    back: `${wallL(`url(#${u('wallL')})`)}${wallR(`url(#${u('wallR')})`)}<path d="${grid.join('')}" stroke="#dc9a70" stroke-opacity="0.18" stroke-width="0.5"/>`
      + `<g class="hub-logo">${facet(needle[2], needle[3], '#f3c9a8')}${facet(needle[2], needle[1], '#d9956b')}${facet(needle[3], needle[0], '#b8714c')}${facet(needle[1], needle[0], '#8f5232')}</g>`
      + onR(4.6, 6.7, 0.5, 2.6, `url(#${u('mirror')})`, ' stroke="#4a3a2e" stroke-width="0.8"')
      + `<g class="hub-screen">${onR(1.9, 4.2, 1.5, 2.75, '#0a0807', ' stroke="#3a2a20" stroke-width="0.8"')}${onRight(2.1, 2.4, say(pick, title))}</g>${gloves}`,
    floor: `${floorPoly(`url(#${u('floor')})`)}${tiles('#000', 0.4)}<g opacity="0.35">${poly([f(-0.9, -0.9), f(0, 0), f(0.9, -0.9)], '#d9956b')}${poly([f(0.9, -0.9), f(0, 0), f(0.9, 0.9)], '#b8714c')}${poly([f(0.9, 0.9), f(0, 0), f(-0.9, 0.9)], '#8f5232')}${poly([f(-0.9, 0.9), f(0, 0), f(-0.9, -0.9)], '#f3c9a8')}</g>`,
    edge: `<g class="hub-led">${poly([P(0, 0), P(0, N), P(0.9, N), P(0.9, 0)], `url(#${u('ledL')})`)}${poly([P(0, 0), P(N, 0), P(N, 0.9), P(0, 0.9)], `url(#${u('ledR')})`)}`
      + `${poly([P(0, 0, 0.1), P(0, N, 0.1), P(0, N, 0.2), P(0, 0, 0.2)], '#f6d2b6', ' opacity="0.9"')}${poly([P(0, 0, 0.1), P(N, 0, 0.1), P(N, 0, 0.2), P(0, 0, 0.2)], '#f6d2b6', ' opacity="0.9"')}</g>${cap('#5a4a3e')}`,
    props: `<g class="hub-treadmill">${box(2.85, 0.35, 0, 1.3, 0.75, 0.2, ['#2a2522', '#1a1614', '#221d1a'])}${box(2.87, 0.4, 0.2, 1.22, 0.65, 0.03, ['#111', '#111', '#111'])}${box(2.8, 0.3, 0.2, 0.12, 0.85, 1.3, ['#3a3532', '#2a2522', '#332d2a'])}${box(2.76, 0.35, 1.45, 0.2, 0.75, 0.24, ['#1c1816', '#151210', '#1c1816'])}</g>`,
    beam: ['#ffe2c4', '#ffd2a8'], dust: '#ffe2c4',
    plat: ['#2b2523', '#171311', '#1f1a18'], vig: 0.55,
  };
}

function grec({ u, pick, title, animate }) {
  const pil = (side, a) => {
    const at = side === 'L' ? onL : onR;
    const q = side === 'L' ? lw : rw;
    const flutes = [0.08, 0.15, 0.22].map((d) => `M${pts([q(a + d, 0.15), q(a + d, HW - 0.45)])}`).join('');
    return at(a, a + 0.3, 0, HW - 0.3, '#f8f3e9') + `<path d="${flutes}" stroke="#cdbfa6" stroke-width="0.6"/>`
      + at(a - 0.06, a + 0.36, HW - 0.46, HW - 0.3, '#ebe1cd') + at(a - 0.05, a + 0.35, 0, 0.14, '#e4d9c3');
  };
  // frise grecque : une ligne en créneaux tout le long des deux murs
  const key = (side) => {
    const p = [];
    const q = side === 'L' ? lw : rw;
    for (let t = 0; t < N; t += 0.36) p.push(q(t, HW - 0.25), q(t, HW - 0.06), q(t + 0.18, HW - 0.06), q(t + 0.18, HW - 0.25));
    return `<path d="M${pts(p)}" stroke="#7b5e2e" stroke-width="0.8" fill="none"/>`;
  };
  // couronne de laurier dorée, ouverte en haut, nouée en bas
  const leaf = (a, r, k) => {
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    return `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="2.9" ry="1.2" transform="rotate(${r1((a * 180) / Math.PI + 90)} ${r1(x)} ${r1(y)})" fill="${k % 2 ? '#c08a2c' : '#e2b448'}"/>`;
  };
  const wreath = [];
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    const r = 8.6 + (i % 2 ? 1.3 : -0.5);
    wreath.push(leaf(((100 + t * 135) * Math.PI) / 180, r, i), leaf(((80 - t * 135) * Math.PI) / 180, r, i + 1));
  }
  const bow = '<path d="M0 9.4l-3.2 4.2M0 9.4l3.2 4.2" stroke="#c08a2c" stroke-width="1.2" stroke-linecap="round"/><circle cy="9.2" r="1.4" fill="#e2b448"/>';
  // le temple est posé sur trois marches, au-dessus d'une mer de nuages
  const steps = [3, 2, 1].map((k) => box(-0.32 * k, -0.32 * k, -0.3 * k, N + 0.64 * k, N + 0.64 * k, 0.3, ['#efe6d6', '#c4b59a', '#dcd0ba'])).join('');
  const low = [[18, 300, 1.3, 26], [338, 292, 1.2, 31], [62, 356, 1.6, 23], [300, 352, 1.5, 28], [178, 430, 1.9, 34], [30, 440, 1.4, 29], [336, 446, 1.6, 25]]
    .map(([x, y, s, d], k) => drift(cloud(x, y, s, '#f7d6b6', '#d9a08c'), k % 2 ? -12 : 12, d, animate)).join('');
  const high = [[52, 64, 0.85, 40], [300, 46, 0.75, 46], [258, 96, 0.55, 37]]
    .map(([x, y, s, d], k) => `<g opacity="0.75">${drift(cloud(x, y, s, '#f2bfa4', '#a8708a'), k % 2 ? 16 : -16, d, animate)}</g>`).join('');
  const checker = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if ((i + j) % 2) checker.push(flat(i, j, 0, 1, 1, '#dcd0bb'));
  return {
    bg: `url(#${u('sky')})`,
    defs: lin(u('sky'), [0, 0, 0, 1], [[0, '#2b2140'], [0.35, '#8f5a5f'], [0.62, '#e2a06a'], [1, '#f3c486']])
      + lin(u('wallL'), [0, 0, 1, 0], [[0, '#d8cdb9'], [1, '#efe7d8']]) + lin(u('wallR'), [0, 0, 1, 0], [[0, '#f4ecdf'], [1, '#d9cdb8']])
      + lin(u('floor'), [0, 0, 0, 1], [[0, '#efe7d8'], [1, '#d5c9b2']]),
    back: `${high}${low}${steps}${wallL(`url(#${u('wallL')})`)}${wallR(`url(#${u('wallR')})`)}`
      + [0.45, 2.35, 4.45, 6.35].map((a) => pil('L', a)).join('') + [0.45, 1.45, 4.55, 6.35].map((a) => pil('R', a)).join('')
      + onL(0, N, HW - 0.3, HW, '#d8c497') + onR(0, N, HW - 0.3, HW, '#d8c497') + key('L') + key('R')
      + onRight(3.05, 2.28, `<g class="hub-wreath">${wreath.join('')}${bow}</g>`)
      + `<g class="hub-screen">${onR(2.05, 4.05, 1.0, 1.72, '#e6dcc8', ' stroke="#b9a988" stroke-width="0.8"')}${onRight(2.25, 1.55, say(pick, title, { fill: '#6b4f22', sub: '#5a4a35', font: 'Georgia, serif' }))}</g>`,
    floor: `${floorPoly(`url(#${u('floor')})`)}<g opacity="0.55">${checker.join('')}</g>${tiles('#a8987a', 0.35)}`,
    edge: cap('#bfae8c', 2.6) + poly([P(0, 0, 0), P(0, N, 0), P(0, N, 0.16), P(0, 0, 0.16)], '#d8ccb4') + poly([P(0, 0, 0), P(N, 0, 0), P(N, 0, 0.16), P(0, 0, 0.16)], '#e2d6bf'),
    props: '',
    beam: ['#fff3cf', '#ffe2a0'], dust: '#fff0c8',
    plat: ['#eee7da', '#bdb3a1', '#d5cbb8'], vig: 0.3,
  };
}

function medieval({ u, pick, title, animate }) {
  // assises de pierre : un joint horizontal tous les 0,38, des joints verticaux décalés
  const stones = (side) => {
    const q = side === 'L' ? lw : rw;
    const d = [];
    for (let k = 1, z = 0.38; z < HW; k++, z += 0.38) {
      d.push(`M${pts([q(0, z), q(N, z)])}`);
      for (let t = (k % 2) * 0.42; t < N; t += 0.84) d.push(`M${pts([q(t, z - 0.38), q(t, z)])}`);
    }
    return `<path d="${d.join('')}" stroke="#14100d" stroke-opacity="0.7" stroke-width="0.7" fill="none"/>`;
  };
  // blason noir et or : épée, couronne
  const shield = '<g transform="scale(0.9)"><path d="M-17 -20h34v14c0 13-8 22-17 27c-9-5-17-14-17-27z" fill="#111" stroke="#d4a63c" stroke-width="2.2"/>'
    + '<path d="M0 -14v26M-5 -11h10" stroke="#d4a63c" stroke-width="2.4" stroke-linecap="round"/><path d="M-2.5 12l2.5 5 2.5-5z" fill="#d4a63c"/>'
    + '<path d="M-8 -26l3 4 3-5 2 5 2-5 3 5 3-4-1.5 6h-13z" fill="#d4a63c"/></g>';
  const banner = (x) => onRight(x, 2.75, '<path d="M-5 0h10v26l-5-5-5 5z" fill="#141210" stroke="#d4a63c" stroke-width="1"/><path d="M-2.5 6h5M-2.5 10h5" stroke="#d4a63c" stroke-width="1"/>');
  const torch = (side, a, k) => {
    const [x, y] = side === 'L' ? lw(a, 1.85) : rw(a, 1.85);
    return `<g class="hub-torch">${glow(x, y - 7, 16, u('tglow'), animate, k)}<path d="M${r1(x)} ${r1(y + 6)}l-1.6-7h3.2z" fill="#4a3424"/>${flame(x, y - 1, 1.1, animate, k)}</g>`;
  };
  // cheminée contre le mur de gauche, derrière le poste M
  const fy0 = 4.8, fy1 = 6.5;
  const front = (y0, y1, z0, z1, fill) => poly([P(0.33, y0, z0), P(0.33, y1, z0), P(0.33, y1, z1), P(0.33, y0, z1)], fill);
  const [fx, fz] = P(0.34, 5.65, 0.12);
  const fire = `${front(5.1, 6.2, 0, 1.0, '#0b0705')}${flame(fx - 5, fz, 1.5, animate, 1)}${flame(fx + 4, fz - 1, 1.9, animate, 2)}${flame(fx, fz + 1, 1.3, animate, 0)}`
    + `<path d="M${pts([P(0.34, 5.3, 0.05), P(0.34, 6.0, 0.12)])}" stroke="#3a2416" stroke-width="2.6" stroke-linecap="round"/>`;
  // braises qui s'échappent du feu et montent
  const embers = fall([[-3, -4, -6, -46, 2.6, 0], [3, -6, 5, -52, 3.1, 0.8], [0, -3, -2, -40, 2.2, 1.5], [5, -5, 9, -58, 3.4, 2.1], [-6, -4, -10, -44, 2.8, 2.7]]
    .map(([dx, dy, mx, my, d, b]) => [fx + dx, fz + dy, mx, my, d, b]), '<circle r="0.9" fill="#ffb347"/>', animate);
  const flagstones = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (hash(i * 7 + j) > 0.55) flagstones.push(flat(i, j, 0, 1, 1, '#3d342d'));
  return {
    bg: '#0a0705',
    defs: lin(u('wallL'), [0, 0, 1, 0], [[0, '#221d19'], [1, '#2f2823']]) + lin(u('wallR'), [0, 0, 1, 0], [[0, '#3a322b'], [1, '#27211d']])
      + lin(u('floor'), [0, 0, 0, 1], [[0, '#2a241f'], [1, '#3a3029']])
      + rad(u('tglow'), [[0, '#ffb347', 0.55], [1, '#ff7a1a', 0]]) + rad(u('fglow'), [[0, '#ff9a3c', 0.42], [1, '#ff6a00', 0]]),
    back: `${wallL(`url(#${u('wallL')})`)}${wallR(`url(#${u('wallR')})`)}${stones('L')}${stones('R')}`
      + banner(1.75) + banner(4.35) + onRight(3.05, 1.82, `<g class="hub-crest">${shield}</g>`)
      + `<g class="hub-screen">${onRight(2.1, 0.66, `<path d="M-2 -2h52l-4 6 4 6h-52l4-6z" fill="#d4a63c"/>${say(pick, title, { fill: '#1a120a', sub: '#2a1d10', size: 5.2, font: 'Georgia, serif', x: 3 })}`)}</g>`
      + torch('L', 1.6, 0) + torch('L', 4.25, 1) + torch('R', 1.1, 2) + torch('R', 5.6, 3),
    floor: `${floorPoly(`url(#${u('floor')})`)}${flagstones.join('')}${tiles('#120d0a', 0.75, 0.9)}`,
    edge: cap('#4a4038', 2.6),
    props: `<g class="hub-fireplace">${box(0, fy0, 0, 0.33, fy1 - fy0, HW, ['#3d352e', '#2a241f', '#352d27'])}${fire}${box(0, fy0 - 0.12, 1.12, 0.48, fy1 - fy0 + 0.24, 0.14, ['#5a3e2a', '#2e1f14', '#47301f'])}</g>`,
    // la lueur du feu déborde sur le poste M, devant la cheminée
    over: `<ellipse class="hub-fireglow" cx="${r1(P(0.9, 5.65)[0])}" cy="${r1(P(0.9, 5.65, 0.6)[1])}" rx="58" ry="34" fill="url(#${u('fglow')})">${pulse('0.8;1;0.7;0.9;0.8', 1.9, animate)}</ellipse>${embers}`,
    beam: ['#ffd9a0', '#ffb860'], dust: '#ffb15a',
    plat: ['#4a3527', '#2a1d14', '#3a291d'], vig: 0.62,
  };
}

function dojo({ u, pick, title, animate }) {
  const shoji = (side) => {
    const q = side === 'L' ? lw : rw;
    const at = side === 'L' ? onL : onR;
    const d = [];
    for (let t = 0.39; t < N; t += 0.39) d.push(`M${pts([q(t, 0.32), q(t, HW - 0.3)])}`);
    for (let z = 0.82; z < HW - 0.3; z += 0.5) d.push(`M${pts([q(0, z), q(N, z)])}`);
    const posts = [0, 2.33, 4.67, 6.88].map((t) => at(t, t + 0.12, 0, HW, '#4a2f1c')).join('');
    return `${at(0, N, 0, 0.32, '#5b3d26')}<path d="${d.join('')}" stroke="#8c6a46" stroke-width="0.55" fill="none"/>${posts}${at(0, N, HW - 0.3, HW, '#4a2f1c')}`;
  };
  const mats = [];
  for (let j = 0; j < N; j++) {
    for (let i = (j % 2) ? -1 : 0; i < N; i += 2) {
      const x0 = Math.max(0, i), x1 = Math.min(N, i + 2);
      mats.push(flat(x0, j, 0, x1 - x0, 1, hash(i * 13 + j) > 0.5 ? '#cdbf86' : '#c4b67b', ' stroke="#4f5d2f" stroke-width="0.9"'));
    }
  }
  const enso = '<path d="M9 -3a12 12 0 1 0 2 9" fill="none" stroke="#1b1712" stroke-width="3" stroke-linecap="round"/>';
  // deux lanternes de papier posées au sol, devant, entre les postes
  const lantern = (X, Y, k) => {
    const [gx, gy] = P(X + 0.15, Y + 0.15, 0.4);
    return `${glow(gx, gy, 20, u('lglow'), animate, k)}${box(X, Y, 0, 0.32, 0.32, 0.08, ['#3b2717', '#2a1b10', '#33220f'])}${box(X + 0.02, Y + 0.02, 0.08, 0.28, 0.28, 0.52, ['#fff3d6', '#f2d9a2', '#fbe7bb'])}${box(X - 0.01, Y - 0.01, 0.6, 0.34, 0.34, 0.06, ['#3b2717', '#2a1b10', '#33220f'])}`;
  };
  // pétales de cerisier qui tombent doucement sur la salle
  const petals = fall([[30, -10, 70, 560, 13, 0, 340], [120, -20, 60, 560, 15, 3.5, -300], [210, -10, 80, 560, 12, 6, 280], [300, -30, 50, 560, 16, 1.8, -360], [70, -20, 90, 560, 14, 8, 320], [250, -20, 70, 560, 13.5, 10.5, -290], [160, -10, 60, 560, 15.5, 12, 300]],
    '<path d="M0 0c-2.2-1.6-2.2-4 0-4.6c2.2 0.6 2.2 3 0 4.6z" fill="#f6c3cf" opacity="0.9"/>', animate);
  return {
    bg: '#16110c',
    defs: lin(u('wallL'), [0, 0, 1, 0], [[0, '#e7dcc1'], [1, '#f2e9d3']]) + lin(u('wallR'), [0, 0, 1, 0], [[0, '#f5ecd6'], [1, '#e4d8bc']])
      + rad(u('lglow'), [[0, '#ffe6a8', 0.55], [1, '#ffcf7a', 0]]),
    back: `${wallL(`url(#${u('wallL')})`)}${wallR(`url(#${u('wallR')})`)}${shoji('L')}${shoji('R')}`
      + onR(2.75, 3.35, 1.25, 2.6, '#f6efe0', ' stroke="#3b2a1c" stroke-width="0.6"') + onRight(3.05, 2.05, enso)
      + `<g class="hub-screen">${onR(2.1, 4.0, 0.42, 1.02, '#6b4a2e', ' stroke="#3b2717" stroke-width="0.8"')}${onRight(2.25, 0.85, say(pick, title, { fill: '#f6e7c8', sub: '#f1e3c6', size: 5.2 }))}</g>`,
    floor: mats.join(''),
    edge: cap('#4a2f1c', 2.6),
    props: `<g class="hub-lantern">${lantern(3.4, 6.45, 0)}${lantern(6.45, 3.4, 1)}</g>`,
    over: petals,
    beam: ['#fffaf0', '#fff1d6'], dust: '#fff8ea',
    plat: ['#d8b98a', '#9a7850', '#b99467'], vig: 0.42,
  };
}

function toit({ u, pick, title, animate }) {
  // gratte-ciel derrière les deux bords du toit (du plus loin au plus proche)
  const towers = [];
  const add = (X, Y, w, d, h, k) => towers.push({ X, Y, w, d, h, k });
  [[-4.2, 0.2, 1.4, 1.6, 8.5], [-3.9, 2.4, 1.6, 1.3, 6], [-4.4, 4.2, 1.8, 1.5, 9.5], [-3.6, 6.1, 1.3, 1.4, 5.2], [-2.0, -2.2, 1.2, 1.3, 4.6]].forEach(([X, Y, w, d, h], k) => add(X, Y, w, d, h, k));
  [[0.3, -4.3, 1.5, 1.7, 7.5], [2.4, -3.9, 1.3, 1.5, 10], [4.2, -4.5, 1.7, 1.9, 6.2], [6.2, -3.7, 1.2, 1.4, 8.4]].forEach(([X, Y, w, d, h], k) => add(X, Y, w, d, h, k + 5));
  towers.sort((a, b) => (a.X + a.Y) - (b.X + b.Y));
  // une fenêtre : allumée en jaune, parfois en bleu ; quelques-unes s'éteignent et se rallument
  const win = (corners, k) => {
    const lit = hash(k * 1.7) > 0.8 ? '#9fd8ff' : '#ffd98a';
    if (!animate || hash(k * 3.3) <= 0.94) return poly(corners, lit);
    return `<path d="M${pts(corners)}Z" fill="${lit}"><animate attributeName="opacity" values="1;1;0.1;0.1;1" keyTimes="0;0.5;0.52;0.8;0.82" dur="${r1(6 + hash(k) * 8)}s" repeatCount="indefinite"/></path>`;
  };
  const towerSVG = towers.map(({ X, Y, w, d, h, k }) => {
    const ws = [];
    for (let z = 0.6; z < h - 0.4; z += 0.55) {
      for (let t = 0.2; t < d - 0.15; t += 0.36) if (hash(k * 31 + z * 7 + t * 3) > 0.5) ws.push(win([P(X + w, Y + t, z), P(X + w, Y + t + 0.18, z), P(X + w, Y + t + 0.18, z + 0.25), P(X + w, Y + t, z + 0.25)], k * 97 + z * 13 + t * 5));
      for (let t = 0.2; t < w - 0.15; t += 0.36) if (hash(k * 17 + z * 5 + t * 11) > 0.55) ws.push(win([P(X + t, Y + d, z), P(X + t + 0.18, Y + d, z), P(X + t + 0.18, Y + d, z + 0.25), P(X + t, Y + d, z + 0.25)], k * 89 + z * 11 + t * 7));
    }
    return `${box(X, Y, 0, w, d, h, ['#1d2238', '#121528', '#181c31'])}<g opacity="0.9">${ws.join('')}</g>`;
  }).join('');
  // la tour sur laquelle on est : ses deux façades descendent sous le toit
  const facade = [poly([P(0, N, 0), P(N, N, 0), P(N, N, -12), P(0, N, -12)], '#151a2f'), poly([P(N, 0, 0), P(N, N, 0), P(N, N, -12), P(N, 0, -12)], '#1b2140')];
  for (let z = -0.9; z > -12; z -= 0.75) {
    for (let t = 0.25; t < N - 0.2; t += 0.6) {
      if (hash(z * 13 + t * 7) > 0.45) facade.push(win([P(t, N, z), P(t + 0.3, N, z), P(t + 0.3, N, z - 0.35), P(t, N, z - 0.35)], z * 41 + t * 3));
      if (hash(z * 11 + t * 5 + 3) > 0.45) facade.push(win([P(N, t, z), P(N, t + 0.3, z), P(N, t + 0.3, z - 0.35), P(N, t, z - 0.35)], z * 37 + t * 5 + 1));
    }
  }
  const [mx, my] = [238, 40];
  const neon = onRight(1.15, 2.55, '<rect x="-3" y="-11" width="62" height="34" rx="3" fill="#0b0c14" stroke="#2a2d40"/>'
    + `<text x="28" y="4" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="13" fill="#ff5fae" style="filter: drop-shadow(0 0 3px #ff5fae)">CAP${pulse('1;1;0.25;1;0.5;1', 6, animate, ' keyTimes="0;0.86;0.88;0.9;0.93;1"')}</text>`
    + `<g transform="translate(28 11)">${say(pick, title, { fill: '#6ff4ff', sub: '#c8fbff', size: 4.6, anchor: 'middle' })}</g>`);
  // un avion passe, très haut, son feu clignote
  const plane = animate ? `<g><circle r="1.2" fill="#ff5a5a">${pulse('1;0.1;1', 1.2, true)}</circle><circle cx="-3" r="0.8" fill="#fff" opacity="0.8"/><animateTransform attributeName="transform" type="translate" values="-20 26;380 6" dur="38s" repeatCount="indefinite"/></g>` : '';
  return {
    bg: `url(#${u('sky')})`,
    defs: lin(u('sky'), [0, 0, 0, 1], [[0, '#050816'], [0.55, '#151d44'], [1, '#2e2a5a']]) + lin(u('floor'), [0, 0, 0, 1], [[0, '#2a2d35'], [1, '#353841']])
      + rad(u('moon'), [[0, '#fffbe6', 0.6], [1, '#fffbe6', 0]]),
    back: `${starField(46, 0, 150)}<circle cx="${mx}" cy="${my}" r="30" fill="url(#${u('moon')})"/><circle cx="${mx}" cy="${my}" r="11" fill="#f7f2de"/><circle cx="${mx + 4}" cy="${my - 3}" r="2.2" fill="#e4dcc0"/>${plane}`
      + towerSVG + `<g class="hub-facade">${facade.join('')}</g>` + box(0, 0, -0.14, N, N, 0.14, ['#555a66', '#3a3e48', '#464b56'])
      + box(-0.16, 0, 0, 0.16, N, 0.45, ['#4a4d57', '#2b2d34', '#3b3e47']) + box(0, -0.16, 0, N, 0.16, 0.45, ['#4a4d57', '#2b2d34', '#3b3e47'])
      + `<g class="hub-screen">${box(1.25, -0.1, 0, 0.1, 0.1, 2.0, ['#555', '#333', '#444'])}${box(3.35, -0.1, 0, 0.1, 0.1, 2.0, ['#555', '#333', '#444'])}${neon}</g>`,
    floor: `${floorPoly(`url(#${u('floor')})`)}${tiles('#14161b', 0.8, 0.8)}`,
    edge: `${poly([P(0, 0, 0.45), P(0, N, 0.45), P(0, N, 0.5), P(0, 0, 0.5)], '#6ff4ff', ' opacity="0.8"')}${poly([P(0, 0, 0.45), P(N, 0, 0.45), P(N, 0, 0.5), P(0, 0, 0.5)], '#6ff4ff', ' opacity="0.8"')}`,
    props: '',
    beam: ['#dbe9ff', '#b9d4ff'], dust: '#dff0ff',
    plat: ['#3a3d46', '#1f2128', '#2c2f37'], vig: 0.45,
  };
}

function station({ u, pick, title, animate }) {
  const seams = (side) => {
    const q = side === 'L' ? lw : rw;
    const d = [];
    for (let t = 1.17; t < N; t += 1.17) d.push(`M${pts([q(t, 0), q(t, HW)])}`);
    for (const z of [0.55, 1.25, 2.45]) d.push(`M${pts([q(0, z), q(N, z)])}`);
    return `<path d="${d.join('')}" stroke="#0b0f17" stroke-width="0.9" fill="none"/><path d="${d.join('')}" stroke="#3b4760" stroke-width="0.4" stroke-opacity="0.6" fill="none" transform="translate(0.8 -0.6)"/>`;
  };
  const starsIn = (n, r, k0, ox = 0) => Array.from({ length: n }, (_, k) => {
    const a = hash(k0 + k) * Math.PI * 2, d = Math.sqrt(hash(k0 + k + 50)) * r;
    return `<circle cx="${r1(Math.cos(a) * d + ox)}" cy="${r1(Math.sin(a) * d)}" r="${hash(k0 + k + 9) > 0.8 ? 0.8 : 0.45}" fill="#fff"/>`;
  }).join('');
  const port = (y, z, planet, k) => onLeft(y, z, `<circle r="19" fill="#3a4558"/><circle r="15.5" fill="#03050c"/>${starsIn(16, 14, k)}`
    + (planet ? `<circle cx="4" cy="4" r="9" fill="url(#${u('planet')})"/><circle cx="4" cy="4" r="10.5" fill="none" stroke="#7ec8ff" stroke-opacity="0.35" stroke-width="2"/>` : '')
    + '<circle r="15.5" fill="none" stroke="#9bb3d6" stroke-opacity="0.4" stroke-width="0.8"/>');
  const holo = onR(1.95, 4.25, 1.3, 2.65, `url(#${u('holo')})`, ' stroke="#5ff3ff" stroke-opacity="0.7" stroke-width="0.8"');
  // une ligne de balayage descend l'écran holographique
  const scan = animate ? `<g opacity="0.55">${onR(1.97, 4.23, 2.56, 2.62, '#bffaff')}<animateTransform attributeName="transform" type="translate" values="0 0;0 29" dur="2.8s" repeatCount="indefinite"/></g>` : '';
  const hazard = [];
  for (let t = 0; t < N; t += 0.3) {
    hazard.push(poly([P(0.05, t, 0.002), P(0.05, t + 0.15, 0.002), P(0.35, t + 0.3, 0.002), P(0.35, t + 0.15, 0.002)], '#d9b42a'));
    hazard.push(poly([P(t, 0.05, 0.002), P(t + 0.15, 0.05, 0.002), P(t + 0.3, 0.35, 0.002), P(t + 0.15, 0.35, 0.002)], '#d9b42a'));
  }
  return {
    bg: '#04060c',
    defs: lin(u('wallL'), [0, 0, 1, 0], [[0, '#161c29'], [1, '#202838']]) + lin(u('wallR'), [0, 0, 1, 0], [[0, '#263044'], [1, '#18202e']])
      + lin(u('floor'), [0, 0, 0, 1], [[0, '#1f2635'], [1, '#2a3243']]) + lin(u('holo'), [0, 0, 0, 1], [[0, '#0d3a48', 0.85], [1, '#062530', 0.85]])
      + rad(u('planet'), [[0, '#6fb8ff'], [0.6, '#2f6fbf'], [1, '#132a55']], ' cx="0.35" cy="0.35" r="0.75"')
      + lin(u('ledL'), [0, 0, 1, 0], [[0, '#5ff3ff', 0.22], [1, '#5ff3ff', 0]]) + lin(u('ledR'), [1, 0, 0, 0], [[0, '#5ff3ff', 0.22], [1, '#5ff3ff', 0]]),
    back: `${wallL(`url(#${u('wallL')})`)}${wallR(`url(#${u('wallR')})`)}${seams('L')}${seams('R')}`
      + port(1.25, 1.85, false, 3) + port(5.55, 1.85, true, 40)
      + onR(4.7, 6.65, 0.75, 2.3, '#03050c', ' stroke="#3a4558" stroke-width="1.6"') + onRight(4.9, 1.5, starsIn(18, 14, 70, 20))
      + `<g class="hub-screen">${holo}${scan}${onRight(2.15, 2.25, say(pick, title, { fill: '#6ff4ff', sub: '#d6fdff' }))}</g>`,
    floor: `${floorPoly(`url(#${u('floor')})`)}${tiles('#0e131c', 0.9, 0.9)}${hazard.join('')}`,
    edge: `<g class="hub-led">${poly([P(0, 0), P(0, N), P(0.9, N), P(0.9, 0)], `url(#${u('ledL')})`)}${poly([P(0, 0), P(N, 0), P(N, 0.9), P(0, 0.9)], `url(#${u('ledR')})`)}`
      + `${poly([P(0, 0, 0.1), P(0, N, 0.1), P(0, N, 0.2), P(0, 0, 0.2)], '#5ff3ff', ' opacity="0.9"')}${poly([P(0, 0, 0.1), P(N, 0, 0.1), P(N, 0, 0.2), P(0, 0, 0.2)], '#5ff3ff', ' opacity="0.9"')}</g>${cap('#3a4558')}`,
    props: '',
    beam: ['#c9fbff', '#7ff0ff'], dust: '#aef6ff',
    plat: ['#3a4558', '#1e2533', '#2b3446'], vig: 0.55,
  };
}

function plage({ u, pick, title, animate }) {
  const H = 112; // l'horizon
  const [sx, sy] = [252, H];
  // le soleil se couche derrière la mer ; ses reflets scintillent sur l'eau
  const glints = Array.from({ length: 9 }, (_, k) => {
    const op = r1(0.8 - k * 0.06);
    const w = 12 + k * 2.6 - hash(k) * 4;
    return `<rect x="${r1(sx - w / 2 + (hash(k + 20) - 0.5) * 8)}" y="${r1(sy + 5 + k * 7 + k * k * 0.5)}" width="${r1(w)}" height="1.4" rx="0.7" fill="#ffd9a0" opacity="${op}">${pulse(`${op};0.15;${op}`, r1(1.6 + hash(k + 5) * 1.4), animate)}</rect>`;
  }).join('');
  const waves = Array.from({ length: 16 }, (_, k) => {
    const y = H + 14 + hash(k + 40) * 150;
    const x = hash(k + 60) * HUB.w;
    return `<path d="M${r1(x)} ${r1(y)}q4 -1.6 8 0t8 0" stroke="#ffe7c8" stroke-opacity="${r1(0.12 + hash(k) * 0.18)}" stroke-width="0.8" fill="none"/>`;
  }).join('');
  // une petite île à palmiers à l'horizon, un voilier, des mouettes
  const palm = (x, y, h, lean, k) => {
    const tx = x + lean, ty = y - h;
    const fronds = [-150, -115, -70, -30, 10, 45].map((a) => {
      const r = (a * Math.PI) / 180, ex = tx + Math.cos(r) * 13, ey = ty + Math.sin(r) * 9 + 6;
      return `<path d="M${r1(tx)} ${r1(ty)}Q${r1((tx + ex) / 2)} ${r1(Math.min(ty, ey) - 5)} ${r1(ex)} ${r1(ey)}" stroke="#1f3a2a" stroke-width="2.6" stroke-linecap="round" fill="none"/>`;
    }).join('');
    return `<path d="M${r1(x)} ${r1(y)}Q${r1(x + lean * 0.2)} ${r1(y - h * 0.6)} ${r1(tx)} ${r1(ty)}" stroke="#3a2a22" stroke-width="2.2" fill="none"/>${sway(fronds, tx, ty, 4, 3.4 + k, animate)}`;
  };
  const island = `<path d="M34 ${H}q30 -9 62 0z" fill="#3b2a3a"/>${palm(56, H - 2, 30, -6, 0)}${palm(72, H - 3, 38, 7, 1)}`;
  const boat = drift(`<path d="M300 ${H - 2}h16l-3 3h-11z" fill="#2c2238"/><path d="M308 ${H - 3}v-16l7 14z" fill="#f6e3cf"/><path d="M307 ${H - 3}v-12l-5 10z" fill="#e8cdb6"/>`, -24, 50, animate);
  const gull = '<path d="M-4 0q2 -2.4 4 0q2 -2.4 4 0" stroke="#3a2b36" stroke-width="0.9" fill="none"/>';
  const gulls = animate ? [[-20, 58, 400, -12, 24, 0], [-40, 70, 420, -6, 28, 9]].map(([x, y, dx, dy, d, b]) => `<g opacity="0"><g transform="translate(${x} ${y})">${gull}</g><animateTransform attributeName="transform" type="translate" values="0 0;${dx} ${dy}" dur="${d}s" begin="${b}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.95;1" dur="${d}s" begin="${b}s" repeatCount="indefinite"/></g>`).join('') : '';
  // le ponton : planches, épaisseur, pieux dans l'eau, rambarde de corde au fond
  const planks = [];
  for (let y = 0.35; y < N; y += 0.35) planks.push(`M${pts([P(0, y, 0.002), P(N, y, 0.002)])}`);
  const piles = [];
  for (const t of [0.4, 2.2, 4.0, 5.8, 6.85]) {
    piles.push(box(t - 0.08, N - 0.1, -1.9, 0.16, 0.16, 1.9, ['#5a3b26', '#3a2617', '#4a311f']), box(N - 0.1, t - 0.08, -1.9, 0.16, 0.16, 1.9, ['#5a3b26', '#3a2617', '#4a311f']));
  }
  const ripple = (X, Y) => { const [x, y] = P(X, Y, -1.9); return `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="5" ry="1.6" fill="none" stroke="#ffe7c8" stroke-opacity="0.35" stroke-width="0.7">${animate ? '<animate attributeName="rx" values="4;7;4" dur="3s" repeatCount="indefinite"/>' : ''}</ellipse>`; };
  const posts = [0.1, 1.85, 3.6, 5.35, 6.85];
  const rope = (q) => posts.slice(1).map((t, i) => { const a = q(posts[i]), b = q(t); return `M${r1(a[0])} ${r1(a[1])}Q${r1((a[0] + b[0]) / 2)} ${r1((a[1] + b[1]) / 2 + 5)} ${r1(b[0])} ${r1(b[1])}`; }).join('');
  const postBoxes = posts.map((t) => box(-0.12, t - 0.06, 0, 0.12, 0.12, 0.85, ['#6b4a2e', '#3f2a19', '#55391f']) + box(t - 0.06, -0.12, 0, 0.12, 0.12, 0.85, ['#6b4a2e', '#3f2a19', '#55391f'])).join('');
  return {
    bg: `url(#${u('sea')})`,
    defs: lin(u('sky'), [0, 0, 0, 1], [[0, '#2a1a4a'], [0.45, '#b9506a'], [0.8, '#f08a5c'], [1, '#f8b26a']])
      + lin(u('sea'), [0, 0, 0, 1], [[0, '#c0705f'], [0.2, '#5b4a78'], [0.55, '#2c3566'], [1, '#18204a']])
      + rad(u('sun'), [[0, '#fff2c8'], [0.55, '#ffc46e'], [1, '#ff8a4c']]) + rad(u('sunglow'), [[0, '#ffd08a', 0.7], [1, '#ff8a4c', 0]])
      + lin(u('floor'), [0, 0, 0, 1], [[0, '#b98757'], [1, '#c99866']]),
    back: `<rect width="${HUB.w}" height="${H}" fill="url(#${u('sky')})"/><circle cx="${sx}" cy="${sy}" r="70" fill="url(#${u('sunglow')})"/><circle cx="${sx}" cy="${sy}" r="24" fill="url(#${u('sun')})"/>${gulls}`
      + `<rect y="${H}" width="${HUB.w}" height="${HUB.h - H}" fill="url(#${u('sea')})"/>${glints}${waves}${island}${boat}`
      + `<g class="hub-piles">${piles.join('')}${[0.4, 2.2, 4.0, 5.8].map((t) => ripple(t, N) + ripple(N, t)).join('')}</g>`
      + box(0, 0, -0.24, N, N, 0.24, ['#a87a4c', '#6e4b2c', '#8a613b'])
      + signboard(1.3, 3.7, 1.05, 1.68, '#e1c08f', ['#6b4a2e', '#3f2a19', '#55391f'], onRight(1.5, 1.52, say(pick, title, { fill: '#5a3418', sub: '#3d2a1a', size: 5.6 }))),
    floor: `${floorPoly(`url(#${u('floor')})`)}<path d="${planks.join('')}" stroke="#7a5233" stroke-opacity="0.55" stroke-width="0.7" fill="none"/>`,
    edge: `${postBoxes}<path d="${rope((t) => P(-0.06, t, 0.8))}${rope((t) => P(t, -0.06, 0.8))}" stroke="#e8d4a8" stroke-width="0.9" fill="none"/>`,
    props: '',
    beam: ['#ffe9c8', '#ffc98a'], dust: '#ffe2b8',
    plat: ['#8a5a3a', '#5a3a24', '#704a2f'], vig: 0.4,
  };
}

function sommet({ u, pick, title, animate }) {
  // aurore boréale : trois voiles de lumière qui ondulent
  const curtain = (y, amp, ph, h) => {
    const top = [], bottom = [];
    for (let x = -20; x <= 380; x += 20) {
      const b = y + amp * Math.sin(x / 55 + ph) + 0.4 * amp * Math.sin(x / 23 + ph * 2);
      top.push([x, b - h - 8 * Math.sin(x / 40 + ph)]);
      bottom.push([x, b]);
    }
    return `M${pts(top)}L${pts(bottom.reverse())}Z`;
  };
  const aurora = [[78, 14, 0.2, 46, 'a1', 11], [104, 10, 1.9, 38, 'a2', 14], [58, 9, 3.4, 30, 'a3', 9]].map(([y, amp, ph, h, g, d]) => {
    const d1 = curtain(y, amp, ph, h), d2 = curtain(y + 4, amp * 1.2, ph + 1.3, h + 6);
    return `<path d="${d1}" fill="url(#${u(g)})">${animate ? `<animate attributeName="d" values="${d1};${d2};${d1}" dur="${d}s" repeatCount="indefinite"/>` : ''}${pulse('0.85;1;0.7;0.85', r1(d * 0.7), animate)}</path>`;
  }).join('');
  const shooting = animate ? '<g opacity="0"><path d="M0 0l-16 -6" stroke="#fff" stroke-width="1" stroke-linecap="round"/><animateTransform attributeName="transform" type="translate" values="60 20;150 54" dur="9s" repeatCount="indefinite"/>'
    + '<animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;0.02;0.06;0.12;1" dur="9s" repeatCount="indefinite"/></g>' : '';
  // montagnes enneigées au loin, puis plus près
  const range = (peaks, fill, snow, base) => {
    const caps = peaks.slice(1, -1).map(([x, y]) => `<path d="M${x} ${y}l9 11-4-1-3 4-3-3-3 3-4-4-5 1z" fill="${snow}"/>`).join('');
    return `<path d="M${peaks.map(([x, y]) => `${x} ${y}`).join('L')}L${peaks.at(-1)[0]} ${base}L${peaks[0][0]} ${base}Z" fill="${fill}"/>${caps}`;
  };
  const far = range([[-10, 150], [30, 112], [70, 136], [118, 92], [160, 124], [205, 98], [250, 132], [292, 96], [336, 128], [372, 110]], '#2a3658', '#c9d6ea', 320);
  const near = range([[-10, 196], [26, 158], [62, 186], [100, 150], [140, 176], [220, 172], [262, 146], [300, 180], [338, 152], [372, 186]], '#1a2238', '#e6eef8', 320);
  const pine = (x, y, s) => `<g transform="translate(${r1(x)} ${r1(y)}) scale(${s})"><rect x="-1.5" y="-6" width="3" height="6" fill="#2a1d14"/>`
    + [[0, 22, 13], [-9, 18, 10], [-17, 13, 7]].map(([dy, w, h]) => `<path d="M0 ${dy - h - 6}l${w / 2} ${h}h${-w}z" fill="#1f3b34"/><path d="M0 ${dy - h - 6}l${w / 4} ${h / 2}l${-w / 8} -1l${-w / 8} 2l${-w / 8} -2l${-w / 8} 1z" fill="#eef4fb"/>`).join('') + '</g>';
  // la falaise sous la plateforme, des corniches de roche couvertes de neige
  const cliff = poly([P(0, N, 0), P(N, N, 0), P(N, N, -12), P(0, N, -12)], `url(#${u('cliffL')})`) + poly([P(N, 0, 0), P(N, N, 0), P(N, N, -12), P(N, 0, -12)], `url(#${u('cliffR')})`)
    + Array.from({ length: 12 }, (_, k) => {
      const t = 0.3 + hash(k + 3) * 5.6, z = -0.5 - hash(k + 9) * 7, w = 0.6 + hash(k + 13) * 0.8;
      const q = k % 2 ? (a, zz) => P(a, N, zz) : (a, zz) => P(N, a, zz);
      return poly([q(t, z), q(t + w, z), q(t + w, z - 0.08), q(t, z - 0.08)], '#dfe7f2', ' opacity="0.6"') + poly([q(t, z - 0.08), q(t + w, z - 0.08), q(t + w, z - 0.24), q(t, z - 0.24)], '#12151c', ' opacity="0.45"');
    }).join('');
  const snowPatches = Array.from({ length: 9 }, (_, k) => {
    const [x, y] = P(0.4 + hash(k + 30) * 6.2, 0.4 + hash(k + 31) * 6.2, 0.003);
    return `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(6 + hash(k) * 8)}" ry="${r1(2.5 + hash(k + 1) * 3)}" fill="#e8eef7" opacity="0.35"/>`;
  }).join('');
  const flakes = fall(Array.from({ length: 14 }, (_, k) => [hash(k + 70) * HUB.w, -10, (hash(k + 80) - 0.5) * 60, 550, r1(9 + hash(k + 90) * 7), r1(hash(k + 95) * 10)]), '<circle r="1.1" fill="#fff"/>', animate);
  return {
    bg: `url(#${u('sky')})`,
    defs: lin(u('sky'), [0, 0, 0, 1], [[0, '#030712'], [0.35, '#0b1530'], [0.7, '#16244a'], [1, '#0d1428']])
      + lin(u('a1'), [0, 0, 0, 1], [[0, '#5dffb0', 0], [0.7, '#5dffb0', 0.42], [0.92, '#5dffb0', 0.55], [1, '#5dffb0', 0]])
      + lin(u('a2'), [0, 0, 0, 1], [[0, '#4fd8ff', 0], [0.7, '#4fd8ff', 0.32], [0.92, '#4fd8ff', 0.45], [1, '#4fd8ff', 0]])
      + lin(u('a3'), [0, 0, 0, 1], [[0, '#b48cff', 0], [0.75, '#b48cff', 0.3], [1, '#b48cff', 0]])
      + lin(u('floor'), [0, 0, 0, 1], [[0, '#5a6170'], [1, '#6a7180']])
      + lin(u('cliffL'), [0, 0, 0, 1], [[0, '#363c49'], [1, '#14171e']]) + lin(u('cliffR'), [0, 0, 0, 1], [[0, '#424958'], [1, '#191c24']]),
    back: `${starField(60, 200, 170)}${shooting}<g class="hub-aurora">${aurora}</g>${far}${near}${pine(12, 222, 1.2)}${pine(348, 222, 1.2)}${pine(330, 236, 0.9)}`
      + cliff + box(0, 0, -0.14, N, N, 0.14, ['#6a7180', '#3b404b', '#4c525e'])
      + box(-0.2, 0, 0, 0.2, N, 0.4, ['#e8eef7', '#3d424d', '#4d535f']) + box(0, -0.2, 0, N, 0.2, 0.4, ['#e8eef7', '#3d424d', '#4d535f'])
      + signboard(1.3, 3.7, 1.0, 1.62, '#4a3020', ['#4a3020', '#2a1b10', '#3b2717'], onR(1.3, 3.7, 1.62, 1.7, '#eef4fb') + onRight(1.5, 1.47, say(pick, title, { fill: '#f6e3c3', sub: '#eadbc4', size: 5.6 }))),
    floor: `${floorPoly(`url(#${u('floor')})`)}${tiles('#3a3f4a', 0.7, 0.8)}${snowPatches}`,
    edge: '',
    props: '',
    over: flakes,
    beam: ['#eaf6ff', '#bfe6ff'], dust: '#f2f8ff',
    plat: ['#4b5160', '#2b2f39', '#3a3f4b'], vig: 0.5,
  };
}


// un sapin (aussi pour la forêt) : posé en (x, y), à l'échelle s
const pineTree = (x, y, s, green = '#1f3b34', snow = '') => `<g transform="translate(${r1(x)} ${r1(y)}) scale(${s})"><rect x="-1.5" y="-6" width="3" height="6" fill="#2a1d14"/>`
  + [[0, 22, 13], [-9, 18, 10], [-17, 13, 7]].map(([dy, w, h]) => `<path d="M0 ${dy - h - 6}l${w / 2} ${h}h${-w}z" fill="${green}"/>${snow ? `<path d="M0 ${dy - h - 6}l${w / 4} ${h / 2}l${-w / 8} -1l${-w / 8} 2l${-w / 8} -2l${-w / 8} 1z" fill="${snow}"/>` : ''}`).join('') + '</g>';
// un brasero (ou un trésor) posé au sol, dans les deux trouées de devant
const FRONT_SPOTS = [[3.4, 6.45], [6.45, 3.4]];

function ocean({ u, pick, title, animate }) {
  // les murs sont des vitres sur la mer : poissons, algues, rayons de lumière
  const fishShape = (col) => `<path d="M0 0c-4 -3.4 -10 -3.4 -14 0c4 3.4 10 3.4 14 0z" fill="${col}"/><path d="M-14 0l-5 -3.5v7z" fill="${col}"/><circle cx="-3.6" cy="-0.7" r="0.8" fill="#06202c"/>`;
  const swim = (wall, z, s, dur, k, col) => {
    const at = wall === 'L' ? (x) => onLeft(N, z, x) : (x) => onRight(0, z, x);
    const start = hash(k) * 170;
    const fish = `<g transform="scale(${s})">${fishShape(col)}</g>`;
    return at(animate ? `<g>${fish}<animateTransform attributeName="transform" type="translate" values="-30 0;220 0" dur="${dur}s" begin="-${r1(hash(k + 3) * dur)}s" repeatCount="indefinite"/></g>` : `<g transform="translate(${r1(start)} 0)">${fish}</g>`);
  };
  const fishes = [['L', 1.2, 1, 19, 1, '#ffb347'], ['L', 2.2, 0.8, 26, 2, '#ffd166'], ['L', 1.7, 0.6, 14, 3, '#9fe8ff'], ['R', 1.05, 1.1, 23, 4, '#ff8a5c'], ['R', 2.35, 0.75, 17, 5, '#ffe08a'], ['R', 1.75, 0.6, 29, 6, '#c3f3ff']];
  const school = (wall) => fishes.filter(([w]) => w === wall).map(([w, z, sc, d, k, c]) => swim(w, z, sc, d, k, c)).join('');
  const kelp = (wall, t, h, k) => {
    const q = wall === 'L' ? lw : rw;
    const [x, y] = q(t, 0.25);
    const top = y - h;
    const path = `<path d="M${r1(x)} ${r1(y)}C${r1(x - 6)} ${r1(y - h * 0.35)} ${r1(x + 6)} ${r1(y - h * 0.65)} ${r1(x)} ${r1(top)}" stroke="#2f8a5b" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.8"/>`;
    return sway(path, x, y, 5, 4 + (k % 3), animate);
  };
  const mullions = (wall) => [1.75, 3.5, 5.25].map((t) => (wall === 'L' ? onL : onR)(t - 0.05, t + 0.05, 0, HW, '#5d7480')).join('');
  const rays = [[1.2, 0.5], [3.1, 0.35], [5.4, 0.45]].map(([t, w], k) => {
    const ray = (q) => poly([q(t, HW), q(t + w, HW), q(t + w + 0.6, 0.3), q(t + 0.6, 0.3)], '#e6fbff', ' opacity="0.07"');
    return `<g>${ray(lw)}${ray(rw)}${pulse('1;0.4;1', 5 + k, animate)}</g>`;
  }).join('');
  // sol de sable ridé, coraux, un coffre au trésor
  const ripples = [0.8, 1.9, 3.0, 4.1, 5.2, 6.3].map((y, k) => `M${pts(Array.from({ length: 15 }, (_, i) => P(i / 2, y + 0.08 * Math.sin(i * 1.3 + k), 0.002)))}`).join('');
  const coral = (X, Y) => {
    const [x, y] = P(X, Y, 0);
    return `<g class="hub-coral"><path d="M${r1(x)} ${r1(y)}l-6 -10l-3 -9M${r1(x - 6)} ${r1(y - 10)}l-7 -4M${r1(x)} ${r1(y)}l3 -14l-2 -8M${r1(x + 3)} ${r1(y - 14)}l6 -5" stroke="#ff7f8a" stroke-width="2.6" stroke-linecap="round" fill="none"/><circle cx="${r1(x + 7)}" cy="${r1(y - 3)}" r="4" fill="#ffb07a"/><circle cx="${r1(x - 9)}" cy="${r1(y - 2)}" r="3" fill="#c78bff"/></g>`;
  };
  const [cx, cy] = P(FRONT_SPOTS[0][0] + 0.25, FRONT_SPOTS[0][1] + 0.18, 0.5);
  const chest = `<g class="hub-chest">${glow(cx, cy, 18, u('gold'), animate, 1)}${box(FRONT_SPOTS[0][0], FRONT_SPOTS[0][1], 0, 0.5, 0.36, 0.26, ['#8a5a2e', '#5a3a1c', '#704a26'])}${box(FRONT_SPOTS[0][0] - 0.02, FRONT_SPOTS[0][1] - 0.02, 0.26, 0.54, 0.4, 0.06, ['#ffd27a', '#b8862a', '#e0a83a'])}${box(FRONT_SPOTS[0][0] + 0.2, FRONT_SPOTS[0][1] + 0.36, 0.1, 0.1, 0.01, 0.12, ['#ffd27a', '#ffd27a', '#ffd27a'])}</g>`;
  const bubbles = fall(Array.from({ length: 12 }, (_, k) => {
    const [x, y] = P(0.5 + hash(k + 11) * 6, 0.5 + hash(k + 12) * 6, 0);
    return [x, y, (hash(k + 13) - 0.5) * 16, -(y + 20), r1(5 + hash(k + 14) * 5), r1(hash(k + 15) * 8)];
  }), '<circle r="1.6" fill="none" stroke="#dff8ff" stroke-width="0.7" opacity="0.8"/><circle cx="-0.5" cy="-0.5" r="0.4" fill="#fff"/>', animate);
  return {
    bg: `url(#${u('deep')})`,
    defs: lin(u('deep'), [0, 0, 0, 1], [[0, '#0b4a6e'], [0.6, '#062b45'], [1, '#03182a']])
      + lin(u('glassL'), [0, 0, 1, 0], [[0, '#0c5a7c'], [1, '#13789c']]) + lin(u('glassR'), [0, 0, 1, 0], [[0, '#1580a6'], [1, '#0e6184']])
      + lin(u('floor'), [0, 0, 0, 1], [[0, '#d9c08c'], [1, '#c6a86f']]) + rad(u('gold'), [[0, '#ffe08a', 0.6], [1, '#ffb347', 0]])
      + `<clipPath id="${u('clipL')}">${wallL('#000')}</clipPath><clipPath id="${u('clipR')}">${wallR('#000')}</clipPath>`,
    back: `${wallL(`url(#${u('glassL')})`)}${wallR(`url(#${u('glassR')})`)}`
      + `<g clip-path="url(#${u('clipL')})">${kelp('L', 0.9, 34, 0)}${kelp('L', 4.6, 46, 1)}${kelp('L', 6.2, 28, 2)}</g><g clip-path="url(#${u('clipR')})">${kelp('R', 1.2, 30, 3)}${kelp('R', 6.3, 40, 4)}</g>`
      + `<g class="hub-fish"><g clip-path="url(#${u('clipL')})">${school('L')}</g><g clip-path="url(#${u('clipR')})">${school('R')}</g></g>`
      + rays + mullions('L') + mullions('R') + onL(0, N, 0, 0.3, '#5d7480') + onR(0, N, 0, 0.3, '#5d7480') + onL(0, N, HW - 0.18, HW, '#5d7480') + onR(0, N, HW - 0.18, HW, '#5d7480')
      + `<g class="hub-screen">${onR(1.95, 4.15, 1.3, 2.45, '#06222e', ' stroke="#c9a25a" stroke-width="1.4"')}${onRight(2.15, 2.15, say(pick, title, { fill: '#9fe8ff', sub: '#e6fbff' }))}</g>`,
    floor: `${floorPoly(`url(#${u('floor')})`)}<path d="${ripples}" stroke="#a88a55" stroke-opacity="0.45" stroke-width="0.8" fill="none"/>`,
    edge: cap('#5d7480', 2.6),
    props: `${coral(FRONT_SPOTS[1][0] + 0.2, FRONT_SPOTS[1][1] + 0.2)}${coral(3.4, 0.25)}${chest}`,
    over: bubbles,
    beam: ['#d6fbff', '#9fe8ff'], dust: '#cff6ff',
    plat: ['#2c5a6a', '#173540', '#204754'], vig: 0.5,
  };
}

function neon({ u, pick, title, animate }) {
  // murs sombres quadrillés de néon, soleil à rayures, palmiers de néon
  const grid = (q) => {
    const d = [];
    for (let t = 0.5; t < N; t += 0.5) d.push(`M${pts([q(t, 0), q(t, HW)])}`);
    for (let z = 0.5; z < HW; z += 0.5) d.push(`M${pts([q(0, z), q(N, z)])}`);
    return `<path d="${d.join('')}" stroke="#ff4fd8" stroke-opacity="0.22" stroke-width="0.6" fill="none"/>`;
  };
  const bands = [6, 11, 15.5, 19.5].map((y, k) => `<rect x="-30" y="${y}" width="60" height="${1.6 + k * 0.7}" fill="#1a0b2e"/>`).join('');
  const sun = onLeft(5.4, 1.95, `<circle r="25" fill="url(#${u('sun')})"/>${bands}<circle r="30" fill="none" stroke="#ff7ad9" stroke-opacity="0.25" stroke-width="5"/>`);
  const palm = (y, flip) => onLeft(y, 0.3, `<g transform="scale(${flip ? -0.9 : 0.9} 0.9)"><path d="M0 0c2 -14 -1 -30 6 -44M6 -44c-8 -4 -16 -2 -21 4M6 -44c-2 -7 -10 -11 -17 -9M6 -44c4 -8 12 -9 18 -6M6 -44c9 -2 15 3 17 9M6 -44c6 3 7 10 6 15" stroke="#36f3ff" stroke-width="5" stroke-opacity="0.18" fill="none" stroke-linecap="round"/><path d="M0 0c2 -14 -1 -30 6 -44M6 -44c-8 -4 -16 -2 -21 4M6 -44c-2 -7 -10 -11 -17 -9M6 -44c4 -8 12 -9 18 -6M6 -44c9 -2 15 3 17 9M6 -44c6 3 7 10 6 15" stroke="#7ff9ff" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>`);
  // sol quadrillé qui défile vers toi, découpé à la forme du sol
  const lines = [];
  for (let i = -1; i <= N; i++) lines.push(`M${pts([P(i, -1, 0.003), P(i, N, 0.003)])}M${pts([P(-1, i, 0.003), P(N, i, 0.003)])}`);
  const step = r1(P(1, 1)[1] - P(0, 0)[1]);
  const floorGrid = `<g clip-path="url(#${u('clipF')})"><g><path d="${lines.join('')}" stroke="#ff4fd8" stroke-width="1" stroke-opacity="0.75" fill="none"/>${animate ? `<animateTransform attributeName="transform" type="translate" values="0 ${-step};0 0" dur="1.6s" repeatCount="indefinite"/>` : ''}</g></g>`;
  const tube = (z, col, w = 1.6) => `<path d="M${pts([P(0, N, z), P(0, 0, z), P(N, 0, z)])}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
  const sign = onRight(2.1, 2.3, '<rect x="-5" y="-9" width="62" height="22" rx="3" fill="#0d0518" stroke="#36f3ff" stroke-width="1.4"/>'
    + `<rect x="-7" y="-11" width="66" height="26" rx="4" fill="none" stroke="#36f3ff" stroke-opacity="0.25" stroke-width="3">${pulse('1;1;0.2;1;0.6;1', 7, animate, ' keyTimes="0;0.8;0.82;0.85;0.88;1"')}</rect>`
    + say(pick, title, { fill: '#ff6ee0', sub: '#c9fbff', size: 5.4 }));
  return {
    bg: `url(#${u('night')})`,
    defs: lin(u('night'), [0, 0, 0, 1], [[0, '#0b0217'], [0.6, '#1f0838'], [1, '#2a0b46']]) + lin(u('wall'), [0, 0, 0, 1], [[0, '#1a0b2e'], [1, '#100620']])
      + lin(u('sun'), [0, 0, 0, 1], [[0, '#ffe66b'], [0.55, '#ff8a5c'], [1, '#ff3fa4']]) + `<clipPath id="${u('clipF')}">${floorPoly('#000')}</clipPath>`,
    back: `${wallL(`url(#${u('wall')})`)}${wallR(`url(#${u('wall')})`)}${grid(lw)}${grid(rw)}${sun}${palm(4.15, false)}${palm(6.75, true)}${tube(HW, '#ff4fd8', 2.2)}`
      + `<g class="hub-screen">${sign}</g>`,
    floor: `${floorPoly('#0d0718')}${floorGrid}`,
    edge: `${tube(0.12, '#36f3ff')}${tube(0.12, '#36f3ff', 5).replace('stroke-width="5"', 'stroke-width="5" stroke-opacity="0.2"')}`,
    props: '',
    beam: ['#ffd1f7', '#ff7ad9'], dust: '#ff9be6',
    plat: ['#24133d', '#120a22', '#1b0e30'], vig: 0.5,
  };
}

function arene({ u, pick, title, animate }) {
  // murs de pierre claire : deux étages d'arches, la foule en haut, des fanions
  const arch = (x, y, w, h, fill) => `<path d="M${x} ${y}v${-(h - w / 2)}a${w / 2} ${w / 2} 0 0 1 ${w} 0v${h - w / 2}z" fill="${fill}"/>`;
  const tier = (wall, z, h, crowd) => {
    const at = wall === 'L' ? onLeft : onRight;
    const len = 189;
    const arches = [];
    for (let x = 6, k = 0; x < len - 12; x += 19, k++) {
      arches.push(arch(x, 0, 12, h, '#4a3522'));
      if (crowd) {
        const heads = [0, 1, 2].map((j) => {
          const col = ['#c98a5a', '#8a5a3a', '#e0b08a', '#5a3a2a'][(k + j) % 4];
          const shirt = ['#c0392b', '#2e6fb3', '#e0b030', '#f4eee7', '#3a8a4a'][(k * 3 + j) % 5];
          const bob = animate ? `<animateTransform attributeName="transform" type="translate" values="0 0;0 -1.6;0 0" dur="${r1(0.7 + hash(k * 3 + j) * 0.8)}s" begin="${r1(hash(k + j) * 2)}s" repeatCount="indefinite"/>` : '';
          return `<g><rect x="${x + 1 + j * 3.6}" y="-5" width="3" height="5" rx="1" fill="${shirt}"/><circle cx="${x + 2.5 + j * 3.6}" cy="-6.6" r="1.6" fill="${col}"/>${bob}</g>`;
        }).join('');
        arches.push(heads);
      }
    }
    // on part du coin du fond : le mur de gauche se dessine depuis son bout avant
    return wall === 'L' ? at(N, z, arches.join('')) : at(0, z, arches.join(''));
  };
  const flags = (q) => {
    const d = [];
    for (let t = 0.1; t < N - 0.2; t += 0.35) {
      const a = q(t, HW - 0.05), b = q(t + 0.35, HW - 0.05), m = q(t + 0.175, HW - 0.45);
      d.push(poly([a, b, m], Math.round(t / 0.35) % 2 ? '#e0b030' : '#b8322a'));
    }
    return d.join('');
  };
  const ring = Array.from({ length: 41 }, (_, k) => P(3.5 + 2.9 * Math.cos((k / 40) * Math.PI * 2), 3.5 + 2.9 * Math.sin((k / 40) * Math.PI * 2), 0.003));
  // l'arène tient sur sa façade d'arches, posée sur le sable
  const B = 1.3;
  const facade = (face) => {
    const list = [];
    for (let t = 0.15; t < N + 0.2; t += 0.62) {
      const q = face === 'L' ? (a, z) => P(a, N + 0.3, z) : (a, z) => P(N + 0.3, a, z);
      const [x0, y0] = q(t, -B + 0.12);
      const pt = q(t + 0.34, -B + 0.12);
      const top = q(t + 0.17, -0.25);
      list.push(`<path d="M${r1(x0)} ${r1(y0)}L${r1(pt[0])} ${r1(pt[1])}L${r1(pt[0])} ${r1(top[1] + (pt[1] - y0) / 2 + 6)}Q${r1(top[0])} ${r1(top[1] - 2)} ${r1(x0)} ${r1(top[1] - (pt[1] - y0) / 2 + 6)}Z" fill="#5a4128"/>`);
    }
    return list.join('');
  };
  const left = P(-0.3, N + 0.3, -B), corner = P(N + 0.3, N + 0.3, -B), right = P(N + 0.3, -0.3, -B);
  const ground = `<path d="M${r1(left[0] - 40)} ${r1(left[1] - 24)}L${pts([corner])}L${r1(right[0] + 40)} ${r1(right[1] - 24)}V${HUB.h}H${r1(left[0] - 40)}Z" fill="url(#${u('sand')})"/>`;
  const brazier = ([X, Y], k) => {
    const [x, y] = P(X + 0.18, Y + 0.18, 0.75);
    return `${glow(x, y - 4, 20, u('fire'), animate, k)}${box(X + 0.13, Y + 0.13, 0, 0.1, 0.1, 0.6, ['#6a5030', '#3a2a18', '#50402a'])}${box(X, Y, 0.6, 0.36, 0.36, 0.14, ['#c08a3a', '#7a5520', '#9a6d2a'])}${flame(x, y, 1.2, animate, k)}`;
  };
  return {
    bg: `url(#${u('sky')})`,
    defs: lin(u('sky'), [0, 0, 0, 1], [[0, '#2f6fb3'], [0.6, '#7fb4e0'], [1, '#d8ecf8']])
      + lin(u('wallL'), [0, 0, 1, 0], [[0, '#b99a6a'], [1, '#d4b98a']]) + lin(u('wallR'), [0, 0, 1, 0], [[0, '#dcc396'], [1, '#bfa070']])
      + lin(u('floor'), [0, 0, 0, 1], [[0, '#e6cd96'], [1, '#d6b87c']]) + rad(u('fire'), [[0, '#ffb347', 0.5], [1, '#ff7a1a', 0]])
      + lin(u('sand'), [0, 0, 0, 1], [[0, '#d9bd84'], [1, '#b8975e']]),
    back: `${ground}${box(-0.3, -0.3, -B, N + 0.6, N + 0.6, B, ['#d4b98a', '#b39467', '#c4a678'])}${facade('L')}${facade('R')}${wallL(`url(#${u('wallL')})`)}${wallR(`url(#${u('wallR')})`)}`
      + tier('L', 1.25, 22, false) + tier('R', 1.25, 22, false) + tier('L', 2.45, 18, true) + tier('R', 2.45, 18, true)
      + onL(0, N, 1.3, 1.42, '#a88a5a') + onR(0, N, 1.3, 1.42, '#a88a5a') + flags(lw) + flags(rw)
      + `<g class="hub-screen">${onR(2.0, 4.1, 0.25, 1.05, '#e9dcc0', ' stroke="#8a6a3d" stroke-width="1"')}${onRight(2.2, 0.85, say(pick, title, { fill: '#7a1f1a', sub: '#4a3522', size: 5.6, font: 'Georgia, serif' }))}</g>`,
    floor: `${floorPoly(`url(#${u('floor')})`)}<path d="M${pts(ring)}" stroke="#b8945a" stroke-width="1.2" fill="none" opacity="0.7"/>`,
    edge: cap('#a88a5a', 2.6),
    props: `<g class="hub-brazier">${FRONT_SPOTS.map((spot, k) => brazier(spot, k)).join('')}</g>`,
    beam: ['#fff6dc', '#ffe0a0'], dust: '#f7e3b5',
    plat: ['#cfa970', '#8c6a3d', '#a98552'], vig: 0.3,
  };
}

function foret({ u, pick, title, animate }) {
  // ciel du soir entre les arbres, ponton de bois, guirlande, lucioles
  const blobs = (n, y0, amp, r, col, k0) => Array.from({ length: n }, (_, k) => {
    const x = (k / (n - 1)) * (HUB.w + 40) - 20;
    return `<circle cx="${r1(x)}" cy="${r1(y0 + amp * hash(k + k0))}" r="${r1(r * (0.8 + 0.5 * hash(k + k0 + 7)))}" fill="${col}"/>`;
  }).join('');
  const far = `${blobs(12, 128, 26, 26, '#2c3a52', 1)}<rect y="140" width="${HUB.w}" height="160" fill="#2c3a52"/>`;
  const near = `${blobs(9, 168, 30, 30, '#1b2a2c', 20)}<rect y="182" width="${HUB.w}" height="140" fill="#1b2a2c"/>`;
  const pines = [[18, 252, 1.6], [44, 240, 1.2], [318, 250, 1.6], [346, 236, 1.3], [292, 238, 1.0]].map(([x, y, sc]) => pineTree(x, y, sc, '#132320')).join('');
  // rambarde au fond, guirlande d'ampoules qui scintillent
  const posts = [0.1, 1.85, 3.6, 5.35, 6.85];
  const rail = posts.map((t) => box(-0.12, t - 0.06, 0, 0.12, 0.12, 0.8, ['#6b4a2e', '#3f2a19', '#55391f']) + box(t - 0.06, -0.12, 0, 0.12, 0.12, 0.8, ['#6b4a2e', '#3f2a19', '#55391f'])).join('')
    + box(-0.1, 0, 0.72, 0.08, N, 0.08, ['#7a5636', '#4a3220', '#5e4228']) + box(0, -0.1, 0.72, N, 0.08, 0.08, ['#7a5636', '#4a3220', '#5e4228']);
  const garland = (q) => {
    let d = '', bulbs = '';
    for (let i = 0; i < posts.length - 1; i++) {
      const a = q(posts[i], 1.0), b = q(posts[i + 1], 1.0);
      const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 7];
      d += `M${r1(a[0])} ${r1(a[1])}Q${r1(m[0])} ${r1(m[1])} ${r1(b[0])} ${r1(b[1])}`;
      for (const t of [0.2, 0.4, 0.6, 0.8]) {
        const x = (1 - t) ** 2 * a[0] + 2 * t * (1 - t) * m[0] + t * t * b[0];
        const y = (1 - t) ** 2 * a[1] + 2 * t * (1 - t) * m[1] + t * t * b[1] + 1.6;
        bulbs += `<circle cx="${r1(x)}" cy="${r1(y)}" r="1.4" fill="#ffd27a">${pulse('1;0.45;1', r1(1.4 + hash(x) * 2), animate && hash(x + y) > 0.6)}</circle><circle cx="${r1(x)}" cy="${r1(y)}" r="4.5" fill="#ffd27a" opacity="0.18"/>`;
      }
    }
    return `<path d="${d}" stroke="#3a2a1c" stroke-width="0.6" fill="none"/>${bulbs}`;
  };
  const planks = [];
  for (let y = 0.35; y < N; y += 0.35) planks.push(`M${pts([P(0, y, 0.002), P(N, y, 0.002)])}`);
  // les lucioles : elles flottent et clignotent
  const flies = Array.from({ length: 14 }, (_, k) => {
    const x = 20 + hash(k + 40) * (HUB.w - 40), y = 90 + hash(k + 41) * 300;
    const path = [[0, 0], [hash(k + 42) * 24 - 12, hash(k + 43) * 18 - 9], [hash(k + 44) * 24 - 12, hash(k + 45) * 18 - 9], [0, 0]].map(([a, b]) => `${r1(a)} ${r1(b)}`).join(';');
    const move = animate ? `<animateTransform attributeName="transform" type="translate" values="${path}" dur="${r1(6 + hash(k + 46) * 6)}s" repeatCount="indefinite"/>` : '';
    const blink = pulse('0.15;1;0.15', r1(1.6 + hash(k + 47) * 2.4), animate, ` begin="${r1(hash(k + 48) * 3)}s"`);
    return `<g transform="translate(${r1(x)} ${r1(y)})"><g><circle r="5" fill="#d9ff7a" opacity="0.18"/><circle r="1.3" fill="#f2ffb8"/>${move}</g>${blink ? `<animate attributeName="opacity" values="0.15;1;0.15" dur="${r1(1.6 + hash(k + 47) * 2.4)}s" begin="${r1(hash(k + 48) * 3)}s" repeatCount="indefinite"/>` : ''}</g>`;
  }).join('');
  return {
    bg: `url(#${u('sky')})`,
    defs: lin(u('sky'), [0, 0, 0, 1], [[0, '#1d1640'], [0.22, '#6a3b6b'], [0.4, '#e0875a'], [0.6, '#1b2a2c'], [1, '#0f1a17']])
      + lin(u('floor'), [0, 0, 0, 1], [[0, '#7a5636'], [1, '#8a6440']]) + rad(u('dusk'), [[0, '#ffd08a', 0.75], [1, '#ff8a4c', 0]]),
    back: `<circle cx="196" cy="128" r="60" fill="url(#${u('dusk')})"/>${far}${near}${pines}`
      + `<rect y="300" width="${HUB.w}" height="${HUB.h - 300}" fill="#13201c"/>`
      + box(0, 0, -0.2, N, N, 0.2, ['#7a5636', '#4a3220', '#5e4228'])
      + signboard(1.3, 3.7, 1.05, 1.66, '#a8794a', ['#6b4a2e', '#3f2a19', '#55391f'], onRight(1.5, 1.51, say(pick, title, { fill: '#2a1a0c', sub: '#3a2614', size: 5.6 }))),
    floor: `${floorPoly(`url(#${u('floor')})`)}<path d="${planks.join('')}" stroke="#4a3220" stroke-opacity="0.6" stroke-width="0.7" fill="none"/>`,
    edge: `${rail}${garland((t) => P(-0.06, t, 0))}${garland((t) => P(t, -0.06, 0))}`,
    props: '',
    over: flies,
    beam: ['#fff0c8', '#ffd27a'], dust: '#e9ff9a',
    plat: ['#5e4228', '#3a2717', '#4a3320'], vig: 0.45,
  };
}

const ART = { salle, grec, medieval, dojo, toit, station, plage, sommet, ocean, neon, arene, foret };

// L'habillage d'un décor (décor inconnu : la salle). u : préfixe des identifiants.
export function decorArt(id, { pick = 'A', title = '', animate = true, u = (n) => n } = {}) {
  return { over: '', ...(ART[id] ?? ART.salle)({ u, pick, title, animate }) };
}

// Petite vue d'un décor, sans les postes ni animation : pour le choisir.
export function decorThumb(id, key = id) {
  const u = (n) => `th-${key}-${n}`;
  const a = decorArt(id, { pick: 'B', title: 'Ta séance', animate: false, u });
  return `<svg class="decor-thumb" viewBox="0 30 ${HUB.w} 360" aria-hidden="true"><defs>${a.defs}</defs><rect y="30" width="${HUB.w}" height="360" fill="${a.bg}"/>${a.back}${a.floor}${a.edge}${a.props}</svg>`;
}
