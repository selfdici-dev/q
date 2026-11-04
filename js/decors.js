// Les décors de la Salle : la même pièce (les mêmes postes, la même borne),
// habillée autrement (murs, sol, lumière, objets, petites animations sans
// son). On choisit librement parmi ceux qu'on a débloqués ; les débloquer est
// dur : des séances, ton niveau, tes records à l'arcade (calculés, jamais
// stockés). Logique pure : des chaînes SVG, testées par tests/decors.test.js.
import { HUB, N, HW, P, SKEW, r1, pts, poly, flat, box, lw, rw, onL, onR } from './iso.js';
import { levelInfo, totalXP } from './logic.js';
import { routineStatus } from './routines.js';
import { SEASONS, seasonYear } from './seasons.js';

// Du plus facile au plus dur.
export const DECORS = [
  { id: 'salle', name: 'La salle', desc: 'Mur sombre, logo de cuivre, spots et suspensions, kettlebells, bandes LED.', need: null },
  { id: 'grec', name: 'Temple grec', desc: 'Marbre et colonnes au-dessus des nuages, au coucher du soleil.', need: { kind: 'workouts', n: 15 } },
  { id: 'ring', name: 'Ring de boxe', desc: 'Projecteurs qui balaient la salle, cordes, la foule et ses flashs.', need: { kind: 'boxe', n: 12 } },
  { id: 'foret', name: 'Forêt au crépuscule', desc: 'Un ponton de bois sous les arbres, des lucioles, une guirlande.', need: { kind: 'routines', n: 20 } },
  { id: 'desert', name: 'Désert la nuit', desc: 'Pyramides au clair de lune, voie lactée, une oasis et un feu de camp.', need: { kind: 'soirs', n: 20 } },
  { id: 'dojo', name: 'Dojo', desc: 'Bois, papier de riz, tatamis, lanternes et pétales de cerisier.', need: { kind: 'blocs', n: 3000 } },
  { id: 'toit', name: 'Toit de la ville', desc: 'En haut d’une tour, la nuit, au milieu des gratte-ciel.', need: { kind: 'calc', n: 30 } },
  { id: 'jungle', name: 'Temple de la jungle', desc: 'Pierres moussues, cascade, lianes et papillons.', need: { kind: 'serpent', n: 40 } },
  { id: 'ocean', name: 'Fond marin', desc: 'Des vitres sur la mer, des poissons, des bulles et un trésor.', need: { kind: 'sudoku', n: 10 } },
  { id: 'volcan', name: 'Volcan', desc: 'Une éruption au loin, une falaise de basalte au-dessus d’un lac de lave.', need: { kind: 'code', n: 15 } },
  { id: 'pixel', name: 'Monde en pixels', desc: 'Un monde de jeu 8 bits : blocs d’herbe, nuages en cases, pièces qui tournent.', need: { kind: 'pixels', n: 8 } },
  { id: 'donjon', name: 'Donjon', desc: 'Pierres et torches, bannières, chaînes, un coffre au trésor qui brille.', need: { kind: 'briques', n: 5 } },
  { id: 'medieval', name: 'Grand hall', desc: 'Pierre, feu de cheminée, torches, blason noir et or.', need: { kind: 'workouts', n: 40 } },
  { id: 'neon', name: 'Néon rétro', desc: 'Soleil à rayures, palmiers de néon, sol quadrillé qui défile.', need: { kind: 'gems', n: 8 } },
  { id: 'pirate', name: 'Navire pirate', desc: 'Le pont d’un trois-mâts en pleine mer, voiles et drapeau au vent.', need: { kind: 'paires', n: 8 } },
  { id: 'arcade', name: 'Salle d’arcade', desc: 'Des bornes qui clignotent le long des murs, néons, machine à pince.', need: { kind: 'sprint', n: 1500 } },
  { id: 'labo', name: 'Labo secret', desc: 'Tubes lumineux pleins de bulles, grand écran, voyants, un hologramme.', need: { kind: 'echo', n: 12 } },
  { id: 'echiquier', name: 'Échiquier géant', desc: 'Un sol en échiquier, des pièces géantes, la lune aux fenêtres.', need: { kind: 'cap', n: 5 } },
  { id: 'station', name: 'Station spatiale', desc: 'En orbite : une planète bleue, sa lune, des nébuleuses, des panneaux solaires.', need: { kind: 'level', n: 12 } },
  { id: 'iles', name: 'Îles célestes', desc: 'Une île qui flotte dans le ciel, des cascades, des nuages en dessous.', need: { kind: 'level', n: 15 } },
  { id: 'arene', name: 'Arène romaine', desc: 'Du sable, des arches, la foule qui t’encourage, des braseros.', need: { kind: 'workouts', n: 60 } },
  { id: 'plage', name: 'Ponton sur la mer', desc: 'Le soleil se couche sur l’eau, les mouettes passent.', need: { kind: 'blocs', n: 6000 } },
  { id: 'sommet', name: 'Sommet', desc: 'En haut de la montagne, sous une aurore boréale.', need: { kind: 'level', n: 20 } },
  { id: 'stade', name: 'Stade la nuit', desc: 'Tribunes pleines, projecteurs, tableau d’affichage, pelouse tondue.', need: { kind: 'workouts', n: 80 } },
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
  soirs: (h, n) => `${fmt(h)} / ${fmt(n)} soirs avec ta routine`,
  boxe: (h, n) => `${fmt(h)} / ${fmt(n)} séances C (cardio boxe)`,
  serpent: (h, n) => `${fmt(h)} / ${fmt(n)} fruits au Serpent`,
  paires: (h, n) => `niveau ${h} / ${n} aux Paires`,
  code: (h, n) => `${fmt(h)} / ${fmt(n)} codes secrets trouvés`,
  pixels: (h, n) => `${fmt(h)} / ${fmt(n)} dessins trouvés aux Pixels cachés`,
  briques: (h, n) => `niveau ${h} / ${n} au Casse-briques`,
  sprint: (h, n) => `${fmt(h)} / ${fmt(n)} m au Sprint`,
  echo: (h, n) => `une suite de ${h} / ${n} à Écho`,
  cap: (h, n) => `${fmt(h)} / ${fmt(n)} victoires contre Cap aux échecs`,
};

// Tes chiffres pour les décors, recalculés depuis tes données : séances
// faites (sans M, chacune une fois par jour), niveau, meilleures parties,
// niveaux réussis aux Cristaux et aux Paires, sudokus résolus, codes trouvés,
// matins et soirs avec ta routine, jours avec une séance C (cardio boxe),
// dessins trouvés aux Pixels, niveau du Casse-briques, records du Sprint et
// d'Écho, victoires contre Cap aux échecs.
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
    soirs: days.filter((d) => routineStatus(d.routine, 'soir').complete).length,
    boxe: days.filter((d) => (d.workouts ?? []).includes('C')).length,
    serpent: state.games?.serpent?.best ?? 0,
    paires: state.games?.paires?.top ?? 0,
    code: state.games?.code?.wins ?? 0,
    pixels: Array.isArray(state.games?.pixels?.done) ? state.games.pixels.done.length : 0,
    briques: state.games?.briques?.level ?? 0,
    sprint: state.games?.sprint?.best ?? 0,
    echo: state.games?.echo?.best ?? 0,
    cap: Object.values(state.games?.echecs?.wins ?? {}).reduce((n, x) => n + (Number(x) || 0), 0),
  };
}

// Où tu en es pour chaque décor. stats : les chiffres de decorStats.
export function decorStatus(stats = {}) {
  return DECORS.map((d) => {
    if (!d.need) return { ...d, unlocked: true, pct: 1, label: 'Ouvert dès le départ' };
    const have = Math.max(0, Math.floor(Number(stats[d.need.kind]) || 0));
    const unlocked = have >= d.need.n;
    return { ...d, unlocked, pct: Math.min(1, have / d.need.n), label: unlocked ? 'Débloqué' : NEED[d.need.kind](Math.min(have, d.need.n), d.need.n) };
  });
}

