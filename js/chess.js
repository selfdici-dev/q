// Les échecs : les règles complètes (roque, prise en passant, promotion,
// échec, mat, pat, nulles), la notation française (R roi, D dame, T tour,
// F fou, C cavalier) et Cap, l'adversaire (3 niveaux). Logique pure (sans
// DOM), testée par tests/chess.test.js (dont les comptages de coups « perft »
// de référence, qui prouvent que les règles sont justes).

// Pièces : 1 pion, 2 cavalier, 3 fou, 4 tour, 5 dame, 6 roi ; + 8 pour les
// noirs ; 0 : case vide. Cases : 0 = a8 … 7 = h8, 56 = a1 … 63 = h1 (comme
// à l'écran, les blancs en bas).
export const PAWN = 1, KNIGHT = 2, BISHOP = 3, ROOK = 4, QUEEN = 5, KING = 6, BLACK = 8;
export const WHITE = 0;
export const typeOf = (p) => p & 7;
export const colorOf = (p) => p & 8;
export const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const FILES = 'abcdefgh';
export const sqName = (s) => `${FILES[s & 7]}${8 - (s >> 3)}`;
export const sqIndex = (n) => (8 - Number(n[1])) * 8 + FILES.indexOf(n[0]);
const LETTER = { [PAWN]: 'p', [KNIGHT]: 'n', [BISHOP]: 'b', [ROOK]: 'r', [QUEEN]: 'q', [KING]: 'k' };
const FROM_LETTER = { p: PAWN, n: KNIGHT, b: BISHOP, r: ROOK, q: QUEEN, k: KING };
// les lettres françaises (notation des coups)
export const FR = { [KNIGHT]: 'C', [BISHOP]: 'F', [ROOK]: 'T', [QUEEN]: 'D', [KING]: 'R' };
export const NAMES = { [PAWN]: 'pion', [KNIGHT]: 'cavalier', [BISHOP]: 'fou', [ROOK]: 'tour', [QUEEN]: 'dame', [KING]: 'roi' };
export const VALUES = { [PAWN]: 1, [KNIGHT]: 3, [BISHOP]: 3, [ROOK]: 5, [QUEEN]: 9, [KING]: 0 };

// droits de roque : 1 petit roque blanc, 2 grand roque blanc, 4 et 8 pour les noirs
const CASTLE_BITS = { K: 1, Q: 2, k: 4, q: 8 };
// les droits perdus quand une pièce part de (ou arrive sur) une case
const CASTLE_MASK = new Array(64).fill(15);
CASTLE_MASK[60] = 15 & ~3; CASTLE_MASK[63] = 15 & ~1; CASTLE_MASK[56] = 15 & ~2;
CASTLE_MASK[4] = 15 & ~12; CASTLE_MASK[7] = 15 & ~4; CASTLE_MASK[0] = 15 & ~8;

const KN = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const KG = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const LINE = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const at = (r, c) => (r >= 0 && r < 8 && c >= 0 && c < 8 ? r * 8 + c : -1);

// ---------- position ----------
export function fromFen(fen = START) {
  const [placement, turn = 'w', castle = '-', ep = '-', half = '0', full = '1'] = String(fen).trim().split(/\s+/);
  const board = new Array(64).fill(0);
  const rows = placement.split('/');
  if (rows.length !== 8) throw new Error('FEN illisible');
  rows.forEach((row, r) => {
    let c = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) c += Number(ch);
      else {
        const t = FROM_LETTER[ch.toLowerCase()];
        if (!t || c > 7) throw new Error('FEN illisible');
        board[r * 8 + c] = t | (ch === ch.toLowerCase() ? BLACK : 0);
        c++;
      }
    }
    if (c !== 8) throw new Error('FEN illisible');
  });
  const pos = { board, turn: turn === 'b' ? BLACK : WHITE, castle: 0, ep: ep === '-' ? -1 : sqIndex(ep), half: Number(half) || 0, full: Number(full) || 1, hist: [] };
  for (const ch of castle) pos.castle |= CASTLE_BITS[ch] ?? 0;
  return pos;
}

