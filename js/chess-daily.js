// Le problème du jour : chaque jour un problème, tiré de vraies parties de Cap
// (chess-daily-data.js, fabriqué par outils/echecs/problemes.mjs : une seule
// solution, vérifiée par le moteur). Le même toute la journée, un autre le
// lendemain ; ta série : les jours résolus d'affilée (sans regarder la solution).
// Logique pure (sans DOM), testée par tests/chess-daily.test.js.
import { DAILY } from './chess-daily-data.js';
import { addDays, diffDays } from './logic.js';

export { DAILY };
export const KINDS = {
  mate1: { group: 'Mat en 1', goal: 'mate', text: () => 'Un seul coup, et c’est mat. Lequel ?' },
  mate2: { group: 'Mat en 2', goal: 'mate2', text: () => 'Mat en deux coups : ton coup, la réponse de Cap, puis le mat.' },
  gain: { group: 'Gagne du matériel', text: (p) => `Un seul coup gagne du matériel (≈ ${p.gain} pion${p.gain > 1 ? 's' : ''} de mieux). Trouve-le !` },
};
const EPOCH = '2026-01-01';

// Le problème d'un jour (clé « 2026-11-04 »), prêt pour l'écran des problèmes.
export function dailyFor(today) {
  const n = diffDays(EPOCH, today);
  const p = DAILY[((n % DAILY.length) + DAILY.length) % DAILY.length];
  const k = KINDS[p.kind];
  return { id: `jour-${today}`, fen: p.fen, kind: p.kind, group: k.group, text: k.text(p), solution: p.answer, ...(k.goal ? { goal: k.goal } : { answer: [p.answer] }) };
}

// Les jours résolus d'affilée, jusqu'à aujourd'hui (ou hier, si celui du jour
// reste à faire). done : { '2026-11-04': true, … }.
export function dailyStreak(done, today) {
  const ok = (d) => Boolean(done && typeof done === 'object' && done[d] === true);
  let d = ok(today) ? today : addDays(today, -1);
  let n = 0;
  while (ok(d)) { n++; d = addDays(d, -1); }
  return n;
}
