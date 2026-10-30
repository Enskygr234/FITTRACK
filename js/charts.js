/* =========================================================
   FITTRACK — Grafik bileşenleri (bağımlılıksız SVG/HTML)
   ========================================================= */
'use strict';

const Charts = (() => {
  let gid = 0;
  const fmt = (n) => Number(n).toLocaleString('tr-TR', { maximumFractionDigits: 1 });

  /* Halka (progress ring) */
  function ring({ value = 0, max = 1, size = 180, stroke = 14, center = '', colors = ['#ff2d3d', '#ff6b4a'], track = 'var(--ring-track)', cls = '' }) {
    const id = `rg${++gid}`;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const pct = Math.max(0, Math.min(1, max ? value / max : 0));
    const off = c * (1 - pct);
    return `
      <div class="ring ${cls}" style="width:${size}px;height:${size}px">
        <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">
          <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1] || colors[0]}"/></linearGradient></defs>
          <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${track}" stroke-width="${stroke}"/>
          <circle class="ring-progress" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="url(#${id})" stroke-width="${stroke}"
            stroke-linecap="round" stroke-dasharray="${c}" style="--c:${c};--o:${off}" stroke-dashoffset="${off}"
            transform="rotate(-90 ${size / 2} ${size / 2})"/>
        </svg>
        <div class="ring-center">${center}</div>
      </div>`;
  }

  /* Çok renkli makro halkası */
  function macroRing({ segments, size = 170, stroke = 16, center = '' }) {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const total = segments.reduce((a, s) => a + s.value, 0);
    let acc = 0;
    const gap = total ? 4 : 0;
    const arcs = segments.map((s, i) => {
      const len = total ? (s.value / total) * c : 0;
      const dash = Math.max(0, len - gap);
      const el = `<circle class="ring-seg" style="animation-delay:${i * 120}ms" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${s.color}"
        stroke-width="${stroke}" stroke-linecap="butt" stroke-dasharray="${dash} ${c - dash}" stroke-dashoffset="${-acc}"
        transform="rotate(-90 ${size / 2} ${size / 2})"/>`;
      acc += len;
      return el;
    }).join('');
    return `
      <div class="ring" style="width:${size}px;height:${size}px">
        <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">
          <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--ring-track)" stroke-width="${stroke}"/>
          ${arcs}
        </svg>
        <div class="ring-center">${center}</div>
      </div>`;
  }

  /* Çubuk grafik (HTML tabanlı, duyarlı) */
  function bars(data, { height = 180, goal = null, unit = '', highlight = -1, empty = 'Henüz veri yok', labelEvery = 1, tone = '' } = {}) {
    const max = Math.max(goal || 0, ...data.map(d => d.value), 1) * 1.1;
    if (!data.some(d => d.value > 0)) {
      return `<div class="chart-empty" style="height:${height}px">${empty}</div>`;
    }
    const goalLine = goal ? `<div class="bar-goal-layer"><div class="bar-goal" style="bottom:${(goal / max) * 100}%"><span>Hedef ${fmt(goal)}${unit}</span></div></div>` : '';
    const cols = data.map((d, i) => {
      const h = (d.value / max) * 100;
      const hi = i === highlight ? ' is-hi' : '';
      const reached = goal && d.value >= goal ? ' is-goal' : '';
      const showLabel = (i % labelEvery === 0) || i === data.length - 1;
      return `
        <div class="bar-col${hi}${reached}" title="${d.label}: ${fmt(d.value)}${unit}">
          <div class="bar-track"><div class="bar" style="height:${h}%;animation-delay:${Math.min(i * 40, 600)}ms">
            <span class="bar-tip">${fmt(d.value)}${unit}</span></div></div>
          <div class="bar-label">${showLabel ? d.label : ''}</div>
        </div>`;
    }).join('');
    return `<div class="bars${tone ? ' bars-' + tone : ''}" style="height:${height}px">${goalLine}<div class="bars-inner">${cols}</div></div>`;
  }

  /* Çizgi grafik (alan dolgulu) */
  function line(data, { height = 200, unit = '', empty = 'Henüz veri yok', labelEvery = 1, decimals = 1 } = {}) {
    const pts = data.filter(d => d.value != null);
    if (pts.length < 1) return `<div class="chart-empty" style="height:${height}px">${empty}</div>`;
    const vals = pts.map(d => d.value);
    let min = Math.min(...vals), max = Math.max(...vals);
    if (max - min < 2) { min -= 1; max += 1; }
    const pad = (max - min) * 0.15;
    min -= pad; max += pad;
    const n = data.length;
    const xOf = (i) => n === 1 ? 50 : (i / (n - 1)) * 100;
    const yOf = (v) => 100 - ((v - min) / (max - min)) * 100;
    const coords = data.map((d, i) => d.value == null ? null : [xOf(i), yOf(d.value), d]).filter(Boolean);
    const path = coords.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');
    const area = coords.length > 1 ? `${path} L${coords[coords.length - 1][0]},100 L${coords[0][0]},100 Z` : '';
    const id = `lg${++gid}`;
    const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => {
      const v = max - (max - min) * t;
      return `<div class="lc-tick" style="top:${t * 100}%"><span>${v.toFixed(decimals === 0 ? 0 : 1).replace('.', ',')}</span></div>`;
    }).join('');
    const dots = coords.map(([x, y, d], i) => `<span class="lc-dot${i === coords.length - 1 ? ' is-last' : ''}" style="left:${x}%;top:${y}%" title="${d.label}: ${fmt(d.value)}${unit}"></span>`).join('');
    const labels = data.map((d, i) => `<span style="left:${xOf(i)}%">${(i % labelEvery === 0 || i === n - 1) ? d.label : ''}</span>`).join('');
    return `
      <div class="linechart" style="height:${height}px">
        <div class="lc-plot">
          ${ticks}
          <div class="lc-svg">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#ff2d3d" stop-opacity=".35"/><stop offset="1" stop-color="#ff2d3d" stop-opacity="0"/></linearGradient></defs>
              ${area ? `<path d="${area}" fill="url(#${id})"/>` : ''}
              <path d="${path}" fill="none" stroke="#ff2d3d" stroke-width="2.5" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/>
            </svg>
            ${dots}
          </div>
        </div>
        <div class="lc-labels">${labels}</div>
      </div>`;
  }

  /* Basit ilerleme çubuğu */
  function progress(value, max, color = '') {
    const pct = Math.max(0, Math.min(100, max ? (value / max) * 100 : 0));
    return `<div class="progress"><div class="progress-bar ${color}" style="width:${pct}%"></div></div>`;
  }

  /* Kas haritası */
  /* heat: { kasAnahtarı: 0..1 } verilirse ısı haritası olarak boyanır */
  function bodyMap(muscles = [], heat = null) {
    const set = new Set(muscles);
    const shape = (s) => {
      const m = s[s.length - 1];
      const on = m && m.some(x => set.has(x));
      let cls = m ? (on ? 'mm on' : 'mm') : 'mm base';
      let style = '';
      if (heat && m) {
        const v = Math.max(...m.map(x => heat[x] || 0));
        cls = v > 0 ? 'mm heat' : 'mm';
        if (v > 0) style = ` style="fill:rgba(255,45,61,${(0.18 + 0.82 * v).toFixed(2)})"`;
      }
      switch (s[0]) {
        case 'c': return `<circle class="${cls}"${style} cx="${s[1]}" cy="${s[2]}" r="${s[3]}"/>`;
        case 'e': return `<ellipse class="${cls}"${style} cx="${s[1]}" cy="${s[2]}" rx="${s[3]}" ry="${s[4]}"/>`;
        case 'r': return `<rect class="${cls}"${style} x="${s[1]}" y="${s[2]}" width="${s[3]}" height="${s[4]}" rx="${s[5]}"/>`;
        case 'p': return `<path class="${cls}"${style} d="${s[1]}"/>`;
        default: return '';
      }
    };
    const fig = (shapes, label) => `
      <figure class="body-fig"><svg viewBox="10 0 80 170" aria-hidden="true">${shapes.map(shape).join('')}</svg><figcaption>${label}</figcaption></figure>`;
    return `<div class="body-map">${fig(BODY_FRONT, 'Ön')}${fig(BODY_BACK, 'Arka')}</div>`;
  }

  return { ring, macroRing, bars, line, progress, bodyMap, fmt };
})();
