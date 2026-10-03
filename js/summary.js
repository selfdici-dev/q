// Textes courts à coller dans Claude : bilan du jour (onglet Jour) et bilan
// de la semaine (Moi > Bilan). Logique pure, testée par tests/summary.test.js.
import {
  addDays, diffDays, fromKey, dayStatus, chain, weekNumber, weeklyBedtime,
  sleepDuration, bedtimeMinutes, minutesToHHMM, SPRINT_LENGTH, SPRINT_PASS, SPRINT_COUNT,
} from './logic.js';
import { WORKOUTS, WEEK_PLAN, PROTEIN_TARGET } from './data.js';

const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;
const num = (v) => Number(v).toLocaleString('fr-FR', { maximumFractionDigits: 1 });
const hours = (mins) => `${Math.floor(mins / 60)} h ${String(Math.round(mins % 60)).padStart(2, '0')}`;
const dateLabel = (key, opts) => fromKey(key).toLocaleDateString('fr-FR', opts);
const habitName = (state, id) => state.habits.find((h) => h.id === id)?.name ?? id;
const workoutName = (id) => WORKOUTS.find((w) => w.id === id)?.name ?? id;
const dayIds = (state, d) => d.ids ?? state.habits.map((h) => h.id);

function sessionLine(planned, done) {
  const real = done.filter((w) => w !== 'M');
  if (real.length) return `Séance : faite ✓ (${real.map(workoutName).join(', ')}${done.includes('M') ? ' + mobilité' : ''})`;
  if (done.includes('M')) return planned === 'M' ? 'Séance : mobilité faite ✓' : `Séance : mobilité seulement (prévue : ${workoutName(planned)})`;
  return `Séance : pas faite (prévue : ${workoutName(planned)})`;
}

export function daySummary(state, key) {
  const d = state.days[key] ?? {};
  const st = dayStatus(state, key);
  const ids = dayIds(state, d);
  const full = ids.filter((id) => (d.habits?.[id] ?? 0) >= 2).length;
  const missing = ids.filter((id) => (d.habits?.[id] ?? 0) < 1).map((id) => habitName(state, id));
  const snacks = d.snacks ?? [];
  const resisted = d.snackResisted ?? 0;
  const focus = d.focus ?? 0;
  const lines = [
    `Mon bilan Cap du ${dateLabel(key, { weekday: 'long', day: 'numeric', month: 'long' })}`,
    `Chaîne : ${plural(chain(state, key).count, 'jour')} · journée ${st.valid ? 'validée' : 'pas encore validée'}`,
    `Habitudes : ${st.done}/${st.total}${full ? ` (${full} en complet)` : ''}${missing.length ? ` · manque : ${missing.join(', ')}` : ''}`,
    sessionLine(WEEK_PLAN[fromKey(key).getDay()], d.workouts ?? []),
    `Focus : ${focus ? `${plural(focus, 'session')} de 25 min` : 'aucune session'}`,
    `Protéines : ${d.protein ?? 0}/${PROTEIN_TARGET} portions`,
    `Grignotages : ${snacks.length ? `${snacks.length} (${snacks.map((s) => `${s.time} ${s.trigger}`).join(', ')})` : 'aucun'}${resisted ? ` · ${plural(resisted, 'envie')} résistée${resisted > 1 ? 's' : ''}` : ''}`,
    `Coucher visé ce soir : ${weeklyBedtime(weekNumber(state, key), state.settings.bedtimeTarget)}`,
  ];
  if (d.bed) {
    const slept = sleepDuration(d.bed, d.wake);
    lines.push(`Nuit dernière : couché à ${d.bed}${d.wake ? `, levé à ${d.wake} (${hours(slept)} de sommeil)` : ''}`);
  }
  if (d.weight !== undefined && d.weight !== null && d.weight !== '') lines.push(`Poids : ${num(d.weight)} kg`);
  return lines.join('\n');
}