export function toFen(pos, clocks = true) {
  let out = '';
  for (let r = 0; r < 8; r++) {
    let empty = 0;
    for (let c = 0; c < 8; c++) {
      const p = pos.board[r * 8 + c];
      if (!p) { empty++; continue; }
      if (empty) { out += empty; empty = 0; }
      const l = LETTER[typeOf(p)];
      out += colorOf(p) ? l : l.toUpperCase();
    }
    if (empty) out += empty;
    if (r < 7) out += '/';
  }
  const castle = Object.entries(CASTLE_BITS).filter(([, b]) => pos.castle & b).map(([k]) => k).join('') || '-';
  const base = `${out} ${pos.turn ? 'b' : 'w'} ${castle} ${pos.ep < 0 ? '-' : sqName(pos.ep)}`;
  return clocks ? `${base} ${pos.half} ${pos.full}` : base;
}

export const kingSquare = (pos, color) => pos.board.indexOf(KING | color);

// La case sq est-elle attaquée par les pièces de la couleur by ?
export function attacked(pos, sq, by) {
  const b = pos.board;
  const r = sq >> 3, c = sq & 7;
  // pions : un pion blanc attaque vers le haut (rang - 1)
  const pr = by === WHITE ? r + 1 : r - 1;
  for (const dc of [-1, 1]) {
    const s = at(pr, c + dc);
    if (s >= 0 && b[s] === (PAWN | by)) return true;
  }
  for (const [dr, dc] of KN) { const s = at(r + dr, c + dc); if (s >= 0 && b[s] === (KNIGHT | by)) return true; }
  for (const [dr, dc] of KG) { const s = at(r + dr, c + dc); if (s >= 0 && b[s] === (KING | by)) return true; }
  for (const [dirs, kinds] of [[DIAG, [BISHOP, QUEEN]], [LINE, [ROOK, QUEEN]]]) {
    for (const [dr, dc] of dirs) {
      for (let k = 1; k < 8; k++) {
        const s = at(r + dr * k, c + dc * k);
        if (s < 0) break;
        const p = b[s];
        if (!p) continue;
        if (colorOf(p) === by && kinds.includes(typeOf(p))) return true;
        break;
      }
    }
  }
  return false;
}

export const inCheck = (pos, color = pos.turn) => attacked(pos, kingSquare(pos, color), color ^ BLACK);

// ---------- coups ----------
// Un coup : { from, to, piece, captured, promo, flag } ; flag : 'ep' (en
// passant), 'k' / 'q' (petit / grand roque), 'dbl' (pion qui avance de deux).
function pseudo(pos) {
  const moves = [];
  const b = pos.board, us = pos.turn, them = us ^ BLACK;
  const add = (from, to, flag, promo = 0) => moves.push({ from, to, piece: b[from], captured: flag === 'ep' ? (PAWN | them) : b[to], promo, flag });
  for (let s = 0; s < 64; s++) {
    const p = b[s];
    if (!p || colorOf(p) !== us) continue;
    const r = s >> 3, c = s & 7, t = typeOf(p);
    if (t === PAWN) {
      const dir = us === WHITE ? -1 : 1;
      const startRow = us === WHITE ? 6 : 1, lastRow = us === WHITE ? 0 : 7;
      const pushPromo = (to, flag) => (to >> 3 === lastRow ? [QUEEN, ROOK, BISHOP, KNIGHT].forEach((q) => add(s, to, flag, q | us)) : add(s, to, flag));
      const one = at(r + dir, c);
      if (one >= 0 && !b[one]) {
        pushPromo(one, '');
        const two = at(r + 2 * dir, c);
        if (r === startRow && !b[two]) add(s, two, 'dbl');
      }
      for (const dc of [-1, 1]) {
        const to = at(r + dir, c + dc);
        if (to < 0) continue;
        if (b[to] && colorOf(b[to]) === them) pushPromo(to, '');
        else if (to === pos.ep) add(s, to, 'ep');
      }
    } else if (t === KNIGHT || t === KING) {
      for (const [dr, dc] of t === KNIGHT ? KN : KG) {
        const to = at(r + dr, c + dc);
        if (to >= 0 && (!b[to] || colorOf(b[to]) === them)) add(s, to, '');
      }
      if (t === KING) {
        const home = us === WHITE ? 60 : 4;
        if (s === home && !inCheck(pos, us)) {
          const [kBit, qBit] = us === WHITE ? [1, 2] : [4, 8];
          if (pos.castle & kBit && !b[s + 1] && !b[s + 2] && b[s + 3] === (ROOK | us) && !attacked(pos, s + 1, them) && !attacked(pos, s + 2, them)) add(s, s + 2, 'k');
          if (pos.castle & qBit && !b[s - 1] && !b[s - 2] && !b[s - 3] && b[s - 4] === (ROOK | us) && !attacked(pos, s - 1, them) && !attacked(pos, s - 2, them)) add(s, s - 2, 'q');
        }
      }
    } else {
      const dirs = t === BISHOP ? DIAG : t === ROOK ? LINE : [...DIAG, ...LINE];
      for (const [dr, dc] of dirs) {
        for (let k = 1; k < 8; k++) {
          const to = at(r + dr * k, c + dc * k);
          if (to < 0) break;
          if (!b[to]) { add(s, to, ''); continue; }
          if (colorOf(b[to]) === them) add(s, to, '');
          break;
        }
      }
    }
  }
  return moves;
}

