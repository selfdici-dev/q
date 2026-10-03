import { test } from 'node:test';
import assert from 'node:assert/strict';
import { backupStatus, validateBackup } from '../js/backup.js';

test('rappel de sauvegarde après 7 jours sans export', () => {
  const st = (lastExport) => ({ settings: { startDate: '2026-09-01', lastExport } });
  // export le 1er octobre à 10 h (heure locale)
  const at = new Date(2026, 9, 1, 10).toISOString();
  assert.deepEqual(backupStatus(st(at), '2026-10-08'), { never: false, days: 7, overdue: false });
  assert.deepEqual(backupStatus(st(at), '2026-10-09'), { never: false, days: 8, overdue: true });
  // export à 2 h du matin : compte pour la veille (la journée finit à 4 h)
  assert.equal(backupStatus(st(new Date(2026, 9, 2, 2).toISOString()), '2026-10-09').days, 8);
  // jamais exporté : on compte depuis la date de départ
  assert.deepEqual(backupStatus(st(null), '2026-09-05'), { never: true, days: 4, overdue: false });
  assert.equal(backupStatus(st(null), '2026-09-09').overdue, true);
  assert.equal(backupStatus(st('pas une date'), '2026-09-09').never, true);
});

const good = () => ({
  version: 1,
  settings: { startDate: '2026-09-01', lastExport: null },
  habits: [{ id: 'a', name: 'Lire' }, { id: 'b', name: 'Bouger' }],
  rules: ['Si X, alors Y'],
  days: {
    '2026-09-02': { ids: ['a', 'b'], habits: { a: 1, b: 2 }, weight: 74.5, bed: '00:30', wake: '08:00', workouts: ['A'], snacks: [] },
    '2026-09-01': { habits: { a: 0 }, weight: null, bed: '' },
  },
  trades: [],
  lessons: {},
});

test('sauvegarde valide : acceptée, avec un résumé', () => {
  const r = validateBackup(good());
  assert.equal(r.ok, true);
  assert.deepEqual(r.info, { days: 2, habits: 2, first: '2026-09-01', last: '2026-09-02' });
});

test('ancienne sauvegarde (sans ids ni réglages) : acceptée', () => {
  const r = validateBackup({ habits: [{ id: 'a', name: 'Lire' }], days: { '2026-09-01': { habits: { a: 1 } } } });
  assert.equal(r.ok, true);
});

test('fichiers invalides : refusés avec une raison', () => {
  const broken = [
    null, [], 'texte', 42,
    { days: {} },
    { habits: [], days: [] },
    { ...good(), habits: [{ id: 'a' }] },
    { ...good(), habits: [{ id: 'a', name: 'x' }, { id: 'a', name: 'y' }] },
    { ...good(), days: { '2026-13-01': {} } },
    { ...good(), days: { '2026-02-30': {} } },
    { ...good(), days: { '2026-09-01': { habits: { a: 3 } } } },
    { ...good(), days: { '2026-09-01': { weight: '74 kg' } } },
    { ...good(), days: { '2026-09-01': { bed: 'tard' } } },
    { ...good(), days: { '2026-09-01': { workouts: 'A' } } },
    { ...good(), settings: { startDate: 'hier' } },
    { ...good(), rules: 'une règle' },
    { ...good(), trades: {} },
    { ...good(), wealth: [] },
  ];
  for (const data of broken) {
    const r = validateBackup(data);
    assert.equal(r.ok, false, JSON.stringify(data));
    assert.match(r.error, /^Ce fichier n’est pas une sauvegarde Cap valide : .+\.$/);
  }
});

test('la vérification ne modifie pas le fichier', () => {
  const data = good();
  const copy = structuredClone(data);
  validateBackup(data);
  assert.deepEqual(data, copy);
});
