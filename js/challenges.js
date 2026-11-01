// Défis de la semaine : chaque lundi, trois défis tirés au hasard (la graine :
// la semaine), un pour le sport, un pour tes routines ou ta lecture, un à
// l'arcade (jamais le même que la semaine d'avant dans sa famille). Chacun
// réussi rapporte de l'XP, les trois un bonus (logic.js : XP.challenge,
// XP.challengeWeek). Ce qui est fait se calcule depuis tes jours de la
// semaine ; pour l'arcade, depuis tes records du début de semaine (base,
// notée la première fois que Cap s'ouvre dans la semaine). Un défi réussi le
// reste : state.challenges[lundi] = { base, done, told }.
// Logique pure (sans DOM), testée par tests/challenges.test.js.
import { rand } from './games.js';
import { addDays, fromKey } from './logic.js';
import { routineStatus } from './routines.js';

const fmt = (n) => Number(n).toLocaleString('fr-FR');
const sum = (o) => Object.values(o ?? {}).reduce((s, x) => s + (Number(x) || 0), 0);
const did = (d, f) => (d.workouts ?? []).some(f);

// Les défis possibles, par famille. count : sur les jours de la semaine ;
// record : un record à battre ; total : un compteur qui doit monter de n.
export const CHALLENGES = {
  sport: [
    { id: 'seances', icon: 'dumbbell', n: 4, text: '4 séances cette semaine (A, B, C ou P)', count: (w) => w.filter((d) => did(d, (x) => x !== 'M')).length },
    { id: 'boxe', icon: 'target', n: 2, text: '2 séances C (cardio boxe)', count: (w) => w.filter((d) => did(d, (x) => x === 'C')).length },
    { id: 'bouger', icon: 'flame', n: 6, text: 'Bouger 6 jours sur 7 (M compte)', count: (w) => w.filter((d) => (d.workouts ?? []).length > 0).length },
    { id: 'mobilite', icon: 'refresh', n: 2, text: '2 séances M (mobilité et posture)', count: (w) => w.filter((d) => did(d, (x) => x === 'M')).length },
  ],
  vie: [
    { id: 'matins', icon: 'sun', n: 5, text: '5 matins avec ta routine complète', count: (w) => w.filter((d) => routineStatus(d.routine, 'matin').complete).length },
    { id: 'soirs', icon: 'moon', n: 5, text: '5 soirs avec ta routine complète', count: (w) => w.filter((d) => routineStatus(d.routine, 'soir').complete).length },
    { id: 'lecture', icon: 'book-open', n: 4, text: 'Lire 10 pages, 4 jours', count: (w) => w.filter((d) => d.read).length },
  ],
  arcade: [
    { id: 'serpent', icon: 'apple', record: (g) => g?.serpent?.best ?? 0, text: (b) => `Bats ton record au Serpent (${fmt(b)} fruits)`, first: 'Mange au moins un fruit au Serpent' },
    { id: 'blocs', icon: 'grid', record: (g) => Math.max(g?.blocs?.best ?? 0, g?.blocs?.cur?.score ?? 0), text: (b) => `Bats ton record aux Blocs (${fmt(b)} points)`, first: 'Marque tes premiers points aux Blocs' },
    { id: 'calc', icon: 'coin', record: (g) => g?.calc?.best ?? 0, text: (b) => `Bats ton record au Calcul éclair (${fmt(b)} points)`, first: 'Marque au moins un point au Calcul éclair' },
    { id: 'echo', icon: 'lightbulb', record: (g) => g?.echo?.best ?? 0, text: (b) => `Bats ton record à Écho (une suite de ${fmt(b)})`, first: 'Retiens au moins une suite à Écho' },
    { id: 'sudoku', icon: 'pencil', n: 2, total: (g) => sum(g?.sudoku?.solved), text: '2 sudokus résolus' },
    { id: 'code', icon: 'lock', n: 3, total: (g) => g?.code?.wins ?? 0, text: '3 codes secrets trouvés' },
    // à partir de la semaine du 2 novembre 2026 (ajoutés à la fin : les semaines d'avant ne changent pas)
    { id: 'sprint', icon: 'trending-up', from: '2026-11-02', record: (g) => g?.sprint?.best ?? 0, text: (b) => `Bats ton record au Sprint (${fmt(b)} m)`, first: 'Cours au Sprint, même quelques mètres' },
    { id: 'pixels', icon: 'search', from: '2026-11-02', n: 2, total: (g) => (Array.isArray(g?.pixels?.done) ? g.pixels.done.length : 0), text: '2 dessins trouvés aux Pixels cachés' },
  ],
};
// les défis d'une famille possibles cette semaine-là
const pool = (f, week) => CHALLENGES[f].filter((c) => !c.from || week >= c.from);
const FAMILIES = ['sport', 'vie', 'arcade'];

// Le lundi de la semaine d'un jour (« 2026-10-26 » pour le dimanche 1er novembre).
export function weekOf(key) {
  return addDays(key, -((fromKey(key).getDay() + 6) % 7));
}