// Joue un coup (la position change ; unmake le défait).
export function make(pos, m) {
  const b = pos.board, us = pos.turn;
  pos.hist.push({ m, castle: pos.castle, ep: pos.ep, half: pos.half });
  b[m.to] = m.promo || m.piece;
  b[m.from] = 0;
  if (m.flag === 'ep') b[m.to + (us === WHITE ? 8 : -8)] = 0;
  if (m.flag === 'k') { b[m.from + 1] = b[m.from + 3]; b[m.from + 3] = 0; }
  if (m.flag === 'q') { b[m.from - 1] = b[m.from - 4]; b[m.from - 4] = 0; }
  pos.castle &= CASTLE_MASK[m.from] & CASTLE_MASK[m.to];
  pos.ep = m.flag === 'dbl' ? (m.from + m.to) >> 1 : -1;
  pos.half = typeOf(m.piece) === PAWN || m.captured ? 0 : pos.half + 1;
  if (us === BLACK) pos.full++;
  pos.turn = us ^ BLACK;
}

export function unmake(pos) {
  const { m, castle, ep, half } = pos.hist.pop();
  const b = pos.board;
  pos.turn ^= BLACK;
  const us = pos.turn;
  if (us === BLACK) pos.full--;
  b[m.from] = m.piece;
  b[m.to] = m.flag === 'ep' ? 0 : m.captured;
  if (m.flag === 'ep') b[m.to + (us === WHITE ? 8 : -8)] = m.captured;
  if (m.flag === 'k') { b[m.from + 3] = b[m.from + 1]; b[m.from + 1] = 0; }
  if (m.flag === 'q') { b[m.from - 4] = b[m.from - 1]; b[m.from - 1] = 0; }
  Object.assign(pos, { castle, ep, half });
}

// Les coups permis (le roi ne reste jamais en échec).
export function legalMoves(pos) {
  const us = pos.turn;
  return pseudo(pos).filter((m) => {
    make(pos, m);
    const ok = !inCheck(pos, us);
    unmake(pos);
    return ok;
  });
}

// Compte les suites de coups jusqu'à depth (le test « perft » des moteurs d'échecs).
export function perft(pos, depth) {
  if (depth === 0) return 1;
  let n = 0;
  for (const m of legalMoves(pos)) {
    make(pos, m);
    n += perft(pos, depth - 1);
    unmake(pos);
  }
  return n;
}

