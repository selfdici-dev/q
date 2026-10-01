// Onglet Argent : parcours de leçons, calculatrices, journal de trades simulés.
import { UNITS, ALL_LESSONS, RESOURCES } from './finance-data.js';
import { compound, positionSize, tradeStats, tradeR, XP } from './logic.js';

const eur = (v) => v.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const num = (v, d = 2) => Number(v).toLocaleString('fr-FR', { maximumFractionDigits: d });
const TRADES_TO_GO_LIVE = 30;

export function createMoney(ctx) {
  const { esc } = ctx;
  const quiz = {}; // réponses en cours : { [index]: choix }

  const isUnlocked = (i) => i === 0 || Boolean(ctx.state.lessons[ALL_LESSONS[i - 1].id]);

  function pathView() {
    const done = Object.keys(ctx.state.lessons).length;
    let idx = 0;
    const currentIdx = ALL_LESSONS.findIndex((l, i) => isUnlocked(i) && !ctx.state.lessons[l.id]);
    return `
    <section class="card money-hero">
      <div class="card-head"><h2>Ton parcours finance</h2><span class="pill">${done}/${ALL_LESSONS.length} leçons</span></div>
      <div class="bar"><span style="width:${(done / ALL_LESSONS.length) * 100}%"></span></div>
      <p class="hint">Une leçon ≈ 10 min : une idée, un exemple, un exercice réel, un quiz. 2 bonnes réponses sur 3 pour valider. +${XP.lesson} XP, +${XP.perfect} si tu fais un sans-faute.</p>
      ${currentIdx >= 0 ? `<button class="btn primary wide" data-act="lesson-open" data-id="${ALL_LESSONS[currentIdx].id}">Continuer : ${esc(ALL_LESSONS[currentIdx].title)}</button>` : '<p><strong>Parcours terminé.</strong> Refais les quiz quand tu veux, et passe au journal de trades.</p>'}
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
    const answered = Object.keys(quiz).length === l.quiz.length;
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

  function toolsView() {
    const c = ctx.state.calc;
    const cp = compound(c.monthly, c.rate, c.years, c.initial);
    const ps = positionSize(c.capital, c.risk, c.entry, c.stop);
    const gainShare = cp.value > 0 ? Math.max(0, cp.gains / cp.value) : 0;
    return `
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
      <p class="hint">Simulation à taux constant. En réalité, il y aura des années à −30 % : seule la moyenne sur longue période ressemble à ce chiffre. Hors frais et impôts.</p>
    </section>
    <section class="card">
      <div class="card-head"><h2>🎯 Taille de position</h2></div>
      <div class="grid2">
        <label>Capital de trading (€)<input type="number" inputmode="decimal" data-calc="capital" value="${c.capital}"></label>
        <label>Risque par trade (%)<input type="number" step="0.25" inputmode="decimal" data-calc="risk" value="${c.risk}"></label>
        <label>Prix d’entrée<input type="number" step="0.01" inputmode="decimal" data-calc="entry" value="${c.entry}"></label>
        <label>Stop<input type="number" step="0.01" inputmode="decimal" data-calc="stop" value="${c.stop}"></label>
      </div>
      ${ps ? `<div class="result">
        <div><span class="lbl">Quantité</span><span class="big">${num(ps.shares, 3)}</span></div>
        <p>Risque maximum : <strong>${eur(ps.risk)}</strong> (${num(ps.perShare)} par action) · Position : ${num(ps.exposure)} (${num(ps.exposurePct, 0)} % du capital)</p>
        ${ps.exposurePct > 100 ? '<p class="warn-text">La position dépasse ton capital : ton stop est trop serré, ou ce trade n’est pas pour ce capital.</p>' : ''}
      </div>` : '<p class="hint">Remplis les 4 champs.</p>'}
      <p class="hint">Prix et stop dans la même devise (dollars pour Micron). La perte réelle peut dépasser le risque prévu en cas de gap.</p>
    </section>`;
  }

  function journalView() {
    const trades = ctx.state.trades;
    const s = tradeStats(trades);
    const open = trades.map((t, i) => ({ t, i })).filter(({ t }) => t.exit === undefined || t.exit === null);
    const closed = trades.map((t, i) => ({ t, i })).filter(({ t }) => tradeR(t) !== null).reverse();
    const ready = s.count >= TRADES_TO_GO_LIVE && s.expectancy > 0 && s.followed >= 0.9;
    return `
    <section class="card">
      <div class="card-head"><h2>🧪 Simulation avant le réel</h2><span class="pill">${s.count}/${TRADES_TO_GO_LIVE} trades</span></div>
      <div class="bar"><span style="width:${Math.min(100, (s.count / TRADES_TO_GO_LIVE) * 100)}%"></span></div>
      <div class="kpis">
        <div><span class="lbl">Espérance</span><span class="kpi">${s.count ? `${s.expectancy >= 0 ? '+' : ''}${num(s.expectancy)}R` : '—'}</span></div>
        <div><span class="lbl">Gagnants</span><span class="kpi">${s.count ? `${num(s.winRate * 100, 0)} %` : '—'}</span></div>
        <div><span class="lbl">Plan respecté</span><span class="kpi">${s.count ? `${num(s.followed * 100, 0)} %` : '—'}</span></div>
        <div><span class="lbl">Résultat virtuel</span><span class="kpi">${s.count ? num(s.pnl) : '—'}</span></div>
      </div>
      <p class="hint">${ready ? '<strong>Les 3 conditions sont remplies.</strong> Tu peux passer au réel avec un petit capital, en gardant exactement les mêmes règles.' : `Passage au réel quand : ${TRADES_TO_GO_LIVE} trades simulés, espérance positive, plan respecté sur au moins 90 % des trades. Prix réels, argent fictif.`}</p>
    </section>
    <section class="card">
      <div class="card-head"><h2>Nouveau trade simulé</h2></div>
      <div class="grid2">
        <label>Titre<input id="tr-ticker" placeholder="MU" autocapitalize="characters"></label>
        <label>Sens<select id="tr-side"><option value="long">Achat (long)</option><option value="short">Vente (short)</option></select></label>
        <label>Entrée<input id="tr-entry" type="number" step="0.01" inputmode="decimal"></label>
        <label>Stop<input id="tr-stop" type="number" step="0.01" inputmode="decimal"></label>
        <label>Objectif<input id="tr-target" type="number" step="0.01" inputmode="decimal"></label>
        <label>Quantité<input id="tr-qty" type="number" step="0.001" inputmode="decimal"></label>
      </div>
      <label>Thèse : pourquoi ce trade, en une phrase<textarea id="tr-thesis" rows="2" placeholder="Ex. : rebond sur un support hebdomadaire, résultats dans 5 semaines"></textarea></label>
      <div class="row"><button class="btn primary" data-act="trade-open">Ouvrir le trade</button></div>
      <p class="hint">Écris le stop et l’objectif AVANT d’entrer. Utilise la calculatrice « Taille de position » pour la quantité.</p>
    </section>
    ${open.length ? `<section class="card"><div class="card-head"><h2>En cours</h2><span class="pill">${open.length}</span></div>
      ${open.map(({ t, i }) => `<div class="trade">
        <div><strong>${esc(t.ticker)}</strong> · ${t.side === 'short' ? 'short' : 'long'} ${num(t.qty, 3)} à ${num(t.entry)} · stop ${num(t.stop)}${t.target ? ` · objectif ${num(t.target)}` : ''}
          <br><span class="muted">${esc(t.thesis)}</span></div>
        <div class="grid2"><label>Prix de sortie<input type="number" step="0.01" inputmode="decimal" id="exit-${i}"></label>
          <label class="check"><input type="checkbox" id="followed-${i}" checked> Plan respecté</label></div>
        <div class="row"><button class="btn" data-act="trade-close" data-i="${i}">Clôturer</button><button class="btn ghost small" data-act="trade-del" data-i="${i}">Supprimer</button></div>
      </div>`).join('')}</section>` : ''}
    ${closed.length ? `<section class="card"><div class="card-head"><h2>Historique</h2></div>
      <div class="table-wrap"><table class="tests"><thead><tr><th>Titre</th><th>Entrée</th><th>Sortie</th><th>R</th><th>Plan</th></tr></thead><tbody>
      ${closed.map(({ t }) => {
        const r = tradeR(t);
        return `<tr><td>${esc(t.ticker)}</td><td>${num(t.entry)}</td><td>${num(t.exit)}</td><td class="${r > 0 ? 'pos' : 'neg'}">${r > 0 ? '+' : ''}${num(r)}R</td><td>${t.followed ? '✓' : '✗'}</td></tr>`;
      }).join('')}</tbody></table></div></section>` : ''}`;
  }

  function resourcesView() {
    return `<section class="card"><div class="card-head"><h2>📚 Sources fiables</h2></div>
      <ul class="res">${RESOURCES.map((r) => `<li><a href="${r.url}" target="_blank" rel="noopener">${esc(r.name)}</a><br><span class="muted">${esc(r.why)}</span></li>`).join('')}</ul>
      <p class="hint">Méfie-toi de tout ce qui promet un rendement élevé sans risque, des « signaux » payants et des comptes Telegram. Vérifie toujours un site sur la liste noire de l’AMF.</p></section>`;
  }

  const SUBTABS = [['parcours', 'Parcours'], ['outils', 'Calculs'], ['journal', 'Journal'], ['sources', 'Sources']];

  function view() {
    const ui = ctx.state.ui;
    if (ui.lesson) return lessonView(ui.lesson);
    const sub = ui.moneyTab ?? 'parcours';
    const body = { parcours: pathView, outils: toolsView, journal: journalView, sources: resourcesView }[sub]();
    return `<nav class="subtabs">${SUBTABS.map(([id, label]) => `<button class="${sub === id ? 'on' : ''}" data-act="money-tab" data-id="${id}">${label}</button>`).join('')}</nav>${body}`;
  }

  const $ = (s) => document.querySelector(s);

  const actions = {
    'money-tab'(el) {
      ctx.state.ui.moneyTab = el.dataset.id;
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
    'trade-open'() {
      const v = (id) => $(`#tr-${id}`).value.trim();
      const t = {
        ticker: v('ticker').toUpperCase(),
        side: v('side'),
        entry: Number(v('entry')),
        stop: Number(v('stop')),
        target: v('target') ? Number(v('target')) : null,
        qty: Number(v('qty')),
        thesis: v('thesis'),
        opened: new Date().toISOString(),
      };
      if (!t.ticker || !t.entry || !t.stop || !t.qty) return ctx.toast('Titre, entrée, stop et quantité sont obligatoires.');
      if (!t.thesis) return ctx.toast('Écris ta thèse : pas de trade sans raison.');
      if ((t.side === 'long' && t.stop >= t.entry) || (t.side === 'short' && t.stop <= t.entry)) return ctx.toast('Le stop doit être du côté de la perte.');
      ctx.state.trades.push(t);
      ctx.save();
      ctx.render();
      ctx.toast('Trade simulé ouvert. Note le prix réel du marché pour le clôturer.');
    },
    'trade-close'(el) {
      const i = Number(el.dataset.i);
      const exit = Number($(`#exit-${i}`).value);
      if (!exit) return ctx.toast('Indique le prix de sortie.');
      const t = ctx.state.trades[i];
      t.exit = exit;
      t.followed = $(`#followed-${i}`).checked;
      t.closed = new Date().toISOString();
      ctx.save();
      ctx.render();
      const r = tradeR(t);
      ctx.toast(`Trade clôturé : ${r > 0 ? '+' : ''}${num(r)}R · +${XP.trade} XP${t.followed ? '' : ' · plan non respecté : note pourquoi dans ton bilan'}`);
    },
    'trade-del'(el) {
      if (!confirm('Supprimer ce trade ?')) return;
      ctx.state.trades.splice(Number(el.dataset.i), 1);
      ctx.save();
      ctx.render();
    },
  };

  function onChange(el) {
    if (el.dataset.calc === undefined) return false;
    ctx.state.calc[el.dataset.calc] = Number(el.value) || 0;
    ctx.save();
    ctx.render();
    return true;
  }

  return { view, actions, onChange };
}

export const DEFAULT_CALC = { initial: 500, monthly: 50, rate: 7, years: 20, capital: 300, risk: 1, entry: 100, stop: 92 };
