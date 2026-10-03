import {
  todayKey, addDays, diffDays, fromKey, dayStatus, chain, lastNDays,
  sprintInfo, bedtimeMinutes, minutesToHHMM, sleepDuration, rollingAverage, series,
  SPRINT_COUNT, SPRINT_PASS, SPRINT_LENGTH, totalXP, levelInfo, weekNumber, weeklyBedtime, todayNotice,
  dueCards, reviewCard, sportWeeks,
} from './logic.js';
import {
  DEFAULT_HABITS, DEFAULT_RULES, WORKOUTS, WEEK_PLAN, SNACK_TRIGGERS, FOOD_RULES, RECIPES, demoUrl,
  WARMUP, PROTEIN_TARGET, PROTEIN_EXAMPLES, PHASES, MILESTONES, BOOKS, APPS,
} from './data.js';
import { ALL_LESSONS } from './finance-data.js';
import { lineChart, barChart, wireTooltips } from './charts.js';
import { createMoney, DEFAULT_CALC, DEFAULT_WEALTH } from './money.js';
import { quoteOfDay } from './quotes.js';
import { daySummary, weekSummary } from './summary.js';
import { backupStatus, validateBackup } from './backup.js';

const STORE = 'cap-v1';
const POMO_WORK = 25 * 60;
const POMO_BREAK = 5 * 60;
const URGE_DELAY = 10 * 60;
const MAX_IMPORT = 20 * 1024 * 1024; // une sauvegarde Cap pèse quelques centaines de Ko

// ---------- état ----------

function freshState() {
  return {
    version: 1,
    settings: {
      startDate: todayKey(),
      bedtimeTarget: '23:30',
      screenTarget: 180,
      weightTarget: 70,
      level: 1,
      lastExport: null,
      theme: 'dark',
    },
    habits: structuredClone(DEFAULT_HABITS),
    rules: [...DEFAULT_RULES],
    days: {},
    reviews: {},
    tests: [],
    lessons: {},
    trades: [],
    calc: { ...DEFAULT_CALC },
    wealth: structuredClone(DEFAULT_WEALTH),
    books: {},
    setup: {},
    feels: [],
    srs: {},
    myCards: [],
    ui: { moneyTab: 'parcours', meTab: 'programme', lesson: null, lastLevel: 1 },
    timers: { pomo: { mode: 'work', endAt: null, remaining: POMO_WORK, label: '' }, urge: { endAt: null } },
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return freshState();
    const s = JSON.parse(raw);
    const base = freshState();
    const st = {
      ...base, ...s,
      settings: { ...base.settings, ...s.settings },
      timers: { ...base.timers, ...s.timers },
      calc: { ...base.calc, ...s.calc },
      wealth: { ...base.wealth, ...s.wealth },
      ui: { ...base.ui, ...s.ui, lesson: null },
    };
    // Données d'avant la v2 : on fige la liste d'habitudes des jours passés.
    const ids = st.habits.map((h) => h.id);
    for (const d of Object.values(st.days)) d.ids ??= ids;
    return st;
  } catch {
    return freshState();
  }
}

let state = load();

function applyTheme() {
  const t = state.settings.theme;
  if (t === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
  const dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#000000' : '#f6f7f4');
}
applyTheme();
const save = () => {
  try {
    localStorage.setItem(STORE, JSON.stringify(state));
  } catch {
    toast('Sauvegarde impossible : exporte tes données.');
  }
};

function day(key) {
  if (!state.days[key]) state.days[key] = { habits: {} };
  const d = state.days[key];
  if (!d.habits) d.habits = {};
  // La liste d'habitudes du jour est figée ; celle d'aujourd'hui suit les réglages.
  if (!d.ids || key === todayKey()) d.ids = state.habits.map((h) => h.id);
  return d;
}

// Ne fait que monter le niveau d'une habitude (jamais descendre automatiquement).
function raiseHabit(key, id, level) {
  if (!state.habits.some((h) => h.id === id)) return;
  const d = day(key);
  if ((d.habits[id] ?? 0) < level) d.habits[id] = level;
}

// ---------- utilitaires ----------

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtClock = (secs) => `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(Math.floor(secs % 60)).padStart(2, '0')}`;
const fmtDuration = (mins) => `${Math.floor(mins / 60)} h ${String(Math.round(mins % 60)).padStart(2, '0')}`;
const longDate = (key) => fromKey(key).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

function toast(msg, ms = 3200) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.h);
  toast.h = setTimeout(() => (t.hidden = true), ms);
}

function celebrate(msg) {
  toast(msg);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = document.createElement('div');
  box.className = 'confetti';
  const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];
  for (let i = 0; i < 40; i++) {
    const c = document.createElement('i');
    c.style.left = `${Math.random() * 100}%`;
    c.style.background = colors[i % colors.length];
    c.style.animationDelay = `${Math.random() * 0.3}s`;
    c.style.setProperty('--dx', `${(Math.random() - 0.5) * 160}px`);
    c.style.setProperty('--rot', `${Math.random() * 720}deg`);
    box.appendChild(c);
  }
  document.body.appendChild(box);
  navigator.vibrate?.([30, 40, 30]);
  setTimeout(() => box.remove(), 2200);
}

// Copie dans le presse-papiers (rien ne sort de l'appareil). Si le navigateur
// refuse, le texte s'affiche dans une fenêtre, déjà sélectionné.
async function copyText(text, btn, okMsg) {
  try {
    await navigator.clipboard.writeText(text);
    toast(okMsg);
    navigator.vibrate?.(15);
    if (btn?.isConnected) {
      const label = btn.innerHTML;
      btn.classList.add('copied');
      btn.textContent = '✓ Copié';
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = label;
      }, 1800);
    }
  } catch {
    showSheet(text);
  }
}

function showSheet(text) {
  const el = $('#sheet');
  el.innerHTML = `<div class="sheet-back" data-act="sheet-close"></div>
    <div class="sheet-panel" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
      <div class="card-head"><h2 id="sheet-title">Texte à copier</h2><button class="btn ghost small" data-act="sheet-close">Fermer</button></div>
      <p class="hint">La copie automatique n’a pas marché : appuie longuement dans le texte, puis « Tout sélectionner » et « Copier ».</p>
      <textarea readonly rows="12">${esc(text)}</textarea>
    </div>`;
  el.hidden = false;
  const ta = $('textarea', el);
  ta.focus();
  ta.select();
}

let audioCtx;
function tone(freq, secs, vol = 0.18) {
  try {
    audioCtx ??= new AudioContext();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.frequency.value = freq;
    o.connect(g).connect(audioCtx.destination);
    const t0 = audioCtx.currentTime;
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + secs);
    o.start(t0);
    o.stop(t0 + secs + 0.02);
  } catch { /* son indisponible */ }
}

function beep(times = 1) {
  try {
    audioCtx ??= new AudioContext();
    for (let i = 0; i < times; i++) {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.frequency.value = 880;
      o.connect(g).connect(audioCtx.destination);
      const t0 = audioCtx.currentTime + i * 0.35;
      g.gain.setValueAtTime(0.25, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.25);
      o.start(t0);
      o.stop(t0 + 0.26);
    }
  } catch { /* son indisponible */ }
  navigator.vibrate?.(times > 1 ? [200, 100, 200] : 200);
}

