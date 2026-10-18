import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solve, between, timeline, figureSVG, figureFor, frameBox, focusFor, BODY, VIEW, BONES, LIMBS, JOINTS } from '../js/figures.js';
import { POSES } from '../js/poses.js';
import { WORKOUTS, WARMUP } from '../js/data.js';

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const bonesKept = (j) => {
  assert.ok(Math.abs(dist(j.hip, j.shoulder) - BONES.torso) < 0.2);
  for (const [, base, mid, end, b1, b2] of LIMBS) {
    assert.ok(Math.abs(dist(j[base], j[mid]) - BONES[b1]) < 0.2, mid);
    assert.ok(Math.abs(dist(j[mid], j[end]) - BONES[b2]) < 0.2, end);
  }
};

const standing = { anchor: 'footN', at: [60, 70], torso: -90, armN: [90, 90], armF: [90, 90], legN: [90, 90], legF: [90, 90] };

test('pose : os de longueur fixe, ancre placée au bon endroit', () => {
  const j = solve(standing);
  assert.deepEqual(j.footN, [60, 70]);
  assert.deepEqual(j.hip, [60, 41]); // jambe 15 + 14 au-dessus du pied
  assert.deepEqual(j.head, [60, 11]); // tronc 22 + cou 8
  bonesKept(j);
});

test('pose : main posée sur une cible (cinématique inverse)', () => {
  const j = solve({ ...standing, anchor: 'hip', at: [50, 60], torso: -20, armN: { to: [70, 70] }, armF: { to: [70, 70], bend: -1 } });
  assert.ok(dist(j.handN, [70, 70]) < 0.2);
  assert.notDeepEqual(j.elbowN, j.elbowF); // les deux coudes plient de chaque côté
  bonesKept(j);
  assert.throws(() => solve({ ...standing, anchor: 'handN', armN: { to: [70, 70] } }));
});

test('entre deux poses : angles par le plus court chemin, os intacts', () => {
  const a = { ...standing, armN: [350, 90] };
  const b = { ...standing, armN: [10, 90] };
  assert.equal(between(a, b, 0.5).armN[0], 360); // passe par 0°, pas par 180°
  bonesKept(solve(between(POSES.Pompes.frames[0], POSES.Pompes.frames[1], 0.5)));
});

test('animation : temps croissants, boucle fermée', () => {
  const keys = timeline(POSES.Pompes);
  assert.equal(keys[0].t, 0);
  assert.equal(keys.at(-1).t, 1);
  for (let i = 1; i < keys.length; i++) assert.ok(keys[i].t > keys[i - 1].t);
  assert.deepEqual(keys[0].joints, keys.at(-1).joints); // aller-retour : revient à la pose de départ
  const cycle = timeline(POSES['Dead bug']);
  assert.deepEqual(cycle[0].joints, cycle.at(-1).joints);
});

test('SVG : animé, immobile, miroir, roue', () => {
  const fig = POSES.Pompes;
  assert.match(figureSVG(fig), /<animate attributeName="x1"/);
  assert.equal((figureSVG(fig).match(/<line /g) ?? []).length, BODY.length); // un trait par os
  assert.match(figureSVG(fig), /<g class="fig-far">/); // le côté du fond est à part (plus sombre)
  assert.doesNotMatch(figureSVG({ ...fig, front: true }), /fig-far/); // vue de face : les deux côtés pareils
  assert.doesNotMatch(figureSVG(fig, { animate: false }), /<animate/);
  assert.match(figureSVG(fig, { mirror: true }), /scale\(-1 1\)/);
  assert.doesNotMatch(figureSVG(fig), /fig-wheel/);
  assert.match(figureSVG({ ...fig, wheel: true }), /class="fig-wheel"/);
});

test('bonhomme d’un exercice d’après son nom', () => {
  assert.deepEqual(figureFor('Pompes'), { fig: POSES.Pompes, mirror: false });
  assert.equal(figureFor('Exercice inconnu'), null);
});

