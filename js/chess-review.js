// Revoir ta partie : Cap rejoue tes coups et note chacun. Pour chaque position
// où c'était à toi, il cherche tous les coups possibles et leur valeur (même
// recherche pour tous : la comparaison est juste) ; ce que ton coup t'a coûté,
// c'est l'écart entre le meilleur coup et le tien (en centièmes de pion).
// ?? gaffe, ? erreur, ?! imprécision ; un mat manqué compte comme une gaffe.
// L'analyse avance coup par coup (step), pour que l'écran reste vivant.
// Logique pure (sans DOM), testée par tests/chess-review.test.js.
import { fromFen, toFen, legalMoves, san, make, analyse, MATE } from './chess.js';

export const MARKS = [
  { min: 300, sign: '??', name: 'Gaffe' },
  { min: 120, sign: '?', name: 'Erreur' },
  { min: 70, sign: '?!', name: 'Imprécision' },
];
// 3 demi-coups de calcul (2 si le téléphone est lent : au plus une demi-seconde par coup)
export const REVIEW = { depth: 3, quiet: true, ms: 500 };
const MATE_NEAR = MATE - 100;
const clip = (v) => (v > MATE_NEAR ? 2000 : v < -MATE_NEAR ? -2000 : v); // un mat : 20 pions
const pawns = (cp) => (cp / 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 });

// Une partie (départ, coups en notation, ta couleur) → son analyse, à faire avancer.
export function createReview({ start, sans = [], color }, opts = REVIEW) {
  const pos = fromFen(start);
  const fens = [toFen(pos)];
  const moves = [];
  for (const s of sans) {
    const m = legalMoves(pos).find((x) => san(pos, x) === s);
    if (!m) break;
    moves.push({ san: s, from: m.from, to: m.to, turn: pos.turn, promo: m.promo });
    make(pos, m);
    fens.push(toFen(pos));
  }
  const todo = moves.map((_, k) => k).filter((k) => moves[k].turn === color);
  const items = []; // un par coup de toi : { k, san, loss, mark, best, comment }
  let i = 0;
  return {
    fens, moves, items,
    total: todo.length,
    get done() { return i >= todo.length; },
    get count() { return i; },
    // analyse le coup suivant (un des tiens) ; renvoie son résultat
    step() {
      if (i >= todo.length) return null;
      const k = todo[i++];
      const before = fromFen(fens[k]);
      const list = analyse(before, opts);
      const mv = moves[k];
      const mine = list.find(({ m }) => m.from === mv.from && m.to === mv.to && (m.promo || 0) === (mv.promo || 0));
      const top = list[0];
      const loss = mine && top ? Math.max(0, clip(top.score) - clip(mine.score)) : 0;
      const mateMissed = Boolean(top && top.score > MATE_NEAR && !(mine?.score > MATE_NEAR));
      const mark = mateMissed ? MARKS[0] : MARKS.find((x) => loss >= x.min) ?? null;
      const best = top && mark ? { san: san(before, top.m), from: top.m.from, to: top.m.to } : null;
      let comment;
      if (!mark) comment = loss < 20 ? 'Bon coup.' : 'Correct.';
      else if (mateMissed) comment = `${mark.name} : il y avait un mat avec ${best.san} !`;
      else comment = `${mark.name} : ton coup coûte ≈ ${pawns(loss)} pion${loss >= 150 ? 's' : ''}. Mieux : ${best.san}.`;
      const item = { k, san: mv.san, loss, mark: mark?.sign ?? '', name: mark?.name ?? '', best, comment };
      items.push(item);
      return item;
    },
  };
}

// Le bilan d'une analyse finie : précision (part de tes coups sans faute),
// combien de chaque faute, et ton plus gros faux pas.
export function reviewSummary(items) {
  const count = (sign) => items.filter((x) => x.mark === sign).length;
  const marked = items.filter((x) => x.mark);
  const worst = marked.reduce((w, x) => (!w || x.loss > w.loss || (x.name === 'Gaffe' && w.name !== 'Gaffe') ? x : w), null);
  return {
    accuracy: items.length ? Math.round((100 * items.filter((x) => !x.mark).length) / items.length) : 100,
    gaffes: count('??'), erreurs: count('?'), imprecisions: count('?!'),
    worst,
  };
}
