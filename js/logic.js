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
// Chaque jour garde la liste des habitudes actives ce jour-là (day.ids) : modifier
// la liste plus tard ne réécrit pas l'historique.
export function dayStatus(state, key) {
  const day = state.days[key];
  const ids = day?.ids ?? state.habits.map((h) => h.id);
  if (!ids.length) return { valid: false, full: false, done: 0, total: 0 };
  let done = 0;
  let full = 0;
  for (const id of ids) {
    const lvl = day?.habits?.[id] ?? 0;
    if (lvl >= 1) done++;
    if (lvl >= 2) full++;
  }
  return {
    valid: done === ids.length,
    full: full === ids.length,
    done,
    total: ids.length,
  };
}

// Règle « jamais deux fois de suite » : un jour raté isolé ne casse pas la
// chaîne (une « reprise »), deux jours ratés consécutifs la cassent, et une
// seule reprise est permise par fenêtre de 7 jours (sinon un jour sur deux
// suffirait). Aujourd'hui, tant qu'il n'est pas validé, est « en cours ».
export const JOKER_WINDOW = 7;

function missedSince(state, from, to) {
  // y a-t-il un jour raté (après le départ) dans [from, to] ?
  const start = state.settings.startDate;
  for (let k = from; diffDays(k, to) >= 0; k = addDays(k, 1)) {
    if (diffDays(start, k) >= 0 && !dayStatus(state, k).valid) return true;
  }
  return false;
}

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
    const isolated = diffDays(start, older) >= 0 && isValid(older);
    const recentMiss = missedSince(state, addDays(d, -(JOKER_WINDOW - 1)), older);
    if (isolated && !recentMiss) {
      jokers++;
      d = older;
      continue;
    }
    break;
  }
  return { count, jokers };
}

