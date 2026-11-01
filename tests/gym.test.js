import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hubSVG, hubLayout, arcadeZone, HUB, HUB_VIEW, STATIONS, CAST, covers } from '../js/gym.js';
import { WORKOUTS } from '../js/data.js';
import { figureFor } from '../js/figures.js';
import { drawingFor } from '../js/drawings.js';

test('ta salle en maquette : un poste par séance, chacun avec son personnage, son matériel et sa plateforme', () => {
  assert.deepEqual(STATIONS.map((s) => s.id).sort(), WORKOUTS.map((w) => w.id).sort());
  // chaque poste a son personnage dessiné (et le bonhomme en secours)
  for (const st of STATIONS) {
    assert.ok(figureFor(st.ex), `bonhomme manquant : ${st.ex}`);
    assert.ok(drawingFor(st.ex) && CAST[st.id], `dessin manquant : ${st.ex}`);
  }
  const svg = hubSVG({ pick: 'B' });
  assert.match(svg, new RegExp(`^<svg class="hub-scene" viewBox="${HUB_VIEW.x} ${HUB_VIEW.y} ${HUB_VIEW.w} ${HUB_VIEW.h}" aria-hidden="true">`));
  assert.ok(HUB_VIEW.w === HUB.w && HUB_VIEW.h <= HUB.h);
  for (const id of ['P', 'M', 'C', 'A', 'B']) assert.match(svg, new RegExp(`class="hub-st st-${id} wo-${id}`), id);
  // le décor (logo, écran, bandes LED) et le matériel : sac de boxe (C), plante du coin
  // yoga (M), roue (A), élastiques (B) ; la barre de traction et les parallettes sont dans les dessins
  for (const part of ['hub-logo', 'hub-screen', 'hub-led', 'hub-bag', 'hub-plant', 'hub-wheel', 'hub-bands']) assert.match(svg, new RegExp(part), part);
  assert.equal((svg.match(/class="hub-plat"/g) ?? []).length, 5);
  // les personnages : leurs images (celles des séances), un groupe par poste
  assert.equal((svg.match(/<g class="hub-who" transform=/g) ?? []).length, 5);
  for (const [, src] of svg.matchAll(/<image href="([^"]+)"/g)) assert.match(src, /^img\/ex\/[\w-]+-\d\.webp$/);
  // les pieds sur leur plateforme : le bas du personnage tombe sur le milieu de la plateforme
  for (const { id, box: [, y, , h] } of hubLayout()) assert.ok(y + h > 100 && y + h < HUB_VIEW.h, id);
});

test('ta salle : seul le poste choisi s’allume et bouge, et rien ne bouge si on réduit les animations', () => {
  const moving = (svg) => [...svg.matchAll(/<g class="hub-st st-(\w)[^"]*">(.*?)(?=<g class="hub-st|<g class="hub-light|<\/svg>)/gs)].filter(([, , g]) => /<animate/.test(g)).map(([, id]) => id);
  assert.deepEqual(moving(hubSVG({ pick: 'C' })), ['C']);
  assert.deepEqual(moving(hubSVG({ pick: 'A' })), ['A']);
  assert.deepEqual(moving(hubSVG({ pick: 'A', animate: false })), []);
  assert.match(hubSVG({ pick: 'M' }), /class="hub-st st-M wo-M on"/);
  // l'écran au mur affiche la séance choisie ; le faisceau tombe sur son poste
  assert.match(hubSVG({ pick: 'C' }), /SÉANCE C/);
  assert.match(hubSVG({ pick: 'C' }), /class="hub-beam"/);
  assert.doesNotMatch(hubSVG({ pick: 'C', animate: false }), /<animate/);
});

test('ta salle : zones à toucher dans le décor, sans se chevaucher, assez grandes pour un doigt', () => {
  const zones = hubLayout();
  assert.equal(zones.length, 5);
  const grow = ([x, y, w, h]) => [x - 6, y - 6, w + 12, h + 12]; // comme dans l'appli
  for (const { id, box } of zones) {
    const [x, y, w, h] = grow(box);
    assert.ok(x >= -8 && y >= 0 && x + w <= HUB.w + 8 && y + h <= HUB.h + 2, `${id} hors du décor`);
    assert.ok(w >= 40 && h >= 40, `${id} trop petit`);
  }
  for (let i = 0; i < zones.length; i++) {
    for (let k = i + 1; k < zones.length; k++) {
      const [a, b] = [grow(zones[i].box), grow(zones[k].box)];
      const over = Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0]) > 0 && Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]) > 0;
      assert.ok(!over, `${zones[i].id} et ${zones[k].id} se chevauchent`);
    }
  }
});

test('ta salle : rien qui vienne d’internet, identifiants propres à chaque salle', () => {
  const svg = hubSVG({ pick: 'B', id: 'h1' });
  assert.doesNotMatch(svg, /https?:|<script|\son\w+=|NaN|undefined/);
  assert.doesNotMatch(svg, /<image(?! href="img\/ex\/[\w-]+\.webp")/); // seulement les images des personnages
  const ids = [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const [, ref] of svg.matchAll(/url\(#([^)]+)\)/g)) assert.ok(ids.includes(ref), ref);
  assert.ok(ids.some((x) => x.startsWith('h1-')));
});

test('ta salle : l’étiquette du poste choisi efface seulement les pastilles qu’elle cache', () => {
  const tag = [100, 200, 180, 26]; // « B · Pectoraux, dos et bras »
  assert.equal(covers(tag, [90, 202, 24, 24]), true); // la pastille A, à moitié dessous
  assert.equal(covers(tag, [60, 202, 24, 24]), false); // assez loin à gauche
  assert.equal(covers(tag, [150, 150, 24, 24]), false); // plus haut (un poste du fond)
  assert.equal(covers(tag, [282, 202, 24, 24]), true); // à 2 px : la lueur toucherait
  assert.equal(covers(tag, [282, 202, 24, 24], 0), false);
});

test('ta salle : la borne d’arcade est dessinée, et sa zone ne mord sur aucun poste', () => {
  assert.match(hubSVG({ pick: 'A' }), /class="hub-arcade"/);
  const grow = ([x, y, w, h]) => [x - 6, y - 6, w + 12, h + 12];
  const arc = grow(arcadeZone());
  assert.ok(arc[2] >= 40 && arc[3] >= 40, 'assez grande pour un doigt');
  assert.ok(arc[0] >= 0 && arc[1] >= 0 && arc[0] + arc[2] <= HUB.w && arc[1] + arc[3] <= HUB.h);
  for (const { id, box } of hubLayout()) {
    const b = grow(box);
    const over = Math.min(arc[0] + arc[2], b[0] + b[2]) - Math.max(arc[0], b[0]) > 0 && Math.min(arc[1] + arc[3], b[1] + b[3]) - Math.max(arc[1], b[1]) > 0;
    assert.ok(!over, `la borne chevauche le poste ${id}`);
  }
});
