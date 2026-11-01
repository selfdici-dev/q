// L'écran des échecs, dans l'arcade (#jeux) : l'école (des leçons pas à pas,
// leurs exercices sur le plateau), les problèmes, et les parties contre Cap
// (3 niveaux). Les règles et Cap : chess.js ; les leçons : chess-school.js.
// Gardé dans state.games.echecs : leçons et problèmes réussis, parties par
// niveau (gagnées, nulles, perdues), la partie en cours (son départ et ses coups).
import { fromFen, toFen, legalMoves, san, make, status, inCheck, bestMove, kingSquare, sqName, typeOf, colorOf, LEVELS, START, WHITE, BLACK, KNIGHT, BISHOP, ROOK, QUEEN } from './chess.js';
import { LESSONS, PUZZLES, judge, starMoves, defend } from './chess-school.js';
import { icon } from './icons.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const FILES = 'abcdefgh';
const END = { pat: 'Pat : partie nulle.', materiel: 'Plus assez de pièces pour mater : partie nulle.', 50: '50 coups sans prise ni pion : partie nulle.', repetition: 'La même position trois fois : partie nulle.' };

// Les pièces, dessinées pour Cap (45 × 45) : un corps plein, un contour.
const SHAPES = {
  P: '<path d="M22.5 9.2a4.8 4.8 0 0 0-3 8.5c-2.4 1.4-4 3.8-4.2 6.6h3.8c-.6 3.4-2.7 6.4-6 8.4-1 .6-1.6 1.7-1.6 2.9V37h22v-1.4c0-1.2-.6-2.3-1.6-2.9-3.3-2-5.4-5-6-8.4h3.8c-.2-2.8-1.8-5.2-4.2-6.6a4.8 4.8 0 0 0-3-8.5z"/>',
  R: '<path d="M11.5 37v-3.5l3-2.5V18.7l-3-2.7V9.5h4.6v2.8h3.6V9.5h5.6v2.8h3.6V9.5h4.6V16l-3 2.7V31l3 2.5V37z"/><path class="ln" d="M14.5 18.7h16M14.5 31h16"/>',
  B: '<circle cx="22.5" cy="8.3" r="2.6"/><path d="M22.5 11.2c-4.9 3.6-7.8 8.2-7.8 12.6 0 3 1.5 5.2 3.8 6.6h8c2.3-1.4 3.8-3.6 3.8-6.6 0-4.4-2.9-9-7.8-12.6z"/><path d="M12.5 37v-1.8c0-1.9 1.5-3.4 3.4-3.4h13.2c1.9 0 3.4 1.5 3.4 3.4V37z"/><path class="ln" d="M25.5 16l-4.5 5.5"/>',
  N: '<path d="M14 37c0-3.6 2.2-6.4 5.4-8.6 2.4-1.6 4.4-3.2 5.6-5.6l-3.4.6c-1.6.3-3 .9-4.1 1.9l-2.2.2c-1.6.1-2.8-1.4-2.4-3l.3-1.1c1.1-3.9 3.4-7.4 6.4-9.9l.4-3.6 2.8 2 1.6-2.6c3.4 2.2 6.6 5.6 8.6 9.6 2 3.9 2.9 8.5 2.9 13.4V37z"/><circle class="eye" cx="19.4" cy="15.4" r="1.2"/><path class="ln" d="M29.4 12.6c2.4 3.3 3.8 7.8 4 12.4"/>',
  Q: '<circle cx="10.5" cy="13.6" r="2.1"/><circle cx="16.4" cy="11.4" r="2.1"/><circle cx="22.5" cy="10.4" r="2.1"/><circle cx="28.6" cy="11.4" r="2.1"/><circle cx="34.5" cy="13.6" r="2.1"/><path d="M10.5 15.5l3.4 14.5h17.2l3.4-14.5-5.7 7.4-2.6-10.1-3.7 9.3-3.7-9.3-2.6 10.1z"/><path d="M12.5 37v-2.2c0-1.9 1.5-3.4 3.4-3.4h13.2c1.9 0 3.4 1.5 3.4 3.4V37z"/>',
  K: '<path d="M21.1 5h2.8v3.1H27v2.8h-3.1V14h-2.8v-3.1H18V8.1h3.1z"/><path d="M22.5 14.5c-6.3 0-11.5 3.6-11.5 8.2 0 3.5 2.6 6.4 4.8 8.4h13.4c2.2-2 4.8-4.9 4.8-8.4 0-4.6-5.2-8.2-11.5-8.2z"/><path d="M12.5 37v-2.2c0-1.9 1.5-3.4 3.4-3.4h13.2c1.9 0 3.4 1.5 3.4 3.4V37z"/><path class="ln" d="M15.8 31h13.4"/>',
};
const LET = ['', 'P', 'N', 'B', 'R', 'Q', 'K'];
const SYMBOLS = `<defs>${['w', 'b'].map((c) => Object.entries(SHAPES).map(([k, d]) => `<symbol id="cp-${c}${k}" viewBox="0 0 45 45"><g class="pc ${c}">${d}</g></symbol>`).join('')).join('')}`
  + '<symbol id="cp-star" viewBox="0 0 45 45"><path d="M22.5 8l4.4 9.4 10.3 1.2-7.6 7 2.1 10.2-9.2-5.2-9.2 5.2 2.1-10.2-7.6-7 10.3-1.2z" fill="#ffd23a" stroke="#a8721c" stroke-width="1.4"/></symbol></defs>';

