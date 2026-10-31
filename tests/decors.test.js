import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DECORS, decorStats, decorStatus, decorToShow, newDecors, decorArt, decorThumb } from '../js/decors.js';
import { hubSVG } from '../js/gym.js';

// Chaque balise ouverte est refermée, dans l'ordre (sinon le dessin casse).
function wellFormed(svg) {
  const stack = [];
  for (const [, close, name, self] of svg.matchAll(/<(\/?)([a-zA-Z]+)\b[^>]*?(\/?)>/g)) {
    if (self) continue;
    if (!close) stack.push(name);
    else if (stack.pop() !== name) return false;
  }
  return stack.length === 0;
}
const ids = (svg) => [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
const refsOk = (svg) => [...svg.matchAll(/url\(#([^)]+)\)/g)].every(([, ref]) => ids(svg).includes(ref));

test('décors : la salle d’abord, ouverte ; les autres à débloquer, chacun son défi', () => {
  assert.equal(DECORS[0].id, 'salle');
  assert.equal(DECORS[0].need, null);
  assert.equal(new Set(DECORS.map((d) => d.id)).size, DECORS.length);
  assert.ok(DECORS.length >= 12, 'beaucoup de décors');
  for (const d of DECORS.slice(1)) {
    assert.ok(['workouts', 'level', 'blocs', 'calc', 'gems', 'sudoku', 'routines'].includes(d.need.kind), d.id);
    assert.ok(d.need.n > 0, d.id);
    assert.ok(d.name && d.desc, d.id);
  }
  // les décors demandés : temple grec, grand hall médiéval
  assert.ok(DECORS.some((d) => d.id === 'grec') && DECORS.some((d) => d.id === 'medieval'));
});

test('décors : débloqués au seuil exact, la progression s’affiche, les chiffres bizarres comptent pour zéro', () => {
  const at = (stats, id) => decorStatus(stats).find((d) => d.id === id);
  assert.equal(at({ workouts: 14 }, 'grec').unlocked, false);
  assert.equal(at({ workouts: 14 }, 'grec').label, '14 / 15 séances');
  assert.ok(Math.abs(at({ workouts: 14 }, 'grec').pct - 14 / 15) < 1e-9);
  assert.equal(at({ workouts: 15 }, 'grec').unlocked, true);
  assert.equal(at({ workouts: 15 }, 'grec').label, 'Débloqué');
  assert.equal(at({ workouts: 39 }, 'medieval').unlocked, false);
  assert.equal(at({ workouts: 40 }, 'medieval').unlocked, true);
  assert.equal(at({ level: 12 }, 'station').unlocked, true);
  assert.equal(at({ level: 12 }, 'sommet').label, 'niveau 12 / 20');
  assert.equal(at({ blocs: 2999 }, 'dojo').label.replace(/\s/g, ' '), '2 999 / 3 000 points aux Blocs'); // espaces fines du français
  assert.equal(at({ blocs: 3000 }, 'dojo').unlocked, true);
  assert.equal(at({ calc: 30 }, 'toit').unlocked, true);
  assert.equal(at({ calc: 29 }, 'toit').label, '29 / 30 points au Calcul éclair');
  assert.equal(at({ gems: 7 }, 'neon').label, 'niveau 7 / 8 aux Cristaux');
  assert.equal(at({ gems: 8 }, 'neon').unlocked, true);
  assert.equal(at({ sudoku: 9 }, 'ocean').label, '9 / 10 sudokus résolus');
  assert.equal(at({ sudoku: 10 }, 'ocean').unlocked, true);
  assert.equal(at({ routines: 19 }, 'foret').label, '19 / 20 matins avec ta routine');
  assert.equal(at({ routines: 20 }, 'foret').unlocked, true);
  assert.equal(at({ workouts: 59 }, 'arene').unlocked, false);
  assert.equal(at({ workouts: 60 }, 'arene').unlocked, true);
  // au-delà du seuil, la barre reste pleine ; rien ou n'importe quoi : zéro
  assert.equal(at({ workouts: 99 }, 'grec').pct, 1);
  for (const junk of [{}, { workouts: -5 }, { workouts: 'abc' }, { workouts: NaN }, undefined]) {
    const s = decorStatus(junk);
    assert.deepEqual(s.filter((d) => d.unlocked).map((d) => d.id), ['salle']);
    assert.ok(s.every((d) => d.pct >= 0 && d.pct <= 1 && !/NaN/.test(d.label)));
  }
});

test('décors : on voit celui choisi seulement s’il est débloqué, sinon la salle', () => {
  assert.equal(decorToShow('grec', { workouts: 15 }), 'grec');
  assert.equal(decorToShow('grec', { workouts: 3 }), 'salle');
  assert.equal(decorToShow('inconnu', { workouts: 99 }), 'salle');
  assert.equal(decorToShow(undefined, {}), 'salle');
  assert.equal(decorToShow('salle', {}), 'salle');
});

test('décors : chacun n’est annoncé qu’une fois, la salle jamais', () => {
  const stats = { workouts: 20, blocs: 3500 };
  assert.deepEqual(newDecors(['salle'], stats).map((d) => d.id), ['grec', 'dojo']);
  assert.deepEqual(newDecors(['salle', 'grec'], stats).map((d) => d.id), ['dojo']);
  assert.deepEqual(newDecors(['salle', 'grec', 'dojo'], stats), []);
  assert.deepEqual(newDecors(null, {}), []);
  assert.deepEqual(newDecors('salle', { workouts: 15 }).map((d) => d.id), ['grec']);
});

test('décors : tes chiffres viennent de tes données (séances sans M, une fois par jour ; meilleure partie)', () => {
  const state = {
    settings: { startDate: '2026-10-01' },
    habits: [],
    days: {
      '2026-10-01': { workouts: ['A', 'A', 'M'] }, // refaite le même jour : compte une fois ; M ne compte pas
      '2026-10-02': { workouts: ['B'] },
      '2026-10-03': {},
    },
    games: { blocs: { best: 2500, cur: { score: 3100, over: false } }, calc: { best: 31 }, cristaux: { top: 8, level: 9 }, sudoku: { solved: { facile: 6, moyen: 3, difficile: 1 } } },
  };
  state.days['2026-10-01'].routine = ['eau', 'douche', 'sourcils', 'cheveux']; // un matin complet
  state.days['2026-10-02'].routine = ['eau']; // pas complet
  const stats = decorStats(state);
  assert.equal(stats.workouts, 2);
  assert.equal(stats.blocs, 3100); // la partie en cours compte déjà
  assert.equal(stats.calc, 31);
  assert.equal(stats.level, 2); // 4 séances × 30 XP = 120 XP
  assert.equal(stats.gems, 8); // niveaux réussis aux Cristaux
  assert.equal(stats.sudoku, 10);
  assert.equal(stats.routines, 1);
  assert.deepEqual(decorStatus(stats).filter((d) => d.unlocked).map((d) => d.id), ['salle', 'dojo', 'toit', 'ocean', 'neon']);
  // sans jeux ni jours : tout à zéro, niveau 1
  assert.deepEqual(decorStats({ settings: {}, habits: [], days: {} }), { workouts: 0, level: 1, blocs: 0, calc: 0, gems: 0, sudoku: 0, routines: 0 });
});

test('décors : chaque salle se dessine en entier, avec ses postes, sa borne et la séance affichée', () => {
  for (const { id } of DECORS) {
    for (const animate of [true, false]) {
      const svg = hubSVG({ pick: 'B', id: `t-${id}`, decor: id, animate });
      assert.ok(wellFormed(svg), `${id} : balises mal fermées`);
      assert.doesNotMatch(svg, /https?:|<script|<image|\son\w+=|NaN|undefined|Infinity/, id);
      const all = ids(svg);
      assert.equal(new Set(all).size, all.length, `${id} : identifiant en double`);
      assert.ok(refsOk(svg), `${id} : couleur introuvable`);
      assert.match(svg, /SÉANCE B/, id);
      assert.match(svg, /class="hub-screen"/, id);
      assert.match(svg, /class="hub-arcade"/, id);
      assert.equal((svg.match(/class="hub-plat"/g) ?? []).length, 5, id);
      if (!animate) assert.doesNotMatch(svg, /<animate/, `${id} : ça bouge alors qu’on réduit les animations`);
    }
  }
  // des décors vraiment différents
  assert.equal(new Set(DECORS.map(({ id }) => decorArt(id).back)).size, DECORS.length);
  // décor inconnu : la salle
  assert.equal(decorArt('inconnu').back, decorArt('salle').back);
});

test('décors : les vignettes du choix tiennent ensemble sur la même fiche', () => {
  const sheet = DECORS.map(({ id }) => decorThumb(id)).join('');
  assert.ok(wellFormed(sheet));
  const all = ids(sheet);
  assert.equal(new Set(all).size, all.length);
  assert.ok(refsOk(sheet));
  assert.doesNotMatch(sheet, /<animate|https?:|NaN|undefined/);
  assert.equal((sheet.match(/class="decor-thumb"/g) ?? []).length, DECORS.length);
});