const hash = (text) => {
  let h = 2166136261;
  for (const c of String(text)) h = Math.imul(h ^ c.codePointAt(0), 16777619);
  return h >>> 0;
};
const draw = (week) => {
  let s = hash(`defis:${week}`);
  return FAMILIES.map((f) => {
    const [x, next] = rand(s);
    s = next;
    return Math.floor(x * pool(f, week).length);
  });
};

// Les trois défis d'une semaine (son lundi) : sport, vie, arcade. Tirés
// semaine après semaine depuis un lundi fixe, pour qu'un défi ne revienne
// jamais deux semaines de suite dans sa famille (on prend alors le suivant).
const ANCHOR = '2024-01-01';
const picked = new Map([[ANCHOR, draw(ANCHOR)]]);
export function weekChallenges(week) {
  if (week < ANCHOR) return FAMILIES.map((f, i) => pool(f, week)[draw(week)[i]]);
  let w = ANCHOR;
  while (w < week) {
    const next = addDays(w, 7);
    if (!picked.has(next)) {
      const prev = picked.get(w);
      picked.set(next, draw(next).map((x, i) => (x === prev[i] ? (x + 1) % pool(FAMILIES[i], next).length : x)));
    }
    w = next;
  }
  return FAMILIES.map((f, i) => pool(f, w)[picked.get(w)[i]]);
}

// Tes records d'arcade au début de la semaine (pour « bats ton record »).
export function gameBase(games) {
  return Object.fromEntries(CHALLENGES.arcade.map((c) => [c.id, (c.record ?? c.total)(games)]));
}

// Où en sont les défis de la semaine de today (ou de week, finie : tous ses jours).
export function challengeStatus(state, today, week = weekOf(today)) {
  const keys = Array.from({ length: 7 }, (_, i) => addDays(week, i)).filter((k) => k <= today);
  const days = keys.map((k) => state.days?.[k] ?? {});
  const rec = state.challenges?.[week] ?? {};
  const base = rec.base ?? gameBase(state.games);
  const done = new Set(Array.isArray(rec.done) ? rec.done : []);
  const list = weekChallenges(week).map((c) => {
    let have, n, text, label;
    if (c.record) {
      const b = Number(base[c.id]) || 0, now = c.record(state.games);
      [have, n, text] = [now > b ? 1 : 0, 1, b ? c.text(b) : c.first];
      label = now > b ? `Nouveau record : ${fmt(now)}` : b ? `À battre : ${fmt(b)}` : 'Pas encore joué';
    } else if (c.total) {
      [have, n, text] = [Math.max(0, c.total(state.games) - (Number(base[c.id]) || 0)), c.n, c.text];
    } else {
      [have, n, text] = [c.count(days), c.n, c.text];
    }
    const ok = done.has(c.id) || have >= n;
    const shown = ok ? n : Math.min(have, n);
    return { id: c.id, icon: c.icon, text, n, have: shown, done: ok, pct: shown / n, label: ok ? 'Réussi' : label ?? `${shown} / ${n}` };
  });
  return { week, list, left: 7 - keys.length + 1, won: list.filter((c) => c.done).length };
}

// À enregistrer : la base de la semaine (la première fois), les défis qui
// viennent d'être réussis (cette semaine, et la semaine d'avant si Cap n'a pas
// été ouvert à temps : sans l'arcade, dont les records ont pu bouger depuis).
// Renvoie un nouvel objet challenges, ou null si rien ne change.
export function updateChallenges(state, today) {
  const all = state.challenges && typeof state.challenges === 'object' ? state.challenges : {};
  const week = weekOf(today), prev = addDays(week, -7);
  const next = { ...all };
  let changed = false;
  const record = (w, ids) => {
    const rec = next[w] ?? {};
    const done = Array.isArray(rec.done) ? rec.done : [];
    const fresh = ids.filter((id) => !done.includes(id));
    if (fresh.length) {
      next[w] = { ...rec, done: [...done, ...fresh] };
      changed = true;
    }
  };
  if (!next[week]?.base) {
    next[week] = { ...next[week], base: gameBase(state.games) };
    changed = true;
  }
  record(week, challengeStatus({ ...state, challenges: next }, today).list.filter((c) => c.done).map((c) => c.id));
  if (next[prev]) {
    const arcade = new Set(CHALLENGES.arcade.map((c) => c.id));
    record(prev, challengeStatus({ ...state, challenges: next }, addDays(prev, 6), prev).list.filter((c) => c.done && !arcade.has(c.id)).map((c) => c.id));
  }
  return changed ? next : null;
}

// Les défis réussis cette semaine qu'on ne t'a pas encore annoncés, et si ce
// sont les trois.
export function challengeNews(state, today) {
  const rec = state.challenges?.[weekOf(today)] ?? {};
  const told = new Set(Array.isArray(rec.told) ? rec.told : []);
  const done = Array.isArray(rec.done) ? rec.done : [];
  const status = challengeStatus(state, today);
  return { fresh: status.list.filter((c) => done.includes(c.id) && !told.has(c.id)), all: status.won === 3 };
}
