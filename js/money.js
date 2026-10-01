// Onglet Argent : parcours de leçons, patrimoine, trading (journal, règles,
// checklist), calculatrices, actualité et sources.
import { UNITS, ALL_LESSONS, RESOURCES, TRADING_RULES, PRE_TRADE_CHECKS, NEWS_ROUTINE } from './finance-data.js';
import {
  compound, positionSize, tradeStats, tradeR, rewardRisk, equityCurve, lossesToday, allocation, XP,
} from './logic.js';

const eur = (v) => Number(v || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const num = (v, d = 2) => Number(v).toLocaleString('fr-FR', { maximumFractionDigits: d });
const TRADES_TO_SCALE = 30;
const MAX_OPEN = 3;

export const DEFAULT_CALC = { initial: 500, monthly: 50, rate: 7, years: 20, capital: 270, risk: 1, entry: 100, stop: 92, atr: 4, atrMult: 2 };

export const DEFAULT_WEALTH = {
  tradingCapital: 270,
  riskPct: 1.5,
  pockets: [
    { id: 'precaution', name: 'Précaution', amount: 0, hint: 'Livret A ou espèces rémunérées. Cible : 500 €.' },
    { id: 'pea', name: 'PEA long terme', amount: 848, hint: 'ETF monde (CW8) + émergents. On n’y touche pas.' },
    { id: 'trading', name: 'Poche trading', amount: 0, hint: 'Maximum 10 % tant que tu n’as pas 30 trades notés.' },
    { id: 'actions', name: 'Actions individuelles', amount: 164, hint: 'Micron et autres lignes longues.' },
  ],
  snapshots: [],
};

// Couleurs catégorielles validées (ordre fixe) pour la barre de répartition.
const POCKET_COLORS = ['var(--cat-1)', 'var(--cat-2)', 'var(--cat-3)', 'var(--cat-4)'];

export function createMoney(ctx) {
  const { esc } = ctx;
  const quiz = {}; // réponses en cours : { [index]: choix }
  const W = () => ctx.state.wealth;
  const isUnlocked = (i) => i === 0 || Boolean(ctx.state.lessons[ALL_LESSONS[i - 1].id]);
  const isOpen = (t) => t.exit === undefined || t.exit === null;

  // ---------- Parcours ----------
  function pathView() {
    const done = Object.keys(ctx.state.lessons).filter((id) => ALL_LESSONS.some((l) => l.id === id)).length;
    let idx = 0;
    const currentIdx = ALL_LESSONS.findIndex((l, i) => isUnlocked(i) && !ctx.state.lessons[l.id]);
    return `
    <section class="card money-hero">
      <div class="card-head"><h2>Ton parcours finance</h2><span class="pill">${done}/${ALL_LESSONS.length} leçons</span></div>
      <div class="bar"><span style="width:${(done / ALL_LESSONS.length) * 100}%"></span></div>
      <p class="hint">Une leçon ≈ 10 min : une idée, un exemple, un exercice réel, un quiz. 2 bonnes réponses sur 3 pour valider. +${XP.lesson} XP, +${XP.perfect} si tu fais un sans-faute.</p>
      ${currentIdx >= 0 ? `<button class="btn primary wide" data-act="lesson-open" data-id="${ALL_LESSONS[currentIdx].id}">Continuer : ${esc(ALL_LESSONS[currentIdx].title)}</button>` : '<p><strong>Parcours terminé.</strong> Refais les quiz quand tu veux et concentre-toi sur ton journal.</p>'}
    </section>
    ${UNITS.map((u) => `
      <section class="unit">
        <h3 class="unit-title"><span>${u.emoji}</span>${esc(u.title)}</h3>
        <ol class="path">${u.lessons.map((l) => {
          const i = idx++;
          const st = ctx.state.lessons[l.id];
          const cls = st ? 'done' : i === currentIdx ? 'current' : isUnlocked(i) ? 'open' : 'locked';
          return `<li class="node ${cls}" style="--off:${[0, 1, 2, 1][i % 4]}">
            <button data-act="lesson-open" data-id="${l.id}" ${cls === 'locked' ? 'disabled' : ''} aria-label="${esc(l.title)}">
              <span class="node-dot">${st ? (st.perfect ? '★' : '✓') : cls === 'locked' ? '🔒' : i + 1}</span>
            </button>
            <span class="node-label">${esc(l.title)}</span></li>`;
        }).join('')}</ol>
      </section>`).join('')}`;
  }

  function lessonView(id) {
    const i = ALL_LESSONS.findIndex((l) => l.id === id);
    const l = ALL_LESSONS[i];
    const st = ctx.state.lessons[id];
    const answered = l.quiz.every((_, qi) => quiz[qi] !== undefined);
    const checked = quiz.checked;
    return `
    <div class="lesson">
      <div class="row"><button class="btn ghost small" data-act="lesson-close">← Parcours</button><span class="pill">Leçon ${i + 1}/${ALL_LESSONS.length}</span></div>
      <h2 class="lesson-title">${esc(l.title)}</h2>
      <section class="card step"><h3>💡 L’idée</h3><p>${esc(l.idea)}</p></section>
      <section class="card step"><h3>📌 Exemple</h3><p>${esc(l.example)}</p></section>
      <section class="card step"><h3>🛠️ Exercice réel</h3><p>${esc(l.exercise)}</p></section>
      <section class="card step"><h3>✅ Vérification</h3>
        ${l.quiz.map((q, qi) => `
          <div class="q"><p><strong>${qi + 1}. ${esc(q.q)}</strong></p>
            <div class="answers">${q.a.map((a, ai) => {
              let cls = quiz[qi] === ai ? 'picked' : '';
              if (checked) cls = ai === q.c ? 'right' : quiz[qi] === ai ? 'wrong' : '';
              return `<button class="answer ${cls}" data-act="quiz-pick" data-q="${qi}" data-a="${ai}" ${checked ? 'disabled' : ''}>${esc(a)}</button>`;
            }).join('')}</div>
            ${checked ? `<p class="hint">${esc(q.why)}</p>` : ''}
          </div>`).join('')}
        ${checked
          ? `<div class="row"><button class="btn" data-act="quiz-retry">Recommencer le quiz</button>${i + 1 < ALL_LESSONS.length && ctx.state.lessons[id] ? `<button class="btn primary" data-act="lesson-open" data-id="${ALL_LESSONS[i + 1].id}">Leçon suivante →</button>` : '<button class="btn primary" data-act="lesson-close">Retour au parcours</button>'}</div>`
          : `<div class="row"><button class="btn primary wide" data-act="quiz-check" ${answered ? '' : 'disabled'}>Vérifier</button></div>`}
        ${st ? `<p class="hint">Validée le ${new Date(st.date).toLocaleDateString('fr-FR')} · meilleur score ${st.score}/${l.quiz.length}</p>` : ''}
      </section>
    </div>`;
  }

  // ---------- Patrimoine ----------
  function wealthView() {
    const w = W();
    const a = allocation(w.pockets);
    const by = Object.fromEntries(a.parts.map((p) => [p.id, p]));
    const closedCount = tradeStats(ctx.state.trades.filter((t) => t.real)).count;
    const alerts = [];
    if ((by.precaution?.amount ?? 0) < 500) alerts.push('Précaution sous 500 € : c’est la première poche à remplir.');
    if ((by.actions?.pct ?? 0) > 25) alerts.push(`Actions individuelles à ${num(by.actions.pct, 0)} % du total : au-dessus de 25 %, une seule chute pèse lourd.`);
    if ((by.trading?.pct ?? 0) > 10 && closedCount < TRADES_TO_SCALE) alerts.push(`Poche trading à ${num(by.trading.pct, 0)} % alors que tu as ${closedCount} trade(s) réel(s) noté(s) : la règle est 10 % maximum avant ${TRADES_TO_SCALE}.`);
    const snaps = w.snapshots.slice(-6);
    return `
    <section class="card">
      <div class="card-head"><h2>💼 Mon patrimoine</h2><span class="pill">${eur(a.total)}</span></div>
      <div class="stack" role="img" aria-label="Répartition du patrimoine">${a.parts.map((p, i) => (p.pct > 0 ? `<span style="flex:${p.pct};background:${POCKET_COLORS[i]}"></span>` : '')).join('')}</div>
      <ul class="pockets">${a.parts.map((p, i) => `
        <li><i style="background:${POCKET_COLORS[i]}"></i>
          <div><strong>${esc(p.name)}</strong> <span class="muted">${num(p.pct, 0)} %</span><br><span class="hint">${esc(p.hint)}</span></div>
          <input type="number" inputmode="decimal" step="1" data-pocket="${i}" value="${p.amount}" aria-label="Montant ${esc(p.name)}"></li>`).join('')}</ul>
      ${alerts.length ? `<div class="alerts">${alerts.map((x) => `<p>⚠️ ${esc(x)}</p>`).join('')}</div>` : '<p class="ok-text">✓ Répartition saine.</p>'}
      <div class="row"><button class="btn" data-act="wealth-snapshot">Enregistrer le relevé du mois</button></div>
      ${snaps.length ? `<p class="hint">Relevés : ${snaps.map((s) => `${new Date(s.date).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })} ${eur(s.total)}`).join(' · ')}</p>` : '<p class="hint">Mets tes montants à jour une fois par mois, puis enregistre le relevé pour suivre l’évolution.</p>'}
    </section>
    <section class="card">
      <div class="card-head"><h2>🧭 L’ordre des priorités</h2></div>
      <ol class="tight">
        <li><strong>Précaution</strong> : 3 mois de dépenses (≈ 500 €), disponible à tout moment.</li>
        <li><strong>PEA en pilote automatique</strong> : virement le jour de la paie, ETF monde.</li>
        <li><strong>Trading</strong> : 10 % maximum, qui grossit avec ta compétence prouvée (30 trades notés, espérance positive, plan respecté à 90 %).</li>
        <li><strong>Actions individuelles</strong> : moins de 25 % du total.</li>
      </ol>
    </section>`;
  }

  // ---------- Trading ----------
  function sparkline(values) {
    if (values.length < 2) return '<p class="hint">La courbe apparaît après 2 trades clôturés.</p>';
    const w = 320;
    const h = 90;
    const lo = Math.min(0, ...values);
    const hi = Math.max(0, ...values);
    const x = (i) => 8 + (i / (values.length - 1)) * (w - 16);
    const y = (v) => 8 + (1 - (v - lo) / (hi - lo || 1)) * (h - 16);
    const pts = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
    const last = values.at(-1);
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" role="img" aria-label="Courbe des résultats cumulés : ${num(last)}R">
      <line x1="8" x2="${w - 8}" y1="${y(0)}" y2="${y(0)}" class="zero"/>
      <polyline points="${pts}" class="${last >= 0 ? 'up' : 'down'}"/>
      <circle cx="${x(values.length - 1)}" cy="${y(last)}" r="4" class="${last >= 0 ? 'up' : 'down'}"/></svg>
      <p class="hint">Résultat cumulé : <strong>${last >= 0 ? '+' : ''}${num(last)}R</strong> sur ${values.length} trades.</p>`;
  }

  function statsBlock(trades, label) {
    const s = tradeStats(trades);
    return `<div class="kpis">
      <div><span class="lbl">Espérance ${label}</span><span class="kpi ${s.expectancy > 0 ? 'pos' : s.expectancy < 0 ? 'neg' : ''}">${s.count ? `${s.expectancy >= 0 ? '+' : ''}${num(s.expectancy)}R` : '—'}</span></div>
      <div><span class="lbl">Gagnants</span><span class="kpi">${s.count ? `${num(s.winRate * 100, 0)} %` : '—'}</span></div>
      <div><span class="lbl">Plan respecté</span><span class="kpi">${s.count ? `${num(s.followed * 100, 0)} %` : '—'}</span></div>
      <div><span class="lbl">Trades clôturés</span><span class="kpi">${s.count}</span></div>
    </div>`;
  }

  function tradeText(t) {
    const rr = rewardRisk(t);
    return [
      `Titre : ${t.ticker}`,
      `Mode : ${t.real ? 'réel' : 'simulé'}`,
      `Sens : ${t.side === 'short' ? 'vente (short)' : 'achat'}`,
      `Setup : ${t.setup || '—'}`,
      `Thèse : ${t.thesis}`,
      `Entrée : ${t.entry}`,
      `Stop : ${t.stop}`,
      `Objectif : ${t.target ?? '—'}${rr ? ` (${num(rr, 1)}R)` : ''}`,
      `Quantité : ${t.qty}`,
      `Risque : ${num(Math.abs(t.entry - t.stop) * t.qty)} (devise du titre)`,
      `Prochains résultats de l’entreprise : ${t.earnings || 'non renseigné'}`,
      ...(isOpen(t) ? [] : [`Sortie : ${t.exit} (${num(tradeR(t))}R) · plan respecté : ${t.followed ? 'oui' : 'non'}`, `Leçon : ${t.lesson || '—'}`]),
    ].join('\n');
  }

  async function copy(text, okMsg) {
    try {
      await navigator.clipboard.writeText(text);
      ctx.toast(okMsg);
    } catch {
      ctx.state.ui.copyText = text;
      ctx.render();
    }
  }

  function tradingView() {
    const w = W();
    const trades = ctx.state.trades;
    const real = trades.filter((t) => t.real);
    const open = trades.map((t, i) => ({ t, i })).filter(({ t }) => isOpen(t));
    const closed = trades.map((t, i) => ({ t, i })).filter(({ t }) => !isOpen(t)).reverse();
    const pnlReal = real.filter((t) => !isOpen(t)).reduce((s, t) => s + (Number(t.pnlEur) || 0), 0);
    const pocket = w.tradingCapital + pnlReal;
    const drawdown = w.tradingCapital ? (pocket - w.tradingCapital) / w.tradingCapital : 0;
    const losses = lossesToday(trades, new Date().toISOString().slice(0, 10));
    const blocked = losses >= 2 ? 'Deux pertes d’affilée aujourd’hui : stop pour la journée.'
      : open.length >= MAX_OPEN ? `Déjà ${MAX_OPEN} positions ouvertes.`
      : drawdown <= -0.25 ? 'Poche à −25 % : pause d’un mois et retour en simulation.' : '';
    const setups = [...new Set(trades.map((t) => t.setup).filter(Boolean))];
    const copyBox = ctx.state.ui.copyText;
    return `
    ${copyBox ? `<section class="card"><div class="card-head"><h2>Texte à copier</h2><button class="btn ghost small" data-act="copy-close">Fermer</button></div><textarea rows="10" readonly onfocus="this.select()">${esc(copyBox)}</textarea></section>` : ''}
    <section class="card">
      <div class="card-head"><h2>⚔️ Poche trading</h2><span class="pill">${eur(pocket)}</span></div>
      <div class="grid2">
        <label>Capital de départ (€)<input type="number" inputmode="decimal" data-wealth="tradingCapital" value="${w.tradingCapital}"></label>
        <label>Risque par trade (%)<input type="number" step="0.25" inputmode="decimal" data-wealth="riskPct" value="${w.riskPct}"></label>
      </div>
      <p class="hint">Risque maximum par trade : <strong>${eur((pocket * w.riskPct) / 100)}</strong>. Résultat réel cumulé : ${pnlReal >= 0 ? '+' : ''}${eur(pnlReal)} (${num(drawdown * 100, 1)} %).</p>
      ${statsBlock(real, 'réelle')}
      ${sparkline(equityCurve(real.length ? real : trades))}
      <div class="bar"><span style="width:${Math.min(100, (tradeStats(real).count / TRADES_TO_SCALE) * 100)}%"></span></div>
      <p class="hint">${tradeStats(real).count}/${TRADES_TO_SCALE} trades réels avant de pouvoir passer la poche à 20 % (si espérance positive et plan respecté à 90 %).</p>
      <div class="row"><button class="btn" data-act="journal-copy">Copier mon journal pour Claude</button></div>
    </section>
    <section class="card">
      <div class="card-head"><h2>Nouveau trade</h2>${blocked ? '<span class="pill warn-pill">Bloqué</span>' : ''}</div>
      ${blocked ? `<div class="alerts"><p>⛔ ${esc(blocked)}</p></div>` : ''}
      <div class="seg-row">
        <label class="radio"><input type="radio" name="tr-mode" value="sim" checked> Simulé</label>
        <label class="radio"><input type="radio" name="tr-mode" value="real"> Réel</label>
      </div>
      <div class="grid2">
        <label>Titre<input id="tr-ticker" placeholder="MU" autocapitalize="characters"></label>
        <label>Sens<select id="tr-side"><option value="long">Achat (long)</option><option value="short">Vente (short)</option></select></label>
        <label>Entrée<input id="tr-entry" type="number" step="0.01" inputmode="decimal"></label>
        <label>Stop<input id="tr-stop" type="number" step="0.01" inputmode="decimal"></label>
        <label>Objectif<input id="tr-target" type="number" step="0.01" inputmode="decimal"></label>
        <label>Quantité<input id="tr-qty" type="number" step="0.001" inputmode="decimal"></label>
        <label>Setup (stratégie)<input id="tr-setup" list="setups" placeholder="Repli sur MM50"><datalist id="setups">${setups.map((x) => `<option value="${esc(x)}">`).join('')}</datalist></label>
        <label>Prochains résultats<input id="tr-earnings" type="date"></label>
      </div>
      <label>Thèse : pourquoi ce trade, en une phrase<textarea id="tr-thesis" rows="2" placeholder="Ex. : repli sur la moyenne 50 jours dans une tendance haussière"></textarea></label>
      <div id="tr-preview" class="result">${previewHTML()}</div>
      <fieldset class="checks"><legend>Avant d’entrer</legend>
        ${PRE_TRADE_CHECKS.map((c) => `<label class="check"><input type="checkbox" id="chk-${c.id}"> ${esc(c.label)}</label>`).join('')}
      </fieldset>
      <div class="row">
        <button class="btn primary" data-act="trade-open" ${blocked ? 'disabled' : ''}>Ouvrir le trade</button>
        <button class="btn" data-act="trade-copy-draft">Copier pour relecture par Claude</button>
      </div>
    </section>
    ${open.length ? `<section class="card"><div class="card-head"><h2>En cours</h2><span class="pill">${open.length}/${MAX_OPEN}</span></div>
      ${open.map(({ t, i }) => `<div class="trade">
        <div><span class="tag ${t.real ? 'real' : ''}">${t.real ? 'Réel' : 'Simulé'}</span> <strong>${esc(t.ticker)}</strong> · ${t.side === 'short' ? 'short' : 'long'} ${num(t.qty, 3)} à ${num(t.entry)} · stop ${num(t.stop)}${t.target ? ` · objectif ${num(t.target)}` : ''}${t.setup ? ` · ${esc(t.setup)}` : ''}
          <br><span class="muted">${esc(t.thesis)}</span></div>
        <div class="grid2"><label>Prix de sortie<input type="number" step="0.01" inputmode="decimal" id="exit-${i}"></label>
          ${t.real ? `<label>Résultat en € (frais compris)<input type="number" step="0.01" inputmode="decimal" id="pnl-${i}"></label>` : ''}
          <label class="check"><input type="checkbox" id="followed-${i}" checked> Plan respecté</label></div>
        <label>Ce que ce trade m’apprend<input id="lesson-${i}" placeholder="Une phrase"></label>
        <div class="row"><button class="btn" data-act="trade-close" data-i="${i}">Clôturer</button><button class="btn" data-act="trade-copy" data-i="${i}">Copier</button><button class="btn ghost small" data-act="trade-del" data-i="${i}">Supprimer</button></div>
      </div>`).join('')}</section>` : ''}
    ${closed.length ? `<section class="card"><div class="card-head"><h2>Historique</h2></div>
      <div class="table-wrap"><table class="tests"><thead><tr><th>Titre</th><th>Mode</th><th>Setup</th><th>R</th><th>Plan</th></tr></thead><tbody>
      ${closed.map(({ t }) => {
        const r = tradeR(t);
        return `<tr><td>${esc(t.ticker)}</td><td>${t.real ? 'Réel' : 'Simu'}</td><td>${esc(t.setup || '—')}</td><td class="${r > 0 ? 'pos' : 'neg'}">${r > 0 ? '+' : ''}${num(r)}R</td><td>${t.followed ? '✓' : '✗'}</td></tr>`;
      }).join('')}</tbody></table></div>
      ${setups.length > 1 ? `<p class="hint">Par setup : ${setups.map((x) => {
        const s = tradeStats(trades.filter((t) => t.setup === x));
        return `${esc(x)} ${s.count ? `${s.expectancy >= 0 ? '+' : ''}${num(s.expectancy)}R (${s.count})` : '—'}`;
      }).join(' · ')}</p>` : ''}
      ${trades.some((t) => !t.real && !isOpen(t)) ? statsBlock(trades.filter((t) => !t.real), 'simulée') : ''}</section>` : ''}
    <section class="card">
      <div class="card-head"><h2>📜 Mes règles</h2></div>
      <ol class="tight">${TRADING_RULES.map((r) => `<li>${esc(r)}</li>`).join('')}</ol>
    </section>`;
  }

  function readForm() {
    const v = (id) => (document.querySelector(`#tr-${id}`)?.value ?? '').trim();
    return {
      ticker: v('ticker').toUpperCase(),
      side: v('side') || 'long',
      entry: Number(v('entry')),
      stop: Number(v('stop')),
      target: v('target') ? Number(v('target')) : null,
      qty: Number(v('qty')),
      setup: v('setup'),
      earnings: v('earnings'),
      thesis: v('thesis'),
      real: document.querySelector('input[name="tr-mode"]:checked')?.value === 'real',
    };
  }

  function previewHTML() {
    const t = document.querySelector('#tr-entry') ? readForm() : null;
    const w = W();
    if (!t || !t.entry || !t.stop) return '<p class="hint">Remplis entrée et stop : le risque, la taille conseillée et le ratio gain/risque s’affichent ici.</p>';
    const per = Math.abs(t.entry - t.stop);
    const pnlReal = ctx.state.trades.filter((x) => x.real && !isOpen(x)).reduce((s, x) => s + (Number(x.pnlEur) || 0), 0);
    const maxRisk = ((w.tradingCapital + pnlReal) * w.riskPct) / 100;
    const ideal = per ? maxRisk / per : 0;
    const risk = per * (t.qty || 0);
    const rr = rewardRisk(t);
    const warn = [];
    if ((t.side === 'long' && t.stop >= t.entry) || (t.side === 'short' && t.stop <= t.entry)) warn.push('Le stop doit être du côté de la perte.');
    if (t.qty && risk > maxRisk * 1.05) warn.push(`Risque trop gros : ${num(risk)} pour ${num(maxRisk)} autorisés.`);
    if (rr !== null && rr < 2) warn.push(`Ratio gain/risque de ${num(rr, 1)} : vise au moins 2.`);
    if (t.earnings) {
      const days = Math.round((new Date(t.earnings) - new Date()) / 86400000);
      if (days >= 0 && days <= 2) warn.push('Résultats dans moins de 2 jours.');
    }
    return `<p>Risque par action : <strong>${num(per)}</strong> · Quantité conseillée : <strong>${num(ideal, 3)}</strong>${t.qty ? ` · Risque saisi : <strong>${num(risk)}</strong>` : ''}${rr !== null ? ` · Gain/risque : <strong>${num(rr, 1)}</strong>` : ''}</p>
      ${warn.length ? warn.map((x) => `<p class="warn-text">⚠️ ${esc(x)}</p>`).join('') : '<p class="ok-text">✓ Le trade respecte tes règles de risque.</p>'}
      <p class="hint">Calcul en devise du titre, en supposant 1 € ≈ 1 unité : pour un titre en dollars, garde une marge.</p>`;
  }

  // ---------- Calculs ----------
  function toolsView() {
    const c = ctx.state.calc;
    const cp = compound(c.monthly, c.rate, c.years, c.initial);
    const ps = positionSize(c.capital, c.risk, c.entry, c.stop);
    const gainShare = cp.value > 0 ? Math.max(0, cp.gains / cp.value) : 0;
    const atrStop = c.entry - c.atr * c.atrMult;
    const atrPs = positionSize(c.capital, c.risk, c.entry, atrStop);
    return `
    <section class="card">
      <div class="card-head"><h2>🎯 Taille de position</h2></div>
      <div class="grid2">
        <label>Capital (€)<input type="number" inputmode="decimal" data-calc="capital" value="${c.capital}"></label>
        <label>Risque par trade (%)<input type="number" step="0.25" inputmode="decimal" data-calc="risk" value="${c.risk}"></label>
        <label>Prix d’entrée<input type="number" step="0.01" inputmode="decimal" data-calc="entry" value="${c.entry}"></label>
        <label>Stop<input type="number" step="0.01" inputmode="decimal" data-calc="stop" value="${c.stop}"></label>
      </div>
      ${ps ? `<div class="result">
        <div><span class="lbl">Quantité</span><span class="big">${num(ps.shares, 3)}</span></div>
        <p>Risque maximum : <strong>${eur(ps.risk)}</strong> (${num(ps.perShare)} par action) · Position : ${num(ps.exposure)} (${num(ps.exposurePct, 0)} % du capital)</p>
        ${ps.exposurePct > 100 ? '<p class="warn-text">La position dépasse ton capital : ton stop est trop serré, ou ce trade n’est pas pour ce capital.</p>' : ''}
      </div>` : '<p class="hint">Remplis les 4 champs.</p>'}
    </section>
    <section class="card">
      <div class="card-head"><h2>🌊 Stop selon la volatilité (ATR)</h2></div>
      <div class="grid2">
        <label>ATR (14 jours)<input type="number" step="0.01" inputmode="decimal" data-calc="atr" value="${c.atr}"></label>
        <label>Multiple d’ATR<input type="number" step="0.5" inputmode="decimal" data-calc="atrMult" value="${c.atrMult}"></label>
      </div>
      <div class="result"><p>Stop à <strong>${num(atrStop)}</strong> pour une entrée à ${num(c.entry)}${atrPs ? ` · Quantité : <strong>${num(atrPs.shares, 3)}</strong> pour ${eur(atrPs.risk)} de risque` : ''}</p></div>
      <p class="hint">Plus le titre est volatil, plus le stop s’éloigne et plus la position rapetisse. Le risque en euros, lui, ne bouge pas. L’ATR se lit sur TradingView.</p>
    </section>
    <section class="card">
      <div class="card-head"><h2>📈 Intérêts composés</h2></div>
      <div class="grid2">
        <label>Départ (€)<input type="number" inputmode="decimal" data-calc="initial" value="${c.initial}"></label>
        <label>Par mois (€)<input type="number" inputmode="decimal" data-calc="monthly" value="${c.monthly}"></label>
        <label>Rendement annuel (%)<input type="number" step="0.5" inputmode="decimal" data-calc="rate" value="${c.rate}"></label>
        <label>Durée (ans)<input type="number" inputmode="numeric" data-calc="years" value="${c.years}"></label>
      </div>
      <div class="result">
        <div><span class="lbl">Valeur finale</span><span class="big">${eur(cp.value)}</span></div>
        <div class="split" role="img" aria-label="Versé ${eur(cp.invested)}, gains ${eur(cp.gains)}">
          <span class="split-a" style="flex:${1 - gainShare}"></span><span class="split-b" style="flex:${gainShare}"></span></div>
        <p class="legend-row"><span><i class="sw-a"></i>Versé : ${eur(cp.invested)}</span><span><i class="sw-b"></i>Gains : ${eur(cp.gains)}</span></p>
      </div>
      <p class="hint">Simulation à taux constant, hors frais et impôts. En réalité il y aura des années à −30 %.</p>
    </section>`;
  }

  // ---------- Actu et sources ----------
  function newsView() {
    return `<section class="card"><div class="card-head"><h2>📰 Ta routine d’actualité</h2></div>
      <ul class="res">${NEWS_ROUTINE.map((n) => `<li><strong>${esc(n.when)}</strong><br><span class="muted">${esc(n.what)}</span></li>`).join('')}</ul>
      <p class="hint">L’actu donne le contexte et le calendrier. Elle ne donne pas de trades : quand une info arrive jusqu’à toi, le prix l’intègre déjà.</p></section>
      <section class="card"><div class="card-head"><h2>📚 Sources fiables</h2></div>
      <ul class="res">${RESOURCES.map((r) => `<li><a href="${r.url}" target="_blank" rel="noopener">${esc(r.name)}</a><br><span class="muted">${esc(r.why)}</span></li>`).join('')}</ul>
      <p class="hint">Méfie-toi de tout ce qui promet un rendement élevé sans risque, des « signaux » payants et des comptes Telegram. Vérifie un site sur la liste noire de l’AMF.</p></section>`;
  }

  const SUBTABS = [['parcours', 'Cours'], ['patrimoine', 'Patrimoine'], ['trading', 'Trading'], ['outils', 'Calculs'], ['actu', 'Actu']];

  function view() {
    const ui = ctx.state.ui;
    if (ui.lesson) return lessonView(ui.lesson);
    const sub = SUBTABS.some(([id]) => id === ui.moneyTab) ? ui.moneyTab : 'parcours';
    const body = { parcours: pathView, patrimoine: wealthView, trading: tradingView, outils: toolsView, actu: newsView }[sub]();
    return `<nav class="subtabs five">${SUBTABS.map(([id, label]) => `<button class="${sub === id ? 'on' : ''}" data-act="money-tab" data-id="${id}">${label}</button>`).join('')}</nav>${body}`;
  }

  const $ = (s) => document.querySelector(s);

  const actions = {
    'money-tab'(el) {
      ctx.state.ui.moneyTab = el.dataset.id;
      ctx.state.ui.copyText = null;
      ctx.save();
      ctx.render();
    },
    'lesson-open'(el, e) {
      e?.preventDefault();
      for (const k of Object.keys(quiz)) delete quiz[k];
      ctx.state.ui.lesson = el.dataset.id;
      if (location.hash !== '#argent') location.hash = 'argent';
      ctx.render();
      window.scrollTo(0, 0);
    },
    'lesson-close'() {
      ctx.state.ui.lesson = null;
      ctx.render();
      window.scrollTo(0, 0);
    },
    'quiz-pick'(el) {
      quiz[el.dataset.q] = Number(el.dataset.a);
      ctx.render();
    },
    'quiz-retry'() {
      for (const k of Object.keys(quiz)) delete quiz[k];
      ctx.render();
    },
    'quiz-check'() {
      const l = ALL_LESSONS.find((x) => x.id === ctx.state.ui.lesson);
      const score = l.quiz.filter((q, i) => quiz[i] === q.c).length;
      quiz.checked = true;
      const prev = ctx.state.lessons[l.id];
      if (score >= 2) {
        const perfect = score === l.quiz.length;
        ctx.state.lessons[l.id] = {
          date: prev?.date ?? new Date().toISOString(),
          score: Math.max(score, prev?.score ?? 0),
          perfect: perfect || Boolean(prev?.perfect),
        };
        ctx.raiseHabit(ctx.todayKey(), 'apprendre', 1);
        ctx.save();
        ctx.render();
        if (!prev) ctx.celebrate(`Leçon validée · +${XP.lesson + (perfect ? XP.perfect : 0)} XP`);
        else ctx.toast(`${score}/${l.quiz.length}`);
      } else {
        ctx.render();
        ctx.toast(`${score}/${l.quiz.length} : relis l’idée et l’exemple, puis recommence.`);
      }
    },
    'wealth-snapshot'() {
      const total = allocation(W().pockets).total;
      const month = new Date().toISOString().slice(0, 7);
      W().snapshots = [...W().snapshots.filter((s) => s.date.slice(0, 7) !== month), { date: new Date().toISOString(), total }];
      ctx.save();
      ctx.render();
      ctx.toast(`Relevé enregistré : ${eur(total)}`);
    },
    'trade-open'() {
      const t = { ...readForm(), opened: new Date().toISOString() };
      if (!t.ticker || !t.entry || !t.stop || !t.qty) return ctx.toast('Titre, entrée, stop et quantité sont obligatoires.');
      if (!t.thesis) return ctx.toast('Écris ta thèse : pas de trade sans raison.');
      if ((t.side === 'long' && t.stop >= t.entry) || (t.side === 'short' && t.stop <= t.entry)) return ctx.toast('Le stop doit être du côté de la perte.');
      if (!PRE_TRADE_CHECKS.every((c) => $(`#chk-${c.id}`)?.checked)) return ctx.toast('Coche les 3 vérifications avant d’entrer.');
      ctx.state.trades.push(t);
      ctx.save();
      ctx.render();
      ctx.toast(t.real ? 'Trade réel ouvert. Pose ton stop chez le courtier MAINTENANT.' : 'Trade simulé ouvert. Note le prix réel pour le clôturer.');
    },
    'trade-copy-draft'() {
      const t = readForm();
      copy(`Peux-tu relire ce plan de trade avant que j’entre ?\n\n${tradeText(t)}`, 'Copié : colle-le dans ta conversation avec Claude.');
    },
    'trade-copy'(el) {
      copy(tradeText(ctx.state.trades[Number(el.dataset.i)]), 'Trade copié.');
    },
    'journal-copy'() {
      const s = tradeStats(ctx.state.trades);
      const lines = ctx.state.trades.slice(-20).map((t, i) => `#${i + 1}\n${tradeText(t)}`).join('\n\n');
      copy(`Voici mon journal de trading (20 derniers trades). Espérance globale ${num(s.expectancy)}R sur ${s.count} trades clôturés, plan respecté ${num(s.followed * 100, 0)} %. Peux-tu faire ma revue de la semaine ?\n\n${lines}`, 'Journal copié : colle-le dans ta conversation avec Claude.');
    },
    'copy-close'() {
      ctx.state.ui.copyText = null;
      ctx.render();
    },
    'trade-close'(el) {
      const i = Number(el.dataset.i);
      const exit = Number($(`#exit-${i}`).value);
      if (!exit) return ctx.toast('Indique le prix de sortie.');
      const t = ctx.state.trades[i];
      t.exit = exit;
      t.followed = $(`#followed-${i}`).checked;
      t.lesson = $(`#lesson-${i}`).value.trim();
      if (t.real) t.pnlEur = Number($(`#pnl-${i}`)?.value) || (t.exit - t.entry) * (t.side === 'short' ? -1 : 1) * t.qty;
      t.closed = new Date().toISOString();
      ctx.save();
      ctx.render();
      const r = tradeR(t);
      ctx.toast(`Trade clôturé : ${r > 0 ? '+' : ''}${num(r)}R · +${XP.trade} XP${t.followed ? '' : ' · plan non respecté : note pourquoi'}`);
    },
    'trade-del'(el) {
      if (!confirm('Supprimer ce trade ?')) return;
      ctx.state.trades.splice(Number(el.dataset.i), 1);
      ctx.save();
      ctx.render();
    },
  };

  function onChange(el) {
    if (el.dataset.calc !== undefined) {
      ctx.state.calc[el.dataset.calc] = Number(el.value) || 0;
    } else if (el.dataset.pocket !== undefined) {
      W().pockets[Number(el.dataset.pocket)].amount = Number(el.value) || 0;
    } else if (el.dataset.wealth !== undefined) {
      W()[el.dataset.wealth] = Number(el.value) || 0;
    } else {
      return false;
    }
    ctx.save();
    ctx.render();
    return true;
  }

  // Aperçu du trade mis à jour à la frappe, sans re-rendre la page (garde le focus).
  function onInput(el) {
    if (!el.id?.startsWith('tr-') && el.name !== 'tr-mode') return false;
    const p = $('#tr-preview');
    if (p) p.innerHTML = previewHTML();
    return true;
  }

  return { view, actions, onChange, onInput };
}