// Mode reprise : hier raté et aujourd'hui pas encore validé.
// twoMissed : avant-hier aussi raté. jokerUsed : une autre reprise a déjà servi
// dans les 7 derniers jours, donc la chaîne repart de zéro aujourd'hui.
export function recoveryMode(state, today) {
  const start = state.settings.startDate;
  const y = addDays(today, -1);
  if (!start || diffDays(start, y) < 0) return { active: false };
  const todayValid = dayStatus(state, today).valid;
  const yMissed = !dayStatus(state, y).valid;
  if (!yMissed || todayValid) return { active: false };
  const before = addDays(y, -1);
  const twoMissed = diffDays(start, before) >= 0 && !dayStatus(state, before).valid;
  const jokerUsed = !twoMissed && missedSince(state, addDays(y, -(JOKER_WINDOW - 1)), before);
  return { active: true, twoMissed, jokerUsed };
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

// Dernière valeur notée d'un champ numérique (ex. le poids), ou null.
export function lastValue(state, field) {
  for (const k of Object.keys(state.days).sort().reverse()) {
    const v = Number(state.days[k]?.[field]);
    if (v > 0) return v;
  }
  return null;
}

// ---------- Calories d'une séance (estimation) ----------
// Formule standard : kcal par minute = MET × 3,5 × poids (kg) / 200.
// MET = intensité de l'effort (Compendium des activités physiques, 2024) :
// celui de la séance pendant les efforts, plus bas pendant l'échauffement et
// les pauses. Estimation à ±20 % : un ordre de grandeur, pas une mesure.
export const STEP_MET = { prep: 1.5, warm: 3.5, rest: 2 };
export const DEFAULT_WEIGHT = 70;

export function sessionKcal(steps, met, kg = DEFAULT_WEIGHT) {
  const kcal = steps.reduce((t, x) => t + (x.secs / 60) * (x.kind === 'work' ? met : STEP_MET[x.kind] ?? 2) * 3.5 * kg / 200, 0);
  return Math.round(kcal / 5) * 5;
}

// ---------- Points (XP) et niveaux ----------
// L'XP est recalculée à partir des données, jamais stockée : impossible de la
// compter deux fois, et elle suit automatiquement les corrections.
export const XP = { min: 10, full: 20, dayValid: 20, workout: 30, focus: 15, urge: 5, snackResisted: 5, lesson: 40, perfect: 20, trade: 15, book: 50, card: 2 };

export const RANKS = ['Recrue', 'Apprenti', 'Régulier', 'Solide', 'Discipliné', 'Méthodique', 'Inarrêtable', 'Maître de soi'];

export function totalXP(state) {
  let xp = 0;
  for (const [key, d] of Object.entries(state.days)) {
    for (const lvl of Object.values(d.habits ?? {})) xp += lvl === 2 ? XP.full : lvl === 1 ? XP.min : 0;
    if (dayStatus(state, key).valid) xp += XP.dayValid;
    xp += (d.workouts?.length ?? 0) * XP.workout;
    xp += (d.focus ?? 0) * XP.focus;
    xp += (d.urges ?? 0) * XP.urge;
    xp += (d.snackResisted ?? 0) * XP.snackResisted;
    xp += (d.cardsOk ?? 0) * XP.card;
  }
  for (const l of Object.values(state.lessons ?? {})) xp += XP.lesson + (l.perfect ? XP.perfect : 0);
  xp += (state.trades ?? []).filter((t) => t.exit !== undefined && t.exit !== null).length * XP.trade;
  xp += Object.values(state.books ?? {}).filter((b) => b.status === 'done').length * XP.book;
  return xp;
}

// Niveau n atteint à 100 × n × (n − 1) / 2 XP : 0, 100, 300, 600, 1000…
export function levelInfo(xp) {
  let level = 1;
  while (100 * ((level + 1) * level) / 2 <= xp) level++;
  const floor = (100 * level * (level - 1)) / 2;
  const next = (100 * (level + 1) * level) / 2;
  return {
    level,
    rank: RANKS[Math.min(Math.floor((level - 1) / 2), RANKS.length - 1)],
    into: xp - floor,
    span: next - floor,
  };
}

// ---------- Finance ----------
export function compound(monthly, annualRate, years, initial = 0) {
  const r = annualRate / 100 / 12;
  const n = Math.round(years * 12);
  const growth = (1 + r) ** n;
  const value = r === 0 ? initial + monthly * n : initial * growth + monthly * ((growth - 1) / r);
  const invested = initial + monthly * n;
  return { value, invested, gains: value - invested };
}

export function positionSize(capital, riskPct, entry, stop) {
  const perShare = Math.abs(entry - stop);
  if (!capital || !riskPct || !perShare) return null;
  const risk = (capital * riskPct) / 100;
  const shares = risk / perShare;
  return { risk, perShare, shares, exposure: shares * entry, exposurePct: ((shares * entry) / capital) * 100 };
}

// R d'un trade clôturé : gain ou perte divisé par le risque initial.
export function tradeR(t) {
  const risk = Math.abs(t.entry - t.stop);
  if (!risk || t.exit === undefined || t.exit === null) return null;
  const dir = t.side === 'short' ? -1 : 1;
  return ((t.exit - t.entry) * dir) / risk;
}

export function tradeStats(trades) {
  const closed = trades.filter((t) => tradeR(t) !== null);
  const rs = closed.map(tradeR);
  const wins = rs.filter((r) => r > 0);
  const losses = rs.filter((r) => r <= 0);
  const pnl = closed.reduce((s, t) => s + (t.exit - t.entry) * (t.side === 'short' ? -1 : 1) * t.qty, 0);
  const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  return {
    count: closed.length,
    open: trades.length - closed.length,
    winRate: closed.length ? wins.length / closed.length : 0,
    avgWin: avg(wins),
    avgLoss: avg(losses),
    expectancy: avg(rs),
    pnl,
    followed: closed.length ? closed.filter((t) => t.followed).length / closed.length : 0,
  };
}

// ---------- Programme de 12 semaines ----------
// Coucher cible de la semaine : 1 h 15 en semaine 1, puis 15 min plus tôt
// chaque semaine, jusqu'à la cible finale (23 h 30 par défaut).
export function weekNumber(state, today) {
  return Math.floor(Math.max(0, diffDays(state.settings.startDate, today)) / 7) + 1;
}

export function weeklyBedtime(week, finalTarget = '23:30', start = '01:15') {
  const s = bedtimeMinutes(start);
  const f = bedtimeMinutes(finalTarget);
  return minutesToHHMM(Math.max(f, s - (week - 1) * 15));
}

// Le 3e jour de chaque sprint est un « jour minimum » prévu.
export function isPlannedMinimumDay(state, today) {
  return diffDays(state.settings.startDate, today) % 7 === 2;
}

// Message du jour sous la chaîne, par ordre de priorité :
// 'restart' (2e raté de la semaine), 'twoMissed', 'recovery', 'full', 'valid',
// 'minimumDay', ou null s'il n'y a rien à dire.
export function todayNotice(state, today) {
  const rec = recoveryMode(state, today);
  if (rec.jokerUsed) return 'restart';
  if (rec.twoMissed) return 'twoMissed';
  if (rec.active) return 'recovery';
  const st = dayStatus(state, today);
  if (st.valid) return st.full ? 'full' : 'valid';
  if (isPlannedMinimumDay(state, today)) return 'minimumDay';
  return null;
}

// ---------- Trading : ratio, courbe, poches ----------
export function rewardRisk(t) {
  const risk = Math.abs(t.entry - t.stop);
  if (!risk || !t.target) return null;
  return Math.abs(t.target - t.entry) / risk;
}

export function equityCurve(trades) {
  let sum = 0;
  return trades
    .filter((t) => tradeR(t) !== null)
    .sort((a, b) => String(a.closed).localeCompare(String(b.closed)))
    .map((t) => (sum += tradeR(t)));
}

// Pertes consécutives sur les derniers trades clôturés le même jour.
export function lossesToday(trades, todayIso) {
  const closedToday = trades
    .filter((t) => tradeR(t) !== null && String(t.closed).slice(0, 10) === todayIso)
    .sort((a, b) => String(a.closed).localeCompare(String(b.closed)));
  let n = 0;
  for (let i = closedToday.length - 1; i >= 0 && tradeR(closedToday[i]) <= 0; i--) n++;
  return n;
}

export function allocation(pockets) {
  const total = pockets.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  return {
    total,
    parts: pockets.map((p) => ({ ...p, pct: total ? ((Number(p.amount) || 0) / total) * 100 : 0 })),
  };
}

// ---------- Révision espacée (boîtes de Leitner) ----------
// Une carte réussie passe dans la boîte suivante et revient de plus en plus
// tard ; une carte ratée retourne en boîte 0 et revient le jour même.
export const SRS_INTERVALS = [0, 1, 3, 7, 14, 30, 60, 120];

export function dueCards(cards, today) {
  return cards.filter((c) => !c.due || diffDays(c.due, today) >= 0);
}

export function reviewCard(card, ok, today) {
  const box = ok ? Math.min((card.box ?? 0) + 1, SRS_INTERVALS.length - 1) : 0;
  return { ...card, box, due: addDays(today, SRS_INTERVALS[box]), seen: (card.seen ?? 0) + 1 };
}

// ---------- Régularité sportive ----------
// Semaine du lundi au dimanche ; une semaine est « tenue » si elle compte
// au moins `goal` séances hors mobilité.
export function mondayOf(key) {
  return addDays(key, -((fromKey(key).getDay() + 6) % 7));
}

export function sportWeeks(state, today, goal = 4) {
  const count = (monday) => {
    let n = 0;
    for (let i = 0; i < 7; i++) n += (state.days[addDays(monday, i)]?.workouts ?? []).filter((w) => w !== 'M').length;
    return n;
  };
  const thisMonday = mondayOf(today);
  const thisWeek = count(thisMonday);
  let streak = thisWeek >= goal ? 1 : 0;
  for (let m = addDays(thisMonday, -7); diffDays(state.settings.startDate, addDays(m, 6)) >= 0; m = addDays(m, -7)) {
    if (count(m) >= goal) streak++;
    else break;
  }
  return { thisWeek, goal, streak };
}

// ---------- Calendrier de régularité ----------
// Une colonne par semaine du programme (sprint), une case par jour :
// 'full' (tout en complet), 'min' (journée validée), 'miss' (ratée),
// 'now' (aujourd'hui, pas encore validé), 'future'. `sport` : séance A, B ou C.
export function regularityGrid(state, today, weeks = SPRINT_COUNT) {
  const start = state.settings.startDate;
  const total = Math.max(weeks, Math.floor(Math.max(0, diffDays(start, today)) / SPRINT_LENGTH) + 1);
  let valid = 0;
  let full = 0;
  let elapsed = 0;
  let run = 0;
  let best = 0;
  const cols = [];
  for (let w = 0; w < total; w++) {
    const days = [];
    for (let i = 0; i < SPRINT_LENGTH; i++) {
      const key = addDays(start, w * SPRINT_LENGTH + i);
      const st = dayStatus(state, key);
      const ahead = diffDays(today, key);
      let level = 'future';
      if (ahead <= 0) {
        level = st.full ? 'full' : st.valid ? 'min' : ahead === 0 ? 'now' : 'miss';
        if (ahead < 0 || st.valid) elapsed++;
        if (st.valid) valid++;
        if (st.full) full++;
        run = st.valid ? run + 1 : ahead === 0 ? run : 0;
        best = Math.max(best, run);
      }
      const sport = (state.days[key]?.workouts ?? []).some((x) => x !== 'M');
      days.push({ key, level, today: ahead === 0, sport });
    }
    const passed = days.filter((d) => d.level === 'min' || d.level === 'full').length >= SPRINT_PASS;
    cols.push({ number: w + 1, days, passed, finished: diffDays(days[SPRINT_LENGTH - 1].key, today) > 0 });
  }
  return { weeks: cols, valid, full, elapsed, best };
}

// ---------- Livres ----------
// Étagères par catégorie. Ordre dans une étagère : en cours, puis ⭐ (par où
// commencer), puis à lire, puis lus. filter : 'all' | 'todo' | 'reading' | 'done'.
export function bookShelves(books, statuses = {}, filter = 'all') {
  const status = (b) => statuses[b.id]?.status ?? 'todo';
  const rank = (b) => ({ reading: 0, todo: b.start ? 1 : 2, done: 3 }[status(b)]);
  const keep = (b) => filter === 'all' || status(b) === filter;
  const counts = { all: books.length, todo: 0, reading: 0, done: 0 };
  for (const b of books) counts[status(b)]++;
  const cats = [...new Set(books.map((b) => b.cat))];
  const shelves = cats
    .map((cat) => {
      const all = books.filter((b) => b.cat === cat);
      const items = all.filter(keep).map((b, i) => ({ ...b, status: status(b), order: i })).sort((a, b) => rank(a) - rank(b) || a.order - b.order);
      return { cat, items, done: all.filter((b) => status(b) === 'done').length, total: all.length };
    })
    .filter((sh) => sh.items.length);
  return { counts, reading: books.filter((b) => status(b) === 'reading'), shelves };
}

// ---------- Grignotage ----------
// Déclencheurs notés sur les `days` derniers jours, du plus fréquent au moins fréquent.
export function snackTriggers(state, today, days = 14) {
  const count = {};
  for (let i = 0; i < days; i++) {
    for (const s of state.days[addDays(today, -i)]?.snacks ?? []) count[s.trigger] = (count[s.trigger] ?? 0) + 1;
  }
  return Object.entries(count).sort((a, b) => b[1] - a[1]);
}

// ---------- Animations ----------
// Mémoire du dernier affichage (une Map gardée en mémoire, jamais stockée) :
// sert à n'animer que ce qui vient de changer.
export function increased(memo, key, value) {
  const prev = memo.get(key);
  memo.set(key, value);
  return prev !== undefined && value > prev;
}

// Valeur affichée la fois précédente (ou `initial` la première fois) : point
// de départ d'une barre ou d'un anneau qui glisse vers la nouvelle valeur.
export function previous(memo, key, value, initial = value) {
  const prev = memo.has(key) ? memo.get(key) : initial;
  memo.set(key, value);
  return prev;
}

// ---------- Plan du jour : « Maintenant » ----------
// La prochaine chose à faire : la première pas encore faite, dans l'ordre du
// plan. Exception : de 1 h avant le coucher visé jusqu'à 3 h après, poser le
// téléphone (id 'coucher') passe devant tout, sans dépasser le changement de
// jour (4 h) : après, c'est déjà le plan du lendemain. now et bed : « HH:MM ».
// Renvoie null quand tout est fait.
export function nextAction(items, now, bed) {
  const open = items.filter((x) => !x.done);
  if (!open.length) return null;
  // Minutes écoulées depuis le début de la journée de l'appli (4 h = 0).
  const inDay = (t) => { const [h, m] = t.split(':').map(Number); return (((h - DAY_ROLLOVER_HOUR) * 60 + m) % 1440 + 1440) % 1440; };
  const bedItem = open.find((x) => x.id === 'coucher');
  if (bedItem && now && bed) {
    const n = inDay(now);
    const b = inDay(bed);
    if (n >= b - 60 && n <= b + 180) return bedItem;
  }
  return open[0];
}

// ---------- Habitudes retirées ----------
// « Téléphone hors du lit » et « Focus » ne comptent plus pour valider la
// journée (demande de l'utilisateur : physique, apprentissage, lecture).
// Retrait une seule fois (marqueur settings.habitsRetired) : les jours passés
// gardent leur liste figée (d.ids), donc la chaîne et l'historique ne bougent
// pas ; seule la journée en cours suit la nouvelle liste. Renvoie true si la
// liste a changé.
export const RETIRED_HABITS = ['sommeil', 'focus'];

export function retireHabits(state, today) {
  if (state.settings.habitsRetired) return false;
  state.settings.habitsRetired = true;
  const before = state.habits.length;
  for (const [key, d] of Object.entries(state.days)) if (key !== today) d.ids ??= state.habits.map((h) => h.id);
  state.habits = state.habits.filter((h) => !RETIRED_HABITS.includes(h.id));
  if (state.days[today]) state.days[today].ids = state.habits.map((h) => h.id);
  return state.habits.length !== before;
}
