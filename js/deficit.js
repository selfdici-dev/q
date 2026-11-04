// Ton déficit : chaque jour où tu notes ce que tu manges, Cap estime ce que
// tu as dépensé (selon tes pas, plus ta séance) et calcule la différence avec
// ce que tu as mangé. Additionné sur la semaine (depuis lundi) et sur le mois
// (depuis le 1er) : un repère de tendance, pas une balance. Les jours sans
// repas notés ne comptent pas. Tout se calcule depuis tes jours (repas, pas,
// séances), rien n'est stocké. Logique pure (sans DOM), testée par
// tests/deficit.test.js.
import { addDays, fromKey, mealTotals } from './logic.js';

// La dépense d'une journée : ≈ 2 350 kcal à 8 000 pas (l'objectif de Manger,
// 1 850, est ≈ 500 en dessous), ≈ 0,04 kcal par pas en plus ou en moins, plus
// les séances du jour. Sans pas notés : 8 000.
export const SPEND_BASE = 2350;
export const KCAL_PER_KG = 7700; // ≈ 1 kg de gras
export function kcalSpent(steps, sport = 0) {
  const s = Number.isFinite(steps) && steps > 0 ? steps : 8000;
  return Math.round(SPEND_BASE + 0.04 * (s - 8000) + (Number(sport) || 0));
}

// Un jour : mangé, dépensé, déficit (positif : tu as mangé moins que tu n'as
// dépensé), ou null si rien n'est noté. kcalOf(id) : les kcal d'une séance.
export function dayDeficit(d, kcalOf = () => 0) {
  const eaten = mealTotals(d?.meals).kcal;
  if (!eaten) return null;
  const sport = [...new Set(Array.isArray(d?.workouts) ? d.workouts : [])].reduce((s, id) => s + (Number(kcalOf(id)) || 0), 0);
  const spent = kcalSpent(d?.steps, sport);
  return { eaten, spent, deficit: spent - eaten };
}

// Le bilan : aujourd'hui, la semaine (lundi → aujourd'hui, jour par jour pour
// les barres) et le mois (le 1er → aujourd'hui). Pour chaque période : total,
// jours notés, moyenne par jour noté, l'équivalent en gras (kg).
export function deficitSummary(state, today, kcalOf = () => 0) {
  const days = state?.days && typeof state.days === 'object' ? state.days : {};
  const at = (k) => dayDeficit(days[k], kcalOf);
  const span = (start) => {
    const keys = [];
    for (let k = start; k <= today; k = addDays(k, 1)) keys.push(k);
    return keys;
  };
  const sum = (keys) => {
    const list = keys.map(at).filter(Boolean);
    const total = list.reduce((s, x) => s + x.deficit, 0);
    return { total, logged: list.length, avg: list.length ? Math.round(total / list.length) : 0, kg: Math.round((total / KCAL_PER_KG) * 100) / 100 };
  };
  const monday = addDays(today, -((fromKey(today).getDay() + 6) % 7));
  const first = `${today.slice(0, 8)}01`;
  const week = Array.from({ length: 7 }, (_, i) => {
    const key = addDays(monday, i);
    return { key, future: key > today, day: key <= today ? at(key) : null };
  });
  return { today: at(today), week, weekSum: sum(span(monday)), month: sum(span(first)) };
}
