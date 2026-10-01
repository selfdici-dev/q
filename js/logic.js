// Logique pure (sans DOM) : dates, validation des journées, chaîne, sprints.
// Testée par tests/logic.test.js (node --test).

// La journée « logique » se termine à 4 h : un coucher à 1 h compte pour la veille.
export const DAY_ROLLOVER_HOUR = 4;

export function pad(n) {
  return String(n).padStart(2, '0');
}

export function toKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12); // midi : évite les pièges de l'heure d'été
}

export function todayKey(now = new Date()) {
  const d = new Date(now.getTime() - DAY_ROLLOVER_HOUR * 3600 * 1000);
  return toKey(d);
}

export function addDays(key, n) {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

export function diffDays(a, b) {
  // nombre de jours de a vers b (b - a)
  return Math.round((fromKey(b) - fromKey(a)) / 86400000);
}

// Niveau d'une habitude : 0 = rien, 1 = minimum, 2 = complet.
export function dayStatus(state, key) {
  const day = state.days[key];
  const habits = state.habits;
  if (!habits.length) return { valid: false, full: false, done: 0, total: 0 };
  let done = 0;
  let full = 0;
  for (const h of habits) {
    const lvl = day?.habits?.[h.id] ?? 0;
    if (lvl >= 1) done++;
    if (lvl >= 2) full++;
  }
  return {
    valid: done === habits.length,
    full: full === habits.length,
    done,
    total: habits.length,
  };
}

// Règle « jamais deux fois de suite » : un jour raté isolé ne casse pas la
// chaîne, deux jours ratés consécutifs la cassent. Aujourd'hui, tant qu'il
// n'est pas validé, est « en cours » et ne compte ni pour ni contre.
export function chain(state, today) {
  const start = state.settings.startDate;
  const isValid = (k) => dayStatus(state, k).valid;
  let d = isValid(today) ? today : addDays(today, -1);
  let count = 0;
  let jokers = 0;
  while (start && diffDays(start, d) >= 0) {
    if (isValid(d)) {
      count++;
      d = addDays(d, -1);
      continue;
    }
    const older = addDays(d, -1);
    if (diffDays(start, older) >= 0 && isValid(older)) {
      jokers++;
      d = older;
      continue;
    }
    break;
  }
  return { count, jokers };
}

// Mode reprise : hier raté (et pas le jour de démarrage) et aujourd'hui pas encore validé.
export function recoveryMode(state, today) {
  const start = state.settings.startDate;
  const y = addDays(today, -1);
  if (!start || diffDays(start, y) < 0) return { active: false };
  const yMissed = !dayStatus(state, y).valid;
  const twoMissed = yMissed && diffDays(start, addDays(y, -1)) >= 0 && !dayStatus(state, addDays(y, -1)).valid;
  const todayValid = dayStatus(state, today).valid;
  return { active: yMissed && !todayValid, twoMissed: twoMissed && !todayValid };
}

export function lastNDays(state, today, n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const k = addDays(today, -i);
    out.push({ key: k, ...dayStatus(state, k), beforeStart: diffDays(state.settings.startDate, k) < 0 });
  }
  return out;
}

// Sprints de 7 jours à partir de la date de départ. Réussi si >= 5/7 jours validés.
export const SPRINT_LENGTH = 7;
export const SPRINT_PASS = 5;
export const SPRINT_COUNT = 12;

export function sprintInfo(state, today) {
  const start = state.settings.startDate;
  const elapsed = Math.max(0, diffDays(start, today));
  const index = Math.floor(elapsed / SPRINT_LENGTH); // 0-based
  const sprints = [];
  for (let s = 0; s < Math.max(SPRINT_COUNT, index + 1); s++) {
    const first = addDays(start, s * SPRINT_LENGTH);
    const days = [];
    let valid = 0;
    for (let i = 0; i < SPRINT_LENGTH; i++) {
      const k = addDays(first, i);
      const st = dayStatus(state, k);
      const future = diffDays(today, k) > 0;
      if (st.valid) valid++;
      days.push({ key: k, valid: st.valid, future, today: k === today });
    }
    const finished = diffDays(addDays(first, SPRINT_LENGTH - 1), today) > 0;
    sprints.push({
      number: s + 1,
      first,
      days,
      valid,
      finished,
      passed: valid >= SPRINT_PASS,
      current: s === index,
    });
  }
  return { index, sprints, current: sprints[index] };
}

// Heure "HH:MM" -> minutes depuis 12 h la veille (pour tracer un coucher à 1 h après 23 h).
export function bedtimeMinutes(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  let mins = h * 60 + m;
  if (h < 12) mins += 24 * 60;
  return mins - 12 * 60;
}

export function minutesToHHMM(mins) {
  const t = ((Math.round(mins) + 12 * 60) % (24 * 60) + 24 * 60) % (24 * 60);
  return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
}

export function sleepDuration(bed, wake) {
  if (!bed || !wake) return null;
  const [bh, bm] = bed.split(':').map(Number);
  const [wh, wm] = wake.split(':').map(Number);
  let d = wh * 60 + wm - (bh * 60 + bm);
  if (d <= 0) d += 24 * 60;
  return d;
}

// Moyenne glissante sur 7 jours calendaires (ignore les jours sans mesure).
export function rollingAverage(points, windowDays = 7) {
  return points.map((p) => {
    const inWin = points.filter((q) => {
      const dd = diffDays(q.key, p.key);
      return dd >= 0 && dd < windowDays;
    });
    const avg = inWin.reduce((s, q) => s + q.value, 0) / inWin.length;
    return { key: p.key, value: Math.round(avg * 10) / 10 };
  });
}

export function series(state, field, today, n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const k = addDays(today, -i);
    const v = state.days[k]?.[field];
    if (v !== undefined && v !== null && v !== '') out.push({ key: k, value: v });
  }
  return out;
}
