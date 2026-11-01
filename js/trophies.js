// Les trophées : des médailles (bronze, argent, or) pour tes séances, ta
// chaîne, ton niveau, tes routines, les jeux et les décors. Recalculés depuis
// tes données ; ceux déjà annoncés (settings.trophiesSeen) restent gagnés,
// même si une chaîne casse ensuite. Logique pure, testée par tests/trophies.test.js.
import { chain } from './logic.js';
import { decorStats, decorStatus } from './decors.js';
import { SEASONS, seasonWorkouts, dateFr } from './seasons.js';

const T = (id, group, icon, name, desc, tier, kind, n) => ({ id, group, icon, name, desc, tier, need: { kind, n } });
export const TROPHIES = [
  T('s1', 'Séances', 'dumbbell', 'Premier pas', 'Ta première séance', 'bronze', 'workouts', 1),
  T('s10', 'Séances', 'dumbbell', 'Habitué', '10 séances', 'bronze', 'workouts', 10),
  T('s30', 'Séances', 'dumbbell', 'Pilier de la salle', '30 séances', 'argent', 'workouts', 30),
  T('s100', 'Séances', 'dumbbell', 'Centurion', '100 séances', 'or', 'workouts', 100),
  T('c10', 'Séances', 'target', 'Boxeur', '10 séances C (cardio boxe)', 'argent', 'boxe', 10),
  T('ch3', 'Chaîne', 'flame', 'Lancé', '3 jours de chaîne', 'bronze', 'chain', 3),
  T('ch7', 'Chaîne', 'flame', 'Une semaine', '7 jours de chaîne', 'argent', 'chain', 7),
  T('ch30', 'Chaîne', 'flame', 'Un mois entier', '30 jours de chaîne', 'or', 'chain', 30),
  T('lv5', 'Niveau', 'sparkles', 'Solide', 'Niveau 5', 'bronze', 'level', 5),
  T('lv10', 'Niveau', 'sparkles', 'Discipliné', 'Niveau 10', 'argent', 'level', 10),
  T('lv20', 'Niveau', 'sparkles', 'Maître de soi', 'Niveau 20', 'or', 'level', 20),
  T('rm7', 'Routines', 'sun', 'Matinal', '7 matins avec ta routine', 'bronze', 'routines', 7),
  T('rm30', 'Routines', 'sun', 'Réglé comme une horloge', '30 matins avec ta routine', 'or', 'routines', 30),
  T('rs7', 'Routines', 'moon', 'Couche-tôt', '7 soirs avec ta routine', 'bronze', 'soirs', 7),
  T('rs30', 'Routines', 'moon', 'Nuits de champion', '30 soirs avec ta routine', 'or', 'soirs', 30),
  T('g-blocs', 'Jeux', 'grid', 'Bâtisseur', '2 000 points aux Blocs', 'bronze', 'blocs', 2000),
  T('g-gems', 'Jeux', 'sparkles', 'Joaillier', 'Niveau 5 réussi aux Cristaux', 'argent', 'gems', 5),
  T('g-snake', 'Jeux', 'apple', 'Charmeur de serpent', '25 fruits au Serpent', 'argent', 'serpent', 25),
  T('g-bricks', 'Jeux', 'grid', 'Démolisseur', 'Niveau 3 nettoyé au Casse-briques', 'argent', 'briques', 3),
  T('g-calc', 'Jeux', 'coin', 'Calculateur', '20 points au Calcul éclair', 'argent', 'calc', 20),
  T('g-pairs', 'Jeux', 'cards', 'Œil de lynx', 'Niveau 5 réussi aux Paires', 'argent', 'paires', 5),
  T('g-code', 'Jeux', 'lock', 'Décodeur', '5 codes secrets trouvés', 'bronze', 'code', 5),
  T('g-echo', 'Jeux', 'lightbulb', 'Mémoire d’éléphant', 'Une suite de 10 à Écho', 'argent', 'echo', 10),
  T('g-sudoku', 'Jeux', 'pencil', 'Logicien', '5 sudokus résolus', 'bronze', 'sudoku', 5),
  T('g-taquin', 'Jeux', 'grid', 'Grand rangement', 'Un taquin 4 × 4 rangé', 'or', 'taquin4', 1),
  T('g-sprint', 'Jeux', 'trending-up', 'Sprinteur', '1 000 m au Sprint', 'argent', 'sprint', 1000),
  T('g-pixels', 'Jeux', 'search', 'Œil de pixel', '10 dessins trouvés aux Pixels cachés', 'or', 'pixels', 10),
  T('d3', 'Décors', 'map', 'Décorateur', '3 décors débloqués', 'bronze', 'decors', 3),
  T('d8', 'Décors', 'map', 'Collectionneur', '8 décors débloqués', 'argent', 'decors', 8),
  T('d17', 'Décors', 'map', 'Tous les mondes', 'Les 17 décors débloqués', 'or', 'decors', 17),
  // les saisons : des séances pendant la saison (seasons.js), la même année
  ...SEASONS.map((s) => T(`saison-${s.id}`, 'Saisons', s.icon, s.trophy, `${s.n} séances pendant « ${s.name} » (du ${dateFr(s.from)} au ${dateFr(s.to)})`, s.tier, s.id, s.n)),
];