let wakeLock = null;
async function keepAwake(on) {
  try {
    if (on && !wakeLock && 'wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
    if (!on && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch { /* non supporté */ }
}

// ---------- vues ----------

const money = createMoney({
  get state() { return state; },
  save: () => save(),
  render: () => render(),
  toast: (m) => toast(m),
  celebrate: (m) => celebrate(m),
  raiseHabit: (k, id, l) => raiseHabit(k, id, l),
  todayKey,
  esc,
});

function ring(done, total) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const f = total ? done / total : 0;
  return `<svg class="ring" viewBox="0 0 72 72" aria-hidden="true">
    <circle cx="36" cy="36" r="${r}" class="ring-bg"/>
    <circle cx="36" cy="36" r="${r}" class="ring-fg" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - f)}"/>
  </svg><span class="ring-txt">${done}/${total}</span>`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 4 || h >= 22) return 'Il est tard. Téléphone hors de la chambre ?';
  if (h < 12) return 'Bonjour. Les minimums d’abord.';
  if (h < 18) return 'Bon après-midi. Où en es-tu ?';
  return 'Bonsoir. Dernière ligne droite.';
}

const TABS = [
  { id: 'jour', label: 'Jour', icon: '☀️' },
  { id: 'focus', label: 'Focus', icon: '🎯' },
  { id: 'sport', label: 'Corps', icon: '💪' },
  { id: 'argent', label: 'Argent', icon: '💶' },
  { id: 'suivi', label: 'Suivi', icon: '📊' },
  { id: 'moi', label: 'Moi', icon: '🧭' },
];

function currentTab() {
  const h = location.hash.slice(1) === 'bilan' ? 'moi' : location.hash.slice(1);
  return TABS.some((t) => t.id === h) || h === 'revision' ? h : 'jour';
}

function render() {
  const tab = currentTab();
  const views = { jour: viewToday, focus: viewFocus, sport: viewSport, argent: money.view, suivi: viewTrack, moi: viewMe, revision: viewRevision };
  const heads = {
    focus: ['Focus', 'Une seule chose à la fois'],
    sport: ['Corps', 'Séance du jour, régularité, alimentation'],
    argent: ['Argent', 'Apprendre, protéger, puis trader'],
    suivi: ['Suivi', 'Ce qui se mesure progresse'],
    moi: ['Moi', 'Programme, bilan, livres, réglages'],
    revision: ['Révisions', 'Chaque carte revient juste avant l’oubli'],
  };
  const h = heads[tab];
  const head = h && !(tab === 'argent' && state.ui.lesson) ? `<header class="page-head"><h1>${h[0]}</h1><p>${h[1]}</p></header>` : '';
  $('#view').innerHTML = head + views[tab]();
  $('#view').dataset.tab = tab;
  const lv = levelInfo(totalXP(state));
  if (lv.level > (state.ui.lastLevel ?? 1)) {
    state.ui.lastLevel = lv.level;
    save();
    celebrate(`Niveau ${lv.level} atteint : ${lv.rank}`);
  }
  document.querySelectorAll('#tabs a').forEach((a) => a.setAttribute('aria-current', a.dataset.tab === tab ? 'page' : 'false'));
  if (tab === 'suivi') wireTooltips($('#view'));
  tick();
}

function dots(days) {
  return `<div class="dots">${days.map((d) => {
    const cls = d.beforeStart || d.future ? 'pre' : d.valid ? 'ok' : d.today ? 'now' : 'miss';
    const label = new Date(fromKey(d.key)).toLocaleDateString('fr-FR', { weekday: 'narrow' });
    return `<span class="dot-day ${cls}" title="${d.key}"><b>${d.valid ? '✓' : ''}</b><small>${label}</small></span>`;
  }).join('')}</div>`;
}

// Message du jour, affiché dans la carte de la chaîne.
const NOTICES = {
  restart: ['⚠️', 'Deuxième raté de la semaine.', 'Une seule reprise par semaine : la chaîne repart de zéro. Fais les minimums, sans culpabilité, et note dans le bilan ce qui t’a fait rater.'],
  twoMissed: ['🌱', 'Deux jours ratés.', 'Pas de rattrapage : seulement les minimums aujourd’hui. Une journée minimum vaut mieux qu’une journée parfaite qui n’existe pas.'],
  recovery: ['🔄', 'Jour de reprise.', 'Jamais deux fois de suite : fais les minimums, idéalement avant midi, et la chaîne continue.'],
  minimumDay: ['🪫', 'Jour minimum prévu.', '3ᵉ jour du sprint, celui où l’enthousiasme retombe : seuls les minimums comptent, c’est voulu.'],
  valid: ['✅', 'Journée validée.', 'Les minimums sont faits. Le complet est un bonus, pas une obligation.'],
  full: ['🏆', 'Tout en complet.', 'Bravo. Maintenant, repose-toi.'],
};

// Sections repliées de l'onglet Jour. Celles que tu ouvres restent ouvertes
// d'un affichage à l'autre (mémoire de l'écran seulement, rien n'est stocké).
const openFolds = new Set();

function fold(id, ico, title, sub, pill, body) {
  return `<details class="fold" data-fold="${id}" ${openFolds.has(id) ? 'open' : ''}>
    <summary><span class="fold-ico" aria-hidden="true">${ico}</span>
      <span class="fold-title"><strong>${title}</strong><small>${sub}</small></span>
      ${pill}<span class="chev" aria-hidden="true"></span></summary>
    <div class="fold-body">${body}</div>
  </details>`;
}

function viewToday() {
  const today = todayKey();
  const st = dayStatus(state, today);
  const ch = chain(state, today);
  const sp = sprintInfo(state, today);
  const d = state.days[today] ?? { habits: {} };
  const last7 = lastNDays(state, today, 7).map((x) => ({ ...x, today: x.key === today }));
  const sprintDay = Math.min(diffDays(sp.current.first, today) + 1, SPRINT_LENGTH);
  const notice = NOTICES[todayNotice(state, today)];
  const lv = levelInfo(totalXP(state));
  const q = quoteOfDay(today);
  const toDo = st.total - st.done;
  const prot = d.protein ?? 0;
  const snacks = d.snacks?.length ?? 0;
  const week = weekNumber(state, today);
  return `
  <header class="hero">
    <div class="hero-top">
      <div><p class="eyebrow">${esc(longDate(today))}</p><p class="greet">${greeting()}</p></div>
      <div class="ring-wrap ${st.valid ? 'done' : ''}">${ring(st.done, st.total)}</div>
    </div>
    <div class="hero-stats">
      <div><span class="big">🔥 ${ch.count}</span><span class="lbl">jour${ch.count > 1 ? 's' : ''} de chaîne${ch.jokers ? ` · ${ch.jokers} reprise${ch.jokers > 1 ? 's' : ''}` : ''}</span></div>
      <div><span class="big">🏁 ${sp.current.number}<small>/${SPRINT_COUNT}</small></span><span class="lbl">sprint · jour ${sprintDay}/7 · ${sp.current.valid} validé${sp.current.valid > 1 ? 's' : ''}</span></div>
    </div>
    <div class="level">
      <span class="badge">Niv. ${lv.level}</span><span class="rank">${lv.rank}</span><span class="xp">${lv.into}/${lv.span} XP</span>
      <div class="xpbar"><span style="width:${(lv.into / lv.span) * 100}%"></span></div>
    </div>
    ${dots(last7)}
    ${notice ? `<p class="hero-note"><span aria-hidden="true">${notice[0]}</span><span><strong>${notice[1]}</strong> ${notice[2]}</span></p>` : ''}
  </header>
  ${backupBanner(today)}
  ${planCard(today)}
  <div class="folds">
    ${fold('habits', '✅', 'Habitudes', toDo ? `${toDo} à faire · min ou complet` : 'Toutes faites', `<span class="pill ${toDo ? '' : 'ok'}">${st.done}/${st.total}</span>`, `
      <ul class="habits">
        ${state.habits.map((h) => {
          const lvl = d.habits?.[h.id] ?? 0;
          return `<li class="habit lvl-${lvl}">
            <span class="habit-ico" aria-hidden="true">${lvl ? '✓' : esc(h.emoji ?? '•')}</span>
            <div class="habit-text"><strong>${esc(h.name)}</strong>
              <span>${esc(lvl === 2 ? h.full : h.min)}</span></div>
            <div class="habit-btns">
              <button class="seg ${lvl === 1 ? 'on' : ''}" data-act="habit" data-id="${h.id}" data-lvl="1" aria-pressed="${lvl === 1}">Min</button>
              <button class="seg ${lvl === 2 ? 'on' : ''}" data-act="habit" data-id="${h.id}" data-lvl="2" aria-pressed="${lvl === 2}">Complet</button>
            </div></li>`;
        }).join('')}
      </ul>
      <details class="more"><summary>Ce que valent « Min » et « Complet »</summary>
        <ul class="tight">${state.habits.map((h) => `<li><strong>${esc(h.name)}</strong> · min : ${esc(h.min)} · complet : ${esc(h.full)}</li>`).join('')}</ul>
        <p class="hint">La journée est validée dès que tous les minimums sont faits.</p></details>`)}
    ${fold('food', '🍽️', 'Alimentation', `Protéines · ${snacks ? `${snacks} grignotage${snacks > 1 ? 's' : ''}` : 'aucun grignotage'}`, `<span class="pill ${prot >= PROTEIN_TARGET ? 'ok' : ''}">🍗 ${prot}/${PROTEIN_TARGET}</span>`, snackCard(today))}
    ${fold('night', '🌙', 'Nuit dernière', `Ce soir : couché à ${weeklyBedtime(week, state.settings.bedtimeTarget)}`, `<span class="pill">${d.bed && d.wake ? fmtDuration(sleepDuration(d.bed, d.wake)) : 'à noter'}</span>`, `
      <div class="grid2">
        <label>Couché à<input type="time" data-field="bed" data-key="${today}" value="${esc(d.bed ?? '')}"></label>
        <label>Levé à<input type="time" data-field="wake" data-key="${today}" value="${esc(d.wake ?? '')}"></label>
      </div>
      <p class="hint">Cible de la semaine ${week} : couché à <strong>${weeklyBedtime(week, state.settings.bedtimeTarget)}</strong>, levé à heure fixe. On avance de 15 min par semaine jusqu’à ${esc(state.settings.bedtimeTarget)}.</p>`)}
    ${fold('rules', '🧭', 'Mes règles', '« Si… alors… »', `<span class="pill">${state.rules.length}</span>`, `<ul class="rules">${state.rules.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
      <p class="hint">Modifie-les dans Moi > Réglages.</p>`)}
    ${fold('quote', '💬', 'Pensée du jour', esc(q.author), '<span></span>', `<blockquote class="quote"><p>« ${esc(q.text)} »</p><cite>${esc(q.author)}</cite></blockquote>`)}
  </div>`;
}

// Rappel de sauvegarde : visible seulement après 7 jours sans export.
function backupBanner(today) {
  const b = backupStatus(state, today);
  if (!b.overdue) return '';
  return `<div class="banner warn backup">
    <div><strong>💾 ${b.never ? `Aucune sauvegarde depuis ${b.days} jours` : `Dernière sauvegarde il y a ${b.days} jours`}</strong>
    <span>Un appui : le fichier reste sur ton téléphone, rien n’est envoyé.</span></div>
    <button class="btn small primary" data-act="export">Exporter</button>
  </div>`;
}

// ---------- Plan du jour : ce qu'il faut faire, dans l'ordre ----------
function workoutMinutes(w) {
  return Math.round(buildSteps(w, state.settings.level).reduce((a, x) => a + x.secs, 0) / 60);
}

function planItems(today) {
  const d = state.days[today] ?? {};
  const wo = WORKOUTS.find((w) => w.id === WEEK_PLAN[fromKey(today).getDay()]);
  const done = d.workouts ?? [];
  const items = [];
  items.push({
    ico: '💪', title: `Séance ${wo.name.split(' · ')[1] ?? wo.name}`, sub: `≈ ${workoutMinutes(wo)} min · niveau ${state.settings.level}`,
    done: wo.id === 'M' ? done.length > 0 : done.some((x) => x !== 'M'),
    go: `<button class="todo-go" data-act="start-workout" data-id="${wo.id}">Lancer</button>`,
  });
  const nextLesson = ALL_LESSONS.find((l, i) => (i === 0 || state.lessons[ALL_LESSONS[i - 1].id]) && !state.lessons[l.id]);
  const lessonToday = Object.values(state.lessons).some((l) => l.date && todayKey(new Date(l.date)) === today);
  if (nextLesson || lessonToday) {
    items.push({
      ico: '📘', title: lessonToday ? 'Leçon de finance faite' : `Leçon ${ALL_LESSONS.indexOf(nextLesson) + 1} : ${nextLesson.title}`, sub: '≈ 10-15 min · idée, exemple, exercice, quiz',
      done: lessonToday,
      go: nextLesson ? `<button class="todo-go" data-act="lesson-open" data-id="${nextLesson.id}">${lessonToday ? 'Suivante' : 'Ouvrir'}</button>` : '',
    });
  }
  const all = deck();
  if (all.length) {
    const due = dueCards(all, today).length;
    items.push({ ico: '🧠', title: due ? `Révisions : ${due} carte${due > 1 ? 's' : ''}` : 'Révisions à jour', sub: '≈ 5 min', done: due === 0, go: `<a class="todo-go" href="#revision">${due ? 'Réviser' : 'Cartes'}</a>` });
  }
  items.push({ ico: '🎯', title: '1 session de focus (25 min)', sub: `${d.focus ?? 0} faite${(d.focus ?? 0) > 1 ? 's' : ''} aujourd’hui`, done: (d.focus ?? 0) >= 1, go: '<a class="todo-go" href="#focus">Go</a>' });
  items.push({ ico: '📖', title: 'Lire 10 pages', sub: 'Moi > Livres pour choisir', done: Boolean(d.read), go: `<button class="todo-go" data-act="read-toggle">${d.read ? 'Annuler' : 'Fait'}</button>` });
  const prot = d.protein ?? 0;
  items.push({ ico: '🍗', title: `Protéines : ${prot}/${PROTEIN_TARGET} portions`, sub: 'œufs, poulet, thon, skyr, lentilles', done: prot >= PROTEIN_TARGET, go: '<button class="todo-go" data-act="protein" data-v="1">+1</button>' });
  const bed = weeklyBedtime(weekNumber(state, today), state.settings.bedtimeTarget);
  const phoneOut = (d.habits?.sommeil ?? 0) >= 1;
  items.push({ ico: '📵', title: `Téléphone hors de la chambre à ${bed}`, sub: 'puis coucher', done: phoneOut, go: phoneOut ? '' : '<button class="todo-go" data-act="habit" data-id="sommeil" data-lvl="1">Fait</button>' });
  return items;
}

function planCard(today) {
  const items = planItems(today);
  const n = items.filter((x) => x.done).length;
  return `<section class="card plan">
    <div class="card-head"><h2>Ton plan du jour</h2><span class="pill">${n}/${items.length}</span></div>
    <div class="bar"><span style="width:${(n / items.length) * 100}%"></span></div>
    <ul class="todos">${items.map((x) => `<li class="todo ${x.done ? 'done' : ''}">
      <span class="todo-ico" aria-hidden="true">${x.done ? '✓' : x.ico}</span>
      <div><strong>${esc(x.title)}</strong><small>${esc(x.sub)}</small></div>
      ${x.go}</li>`).join('')}</ul>
    <button class="btn wide copy-btn" data-act="copy-day">📋 Copier mon bilan du jour</button>
    <p class="hint center-hint">Le soir, colle-le dans ta conversation avec Claude.</p>
  </section>`;
}

// ---------- Révisions (révision espacée) ----------
const CARD_CATS = ['Trading', 'Crypto', 'Culture', 'Livres', 'Autre'];

function deck() {
  const lessonCards = ALL_LESSONS.filter((l) => state.lessons[l.id]).flatMap((l) => l.quiz.map((q, i) => ({
    id: `L:${l.id}:${i}`, cat: 'Finance', front: q.q, back: `${q.a[q.c]}. ${q.why}`,
  })));
  return [...lessonCards, ...state.myCards].map((c) => ({ ...c, ...state.srs[c.id] }));
}

const rev = { queue: null, flipped: false };

function viewRevision() {
  const today = todayKey();
  const all = deck();
  if (!rev.queue) rev.queue = dueCards(all, today).map((c) => c.id);
  const byId = Object.fromEntries(all.map((c) => [c.id, c]));
  rev.queue = rev.queue.filter((id) => byId[id]);
  const c = byId[rev.queue[0]];
  const counts = CARD_CATS.map((cat) => [cat, state.myCards.filter((x) => x.cat === cat).length]).filter(([, n]) => n);
  return `
  <div class="row"><a class="btn ghost small" href="#jour">← Retour</a><span class="pill">${rev.queue.length} restante${rev.queue.length > 1 ? 's' : ''}</span></div>
  ${c ? `<section class="card flash ${rev.flipped ? 'flipped' : ''}">
      <span class="tag">${esc(c.cat)}</span>
      <p class="flash-front">${esc(c.front)}</p>
      ${rev.flipped
        ? `<p class="flash-back">${esc(c.back)}</p>
           <div class="feel"><button class="btn" data-act="card-answer" data-ok="0">↺ À revoir</button><span></span><button class="btn primary" data-act="card-answer" data-ok="1">✓ Je savais</button></div>`
        : '<div class="row"><button class="btn primary wide" data-act="card-flip">Voir la réponse</button></div>'}
      <p class="hint">Réponds dans ta tête avant de retourner la carte. Sois honnête : « à revoir » n’est pas un échec, c’est ce qui fait marcher la méthode.</p>
    </section>`
    : `<section class="card center"><div class="big-emoji">🧠</div><h2>C’est fait pour aujourd’hui</h2><p class="muted">${all.length} carte${all.length > 1 ? 's' : ''} au total. Reviens demain.</p></section>`}
  <section class="card">
    <div class="card-head"><h2>Nouvelle carte</h2></div>
    <label>Catégorie<select id="card-cat">${CARD_CATS.map((x) => `<option>${x}</option>`).join('')}</select></label>
    <label>Question<input id="card-front" placeholder="Ex. : Que mesure l’ATR ?"></label>
    <label>Réponse<input id="card-back" placeholder="Ex. : L’amplitude moyenne des mouvements sur 14 jours"></label>
    <div class="row"><button class="btn primary" data-act="card-add">Ajouter</button></div>
    <p class="hint">Une carte = une seule idée, une réponse courte. Crée-en après chaque chapitre de livre, chaque idée de culture, chaque trade qui t’apprend quelque chose.</p>
    ${counts.length ? `<p class="hint">Tes cartes : ${counts.map(([k, n]) => `${k} ${n}`).join(' · ')}</p>` : ''}
    ${state.myCards.length ? `<details><summary>Gérer mes cartes</summary><ul class="cardlist">${state.myCards.map((x, i) => `<li><span><strong>${esc(x.front)}</strong><br><span class="muted">${esc(x.back)}</span></span><button class="btn ghost small" data-act="card-del" data-i="${i}">Suppr.</button></li>`).join('')}</ul></details>` : ''}
  </section>`;
}

function snackCard(key) {
  const d = state.days[key] ?? {};
  const snacks = d.snacks ?? [];
  const resisted = d.snackResisted ?? 0;
  const pending = snackCard.pending;
  const prot = d.protein ?? 0;
  return `
    <div class="protein">
      <div><strong>Protéines</strong> <span class="muted">${prot}/${PROTEIN_TARGET} portions</span>
        <div class="pips">${Array.from({ length: PROTEIN_TARGET }, (_, i) => `<i class="${i < prot ? 'on' : ''}"></i>`).join('')}</div></div>
      <div class="row tight-row"><button class="btn small" data-act="protein" data-v="-1" aria-label="Retirer une portion">−</button><button class="btn small primary" data-act="protein" data-v="1">+1 portion</button></div>
    </div>
    <p class="hint">${esc(PROTEIN_EXAMPLES)}</p>
    <div class="card-head sub"><h3>Grignotage</h3><span class="pill">${snacks.length} grignotage${snacks.length > 1 ? 's' : ''} · ${resisted} envie${resisted > 1 ? 's' : ''} résistée${resisted > 1 ? 's' : ''}</span></div>
    ${pending
      ? `<p class="hint">Qu’est-ce qui t’a donné envie ?</p><div class="chips">${SNACK_TRIGGERS.map((t) => `<button class="chip" data-act="snack-log" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div>
         <div class="row"><button class="btn ghost small" data-act="snack-cancel">Annuler</button></div>`
      : `<div class="row"><button class="btn" data-act="snack-resist">Envie résistée</button><button class="btn" data-act="snack-ask">J’ai grignoté</button></div>
         <p class="hint">Pas de culpabilité : note-le, c’est tout. Au bout d’une semaine tu verras tes heures et tes déclencheurs, et on attaque ceux-là.</p>`}
    ${snacks.length ? `<p class="hint">${snacks.map((x) => `${esc(x.time)} · ${esc(x.trigger)}`).join(' — ')}</p>` : ''}`;
}

// La plante pousse pendant la session (idée reprise de Forest).
function plantSVG(f) {
  const g = Math.max(0, Math.min(1, f));
  const stem = 10 + g * 50;
  const leaf = (y, side, size) => (g * 60 > 75 - y ? `<ellipse cx="${60 + side * (6 + size)}" cy="${y}" rx="${size}" ry="${size / 2.2}" transform="rotate(${side * -30} ${60 + side * (6 + size)} ${y})" class="leaf"/>` : '');
  return `<svg viewBox="0 0 120 100" aria-hidden="true">
    <ellipse cx="60" cy="88" rx="34" ry="6" class="soil"/>
    <rect x="58" y="${86 - stem}" width="4" height="${stem}" rx="2" class="stem"/>
    ${leaf(70, -1, 9)}${leaf(62, 1, 10)}${leaf(52, -1, 11)}${leaf(42, 1, 12)}${leaf(34, -1, 12)}
    ${g >= 0.98 ? '<circle cx="60" cy="24" r="16" class="crown"/>' : ''}
  </svg>`;
}

function timerRing(id, f) {
  const r = 108;
  const c = 2 * Math.PI * r;
  return `<svg class="tring" viewBox="0 0 240 240" aria-hidden="true"><circle cx="120" cy="120" r="${r}" class="tring-bg"/>
    <circle id="${id}" cx="120" cy="120" r="${r}" class="tring-fg" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - Math.max(0, Math.min(1, f)))}"/></svg>`;
}

function setRing(id, f) {
  const el = document.getElementById(id);
  if (!el) return;
  const c = 2 * Math.PI * 108;
  el.setAttribute('stroke-dashoffset', c * (1 - Math.max(0, Math.min(1, f))));
}

function viewFocus() {
  const today = todayKey();
  const d = state.days[today] ?? {};
  const p = state.timers.pomo;
  const u = state.timers.urge;
  return `
  <section class="card center">
    <div class="card-head"><h2>${p.mode === 'work' ? 'Focus 25 min' : 'Pause 5 min'}</h2><span class="pill">${d.focus ?? 0} aujourd’hui</span></div>
    <input class="task" id="pomo-label" placeholder="Sur quoi tu travailles ? (une seule chose)" value="${esc(p.label)}">
    <div class="timer">${timerRing('pomo-ring', 1 - pomoRemaining() / (p.mode === 'work' ? POMO_WORK : POMO_BREAK))}
      <div class="timer-in">${p.mode === 'work' ? `<div class="plant" id="plant">${plantSVG(1 - pomoRemaining() / POMO_WORK)}</div>` : '<div class="plant">☕</div>'}
      <div class="clock" id="pomo-clock">${fmtClock(p.remaining)}</div></div></div>
    <div class="row center">
      <button class="btn primary" data-act="pomo-toggle" id="pomo-toggle">${p.endAt ? 'Pause' : 'Démarrer'}</button>
      <button class="btn" data-act="pomo-reset">Réinitialiser</button>
      <button class="btn" data-act="pomo-skip">${p.mode === 'work' ? 'Passer en pause' : 'Passer la pause'}</button>
    </div>
    <p class="hint">Avant de démarrer : téléphone dans une autre pièce, ou face cachée en mode avion. 1 session valide le minimum « Focus », 4 valident le complet.</p>
    <div class="garden" aria-label="Sessions terminées aujourd’hui">${'🌳'.repeat(d.focus ?? 0) || '<span class="muted">Ton jardin du jour est vide. Chaque session fait pousser un arbre.</span>'}</div>
  </section>
  <section class="card center urge">
    <div class="card-head"><h2>Envie de scroller ?</h2><span class="pill">${d.urges ?? 0} envie${(d.urges ?? 0) > 1 ? 's' : ''} retardée${(d.urges ?? 0) > 1 ? 's' : ''}</span></div>
    <p class="muted">Tu n’as pas à résister pour toujours. Juste 10 minutes. Une envie retombe souvent d’elle-même ; si elle est encore là après, ouvre l’appli consciemment, avec un minuteur.</p>
    <div class="clock small" id="urge-clock">${u.endAt ? fmtClock(Math.max(0, (u.endAt - Date.now()) / 1000)) : '10:00'}</div>
    <div class="row center">
      ${u.endAt ? '<button class="btn" data-act="urge-stop">Arrêter</button>' : '<button class="btn primary" data-act="urge-start">J’attends 10 min</button>'}
    </div>
    <p class="hint">Pendant ces 10 min : 10 pompes, un verre d’eau, ou 2 pages de lecture.</p>
  </section>`;
}

let player = null; // séance en cours

function buildSteps(w, level) {
  const delta = w.fixed ? 0 : (level - 2) * 10;
  const rounds = w.fixed ? w.rounds : level === 1 ? Math.max(2, w.rounds - 1) : w.rounds;
  const steps = [{ kind: 'prep', name: 'Prépare-toi', secs: 10, cue: 'Tapis au sol, téléphone posé à côté, une gorgée d’eau.' }];
  if (!w.fixed) {
    WARMUP.forEach((ex) => steps.push({ kind: 'warm', name: ex.name, secs: ex.work, cue: ex.cue }));
  }
  for (let r = 1; r <= rounds; r++) {
    w.exercises.forEach((ex, i) => {
      steps.push({ kind: 'work', name: ex.name, secs: Math.max(15, ex.work + delta), cue: ex.cue, target: ex.target, round: r, rounds });
      const lastInRound = i === w.exercises.length - 1;
      if (!lastInRound && w.rest) steps.push({ kind: 'rest', name: 'Récupère', secs: w.rest, cue: `Ensuite : ${w.exercises[i + 1].name}`, round: r, rounds });
      if (lastInRound && r < rounds && w.roundRest) steps.push({ kind: 'rest', name: 'Fin du tour', secs: w.roundRest, cue: `Ensuite : ${w.exercises[0].name}. Bois une gorgée d’eau.`, round: r, rounds });
    });
  }
  return steps;
}

function viewSport() {
  const today = todayKey();
  const planned = WEEK_PLAN[fromKey(today).getDay()];
  const lvl = state.settings.level;
  const done = state.days[today]?.workouts ?? [];
  const recent = state.feels.filter((f) => f.id !== 'M').slice(-2);
  const suggestUp = lvl < 3 && recent.length === 2 && recent.every((f) => f.v === 'facile');
  const suggestDown = lvl > 1 && recent.length === 2 && recent.every((f) => f.v === 'dur');
  const dayNames = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const todayDow = (fromKey(today).getDay() + 6) % 7;
  const sw = sportWeeks(state, today);
  return `
  ${suggestUp ? `<div class="banner ok"><strong>2 séances « faciles » de suite.</strong> Il est temps de monter. <button class="btn small primary" data-act="level" data-lvl="${lvl + 1}">Passer au niveau ${lvl + 1}</button></div>` : ''}
  ${suggestDown ? `<div class="banner warn"><strong>2 séances « dures » de suite.</strong> Redescendre d’un niveau n’est pas un échec. <button class="btn small" data-act="level" data-lvl="${lvl - 1}">Revenir au niveau ${lvl - 1}</button></div>` : ''}
  ${(() => {
    const pw = WORKOUTS.find((w) => w.id === planned);
    const did = done.includes(planned);
    return `<section class="card today-workout">
      <span class="wo-badge big wo-${pw.id}">${pw.id}</span>
      <div><p class="eyebrow">Aujourd’hui</p><h2>${esc(pw.name.split(' · ')[1] ?? pw.name)}</h2><p class="muted">≈ ${workoutMinutes(pw)} min · niveau ${lvl}${did ? ' · ✓ faite' : ''}</p></div>
      <button class="btn primary wide" data-act="start-workout" data-id="${pw.id}">${did ? 'Refaire' : 'Lancer la séance'}</button>
      ${pw.id !== 'M' ? `<button class="btn ghost small" data-act="start-workout" data-id="M">Pas la forme ? Juste la mobilité (${workoutMinutes(WORKOUTS.find((w) => w.id === 'M'))} min)</button>` : ''}
    </section>`;
  })()}
  <section class="card program-hero">
    <div class="card-head"><h2>🔥 Régularité</h2><span class="pill">${sw.streak} semaine${sw.streak > 1 ? 's' : ''} tenue${sw.streak > 1 ? 's' : ''}</span></div>
    <div class="pips big">${Array.from({ length: sw.goal }, (_, i) => `<i class="${i < sw.thisWeek ? 'on' : ''}"></i>`).join('')}</div>
    <p class="hint">${sw.thisWeek}/${sw.goal} séances A, B ou C cette semaine (lundi → dimanche). Une semaine est tenue à ${sw.goal}. La régularité bat l’intensité : 4 séances moyennes valent mieux qu’une séance héroïque.</p>
  </section>
  ${goalCard()}
  <section class="card">
    <div class="card-head"><h2>Ta semaine</h2></div>
    <div class="week">${[1, 2, 3, 4, 5, 6, 0].map((dow, i) => `<div class="wk-${WEEK_PLAN[dow]} ${i === todayDow ? 'today' : ''}"><small>${dayNames[i]}</small><b>${WEEK_PLAN[dow]}</b></div>`).join('')}</div>
    <p class="hint">A = abdos et tronc, B = haut du corps en V, C = cardio sans saut, M = mobilité et posture. Échauffement inclus dans A, B et C. Les jours sans envie, M suffit à valider « Bouger ».</p>
  </section>
  <section class="card">
    <div class="card-head"><h2>Niveau</h2></div>
    <div class="row">${[1, 2, 3].map((n) => `<button class="seg ${lvl === n ? 'on' : ''}" data-act="level" data-lvl="${n}" aria-pressed="${lvl === n}">Niveau ${n}</button>`).join('')}</div>
    <p class="hint">À la fin de chaque séance, dis si c’était facile, correct ou dur : l’appli te propose de monter ou de descendre. Niveau 1 = 2 tours, efforts plus courts.</p>
  </section>
  ${WORKOUTS.map((w) => {
    const steps = buildSteps(w, lvl);
    const mins = Math.round(steps.reduce((s, x) => s + x.secs, 0) / 60);
    return `<section class="card ${w.id === planned ? 'planned' : ''}">
      <div class="card-head"><h2><span class="wo-badge wo-${w.id}">${w.id}</span>${esc(w.name.split(' · ')[1] ?? w.name)}</h2><span class="pill">${w.id === planned ? 'Aujourd’hui · ' : ''}${mins} min</span></div>
      <p class="muted">${esc(w.desc)}</p>
      <details><summary>Voir les exercices</summary><ol class="ex">${w.exercises.map((e) => `<li><strong>${esc(e.name)}</strong> · <a href="${demoUrl(e.name)}" target="_blank" rel="noopener">démo vidéo</a><br><span class="target-tag">🎯 ${esc(e.target)}</span><br><span class="muted">${esc(e.cue)}</span></li>`).join('')}</ol></details>
      <div class="row"><button class="btn primary" data-act="start-workout" data-id="${w.id}">Lancer${done.includes(w.id) ? ' (déjà faite aujourd’hui)' : ''}</button></div>
    </section>`;
  }).join('')}
  <section class="card">
    <div class="card-head"><h2>Sécurité</h2></div>
    <ul class="tight">
      <li>Douleur vive ou articulaire : arrête l’exercice. Une brûlure musculaire, c’est normal.</li>
      <li>Si la technique se dégrade, mets-toi en version genoux ou arrête la série. La qualité passe avant la durée.</li>
      <li>Rien ici ne vise les fessiers. Les abdos visibles viendront surtout de l’alimentation et des pas, pas de plus de gainage.</li>
      <li>Chaque exercice a un lien « démo vidéo ». Regarde-le avant ta première séance, pas pendant.</li>
    </ul>
  </section>
  <section class="card">
    <div class="card-head"><h2>Manger</h2></div>
    <p class="muted">Pour des abdos visibles, l’alimentation pèse plus lourd que les séances. Six règles, pas de régime :</p>
    <ol class="tight">${FOOD_RULES.map((r) => `<li>${esc(r)}</li>`).join('')}</ol>
  </section>
  <section class="card">
    <div class="card-head"><h2>Apprendre à cuisiner</h2><span class="pill">${RECIPES.length} recettes</span></div>
    <p class="hint">Objectif : maîtriser une recette par semaine. Propose à tes parents de cuisiner un repas par semaine : tu apprends, et tu choisis ce qui est dans l’assiette.</p>
    ${RECIPES.map((r) => `<details><summary><strong>${esc(r.name)}</strong> · ${esc(r.time)}</summary>
      <p><em>Ingrédients :</em> ${esc(r.items)}</p><p>${esc(r.steps)}</p></details>`).join('')}
  </section>`;
}

// Silhouette stylisée : épaules et dorsaux (séance B), abdos (A), taille (M).
const V_SHAPE = `<svg class="vshape" viewBox="0 0 200 150" aria-hidden="true">
  <circle cx="100" cy="17" r="13" class="vs-body"/>
  <path d="M28 60 L18 128 M172 60 L182 128" class="vs-arm"/>
  <path d="M40 46 Q100 34 160 46 L136 128 Q100 136 64 128 Z" class="vs-body"/>
  <ellipse cx="40" cy="55" rx="15" ry="12" class="vs-b"/><ellipse cx="160" cy="55" rx="15" ry="12" class="vs-b"/>
  <path d="M52 66 Q46 94 66 120 L74 106 Q62 88 64 66 Z M148 66 Q154 94 134 120 L126 106 Q138 88 136 66 Z" class="vs-b soft"/>
  ${[66, 84, 102].map((y) => `<rect x="87" y="${y}" width="12" height="14" rx="4" class="vs-a"/><rect x="101" y="${y}" width="12" height="14" rx="4" class="vs-a"/>`).join('')}
  <path d="M60 128 Q100 120 140 128" class="vs-waist"/>
</svg>`;

function goalCard() {
  return `<section class="card goal">
    <div class="card-head"><h2>🎯 Ton objectif : silhouette en V</h2></div>
    <div class="goal-top">${V_SHAPE}
      <p class="muted">Large en haut, fin à la taille, sec, tête haute : c’est ce contraste qui donne un corps élancé, pas la taille.</p></div>
    <ul class="goal-list">
      <li><span class="wo-badge wo-B">B</span><div><strong>Large en haut.</strong> Milieu de l’épaule (élévations latérales) et dorsaux (tirage à la serviette) : c’est la largeur des épaules qui fait paraître la taille fine.</div></li>
      <li><span class="wo-badge wo-M">M</span><div><strong>Taille fine.</strong> Gainage profond et vacuum chaque jour. On ne charge jamais les obliques : ça épaissit la taille.</div></li>
      <li><span class="wo-badge wo-A">A</span><div><strong>Abdos visibles.</strong> Roue et crunch inversé les construisent, mais c’est l’assiette qui les montre : protéines, zéro grignotage, 8 000 pas, séance C.</div></li>
      <li><span class="wo-badge wo-M">M</span><div><strong>Élancé, pas trapu.</strong> Menton rentré, épaules basses, hanches ouvertes : une posture droite fait paraître plus grand. Aucun exercice pour les trapèzes, ils tassent le cou.</div></li>
    </ul>
    <p class="hint">Bonus : si tu as accès à une barre (parc de street workout, barre de porte), les tractions sont le meilleur exercice pour le V. Ajoute 3 séries après la séance B.</p>
  </section>`;
}

function renderPlayer() {
  const el = $('#player');
  if (!player) {
    el.hidden = true;
    el.innerHTML = '';
    return;
  }
  el.hidden = false;
  if (player.done) {
    el.className = 'player done';
    el.innerHTML = `
      <div class="player-main">
        <p class="eyebrow">Séance terminée</p>
        <h2>${esc(player.workout.name)}</h2>
        <div class="big-emoji">💪</div>
        <p class="cue">Comment c’était ? Ta réponse sert à ajuster le niveau.</p>
      </div>
      <div class="feel">
        <button class="btn" data-act="feel" data-v="facile">😌 Facile</button>
        <button class="btn primary" data-act="feel" data-v="correct">🙂 Correct</button>
        <button class="btn" data-act="feel" data-v="dur">🥵 Dur</button>
      </div>`;
    return;
  }
  const s = player.steps[player.i];
  const next = player.steps[player.i + 1];
  el.className = `player ${s.kind}`;
  el.innerHTML = `
    <div class="player-top"><span>${esc(player.workout.name)}</span><span>${s.round ? `Tour ${s.round}/${s.rounds}` : ''}</span></div>
    <div class="player-main">
      <p class="eyebrow">${{ work: 'Effort', rest: 'Repos', warm: 'Échauffement', prep: 'Départ' }[s.kind]}</p>
      <h2>${esc(s.name)}</h2>
      ${s.target ? `<span class="target-tag">🎯 ${esc(s.target)}</span>` : ''}
      <div class="timer">${timerRing('player-ring', 1 - player.remaining / s.secs)}<div class="clock" id="player-clock">${fmtClock(player.remaining)}</div></div>
      <p class="cue">${esc(s.cue)}</p>
      ${s.kind === 'work' ? `<p><a href="${demoUrl(s.name)}" target="_blank" rel="noopener">Voir une démo</a></p>` : ''}
      ${next ? `<p class="muted">Ensuite : ${esc(next.name)}</p>` : ''}
    </div>
    <div class="progress"><span style="width:${(player.i / player.steps.length) * 100}%"></span></div>
    <div class="row center">
      <button class="btn" data-act="player-prev">◀︎</button>
      <button class="btn primary" data-act="player-toggle">${player.endAt ? 'Pause' : 'Reprendre'}</button>
      <button class="btn" data-act="player-next">▶︎</button>
    </div>
    <div class="row center"><button class="btn ghost" data-act="player-stop">Arrêter la séance</button></div>`;
}

function startWorkout(id) {
  const w = WORKOUTS.find((x) => x.id === id);
  const steps = buildSteps(w, state.settings.level);
  player = { workout: w, steps, i: 0, remaining: steps[0].secs, endAt: Date.now() + steps[0].secs * 1000 };
  try {
    // Le son se prépare pendant l'appui (sinon l'iPhone reste muet).
    audioCtx ??= new AudioContext();
    audioCtx.resume?.();
  } catch { /* son indisponible */ }
  keepAwake(true);
  renderPlayer();
}

function playerGoto(i) {
  if (i >= player.steps.length) return finishWorkout();
  player.i = Math.max(0, i);
  player.remaining = player.steps[player.i].secs;
  player.endAt = Date.now() + player.remaining * 1000;
  renderPlayer();
}

function finishWorkout() {
  const today = todayKey();
  const d = day(today);
  d.workouts = [...(d.workouts ?? []), player.workout.id];
  raiseHabit(today, 'sport', player.workout.id === 'M' ? 1 : 2);
  save();
  player = { workout: player.workout, done: true };
  keepAwake(false);
  beep(3);
  renderPlayer();
  render();
  celebrate(`Séance terminée · +30 XP`);
}

function viewTrack() {
  const today = todayKey();
  const key = viewTrack.key ?? today;
  const d = state.days[key] ?? {};
  const s = state.settings;
  const weights = series(state, 'weight', today, 60);
  const waists = series(state, 'waist', today, 84);
  const beds = series(state, 'bed', today, 21).map((p) => ({ key: p.key, value: bedtimeMinutes(p.value) }));
  const screens = series(state, 'screen', today, 21);
  const steps = series(state, 'steps', today, 21);
  const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b.value, 0) / arr.length : null);
  const last7 = (arr) => arr.filter((p) => diffDays(p.key, today) < 7);
  const sleeps = [];
  for (let i = 0; i < 7; i++) {
    const k = addDays(today, -i);
    const x = state.days[k];
    const dur = sleepDuration(x?.bed, x?.wake);
    if (dur) sleeps.push({ value: dur });
  }
  const bedAvg = avg(last7(beds));
  const scrAvg = avg(last7(screens));
  const slpAvg = avg(sleeps);
  const snackPts = [];
  for (let i = 20; i >= 0; i--) {
    const k = addDays(today, -i);
    const x = state.days[k];
    if (x && (x.snacks || x.snackResisted !== undefined)) snackPts.push({ key: k, value: (x.snacks ?? []).length });
  }
  const triggers = {};
  for (let i = 0; i < 14; i++) {
    for (const sn of state.days[addDays(today, -i)]?.snacks ?? []) triggers[sn.trigger] = (triggers[sn.trigger] ?? 0) + 1;
  }
  const topTriggers = Object.entries(triggers).sort((a, b) => b[1] - a[1]);
  const trend = rollingAverage(weights);
  const lastTrend = trend.at(-1)?.value;

  return `
  <section class="card">
    <div class="card-head"><h2>Saisie</h2></div>
    <label>Jour<input type="date" id="track-date" value="${key}" max="${today}"></label>
    <div class="grid2">
      <label>Poids (kg)<input type="number" step="0.1" inputmode="decimal" data-field="weight" data-key="${key}" value="${d.weight ?? ''}"></label>
      <label>Tour de taille (cm)<input type="number" step="0.5" inputmode="decimal" data-field="waist" data-key="${key}" value="${d.waist ?? ''}"></label>
      <label>Couché à<input type="time" data-field="bed" data-key="${key}" value="${esc(d.bed ?? '')}"></label>
      <label>Levé à<input type="time" data-field="wake" data-key="${key}" value="${esc(d.wake ?? '')}"></label>
      <label>Temps d’écran (min)<input type="number" step="5" inputmode="numeric" data-field="screen" data-key="${key}" value="${d.screen ?? ''}"></label>
      <label>Pas<input type="number" step="100" inputmode="numeric" data-field="steps" data-key="${key}" value="${d.steps ?? ''}"></label>
    </div>
    <p class="hint">Poids : le matin, à jeun, après les toilettes. Seule la moyenne sur 7 jours compte. Tour de taille : au nombril, une fois par semaine. Écran : relève le chiffre d’hier dans les réglages du téléphone, chaque matin.</p>
  </section>
  <section class="stats">
    <div class="stat"><span class="lbl">Poids moyen 7 j</span><span class="big">${lastTrend ? `${lastTrend.toFixed(1)}<small> kg</small>` : '—'}</span><span class="lbl">cible ${s.weightTarget} kg</span></div>
    <div class="stat"><span class="lbl">Coucher moyen 7 j</span><span class="big">${bedAvg !== null ? minutesToHHMM(bedAvg) : '—'}</span><span class="lbl">cible ${esc(s.bedtimeTarget)}</span></div>
    <div class="stat"><span class="lbl">Sommeil moyen 7 j</span><span class="big">${slpAvg ? fmtDuration(slpAvg) : '—'}</span><span class="lbl">cible 8 h</span></div>
    <div class="stat"><span class="lbl">Écran moyen 7 j</span><span class="big">${scrAvg !== null ? fmtDuration(scrAvg) : '—'}</span><span class="lbl">cible ${fmtDuration(s.screenTarget)}</span></div>
  </section>
  ${lineChart({ title: 'Poids (60 jours)', points: weights, trend, target: Number(s.weightTarget), targetLabel: `cible ${s.weightTarget} kg`, today, days: 60, fmt: (v) => Number(v).toFixed(1), unit: ' kg', empty: 'Aucune pesée pour l’instant.' })}
  ${barChart({ title: 'Temps d’écran (21 jours)', points: screens, target: Number(s.screenTarget), targetLabel: `cible ${fmtDuration(s.screenTarget)}`, today, days: 21, fmt: (v) => fmtDuration(v), unit: '', empty: 'Aucun temps d’écran saisi.', overIsBad: true })}
  ${lineChart({ title: 'Heure de coucher (21 jours)', points: beds, target: bedtimeMinutes(s.bedtimeTarget), targetLabel: `cible ${s.bedtimeTarget}`, today, days: 21, fmt: (v) => minutesToHHMM(v), unit: '', empty: 'Aucune heure de coucher saisie.' })}
  ${barChart({ title: 'Pas (21 jours)', points: steps, target: 8000, targetLabel: 'cible 8 000', today, days: 21, fmt: (v) => Math.round(v).toLocaleString('fr-FR'), unit: ' pas', empty: 'Aucun nombre de pas saisi.' })}
  ${barChart({ title: 'Grignotages par jour (21 jours)', points: snackPts, today, days: 21, fmt: (v) => Math.round(v), unit: '', empty: 'Rien de noté. Utilise la carte « Grignotage » de l’onglet Jour.' })}
  ${topTriggers.length ? `<section class="card"><div class="card-head"><h2>Tes déclencheurs (14 jours)</h2></div>
    <ul class="tight">${topTriggers.map(([t, n]) => `<li><strong>${esc(t)}</strong> : ${n} fois</li>`).join('')}</ul>
    <p class="hint">Attaque le premier de la liste : écris une règle « Si… alors… » pour lui dans l’onglet Bilan.</p></section>` : ''}
  ${testsCard()}
  ${lineChart({ title: 'Tour de taille (12 semaines)', points: waists, today, days: 84, fmt: (v) => Number(v).toFixed(1), unit: ' cm', empty: 'Aucune mesure. Prends-la au nombril, détendu, sans rentrer le ventre.' })}`;
}

