// Le décor de « ta salle » : un mur en pierre sombre, une grille de cuivre et
// le logo de Cap (une aiguille de boussole en cuivre à facettes, éclairée par
// derrière), trois spots au plafond, une bande LED au pied du mur et un
// parquet en bois. Sert à l'entrée dans l'appli (format portrait) et à la
// scène de la séance du jour (format large). Logique pure : une chaîne SVG,
// testée par tests/room.test.js.
//
// Les classes room-* servent aux animations (lumières qui s'allument), qui
// vivent dans le CSS et respectent « réduire les animations ».

const r1 = (v) => Math.round(v * 10) / 10;

// w × h : taille du dessin ; logo : position (fractions de w et h ; à gauche
// par défaut, car les bonshommes de profil ont la tête à droite) ; size :
// taille du logo ; floor : hauteur du bas du mur (fraction de h) ; id :
// préfixe des identifiants internes (deux décors peuvent cohabiter).
export function roomSVG({ w = 360, h = 220, logo = [0.2, 0.3], size = 1, floor = 0.68, id = 'room' } = {}) {
  const fy = r1(h * floor); // bas du mur
  const cy = r1(h * 0.07); // bas du plafond
  const s = Math.min(w, h) * 0.085 * size; // demi-hauteur du logo
  const [lx, ly] = [r1(w * logo[0]), r1(h * logo[1])];
  const u = (name) => `${id}-${name}`;

  // Parquet : des lames qui fuient vers le fond, et quelques joints en travers.
  const vx = w / 2;
  const vy = h * 0.2;
  const k = (fy - vy) / (h - vy);
  const planks = [];
  for (let x = -w; x <= 2 * w; x += w / 11) {
    planks.push(`M${r1(x)} ${h}L${r1(vx + (x - vx) * k)} ${fy}`);
  }
  const seams = [0.14, 0.32, 0.56, 0.86].map((t) => `M0 ${r1(fy + (h - fy) * t)}H${w}`);

  // Spots : un plafonnier et son cône de lumière.
  const spots = [0.18, 0.5, 0.82].map((f, i) => {
    const x = r1(w * f);
    const a = r1(w * 0.022);
    const b = r1(w * 0.15);
    return `<g class="room-spot s${i + 1}"><path d="M${r1(x - a)} ${cy}L${r1(x + a)} ${cy}L${r1(x + b)} ${fy}L${r1(x - b)} ${fy}Z" fill="url(#${u('cone')})"/>`
      + `<ellipse cx="${x}" cy="${cy}" rx="${r1(w * 0.026)}" ry="${r1(h * 0.009 + 0.8)}" fill="#fff2e2"/></g>`;
  }).join('');

  // Grille de cuivre derrière le logo.
  const g = { x0: r1(lx - 3.3 * s), x1: r1(lx + 3.3 * s), y0: r1(ly - 2.7 * s), y1: r1(ly + 2.7 * s), step: s * 0.66 };
  const grid = [];
  for (let x = g.x0; x <= g.x1 + 0.01; x += g.step) grid.push(`M${r1(x)} ${g.y0}V${g.y1}`);
  for (let y = g.y0; y <= g.y1 + 0.01; y += g.step) grid.push(`M${g.x0} ${r1(y)}H${g.x1}`);

  // Logo : une aiguille de boussole (le cap) en quatre facettes de cuivre.
  const [T, R, B, L, C] = [[lx, ly - s * 1.5], [lx + s, ly], [lx, ly + s * 1.5], [lx - s, ly], [lx, ly]].map(([x, y]) => `${r1(x)} ${r1(y)}`);
  const facet = (a, b, fill) => `<path d="M${a}L${b}L${C}Z" fill="${fill}"/>`;

  return `<svg class="room" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
<defs>
<linearGradient id="${u('wall')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1613"/><stop offset="1" stop-color="#0f0c0a"/></linearGradient>
<pattern id="${u('tiles')}" width="${r1(w / 9)}" height="${r1(w / 9)}" patternUnits="userSpaceOnUse"><rect x="0.6" y="0.6" width="${r1(w / 9 - 1.2)}" height="${r1(w / 18 - 1.2)}" rx="0.6" fill="#fff0e1" fill-opacity="0.025"/><rect x="${r1(-w / 18 + 0.6)}" y="${r1(w / 18 + 0.6)}" width="${r1(w / 9 - 1.2)}" height="${r1(w / 18 - 1.2)}" rx="0.6" fill="#fff0e1" fill-opacity="0.02"/><rect x="${r1(w / 18 + 0.6)}" y="${r1(w / 18 + 0.6)}" width="${r1(w / 9 - 1.2)}" height="${r1(w / 18 - 1.2)}" rx="0.6" fill="#fff0e1" fill-opacity="0.03"/></pattern>
<linearGradient id="${u('cone')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9d4" stop-opacity="0.2"/><stop offset="1" stop-color="#ffe9d4" stop-opacity="0"/></linearGradient>
<radialGradient id="${u('glow')}"><stop offset="0" stop-color="#e09a6c" stop-opacity="0.55"/><stop offset="0.45" stop-color="#c9805a" stop-opacity="0.18"/><stop offset="1" stop-color="#c9805a" stop-opacity="0"/></radialGradient>
<linearGradient id="${u('led')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9a87c" stop-opacity="0"/><stop offset="0.5" stop-color="#f2c3a3" stop-opacity="0.45"/><stop offset="1" stop-color="#e9a87c" stop-opacity="0"/></linearGradient>
<linearGradient id="${u('wood')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1d15"/><stop offset="1" stop-color="#4a3424"/></linearGradient>
<radialGradient id="${u('pool')}" cx="0.5" cy="0.45" r="0.5"><stop offset="0" stop-color="#ffd9b8" stop-opacity="0.22"/><stop offset="1" stop-color="#ffd9b8" stop-opacity="0"/></radialGradient>
<radialGradient id="${u('vig')}" cx="0.5" cy="0.45" r="0.75"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/></radialGradient>
</defs>
<rect width="${w}" height="${fy}" fill="url(#${u('wall')})"/>
<rect width="${w}" height="${fy}" fill="url(#${u('tiles')})"/>
<rect width="${w}" height="${cy}" fill="#1f1a16"/>
<g class="room-glow"><circle cx="${lx}" cy="${ly}" r="${r1(s * 4)}" fill="url(#${u('glow')})"/></g>
<path class="room-grid" d="${grid.join('')}" stroke="#dc9a70" stroke-opacity="0.16" stroke-width="${r1(Math.max(0.4, s * 0.03))}" fill="none"/>
<g class="room-logo">${facet(T, L, '#f3c9a8')}${facet(T, R, '#d9956b')}${facet(L, B, '#b8714c')}${facet(R, B, '#8f5232')}</g>
<text class="room-name" x="${lx}" y="${r1(ly + s * 2.35)}" text-anchor="middle" font-family="Avenir Next, Avenir, Futura, system-ui, sans-serif" font-weight="600" font-size="${r1(s * 0.5)}" letter-spacing="${r1(s * 0.32)}" fill="#e9b897" fill-opacity="0.85">CAP</text>
<rect y="${fy}" width="${w}" height="${r1(h - fy)}" fill="url(#${u('wood')})"/>
<path class="room-planks" d="${planks.join('')}${seams.join('')}" stroke="#000" stroke-opacity="0.28" stroke-width="0.6" fill="none"/>
<ellipse cx="${r1(w / 2)}" cy="${r1(fy + (h - fy) * 0.62)}" rx="${r1(w * 0.36)}" ry="${r1((h - fy) * 0.42)}" fill="url(#${u('pool')})"/>
${spots}
<g class="room-led"><rect y="${r1(fy - h * 0.05)}" width="${w}" height="${r1(h * 0.1)}" fill="url(#${u('led')})"/><rect y="${r1(fy - 0.9)}" width="${w}" height="1.8" fill="#f6d2b6"/></g>
<rect class="room-vig" width="${w}" height="${h}" fill="url(#${u('vig')})"/>
<rect class="room-dark" width="${w}" height="${h}" fill="#050403" fill-opacity="0"/>
</svg>`;
}
