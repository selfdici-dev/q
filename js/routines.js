// Routines du matin et du soir : quelques gestes simples à cocher, hors
// chaîne (une aide, pas une prison). Ce qui est coché est dans
// days[jour].routine (identifiants des gestes faits). Logique pure, testée par
// tests/routines.test.js.

// Le matin : peu de produits, dans l'ordre où on les fait.
export const ROUTINES = {
  matin: {
    title: 'Routine du matin',
    items: [
      { id: 'eau', label: 'Un grand verre d’eau', short: 'eau', sub: 'Dès le réveil, avant de regarder ton téléphone.' },
      { id: 'douche', label: 'Douche', short: 'douche', sub: 'Cinq minutes suffisent. Finis par 30 s plus fraîches si tu veux te réveiller.' },
      { id: 'sourcils', label: 'Sérum sourcils', short: 'sérum sourcils', sub: 'The Ordinary : un trait fin sur les sourcils propres et secs.' },
      { id: 'cheveux', label: 'Crème cheveux', short: 'crème cheveux', sub: 'SheaMoisture : une noisette sur les cheveux encore humides.' },
    ],
  },
  soir: {
    title: 'Routine du soir',
    items: [
      { id: 'vetements', label: 'Vêtements de demain prêts', short: 'vêtements de demain', sub: 'Posés sur une chaise : demain matin, rien à décider.' },
      { id: 'lit', label: 'Au lit à l’heure', short: 'au lit', sub: 'Coche-le en te couchant.' },
    ],
  },
};

const ids = (which) => ROUTINES[which].items.map((x) => x.id);

// Où en est une routine aujourd'hui : faits, total, complète, ce qu'il reste.
export function routineStatus(done, which) {
  const list = Array.isArray(done) ? done : [];
  const all = ROUTINES[which].items;
  const left = all.filter((x) => !list.includes(x.id));
  return { done: all.length - left.length, total: all.length, complete: left.length === 0, left };
}

// Coche ou décoche un geste ; renvoie la nouvelle liste (l'ancienne ne change pas).
export function toggleRoutine(done, id) {
  const list = Array.isArray(done) ? done.filter((x) => typeof x === 'string') : [];
  if (!Object.keys(ROUTINES).some((w) => ids(w).includes(id))) return list;
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

// La routine du matin se propose le matin seulement (de 4 h à midi) : après,
// elle reste dans la liste sans passer devant le reste.
export function morningTime(now) {
  const h = Number(String(now).slice(0, 2));
  return h >= 4 && h < 12;
}

// Réveil visé à 8 h (ton choix : debout à 8 h, 8 h 30 au plus tard). Une seule
// fois (marqueur wake8), et seulement si le réveil visé est encore l'ancien
// réglage de départ (8 h 30) : un autre choix de ta part est gardé. Renvoie
// de nouveaux réglages.
export function wakeAt8(settings) {
  if (settings.wake8) return settings;
  return { ...settings, wake8: true, wakeTarget: settings.wakeTarget === '08:30' ? '08:00' : settings.wakeTarget };
}