const TEST_FIELDS = [
  ['pushups', 'Pompes', '', 'max, propres, sans pause'],
  ['plank', 'Planche', ' s', 'avant-bras, jusqu’à ce que le bassin tombe'],
  ['side', 'Latérale', ' s', 'côté le plus faible'],
  ['hollow', 'Hollow', ' s', 'genoux pliés, dos plaqué'],
];

function testsCard() {
  const t = state.tests;
  const first = t[0];
  const last = t.at(-1);
  return `<section class="card">
    <div class="card-head"><h2>Tests de niveau</h2><span class="pill">${t.length} test${t.length > 1 ? 's' : ''}</span></div>
    <p class="hint">Fais-le maintenant, puis aux sprints 4, 8 et 12. Toujours après la séance M (échauffement), en arrêtant dès que la technique casse.</p>
    <div class="grid2">${TEST_FIELDS.map(([f, label, unit, hint]) => `<label>${label}${unit ? ` (${unit.trim()})` : ''}<small class="field-hint">${esc(hint)}</small><input type="number" inputmode="numeric" id="test-${f}"></label>`).join('')}</div>
    <div class="row"><button class="btn primary" data-act="test-save">Enregistrer le test du jour</button></div>
    ${t.length ? `<div class="table-wrap"><table class="tests">
      <thead><tr><th>Date</th>${TEST_FIELDS.map(([, l]) => `<th>${l}</th>`).join('')}</tr></thead>
      <tbody>${t.map((r) => `<tr><td>${fromKey(r.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</td>${TEST_FIELDS.map(([f, , u]) => `<td>${r[f] ?? '—'}${r[f] !== undefined ? u : ''}</td>`).join('')}</tr>`).join('')}
      ${t.length > 1 ? `<tr class="delta"><td>Progrès</td>${TEST_FIELDS.map(([f, , u]) => {
        const a = first[f];
        const b = last[f];
        return `<td>${a !== undefined && b !== undefined ? `${b - a >= 0 ? '+' : ''}${b - a}${u}` : '—'}</td>`;
      }).join('')}</tr>` : ''}</tbody></table></div>` : ''}
  </section>`;
}