test('toutes les poses : sur le tapis, dans le cadre, sans membre étiré', () => {
  for (const [name, fig] of Object.entries(POSES)) {
    const anchor = fig.frames[0].anchor ?? 'hip';
    for (const f of fig.frames) assert.equal(f.anchor ?? 'hip', anchor, `${name} : même ancre partout`);
    for (const { joints } of timeline(fig)) {
      bonesKept(joints);
      for (const k of JOINTS) {
        const [x, y] = joints[k];
        assert.ok(x >= 3 && x <= VIEW.w - 3 && y >= 3 && y <= VIEW.h - 3, `${name} : ${k} hors cadre`);
        assert.ok(y <= VIEW.floor + 1, `${name} : ${k} sous le sol`);
      }
    }
    for (const f of fig.frames) {
      const j = solve(f);
      // Sur parallettes, les mains posées sur les poignées (≈ 4,5 au-dessus du sol) suffisent.
      const support = fig.parallettes ? Math.max(j.handN[1], j.handF[1]) + 4.5 : -Infinity;
      assert.ok(Math.max(support, ...JOINTS.map((k) => j[k][1])) >= VIEW.floor - 1.5, `${name} : flotte au-dessus du tapis`);
    }
  }
});

test('cadre serré : tout le mouvement et le sol, sans couper la tête', () => {
  const keys = timeline(POSES.Pompes);
  const [x, y, w, h] = frameBox(keys);
  for (const { joints } of keys) {
    for (const k of JOINTS) {
      assert.ok(joints[k][0] >= x && joints[k][0] <= x + w, k);
      assert.ok(joints[k][1] >= y && joints[k][1] <= y + h, k);
    }
    assert.ok(joints.head[1] - BONES.head >= y);
  }
  assert.ok(y + h >= VIEW.floor + 5 && h >= 30);
  assert.match(figureSVG(POSES.Pompes, { fit: true }), new RegExp(`viewBox="${x} ${y} ${w} ${h}"`));
  // en miroir, le cadre est retourné autour du centre
  assert.match(figureSVG(POSES.Pompes, { fit: true, mirror: true }), new RegExp(`viewBox="${Math.round((VIEW.w - x - w) * 10) / 10} ${y} `));
});

test('chaque exercice des séances et de l’échauffement a son bonhomme', () => {
  const names = [...WORKOUTS.flatMap((w) => w.exercises.map((e) => e.name)), ...WARMUP.map((e) => e.name)];
  for (const name of names) assert.ok(figureFor(name), `bonhomme manquant : ${name}`);
  // Planche latérale de face : couché sur le côté gauche et tourné vers toi, il a la tête à droite de
  // l'écran ; la version (droite) est donc en miroir. Les poses de profil gardent le miroir sur (gauche).
  assert.equal(figureFor('Planche latérale (gauche)').mirror, false);
  assert.equal(figureFor('Planche latérale (droite)').mirror, true);
  assert.equal(figureFor('Fente basse (gauche)').mirror, true);
  // Nom complet d'abord, puis nom de base
  assert.equal(figureFor('Pompes (sur parallettes)').fig, POSES['Pompes (sur parallettes)']);
  assert.equal(figureFor('Shadow boxing (esquives et crochets)').fig, POSES['Shadow boxing (esquives et crochets)']);
  assert.equal(figureFor('Écarté arrière à l’élastique (léger)').fig, POSES['Écarté arrière à l’élastique']);
  assert.equal(figureFor('Roue abdominale à genoux (2/2)').fig, POSES['Roue abdominale à genoux']);
});

