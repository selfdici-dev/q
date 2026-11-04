// La borne d'arcade de la Salle : l'écran des jeux (#jeux) et leurs parties.
// Les règles sont dans games.js, gems.js et sudoku.js (testées) ; ici
// l'affichage, le doigt et les records (state.games). Pas de son ; les
// animations se coupent si le téléphone demande de les réduire.
import { SIZE, SHAPES, newBlocks, placeBlock, canPlace, CALC_TIME, newCalc, answerCalc } from './games.js';
import { GEM_SIZE, colorOf, isBolt, adjacent, findMove, newGems, playSwap } from './gems.js';
import { PEERS, newSudoku, sdPlace, sdNote, sdCounts } from './sudoku.js';
import { SN, snakeDelay, newSnake, turnSnake, stepSnake } from './snake.js';
import { pairsCols, newPairs, flipCard, hidePairs, pairsStars } from './pairs.js';
import { CODE_LEN, CODE_COLORS, CODE_TRIES, newCode, playGuess } from './code.js';
import { BW, BH, PADDLE_Y, BALL_R, newBricks, serve, movePaddle, stepBricks, nextBricks } from './bricks.js';
import { newTaquin, slide } from './taquin.js';
import { ECHO_PADS, echoDelay, newEcho, pressEcho } from './echo.js';
import { SW, SH, GROUND, RUNNER_X, newSprint, jumpSprint, stepSprint, sprintScore } from './sprint.js';
import { PUZZLES, SIZES, sizeOf, clues, newPixels, paint, linesOk } from './pixels.js';
import { createChess, chessArt } from './chess-view.js';
import { LESSONS } from './chess-school.js';
import { icon } from './icons.js';

const fmt = (n) => Number(n).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
const GEM_NAMES = ['', 'vert', 'bleu', 'orange', 'violet', 'or'];
const SD_NAMES = { facile: 'Facile', moyen: 'Moyen', difficile: 'Difficile' };
// dessins des Paires (icônes de l'appli) et leurs couleurs
const PAIR_ICONS = ['dumbbell', 'flame', 'flag', 'trophy', 'target', 'sun', 'moon', 'sparkles', 'apple', 'cup', 'books', 'compass', 'coin', 'lightbulb', 'map', 'waves', 'sprout', 'shield', 'alarm', 'pin'];
const PAIR_NAMES = ['haltère', 'flamme', 'drapeau', 'trophée', 'cible', 'soleil', 'lune', 'étincelles', 'pomme', 'tasse', 'livres', 'boussole', 'pièce', 'ampoule', 'carte', 'vagues', 'pousse', 'bouclier', 'réveil', 'épingle'];
const PAIR_COLORS = ['#9fd08f', '#7cc4e4', '#e98a6b', '#c3a3e0', '#e7c76b', '#ef8fc0'];
const CODE_NAMES = ['', 'vert', 'bleu', 'orange', 'violet', 'or', 'rose'];
const ARROWS = { haut: '▲', gauche: '◀', droite: '▶', bas: '▼' };
const PIECE_COLORS = ['', '#9fd08f', '#7cc4e4', '#e98a6b', '#c3a3e0', '#e7c76b'];
const ECHO_NAMES = ['vert', 'bleu', 'orange', 'violet'];
const minutes = (secs) => (secs < 60 ? `${Math.max(1, Math.round(secs))} s` : `${Math.round(secs / 60)} min`);
const EURO = new Set(['sale', 'interest', 'unit']);
const seed = () => (Date.now() ^ Math.floor(Math.random() * 2 ** 31)) | 0;

// Une pièce en petites cases (grille CSS à sa taille).
function pieceHTML(p, cls = 'bl-mini') {
  const cells = SHAPES[p.shape].c;
  const w = 1 + Math.max(...cells.map(([, c]) => c));
  const h = 1 + Math.max(...cells.map(([r]) => r));
  return `<span class="${cls}" style="--w:${w};--h:${h}">${cells.map(([r, c]) => `<i class="c${p.color}" style="grid-area:${r + 1}/${c + 1}"></i>`).join('')}</span>`;
}

