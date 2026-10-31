// La borne d'arcade de la Salle : l'écran des jeux (#jeux) et leurs parties.
// Les règles sont dans games.js (testées) ; ici l'affichage, le doigt et les
// records (state.games). Pas de son ; les animations se coupent si le
// téléphone demande de les réduire.
import { SIZE, SHAPES, newBlocks, placeBlock, canPlace, CALC_TIME, newCalc, answerCalc } from './games.js';

const fmt = (n) => Number(n).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
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
  let drag = null;
  const games = () => (ctx.state.games ??= {});
  const B = () => (games().blocs ??= { best: 0, plays: 0, lines: 0, cur: null });
  const C = () => (games().calc ??= { best: 0, plays: 0, streak: 0 });

  // ---------- menu ----------
  function menuView() {
    const b = B();
    const c = C();
    const going = b.cur && !b.cur.over;
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
    mode = 'blocs';
  }

  function dropPiece(i, r, c) {
    const b = B();
    const res = placeBlock(b.cur, i, r, c);
    if (!res) return false;
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
      mode = 'menu';
      return menuView();
    },
    actions,
    pointerDown,
  };
}
