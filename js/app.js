import {
  todayKey, addDays, diffDays, fromKey, dayStatus, chain, recoveryMode, lastNDays,
  sprintInfo, bedtimeMinutes, minutesToHHMM, sleepDuration, rollingAverage, series,
  SPRINT_COUNT, SPRINT_PASS, SPRINT_LENGTH,
} from './logic.js';
import {
  DEFAULT_HABITS, DEFAULT_RULES, WORKOUTS, WEEK_PLAN, SNACK_TRIGGERS, FOOD_RULES, RECIPES, demoUrl,
} from './data.js';
import { lineChart, barChart, wireTooltips } from './charts.js';

const STORE = 'cap-v1';
const POMO_WORK = 25 * 60;
const POMO_BREAK = 5 * 60;
const URGE_DELAY = 10 * 60;

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
    },
    habits: structuredClone(DEFAULT_HABITS),
    rules: [...DEFAULT_RULES],
    days: {},
    reviews: {},
    tests: [],
    timers: { pomo: { mode: 'work', endAt: null, remaining: POMO_WORK, label: '' }, urge: { endAt: null } },
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return freshState();
    const s = JSON.parse(raw);
    const base = freshState();
    const st = { ...base, ...s, settings: { ...base.settings, ...s.settings }, timers: { ...base.timers, ...s.timers } };
    // Données d'avant la v2 : on fige la liste d'habitudes des jours passés.
    const ids = st.habits.map((h) => h.id);
    for (const d of Object.values(st.days)) d.ids ??= ids;
    return st;
  } catch {
    return freshState();
  }
}

let state = load();
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

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.h);
  toast.h = setTimeout(() => (t.hidden = true), 3200);
}

let audioCtx;
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

const TABS = [
  { id: 'jour', label: 'Jour', icon: '◉' },
  { id: 'focus', label: 'Focus', icon: '◷' },
  { id: 'sport', label: 'Corps', icon: '✚' },
  { id: 'suivi', label: 'Suivi', icon: '▤' },
  { id: 'bilan', label: 'Bilan', icon: '✓' },
];

function currentTab() {
  const h = location.hash.slice(1);
  return TABS.some((t) => t.id === h) ? h : 'jour';
}