// Bilan des 7 jours qui commencent à `first` (un sprint), arrêté à aujourd'hui.
export function weekSummary(state, first, today) {
  const n = Math.max(1, Math.min(SPRINT_LENGTH, diffDays(first, today) + 1));
  const last = addDays(first, SPRINT_LENGTH - 1);
  const week = weekNumber(state, first);
  const days = Array.from({ length: n }, (_, i) => {
    const key = addDays(first, i);
    const d = state.days[key] ?? {};
    return { key, d, ids: dayIds(state, d), valid: dayStatus(state, key).valid };
  });
  const valid = days.filter((x) => x.valid).length;
  const finished = diffDays(last, today) > 0;
  const status = finished ? (valid >= SPRINT_PASS ? 'sprint réussi ✓' : 'sprint pas réussi')
    : `${valid >= SPRINT_PASS ? 'objectif 5/7 atteint ✓ · ' : ''}en cours (jour ${n}/7)`;

  const habitIds = [...new Set(days.flatMap((x) => x.ids))];
  const perHabit = habitIds.map((id) => {
    const active = days.filter((x) => x.ids.includes(id));
    const ok = active.filter((x) => (x.d.habits?.[id] ?? 0) >= 1).length;
    return `${habitName(state, id)} ${ok}/${active.length}`;
  });

  const workouts = days.flatMap((x) => x.d.workouts ?? []);
  const real = workouts.filter((w) => w !== 'M');
  const mobility = workouts.length - real.length;
  const planned = days.filter((x) => WEEK_PLAN[fromKey(x.key).getDay()] !== 'M').length;
  const focus = days.reduce((s, x) => s + (x.d.focus ?? 0), 0);
  const protein = days.reduce((s, x) => s + (x.d.protein ?? 0), 0) / n;
  const proteinDays = days.filter((x) => (x.d.protein ?? 0) >= PROTEIN_TARGET).length;

  const snacks = days.flatMap((x) => x.d.snacks ?? []);
  const resisted = days.reduce((s, x) => s + (x.d.snackResisted ?? 0), 0);
  const triggers = {};
  for (const s of snacks) triggers[s.trigger] = (triggers[s.trigger] ?? 0) + 1;
  const top = Object.entries(triggers).sort((a, b) => b[1] - a[1])[0];

  const beds = days.filter((x) => x.d.bed).map((x) => bedtimeMinutes(x.d.bed));
  const sleeps = days.map((x) => sleepDuration(x.d.bed, x.d.wake)).filter(Boolean);
  const weights = days.filter((x) => x.d.weight !== undefined && x.d.weight !== null && x.d.weight !== '').map((x) => Number(x.d.weight));
  const avg = (a) => a.reduce((s, v) => s + v, 0) / a.length;

  const short = { weekday: 'short', day: 'numeric', month: 'short' };
  const lines = [
    `Mon bilan Cap · sprint ${week}/${SPRINT_COUNT}, du ${dateLabel(first, short)} au ${dateLabel(last, short)}`,
    `Jours validés : ${valid}/${n} · ${status}`,
    `Habitudes : ${perHabit.join(' · ')}`,
    `Séances : ${real.length}${planned ? ` sur ${planned} prévues` : ''}${real.length ? ` (${real.join(', ')})` : ''}${mobility ? ` + ${mobility} mobilité` : ''}`,
    `Focus : ${focus ? `${plural(focus, 'session')} de 25 min` : 'aucune session'}`,
    `Protéines : ${num(protein)} portion${protein >= 2 ? 's' : ''}/jour en moyenne · objectif (${PROTEIN_TARGET}) atteint ${proteinDays} jour${proteinDays > 1 ? 's' : ''} sur ${n}`,
    `Grignotages : ${snacks.length || 'aucun'}${top ? ` · déclencheur n° 1 : ${top[0]} (${top[1]} fois)` : ''}${resisted ? ` · ${plural(resisted, 'envie')} résistée${resisted > 1 ? 's' : ''}` : ''}`,
    `Coucher : visé ${weeklyBedtime(week, state.settings.bedtimeTarget)}${beds.length ? ` · réel en moyenne ${minutesToHHMM(avg(beds))} (${plural(beds.length, 'nuit')} notée${beds.length > 1 ? 's' : ''})` : ''}${sleeps.length ? ` · sommeil moyen ${hours(avg(sleeps))}` : ''}`,
  ];
  if (weights.length) {
    lines.push(weights.length > 1
      ? `Poids : ${num(weights[0])} → ${num(weights.at(-1))} kg (moyenne ${num(avg(weights))}, ${weights.length} pesées)`
      : `Poids : ${num(weights[0])} kg (1 pesée)`);
  }
  const rv = state.reviews?.[week] ?? {};
  if (rv.win) lines.push(`Ce qui a marché : ${rv.win.trim()}`);
  if (rv.fail) lines.push(`Ce qui m’a fait rater : ${rv.fail.trim()}`);
  if (rv.change) lines.push(`Ce que je change : ${rv.change.trim()}`);
  return lines.join('\n');
}
