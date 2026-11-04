// Le classeur des exercices, comme une collection de jeu vidéo : chaque
// mouvement de tes séances (et de l'échauffement) a sa fiche. Il se découvre
// la première fois que tu fais une séance qui le contient ; sa fiche dit en
// quelles séances il est, combien de jours tu l'as fait et ton record. Calculé
// depuis tes jours et tes records, rien n'est stocké.
// Logique pure (sans DOM), testée par tests/binder.test.js.
import { baseName } from './data.js';
import { goalOf } from './logic.js';

// workouts : les séances (data.js) ; warmup : l'échauffement, fait au début
// des séances qui ne sont pas fixes (A, B, C).
export function binder(state, workouts, warmup = []) {
  const map = new Map();
  const add = (e, w, warm) => {
    const name = baseName(e.name);
    // le nom affiché garde ce qui dit le mouvement (« sur parallettes »), pas le côté ni le passage
    const label = e.name.replace(/\s*\((\d\/\d|droite|gauche|léger|selon ton niveau)\)\s*$/, '');
    if (!map.has(name)) map.set(name, { name, label, names: [], workouts: [], target: e.target ?? '', why: e.why ?? '', cue: e.cue ?? '', unit: goalOf(e.cue)?.unit ?? null, warm });
    const x = map.get(name);
    if (!x.names.includes(e.name)) x.names.push(e.name);
    if (!x.workouts.includes(w)) x.workouts.push(w);
  };
  for (const w of workouts) for (const e of w.exercises) add(e, w.id, false);
  for (const w of workouts) if (!w.fixed) for (const e of warmup) add(e, w.id, true);
  // les jours (une séance refaite le même jour compte une fois)
  const days = Object.values(state?.days && typeof state.days === 'object' ? state.days : {}).map((d) => new Set(Array.isArray(d?.workouts) ? d.workouts : []));
  const records = Object.entries(state?.records ?? {}).map(([k, r]) => [k.slice(0, k.lastIndexOf('#')), r]);
  const list = [...map.values()].map((x) => {
    const times = days.filter((set) => x.workouts.some((w) => set.has(w))).length;
    const bests = records.filter(([n, r]) => x.names.includes(n) && Number.isFinite(r?.best) && r.best > 0).map(([, r]) => r.best);
    return { ...x, times, found: times > 0, best: bests.length ? Math.max(...bests) : null };
  });
  return { list, found: list.filter((x) => x.found).length, total: list.length };
}