// Le plateau (320 × 320). pieces : 64 cases (0 : vide) ; flip : les noirs en
// bas ; sel : la case choisie ; targets : où elle peut aller ; last : le
// dernier coup ; check : le roi en échec ; stars : les étoiles ; marks : des
// cases en couleur ({ case: 'ok' | 'ko' | 'hint' }).
function board({ pieces, flip = false, sel = -1, targets = [], last = [], check = -1, stars = [], marks = {} }) {
  const at = (s) => { const r = s >> 3, c = s & 7; return flip ? [(7 - c) * 40, (7 - r) * 40] : [c * 40, r * 40]; };
  let sq = '', over = '', pcs = '', tgt = '';
  for (let s = 0; s < 64; s++) {
    const [x, y] = at(s);
    const dark = ((s >> 3) + (s & 7)) % 2 === 1;
    sq += `<rect class="ch-sq ${dark ? 'd' : 'l'}" x="${x}" y="${y}" width="40" height="40"/>`;
    const mark = last.includes(s) ? 'last' : '';
    if (mark) over += `<rect class="ch-${mark}" x="${x}" y="${y}" width="40" height="40"/>`;
    if (s === sel) over += `<rect class="ch-sel" x="${x}" y="${y}" width="40" height="40"/>`;
    if (marks[s]) over += `<rect class="ch-mark ${marks[s]}" x="${x}" y="${y}" width="40" height="40"/>`;
    if (s === check) over += `<circle class="ch-check" cx="${x + 20}" cy="${y + 20}" r="19"/>`;
    if (stars.includes(s)) pcs += `<use href="#cp-star" x="${x + 3}" y="${y + 3}" width="34" height="34"/>`;
    const p = pieces[s];
    if (p) pcs += `<use href="#cp-${colorOf(p) ? 'b' : 'w'}${LET[typeOf(p)]}" x="${x + 1}" y="${y + 1}" width="38" height="38"/>`;
    if (targets.includes(s)) tgt += p ? `<circle class="ch-tgt cap" cx="${x + 20}" cy="${y + 20}" r="17"/>` : `<circle class="ch-tgt" cx="${x + 20}" cy="${y + 20}" r="5.5"/>`;
  }
  // les coordonnées : les colonnes en bas, les rangées à gauche
  let coords = '';
  for (let k = 0; k < 8; k++) {
    const file = flip ? 7 - k : k, rank = flip ? k + 1 : 8 - k;
    coords += `<text class="ch-co ${(7 + k) % 2 ? 'd' : 'l'}" x="${k * 40 + 36}" y="316" text-anchor="end">${FILES[file]}</text>`;
    coords += `<text class="ch-co ${k % 2 ? 'd' : 'l'}" x="3" y="${k * 40 + 11}">${rank}</text>`;
  }
  const hits = Array.from({ length: 64 }, (_, s) => { const [x, y] = at(s); return `<rect class="ch-hit" x="${x}" y="${y}" width="40" height="40" data-act="ch-sq" data-sq="${s}"/>`; }).join('');
  return `<div class="ch-board"><svg viewBox="0 0 320 320" role="img" aria-label="Échiquier">${SYMBOLS}${sq}${over}${coords}${pcs}${tgt}${hits}</svg></div>`;
}

// L'image de la tuile, dans l'arcade : un coin d'échiquier et un cavalier.
export function chessArt() {
  const sq = [0, 1, 2, 3].flatMap((r) => [0, 1, 2, 3].map((c) => `<rect x="${c * 10}" y="${r * 10}" width="10" height="10" fill="${(r + c) % 2 ? '#b07d55' : '#ecdcc4'}"/>`)).join('');
  return `<svg viewBox="0 0 40 40">${sq}<svg x="3" y="2" width="34" height="34" viewBox="0 0 45 45"><g class="pc w">${SHAPES.N}</g></svg></svg>`;
}

