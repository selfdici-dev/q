// Fabrique les problèmes du jour (js/chess-daily-data.js) : Cap joue des
// parties contre lui-même (coups un peu au hasard, pour varier), et on garde
// les positions où un seul coup gagne : un mat en 1, un mat en 2, ou un coup
// qui gagne du matériel (au moins 2 pions de mieux que tout autre coup).
// Chaque problème est vérifié par le moteur (une seule solution, position
// naturelle : pas une simple reprise, pas déjà gagnée d'avance).
// Usage : node outils/echecs/problemes.mjs [nombre de problèmes]
import { writeFileSync } from 'node:fs';
import { fromFen, toFen, legalMoves, make, unmake, san, status, evaluate, analyse, matingMoves, inCheck, START, MATE } from '../../js/chess.js';

const WANT = Number(process.argv[2] ?? 150);
const MIX = { mate1: 0.35, mate2: 0.2, gain: 0.45 }; // la part de chaque sorte
// hasard fixe (toujours les mêmes problèmes d'une fois sur l'autre)
let seed = 20261104;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };

const found = { mate1: [], mate2: [], gain: [] };
const seen = new Set();
const enough = (k) => found[k].length >= Math.round(WANT * MIX[k]);
const t0 = Date.now();

function keep(kind, pos, answer, extra = {}) {
  const fen = toFen(pos);
  const key = fen.split(' ').slice(0, 2).join(' ');
  if (seen.has(key) || enough(kind)) return;
  seen.add(key);
  found[kind].push({ fen, kind, answer, ...extra });
}

// une position de partie : y a-t-il un problème ?
function look(pos, last) {
  const moves = legalMoves(pos);
  if (moves.length < 2) return;
  if (Math.abs(evaluate(pos)) > 1500) return; // déjà gagné d'avance (deux dames contre un roi…)
  // mat en 1, une seule façon
  const m1 = matingMoves(pos, 1);
  if (m1.length === 1) { keep('mate1', pos, san(pos, m1[0])); return; }
  if (m1.length > 1) return;
  // mat en 2 (pas en 1), un seul premier coup
  if (!enough('mate2')) {
    const m2 = matingMoves(pos, 2, 2);
    if (m2.length === 1) { keep('mate2', pos, san(pos, m2[0])); return; }
    if (m2.length > 1) return;
  }
  // gagner du matériel : le meilleur coup bien au-dessus de tous les autres,
  // dans une position à peu près égale, et ce n'est pas une simple reprise
  if (enough('gain') || Math.abs(evaluate(pos)) > 150 || inCheck(pos)) return; // en échec : un coup forcé, pas un problème
  const quick = analyse(pos, { depth: 2, quiet: true, ms: 300 });
  if (quick.length < 2 || quick[0].score < 200 || quick[0].score - quick[1].score < 200) return;
  if (last && quick[0].m.to === last.to && last.captured) return; // reprise
  const deep = analyse(pos, { depth: 3, quiet: true, ms: 3000 });
  if (deep[0].m.from !== quick[0].m.from || deep[0].m.to !== quick[0].m.to) return;
  if (deep[0].score < 200 || deep[0].score > MATE - 100 || deep[0].score - deep[1].score < 200) return;
  keep('gain', pos, san(pos, deep[0].m), { gain: Math.round(deep[0].score / 100) });
}

let games = 0;
while (!['mate1', 'mate2', 'gain'].every(enough) && games < 4000) {
  games++;
  const pos = fromFen(START);
  const keys = [toFen(pos, false)];
  let last = null;
  for (let ply = 0; ply < 140; ply++) {
    if (status(pos, keys)) break;
    if (ply >= 10) look(pos, last);
    // un coup de partie : le meilleur à petite profondeur, avec un peu de fantaisie
    const scored = analyse(pos, { depth: rnd() < 0.5 ? 1 : 2, quiet: true, ms: 200 });
    if (!scored.length) break;
    const noise = 60 + rnd() * 140;
    const pick = scored.map((x) => ({ m: x.m, s: x.score + (rnd() - 0.5) * 2 * noise })).sort((a, b) => b.s - a.s)[0].m;
    last = pick;
    make(pos, pick);
    keys.push(toFen(pos, false));
  }
  if (games % 20 === 0) console.log(games, 'parties', Object.entries(found).map(([k, v]) => `${k} ${v.length}`).join(' · '), `${Math.round((Date.now() - t0) / 1000)} s`);
}

// mélangés une fois pour toutes (toujours le même ordre), les sortes alternées
const all = [...found.mate1, ...found.mate2, ...found.gain];
for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
const js = (v) => JSON.stringify(v).replace(/"/g, "'");
const lines = [
  '// Fabriqué par outils/echecs/problemes.mjs : ne pas modifier à la main.',
  '// Les problèmes du jour : des positions de parties de Cap où un seul coup gagne.',
  '// kind : mate1 (mat en 1), mate2 (mat en 2 : la réponse de Cap, puis le mat),',
  '// gain (un coup qui gagne du matériel, gain : combien de pions de mieux) ;',
  '// answer : le coup (notation française) ; fen : la position.',
  'export const DAILY = [',
  ...all.map((p) => `  { fen: ${js(p.fen)}, kind: ${js(p.kind)}, answer: ${js(p.answer)}${p.gain ? `, gain: ${p.gain}` : ''} },`),
  '];',
];
writeFileSync(new URL('../../js/chess-daily-data.js', import.meta.url), lines.join('\n') + '\n');
console.log(`${all.length} problèmes (${found.mate1.length} mats en 1, ${found.mate2.length} mats en 2, ${found.gain.length} gains) en ${games} parties, ${Math.round((Date.now() - t0) / 1000)} s`);
