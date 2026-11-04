// Ton rival : toi la semaine dernière. Ce que tu as fait cette semaine (du
// lundi à aujourd'hui) face à la même période de la semaine d'avant (du lundi
// au même jour) : séances, journées validées, routines du matin et du soir,
// lecture. Chacun gagne une manche quand il fait plus que l'autre ; à égalité,
// personne. Tout se calcule depuis tes jours, rien n'est stocké.
// Logique pure (sans DOM), testée par tests/rival.test.js.
import { addDays, dayStatus } from './logic.js';
import { routineStatus } from './routines.js';
import { weekOf } from './challenges.js';

// Les manches : ce qui compte pour un jour (d : le jour, key : sa date).
export const ROUNDS = [
  { id: 'seances', icon: 'dumbbell', label: 'Séances', count: (d) => (d.workouts ?? []).some((w) => w !== 'M') },
  { id: 'jours', icon: 'flame', label: 'Journées validées', count: (d, state, key) => dayStatus(state, key).valid },
  { id: 'matins', icon: 'sun', label: 'Matins avec ta routine', count: (d) => routineStatus(d.routine, 'matin').complete },
  { id: 'soirs', icon: 'moon', label: 'Soirs avec ta routine', count: (d) => routineStatus(d.routine, 'soir').complete },
  { id: 'lecture', icon: 'book-open', label: 'Jours de lecture', count: (d) => Boolean(d.read) },
];

const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;

// Où en est le duel aujourd'hui. fresh : ta toute première semaine (la semaine
// d'avant tombe avant ton départ) ; left : jours qui restent après aujourd'hui.
export function rivalStatus(raw, today) {
  // données bizarres (jours ou habitudes absents) : comme vides
  const state = { ...raw, days: raw?.days && typeof raw.days === 'object' ? raw.days : {}, habits: Array.isArray(raw?.habits) ? raw.habits : [] };
  const week = weekOf(today);
  let n = 1;
  while (addDays(week, n) <= today) n++;
  const span = (start) => Array.from({ length: n }, (_, i) => addDays(start, i));
  const mine = span(week);
  const theirs = span(addDays(week, -7));
  const total = (keys, r) => keys.filter((k) => r.count(state.days[k] ?? {}, state, k)).length;
  const rounds = ROUNDS.map(({ id, icon, label, count }) => {
    const me = total(mine, { count });
    const rival = total(theirs, { count });
    return { id, icon, label, me, rival, lead: me > rival ? 'toi' : me < rival ? 'rival' : 'egal' };
  });
  const me = rounds.filter((r) => r.lead === 'toi').length;
  const rival = rounds.filter((r) => r.lead === 'rival').length;
  const start = state.settings?.startDate;
  const fresh = Boolean(start) && addDays(week, -1) < start;
  const left = 7 - n;
  let verdict;
  if (fresh) verdict = 'Ta première semaine : la semaine prochaine, tu affronteras celle-ci. Mets la barre haut !';
  else if (me > rival) verdict = `Tu mènes ${me} à ${rival} contre toi de la semaine dernière. Garde le rythme !`;
  else if (me < rival) verdict = `Toi de la semaine dernière mène ${rival} à ${me}. ${left ? `Il reste ${plural(left, 'jour')} pour le rattraper.` : 'La revanche, c’est dès lundi.'}`;
  else verdict = me ? `Égalité, ${me} partout : un jour de plus et tu passes devant.` : 'Égalité pour l’instant : la première manche gagnée te met devant.';
  return { week, day: n, left, rounds, me, rival, fresh, verdict };
}