// ---------- notation française ----------
// « Cf3 », « exd5 », « O-O », « e8=D+ », « Dxf7# ».
export function san(pos, m, moves = legalMoves(pos)) {
  let s;
  if (m.flag === 'k') s = 'O-O';
  else if (m.flag === 'q') s = 'O-O-O';
  else {
    const t = typeOf(m.piece);
    const cap = m.captured ? 'x' : '';
    if (t === PAWN) s = `${cap ? FILES[m.from & 7] : ''}${cap}${sqName(m.to)}${m.promo ? `=${FR[typeOf(m.promo)]}` : ''}`;
    else {
      const twins = moves.filter((o) => o !== m && o.piece === m.piece && o.to === m.to && o.from !== m.from);
      let dis = '';
      if (twins.length) {
        if (twins.every((o) => (o.from & 7) !== (m.from & 7))) dis = FILES[m.from & 7];
        else if (twins.every((o) => o.from >> 3 !== m.from >> 3)) dis = String(8 - (m.from >> 3));
        else dis = sqName(m.from);
      }
      s = `${FR[t]}${dis}${cap}${sqName(m.to)}`;
    }
  }
  make(pos, m);
  const check = inCheck(pos);
  const mate = check && legalMoves(pos).length === 0;
  unmake(pos);
  return s + (mate ? '#' : check ? '+' : '');
}

// Le coup qui va de from à to (et la promotion voulue), parmi les coups permis.
export function findMove(pos, from, to, promo = QUEEN) {
  const list = legalMoves(pos).filter((m) => m.from === from && m.to === to);
  return list.find((m) => !m.promo || typeOf(m.promo) === promo) ?? null;
}

// ---------- fin de partie ----------
// 'mat', 'pat', 'materiel' (plus assez de pièces pour mater), '50' (50 coups
// sans prise ni pion), 'repetition' (même position 3 fois) ou null.
export function status(pos, keys = []) {
  const moves = legalMoves(pos);
  if (!moves.length) return inCheck(pos) ? 'mat' : 'pat';
  const pieces = pos.board.filter((p) => p && typeOf(p) !== KING).map(typeOf);
  if (!pieces.length || (pieces.length === 1 && [KNIGHT, BISHOP].includes(pieces[0]))) return 'materiel';
  if (pos.half >= 100) return '50';
  const key = toFen(pos, false);
  if (keys.filter((k) => k === key).length >= 3) return 'repetition';
  return null;
}

// ---------- Cap, l'adversaire ----------
const VAL = { [PAWN]: 100, [KNIGHT]: 320, [BISHOP]: 330, [ROOK]: 500, [QUEEN]: 900, [KING]: 0 };
// bonus par case, vus côté blanc (rangée 8 en haut) : le centre, l'avance des
// pions, le roi à l'abri (puis au centre en finale)
const PST = {
  [PAWN]: [0, 0, 0, 0, 0, 0, 0, 0, 60, 60, 60, 60, 60, 60, 60, 60, 12, 14, 22, 32, 32, 22, 14, 12, 6, 6, 12, 26, 26, 12, 6, 6, 0, 0, 4, 22, 22, 4, 0, 0, 4, -4, -8, 4, 4, -8, -4, 4, 4, 8, 8, -20, -20, 8, 8, 4, 0, 0, 0, 0, 0, 0, 0, 0],
  [KNIGHT]: [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 4, 4, 0, -20, -40, -30, 4, 12, 16, 16, 12, 4, -30, -30, 6, 16, 22, 22, 16, 6, -30, -30, 2, 16, 22, 22, 16, 2, -30, -30, 6, 12, 16, 16, 12, 6, -30, -40, -20, 0, 6, 6, 0, -20, -40, -50, -36, -30, -30, -30, -30, -36, -50],
  [BISHOP]: [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 6, 10, 10, 6, 0, -10, -10, 6, 6, 12, 12, 6, 6, -10, -10, 0, 12, 12, 12, 12, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 6, 0, 0, 0, 0, 6, -10, -20, -10, -12, -10, -10, -12, -10, -20],
  [ROOK]: [0, 0, 0, 0, 0, 0, 0, 0, 6, 12, 12, 12, 12, 12, 12, 6, -6, 0, 0, 0, 0, 0, 0, -6, -6, 0, 0, 0, 0, 0, 0, -6, -6, 0, 0, 0, 0, 0, 0, -6, -6, 0, 0, 0, 0, 0, 0, -6, -6, 0, 0, 0, 0, 0, 0, -6, 0, 0, 0, 6, 6, 4, 0, 0],
  [QUEEN]: [-20, -10, -10, -6, -6, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 6, 6, 6, 6, 0, -10, -6, 0, 6, 6, 6, 6, 0, -6, 0, 0, 6, 6, 6, 6, 0, -6, -10, 6, 6, 6, 6, 6, 0, -10, -10, 0, 6, 0, 0, 0, 0, -10, -20, -10, -10, -6, -6, -10, -10, -20],
  [KING]: [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 16, 16, 0, -6, -6, 0, 16, 16, 20, 30, 12, 0, 0, 12, 30, 20],
};
const KING_END = [-50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -30, 0, 0, 0, 0, -30, -30, -50, -30, -30, -30, -30, -30, -30, -50];

