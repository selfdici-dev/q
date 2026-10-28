import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { solve, between, timeline, figureSVG, figureFor, frameBox, focusFor, explain, arrowPath, footPose, smoothFeet, handAngle, barAt, BODY, VIEW, BONES, LIMBS, JOINTS, MOVE_MIN, FLOOR_LIMIT, BAR_DIR } from '../js/figures.js';
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
// Pièces du corps (buste, cou, bras, avant-bras, cuisses, jambes) : 10 par bonhomme.
const PIECES = 10;
const count = (svg, re) => (svg.match(re) ?? []).length;

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
  // les pièces tournent (animateTransform), elles ne sont plus des traits
  assert.match(figureSVG(fig), /<animateTransform attributeName="transform" type="rotate"/);
  assert.doesNotMatch(figureSVG(fig), /<line /);
  assert.equal(count(figureSVG(fig, { help: false }), /class="fig-skin"/g), PIECES); // une forme par pièce
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
      // Sur parallettes, les mains posées sur les poignées (≈ 4,5 au-dessus du sol) suffisent ;
      // à la barre, les mains tiennent la barre (voir le test de la barre).
      const support = fig.bar ? VIEW.floor : fig.parallettes ? Math.max(j.handN[1], j.handF[1]) + 4.5 : -Infinity;
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
  assert.deepEqual(focusFor('Pectoraux et triceps · torse ferme'), ['chest', 'upperArmN', 'upperArmF']); // le triceps n'est pas dans l'avant-bras
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
  const head = (n) => solve(POSES[n].frames[0]).head; // centre du crâne
  const svg = (n) => figureSVG(POSES[n], { animate: false, help: false });
  assert.equal(eyes(svg('Pompes')).length, 1);
  assert.equal(eyes(svg('Planche latérale')).length, 2);
  for (const n of ['Pompes', 'Planche latérale']) assert.doesNotMatch(svg(n), /<line /, n);
  // Couché sur le dos : l'œil regarde le plafond ; à plat ventre : le tapis ; debout en garde : la droite
  for (const n of ['Dead bug', 'Pont fessier', 'Crunch inversé', 'Crunch', 'Anges au sol']) assert.ok(eyes(svg(n))[0][1] < head(n)[1], n);
  for (const n of ['Tirage superman', 'Superman', 'Pompes']) assert.ok(eyes(svg(n))[0][1] > head(n)[1], n);
  assert.ok(eyes(svg('Shadow boxing'))[0][0] > head('Shadow boxing')[0]);
});

test('parallettes, élastique et repère fixe dessinés quand la pose le demande', () => {
  const svg = (n) => figureSVG(POSES[n], { animate: false });
  assert.equal((svg('Pompes (sur parallettes)').match(/class="fig-par"/g) ?? []).length, 2);
  assert.match(svg('L-sit'), /class="fig-par"/);
  assert.match(svg('Écarté arrière à l’élastique'), /class="fig-band"/);
  assert.match(svg('Chin tucks'), /class="fig-guide"/);
  assert.match(svg('Tractions'), /class="fig-bar"/);
  assert.doesNotMatch(svg('Pompes'), /fig-par|fig-band|fig-guide|fig-bar/);
  // de face, l'élastique passe devant les bras (sinon il est caché)
  const front = svg('Écarté arrière à l’élastique');
  assert.ok(front.indexOf('class="fig-band"') > front.lastIndexOf('class="fig-hand"'));
});

// ——— Nouveau dessin : pièces rigides, pieds, mains, tête, aides ———