const ME_TABS = [['programme', 'Programme'], ['bilan', 'Bilan'], ['livres', 'Livres'], ['apps', 'Apps'], ['reglages', 'Réglages']];

function viewMe() {
  const sub = ME_TABS.some(([id]) => id === state.ui.meTab) ? state.ui.meTab : 'programme';
  const body = { programme: viewProgram, bilan: viewReview, livres: viewBooks, apps: viewApps, reglages: viewSettings }[sub]();
  return `<nav class="subtabs five">${ME_TABS.map(([id, label]) => `<button class="${sub === id ? 'on' : ''}" data-act="me-tab" data-id="${id}">${label}</button>`).join('')}</nav>${body}`;
}

function avgLast7(field, today, map = (v) => v) {
  const pts = series(state, field, today, 7).map((p) => map(p.value)).filter((v) => v !== null);
  return pts.length ? pts.reduce((a, b) => a + b, 0) / pts.length : null;
}

function viewProgram() {
  const today = todayKey();
  const week = Math.min(weekNumber(state, today), 12);
  const phase = PHASES.find((p) => week >= p.weeks[0] && week <= p.weeks[1]) ?? PHASES.at(-1);
  const next = MILESTONES.find((m) => m.week >= week) ?? MILESTONES.at(-1);
  const screen = avgLast7('screen', today);
  const weights = rollingAverage(series(state, 'weight', today, 14));
  const weight = weights.at(-1)?.value ?? null;
  const bed = avgLast7('bed', today, bedtimeMinutes);
  const lastTest = state.tests.at(-1) ?? {};
  const lessons = Object.keys(state.lessons).length;
  const row = (label, now, target, fmt, better) => {
    const ok = now !== null && now !== undefined && (better === 'lower' ? now <= target : now >= target);
    return `<tr><td>${label}</td><td>${now === null || now === undefined ? '—' : fmt(now)}</td><td>${fmt(target)}</td><td>${now === null || now === undefined ? '' : ok ? '✅' : '⏳'}</td></tr>`;
  };
  return `
  <section class="card program-hero">
    <div class="card-head"><h2>Semaine ${week}/12</h2><span class="pill">${esc(phase.name)}</span></div>
    <div class="bar"><span style="width:${(week / 12) * 100}%"></span></div>
    <ul class="tight">${phase.focus.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
    <p class="hint">Coucher cible cette semaine : <strong>${weeklyBedtime(week, state.settings.bedtimeTarget)}</strong>. Le 3ᵉ jour de chaque sprint est un jour minimum prévu.</p>
  </section>
  <section class="card">
    <div class="card-head"><h2>Objectifs de la semaine ${next.week}</h2></div>
    <div class="table-wrap"><table class="tests">
      <thead><tr><th>Mesure</th><th>Actuel</th><th>Cible</th><th></th></tr></thead>
      <tbody>
        ${row('Écran (moy. 7 j)', screen, next.screen, fmtDuration, 'lower')}
        ${row('Coucher (moy. 7 j)', bed, bedtimeMinutes(weeklyBedtime(next.week, state.settings.bedtimeTarget)), minutesToHHMM, 'lower')}
        ${row('Poids (moy. 7 j)', weight, next.weight, (v) => `${Number(v).toFixed(1)} kg`, 'lower')}
        ${row('Pompes', lastTest.pushups ?? null, next.pushups, (v) => v, 'higher')}
        ${row('Planche', lastTest.plank ?? null, next.plank, (v) => `${v} s`, 'higher')}
        ${row('Leçons de finance', lessons, next.lessons, (v) => v, 'higher')}
      </tbody></table></div>
    <p class="hint">Les valeurs viennent de Suivi (saisies quotidiennes) et de tes tests de niveau.</p>
  </section>
  <section class="card">
    <div class="card-head"><h2>Les 3 phases</h2></div>
    ${PHASES.map((p) => `<details ${p === phase ? 'open' : ''}><summary><strong>${esc(p.name)}</strong> · semaines ${p.weeks[0]} à ${p.weeks[1]}</summary><ul class="tight">${p.focus.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></details>`).join('')}
  </section>
  <section class="card">
    <div class="card-head"><h2>Conseils qui marchent</h2></div>
    <ul class="tight">
      <li>Chargeur du téléphone dans le salon, réveil à piles dans la chambre.</li>
      <li>10 minutes dehors dans l’heure qui suit le lever.</li>
      <li>Pas de café ni de boisson énergisante après 14 h.</li>
      <li>Écran en gris à partir de 22 h.</li>
      <li>La veille : tapis déroulé, vêtements de sport sortis, premier focus écrit.</li>
      <li>Après un jour raté : les minimums avant midi, sans rattrapage.</li>
      <li>Mesure plutôt que ressens : poids, écran et coucher se notent.</li>
    </ul>
  </section>`;
}

function viewBooks() {
  const cats = [...new Set(BOOKS.map((b) => b.cat))];
  const st = (id) => state.books[id]?.status;
  const doneCount = BOOKS.filter((b) => st(b.id) === 'done').length;
  const reading = BOOKS.filter((b) => st(b.id) === 'reading');
  return `
  <section class="card">
    <div class="card-head"><h2>📚 Bibliothèque</h2><span class="pill">${doneCount} lu${doneCount > 1 ? 's' : ''}</span></div>
    ${reading.length ? `<p>En cours : <strong>${reading.map((b) => esc(b.title)).join(', ')}</strong></p>` : '<p class="hint">Commence par un livre marqué ⭐. Un seul à la fois, 10 pages par jour minimum.</p>'}
    <p class="hint">Règles : bibliothèque avant achat, version originale si c’est en anglais, et si un livre t’ennuie après 50 pages, passe au suivant. +50 XP par livre terminé.</p>
  </section>
  ${cats.map((c) => `<section class="card"><div class="card-head"><h2>${esc(c)}</h2></div>
    <ul class="books">${BOOKS.filter((b) => b.cat === c).map((b) => `<li class="${st(b.id) ?? ''}">
      <div><strong>${b.start ? '⭐ ' : ''}${esc(b.title)}</strong> <span class="muted">· ${esc(b.author)}</span><br><span class="hint">${esc(b.why)}</span></div>
      <div class="book-btns">
        <button class="seg ${st(b.id) === 'reading' ? 'on' : ''}" data-act="book-status" data-id="${b.id}" data-v="reading">En cours</button>
        <button class="seg ${st(b.id) === 'done' ? 'on' : ''}" data-act="book-status" data-id="${b.id}" data-v="done">Lu</button>
      </div></li>`).join('')}</ul></section>`).join('')}`;
}

function viewApps() {
  const cats = [...new Set(APPS.map((a) => a.cat))];
  const done = APPS.filter((a) => state.setup[a.name]).length;
  return `
  <section class="card">
    <div class="card-head"><h2>🧰 Tes outils</h2><span class="pill">${done}/${APPS.length} configurés</span></div>
    <div class="bar"><span style="width:${(done / APPS.length) * 100}%"></span></div>
    <p class="hint">Tout est gratuit sauf le réveil (≈ 10 €). Coche chaque outil une fois configuré.</p>
  </section>
  ${cats.map((c) => `<section class="card"><div class="card-head"><h2>${esc(c)}</h2></div>
    <ul class="setup">${APPS.filter((a) => a.cat === c).map((a) => `<li>
      <button class="tick ${state.setup[a.name] ? 'on' : ''}" data-act="setup-toggle" data-id="${esc(a.name)}" aria-pressed="${Boolean(state.setup[a.name])}" aria-label="Configuré : ${esc(a.name)}">${state.setup[a.name] ? '✓' : ''}</button>
      <div><strong>${esc(a.name)}</strong><br><span class="hint">${esc(a.how)}</span></div></li>`).join('')}</ul></section>`).join('')}`;
}

function viewReview() {
  const today = todayKey();
  const sp = sprintInfo(state, today);
  const cur = sp.current;
  const prev = sp.sprints[sp.index - 1];
  const reviewTarget = prev && !state.reviews[prev.number]?.change ? prev : cur;
  const rv = state.reviews[reviewTarget.number] ?? {};

  return `
  <section class="card">
    <div class="card-head"><h2>Les 12 sprints</h2><span class="pill">${sp.sprints.filter((x) => x.finished && x.passed).length} réussi(s)</span></div>
    <p class="hint">Un sprint dure 7 jours. Il est réussi à ${SPRINT_PASS}/7 jours validés : pas besoin d’être parfait, il faut finir.</p>
    <ol class="sprints">${sp.sprints.slice(0, Math.max(SPRINT_COUNT, sp.index + 1)).map((x) => `
      <li class="${x.current ? 'current' : ''}"><span class="num">S${x.number}</span>
        <span class="mini">${x.days.map((dd) => `<i class="${dd.future ? 'pre' : dd.valid ? 'ok' : 'miss'}"></i>`).join('')}</span>
        <span class="res">${x.finished ? (x.passed ? '✓ réussi' : `${x.valid}/7`) : x.current ? `${x.valid}/7 en cours` : ''}</span></li>`).join('')}</ol>
  </section>
  <section class="card">
    <div class="card-head"><h2>Bilan du sprint ${reviewTarget.number}</h2></div>
    <p class="hint">5 minutes, le dimanche soir. Une seule chose à changer, pas dix.</p>
    <label>Qu’est-ce qui a marché ?<textarea data-review="${reviewTarget.number}" data-q="win" rows="2">${esc(rv.win)}</textarea></label>
    <label>Qu’est-ce qui m’a fait rater, concrètement (heure, lieu, déclencheur) ?<textarea data-review="${reviewTarget.number}" data-q="fail" rows="2">${esc(rv.fail)}</textarea></label>
    <label>La seule chose que je change la semaine prochaine :<textarea data-review="${reviewTarget.number}" data-q="change" rows="2">${esc(rv.change)}</textarea></label>
    <button class="btn primary wide copy-btn" data-act="copy-week" data-first="${reviewTarget.first}">📋 Copier mon bilan de la semaine</button>
    <p class="hint center-hint">Chiffres du sprint ${reviewTarget.number} + tes 3 réponses, prêts à coller dans Claude.</p>
  </section>`;
}

function viewSettings() {
  const today = todayKey();
  const s = state.settings;
  const bk = backupStatus(state, today);
  const lastExp = bk.never ? null : bk.days;
  return `
  <section class="card">
    <div class="card-head"><h2>Thème</h2></div>
    <div class="row">${[['dark', '🌑 Noir'], ['light', '☀️ Clair'], ['auto', '⚙️ Auto']].map(([v, l]) => `<button class="seg ${s.theme === v ? 'on' : ''}" data-act="theme" data-v="${v}" aria-pressed="${s.theme === v}">${l}</button>`).join('')}</div>
  </section>
  <section class="card">
    <div class="card-head"><h2>Habitudes</h2></div>
    <p class="hint">5 au maximum. Un minimum doit être faisable en 2 minutes, même un mauvais jour. Les changements s’appliquent à partir d’aujourd’hui, les jours passés ne bougent pas.</p>
    ${state.habits.map((h, i) => `
      <fieldset class="habit-edit">
        <div class="habit-edit-top"><input class="emoji-in" data-habit="${i}" data-k="emoji" value="${esc(h.emoji ?? '')}" aria-label="Emoji" maxlength="4">
        <input data-habit="${i}" data-k="name" value="${esc(h.name)}" aria-label="Nom"></div>
        <input data-habit="${i}" data-k="min" value="${esc(h.min)}" aria-label="Minimum">
        <input data-habit="${i}" data-k="full" value="${esc(h.full)}" aria-label="Complet">
        <button class="btn ghost small" data-act="habit-del" data-i="${i}">Supprimer</button>
      </fieldset>`).join('')}
    <button class="btn" data-act="habit-add" ${state.habits.length >= 6 ? 'disabled' : ''}>Ajouter une habitude</button>
  </section>
  <section class="card">
    <div class="card-head"><h2>Règles « Si… alors… »</h2></div>
    <label>Une règle par ligne<textarea id="rules" rows="4">${esc(state.rules.join('\n'))}</textarea></label>
  </section>
  <section class="card">
    <div class="card-head"><h2>Réglages</h2></div>
    <div class="grid2">
      <label>Coucher cible<input type="time" data-setting="bedtimeTarget" value="${esc(s.bedtimeTarget)}"></label>
      <label>Écran cible (min/jour)<input type="number" step="15" data-setting="screenTarget" value="${s.screenTarget}"></label>
      <label>Poids cible (kg)<input type="number" step="0.5" data-setting="weightTarget" value="${s.weightTarget}"></label>
      <label>Date de départ<input type="date" data-setting="startDate" value="${s.startDate}" max="${today}"></label>
    </div>
  </section>
  <section class="card">
    <div class="card-head"><h2>Données</h2></div>
    <p class="hint">Tout reste sur cet appareil, rien n’est envoyé. Exporte chaque semaine : si le navigateur efface ses données, c’est ta seule sauvegarde.
    ${lastExp === null ? '<strong>Jamais exporté.</strong>' : lastExp > 7 ? `<strong>Dernier export il y a ${lastExp} jours.</strong>` : `Dernier export il y a ${lastExp} jour(s).`}</p>
    <div class="row">
      <button class="btn primary" data-act="export">Exporter (JSON)</button>
      <label class="btn">Importer<input type="file" id="import" accept="application/json" hidden></label>
      <button class="btn ghost" data-act="reset">Tout effacer</button>
    </div>
  </section>`;
}

// ---------- minuteurs ----------

function pomoRemaining() {
  const p = state.timers.pomo;
  return p.endAt ? Math.max(0, (p.endAt - Date.now()) / 1000) : p.remaining;
}

function tick() {
  const p = state.timers.pomo;
  if (p.endAt && Date.now() >= p.endAt) pomoDone();
  const pc = $('#pomo-clock');
  if (pc) pc.textContent = fmtClock(Math.ceil(pomoRemaining()));
  setRing('pomo-ring', 1 - pomoRemaining() / (p.mode === 'work' ? POMO_WORK : POMO_BREAK));
  const pl = $('#plant');
  if (pl && p.endAt) {
    const stage = Math.floor((1 - pomoRemaining() / POMO_WORK) * 50);
    if (pl.dataset.stage !== String(stage)) {
      pl.dataset.stage = stage;
      pl.innerHTML = plantSVG(stage / 50);
    }
  }

  const u = state.timers.urge;
  if (u.endAt && Date.now() >= u.endAt) {
    u.endAt = null;
    save();
    beep(2);
    toast('10 minutes tenues. Si l’envie est encore là, vas-y avec un minuteur. Sinon, continue.');
    if (currentTab() === 'focus') render();
  }
  const uc = $('#urge-clock');
  if (uc && u.endAt) uc.textContent = fmtClock(Math.ceil((u.endAt - Date.now()) / 1000));

  if (player?.endAt) {
    player.remaining = Math.max(0, Math.ceil((player.endAt - Date.now()) / 1000));
    const c = $('#player-clock');
    if (c) c.textContent = fmtClock(player.remaining);
    setRing('player-ring', 1 - (player.endAt - Date.now()) / 1000 / player.steps[player.i].secs);
    if (player.remaining <= 3 && player.remaining > 0 && player.lastBeep !== player.remaining) {
      player.lastBeep = player.remaining;
      navigator.vibrate?.(60);
      tone(660, 0.09); // 3, 2, 1…
    }
    if (player.remaining === 0) {
      beep(1);
      playerGoto(player.i + 1);
    }
  }
  document.title = p.endAt ? `${fmtClock(Math.ceil(pomoRemaining()))} · Cap` : 'Cap';
}

function pomoDone() {
  const p = state.timers.pomo;
  const today = todayKey();
  if (p.mode === 'work') {
    const d = day(today);
    d.focus = (d.focus ?? 0) + 1;
    raiseHabit(today, 'focus', d.focus >= 4 ? 2 : 1);
    p.mode = 'break';
    p.remaining = POMO_BREAK;
    celebrate('Session terminée 🌳 5 minutes de pause, loin de l’écran.');
  } else {
    p.mode = 'work';
    p.remaining = POMO_WORK;
    toast('Pause finie. On repart ?');
  }
  p.endAt = null;
  save();
  beep(2);
  keepAwake(false);
  if (currentTab() === 'focus') render();
}

// ---------- événements ----------

const actions = {
  habit(el) {
    const today = todayKey();
    const before = chain(state, today).count;
    const d = day(today);
    const lvl = Number(el.dataset.lvl);
    d.habits[el.dataset.id] = (d.habits[el.dataset.id] ?? 0) === lvl ? 0 : lvl;
    save();
    render();
    if (dayStatus(state, today).valid && chain(state, today).count > before) celebrate('Journée validée 🔥 Chaîne +1');
  },
  'start-workout'(el, e) {
    e.preventDefault();
    location.hash = 'sport';
    startWorkout(el.dataset.id);
  },
  level(el) {
    state.settings.level = Number(el.dataset.lvl);
    save();
    render();
  },
  'player-toggle'() {
    if (!player || player.done) return;
    if (player.endAt) {
      player.remaining = Math.ceil((player.endAt - Date.now()) / 1000);
      player.endAt = null;
    } else {
      player.endAt = Date.now() + player.remaining * 1000;
    }
    renderPlayer();
  },
  'player-next'() { if (player && !player.done) playerGoto(player.i + 1); },
  'player-prev'() { if (player && !player.done) playerGoto(player.i - 1); },
  feel(el) {
    state.feels = [...state.feels, { date: todayKey(), id: player.workout.id, v: el.dataset.v }].slice(-60);
    save();
    player = null;
    renderPlayer();
    render();
  },
  protein(el) {
    const d = day(todayKey());
    d.protein = Math.max(0, (d.protein ?? 0) + Number(el.dataset.v));
    save();
    render();
    if (d.protein === PROTEIN_TARGET && el.dataset.v === '1') celebrate('Objectif protéines atteint 💪');
  },
  'me-tab'(el) {
    state.ui.meTab = el.dataset.id;
    save();
    if (el.dataset.go && currentTab() !== el.dataset.go) location.hash = el.dataset.go;
    else render();
    window.scrollTo(0, 0);
  },
  'read-toggle'() {
    const today = todayKey();
    const d = day(today);
    d.read = !d.read;
    if (d.read) raiseHabit(today, 'apprendre', 1);
    save();
    render();
    if (d.read) toast('Lecture notée 📖');
  },
  'card-flip'() {
    rev.flipped = true;
    render();
  },
  'card-answer'(el) {
    const today = todayKey();
    const id = rev.queue.shift();
    const card = deck().find((c) => c.id === id);
    const ok = el.dataset.ok === '1';
    const { box, due, seen } = reviewCard(card, ok, today);
    state.srs[id] = { box, due, seen };
    if (ok) {
      const d = day(today);
      d.cardsOk = (d.cardsOk ?? 0) + 1;
    } else {
      rev.queue.push(id);
    }
    rev.flipped = false;
    if (!rev.queue.length) {
      raiseHabit(today, 'apprendre', 1);
      celebrate('Révisions terminées 🧠');
    }
    save();
    render();
  },
  'card-add'() {
    const front = $('#card-front').value.trim();
    const back = $('#card-back').value.trim();
    if (!front || !back) return toast('Question et réponse obligatoires.');
    const id = `U:${Date.now().toString(36)}`;
    state.myCards.push({ id, cat: $('#card-cat').value, front, back });
    rev.queue?.push(id);
    save();
    render();
    toast('Carte ajoutée. Elle revient aujourd’hui, puis de plus en plus espacée.');
  },
  'card-del'(el) {
    const c = state.myCards[Number(el.dataset.i)];
    if (!confirm(`Supprimer « ${c.front} » ?`)) return;
    state.myCards.splice(Number(el.dataset.i), 1);
    delete state.srs[c.id];
    save();
    render();
  },
  'book-status'(el) {
    const id = el.dataset.id;
    const cur = state.books[id]?.status;
    const next = el.dataset.v === cur ? undefined : el.dataset.v;
    state.books[id] = { ...state.books[id], status: next, [`${next}At`]: next ? todayKey() : undefined };
    if (!next) delete state.books[id];
    save();
    render();
    if (next === 'done') celebrate('Livre terminé 📚 +50 XP');
  },
  'setup-toggle'(el) {
    state.setup[el.dataset.id] = !state.setup[el.dataset.id];
    save();
    render();
  },
  theme(el) {
    state.settings.theme = el.dataset.v;
    save();
    applyTheme();
    render();
  },
  'player-stop'() {
    if (!confirm('Arrêter la séance ? Elle ne sera pas enregistrée.')) return;
    player = null;
    keepAwake(false);
    renderPlayer();
  },
  'pomo-toggle'() {
    const p = state.timers.pomo;
    if (p.endAt) {
      p.remaining = pomoRemaining();
      p.endAt = null;
      keepAwake(false);
    } else {
      p.endAt = Date.now() + p.remaining * 1000;
      keepAwake(true);
      audioCtx ??= new AudioContext();
    }
    save();
    render();
  },
  'pomo-reset'() {
    const p = state.timers.pomo;
    p.endAt = null;
    p.remaining = p.mode === 'work' ? POMO_WORK : POMO_BREAK;
    keepAwake(false);
    save();
    render();
  },
  'pomo-skip'() {
    const p = state.timers.pomo;
    p.mode = p.mode === 'work' ? 'break' : 'work';
    p.endAt = null;
    p.remaining = p.mode === 'work' ? POMO_WORK : POMO_BREAK;
    save();
    render();
  },
  'snack-ask'() {
    snackCard.pending = true;
    render();
  },
  'snack-cancel'() {
    snackCard.pending = false;
    render();
  },
  'snack-log'(el) {
    const d = day(todayKey());
    const now = new Date();
    d.snacks = [...(d.snacks ?? []), { time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`, trigger: el.dataset.t }];
    snackCard.pending = false;
    save();
    render();
  },
  'snack-resist'() {
    const d = day(todayKey());
    d.snackResisted = (d.snackResisted ?? 0) + 1;
    save();
    render();
    toast('Noté. Une envie résistée, c’est une vraie victoire.');
  },
  'test-save'() {
    const vals = {};
    for (const f of ['pushups', 'plank', 'side', 'hollow']) {
      const v = $(`#test-${f}`).value;
      if (v !== '') vals[f] = Number(v);
    }
    if (!Object.keys(vals).length) return toast('Remplis au moins un résultat.');
    const date = todayKey();
    state.tests = [...state.tests.filter((t) => t.date !== date), { date, ...vals }].sort((a, b) => a.date.localeCompare(b.date));
    save();
    render();
    toast('Test enregistré.');
  },
  'urge-start'() {
    const d = day(todayKey());
    d.urges = (d.urges ?? 0) + 1;
    state.timers.urge.endAt = Date.now() + URGE_DELAY * 1000;
    audioCtx ??= new AudioContext();
    save();
    render();
  },
  'urge-stop'() {
    state.timers.urge.endAt = null;
    save();
    render();
  },
  'habit-add'() {
    state.habits.push({ id: `h${Date.now().toString(36)}`, emoji: '⭐', name: 'Nouvelle habitude', min: 'Version 2 minutes', full: 'Version complète' });
    day(todayKey());
    save();
    render();
  },
  'habit-del'(el) {
    const h = state.habits[Number(el.dataset.i)];
    if (!confirm(`Supprimer « ${h.name} » ?`)) return;
    state.habits.splice(Number(el.dataset.i), 1);
    day(todayKey());
    save();
    render();
  },
  'copy-day'(el) {
    copyText(daySummary(state, todayKey()), el, 'Bilan du jour copié : colle-le dans Claude.');
  },
  'copy-week'(el) {
    copyText(weekSummary(state, el.dataset.first, todayKey()), el, 'Bilan de la semaine copié : colle-le dans Claude.');
  },
  'sheet-close'() {
    $('#sheet').hidden = true;
    $('#sheet').innerHTML = '';
  },
  export() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cap-sauvegarde-${todayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    state.settings.lastExport = new Date().toISOString();
    save();
    render();
    toast('Sauvegarde exportée ✓ Le fichier est dans tes téléchargements.');
  },
  reset() {
    if (!confirm('Tout effacer ? Exporte d’abord si tu veux garder tes données.')) return;
    if (!confirm('Vraiment ? C’est définitif.')) return;
    state = freshState();
    save();
    render();
  },
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const fn = actions[el.dataset.act] ?? money.actions[el.dataset.act];
  if (fn) fn(el, e);
});

document.addEventListener('change', (e) => {
  const el = e.target;
  if (money.onChange(el)) return;
  if (el.dataset.field) {
    const d = day(el.dataset.key);
    const num = ['weight', 'waist', 'screen', 'steps'].includes(el.dataset.field);
    const v = el.value === '' ? null : num ? Number(el.value) : el.value;
    if (v === null) delete d[el.dataset.field];
    else d[el.dataset.field] = v;
    save();
    if (currentTab() === 'suivi') render();
    else toast('Enregistré.');
  } else if (el.id === 'track-date') {
    viewTrack.key = el.value || todayKey();
    render();
  } else if (el.dataset.setting) {
    const k = el.dataset.setting;
    if (!el.value) return;
    state.settings[k] = ['screenTarget', 'weightTarget'].includes(k) ? Number(el.value) : el.value;
    save();
    toast('Réglage enregistré.');
  } else if (el.dataset.habit !== undefined) {
    state.habits[Number(el.dataset.habit)][el.dataset.k] = el.value.trim() || '—';
    save();
  } else if (el.dataset.review) {
    const n = el.dataset.review;
    state.reviews[n] = { ...state.reviews[n], [el.dataset.q]: el.value };
    save();
    toast('Bilan enregistré.');
  } else if (el.id === 'rules') {
    state.rules = el.value.split('\n').map((x) => x.trim()).filter(Boolean);
    save();
    toast('Règles enregistrées.');
  } else if (el.id === 'import' && el.files[0]) {
    importFile(el.files[0]);
    el.value = ''; // permet de choisir à nouveau le même fichier
  }
});

// Import : rien n'est remplacé tant que le fichier n'est pas vérifié et confirmé.
async function importFile(file) {
  const no = (why) => toast(`Import annulé, rien n’a changé. ${why}`, 6000);
  if (file.size > MAX_IMPORT) return no('Fichier trop gros pour être une sauvegarde Cap.');
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch {
    return no('Ce fichier n’est pas un export de Cap (JSON illisible).');
  }
  const check = validateBackup(data);
  if (!check.ok) return no(check.error);
  const { days, habits, first, last } = check.info;
  const when = (k) => fromKey(k).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  const range = first ? ` (du ${when(first)} au ${when(last)})` : '';
  if (!confirm(`Sauvegarde vérifiée : ${days} jour${days > 1 ? 's' : ''}${range}, ${habits} habitude${habits > 1 ? 's' : ''}.\n\nRemplacer TOUTES les données de cet appareil par ce fichier ?`)) return;
  delete data.timers; // un minuteur en cours au moment de l'export ne doit pas repartir
  try {
    localStorage.setItem(STORE, JSON.stringify(data));
  } catch {
    return no('Stockage du navigateur plein.');
  }
  state = load();
  applyTheme();
  render();
  toast('Import réussi ✓');
}

document.addEventListener('input', (e) => {
  if (money.onInput(e.target)) return;
  if (e.target.id === 'pomo-label') {
    state.timers.pomo.label = e.target.value;
    save();
  }
});

// Sections repliées : on retient celles que tu ouvres ; l'animation ne joue
// que lorsque tu ouvres toi-même (pas à chaque nouvel affichage).
document.addEventListener('toggle', (e) => {
  const id = e.target.dataset?.fold;
  if (!id) return;
  if (e.target.open && !openFolds.has(id)) {
    openFolds.add(id);
    e.target.classList.add('opening');
  } else if (!e.target.open) {
    openFolds.delete(id);
  }
}, true);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('#sheet').hidden) actions['sheet-close']();
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    if (player?.endAt || state.timers.pomo.endAt) keepAwake(true);
    tick();
  }
});

window.addEventListener('hashchange', () => {
  viewTrack.key = null;
  if (currentTab() === 'revision') {
    rev.queue = null;
    rev.flipped = false;
  }
  if (currentTab() !== 'argent') state.ui.lesson = null;
  render();
  window.scrollTo(0, 0);
});

// ---------- démarrage ----------

$('#tabs').innerHTML = TABS.map((t) => `<a href="#${t.id}" data-tab="${t.id}"><span class="tab-ico" aria-hidden="true">${t.icon}</span>${t.label}</a>`).join('');
state.ui.lastLevel = Math.max(state.ui.lastLevel ?? 1, levelInfo(totalXP(state)).level);
save();
render();
setInterval(tick, 250);
// Le changement de jour (4 h) se voit sans recharger.
let shownDay = todayKey();
setInterval(() => {
  if (todayKey() !== shownDay) {
    shownDay = todayKey();
    render();
  }
}, 60000);

navigator.storage?.persist?.();
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch(() => { /* hébergeur sans service worker */ });
}
