// Les décors de saison : ils reviennent chaque année, le temps de leur saison
// (Halloween, Noël, le printemps, l'été). Rien à débloquer : pendant sa saison,
// un décor se choisit dans « Décor », et un trophée récompense les séances
// faites pendant la saison. Tout se calcule depuis la date et tes données,
// rien n'est stocké (sauf, comme pour les autres décors, ce qui a déjà été
// annoncé, dans settings.decorsSeen : « halloween@2026 »).
// Logique pure (sans DOM), testée par tests/seasons.test.js.

// from, to : [mois, jour], to compris (une saison peut passer le nouvel an).
// n : séances à faire pendant une même saison pour son trophée.
export const SEASONS = [
  { id: 'halloween', name: 'Nuit d’Halloween', desc: 'Pleine lune, chauves-souris, citrouilles qui luisent et brume au sol.', from: [10, 15], to: [11, 5], n: 6, trophy: 'Esprit d’Halloween', icon: 'moon', tier: 'bronze' },
  { id: 'noel', name: 'Village de Noël', desc: 'Sous la neige, un grand sapin qui scintille et les chalets éclairés.', from: [12, 1], to: [1, 6], n: 10, trophy: 'Lutin d’acier', icon: 'sparkles', tier: 'argent' },
  { id: 'printemps', name: 'Jardin en fleurs', desc: 'Champs de tulipes, moulin, cerisiers en fleurs, fontaine et papillons.', from: [3, 20], to: [4, 30], n: 12, trophy: 'Renouveau', icon: 'sprout', tier: 'argent' },
  { id: 'ete', name: 'Nuit d’été', desc: 'Un ponton sur le lac, des guirlandes et des feux d’artifice.', from: [7, 1], to: [8, 31], n: 15, trophy: 'Feu d’artifice', icon: 'sun', tier: 'or' },
];

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
// « 1er décembre », « 15 octobre »
export const dateFr = ([m, d]) => `${d === 1 ? '1er' : d} ${MONTHS[m - 1]}`;

const md = ([m, d]) => m * 100 + d;
const parse = (key) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key ?? ''));
  return m ? { y: Number(m[1]), md: Number(m[2]) * 100 + Number(m[3]) } : null;
};

// L'année d'une saison qui contient ce jour (celle de son début), ou null si
// le jour est hors saison. Noël 2026 : du 1er décembre 2026 au 6 janvier 2027.
export function seasonYear(s, key) {
  const day = parse(key);
  if (!day) return null;
  const [a, b] = [md(s.from), md(s.to)];
  if (a <= b) return day.md >= a && day.md <= b ? day.y : null;
  if (day.md >= a) return day.y;
  return day.md <= b ? day.y - 1 : null;
}

// La saison en cours ce jour-là (au plus une), ou null.
export const seasonOn = (key) => SEASONS.find((s) => seasonYear(s, key) !== null) ?? null;

// Chaque saison : ouverte ou non aujourd'hui, et quand elle finit ou revient.
export function seasonStatus(today) {
  return SEASONS.map((s) => {
    const open = seasonYear(s, today) !== null;
    return { ...s, open, label: open ? `Jusqu’au ${dateFr(s.to)}` : `Revient le ${dateFr(s.from)}` };
  });
}

// La saison qui vient de s'ouvrir et qu'on ne t'a pas encore annoncée cette
// année (seen : settings.decorsSeen), ou null. Son étiquette : « noel@2026 ».
export function newSeason(seen, today) {
  const s = seasonOn(today);
  if (!s) return null;
  const tag = `${s.id}@${seasonYear(s, today)}`;
  return Array.isArray(seen) && seen.includes(tag) ? null : { ...s, tag };
}

// Tes séances pendant chaque saison (sans M, une fois par jour), la meilleure
// année comptant : { halloween: 4, noel: 0, … }.
export function seasonWorkouts(days = {}) {
  const best = Object.fromEntries(SEASONS.map((s) => [s.id, 0]));
  const per = {};
  for (const [key, d] of Object.entries(days ?? {})) {
    if (!(d?.workouts ?? []).some((w) => w !== 'M')) continue;
    const s = seasonOn(key);
    if (!s) continue;
    const tag = `${s.id}@${seasonYear(s, key)}`;
    per[tag] = (per[tag] ?? 0) + 1;
    best[s.id] = Math.max(best[s.id], per[tag]);
  }
  return best;
}