export function createArcade(ctx) {
  let mode = 'menu'; // 'menu' | 'blocs' | 'calc' | … | 'echecs'
  let calc = null; // partie de Calcul éclair (en mémoire : 60 s)
  let calcEnd = 0;
  let timer = null;
  let flash = '';
  let cleared = [];
  let blGain = ''; // ce que le dernier coup a rapporté (« +60 · combo ×2 »)
  let drag = null;
  const games = () => (ctx.state.games ??= {});
  const B = () => (games().blocs ??= { best: 0, plays: 0, lines: 0, cur: null });
  const C = () => (games().calc ??= { best: 0, plays: 0, streak: 0 });
  const G = () => (games().cristaux ??= { level: 1, top: 0, best: 0, plays: 0, cur: null });
  const S = () => (games().sudoku ??= { solved: { facile: 0, moyen: 0, difficile: 0 }, best: {}, plays: 0, cur: null });
  const SK = () => (games().serpent ??= { best: 0, plays: 0 });
  const PR = () => (games().paires ??= { level: 1, top: 0, best: {}, plays: 0, cur: null });
  const CD = () => (games().code ??= { wins: 0, plays: 0, best: 0, cur: null });
  // Serpent : la partie (en mémoire), son minuteur, en pause ou non
  let snake = null;
  let snTimer = null;
  let snPaused = false;
  // Paires : le minuteur qui referme deux cartes différentes
  let prTimer = null;
  // Code secret : l'essai en cours de composition
  let codeDraft = [];
  const BR = () => (games().briques ??= { best: 0, level: 0, plays: 0 });
  const TQ = () => (games().taquin ??= { best: {}, plays: 0, cur: null });
  const EC = () => (games().echo ??= { best: 0, plays: 0 });
  // Casse-briques : la partie (en mémoire), la boucle d'images, les éclats
  let br = null;
  let brRaf = 0;
  let brLast = 0;
  let brPaused = false;
  let sparks = [];
  // Écho : la partie, la touche allumée, la phase (démonstration ou à toi)
  let echo = null;
  let ecPhase = 'show';
  let ecTimers = [];
  // Cristaux : le cristal choisi, l'animation en cours (grille montrée, cases
  // qui éclatent, qui tombent), les deux qui refusent de s'échanger
  let gemSel = null;
  let gemAnim = null;
  let gemShake = [];
  let gemTap = 0; // un glissé vient de jouer : on ignore le clic qui suit
  // Sprint : la course (en mémoire), la boucle d'images, en pause ou non
  const SP = () => (games().sprint ??= { best: 0, plays: 0 });
  let sp = null;
  let spRaf = 0;
  let spLast = 0;
  let spPaused = false;
  // Pixels cachés : les dessins trouvés, la grille en cours ; noircir ou poser des croix
  const PX = () => (games().pixels ??= { done: [], plays: 0, cur: null });
  let pxCross = false;
  // Échecs : l'école, les problèmes et les parties contre Cap (chess-view.js)
  const chess = createChess(ctx);
  // Sudoku : la case choisie, le mode notes, la dernière action (temps actif)
  let sdSel = null;
  let sdNotesMode = false;
  let sdLast = 0;

  // ---------- menu ----------
  function menuView() {
    const b = B();
    const c = C();
    const g = G();
    const sd = S();
    const sk = SK();
    const pr = PR();
    const cd = CD();
    const going = b.cur && !b.cur.over;
    const gemGoing = g.cur && !g.cur.won && !g.cur.over;
    const sdGoing = sd.cur && !sd.cur.done;
    const prGoing = pr.cur && !pr.cur.done;
    const cdGoing = cd.cur && !cd.cur.won && !cd.cur.over;
    const solved = Object.values(sd.solved).reduce((a, n) => a + n, 0);
    const tile = (id, name, tag, art, best, play) => `<section class="arc-tile">
      <div class="arc-art ${art[0]}" aria-hidden="true">${art[1]}</div>
      <h3>${name}</h3><p class="arc-tag">${tag}</p><p class="arc-best">${best}</p>${play}
    </section>`;
    const go = (id, label, extra = '') => `<button class="btn primary small" data-act="arc-play" data-id="${id}"${extra}>${label}</button>`;
    const brk = BR();
    const tq = TQ();
    const ec = EC();
    const tqGoing = tq.cur && !tq.cur.done;
    const spr = SP();
    const px = PX();
    const pxGoing = px.cur && !px.cur.done;
    const heart = ['.#.#.', '#####', '#####', '.###.', '..#..'].join('');
    const runArt = '<svg viewBox="0 0 40 40"><path d="M3 35h34" stroke="#3a2f55" stroke-width="1.4"/><g stroke="#f2f0ff" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M17.5 14.5l-2.5 9" stroke-width="3"/><path d="M15 23.5l5.5 3.5l-1.5 7M15 23.5l-4.5 4.5l-4 -1" stroke-width="2.4"/><path d="M17 16l5 2.5l3 -3.5M16.5 16l-4.5 3l-3 -1" stroke-width="2"/></g><circle cx="19.5" cy="9.5" r="3.4" fill="#f2f0ff"/><rect x="27" y="29" width="2.6" height="6" rx="1" fill="#dc9a70"/><rect x="33.6" y="29" width="2.6" height="6" rx="1" fill="#dc9a70"/><path d="M29.6 32h4" stroke="#9aa0b4" stroke-width="1.4"/></svg>';
    const snakeArt = '<svg viewBox="0 0 40 40"><rect x="6" y="22" width="7" height="7" rx="2" fill="#9fd08f"/><rect x="13" y="22" width="7" height="7" rx="2" fill="#9fd08f"/><rect x="20" y="22" width="7" height="7" rx="2" fill="#9fd08f"/><rect x="20" y="15" width="7" height="7" rx="2.5" fill="#d6f5c4"/><circle cx="30" cy="9" r="3.4" fill="#e98a6b"/></svg>';
    const ch = games().echecs ?? {};
    const chLessons = LESSONS.filter((l) => ch.lessons?.[l.id]).length;
    const chWins = Object.values(ch.wins ?? {}).reduce((a, n) => a + (Number(n) || 0), 0);
    const chDaily = ch.daily?.[ctx.today?.()] !== true; // le problème du jour reste à faire : une quête
    return `<div class="arc-grid">
      <section class="arc-tile arc-wide">
        <div class="arc-art ch-art" aria-hidden="true">${chessArt()}</div>
        <div class="arc-wide-text"><h3>Échecs${chDaily ? '<span class="arc-quest" title="Problème du jour à résoudre">!</span>' : ''}</h3><p class="arc-tag">${chDaily ? 'Le problème du jour t’attend' : 'Apprends pas à pas, puis bats Cap'}</p>
          <p class="arc-best"><b>${chLessons}</b> / ${LESSONS.length} leçons${chWins ? ` · <b>${chWins}</b> victoire${chWins > 1 ? 's' : ''}` : ''}</p></div>
        ${go('echecs', 'Jouer')}
      </section>
      ${tile('blocs', 'Blocs', 'Pose, aligne, efface', ['bl-art', [3, 1, 5, 2].map((k) => `<i class="c${k}"></i>`).join('')], `Record <b>${fmt(b.best)}</b>`, go('blocs', going ? 'Reprendre' : 'Jouer'))}
      ${tile('cristaux', 'Cristaux', 'Échange, fais éclater', ['gm-art', [2, 5, 1, 4].map((k) => `<span class="gm c${k}"><i></i></span>`).join('')], `Niveau <b>${g.level}</b>`, go('cristaux', gemGoing ? 'Reprendre' : 'Jouer'))}
      ${tile('serpent', 'Serpent', 'Mange, grandis, accélère', ['sn-art', snakeArt], `Record <b>${fmt(sk.best)}</b>`, go('serpent', 'Jouer'))}
      ${tile('calc', 'Calcul éclair', '60 s de calcul utile', ['cc-art', '<b>25 %</b><b>× 7</b><b>−30 %</b>'], `Record <b>${fmt(c.best)}</b>`, go('calc', 'Jouer'))}
      ${tile('paires', 'Paires', 'Retrouve les jumelles', ['pr-art', `<span class="pr-mini up" style="--pc:${PAIR_COLORS[1]}">${icon('flame')}</span><span class="pr-mini"></span>`], `Niveau <b>${pr.level}</b>`, go('paires', prGoing ? 'Reprendre' : 'Jouer'))}
      ${tile('code', 'Code secret', 'Devine les 4 couleurs', ['cd-art', [2, 5, 3, 6].map((k) => `<span class="peg p${k}"></span>`).join('')], `<b>${fmt(cd.wins)}</b> code${cd.wins > 1 ? 's' : ''} trouvé${cd.wins > 1 ? 's' : ''}`, go('code', cdGoing ? 'Reprendre' : 'Jouer'))}
      ${tile('briques', 'Casse-briques', 'Renvoie, casse tout', ['br-art', [1, 2, 3, 4, 5, 2].map((k) => `<i style="background:${PIECE_COLORS[k]}"></i>`).join('') + '<b></b><u></u>'], `Record <b>${fmt(brk.best)}</b>${brk.level ? ` · niv. ${brk.level}` : ''}`, go('briques', 'Jouer'))}
      ${tile('sprint', 'Sprint', 'Cours, saute, accélère', ['sp-art', runArt], `Record <b>${fmt(spr.best)} m</b>`, go('sprint', 'Jouer'))}
      ${tile('echo', 'Écho', 'Retiens la suite', ['ec-art', [0, 1, 2, 3].map((k) => `<i class="ec${k}${k === 2 ? ' lit' : ''}"></i>`).join('')], `Record <b>${fmt(ec.best)}</b>`, go('echo', 'Jouer'))}
      ${tile('taquin', 'Taquin', 'Range les cases', ['tq-art', [1, 2, 3, 4, 5, 6, 7, 8, 0].map((v) => `<i>${v || ''}</i>`).join('')], tq.best[3] || tq.best[4] ? `Record ${tq.best[3] ? `<b>${tq.best[3]}</b> en 3×3` : ''}${tq.best[3] && tq.best[4] ? ' · ' : ''}${tq.best[4] ? `<b>${tq.best[4]}</b> en 4×4` : ''}` : 'Pas encore rangé',
        `${tqGoing ? go('taquin', 'Reprendre') : ''}<div class="sd-levels">${[3, 4].map((n) => `<button class="btn small${tqGoing ? '' : ' primary'}" data-act="arc-play" data-id="taquin" data-n="${n}">${n} × ${n}</button>`).join('')}</div>`)}
      ${tile('sudoku', 'Sudoku', 'Un chiffre par ligne', ['sd-art', ['5', '', '3', '', '7', '', '1', '', '9'].map((d) => `<i>${d}</i>`).join('')], `<b>${fmt(solved)}</b> grille${solved > 1 ? 's' : ''}${sd.best.difficile ? ` · ${minutes(sd.best.difficile)}` : ''}`,
        `${sdGoing ? go('sudoku', 'Reprendre') : ''}<div class="sd-levels">${Object.entries(SD_NAMES).map(([lv, name]) => `<button class="btn small${sdGoing ? '' : ' primary'}" data-act="arc-play" data-id="sudoku" data-lv="${lv}">${name}</button>`).join('')}</div>`)}
      ${tile('pixels', 'Pixels cachés', 'Trouve le dessin', ['px-art', [...heart].map((c) => `<i${c === '#' ? ' class="on"' : ''}></i>`).join('')], `<b>${px.done.length}</b> / ${PUZZLES.length} dessins trouvés`,
        `${pxGoing ? go('pixels', 'Reprendre') : ''}<div class="sd-levels">${SIZES.map((n) => `<button class="btn small${pxGoing ? '' : ' primary'}" data-act="arc-play" data-id="pixels" data-n="${n}">${n} × ${n}</button>`).join('')}</div>`)}
    </div>
    <p class="hint">Les jeux comptent aussi pour débloquer des décors de la Salle. Sans pub, sans internet, sans son.</p>`;
  }

  // ---------- Blocs ----------
  function blocsView() {
    const b = B();
    const g = b.cur;
    const cells = g.grid.map((v, k) => `<i class="${v ? `c${v}` : ''}${cleared.includes(k) ? ' gone' : ''}"></i>`).join('');
    const tray = g.pieces.map((p, i) => (p
      ? `<button class="bl-piece${g.over ? ' stuck' : ''}" data-piece="${i}" aria-label="Pièce ${i + 1} : touche et glisse-la sur la grille">${pieceHTML(p)}</button>`
      : '<span class="bl-piece empty"></span>')).join('');
    const record = g.score > 0 && g.score >= b.best;
    return `<section class="arcade bl">
      <div class="arc-top"><button class="btn small" data-act="arc-menu">‹ Arcade</button>
        <div class="arc-score"><b>${fmt(g.score)}</b><small>Record ${fmt(Math.max(b.best, g.score))}</small></div></div>
      <p class="gm-moves"><span>${fmt(g.lines)} ligne${g.lines > 1 ? 's' : ''}</span>${blGain ? `<span class="gm-pts" aria-live="polite">${blGain}</span>` : ''}</p>
      <div class="bl-grid" id="bl-grid">${cells}</div>
      <div class="bl-tray">${tray}</div>
      ${g.over ? `<div class="arc-over"><p class="arc-big">Plus de place</p><p class="muted">${fmt(g.score)} points · ${fmt(g.lines)} lignes${record ? ' · nouveau record' : ''}</p>
        <button class="btn primary" data-act="arc-play" data-id="blocs" data-new="1">Rejouer</button></div>` : '<p class="hint center">Touche une pièce et glisse-la sur la grille.</p>'}
    </section>`;
  }

  function startBlocs(fresh) {
    const b = B();
    if (fresh || !b.cur || b.cur.over) {
      b.cur = newBlocks(seed());
      b.plays += 1;
    }
    cleared = [];
    blGain = '';
    mode = 'blocs';
  }

  function dropPiece(i, r, c) {
    const b = B();
    const before = b.cur.score;
    const res = placeBlock(b.cur, i, r, c);
    if (!res) return false;
    blGain = res.lines ? `+${fmt(res.game.score - before)}${res.lines > 1 ? ` · ${res.lines} lignes` : ''}${res.game.streak > 1 ? ` · combo ×${res.game.streak}` : ''}` : '';
    b.cur = res.game;
    b.lines += res.lines;
    cleared = res.cleared;
    if (res.lines) navigator.vibrate?.(res.lines > 1 ? [12, 40, 12] : 12);
    if (b.cur.over) {
      const rec = b.cur.score > b.best;
      b.best = Math.max(b.best, b.cur.score);
      if (rec) ctx.celebrate(`Nouveau record aux Blocs : ${fmt(b.best)} points`);
    }
    ctx.save();
    ctx.render();
    cleared = [];
    return true;
  }

  // Glisser une pièce : elle suit le doigt un peu au-dessus (pour la voir),
  // la grille montre où elle tomberait.
  function pointerDown(e) {
    if (gemDown(e) || snakeDown(e) || bricksDown(e) || sprintDown(e) || pixelsDown(e)) return;
    const btn = e.target.closest?.('.bl-piece[data-piece]');
    if (!btn || mode !== 'blocs' || B().cur.over) return;
    const grid = document.getElementById('bl-grid');
    if (!grid) return;
    e.preventDefault();
    const i = Number(btn.dataset.piece);
    const p = B().cur.pieces[i];
    const rect = grid.getBoundingClientRect();
    const cell = rect.width / SIZE;
    const el = document.createElement('div');
    el.className = 'bl-float';
    el.style.setProperty('--cell', `${cell}px`);
    el.innerHTML = pieceHTML(p, 'bl-mini big');
    document.body.append(el);
    const cells = SHAPES[p.shape].c;
    const w = (1 + Math.max(...cells.map(([, c]) => c))) * cell;
    const h = (1 + Math.max(...cells.map(([r]) => r))) * cell;
    drag = { i, el, cell, w, h, cells, target: null, id: e.pointerId };
    btn.classList.add('lifted');
    move(e);
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
  }

  function move(e) {
    if (!drag || e.pointerId !== drag.id) return;
    e.preventDefault?.();
    const x = e.clientX - drag.w / 2;
    const y = e.clientY - drag.h - drag.cell * 1.2; // au-dessus du doigt
    drag.el.style.transform = `translate(${x}px, ${y}px)`;
    const grid = document.getElementById('bl-grid');
    if (!grid) return;
    const rect = grid.getBoundingClientRect();
    const c = Math.round((x - rect.left) / drag.cell);
    const r = Math.round((y - rect.top) / drag.cell);
    const ok = canPlace(B().cur.grid, drag.cells, r, c);
    const key = ok ? `${r},${c}` : null;
    if (key === drag.target) return;
    drag.target = key;
    grid.querySelectorAll('.ghost').forEach((n) => n.classList.remove('ghost'));
    if (ok) for (const [dr, dc] of drag.cells) grid.children[(r + dr) * SIZE + c + dc]?.classList.add('ghost');
  }

  function stop() {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', cancel);
    drag?.el.remove();
    document.querySelectorAll('.bl-piece.lifted').forEach((n) => n.classList.remove('lifted'));
    document.querySelectorAll('#bl-grid .ghost').forEach((n) => n.classList.remove('ghost'));
  }

  function up(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const { i, target } = drag;
    stop();
    drag = null;
    if (target) {
      const [r, c] = target.split(',').map(Number);
      dropPiece(i, r, c);
    }
  }

  function cancel() {
    stop();
    drag = null;
  }

  // ---------- Cristaux ----------
  function gemsView() {
    const g = G();
    const game = g.cur;
    const show = gemAnim?.grid ?? game.grid;
    const hint = !gemAnim && !game.won && !game.over ? findMove(game.grid) : null;
    const cells = show.map((v, i) => {
      const cls = ['gm', v ? `c${colorOf(v)}` : 'empty'];
      if (isBolt(v)) cls.push('bolt');
      if (gemSel === i) cls.push('sel');
      if (gemAnim?.pop.has(i)) cls.push('pop');
      if (gemAnim?.fresh.has(i)) cls.push('drop');
      if (gemShake.includes(i)) cls.push('nope');
      if (hint?.includes(i)) cls.push('hint');
      return `<button class="${cls.join(' ')}" data-act="gem" data-i="${i}" aria-label="Cristal ${GEM_NAMES[colorOf(v)] ?? ''}${isBolt(v) ? ' éclair' : ''}"${gemSel === i ? ' aria-pressed="true"' : ''}><i></i></button>`;
    }).join('');
    const pct = Math.min(100, (game.score / game.target) * 100);
    return `<section class="arcade gm-wrap">
      <div class="arc-top"><button class="btn small" data-act="arc-menu">‹ Arcade</button>
        <div class="arc-score"><b>${fmt(game.score)}</b><small>Niveau ${game.level} · objectif ${fmt(game.target)}</small></div></div>
      <div class="gm-bar${pct >= 100 ? ' full' : ''}" aria-hidden="true"><span style="width:${pct.toFixed(1)}%"></span></div>
      <p class="gm-moves"><span><b>${game.moves}</b> coup${game.moves > 1 ? 's' : ''}</span>${gemAnim?.label ? `<span class="gm-pts" aria-live="polite">${gemAnim.label}</span>` : ''}</p>
      <div class="gm-grid" id="gm-grid" style="--n:${GEM_SIZE}">${cells}</div>
      ${game.won ? `<div class="arc-over"><p class="arc-big">Niveau ${game.level} réussi</p><p class="muted">${fmt(game.score)} points, coups restants compris</p>
          <button class="btn primary" data-act="gem-next">Niveau ${game.level + 1}</button></div>`
      : game.over ? `<div class="arc-over"><p class="arc-big">Plus de coups</p><p class="muted">${fmt(game.score)} sur ${fmt(game.target)} points</p>
          <button class="btn primary" data-act="arc-play" data-id="cristaux" data-new="1">Réessayer le niveau ${game.level}</button></div>`
      : '<p class="hint center">Touche un cristal puis son voisin pour les échanger, ou fais-le glisser.</p>'}
    </section>`;
  }

  function startGems(fresh) {
    const g = G();
    if (fresh || !g.cur || g.cur.won || g.cur.over) {
      g.cur = newGems(seed(), g.level);
      g.plays += 1;
    }
    gemSel = null;
    gemAnim = null;
    mode = 'cristaux';
  }

  // Joue l'échange a ↔ b : les cristaux éclatent, tombent, s'enchaînent (pas à pas, sauf si on réduit les animations).
  function playGem(a, b) {
    const g = G();
    const before = g.cur.grid;
    const res = playSwap(g.cur, a, b);
    gemSel = null;
    if (!res) {
      gemShake = [a, b];
      ctx.render();
      setTimeout(() => { gemShake = []; if (mode === 'cristaux') ctx.render(); }, 320);
      return;
    }
    g.cur = res.game;
    ctx.save();
    const end = () => {
      gemAnim = null;
      if (res.game.won) {
        g.top = Math.max(g.top, res.game.level);
        g.level = Math.max(g.level, res.game.level + 1);
      }
      if (res.game.won || res.game.over) g.best = Math.max(g.best, res.game.score);
      ctx.save();
      ctx.render();
      if (res.game.won) ctx.celebrate(`Cristaux : niveau ${res.game.level} réussi`);
    };
    if (res.steps.length > 2) navigator.vibrate?.([10, 30, 10]);
    if (ctx.reduceMotion()) { end(); return; }
    const grid0 = [...before];
    [grid0[a], grid0[b]] = [grid0[b], grid0[a]];
    let k = 0;
    const show = (grid, pop, fresh, label) => {
      gemAnim = { grid, pop: new Set(pop), fresh: new Set(fresh), label };
      if (mode === 'cristaux' && location.hash === '#jeux') ctx.render();
    };
    const next = () => {
      if (k >= res.steps.length) { end(); return; }
      const s = res.steps[k];
      const label = `+${fmt(s.points)}${s.chain > 1 ? ` · enchaînement ×${s.chain}` : ''}`;
      show(k ? res.steps[k - 1].grid : grid0, s.cleared, [], label);
      setTimeout(() => {
        show(s.grid, [], s.fresh, label);
        k += 1;
        setTimeout(next, 230);
      }, 230);
    };
    next();
  }

  // ---------- Sudoku ----------
  function sudokuView() {
    const game = S().cur;
    const sel = sdSel;
    const digit = sel !== null ? game.grid[sel] : '0';
    const cells = [...game.grid].map((ch, i) => {
      const given = game.puzzle[i] !== '0';
      const cls = ['sd'];
      if (given) cls.push('given');
      else if (ch !== '0' && ch !== game.solution[i]) cls.push('wrong');
      if (i === sel) cls.push('sel');
      else if (sel !== null && PEERS[sel].includes(i)) cls.push('peer');
      if (ch !== '0' && ch === digit && i !== sel) cls.push('same');
      if (i % 9 === 2 || i % 9 === 5) cls.push('br');
      if (Math.floor(i / 9) === 2 || Math.floor(i / 9) === 5) cls.push('bb');
      const notes = ch === '0' && game.notes[i] ? `<span class="sd-notes">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<i>${game.notes[i] & (1 << d) ? d : ''}</i>`).join('')}</span>` : '';
      return `<button class="${cls.join(' ')}" data-act="sd-cell" data-i="${i}" aria-label="Ligne ${Math.floor(i / 9) + 1}, colonne ${(i % 9) + 1}${ch !== '0' ? ` : ${ch}` : ', vide'}">${ch !== '0' ? ch : notes}</button>`;
    }).join('');
    const counts = sdCounts(game);
    return `<section class="arcade sd-wrap">
      <div class="arc-top"><button class="btn small" data-act="arc-menu">‹ Arcade</button>
        <div class="arc-score"><b>${SD_NAMES[game.level]}</b><small>${game.mistakes} erreur${game.mistakes > 1 ? 's' : ''}</small></div></div>
      <div class="sd-grid">${cells}</div>
      ${game.done ? `<div class="arc-over"><p class="arc-big">Grille résolue</p><p class="muted">En ${minutes(game.secs)} · ${game.mistakes} erreur${game.mistakes > 1 ? 's' : ''}</p>
          <button class="btn primary" data-act="arc-play" data-id="sudoku" data-lv="${game.level}">Une autre grille</button></div>`
      : `<div class="sd-pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button class="sd-key" data-act="sd-num" data-n="${d}"${counts[d] >= 9 ? ' disabled' : ''}>${d}</button>`).join('')}</div>
        <div class="sd-tools"><button class="btn small${sdNotesMode ? ' on' : ''}" data-act="sd-notes" aria-pressed="${sdNotesMode}">✎ Notes${sdNotesMode ? ' activées' : ''}</button><button class="btn small" data-act="sd-erase">Effacer</button></div>
        <p class="hint center">${sdNotesMode ? 'Notes : touche les chiffres possibles, pour t’en souvenir.' : 'Touche une case, puis un chiffre. Un chiffre faux s’affiche en rouge.'}</p>`}
    </section>`;
  }

  function startSudoku(level) {
    const s = S();
    if (level || !s.cur || s.cur.done) {
      s.cur = newSudoku(seed(), level || s.cur?.level || 'facile');
      s.plays += 1;
    }
    sdSel = null;
    sdNotesMode = false;
    sdLast = Date.now();
    mode = 'sudoku';
  }

  // Une action dans la grille : compte le temps actif (une pause de plus d'une minute ne compte pas).
  function sdTouch(change) {
    const s = S();
    const now = Date.now();
    const before = s.cur;
    s.cur = { ...change(before), secs: before.secs + Math.min(60, (now - sdLast) / 1000) };
    sdLast = now;
    if (s.cur.done && !before.done) {
      const lv = s.cur.level;
      s.solved[lv] = (s.solved[lv] ?? 0) + 1;
      const rec = !s.best[lv] || s.cur.secs < s.best[lv];
      if (rec) s.best[lv] = Math.round(s.cur.secs);
      sdSel = null;
      ctx.save();
      ctx.render();
      ctx.celebrate(`Sudoku résolu en ${minutes(s.cur.secs)}${rec ? ' · record' : ''}`);
      return;
    }
    ctx.save();
    ctx.render();
  }

  // Cristaux : un glissé d'un cristal vers son voisin l'échange (le simple toucher passe par le clic).
  function gemDown(e) {
    const cell = e.target.closest?.('.gm[data-i]');
    if (!cell || mode !== 'cristaux' || gemAnim || !cell.closest('#gm-grid')) return false;
    const from = Number(cell.dataset.i);
    const [x0, y0, id] = [e.clientX, e.clientY, e.pointerId];
    const up = (ev) => {
      if (ev.pointerId !== id) return;
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      const dx = ev.clientX - x0, dy = ev.clientY - y0;
      if (ev.type !== 'pointerup' || Math.max(Math.abs(dx), Math.abs(dy)) < cell.offsetWidth * 0.35) return;
      const r = Math.floor(from / GEM_SIZE), c = from % GEM_SIZE;
      const [tr, tc] = Math.abs(dx) > Math.abs(dy) ? [r, c + Math.sign(dx)] : [r + Math.sign(dy), c];
      if (tr < 0 || tc < 0 || tr >= GEM_SIZE || tc >= GEM_SIZE) return;
      gemTap = Date.now();
      playGem(from, tr * GEM_SIZE + tc);
    };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return true;
  }

  // ---------- Serpent ----------
  function snakeSVG(g) {
    const body = g.snake.map(([r, c], i) => `<rect x="${c * 10 + 0.6}" y="${r * 10 + 0.6}" width="8.8" height="8.8" rx="${i ? 2.6 : 3.6}" fill="${i ? (i % 2 ? '#8fc47f' : '#9fd08f') : '#d6f5c4'}"/>`).reverse().join('');
    const fruit = g.food ? `<circle cx="${g.food[1] * 10 + 5}" cy="${g.food[0] * 10 + 5.4}" r="3.7" fill="#e98a6b"/><path d="M${g.food[1] * 10 + 5} ${g.food[0] * 10 + 1.8}q1.6 -1.6 3 -0.6" stroke="#9fd08f" stroke-width="1.1" fill="none"/>` : '';
    const [hr, hc] = g.snake[0];
    const eye = { droite: [[6.6, 3.2], [6.6, 6.8]], gauche: [[3.4, 3.2], [3.4, 6.8]], haut: [[3.2, 3.4], [6.8, 3.4]], bas: [[3.2, 6.6], [6.8, 6.6]] }[g.dir]
      .map(([x, y]) => `<circle cx="${hc * 10 + x}" cy="${hr * 10 + y}" r="1" fill="#1b2a16"/>`).join('');
    return `<svg viewBox="0 0 ${SN * 10} ${SN * 10}" aria-hidden="true"><rect width="${SN * 10}" height="${SN * 10}" rx="6" fill="#100c14"/>${fruit}${body}${eye}</svg>`;
  }

  function snakeView() {
    const g = snake;
    const best = SK().best;
    return `<section class="arcade sn-wrap">
      <div class="arc-top"><button class="btn small" data-act="arc-menu">‹ Arcade</button>
        <div class="arc-score"><b id="sn-score">${g.score}</b><small>Record ${fmt(Math.max(best, g.score))}</small></div></div>
      <div class="sn-board" id="sn-board">${snakeSVG(g)}</div>
      ${g.over ? `<div class="arc-over"><p class="arc-big">${g.food ? 'Aïe' : 'Grille remplie !'}</p><p class="muted">${g.score} fruit${g.score > 1 ? 's' : ''}${g.score > 0 && g.score >= best ? ' · nouveau record' : ''}</p>
          <button class="btn primary" data-act="arc-play" data-id="serpent">Rejouer</button></div>`
      : snPaused ? '<div class="arc-over"><p class="arc-big">En pause</p><button class="btn primary" data-act="sn-resume">Reprendre</button></div>'
      : `<div class="sn-pad">${Object.entries(ARROWS).map(([d, a]) => `<button class="sn-key sn-${d}" data-act="sn-dir" data-d="${d}" aria-label="${d}">${a}</button>`).join('')}</div>
        <p class="hint center">Glisse le doigt sur la grille, ou touche les flèches.</p>`}
    </section>`;
  }

  function startSnake() {
    clearTimeout(snTimer);
    snake = newSnake(seed());
    SK().plays += 1;
    snPaused = false;
    mode = 'serpent';
    ctx.save();
    snTimer = setTimeout(snTick, 700);
  }

  // Un pas toutes les quelques dizaines de millisecondes ; seule la grille est redessinée.
  function snTick() {
    if (mode !== 'serpent' || !snake || snake.over) return;
    if (location.hash !== '#jeux' || document.hidden) { snPaused = true; return; }
    snake = stepSnake(snake);
    if (snake.over) {
      const sk = SK();
      const rec = snake.score > sk.best;
      sk.best = Math.max(sk.best, snake.score);
      navigator.vibrate?.(40);
      ctx.save();
      ctx.render();
      if (rec) ctx.celebrate(`Nouveau record au Serpent : ${snake.score} fruits`);
      return;
    }
    const board = document.getElementById('sn-board');
    if (board) board.innerHTML = snakeSVG(snake);
    const sc = document.getElementById('sn-score');
    if (sc) sc.textContent = snake.score;
    snTimer = setTimeout(snTick, snakeDelay(snake.score));
  }

  // Glisser sur la grille tourne le serpent (plusieurs fois dans le même geste).
  function snakeDown(e) {
    if (mode !== 'serpent' || !snake || snake.over || !e.target.closest?.('#sn-board')) return false;
    e.preventDefault();
    let [x0, y0] = [e.clientX, e.clientY];
    const id = e.pointerId;
    const move = (ev) => {
      if (ev.pointerId !== id) return;
      const dx = ev.clientX - x0, dy = ev.clientY - y0;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
      snake = turnSnake(snake, Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'droite' : 'gauche') : (dy > 0 ? 'bas' : 'haut'));
      [x0, y0] = [ev.clientX, ev.clientY];
    };
    const up = (ev) => {
      if (ev.pointerId !== id) return;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return true;
  }

  // ---------- Paires ----------
  function pairsView() {
    const pr = PR();
    const g = pr.cur;
    const cards = g.cards.map((k, i) => {
      const found = g.found.includes(i);
      const up = found || g.open.includes(i);
      return `<button class="pr-card${up ? ' up' : ''}${found ? ' found' : ''}" data-act="pr-flip" data-i="${i}" aria-label="${up ? `Carte ${PAIR_NAMES[g.syms[k]]}` : 'Carte cachée'}"${found ? ' disabled' : ''}>`
        + `<span class="pr-in"><span class="pr-back"></span><span class="pr-face" style="--pc:${PAIR_COLORS[k % PAIR_COLORS.length]}">${icon(PAIR_ICONS[g.syms[k]])}</span></span></button>`;
    }).join('');
    const stars = g.done ? pairsStars(g) : 0;
    return `<section class="arcade pr-wrap">
      <div class="arc-top"><button class="btn small" data-act="arc-menu">‹ Arcade</button>
        <div class="arc-score"><b>${g.moves}</b><small>Niveau ${g.level} · coups${pr.best[g.level] ? ` · record ${pr.best[g.level]}` : ''}</small></div></div>
      <div class="pr-grid" style="--cols:${pairsCols(g.cards.length)}">${cards}</div>
      ${g.done ? `<div class="arc-over"><p class="arc-big">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</p><p class="muted">Niveau ${g.level} en ${g.moves} coups</p>
          <button class="btn primary" data-act="pr-next">Niveau ${g.level + 1}</button></div>`
      : '<p class="hint center">Retourne deux cartes : si elles sont pareilles, elles restent. Moins de coups, plus d’étoiles.</p>'}
    </section>`;
  }

  function startPairs(level) {
    clearTimeout(prTimer);
    const pr = PR();
    if (level || !pr.cur || pr.cur.done) {
      pr.cur = newPairs(seed(), level || pr.level);
      pr.plays += 1;
    }
    mode = 'paires';
  }

  // ---------- Code secret ----------
  const peg = (c, extra = '') => `<span class="peg${c ? ` p${c}` : ' empty'}"${extra}></span>`;
  function codeView() {
    const cd = CD();
    const g = cd.cur;
    const done = g.won || g.over;
    const rows = Array.from({ length: CODE_TRIES }, (_, k) => {
      const past = g.guesses[k];
      const now = !done && k === g.guesses.length;
      const pegs = past ? past.guess.map((c) => peg(c)).join('') : now ? Array.from({ length: CODE_LEN }, (_, j) => (codeDraft[j] ? `<button class="peg p${codeDraft[j]}" data-act="code-del" data-j="${j}" aria-label="Enlever ${CODE_NAMES[codeDraft[j]]}"></button>` : peg(0))).join('') : Array.from({ length: CODE_LEN }, () => peg(0)).join('');
      const pins = past ? `<span class="cd-pins" aria-label="${past.black} bien placées, ${past.white} mal placées">${Array.from({ length: CODE_LEN }, (_, j) => `<i class="${j < past.black ? 'b' : j < past.black + past.white ? 'w' : ''}"></i>`).join('')}</span>` : '<span class="cd-pins"></span>';
      return `<div class="cd-row${now ? ' now' : ''}${!past && !now ? ' later' : ''}"><span class="cd-n">${k + 1}</span><span class="cd-pegs">${pegs}</span>${pins}</div>`;
    }).reverse().join('');
    return `<section class="arcade cd-wrap">
      <div class="arc-top"><button class="btn small" data-act="arc-menu">‹ Arcade</button>
        <div class="arc-score"><b>${g.guesses.length}/${CODE_TRIES}</b><small>essais${cd.best ? ` · record ${cd.best}` : ''}</small></div></div>
      ${done ? `<div class="cd-secret"><span>Le code :</span>${g.secret.map((c) => peg(c)).join('')}</div>` : ''}
      <div class="cd-board">${rows}</div>
      ${done ? `<div class="arc-over"><p class="arc-big">${g.won ? `Trouvé en ${g.guesses.length} essai${g.guesses.length > 1 ? 's' : ''}` : 'Raté, pour cette fois'}</p>
          <button class="btn primary" data-act="arc-play" data-id="code" data-new="1">Un autre code</button></div>`
      : `<div class="cd-palette">${Array.from({ length: CODE_COLORS }, (_, k) => `<button class="peg p${k + 1}" data-act="code-color" data-c="${k + 1}" aria-label="${CODE_NAMES[k + 1]}"${codeDraft.length >= CODE_LEN ? ' disabled' : ''}></button>`).join('')}</div>
        <div class="sd-tools"><button class="btn small" data-act="code-del"${codeDraft.length ? '' : ' disabled'}>Effacer</button><button class="btn primary small" data-act="code-ok"${codeDraft.length === CODE_LEN ? '' : ' disabled'}>Valider</button></div>
        <p class="hint center">● bonne couleur à la bonne place · ○ bonne couleur, mauvaise place. Une couleur peut revenir.</p>`}
    </section>`;
  }

  function startCode(fresh) {
    const cd = CD();
    if (fresh || !cd.cur || cd.cur.won || cd.cur.over) {
      cd.cur = newCode(seed());
      cd.plays += 1;
    }
    codeDraft = [];
    mode = 'code';
  }

  // ---------- Casse-briques ----------
  function bricksView() {
    const g = br;
    const hearts = `${'♥'.repeat(Math.max(0, g.lives))}${'♡'.repeat(Math.max(0, 3 - g.lives))}`;
    queueMicrotask(brDraw); // le terrain se redessine dès que l'écran est en place
    return `<section class="arcade br-wrap">
      <div class="arc-top"><button class="btn small" data-act="arc-menu">‹ Arcade</button>
        <div class="arc-score"><b id="br-score">${fmt(g.score)}</b><small>Niveau ${g.level} · <span class="br-hearts" aria-label="${g.lives} vie${g.lives > 1 ? 's' : ''}">${hearts}</span></small></div></div>
      <canvas class="br-canvas" id="br-canvas" width="${BW * 4}" height="${BH * 4}" role="img" aria-label="Terrain : balle, raquette et briques"></canvas>
      ${g.over ? `<div class="arc-over"><p class="arc-big">Plus de balles</p><p class="muted">${fmt(g.score)} points · niveau ${g.level}${g.score > 0 && g.score >= BR().best ? ' · nouveau record' : ''}</p>
          <button class="btn primary" data-act="arc-play" data-id="briques">Rejouer</button></div>`
      : g.cleared ? `<div class="arc-over"><p class="arc-big">Niveau ${g.level} nettoyé</p><p class="muted">${fmt(g.score)} points</p>
          <button class="btn primary" data-act="br-next">Niveau ${g.level + 1}</button></div>`
      : brPaused ? '<div class="arc-over"><p class="arc-big">En pause</p><button class="btn primary" data-act="br-resume">Reprendre</button></div>'
      : `<p class="hint center">${g.served ? 'Fais glisser le doigt sur le terrain : la raquette suit.' : 'Touche le terrain pour lancer la balle.'}</p>`}
    </section>`;
  }

  const roundRect = (c, x, y, w, h, r) => {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  };

  function brDraw() {
    const cv = document.getElementById('br-canvas');
    if (!cv || !br) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round((cv.clientWidth || 360) * dpr);
    if (cv.width !== w) { cv.width = w; cv.height = Math.round((w * BH) / BW); }
    const c = cv.getContext('2d');
    if (!c) return;
    const k = cv.width / BW;
    c.setTransform(k, 0, 0, k, 0, 0);
    c.fillStyle = '#100c14';
    c.fillRect(0, 0, BW, BH);
    for (const b of br.bricks) {
      if (b.hp <= 0) continue;
      c.fillStyle = PIECE_COLORS[b.color];
      roundRect(c, b.x, b.y, b.w, b.h, 1);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.3)';
      c.fillRect(b.x + 0.6, b.y + 0.5, b.w - 1.2, 0.8);
      if (b.hp > 1) { c.strokeStyle = 'rgba(20,12,8,0.75)'; c.lineWidth = 0.6; for (let i = 1; i < b.hp; i++) { c.beginPath(); c.moveTo(b.x + i * 2.4, b.y + b.h - 0.6); c.lineTo(b.x + i * 2.4 + 1.6, b.y + 0.8); c.stroke(); } }
    }
    for (const p of sparks) { c.globalAlpha = Math.max(0, p.life / 420); c.fillStyle = p.color; c.fillRect(p.x - 0.5, p.y - 0.5, 1, 1); }
    c.globalAlpha = 1;
    const grad = c.createLinearGradient(0, PADDLE_Y, 0, PADDLE_Y + 3);
    grad.addColorStop(0, '#f3c9a8');
    grad.addColorStop(1, '#b8714c');
    c.fillStyle = grad;
    roundRect(c, br.paddle - br.pw / 2, PADDLE_Y, br.pw, 3, 1.5);
    c.fill();
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(br.ball.x, br.ball.y, BALL_R, 0, Math.PI * 2);
    c.fill();
  }

  // ---------- Sprint ----------
  function sprintView() {
    const g = sp;
    const m = sprintScore(g);
    const best = SP().best;
    queueMicrotask(spDraw); // la piste se redessine dès que l'écran est en place
    return `<section class="arcade sp-wrap">
      <div class="arc-top"><button class="btn small" data-act="arc-menu">‹ Arcade</button>
        <div class="arc-score"><b id="sp-score">${fmt(m)} m</b><small>Record ${fmt(best)} m</small></div></div>
      <canvas class="sp-canvas" id="sp-canvas" width="${SW * 4}" height="${SH * 4}" role="img" aria-label="La course : ton bonhomme, les obstacles et les gourdes"></canvas>
      ${g.over ? `<div class="arc-over"><p class="arc-big">Aïe ! ${fmt(m)} m</p><p class="muted">${g.bonus ? `dont ${fmt(g.bonus)} en gourdes · ` : ''}${m > 0 && m >= best ? 'nouveau record' : `record : ${fmt(best)} m`}</p>
          <button class="btn primary" data-act="arc-play" data-id="sprint">Rejouer</button></div>`
      : spPaused ? '<div class="arc-over"><p class="arc-big">En pause</p><button class="btn primary" data-act="sp-resume">Reprendre</button></div>'
      : `<p class="hint center">${g.started ? 'Touche l’écran pour sauter. Une gourde attrapée : +10.' : 'Touche l’écran pour partir, puis pour sauter par-dessus le matériel.'}</p>`}
    </section>`;
  }

  // Le matériel sur la piste : haltères, disque debout, kettlebell, banc.
  function spObstacle(c, o) {
    const y = GROUND;
    const plate = (px, h, w = 2.4) => {
      c.fillStyle = '#56505f';
      roundRect(c, px, y - h, w, h, 0.8);
      c.fill();
      c.fillStyle = 'rgba(220,154,112,0.85)';
      c.fillRect(px, y - h, w, 0.6);
    };
    const dumbbell = (x0) => {
      c.fillStyle = '#9aa0b4';
      c.fillRect(x0 + 2.4, y - 3.6, 4.2, 1.2);
      plate(x0, 6);
      plate(x0 + 6.6, 6);
    };
    if (o.kind === 'haltere' || o.kind === 'double') {
      dumbbell(o.x);
      if (o.kind === 'double') dumbbell(o.x + 10);
    } else if (o.kind === 'disque') {
      plate(o.x, o.h, o.w);
      c.fillStyle = '#9aa0b4';
      c.beginPath();
      c.arc(o.x + o.w / 2, y - o.h / 2, 0.8, 0, Math.PI * 2);
      c.fill();
    } else if (o.kind === 'kettle') {
      c.strokeStyle = '#6a6474';
      c.lineWidth = 1.3;
      c.beginPath();
      c.arc(o.x + 3.5, y - 6.4, 2.2, Math.PI, 0);
      c.stroke();
      c.fillStyle = '#6a6474';
      c.beginPath();
      c.arc(o.x + 3.5, y - 3.3, 3.4, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = 'rgba(220,154,112,0.75)';
      c.fillRect(o.x + 1.6, y - 4.8, 3.8, 0.6);
    } else {
      c.fillStyle = '#a8794a';
      roundRect(c, o.x, y - o.h, o.w, 2.4, 0.8);
      c.fill();
      c.fillStyle = '#56505f';
      c.fillRect(o.x + 1.6, y - o.h + 2.2, 1.4, o.h - 2.2);
      c.fillRect(o.x + o.w - 3, y - o.h + 2.2, 1.4, o.h - 2.2);
    }
  }

  // Ton bonhomme : il court (bras et jambes en balancier), se groupe en l'air.
  function spRunner(c, g) {
    const x = RUNNER_X;
    const foot = GROUND - g.y;
    const air = g.y > 0.4;
    const s = air ? 0 : Math.sin(g.dist * 0.24);
    const hip = [x, foot - 7];
    const sh = [x + 1.4, foot - 12];
    const limb = (a, b, d, w) => {
      c.lineWidth = w;
      c.beginPath();
      c.moveTo(a[0], a[1]);
      c.lineTo(b[0], b[1]);
      c.lineTo(d[0], d[1]);
      c.stroke();
    };
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.strokeStyle = '#f2f0ff';
    if (air) {
      limb(hip, [x + 3.4, foot - 4.6], [x + 1.2, foot - 1.6], 2.3);
      limb(hip, [x - 1.6, foot - 3.8], [x - 4.2, foot - 2.6], 2.3);
    } else {
      limb(hip, [x + 2.6 * s, foot - 3.6], [x + 3.4 * s - 0.6, foot - Math.max(0, s) * 1.6], 2.3);
      limb(hip, [x - 2.6 * s, foot - 3.6], [x - 3.4 * s - 0.6, foot - Math.max(0, -s) * 1.6], 2.3);
    }
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(hip[0], hip[1]);
    c.lineTo(sh[0], sh[1]);
    c.stroke();
    const arm = air ? 1 : s;
    limb(sh, [x + 1.4 - 2.4 * arm, foot - 9.2], [x + 2.6 - 2.6 * arm, foot - 7.4], 1.9);
    limb(sh, [x + 1.4 + 2.4 * arm, foot - 9.2], [x + 3 + 2.2 * arm, foot - 8], 1.9);
    c.fillStyle = '#f2f0ff';
    c.beginPath();
    c.arc(x + 2, foot - 14.4, 2.3, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#dc9a70'; // le short
    c.lineWidth = 3.2;
    c.beginPath();
    c.moveTo(hip[0] + 0.2, hip[1] - 1.2);
    c.lineTo(hip[0], hip[1] + 0.6);
    c.stroke();
  }

  function spDraw() {
    const cv = document.getElementById('sp-canvas');
    if (!cv || !sp) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round((cv.clientWidth || 360) * dpr);
    if (cv.width !== w) { cv.width = w; cv.height = Math.round((w * SH) / SW); }
    const c = cv.getContext('2d');
    if (!c) return;
    const k = cv.width / SW;
    c.setTransform(k, 0, 0, k, 0, 0);
    // le mur de la salle : fenêtres de nuit et affiches qui défilent plus lentement (profondeur)
    const wall = c.createLinearGradient(0, 0, 0, GROUND);
    wall.addColorStop(0, '#15100e');
    wall.addColorStop(1, '#261c17');
    c.fillStyle = wall;
    c.fillRect(0, 0, SW, GROUND);
    const par = (sp.dist * 0.3) % 70;
    for (let x = -par; x < SW + 70; x += 70) {
      c.fillStyle = '#0d1426';
      roundRect(c, x + 8, 9, 30, 24, 2);
      c.fill();
      c.strokeStyle = '#3a2a20';
      c.lineWidth = 1.2;
      c.stroke();
      c.fillStyle = 'rgba(255,240,200,0.5)';
      c.fillRect(x + 28, 14, 1.2, 1.2);
      c.fillRect(x + 15, 19, 0.9, 0.9);
      c.fillStyle = 'rgba(220,154,112,0.16)';
      roundRect(c, x + 48, 13, 12, 16, 1);
      c.fill();
    }
    c.fillStyle = 'rgba(242,195,163,0.6)'; // la bande LED au pied du mur
    c.fillRect(0, GROUND - 2.4, SW, 0.7);
    // le sol : un parquet qui défile
    c.fillStyle = '#3b2a1f';
    c.fillRect(0, GROUND, SW, SH - GROUND);
    c.strokeStyle = 'rgba(0,0,0,0.35)';
    c.lineWidth = 0.5;
    const pl = sp.dist % 16;
    for (let x = -pl; x < SW + 8; x += 16) {
      c.beginPath();
      c.moveTo(x, GROUND + 0.5);
      c.lineTo(x - 7, SH);
      c.stroke();
    }
    // les gourdes à attraper
    for (const it of sp.items) {
      if (it.taken) continue;
      const y = GROUND - it.y - 7;
      c.fillStyle = 'rgba(90,180,255,0.25)';
      c.beginPath();
      c.arc(it.x + 2.5, y + 3.5, 5, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#5ab4ff';
      roundRect(c, it.x, y + 1.6, 5, 5.4, 1.2);
      c.fill();
      c.fillStyle = '#e8f4ff';
      c.fillRect(it.x + 1.4, y, 2.2, 1.8);
    }
    for (const o of sp.obstacles) spObstacle(c, o);
    spRunner(c, sp);
  }

  function startSprint() {
    cancelAnimationFrame(spRaf);
    sp = newSprint(seed());
    SP().plays += 1;
    spPaused = false;
    mode = 'sprint';
  }

  function spRun() {
    cancelAnimationFrame(spRaf);
    spLast = 0;
    spRaf = requestAnimationFrame(spLoop);
  }

  // Une image : la course avance ; un choc, et c'est fini.
  function spLoop(t) {
    if (mode !== 'sprint' || !sp || !sp.started || sp.over) return;
    if (location.hash !== '#jeux' || document.hidden) { spPaused = true; return; }
    const dt = spLast ? Math.min(50, t - spLast) : 16;
    spLast = t;
    const before = sprintScore(sp);
    sp = stepSprint(sp, dt);
    const m = sprintScore(sp);
    if (m !== before) {
      const sc = document.getElementById('sp-score');
      if (sc) sc.textContent = `${fmt(m)} m`;
    }
    if (sp.over) {
      const s = SP();
      const rec = m > s.best;
      s.best = Math.max(s.best, m);
      navigator.vibrate?.(60);
      ctx.save();
      ctx.render();
      if (rec) ctx.celebrate(`Nouveau record au Sprint : ${fmt(m)} m`);
      return;
    }
    spDraw();
    spRaf = requestAnimationFrame(spLoop);
  }

  // Toucher la piste : partir, puis sauter.
  function sprintDown(e) {
    if (!e.target.closest?.('.sp-wrap') || e.target.closest('button') || mode !== 'sprint' || !sp || sp.over || spPaused) return false;
    e.preventDefault();
    const first = !sp.started;
    sp = jumpSprint(sp);
    if (first) {
      ctx.render();
      spRun();
    }
    return true;
  }

  // ---------- Pixels cachés ----------
  function pixelsView() {
    const px = PX();
    const g = px.cur;
    const p = PUZZLES.find((x) => x.id === g.id);
    const cl = clues(p);
    const ok = linesOk(g);
    const n = g.n;
    const cols = cl.cols.map((cc, k) => `<div class="px-cc${ok.cols[k] ? ' ok' : ''}">${cc.map((v) => `<b>${v}</b>`).join('')}</div>`).join('');
    const rows = Array.from({ length: n }, (_, r) => `<div class="px-rc${ok.rows[r] ? ' ok' : ''}">${cl.rows[r].map((v) => `<b>${v}</b>`).join('')}</div>`
      + g.grid.slice(r * n, r * n + n).map((v, j) => `<i class="px-c v${v}${j % 5 === 4 && j < n - 1 ? ' bx' : ''}${r % 5 === 4 && r < n - 1 ? ' by' : ''}" data-i="${r * n + j}"></i>`).join('')).join('');
    return `<section class="arcade px-wrap">
      <div class="arc-top"><button class="btn small" data-act="arc-menu">‹ Arcade</button>
        <div class="arc-score"><b>${n} × ${n}</b><small>${px.done.length} / ${PUZZLES.length} dessins trouvés</small></div></div>
      <div class="px-board s${n}${g.done ? ' done' : ''}" id="px-board" style="--n:${n};--pc:${p.color}" role="img" aria-label="Grille de ${n} cases sur ${n}${g.done ? ` : ${p.name}` : ''}"><div class="px-corner"></div>${cols}${rows}</div>
      ${g.done ? `<div class="arc-over"><p class="arc-big">${p.name} !</p><p class="muted">Trouvé en ${g.moves} coups</p>
          <button class="btn primary" data-act="arc-play" data-id="pixels" data-n="${n}">Dessin suivant</button></div>`
      : `<div class="px-tools"><button class="seg${pxCross ? '' : ' on'}" data-act="px-mode" data-v="fill" aria-pressed="${!pxCross}"><span class="px-sw fill"></span>Noircir</button><button class="seg${pxCross ? ' on' : ''}" data-act="px-mode" data-v="cross" aria-pressed="${pxCross}"><span class="px-sw cross"></span>Croix</button><button class="btn small" data-act="px-reset">Recommencer</button></div>
        <p class="hint center">Chaque chiffre : des cases noires à la suite, dans l’ordre, avec au moins un trou entre deux suites. Glisse le doigt pour en faire plusieurs. Une croix : une case que tu sais vide.</p>`}
    </section>`;
  }

  function startPixels(n) {
    const px = PX();
    if (!n && px.cur && !px.cur.done) { mode = 'pixels'; return; } // reprendre
    const size = SIZES.includes(Number(n)) ? Number(n) : 5;
    const list = PUZZLES.filter((p) => sizeOf(p) === size);
    const next = list.find((p) => !px.done.includes(p.id)) ?? list[Math.floor(Math.random() * list.length)];
    px.cur = newPixels(next.id);
    px.plays += 1;
    mode = 'pixels';
  }

  // Le doigt sur la grille : noircit (ou croise, ou efface) la case, et
  // toutes celles où il glisse ; les chiffres se mettent à jour quand il se lève.
  function pixelsDown(e) {
    const cell = e.target.closest?.('#px-board .px-c');
    const px = PX();
    if (!cell || mode !== 'pixels' || !px.cur || px.cur.done) return false;
    e.preventDefault();
    const board = document.getElementById('px-board');
    const start = Number(cell.dataset.i);
    const from = px.cur.grid[start];
    const value = pxCross ? (from === 2 ? 0 : 2) : from === 1 ? 0 : 1;
    const touched = new Set();
    const apply = (i) => {
      if (touched.has(i) || !px.cur || px.cur.done) return;
      touched.add(i);
      // en glissant : on n'efface que ce qu'on effaçait, on ne recouvre que du vide
      if (i !== start && px.cur.grid[i] !== (value === 0 ? from : 0)) return;
      px.cur = paint(px.cur, i, value);
      const el = board?.querySelector(`[data-i="${i}"]`);
      if (el) el.className = el.className.replace(/\bv\d\b/, `v${px.cur.grid[i]}`);
    };
    apply(start);
    const id = e.pointerId;
    const move = (ev) => {
      if (ev.pointerId !== id) return;
      const el = document.elementFromPoint(ev.clientX, ev.clientY)?.closest?.('#px-board .px-c');
      if (el) apply(Number(el.dataset.i));
    };
    const up = (ev) => {
      if (ev.pointerId !== id) return;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      if (px.cur?.done && !px.done.includes(px.cur.id)) {
        px.done = [...px.done, px.cur.id];
        ctx.save();
        ctx.render();
        ctx.celebrate(`Pixels cachés : ${PUZZLES.find((x) => x.id === px.cur.id).name} trouvé !`);
        return;
      }
      ctx.save();
      ctx.render();
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return true;
  }

  function startBricks() {
    cancelAnimationFrame(brRaf);
    br = newBricks(1);
    BR().plays += 1;
    brPaused = false;
    sparks = [];
    mode = 'briques';
    ctx.save();
  }

  function brRun() {
    cancelAnimationFrame(brRaf);
    brLast = 0;
    brRaf = requestAnimationFrame(brLoop);
  }

  // Une image : la balle avance, les briques cassées lâchent des éclats.
  function brLoop(t) {
    if (mode !== 'briques' || !br || !br.served) return;
    if (location.hash !== '#jeux' || document.hidden) { brPaused = true; return; }
    const dt = brLast ? Math.min(50, t - brLast) : 16;
    brLast = t;
    const before = br;
    br = stepBricks(br, dt);
    if (!ctx.reduceMotion()) {
      br.bricks.forEach((b, i) => {
        if (before.bricks[i].hp > 0 && b.hp === 0) {
          for (let k = 0; k < 7; k++) sparks.push({ x: b.x + b.w / 2, y: b.y + b.h / 2, vx: (Math.random() - 0.5) * 0.08, vy: (Math.random() - 0.5) * 0.08, life: 420, color: PIECE_COLORS[b.color] });
        }
      });
    }
    sparks = sparks.filter((p) => (p.life -= dt) > 0).map((p) => ({ ...p, x: p.x + p.vx * dt, y: p.y + p.vy * dt }));
    if (br.score !== before.score) {
      const sc = document.getElementById('br-score');
      if (sc) sc.textContent = fmt(br.score);
    }
    if (br.lives !== before.lives || br.over || br.cleared) {
      const brk = BR();
      if (br.over || br.cleared) {
        const rec = br.score > brk.best;
        brk.best = Math.max(brk.best, br.score);
        brk.level = Math.max(brk.level, br.cleared ? br.level : br.level - 1);
        ctx.save();
        ctx.render();
        if (rec && br.over) ctx.celebrate(`Nouveau record au Casse-briques : ${fmt(br.score)}`);
        else if (br.cleared) ctx.celebrate(`Casse-briques : niveau ${br.level} nettoyé`);
        return;
      }
      navigator.vibrate?.(40);
      ctx.render(); // une vie de moins : la balle revient sur la raquette
      return;
    }
    brDraw();
    brRaf = requestAnimationFrame(brLoop);
  }

  // Le doigt sur le terrain : lance la balle, puis la raquette le suit.
  function bricksDown(e) {
    const cv = e.target.closest?.('#br-canvas');
    if (!cv || mode !== 'briques' || !br || br.over || br.cleared) return false;
    e.preventDefault();
    const id = e.pointerId;
    const toX = (ev) => {
      const r = cv.getBoundingClientRect();
      return ((ev.clientX - r.left) / r.width) * BW;
    };
    br = movePaddle(br, toX(e));
    if (!br.served) {
      br = serve(br);
      brPaused = false;
      ctx.render();
      brRun();
    }
    const move = (ev) => {
      if (ev.pointerId !== id || !br) return;
      br = movePaddle(br, toX(ev));
      if (!br.served) brDraw();
    };
    const up = (ev) => {
      if (ev.pointerId !== id) return;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return true;
  }

  // ---------- Taquin ----------
  function taquinView() {
    const tq = TQ();
    const g = tq.cur;
    const tiles = g.tiles.map((v, i) => (v
      ? `<button class="tq-tile${v === i + 1 ? ' ok' : ''}" data-act="tq-slide" data-i="${i}" aria-label="Case ${v}">${v}</button>`
      : '<span class="tq-tile empty" aria-hidden="true"></span>')).join('');
    return `<section class="arcade tq-wrap">
      <div class="arc-top"><button class="btn small" data-act="arc-menu">‹ Arcade</button>
        <div class="arc-score"><b>${g.moves}</b><small>${g.n} × ${g.n} · coups${tq.best[g.n] ? ` · record ${tq.best[g.n]}` : ''}</small></div></div>
      <div class="tq-grid" style="--n:${g.n}">${tiles}</div>
      ${g.done ? `<div class="arc-over"><p class="arc-big">Rangé en ${g.moves} coups</p>
          <div class="row">${[3, 4].map((n) => `<button class="btn${n === g.n ? ' primary' : ''}" data-act="arc-play" data-id="taquin" data-n="${n}">Encore en ${n} × ${n}</button>`).join('')}</div></div>`
      : '<p class="hint center">Touche une case sur la même ligne ou colonne que la case vide : elle glisse (et celles entre les deux aussi). Range de 1 à la fin.</p>'}
    </section>`;
  }

  function startTaquin(n) {
    const tq = TQ();
    if (n || !tq.cur || tq.cur.done) {
      tq.cur = newTaquin(seed(), Number(n) === 4 ? 4 : n ? 3 : tq.cur?.n ?? 3);
      tq.plays += 1;
    }
    mode = 'taquin';
  }

  // ---------- Écho ----------
  function echoView() {
    const g = echo;
    const best = EC().best;
    const pads = Array.from({ length: ECHO_PADS }, (_, p) => `<button class="ec-pad ec${p}" data-act="ec-press" data-p="${p}" aria-label="Touche ${ECHO_NAMES[p]}"${ecPhase !== 'play' || g.over ? ' disabled' : ''}><i></i></button>`).join('');
    return `<section class="arcade ec-wrap">
      <div class="arc-top"><button class="btn small" data-act="arc-menu">‹ Arcade</button>
        <div class="arc-score"><b>${g.score}</b><small>Record ${fmt(Math.max(best, g.score))}</small></div></div>
      <p class="ec-status" aria-live="polite">${g.over ? 'Raté !' : ecPhase === 'play' ? `À toi : ${g.seq.length - g.step} touche${g.seq.length - g.step > 1 ? 's' : ''}` : 'Regarde bien…'}</p>
      <div class="ec-pads">${pads}</div>
      ${g.over ? `<div class="arc-over"><p class="arc-big">Suite de ${g.score}</p><p class="muted">${g.score > 0 && g.score >= best ? 'Nouveau record' : `Record : ${best}`}</p>
          <button class="btn primary" data-act="arc-play" data-id="echo">Rejouer</button></div>`
      : '<p class="hint center">Les touches s’allument dans un ordre : refais la même suite. À chaque tour, une de plus.</p>'}
    </section>`;
  }

  const ecLight = (p, on) => document.querySelector(`.ec-pad[data-p="${p}"]`)?.classList.toggle('lit', on);
  const ecClear = () => { ecTimers.forEach(clearTimeout); ecTimers = []; };

  // La démonstration : chaque touche de la suite s'allume à son tour.
  function ecShow() {
    ecClear();
    ecPhase = 'show';
    ctx.render();
    const d = echoDelay(echo.seq.length);
    echo.seq.forEach((p, k) => {
      ecTimers.push(setTimeout(() => ecLight(p, true), 500 + k * (d + 160)));
      ecTimers.push(setTimeout(() => ecLight(p, false), 500 + k * (d + 160) + d));
    });
    ecTimers.push(setTimeout(() => {
      if (mode !== 'echo' || !echo || echo.over) return;
      ecPhase = 'play';
      ctx.render();
    }, 500 + echo.seq.length * (d + 160)));
  }

  function startEcho() {
    echo = newEcho(seed());
    EC().plays += 1;
    mode = 'echo';
    ctx.save();
  }

  // ---------- Calcul éclair ----------
  const left = () => Math.max(0, calcEnd - Date.now());
  function calcView() {
    const c = C();
    const over = left() <= 0;
    const unit = EURO.has(calc.q.kind) ? ' €' : '';
    const record = calc.score > 0 && calc.score >= c.best;
    return `<section class="arcade cc">
      <div class="arc-top"><button class="btn small" data-act="arc-menu">‹ Arcade</button>
        <div class="arc-score"><b>${fmt(calc.score)}</b><small>Record ${fmt(Math.max(c.best, calc.score))}</small></div></div>
      <div class="cc-time" aria-hidden="true"><span id="cc-bar" style="width:${(left() / (CALC_TIME * 10)).toFixed(1)}%"></span></div>
      ${over ? `<div class="arc-over"><p class="arc-big">Temps écoulé</p><p class="muted">${fmt(calc.score)} points · ${calc.ok}/${calc.done} justes · série ${calc.best}${record ? ' · nouveau record' : ''}</p>
        <button class="btn primary" data-act="arc-play" data-id="calc">Rejouer</button></div>`
    : `<p class="cc-q${flash ? ` ${flash}` : ''}">${calc.q.text} ?</p>
      <div class="cc-opts">${calc.q.options.map((o) => `<button class="cc-opt" data-act="calc-answer" data-v="${o}">${fmt(o)}${unit}</button>`).join('')}</div>
      <p class="hint center">Série ${calc.streak} · niveau ${calc.level + 1}</p>`}
    </section>`;
  }

  function startCalc() {
    calc = newCalc(seed());
    calcEnd = Date.now() + CALC_TIME * 1000;
    flash = '';
    C().plays += 1;
    ctx.save();
    mode = 'calc';
    clearInterval(timer);
    timer = setInterval(() => {
      if (mode !== 'calc' || location.hash !== '#jeux') { clearInterval(timer); return; }
      const bar = document.getElementById('cc-bar');
      if (bar) bar.style.width = `${(left() / (CALC_TIME * 10)).toFixed(1)}%`;
      if (left() <= 0) {
        clearInterval(timer);
        finishCalc();
      }
    }, 200);
  }

  function finishCalc() {
    const c = C();
    const rec = calc.score > c.best;
    c.best = Math.max(c.best, calc.score);
    c.streak = Math.max(c.streak, calc.best);
    ctx.save();
    ctx.render();
    if (rec) ctx.celebrate(`Nouveau record au Calcul éclair : ${fmt(c.best)}`);
  }

  const actions = {
    ...chess.actions,
    'arc-play'(el) {
      if (el.dataset.id === 'calc') startCalc();
      else if (el.dataset.id === 'cristaux') startGems(Boolean(el.dataset.new));
      else if (el.dataset.id === 'sudoku') startSudoku(el.dataset.lv);
      else if (el.dataset.id === 'serpent') startSnake();
      else if (el.dataset.id === 'paires') startPairs();
      else if (el.dataset.id === 'code') startCode(Boolean(el.dataset.new));
      else if (el.dataset.id === 'briques') startBricks();
      else if (el.dataset.id === 'sprint') startSprint();
      else if (el.dataset.id === 'pixels') startPixels(el.dataset.n);
      else if (el.dataset.id === 'echecs') { mode = 'echecs'; chess.enter(); }
      else if (el.dataset.id === 'taquin') startTaquin(el.dataset.n);
      else if (el.dataset.id === 'echo') { startEcho(); ctx.render(); window.scrollTo(0, 0); ecShow(); return; }
      else startBlocs(Boolean(el.dataset.new));
      ctx.save();
      ctx.render();
      window.scrollTo(0, 0);
    },
    'arc-menu'() {
      chess.leave();
      cancelAnimationFrame(brRaf);
      cancelAnimationFrame(spRaf);
      ecClear();
      clearInterval(timer);
      clearTimeout(snTimer);
      clearTimeout(prTimer);
      mode = 'menu';
      ctx.render();
    },
    gem(el) {
      const game = G().cur;
      if (mode !== 'cristaux' || !game || gemAnim || game.won || game.over || Date.now() - gemTap < 400) return;
      const i = Number(el.dataset.i);
      if (gemSel !== null && gemSel !== i && adjacent(gemSel, i)) { playGem(gemSel, i); return; }
      gemSel = gemSel === i ? null : i;
      ctx.render();
    },
    'gem-next'() {
      const g = G();
      g.cur = newGems(seed(), g.level);
      g.plays += 1;
      gemSel = null;
      ctx.save();
      ctx.render();
    },
    'sd-cell'(el) {
      if (mode !== 'sudoku') return;
      const i = Number(el.dataset.i);
      sdSel = sdSel === i ? null : i;
      ctx.render();
    },
    'sd-num'(el) {
      const game = S().cur;
      if (mode !== 'sudoku' || sdSel === null || game.done || game.puzzle[sdSel] !== '0') return;
      const d = Number(el.dataset.n);
      const i = sdSel;
      if (sdNotesMode) sdTouch((g) => sdNote(g, i, d));
      else {
        if (d !== Number(game.solution[i]) && Number(game.grid[i]) !== d) navigator.vibrate?.(30);
        sdTouch((g) => sdPlace(g, i, d));
      }
    },
    'sd-erase'() {
      if (mode !== 'sudoku' || sdSel === null) return;
      const i = sdSel;
      sdTouch((g) => (g.grid[i] !== '0' ? sdPlace(g, i, 0) : { ...g, notes: g.notes.map((n, k) => (k === i ? 0 : n)) }));
    },
    'sn-dir'(el) {
      if (mode !== 'serpent' || !snake) return;
      snake = turnSnake(snake, el.dataset.d);
    },
    'sn-resume'() {
      if (mode !== 'serpent' || !snake || snake.over) return;
      snPaused = false;
      ctx.render();
      clearTimeout(snTimer);
      snTimer = setTimeout(snTick, 500);
    },
    'pr-flip'(el) {
      const pr = PR();
      if (mode !== 'paires' || !pr.cur || pr.cur.done) return;
      clearTimeout(prTimer);
      const before = pr.cur;
      pr.cur = flipCard(before, Number(el.dataset.i));
      if (pr.cur === before) return;
      const g = pr.cur;
      if (g.done) {
        const rec = !pr.best[g.level] || g.moves < pr.best[g.level];
        if (rec) pr.best[g.level] = g.moves;
        pr.top = Math.max(pr.top, g.level);
        pr.level = Math.max(pr.level, g.level + 1);
        ctx.save();
        ctx.render();
        ctx.celebrate(`Paires : niveau ${g.level} en ${g.moves} coups ${'★'.repeat(pairsStars(g))}`);
        return;
      }
      ctx.save();
      ctx.render();
      if (g.open.length === 2) prTimer = setTimeout(() => { pr.cur = hidePairs(pr.cur); if (mode === 'paires') ctx.render(); }, 850);
    },
    'pr-next'() {
      startPairs(PR().level);
      ctx.save();
      ctx.render();
    },
    'br-next'() {
      if (mode !== 'briques' || !br?.cleared) return;
      br = nextBricks(br);
      sparks = [];
      ctx.render();
    },
    'sp-resume'() {
      if (mode !== 'sprint' || !sp || sp.over) return;
      spPaused = false;
      ctx.render();
      if (sp.started) spRun();
    },
    'px-mode'(el) {
      pxCross = el.dataset.v === 'cross';
      ctx.render();
    },
    'px-reset'() {
      const px = PX();
      if (mode !== 'pixels' || !px.cur || px.cur.done) return;
      px.cur = newPixels(px.cur.id);
      ctx.save();
      ctx.render();
    },
    'br-resume'() {
      if (mode !== 'briques' || !br || br.over) return;
      brPaused = false;
      ctx.render();
      if (br.served) brRun();
    },
    'tq-slide'(el) {
      const tq = TQ();
      if (mode !== 'taquin' || !tq.cur || tq.cur.done) return;
      const before = tq.cur;
      tq.cur = slide(before, Number(el.dataset.i));
      if (tq.cur === before) return;
      if (tq.cur.done) {
        const n = tq.cur.n;
        const rec = !tq.best[n] || tq.cur.moves < tq.best[n];
        if (rec) tq.best[n] = tq.cur.moves;
        ctx.save();
        ctx.render();
        ctx.celebrate(`Taquin ${n} × ${n} rangé en ${tq.cur.moves} coups${rec ? ' · record' : ''}`);
        return;
      }
      ctx.save();
      ctx.render();
    },
    'ec-press'(el) {
      if (mode !== 'echo' || !echo || echo.over || ecPhase !== 'play') return;
      const p = Number(el.dataset.p);
      ecLight(p, true);
      ecTimers.push(setTimeout(() => ecLight(p, false), 180));
      const res = pressEcho(echo, p);
      echo = res.game;
      if (echo.over) {
        const ec = EC();
        const rec = echo.score > ec.best;
        ec.best = Math.max(ec.best, echo.score);
        navigator.vibrate?.(60);
        ctx.save();
        ctx.render();
        if (rec) ctx.celebrate(`Nouveau record à Écho : une suite de ${echo.score}`);
        return;
      }
      if (res.round) {
        ecPhase = 'show';
        ecTimers.push(setTimeout(ecShow, 450));
      }
      const status = document.querySelector('.ec-status');
      if (status) status.textContent = res.round ? 'Bien ! Une de plus…' : `À toi : ${echo.seq.length - echo.step} touche${echo.seq.length - echo.step > 1 ? 's' : ''}`;
      const sc = document.querySelector('.ec-wrap .arc-score b');
      if (sc) sc.textContent = echo.score;
    },
    'code-color'(el) {
      if (mode !== 'code' || codeDraft.length >= CODE_LEN) return;
      codeDraft = [...codeDraft, Number(el.dataset.c)];
      ctx.render();
    },
    'code-del'(el) {
      if (mode !== 'code') return;
      const j = el.dataset.j === undefined ? codeDraft.length - 1 : Number(el.dataset.j);
      codeDraft = codeDraft.filter((_, k) => k !== j);
      ctx.render();
    },
    'code-ok'() {
      const cd = CD();
      if (mode !== 'code' || codeDraft.length !== CODE_LEN) return;
      cd.cur = playGuess(cd.cur, codeDraft);
      codeDraft = [];
      if (cd.cur.won) {
        cd.wins += 1;
        const rec = !cd.best || cd.cur.guesses.length < cd.best;
        if (rec) cd.best = cd.cur.guesses.length;
        ctx.save();
        ctx.render();
        ctx.celebrate(`Code trouvé en ${cd.cur.guesses.length} essai${cd.cur.guesses.length > 1 ? 's' : ''}${rec ? ' · record' : ''}`);
        return;
      }
      ctx.save();
      ctx.render();
    },
    'sd-notes'() {
      sdNotesMode = !sdNotesMode;
      ctx.render();
    },
    'calc-answer'(el) {
      if (mode !== 'calc' || left() <= 0) return;
      const res = answerCalc(calc, Number(el.dataset.v));
      calc = res.game;
      flash = ctx.reduceMotion() ? '' : res.right ? 'ok' : 'ko';
      if (!res.right) navigator.vibrate?.(30);
      ctx.render();
    },
  };

  return {
    // ouvre un jeu sans passer par le menu (raccourci de l'icône) : pour l'instant, les échecs
    open(id) {
      if (id !== 'echecs') return;
      mode = 'echecs';
      chess.enter();
    },
    view() {
      if (mode === 'blocs' && B().cur) return blocsView();
      if (mode === 'calc' && calc) return calcView();
      if (mode === 'cristaux' && G().cur) return gemsView();
      if (mode === 'sudoku' && S().cur) return sudokuView();
      if (mode === 'serpent' && snake) return snakeView();
      if (mode === 'paires' && PR().cur) return pairsView();
      if (mode === 'code' && CD().cur) return codeView();
      if (mode === 'briques' && br) return bricksView();
      if (mode === 'taquin' && TQ().cur) return taquinView();
      if (mode === 'echo' && echo) return echoView();
      if (mode === 'sprint' && sp) return sprintView();
      if (mode === 'pixels' && PX().cur) return pixelsView();
      if (mode === 'echecs') return chess.view();
      mode = 'menu';
      return menuView();
    },
    actions,
    pointerDown,
    // les flèches du clavier dirigent le serpent
    keyDown(e) {
      // sprint : espace ou flèche du haut pour sauter
      if (mode === 'sprint' && sp && !sp.over && !spPaused && location.hash === '#jeux' && [' ', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        const first = !sp.started;
        sp = jumpSprint(sp);
        if (first) { ctx.render(); spRun(); }
        return;
      }
      // casse-briques : flèches gauche et droite, espace pour lancer
      if (mode === 'briques' && br && !br.over && !br.cleared && location.hash === '#jeux' && ['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
        if (e.key === ' ') { if (!br.served) { br = serve(br); ctx.render(); brRun(); } return; }
        br = movePaddle(br, br.paddle + (e.key === 'ArrowLeft' ? -6 : 6));
        if (!br.served) brDraw();
        return;
      }
      const d = { ArrowUp: 'haut', ArrowDown: 'bas', ArrowLeft: 'gauche', ArrowRight: 'droite' }[e.key];
      if (!d || mode !== 'serpent' || !snake || snake.over || location.hash !== '#jeux') return;
      e.preventDefault();
      snake = turnSnake(snake, d);
    },
  };
}