// Le décor à montrer : celui choisi s'il est débloqué, sinon la salle. Un
// décor de saison (seasons.js) se montre pendant sa saison (today : le jour) ;
// après, c'est le décor d'avant qui revient (back), s'il est débloqué.
export function decorToShow(chosen, stats, today, back = 'salle') {
  const season = SEASONS.find((x) => x.id === chosen);
  if (season) return today && seasonYear(season, today) !== null ? chosen : decorToShow(back, stats);
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
// le même, en coordonnées de l'écran (un ciel qui finit juste au-dessus des murs)
const ulin = (id, [x1, y1, x2, y2], list) => `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops(list)}</linearGradient>`;
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
const K6 = (P(0, 1)[1] - P(0, 0)[1]) / (P(0, 0)[0] - P(0, 1)[0]); // la pente des bords du sol, à l'écran
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
  // des spots au plafond qui éclairent les murs en cône, couleur cuivre
  const wash = (side, t) => {
    const q = side === 'L' ? lw : rw;
    const spot = side === 'L' ? onL(t - 0.16, t + 0.16, HW - 0.12, HW, '#2e2622') : onR(t - 0.16, t + 0.16, HW - 0.12, HW, '#2e2622');
    return poly([q(t - 0.12, HW - 0.12), q(t + 0.12, HW - 0.12), q(t + 0.75, 0.25), q(t - 0.75, 0.25)], `url(#${u('wash')})`) + spot
      + `<ellipse cx="${r1(q(t, HW - 0.14)[0])}" cy="${r1(q(t, HW - 0.14)[1])}" rx="2.2" ry="1" fill="#ffe2c4"/>`;
  };
  // deux suspensions au bout de leur fil, ampoules chaudes
  const lamp = (x, y) => `<path d="M${x} 0V${y - 7}" stroke="#3a302a" stroke-width="0.8"/><circle cx="${x}" cy="${y + 3}" r="26" fill="url(#${u('bulb')})"/>`
    + `<path d="M${x - 8} ${y + 2}L${x - 3} ${y - 7}H${x + 3}L${x + 8} ${y + 2}Z" fill="#c98059"/><path d="M${x} ${y - 7}H${x + 3}L${x + 8} ${y + 2}H${x}Z" fill="#8f5232"/>`
    + `<ellipse cx="${x}" cy="${y + 2}" rx="8" ry="1.8" fill="#5e3a24"/><circle cx="${x}" cy="${y + 3.4}" r="2.6" fill="#fff1d8"/>`;
  // le socle de béton sous le plancher, une bande de cuivre allumée tout autour
  const slab = box(0, 0, -0.5, N, N, 0.5, ['#1d1916', '#15110f', '#1b1714'])
    + poly([P(0, N, -0.16), P(N, N, -0.16), P(N, N, -0.1), P(0, N, -0.1)], '#e9a87c', ' opacity="0.9"')
    + poly([P(N, 0, -0.16), P(N, N, -0.16), P(N, N, -0.1), P(N, 0, -0.1)], '#e9a87c', ' opacity="0.9"');
  const [sx, sy] = P(N, N, -0.5);
  const under = `<ellipse cx="${r1(sx)}" cy="${r1(sy + 6)}" rx="190" ry="34" fill="url(#${u('pool')})"/>`;
  // des kettlebells devant, à gauche ; des disques et un médecine-ball à droite
  const kettle = (X, Y, s, c) => {
    const [x, y] = P(X, Y, 0);
    return `<g transform="translate(${r1(x)} ${r1(y)}) scale(${s})"><ellipse rx="5.6" ry="2" fill="#000" opacity="0.35"/><circle cy="-5" r="5" fill="${c}"/><path d="M-3.4 -8.4a3.4 3.4 0 0 1 6.8 0" stroke="${c}" stroke-width="1.8" fill="none"/>`
      + '<path d="M-3.6 -7.6a5 5 0 0 1 3 -2.2" stroke="#fff" stroke-opacity="0.35" stroke-width="1" fill="none"/></g>';
  };
  const plates = (() => {
    const [x, y] = P(6.55, 3.55, 0);
    return [0, 1, 2].map((k) => `<ellipse cx="${r1(x)}" cy="${r1(y - k * 2.6)}" rx="${9 - k * 1.6}" ry="${r1((9 - k * 1.6) * 0.6)}" fill="#2a2522" stroke="#8f5232" stroke-width="0.8"/>`).join('')
      + `<ellipse cx="${r1(x)}" cy="${r1(y - 5.2)}" rx="1.6" ry="1" fill="#0c0a09"/>`;
  })();
  const mball = (() => {
    const [x, y] = P(6.3, 3.05, 0);
    return `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="6" ry="2.2" fill="#000" opacity="0.35"/><circle cx="${r1(x)}" cy="${r1(y - 5.4)}" r="5.6" fill="#3a2e28"/><path d="M${r1(x - 5.6)} ${r1(y - 5.4)}h11.2" stroke="#c98059" stroke-width="1"/><path d="M${r1(x - 3.6)} ${r1(y - 8.4)}a5 5 0 0 1 3 -2" stroke="#fff" stroke-opacity="0.3" stroke-width="1" fill="none"/>`;
  })();
  // le miroir : deux reflets en biais
  const [m0x, m0y] = rw(5.1, 2.4), [m1x, m1y] = rw(5.6, 2.4);
  const glare = `<path d="M${r1(m0x)} ${r1(m0y)}l10 0l-14 34l-10 0z" fill="#fff" opacity="0.06"/><path d="M${r1(m1x + 8)} ${r1(m1y + 2)}l4 0l-14 34l-4 0z" fill="#fff" opacity="0.08"/>`;
  return {
    bg: `url(#${u('room')})`,
    defs: lin(u('wallL'), [0, 0, 1, 0], [[0, '#14110f'], [1, '#201a16']]) + lin(u('wallR'), [0, 0, 1, 0], [[0, '#251e19'], [1, '#18130f']])
      + lin(u('floor'), [0, 0, 0, 1], [[0, '#211c19'], [1, '#2e2723']])
      + lin(u('ledL'), [0, 0, 1, 0], [[0, '#f2c3a3', 0.22], [1, '#f2c3a3', 0]]) + lin(u('ledR'), [1, 0, 0, 0], [[0, '#f2c3a3', 0.22], [1, '#f2c3a3', 0]])
      + lin(u('mirror'), [0, 0, 1, 1], [[0, '#34343a'], [0.5, '#1a1b1f'], [1, '#2a2b30']])
      + rad(u('room'), [[0, '#30241c'], [0.55, '#17120f'], [1, '#090807']], ' cx="0.5" cy="0.36" r="0.7"')
      + lin(u('wash'), [0, 0, 0, 1], [[0, '#ffcfa6', 0.3], [0.6, '#e9a87c', 0.08], [1, '#e9a87c', 0]])
      + rad(u('bulb'), [[0, '#ffdcb0', 0.55], [0.4, '#ffb980', 0.16], [1, '#ffb980', 0]])
      + rad(u('pool'), [[0, '#e9a87c', 0.2], [0.6, '#b8714c', 0.06], [1, '#b8714c', 0]])
      + lin(u('sheen'), [0, 0, 1, 0], [[0, '#fff', 0], [0.5, '#ffe2c4', 0.07], [1, '#fff', 0]]),
    back: `${under}${slab}${wallL(`url(#${u('wallL')})`)}${wallR(`url(#${u('wallR')})`)}<path d="${grid.join('')}" stroke="#dc9a70" stroke-opacity="0.18" stroke-width="0.5"/>`
      + wash('L', 1.3) + wash('L', 5.3) + wash('R', 1.25) + wash('R', 4.4)
      + `<g class="hub-logo">${facet(needle[2], needle[3], '#f3c9a8')}${facet(needle[2], needle[1], '#d9956b')}${facet(needle[3], needle[0], '#b8714c')}${facet(needle[1], needle[0], '#8f5232')}</g>`
      + onR(4.6, 6.7, 0.5, 2.6, `url(#${u('mirror')})`, ' stroke="#6a5444" stroke-width="0.9"') + glare
      + `<g class="hub-screen">${onR(1.9, 4.2, 1.5, 2.75, '#0a0807', ' stroke="#3a2a20" stroke-width="0.8"')}${onRight(2.1, 2.4, say(pick, title))}</g>${gloves}`
      + `<g class="hub-lamps">${lamp(50, 150)}${lamp(310, 150)}</g>`,
    floor: `${floorPoly(`url(#${u('floor')})`)}${tiles('#000', 0.4)}${poly([P(1.2, 0), P(2.6, 0), P(2.6, N), P(1.2, N)], `url(#${u('sheen')})`)}${poly([P(4.4, 0), P(5.0, 0), P(5.0, N), P(4.4, N)], `url(#${u('sheen')})`)}`
      + `<g opacity="0.35">${poly([f(-0.9, -0.9), f(0, 0), f(0.9, -0.9)], '#d9956b')}${poly([f(0.9, -0.9), f(0, 0), f(0.9, 0.9)], '#b8714c')}${poly([f(0.9, 0.9), f(0, 0), f(-0.9, 0.9)], '#8f5232')}${poly([f(-0.9, 0.9), f(0, 0), f(-0.9, -0.9)], '#f3c9a8')}</g>`,
    edge: `<g class="hub-led">${poly([P(0, 0), P(0, N), P(0.9, N), P(0.9, 0)], `url(#${u('ledL')})`)}${poly([P(0, 0), P(N, 0), P(N, 0.9), P(0, 0.9)], `url(#${u('ledR')})`)}`
      + `${poly([P(0, 0, 0.1), P(0, N, 0.1), P(0, N, 0.2), P(0, 0, 0.2)], '#f6d2b6', ' opacity="0.9"')}${poly([P(0, 0, 0.1), P(N, 0, 0.1), P(N, 0, 0.2), P(0, 0, 0.2)], '#f6d2b6', ' opacity="0.9"')}</g>${cap('#5a4a3e')}`,
    props: `<g class="hub-treadmill">${box(2.85, 0.35, 0, 1.3, 0.75, 0.2, ['#3a332f', '#1f1a17', '#2b2521'])}${box(2.87, 0.4, 0.2, 1.22, 0.65, 0.03, ['#141110', '#141110', '#141110'])}${box(2.8, 0.3, 0.2, 0.12, 0.85, 1.3, ['#4a423d', '#2e2824', '#3a332f'])}${box(2.76, 0.35, 1.45, 0.2, 0.75, 0.24, ['#2a2420', '#1c1816', '#24201c'])}`
      + `${poly([P(2.97, 0.45, 1.69), P(2.97, 0.95, 1.69), P(2.97, 0.95, 1.6), P(2.97, 0.45, 1.6)], '#e9a87c', ' opacity="0.85"')}</g>`
      + `<g class="hub-weights">${kettle(3.25, 6.35, 0.85, '#4a423d')}${kettle(3.62, 6.62, 1, '#c98059')}${kettle(3.3, 6.85, 0.75, '#4a423d')}${mball}${plates}</g>`,
    beam: ['#ffe2c4', '#ffd2a8'], dust: '#ffe2c4',
    plat: ['#2b2523', '#171311', '#1f1a18'], vig: 0.5,
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

  // dehors, au coucher du soleil : le Fuji, une pagode dans la brume, une
  // branche de cerisier en fleurs, des oiseaux
  const sun = `<circle cx="148" cy="46" r="44" fill="url(#${u('sunglow')})"/><circle cx="148" cy="46" r="16" fill="#ef5d4d"/>`;
  const fuji = `<g transform="translate(70 88)"><path d="M-120 92C-62 54 -27 20 -8 0L8 0C27 20 62 54 120 92Z" fill="url(#${u('fuji')})"/>`
    + '<path d="M-8 0L8 0C13 5 18 11 24 17L19 15L15 21L9 16L4 23L-1 16L-7 22L-11 15L-17 19L-23 16C-17 11 -12 5 -8 0Z" fill="#fbeff0"/>'
    + '<path d="M-8 0L0 0L0 18L-1 16L-7 22L-11 15L-17 19L-23 16C-17 11 -12 5 -8 0Z" fill="#cbb6d2"/></g>';
  const hills = '<path d="M-10 156Q24 132 62 146T140 140T220 136T296 146T370 130V230H-10Z" fill="#7d4a6f" opacity="0.5"/>'
    + '<path d="M-10 170Q30 152 70 164T150 160T230 156T310 166T370 150V230H-10Z" fill="#5a3559" opacity="0.6"/>';
  const pagoda = (() => {
    let d = '', y = 160;
    for (let i = 0; i < 5; i++) {
      const w = 15 - i * 1.9, ry = y - 11;
      d += `M${r1(318 - w * 0.6)} ${y}V${ry}H${r1(318 + w * 0.6)}V${y}Z`
        + `M${r1(318 - w * 1.3)} ${r1(ry - 1)}Q${r1(318 - w * 0.8)} ${r1(ry + 1.6)} ${r1(318 - w * 0.5)} ${r1(ry - 4)}H${r1(318 + w * 0.5)}Q${r1(318 + w * 0.8)} ${r1(ry + 1.6)} ${r1(318 + w * 1.3)} ${r1(ry - 1)}L${r1(318 + w * 0.9)} ${r1(ry + 1)}H${r1(318 - w * 0.9)}Z`;
      y = ry - 4;
    }
    return `<path d="${d}M317.3 ${y}h1.4v-15h-1.4z" fill="#4a2c52" opacity="0.88"/>`
      + [3, 7, 11].map((k) => `<rect x="315.6" y="${y - k}" width="4.8" height="1" fill="#4a2c52" opacity="0.88"/>`).join('');
  })();
  const mist = [[70, 150, 26], [290, 142, 32]].map(([x, y, d], k) => drift(`<ellipse cx="${x}" cy="${y}" rx="96" ry="5.5" fill="#ffe3d6" opacity="0.18"/>`, k ? -24 : 24, d, animate)).join('');
  const birds = drift(['M226 30q3 -3 6 0q3 -3 6 0', 'M244 22q2.4 -2.4 4.8 0q2.4 -2.4 4.8 0', 'M212 40q2 -2 4 0q2 -2 4 0'].map((d) => `<path d="${d}" stroke="#3b2747" stroke-width="0.9" fill="none"/>`).join(''), -30, 34, animate, 6);
  const twigs = 'M-6 6C22 10 44 20 66 24C80 26 92 32 106 31M44 17C50 26 61 33 74 37M22 9C26 2 34 -2 42 -3M68 24C72 16 80 12 88 11';
  const blooms = [[106, 31], [98, 28], [88, 11], [80, 12], [74, 37], [68, 33], [66, 24], [58, 20], [50, 27], [42, -3], [38, 14], [30, 9], [22, 8], [14, 6], [6, 5], [84, 27], [92, 34], [62, 30], [78, 22], [34, 3]];
  const blossoms = blooms.map(([x, y], k) => [0, 1, 2].map((j) => {
    const a = hash(k * 3 + j + 500) * Math.PI * 2;
    return `<circle cx="${r1(x + Math.cos(a) * 2.6)}" cy="${r1(y + Math.sin(a) * 2.2)}" r="${r1(1.9 + hash(k * 3 + j + 520) * 1.8)}" fill="${['#f7c6d4', '#f2a7bd', '#fde4ec', '#ee93ad'][(k + j) % 4]}"/>`;
  }).join('') + `<circle cx="${x}" cy="${y}" r="0.8" fill="#c2456b"/>`).join('');
  const cherry = `<path d="${twigs}" stroke="#3b2430" stroke-width="2.4" stroke-linecap="round" fill="none"/>${blossoms}`;

  // la salle sur pilotis (engawa), une fondation de pierre, et le jardin :
  // gravier ratissé autour, rochers, lanterne de pierre, bassin à carpes
  const g = -0.9;
  const rake = [];
  for (let k = 1; k <= 9; k++) {
    const e = N + 0.14 + 0.3 * k;
    rake.push(`M${pts([P(-4, e, g), P(e, e, g), P(e, -4, g)])}`);
  }
  const posts = [0, 1.15, 2.3, 3.45, 4.6, 5.75, 6.88].map((t) => poly([P(t, N, -0.55), P(t + 0.12, N, -0.55), P(t + 0.12, N, 0), P(t, N, 0)], '#5a3a22')
    + poly([P(N, t, -0.55), P(N, t + 0.12, -0.55), P(N, t + 0.12, 0), P(N, t, 0)], '#6b4529')).join('');
  const joints = [];
  for (let t = 0.6; t < N; t += 1.05) joints.push(`M${pts([P(t, N + 0.12, g), P(t, N + 0.12, -0.55)])}M${pts([P(N + 0.12, t + 0.45, g), P(N + 0.12, t + 0.45, -0.55)])}`);
  const base = box(-0.12, -0.12, g, N + 0.24, N + 0.24, 0.35, ['#9a9486', '#6f6a60', '#7f796d']) + `<path d="${joints.join('')}" stroke="#57524a" stroke-width="0.7"/>`
    + box(0, 0, -0.55, N, N, 0.55, ['#3a2616', '#24170d', '#2c1c10']) + posts
    + poly([P(0, N, -0.1), P(N, N, -0.1), P(N, N, 0), P(0, N, 0)], '#7a5233') + poly([P(N, 0, -0.1), P(N, N, -0.1), P(N, N, 0), P(N, 0, 0)], '#8a5f3c');
  const rock = (X, Y, s, k) => {
    const [x, y] = P(X, Y, g);
    const rings = [1.05, 1.5, 1.95].map((m) => `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(14 * s * m)}" ry="${r1(8.4 * s * m)}" fill="none" stroke="#a6948a" stroke-opacity="0.75" stroke-width="0.7"/>`).join('');
    const tuft = `<path d="M${r1(x - 9 * s)} ${r1(y + 1)}l-2 -4.5M${r1(x - 9 * s)} ${r1(y + 1)}l0.4 -5.5M${r1(x - 9 * s)} ${r1(y + 1)}l2.6 -4" stroke="#5c7a3a" stroke-width="0.9"/>`;
    return `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(29 * s)}" ry="${r1(17.5 * s)}" fill="url(#${u('gravel')})"/>${rings}`
      + `<path d="M${r1(x - 11 * s)} ${r1(y + 1)}C${r1(x - 12 * s)} ${r1(y - 9 * s)} ${r1(x - 3 * s)} ${r1(y - 14 * s)} ${r1(x + 3 * s)} ${r1(y - 12 * s)}C${r1(x + 10 * s)} ${r1(y - 10 * s)} ${r1(x + 12 * s)} ${r1(y - 3 * s)} ${r1(x + 11 * s)} ${r1(y + 1)}Z" fill="#6c675d"/>`
      + `<path d="M${r1(x - 9 * s)} ${r1(y - 5 * s)}C${r1(x - 7 * s)} ${r1(y - 11 * s)} ${r1(x + 1 * s)} ${r1(y - 13 * s)} ${r1(x + 4 * s)} ${r1(y - 11.5 * s)}C${r1(x + 1 * s)} ${r1(y - 9 * s)} ${r1(x - 4 * s)} ${r1(y - 7 * s)} ${r1(x - 9 * s)} ${r1(y - 5 * s)}Z" fill="#8f897d"/>`
      + `<ellipse cx="${r1(x - 2 * s)}" cy="${r1(y - 11 * s)}" rx="${r1(4 * s)}" ry="${r1(1.6 * s)}" fill="#6f8a45" opacity="0.85"/>${k ? tuft : ''}`;
  };
  const toro = (X, Y, s) => {
    const [x, y] = P(X, Y, g);
    return `${glow(x, y - 25 * s, 22, u('lglow'), animate, 2)}<g transform="translate(${r1(x)} ${r1(y)}) scale(${s})">`
      + '<ellipse rx="12" ry="3.6" fill="#3b3428" opacity="0.25"/><path d="M-8 0h16l-2 -4h-12z" fill="#7a7468"/>'
      + '<rect x="-3" y="-17" width="6" height="13" fill="#9a9486"/><rect y="-17" width="3" height="13" fill="#857f72"/><path d="M-9 -17h18l-1.5 -3h-15z" fill="#8a8477"/>'
      + '<rect x="-6.5" y="-29" width="13" height="9" fill="#9a9486"/><rect y="-29" width="6.5" height="9" fill="#857f72"/><rect x="-3.2" y="-27" width="6.4" height="5.5" fill="#ffd27a"/>'
      + '<path d="M-13 -29q4 -1 7 -6h12q3 5 7 6z" fill="#6f695e"/><circle cy="-36.4" r="2" fill="#6f695e"/></g>';
  };
  const [qx, qy] = P(8.7, 4.4, g);
  const stones = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    return `<ellipse cx="${r1(qx + Math.cos(a) * 44)}" cy="${r1(qy + Math.sin(a) * 26)}" rx="${r1(4.6 + hash(i + 60) * 2)}" ry="${r1(2.8 + hash(i + 61))}" fill="${hash(i + 62) > 0.5 ? '#9a9486' : '#878175'}"/>`;
  }).join('');
  const fish = (c1, c2) => `<path d="M5 0C3 -2.6 -2 -2.4 -4 0C-2 2.4 3 2.6 5 0Z" fill="${c1}"/><path d="M-3.6 0L-7.6 -2.6L-6.6 0L-7.6 2.6Z" fill="${c1}"/><ellipse cx="1.2" cy="-0.4" rx="1.6" ry="1" fill="${c2}"/>`;
  const loop = (rx, ry) => `M${r1(qx - rx)} ${r1(qy)}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0`;
  const koi = animate
    ? `<g>${fish('#f2833a', '#fff4e6')}<animateMotion path="${loop(27, 14)}" dur="16s" rotate="auto" repeatCount="indefinite"/></g>`
      + `<g>${fish('#fbf3ea', '#e2552e')}<animateMotion path="${loop(17, 8)}" dur="11s" begin="-4s" rotate="auto" repeatCount="indefinite"/></g>`
    : `<g transform="translate(${r1(qx - 12)} ${r1(qy + 5)}) rotate(-15)">${fish('#f2833a', '#fff4e6')}</g><g transform="translate(${r1(qx + 14)} ${r1(qy - 5)}) rotate(160)">${fish('#fbf3ea', '#e2552e')}</g>`;
  const lily = (dx, dy, r, flower) => `<g transform="translate(${r1(qx + dx)} ${r1(qy + dy)})"><ellipse rx="${r}" ry="${r1(r * 0.6)}" fill="#5f8f4c"/><path d="M0 0L${r} -0.6" stroke="#2f5b4f" stroke-width="0.8"/>`
    + (flower ? '<ellipse cx="-1.4" cy="-1.6" rx="1.6" ry="2.6" fill="#f6b6c8" transform="rotate(-30 -1.4 -1.6)"/><ellipse cx="1.4" cy="-1.6" rx="1.6" ry="2.6" fill="#f6b6c8" transform="rotate(30 1.4 -1.6)"/><ellipse cy="-2.2" rx="1.4" ry="2.8" fill="#fbd3df"/>' : '') + '</g>';
  const pond = `<ellipse cx="${r1(qx)}" cy="${r1(qy + 2)}" rx="48" ry="29" fill="#000" opacity="0.12"/><ellipse cx="${r1(qx)}" cy="${r1(qy)}" rx="44" ry="26" fill="url(#${u('pond')})"/>`
    + `<ellipse cx="${r1(qx - 6)}" cy="${r1(qy - 6)}" rx="22" ry="7" fill="none" stroke="#bfe6e0" stroke-opacity="0.28" stroke-width="1"/>${koi}`
    + lily(-24, 8, 5, true) + lily(20, 10, 4.2, false) + lily(26, -8, 3.6, false) + stones;
  const fallen = Array.from({ length: 12 }, (_, k) => {
    const [X, Y] = k % 2 ? [N + 0.5 + hash(k + 700) * 2.2, hash(k + 701) * 6.5] : [hash(k + 701) * 6.5, N + 0.5 + hash(k + 700) * 2.2];
    const [x, y] = P(X, Y, g);
    return `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="1.6" ry="0.9" fill="#f4b8c8" transform="rotate(${Math.round(hash(k + 702) * 180)} ${r1(x)} ${r1(y)})"/>`;
  }).join('');
  const garden = `<rect y="190" width="${HUB.w}" height="${HUB.h - 190}" fill="url(#${u('gravel')})"/><path d="${rake.join('')}" stroke="#a6948a" stroke-opacity="0.75" stroke-width="0.7" fill="none"/>`
    + rock(5.6, 9.1, 1, 1) + rock(3.6, 10.4, 0.6, 0) + rock(10.1, 6.8, 0.7, 1) + pond + fallen + toro(3.2, 8.8, 0.95) + base;
  return {
    bg: `url(#${u('sky')})`,
    defs: lin(u('wallL'), [0, 0, 1, 0], [[0, '#e7dcc1'], [1, '#f2e9d3']]) + lin(u('wallR'), [0, 0, 1, 0], [[0, '#f5ecd6'], [1, '#e4d8bc']])
      + rad(u('lglow'), [[0, '#ffe6a8', 0.55], [1, '#ffcf7a', 0]])
      + ulin(u('sky'), [0, 0, 0, 190], [[0, '#2b2452'], [0.42, '#6a3d6e'], [0.74, '#d0687a'], [1, '#f4a582']])
      + rad(u('sunglow'), [[0, '#ffc19a', 0.8], [0.4, '#ff9474', 0.32], [1, '#ff9474', 0]])
      + lin(u('fuji'), [0, 0, 1, 0], [[0, '#2f2852'], [0.5, '#4c3b6a'], [1, '#7a5578']])
      + ulin(u('gravel'), [0, 250, 0, 452], [[0, '#e5d7ca'], [1, '#bcaaa3']])
      + rad(u('pond'), [[0, '#4f9198'], [1, '#26535f']]),
    back: `${sun}${hills}${fuji}${pagoda}${mist}${birds}${cherry}${garden}`
      + `${wallL(`url(#${u('wallL')})`)}${wallR(`url(#${u('wallR')})`)}${shoji('L')}${shoji('R')}`
      + onR(2.75, 3.35, 1.25, 2.6, '#f6efe0', ' stroke="#3b2a1c" stroke-width="0.6"') + onRight(3.05, 2.05, enso)
      + `<g class="hub-screen">${onR(2.1, 4.0, 0.42, 1.02, '#6b4a2e', ' stroke="#3b2717" stroke-width="0.8"')}${onRight(2.25, 0.85, say(pick, title, { fill: '#f6e7c8', sub: '#f1e3c6', size: 5.2 }))}</g>`,
    floor: mats.join(''),
    edge: cap('#4a2f1c', 2.6),
    props: `<g class="hub-lantern">${lantern(3.4, 6.45, 0)}${lantern(6.45, 3.4, 1)}</g>`,
    over: petals,
    beam: ['#fffaf0', '#fff1d6'], dust: '#fff8ea',
    plat: ['#d8b98a', '#9a7850', '#b99467'], vig: 0.34,
    sky: true, // son soleil : pas de lune en plus la nuit (daylight.js)
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
    sky: true, // sa lune : pas de deuxième la nuit (daylight.js)
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
  // dehors, l'espace : nébuleuses, étoiles, une grande planète bleue et sa
  // lune, un satellite qui passe ; sous le plancher, la coque de la station,
  // ses feux de position et ses deux ailes de panneaux solaires
  const nebula = [[250, 64, 130, 'nebA'], [70, 190, 110, 'nebB'], [300, 430, 130, 'nebA'], [50, 420, 120, 'nebB']].map(([x, y, r, id]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${u(id)})"/>`).join('');
  const twinkle = Array.from({ length: 14 }, (_, k) => `<circle cx="${r1(hash(k + 950) * HUB.w)}" cy="${r1(hash(k + 951) * 452)}" r="1.1" fill="#dff4ff">${pulse('1;0.25;1', r1(1.8 + hash(k + 952) * 2.4), animate)}</circle>`).join('');
  const [gx, gy, gr] = [40, 70, 62];
  const land = [[-28, -22, 22, 12, -20], [10, 4, 26, 14, 25], [-8, 30, 16, 8, 10], [30, -30, 12, 7, -35], [-40, 14, 10, 18, 0]]
    .map(([dx, dy, rx, ry, rot]) => `<ellipse cx="${gx + dx}" cy="${gy + dy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${gx + dx} ${gy + dy})" fill="#4f9a5e" opacity="0.85"/>`).join('');
  const clouds = drift([[-20, -36, 30, 4], [16, -8, 34, 4.5], [-34, 22, 26, 3.5], [8, 34, 30, 4], [40, 12, 18, 3]]
    .map(([dx, dy, rx, ry]) => `<ellipse cx="${gx + dx}" cy="${gy + dy}" rx="${rx}" ry="${ry}" transform="rotate(-18 ${gx + dx} ${gy + dy})" fill="#fff" opacity="0.55"/>`).join(''), 14, 40, animate);
  const planet = `<circle cx="${gx}" cy="${gy}" r="${gr + 12}" fill="url(#${u('atmo')})"/><circle cx="${gx}" cy="${gy}" r="${gr}" fill="url(#${u('ocean')})"/>`
    + `<g clip-path="url(#${u('pclip')})">${land}${clouds}<circle cx="${gx}" cy="${gy}" r="${gr}" fill="url(#${u('night')})"/></g>`
    + `<circle cx="${gx}" cy="${gy}" r="${gr}" fill="none" stroke="#9fd8ff" stroke-opacity="0.5" stroke-width="1.2"/>`;
  const moon = '<circle cx="322" cy="40" r="12" fill="#c9ccd6"/><circle cx="318" cy="37" r="2.6" fill="#a7abb8"/><circle cx="325" cy="45" r="1.8" fill="#a7abb8"/><circle cx="327" cy="34" r="1.3" fill="#a7abb8"/>'
    + '<path d="M310 40a12 12 0 0 0 12 12a12 12 0 0 1 -6 -12a12 12 0 0 1 6 -12a12 12 0 0 0 -12 12z" fill="#1b1f2c" opacity="0.6"/>';
  const sat = drift('<g transform="translate(232 26) rotate(-12)"><rect x="-2.4" y="-1.6" width="4.8" height="3.2" fill="#c9ccd6"/><rect x="-11" y="-1.2" width="7.6" height="2.4" fill="#3b6fd0"/><rect x="3.4" y="-1.2" width="7.6" height="2.4" fill="#3b6fd0"/><path d="M0 -1.6v-3" stroke="#c9ccd6" stroke-width="0.6"/></g>', 46, 38, animate, 10);
  const hullLines = [];
  for (let t = 1.17; t < N; t += 1.17) hullLines.push(`M${pts([P(t, N, -1.1), P(t, N, 0)])}M${pts([P(N, t, -1.1), P(N, t, 0)])}`);
  for (const z of [-0.42, -0.78]) hullLines.push(`M${pts([P(0, N, z), P(N, N, z), P(N, 0, z)])}`);
  const navLights = [[1.2, 'L', '#ff5a5a'], [3.5, 'L', '#ffe6a0'], [5.8, 'L', '#ff5a5a'], [1.2, 'R', '#5aff9c'], [3.5, 'R', '#ffe6a0'], [5.8, 'R', '#5aff9c']].map(([t, side, c], k) => {
    const [x, y] = side === 'L' ? P(t, N, -0.95) : P(N, t, -0.95);
    return `<circle cx="${r1(x)}" cy="${r1(y)}" r="1.3" fill="${c}">${pulse('1;0.15;1', r1(1.2 + (k % 3) * 0.5), animate)}</circle>`;
  }).join('');
  const [ex, ey] = P(N, N, -1.1);
  const engine = `<ellipse cx="${r1(ex)}" cy="${r1(ey + 10)}" rx="16" ry="10" fill="url(#${u('thrust')})">${pulse('0.7;1;0.7', 1.6, animate)}</ellipse>`
    + `<path d="M${r1(ex - 6)} ${r1(ey)}l2 6h8l2 -6z" fill="#3a4558"/>`;
  // une aile de panneaux solaires, debout à côté de la coque, tenue par une poutre
  const wing = (side) => {
    const q = side === 'L' ? (a, b, z) => P(3.5, N + a, z) : (a, b, z) => P(N + a, 3.5, z);
    const mount = side === 'L' ? box(3.33, N, -0.78, 0.34, 0.14, 0.32, ['#5a6478', '#3a4356', '#4a5468']) : box(N, 3.33, -0.78, 0.14, 0.34, 0.32, ['#5a6478', '#3a4356', '#4a5468']);
    const truss = `${mount}<path d="M${pts([q(0.1, 0, -0.62), q(0.66, 0, -0.62)])}" stroke="#a6afc2" stroke-width="3"/><path d="M${pts([q(0.1, 0, -0.62), q(0.66, 0, -0.62)])}" stroke="#5a6478" stroke-width="0.8" stroke-dasharray="1.5 1.5"/>`;
    const panel = (a0, a1) => {
      const cells = [];
      for (let a = a0 + 0.27; a < a1; a += 0.27) cells.push(`M${pts([q(a, 0, -1.45), q(a, 0, 0.25)])}`);
      for (let z = -1.45 + 0.34; z < 0.25; z += 0.34) cells.push(`M${pts([q(a0, 0, z), q(a1, 0, z)])}`);
      return poly([q(a0, 0, -1.45), q(a1, 0, -1.45), q(a1, 0, 0.25), q(a0, 0, 0.25)], `url(#${u('solar')})`, ' stroke="#c9d3e6" stroke-width="0.9"')
        + `<path d="${cells.join('')}" stroke="#7fb0ff" stroke-opacity="0.45" stroke-width="0.5"/>`;
    };
    return `${truss}${panel(0.62, 1.66)}${panel(1.74, 2.78)}`;
  };
  const hull = box(0, 0, -1.1, N, N, 1.1, ['#2a3346', '#1a2131', '#222b3d']) + `<path d="${hullLines.join('')}" stroke="#0b0f17" stroke-width="0.9" fill="none"/>`
    + poly([P(0, N, -0.08), P(N, N, -0.08), P(N, N, 0), P(0, N, 0)], '#5ff3ff', ' opacity="0.55"') + poly([P(N, 0, -0.08), P(N, N, -0.08), P(N, N, 0), P(N, 0, 0)], '#5ff3ff', ' opacity="0.55"')
    + navLights + engine + wing('L') + wing('R');
  return {
    bg: `url(#${u('space')})`,
    defs: lin(u('wallL'), [0, 0, 1, 0], [[0, '#161c29'], [1, '#202838']]) + lin(u('wallR'), [0, 0, 1, 0], [[0, '#263044'], [1, '#18202e']])
      + lin(u('floor'), [0, 0, 0, 1], [[0, '#1f2635'], [1, '#2a3243']]) + lin(u('holo'), [0, 0, 0, 1], [[0, '#0d3a48', 0.85], [1, '#062530', 0.85]])
      + rad(u('planet'), [[0, '#6fb8ff'], [0.6, '#2f6fbf'], [1, '#132a55']], ' cx="0.35" cy="0.35" r="0.75"')
      + lin(u('ledL'), [0, 0, 1, 0], [[0, '#5ff3ff', 0.22], [1, '#5ff3ff', 0]]) + lin(u('ledR'), [1, 0, 0, 0], [[0, '#5ff3ff', 0.22], [1, '#5ff3ff', 0]])
      + lin(u('space'), [0, 0, 0, 1], [[0, '#03040d'], [0.5, '#070b1e'], [1, '#04050f']])
      + rad(u('nebA'), [[0, '#8b4fe0', 0.28], [0.6, '#5a3aa8', 0.1], [1, '#5a3aa8', 0]]) + rad(u('nebB'), [[0, '#2fb3c9', 0.22], [0.6, '#1f6f9a', 0.08], [1, '#1f6f9a', 0]])
      + rad(u('ocean'), [[0, '#6fbaff'], [0.55, '#2a66c0'], [1, '#0d2350']], ' cx="0.72" cy="0.28" r="0.9"')
      + rad(u('night'), [[0, '#000', 0], [0.55, '#000', 0], [1, '#02040c', 0.85]], ' cx="0.78" cy="0.2" r="1.05"')
      + rad(u('atmo'), [[0.8, '#7ec8ff', 0], [0.86, '#7ec8ff', 0.4], [1, '#7ec8ff', 0]])
      + `<clipPath id="${u('pclip')}"><circle cx="${gx}" cy="${gy}" r="${gr}"/></clipPath>`
      + lin(u('solar'), [0, 0, 1, 1], [[0, '#2c5bc4'], [0.5, '#163a8a'], [1, '#0f2a66']])
      + rad(u('thrust'), [[0, '#d6fbff', 0.9], [0.4, '#5ff3ff', 0.5], [1, '#5ff3ff', 0]]),
    back: `${nebula}${starField(150, 1200, 452, '#e8f4ff')}${twinkle}${planet}${moon}${sat}${hull}${wallL(`url(#${u('wallL')})`)}${wallR(`url(#${u('wallR')})`)}${seams('L')}${seams('R')}`
      + port(1.25, 1.85, false, 3) + port(5.55, 1.85, true, 40)
      + onR(4.7, 6.65, 0.75, 2.3, '#03050c', ' stroke="#3a4558" stroke-width="1.6"') + onRight(4.9, 1.5, starsIn(18, 14, 70, 20))
      + `<g class="hub-screen">${holo}${scan}${onRight(2.15, 2.25, say(pick, title, { fill: '#6ff4ff', sub: '#d6fdff' }))}</g>`,
    floor: `${floorPoly(`url(#${u('floor')})`)}${tiles('#0e131c', 0.9, 0.9)}${hazard.join('')}`,
    edge: `<g class="hub-led">${poly([P(0, 0), P(0, N), P(0.9, N), P(0.9, 0)], `url(#${u('ledL')})`)}${poly([P(0, 0), P(N, 0), P(N, 0.9), P(0, 0.9)], `url(#${u('ledR')})`)}`
      + `${poly([P(0, 0, 0.1), P(0, N, 0.1), P(0, N, 0.2), P(0, 0, 0.2)], '#5ff3ff', ' opacity="0.9"')}${poly([P(0, 0, 0.1), P(N, 0, 0.1), P(N, 0, 0.2), P(0, 0, 0.2)], '#5ff3ff', ' opacity="0.9"')}</g>${cap('#3a4558')}`,
    props: '',
    beam: ['#c9fbff', '#7ff0ff'], dust: '#aef6ff',
    plat: ['#3a4558', '#1e2533', '#2b3446'], vig: 0.4,
    sky: true, // sa planète et sa lune : pas de lune en plus la nuit (daylight.js)
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
    sky: true, // son soleil : pas de lune en plus la nuit (daylight.js)
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
// des mouettes qui traversent le ciel (plage, navire)
const gullsFlying = (animate, color = '#3a2b36') => (animate ? [[-20, 58, 400, -12, 24, 0], [-40, 70, 420, -6, 28, 9]].map(([x, y, dx, dy, d, b]) => `<g opacity="0"><g transform="translate(${x} ${y})"><path d="M-4 0q2 -2.4 4 0q2 -2.4 4 0" stroke="${color}" stroke-width="0.9" fill="none"/></g><animateTransform attributeName="transform" type="translate" values="0 0;${dx} ${dy}" dur="${d}s" begin="${b}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.95;1" dur="${d}s" begin="${b}s" repeatCount="indefinite"/></g>`).join('') : '');
// une étoile filante, de temps en temps
const shootingStar = (animate, from = [60, 20], to = [150, 54], dur = 9) => (animate ? `<g opacity="0"><path d="M0 0l-16 -6" stroke="#fff" stroke-width="1" stroke-linecap="round"/><animateTransform attributeName="transform" type="translate" values="${from.join(' ')};${to.join(' ')}" dur="${dur}s" repeatCount="indefinite"/>`
  + `<animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;0.02;0.06;0.12;1" dur="${dur}s" repeatCount="indefinite"/></g>` : '');

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

function volcan({ u, pick, title, animate }) {
  // le volcan au loin : cratère qui crache, coulées de lave, panache de cendres
  const lava = (d, w, k) => `<path d="${d}" stroke="#ff7a1a" stroke-width="${w + 4}" stroke-opacity="0.25" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#ffb347" stroke-width="${w}" fill="none" stroke-linecap="round">${pulse('1;0.6;1', 2 + k * 0.6, animate)}</path>`;
  const blobs = animate ? [[-8, 1.4, 0], [4, 1.8, 0.5], [12, 1.2, 1.1], [-2, 2.2, 1.6]].map(([dx, d, b]) => `<circle cx="${195 + dx}" cy="62" r="2.4" fill="#ffd27a"><animate attributeName="cy" values="62;${30 - Math.abs(dx)};62" dur="${d}s" begin="${b}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;0" dur="${d}s" begin="${b}s" repeatCount="indefinite"/></circle>`).join('') : '';
  const smoke = [[205, 38, 1.1, 30], [180, 22, 0.9, 38], [228, 16, 0.8, 44]].map(([x, y, sc, d], k) => drift(cloud(x, y, sc, '#3a2a2a', '#241818'), k % 2 ? 14 : -14, d, animate, -6)).join('');
  const cracks = Array.from({ length: 9 }, (_, k) => {
    const pts0 = Array.from({ length: 4 }, (_, i) => P(0.5 + hash(k + 60) * 6 + i * 0.35 * (hash(k + 61) - 0.5), 0.5 + hash(k + 62) * 6 + i * 0.4, 0.003));
    return `M${pts(pts0)}`;
  }).join('');
  const embers = fall(Array.from({ length: 14 }, (_, k) => [hash(k + 70) * HUB.w, 520, (hash(k + 71) - 0.5) * 40, -(380 + hash(k + 72) * 120), r1(5 + hash(k + 73) * 4), r1(hash(k + 74) * 6)]), '<circle r="1.1" fill="#ffb347"/>', animate);
  // la salle sur une falaise d'orgues de basalte, au-dessus d'un lac de lave :
  // des plaques de croûte noire qui flottent, la lave qui luit entre elles,
  // des bulles qui éclatent, la falaise éclairée d'en bas
  const D = 2.2;
  const edgeY = (x) => (x < 180 ? P(0, N, -D)[1] + (x - P(0, N, -D)[0]) * K6 : P(N, 0, -D)[1] + (P(N, 0, -D)[0] - x) * K6);
  const cliff = poly([P(0, N, 0), P(N, N, 0), P(N, N, -D), P(0, N, -D)], `url(#${u('cliffL')})`) + poly([P(N, 0, 0), P(N, N, 0), P(N, N, -D), P(N, 0, -D)], `url(#${u('cliffR')})`);
  const cols = [], joints = [];
  for (let t = 0.3; t < N; t += 0.34) {
    cols.push(`M${pts([P(t, N, -0.05), P(t, N, -D)])}M${pts([P(N, N - t, -0.05), P(N, N - t, -D)])}`);
    const z = -0.4 - hash(t * 7) * 1.4, z2 = -0.5 - hash(t * 7 + 3) * 1.4;
    joints.push(`M${pts([P(t - 0.34, N, z), P(t, N, z + 0.06)])}M${pts([P(N, N - t + 0.34, z2), P(N, N - t, z2 + 0.06)])}`);
  }
  const basalt = `${cliff}<path d="${cols.join('')}" stroke="#0e0606" stroke-width="1"/><path d="${cols.join('')}" stroke="#5a2a1c" stroke-opacity="0.35" stroke-width="0.6" transform="translate(1.1 0)"/><path d="${joints.join('')}" stroke="#0e0606" stroke-width="0.8"/>`;
  // le bord de la lave contre la falaise : une ligne qui ondule et brille
  const shore = [];
  for (let x = -10; x <= 370; x += 10) shore.push([x, edgeY(x) - 2 + Math.sin(x * 0.21) * 1.6]);
  const shoreD = `M${shore.map(([x, y]) => `${r1(x)} ${r1(y)}`).join('L')}`;
  const front = `<path d="${shoreD}L370 ${HUB.h}L-10 ${HUB.h}Z" fill="url(#${u('lava')})"/>`;
  const plates = [];
  for (let gy = 300, j = 0; gy < 470; gy += 14, j++) {
    for (let gx = (j % 2) * 16 - 10; gx < 380; gx += 32) {
      const k = j * 31 + gx;
      const cx = gx + (hash(k) - 0.5) * 14, cy = gy + (hash(k + 1) - 0.5) * 6;
      if (cy < edgeY(cx) + 9) continue;
      const rx = 13 + hash(k + 2) * 8, ry = rx * 0.46;
      const corners = Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2 + hash(k + 3) * 0.6;
        const m = 0.8 + hash(k + i + 4) * 0.3;
        return [cx + Math.cos(a) * rx * m, cy + Math.sin(a) * ry * m];
      });
      plates.push(`M${pts(corners)}Z`);
    }
  }
  const crust = `<path d="${plates.join('')}" fill="url(#${u('crust')})" stroke="#6a200a" stroke-width="0.8"/>`;
  const bubbles = animate ? [[40, 352], [118, 412], [262, 400], [330, 344], [80, 430], [300, 432]].map(([x, y], k) => `<circle cx="${x}" cy="${y}" r="0" fill="#ffd27a" stroke="#fff1c4" stroke-width="0.6"><animate attributeName="r" values="0;3.4;0" dur="${r1(2.2 + k * 0.5)}s" begin="${r1(k * 0.7)}s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0.8;0" dur="${r1(2.2 + k * 0.5)}s" begin="${r1(k * 0.7)}s" repeatCount="indefinite"/></circle>`).join('') : '';
  const rim = `<path d="${shoreD}" stroke="#ff7a1a" stroke-opacity="0.45" stroke-width="7" fill="none"/><path d="${shoreD}" stroke="#ffd27a" stroke-width="1.6" fill="none">${pulse('1;0.6;1', 2.4, animate)}</path>`;
  return {
    bg: `url(#${u('sky')})`,
    defs: lin(u('sky'), [0, 0, 0, 1], [[0, '#120404'], [0.3, '#3a0e08'], [1, '#1a0705']]) + lin(u('cone'), [0, 0, 0, 1], [[0, '#3a1810'], [1, '#160807']])
      + rad(u('crater'), [[0, '#ffd27a', 0.9], [0.5, '#ff7a1a', 0.5], [1, '#ff3a00', 0]]) + ulin(u('lava'), [0, 290, 0, 452], [[0, '#ffb347'], [0.45, '#ff7a1a'], [1, '#c2300a']])
      + ulin(u('crust'), [0, 300, 0, 452], [[0, '#3a140a'], [1, '#1e0805']]) + lin(u('cliffL'), [0, 0, 0, 1], [[0, '#1c1212'], [0.55, '#2a1410'], [1, '#8a3210']]) + lin(u('cliffR'), [0, 0, 0, 1], [[0, '#261818'], [0.55, '#341a12'], [1, '#9a3a12']])
      + lin(u('floor'), [0, 0, 0, 1], [[0, '#221b1e'], [1, '#2e2427']]),
    back: `<circle cx="195" cy="70" r="90" fill="url(#${u('crater')})" opacity="0.6"/>${smoke}<path d="M-20 270L150 70q45 -14 90 0L390 270Z" fill="url(#${u('cone')})"/>`
      + `<ellipse cx="195" cy="66" rx="34" ry="7" fill="url(#${u('crater')})">${pulse('1;0.7;1', 1.6, animate)}</ellipse>${blobs}`
      + lava('M182 70C170 110 150 130 128 180', 3, 0) + lava('M210 70C222 120 248 140 262 190', 2.6, 1) + lava('M196 72C196 100 188 120 176 150', 2, 2)
      + `<rect y="250" width="${HUB.w}" height="${HUB.h - 250}" fill="url(#${u('lava')})"/>${basalt}${front}${crust}${bubbles}${rim}`
      + box(-0.18, 0, 0, 0.18, N, 0.35, ['#3a2a2a', '#1a1010', '#2a1d1d']) + box(0, -0.18, 0, N, 0.18, 0.35, ['#3a2a2a', '#1a1010', '#2a1d1d'])
      + signboard(1.3, 3.7, 1.05, 1.65, '#2a1c1c', ['#3a2a2a', '#1a1010', '#2a1d1d'], onRight(1.5, 1.5, say(pick, title, { fill: '#ffb347', sub: '#ffd9b0', size: 5.6 }))),
    floor: `${floorPoly(`url(#${u('floor')})`)}${tiles('#000', 0.5, 0.8)}<path d="${cracks}" stroke="#ff7a1a" stroke-width="1" stroke-linecap="round" fill="none" opacity="0.7">${pulse('0.7;0.35;0.7', 3, animate)}</path>`,
    edge: '',
    props: '',
    over: embers,
    beam: ['#ffd9b0', '#ff9a5c'], dust: '#ffb070',
    plat: ['#3a2a2a', '#1e1414', '#2c1f1f'], vig: 0.55,
  };
}

function jungle({ u, pick, title, animate }) {
  // un temple oublié : pierres moussues, cascade, lianes, papillons
  const stones = (q) => {
    const d = [];
    for (let k = 1, z = 0.42; z < HW; k++, z += 0.42) {
      d.push(`M${pts([q(0, z), q(N, z)])}`);
      for (let t = (k % 2) * 0.5; t < N; t += 1) d.push(`M${pts([q(t, z - 0.42), q(t, z)])}`);
    }
    return `<path d="${d.join('')}" stroke="#1d2a1d" stroke-opacity="0.6" stroke-width="0.7" fill="none"/>`;
  };
  const moss = (q, k0) => Array.from({ length: 9 }, (_, k) => {
    const [x, y] = q(hash(k + k0) * N, hash(k + k0 + 1) > 0.5 ? 0.15 : HW - 0.1);
    return `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(6 + hash(k + k0 + 2) * 8)}" ry="${r1(2 + hash(k + k0 + 3) * 2)}" fill="#4f7a3a" opacity="0.8"/>`;
  }).join('');
  // la cascade tombe du haut du mur de droite dans un bassin
  const [w0, w1] = [2.6, 3.6];
  const streaks = Array.from({ length: 7 }, (_, k) => {
    const t = w0 + 0.1 + (k / 6) * (w1 - w0 - 0.2);
    const [x, yTop] = rw(t, HW);
    const yBot = rw(t, 0.05)[1];
    return `<path d="M${r1(x)} ${r1(yTop)}V${r1(yBot)}" stroke="#eaffff" stroke-width="1.2" stroke-dasharray="7 9" stroke-opacity="0.75">${animate ? `<animate attributeName="stroke-dashoffset" values="0;-16" dur="${r1(0.5 + hash(k) * 0.3)}s" repeatCount="indefinite"/>` : ''}</path>`;
  }).join('');
  const pool = poly([P(w0 - 0.15, 0, 0.004), P(w1 + 0.15, 0, 0.004), P(w1 + 0.1, 0.55, 0.004), P(w0 - 0.1, 0.55, 0.004)], '#5fb8c9', ' opacity="0.85"');
  const [mx, my] = P((w0 + w1) / 2, 0.2, 0.15);
  const mist = `<ellipse cx="${r1(mx)}" cy="${r1(my)}" rx="22" ry="6" fill="#fff" opacity="0.35">${pulse('0.35;0.15;0.35', 2.4, animate)}</ellipse>`;
  // des lianes qui pendent du haut des murs
  const vine = (q, t, len, k) => {
    const [x, y] = q(t, HW);
    const path = `<path d="M${r1(x)} ${r1(y)}c-4 ${r1(len * 0.3)} 5 ${r1(len * 0.6)} 0 ${len}" stroke="#3f6b2c" stroke-width="1.6" fill="none"/>`
      + [0.3, 0.55, 0.8].map((f) => `<ellipse cx="${r1(x + (f > 0.5 ? 2 : -2))}" cy="${r1(y + len * f)}" rx="3" ry="1.5" fill="#5b8f3c" transform="rotate(${f > 0.5 ? 30 : -30} ${r1(x)} ${r1(y + len * f)})"/>`).join('');
    return sway(path, x, y, 4, 3 + (k % 3), animate);
  };
  const vines = [[lw, 0.8, 34], [lw, 2.2, 22], [lw, 3.6, 40], [lw, 5.9, 28], [rw, 1.4, 30], [rw, 4.4, 38], [rw, 6.2, 24]].map(([q, t, len], k) => vine(q, t, len, k)).join('');
  const canopy = Array.from({ length: 14 }, (_, k) => `<circle cx="${r1((k / 13) * (HUB.w + 40) - 20)}" cy="${r1(10 + hash(k + 90) * 30)}" r="${r1(26 + hash(k + 91) * 16)}" fill="${k % 2 ? '#14301c' : '#1b3d24'}"/>`).join('');
  const rays = [[60, 0.06], [140, 0.05], [250, 0.06]].map(([x, o]) => `<path d="M${x} 0l40 0l60 260l-40 0z" fill="#fff6c8" opacity="${o}"/>`).join('');
  const glyphs = onLeft(6.25, 2.45, `<path d="M0 6${'h3v-6h3v6'.repeat(9)}" stroke="#24331f" stroke-width="1.6" fill="none"/><circle cx="30" cy="-6" r="4.5" fill="none" stroke="#24331f" stroke-width="1.4"/><path d="M30 -13v2.5M30 1v-2.5M23 -6h2.5M37 -6h-2.5" stroke="#24331f" stroke-width="1.4"/>`);
  const leafPlant = ([X, Y]) => {
    const [x, y] = P(X + 0.2, Y + 0.2, 0);
    return [-50, -20, 10, 40, 70].map((a, k) => `<ellipse cx="${r1(x + Math.cos((a - 90) * Math.PI / 180) * 7)}" cy="${r1(y - 8 + Math.sin((a - 90) * Math.PI / 180) * 6)}" rx="8" ry="3.4" transform="rotate(${a - 90} ${r1(x + Math.cos((a - 90) * Math.PI / 180) * 7)} ${r1(y - 8 + Math.sin((a - 90) * Math.PI / 180) * 6)})" fill="${k % 2 ? '#3f7a34' : '#4f9a3f'}"/>`).join('');
  };
  const butterfly = (col, path, dur, k) => {
    const wings = `<g><ellipse cx="-2.4" cy="0" rx="2.6" ry="1.8" fill="${col}"/><ellipse cx="2.4" cy="0" rx="2.6" ry="1.8" fill="${col}"/><rect x="-0.4" y="-1.8" width="0.8" height="3.6" fill="#2a1d14"/>${animate ? `<animateTransform attributeName="transform" type="scale" values="1 1;0.25 1;1 1" dur="0.28s" repeatCount="indefinite"/>` : ''}</g>`;
    const [x0, y0] = path[0];
    return animate ? `<g>${wings}<animateTransform attributeName="transform" type="translate" values="${path.map((p) => p.join(' ')).join(';')}" dur="${dur}s" begin="-${k * 3}s" repeatCount="indefinite"/></g>` : `<g transform="translate(${x0} ${y0})">${wings}</g>`;
  };
  const flies = butterfly('#ffb347', [[70, 210], [120, 170], [170, 230], [110, 260], [70, 210]], 14, 0) + butterfly('#7cc4e4', [[290, 200], [240, 240], [210, 190], [260, 160], [290, 200]], 12, 1);
  return {
    bg: '#0d1f12',
    defs: lin(u('wallL'), [0, 0, 1, 0], [[0, '#5a6650'], [1, '#6f7c62']]) + lin(u('wallR'), [0, 0, 1, 0], [[0, '#7a876b'], [1, '#5d6a52']])
      + lin(u('fall'), [0, 0, 0, 1], [[0, '#bdefff'], [1, '#7fd0e6']]) + lin(u('floor'), [0, 0, 0, 1], [[0, '#59654d'], [1, '#6a775c']]),
    back: `${canopy}${rays}${wallL(`url(#${u('wallL')})`)}${wallR(`url(#${u('wallR')})`)}${stones(lw)}${stones(rw)}${moss(lw, 1)}${moss(rw, 30)}${glyphs}`
      + `<g class="hub-waterfall">${onR(w0, w1, 0, HW, `url(#${u('fall')})`, ' opacity="0.9"')}${streaks}</g>${vines}`
      + `<g class="hub-screen">${onL(4.3, 6.3, 1.0, 1.75, '#7d8a6c', ' stroke="#3f4a35" stroke-width="1"')}${onLeft(6.15, 1.62, say(pick, title, { fill: '#1d2a14', sub: '#2a3a20', size: 5.4, font: 'Georgia, serif' }))}</g>`,
    floor: `${floorPoly(`url(#${u('floor')})`)}${tiles('#2a3424', 0.6, 0.8)}${pool}${mist}`
      + Array.from({ length: 10 }, (_, k) => { const [x, y] = P(0.4 + hash(k + 40) * 6.2, 0.4 + hash(k + 41) * 6.2, 0.003); return `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(5 + hash(k) * 9)}" ry="${r1(2 + hash(k + 1) * 3)}" fill="#4f7a3a" opacity="0.5"/>`; }).join(''),
    edge: cap('#3f4a35', 2.6),
    props: FRONT_SPOTS.map(leafPlant).join(''),
    over: flies,
    beam: ['#f6ffd8', '#d8f5a0'], dust: '#e9ffb0',
    plat: ['#5b6a52', '#36402f', '#465240'], vig: 0.5,
  };
}

function ring({ u, pick, title, animate }) {
  // la foule dans le noir, derrière les cordes ; des flashs ; deux projecteurs qui balaient
  const crowd = [];
  for (let row = 0; row < 4; row++) {
    const off = 0.9 + row * 0.75, z = 0.7 + row * 0.75;
    for (let t = -row * 0.4; t < N + 0.4; t += 0.42) {
      for (const [X, Y] of [[-off, t], [t, -off]]) {
        if (X < -off - 0.01 || Y < -off - 0.01) continue;
        const [x, y] = P(X, Y, z);
        const k = Math.round((X + 9) * 31 + (Y + 9) * 17);
        crowd.push(`<circle cx="${r1(x)}" cy="${r1(y)}" r="3.2" fill="${hash(k) > 0.5 ? '#232838' : '#1a1e2b'}"/><path d="M${r1(x - 4.5)} ${r1(y + 9)}q4.5 -6 9 0z" fill="#161925"/>`);
        if (animate && hash(k + 5) > 0.93) crowd.push(`<circle cx="${r1(x + 2)}" cy="${r1(y - 1)}" r="2.2" fill="#fff" opacity="0"><animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;0.6;0.62;0.66;1" dur="${r1(4 + hash(k + 6) * 6)}s" begin="${r1(hash(k + 7) * 5)}s" repeatCount="indefinite"/></circle>`);
      }
    }
  }
  const ropes = [0.45, 0.8, 1.15].map((z, k) => `<path d="M${pts([P(0, N, z), P(0, 0, z), P(N, 0, z)])}" stroke="${['#c0392b', '#f4eee7', '#2e6fb3'][k]}" stroke-width="1.6" fill="none"/>`).join('');
  const post = (X, Y, pad) => `${box(X - 0.08, Y - 0.08, 0, 0.16, 0.16, 1.35, ['#c9ced8', '#8a919e', '#a9b0bc'])}${box(X - 0.11, Y - 0.11, 0.35, 0.22, 0.22, 0.9, [pad, pad, pad])}`;
  const spot = (sx, sy, tx, ty, k) => {
    const cone = `<path d="M${sx - 5} ${sy}L${tx - 55} ${ty}L${tx + 55} ${ty}L${sx + 5} ${sy}Z" fill="url(#${u('spot')})"/>`;
    return animate ? `<g>${cone}<animateTransform attributeName="transform" type="rotate" values="-7 ${sx} ${sy};7 ${sx} ${sy};-7 ${sx} ${sy}" dur="${7 + k * 2}s" repeatCount="indefinite"/></g>` : cone;
  };
  const center = Array.from({ length: 41 }, (_, k) => P(3.5 + 1.2 * Math.cos((k / 40) * Math.PI * 2), 3.5 + 1.2 * Math.sin((k / 40) * Math.PI * 2), 0.003));
  const screen = `<g class="hub-screen"><path d="M180 6v18" stroke="#3a3f4c" stroke-width="1.2"/><rect x="136" y="24" width="88" height="34" rx="4" fill="#0b0e16" stroke="#3a3f4c" stroke-width="1.2"/>`
    + `<g transform="translate(180 39)">${say(pick, title, { fill: '#ffd27a', sub: '#f4eee7', size: 6, anchor: 'middle' })}</g></g>`;
  return {
    bg: '#050608',
    defs: lin(u('canvas'), [0, 0, 0, 1], [[0, '#c9ced8'], [1, '#b6bdca']]) + lin(u('spot'), [0, 0, 0, 1], [[0, '#fffbe6', 0.35], [1, '#fffbe6', 0.04]]),
    back: `<g class="hub-crowd">${crowd.join('')}</g>${screen}`
      + box(0, 0, -0.5, N, N, 0.5, ['#1a2440', '#121a30', '#16213e']) + poly([P(0, N, -0.32), P(N, N, -0.32), P(N, N, -0.25), P(0, N, -0.25)], '#f4eee7') + poly([P(N, 0, -0.32), P(N, N, -0.32), P(N, N, -0.25), P(N, 0, -0.25)], '#f4eee7')
      + post(0, 0, '#c0392b') + post(0, N, '#f4eee7') + post(N, 0, '#2e6fb3'),
    floor: `${floorPoly(`url(#${u('canvas')})`)}<path d="M${pts(center)}" stroke="#d4a63c" stroke-width="1.6" fill="none"/>${tiles('#8a919e', 0.18, 0.6)}`,
    edge: ropes,
    props: '',
    over: `<g class="hub-spots">${spot(40, -10, 150, 330, 0)}${spot(320, -10, 210, 330, 1)}</g>`,
    beam: ['#ffffff', '#fffbe6'], dust: '#ffffff',
    plat: ['#2a3550', '#141b2c', '#1e2740'], vig: 0.65,
  };
}

function desert({ u, pick, title, animate }) {
  // la nuit sur les dunes : voie lactée, croissant de lune, pyramides
  // éclairées par la lune, une caravane au loin ; devant, une oasis sous les
  // palmiers et un campement, sa tente et son feu
  const twinkle = Array.from({ length: 12 }, (_, k) => `<circle cx="${r1(hash(k + 300) * HUB.w)}" cy="${r1(hash(k + 301) * 150)}" r="1.2" fill="#fff">${pulse('1;0.2;1', r1(1.5 + hash(k + 302) * 2), animate)}</circle>`).join('');
  const milky = `<g transform="rotate(-24 180 86)"><ellipse cx="180" cy="86" rx="240" ry="30" fill="url(#${u('milky')})"/><ellipse cx="170" cy="88" rx="190" ry="11" fill="url(#${u('milky')})"/>`
    + Array.from({ length: 110 }, (_, k) => `<circle cx="${r1(-40 + hash(k + 800) * 440)}" cy="${r1(86 + (hash(k + 801) - 0.5) * 34 * hash(k + 802))}" r="${hash(k + 803) > 0.9 ? 0.9 : 0.45}" fill="#fff" opacity="${r1(0.35 + 0.6 * hash(k + 804))}"/>`).join('') + '</g>';
  const moon = `<circle cx="292" cy="46" r="48" fill="url(#${u('moonglow')})"/><circle cx="292" cy="46" r="15" fill="#f7f2de" mask="url(#${u('crescent')})"/>`;
  // une pyramide : la face de droite au clair de lune, l'autre dans l'ombre, des rangées de pierres
  const pyramid = (x, top, w, h) => {
    const base = top + h, ridge = x + w * 0.1;
    const rows = [];
    for (let t = 0.12; t < 1; t += 0.1) rows.push(`M${r1(x + (ridge - x) * t)} ${r1(top + h * t)}L${r1(x + (w / 2) * t)} ${r1(top + h * t)}`);
    const shade = [];
    for (let t = 0.17; t < 1; t += 0.1) shade.push(`M${r1(x - (w / 2) * t)} ${r1(top + h * t)}L${r1(x + (ridge - x) * t)} ${r1(top + h * t)}`);
    return `<path d="M${r1(x - w / 2)} ${base}L${x} ${top}L${r1(ridge)} ${base}Z" fill="#251f45"/><path d="${shade.join('')}" stroke="#1a1533" stroke-width="0.6"/>`
      + `<path d="M${x} ${top}L${r1(x + w / 2)} ${base}L${r1(ridge)} ${base}Z" fill="url(#${u('pyr')})"/><path d="${rows.join('')}" stroke="#4f4378" stroke-opacity="0.7" stroke-width="0.6"/>`
      + `<path d="M${x} ${top}L${r1(ridge)} ${base}" stroke="#b9a9d8" stroke-opacity="0.5" stroke-width="0.8"/>`;
  };
  // des dunes au loin : une ligne de crête éclairée
  const farDune = (y, amp, fill, k) => {
    const top = `M-10 ${y}${Array.from({ length: 8 }, (_, i) => `Q${r1(i * 50 + 15)} ${r1(y - amp * (0.4 + hash(i + k)))} ${r1(i * 50 + 40)} ${r1(y + amp * 0.15)}`).join('')}`;
    return `<path d="${top}L390 ${HUB.h}L-10 ${HUB.h}Z" fill="${fill}"/><path d="${top}" stroke="#8d7fbd" stroke-opacity="0.35" stroke-width="0.8" fill="none"/>`;
  };
  const camel = '<path d="M0 0c1 -4 3 -6 5 -6c1 -3 4 -3 5 0c2 -2 4 -2 5 0l3 -5c1 -1 3 0 2 1l-2 6l0 4h-1l0 6h-1.2l0 -6h-6l0 6h-1.2l0 -6h-1l0 6h-1.2l0 -6c-2 0 -4 -1 -6.4 0z" fill="#16122a"/>';
  const caravan = [0, 22, 44].map((dx) => `<g transform="translate(${dx} 0)">${camel}</g>`).join('');
  const walk = animate ? `<g>${`<g transform="translate(-80 184) scale(0.8)">${caravan}</g>`}<animateTransform attributeName="transform" type="translate" values="0 0;470 -6" dur="70s" repeatCount="indefinite"/></g>` : `<g transform="translate(40 182) scale(0.8)">${caravan}</g>`;
  const lantern = (X, Y, k) => {
    const [x, y] = P(X, Y, 0.62);
    return `${glow(x, y, 16, u('lamp'), animate, k)}${box(X - 0.06, Y - 0.06, 0.4, 0.12, 0.12, 0.2, ['#ffd27a', '#c08a3a', '#e0a84a'])}`;
  };
  // le socle de grès, à moitié pris dans le sable
  const blocks = [];
  for (let t = 0.7; t < N; t += 1.4) blocks.push(`M${pts([P(t, N, -0.3), P(t, N, 0)])}M${pts([P(N, t, -0.3), P(N, t, 0)])}`);
  const drift = (() => {
    const l = [], r = [];
    for (let i = 0; i <= 12; i++) {
      const t = (i / 12) * N;
      const w = Math.sin(i * 1.7) * 0.06;
      l.push(P(t, N + 0.05, -0.24 + w));
      r.push(P(N + 0.05, N - t, -0.24 - w));
    }
    return `<path d="M${pts([P(-1, N + 0.05, -0.4), ...l, ...r, P(N + 0.05, -1, -0.4)])}L370 ${HUB.h}L-10 ${HUB.h}Z" fill="url(#${u('sand')})"/>`;
  })();
  const ripples = [[20, 352, 30], [44, 362, 34], [8, 418, 26], [30, 412, 30], [118, 430, 22], [236, 436, 26], [262, 426, 30], [318, 412, 28], [340, 402, 22], [312, 352, 26], [334, 344, 22]]
    .map(([x, y, w]) => `<path d="M${x} ${y}q${w / 2} -4 ${w} 0" stroke="#a894c8" stroke-opacity="0.35" stroke-width="0.8" fill="none"/>`).join('');
  const tufts = [[60, 350], [150, 392], [214, 380], [282, 340], [16, 396]].map(([x, y]) => `<path d="M${x} ${y}l-3 -4M${x} ${y}l0.5 -5M${x} ${y}l3.4 -3.6" stroke="#2a2246" stroke-width="1"/>`).join('');
  const nearL = '<path d="M-10 404C24 380 60 372 96 384C124 394 150 420 166 452H-10Z" fill="url(#' + u('dune') + ')"/><path d="M-10 404C24 380 60 372 96 384C124 394 150 420 166 452" stroke="#c4b2e0" stroke-opacity="0.5" stroke-width="1" fill="none"/>';
  const nearR = '<path d="M190 452C214 424 252 404 300 396C326 392 350 384 370 372V452Z" fill="url(#' + u('dune') + ')"/><path d="M190 452C214 424 252 404 300 396C326 392 350 384 370 372" stroke="#c4b2e0" stroke-opacity="0.5" stroke-width="1" fill="none"/>';
  // l'oasis : un bassin qui reflète la lune, deux palmiers, des roseaux
  const palm = (x, y, h, lean) => {
    const tx = x + lean, ty = y - h;
    const fronds = [[-26, 6], [-16, -6], [-4, -12], [10, -9], [22, 2], [28, 12], [-30, 16]].map(([dx, dy]) => `<path d="M${r1(tx)} ${r1(ty)}q${r1(dx * 0.5)} ${r1(dy * 0.6 - 7)} ${dx} ${dy}q${r1(-dx * 0.35)} ${r1(-dy * 0.2 - 2)} ${r1(-dx)} ${r1(-dy)}z" fill="#141228"/>`).join('');
    return `<path d="M${x} ${y}q${r1(lean * 0.2)} ${r1(-h * 0.6)} ${lean} ${-h}" stroke="#141228" stroke-width="3.2" stroke-linecap="round" fill="none"/>${fronds}<circle cx="${r1(tx)}" cy="${r1(ty + 1)}" r="2" fill="#141228"/>`;
  };
  const glint = Array.from({ length: 5 }, (_, k) => `<rect x="${r1(84 + hash(k + 900) * 8)}" y="${r1(419 + k * 2.2)}" width="${r1(4 + hash(k + 901) * 6)}" height="0.8" fill="#f7f2de" opacity="0.7">${pulse('0.8;0.2;0.8', r1(1.6 + k * 0.4), animate)}</rect>`).join('');
  const reeds = [[42, 424], [46, 423], [118, 425], [122, 426]].map(([x, y], k) => `<path d="M${x} ${y}q${k % 2 ? 2 : -2} -7 ${k % 2 ? 1 : -1} -12" stroke="#1d2238" stroke-width="1" fill="none"/>`).join('');
  const oasis = `<ellipse cx="82" cy="424" rx="40" ry="9" fill="#0e1534"/><ellipse cx="82" cy="423" rx="36" ry="7" fill="url(#${u('pool')})"/>${glint}${reeds}${palm(56, 420, 58, -8)}${palm(104, 420, 46, 10)}`;
  // le campement : une tente rayée, éclairée de l'intérieur, et un feu de camp
  const [fx, fy] = [246, 424];
  const fire = `<circle cx="${fx}" cy="${fy - 4}" r="34" fill="url(#${u('fire')})">${pulse('0.8;1;0.7;0.95;0.8', 1.3, animate)}</circle>`
    + [[-6, 1], [6, 1], [0, 3], [-3, -1.6], [3.4, -1.4]].map(([dx, dy]) => `<ellipse cx="${fx + dx}" cy="${fy + dy}" rx="2.4" ry="1.4" fill="#4c4060"/>`).join('')
    + `<path d="M${fx - 6} ${fy + 1}l12 -3M${fx - 6} ${fy - 2}l12 3" stroke="#3a2416" stroke-width="1.8" stroke-linecap="round"/>${flame(fx, fy - 1, 0.9, animate, 1)}`;
  const tent = '<path d="M268 410L300 368L346 376L356 410Z" fill="#3a2a3c"/><path d="M300 368L346 376M306 371L320 410M318 372L334 410M330 374L346 410" stroke="#55384a" stroke-width="1.6" fill="none"/>'
    + '<path d="M268 410L300 368L314 410Z" fill="#8a5a46"/><path d="M284 410L300 384L306 410Z" fill="#ffc46e"/><path d="M290 410L300 393L303 410Z" fill="#fff0c4" opacity="0.8"/>'
    + '<path d="M264 411L300 367" stroke="#2a1b22" stroke-width="1"/>';
  return {
    bg: `url(#${u('sky')})`,
    defs: ulin(u('sky'), [0, 0, 0, 240], [[0, '#04071c'], [0.4, '#0f1640'], [0.72, '#2a2558'], [0.9, '#4f3d6e'], [1, '#6b4f78']])
      + lin(u('floor'), [0, 0, 0, 1], [[0, '#c3ad86'], [1, '#d2bd95']]) + rad(u('lamp'), [[0, '#ffd27a', 0.6], [1, '#ff9a3c', 0]])
      + rad(u('milky'), [[0, '#ddd6ff', 0.3], [0.55, '#a39ae6', 0.12], [1, '#a39ae6', 0]])
      + rad(u('moonglow'), [[0, '#f7f2de', 0.3], [1, '#f7f2de', 0]])
      + lin(u('pyr'), [0, 0, 0, 1], [[0, '#a896c8'], [1, '#5a4b80']])
      + ulin(u('sand'), [0, 260, 0, 452], [[0, '#7d6aa3'], [1, '#3b305f']])
      + ulin(u('dune'), [0, 370, 0, 452], [[0, '#8f7bb4'], [1, '#433768']])
      + lin(u('pool'), [0, 0, 0, 1], [[0, '#2a3a6a'], [1, '#151f45']])
      + rad(u('fire'), [[0, '#ffb35a', 0.55], [0.5, '#ff7a3c', 0.18], [1, '#ff7a3c', 0]])
      + `<mask id="${u('crescent')}"><circle cx="292" cy="46" r="15" fill="#fff"/><circle cx="299" cy="41" r="13.5" fill="#000"/></mask>`,
    back: `${milky}${starField(70, 400, 190)}${twinkle}${moon}${shootingStar(animate, [220, 14], [300, 44], 11)}`
      + pyramid(-6, 142, 120, 72) + pyramid(84, 98, 190, 110) + pyramid(306, 120, 150, 88)
      + farDune(206, 12, '#231d44', 1) + walk + farDune(236, 16, '#2c2552', 9)
      + box(0, 0, -0.3, N, N, 0.3, ['#b39d78', '#7a6850', '#968260']) + `<path d="${blocks.join('')}" stroke="#5e4f3a" stroke-width="0.7"/>`
      + drift + nearL + nearR + ripples + tufts + oasis + fire + tent
      + box(-0.18, 0, 0, 0.18, N, 0.4, ['#cbb58e', '#8a7656', '#a89270']) + box(0, -0.18, 0, N, 0.18, 0.4, ['#cbb58e', '#8a7656', '#a89270'])
      + lantern(-0.09, 3.95, 0) + lantern(3.95, -0.09, 1)
      + signboard(1.3, 3.7, 1.05, 1.65, '#d8c49c', ['#8a7656', '#5a4a34', '#6e5c42'], onRight(1.5, 1.5, say(pick, title, { fill: '#3a2614', sub: '#4a3420', size: 5.6, font: 'Georgia, serif' }))),
    floor: `${floorPoly(`url(#${u('floor')})`)}${tiles('#8a7656', 0.45, 0.7)}`,
    edge: '',
    props: '',
    beam: ['#dfe6ff', '#b9c6ff'], dust: '#e8eaff',
    plat: ['#b89f75', '#7f6a4a', '#9a8460'], vig: 0.42,
    sky: true, // sa lune : pas de deuxième la nuit (daylight.js)
  };
}

function pirate({ u, pick, title, animate }) {
  // en pleine mer : le pont, les voiles, le drapeau, les vagues
  const H = 150;
  const clouds = [[60, 40, 1, 40], [250, 28, 0.8, 52], [330, 70, 0.7, 46]].map(([x, y, sc, d], k) => drift(cloud(x, y, sc, '#ffffff', '#dbe9f5'), k % 2 ? -18 : 18, d, animate)).join('');
  const crests = Array.from({ length: 18 }, (_, k) => {
    const x = hash(k + 500) * HUB.w, y = H + 10 + hash(k + 501) * 360;
    return drift(`<path d="M${r1(x)} ${r1(y)}q5 -3 10 0" stroke="#e6f6ff" stroke-width="1.2" fill="none" opacity="${r1(0.4 + hash(k) * 0.4)}"/>`, k % 2 ? 6 : -6, r1(3 + hash(k + 502) * 2), animate);
  }).join('');
  const sea = animate ? `<g><rect y="${H}" width="${HUB.w}" height="${HUB.h - H}" fill="url(#${u('sea')})"/>${crests}<animateTransform attributeName="transform" type="translate" values="0 0;0 2.5;0 0" dur="5s" repeatCount="indefinite"/></g>` : `<rect y="${H}" width="${HUB.w}" height="${HUB.h - H}" fill="url(#${u('sea')})"/>${crests}`;
  // le mât au coin du fond, deux voiles, le drapeau noir
  const [mx, my] = P(0.2, 0.2, 0);
  const sails = `<path d="M${r1(mx - 54)} 22q54 -10 108 0q-6 34 0 62q-54 -12 -108 0q6 -28 0 -62z" fill="#f4ecd8" stroke="#c9b991" stroke-width="1"/>`
    + `<path d="M${r1(mx - 40)} -30q40 -8 80 0q-4 26 0 46q-40 -9 -80 0q4 -20 0 -46z" fill="#efe5cc" stroke="#c9b991" stroke-width="1"/>`;
  const flagShape = '<path d="M0 0h22v14h-22z" fill="#111"/><circle cx="11" cy="6" r="3" fill="#f4eee7"/><path d="M6 11l10 -3M6 8l10 3" stroke="#f4eee7" stroke-width="1.2"/>';
  const flag = `<g transform="translate(${r1(mx + 2)} 2)">${animate ? `<g>${flagShape}<animateTransform attributeName="transform" type="skewY" values="0;8;-4;0" dur="1.8s" repeatCount="indefinite"/></g>` : flagShape}</g>`;
  const rigging = `<path d="M${r1(mx)} 0L${pts([P(0, N, 0.9)])}M${r1(mx)} 0L${pts([P(N, 0, 0.9)])}M${r1(mx)} 40L${pts([P(0, 4, 0.9)])}M${r1(mx)} 40L${pts([P(4, 0, 0.9)])}" stroke="#3a2a1c" stroke-width="0.7" fill="none"/>`;
  const hoop = (X, Y, z) => poly([P(X, Y + 0.36, z), P(X + 0.36, Y + 0.36, z), P(X + 0.36, Y + 0.36, z + 0.05), P(X, Y + 0.36, z + 0.05)], '#2a2a2a') + poly([P(X + 0.36, Y, z), P(X + 0.36, Y + 0.36, z), P(X + 0.36, Y + 0.36, z + 0.05), P(X + 0.36, Y, z + 0.05)], '#333');
  const barrel = ([X, Y]) => `${box(X, Y, 0, 0.36, 0.36, 0.5, ['#a8743e', '#5a3a1c', '#704a26'])}${hoop(X, Y, 0.1)}${hoop(X, Y, 0.36)}`;
  const planks = [];
  for (let y = 0.35; y < N; y += 0.35) planks.push(`M${pts([P(0, y, 0.002), P(N, y, 0.002)])}`);
  return {
    bg: `url(#${u('sky')})`,
    defs: lin(u('sky'), [0, 0, 0, 1], [[0, '#3d8fd6'], [0.28, '#9fd4f5'], [1, '#9fd4f5']]) + lin(u('sea'), [0, 0, 0, 1], [[0, '#2b78b8'], [0.4, '#1f5f9a'], [1, '#123d6b']])
      + lin(u('floor'), [0, 0, 0, 1], [[0, '#a8794a'], [1, '#b98a58']]),
    back: `<rect width="${HUB.w}" height="${H}" fill="url(#${u('sky')})"/><circle cx="64" cy="36" r="16" fill="#fff6c8" opacity="0.9"/>${clouds}${gullsFlying(animate)}${sea}`
      + box(0, 0, -1.0, N, N, 1.0, ['#4a2f1c', '#2e1d11', '#3b2616']) + poly([P(0, N, -0.8), P(N, N, -0.8), P(N, N, -0.72), P(0, N, -0.72)], '#e8e0cc') + poly([P(N, 0, -0.8), P(N, N, -0.8), P(N, N, -0.72), P(N, 0, -0.72)], '#e8e0cc')
      + `<path d="M${r1(mx)} ${r1(my)}V-20" stroke="#4a311d" stroke-width="5"/>${rigging}${sails}${flag}`
      + box(-0.2, 0, 0, 0.2, N, 0.85, ['#6b4a2e', '#3f2a19', '#55391f']) + box(0, -0.2, 0, N, 0.2, 0.85, ['#6b4a2e', '#3f2a19', '#55391f'])
      + box(-0.24, 0, 0.85, 0.28, N, 0.1, ['#8a5f3a', '#4a311d', '#6b4a2e']) + box(0, -0.24, 0.85, N, 0.28, 0.1, ['#8a5f3a', '#4a311d', '#6b4a2e'])
      + `<g class="hub-screen">${onR(1.4, 3.8, 1.1, 1.7, '#d9b98a', ' stroke="#4a311d" stroke-width="1"')}${onRight(1.6, 1.56, say(pick, title, { fill: '#3a2210', sub: '#4a3018', size: 5.6, font: 'Georgia, serif' }))}</g>`,
    floor: `${floorPoly(`url(#${u('floor')})`)}<path d="${planks.join('')}" stroke="#6b4a2e" stroke-opacity="0.55" stroke-width="0.7" fill="none"/>`,
    edge: '',
    props: FRONT_SPOTS.map(barrel).join(''),
    beam: ['#fffbe6', '#ffe9b0'], dust: '#ffffff',
    plat: ['#7a5232', '#4a311d', '#5f3f26'], vig: 0.35,
  };
}

// ---------- les décors de saison (seasons.js : leurs dates) ----------
// des fanions en triangle le long du haut d'un mur (q : point du mur à (t, z))
const bunting = (q, colors, z = HW - 0.12) => {
  let d = '';
  for (let t = 0.2, k = 0; t < N - 0.3; t += 0.42, k++) d += poly([q(t, z), q(t + 0.3, z), q(t + 0.15, z - 0.36)], colors[k % colors.length]);
  return `<path d="M${pts([q(0, z), q(N, z)])}" stroke="#2a1d14" stroke-width="0.5" fill="none"/>${d}`;
};

function halloween({ u, pick, title, animate }) {
  // nuit violette, grosse lune orange derrière le coin de la salle, murs de
  // pierre aux fenêtres en ogive, toile d'araignée, fanions, citrouilles qui
  // luisent, une bougie au rebord, chauves-souris, un petit fantôme, la brume
  const joints = [];
  for (let z = 0.5; z < HW; z += 0.5) joints.push(`M${pts([lw(0, z), lw(N, z)])}M${pts([rw(0, z), rw(N, z)])}`);
  for (let row = 0; row < 6; row++) {
    for (let t = row % 2 ? 0.55 : 1.1; t < N; t += 1.1) joints.push(`M${pts([lw(t, row * 0.5), lw(t, row * 0.5 + 0.5)])}M${pts([rw(t, row * 0.5), rw(t, row * 0.5 + 0.5)])}`);
  }
  // une fenêtre en ogive (repère du mur : x vers la droite, y vers le bas), la nuit derrière
  const arch = (w, h) => `<path d="M0 ${h}V${r1(h * 0.42)}Q0 ${r1(h * 0.08)} ${r1(w / 2)} 0Q${w} ${r1(h * 0.08)} ${w} ${r1(h * 0.42)}V${h}Z" fill="url(#${u('win')})" stroke="#5a4a5e" stroke-width="1.6"/>`
    + `<path d="M${r1(w / 2)} 2V${h}M2 ${r1(h * 0.55)}H${w - 2}" stroke="#2a1d2e" stroke-width="1.4"/><circle cx="${r1(w * 0.7)}" cy="${r1(h * 0.3)}" r="2.6" fill="#ffd9a0" opacity="0.8"/>`;
  const candle = (x, y) => `<rect x="${r1(x - 1.4)}" y="${r1(y - 7)}" width="2.8" height="7" rx="0.6" fill="#efe6d2"/>${flame(x, y - 7, 0.55, animate, Math.round(x))}`;
  const web = (() => {
    const [cx, cy] = P(0, 0, HW);
    const spokes = [[-44, 26], [-30, 34], [-12, 40], [12, 40], [30, 34], [44, 26]];
    const rings = [0.35, 0.6, 0.85].map((f) => `M${spokes.map(([dx, dy]) => `${r1(cx + dx * f)} ${r1(cy + dy * f)}`).join('Q' + `${r1(cx)} ${r1(cy + 30 * f)} `)}`).join('');
    return `<g class="hub-web" stroke="#d8d0e4" stroke-opacity="0.35" stroke-width="0.5" fill="none">${spokes.map(([dx, dy]) => `<path d="M${r1(cx)} ${r1(cy)}l${dx} ${dy}"/>`).join('')}<path d="${rings}"/></g>`;
  })();
  // citrouilles : un corps à côtes, une queue, un visage qui luit (et vacille)
  const pumpkin = ([X, Y], s, k) => {
    const [x, y] = P(X, Y, 0);
    const lit = animate ? `<animate attributeName="opacity" values="1;0.7;0.95;0.8;1" dur="${r1(1.4 + 0.3 * (k % 3))}s" repeatCount="indefinite"/>` : '';
    return `<g class="hub-pumpkin"><ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(16 * s)}" ry="${r1(5 * s)}" fill="url(#${u('pglow')})">${lit}</ellipse>`
      + `<g transform="translate(${r1(x)} ${r1(y - 7 * s)}) scale(${s})"><ellipse cx="-4.5" rx="5" ry="6.5" fill="#d9661c"/><ellipse cx="4.5" rx="5" ry="6.5" fill="#d9661c"/><ellipse rx="5.5" ry="7" fill="#f08a2c"/>`
      + `<path d="M-1 -6.5q1 -3 3 -3.6" stroke="#4a6b2a" stroke-width="1.8" fill="none" stroke-linecap="round"/>`
      + `<g fill="#ffd36b">${lit}<path d="M-5 -1.5l2 -2.6l1.6 2.6zM1.4 -1.5l2 -2.6l1.6 2.6z"/><path d="M-5 1.4h10l-1.6 2.6l-1.4 -1.2l-1.4 1.6l-1.6 -1.6l-1.4 1.2z"/></g></g></g>`;
  };
  const bats = animate ? [[-30, 64, 420, -18, 15, 0, 1], [390, 40, -430, 34, 19, 5, 0.8], [-20, 108, 410, -46, 24, 11, 0.7]].map(([x, y, dx, dy, d, b, s]) => `<g opacity="0"><g transform="translate(${x} ${y}) scale(${s})"><path d="M0 -1.4c-2.4 -3.2 -6.4 -4 -10 -1.6c2 0.4 2.8 1.6 2.8 3c1.4 -1 3 -1 4 0.2c0.8 -1.2 2 -1.8 3.2 -1.6c1.2 -0.2 2.4 0.4 3.2 1.6c1 -1.2 2.6 -1.2 4 -0.2c0 -1.4 0.8 -2.6 2.8 -3c-3.6 -2.4 -7.6 -1.6 -10 1.6z" fill="#160b1f"><animateTransform attributeName="transform" type="scale" values="1 1;1 0.3;1 1" dur="0.32s" repeatCount="indefinite"/></path></g>`
    + `<animateTransform attributeName="transform" type="translate" values="0 0;${dx} ${dy}" dur="${d}s" begin="${b}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.95;1" dur="${d}s" begin="${b}s" repeatCount="indefinite"/></g>`).join('') : '';
  const ghostShape = '<path d="M-7 8v-9a7 7 0 0 1 14 0v9l-2.4 -2l-2.3 2l-2.3 -2l-2.3 2l-2.3 -2z" fill="#f4f0fa" opacity="0.88"/><ellipse cx="-2.4" cy="-1.5" rx="1.1" ry="1.6" fill="#2a1d2e"/><ellipse cx="2.4" cy="-1.5" rx="1.1" ry="1.6" fill="#2a1d2e"/>';
  const ghost = `<g transform="translate(46 128)">${animate ? `<g>${ghostShape}<animateTransform attributeName="transform" type="translate" values="0 0;0 -6;0 0" dur="3.2s" repeatCount="indefinite"/></g>` : ghostShape}</g>`;
  const fog = animate ? [[90, 300, 120, 16, 30, 26], [250, 330, 140, 18, -34, 31], [170, 360, 160, 14, 26, 23]].map(([x, y, rx, ry, dx, d]) => drift(`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#c8b8e8" opacity="0.1"/>`, dx, d, true)).join('') : '';
  const leaves = fall(Array.from({ length: 9 }, (_, k) => [hash(k + 610) * HUB.w, 40 + hash(k + 611) * 60, (hash(k + 612) - 0.5) * 70, 300, r1(8 + hash(k + 613) * 6), r1(hash(k + 614) * 8), 300]),
    '<path d="M0 -2.4q2.4 0 2.4 2.4q0 2.4 -2.4 2.4q-2.4 0 -2.4 -2.4q0 -2.4 2.4 -2.4z" fill="#c8641e"/>', animate);
  const scattered = Array.from({ length: 10 }, (_, k) => {
    const [x, y] = P(0.3 + hash(k + 620) * 6.4, 0.3 + hash(k + 621) * 6.4, 0.003);
    return `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="2.4" ry="1.3" fill="${['#c8641e', '#8a3e16', '#d99a2b'][k % 3]}" opacity="0.7" transform="rotate(${Math.round(hash(k + 622) * 180)} ${r1(x)} ${r1(y)})"/>`;
  }).join('');
  const planks = [];
  for (let y = 0.4; y < N; y += 0.4) planks.push(`M${pts([P(0, y, 0.002), P(N, y, 0.002)])}`);
  return {
    bg: `url(#${u('sky')})`,
    defs: lin(u('sky'), [0, 0, 0, 1], [[0, '#12071f'], [0.35, '#2b1145'], [1, '#160a22']]) + lin(u('wallL'), [0, 0, 1, 0], [[0, '#2a2233'], [1, '#342a3e']]) + lin(u('wallR'), [0, 0, 1, 0], [[0, '#3a2f44'], [1, '#2a2233']])
      + lin(u('floor'), [0, 0, 0, 1], [[0, '#2c1f2c'], [1, '#3a2934']]) + lin(u('win'), [0, 0, 0, 1], [[0, '#1d0d33'], [1, '#5a2a6e']])
      + rad(u('moon'), [[0, '#ffe2a8'], [0.7, '#f7a64a'], [1, '#e07a2a']]) + rad(u('moonglow'), [[0, '#ffb25a', 0.45], [1, '#ffb25a', 0]]) + rad(u('pglow'), [[0, '#ffb347', 0.55], [1, '#ffb347', 0]]),
    back: `${starField(30, 640, 120, '#f3e8ff')}<circle cx="180" cy="40" r="70" fill="url(#${u('moonglow')})"/><circle cx="180" cy="40" r="34" fill="url(#${u('moon')})"/>`
      + `<circle cx="168" cy="30" r="5" fill="#e8913a" opacity="0.5"/><circle cx="192" cy="50" r="7" fill="#e8913a" opacity="0.4"/><circle cx="186" cy="24" r="3" fill="#e8913a" opacity="0.45"/>`
      + `${wallL(`url(#${u('wallL')})`)}${wallR(`url(#${u('wallR')})`)}<path d="${joints.join('')}" stroke="#14101a" stroke-opacity="0.55" stroke-width="0.6" fill="none"/>`
      + onLeft(6.3, 2.65, arch(36, 40)) + onLeft(6.3, 0.95, candle(18, 0)) + onRight(4.9, 2.65, arch(36, 40))
      + `<g class="hub-screen">${onR(1.9, 4.2, 1.5, 2.75, '#120a14', ' stroke="#ff8a2a" stroke-opacity="0.45" stroke-width="0.8"')}${onRight(2.1, 2.4, say(pick, title, { fill: '#ff9a3c', sub: '#f3e0c8', font: 'Georgia, serif' }))}</g>`
      + bunting(lw, ['#f08a2c', '#1d1424', '#7a3aa8']) + bunting(rw, ['#7a3aa8', '#f08a2c', '#1d1424']) + web,
    floor: `${floorPoly(`url(#${u('floor')})`)}<path d="${planks.join('')}" stroke="#140c14" stroke-opacity="0.6" stroke-width="0.7" fill="none"/>${scattered}`,
    edge: cap('#4a3a50'),
    props: [[3.0, 0.32, 0.9], [3.75, 0.3, 0.7], [0.32, 2.85, 0.8], ...FRONT_SPOTS.map(([X, Y]) => [X, Y, 1.15])].map(([X, Y, s], k) => pumpkin([X, Y], s, k)).join(''),
    over: `${fog}${leaves}${ghost}${bats}`,
    beam: ['#ffd9a0', '#ffa64d'], dust: '#ffbe7a',
    plat: ['#3a2a3e', '#21162a', '#2d2034'], vig: 0.55,
    sky: true, // sa lune : pas de deuxième la nuit (daylight.js)
  };
}

function noel({ u, pick, title, animate }) {
  // un village sous la neige, la nuit : collines blanches, chalets aux
  // fenêtres chaudes, un grand sapin décoré derrière la salle (boules qui
  // scintillent, étoile au sommet), place enneigée, barrière coiffée de neige
  // et guirlande, cadeaux, et la neige qui tombe
  const hills = `<path d="M-10 196Q40 160 100 182T220 176T372 184V330H-10Z" fill="#b9cbe0"/><path d="M-10 214Q60 188 130 206T260 200T372 210V330H-10Z" fill="#dfe9f5"/>`;
  const chalet = (x, y, w, h, wall, k) => `<g><rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${wall}"/><path d="M${x - 4} ${y - h}L${x + w / 2} ${y - h - w * 0.55}L${x + w + 4} ${y - h}Z" fill="#3a2a2a"/>`
    + `<path d="M${x - 4} ${y - h}L${x + w / 2} ${y - h - w * 0.55}L${x + w + 4} ${y - h}L${x + w + 1} ${y - h + 2}L${x + w / 2} ${y - h - w * 0.55 + 4}L${x - 1} ${y - h + 2}Z" fill="#f4f8fc"/>`
    + `<rect x="${x + w * 0.2}" y="${y - h * 0.7}" width="${r1(w * 0.22)}" height="${r1(h * 0.32)}" fill="#ffd27a">${pulse('1;0.8;1', 3 + k, animate)}</rect><rect x="${r1(x + w * 0.58)}" y="${y - h * 0.7}" width="${r1(w * 0.22)}" height="${r1(h * 0.32)}" fill="#ffc45e"/></g>`;
  const village = chalet(8, 212, 30, 22, '#6b3a2e', 0) + chalet(46, 206, 24, 18, '#4a5a7a', 1) + chalet(84, 200, 20, 15, '#7a5a3a', 2)
    + chalet(260, 200, 20, 15, '#4a5a7a', 1) + chalet(292, 206, 26, 19, '#6b3a2e', 2) + chalet(326, 213, 30, 22, '#3a5a4a', 0);
  // le grand sapin, derrière le coin de la salle
  const tiers = [[150, 46, 24], [128, 38, 22], [106, 30, 20], [84, 22, 18], [64, 14, 16]];
  const tree = `<rect x="174" y="146" width="12" height="14" fill="#3a2414"/>` + tiers.map(([y, w, h]) => `<path d="M180 ${y - h - 16}L${180 + w} ${y}H${180 - w}Z" fill="#1f4a36"/><path d="M180 ${y - h - 16}L${180 + w * 0.5} ${y - h / 2 - 8}L${180 - w * 0.5} ${y - h / 2 - 8}Z" fill="#2c6048" opacity="0.6"/>`).join('')
    + `<path d="M150 136Q180 146 210 132M156 112Q180 120 204 108M162 90Q180 96 198 86" stroke="#ffd27a" stroke-width="1" fill="none" opacity="0.8"/>`;
  const balls = [[160, 142, '#e03a3a'], [198, 144, '#3a7ae0'], [172, 126, '#ffd27a'], [188, 118, '#e03a3a'], [166, 104, '#3a7ae0'], [194, 98, '#ffd27a'], [176, 84, '#e03a3a'], [184, 70, '#3a7ae0'], [206, 128, '#ffd27a'], [154, 124, '#3a7ae0']]
    .map(([x, y, c], k) => `<circle cx="${x}" cy="${y}" r="2.4" fill="${c}">${pulse('1;0.45;1', r1(1.2 + (k % 4) * 0.5), animate)}</circle>`).join('');
  const star = `<g transform="translate(180 30)"><circle r="12" fill="url(#${u('starglow')})">${pulse('0.7;1;0.7', 2.2, animate)}</circle><path d="M0 -7l2 5h5.4l-4.4 3.2l1.7 5.3l-4.7 -3.3l-4.7 3.3l1.7 -5.3l-4.4 -3.2h5.4z" fill="#ffd94a"/></g>`;
  // la barrière de bois au bord de la place, coiffée de neige, guirlande de couleurs
  const posts = [0.1, 1.85, 3.6, 5.35, 6.85];
  const fence = posts.map((t) => box(-0.12, t - 0.06, 0, 0.12, 0.12, 0.75, ['#f4f8fc', '#4a3220', '#5e4228']) + box(t - 0.06, -0.12, 0, 0.12, 0.12, 0.75, ['#f4f8fc', '#4a3220', '#5e4228'])).join('')
    + box(-0.1, 0, 0.62, 0.08, N, 0.1, ['#f4f8fc', '#4a3220', '#5e4228']) + box(0, -0.1, 0.62, N, 0.08, 0.1, ['#f4f8fc', '#4a3220', '#5e4228']);
  const lights = (q) => Array.from({ length: 16 }, (_, k) => {
    const [x, y] = q(0.2 + k * 0.42, 0.55);
    const c = ['#ff5a5a', '#ffd27a', '#5ac8ff', '#7aff9a'][k % 4];
    return `<circle cx="${r1(x)}" cy="${r1(y + 2)}" r="1.3" fill="${c}">${pulse('1;0.3;1', r1(1 + (k % 3) * 0.6), animate)}</circle><circle cx="${r1(x)}" cy="${r1(y + 2)}" r="3.8" fill="${c}" opacity="0.18"/>`;
  }).join('');
  // un cadeau : une boîte, son ruban sur chaque face visible, un nœud dessus
  const gift = ([X, Y], [top, left, right, ribbon], sz) => {
    const [x, y] = P(X + sz / 2, Y + sz / 2, sz);
    const band = (list) => poly(list, ribbon);
    return box(X, Y, 0, sz, sz, sz, [top, left, right])
      + band([P(X + sz / 2 - 0.04, Y + sz, 0), P(X + sz / 2 + 0.04, Y + sz, 0), P(X + sz / 2 + 0.04, Y + sz, sz), P(X + sz / 2 - 0.04, Y + sz, sz)])
      + band([P(X + sz, Y + sz / 2 - 0.04, 0), P(X + sz, Y + sz / 2 + 0.04, 0), P(X + sz, Y + sz / 2 + 0.04, sz), P(X + sz, Y + sz / 2 - 0.04, sz)])
      + band([P(X + sz / 2 - 0.04, Y, sz), P(X + sz / 2 + 0.04, Y, sz), P(X + sz / 2 + 0.04, Y + sz, sz), P(X + sz / 2 - 0.04, Y + sz, sz)])
      + band([P(X, Y + sz / 2 - 0.04, sz), P(X + sz, Y + sz / 2 - 0.04, sz), P(X + sz, Y + sz / 2 + 0.04, sz), P(X, Y + sz / 2 + 0.04, sz)])
      + `<path d="M${r1(x)} ${r1(y)}c-4 -4 -7 0 0 0c7 0 4 -4 0 0" stroke="${ribbon}" stroke-width="1.4" fill="none"/>`;
  };
  const [g1, g2] = FRONT_SPOTS;
  const gifts = gift(g1, ['#e04a4a', '#a82a30', '#c8323a', '#ffd27a'], 0.5) + gift([g1[0] - 0.52, g1[1] + 0.05], ['#3a9a5e', '#1f5a36', '#2f7a4a', '#ff5a5a'], 0.42)
    + gift(g2, ['#5a7ae0', '#2a3a8a', '#3a5ac8', '#f4f8fc'], 0.5) + gift([g2[0] + 0.05, g2[1] - 0.52], ['#ffe08a', '#c8962a', '#e0b04a', '#c8323a'], 0.42);
  const snowy = Array.from({ length: 12 }, (_, k) => {
    const [x, y] = P(0.3 + hash(k + 700) * 6.4, 0.3 + hash(k + 701) * 6.4, 0.003);
    return `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(7 + hash(k) * 9)}" ry="${r1(3 + hash(k + 1) * 3)}" fill="#ffffff" opacity="0.45"/>`;
  }).join('');
  const flakes = fall(Array.from({ length: 22 }, (_, k) => [hash(k + 720) * HUB.w, -10, (hash(k + 721) - 0.5) * 50, 560, r1(8 + hash(k + 722) * 8), r1(hash(k + 723) * 10)]), '<circle r="1.3" fill="#fff"/>', animate);
  return {
    bg: `url(#${u('sky')})`,
    defs: lin(u('sky'), [0, 0, 0, 1], [[0, '#0a1230'], [0.4, '#1d2c5a'], [0.62, '#3a4a78'], [1, '#2a3a62']]) + lin(u('floor'), [0, 0, 0, 1], [[0, '#c9d6e6'], [1, '#dde6f1']])
      + rad(u('starglow'), [[0, '#fff3a8', 0.8], [1, '#ffd94a', 0]]),
    back: `${starField(40, 660, 120)}${hills}${village}${tree}${balls}${star}`
      + `<rect y="300" width="${HUB.w}" height="${HUB.h - 300}" fill="#dfe9f5"/>`
      + box(0, 0, -0.18, N, N, 0.18, ['#e8eef7', '#9aa9bd', '#b4c1d2'])
      + signboard(1.3, 3.7, 1.05, 1.66, '#8a5a36', ['#5a3a22', '#3a2414', '#4a2f1b'], onR(1.3, 3.7, 1.66, 1.74, '#f4f8fc') + onRight(1.5, 1.51, say(pick, title, { fill: '#fff4dc', sub: '#ffe0b0', size: 5.6, font: 'Georgia, serif' }))),
    floor: `${floorPoly(`url(#${u('floor')})`)}${tiles('#9aa9bd', 0.45, 0.6)}${snowy}`,
    edge: `${fence}${lights((t, z) => P(-0.06, t, z))}${lights((t, z) => P(t, -0.06, z))}`,
    props: gifts,
    over: flakes,
    beam: ['#fff8e0', '#ffe2a0'], dust: '#ffffff',
    plat: ['#7a5636', '#4a3220', '#5e4228'], vig: 0.4,
  };
}

function printemps({ u, pick, title, animate }) {
  // un jardin au printemps : un matin clair, des champs de tulipes en bandes
  // de couleur sur les collines, un moulin dont les ailes tournent, de grands
  // cerisiers en fleurs, des haies taillées, une fontaine, un massif de fleurs,
  // des papillons, des oiseaux et des pétales au vent
  const clouds = [[66, 40, 0.9, 46], [262, 26, 1.05, 54], [190, 72, 0.6, 40]].map(([x, y, sc, d], k) => drift(cloud(x, y, sc, '#ffffff', '#f6e6ef'), k % 2 ? -16 : 16, d, animate)).join('');
  const sun = `<circle cx="306" cy="58" r="60" fill="url(#${u('sunhaze')})"/><circle cx="306" cy="58" r="15" fill="#fff6d6"/>`;
  // les champs de tulipes : des bandes de couleur qui suivent la colline
  const hill = 'M-10 122Q90 90 180 112T372 98V260H-10Z';
  const bands = ['#ff5a6e', '#ffd23a', '#ff9ec4', '#ff8a3a', '#b48cff', '#ff5a6e', '#ffd23a', '#fff4f8'].map((c, k) => {
    const y = 112 + k * 11;
    return `<path d="M-10 ${y + 14}Q90 ${y - 16} 180 ${y + 6}T372 ${y - 6}" stroke="${c}" stroke-width="6" fill="none"/><path d="M-10 ${y + 19}Q90 ${y - 11} 180 ${y + 11}T372 ${y - 1}" stroke="#7fbf62" stroke-width="2.2" fill="none"/>`;
  }).join('');
  const fields = `<path d="${hill}" fill="#9fd283"/><g clip-path="url(#${u('field')})">${bands}</g>`;
  // le moulin, sur la colline de gauche : ses ailes tournent doucement
  const blade = (rot) => `<g transform="rotate(${rot})"><rect x="-1.6" y="-30" width="3.2" height="30" fill="#7a5a3a"/><rect x="1.6" y="-29" width="7" height="22" fill="#f4ede0" stroke="#b9a07e" stroke-width="0.6"/><path d="M1.6 -22h7M1.6 -15h7" stroke="#b9a07e" stroke-width="0.5"/></g>`;
  const blades = `<g>${[0, 90, 180, 270].map(blade).join('')}${animate ? '<animateTransform attributeName="transform" type="rotate" values="0;360" dur="14s" repeatCount="indefinite"/>' : ''}</g>`;
  const mill = `<g transform="translate(52 100) scale(1.15)"><path d="M-9 34L-6 0h12l3 34z" fill="#f2e9da"/><path d="M-6 0h12l3 34" fill="none" stroke="#d6c7ad" stroke-width="0.8"/><path d="M-10 1L0 -10L10 1z" fill="#c8513e"/><rect x="-2.4" y="20" width="4.8" height="14" rx="2" fill="#7a5a3a"/><rect x="-3" y="8" width="6" height="5" rx="1" fill="#9fd0ff"/><g transform="translate(0 -3)">${blades}<circle r="2.4" fill="#5a4030"/></g></g>`;
  // des oiseaux qui passent
  const birds = animate ? [[-30, 60, 420, -16, 22, 2], [-20, 86, 400, -30, 27, 11]].map(([x, y, dx, dy, d, b]) => `<g opacity="0"><g transform="translate(${x} ${y})"><path d="M-4 0q2 -2.4 4 0q2 -2.4 4 0" stroke="#4a5a7a" stroke-width="0.9" fill="none"/></g><animateTransform attributeName="transform" type="translate" values="0 0;${dx} ${dy}" dur="${d}s" begin="${b}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.95;1" dur="${d}s" begin="${b}s" repeatCount="indefinite"/></g>`).join('') : '';
  // les cerisiers : un tronc et un grand nuage de fleurs, plus clair en haut
  const tree = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-2 0C-1 -10 -3 -18 -1 -24M-1 -16C3 -20 7 -22 10 -26M-1 -20C-5 -24 -8 -26 -11 -29" stroke="#6b4a3a" stroke-width="2.6" stroke-linecap="round" fill="none"/>`
    + [[-12, -30, 10, '#f7a8c8'], [10, -32, 11, '#f7a8c8'], [-1, -40, 12, '#ffc4dc'], [-16, -40, 8, '#ffc4dc'], [16, -42, 8, '#ffd6e6'], [2, -50, 9, '#ffe3ee'], [-8, -48, 7, '#ffe3ee']].map(([cx, cy, r, c]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"/>`).join('')
    + [[-6, -36], [6, -44], [-14, -34], [12, -36], [0, -30], [4, -52]].map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="1.3" fill="#ffffff" opacity="0.85"/>`).join('') + '</g>';
  const trees = tree(18, 250, 1.55) + tree(344, 246, 1.55) + tree(74, 206, 1.0) + tree(290, 200, 1.0);
  // haies taillées le long des deux bords du fond, fleurs dessus et devant
  const hedge = box(-0.34, 0, 0, 0.34, N, 0.55, ['#5fa04a', '#3f7a32', '#4b8c3c']) + box(0, -0.34, 0, N, 0.34, 0.55, ['#5fa04a', '#3f7a32', '#4b8c3c']);
  const dots = (q) => Array.from({ length: 22 }, (_, k) => {
    const [x, y] = q(0.15 + k * 0.31);
    return `<circle cx="${r1(x)}" cy="${r1(y)}" r="1.1" fill="${['#ffffff', '#ffc4dc', '#ffe066'][k % 3]}"/>`;
  }).join('');
  const tulips = (q) => Array.from({ length: 13 }, (_, k) => {
    const [x, y] = q(0.3 + k * 0.5);
    const c = ['#ff5a7a', '#ffd23a', '#ff8a3a', '#c86bff'][k % 4];
    return `<path d="M${r1(x)} ${r1(y)}v-6" stroke="#4a8a3a" stroke-width="0.9"/><path d="M${r1(x - 2)} ${r1(y - 6)}q0 -3.6 2 -4q2 0.4 2 4q-2 1.2 -4 0z" fill="${c}"/>`;
  }).join('');
  // la fontaine (devant à droite) et le massif de fleurs (devant à gauche)
  const fountain = (() => {
    const [X, Y] = FRONT_SPOTS[1];
    const [x, y] = P(X + 0.25, Y + 0.25, 0);
    const drops = animate ? [[-3, 0], [0, 0.4], [3, 0.8]].map(([dx, b]) => `<circle cx="${r1(x + dx)}" cy="${r1(y - 20)}" r="0.9" fill="#bfe8ff"><animate attributeName="cy" values="${r1(y - 20)};${r1(y - 9)}" dur="1.2s" begin="${b}s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="1.2s" begin="${b}s" repeatCount="indefinite"/></circle>`).join('') : '';
    return `<g class="hub-fontaine"><ellipse cx="${r1(x)}" cy="${r1(y - 2)}" rx="15" ry="7.5" fill="#bdb6a8"/><ellipse cx="${r1(x)}" cy="${r1(y - 4)}" rx="13" ry="6" fill="#7cc4e4"/><ellipse cx="${r1(x - 3)}" cy="${r1(y - 5)}" rx="5" ry="1.6" fill="#ffffff" opacity="0.5"/>`
      + `<rect x="${r1(x - 2)}" y="${r1(y - 20)}" width="4" height="16" rx="1.5" fill="#d9d2c4"/><ellipse cx="${r1(x)}" cy="${r1(y - 20)}" rx="6" ry="2.4" fill="#bdb6a8"/><ellipse cx="${r1(x)}" cy="${r1(y - 21)}" rx="4.6" ry="1.6" fill="#7cc4e4"/>${drops}</g>`;
  })();
  const bed = (() => {
    const [X, Y] = FRONT_SPOTS[0];
    const soil = box(X - 0.1, Y, 0, 0.75, 0.5, 0.16, ['#7a5636', '#5a3f26', '#6b4a2e']);
    const flowers = Array.from({ length: 9 }, (_, k) => {
      const [x, y] = P(X + (k % 3) * 0.22, Y + 0.1 + Math.floor(k / 3) * 0.14, 0.16);
      return `<path d="M${r1(x)} ${r1(y)}v-4" stroke="#4a8a3a" stroke-width="0.8"/><circle cx="${r1(x)}" cy="${r1(y - 4.6)}" r="1.7" fill="${['#ff5a7a', '#ffd23a', '#c86bff', '#ff8a3a', '#ffffff'][k % 5]}"/>`;
    }).join('');
    return `<g class="hub-massif">${soil}${flowers}</g>`;
  })();
  const butterflies = animate ? [[60, 250, '#ffb347', 0], [250, 220, '#6bb8ff', 3], [300, 300, '#ff7ab8', 6], [150, 190, '#ffe066', 4]].map(([x, y, c, b]) => {
    const wing = `<g><path d="M0 0c-4 -5 -8 -4 -7 0c-1 3 3 4 7 0zM0 0c4 -5 8 -4 7 0c1 3 -3 4 -7 0z" fill="${c}"/><animateTransform attributeName="transform" type="scale" values="1 1;0.25 1;1 1" dur="0.4s" repeatCount="indefinite"/></g>`;
    return `<g transform="translate(${x} ${y})"><g>${wing}<animateTransform attributeName="transform" type="translate" values="0 0;24 -14;-10 -26;-24 -6;0 0" dur="${9 + b}s" begin="${-b}s" repeatCount="indefinite"/></g></g>`;
  }).join('') : '';
  const petals = fall(Array.from({ length: 14 }, (_, k) => [hash(k + 740) * HUB.w, -10 + hash(k + 741) * 60, 40 + hash(k + 742) * 50, 420, r1(10 + hash(k + 743) * 7), r1(hash(k + 744) * 9), 360]),
    '<ellipse rx="2.2" ry="1.3" fill="#ffc0d9"/>', animate);
  const stripes = [];
  for (let i = 0; i < N; i += 2) stripes.push(poly([P(i, 0, 0.002), P(i + 1, 0, 0.002), P(i + 1, N, 0.002), P(i, N, 0.002)], '#ffffff', ' opacity="0.08"'));
  const daisies = Array.from({ length: 16 }, (_, k) => {
    const [x, y] = P(0.3 + hash(k + 760) * 6.4, 0.3 + hash(k + 761) * 6.4, 0.003);
    return `<circle cx="${r1(x)}" cy="${r1(y)}" r="0.9" fill="${k % 4 ? '#ffffff' : '#ffe066'}" opacity="0.9"/>`;
  }).join('');
  return {
    bg: `url(#${u('sky')})`,
    defs: lin(u('sky'), [0, 0, 0, 1], [[0, '#8ecdf0'], [0.36, '#cfe9fb'], [0.5, '#fde8ef'], [0.62, '#b6dd8f'], [1, '#7ab85e']]) + lin(u('floor'), [0, 0, 0, 1], [[0, '#8ccc6c'], [1, '#79b95a']])
      + rad(u('sunhaze'), [[0, '#fff3c4', 0.85], [1, '#fff3c4', 0]]) + `<clipPath id="${u('field')}"><path d="${hill}"/></clipPath>`,
    back: `${sun}${clouds}${birds}${fields}${mill}<path d="M-10 206Q70 184 150 198T290 192T372 200V330H-10Z" fill="#8cc96f"/>${trees}`
      + `<rect y="300" width="${HUB.w}" height="${HUB.h - 300}" fill="#7ab85e"/>`
      + box(0, 0, -0.22, N, N, 0.22, ['#86c66a', '#6b4a2e', '#7a5636'])
      + signboard(1.3, 3.7, 1.05, 1.66, '#e8cfa0', ['#8a6440', '#5a3f26', '#6e4e30'], onR(1.3, 3.7, 1.66, 1.76, '#ff9ec4') + onRight(1.5, 1.51, say(pick, title, { fill: '#2f5a24', sub: '#3a3020', size: 5.6 }))),
    floor: `${floorPoly(`url(#${u('floor')})`)}${stripes.join('')}${daisies}`,
    edge: `${hedge}${dots((t) => P(-0.17, t, 0.56))}${dots((t) => P(t, -0.17, 0.56))}${tulips((t) => P(0.16, t, 0))}${tulips((t) => P(t, 0.16, 0))}`,
    props: `${bed}${fountain}`,
    over: `${petals}${butterflies}`,
    beam: ['#fffbe8', '#fff1c4'], dust: '#ffd6e8',
    plat: ['#e2ddd0', '#a8a294', '#c5bfb1'], vig: 0.22,
  };
}

function ete({ u, pick, title, animate }) {
  // une nuit d'été au bord du lac : ponton de bois, guirlande de guinguette,
  // feux d'artifice qui éclatent au-dessus de l'eau et s'y reflètent
  const H = 196;
  const burst = (x, y, R, c, d, b) => {
    const sparks = Array.from({ length: 14 }, (_, k) => {
      const a = (k / 14) * Math.PI * 2;
      return `<circle cx="${r1(Math.cos(a) * R)}" cy="${r1(Math.sin(a) * R)}" r="1.5" fill="${c}"/><path d="M${r1(Math.cos(a) * R * 0.55)} ${r1(Math.sin(a) * R * 0.55)}L${r1(Math.cos(a) * R * 0.9)} ${r1(Math.sin(a) * R * 0.9)}" stroke="${c}" stroke-width="0.8" stroke-linecap="round"/>`;
    }).join('');
    if (!animate) return `<g transform="translate(${x} ${y})" opacity="0.75"><circle r="${r1(R * 1.2)}" fill="${c}" opacity="0.12"/>${sparks}</g>`;
    return `<g transform="translate(${x} ${y})" opacity="0"><circle r="${r1(R * 1.2)}" fill="${c}" opacity="0.14"/><g>${sparks}<animateTransform attributeName="transform" type="scale" values="0.1;1;1.08" keyTimes="0;0.35;1" dur="${d}s" begin="${b}s" repeatCount="indefinite"/></g>`
      + `<animate attributeName="opacity" values="0;1;0.9;0;0" keyTimes="0;0.06;0.4;0.62;1" dur="${d}s" begin="${b}s" repeatCount="indefinite"/></g>`;
  };
  const fireworks = burst(80, 70, 26, '#ff6b8a', 4.2, 0) + burst(250, 52, 30, '#ffd27a', 5.1, 1.6) + burst(160, 104, 20, '#6bd8ff', 3.8, 2.8) + burst(312, 112, 22, '#9dff7a', 4.6, 0.9);
  const shore = `<path d="M-10 ${H}Q50 ${H - 20} 110 ${H - 8}T230 ${H - 12}T372 ${H - 4}V${H + 2}H-10Z" fill="#0a0f2a"/>`
    + Array.from({ length: 9 }, (_, k) => `<circle cx="${r1(20 + k * 40 + hash(k + 760) * 14)}" cy="${r1(H - 4 - hash(k + 761) * 8)}" r="0.9" fill="#ffd27a" opacity="0.8"/>`).join('');
  const glints = [[80, '#ff6b8a'], [250, '#ffd27a'], [160, '#6bd8ff'], [312, '#9dff7a']].map(([x, c], k) => `<rect x="${x - 6}" y="${H + 8 + k * 6}" width="12" height="40" fill="${c}" opacity="0.12">${pulse('0.05;0.2;0.05', r1(3.5 + k * 0.6), animate)}</rect>`).join('');
  const water = `<rect y="${H}" width="${HUB.w}" height="${HUB.h - H}" fill="url(#${u('lake')})"/>${glints}`
    + Array.from({ length: 12 }, (_, k) => drift(`<path d="M${r1(hash(k + 770) * HUB.w)} ${r1(H + 20 + hash(k + 771) * 300)}h${r1(8 + hash(k + 772) * 10)}" stroke="#9fb6ff" stroke-width="0.8" opacity="0.25"/>`, k % 2 ? 6 : -6, r1(4 + hash(k + 773) * 3), animate)).join('');
  const piles = [0.2, 2.4, 4.6, 6.8].flatMap((t) => [box(t - 0.1, N - 0.1, -2.2, 0.2, 0.2, 2.2, ['#4a311d', '#2e1d11', '#3b2616']), box(N - 0.1, t - 0.1, -2.2, 0.2, 0.2, 2.2, ['#4a311d', '#2e1d11', '#3b2616'])]).join('');
  const posts = [0.1, 1.85, 3.6, 5.35, 6.85];
  const rail = posts.map((t) => box(-0.12, t - 0.06, 0, 0.12, 0.12, 0.8, ['#6b4a2e', '#3f2a19', '#55391f']) + box(t - 0.06, -0.12, 0, 0.12, 0.12, 0.8, ['#6b4a2e', '#3f2a19', '#55391f'])).join('')
    + box(-0.1, 0, 0.72, 0.08, N, 0.08, ['#7a5636', '#4a3220', '#5e4228']) + box(0, -0.1, 0.72, N, 0.08, 0.08, ['#7a5636', '#4a3220', '#5e4228']);
  // guirlande de guinguette : des ampoules qui pendent entre deux poteaux hauts
  const mast = (X, Y) => box(X - 0.06, Y - 0.06, 0, 0.12, 0.12, 2.2, ['#5a3a22', '#3a2414', '#4a2f1b']);
  const masts = mast(-0.1, -0.1) + mast(-0.1, N - 0.2) + mast(N - 0.2, -0.1);
  const string = (a, b) => {
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 26];
    let bulbs = '';
    for (let k = 1; k < 12; k++) {
      const t = k / 12;
      const x = (1 - t) ** 2 * a[0] + 2 * t * (1 - t) * m[0] + t * t * b[0];
      const y = (1 - t) ** 2 * a[1] + 2 * t * (1 - t) * m[1] + t * t * b[1] + 2;
      bulbs += `<circle cx="${r1(x)}" cy="${r1(y)}" r="1.7" fill="#ffe2a0">${pulse('1;0.6;1', r1(1.6 + (k % 3) * 0.7), animate && k % 2 === 0)}</circle><circle cx="${r1(x)}" cy="${r1(y)}" r="5" fill="#ffd27a" opacity="0.16"/>`;
    }
    return `<path d="M${r1(a[0])} ${r1(a[1])}Q${r1(m[0])} ${r1(m[1])} ${r1(b[0])} ${r1(b[1])}" stroke="#2a1d14" stroke-width="0.6" fill="none"/>${bulbs}`;
  };
  const corner = P(-0.04, -0.04, 2.2);
  const planks = [];
  for (let y = 0.35; y < N; y += 0.35) planks.push(`M${pts([P(0, y, 0.002), P(N, y, 0.002)])}`);
  const sparksFall = fall(Array.from({ length: 8 }, (_, k) => [40 + hash(k + 780) * 280, 60 + hash(k + 781) * 50, (hash(k + 782) - 0.5) * 20, 110, r1(3 + hash(k + 783) * 2), r1(hash(k + 784) * 5)]), '<circle r="0.9" fill="#ffe2a0"/>', animate);
  return {
    bg: `url(#${u('sky')})`,
    defs: lin(u('sky'), [0, 0, 0, 1], [[0, '#050a24'], [0.6, '#16215a'], [1, '#2b2f6a']]) + lin(u('lake'), [0, 0, 0, 1], [[0, '#1a2458'], [0.4, '#0d1640'], [1, '#060a22']])
      + lin(u('floor'), [0, 0, 0, 1], [[0, '#8a6440'], [1, '#9a7048']]),
    back: `${starField(46, 800, 150)}${fireworks}${sparksFall}${shore}${water}${piles}`
      + box(0, 0, -0.25, N, N, 0.25, ['#8a6440', '#4a3220', '#5e4228'])
      + `${masts}${string(corner, P(-0.04, N - 0.14, 2.2))}${string(corner, P(N - 0.14, -0.04, 2.2))}`
      + signboard(1.3, 3.7, 1.0, 1.62, '#1f2b26', ['#5a3a22', '#3a2414', '#4a2f1b'], onRight(1.5, 1.47, say(pick, title, { fill: '#f4f0e6', sub: '#dcd6c8', size: 5.6 }))),
    floor: `${floorPoly(`url(#${u('floor')})`)}<path d="${planks.join('')}" stroke="#5e4228" stroke-opacity="0.55" stroke-width="0.7" fill="none"/>`,
    edge: rail,
    props: '',
    beam: ['#fff0d0', '#ffd08a'], dust: '#ffe6a8',
    plat: ['#6b4a2e', '#3f2a19', '#55391f'], vig: 0.45,
    sky: true, // ses feux d'artifice : pas de lune en plus la nuit (daylight.js)
  };
}

// ---------- décors façon jeu vidéo ----------
// Postes et borne restent à leur place : les objets se posent dans les trouées
// (le long du mur de droite entre P et C, X 2,8 à 4,2 ; les deux trouées de
// devant, FRONT_SPOTS).

// un « pixel » carré (monde en pixels), en coordonnées de l'écran
const px = (x, y, s, fill) => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(s)}" height="${r1(s)}" fill="${fill}"/>`;
// une forme en cases : des lignes de texte ('X' plein, '.' vide), couleurs par lettre
const sprite = (x, y, s, rows, colors) => rows.map((r, j) => [...r].map((c, i) => (colors[c] ? px(x + i * s, y + j * s, s + 0.05, colors[c]) : '')).join('')).join('');
// une pièce d'or qui tourne sur elle-même
const coin = (x, y, animate, k = 0) => `<g class="hub-coin"><ellipse cx="${r1(x)}" cy="${r1(y)}" rx="3.2" ry="3.8" fill="#f5b81c" stroke="#a8670d" stroke-width="0.8">${animate ? `<animate attributeName="rx" values="3.2;0.5;3.2" dur="${(1.1 + 0.2 * (k % 3)).toFixed(1)}s" repeatCount="indefinite"/>` : ''}</ellipse>`
  + `<rect x="${r1(x - 0.5)}" y="${r1(y - 2)}" width="1" height="4" fill="#ffe27a">${animate ? `<animate attributeName="opacity" values="1;0;1" dur="${(1.1 + 0.2 * (k % 3)).toFixed(1)}s" repeatCount="indefinite"/>` : ''}</rect></g>`;

function pixel({ u, pick, title, animate }) {
  // ciel bleu de jeu 8 bits, soleil carré, collines en escalier, nuages en cases
  const cloudRows = ['..XXXX....', '.XXXXXXXX.', 'XXXXXXXXXX', '.YYYYYYYY.'];
  const clouds = [[24, 40, 3.2, 26], [196, 22, 3.6, 34], [282, 66, 2.6, 22], [110, 84, 2.4, 30]]
    .map(([x, y, s, d], k) => drift(sprite(x, y, s, cloudRows, { X: '#ffffff', Y: '#cfe6ff' }), k % 2 ? -14 : 14, d, animate)).join('');
  const sun = sprite(300, 18, 3.4, ['.XXXX.', 'XXXXXX', 'XXXXXX', 'XXXXXX', 'XXXXXX', '.XXXX.'], { X: '#ffe066' });
  // collines au loin : des marches de cases vertes
  const hill = (x0, w, h, col, top) => {
    let d = '';
    for (let i = 0; i < w; i++) {
      const hh = Math.round(h * Math.sin((Math.PI * (i + 0.5)) / w));
      d += `M${x0 + i * 6} ${200 - hh * 6}h6v${hh * 6}h-6z`;
    }
    return `<path d="${d}" fill="${col}"/><path d="${d.replace(/v\d+/g, 'v3')}" fill="${top}"/>`;
  };
  const hills = hill(-6, 16, 9, '#2f9e44', '#69db7c') + hill(150, 14, 7, '#2b8a3e', '#51cf66') + hill(250, 22, 11, '#37b24d', '#8ce99a');
  // murs bas en blocs de terre, herbe en créneaux sur le dessus
  const HB = 1.5;
  const blockWall = (side) => {
    const q = side === 'L' ? lw : rw;
    const at = side === 'L' ? onL : onR;
    const d = [];
    for (let z = 0.5; z < HB; z += 0.5) d.push(`M${pts([q(0, z), q(N, z)])}`);
    for (let row = 0; row < 3; row++) for (let t = row % 2 ? 0.5 : 1; t < N; t += 1) d.push(`M${pts([q(t, row * 0.5), q(t, row * 0.5 + 0.5)])}`);
    const grass = [];
    for (let t = 0; t < N; t += 0.25) grass.push(q(t, HB - 0.12), q(t, HB + (Math.round(t * 4) % 2 ? 0.1 : 0.02)), q(t + 0.25, HB + (Math.round(t * 4) % 2 ? 0.1 : 0.02)));
    grass.push(q(N, HB - 0.12));
    return `${at(0, N, 0, HB, `url(#${u('dirt')})`)}<path d="${d.join('')}" stroke="#5c3a1e" stroke-width="0.9" fill="none"/>${poly(grass, '#40c057')}${at(0, N, HB - 0.18, HB - 0.12, '#2b8a3e')}`;
  };
  // sol : herbe en damier, petites fleurs en cases
  const tilesGrass = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) tilesGrass.push(flat(i, j, 0, 1, 1, (i + j) % 2 ? '#51cf66' : '#69db7c'));
  const flowers = Array.from({ length: 14 }, (_, k) => {
    const [x, y] = P(0.3 + hash(k + 40) * 6.4, 0.3 + hash(k + 41) * 6.4, 0.01);
    return sprite(x - 3, y - 3, 2, ['.X.', 'XYX', '.X.'], { X: hash(k + 42) > 0.5 ? '#ff6b6b' : '#ffffff', Y: '#ffd43b' });
  }).join('');
  // un arbre en cases contre le mur du fond, entre P et C ; une caisse devant
  const [tx, ty] = P(FRONT_SPOTS[1][0] + 0.3, FRONT_SPOTS[1][1] + 0.3, 0);
  const tree = `<g class="hub-tree">${sprite(tx - 12, ty - 42, 3, ['..GGGG..', '.GGHGGG.', 'GGGGGHGG', 'GHGGGGGG', 'GGGGHGGG', '.GGGGGG.', '...TT...', '...TT...', '...TT...', '..TTTT..'], { G: '#2f9e44', H: '#8ce99a', T: '#8b5a2b' })}</g>`;
  const crate = box(FRONT_SPOTS[0][0], FRONT_SPOTS[0][1], 0, 0.5, 0.5, 0.5, ['#e8a33d', '#a4621f', '#c97f2c'])
    + flat(FRONT_SPOTS[0][0] + 0.12, FRONT_SPOTS[0][1] + 0.12, 0.505, 0.26, 0.26, '#a4621f');
  const [c1x, c1y] = P(FRONT_SPOTS[0][0] + 0.25, FRONT_SPOTS[0][1] + 0.25, 1.1);
  const [c2x, c2y] = P(3.1, 0.6, 1.9);
  const [c3x, c3y] = P(4.1, 0.6, 1.7);
  const coins = `${coin(c1x, c1y, animate, 0)}${coin(c1x + 9, c1y - 4, animate, 1)}${coin(c2x, c2y, animate, 2)}${coin(c3x, c3y, animate, 3)}`;
  const sign = onRight(2.05, 0.95, `<rect x="-4" y="-9" width="56" height="21" fill="#8b5a2b" stroke="#5c3a1e" stroke-width="1.4"/>`
    + say(pick, title, { fill: '#ffe066', sub: '#fff4d6', size: 5.2, font: 'ui-monospace, Menlo, monospace' }));
  return {
    bg: `url(#${u('sky')})`,
    defs: lin(u('sky'), [0, 0, 0, 1], [[0, '#4d8df5'], [0.6, '#7fb3ff'], [1, '#b8d8ff']]) + lin(u('dirt'), [0, 0, 0, 1], [[0, '#b0703a'], [1, '#8a5428']]),
    back: `${sun}${clouds}${hills}${blockWall('L')}${blockWall('R')}<g class="hub-screen">${sign}</g>`,
    floor: `${tilesGrass.join('')}${flowers}`,
    edge: '',
    props: `${tree}${crate}${coins}`,
    beam: ['#fffbe0', '#ffe066'], dust: '#fff3a0',
    plat: ['#c98e4a', '#7a4f26', '#9c6634'], vig: 0.22,
    sky: true, // son soleil : pas de lune ajoutée la nuit (daylight.js)
  };
}

function donjon({ u, pick, title, animate }) {
  // pierres sombres, torches, bannières, chaînes, coffre au trésor, braises
  const joints = [];
  for (let z = 0.36; z < HW; z += 0.36) joints.push(`M${pts([lw(0, z), lw(N, z)])}M${pts([rw(0, z), rw(N, z)])}`);
  for (let row = 0; row * 0.36 < HW; row++) {
    for (let t = row % 2 ? 0.35 : 0.7; t < N; t += 0.7) joints.push(`M${pts([lw(t, row * 0.36), lw(t, Math.min(HW, row * 0.36 + 0.36))])}M${pts([rw(t, row * 0.36), rw(t, Math.min(HW, row * 0.36 + 0.36))])}`);
  }
  const torch = (side, t, k) => {
    const [x, y] = (side === 'L' ? lw : rw)(t, 1.85);
    return `${glow(x, y - 10, 26, u('torch'), animate, k)}<path d="M${r1(x - 2)} ${r1(y + 6)}l2 -6l2 6z" fill="#3a2a1c"/><rect x="${r1(x - 2.6)}" y="${r1(y - 1.5)}" width="5.2" height="2" rx="0.8" fill="#5a4636"/>${flame(x, y - 1.4, 0.9, animate, k)}`;
  };
  const banner = (y0, col) => onLeft(y0, 0.75, `<path d="M0 0h26v40l-13 -7l-13 7z" fill="${col}" stroke="#2a0d0d" stroke-width="0.8"/><path d="M6 24h14l2 -13l-5 5l-4 -9l-4 9l-5 -5z" fill="#e9c46a"/><rect x="-2" y="-2" width="30" height="2.4" rx="1" fill="#6b5236"/>`);
  const chain = (x0, k) => {
    const links = Array.from({ length: 7 }, (_, i) => `<ellipse cx="0" cy="${i * 4.2}" rx="${i % 2 ? 0.9 : 1.6}" ry="2.4" fill="none" stroke="#8a8c92" stroke-width="0.9"/>`).join('');
    return onRight(x0, 0.2, sway(`<g>${links}</g>`, 0, 0, 1.5, 4 + k, animate));
  };
  // pavés irréguliers
  const stones = [];
  for (let i = 0; i < N * 2; i++) {
    for (let j = 0; j < N * 2; j++) {
      const c = 28 + Math.round(hash(i * 31 + j * 7) * 14);
      stones.push(flat(i / 2 + 0.03, j / 2 + 0.03, 0, 0.44, 0.44, `rgb(${c + 10},${c + 6},${c + 2})`));
    }
  }
  const [gx, gy] = P(FRONT_SPOTS[1][0] + 0.25, FRONT_SPOTS[1][1] + 0.18, 0.4);
  const chest = `<g class="hub-chest">${glow(gx, gy, 20, u('gold'), animate, 2)}${box(FRONT_SPOTS[1][0], FRONT_SPOTS[1][1], 0, 0.55, 0.38, 0.28, ['#7a4b26', '#4f2f16', '#64391c'])}`
    + `${box(FRONT_SPOTS[1][0] - 0.02, FRONT_SPOTS[1][1] - 0.02, 0.28, 0.59, 0.42, 0.08, ['#e9c46a', '#a07a2a', '#c99a3a'])}${box(FRONT_SPOTS[1][0] + 0.23, FRONT_SPOTS[1][1] + 0.38, 0.1, 0.1, 0.01, 0.14, ['#e9c46a', '#e9c46a', '#e9c46a'])}</g>`;
  const barrel = (X, Y) => `${box(X, Y, 0, 0.42, 0.42, 0.6, ['#6b4426', '#4a2e18', '#5a3820'])}${flat(X, Y, 0.6, 0.42, 0.42, '#7a5030')}${box(X - 0.01, Y - 0.01, 0.12, 0.44, 0.44, 0.05, ['#3a3532', '#2a2522', '#332d2a'])}${box(X - 0.01, Y - 0.01, 0.45, 0.44, 0.44, 0.05, ['#3a3532', '#2a2522', '#332d2a'])}`;
  const embers = fall(Array.from({ length: 12 }, (_, k) => {
    const [x, y] = P(0.4 + hash(k + 70) * 6.2, 0.4 + hash(k + 71) * 6.2, 0);
    return [x, y, (hash(k + 72) - 0.5) * 18, -(60 + hash(k + 73) * 80), r1(4 + hash(k + 74) * 4), r1(hash(k + 75) * 6)];
  }), '<circle r="0.9" fill="#ffb347"/>', animate);
  const plaque = onRight(2.2, 1.25, `<rect x="-5" y="-10" width="60" height="23" rx="2" fill="#4a4440" stroke="#2a2522" stroke-width="1.2"/>`
    + say(pick, title, { fill: '#f2c46a', sub: '#e8dcc8', size: 5.4, font: 'Georgia, serif' }));
  return {
    bg: '#0a0807',
    defs: lin(u('wallL'), [0, 0, 1, 0], [[0, '#2a2522'], [1, '#3a332e']]) + lin(u('wallR'), [0, 0, 1, 0], [[0, '#3d3530'], [1, '#2b2522']])
      + rad(u('torch'), [[0, '#ffb35c', 0.55], [1, '#ff7a1a', 0]]) + rad(u('gold'), [[0, '#ffe08a', 0.6], [1, '#ffb347', 0]]),
    back: `${wallL(`url(#${u('wallL')})`)}${wallR(`url(#${u('wallR')})`)}<path d="${joints.join('')}" stroke="#14100e" stroke-width="0.9" fill="none"/>`
      + `${banner(4.55, '#8e1b1b')}${banner(5.75, '#1b3a8e')}${chain(5.2, 0)}${chain(5.9, 1)}`
      + `${torch('L', 1.6, 0)}${torch('R', 1.6, 1)}${torch('R', 6.6, 2)}<g class="hub-screen">${plaque}</g>`,
    floor: `${floorPoly('#151210')}${stones.join('')}`,
    edge: cap('#14100e', 2.6),
    props: `${barrel(2.95, 0.25)}${barrel(3.5, 0.3)}${chest}`,
    over: embers,
    beam: ['#ffe2b8', '#ffb060'], dust: '#ffcf8a',
    plat: ['#3a3633', '#211e1c', '#2d2a27'], vig: 0.62,
  };
}

function arcade({ u, pick, title, animate }) {
  // une salle de jeux : bornes alignées contre les murs, néons, moquette à confettis
  const SCREENS = ['#36f3ff', '#ff6ad5', '#ffe066', '#7cff8a', '#ff8a5c', '#b48cff'];
  const cab = (side, t, k) => {
    const at = side === 'L' ? onLeft : onRight;
    const col = SCREENS[k % SCREENS.length];
    const blink = animate ? `<animate attributeName="opacity" values="1;0.55;1;0.8;1" dur="${(1.8 + (k % 4) * 0.5).toFixed(1)}s" repeatCount="indefinite"/>` : '';
    return at(t, 1.75, `<path d="M0 0h20v46h-20z" fill="#1c1030"/><path d="M0 0h20v6h-20z" fill="${col}" opacity="0.85"/><rect x="2.5" y="9" width="15" height="13" rx="1.5" fill="#05030a"/>`
      + `<rect x="3.5" y="10" width="13" height="11" rx="1" fill="${col}" opacity="0.75">${blink}</rect><path d="M-1 25h22v4h-22z" fill="#2b1a45"/><circle cx="6" cy="27" r="1.2" fill="#ff5c5c"/><circle cx="12" cy="27" r="1.2" fill="#ffe066"/><circle cx="15" cy="27" r="1.2" fill="#36f3ff"/>`);
  };
  const cabsL = [4.35, 5.2, 6.05].map((t, k) => cab('L', t, k)).join('');
  const cabsR = [0.25, 4.6, 5.45, 6.3].map((t, k) => cab('R', t, k + 3)).join('');
  const tube = (z, col, w) => `<path d="M${pts([P(0, N, z), P(0, 0, z), P(N, 0, z)])}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
  const neonSign = onLeft(1.0, 2.55, `<text font-family="system-ui, sans-serif" font-weight="900" font-size="15" letter-spacing="1" fill="none" stroke="#ff6ad5" stroke-width="3.2" stroke-opacity="0.3">GAME ON</text>`
    + `<text font-family="system-ui, sans-serif" font-weight="900" font-size="15" letter-spacing="1" fill="none" stroke="#ffd1f4" stroke-width="1.1">GAME ON${animate ? '<animate attributeName="opacity" values="1;1;0.3;1;0.6;1" keyTimes="0;0.7;0.72;0.76;0.8;1" dur="6s" repeatCount="indefinite"/>' : ''}</text>`);
  // moquette : des confettis de couleur sur fond bleu nuit
  const confetti = Array.from({ length: 70 }, (_, k) => {
    const [x, y] = P(hash(k + 500) * N, hash(k + 501) * N, 0.003);
    const c = SCREENS[k % SCREENS.length];
    const kind = k % 3;
    if (kind === 0) return `<circle cx="${r1(x)}" cy="${r1(y)}" r="1.3" fill="${c}" opacity="0.55"/>`;
    if (kind === 1) return `<path d="M${r1(x)} ${r1(y - 1.6)}l1.6 2.6h-3.2z" fill="${c}" opacity="0.55"/>`;
    return `<path d="M${r1(x - 2)} ${r1(y)}q1 -1.6 2 0t2 0" stroke="${c}" stroke-width="0.8" fill="none" opacity="0.6"/>`;
  }).join('');
  // une machine à pince, dans la trouée de devant
  const [X, Y] = FRONT_SPOTS[1];
  const [gx, gy] = P(X + 0.3, Y + 0.3, 1.1);
  const plush = [[0.12, 0.12, '#ff8fab'], [0.32, 0.16, '#74c0fc'], [0.2, 0.34, '#ffe066'], [0.4, 0.38, '#b2f2bb']].map(([dx, dy, c]) => { const [x, y] = P(X + dx, Y + dy, 0.62); return `<circle cx="${r1(x)}" cy="${r1(y)}" r="2.6" fill="${c}"/>`; }).join('');
  const claw = `<g class="hub-claw">${box(X, Y, 0, 0.6, 0.6, 0.55, ['#ff6ad5', '#a31f8a', '#c92aa8'])}${plush}${poly([P(X, Y + 0.6, 0.55), P(X + 0.6, Y + 0.6, 0.55), P(X + 0.6, Y + 0.6, 1.4), P(X, Y + 0.6, 1.4)], '#d8f8ff', ' fill-opacity="0.16"')}${poly([P(X + 0.6, Y, 0.55), P(X + 0.6, Y + 0.6, 0.55), P(X + 0.6, Y + 0.6, 1.4), P(X + 0.6, Y, 1.4)], '#d8f8ff', ' fill-opacity="0.22"')}`
    + `<path d="M${pts([P(X, Y, 1.4), P(X + 0.6, Y, 1.4), P(X + 0.6, Y + 0.6, 1.4)])}" stroke="#ffd1f4" stroke-width="0.8" fill="none"/>${box(X - 0.02, Y - 0.02, 1.4, 0.64, 0.64, 0.12, ['#ffe066', '#c9a227', '#e0b832'])}`
    + `<path d="M${r1(gx)} ${r1(gy - 18)}v10" stroke="#c9ced8" stroke-width="0.8"/><path d="M${r1(gx - 3)} ${r1(gy - 4)}l3 -4l3 4" stroke="#c9ced8" stroke-width="1" fill="none"/></g>`;
  const screen = onRight(2.15, 1.25, `<rect x="-6" y="-11" width="62" height="25" rx="3" fill="#0d0518" stroke="#36f3ff" stroke-width="1.3"/>`
    + say(pick, title, { fill: '#ff8ae2', sub: '#c9fbff', size: 5.4 }));
  return {
    bg: '#07040f',
    defs: lin(u('wall'), [0, 0, 0, 1], [[0, '#1b0d33'], [1, '#2a1250']]),
    back: `${wallL(`url(#${u('wall')})`)}${wallR(`url(#${u('wall')})`)}${cabsL}${cabsR}${neonSign}${tube(HW - 0.1, '#ff6ad5', 2.2)}${tube(HW - 0.1, '#ff6ad5', 6).replace('stroke-width="6"', 'stroke-width="6" stroke-opacity="0.18"')}`
      + `<g class="hub-screen">${screen}</g>`,
    floor: `${floorPoly('#0e1030')}${confetti}`,
    edge: `${tube(0.1, '#36f3ff', 1.6)}`,
    props: claw,
    beam: ['#ffe0fb', '#ff6ad5'], dust: '#ffb8f0',
    plat: ['#2a1745', '#140a24', '#1f1036'], vig: 0.55,
  };
}

// une pièce d'échecs en silhouette (repère : pied en 0, vers le haut), pour l'échiquier géant
const PIECE_PATH = {
  roi: 'M-9 0h18v-4h-3l-2 -16c4 -2 6 -6 6 -10c0 -5 -5 -8 -9 -8v-4h3v-3h-3v-3h-3v3h-3v3h3v4c-4 0 -9 3 -9 8c0 4 2 8 6 10l-2 16h-3z',
  dame: 'M-9 0h18v-4h-3l-2 -14l6 -16l-5 4l-2 -8l-3 7l-3 -7l-2 8l-5 -4l6 16l-2 14h-3z',
  cavalier: 'M-9 0h18v-4h-2c0 -8 -1 -18 -4 -26c-3 -6 -9 -9 -13 -8l-1 3l-3 -2l0 4c-3 2 -5 6 -5 9c0 3 3 4 6 2l4 -2c-2 5 -6 9 -6 13v3h-2z',
  tour: 'M-9 0h18v-4h-3v-20l3 -3v-6h-4v3h-3v-3h-4v3h-3v-3h-4v6l3 3v20h-3z',
};
const statue = (kind, x, y, s, light) => `<g transform="translate(${r1(x)} ${r1(y)}) scale(${s})"><path d="${PIECE_PATH[kind]}" fill="${light ? '#efe7da' : '#1d1b20'}" stroke="${light ? '#9a8f80' : '#8a7f72'}" stroke-width="1"/></g>`;

function echiquier({ u, pick, title, animate }) {
  // un grand hall de marbre sombre, la nuit : fenêtres de lune, bannières noir et
  // blanc, bougies ; le sol est un échiquier géant (8 × 8) ; des pièces géantes
  const window_ = (side, t) => (side === 'L' ? onLeft : onRight)(t, 2.6, `<path d="M0 44V12Q0 0 11 0Q22 0 22 12V44Z" fill="url(#${u('moon')})" stroke="#5c5666" stroke-width="1.6"/><path d="M11 1V44M1 22H21" stroke="#3a3542" stroke-width="1.2"/>`);
  const ban = (t, light) => onLeft(t, 0.7 + 0.06, `<path d="M0 0h22v34l-11 -6l-11 6z" fill="${light ? '#efe7da' : '#1d1b20'}" stroke="#8a7a5a" stroke-width="0.8"/>`
    + `<g transform="translate(11 26) scale(0.42)"><path d="${PIECE_PATH[light ? 'roi' : 'dame']}" fill="${light ? '#1d1b20' : '#efe7da'}"/></g>`);
  const candles = [[2.85, 0.3], [4.15, 0.3]].map(([X, Y], k) => {
    const [x, y] = P(X, Y, 0.85);
    return `${box(X - 0.05, Y - 0.05, 0, 0.1, 0.1, 0.8, ['#c9a227', '#7a5f12', '#a3821c'])}${glow(x, y - 6, 16, u('candle'), animate, k)}<rect x="${r1(x - 1.2)}" y="${r1(y - 6)}" width="2.4" height="6" fill="#f3ead8"/>${flame(x, y - 6, 0.5, animate, k)}`;
  }).join('');
  const board = [];
  const sq = N / 8;
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) board.push(flat(i * sq, j * sq, 0.002, sq, sq, (i + j) % 2 ? '#2e2a30' : '#e9e2d6'));
  const [kx, ky] = P(FRONT_SPOTS[0][0] + 0.3, FRONT_SPOTS[0][1] + 0.3, 0);
  const [nx, ny] = P(FRONT_SPOTS[1][0] + 0.3, FRONT_SPOTS[1][1] + 0.3, 0);
  const pieces = `<g class="hub-pieces"><ellipse cx="${r1(kx)}" cy="${r1(ky)}" rx="12" ry="4" fill="#000" opacity="0.35"/>${statue('roi', kx, ky, 1.15, false)}`
    + `<ellipse cx="${r1(nx)}" cy="${r1(ny)}" rx="12" ry="4" fill="#000" opacity="0.35"/>${statue('cavalier', nx, ny, 1.1, true)}</g>`;
  const wallStatues = onRight(3.15, 2.45, `${statue('tour', 6, 0, 0.8, true)}${statue('dame', 24, 0, 0.8, false)}`);
  const plaque = onRight(2.2, 1.0, `<rect x="-5" y="-10" width="60" height="23" rx="2" fill="#1d1b20" stroke="#c9a227" stroke-width="1.2"/>`
    + say(pick, title, { fill: '#e9c46a', sub: '#efe7da', size: 5.4, font: 'Georgia, serif' }));
  return {
    bg: '#0b0a0e',
    defs: lin(u('wallL'), [0, 0, 1, 0], [[0, '#1e1c22'], [1, '#2b2830']]) + lin(u('wallR'), [0, 0, 1, 0], [[0, '#2d2a32'], [1, '#1f1d23']])
      + lin(u('moon'), [0, 0, 0, 1], [[0, '#cfe0ff'], [1, '#5c7aa8']]) + rad(u('candle'), [[0, '#ffd27a', 0.55], [1, '#ff9a3c', 0]]),
    back: `${wallL(`url(#${u('wallL')})`)}${wallR(`url(#${u('wallR')})`)}${window_('L', 1.2)}${window_('L', 4.6)}${window_('R', 1.3)}${window_('R', 5.5)}`
      + `${ban(5.9, true)}${ban(6.55, false)}${wallStatues}${onL(0, N, HW - 0.2, HW, '#3a3542')}${onR(0, N, HW - 0.2, HW, '#3a3542')}<g class="hub-screen">${plaque}</g>`,
    floor: `${floorPoly('#2e2a30')}${board.join('')}`,
    edge: cap('#c9a227', 2),
    props: `${candles}${pieces}`,
    beam: ['#f4f0ff', '#cfd8ff'], dust: '#e8ecff',
    plat: ['#e9e4dc', '#a39d94', '#c7c1b8'], vig: 0.5,
  };
}

function iles({ u, pick, title, animate }) {
  // une île qui flotte dans le ciel : nuages en dessous, d'autres îles au loin
  // avec leur cascade, oiseaux ; un muret de pierre au fond, de l'herbe au sol
  const farIsle = (x, y, s, k) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-30 0Q-26 -8 -14 -9Q0 -14 14 -9Q26 -8 30 0Q16 22 0 30Q-16 22 -30 0Z" fill="#8a6a52"/><path d="M-30 0Q-26 -8 -14 -9Q0 -14 14 -9Q26 -8 30 0Q0 6 -30 0Z" fill="#69b85a"/>`
    + `<path d="M10 2v40" stroke="#dff4ff" stroke-width="3" opacity="0.8"/>${animate ? `<path d="M10 4v10" stroke="#ffffff" stroke-width="3" opacity="0.9"><animateTransform attributeName="transform" type="translate" values="0 0;0 30" dur="${(1.4 + k * 0.3).toFixed(1)}s" repeatCount="indefinite"/></path>` : ''}`
    + `<circle cx="-12" cy="-14" r="6" fill="#4f9e48"/><rect x="-13" y="-12" width="2" height="5" fill="#6b4a3a"/></g>`;
  const isles = farIsle(52, 92, 0.9, 0) + farIsle(312, 70, 0.7, 1) + farIsle(250, 140, 0.45, 2);
  const cloudsHigh = [[30, 36, 0.7, 34], [210, 26, 0.6, 40], [140, 120, 0.5, 30]].map(([x, y, s, d], k) => drift(cloud(x, y, s, '#ffffff', '#d8e6f5'), k % 2 ? -14 : 14, d, animate)).join('');
  const cloudsLow = [[20, 420, 1.6, 30], [330, 410, 1.5, 34], [170, 470, 2, 38], [60, 500, 1.4, 26], [300, 500, 1.7, 32]].map(([x, y, s, d], k) => drift(cloud(x, y, s, '#ffffff', '#d4e2f2'), k % 2 ? -12 : 12, d, animate)).join('');
  // le dessous de l'île : roche et racines, sous les deux bords de devant
  const [a, b, c] = [P(0, N, 0), P(N, N, 0), P(N, 0, 0)];
  const tip = [P(N * 0.55, N * 0.55, 0)[0], b[1] + 120];
  const rock = `<path d="M${r1(a[0])} ${r1(a[1])}L${r1(b[0])} ${r1(b[1])}L${r1(c[0])} ${r1(c[1])}Q${r1(c[0] - 10)} ${r1(c[1] + 60)} ${r1(tip[0] + 20)} ${r1(tip[1] - 10)}L${r1(tip[0])} ${r1(tip[1])}Q${r1(a[0] + 30)} ${r1(a[1] + 80)} ${r1(a[0])} ${r1(a[1])}Z" fill="#7a5a44"/>`
    + `<path d="M${r1(a[0])} ${r1(a[1])}L${r1(b[0])} ${r1(b[1])}L${r1(c[0])} ${r1(c[1])}L${r1(c[0])} ${r1(c[1] + 10)}L${r1(b[0])} ${r1(b[1] + 12)}L${r1(a[0])} ${r1(a[1] + 10)}Z" fill="#5b8f3e"/>`
    + [[-70, 9], [-34, 11], [26, 11], [64, 9]].map(([dx, dy], k) => `<path d="M${r1(b[0] + dx)} ${r1(b[1] + dy - Math.abs(dx) * 0.6)}q${k % 2 ? 3 : -3} 9 0 ${14 + k * 3}" stroke="#4f8f3a" stroke-width="1.6" fill="none"/>`).join('');
  // la cascade qui tombe du bord gauche de l'île
  const [wx, wy] = P(0.2, N, 0);
  const fall_ = `<rect x="${r1(wx - 4)}" y="${r1(wy)}" width="8" height="120" fill="#cdeeff" opacity="0.75"/>`
    + (animate ? [0, 1, 2].map((k) => `<rect x="${r1(wx - 3)}" y="${r1(wy)}" width="6" height="16" fill="#ffffff" opacity="0.9"><animateTransform attributeName="transform" type="translate" values="0 0;0 110" dur="1.6s" begin="${(k * 0.53).toFixed(2)}s" repeatCount="indefinite"/></rect>`).join('') : '');
  const wall = (side) => {
    const at = side === 'L' ? onL : onR;
    const q = side === 'L' ? lw : rw;
    const posts = [0, 1.75, 3.5, 5.25, 6.85].map((t) => at(t, t + 0.15, 0, 0.75, '#c8c0b0')).join('');
    const vine = `<path d="M${pts(Array.from({ length: 15 }, (_, i) => q(i / 2, 0.5 + 0.08 * Math.sin(i * 1.7))))}" stroke="#4f9e48" stroke-width="1.6" fill="none"/>`;
    return `${at(0, N, 0, 0.55, '#ded6c6')}${at(0, N, 0.5, 0.6, '#efe9dc')}${posts}${vine}`;
  };
  const grass = Array.from({ length: 40 }, (_, k) => {
    const [x, y] = P(0.2 + hash(k + 600) * 6.6, 0.2 + hash(k + 601) * 6.6, 0.005);
    return k % 4 ? `<path d="M${r1(x)} ${r1(y)}l-1 -3M${r1(x)} ${r1(y)}l1 -3.4" stroke="#3f8f36" stroke-width="0.7"/>` : `<circle cx="${r1(x)}" cy="${r1(y - 1)}" r="1.3" fill="${hash(k + 602) > 0.5 ? '#ffd43b' : '#ff8fab'}"/>`;
  }).join('');
  const [bx, by] = P(3.5, 0.5, 0);
  const bush = `<g class="hub-bush"><circle cx="${r1(bx - 9)}" cy="${r1(by - 8)}" r="9" fill="#4f9e48"/><circle cx="${r1(bx + 5)}" cy="${r1(by - 11)}" r="11" fill="#5fb252"/><circle cx="${r1(bx + 2)}" cy="${r1(by - 15)}" r="2" fill="#ff8fab"/><circle cx="${r1(bx - 10)}" cy="${r1(by - 11)}" r="2" fill="#ffd43b"/></g>`;
  const birds = gullsFlying(animate, '#4a5a78');
  const sign = signboard(1.0, 3.3, 0.55, 1.15, '#e8d2a8', ['#8a6a4a', '#5a4430', '#6e5438'], onRight(1.2, 1.0, say(pick, title, { fill: '#3a5a2a', sub: '#4a3a28', size: 5.4 })));
  return {
    bg: `url(#${u('sky')})`,
    defs: lin(u('sky'), [0, 0, 0, 1], [[0, '#69b7ee'], [0.55, '#a9d8f5'], [1, '#f6dbe6']]) + lin(u('grass'), [0, 0, 0, 1], [[0, '#7fcf6a'], [1, '#62b552']]),
    back: `<circle cx="292" cy="52" r="20" fill="#fff6c8" opacity="0.9"/>${cloudsHigh}${isles}${birds}${cloudsLow}${rock}${fall_}${wall('L')}${wall('R')}${sign}`,
    floor: `${floorPoly(`url(#${u('grass')})`)}${grass}`,
    edge: '',
    props: bush,
    beam: ['#fffbea', '#fff0b4'], dust: '#fffbe0',
    plat: ['#e4ddcf', '#a69e8e', '#c6beae'], vig: 0.18,
    sky: true,
  };
}

function stade({ u, pick, title, animate }) {
  // un stade la nuit : tribunes pleines, projecteurs, tableau d'affichage,
  // une pelouse tondue en bandes et ses lignes blanches
  const crowd = [];
  for (let row = 0; row < 5; row++) {
    const off = 0.5 + row * 0.6, z = 0.35 + row * 0.55;
    for (let t = -row * 0.6; t < N + 0.3; t += 0.36) {
      for (const [X, Y] of [[-off, t], [t, -off]]) {
        const [x, y] = P(X, Y, z);
        const k = Math.round((X + 9) * 37 + (Y + 9) * 13);
        const shirt = ['#e03131', '#1971c2', '#f1f3f5', '#e03131', '#1971c2'][Math.floor(hash(k) * 5)];
        crowd.push(`<circle cx="${r1(x)}" cy="${r1(y)}" r="2.2" fill="#d9a87c"/><path d="M${r1(x - 3.2)} ${r1(y + 6)}q3.2 -4.6 6.4 0z" fill="${shirt}"/>`);
        if (animate && hash(k + 3) > 0.94) crowd.push(`<circle cx="${r1(x + 1.5)}" cy="${r1(y - 0.5)}" r="1.8" fill="#fff" opacity="0"><animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;0.6;0.62;0.66;1" dur="${r1(3 + hash(k + 4) * 5)}s" begin="${r1(hash(k + 5) * 4)}s" repeatCount="indefinite"/></circle>`);
      }
    }
  }
  const stands = box(-3.4, 0, -0.1, 3.4, N, 0.1, ['#1c2230', '#121722', '#171c28']) + box(0, -3.4, -0.1, N, 3.4, 0.1, ['#1c2230', '#121722', '#171c28']);
  const tower = (X, Y, k) => {
    const [x, y] = P(X, Y, 5.4);
    return `${box(X - 0.06, Y - 0.06, 0, 0.12, 0.12, 5.2, ['#8a919e', '#4a505c', '#6a717e'])}<rect x="${r1(x - 14)}" y="${r1(y - 9)}" width="28" height="12" rx="1.5" fill="#2a2f3a"/>`
      + Array.from({ length: 8 }, (_, i) => `<circle cx="${r1(x - 10.5 + (i % 4) * 7)}" cy="${r1(y - 5 + Math.floor(i / 4) * 5.5)}" r="2" fill="#fffbe6"/>`).join('') + glow(x, y - 3, 34, u('flood'), animate, k);
  };
  const board = `<rect x="-8" y="-13" width="66" height="29" rx="2" fill="#0b0e16" stroke="#3a3f4c" stroke-width="1.4"/>${say(pick, title, { fill: '#ffd43b', sub: '#f1f3f5', size: 5.6 })}`;
  // pelouse : bandes de tonte, lignes blanches (le rond central, une surface)
  const stripes = Array.from({ length: N }, (_, i) => flat(i, 0, 0.001, 1, N, i % 2 ? '#2f9e44' : '#37b24d')).join('');
  const ring_ = Array.from({ length: 41 }, (_, k) => P(3.5 + 1.3 * Math.cos((k / 40) * Math.PI * 2), 3.5 + 1.3 * Math.sin((k / 40) * Math.PI * 2), 0.003));
  const lines = `<path d="M${pts([P(0.25, 0.25, 0.003), P(N - 0.25, 0.25, 0.003), P(N - 0.25, N - 0.25, 0.003), P(0.25, N - 0.25, 0.003)])}Z" stroke="#f1f3f5" stroke-width="1.1" fill="none" opacity="0.85"/>`
    + `<path d="M${pts([P(0.25, 3.5, 0.003), P(N - 0.25, 3.5, 0.003)])}" stroke="#f1f3f5" stroke-width="1.1" opacity="0.85"/><path d="M${pts(ring_)}" stroke="#f1f3f5" stroke-width="1.1" fill="none" opacity="0.85"/>`;
  const [fx, fy] = P(FRONT_SPOTS[0][0] + 0.3, FRONT_SPOTS[0][1] + 0.3, 0);
  const ball = `<g class="hub-ball"><ellipse cx="${r1(fx)}" cy="${r1(fy)}" rx="6" ry="2" fill="#000" opacity="0.3"/><circle cx="${r1(fx)}" cy="${r1(fy - 5)}" r="5" fill="#ffffff" stroke="#2a2f3a" stroke-width="0.8"/><path d="M${r1(fx)} ${r1(fy - 7.5)}l2 1.6l-0.8 2.4h-2.4l-0.8 -2.4z" fill="#2a2f3a"/></g>`;
  const [gx, gy] = P(FRONT_SPOTS[1][0] + 0.2, FRONT_SPOTS[1][1] + 0.2, 0);
  const flag = `<g class="hub-flag"><path d="M${r1(gx)} ${r1(gy)}v-22" stroke="#f1f3f5" stroke-width="1"/>${sway(`<path d="M${r1(gx)} ${r1(gy - 22)}l9 3l-9 3z" fill="#ffd43b"/>`, gx, gy - 22, 6, 1.6, animate)}</g>`;
  return {
    bg: '#04060c',
    defs: rad(u('flood'), [[0, '#fffbe6', 0.6], [1, '#fffbe6', 0]]),
    back: `${stands}<g class="hub-crowd">${crowd.join('')}</g>${tower(-2.6, 3.4, 1)}${tower(3.4, -2.6, 2)}`
      + box(-0.25, 0, 0, 0.25, N, 0.45, ['#1971c2', '#0c3d6e', '#145a9e']) + box(0, -0.25, 0, N, 0.25, 0.45, ['#1971c2', '#0c3d6e', '#145a9e'])
      + `<g class="hub-screen">${onRight(2.2, 1.4, board)}</g>`,
    floor: `${floorPoly('#2b8a3e')}${stripes}${lines}`,
    edge: '',
    props: `${ball}${flag}`,
    beam: ['#ffffff', '#eef4ff'], dust: '#ffffff',
    plat: ['#2b3240', '#161b24', '#202733'], vig: 0.6,
  };
}

function labo({ u, pick, title, animate }) {
  // un labo secret : panneaux de métal, tubes lumineux pleins de bulles, grand
  // écran (courbe qui défile), voyants, sol à grille, un hologramme
  const panels = (side) => {
    const q = side === 'L' ? lw : rw;
    const d = [];
    for (let t = 0.875; t < N; t += 0.875) d.push(`M${pts([q(t, 0), q(t, HW)])}`);
    d.push(`M${pts([q(0, 1.5), q(N, 1.5)])}`);
    return `<path d="${d.join('')}" stroke="#0e1720" stroke-width="1" fill="none"/>`;
  };
  const tubeAt = (t, k) => {
    const [x, y] = lw(t, 0.2);
    const bubbles = animate ? [0, 1, 2].map((i) => `<circle cx="${r1(x + (i - 1) * 2.4)}" cy="${r1(y)}" r="1.1" fill="#d8fbff" opacity="0"><animate attributeName="cy" values="${r1(y - 4)};${r1(y - 52)}" dur="${(2 + i * 0.4 + k * 0.3).toFixed(1)}s" begin="${(i * 0.6).toFixed(1)}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0.9;0" dur="${(2 + i * 0.4 + k * 0.3).toFixed(1)}s" begin="${(i * 0.6).toFixed(1)}s" repeatCount="indefinite"/></circle>`).join('') : '';
    return `<g class="hub-tube"><rect x="${r1(x - 7)}" y="${r1(y - 58)}" width="14" height="58" rx="6" fill="url(#${u('liquid')})" opacity="0.85"/>${bubbles}<rect x="${r1(x - 7)}" y="${r1(y - 58)}" width="14" height="58" rx="6" fill="none" stroke="#9fe8ff" stroke-width="1"/>`
      + `<rect x="${r1(x - 8.5)}" y="${r1(y - 62)}" width="17" height="5" rx="1.5" fill="#3a4a58"/><rect x="${r1(x - 8.5)}" y="${r1(y - 2)}" width="17" height="5" rx="1.5" fill="#3a4a58"/>${glow(x, y - 30, 22, u('cyan'), animate, k)}</g>`;
  };
  const tubes = [4.5, 5.4, 6.3].map((t, k) => tubeAt(t, k)).join('');
  const wave = (() => {
    const pts_ = Array.from({ length: 25 }, (_, i) => `${i * 2.4} ${r1(Math.sin(i * 0.9) * 4 * (i % 5 === 0 ? 1.8 : 1))}`).join('L');
    return `<path d="M${pts_}" stroke="#5ff3ff" stroke-width="1" fill="none" stroke-dasharray="6 3">${animate ? '<animate attributeName="stroke-dashoffset" values="0;-36" dur="2s" repeatCount="indefinite"/>' : ''}</path>`;
  })();
  const monitor = onRight(1.95, 1.3, `<rect x="-6" y="-16" width="70" height="38" rx="3" fill="#03141c" stroke="#5ff3ff" stroke-width="1.2"/>`
    + `<g transform="translate(0 -4)">${say(pick, title, { fill: '#5ff3ff', sub: '#d8fbff', size: 5.4 })}</g><g transform="translate(2 15)">${wave}</g>`);
  const lights = onRight(4.7, 1.2, Array.from({ length: 12 }, (_, i) => `<circle cx="${(i % 6) * 6}" cy="${Math.floor(i / 6) * 6}" r="1.5" fill="${['#ff5c5c', '#5ff3ff', '#7cff8a'][i % 3]}">${animate ? `<animate attributeName="opacity" values="1;0.2;1" dur="${(0.8 + (i % 5) * 0.35).toFixed(2)}s" repeatCount="indefinite"/>` : ''}</circle>`).join(''));
  const grid = [];
  for (let i = 0; i <= N; i += 0.5) grid.push(`M${pts([P(i, 0, 0.003), P(i, N, 0.003)])}M${pts([P(0, i, 0.003), P(N, i, 0.003)])}`);
  const [hx, hy] = P(FRONT_SPOTS[1][0] + 0.3, FRONT_SPOTS[1][1] + 0.3, 0.12);
  const cube = '<path d="M-6 -3l6 -3l6 3l-6 3zM-6 -3v7l6 3v-7M6 -3v7l-6 3" stroke="#9ff8ff" stroke-width="0.9" fill="none"/>';
  const holo = `<g class="hub-holo">${box(FRONT_SPOTS[1][0] + 0.05, FRONT_SPOTS[1][1] + 0.05, 0, 0.5, 0.5, 0.12, ['#3a4a58', '#1c2630', '#2a3642'])}`
    + `<path d="M${r1(hx - 3)} ${r1(hy)}L${r1(hx - 13)} ${r1(hy - 34)}L${r1(hx + 13)} ${r1(hy - 34)}L${r1(hx + 3)} ${r1(hy)}Z" fill="url(#${u('cone')})"/>`
    + `<g transform="translate(${r1(hx)} ${r1(hy - 38)})">${animate ? `<g>${cube}<animateTransform attributeName="transform" type="rotate" values="0;360" dur="6s" repeatCount="indefinite"/></g>` : cube}</g></g>`;
  const data = fall(Array.from({ length: 10 }, (_, k) => {
    const [x, y] = P(0.4 + hash(k + 800) * 6.2, 0.4 + hash(k + 801) * 6.2, 0);
    return [x, y, 0, -(50 + hash(k + 802) * 60), r1(3 + hash(k + 803) * 3), r1(hash(k + 804) * 5)];
  }), '<rect x="-0.8" y="-0.8" width="1.6" height="1.6" fill="#5ff3ff" opacity="0.8"/>', animate);
  return {
    bg: '#020a10',
    defs: lin(u('wallL'), [0, 0, 1, 0], [[0, '#17232d'], [1, '#22323f']]) + lin(u('wallR'), [0, 0, 1, 0], [[0, '#25384a'], [1, '#182632']])
      + lin(u('liquid'), [0, 0, 0, 1], [[0, '#1fc8e0', 0.5], [1, '#0a7fa0', 0.9]]) + rad(u('cyan'), [[0, '#5ff3ff', 0.3], [1, '#5ff3ff', 0]])
      + lin(u('cone'), [0, 1, 0, 0], [[0, '#5ff3ff', 0.45], [1, '#5ff3ff', 0.02]]),
    back: `${wallL(`url(#${u('wallL')})`)}${wallR(`url(#${u('wallR')})`)}${panels('L')}${panels('R')}${tubes}<g class="hub-screen">${monitor}</g>${lights}`
      + `${onL(0, N, HW - 0.12, HW, '#5ff3ff', ' opacity="0.5"')}${onR(0, N, HW - 0.12, HW, '#5ff3ff', ' opacity="0.5"')}`,
    floor: `${floorPoly('#0d161e')}<path d="${grid.join('')}" stroke="#5ff3ff" stroke-opacity="0.18" stroke-width="0.6" fill="none"/>`,
    edge: `<path d="M${pts([P(0, N, 0.06), P(0, 0, 0.06), P(N, 0, 0.06)])}" stroke="#5ff3ff" stroke-width="1.4" fill="none" opacity="0.7"/>`,
    props: holo,
    over: data,
    beam: ['#e0fdff', '#5ff3ff'], dust: '#bff9ff',
    plat: ['#253645', '#121c25', '#1b2a36'], vig: 0.55,
  };
}

const ART = { salle, grec, medieval, dojo, toit, station, plage, sommet, ocean, neon, arene, foret, volcan, jungle, ring, desert, pirate, pixel, donjon, arcade, echiquier, iles, stade, labo, halloween, noel, printemps, ete };

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