function render() {
  const tab = currentTab();
  const views = { jour: viewToday, focus: viewFocus, sport: viewSport, suivi: viewTrack, bilan: viewReview };
  $('#view').innerHTML = views[tab]();
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

function viewToday() {
  const today = todayKey();
  const st = dayStatus(state, today);
  const ch = chain(state, today);
  const rec = recoveryMode(state, today);
  const sp = sprintInfo(state, today);
  const d = state.days[today] ?? { habits: {} };
  const wo = WORKOUTS.find((w) => w.id === WEEK_PLAN[fromKey(today).getDay()]);
  const last7 = lastNDays(state, today, 7).map((x) => ({ ...x, today: x.key === today }));
  const sprintDay = Math.min(diffDays(sp.current.first, today) + 1, SPRINT_LENGTH);
  const allDone = st.valid;

  let banner = '';
  if (rec.jokerUsed) {
    banner = `<div class="banner warn"><strong>Deuxième raté de la semaine.</strong> Une seule reprise par semaine : la chaîne repart de zéro aujourd’hui. Ce n’est pas grave, c’est une info. Fais les minimums et note dans le bilan ce qui t’a fait rater.</div>`;
  } else if (rec.twoMissed) {
    banner = `<div class="banner warn"><strong>Deux jours ratés.</strong> Pas de culpabilité, pas de rattrapage : fais seulement les minimums aujourd’hui. Une journée minimum vaut infiniment plus qu’une journée parfaite qui n’existe pas.</div>`;
  } else if (rec.active) {
    banner = `<div class="banner"><strong>Jour de reprise.</strong> Hier est raté, c’est normal. Règle : jamais deux fois de suite. Fais les minimums, idéalement avant midi, et la chaîne continue.</div>`;
  } else if (allDone) {
    banner = `<div class="banner ok"><strong>Journée validée.</strong> ${st.full ? 'Tout en complet. Bravo, maintenant repose-toi.' : 'Les minimums sont faits. Le complet est un bonus, pas une obligation.'}</div>`;
  }

  return `
  <header class="hero">
    <p class="eyebrow">${esc(longDate(today))}</p>
    <div class="hero-stats">
      <div><span class="big">${ch.count}</span><span class="lbl">jours dans la chaîne${ch.jokers ? ` · ${ch.jokers} reprise${ch.jokers > 1 ? 's' : ''}` : ''}</span></div>
      <div><span class="big">${sp.current.number}<small>/${SPRINT_COUNT}</small></span><span class="lbl">sprint · jour ${sprintDay}/7 · ${sp.current.valid} validé${sp.current.valid > 1 ? 's' : ''}</span></div>
    </div>
    ${dots(last7)}
  </header>
  ${banner}
  <section class="card">
    <div class="card-head"><h2>Aujourd’hui</h2><span class="pill">${st.done}/${st.total}</span></div>
    <p class="hint">Touche « Min » quand le minimum est fait, « Complet » si tu as fait la version complète. La journée est validée dès que tous les minimums sont faits.</p>
    <ul class="habits">
      ${state.habits.map((h) => {
        const lvl = d.habits?.[h.id] ?? 0;
        return `<li class="habit lvl-${lvl}">
          <div class="habit-text"><strong>${esc(h.name)}</strong>
            <span><em>Min :</em> ${esc(h.min)}</span>
            <span><em>Complet :</em> ${esc(h.full)}</span></div>
          <div class="habit-btns">
            <button class="seg ${lvl === 1 ? 'on' : ''}" data-act="habit" data-id="${h.id}" data-lvl="1" aria-pressed="${lvl === 1}">Min</button>
            <button class="seg ${lvl === 2 ? 'on' : ''}" data-act="habit" data-id="${h.id}" data-lvl="2" aria-pressed="${lvl === 2}">Complet</button>
          </div></li>`;
      }).join('')}
    </ul>
  </section>
  ${snackCard(today)}
  <section class="card">
    <div class="card-head"><h2>Séance du jour</h2></div>
    <p><strong>${esc(wo.name)}</strong><br><span class="muted">${esc(wo.desc)}</span></p>
    <div class="row"><a class="btn primary" href="#sport" data-act="start-workout" data-id="${wo.id}">Lancer</a>
    ${wo.id !== 'M' ? '<a class="btn" href="#sport" data-act="start-workout" data-id="M">Juste la mobilité (min)</a>' : ''}</div>
  </section>
  <section class="card">
    <div class="card-head"><h2>Nuit dernière</h2>${d.bed && d.wake ? `<span class="pill">${fmtDuration(sleepDuration(d.bed, d.wake))}</span>` : ''}</div>
    <div class="grid2">
      <label>Couché à<input type="time" data-field="bed" data-key="${today}" value="${esc(d.bed ?? '')}"></label>
      <label>Levé à<input type="time" data-field="wake" data-key="${today}" value="${esc(d.wake ?? '')}"></label>
    </div>
    <p class="hint">Cible : couché à ${esc(state.settings.bedtimeTarget)}. Avance d’abord de 15 min par semaine, pas d’un coup.</p>
  </section>
  <section class="card">
    <div class="card-head"><h2>Mes règles « Si… alors… »</h2></div>
    <ul class="rules">${state.rules.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
  </section>`;
}

function snackCard(key) {
  const d = state.days[key] ?? {};
  const snacks = d.snacks ?? [];
  const resisted = d.snackResisted ?? 0;
  const pending = snackCard.pending;
  return `<section class="card">
    <div class="card-head"><h2>Grignotage</h2><span class="pill">${snacks.length} grignotage${snacks.length > 1 ? 's' : ''} · ${resisted} envie${resisted > 1 ? 's' : ''} résistée${resisted > 1 ? 's' : ''}</span></div>
    ${pending
      ? `<p class="hint">Qu’est-ce qui t’a donné envie ?</p><div class="chips">${SNACK_TRIGGERS.map((t) => `<button class="chip" data-act="snack-log" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div>
         <div class="row"><button class="btn ghost small" data-act="snack-cancel">Annuler</button></div>`
      : `<div class="row"><button class="btn" data-act="snack-resist">Envie résistée</button><button class="btn" data-act="snack-ask">J’ai grignoté</button></div>
         <p class="hint">Pas de culpabilité : note-le, c’est tout. Au bout d’une semaine tu verras tes heures et tes déclencheurs, et on attaque ceux-là.</p>`}
    ${snacks.length ? `<p class="hint">${snacks.map((x) => `${esc(x.time)} · ${esc(x.trigger)}`).join(' — ')}</p>` : ''}
  </section>`;
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
    <div class="clock" id="pomo-clock">${fmtClock(p.remaining)}</div>
    <div class="row center">
      <button class="btn primary" data-act="pomo-toggle" id="pomo-toggle">${p.endAt ? 'Pause' : 'Démarrer'}</button>
      <button class="btn" data-act="pomo-reset">Réinitialiser</button>
      <button class="btn" data-act="pomo-skip">${p.mode === 'work' ? 'Passer en pause' : 'Passer la pause'}</button>
    </div>
    <p class="hint">Avant de démarrer : téléphone dans une autre pièce, ou face cachée en mode avion. 1 session valide le minimum « Focus », 4 valident le complet.</p>
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
  for (let r = 1; r <= rounds; r++) {
    w.exercises.forEach((ex, i) => {
      steps.push({ kind: 'work', name: ex.name, secs: Math.max(15, ex.work + delta), cue: ex.cue, round: r, rounds });
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
  return `
  <section class="card">
    <div class="card-head"><h2>Niveau</h2></div>
    <div class="row">${[1, 2, 3].map((n) => `<button class="seg ${lvl === n ? 'on' : ''}" data-act="level" data-lvl="${n}" aria-pressed="${lvl === n}">Niveau ${n}</button>`).join('')}</div>
    <p class="hint">Passe au niveau suivant quand tu finis 2 séances de suite sans perdre la technique. Niveau 1 = 2 tours, efforts plus courts.</p>
  </section>
  ${WORKOUTS.map((w) => {
    const steps = buildSteps(w, lvl);
    const mins = Math.round(steps.reduce((s, x) => s + x.secs, 0) / 60);
    return `<section class="card ${w.id === planned ? 'planned' : ''}">
      <div class="card-head"><h2>${esc(w.name)}</h2><span class="pill">${w.id === planned ? 'Prévue aujourd’hui · ' : ''}${mins} min</span></div>
      <p class="muted">${esc(w.desc)}</p>
      <details><summary>Voir les exercices</summary><ol class="ex">${w.exercises.map((e) => `<li><strong>${esc(e.name)}</strong> · <a href="${demoUrl(e.name)}" target="_blank" rel="noopener">démo vidéo</a><br><span class="muted">${esc(e.cue)}</span></li>`).join('')}</ol></details>
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

function renderPlayer() {
  const el = $('#player');
  if (!player) {
    el.hidden = true;
    el.innerHTML = '';
    return;
  }
  const s = player.steps[player.i];
  const next = player.steps[player.i + 1];
  el.hidden = false;
  el.className = `player ${s.kind}`;
  el.innerHTML = `
    <div class="player-top"><span>${esc(player.workout.name)}</span><span>${s.round ? `Tour ${s.round}/${s.rounds}` : ''}</span></div>
    <div class="player-main">
      <p class="eyebrow">${s.kind === 'work' ? 'Effort' : s.kind === 'rest' ? 'Repos' : 'Départ'}</p>
      <h2>${esc(s.name)}</h2>
      <div class="clock" id="player-clock">${fmtClock(player.remaining)}</div>
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
  player = null;
  keepAwake(false);
  beep(3);
  renderPlayer();
  render();
  toast('Séance terminée et enregistrée. Bien joué.');
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

function viewReview() {
  const today = todayKey();
  const sp = sprintInfo(state, today);
  const cur = sp.current;
  const prev = sp.sprints[sp.index - 1];
  const reviewTarget = prev && !state.reviews[prev.number]?.change ? prev : cur;
  const rv = state.reviews[reviewTarget.number] ?? {};
  const s = state.settings;
  const lastExp = s.lastExport ? diffDays(s.lastExport.slice(0, 10), today) : null;

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
  </section>
  <section class="card">
    <div class="card-head"><h2>Habitudes</h2></div>
    <p class="hint">5 au maximum. Un minimum doit être faisable en 2 minutes, même un mauvais jour. Les changements s’appliquent à partir d’aujourd’hui, les jours passés ne bougent pas.</p>
    ${state.habits.map((h, i) => `
      <fieldset class="habit-edit">
        <input data-habit="${i}" data-k="name" value="${esc(h.name)}" aria-label="Nom">
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
    if (player.remaining <= 3 && player.remaining > 0 && player.lastBeep !== player.remaining) {
      player.lastBeep = player.remaining;
      navigator.vibrate?.(60);
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
    toast('Session terminée. 5 minutes de pause, loin de l’écran.');
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
    if (dayStatus(state, today).valid && chain(state, today).count > before) toast('Journée validée. Chaîne +1.');
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
    if (!player) return;
    if (player.endAt) {
      player.remaining = Math.ceil((player.endAt - Date.now()) / 1000);
      player.endAt = null;
    } else {
      player.endAt = Date.now() + player.remaining * 1000;
    }
    renderPlayer();
  },
  'player-next'() { if (player) playerGoto(player.i + 1); },
  'player-prev'() { if (player) playerGoto(player.i - 1); },
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
    state.habits.push({ id: `h${Date.now().toString(36)}`, name: 'Nouvelle habitude', min: 'Version 2 minutes', full: 'Version complète' });
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
  export() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cap-sauvegarde-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    state.settings.lastExport = new Date().toISOString();
    save();
    render();
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
  if (el && actions[el.dataset.act]) actions[el.dataset.act](el, e);
});

document.addEventListener('change', (e) => {
  const el = e.target;
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
    el.files[0].text().then((txt) => {
      try {
        const s = JSON.parse(txt);
        if (!s.days || !s.habits) throw new Error('format');
        if (!confirm('Remplacer les données actuelles par ce fichier ?')) return;
        localStorage.setItem(STORE, JSON.stringify(s));
        state = load();
        render();
        toast('Import réussi.');
      } catch {
        toast('Fichier invalide.');
      }
    });
  }
});

document.addEventListener('input', (e) => {
  if (e.target.id === 'pomo-label') {
    state.timers.pomo.label = e.target.value;
    save();
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    if (player?.endAt || state.timers.pomo.endAt) keepAwake(true);
    tick();
  }
});

window.addEventListener('hashchange', () => {
  viewTrack.key = null;
  render();
  window.scrollTo(0, 0);
});

// ---------- démarrage ----------

$('#tabs').innerHTML = TABS.map((t) => `<a href="#${t.id}" data-tab="${t.id}"><span aria-hidden="true">${t.icon}</span>${t.label}</a>`).join('');
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
