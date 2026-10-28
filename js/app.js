import {
  todayKey, addDays, diffDays, fromKey, dayStatus, chain, lastNDays,
  sprintInfo, bedtimeMinutes, minutesToHHMM, sleepDuration, rollingAverage, series,
  SPRINT_COUNT, SPRINT_PASS, SPRINT_LENGTH, totalXP, levelInfo, weekNumber, weeklyBedtime, todayNotice,
  dueCards, reviewCard, increased, previous, snackTriggers, regularityGrid, bookShelves, nextAction, retireHabits,
  sessionKcal, lastValue, DEFAULT_WEIGHT, proteinGrams, goalOf, nextTarget, logRecord, beatBy, combien, logChoices, toLog, recordKey, spokenStep, dropRecords, creatineWeek,
  recordWall, wakePlan, bedGoal, clockFr, WAKE_PLAN, kcalTarget, mealTotals, addMeal, STEP_CHOICES, nearestSteps, nbsp,
} from './logic.js';
import {
  DEFAULT_HABITS, DEFAULT_RULES, WORKOUTS, WEEK_PLAN, SNACK_TRIGGERS, FOOD_RULES, RECIPES, demoUrl, baseName,
  DAY_PLAN, FOOD_COLORS, FOOD_TREATS, SNACKS, SNACK_TEST, TEA_TIPS,
  WARMUP, PROTEIN_GRAMS, PROTEIN_CHIPS, FOODS, FOOD_CATS, PHASES, MILESTONES, BOOKS, APPS, HELP,
} from './data.js';
import { ALL_LESSONS } from './finance-data.js';
import { createMoney, DEFAULT_CALC, DEFAULT_WEALTH } from './money.js';
import { quoteOfDay } from './quotes.js';
import { daySummary, weekSummary } from './summary.js';
import { backupStatus, validateBackup } from './backup.js';
import { figureFor, figureSVG, focusFor } from './figures.js';
import { icon } from './icons.js';
import { roomSVG } from './room.js';
import { hubSVG, hubLayout, HUB, covers } from './gym.js';
import { avatarParams, avatarSVG, evolved, STAGES, STAGE_GAINS } from './avatar.js';
import { treeSVG, seedOf } from './tree.js';

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
      wakeTarget: '08:30', // réveil visé au bout du réveil progressif
      wakePlanStart: null, // jour du 1er réveil visé (null : plan pas lancé)
      screenTarget: 180,
      weightTarget: 70,
      level: 1,
      lastExport: null,
      theme: 'dark',
      voice: false, // coach vocal pendant la séance
      voiceURI: 'auto',
      creatine: true, // case « Créatine » sous les habitudes, hors chaîne
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
    records: {},
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
    // Habitudes retirées (téléphone, focus) : une seule fois, historique intact.
    if (retireHabits(st, todayKey())) localStorage.setItem(STORE, JSON.stringify(st));
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
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0c0a09' : '#f3eee7');
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
// Chronomètre de séance : « 18 » sous une minute (lisible du sol), « 1:15 » au-delà.
const fmtStep = (secs) => (secs < 60 ? String(Math.max(0, Math.ceil(secs))) : `${Math.floor(secs / 60)}:${String(Math.floor(secs % 60)).padStart(2, '0')}`);
const fmtDuration = (mins) => `${Math.floor(mins / 60)} h ${String(Math.round(mins % 60)).padStart(2, '0')}`;
const longDate = (key) => fromKey(key).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

function toast(msg, ms = 3200) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.remove('out');
  t.style.animation = 'none';
  void t.offsetWidth; // rejoue l'entrée si un message en remplace un autre
  t.style.animation = '';
  t.hidden = false;
  clearTimeout(toast.h);
  toast.h = setTimeout(() => {
    t.classList.add('out');
    toast.h = setTimeout(() => (t.hidden = true), 220);
  }, ms);
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
      btn.innerHTML = `${icon('check')}Copié`;
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = label;
      }, 1800);
    }
  } catch {
    showSheet(text);
  }
}

// Fenêtre qui monte du bas (titre + contenu HTML déjà échappé).
let sheetOpener = null; // bouton qui a ouvert la fiche : il retrouve le focus à la fermeture

function openSheet(title, body) {
  const el = $('#sheet');
  sheetOpener = document.activeElement;
  el.innerHTML = `<div class="sheet-back" data-act="sheet-close"></div>
    <div class="sheet-panel" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
      <div class="card-head"><h2 id="sheet-title">${title}</h2><button class="btn ghost small" data-act="sheet-close">Fermer</button></div>
      ${body}
    </div>`;
  el.hidden = false;
  $('#view').inert = true; // le clavier reste dans la fiche
  $('#tabs').inert = true;
  $('.sheet-panel [data-act="sheet-close"]', el).focus();
}

function showSheet(text) {
  openSheet('Texte à copier', `<p class="hint">La copie automatique n’a pas marché : appuie longuement dans le texte, puis « Tout sélectionner » et « Copier ».</p>
      <textarea readonly rows="12">${esc(text)}</textarea>`);
  const ta = $('#sheet textarea');
  ta.focus();
  ta.select();
}

// Aide « ? » d'un onglet : 3 phrases, rien de plus.
const helpBtn = (tab) => `<button class="help-btn" data-act="help" data-id="${tab}" aria-label="Aide : comment marche cet onglet">?</button>`;

function showHelp(tab) {
  const h = HELP[tab];
  if (h) openSheet(h.title, `<ol class="help-list">${h.lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ol>`);
}

// Fiche « Ton double » : palier, ce qui le fait évoluer, prochain gain.
function showAvatar() {
  const lv = levelInfo(totalXP(state));
  const ch = chain(state, todayKey()).count;
  const av = avatarParams(lv.level, ch);
  openSheet('Ton double', `<div class="avatar-sheet">
      <div class="avatar-big">${avatarSVG(av, { animate: !reduceMotion() })}</div>
      <div><p class="eyebrow">Palier ${av.stage + 1}/${STAGES}</p><p class="avatar-rank">${esc(av.rank)}</p>
        <p class="hint">Niveau ${lv.level} · ${lv.into}/${lv.span} XP · aura ${av.charge} %</p></div>
    </div>
    <p>${av.nextLevel ? `Au niveau ${av.nextLevel} : <strong>${esc(av.nextGain)}</strong>` : '<strong>Dernier palier atteint.</strong> Garde la chaîne pour garder l’aura.'}</p>
    <ol class="avatar-steps">${STAGE_GAINS.map((g, i) => `<li class="${i <= av.stage ? 'done' : ''}">${esc(g)}</li>`).join('')}</ol>
    <p class="hint">Il évolue avec ton niveau : chaque minimum, séance, session de focus, leçon ou livre lui fait gagner de l’XP. Son aura suit ta chaîne (pleine à 3 semaines). Ce n’est pas une prédiction de ton corps : c’est le reflet de ta régularité.</p>`);
}

let audioCtx;

// Coach vocal (désactivé par défaut) : les voix du téléphone, sans internet,
// rien n'est envoyé. L'iPhone n'accepte de parler qu'après un appui : le
// premier mot part du bouton « Lancer la séance ».
const synth = typeof speechSynthesis === 'undefined' ? null : speechSynthesis;
const frVoices = () => (synth?.getVoices() ?? []).filter((v) => v.lang?.toLowerCase().startsWith('fr'));
function say(text, force = false) {
  if (!synth || !text || (!force && !state.settings.voice)) return;
  try {
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'fr-FR';
    const v = frVoices().find((x) => x.voiceURI === state.settings.voiceURI);
    if (v) u.voice = v;
    synth.speak(u);
  } catch { /* la voix ne doit jamais bloquer la séance */ }
}
const hush = () => synth?.cancel();
synth?.addEventListener?.('voiceschanged', () => { if (document.querySelector('[data-setting="voiceURI"]')) render(); });
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

// ---------- animations ----------
// `seen` retient ce qui était affiché pour n'animer que ce qui vient de changer ;
// `tweens` donne le point de départ des barres et anneaux qui glissent.
// Mémoire d'écran seulement : rien n'est enregistré.
const seen = new Map();
const tweens = new Map();
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Bonhomme animé d'un exercice, cadré sur son mouvement, muscle travaillé en
// or (immobile si le téléphone demande de réduire les animations).
// help=false (vignettes de la liste) : sans contour d'arrivée ni flèche, trop
// petits pour être lus et plus longs à calculer.
function figure(name, target, help = true) {
  const f = name && figureFor(name);
  return f ? figureSVG(f.fig, { mirror: f.mirror, fit: true, animate: !reduceMotion(), focus: focusFor(target), help }) : '';
}

// Le bonhomme du lecteur, dans ta salle : le décor (mur, spots, bande LED,
// parquet) passe derrière lui et il a les pieds sur le parquet. Au début de
// la séance, les spots s'allument (rien si on réduit les animations).
let seanceRoom;
function stageFig(fig, lights) {
  if (!fig) return '<div class="player-fig"></div>';
  seanceRoom ??= roomSVG({ w: 390, h: 210, floor: 0.6, id: 'seance' });
  return `<div class="player-fig"><div class="player-room${lights ? ' lights' : ''}" aria-hidden="true">${seanceRoom}</div>${fig}</div>`;
}

// Barre qui glisse de sa valeur précédente (%) vers la nouvelle.
function tweenBar(key, pct) {
  return `<span style="width:${previous(tweens, key, pct, 0)}%" data-to="${pct}"></span>`;
}

// Après chaque affichage : on fige l'état de départ, puis on lance les transitions.
function runTweens() {
  const els = document.querySelectorAll('#view [data-to], #view [data-to-offset]');
  if (!els.length) return;
  document.body.getBoundingClientRect();
  for (const el of els) {
    if (el.dataset.to !== undefined) el.style.width = `${el.dataset.to}%`;
    else el.setAttribute('stroke-dashoffset', el.dataset.toOffset);
  }
}

// Pastille de l'onglet actif qui glisse d'un onglet à l'autre.
function moveTabIndicator(instant = false) {
  const ind = $('#tabs .tab-ind');
  const a = $('#tabs a[aria-current="page"]');
  if (!ind) return;
  ind.style.opacity = a ? '1' : '0';
  if (!a) return;
  if (instant) ind.style.transition = 'none';
  ind.style.width = `${a.offsetWidth}px`;
  ind.style.transform = `translateX(${a.offsetLeft}px)`;
  if (instant) {
    ind.getBoundingClientRect();
    ind.style.transition = '';
  }
}

// Changement d'écran : glisse vers la gauche ou la droite (View Transitions si
// le navigateur sait faire, sinon simple entrée en fondu).
function swap(update, dir) {
  if (!dir || reduceMotion()) return update();
  document.documentElement.dataset.dir = dir;
  if (document.startViewTransition) {
    document.startViewTransition(update);
    return;
  }
  update();
  const v = $('#view');
  v.classList.remove('enter-fwd', 'enter-back');
  void v.offsetWidth;
  v.classList.add(`enter-${dir}`);
}

function ring(done, total) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const f = total ? done / total : 0;
  const from = previous(tweens, 'ring', f, 0);
  return `<svg class="ring" viewBox="0 0 72 72" aria-hidden="true">
    <circle cx="36" cy="36" r="${r}" class="ring-bg"/>
    <circle cx="36" cy="36" r="${r}" class="ring-fg" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - from)}" data-to-offset="${c * (1 - f)}"/>
  </svg><span class="ring-txt">${done}/${total}</span>`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 4 || h >= 22) return 'Il est tard. Téléphone hors de la chambre ?';
  if (h < 12) return 'Bonjour. Les minimums d’abord.';
  if (h < 18) return 'Bon après-midi. Où en es-tu ?';
  return 'Bonsoir. Dernière ligne droite.';
}

// 4 onglets, la Salle d'abord (c'est l'onglet le plus utilisé). Les icônes au
// trait sont dessinées dans luxe.css ; l'emoji ne sert que si elle manque.
const TABS = [
  { id: 'sport', label: 'Salle', icon: '🏋️' },
  { id: 'jour', label: 'Jour', icon: '☀️' },
  { id: 'manger', label: 'Manger', icon: '🍽️' },
  { id: 'moi', label: 'Moi', icon: '🧭' },
];
// Pages sans onglet, et l'onglet allumé quand on y est : Argent et ses
// révisions vivent dans Moi ; le minuteur de focus (onglet retiré) reste
// joignable par #focus, ses données sont intactes.
const HIDDEN_TABS = { argent: 'moi', revision: 'moi', focus: 'jour' };