// La position vue par le camp qui joue (en centièmes de pion).
export function evaluate(pos) {
  const b = pos.board;
  let score = 0, heavy = 0;
  for (let s = 0; s < 64; s++) if (b[s] && typeOf(b[s]) !== PAWN && typeOf(b[s]) !== KING) heavy += VAL[typeOf(b[s])];
  const endgame = heavy <= 1300;
  for (let s = 0; s < 64; s++) {
    const p = b[s];
    if (!p) continue;
    const t = typeOf(p), black = colorOf(p);
    const idx = black ? (7 - (s >> 3)) * 8 + (s & 7) : s; // les noirs : le plateau retourné
    const v = VAL[t] + (t === KING && endgame ? KING_END[idx] : PST[t][idx]);
    score += black ? -v : v;
  }
  // contre un roi seul : le pousser vers le bord, et rapprocher le nôtre (la technique du mat)
  for (const [strong, weak, sign] of [[WHITE, BLACK, 1], [BLACK, WHITE, -1]]) {
    if (b.some((p) => p && colorOf(p) === weak && typeOf(p) !== KING)) continue;
    if (!b.some((p) => p && colorOf(p) === strong && VAL[typeOf(p)] >= 500)) continue;
    const wk = kingSquare(pos, weak), sk = kingSquare(pos, strong);
    const r = wk >> 3, c = wk & 7;
    const edge = Math.max(3 - r, r - 4) + Math.max(3 - c, c - 4);
    const dist = Math.abs(r - (sk >> 3)) + Math.abs(c - (sk & 7));
    score += sign * (edge * 40 + (14 - dist) * 12);
  }
  return pos.turn === WHITE ? score : -score;
}

const MATE = 100000;
const order = (moves) => moves.sort((a, b) => (b.captured ? VAL[typeOf(b.captured)] * 10 - VAL[typeOf(b.piece)] : 0) + (b.promo ? 800 : 0) - ((a.captured ? VAL[typeOf(a.captured)] * 10 - VAL[typeOf(a.piece)] : 0) + (a.promo ? 800 : 0)));

