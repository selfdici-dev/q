// Petits graphiques SVG sans dépendance, avec infobulle au survol / au toucher.
import { addDays, diffDays, fromKey } from './logic.js';

const W = 360;
const H = 190;
const M = { t: 16, r: 8, b: 24, l: 40 };

function shortDate(key) {
  const d = fromKey(key);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function scales(today, days, yMin, yMax) {
  const first = addDays(today, -(days - 1));
  const iw = W - M.l - M.r;
  const ih = H - M.t - M.b;
  const x = (key) => M.l + (days === 1 ? iw / 2 : (diffDays(first, key) / (days - 1)) * iw);
  const y = (v) => M.t + ih - ((v - yMin) / (yMax - yMin || 1)) * ih;
  return { first, x, y, iw, ih };
}

function niceTicks(min, max, count = 4) {
  const span = max - min || 1;
  const step0 = span / count;
  const mag = 10 ** Math.floor(Math.log10(step0));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= step0);
  const ticks = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

function frame(sc, ticks, fmt, today, days) {
  let s = '';
  for (const t of ticks) {
    const yy = sc.y(t);
    s += `<line class="grid" x1="${M.l}" x2="${W - M.r}" y1="${yy}" y2="${yy}"/>`;
    s += `<text class="axis" x="${M.l - 6}" y="${yy + 4}" text-anchor="end">${fmt(t)}</text>`;
  }
  const labels = [sc.first, addDays(sc.first, Math.floor((days - 1) / 2)), today];
  labels.forEach((k, i) => {
    const anchor = i === 0 ? 'start' : i === 2 ? 'end' : 'middle';
    s += `<text class="axis" x="${sc.x(k)}" y="${H - 8}" text-anchor="${anchor}">${shortDate(k)}</text>`;
  });
  return s;
}

function targetLine(sc, value, label) {
  if (value === null || value === undefined || value === '') return '';
  const yy = sc.y(value);
  return `<line class="target" x1="${M.l}" x2="${W - M.r}" y1="${yy}" y2="${yy}"/>` +
    `<text class="target-label" x="${W - M.r}" y="${yy - 5}" text-anchor="end">${label}</text>`;
}

function hitLayer(sc, today, days, tipFor) {
  const step = sc.iw / Math.max(days - 1, 1);
  let s = '';
  for (let i = 0; i < days; i++) {
    const k = addDays(sc.first, i);
    const tip = tipFor(k);
    if (!tip) continue;
    s += `<rect class="hit" x="${sc.x(k) - step / 2}" y="${M.t}" width="${step}" height="${sc.ih}" data-tip="${tip}" data-x="${sc.x(k)}"/>`;
  }
  return s;
}

export function wireTooltips(root) {
  root.querySelectorAll('.chart').forEach((wrap) => {
    const tip = wrap.querySelector('.tip');
    const cross = wrap.querySelector('.cross');
    const show = (e) => {
      const r = e.target.closest('.hit');
      if (!r) return;
      tip.textContent = r.dataset.tip;
      tip.hidden = false;
      const x = Number(r.dataset.x);
      cross.setAttribute('x1', x);
      cross.setAttribute('x2', x);
      cross.style.display = 'block';
      const pct = (x / W) * 100;
      tip.style.left = `${Math.min(Math.max(pct, 15), 85)}%`;
    };
    const hide = () => {
      tip.hidden = true;
      cross.style.display = 'none';
    };
    wrap.addEventListener('pointerover', show);
    wrap.addEventListener('pointerdown', show);
    wrap.addEventListener('pointerleave', hide);
  });
}

function wrap(svgInner, title, legend = '') {
  return `<figure class="chart"><figcaption>${title}${legend}</figcaption>` +
    `<div class="chart-box"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${title}">${svgInner}` +
    `<line class="cross" x1="0" x2="0" y1="${M.t}" y2="${H - M.b}" style="display:none"/></svg>` +
    `<div class="tip" hidden></div></div></figure>`;
}

// Ligne : points bruts (discrets) + ligne de tendance (moyenne) + cible.
export function lineChart({ title, points, trend, target, targetLabel, today, days, fmt, unit, empty }) {
  if (!points.length) return `<figure class="chart"><figcaption>${title}</figcaption><p class="muted">${empty}</p></figure>`;
  const vals = points.map((p) => p.value).concat(target ?? []);
  let lo = Math.min(...vals);
  let hi = Math.max(...vals);
  const pad = Math.max((hi - lo) * 0.15, 0.5);
  lo -= pad;
  hi += pad;
  const sc = scales(today, days, lo, hi);
  const ticks = niceTicks(lo, hi);
  let s = frame(sc, ticks, fmt, today, days);
  s += targetLine(sc, target, targetLabel);
  if (trend && trend.length > 1) {
    s += `<polyline class="trend" points="${trend.map((p) => `${sc.x(p.key)},${sc.y(p.value)}`).join(' ')}"/>`;
  }
  for (const p of points) s += `<circle class="dot${trend ? ' dot-raw' : ''}" cx="${sc.x(p.key)}" cy="${sc.y(p.value)}" r="3.5"/>`;
  const byKey = Object.fromEntries(points.map((p) => [p.key, p.value]));
  const trendBy = Object.fromEntries((trend || []).map((p) => [p.key, p.value]));
  s += hitLayer(sc, today, days, (k) => {
    if (byKey[k] === undefined) return null;
    let t = `${shortDate(k)} : ${fmt(byKey[k])}${unit}`;
    if (trendBy[k] !== undefined) t += ` · moyenne 7 j : ${fmt(trendBy[k])}${unit}`;
    return t;
  });
  const legend = trend
    ? '<span class="legend"><i class="lg-dot"></i>mesure <i class="lg-line"></i>moyenne 7 j <i class="lg-target"></i>cible</span>'
    : '';
  return wrap(s, title, legend);
}

// Barres journalières avec ligne cible.
export function barChart({ title, points, target, targetLabel, today, days, fmt, unit, empty, overIsBad = false }) {
  if (!points.length) return `<figure class="chart"><figcaption>${title}</figcaption><p class="muted">${empty}</p></figure>`;
  const hi = Math.max(...points.map((p) => p.value), target ?? 0) * 1.15;
  const sc = scales(today, days, 0, hi);
  const ticks = niceTicks(0, hi);
  let s = frame(sc, ticks, fmt, today, days);
  const bw = Math.max(Math.min((sc.iw / days) - 2, 24), 3);
  for (const p of points) {
    const x = sc.x(p.key) - bw / 2;
    const y = sc.y(p.value);
    const h = sc.y(0) - y;
    const over = overIsBad && target && p.value > target ? ' over' : '';
    s += h > 4
      ? `<path class="bar${over}" d="M${x},${sc.y(0)} V${y + 4} q0,-4 4,-4 h${bw - 8} q4,0 4,4 V${sc.y(0)} Z"/>`
      : `<rect class="bar${over}" x="${x}" y="${y}" width="${bw}" height="${Math.max(h, 1)}"/>`;
  }
  s += targetLine(sc, target, targetLabel);
  const byKey = Object.fromEntries(points.map((p) => [p.key, p.value]));
  s += hitLayer(sc, today, days, (k) => (byKey[k] === undefined ? null : `${shortDate(k)} : ${fmt(byKey[k])}${unit}`));
  return wrap(s, title);
}
