// La borne d'arcade de la Salle : l'écran des jeux (#jeux) et leurs parties.
// Les règles sont dans games.js, gems.js et sudoku.js (testées) ; ici
// l'affichage, le doigt et les records (state.games). Pas de son ; les
// animations se coupent si le téléphone demande de les réduire.
import { SIZE, SHAPES, newBlocks, placeBlock, canPlace, CALC_TIME, newCalc, answerCalc } from './games.js';
import { GEM_SIZE, colorOf, isBolt, adjacent, findMove, newGems, playSwap } from './gems.js';
import { PEERS, newSudoku, sdPlace, sdNote, sdCounts } from './sudoku.js';

const fmt = (n) => Number(n).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
const GEM_NAMES = ['', 'vert', 'bleu', 'orange', 'violet', 'or'];
const SD_NAMES = { facile: 'Facile', moyen: 'Moyen', difficile: 'Difficile' };
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
  let mode = 'menu'; // 'menu' | 'blocs' | 'calc'
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
  // Cristaux : le cristal choisi, l'animation en cours (grille montrée, cases
  // qui éclatent, qui tombent), les deux qui refusent de s'échanger
  let gemSel = null;
  let gemAnim = null;
  let gemShake = [];
  let gemTap = 0; // un glissé vient de jouer : on ignore le clic qui suit
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
    const going = b.cur && !b.cur.over;
    const gemGoing = g.cur && !g.cur.won && !g.cur.over;
    const sdGoing = sd.cur && !sd.cur.done;
    const solved = Object.values(sd.solved).reduce((a, n) => a + n, 0);
    return `<section class="card arc-card">
      <div class="arc-art bl-art" aria-hidden="true">${[3, 1, 5, 2].map((k) => `<i class="c${k}"></i>`).join('')}</div>
      <div><h2>Blocs</h2><p class="muted">Pose les pièces sur la grille : une ligne ou une colonne pleine disparaît. Tant qu’il reste de la place, ça continue.</p>
        <p class="arc-best">Record <b>${fmt(b.best)}</b> · ${fmt(b.lines)} lignes effacées en tout</p></div>
      <button class="btn primary wide" data-act="arc-play" data-id="blocs">${going ? `Reprendre (${fmt(b.cur.score)} points)` : 'Jouer'}</button>
    </section>
    <section class="card arc-card">
      <div class="arc-art cc-art" aria-hidden="true"><b>25 %</b><b>× 7</b><b>−30 %</b></div>
      <div><h2>Calcul éclair</h2><p class="muted">60 secondes de calcul utile : soldes, pourcentages, intérêts, prix à l’unité. Plus tu enchaînes, plus ça monte.</p>
        <p class="arc-best">Record <b>${fmt(c.best)}</b> · meilleure série ${fmt(c.streak)}</p></div>
      <button class="btn primary wide" data-act="arc-play" data-id="calc">Jouer</button>
    </section>
    <section class="card arc-card">
      <div class="arc-art gm-art" aria-hidden="true">${[2, 5, 1, 4].map((k) => `<span class="gm c${k}"><i></i></span>`).join('')}</div>
      <div><h2>Cristaux</h2><p class="muted">Échange deux cristaux voisins pour en aligner trois. Une ligne de quatre laisse un éclair qui fait tout sauter. Un score à battre par niveau.</p>
        <p class="arc-best">Niveau <b>${g.level}</b> · record ${fmt(g.best)} points</p></div>
      <button class="btn primary wide" data-act="arc-play" data-id="cristaux">${gemGoing ? `Reprendre le niveau ${g.cur.level}` : `Jouer le niveau ${g.level}`}</button>
    </section>
    <section class="card arc-card">
      <div class="arc-art sd-art" aria-hidden="true">${['5', '', '3', '', '7', '', '1', '', '9'].map((d) => `<i>${d}</i>`).join('')}</div>
      <div><h2>Sudoku</h2><p class="muted">Remplis la grille : chaque ligne, colonne et carré contient une fois chaque chiffre de 1 à 9. Des notes pour réfléchir, à ton rythme.</p>
        <p class="arc-best"><b>${fmt(solved)}</b> grille${solved > 1 ? 's' : ''} résolue${solved > 1 ? 's' : ''}${sd.best.difficile ? ` · difficile en ${minutes(sd.best.difficile)}` : ''}</p></div>
      ${sdGoing ? `<button class="btn primary wide" data-act="arc-play" data-id="sudoku">Reprendre (${SD_NAMES[sd.cur.level].toLowerCase()})</button>` : ''}
      <div class="sd-levels">${Object.entries(SD_NAMES).map(([lv, name]) => `<button class="btn${sdGoing ? '' : ' primary'}" data-act="arc-play" data-id="sudoku" data-lv="${lv}">${name}</button>`).join('')}</div>
    </section>
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
    if (gemDown(e)) return;
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
    'arc-play'(el) {
      if (el.dataset.id === 'calc') startCalc();
      else if (el.dataset.id === 'cristaux') startGems(Boolean(el.dataset.new));
      else if (el.dataset.id === 'sudoku') startSudoku(el.dataset.lv);
      else startBlocs(Boolean(el.dataset.new));
      ctx.save();
      ctx.render();
      window.scrollTo(0, 0);
    },
    'arc-menu'() {
      clearInterval(timer);
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
    view() {
      if (mode === 'blocs' && B().cur) return blocsView();
      if (mode === 'calc' && calc) return calcView();
      if (mode === 'cristaux' && G().cur) return gemsView();
      if (mode === 'sudoku' && S().cur) return sudokuView();
      mode = 'menu';
      return menuView();
    },
    actions,
    pointerDown,
  };
}