export function createChess(ctx) {
  const E = () => (ctx.state.games.echecs ??= { lessons: {}, puzzles: {}, wins: {}, draws: {}, losses: {}, cur: null });
  let screen = 'home'; // 'home' | 'lesson' | 'puzzles' | 'puzzle' | 'game'
  let L = null; // la leçon ouverte : { lesson, step, intro }
  let X = null; // l'exercice en cours sur le plateau
  let PZ = null; // le problème en cours
  let G = null; // la partie contre Cap
  let promo = null; // une promotion à choisir : { cands, then }
  let wait = null; // la réponse de Cap, qui arrive après un court instant
  let pick = { level: 'debutant', color: 'w' };
  const later = (fn, ms = 380) => { clearTimeout(wait); wait = setTimeout(fn, ms); };

  // ---------- un coup au doigt, sur une vraie position ----------
  // t : { pos, sel } ; then(m) : ce qu'on fait du coup choisi.
  function tapPos(t, s, then) {
    if (t.sel >= 0) {
      const cands = legalMoves(t.pos).filter((m) => m.from === t.sel && m.to === s);
      if (cands.length > 1) { promo = { cands, then }; t.sel = -1; ctx.render(); return; }
      if (cands.length) { t.sel = -1; then(cands[0]); return; }
    }
    const p = t.pos.board[s];
    t.sel = p && colorOf(p) === t.pos.turn && legalMoves(t.pos).some((m) => m.from === s) && t.sel !== s ? s : -1;
    ctx.render();
  }
  const targetsOf = (t) => (t.sel >= 0 ? legalMoves(t.pos).filter((m) => m.from === t.sel).map((m) => m.to) : []);
  const checkOf = (pos) => (inCheck(pos) ? kingSquare(pos, pos.turn) : -1);
  // la promotion : le pion qui arrive au bout devient la pièce choisie (de sa couleur)
  const promoBar = () => {
    if (!promo) return '';
    const c = colorOf(promo.cands[0].promo) ? 'b' : 'w';
    return `<div class="ch-promo"><span>Ton pion devient :</span>${[QUEEN, ROOK, BISHOP, KNIGHT].map((t) => `<button class="ch-promo-btn" data-act="ch-promo" data-t="${t}" aria-label="${['', '', 'cavalier', 'fou', 'tour', 'dame'][t]}"><svg viewBox="0 0 45 45"><use href="#cp-${c}${LET[t]}"/></svg></button>`).join('')}</div>`;
  };

  // ---------- l'école ----------
  function startStep() {
    const ex = L.lesson.steps[L.step];
    promo = null;
    X = { ex, msg: '', ok: false, sel: -1, marks: {} };
    if (ex.type === 'square') Object.assign(X, { k: 0, msg: `Touche la case ${ex.ask[0]}.` });
    if (ex.type === 'stars') Object.assign(X, { at: ex.from, got: [], moves: 0 });
    if (ex.type === 'move' || ex.type === 'endgame') Object.assign(X, { pos: fromFen(ex.fen), moves: 0, last: [] });
    if (ex.type === 'choice' && ex.fen) X.pos = fromFen(ex.fen);
  }

  function lessonDone() {
    const e = E();
    if (!e.lessons[L.lesson.id]) {
      e.lessons[L.lesson.id] = true;
      ctx.save();
      const n = Object.keys(e.lessons).length;
      ctx.celebrate(n === LESSONS.length ? 'École d’échecs terminée : toutes les leçons !' : `Leçon réussie : ${L.lesson.title}`);
    }
  }

  function exerciseView() {
    const ex = X.ex;
    let body = '';
    if (ex.type === 'square') body = board({ pieces: Array(64).fill(0), marks: X.marks });
    if (ex.type === 'stars') {
      const pieces = Array(64).fill(0);
      pieces[sqIndexOf(X.at)] = ex.piece;
      for (const b of ex.blockers ?? []) pieces[sqIndexOf(b)] = 1 | BLACK;
      const left = ex.stars.filter((s) => !X.got.includes(s)).map(sqIndexOf);
      body = board({ pieces, stars: left, sel: X.ok ? -1 : sqIndexOf(X.at), targets: X.ok ? [] : starMoves(ex, X.at) });
    }
    if (ex.type === 'move' || ex.type === 'endgame') body = board({ pieces: X.pos.board, sel: X.sel, targets: X.ok ? [] : targetsOf(X), last: X.last, check: checkOf(X.pos) });
    if (ex.type === 'choice') body = `${X.pos ? board({ pieces: X.pos.board }) : ''}<div class="ch-choices">${ex.choices.map((c, i) => `<button class="btn${X.picked === i ? (i === ex.good ? ' ok' : ' ko') : ''}" data-act="ch-choice" data-i="${i}"${X.ok ? ' disabled' : ''}>${esc(c)}</button>`).join('')}</div>`;
    const counter = ex.type === 'stars' ? `<p class="ch-count">${X.got.length} / ${ex.stars.length} étoiles · ${X.moves} coup${X.moves > 1 ? 's' : ''}</p>` : ex.type === 'endgame' ? `<p class="ch-count">${X.moves} / ${ex.max} coups</p>` : '';
    const last = L.step === L.lesson.steps.length - 1;
    // recommencer : après un faux pas, ou pour attraper les étoiles en moins de coups
    const retry = X.fail || (ex.type === 'stars' && X.ok && X.moves > ex.best) || (ex.type !== 'choice' && ex.type !== 'square' && !X.ok && (X.moves > 0 || X.bad));
    return `<p class="ch-task">${esc(ex.text)}</p>${counter}${body}${promoBar()}
      ${X.msg ? `<p class="ch-msg${X.ok ? ' ok' : X.bad ? ' ko' : ''}">${esc(X.msg)}</p>` : ''}
      <div class="ch-actions">${X.ok ? `<button class="btn primary" data-act="ch-next">${last ? 'Terminer la leçon' : 'Exercice suivant'}</button>` : ''}${retry ? '<button class="btn" data-act="ch-retry">Recommencer</button>' : ''}</div>`;
  }

  function lessonView() {
    const l = L.lesson;
    const head = `<div class="arc-top"><button class="btn small" data-act="ch-home">‹ École</button><div class="arc-score"><b>${L.intro ? 'Leçon' : `${L.step + 1} / ${l.steps.length}`}</b><small>${esc(l.title)}</small></div></div>`;
    if (L.intro) {
      return `<section class="arcade ch-wrap">${head}<div class="card ch-intro"><h2>${esc(l.title)}</h2>${l.intro.map((p) => `<p>${esc(p)}</p>`).join('')}
        <button class="btn primary wide" data-act="ch-start">C’est parti</button></div></section>`;
    }
    return `<section class="arcade ch-wrap">${head}${exerciseView()}</section>`;
  }

  // ---------- les problèmes ----------
  function puzzlesView() {
    const e = E();
    const groups = [...new Set(PUZZLES.map((p) => p.group))];
    return `<section class="arcade ch-wrap"><div class="arc-top"><button class="btn small" data-act="ch-home">‹ École</button><div class="arc-score"><b>${Object.keys(e.puzzles).length} / ${PUZZLES.length}</b><small>problèmes résolus</small></div></div>
      ${groups.map((g) => `<h3 class="tr-group">${esc(g)}</h3><div class="ch-pz-grid">${PUZZLES.filter((p) => p.group === g).map((p, i) => `<button class="ch-pz${e.puzzles[p.id] ? ' done' : ''}" data-act="ch-puzzle" data-id="${p.id}"><b>${e.puzzles[p.id] ? '✓' : i + 1}</b><small>${esc(p.text)}</small></button>`).join('')}</div>`).join('')}
      <p class="hint">Les blancs jouent, sauf si c’est écrit. « Mat en 2 » : ton coup, la réponse de Cap, puis ton mat.</p></section>`;
  }

  function puzzleView() {
    const p = PZ.pz;
    const who = PZ.side === WHITE ? 'Les blancs jouent' : 'Les noirs jouent';
    const i = PUZZLES.indexOf(p);
    return `<section class="arcade ch-wrap"><div class="arc-top"><button class="btn small" data-act="ch-puzzles">‹ Problèmes</button><div class="arc-score"><b>${esc(p.group)}</b><small>${who}</small></div></div>
      <p class="ch-task">${esc(p.text)}</p>
      ${board({ pieces: PZ.pos.board, sel: PZ.sel, targets: PZ.ok ? [] : targetsOf(PZ), last: PZ.last, check: checkOf(PZ.pos), flip: PZ.flip })}${promoBar()}
      ${PZ.msg ? `<p class="ch-msg${PZ.ok ? ' ok' : PZ.bad ? ' ko' : ''}">${esc(PZ.msg)}</p>` : ''}
      <div class="ch-actions">${PZ.ok && i < PUZZLES.length - 1 ? `<button class="btn primary" data-act="ch-puzzle" data-id="${PUZZLES[i + 1].id}">Problème suivant</button>` : ''}${!PZ.ok && (PZ.bad || PZ.phase > 1) ? '<button class="btn" data-act="ch-puzzle" data-id="' + p.id + '">Recommencer</button>' : ''}</div></section>`;
  }

  function openPuzzle(id) {
    const pz = PUZZLES.find((x) => x.id === id) ?? PUZZLES[0];
    const pos = fromFen(pz.fen);
    PZ = { pz, pos, sel: -1, last: [], phase: 1, msg: '', ok: false, bad: false, side: pos.turn, flip: pos.turn === BLACK };
    promo = null;
    screen = 'puzzle';
  }

  function puzzleMove(m) {
    const pz = PZ.pz;
    const goal = PZ.phase === 2 ? { goal: 'mate' } : pz;
    const r = judge(goal, PZ.pos, m);
    if (!r.ok) {
      Object.assign(PZ, { bad: true, msg: `${r.san} : ce n’est pas ça. Cherche encore (regarde les échecs et les prises).` });
      ctx.render();
      return;
    }
    make(PZ.pos, m);
    Object.assign(PZ, { last: [m.from, m.to], bad: false });
    if (pz.goal === 'mate2' && PZ.phase === 1 && !r.mate) {
      PZ.msg = `${r.san} ! Cap réfléchit…`;
      ctx.render();
      later(() => {
        const reply = defend(PZ.pos);
        const name = san(PZ.pos, reply);
        make(PZ.pos, reply);
        Object.assign(PZ, { phase: 2, last: [reply.from, reply.to], msg: `Cap répond ${name}. À toi : mat en un coup.` });
        ctx.render();
      });
      return;
    }
    solved(r.san);
  }

  function solved(name) {
    const e = E();
    const first = !e.puzzles[PZ.pz.id];
    e.puzzles[PZ.pz.id] = true;
    Object.assign(PZ, { ok: true, msg: `${name} : bravo, c’est ça !` });
    ctx.save();
    ctx.render();
    if (first && Object.keys(e.puzzles).length === PUZZLES.length) ctx.celebrate('Échecs : tous les problèmes résolus !');
  }

  // ---------- la partie contre Cap ----------
  function newGame() {
    const color = pick.color === 'r' ? (Math.random() < 0.5 ? WHITE : BLACK) : pick.color === 'b' ? BLACK : WHITE;
    G = { start: START, pos: fromFen(START), sans: [], keys: [toFen(fromFen(START), false)], level: pick.level, color, over: null, sel: -1, last: [], hint: null, thinking: false };
    promo = null;
    saveGame();
    screen = 'game';
    if (G.pos.turn !== G.color) capTurn();
  }

  function saveGame() {
    E().cur = G && !G.over ? { start: G.start, sans: G.sans, level: G.level, color: G.color } : null;
    ctx.save();
  }

  // Reprend la partie gardée (ses coups rejoués un par un).
  function restore() {
    const cur = E().cur;
    if (!cur) return false;
    try {
      const pos = fromFen(cur.start);
      const keys = [toFen(pos, false)];
      let last = [];
      for (const s of cur.sans) {
        const m = legalMoves(pos).find((x) => san(pos, x) === s);
        if (!m) throw new Error(s);
        make(pos, m);
        keys.push(toFen(pos, false));
        last = [m.from, m.to];
      }
      G = { start: cur.start, pos, sans: [...cur.sans], keys, level: LEVELS[cur.level] ? cur.level : 'debutant', color: cur.color === BLACK ? BLACK : WHITE, over: null, sel: -1, last, hint: null, thinking: false };
      if (G.pos.turn !== G.color) capTurn();
      return true;
    } catch {
      E().cur = null;
      return false;
    }
  }

  function playMove(m) {
    const name = san(G.pos, m);
    make(G.pos, m);
    G.sans.push(name);
    G.keys.push(toFen(G.pos, false));
    G.last = [m.from, m.to];
    G.hint = null;
    const st = status(G.pos, G.keys);
    if (st) finish(st);
    else saveGame();
    return st;
  }

  function capTurn() {
    G.thinking = true;
    later(() => {
      if (!G || G.over) return;
      const m = bestMove(G.pos, { ...LEVELS[G.level], rnd: Math.random });
      G.thinking = false;
      if (m) playMove(m);
      ctx.render();
    }, 320);
  }

  function finish(st) {
    const e = E();
    const lvl = G.level;
    let result;
    if (st === 'mat') result = G.pos.turn === G.color ? 'perdu' : 'gagne';
    else if (st === 'abandon') result = 'perdu';
    else result = 'nulle';
    G.over = { st, result };
    const box = result === 'gagne' ? 'wins' : result === 'nulle' ? 'draws' : 'losses';
    e[box] = { ...(e[box] ?? {}), [lvl]: ((e[box] ?? {})[lvl] ?? 0) + 1 };
    e.cur = null;
    ctx.save();
    if (result === 'gagne') ctx.celebrate(`Échec et mat : tu as battu Cap (${LEVELS[lvl].name}) !`);
  }

  function gameView() {
    const flip = G.color === BLACK;
    const yourTurn = !G.over && G.pos.turn === G.color;
    let msg;
    if (G.over) msg = G.over.st === 'mat' ? (G.over.result === 'gagne' ? 'Échec et mat : tu as gagné !' : 'Échec et mat : Cap a gagné. Retente ta chance !') : G.over.st === 'abandon' ? 'Tu as abandonné.' : END[G.over.st];
    else if (G.thinking) msg = 'Cap réfléchit…';
    else msg = `${inCheck(G.pos) ? 'Échec ! ' : ''}À toi de jouer (${G.color === WHITE ? 'blancs' : 'noirs'}).`;
    if (G.hint && !G.over) msg = `Indice : essaie ${G.hint.san}.`;
    const moves = G.sans.reduce((out, s, i) => (i % 2 ? `${out} ${esc(s)}</li>` : `${out}<li><b>${i / 2 + 1}.</b> ${esc(s)}`), '') + (G.sans.length % 2 ? '</li>' : '');
    const marks = G.hint ? { [G.hint.from]: 'hint', [G.hint.to]: 'hint' } : {};
    return `<section class="arcade ch-wrap"><div class="arc-top"><button class="btn small" data-act="ch-home">‹ École</button><div class="arc-score"><b>${esc(LEVELS[G.level].name)}</b><small>Toi avec les ${G.color === WHITE ? 'blancs' : 'noirs'}</small></div></div>
      <p class="ch-msg${G.over ? (G.over.result === 'gagne' ? ' ok' : ' ko') : ''}">${esc(msg)}</p>
      ${board({ pieces: G.pos.board, flip, sel: G.sel, targets: yourTurn ? targetsOf(G) : [], last: G.last, check: checkOf(G.pos), marks })}${promoBar()}
      <div class="ch-actions">${G.over ? '<button class="btn primary" data-act="ch-new">Rejouer</button>' : `<button class="btn small" data-act="ch-hint"${yourTurn ? '' : ' disabled'}>${icon('lightbulb')}Indice</button><button class="btn small" data-act="ch-undo" aria-label="Annuler mon dernier coup"${yourTurn && G.sans.length >= 2 ? '' : ' disabled'}>Annuler</button><button class="btn small" data-act="ch-resign">Abandonner</button>`}</div>
      ${G.sans.length ? `<ol class="ch-moves">${moves}</ol>` : ''}</section>`;
  }

  // ---------- l'accueil ----------
  function homeView() {
    const e = E();
    const done = (id) => Boolean(e.lessons[id]);
    const next = LESSONS.findIndex((l) => !done(l.id));
    const wins = (lv) => (e.wins ?? {})[lv] ?? 0;
    return `<section class="arcade ch-wrap"><div class="arc-top"><button class="btn small" data-act="arc-menu">‹ Arcade</button><div class="arc-score"><b>Échecs</b><small>${Object.keys(e.lessons).length} / ${LESSONS.length} leçons · ${Object.keys(e.puzzles).length} / ${PUZZLES.length} problèmes</small></div></div>
      <section class="card ch-card"><h2>${icon('school')}Apprendre</h2><p class="hint">Du plateau jusqu’au mat, pas à pas : une explication courte, puis des exercices sur le plateau.</p>
        <ol class="ch-lessons">${LESSONS.map((l, i) => `<li><button class="ch-lesson${done(l.id) ? ' done' : ''}${i === next ? ' next' : ''}" data-act="ch-lesson" data-id="${l.id}"><span class="ch-num">${done(l.id) ? '✓' : i + 1}</span><span>${esc(l.title)}</span></button></li>`).join('')}</ol></section>
      <section class="card ch-card"><h2>${icon('target')}Problèmes</h2><p class="hint">Mats en un et en deux coups, fourchettes, enfilades : trouve le coup qui gagne.</p>
        <button class="btn primary wide" data-act="ch-puzzles">Résoudre (${Object.keys(e.puzzles).length} / ${PUZZLES.length})</button></section>
      <section class="card ch-card"><h2>${icon('trophy')}Jouer contre Cap</h2>
        <div class="ch-pick">${Object.entries(LEVELS).map(([id, lv]) => `<button class="seg${pick.level === id ? ' on' : ''}" data-act="ch-level" data-id="${id}" aria-pressed="${pick.level === id}">${lv.name}${wins(id) ? ` · ${wins(id)} ✓` : ''}</button>`).join('')}</div>
        <div class="ch-pick">${[['w', 'Blancs'], ['b', 'Noirs'], ['r', 'Au hasard']].map(([c, n]) => `<button class="seg${pick.color === c ? ' on' : ''}" data-act="ch-color" data-c="${c}" aria-pressed="${pick.color === c}">${n}</button>`).join('')}</div>
        ${e.cur ? '<button class="btn primary wide" data-act="ch-resume">Reprendre la partie</button>' : ''}
        <button class="btn${e.cur ? '' : ' primary'} wide" data-act="ch-new">Nouvelle partie</button>
        <p class="hint">Débutant : Cap fait des erreurs. Moyen : il voit deux coups. Coriace : il calcule loin. Bloqué ? « Indice » te souffle un bon coup.</p></section>
    </section>`;
  }

  const sqIndexOf = (n) => (8 - Number(n[1])) * 8 + FILES.indexOf(n[0]);

  // ---------- le doigt sur le plateau ----------
  function tap(s) {
    // une promotion à choisir : toucher le plateau l'annule (on rejoue un autre coup)
    if (promo) { promo = null; ctx.render(); return; }
    if (screen === 'game' && G && !G.over && !G.thinking && G.pos.turn === G.color) {
      tapPos(G, s, (m) => { if (!playMove(m)) capTurn(); ctx.render(); });
      return;
    }
    if (screen === 'puzzle' && PZ && !PZ.ok && !(PZ.phase === 1 && PZ.msg.endsWith('réfléchit…'))) {
      tapPos(PZ, s, puzzleMove);
      return;
    }
    if (screen !== 'lesson' || !X || X.ok) return;
    const ex = X.ex;
    if (ex.type === 'square') {
      const name = sqName(s);
      if (name === ex.ask[X.k]) {
        X.marks = { ...X.marks, [s]: 'ok' };
        X.k++;
        X.bad = false;
        if (X.k === ex.ask.length) Object.assign(X, { ok: true, msg: 'Bravo : tu sais lire l’échiquier !' });
        else X.msg = `Oui ! Maintenant, touche ${ex.ask[X.k]}.`;
      } else {
        X.marks = { ...Object.fromEntries(Object.entries(X.marks).filter(([, v]) => v === 'ok')), [s]: 'ko' };
        Object.assign(X, { bad: true, msg: `Non, ça c’est ${name}. Cherche ${ex.ask[X.k]} : d’abord la colonne (la lettre), puis la rangée (le chiffre).` });
      }
    } else if (ex.type === 'stars') {
      if (!starMoves(ex, X.at).includes(s)) {
        Object.assign(X, { bad: true, msg: 'Ta pièce ne peut pas aller là : regarde les points.' });
      } else {
        const name = sqName(s);
        X.at = name;
        X.moves++;
        X.bad = false;
        if (ex.stars.includes(name) && !X.got.includes(name)) X.got = [...X.got, name];
        if (X.got.length === ex.stars.length) Object.assign(X, { ok: true, msg: X.moves <= ex.best ? `Parfait : ${X.moves} coups, le minimum !` : `Réussi en ${X.moves} coups. On peut le faire en ${ex.best} : réessaie si tu veux !` });
        else X.msg = '';
      }
    } else if (ex.type === 'move') {
      tapPos(X, s, (m) => {
        const r = judge(ex, X.pos, m);
        if (r.ok) {
          make(X.pos, m);
          Object.assign(X, { ok: true, bad: false, last: [m.from, m.to], msg: `${r.san} : bravo !${ex.why ? ` ${ex.why}` : ''}` });
        } else Object.assign(X, { bad: true, msg: `${r.san} : ce n’est pas ça. Relis la consigne et réessaie.` });
        ctx.render();
      });
      return;
    } else if (ex.type === 'endgame') {
      if (X.thinking) return;
      tapPos(X, s, (m) => {
        make(X.pos, m);
        X.moves++;
        X.last = [m.from, m.to];
        const st = status(X.pos);
        if (st === 'mat') Object.assign(X, { ok: true, msg: `Échec et mat en ${X.moves} coups : bravo !` });
        else if (st) Object.assign(X, { fail: true, bad: true, msg: st === 'pat' ? 'Pat ! Le roi noir n’a plus de coup sans être en échec : partie nulle. Laisse-lui une case… jusqu’au mat. Recommence.' : 'Raté : recommence.' });
        else if (X.moves >= ex.max) Object.assign(X, { fail: true, bad: true, msg: `${ex.max} coups sans mat : recommence, en poussant le roi vers le bord.` });
        else {
          X.thinking = true;
          X.msg = '';
          later(() => {
            const r = defend(X.pos);
            make(X.pos, r);
            X.last = [r.from, r.to];
            X.thinking = false;
            if (status(X.pos)) Object.assign(X, { fail: true, bad: true, msg: 'Cap a pris ta dame : partie nulle. Recommence, et garde-la protégée.' });
            ctx.render();
          }, 300);
        }
        ctx.render();
      });
      return;
    }
    ctx.render();
  }

  const actions = {
    'ch-sq'(el) { tap(Number(el.dataset.sq)); },
    'ch-home'() { clearTimeout(wait); screen = 'home'; promo = null; ctx.render(); },
    'ch-lesson'(el) {
      const lesson = LESSONS.find((l) => l.id === el.dataset.id);
      if (!lesson) return;
      L = { lesson, step: 0, intro: true };
      screen = 'lesson';
      ctx.render();
      window.scrollTo(0, 0);
    },
    'ch-start'() { L.intro = false; startStep(); ctx.render(); },
    'ch-next'() {
      if (L.step < L.lesson.steps.length - 1) { L.step++; startStep(); ctx.render(); return; }
      lessonDone();
      const i = LESSONS.indexOf(L.lesson);
      if (i < LESSONS.length - 1) { L = { lesson: LESSONS[i + 1], step: 0, intro: true }; } else screen = 'home';
      ctx.render();
      window.scrollTo(0, 0);
    },
    'ch-retry'() { clearTimeout(wait); startStep(); ctx.render(); },
    'ch-choice'(el) {
      if (!X || X.ok) return;
      const i = Number(el.dataset.i);
      X.picked = i;
      if (i === X.ex.good) Object.assign(X, { ok: true, bad: false, msg: `Oui ! ${X.ex.why}` });
      else Object.assign(X, { bad: true, msg: 'Non… réfléchis encore.' });
      ctx.render();
    },
    'ch-promo'(el) {
      if (!promo) return;
      const t = Number(el.dataset.t);
      const m = promo.cands.find((x) => typeOf(x.promo) === t);
      const then = promo.then;
      promo = null;
      if (m) then(m);
      else ctx.render();
    },
    'ch-puzzles'() { clearTimeout(wait); screen = 'puzzles'; ctx.render(); window.scrollTo(0, 0); },
    'ch-puzzle'(el) { clearTimeout(wait); openPuzzle(el.dataset.id); ctx.render(); },
    'ch-level'(el) { pick.level = el.dataset.id; ctx.render(); },
    'ch-color'(el) { pick.color = el.dataset.c; ctx.render(); },
    'ch-new'() { clearTimeout(wait); newGame(); ctx.render(); window.scrollTo(0, 0); },
    'ch-resume'() { if (restore()) { screen = 'game'; ctx.render(); window.scrollTo(0, 0); } else ctx.render(); },
    'ch-hint'() {
      if (!G || G.over || G.pos.turn !== G.color) return;
      const m = bestMove(G.pos, { depth: 3, quiet: true, ms: 700 });
      if (m) G.hint = { from: m.from, to: m.to, san: san(G.pos, m) };
      ctx.render();
    },
    'ch-undo'() {
      if (!G || G.over || G.thinking || G.sans.length < 2) return;
      const keep = G.sans.slice(0, -2);
      E().cur = { start: G.start, sans: keep, level: G.level, color: G.color };
      restore();
      saveGame();
      ctx.render();
    },
    'ch-resign'() {
      if (!G || G.over) return;
      if (!confirm('Abandonner la partie ?')) return;
      clearTimeout(wait);
      finish('abandon');
      ctx.render();
    },
  };

  return {
    actions,
    // l'écran des échecs (l'arcade l'appelle quand on y est)
    view() {
      if (screen === 'lesson' && L) return lessonView();
      if (screen === 'puzzles') return puzzlesView();
      if (screen === 'puzzle' && PZ) return puzzleView();
      if (screen === 'game' && G) return gameView();
      screen = 'home';
      return homeView();
    },
    // en arrivant : l'accueil des échecs (la partie en cours s'y reprend)
    enter() { clearTimeout(wait); screen = 'home'; promo = null; },
    // en partant de l'arcade : on coupe la réflexion de Cap (la partie est gardée)
    leave() { clearTimeout(wait); promo = null; },
  };
}
