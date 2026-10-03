// Sauvegarde : rappel d'export et vérification d'un fichier avant import.
// Logique pure (sans DOM), testée par tests/backup.test.js.
import { diffDays, fromKey, toKey, todayKey } from './logic.js';

export const BACKUP_EVERY = 7; // jours sans export avant le rappel

// Jamais exporté : on compte depuis la date de départ.
export function backupStatus(state, today) {
  const at = state.settings?.lastExport ? new Date(state.settings.lastExport) : null;
  const never = !at || Number.isNaN(at.getTime());
  const since = never ? state.settings?.startDate : todayKey(at);
  const days = since ? Math.max(0, diffDays(since, today)) : 0;
  return { never, days, overdue: days > BACKUP_EVERY };
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isKey = (k) => typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k) && toKey(fromKey(k)) === k;
const isTime = (v) => typeof v === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(v);
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const empty = (v) => v === undefined || v === null || v === '';

const DAY_NUMBERS = ['weight', 'waist', 'screen', 'steps', 'protein', 'focus', 'urges', 'snackResisted', 'cardsOk'];
const LISTS = ['rules', 'tests', 'trades', 'feels', 'myCards'];
const OBJECTS = ['reviews', 'lessons', 'books', 'setup', 'srs', 'calc', 'wealth', 'timers', 'ui'];

function checkDay(key, d) {
  if (!isKey(key)) return `date impossible « ${key} »`;
  if (!isObj(d)) return `journée du ${key} illisible`;
  if (d.habits !== undefined && !isObj(d.habits)) return `habitudes du ${key} illisibles`;
  for (const lvl of Object.values(d.habits ?? {})) {
    if (![0, 1, 2].includes(lvl)) return `niveau d’habitude invalide le ${key}`;
  }
  if (d.ids !== undefined && (!Array.isArray(d.ids) || d.ids.some((x) => typeof x !== 'string'))) return `liste d’habitudes du ${key} illisible`;
  for (const f of DAY_NUMBERS) if (!empty(d[f]) && !isNum(d[f])) return `valeur « ${f} » invalide le ${key}`;
  for (const f of ['bed', 'wake']) if (!empty(d[f]) && !isTime(d[f])) return `heure « ${f} » invalide le ${key}`;
  for (const f of ['workouts', 'snacks']) if (d[f] !== undefined && !Array.isArray(d[f])) return `liste « ${f} » illisible le ${key}`;
  return null;
}

// Renvoie { ok: true, info } ou { ok: false, error } sans jamais modifier `data`.
export function validateBackup(data) {
  const fail = (why) => ({ ok: false, error: `Ce fichier n’est pas une sauvegarde Cap valide : ${why}.` });
  if (!isObj(data)) return fail('ce n’est pas un objet');
  if (!Array.isArray(data.habits)) return fail('liste d’habitudes absente');
  if (!isObj(data.days)) return fail('journées absentes');
  if (data.version !== undefined && !isNum(data.version)) return fail('version illisible');
  const ids = new Set();
  for (const h of data.habits) {
    if (!isObj(h) || typeof h.id !== 'string' || !h.id || typeof h.name !== 'string') return fail('une habitude est illisible');
    if (ids.has(h.id)) return fail(`habitude « ${h.id} » en double`);
    ids.add(h.id);
  }
  for (const [key, d] of Object.entries(data.days)) {
    const why = checkDay(key, d);
    if (why) return fail(why);
  }
  if (data.settings !== undefined) {
    if (!isObj(data.settings)) return fail('réglages illisibles');
    if (data.settings.startDate !== undefined && !isKey(data.settings.startDate)) return fail('date de départ impossible');
  }
  for (const f of LISTS) if (data[f] !== undefined && !Array.isArray(data[f])) return fail(`« ${f} » illisible`);
  for (const f of OBJECTS) if (data[f] !== undefined && !isObj(data[f])) return fail(`« ${f} » illisible`);
  if (data.rules?.some((r) => typeof r !== 'string')) return fail('une règle est illisible');
  const keys = Object.keys(data.days).sort();
  return { ok: true, info: { days: keys.length, habits: data.habits.length, first: keys[0] ?? null, last: keys.at(-1) ?? null } };
}
