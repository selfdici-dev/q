// Arbre du focus : il pousse au centre du minuteur pendant la session (tronc,
// branches, feuilles, puis fruits dorés à la fin). Chaque arbre est unique
// (graine = date + numéro de session) mais toujours le même pour une graine.
// Logique pure (sans DOM), testée par tests/tree.test.js.

// Générateur pseudo-aléatoire déterministe (mulberry32).
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Graine d'un texte (« 2026-10-03#2 ») : même texte, même arbre.
export function seedOf(text) {
  let h = 2166136261;
  for (const c of String(text)) h = Math.imul(h ^ c.codePointAt(0), 16777619);
  return h >>> 0;
}

const DEPTH = 6;
const round = (v) => Math.round(v * 10) / 10;
const clamp = (v) => Math.max(0, Math.min(1, v));

// Squelette de l'arbre : branches (avec moment de pousse) et feuilles.
export function growTree(seed) {
  const r = rng(seed);
  const branches = [];
  const leaves = [];
  const grow = (x, y, angle, len, width, depth, start) => {
    const rad = (angle * Math.PI) / 180;
    const x2 = x + Math.cos(rad) * len;
    const y2 = y + Math.sin(rad) * len;
    const end = start + (depth === 0 ? 0.22 : 0.16);
    branches.push({ x1: round(x), y1: round(y), x2: round(x2), y2: round(y2), width: round(width), depth, start, end });
    if (depth === DEPTH - 1) {
      leaves.push({ x: round(x2), y: round(y2), rx: round(2.6 + r() * 2), ry: round(1.6 + r() * 1.2), rot: Math.round(angle + 90 + (r() - 0.5) * 60), start: 0.72 + r() * 0.22 });
      return;
    }
    const kids = depth > 0 && r() < 0.3 ? 3 : 2;
    for (let i = 0; i < kids; i++) {
      const spread = kids === 3 ? (i - 1) * 30 : (i ? 1 : -1) * (18 + r() * 16);
      grow(x2, y2, angle + spread + (r() - 0.5) * 12, len * (0.68 + r() * 0.12), width * 0.7, depth + 1, start + (end - start) * 0.75);
    }
  };
  grow(60, 94, -90 + (r() - 0.5) * 6, 23, 4, 0, 0);
  // Fruits dorés : sur quelques feuilles, à la toute fin.
  const fruits = leaves.filter(() => r() < 0.12).slice(0, 5).map((l) => ({ x: l.x, y: round(l.y + 2.5) }));
  return { branches, leaves, fruits };
}

// SVG de l'arbre à l'instant `progress` (0 → 1). mini : version jardin.
export function treeSVG(progress, seed, { mini = false } = {}) {
  const p = clamp(progress);
  const { branches, leaves, fruits } = growTree(seed);
  const parts = [];
  for (const b of branches) {
    const u = clamp((p - b.start) / (b.end - b.start));
    if (u <= 0) continue;
    parts.push(`<line class="tree-branch" x1="${b.x1}" y1="${b.y1}" x2="${round(b.x1 + (b.x2 - b.x1) * u)}" y2="${round(b.y1 + (b.y2 - b.y1) * u)}" stroke-width="${b.width}"/>`);
  }
  for (const l of leaves) {
    const u = clamp((p - l.start) / 0.08);
    if (u <= 0) continue;
    parts.push(`<ellipse class="tree-leaf" cx="${l.x}" cy="${l.y}" rx="${round(l.rx * u)}" ry="${round(l.ry * u)}" transform="rotate(${l.rot} ${l.x} ${l.y})"/>`);
  }
  if (p >= 1) for (const f of fruits) parts.push(`<circle class="tree-fruit" cx="${f.x}" cy="${f.y}" r="1.8"/>`);
  const sprout = p < 0.04 ? '<path class="tree-branch" d="M60 94 Q59 90 61 87" stroke-width="1.6" fill="none"/><ellipse class="tree-leaf" cx="62.5" cy="86.5" rx="2.6" ry="1.4" transform="rotate(-30 62.5 86.5)"/>' : '';
  return `<svg class="tree${mini ? ' mini' : ''}" viewBox="${mini ? '8 2 104 98' : '0 0 120 100'}" aria-hidden="true"><ellipse class="tree-soil" cx="60" cy="95" rx="${mini ? 20 : 26}" ry="3"/>${sprout}${parts.join('')}</svg>`;
}