function quiesce(pos, alpha, beta, ctx, qd = 0) {
  ctx.nodes++;
  const stand = evaluate(pos);
  if (stand >= beta) return beta;
  if (stand > alpha) alpha = stand;
  if (qd > 6) return alpha;
  for (const m of order(legalMoves(pos).filter((x) => x.captured || x.promo))) {
    make(pos, m);
    const score = -quiesce(pos, -beta, -alpha, ctx, qd + 1);
    unmake(pos);
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

function negamax(pos, depth, alpha, beta, ply, ctx) {
  if (ctx.stop()) return 0;
  const moves = legalMoves(pos);
  if (!moves.length) return inCheck(pos) ? -MATE + ply : 0;
  if (pos.half >= 100) return 0;
  if (depth <= 0) return ctx.quiet ? quiesce(pos, alpha, beta, ctx) : (ctx.nodes++, evaluate(pos));
  ctx.nodes++;
  for (const m of order(moves)) {
    make(pos, m);
    const score = -negamax(pos, depth - 1, -beta, -alpha, ply + 1, ctx);
    unmake(pos);
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

// Les niveaux de Cap : profondeur (en demi-coups), temps, fantaisie (au
// débutant, il lui arrive de jouer moins bien).
export const LEVELS = {
  debutant: { name: 'Débutant', depth: 1, quiet: false, noise: 120, ms: 300 },
  moyen: { name: 'Moyen', depth: 2, quiet: true, noise: 25, ms: 600 },
  coriace: { name: 'Coriace', depth: 4, quiet: true, noise: 0, ms: 900 },
};

// Le coup de Cap. rnd : un nombre au hasard entre 0 et 1 (pour varier).
export function bestMove(pos, { depth = 3, quiet = true, noise = 0, ms = 1500, rnd = Math.random } = {}) {
  const moves = order(legalMoves(pos));
  if (!moves.length) return null;
  const t0 = Date.now();
  const ctx = { nodes: 0, quiet, stop: () => ctx.nodes % 512 === 0 && Date.now() - t0 > ms };
  let best = moves[0], scored = moves.map((m) => ({ m, score: 0 }));
  for (let d = 1; d <= depth; d++) {
    const round = [];
    let alpha = -Infinity;
    for (const { m } of scored) {
      make(pos, m);
      const score = -negamax(pos, d - 1, -MATE * 2, MATE * 2, 1, ctx);
      unmake(pos);
      round.push({ m, score });
      if (score > alpha) alpha = score;
      if (ctx.stop() && d > 1) break;
    }
    if (ctx.stop() && d > 1 && round.length < scored.length) break; // profondeur pas finie : on garde la précédente
    scored = round.sort((a, b) => b.score - a.score);
    best = scored[0].m;
    if (scored[0].score > MATE - 100) break; // un mat trouvé
  }
  if (noise > 0) {
    const pick = scored.map((x) => ({ m: x.m, s: x.score + (rnd() - 0.5) * 2 * noise })).sort((a, b) => b.s - a.s)[0];
    // jamais un mat raté s'il est sous ses yeux, jamais un coup qui perd tout de suite au mat
    if (scored[0].score < MATE - 100 && pick.s > -MATE + 100) best = pick.m;
  }
  return best;
}

// ---------- mats forcés (pour vérifier les problèmes) ----------
// Le camp qui joue peut-il mater en n coups au plus, quoi que fasse l'autre ?
export function mateIn(pos, n) {
  return matingMoves(pos, n, 1).length > 0;
}

// Les coups qui matent en n coups au plus (limit : on s'arrête à tant).
export function matingMoves(pos, n, limit = 99) {
  const out = [];
  if (n <= 0) return out;
  for (const m of legalMoves(pos)) {
    make(pos, m);
    const replies = legalMoves(pos);
    let ok;
    if (!replies.length) ok = inCheck(pos);
    else if (n === 1) ok = false;
    else ok = replies.every((r) => { make(pos, r); const x = mateIn(pos, n - 1); unmake(pos); return x; });
    unmake(pos);
    if (ok) { out.push(m); if (out.length >= limit) break; }
  }
  return out;
}

// ---------- pour apprendre ----------
// Les cases où une pièce seule peut aller (sans se soucier des échecs), sur
// un plateau où blockers sont occupées : pour les leçons « attrape les étoiles ».
export function reach(type, from, blockers = new Set()) {
  const r = from >> 3, c = from & 7;
  const out = [];
  if (type === KNIGHT || type === KING) {
    for (const [dr, dc] of type === KNIGHT ? KN : KG) { const s = at(r + dr, c + dc); if (s >= 0 && !blockers.has(s)) out.push(s); }
    return out;
  }
  if (type === PAWN) {
    const one = at(r - 1, c);
    if (one >= 0 && !blockers.has(one)) {
      out.push(one);
      const two = at(r - 2, c);
      if (r === 6 && !blockers.has(two)) out.push(two);
    }
    return out;
  }
  const dirs = type === BISHOP ? DIAG : type === ROOK ? LINE : [...DIAG, ...LINE];
  for (const [dr, dc] of dirs) {
    for (let k = 1; k < 8; k++) {
      const s = at(r + dr * k, c + dc * k);
      if (s < 0 || blockers.has(s)) break;
      out.push(s);
    }
  }
  return out;
}