function currentTab() {
  const h = location.hash.slice(1) === 'bilan' ? 'moi' : location.hash.slice(1);
  return TABS.some((t) => t.id === h) || HIDDEN_TABS[h] ? h : 'sport';
}

let renders = 0; // nombre d'affichages : distingue un réaffichage sur place d'une arrivée

function render() {
  renders++;
  const tab = currentTab();
  const views = { jour: viewToday, focus: viewFocus, sport: viewSport, manger: viewFood, argent: viewMe, moi: viewMe, revision: viewRevision };
  const me = ['Moi', 'Programme, bilan, argent, livres, réglages'];
  const heads = {
    focus: ['Focus', 'Une seule chose à la fois'],
    sport: ['Salle', 'Ta séance, tes postes, tes records'],
    manger: ['Manger', 'Ta journée type, des conseils, des recettes'],
    argent: me,
    moi: me,
    revision: ['Révisions', 'Chaque carte revient juste avant l’oubli'],
  };
  const h = heads[tab];
  const helpKey = HIDDEN_TABS[tab] ?? tab;
  const head = h && !(tab === 'argent' && state.ui.lesson) ? `<header class="page-head"><div class="page-title"><h1>${h[0]}</h1>${HELP[helpKey] ? helpBtn(helpKey) : ''}</div><p>${h[1]}</p></header>` : '';
  $('#view').innerHTML = head + views[tab]();
  $('#view').dataset.tab = tab;
  const lv = levelInfo(totalXP(state));
  if (lv.level > (state.ui.lastLevel ?? 1)) {
    const grew = evolved(state.ui.lastLevel ?? 1, lv.level);
    state.ui.lastLevel = lv.level;
    save();
    celebrate(`Niveau ${lv.level} atteint : ${lv.rank}${grew ? ' · ton double évolue' : ''}`);
  }
  document.querySelectorAll('#tabs a').forEach((a) => a.setAttribute('aria-current', a.dataset.tab === (HIDDEN_TABS[tab] ?? tab) ? 'page' : 'false'));
  moveTabIndicator();
  hubDeclutter();
  runTweens();
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
  restart: [icon('alert'), 'Deuxième raté de la semaine.', 'Une seule reprise par semaine : la chaîne repart de zéro. Fais les minimums, sans culpabilité, et note dans le bilan ce qui t’a fait rater.'],
  twoMissed: [icon('sprout'), 'Deux jours ratés.', 'Pas de rattrapage : seulement les minimums aujourd’hui. Une journée minimum vaut mieux qu’une journée parfaite qui n’existe pas.'],
  recovery: [icon('refresh'), 'Jour de reprise.', 'Jamais deux fois de suite : fais les minimums, idéalement avant midi, et la chaîne continue.'],
  minimumDay: [icon('battery-low'), 'Jour minimum prévu.', '3ᵉ jour du sprint, celui où l’enthousiasme retombe : seuls les minimums comptent, c’est voulu.'],
  valid: [icon('check-circle'), 'Journée validée.', 'Les minimums sont faits. Le complet est un bonus, pas une obligation.'],
  full: [icon('trophy'), 'Tout en complet.', 'Bravo. Maintenant, repose-toi.'],
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
  const prot = proteinGrams(d);
  const snacks = d.snacks?.length ?? 0;
  const week = weekNumber(state, today);
  const grid = regularityGrid(state, today);
  const wake = wakePlan(state.settings.wakePlanStart, today, state.settings.wakeTarget);
  return `
  <header class="hero">
    <div class="hero-top">
      <div><p class="eyebrow">${esc(longDate(today))}${helpBtn('jour')}</p><p class="greet">${greeting()}</p></div>
      <div class="ring-wrap ${st.valid ? 'done' : ''} ${increased(seen, 'valid', st.valid ? 1 : 0) ? 'just' : ''}">${ring(st.done, st.total)}</div>
    </div>
    <div class="hero-main">
      <button class="avatar-btn ${increased(seen, 'stage', avatarParams(lv.level).stage) ? 'just' : ''}" data-act="avatar" aria-label="Ton double : ${esc(lv.rank)}, voir comment il évolue">${avatarSVG(avatarParams(lv.level, ch.count), { animate: !reduceMotion() })}</button>
      <div class="hero-side">
        <div class="hero-stat"><span class="big ${increased(seen, 'chain', ch.count) ? 'bump' : ''}">${icon('flame')}${ch.count}</span><span class="lbl">jour${ch.count > 1 ? 's' : ''} de chaîne${ch.jokers ? ` · ${ch.jokers} reprise${ch.jokers > 1 ? 's' : ''}` : ''}</span></div>
        <div class="hero-stat"><span class="mid">${icon('flag')}Sprint ${sp.current.number}<small>/${SPRINT_COUNT}</small></span><span class="lbl">jour ${sprintDay}/7 · ${sp.current.valid} validé${sp.current.valid > 1 ? 's' : ''}</span></div>
        <div class="level">
          <span class="badge">Niv. ${lv.level}</span><span class="rank">${lv.rank}</span>
          <div class="xpbar">${tweenBar('xp', (lv.into / lv.span) * 100)}</div>
          <span class="xp">${lv.into}/${lv.span} XP</span>
        </div>
      </div>
    </div>
    ${dots(last7)}
    ${notice ? `<p class="hero-note"><span aria-hidden="true">${notice[0]}</span><span><strong>${notice[1]}</strong> ${notice[2]}</span></p>` : ''}
  </header>
  ${backupBanner(today)}
  ${planCard(today)}
  <div class="folds">
    ${fold('urge', icon('phone-off'), 'Envie de scroller ?', state.timers.urge.endAt ? 'Minuteur en cours' : d.urges ? `${d.urges} envie${d.urges > 1 ? 's' : ''} retardée${d.urges > 1 ? 's' : ''} aujourd’hui` : 'J’attends 10 min avant d’ouvrir', '<span></span>', urgeBody(state.timers.urge))}
    ${fold('habits', icon('check-circle'), 'Habitudes', toDo ? `${toDo} à faire · min ou complet` : 'Toutes faites', `<span class="pill ${toDo ? '' : 'ok'}">${st.done}/${st.total}</span>`, `
      <ul class="habits">
        ${state.habits.map((h) => {
          const lvl = d.habits?.[h.id] ?? 0;
          return `<li class="habit lvl-${lvl} ${increased(seen, `habit:${h.id}`, lvl) ? 'just' : ''}">
            <span class="habit-ico" aria-hidden="true">${lvl ? '✓' : esc(h.emoji ?? '•')}</span>
            <div class="habit-text"><strong>${esc(h.name)}</strong>
              <span>${esc(lvl === 2 ? h.full : h.min)}</span></div>
            <div class="habit-btns">
              <button class="seg ${lvl === 1 ? 'on' : ''}" data-act="habit" data-id="${h.id}" data-lvl="1" aria-pressed="${lvl === 1}">Min</button>
              <button class="seg ${lvl === 2 ? 'on' : ''}" data-act="habit" data-id="${h.id}" data-lvl="2" aria-pressed="${lvl === 2}">Complet</button>
            </div></li>`;
        }).join('')}
        ${state.settings.creatine ? creatineRow(today, d) : ''}
      </ul>
      <details class="more"><summary>Ce que valent « Min » et « Complet »</summary>
        <ul class="tight">${state.habits.map((h) => `<li><strong>${esc(h.name)}</strong> · min : ${esc(h.min)} · complet : ${esc(h.full)}</li>`).join('')}</ul>
        <p class="hint">La journée est validée dès que tous les minimums sont faits.</p></details>`)}
    ${fold('food', icon('utensils'), 'Alimentation', `Protéines · ${snacks ? `${snacks} grignotage${snacks > 1 ? 's' : ''}` : 'aucun grignotage'}`, `<span class="pill ${prot >= PROTEIN_GRAMS ? 'ok' : ''}">${prot} g</span>`, snackCard(today))}
    ${fold('night', icon('moon'), 'Nuit dernière', wake ? `Coucher\u00a0${clockFr(wake.bed)} · réveil\u00a0${clockFr(wake.nextWake)}` : `Ce soir : couché à ${weeklyBedtime(week, state.settings.bedtimeTarget)}`, `<span class="pill">${d.bed && d.wake ? fmtDuration(sleepDuration(d.bed, d.wake)) : 'à noter'}</span>`, `
      <div class="grid2">
        <label>Couché à<input type="time" data-field="bed" data-key="${today}" value="${esc(d.bed ?? '')}"></label>
        <label>Levé à<input type="time" data-field="wake" data-key="${today}" value="${esc(d.wake ?? '')}"></label>
      </div>
      ${wake ? wakeBody(wake) : `<p class="hint">Cible de la semaine ${week} : couché à <strong>${weeklyBedtime(week, state.settings.bedtimeTarget)}</strong>, levé à heure fixe. On avance de 15 min par semaine jusqu’à ${esc(state.settings.bedtimeTarget)}.</p>
      <div class="wake">
        <p><strong>${icon('alarm')} Réveil progressif</strong> : debout à ${clockFr(WAKE_PLAN.from)}, puis ${WAKE_PLAN.step} min plus tôt tous les ${WAKE_PLAN.every} jours jusqu’à ${clockFr(state.settings.wakeTarget)}. Le coucher suit tout seul.</p>
        <button class="btn primary small" data-act="wake-start">Commencer demain matin</button>
      </div>`}`)}
    ${fold('heat', icon('calendar'), 'Régularité', '12 semaines d’un coup d’œil', `<span class="pill">${grid.valid}/${grid.elapsed}</span>`, heatmap(grid))}
    ${fold('rules', icon('compass'), 'Mes règles', '« Si… alors… »', `<span class="pill">${state.rules.length}</span>`, `<ul class="rules">${state.rules.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
      <p class="hint">Modifie-les dans Moi > Réglages.</p>`)}
    ${fold('quote', icon('message'), 'Pensée du jour', esc(q.author), '<span></span>', `<blockquote class="quote"><p>« ${esc(q.text)} »</p><cite>${esc(q.author)}</cite></blockquote>`)}
  </div>`;
}

// Réveil progressif : les réveils successifs (passés, celui de demain, à
// venir), ce soir et demain matin, et comment tenir.
function wakeBody(p) {
  return `<div class="wake">
    <p class="eyebrow">${icon('alarm')} Réveil progressif · ${p.day >= 1 ? `jour ${p.day}` : 'commence demain'}</p>
    <ol class="wake-steps">${p.steps.map((s, i) => `<li class="${i < p.stage ? 'past' : i === p.stage ? 'now' : ''}"${i === p.stage ? ' aria-current="step"' : ''}>${clockFr(s)}</li>`).join('')}</ol>
    <p>Ce soir : au lit avant <strong>${clockFr(p.bed)}</strong>. Demain : debout à <strong>${clockFr(p.nextWake)}</strong>, week-end compris.</p>
    <p class="hint">${p.reached ? 'Cible atteinte : garde ces heures, 7 jours sur 7.' : '30 min plus tôt tous les 3 jours.'} Au réveil, 10 min de lumière du jour, dehors ou à la fenêtre. Nuit ratée ? Lève-toi quand même à l’heure : c’est le réveil qui recale le corps.</p>
    <button class="btn ghost small" data-act="wake-stop">Arrêter le plan</button>
  </div>`;
}

// Calendrier de régularité : une colonne par semaine du programme, une case
// par jour (raté, minimum, complet ; point = séance A, B ou C).
function heatmap(g, enter = false) {
  const start = state.settings.startDate;
  const letters = Array.from({ length: SPRINT_LENGTH }, (_, i) => fromKey(addDays(start, i)).toLocaleDateString('fr-FR', { weekday: 'narrow' }));
  const words = { full: 'tout en complet', min: 'validé', miss: 'raté', now: 'aujourd’hui', future: 'à venir' };
  return `<div class="heat ${enter ? 'enter' : ''}" style="--weeks:${g.weeks.length}" role="img" aria-label="${g.valid} jours tenus sur ${g.elapsed}">
      <div class="heat-days" aria-hidden="true">${letters.map((l) => `<span>${l}</span>`).join('')}<span></span></div>
      ${g.weeks.map((w, wi) => `<div class="heat-col">${w.days.map((d, di) => `<i class="cell ${d.level}${d.today ? ' today' : ''}${d.sport ? ' sport' : ''}" style="--i:${wi + di * 2}" title="${fromKey(d.key).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} : ${words[d.level]}${d.sport ? ' · séance' : ''}"></i>`).join('')}<small class="heat-res">${w.finished && w.passed ? '✓' : w.number % 2 ? w.number : ''}</small></div>`).join('')}
    </div>
    <div class="heat-legend"><span><i class="cell miss"></i>Raté</span><span><i class="cell min"></i>Minimum</span><span><i class="cell full"></i>Complet</span><span><i class="cell min sport"></i>Séance</span></div>
    <p class="hint">${g.valid} jour${g.valid > 1 ? 's' : ''} tenu${g.valid > 1 ? 's' : ''} sur ${g.elapsed} · meilleure série ${g.best} · ${g.full} en complet. Sous chaque semaine : ✓ si le sprint est réussi (5/7).</p>`;
}

// Rappel de sauvegarde : visible seulement après 7 jours sans export.
function backupBanner(today) {
  const b = backupStatus(state, today);
  if (!b.overdue) return '';
  return `<div class="banner warn backup">
    <div><strong>${icon('download')} ${b.never ? `Aucune sauvegarde depuis ${b.days} jours` : `Dernière sauvegarde il y a ${b.days} jours`}</strong>
    <span>Un appui : le fichier reste sur ton téléphone, rien n’est envoyé.</span></div>
    <button class="btn small primary" data-act="export">Exporter</button>
  </div>`;
}

// ---------- Plan du jour : ce qu'il faut faire, dans l'ordre ----------
function workoutMinutes(w) {
  return Math.round(buildSteps(w, state.settings.level).reduce((a, x) => a + x.secs, 0) / 60);
}

// Calories estimées, avec le dernier poids noté (sinon 70 kg).
function workoutKcal(w) {
  return sessionKcal(buildSteps(w, state.settings.level), w.met, lastValue(state, 'weight') ?? DEFAULT_WEIGHT);
}

// Chaque élément du plan : id, icône, titre, détail, fait ou non, et son
// bouton (go : texte + action ou lien), affiché petit dans la liste et en
// grand dans « Maintenant ».
function planItems(today) {
  const d = state.days[today] ?? {};
  const wo = WORKOUTS.find((w) => w.id === WEEK_PLAN[fromKey(today).getDay()]);
  const done = d.workouts ?? [];
  const items = [];
  items.push({
    id: 'seance', ico: icon('dumbbell'), title: `Séance ${wo.name.split(' · ')[1] ?? wo.name}`, sub: `≈ ${workoutMinutes(wo)} min · niveau ${state.settings.level}`,
    done: wo.id === 'M' ? done.length > 0 : done.some((x) => x !== 'M'),
    go: { label: 'Lancer', act: 'start-workout', id: wo.id },
  });
  const nextLesson = ALL_LESSONS.find((l, i) => (i === 0 || state.lessons[ALL_LESSONS[i - 1].id]) && !state.lessons[l.id]);
  const lessonToday = Object.values(state.lessons).some((l) => l.date && todayKey(new Date(l.date)) === today);
  if (nextLesson || lessonToday) {
    items.push({
      id: 'lecon', ico: icon('school'), title: lessonToday ? 'Leçon de finance faite' : `Leçon ${ALL_LESSONS.indexOf(nextLesson) + 1} : ${nextLesson.title}`, sub: '≈ 10-15 min · idée, exemple, exercice, quiz',
      done: lessonToday,
      go: nextLesson ? { label: lessonToday ? 'Suivante' : 'Ouvrir', act: 'lesson-open', id: nextLesson.id } : null,
    });
  }
  const all = deck();
  if (all.length) {
    const due = dueCards(all, today).length;
    items.push({ id: 'revision', ico: icon('cards'), title: due ? `Révisions : ${due} carte${due > 1 ? 's' : ''}` : 'Révisions à jour', sub: '≈ 5 min', done: due === 0, go: { label: due ? 'Réviser' : 'Cartes', href: '#revision' } });
  }
  items.push({ id: 'lecture', ico: icon('book-open'), title: 'Lire 10 pages', sub: 'Moi > Livres pour choisir', done: Boolean(d.read), go: { label: d.read ? 'Annuler' : 'Fait', act: 'read-toggle' } });
  return items;
}

// Bouton d'un élément du plan (lien ou action).
function goBtn(go, cls) {
  if (!go) return '';
  if (go.href) return `<a class="${cls}" href="${go.href}">${esc(go.label)}</a>`;
  const data = ['act', 'id', 'lvl', 'v'].filter((k) => go[k] !== undefined).map((k) => ` data-${k}="${esc(go[k])}"`).join('');
  return `<button class="${cls}"${data}>${esc(go.label)}</button>`;
}

// Heure actuelle « HH:MM ».
const nowHHMM = () => new Date().toTimeString().slice(0, 5);

function planCard(today) {
  const items = planItems(today);
  const n = items.filter((x) => x.done).length;
  const now = nextAction(items, nowHHMM(), null);
  // Le gros bouton dit « Lancer la séance », pas juste « Lancer ».
  const bigLabel = { seance: 'Lancer la séance', lecon: 'Ouvrir la leçon', focus: 'Aller au focus', lecture: 'J’ai lu 10 pages', proteines: '+1 portion', coucher: 'Téléphone posé' };
  return `<section class="card plan">
    <div class="card-head"><h2>Ton plan du jour</h2><span class="pill">${n}/${items.length}</span></div>
    <div class="bar">${tweenBar('plan', (n / items.length) * 100)}</div>
    ${now ? `<div class="now-card" data-now="${now.id}">
      <span class="now-ico" aria-hidden="true">${now.ico}</span>
      <div class="now-text"><p class="eyebrow">Maintenant</p><strong>${esc(now.title)}</strong><small>${esc(now.sub)}</small></div>
      ${goBtn(now.go && { ...now.go, label: bigLabel[now.id] ?? now.go.label }, 'btn primary wide now-go')}
    </div>` : `<div class="now-card all-done"><span class="now-ico" aria-hidden="true">${icon('sparkles')}</span><div class="now-text"><p class="eyebrow">Maintenant</p><strong>Tout est fait.</strong><small>Repose-toi, et copie ton bilan ce soir.</small></div></div>`}
    <ul class="todos">${items.map((x) => `<li class="todo ${x.done ? 'done' : ''} ${now && x.id === now.id ? 'is-now' : ''} ${increased(seen, `todo:${x.id}`, x.done ? 1 : 0) ? 'just' : ''}">
      <span class="todo-ico" aria-hidden="true">${x.done ? icon('check') : x.ico}</span>
      <div><strong>${esc(x.title)}</strong><small>${esc(x.sub)}</small></div>
      ${goBtn(x.go, 'todo-go')}</li>`).join('')}</ul>
    <button class="btn wide copy-btn" data-act="copy-day">${icon('copy')}Copier mon bilan du jour</button>
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
    : `<section class="card center">${icon('check-circle', 'big-ico')}<h2>C’est fait pour aujourd’hui</h2><p class="muted">${all.length} carte${all.length > 1 ? 's' : ''} au total. Reviens demain.</p></section>`}
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

// Une case à part : elle ne compte ni dans la chaîne ni dans les habitudes du jour.
function creatineRow(today, d) {
  const on = d.creatine === true;
  return `<li class="habit lvl-${on ? 1 : 0}">
    <span class="habit-ico" aria-hidden="true">${on ? '✓' : '💊'}</span>
    <div class="habit-text"><strong>Créatine</strong>
      <span>1 dose de 3 g · ${creatineWeek(state, today)}/7 cette semaine · hors chaîne</span></div>
    <div class="habit-btns"><button class="seg ${on ? 'on' : ''}" data-act="creatine" aria-pressed="${on}">${on ? 'Prise' : 'À prendre'}</button></div></li>`;
}

function snackCard(key) {
  const d = state.days[key] ?? {};
  const snacks = d.snacks ?? [];
  const resisted = d.snackResisted ?? 0;
  const pending = snackCard.pending;
  const prot = proteinGrams(d);
  return `
    <div class="protein">
      <div class="protein-head"><strong>Protéines</strong> <span class="muted">${prot}/${PROTEIN_GRAMS} g</span></div>
      <div class="bar">${tweenBar('protein', Math.min(100, (prot / PROTEIN_GRAMS) * 100))}</div>
    </div>
    <div class="chips protein-chips">${PROTEIN_CHIPS.map((id) => FOODS.find((f) => f.id === id)).map((f) => `<button class="chip" data-act="meal-add" data-f="${f.id}" aria-label="Noter ${esc(f.name)} (${esc(f.portion)}) : ${f.p} g de protéines, ${f.kcal} kcal">+ ${f.emoji} ${esc(f.short ?? f.name.split(' ')[0])} <small>${f.p} g</small></button>`).join('')}</div>
    ${mealUndo ? `<div class="row"><button class="btn ghost small" data-act="meal-undo">Annuler le dernier ajout (${esc(FOODS.find((f) => f.id === mealUndo)?.name ?? '')})</button></div>` : ''}
    ${(() => { const t = mealTotals(d.meals); return t.kcal ? `<p class="hint">Repas notés aujourd’hui : ≈ ${fmtInt(t.kcal)} kcal sur ${fmtInt(kcalTarget(d.steps))} · le détail est dans Manger.</p>` : ''; })()}
    <p class="hint">Vise ${PROTEIN_GRAMS} g par jour : c’est ce qui garde tes muscles pendant que tu sèches.</p>
    <div class="card-head sub"><h3>Grignotage</h3><span class="pill">${snacks.length} grignotage${snacks.length > 1 ? 's' : ''} · ${resisted} envie${resisted > 1 ? 's' : ''} résistée${resisted > 1 ? 's' : ''}</span></div>
    ${pending
      ? `<p class="hint">Qu’est-ce qui t’a donné envie ?</p><div class="chips">${SNACK_TRIGGERS.map((t) => `<button class="chip" data-act="snack-log" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div>
         <div class="row"><button class="btn ghost small" data-act="snack-cancel">Annuler</button></div>`
      : `<div class="row"><button class="btn" data-act="snack-resist">Envie résistée</button><button class="btn" data-act="snack-ask">J’ai grignoté</button></div>
         <p class="hint">Pas de culpabilité : note-le, c’est tout. Au bout d’une semaine tu verras tes heures et tes déclencheurs, et on attaque ceux-là.</p>`}
    ${snacks.length ? `<p class="hint">${snacks.map((x) => `${esc(x.time)} · ${esc(x.trigger)}`).join(' — ')}</p>` : ''}
    ${(() => {
      const top = snackTriggers(state, key);
      return top.length ? `<div class="card-head sub"><h3>Tes déclencheurs (14 jours)</h3></div>
        <p class="hint">${top.map(([t, n]) => `<strong>${esc(t)}</strong> ×${n}`).join(' · ')}. Attaque le premier : écris une règle « Si… alors… » pour lui dans Moi > Réglages.</p>` : '';
    })()}`;
}

// Un arbre pousse au centre du minuteur pendant la session (idée reprise de
// Forest) : chaque session a le sien (graine = date + numéro de session).
const focusSeed = (key, i) => seedOf(`${key}#${i}`);

function focusTree(f) {
  const key = todayKey();
  return treeSVG(f, focusSeed(key, state.days[key]?.focus ?? 0));
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
      <div class="timer-in">${p.mode === 'work' ? `<div class="plant" id="plant">${focusTree(1 - pomoRemaining() / POMO_WORK)}</div>` : `<div class="plant">${icon('cup', 'big-ico')}</div>`}
      <div class="clock" id="pomo-clock">${fmtClock(p.remaining)}</div></div></div>
    <div class="row center">
      <button class="btn primary" data-act="pomo-toggle" id="pomo-toggle">${p.endAt ? 'Pause' : 'Démarrer'}</button>
      <button class="btn" data-act="pomo-reset">Réinitialiser</button>
      <button class="btn" data-act="pomo-skip">${p.mode === 'work' ? 'Passer en pause' : 'Passer la pause'}</button>
    </div>
    <p class="hint">Avant de démarrer : téléphone dans une autre pièce, ou face cachée en mode avion. 1 session valide le minimum « Focus », 4 valident le complet.</p>
    <div class="garden" role="img" aria-label="${d.focus ?? 0} arbre${(d.focus ?? 0) > 1 ? 's' : ''} : sessions terminées aujourd’hui">${Array.from({ length: d.focus ?? 0 }, (_, i) => treeSVG(1, focusSeed(today, i), { mini: true })).join('') || '<span class="muted">Ton jardin du jour est vide. Chaque session fait pousser un arbre.</span>'}</div>
  </section>
  <section class="card center urge">
    <div class="card-head"><h2>Envie de scroller ?</h2>${urgePill(d)}</div>
    ${urgeBody(u)}
  </section>`;
}

// « Envie de scroller ? » : 10 minutes d'attente avant d'ouvrir Snap ou
// TikTok. Dans Jour (et sur l'ancienne page Focus).
const urgePill = (d) => `<span class="pill">${d.urges ?? 0} envie${(d.urges ?? 0) > 1 ? 's' : ''} retardée${(d.urges ?? 0) > 1 ? 's' : ''}</span>`;
function urgeBody(u) {
  return `<p class="muted">Tu n’as pas à résister pour toujours. Juste 10 minutes. Une envie retombe souvent d’elle-même ; si elle est encore là après, ouvre l’appli consciemment, avec un minuteur.</p>
    <div class="clock small" id="urge-clock">${u.endAt ? fmtClock(Math.max(0, (u.endAt - Date.now()) / 1000)) : '10:00'}</div>
    <div class="row center">
      ${u.endAt ? '<button class="btn" data-act="urge-stop">Arrêter</button>' : '<button class="btn primary" data-act="urge-start">J’attends 10 min</button>'}
    </div>
    <p class="hint">Pendant ces 10 min : 10 pompes, un verre d’eau, ou sortir prendre l’air.</p>`;
}

let player = null; // séance en cours
let mealUndo = ''; // dernier aliment noté (pour « Annuler le dernier ajout »)
let foodCat = 'prot'; // famille d'aliments affichée dans Manger
const fmtInt = (n) => Math.round(n).toLocaleString('fr-FR');

function buildSteps(w, level) {
  const delta = w.fixed ? 0 : (level - 2) * 10;
  const rounds = w.fixed ? w.rounds : level === 1 ? Math.max(2, w.rounds - 1) : w.rounds;
  const steps = [{ kind: 'prep', name: 'Prépare-toi', secs: 10, cue: w.prep ?? 'Tapis au sol, téléphone posé à côté, une gorgée d’eau.' }];
  if (!w.fixed) {
    WARMUP.forEach((ex) => steps.push({ kind: 'warm', name: ex.name, secs: ex.work, cue: ex.cue }));
  }
  for (let r = 1; r <= rounds; r++) {
    w.exercises.forEach((ex, i) => {
      steps.push({ kind: 'work', name: ex.name, secs: Math.max(15, ex.work + delta), cue: ex.cue, target: ex.target, why: ex.why, round: r, rounds });
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
  // les séances fixes (M, P) ne changent pas avec le niveau : leur ressenti ne compte pas
  const recent = state.feels.filter((f) => !WORKOUTS.find((w) => w.id === f.id)?.fixed).slice(-2);
  const suggestUp = lvl < 3 && recent.length === 2 && recent.every((f) => f.v === 'facile');
  const suggestDown = lvl > 1 && recent.length === 2 && recent.every((f) => f.v === 'dur');
  const dayNames = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const todayDow = (fromKey(today).getDay() + 6) % 7;
  return `
  ${suggestUp ? `<div class="banner ok"><strong>2 séances « faciles » de suite.</strong> Il est temps de monter. <button class="btn small primary" data-act="level" data-lvl="${lvl + 1}">Passer au niveau ${lvl + 1}</button></div>` : ''}
  ${suggestDown ? `<div class="banner warn"><strong>2 séances « dures » de suite.</strong> Redescendre d’un niveau n’est pas un échec. <button class="btn small" data-act="level" data-lvl="${lvl - 1}">Revenir au niveau ${lvl - 1}</button></div>` : ''}
  ${gymHub(planned, done, lvl)}
  ${recordsCard()}
  <div class="folds">
    ${fold('c-goal', icon('target'), 'Ton objectif', 'Pourquoi ces séances', '<span></span>', goalBody())}
    ${fold('c-wo', icon('dumbbell'), 'Les 5 séances', 'Exercices et semaine type', `<span class="pill">Niv. ${lvl}</span>`, `
      <div class="week">${[1, 2, 3, 4, 5, 6, 0].map((dow, i) => `<div class="wk-${WEEK_PLAN[dow]} ${i === todayDow ? 'today' : ''}"><small>${dayNames[i]}</small><b>${WEEK_PLAN[dow]}</b></div>`).join('')}</div>
      <p class="hint">A = abdos et tronc, B = bras, avant-bras, épaules et dos, en alternance du lundi au samedi : chaque muscle a 48 h pour récupérer. C = cardio boxe, en plus quand tu veux. P = tractions au parc, pendant ta marche, à la place d’une C. M = mobilité et posture, le dimanche (repos). Échauffement inclus dans A, B et C. Les jours sans envie, M suffit à valider « Bouger ».</p>
      <div class="row">${[1, 2, 3].map((n) => `<button class="seg ${lvl === n ? 'on' : ''}" data-act="level" data-lvl="${n}" aria-pressed="${lvl === n}">Niveau ${n}</button>`).join('')}</div>
      <p class="hint">À la fin de chaque séance, dis si c’était facile, correct ou dur : l’appli te propose de monter ou de descendre. Niveau 1 = 2 tours, efforts plus courts.</p>
      ${WORKOUTS.map((w) => {
        const mins = workoutMinutes(w);
        return `<details class="wo-fold ${w.id === planned ? 'planned' : ''}" data-fold="wo-${w.id}" ${openFolds.has(`wo-${w.id}`) ? 'open' : ''}>
          <summary><span class="wo-badge wo-${w.id}">${w.id}</span><strong>${esc(w.name.split(' · ')[1] ?? w.name)}</strong><span class="pill">${w.id === planned ? 'Aujourd’hui' : `${mins} min`}</span><span class="chev" aria-hidden="true"></span></summary>
          <p class="muted">${esc(w.desc)}</p>
          <p class="hint">≈ ${mins} min · ≈ ${workoutKcal(w)} kcal brûlées (estimation)</p>
          <ol class="ex">${w.exercises.map((e) => `<li><span class="ex-fig">${figure(e.name, e.target, false)}</span><div><strong>${esc(e.name)}</strong> · <a href="${demoUrl(e.name)}" target="_blank" rel="noopener">démo vidéo</a><br><span class="target-tag">${icon('target')}${esc(e.target)}</span>${e.why ? `<br><span class="why">${esc(e.why)}</span>` : ''}<br><span class="muted">${esc(e.cue)}</span></div></li>`).join('')}</ol>
          <div class="row"><button class="btn primary" data-act="start-workout" data-id="${w.id}">Lancer${done.includes(w.id) ? ' (déjà faite aujourd’hui)' : ''}</button></div>
        </details>`;
      }).join('')}`)}
    ${fold('c-tests', icon('gauge'), 'Tests de niveau', 'Tous les 4 sprints', `<span class="pill">${state.tests.length} test${state.tests.length > 1 ? 's' : ''}</span>`, testsBody())}
    ${fold('c-safe', icon('shield'), 'Sécurité', 'Avant ta première séance', '<span></span>', `
      <ul class="tight">
        <li>Douleur vive ou articulaire : arrête l’exercice. Une brûlure musculaire, c’est normal.</li>
        <li>Si la technique se dégrade, mets-toi en version genoux ou arrête la série. La qualité passe avant la durée.</li>
        <li>Aucun exercice ne fait fondre la graisse d’une zone précise : le ventre, la taille et la mâchoire se dessinent quand le gras baisse partout (assiette, pas, séance C). Les jambes travaillent dans la C (fentes arrière) et en marchant.</li>
        <li>Au parc : une barre sèche et solide. En bas d’une traction, ne te laisse jamais tomber bras tendus : descends en contrôlant.</li>
        <li>Élastiques : regarde-les avant chaque séance (une fissure ou une entaille : à la poubelle). En chaussures, pieds bien à plat dessus, et jamais le visage dans l’axe de l’élastique tendu.</li>
        <li>Chaque exercice a un lien « démo vidéo ». Regarde-le avant ta première séance, pas pendant.</li>
      </ul>`)}
  </div>`;
}

// ——— Salle ———
const shortName = (w) => w.name.split(' · ')[1] ?? w.name;

// Ta salle : un poste par séance, chacun avec son bonhomme et son matériel.
// Touche un poste : son bonhomme se met au travail, sa séance s'écrit
// au-dessus de lui et s'affiche dessous, prête à lancer. Au départ : celle
// du jour.
let gymPick = null;
const pctOf = (v, total) => `${Math.round((v / total) * 1000) / 10}%`;

// L'étiquette du poste choisi efface les pastilles qu'elle recouvrirait
// (« B · Pectoraux, dos et bras » passe devant le A). Calculé sur la place
// finale (étiquette et pastilles posées au-dessus de leur zone, remontées de
// 55 % de leur hauteur, comme dans styles.css), pas pendant leur apparition.
function hubDeclutter() {
  const tag = $('.hub-stage .hub-tag');
  if (!tag) return;
  const place = (el) => {
    const hit = el.parentElement;
    const [w, h] = [el.offsetWidth, el.offsetHeight];
    const x = el.classList.contains('at-l') ? hit.offsetLeft
      : el.classList.contains('at-r') ? hit.offsetLeft + hit.offsetWidth - w
      : hit.offsetLeft + (hit.offsetWidth - w) / 2;
    return [x, hit.offsetTop - h * 0.55, w, h];
  };
  const t = place(tag);
  document.querySelectorAll('.hub-stage .hub-badge').forEach((b) => b.classList.toggle('under-tag', covers(t, place(b))));
}

function gymHub(planned, done, lvl) {
  const pick = WORKOUTS.some((x) => x.id === gymPick) ? gymPick : planned;
  const w = WORKOUTS.find((x) => x.id === pick);
  const did = done.includes(w.id);
  const lv = levelInfo(totalXP(state));
  const hits = hubLayout().map(({ id, box: [x, y, bw, bh] }) => {
    const on = id === pick;
    const wo = WORKOUTS.find((z) => z.id === id);
    const mid = x + bw / 2;
    const side = mid < HUB.w * 0.3 ? ' at-l' : mid > HUB.w * 0.7 ? ' at-r' : '';
    const label = on
      ? `<span class="hub-tag${side}"><b>${id}</b>${esc(shortName(wo))}</span>`
      : `<span class="hub-badge${id === planned ? ' today' : ''}">${done.includes(id) ? '✓' : id}</span>`;
    return `<button class="hub-hit wo-${id}${on ? ' on' : ''}" style="left:${pctOf(x - 6, HUB.w)};top:${pctOf(y - 6, HUB.h)};width:${pctOf(bw + 12, HUB.w)};height:${pctOf(bh + 12, HUB.h)}" data-act="gym-pick" data-id="${id}" aria-pressed="${on}" aria-label="Séance ${id} : ${esc(shortName(wo))}${id === planned ? ', celle du jour' : ''}${done.includes(id) ? ', faite aujourd’hui' : ''}">${label}</button>`;
  }).join('');
  return `<section class="card gym-hero hub wo-${w.id}">
    <div class="hub-stage">${hubSVG({ pick, animate: !reduceMotion() })}${hits}</div>
    <div class="gym-head">
      <span class="wo-badge big wo-${w.id}">${w.id}</span>
      <div><p class="eyebrow">${pick === planned ? 'Aujourd’hui' : `Poste ${w.id}`}${did ? ' · ✓ faite' : ''}</p><h2>${esc(shortName(w))}</h2>
        <p class="muted">≈ ${workoutMinutes(w)} min · ≈ ${workoutKcal(w)} kcal · ${w.exercises.length} exercices${w.fixed ? '' : ` · niveau ${lvl}`}</p></div>
    </div>
    <button class="btn primary wide" data-act="start-workout" data-id="${w.id}">${did ? 'Refaire la séance' : `Lancer la séance ${w.id}`}</button>
    <p class="hint">Touche un poste pour changer de séance. C ou P en plus quand tu veux ; pas la forme ? M suffit à valider « Bouger ».</p>
    <div class="level gym-level">
      <span class="badge">Niv. ${lv.level}</span><span class="rank">${esc(lv.rank)}</span>
      <div class="xpbar">${tweenBar('gym-xp', (lv.into / lv.span) * 100)}</div>
      <span class="xp">${lv.into}/${lv.span} XP</span>
    </div>
  </section>`;
}

// Mur des records : tes meilleurs chiffres, notés au repos pendant les séances.
function recordsCard() {
  const groups = new Map();
  for (const w of WORKOUTS) {
    for (const e of w.exercises) {
      const goal = goalOf(e.cue);
      if (!goal) continue;
      const label = baseName(e.name);
      if (!groups.has(label)) groups.set(label, { label, names: [], unit: goal.unit, workout: w.id });
      groups.get(label).names.push(e.name);
    }
  }
  const wall = recordWall(state.records, [...groups.values()], 6, todayKey());
  return `<section class="card records-card">
    <div class="card-head"><h2>${icon('trophy')}Mur des records</h2>${wall.length ? `<span class="pill">${wall.length}</span>` : ''}</div>
    ${wall.length
      ? `<div class="records">${wall.map((r) => `<div class="record wo-${r.workout}${r.fresh ? ' fresh' : ''}"><b>${r.best}</b><span class="rec-unit">${esc(r.unit)}</span><small>${esc(r.label)}</small>${r.fresh ? `<span class="rec-new">Nouveau · +${r.gain}</span>` : ''}</div>`).join('')}</div>
        <p class="hint">Ton meilleur chiffre par exercice, tous tours confondus. Le dernier travaillé d’abord ; une plaque neuve brille 3 jours.</p>`
      : '<p class="muted">Pendant le repos, touche le nombre que tu as fait : tes meilleurs chiffres s’affichent ici.</p>'}
  </section>`;
}

// Ton assiette du jour : touche ce que tu manges (un aliment = une portion),
// les calories et les protéines du jour s'additionnent, comparées à
// l'objectif (selon tes pas). Des repères, pas une balance.
function mealsCard() {
  const d = state.days[todayKey()] ?? {};
  const meals = d.meals ?? [];
  const tot = mealTotals(meals);
  const target = kcalTarget(d.steps);
  const left = target - tot.kcal;
  const cat = FOOD_CATS.some(([c]) => c === foodCat) ? foodCat : 'prot';
  const half = (n) => (n % 1 ? `${Math.floor(n) || ''}½` : String(n));
  const status = !tot.kcal ? 'rien de noté pour l’instant'
    : left > 50 ? `il te reste ≈ ${fmtInt(left)} kcal`
    : left >= -100 ? 'pile dans l’objectif'
    : `≈ ${fmtInt(-left)} kcal au-dessus : pas grave, c’est la semaine qui compte`;
  return `<section class="card meals-card">
    <div class="card-head"><h2>${icon('utensils')}Ton assiette du jour</h2><span class="pill">≈ ${fmtInt(tot.kcal)} kcal</span></div>
    <p class="kcal-head"><strong>≈ ${fmtInt(tot.kcal)}</strong> <span class="muted">/ ${fmtInt(target)} kcal${d.steps ? ` · ${fmtInt(d.steps)} pas` : ''}</span></p>
    <div class="bar kcal-bar${left < -100 ? ' over' : ''}">${tweenBar('kcal', Math.min(100, (tot.kcal / target) * 100))}</div>
    <p class="hint">${status} · ≈ ${tot.p} g de protéines sur ${PROTEIN_GRAMS}</p>
    <label class="steps-pick">Tes pas aujourd’hui (l’objectif suit)<select data-field="steps" data-key="${todayKey()}">${STEP_CHOICES.map((n) => `<option value="${n}"${n === nearestSteps(d.steps) ? ' selected' : ''}>${n >= 15000 ? `${fmtInt(n)} ou plus` : `≈ ${fmtInt(n)}`}</option>`).join('')}</select></label>
    <div class="food-cats" role="group" aria-label="Familles d’aliments">${FOOD_CATS.map(([c, label]) => `<button class="seg ${c === cat ? 'on' : ''}" data-act="food-cat" data-c="${c}" aria-pressed="${c === cat}">${label}</button>`).join('')}</div>
    <div class="food-grid">${FOODS.filter((f) => f.cat === cat).map((f) => `<button class="food" data-act="meal-add" data-f="${f.id}" aria-label="Noter ${esc(f.name)}, ${esc(f.portion)}, ${f.kcal} kcal"><span class="food-emo" aria-hidden="true">${f.emoji}</span><b>${esc(nbsp(f.name))}</b><small>${esc(nbsp(f.portion))}</small><small class="food-kcal">${f.kcal} kcal</small></button>`).join('')}</div>
    ${meals.length ? `<ul class="meal-list">${meals.map((m) => {
      const f = FOODS.find((x) => x.id === m.f);
      return `<li><span class="meal-name">${f?.emoji ?? '🍽️'} ${esc(nbsp(f?.name ?? m.f))}${m.n !== 1 ? ` <small>×${half(m.n)}</small>` : ''}</span><span class="meal-kcal">${fmtInt(m.n * m.kcal)} kcal</span>
        <button class="meal-step" data-act="meal-step" data-f="${m.f}" data-v="-0.5" aria-label="Une demi-portion de ${esc(f?.name ?? m.f)} en moins">−</button><button class="meal-step" data-act="meal-step" data-f="${m.f}" data-v="0.5" aria-label="Une demi-portion de ${esc(f?.name ?? m.f)} en plus">+</button></li>`;
    }).join('')}</ul>` : '<p class="muted">Touche ce que tu manges : un aliment = une portion (− et + par demi-portion ensuite).</p>'}
    <p class="hint">Des repères, pas une balance : à ±15\u00a0% près, c’est la tendance de la semaine qui compte. L’huile de cuisson compte (90 kcal la cuillère). Les protéines notées ici comptent aussi dans Jour.</p>
  </section>`;
}

// Onglet Manger : ton assiette du jour en haut, puis les conseils.
function viewFood() {
  return `
  ${mealsCard()}
  <section class="card">
    <div class="card-head"><h2>${icon('clock')}Ta journée type</h2></div>
    <p class="hint">≈ 1 850 kcal avec 8 000 pas (≈ 2 000 les jours à 12 000 pas) et ${PROTEIN_GRAMS} g de protéines. Pas faim le matin ? Le 1er repas glisse vers 11 h : c’est le total du jour qui compte.</p>
    <ol class="day-plan">${DAY_PLAN.map(([when, what]) => `<li><b>${esc(when)}</b><span>${esc(what)}</span></li>`).join('')}</ol>
  </section>
  <section class="card">
    <div class="card-head"><h2>${icon('traffic')}Ce que tu peux manger</h2></div>
    ${FOOD_COLORS.map((c) => `<div class="food-color fc-${c.id}"><p><strong><span class="fc-dot" aria-hidden="true"></span>${esc(c.title)}</strong></p><ul class="tight">${c.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>`).join('')}
    <p class="hint">Rien n’est interdit : le rouge veut dire « prévu », pas « jamais ».</p>
    <ul class="tight">${FOOD_TREATS.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
  </section>
  <section class="card">
    <div class="card-head"><h2>${icon('apple')}Collations et grignotages</h2></div>
    <p class="hint">${esc(SNACK_TEST)}</p>
    ${SNACKS.map((g) => `<p class="apps-cat">${esc(g.title)}</p><ul class="tight">${g.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`).join('')}
    <p class="hint">Une collation prévue (comme celle de 16 h) n’est pas un grignotage : ta case reste validée.</p>
  </section>
  <section class="card">
    <div class="card-head"><h2>${icon('cup')}Le thé</h2></div>
    <p class="muted">Sans sucre, c’est 0 kcal et une arme contre le grignotage du soir. Il ne fait pas maigrir pour autant.</p>
    <ul class="tight">${TEA_TIPS.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
  </section>
  <section class="card">
    <div class="card-head"><h2>${icon('list')}Six règles, pas de régime</h2></div>
    <p class="muted">Pour des abdos visibles, l’alimentation pèse plus lourd que les séances.</p>
    <ol class="tight">${FOOD_RULES.map((r) => `<li>${esc(r)}</li>`).join('')}</ol>
  </section>
  <section class="card">
    <div class="card-head"><h2>${icon('pan')}Recettes</h2><span class="pill">${RECIPES.length}</span></div>
    <p class="hint">Objectif : maîtriser une recette par semaine. Propose à tes parents de cuisiner un repas par semaine : tu apprends, et tu choisis ce qui est dans l’assiette.</p>
    ${RECIPES.map((r) => `<details><summary><strong>${esc(r.name)}</strong> · ${esc(r.time)}</summary>
      <p><em>Ingrédients :</em> ${esc(r.items)}</p><p>${esc(r.steps)}</p></details>`).join('')}
  </section>`;
}

function goalBody() {
  const points = [
    ['C', 'Sec avant tout.', 'Abdos et mâchoire se voient quand le taux de gras baisse : protéines, zéro grignotage, 8 000 pas, séance C. C’est l’assiette qui fait le plus gros du travail.'],
    ['A', 'Abdos dessinés.', 'Crunch vélo et roue ×2 (les deux en tête des mesures), crunch inversé pour le V du bas du ventre, Russian twist pieds décollés pour les obliques, planches latérales (main sous le torse) et hollow body pour une taille fine. Deux tours durs valent mieux que trois tours mous.'],
    ['B', 'Calisthénie : pectoraux, dos en V et bras.', 'Ton corps est l’outil : pompes sur parallettes, pike, diamant et L-sit, plus 2 tirages et un curl à l’élastique pour le dos en V et des bras dessinés. De la force sans gonfler, chaque série finie dure. Les veines se voient quand le gras baisse : c’est l’assiette qui les fait sortir. Rien pour les trapèzes, qui tassent le cou.'],
    ['P', 'Tractions au parc.', 'Une barre de street workout pendant ta marche, à la place d’une C. Tractions par étapes (négatives, élastique, puis vraies), australiennes pour le milieu du dos, relevés de genoux pour le bas du ventre, suspension pour la poigne et les avant-bras. 10 tractions propres, c’est solide ; 15 à 20, c’est très fort.'],
    ['M', 'Grand et droit.', 'Bassin droit (fentes basses, pont fessier), dos fort et épaules ouvertes (superman, tirage superman, écarté et passage d’épaules à l’élastique, étirement des pectoraux debout), tête reculée (chin tucks) : on gagne visuellement quelques centimètres et une démarche plus sûre.'],
    ['M', 'Mâchoire nette.', 'Tête droite et visage sec, sans grossir le cou. L’os ne change pas à l’âge adulte : ce qui la révèle, c’est surtout un visage sec et une tête bien placée. Évite le chewing-gum dur, mauvais pour l’articulation.'],
    ['C', 'Les calories, à leur juste place.', 'Une séance brûle 55 à 100 kcal (la C boxe en tête), à peu près une banane. Elle donne la forme ; le gras part surtout grâce à l’assiette et aux pas (10 000 pas ≈ 250 kcal).'],
  ];
  return `<p class="muted">Pas trapu, pas massif : un corps athlétique et léger, une posture droite, des abdos et une mâchoire visibles.</p>
    <ul class="goal-list">${points.map(([id, title, text]) => `<li><span class="wo-badge wo-${id}">${id}</span><div><strong>${title}</strong> ${text}</div></li>`).join('')}</ul>`;
}

// Objectifs qui montent : pendant l'effort, l'objectif est ton record + 1.
function stepTarget(s) {
  if (s?.kind !== 'work') return null;
  return nextTarget(goalOf(s.cue), state.records?.[recordKey(s.name, s.round)]);
}

function speakStep() {
  if (!player || player.done) return;
  const s = player.steps[player.i];
  const toNote = loggables().find((l) => !l.noted);
  say(spokenStep(s, player.steps[player.i + 1], stepTarget(s), toNote?.goal.unit));
}

// Ce qu'on peut noter maintenant : pendant le repos, l'effort qui vient de
// finir ; à la fin de la séance, tout ce qui n'a pas été noté (les oublis).
// Pas pour les tenues. noted : déjà noté pendant cette séance (on peut corriger).
function loggables() {
  if (!player?.steps) return [];
  const ids = player.done ? player.doneList ?? [] : player.steps[player.i]?.kind === 'rest' ? [player.i - 1] : [];
  return ids.flatMap((idx) => {
    const s = player.steps[idx];
    const goal = s?.kind === 'work' && goalOf(s.cue);
    if (!goal) return [];
    const target = stepTarget(s).target;
    return [{ idx, s, goal, target, center: player.logVal?.[idx] ?? target, noted: player.noted?.[idx] }];
  });
}

// Noter en une touche : 5 nombres autour de l'objectif (‹ › pour aller plus
// bas ou plus haut). Une fois noté : « Corriger » si on s'est trompé, et la
// plaque neuve quand c'est un record.
function logRow() {
  const list = loggables();
  if (!list.length) return '';
  const name = (l) => (player.done && l.s.rounds > 1 ? `${l.s.name} · tour ${l.s.round}` : l.s.name);
  const rows = list.map((l) => {
    if (l.noted) {
      const fix = `<button class="btn ghost small log-fix" data-act="reps-undo" data-idx="${l.idx}">Corriger</button>`;
      return player.plaque?.idx === l.idx ? `${plaqueNew()}${fix}` : `<div class="log-done">${icon('check')}<span>${esc(name(l))}\u00a0: ${l.noted.value}\u00a0${esc(l.goal.unit)}</span>${fix}</div>`;
    }
    return `<div class="log-reps">
    <p>${esc(name(l))}\u00a0: ${esc(combien(l.goal.unit))}\u00a0?</p>
    <div class="log-chips">
      <button class="log-step" data-act="reps-shift" data-idx="${l.idx}" data-v="-5" aria-label="Nombres plus bas">‹</button>
      ${logChoices(l.center).map((v) => `<button class="log-chip${v === l.target ? ' aim' : ''}" data-act="reps-pick" data-idx="${l.idx}" data-v="${v}" aria-label="Noter ${v} ${esc(l.goal.unit)}">${v}</button>`).join('')}
      <button class="log-step" data-act="reps-shift" data-idx="${l.idx}" data-v="5" aria-label="Nombres plus hauts">›</button>
    </div>
  </div>`;
  });
  return player.done && list.length > 1 ? `<div class="log-list"><p class="eyebrow">Pas encore noté · si tu t’en souviens</p>${rows.join('')}</div>` : rows.join('');
}

// Record battu : une plaque de cuivre neuve, gravée, s'allume (un reflet la
// traverse) pendant le repos qui suit, ou sur l'écran de fin. Sans animation
// si le téléphone demande de les réduire.
function plaqueNew() {
  const p = player?.plaque;
  if (!p) return '';
  const lit = !p.shown;
  p.shown = true;
  return `<div class="plaque-new${lit ? ' lit' : ''}"${lit ? ' role="status"' : ''}>
    <span class="pn-shine" aria-hidden="true"></span>
    <span class="pn-tag">${icon('trophy')}Nouveau record${p.round > 1 ? ` · tour ${p.round}` : ''}</span>
    <b class="pn-val">${p.value}<small>${esc(p.unit)}</small></b>
    <span class="pn-name">${esc(p.name)} · <strong>+${p.gain}</strong> (avant ${p.was})</span>
  </div>`;
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
        ${icon('trophy', 'big-ico')}
        <p class="muted">≈ ${workoutKcal(player.workout)} kcal brûlées (estimation)</p>
        ${logRow()}
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
  const fresh = player.shown !== player.i;
  player.shown = player.i;
  el.className = `player ${s.kind} ${player.endAt ? '' : 'paused'}`;
  // Lisible du sol : l'écran se remplit de couleur à mesure que le temps passe
  // (or = effort, bleu = repos), chronomètre géant, gros boutons.
  el.innerHTML = `
    <div class="player-fill" id="player-fill" style="transform:scaleY(${1 - player.remaining / s.secs})"></div>
    <div class="player-top"><span>${esc(player.workout.name)}</span><span>${s.round ? `Tour ${s.round}/${s.rounds}` : ''}${synth ? `<button class="voice-btn" data-act="voice-toggle" aria-pressed="${state.settings.voice}" aria-label="${state.settings.voice ? 'Couper le coach vocal' : 'Activer le coach vocal'}">${icon(state.settings.voice ? 'volume' : 'volume-x')}</button>` : ''}</span></div>
    <div class="progress"><span style="width:${(player.i / player.steps.length) * 100}%"></span></div>
    <div class="player-main ${fresh ? 'enter' : ''}">
      <p class="phase">${player.endAt ? { work: 'Effort', rest: 'Repos', warm: 'Échauffement', prep: 'Départ' }[s.kind] : 'Pause'}</p>
      <h2>${esc(s.name)}</h2>
      ${s.target ? `<span class="target-tag">${icon('target')}${esc(s.target)}</span>` : ''}
      ${(() => {
        const t = stepTarget(s);
        if (t?.harder) return `<span class="rec-tag">${icon('trophy')}Record ${t.best} · haut de la fourchette : passe à la version plus dure (voir la consigne)</span>
          <button class="btn ghost small rec-reset" data-act="reps-reset">Version plus dure : record à zéro</button>`;
        return t?.best != null ? `<span class="rec-tag">${icon('trophy')}Record ${t.best} · vise ${t.target}</span>` : '';
      })()}
      ${s.why && s.kind === 'work' ? `<p class="why">${esc(s.why)}</p>` : ''}
      ${s.kind === 'rest' ? logRow() : ''}
      ${stageFig(s.kind === 'work' || s.kind === 'warm' ? figure(s.name, s.target) : figure(next?.name, next?.target), fresh && player.i === 0)}
      <div class="clock huge" id="player-clock">${fmtStep(player.remaining)}</div>
      ${s.kind === 'rest' ? '' : `<p class="cue">${esc(s.cue)}</p>
      <button class="btn ghost small cue-more" data-act="cue-open">${icon('book-open')}Lire la consigne</button>`}
      ${s.kind === 'work' ? `<p class="demo"><a href="${demoUrl(s.name)}" target="_blank" rel="noopener">Voir une démo vidéo</a></p>` : ''}
      ${next ? `<p class="next">Ensuite <strong>${esc(next.name)}</strong></p>` : ''}
    </div>
    <div class="player-ctrl">
      <button class="ctrl" data-act="player-prev" aria-label="Étape précédente">◀︎</button>
      <button class="ctrl main" data-act="player-toggle" aria-label="${player.endAt ? 'Pause' : 'Reprendre'}">${player.endAt ? '❚❚' : '▶︎'}</button>
      <button class="ctrl" data-act="player-next" aria-label="Étape suivante">▶︎</button>
    </div>
    <button class="btn ghost small player-stop" data-act="player-stop">Arrêter la séance</button>
    ${player.cueOpen ? `<div class="cue-full" role="dialog" aria-modal="true" aria-labelledby="cue-title">
      <p class="eyebrow">Consigne · séance en pause</p>
      <h2 id="cue-title">${esc(s.name)}</h2>
      ${s.target ? `<span class="target-tag">${icon('target')}${esc(s.target)}</span>` : ''}
      ${s.why ? `<p class="why">${esc(s.why)}</p>` : ''}
      <div class="cue-full-fig">${figure(s.name, s.target)}</div>
      <p class="cue-full-text">${esc(s.cue)}</p>
      <button class="btn primary wide" data-act="cue-close">${player.cueResume ? 'Compris, on reprend' : 'Fermer'}</button>
    </div>` : ''}`;
  if (player.cueOpen) $('.cue-full [data-act="cue-close"]', el)?.focus({ preventScroll: true });
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
  speakStep();
}

function playerGoto(i) {
  if (i >= player.steps.length) return finishWorkout();
  player.i = Math.max(0, i);
  player.cueOpen = false;
  player.remaining = player.steps[player.i].secs;
  player.endAt = Date.now() + player.remaining * 1000;
  renderPlayer();
  speakStep();
}

function finishWorkout() {
  const today = todayKey();
  const d = day(today);
  d.workouts = [...(d.workouts ?? []), player.workout.id];
  raiseHabit(today, 'sport', player.workout.id === 'M' ? 1 : 2);
  save();
  // fin : tout ce qui n'a pas été noté peut l'être maintenant (les oublis)
  player = { workout: player.workout, done: true, steps: player.steps, logged: player.logged, logVal: player.logVal, doneList: toLog(player.steps, player.logged ?? new Set()) };
  keepAwake(false);
  beep(3);
  say('Séance terminée. Bien joué.');
  renderPlayer();
  render();
  celebrate(`Séance terminée · +30 XP`);
}

const TEST_FIELDS = [
  ['pushups', 'Pompes', '', 'max, propres, sans pause'],
  ['plank', 'Planche', ' s', 'avant-bras, jusqu’à ce que le bassin tombe'],
  ['side', 'Latérale', ' s', 'côté le plus faible'],
  ['hollow', 'Hollow', ' s', 'genoux pliés, dos plaqué'],
];

function testsBody() {
  const t = state.tests;
  const first = t[0];
  const last = t.at(-1);
  return `<p class="hint">Fais-le maintenant, puis aux sprints 4, 8 et 12. Toujours après la séance M (échauffement), en arrêtant dès que la technique casse.</p>
    <div class="grid2">${TEST_FIELDS.map(([f, label, unit, hint]) => `<label>${label}${unit ? ` (${unit.trim()})` : ''}<small class="field-hint">${esc(hint)}</small><input type="number" inputmode="numeric" id="test-${f}"></label>`).join('')}</div>
    <div class="row"><button class="btn primary" data-act="test-save">Enregistrer le test du jour</button></div>
    ${t.length ? `<div class="table-wrap"><table class="tests">
      <thead><tr><th>Date</th>${TEST_FIELDS.map(([, l]) => `<th>${l}</th>`).join('')}</tr></thead>
      <tbody>${t.map((r) => `<tr><td>${fromKey(r.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</td>${TEST_FIELDS.map(([f, , u]) => `<td>${r[f] ?? '—'}${r[f] !== undefined ? u : ''}</td>`).join('')}</tr>`).join('')}
      ${t.length > 1 ? `<tr class="delta"><td>Progrès</td>${TEST_FIELDS.map(([f, , u]) => {
        const a = first[f];
        const b = last[f];
        return `<td>${a !== undefined && b !== undefined ? `${b - a >= 0 ? '+' : ''}${b - a}${u}` : '—'}</td>`;
      }).join('')}</tr>` : ''}</tbody></table></div>` : ''}`;
}

// 5 sous-onglets : les outils (anciennement « Apps ») sont rangés dans Programme ;
// Argent (ancien onglet) est ici. #argent ouvre Moi › Argent : c'est là que
// s'ouvrent les leçons, y compris depuis le plan du jour.
const ME_TABS = [['programme', 'Programme'], ['bilan', 'Bilan'], ['argent', 'Argent'], ['livres', 'Livres'], ['reglages', 'Réglages']];

function viewMe() {
  const onMoney = currentTab() === 'argent';
  const sub = onMoney ? 'argent' : ME_TABS.some(([id]) => id === state.ui.meTab) ? state.ui.meTab : 'programme';
  const body = { programme: viewProgram, bilan: viewReview, argent: money.view, livres: viewBooks, reglages: viewSettings }[sub]();
  // depuis #argent, les autres sous-onglets ramènent sur #moi
  return `<nav class="subtabs five">${ME_TABS.map(([id, label]) => `<button class="${sub === id ? 'on' : ''}" data-act="me-tab" data-id="${id}"${onMoney && id !== 'argent' ? ' data-go="moi"' : ''}>${label}</button>`).join('')}</nav>${body}`;
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
  const wake = wakePlan(state.settings.wakePlanStart, today, state.settings.wakeTarget);
  const lastTest = state.tests.at(-1) ?? {};
  const lessons = Object.keys(state.lessons).length;
  const row = (label, now, target, fmt, better) => {
    const ok = now !== null && now !== undefined && (better === 'lower' ? now <= target : now >= target);
    return `<tr><td>${label}</td><td>${now === null || now === undefined ? '—' : fmt(now)}</td><td>${fmt(target)}</td><td>${now === null || now === undefined ? '' : ok ? icon('check-circle', 'ok-ico') : icon('clock', 'wait-ico')}</td></tr>`;
  };
  return `
  <section class="card program-hero">
    <div class="card-head"><h2>Semaine ${week}/12</h2><span class="pill">${esc(phase.name)}</span></div>
    <div class="bar"><span style="width:${(week / 12) * 100}%"></span></div>
    <ul class="tight">${phase.focus.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
    <p class="hint">Coucher cible ce soir : <strong>${bedGoal(state, today)}</strong>. Le 3ᵉ jour de chaque sprint est un jour minimum prévu.</p>
  </section>
  ${appsFold()}
  <section class="card">
    <div class="card-head"><h2>Objectifs de la semaine ${next.week}</h2></div>
    <div class="table-wrap"><table class="tests">
      <thead><tr><th>Mesure</th><th>Actuel</th><th>Cible</th><th></th></tr></thead>
      <tbody>
        ${screen !== null ? row('Écran (moy. 7 j)', screen, next.screen, fmtDuration, 'lower') : ''}
        ${row('Coucher (moy. 7 j)', bed, bedtimeMinutes(wake ? wake.goalBed : weeklyBedtime(next.week, state.settings.bedtimeTarget)), minutesToHHMM, 'lower')}
        ${weight !== null ? row('Poids (moy. 7 j)', weight, next.weight, (v) => `${Number(v).toFixed(1)} kg`, 'lower') : ''}
        ${row('Pompes', lastTest.pushups ?? null, next.pushups, (v) => v, 'higher')}
        ${row('Planche', lastTest.plank ?? null, next.plank, (v) => `${v} s`, 'higher')}
        ${row('Leçons de finance', lessons, next.lessons, (v) => v, 'higher')}
      </tbody></table></div>
    <p class="hint">Le coucher vient de « Nuit dernière » (onglet Jour), les pompes et la planche de tes tests de niveau (onglet Salle).</p>
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

// Bibliothèque : des couvertures sur des étagères qui défilent. Toucher une
// couverture la retourne (pourquoi le lire, boutons). Filtre et couvertures
// retournées : mémoire d'écran seulement.
const shelf = { filter: 'all', flipped: new Set(), last: { render: -1, filter: null } };
const BOOK_CATS = [...new Set(BOOKS.map((b) => b.cat))]; // couleur de couverture stable par catégorie
const BOOK_FILTERS = [['all', 'Tout'], ['todo', 'À lire'], ['reading', 'En cours'], ['done', 'Lus']];

function bookCover(b, i) {
  const s = b.status;
  const stamp = increased(seen, `book:${b.id}`, s === 'done' ? 1 : 0);
  return `<article class="book is-${s} ${shelf.flipped.has(b.id) ? 'flipped' : ''}" style="--i:${i}">
    <div class="book-inner">
      <button class="book-face book-front" data-act="book-flip" data-id="${b.id}" aria-label="${esc(b.title)}, ${esc(b.author)} : voir pourquoi le lire">
        <span class="book-cat">${esc(b.cat)}</span>
        <strong class="book-title">${esc(b.title)}</strong>
        <span class="book-rule"></span>
        <span class="book-author">${esc(b.author)}</span>
        ${b.start && s === 'todo' ? '<span class="book-star">★ Commence ici</span>' : ''}
        ${s === 'reading' ? '<span class="book-ribbon">En cours</span>' : ''}
        ${s === 'done' ? `<span class="book-stamp ${stamp ? 'just' : ''}">Lu</span>` : ''}
      </button>
      <div class="book-face book-back">
        <p class="book-why">${esc(b.why)}</p>
        <div class="book-btns">
          <button class="seg ${s === 'reading' ? 'on' : ''}" data-act="book-status" data-id="${b.id}" data-v="reading" aria-pressed="${s === 'reading'}">Je lis</button>
          <button class="seg ${s === 'done' ? 'on' : ''}" data-act="book-status" data-id="${b.id}" data-v="done" aria-pressed="${s === 'done'}">Lu ✓</button>
        </div>
        <button class="book-turn" data-act="book-flip" data-id="${b.id}" aria-label="Retourner la couverture">↺</button>
      </div>
    </div>
  </article>`;
}

function viewBooks() {
  const lib = bookShelves(BOOKS, state.books, shelf.filter);
  const { counts } = lib;
  // Les couvertures entrent en vague à l'arrivée ou au changement de filtre,
  // pas quand on vient de toucher « Je lis » ou « Lu ».
  const enter = shelf.last.render !== renders - 1 || shelf.last.filter !== shelf.filter;
  shelf.last = { render: renders, filter: shelf.filter };
  return `<div class="books-view ${enter ? 'enter' : ''}">
  <section class="card library">
    <p class="eyebrow">Bibliothèque</p>
    <div class="lib-stats">
      <div><span class="lib-num">${counts.done}</span><span class="lbl">lu${counts.done > 1 ? 's' : ''}</span></div>
      <div><span class="lib-num">${counts.reading}</span><span class="lbl">en cours</span></div>
      <div><span class="lib-num">${counts.todo}</span><span class="lbl">à lire</span></div>
    </div>
    <div class="bar">${tweenBar('books', (counts.done / counts.all) * 100)}</div>
    <p class="hint">${lib.reading.length ? `Sur ta table de nuit : <strong>${lib.reading.map((b) => esc(b.title)).join(', ')}</strong>. ` : 'Commence par un livre marqué ★. '}Un seul à la fois, 10 pages par jour. Touche une couverture pour la retourner.</p>
  </section>
  <nav class="chips book-filter" aria-label="Filtrer les livres">${BOOK_FILTERS.map(([id, label]) => `<button class="chip ${shelf.filter === id ? 'on' : ''}" data-act="book-filter" data-id="${id}" aria-pressed="${shelf.filter === id}">${label} <small>${counts[id]}</small></button>`).join('')}</nav>
  ${lib.shelves.length ? lib.shelves.map((sh, si) => `<section class="shelf tone-${BOOK_CATS.indexOf(sh.cat) % 4}" style="--s:${si}">
    <div class="shelf-head"><h2>${esc(sh.cat)}</h2><span class="muted">${sh.done}/${sh.total} lus</span></div>
    <div class="shelf-row">${sh.items.map((b, i) => bookCover(b, i)).join('')}</div>
  </section>`).join('') : '<p class="hint center-hint">Aucun livre ici pour l’instant.</p>'}
  <p class="hint">Règles : bibliothèque avant achat, version originale si c’est en anglais, et si un livre t’ennuie après 50 pages, passe au suivant. +50 XP par livre terminé.</p></div>`;
}

// Tes outils (apps et réglages du téléphone), rangés dans Programme.
function appsFold() {
  const cats = [...new Set(APPS.map((a) => a.cat))];
  const done = APPS.filter((a) => state.setup[a.name]).length;
  return `<div class="folds">${fold('apps', icon('grid'), 'Tes outils', 'Apps et réglages', `<span class="pill ${done === APPS.length ? 'ok' : ''}">${done}/${APPS.length}</span>`, `
    <p class="hint">Tout est gratuit sauf le réveil (≈ 10 €). Coche chaque outil une fois configuré.</p>
    ${cats.map((c) => `<h3 class="apps-cat">${esc(c)}</h3>
    <ul class="setup">${APPS.filter((a) => a.cat === c).map((a) => `<li>
      <button class="tick ${state.setup[a.name] ? 'on' : ''} ${increased(seen, `setup:${a.name}`, state.setup[a.name] ? 1 : 0) ? 'just' : ''}" data-act="setup-toggle" data-id="${esc(a.name)}" aria-pressed="${Boolean(state.setup[a.name])}" aria-label="Configuré : ${esc(a.name)}">${state.setup[a.name] ? '✓' : ''}</button>
      <div><strong>${esc(a.name)}</strong><br><span class="hint">${esc(a.how)}</span></div></li>`).join('')}</ul>`).join('')}`)}</div>`;
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
    ${(() => {
      const first = !seen.has('heat-bilan');
      seen.set('heat-bilan', true);
      return heatmap(regularityGrid(state, today), first);
    })()}
  </section>
  <section class="card">
    <div class="card-head"><h2>Bilan du sprint ${reviewTarget.number}</h2></div>
    <p class="hint">5 minutes, le dimanche soir. Une seule chose à changer, pas dix.</p>
    <label>Qu’est-ce qui a marché ?<textarea data-review="${reviewTarget.number}" data-q="win" rows="2">${esc(rv.win)}</textarea></label>
    <label>Qu’est-ce qui m’a fait rater, concrètement (heure, lieu, déclencheur) ?<textarea data-review="${reviewTarget.number}" data-q="fail" rows="2">${esc(rv.fail)}</textarea></label>
    <label>La seule chose que je change la semaine prochaine :<textarea data-review="${reviewTarget.number}" data-q="change" rows="2">${esc(rv.change)}</textarea></label>
    <button class="btn primary wide copy-btn" data-act="copy-week" data-first="${reviewTarget.first}">${icon('copy')}Copier mon bilan de la semaine</button>
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
    <div class="row">${[['dark', 'moon', 'Noir'], ['light', 'sun', 'Clair'], ['auto', 'auto', 'Auto']].map(([v, ico, l]) => `<button class="seg ${s.theme === v ? 'on' : ''}" data-act="theme" data-v="${v}" aria-pressed="${s.theme === v}">${icon(ico)}${l}</button>`).join('')}</div>
  </section>
  <section class="card">
    <div class="card-head"><h2>Coach vocal</h2></div>
    <p class="hint">Pendant la séance, une voix annonce chaque exercice et ton objectif. Ce sont les voix de ton téléphone : rien à télécharger, rien n’est envoyé, presque rien pour la batterie. Coupe-la à tout moment avec le haut-parleur en haut de la séance.</p>
    ${synth ? `<div class="row">${[['0', 'volume-x', 'Désactivé'], ['1', 'volume', 'Activé']].map(([v, ico, l]) => `<button class="seg ${String(Number(s.voice)) === v ? 'on' : ''}" data-act="voice" data-v="${v}" aria-pressed="${String(Number(s.voice)) === v}">${icon(ico)}${l}</button>`).join('')}</div>
    ${s.voice ? `<label>Voix<select data-setting="voiceURI">
      <option value="auto" ${s.voiceURI === 'auto' ? 'selected' : ''}>Voix française par défaut</option>
      ${frVoices().map((v) => `<option value="${esc(v.voiceURI)}" ${v.voiceURI === s.voiceURI ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}
    </select></label>
    <div class="row"><button class="btn small" data-act="voice-test">▶︎ Écouter un exemple</button></div>
    <p class="hint">Sur iPhone, d’autres voix (plus naturelles) s’ajoutent dans Réglages › Accessibilité › Contenu énoncé › Voix › Français.</p>` : ''}`
    : '<p class="hint">Ce navigateur ne sait pas lire à voix haute.</p>'}
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
    <div class="card-head"><h2>Créatine</h2></div>
    <p class="hint">Une case par jour sous tes habitudes, pour ne pas oublier ta dose. Elle ne compte pas dans la chaîne : un oubli ne fait pas rater ta journée.</p>
    <div class="row">${[['0', 'Masquée'], ['1', 'Affichée']].map(([v, l]) => `<button class="seg ${String(Number(s.creatine)) === v ? 'on' : ''}" data-act="creatine-show" data-v="${v}" aria-pressed="${String(Number(s.creatine)) === v}">${l}</button>`).join('')}</div>
  </section>
  <section class="card">
    <div class="card-head"><h2>Règles « Si… alors… »</h2></div>
    <label>Une règle par ligne<textarea id="rules" rows="4">${esc(state.rules.join('\n'))}</textarea></label>
  </section>
  <section class="card">
    <div class="card-head"><h2>Réglages</h2></div>
    <div class="grid2">
      <label>Coucher cible<input type="time" data-setting="bedtimeTarget" value="${esc(s.bedtimeTarget)}"></label>
      <label>Réveil visé<input type="time" data-setting="wakeTarget" value="${esc(s.wakeTarget)}"></label>
      <label>Date de départ<input type="date" data-setting="startDate" value="${s.startDate}" max="${today}"></label>
    </div>
    <p class="hint">Le réveil visé est la fin du réveil progressif (Jour > Nuit dernière). Une fois lancé, c’est lui qui fixe ton coucher.</p>
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
    const stage = Math.floor((1 - pomoRemaining() / POMO_WORK) * 100);
    if (pl.dataset.stage !== String(stage)) {
      pl.dataset.stage = stage;
      pl.innerHTML = focusTree(stage / 100);
    }
  }

  const u = state.timers.urge;
  if (u.endAt && Date.now() >= u.endAt) {
    u.endAt = null;
    save();
    beep(2);
    toast('10 minutes tenues. Si l’envie est encore là, vas-y avec un minuteur. Sinon, continue.');
    if (['jour', 'focus'].includes(currentTab())) render();
  }
  const uc = $('#urge-clock');
  if (uc && u.endAt) uc.textContent = fmtClock(Math.ceil((u.endAt - Date.now()) / 1000));

  if (player?.endAt) {
    player.remaining = Math.max(0, Math.ceil((player.endAt - Date.now()) / 1000));
    const c = $('#player-clock');
    if (c) c.textContent = fmtStep(player.remaining);
    $('#player-clock')?.classList.toggle('hurry', player.remaining <= 3);
    const fill = $('#player-fill');
    if (fill) fill.style.transform = `scaleY(${Math.min(1, 1 - (player.endAt - Date.now()) / 1000 / player.steps[player.i].secs)})`;
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
    if (d.habits[el.dataset.id]) navigator.vibrate?.(10);
    save();
    render();
    if (dayStatus(state, today).valid && chain(state, today).count > before) celebrate('Journée validée 🔥 Chaîne +1');
  },
  // Salle : toucher un poste le choisit (son bonhomme se met au travail)
  'gym-pick'(el) {
    gymPick = el.dataset.id;
    navigator.vibrate?.(6);
    render();
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
      hush();
    } else {
      player.endAt = Date.now() + player.remaining * 1000;
    }
    renderPlayer();
  },
  'player-next'() { if (player && !player.done) playerGoto(player.i + 1); },
  // Consigne en entier : la séance se met en pause le temps de lire.
  'cue-open'() {
    if (!player || player.done) return;
    player.cueResume = Boolean(player.endAt);
    if (player.endAt) {
      player.remaining = Math.ceil((player.endAt - Date.now()) / 1000);
      player.endAt = null;
    }
    player.cueOpen = true;
    renderPlayer();
  },
  'cue-close'() {
    if (!player) return;
    player.cueOpen = false;
    if (player.cueResume && !player.endAt) player.endAt = Date.now() + player.remaining * 1000;
    renderPlayer();
  },
  'player-prev'() { if (player && !player.done) playerGoto(player.i - 1); },
  'reps-reset'() {
    const s = player?.steps?.[player.i];
    if (!s || !confirm(`Passer à la version plus dure de « ${s.name} » ? Ton record repart de zéro.`)) return;
    state.records = dropRecords(state.records, s.name);
    save();
    renderPlayer();
    toast('Record remis à zéro : note ton nouveau chiffre au repos.', 2500);
  },
  'reps-shift'(el) {
    const l = loggables().find((x) => x.idx === Number(el.dataset.idx) && !x.noted);
    if (!l) return;
    player.logVal = { ...player.logVal, [l.idx]: Math.max(2, l.center + Number(el.dataset.v)) };
    renderPlayer();
  },
  // une touche sur un nombre : c'est noté
  'reps-pick'(el) {
    const l = loggables().find((x) => x.idx === Number(el.dataset.idx) && !x.noted);
    if (!l) return;
    const value = Number(el.dataset.v);
    const key = recordKey(l.s.name, l.s.round);
    const prev = state.records?.[key];
    const gain = beatBy(prev, value);
    state.records = logRecord(state.records, key, value, todayKey());
    player.logged = new Set([...(player.logged ?? []), l.idx]);
    player.noted = { ...player.noted, [l.idx]: { key, prev, value } };
    if (gain !== null) player.plaque = { idx: l.idx, name: baseName(l.s.name), round: l.s.round ?? 1, value, unit: l.goal.unit, gain, was: prev.best };
    navigator.vibrate?.(gain !== null ? [12, 60, 18] : 8);
    save();
    renderPlayer();
    if (gain !== null) say(`Nouveau record : ${value} ${l.goal.unit}.`);
  },
  // « Corriger » : on remet le record d'avant et on renote
  'reps-undo'(el) {
    const idx = Number(el.dataset.idx);
    const n = player?.noted?.[idx];
    if (!n) return;
    const records = { ...state.records };
    if (n.prev) records[n.key] = n.prev;
    else delete records[n.key];
    state.records = records;
    player.logged = new Set([...(player.logged ?? [])].filter((x) => x !== idx));
    const { [idx]: _gone, ...noted } = player.noted;
    player.noted = noted;
    if (player.plaque?.idx === idx) player.plaque = null;
    save();
    renderPlayer();
  },
  feel(el) {
    state.feels = [...state.feels, { date: todayKey(), id: player.workout.id, v: el.dataset.v }].slice(-60);
    save();
    player = null;
    renderPlayer();
    render();
  },
  // un aliment touché (Manger, ou les boutons protéines de Jour) : une portion de plus
  'meal-add'(el) {
    const food = FOODS.find((f) => f.id === el.dataset.f);
    if (!food) return;
    const d = day(todayKey());
    const before = proteinGrams(d);
    d.meals = addMeal(d.meals, food, 1);
    mealUndo = food.id;
    navigator.vibrate?.(8);
    save();
    render();
    if (before < PROTEIN_GRAMS && proteinGrams(d) >= PROTEIN_GRAMS) celebrate('Objectif protéines atteint 💪');
  },
  'meal-step'(el) {
    const d = day(todayKey());
    d.meals = addMeal(d.meals, { id: el.dataset.f }, Number(el.dataset.v));
    if (!d.meals.length) delete d.meals;
    save();
    render();
  },
  'meal-undo'() {
    const d = day(todayKey());
    d.meals = addMeal(d.meals, { id: mealUndo }, -1);
    if (!d.meals.length) delete d.meals;
    mealUndo = '';
    save();
    render();
  },
  'food-cat'(el) {
    foodCat = el.dataset.c;
    render();
  },
  creatine() {
    const d = day(todayKey());
    d.creatine = !d.creatine;
    navigator.vibrate?.(8);
    save();
    render();
  },
  'creatine-show'(el) {
    state.settings.creatine = el.dataset.v === '1';
    save();
    render();
  },
  'me-tab'(el) {
    const ids = ME_TABS.map(([id]) => id);
    const cur = ids.includes(state.ui.meTab) ? state.ui.meTab : 'programme'; // sous-onglet affiché
    const dir = ids.indexOf(el.dataset.id) < ids.indexOf(cur) ? 'back' : 'fwd';
    const same = el.dataset.id === cur;
    state.ui.meTab = el.dataset.id;
    save();
    if (el.dataset.go && currentTab() !== el.dataset.go) location.hash = el.dataset.go;
    else swap(() => {
      render();
      window.scrollTo(0, 0);
    }, same ? null : dir);
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
  'book-flip'(el) {
    const id = el.dataset.id;
    const card = el.closest('.book');
    if (shelf.flipped.has(id)) shelf.flipped.delete(id);
    else shelf.flipped.add(id);
    card?.classList.toggle('flipped', shelf.flipped.has(id));
  },
  'book-filter'(el) {
    shelf.filter = el.dataset.id;
    render();
  },
  'book-status'(el) {
    const id = el.dataset.id;
    shelf.flipped.delete(id); // la couverture se remet à l'endroit pour montrer le nouveau statut
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
  voice(el) {
    state.settings.voice = el.dataset.v === '1';
    save();
    render();
    if (state.settings.voice) say('Coach vocal activé.');
    else hush();
  },
  'voice-test'() { say('Pompes sur parallettes. Objectif : 10 à 13 pompes.', true); },
  'voice-toggle'() {
    state.settings.voice = !state.settings.voice;
    save();
    if (state.settings.voice) speakStep();
    else hush();
    renderPlayer();
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
    hush();
    keepAwake(false);
    renderPlayer();
    render(); // les records notés pendant la séance restent : le mur se met à jour
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
    openFolds.add('urge'); // le minuteur reste en vue dans Jour
    audioCtx ??= new AudioContext();
    save();
    render();
  },
  'wake-start'() {
    const today = todayKey();
    state.settings.wakePlanStart = addDays(today, 1);
    openFolds.add('night');
    save();
    render();
    toast(`C’est parti : demain, debout à ${clockFr(wakePlan(state.settings.wakePlanStart, today, state.settings.wakeTarget).nextWake)}.`);
  },
  'wake-stop'() {
    if (!confirm('Arrêter le réveil progressif ? Tu pourras le relancer.')) return;
    state.settings.wakePlanStart = null;
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
  avatar() {
    showAvatar();
  },
  help(el) {
    showHelp(el.dataset.id);
  },
  'sheet-close'() {
    $('#sheet').hidden = true;
    $('#sheet').innerHTML = '';
    $('#view').inert = false;
    $('#tabs').inert = false;
    if (sheetOpener?.isConnected) sheetOpener.focus();
    sheetOpener = null;
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
    if (el.dataset.field === 'steps') render(); // l'objectif de calories suit les pas
    toast('Enregistré.');
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

// « Maintenant » suit l'heure (coucher) et ce qui vient d'être fait : on
// réaffiche Jour quand la prochaine action change, sauf pendant une saisie.
function refreshNow() {
  const card = $('.now-card');
  if (!card || currentTab() !== 'jour' || document.activeElement?.matches('input, textarea, select')) return;
  const items = planItems(todayKey());
  const next = nextAction(items, nowHHMM(), null);
  if ((card.dataset.now ?? '') !== (next?.id ?? '')) render();
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    if (player?.endAt || state.timers.pomo.endAt) keepAwake(true);
    tick();
    refreshNow();
  }
});

const TAB_ORDER = ['sport', 'jour', 'focus', 'revision', 'manger', 'moi', 'argent'];
let shownTab = currentTab();

window.addEventListener('hashchange', () => {
  if (currentTab() === 'revision') {
    rev.queue = null;
    rev.flipped = false;
  }
  if (currentTab() !== 'argent') state.ui.lesson = null;
  const tab = currentTab();
  const dir = tab === shownTab ? null : TAB_ORDER.indexOf(tab) < TAB_ORDER.indexOf(shownTab) ? 'back' : 'fwd';
  shownTab = tab;
  swap(() => {
    render();
    window.scrollTo(0, 0);
  }, dir);
});

// ---------- Entrée dans la salle ----------
// À l'ouverture de l'appli : la salle est dans le noir, les spots s'allument
// un par un, la bande LED s'éclaire, le logo brille, puis on entre (≈ 2 s,
// une fois par ouverture). Une touche pour passer ; rien du tout si le
// téléphone demande de réduire les animations.
function enterGym() {
  if (reduceMotion()) return;
  try {
    if (sessionStorage.getItem('cap-intro')) return;
    sessionStorage.setItem('cap-intro', '1');
  } catch { /* stockage indisponible : on montre l'entrée */ }
  const w = WORKOUTS.find((x) => x.id === WEEK_PLAN[fromKey(todayKey()).getDay()]);
  const el = document.createElement('div');
  el.id = 'intro';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `${roomSVG({ w: 220, h: 400, logo: [0.5, 0.33], size: 1.9, floor: 0.72, id: 'intro' })}
    <div class="intro-text"><p class="intro-line">Ta salle est ouverte</p><p class="intro-sub">Aujourd’hui · ${esc(shortName(w))}</p></div>`;
  document.body.append(el);
  let gone = false;
  const leave = () => {
    if (gone) return;
    gone = true;
    el.classList.add('out');
    setTimeout(() => el.remove(), 500);
  };
  el.addEventListener('click', leave);
  setTimeout(leave, 2300);
}

// ---------- démarrage ----------

$('#tabs').innerHTML = `<span class="tab-ind" aria-hidden="true"></span>${TABS.map((t) => `<a href="#${t.id}" data-tab="${t.id}"><span class="tab-ico" aria-hidden="true">${t.icon}</span>${t.label}</a>`).join('')}`;
$('#tabs').classList.add('has-ind');
addEventListener('resize', () => { moveTabIndicator(true); hubDeclutter(); });
state.ui.lastLevel = Math.max(state.ui.lastLevel ?? 1, levelInfo(totalXP(state)).level);
save();
render();
moveTabIndicator(true);
enterGym();
setInterval(tick, 250);
// Le changement de jour (4 h) se voit sans recharger.
let shownDay = todayKey();
setInterval(() => {
  if (todayKey() !== shownDay) {
    shownDay = todayKey();
    render();
  } else refreshNow();
}, 60000);

navigator.storage?.persist?.();
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch(() => { /* hébergeur sans service worker */ });
}
