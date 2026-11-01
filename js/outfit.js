// Habille ton double : des accessoires gagnés avec tes trophées (bandeau,
// serviette, lunettes, gants de boxe, médaille, ceinture, cape, couronne).
// Un seul par place (la tête, les yeux, le cou, le dos, la taille). Ce qu'il
// porte est dans settings.outfit (ses identifiants), ce qui a déjà été annoncé
// dans settings.gearSeen ; ce qui est débloqué se recalcule depuis tes trophées.
// Logique pure (sans DOM), testée par tests/outfit.test.js. Le dessin : avatar.js.

export const SLOTS = { tete: 'la tête', yeux: 'les yeux', cou: 'le cou', dos: 'le dos', taille: 'la taille' };

// need : trophees (trophées gagnés) ou or (trophées en or gagnés).
export const GEAR = [
  { id: 'bandeau', slot: 'tete', name: 'Bandeau', desc: 'Rouge, noué sur le côté.', need: { kind: 'trophees', n: 1 } },
  { id: 'serviette', slot: 'cou', name: 'Serviette', desc: 'Autour du cou, après l’effort.', need: { kind: 'trophees', n: 3 } },
  { id: 'lunettes', slot: 'yeux', name: 'Lunettes de soleil', desc: 'Pour le style.', need: { kind: 'trophees', n: 6 } },
  { id: 'gants', slot: 'cou', name: 'Gants de boxe', desc: 'Pendus au cou par leurs lacets.', need: { kind: 'trophees', n: 9 } },
  { id: 'medaille', slot: 'cou', name: 'Médaille d’or', desc: 'Ton premier trophée en or.', need: { kind: 'or', n: 1 } },
  { id: 'ceinture', slot: 'taille', name: 'Ceinture de champion', desc: 'Plaque d’or et pierre rouge.', need: { kind: 'trophees', n: 12 } },
  { id: 'cape', slot: 'dos', name: 'Cape', desc: 'Rouge, col relevé.', need: { kind: 'trophees', n: 18 } },
  { id: 'couronne', slot: 'tete', name: 'Couronne', desc: 'Pour le roi de la régularité.', need: { kind: 'trophees', n: 25 } },
];

// Les chiffres qui débloquent : trophées gagnés, dont en or (trophyStatus de trophies.js).
export function gearStats(trophies = []) {
  const won = (Array.isArray(trophies) ? trophies : []).filter((t) => t?.earned);
  return { trophees: won.length, or: won.filter((t) => t.tier === 'or').length };
}

const fmt = (have, n, kind) => (kind === 'or' ? `${have} / ${n} trophée en or` : `${have} / ${n} trophée${n > 1 ? 's' : ''}`);

// Chaque accessoire : débloqué ou non, avancement, ce qu'il reste à faire.
export function gearStatus(stats = {}) {
  return GEAR.map((g) => {
    const have = Math.max(0, Math.floor(Number(stats?.[g.need.kind]) || 0));
    const unlocked = have >= g.need.n;
    return { ...g, unlocked, pct: Math.min(1, have / g.need.n), label: unlocked ? 'Débloqué' : fmt(Math.min(have, g.need.n), g.need.n, g.need.kind) };
  });
}

// Ce qu'il porte vraiment : des accessoires connus et débloqués, un par place
// (le dernier mis gagne), dans l'ordre de la liste.
export function wornGear(outfit, stats) {
  const open = new Set(gearStatus(stats).filter((g) => g.unlocked).map((g) => g.id));
  const bySlot = new Map();
  for (const id of Array.isArray(outfit) ? outfit : []) {
    const g = GEAR.find((x) => x.id === id);
    if (g && open.has(id)) bySlot.set(g.slot, id);
  }
  return GEAR.filter((g) => [...bySlot.values()].includes(g.id)).map((g) => g.id);
}

// Mettre ou enlever un accessoire : renvoie la nouvelle tenue (l'ancienne ne
// change pas). Le mettre enlève celui qui occupait sa place. Pas débloqué : rien ne change.
export function wearGear(outfit, id, stats) {
  const now = wornGear(outfit, stats);
  const g = GEAR.find((x) => x.id === id);
  if (!g || !gearStatus(stats).find((x) => x.id === id).unlocked) return now;
  if (now.includes(id)) return now.filter((x) => x !== id);
  return wornGear([...now.filter((x) => GEAR.find((y) => y.id === x).slot !== g.slot), id], stats);
}

// Les accessoires débloqués qu'on ne t'a pas encore annoncés.
export function newGear(seen, stats) {
  const known = new Set(Array.isArray(seen) ? seen : []);
  return gearStatus(stats).filter((g) => g.unlocked && !known.has(g.id));
}
