// La salle vue d'un peu haut (isométrique) : la projection et les formes de base,
// partagées par la salle (gym.js) et ses décors (decors.js). Logique pure.
// La pièce : N × N dalles de C px, murs de HW dalles de haut ; K : aplatissement
// du sol, KZ : des hauteurs ; O : le coin du fond à l'écran. P(X, Y, Z) : un
// point de la pièce (en dalles) à l'écran. Mur de gauche : X = 0 ; mur de
// droite : Y = 0.
export const HUB = { w: 360, h: 530 };
export const N = 7, C = 27, HW = 3.0, K = 0.6, KZ = 0.85;
export const O = [180, 72 + HW * C * KZ];
export const P = (X, Y, Z = 0) => [O[0] + (X - Y) * C, O[1] + (X + Y) * C * K - Z * C * KZ];
export const SKEW = Math.round(Math.atan(K) * 180 / Math.PI * 100) / 100; // pente du mur de droite
export const r1 = (v) => Math.round(v * 10) / 10;
export const pts = (list) => list.map((p) => `${r1(p[0])} ${r1(p[1])}`).join('L');
export const poly = (list, fill, extra = '') => `<path d="M${pts(list)}Z" fill="${fill}"${extra}/>`;
export const flat = (X, Y, Z, w, d, fill, extra = '') => poly([P(X, Y, Z), P(X + w, Y, Z), P(X + w, Y + d, Z), P(X, Y + d, Z)], fill, extra);
// pavé : coin (X, Y, Z), tailles w (X), d (Y), h (Z) ; faces : dessus, gauche, droite
export function box(X, Y, Z, w, d, h, [top, left, right]) {
  const t = [P(X, Y, Z + h), P(X + w, Y, Z + h), P(X + w, Y + d, Z + h), P(X, Y + d, Z + h)];
  const l = [P(X, Y + d, Z), P(X + w, Y + d, Z), P(X + w, Y + d, Z + h), P(X, Y + d, Z + h)];
  const r = [P(X + w, Y, Z), P(X + w, Y + d, Z), P(X + w, Y + d, Z + h), P(X + w, Y, Z + h)];
  return `${poly(l, left)}${poly(r, right)}${poly(t, top)}`;
}
// un point sur le mur de gauche (y, z) ou de droite (x, z)
export const lw = (y, z) => P(0, y, z);
export const rw = (x, z) => P(x, 0, z);
// un rectangle posé à plat sur un mur
export const onL = (y0, y1, z0, z1, fill, extra = '') => poly([lw(y0, z0), lw(y1, z0), lw(y1, z1), lw(y0, z1)], fill, extra);
export const onR = (x0, x1, z0, z1, fill, extra = '') => poly([rw(x0, z0), rw(x1, z0), rw(x1, z1), rw(x0, z1)], fill, extra);