const fmt = (n) => Number(n).toLocaleString('fr-FR');
const UNIT = {
  workouts: 'séances', boxe: 'séances C', chain: 'jours de chaîne', routines: 'matins', soirs: 'soirs', blocs: 'points', serpent: 'fruits',
  calc: 'points', code: 'codes', echo: 'touches', sudoku: 'sudokus', decors: 'décors', taquin4: 'taquin 4 × 4', sprint: 'm', pixels: 'dessins',
  ...Object.fromEntries(SEASONS.map((s) => [s.id, 'séances pendant la saison'])),
};
const LEVELS = new Set(['level', 'gems', 'paires', 'briques']);

// Tes chiffres pour les trophées : ceux des décors, plus ta chaîne du jour,
// tes records d'Écho, du Casse-briques, du Taquin 4 × 4 et tes décors débloqués.
export function trophyStats(state, today) {
  const s = decorStats(state);
  const g = state.games ?? {};
  return {
    ...s,
    chain: state.settings?.startDate ? chain(state, today).count : 0,
    echo: g.echo?.best ?? 0,
    briques: g.briques?.level ?? 0,
    taquin4: g.taquin?.best?.[4] ? 1 : 0,
    sprint: g.sprint?.best ?? 0,
    pixels: Array.isArray(g.pixels?.done) ? g.pixels.done.length : 0,
    decors: decorStatus(s).filter((d) => d.unlocked).length,
    ...seasonWorkouts(state.days), // séances pendant Halloween, Noël… (la meilleure année)
  };
}

// Chaque trophée : gagné (maintenant, ou déjà annoncé), avancement, texte de progression.
export function trophyStatus(stats = {}, seen = []) {
  const known = new Set(Array.isArray(seen) ? seen : []);
  return TROPHIES.map((t) => {
    const have = Math.max(0, Math.floor(Number(stats[t.need.kind]) || 0));
    const earned = have >= t.need.n || known.has(t.id);
    const shown = Math.min(have, t.need.n);
    const label = earned ? t.desc : LEVELS.has(t.need.kind) ? `niveau ${shown} / ${t.need.n}` : `${fmt(shown)} / ${fmt(t.need.n)} ${UNIT[t.need.kind]}`;
    return { ...t, earned, pct: earned ? 1 : Math.min(1, have / t.need.n), label };
  });
}

// Les trophées gagnés qu'on ne t'a pas encore annoncés.
export function newTrophies(seen, stats) {
  const known = new Set(Array.isArray(seen) ? seen : []);
  return trophyStatus(stats, seen).filter((t) => t.earned && !known.has(t.id));
}