test('pièces rigides en chaîne : os de taille fixe, rien d’étiré', () => {
  const svg = figureSVG(POSES.Pompes);
  // coude à 12 de l'épaule, poignet à 11 du coude, genou à 15 de la hanche ; la cheville
  // remonte un peu le long du tibia quand le pied est sur la pointe (14 - t)
  assert.match(svg, /translate\(12 0\)/);
  assert.match(svg, /translate\(11 0\)/);
  assert.match(svg, /translate\(15 0\)/);
  // chaque forme est écrite une fois et reprise par <use> ; identifiants uniques
  const ids = [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const [, ref] of svg.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(ref), ref);
  for (const [, ref] of svg.matchAll(/url\(#([^)]+)\)/g)) assert.ok(ids.includes(ref), ref);
  // aucune valeur cassée, aucune animation qui ne bouge pas
  assert.doesNotMatch(svg, /NaN|undefined|Infinity/);
  for (const [, values] of svg.matchAll(/values="([^"]+)"/g)) assert.ok(new Set(values.split(';')).size > 1);
});

test('toutes les poses se dessinent (animées, fixes, aides, miroir), sans valeur cassée', () => {
  for (const [name, fig] of Object.entries(POSES)) {
    for (const opts of [{}, { animate: false }, { fit: true, mirror: true }, { pose: fig.frames.length - 1 }, { focus: ['waist', 'chest', 'thighN', 'upperArmF', 'neck'] }]) {
      const svg = figureSVG(fig, opts);
      assert.doesNotMatch(svg, /NaN|undefined|Infinity/, `${name} ${JSON.stringify(opts)}`);
      assert.equal(count(svg, /class="fig-eye"/g), fig.front ? 2 : 1, name);
      assert.equal(count(svg, /class="fig-head"/g), 1, name);
    }
  }
});

test('pieds : jamais dans le tapis, jamais retournés d’un coup ; à plat, sur la pointe ou tendus', () => {
  for (const [name, fig] of Object.entries(POSES)) {
    if (fig.front) continue;
    const face = fig.face ?? 1;
    const j0 = solve(fig.frames[0]);
    const prone = face > 0 && Math.abs(j0.shoulder[1] - j0.hip[1]) < 9 && j0.hip[1] > VIEW.floor - 8;
    const keys = timeline(fig);
    for (const side of ['N', 'F']) {
      const [knees, ankles] = [keys.map((k) => k.joints[`knee${side}`]), keys.map((k) => k.joints[`foot${side}`])];
      const raw = keys.map(({ joints }) => footPose(joints[`knee${side}`], joints[`foot${side}`], face, prone));
      for (const f of raw) assert.ok(f.low <= FLOOR_LIMIT + 0.05, `${name} : pied ${side} dans le tapis (${f.low})`);
      // tel qu'il est dessiné (rotations réparties) : jamais retourné (180°) d'une image à
      // l'autre ; 60° au plus dans les exercices où le pied reste du même côté
      const drawn = smoothFeet(raw, knees, ankles, face);
      const max = /Mountain|Burpees|Fentes|Pompes|Planche|Montées|Pont/.test(name) ? 60.01 : 120;
      drawn.forEach((f, i) => {
        assert.ok(f.t >= 0 && f.t <= 3, name);
        if (i) assert.ok(Math.abs(((f.phi - drawn[i - 1].phi + 540) % 360) - 180) <= max, `${name} : pied ${side} retourné (${i})`);
      });
    }
  }
  const at = (n, i, side = 'N') => {
    const j = solve(POSES[n].frames[i]);
    return footPose(j[`knee${side}`], j[`foot${side}`], POSES[n].face ?? 1, n === 'Superman');
  };
  assert.equal(at('Pompes', 0).mode, 'pointe'); // en planche : sur la pointe, talon levé
  assert.equal(at('Fentes arrière alternées', 2).mode, 'pointe'); // pied arrière de la fente
  assert.equal(at('Fentes arrière alternées', 2, 'F').mode, 'plat'); // pied avant à plat
  assert.equal(at('Pont fessier', 0).mode, 'plat'); // sur le dos, genoux pliés : pieds à plat
  assert.equal(at('Superman', 0).mode, 'tendu'); // à plat ventre : pied tendu
  assert.equal(at('Chat-vache', 0).mode, 'tendu'); // à quatre pattes : dessus du pied au sol
  assert.equal(at('Langue au palais', 0).mode, 'plat'); // debout
});

test('mains : poing en l’air, paume à plat au sol, doigts vers l’avant', () => {
  const j = solve(POSES.Pompes.frames[0]);
  assert.ok(Math.abs(handAngle(j.elbowN, j.handN, 1)) < 1e-9); // bras vertical, main au sol : doigts vers la tête
  assert.equal(handAngle(j.elbowN, j.handN, 1, true), Math.atan2(j.handN[1] - j.elbowN[1], j.handN[0] - j.elbowN[0]) * 180 / Math.PI); // parallettes : poing
  const up = solve(POSES['Curl biceps à l’élastique'].frames[1]);
  const inline = Math.atan2(up.handN[1] - up.elbowN[1], up.handN[0] - up.elbowN[0]) * 180 / Math.PI;
  assert.equal(handAngle(up.elbowN, up.handN, 1), inline); // en l'air : dans l'axe de l'avant-bras
  const bridge = solve(POSES['Pont fessier'].frames[0]);
  assert.ok(Math.abs(Math.abs(handAngle(bridge.elbowN, bridge.handN, 1)) - 180) < 8); // bras tendu le long du corps : main vers les pieds
});

test('tête par-dessus le corps, zones allumées, côté éloigné à part', () => {
  const side = figureSVG(POSES.Crunch, { animate: false, help: false });
  assert.ok(side.indexOf('class="fig-head"') > side.lastIndexOf('class="fig-hand"')); // mains derrière la tête : le visage reste visible
  const front = figureSVG(POSES['Shadow boxing (esquives et crochets)'], { animate: false, help: false });
  assert.ok(front.indexOf('class="fig-head"') < front.lastIndexOf('class="fig-hand"')); // de face : les poings de la garde devant le visage
  const zones = (focus) => count(figureSVG(POSES.Pompes, { focus, animate: false, help: false }), /fig-muscle fig-focus/g);
  assert.equal(zones(['waist']), 1); // la tablette (pas une bande)
  assert.equal(zones(['thighN', 'thighF']), 3); // les deux cuisses et les fessiers
  assert.equal(zones(['upperArmN', 'upperArmF']), 2);
  assert.equal(zones([]), 0);
  // de face, pas de fessiers ni de côté éloigné ; épaules et hanches écartées du milieu
  assert.equal(count(figureSVG(POSES['Jumping jacks sans saut'], { focus: ['thighN', 'thighF'], animate: false, help: false }), /fig-muscle fig-focus/g), 2);
});

test('aides : une étape par geste, une par moitié pour les gestes alternés, rien pour une tenue', () => {
  const ex = (n) => explain(POSES[n]);
  const push = ex('Pompes');
  assert.equal(push.length, 1);
  assert.deepEqual([push[0].from, push[0].to, push[0].ghost], [0, 1, true]);
  // fentes alternées : la jambe proche recule, puis la jambe du fond, chacune pendant sa moitié
  const lunge = ex('Fentes arrière alternées');
  assert.deepEqual(lunge.map((s) => [s.from, s.to, s.joint, s.window]), [[0, 2, 'footN', [0, 0.5]], [4, 6, 'footF', [0.5, 0]]]);
  assert.equal(ex('Rowing penché à l’élastique')[0].joint, 'handN'); // la main remonte vers la hanche
  assert.deepEqual(ex('Hollow hold genoux pliés'), []); // tenue : rien à montrer
  assert.deepEqual(ex('Respiration 4-6'), []);
  // de face : pas de fantôme (il ressemblerait à un deuxième bonhomme)
  assert.ok(ex('Shadow boxing (esquives et crochets)').every((s) => !s.ghost));
  // crunch vélo : le coude proche vient vers le genou éloigné, puis l'inverse (sans fantôme)
  assert.deepEqual(ex('Crunch vélo').map((s) => [s.joint, s.from, s.to, s.ghost]), [['elbowN', 0, 1, false], ['elbowF', 1, 0, false]]);
  // aucune pose ne casse le calcul
  for (const [name, fig] of Object.entries(POSES)) assert.doesNotThrow(() => explain(fig), name);
  assert.throws(() => explain({ ...POSES.Pompes, explain: [{ from: 1, to: 0 }] })); // aller-retour : pas d'étape à l'envers
  assert.deepEqual(explain({ ...POSES.Pompes, explain: false }), []);
});

test('flèche : lisse, hors de la tête, jamais sous le tapis, rien pour un petit geste', () => {
  const pts = Array.from({ length: 12 }, (_, i) => [40 + i * 2, 50]);
  const head = [52, 46];
  const a = arrowPath(pts, [50, 60], { off: 3, avoid: [head] });
  assert.ok(a && a.d.startsWith('M') && a.head.endsWith('Z'));
  for (const p of a.pts) {
    assert.ok(dist(p, head) >= 6.4, `sur la tête : ${p}`);
    assert.ok(p[1] <= VIEW.floor + 1);
  }
  assert.equal(arrowPath([[40, 50], [42, 50]], [40, 60]), null); // trop court
  assert.ok(MOVE_MIN > 0);
  // décalée du côté opposé au corps, mais pas sous le tapis
  const low = arrowPath(Array.from({ length: 10 }, (_, i) => [30 + i * 3, 69]), [45, 50], { off: 4 });
  assert.ok(Math.max(...low.pts.map((p) => p[1])) <= VIEW.floor + 1);
});

test('image fixe : fantôme et flèche ; option pose ; sans aide sur demande', () => {
  const still = figureSVG(POSES.Pompes, { animate: false });
  assert.match(still, /class="fig-ghost"/);
  assert.match(still, /class="fig-move"/);
  assert.doesNotMatch(still, /<animate/);
  assert.doesNotMatch(figureSVG(POSES.Pompes, { animate: false, help: false }), /fig-ghost|fig-move/);
  // gestes alternés : animé, chaque aide n'est visible que pendant sa moitié ; fixe, une seule
  const lunge = figureSVG(POSES['Fentes arrière alternées']);
  assert.equal(count(lunge, /class="fig-ghost"/g), 2);
  assert.equal(count(lunge, /attributeName="opacity"/g), 4);
  assert.equal(count(figureSVG(POSES['Fentes arrière alternées'], { animate: false }), /class="fig-ghost"/g), 1);
  // pose i : image fixe de cette pose, cadrée sur tout le mouvement
  const p1 = figureSVG(POSES.Pompes, { pose: 1, fit: true });
  const [x, y, w, h] = frameBox(timeline(POSES.Pompes));
  assert.match(p1, new RegExp(`viewBox="${x} ${y} ${w} ${h}"`));
  assert.doesNotMatch(p1, /<animate|fig-ghost/);
  const eye = (svg) => svg.match(/class="fig-eye" cx="([\d.]+)" cy="([\d.]+)"/).slice(1).map(Number);
  assert.notDeepEqual(eye(p1), eye(figureSVG(POSES.Pompes, { pose: 0, fit: true })));
});

test('mémoire : même dessin, identifiants neufs à chaque appel', () => {
  const a = figureSVG(POSES.Pompes, { focus: ['chest'] });
  const b = figureSVG(POSES.Pompes, { focus: ['chest'] });
  const prefix = (s) => s.match(/id="(fg[0-9a-z]+)-/)[1];
  assert.notEqual(prefix(a), prefix(b)); // deux bonshommes sur la même page ne se mélangent pas
  assert.equal(a.replaceAll(prefix(a), 'X'), b.replaceAll(prefix(b), 'X'));
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

test('couleurs : secours sans color-mix, vignettes allégées', () => {
  const css = readFileSync(new URL('../css/styles.css', import.meta.url), 'utf8');
  const luxe = readFileSync(new URL('../css/luxe.css', import.meta.url), 'utf8');
  assert.match(css, /@supports not \(color: color-mix\(/);
  // le secours couvre aussi tapis, parallettes et roue, avec des sélecteurs plus forts que les
  // règles color-mix écrites après lui (sinon ces formes deviendraient noires)
  const fallback = css.slice(css.indexOf('@supports not (color: color-mix('));
  for (const sel of ['.fig rect.fig-mat', '.fig .fig-par rect', '.fig .fig-bar rect', '.fig .fig-wheel circle:not(.fig-hub)']) assert.ok(fallback.slice(0, fallback.indexOf('\n}')).includes(sel), sel);
  assert.match(luxe, /\.ex-fig \.fig-ghost, \.ex-fig \.fig-move/);
  for (const token of ['--fig-shoe', '--fig-hair', '--figure-move', '--fig-line']) assert.match(luxe, new RegExp(`${token}:`));
});

test('barre : les mains ne la lâchent pas ; suspendu, ni sol ni tapis ; australiennes, pieds au sol', () => {
  const bar = Object.entries(POSES).filter(([, fig]) => fig.bar);
  assert.deepEqual(bar.map(([n]) => n).sort(), ['Relevés de genoux suspendu', 'Suspension à la barre', 'Tractions', 'Tractions australiennes']);
  for (const [name, fig] of bar) {
    const keys = timeline(fig);
    const j0 = keys[0].joints;
    for (const { joints } of keys) {
      assert.ok(dist(joints.handN, j0.handN) < 0.3, `${name} : la main proche glisse`);
      assert.ok(dist(joints.handF, j0.handF) < 1.2, `${name} : la main du fond glisse`);
    }
    // la barre passe dans le poing proche (un peu au-delà du poignet), vue de biais
    const [p, q] = barAt(j0);
    const len = dist(p, q);
    assert.ok(Math.abs((q[0] - p[0]) / len - BAR_DIR[0]) < 0.02 && Math.abs((q[1] - p[1]) / len - BAR_DIR[1]) < 0.02, name);
    const d = Math.abs((j0.handN[0] - p[0]) * BAR_DIR[1] - (j0.handN[1] - p[1]) * BAR_DIR[0]);
    assert.ok(d < 1.6, `${name} : barre loin de la main (${d})`);
    // les poings serrent la barre : main dans l'axe de l'avant-bras
    const inline = Math.atan2(j0.handN[1] - j0.elbowN[1], j0.handN[0] - j0.elbowN[0]) * 180 / Math.PI;
    assert.equal(handAngle(j0.elbowN, j0.handN, 1, true), inline);
  }
  // suspendu : tout le corps reste en l'air, pieds compris ; pas de tapis, cadre arrêté sous le corps
  for (const name of ['Suspension à la barre', 'Tractions', 'Relevés de genoux suspendu']) {
    const keys = timeline(POSES[name]);
    for (const { joints } of keys) assert.ok(JOINTS.every((k) => joints[k][1] < VIEW.floor - 3), `${name} : touche le sol`);
    const svg = figureSVG(POSES[name], { fit: true });
    assert.doesNotMatch(svg, /fig-mat|fig-shadow/, name);
    const [, y, , h] = svg.match(/viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/).slice(1).map(Number);
    const lowest = Math.max(...keys.flatMap(({ joints }) => JOINTS.map((k) => joints[k][1])));
    assert.ok(y + h <= lowest + 7.1 && y + h < VIEW.floor + 7, `${name} : cadre jusqu'au sol`);
  }
  // tractions : en haut, la tête passe au-dessus de la barre
  const top = solve(POSES.Tractions.frames[1]);
  assert.ok(top.head[1] < barAt(solve(POSES.Tractions.frames[0]))[0][1] - 3, 'menton sous la barre');
  // australiennes : pieds à plat au sol (le tapis reste), la poitrine monte jusqu'à la barre
  const row = POSES['Tractions australiennes'];
  assert.match(figureSVG(row, { fit: true }), /class="fig-mat"/);
  for (const f of row.frames) assert.equal(solve(f).footN[1], VIEW.floor);
  const [low, high] = row.frames.map(solve);
  assert.ok(dist(high.shoulder, high.handN) < dist(low.shoulder, low.handN) - 12, 'australiennes : la poitrine ne monte pas');
});

test('burpees : mains posées qui ne bougent plus, pieds l’un après l’autre, genou au-dessus du tapis', () => {
  const fig = POSES['Burpees sans saut'];
  const J = fig.frames.map(solve);
  const last = J.length - 1;
  for (let i = 1; i <= last; i++) {
    assert.ok(dist(J[i].handN, J[1].handN) < 0.5 && dist(J[i].handF, J[1].handF) < 0.5, `mains qui glissent (#${i})`);
    assert.ok(J[i].handN[1] >= VIEW.floor - 0.5, `main en l'air (#${i})`);
  }
  // un seul pied bouge à la fois entre deux poses, une fois les mains au sol
  for (let i = 1; i < last; i++) {
    const moved = ['footN', 'footF'].filter((k) => dist(J[i][k], J[i + 1][k]) > 0.5);
    assert.ok(moved.length <= 1, `les deux pieds bougent ensemble (#${i} → #${i + 1})`);
  }
  // pendant tout ce temps, le genou reste au-dessus du tapis
  const keys = timeline(fig);
  const per = (keys.length - 1) / (last + 1); // images par étape (boucle)
  keys.slice(per, per * last + 1).forEach(({ joints }) => {
    assert.ok(Math.max(joints.kneeN[1], joints.kneeF[1]) <= VIEW.floor - 2, 'genou dans le tapis');
  });
});

test('poses fidèles à la consigne : trajet des mains, dos au tapis, profondeur', () => {
  const path = (n, k) => timeline(POSES[n]).map(({ joints }) => joints[k]);
  // tirage assis : les mains reculent à hauteur de poitrine (pas le long des cuisses)
  for (const p of path('Tirage assis à l’élastique', 'handN')) assert.ok(p[1] <= 60.5, `tirage : main trop basse (${p})`);
  // écarté arrière : l'élastique reste à hauteur de poitrine pendant tout le geste
  for (const p of path('Écarté arrière à l’élastique', 'handN')) assert.ok(p[1] <= 25.5, `écarté : main qui tombe (${p})`);
  // hollow hold : seules les épaules décollent, le bas du dos reste au tapis
  for (const f of POSES['Hollow hold genoux pliés'].frames) assert.ok(solve(f).shoulder[1] >= 64, 'hollow : le dos décolle');
  // pompes sur parallettes : en bas, la poitrine descend au niveau des poignées
  const low = solve(POSES['Pompes (sur parallettes)'].frames[1]);
  assert.ok(low.shoulder[1] >= low.handN[1] - 5, 'parallettes : pas assez bas');
});

test('Russian twist de face : pieds décollés, mains d’un côté du bassin puis de l’autre, la tête suit ; chat-vache : la poitrine descend', () => {
  const twist = POSES['Russian twist'];
  assert.equal(twist.front, true); // de face : la rotation se voit (de profil, les mains passaient devant et derrière)
  const J = twist.frames.map(solve);
  J.forEach((j, i) => assert.ok(Math.max(j.footN[1], j.footF[1]) <= VIEW.floor - 6, `pieds au sol (#${i})`));
  // mains jointes devant la poitrine (au-dessus des genoux), puis à côté du bassin, d'un côté puis de l'autre
  assert.ok(J[0].handN[1] < Math.min(J[0].kneeN[1], J[0].kneeF[1]));
  for (const [i, side] of [[1, 1], [3, -1]]) {
    const j = J[i];
    for (const k of ['handN', 'handF']) {
      assert.ok((j[k][0] - j.hip[0]) * side > 10, `#${i} ${k} : pas à côté du bassin`);
      assert.ok(j[k][1] > j.kneeN[1] + 5, `#${i} ${k} : trop haut`);
    }
    assert.ok((j.head[0] - j.hip[0]) * side > 5, `#${i} : la tête ne suit pas les mains`);
  }
  // l'aide suit le bras qui croise le buste, un côté puis l'autre (pas de fantôme de face)
  assert.deepEqual(explain(twist).map((s) => [s.joint, s.ghost]), [['handF', false], ['handN', false]]);
  const [cat, cow] = POSES['Chat-vache'].frames.map(solve);
  assert.ok(cow.shoulder[1] - cat.shoulder[1] >= 1, 'vache : la poitrine ne descend pas');
});

test('tête : angle propre facultatif (tilt) ; chin tucks : la tête recule sans tourner', () => {
  assert.equal(solve(standing).tilt, undefined); // sans tilt : la tête suit le cou, rien ne change
  assert.equal(solve({ ...standing, tilt: -80 }).tilt, -80);
  assert.equal(between({ ...standing, neck: -60, tilt: -90 }, { ...standing, neck: -60 }, 0.5).tilt, -75);
  const chin = POSES['Chin tucks'];
  const eye = (i) => figureSVG(chin, { pose: i, help: false }).match(/class="fig-eye" cx="([\d.]+)" cy="([\d.]+)"/).slice(1).map(Number);
  const [h0, h1] = [solve(chin.frames[0]).head, solve(chin.frames[1]).head];
  assert.ok(h0[0] - h1[0] >= 3, 'la tête recule');
  // même écart œil-crâne dans les deux poses : le regard reste droit devant
  const [e0, e1] = [eye(0), eye(1)];
  assert.ok(Math.abs((e0[0] - h0[0]) - (e1[0] - h1[0])) < 0.15 && Math.abs((e0[1] - h0[1]) - (e1[1] - h1[1])) < 0.15);
  assert.ok(Math.abs(e0[0] - h0[0] - 2.6) < 0.15); // œil droit devant le crâne : regard horizontal
});

test('aides des tenues et des coups ; bras du pont fessier posés le long du corps', () => {
  // planche latérale : la tenue (bras libre vers le plafond), puis la main passe sous le torse et remonte
  const [up, under] = POSES['Planche latérale'].frames.map(solve);
  assert.ok(up.handF[1] < up.shoulder[1] - 15, 'bras libre vers le plafond');
  assert.ok(under.handF[1] > under.hip[1] + 3 && under.handF[0] < under.shoulder[0] - 12, 'main sous le torse');
  assert.ok(Math.abs(under.hip[1] - up.hip[1]) < 0.5, 'le bassin reste haut');
  assert.deepEqual(explain(POSES['Planche latérale']).map((s) => s.joint), ['handF']);
  assert.deepEqual(explain(POSES['Shadow boxing rapide']).map((s) => s.joint), ['handN', 'handF']); // un direct, puis l'autre
  assert.equal(explain(POSES['L-sit'])[0].joint, 'hip'); // le bassin décolle (pas « avance les coudes »)
  // L-sit : bras tendus, fesses décollées, puis pieds en l'air et genoux vers la poitrine
  const [sit, lift, tuck] = POSES['L-sit'].frames.map(solve);
  for (const j of [lift, tuck]) {
    assert.ok(dist(j.shoulder, j.handN) > 22.5, 'bras pliés');
    assert.ok(j.hip[1] <= sit.hip[1] - 3.5, 'fesses au sol');
  }
  assert.ok(Math.max(tuck.footN[1], tuck.footF[1]) <= VIEW.floor - 6, 'pieds au sol');
  assert.ok(tuck.kneeN[1] < lift.kneeN[1] - 4 && tuck.kneeN[1] < tuck.hip[1] - 10, 'genoux pas assez hauts');
  // crunch vélo : à chaque touche, un coude contre le genou opposé, l'autre main derrière la tête
  const [c0, c1] = POSES['Crunch vélo'].frames.map(solve);
  assert.ok(dist(c0.elbowF, c0.kneeN) < 3.5 && dist(c1.elbowN, c1.kneeF) < 3.5, 'coude loin du genou opposé');
  assert.ok(dist(c0.handN, c0.head) < 3 && dist(c1.handF, c1.head) < 3, 'main ouverte loin de la tête');
  assert.ok(dist(c0.elbowN, c1.elbowN) > 10, 'les coudes ne tournent pas');
  for (const j of [c0, c1]) assert.ok(Math.max(j.footN[1], j.footF[1]) <= VIEW.floor - 4, 'jambe allongée posée au sol');
  for (const f of POSES['Pont fessier'].frames) {
    const j = solve(f);
    const bend = Math.abs(Math.atan2(j.elbowN[1] - j.shoulder[1], j.elbowN[0] - j.shoulder[0]) - Math.atan2(j.handN[1] - j.elbowN[1], j.handN[0] - j.elbowN[0])) * 180 / Math.PI;
    assert.ok(bend < 15, `pont fessier : coude plié (${bend.toFixed(0)}°)`);
  }
});

test('rythme : le bonhomme suit le tempo de la consigne (descente lente, montée vive)', async () => {
  const { beats } = await import('../js/figures.js');
  // sans tempo : passages égaux, durée et arrêt d'origine
  const dead = beats(POSES['Dead bug']);
  assert.ok(dead.seg.every((s, i, a) => Math.abs(s.len - a[0].len) < 1e-9));
  // pompes sur parallettes : descente 2 s, montée 1 s, 0,3 s d'arrêt en haut et en bas
  const push = beats(POSES['Pompes (sur parallettes)']);
  assert.equal(push.dur, 3.6);
  const move = (s) => s.len * (1 - s.hold) * push.dur;
  assert.deepEqual(push.seg.map((s) => Math.round(move(s) * 10) / 10), [2, 1]);
  // rowing : 1 s d'arrêt « serré » en haut avant de redescendre en 2 s
  const row = beats(POSES['Rowing penché à l’élastique']);
  assert.equal(Math.round(row.seg[1].len * row.seg[1].hold * row.dur * 10) / 10, 1);
  // l'animation suit ce rythme : la pose du bas est atteinte aux 2,3/3,6 du cycle
  const keys = timeline(POSES['Pompes (sur parallettes)']);
  assert.ok(Math.abs(keys[7].t - 2.3 / 3.6) < 1e-9);
  assert.match(figureSVG(POSES['Pompes (sur parallettes)']), /dur="3.6s"/);
  // chaque pose qui a un tempo en donne un par passage (aller et retour)
  for (const [name, fig] of Object.entries(POSES)) if (fig.tempo) assert.doesNotThrow(() => beats(fig), name);
});