test('muscle travaillé allumé d’après l’objectif', () => {
  assert.deepEqual(focusFor('Bas des abdos · la tablette'), ['waist']);
  assert.deepEqual(focusFor('Pectoraux · buste dessiné'), ['chest']);
  assert.deepEqual(focusFor('Cou · tête droite, mâchoire dégagée'), ['neck']);
  assert.deepEqual(focusFor('Triceps · bras dessinés'), ['upperArmN', 'upperArmF', 'forearmN', 'forearmF']);
  assert.deepEqual(focusFor('Colonne souple'), ['waist', 'chest']);
  assert.deepEqual(focusFor('Cardio · corps sec'), []);
  const svg = figureSVG(POSES.Pompes, { focus: ['chest'] });
  assert.equal((svg.match(/fig-focus/g) ?? []).length, 1);
  // chaque exercice qui vise un muscle en allume au moins un (sauf cardio pur et récupération)
  for (const w of WORKOUTS) for (const e of w.exercises) {
    if (!/cardio|corps entier|récupération|calme/i.test(e.target)) assert.ok(focusFor(e.target).length, `rien d’allumé : ${e.name} (${e.target})`);
  }
});

test('yeux : un de profil, deux de face, du côté du visage ; jamais en trait d’os', () => {
  const eyes = (svg) => [...svg.matchAll(/<circle class="fig-eye" cx="([\d.]+)" cy="([\d.]+)"/g)].map((m) => [Number(m[1]), Number(m[2])]);
  const head = (svg) => svg.match(/<circle class="fig-head" cx="([\d.]+)" cy="([\d.]+)"/).slice(1).map(Number);
  const svg = (n) => figureSVG(POSES[n], { animate: false });
  assert.equal(eyes(svg('Pompes')).length, 1);
  assert.equal(eyes(svg('Planche latérale')).length, 2);
  for (const n of ['Pompes', 'Planche latérale']) assert.equal((svg(n).match(/<line /g) ?? []).length, BODY.length, n);
  // Couché sur le dos : l'œil regarde le plafond ; à plat ventre : le tapis ; debout en garde : la droite
  for (const n of ['Dead bug', 'Pont fessier', 'Crunch inversé', 'Crunch', 'Anges au sol']) assert.ok(eyes(svg(n))[0][1] < head(svg(n))[1], n);
  for (const n of ['Tirage superman', 'Superman', 'Pompes']) assert.ok(eyes(svg(n))[0][1] > head(svg(n))[1], n);
  assert.ok(eyes(svg('Shadow boxing'))[0][0] > head(svg('Shadow boxing'))[0]);
});

test('parallettes, élastique et repère fixe dessinés quand la pose le demande', () => {
  const svg = (n) => figureSVG(POSES[n], { animate: false });
  assert.equal((svg('Pompes (sur parallettes)').match(/class="fig-par"/g) ?? []).length, 2);
  assert.match(svg('L-sit'), /class="fig-par"/);
  assert.match(svg('Écarté arrière à l’élastique'), /class="fig-band"/);
  assert.match(svg('Chin tucks'), /class="fig-guide"/);
  assert.doesNotMatch(svg('Pompes'), /fig-par|fig-band|fig-guide/);
});

test('données : sur le dos, le regard est au plafond (face: -1 écrit dans la pose)', () => {
  for (const [name, fig] of Object.entries(POSES)) {
    if (fig.front) continue;
    const j = solve(fig.frames[0]);
    const lying = Math.abs(j.shoulder[1] - j.hip[1]) < 0.55 * BONES.torso && j.hip[1] > VIEW.floor - 6;
    const kneesUp = Math.min(j.kneeN[1], j.kneeF[1]) < j.hip[1] - 4;
    if (lying && kneesUp) assert.equal(fig.face, -1, `${name} : sur le dos, il faut face: -1`);
  }
  // fentes : le pied d'appui ne glisse pas pendant sa moitié
  const lunge = POSES['Fentes arrière alternées'].frames.map(solve);
  for (const i of [1, 2, 3]) assert.deepEqual(lunge[i].footF, lunge[0].footF);
  for (const i of [5, 6, 7]) assert.deepEqual(lunge[i].footN, lunge[4].footN);
});
