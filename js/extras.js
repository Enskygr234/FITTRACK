/* =========================================================
   FITTRACK — Ek özellikler
   Araçlar (plaka/ısınma/1RM), antrenman seçenekleri (ısınma, dropset,
   süperset, RPE, not), Vücut Takibi (ölçü + fotoğraf), Başarılar
   (rozet + seriler), kas ısı haritası, besin seçici, barkod,
   Android bildirimleri
   ========================================================= */
'use strict';

/* ---------------- Menüye yeni sayfalar ---------------- */
(() => {
  const i = NAV.findIndex(n => n.id === 'library');
  NAV.splice(i, 0,
    { id: 'body', label: 'Vücut Takibi', icon: 'ruler' },
    { id: 'badges', label: 'Başarılar', icon: 'award' },
    { id: 'tools', label: 'Araçlar', icon: 'calc' });
  Object.assign(TITLES, { body: 'Vücut Takibi', badges: 'Başarılar', tools: 'Araçlar' });
})();

const round25 = (x) => Math.round(x / 2.5) * 2.5;
const fmt2 = (n) => Number(n).toLocaleString('tr-TR', { maximumFractionDigits: 2 });

/* =========================================================
   1) ARAÇLAR — plaka, ısınma, 1RM
   ========================================================= */
const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
const PLATE_COLORS = { 25: '#e11d2e', 20: '#2563eb', 15: '#eab308', 10: '#16a34a', 5: '#e5e7eb', 2.5: '#f43f5e', 1.25: '#9ca3af' };

function platesFor(total, bar = 20) {
  let side = (total - bar) / 2;
  const plates = [];
  if (side < 0) return { plates, rest: 0, under: true };
  for (const p of PLATES) {
    while (side >= p - 1e-9) { plates.push(p); side = +(side - p).toFixed(3); }
  }
  return { plates, rest: +(side * 2).toFixed(2), under: false };
}
function plateText(plates) {
  const c = {};
  plates.forEach(p => { c[p] = (c[p] || 0) + 1; });
  return Object.entries(c).sort((a, b) => b[0] - a[0]).map(([p, n]) => `${n > 1 ? n + ' × ' : ''}${fmt2(+p)} kg`).join(' + ');
}
function plateViz(total, bar = 20, compact = false) {
  total = +total || 0;
  const r = platesFor(total, bar);
  if (r.under) return `<p class="muted sm">Hedef ağırlık bar ağırlığından (${bar} kg) az.</p>`;
  return `<div class="plate-viz${compact ? ' compact' : ''}" aria-hidden="true"><div class="pv-sleeve"></div>
      ${r.plates.map(p => `<span class="pv-plate" style="--h:${(compact ? 26 : 44) + p * (compact ? 1.4 : 2.4)}px;--c:${PLATE_COLORS[p]}"><i>${fmt2(p)}</i></span>`).join('')}
      <div class="pv-collar"></div><div class="pv-bar"></div></div>
    <p class="plate-text">Her tarafa: <b>${r.plates.length ? plateText(r.plates) : 'plaka yok — sadece bar'}</b>${r.rest ? ` <span class="muted">(${fmt(r.rest)} kg tam eşleşmedi)</span>` : ''}</p>`;
}
function warmupPlan(work, bar = 20) {
  work = +work || 0;
  if (work <= bar + 5) return [{ kg: bar, reps: 10 }];
  const out = [];
  [[0, 10], [0.5, 8], [0.7, 5], [0.85, 3]].forEach(([p, reps]) => {
    const kg = p === 0 ? bar : Math.max(bar, round25(work * p));
    if (kg < work && !out.some(o => o.kg === kg)) out.push({ kg, reps });
  });
  return out;
}
function oneRM(kg, reps) {
  kg = +kg || 0; reps = Math.max(1, +reps || 1);
  if (reps === 1) return kg;
  const epley = kg * (1 + reps / 30);
  const brzycki = reps < 37 ? kg * 36 / (37 - reps) : epley;
  return (epley + brzycki) / 2;
}
function warmupList(work, bar) {
  return `<div class="warm-list">${warmupPlan(work, bar).map((w, i) => `<div class="warm-row"><span class="set-no">I${i + 1}</span><b>${fmt(w.kg)} kg × ${w.reps}</b><small>${w.kg > bar ? plateText(platesFor(w.kg, bar).plates) : 'Sadece bar'}</small></div>`).join('')}
    <div class="warm-row work"><span class="set-no">${icon('zap')}</span><b>${fmt(work)} kg</b><small>Çalışma setleri</small></div></div>`;
}
function ormResult(kg, reps) {
  const max = oneRM(kg, reps);
  if (!max) return '<p class="muted sm">Ağırlık ve tekrar gir.</p>';
  return `<div class="orm-big"><small>Tahmini 1RM</small><b>${fmt(Math.round(max * 2) / 2)} <span>kg</span></b></div>
    <div class="orm-table">${[95, 90, 85, 80, 75, 70, 65, 60].map(p => `<div><small>%${p}</small><b>${fmt(round25(max * p / 100))}</b><em>~${Math.max(1, Math.round(30 * (100 / p - 1)))} tkr</em></div>`).join('')}</div>`;
}

function pageTools() {
  const t = ui.tools || (ui.tools = { target: 100, bar: 20, work: 100, wbar: 20, kg: 80, reps: 8 });
  const barSel = (name, v) => `<select data-input="tool" name="${name}" aria-label="Bar ağırlığı">${[20, 15, 10].map(b => `<option value="${b}"${b === v ? ' selected' : ''}>${b} kg bar</option>`).join('')}</select>`;
  return `
  ${pageHead('Araçlar', 'Plaka, ısınma seti ve maksimum (1RM) hesaplayıcıları')}
  <div class="grid g-2">
    <div class="card">
      <div class="card-head"><span class="card-title">${icon('layers')} Plaka Hesaplayıcı</span></div>
      <div class="form-row tool-row">
        <div class="field grow"><label>Hedef ağırlık (kg)</label><input type="number" inputmode="decimal" step="2.5" min="0" max="500" value="${t.target}" data-input="tool" name="target"></div>
        <div class="field grow"><label>Bar</label>${barSel('bar', t.bar)}</div>
      </div>
      <div id="plateOut">${plateViz(t.target, t.bar)}</div>
    </div>
    <div class="card">
      <div class="card-head"><span class="card-title">${icon('flame')} Isınma Setleri</span></div>
      <div class="form-row tool-row">
        <div class="field grow"><label>Çalışma ağırlığı (kg)</label><input type="number" inputmode="decimal" step="2.5" min="0" max="500" value="${t.work}" data-input="tool" name="work"></div>
        <div class="field grow"><label>Bar</label>${barSel('wbar', t.wbar)}</div>
      </div>
      <div id="warmOut">${warmupList(t.work, t.wbar)}</div>
    </div>
  </div>
  <div class="card">
    <div class="card-head"><span class="card-title">${icon('trophy')} 1RM (Tek Tekrar Maksimum) Hesaplayıcı</span><span class="muted sm">Epley + Brzycki ortalaması</span></div>
    <div class="form-row tool-row">
      <div class="field grow"><label>Kaldırdığın ağırlık (kg)</label><input type="number" inputmode="decimal" step="2.5" min="0" max="500" value="${t.kg}" data-input="tool" name="kg"></div>
      <div class="field grow"><label>Tekrar sayısı</label><input type="number" inputmode="numeric" min="1" max="30" value="${t.reps}" data-input="tool" name="reps"></div>
    </div>
    <div id="ormOut">${ormResult(t.kg, t.reps)}</div>
    <p class="hint">Tahmini değerdir. Gerçek maksimum denemelerini mutlaka bir spotter eşliğinde yap.</p>
  </div>`;
}
EXTRA_INPUTS.tool = (el) => {
  const t = ui.tools;
  t[el.name] = +el.value || 0;
  if (el.name === 'target' || el.name === 'bar') $('#plateOut').innerHTML = plateViz(t.target, t.bar);
  if (el.name === 'work' || el.name === 'wbar') $('#warmOut').innerHTML = warmupList(t.work, t.wbar);
  if (el.name === 'kg' || el.name === 'reps') $('#ormOut').innerHTML = ormResult(t.kg, t.reps);
};
EXTRA_CHANGES.tool = EXTRA_INPUTS.tool;

/* =========================================================
   2) ANTRENMAN SEÇENEKLERİ — ısınma, dropset, süperset, RPE, not
   ========================================================= */
const SET_TYPES = [['', 'Normal', 'Çalışma seti'], ['w', 'Isınma', 'Hacme ve rekorlara sayılmaz'], ['d', 'Dropset', 'Ağırlığı düşürüp devam'], ['f', 'Başarısız', 'Tükenişe kadar']];

function firstWorkKg(e) {
  const st = e.sets.find(x => x.t !== 'w' && +x.kg > 0);
  if (st) return +st.kg;
  const ex = EX_BY_ID[e.ex];
  const sug = overloadSuggestion(ex, e, Store.lastPerformance(e.ex));
  return sug ? sug.kg : 0;
}

function openExerciseMenu(ei) {
  const a = S().active; const e = a.exercises[ei]; const ex = EX_BY_ID[e.ex];
  const work = firstWorkKg(e);
  const hasWarm = e.sets.some(x => x.t === 'w');
  const last = ei === a.exercises.length - 1;
  const item = (action, ic, title, sub, extra = '') => `<button class="set-item link" data-action="${action}" data-ei="${ei}" ${extra}><span class="si-ic">${icon(ic)}</span><div class="si-body"><b>${title}</b><small>${sub}</small></div>${icon('right', 'li-end')}</button>`;
  openModal(esc(ex.name), `
    ${item('ex-warmup', 'flame', hasWarm ? 'Isınma setlerini yenile' : 'Isınma setleri ekle', work ? warmupPlan(work).map(w => `${fmt(w.kg)}×${w.reps}`).join(' · ') : 'Önce ilk sete ağırlık gir')}
    ${item('ex-dropset', 'layers', 'Dropset ekle', 'Son setin %80 ağırlığıyla ek set')}
    ${last ? '' : item('ex-ss', 'refresh', e.ss ? 'Süperseti kaldır' : 'Sonraki hareketle süperset yap', e.ss ? 'Hareketler ayrı yapılır' : `${esc(EX_BY_ID[a.exercises[ei + 1].ex].name)} ile dinlenmeden art arda`)}
    ${work ? item('ex-plate', 'calc', 'Plaka hesapla', `${fmt(work)} kg için bara ne takılır?`) : ''}
    <form data-form="ex-note" class="form mt"><input type="hidden" name="ei" value="${ei}">
      <div class="field"><label>Egzersiz notu</label><textarea name="note" rows="2" maxlength="200" placeholder="Örn. Koltuk 4. kademe, dar tutuş">${esc(e.note || '')}</textarea></div>
      <div class="modal-actions"><button type="button" class="btn btn-ghost danger-text" data-action="ex-remove" data-ei="${ei}">${icon('trash')} Kaldır</button>
        ${ei > 0 ? `<button type="button" class="btn btn-ghost" data-action="ex-move" data-ei="${ei}" data-dir="-1">↑ Yukarı</button>` : ''}
        ${last ? '' : `<button type="button" class="btn btn-ghost" data-action="ex-move" data-ei="${ei}" data-dir="1">↓ Aşağı</button>`}
        <button class="btn btn-primary" type="submit">Notu Kaydet</button></div>
    </form>`);
}

function openSetOptions(ei, si) {
  const st = S().active.exercises[ei].sets[si];
  ui.setRef = { ei, si };
  openModal(`Set ${si + 1} Seçenekleri`, `
    <div class="field"><label>Set türü</label>
      <div class="type-grid">${SET_TYPES.map(([k, l, d]) => `<button class="type-btn${(st.t || '') === k ? ' active' : ''}" data-action="set-type" data-t="${k}"><b>${l}</b><small>${d}</small></button>`).join('')}</div></div>
    <div class="field"><label>Zorluk (RPE) — setten sonra kaç tekrar daha yapabilirdin?</label>
      <div class="chips">${[6, 7, 7.5, 8, 8.5, 9, 9.5, 10].map(v => `<button class="chip${+st.rpe === v ? ' active' : ''}" data-action="set-rpe" data-v="${v}">${String(v).replace('.', ',')}</button>`).join('')}
      <button class="chip" data-action="set-rpe" data-v="">Temizle</button></div>
      <p class="hint">RPE 10 = hiç tekrar kalmadı · 9 = 1 tekrar kaldı · 8 = 2 tekrar kaldı · 7 = 3 tekrar kaldı</p></div>
    <div class="modal-actions"><button class="btn btn-ghost danger-text" data-action="set-del" ${S().active.exercises[ei].sets.length <= 1 ? 'disabled' : ''}>${icon('trash')} Seti Sil</button><button class="btn btn-primary" data-action="modal-close">Tamam</button></div>`);
}

Object.assign(ACTIONS, {
  'ex-menu': (el) => openExerciseMenu(+el.dataset.ei),
  'ex-warmup': (el) => {
    const e = S().active.exercises[+el.dataset.ei];
    const work = firstWorkKg(e);
    if (!work) { toast('Önce ilk çalışma setine ağırlık gir', 'err'); return; }
    e.sets = e.sets.filter(x => x.t !== 'w' || x.done);
    const plan = warmupPlan(work).map(w => ({ kg: w.kg, reps: w.reps, done: false, t: 'w' }));
    e.sets.unshift(...plan);
    Store.save(); closeModal(); rerender(); toast(`${plan.length} ısınma seti eklendi 🔥`);
  },
  'ex-dropset': (el) => {
    const e = S().active.exercises[+el.dataset.ei];
    const work = [...e.sets].reverse().find(x => x.t !== 'w') || e.sets[e.sets.length - 1];
    e.sets.push({ kg: work && +work.kg ? round25(+work.kg * 0.8) : '', reps: work ? work.reps : 10, done: false, t: 'd' });
    Store.save(); closeModal(); rerender(); toast('Dropset eklendi');
  },
  'ex-ss': (el) => {
    const e = S().active.exercises[+el.dataset.ei];
    e.ss = !e.ss; Store.save(); closeModal(); rerender();
    toast(e.ss ? 'Süperset oluşturuldu 🔁' : 'Süperset kaldırıldı', 'info');
  },
  'ss-toggle': (el) => { const e = S().active.exercises[+el.dataset.ei]; e.ss = false; Store.save(); rerender(); },
  'ex-plate': (el) => {
    const e = S().active.exercises[+el.dataset.ei];
    const w = firstWorkKg(e);
    openModal(`${fmt(w)} kg için plakalar`, `${plateViz(w, 20)}<p class="hint">20 kg olimpik bar varsayıldı. Farklı bar için Araçlar sayfasını kullan.</p>`);
  },
  'ex-move': (el) => {
    const list = S().active.exercises, i = +el.dataset.ei, j = i + +el.dataset.dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    list.forEach((x, k) => { if (k === list.length - 1) x.ss = false; });
    Store.save(); closeModal(); rerender();
  },
  'set-opts': (el) => openSetOptions(+el.dataset.ei, +el.dataset.si),
  'set-type': (el) => {
    const { ei, si } = ui.setRef; const st = S().active.exercises[ei].sets[si];
    if (el.dataset.t) st.t = el.dataset.t; else delete st.t;
    Store.save(); rerender(); openSetOptions(ei, si);
  },
  'set-rpe': (el) => {
    const { ei, si } = ui.setRef; const st = S().active.exercises[ei].sets[si];
    if (el.dataset.v) st.rpe = +el.dataset.v; else delete st.rpe;
    Store.save(); rerender(); openSetOptions(ei, si);
  },
  'set-del': () => {
    const { ei, si } = ui.setRef; const e = S().active.exercises[ei];
    if (e.sets.length <= 1) return;
    e.sets.splice(si, 1); Store.save(); closeModal(); rerender();
  },
  'apply-suggest': (el) => {
    const e = S().active.exercises[+el.dataset.ei];
    e.sets.forEach(st => { if (!st.done && st.t !== 'w' && st.t !== 'd') st.kg = +el.dataset.kg; });
    Store.save(); rerender(); toast(`Hedef ağırlık ${fmt(+el.dataset.kg)} kg yapıldı 💪`);
  }
});
FORMS['ex-note'] = (d) => {
  const e = S().active.exercises[+d.ei];
  e.note = d.note.trim();
  if (!e.note) delete e.note;
  Store.save(); closeModal(); rerender(); toast('Not kaydedildi');
};

/* =========================================================
   3) VÜCUT TAKİBİ — ölçüler + ilerleme fotoğrafları
   ========================================================= */
const MEASURES = [['waist', 'Bel'], ['chest', 'Göğüs'], ['arm', 'Kol'], ['thigh', 'Uyluk'], ['hip', 'Kalça'], ['neck', 'Boyun']];

function navyBodyFat(m) {
  const p = S().profile;
  if (!m || !p.height || !m.waist || !m.neck) return null;
  const log = Math.log10;
  let bf;
  if (p.gender === 'female') {
    if (!m.hip) return null;
    bf = 495 / (1.29579 - 0.35004 * log(m.waist + m.hip - m.neck) + 0.22100 * log(p.height)) - 450;
  } else {
    if (m.waist - m.neck <= 0) return null;
    bf = 495 / (1.0324 - 0.19077 * log(m.waist - m.neck) + 0.15456 * log(p.height)) - 450;
  }
  return bf > 2 && bf < 70 ? bf : null;
}
function latestMeasure(key) {
  const list = S().measurements.filter(x => x[key]);
  return list.length ? { first: list[0][key], last: list[list.length - 1][key] } : null;
}
function latestFull() {
  const out = {};
  MEASURES.forEach(([k]) => { const v = latestMeasure(k); if (v) out[k] = v.last; });
  return out;
}

/* IndexedDB: fotoğraflar cihazda saklanır (LocalStorage sınırına takılmaz) */
const PhotoDB = {
  db: null,
  open() {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((res, rej) => {
      if (!window.indexedDB) { rej(new Error('IndexedDB yok')); return; }
      const r = indexedDB.open('fittrack-photos', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('photos', { keyPath: 'id' });
      r.onsuccess = () => { this.db = r.result; res(this.db); };
      r.onerror = () => rej(r.error);
    });
  },
  tx(mode, fn) {
    return this.open().then(db => new Promise((res, rej) => {
      const store = db.transaction('photos', mode).objectStore('photos');
      const q = fn(store);
      q.onsuccess = () => res(q.result);
      q.onerror = () => rej(q.error);
    }));
  },
  all() { return this.tx('readonly', s => s.getAll()).then(l => l.sort((a, b) => b.date.localeCompare(a.date) || b.ts - a.ts)); },
  put(p) { return this.tx('readwrite', s => s.put(p)); },
  del(id) { return this.tx('readwrite', s => s.delete(id)); }
};
function resizeImage(file, max = 1080) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onerror = rej;
    fr.onload = () => {
      const img = new Image();
      img.onerror = rej;
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', 0.82));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

function pageBody() {
  const s = S();
  const metric = ui.bodyMetric || 'waist';
  const list = s.measurements;
  const series = list.filter(x => x[metric]).slice(-20).map(x => ({ label: DateUtil.formatShort(x.date), value: x[metric] }));
  const lf = latestFull();
  const bf = navyBodyFat(lf);
  const tile = ([k, l]) => {
    const v = latestMeasure(k);
    const ch = v ? round1(v.last - v.first) : null;
    return `<button class="card stat-card${metric === k ? ' sel' : ''}" data-action="body-metric" data-k="${k}"><span class="stat-label">${l}</span><span class="stat-value">${v ? fmt(v.last) : '—'} <small>cm</small></span>
      <span class="stat-sub">${ch != null && ch !== 0 ? `<span class="${(k === 'waist' || k === 'hip') ? (ch < 0 ? 'up' : 'down') : (ch > 0 ? 'up' : 'down')}">${ch > 0 ? '+' : ''}${fmt(ch)} cm</span> başlangıca göre` : v ? 'İlk kayıt' : 'Kayıt yok'}</span></button>`;
  };
  return `
  ${pageHead('Vücut Takibi', 'Ölçülerini ve ilerleme fotoğraflarını kaydet. Tartı her şeyi anlatmaz!')}
  <div class="grid g-3 measure-tiles">${MEASURES.map(tile).join('')}</div>
  <div class="grid g-2-1">
    <div class="card">
      <div class="card-head"><span class="card-title">${MEASURES.find(m => m[0] === metric)[1]} Ölçüsü</span><span class="muted sm">cm</span></div>
      ${Charts.line(series, { height: 220, unit: ' cm', empty: 'Bu ölçü için henüz kayıt yok. Sağdaki formdan ekleyebilirsin.' })}
      ${bf ? `<div class="pr-line">${icon('activity')} Tahmini yağ oranı (ABD Donanması yöntemi): <b>%${fmt(round1(bf))}</b> <span class="muted">— boy, boyun ve bel${s.profile.gender === 'female' ? ', kalça' : ''} ölçüsünden</span></div>` : `<p class="hint">Boyun ve bel${s.profile.gender === 'female' ? ' ile kalça' : ''} ölçünü (ve profilde boyunu) girersen yağ oranın daha doğru hesaplanır.</p>`}
    </div>
    <div class="card">
      <div class="card-head"><span class="card-title">${icon('ruler')} Ölçü Ekle</span></div>
      <form data-form="measure" class="form">
        <div class="field"><label>Tarih</label><input name="date" type="date" max="${DateUtil.today()}" value="${DateUtil.today()}" required></div>
        <div class="form-row measure-form">${MEASURES.map(([k, l]) => `<div class="field"><label>${l} (cm)</label><input name="${k}" type="number" inputmode="decimal" step="0.1" min="10" max="250" placeholder="${lf[k] ? fmt(lf[k]) : '—'}"></div>`).join('')}</div>
        <button class="btn btn-primary btn-block" type="submit">${icon('plus')} Kaydet</button>
      </form>
    </div>
  </div>
  ${list.length ? `<div class="card"><div class="card-head"><span class="card-title">Ölçü Geçmişi</span><span class="muted sm">${list.length} kayıt</span></div>
    <div class="table-wrap"><table class="m-table"><thead><tr><th>Tarih</th>${MEASURES.map(([, l]) => `<th>${l}</th>`).join('')}<th></th></tr></thead>
    <tbody>${[...list].reverse().map(x => `<tr><td>${DateUtil.formatShort(x.date)}</td>${MEASURES.map(([k]) => `<td>${x[k] ? fmt(x[k]) : '—'}</td>`).join('')}<td><button class="btn-icon sm" data-action="meas-del" data-date="${x.date}" aria-label="Sil">${icon('trash')}</button></td></tr>`).join('')}</tbody></table></div></div>` : ''}
  <div class="card">
    <div class="card-head"><span class="card-title">${icon('camera')} İlerleme Fotoğrafları</span>
      <label class="btn btn-primary btn-sm">${icon('plus')} Fotoğraf Ekle<input type="file" accept="image/*" data-change="photo-file" hidden></label></div>
    <div id="photoGrid" class="photo-grid"><p class="muted sm">Yükleniyor…</p></div>
    <div id="photoCompare"></div>
    <p class="hint">${icon('shield')} Fotoğraflar yalnızca bu cihazda saklanır; hiçbir yere gönderilmez ve veri yedeğine dahil edilmez.</p>
  </div>`;
}
let photoCache = [];
function renderPhotos() {
  const grid = $('#photoGrid'); if (!grid) return;
  PhotoDB.all().then(list => {
    photoCache = list;
    if (!$('#photoGrid')) return;
    $('#photoGrid').innerHTML = list.length ? list.map(p => `<button class="photo-item" data-action="photo-view" data-id="${p.id}"><img src="${p.data}" alt="${DateUtil.format(p.date)} fotoğrafı" loading="lazy"><span>${DateUtil.formatShort(p.date)}</span></button>`).join('')
      : emptyState('camera', 'Henüz fotoğraf yok', 'Her hafta aynı ışıkta, aynı pozda bir fotoğraf çek; değişimi karşılaştır.');
    const cmp = $('#photoCompare');
    if (cmp) cmp.innerHTML = list.length >= 2 ? photoCompareHTML(list) : '';
  }).catch(() => { grid.innerHTML = '<p class="muted sm">Bu cihazda fotoğraf depolama desteklenmiyor.</p>'; });
}
function photoCompareHTML(list) {
  const a = list.find(p => p.id === ui.cmpA) || list[list.length - 1];
  const b = list.find(p => p.id === ui.cmpB) || list[0];
  const opt = (sel) => list.map(p => `<option value="${p.id}"${p.id === sel.id ? ' selected' : ''}>${DateUtil.format(p.date)}</option>`).join('');
  return `<div class="card-head mt"><span class="card-title">Önce / Sonra</span></div>
    <div class="form-row"><div class="field grow"><label>Önce</label><select data-change="cmp-a">${opt(a)}</select></div><div class="field grow"><label>Sonra</label><select data-change="cmp-b">${opt(b)}</select></div></div>
    <div class="compare" id="compareBox" style="--x:50%">
      <img src="${a.data}" alt="Önce"><div class="cmp-after"><img src="${b.data}" alt="Sonra"></div><div class="cmp-handle"></div>
      <span class="cmp-tag l">${DateUtil.formatShort(a.date)}</span><span class="cmp-tag r">${DateUtil.formatShort(b.date)}</span>
    </div>
    <input type="range" min="0" max="100" value="50" data-input="cmp-slider" class="cmp-range" aria-label="Karşılaştırma kaydırıcısı">`;
}
EXTRA_INPUTS['cmp-slider'] = (el) => { const b = $('#compareBox'); if (b) b.style.setProperty('--x', el.value + '%'); };
EXTRA_CHANGES['cmp-a'] = (el) => { ui.cmpA = el.value; $('#photoCompare').innerHTML = photoCompareHTML(photoCache); };
EXTRA_CHANGES['cmp-b'] = (el) => { ui.cmpB = el.value; $('#photoCompare').innerHTML = photoCompareHTML(photoCache); };
EXTRA_CHANGES['photo-file'] = (el) => {
  const f = el.files && el.files[0];
  if (!f) return;
  toast('Fotoğraf hazırlanıyor…', 'info');
  resizeImage(f).then(data => PhotoDB.put({ id: uid(), date: DateUtil.today(), ts: Date.now(), data }))
    .then(() => { renderPhotos(); toast('Fotoğraf kaydedildi 📸'); onStoreSaved(); })
    .catch(() => toast('Fotoğraf kaydedilemedi', 'err'));
  el.value = '';
};
Object.assign(ACTIONS, {
  'body-metric': (el) => { ui.bodyMetric = el.dataset.k; rerender(); },
  'meas-del': (el) => confirmBox('Ölçüyü sil', `${DateUtil.format(el.dataset.date)} tarihli ölçüler silinsin mi?`, 'Sil', () => {
    S().measurements = S().measurements.filter(x => x.date !== el.dataset.date); Store.save(); rerender();
  }),
  'photo-view': (el) => {
    const p = photoCache.find(x => x.id === el.dataset.id); if (!p) return;
    openModal(DateUtil.format(p.date), `<img class="photo-full" src="${p.data}" alt="">
      <div class="modal-actions"><button class="btn btn-ghost danger-text" data-action="photo-del" data-id="${p.id}">${icon('trash')} Sil</button><button class="btn btn-primary" data-action="modal-close">Kapat</button></div>`, { wide: true });
  },
  'photo-del': (el) => confirmBox('Fotoğrafı sil', 'Bu fotoğraf kalıcı olarak silinecek.', 'Sil', () => {
    PhotoDB.del(el.dataset.id).then(() => { renderPhotos(); toast('Fotoğraf silindi', 'info'); });
  })
});
FORMS.measure = (d) => {
  const rec = { date: d.date };
  MEASURES.forEach(([k]) => { if (d[k]) rec[k] = round1(+d[k]); });
  if (Object.keys(rec).length < 2) { toast('En az bir ölçü gir', 'err'); return; }
  const list = S().measurements;
  const old = list.find(x => x.date === d.date);
  if (old) Object.assign(old, rec); else list.push(rec);
  list.sort((a, b) => a.date.localeCompare(b.date));
  Store.save(); rerender(); toast('Ölçüler kaydedildi');
};

/* =========================================================
   4) BAŞARILAR — seriler ve rozetler
   ========================================================= */
function streaks() {
  const s = S(), t = DateUtil.today();
  const dayStreak = (ok) => {
    let d = t, n = 0;
    if (!ok(d)) d = DateUtil.addDays(d, -1);
    while (n < 3650 && ok(d)) { n++; d = DateUtil.addDays(d, -1); }
    return n;
  };
  const weekMet = (w) => {
    const planned = Store.weekPlan(w).filter(p => p.tpl).length || 3;
    return Store.sessionsBetween(w, DateUtil.addDays(w, 6)).length >= planned;
  };
  let ws = DateUtil.weekStart(), weeks = 0;
  if (!weekMet(ws)) ws = DateUtil.addDays(ws, -7);
  while (weeks < 520 && weekMet(ws)) { weeks++; ws = DateUtil.addDays(ws, -7); }
  return {
    weeks,
    water: dayStreak(d => Store.waterTotal(d) >= s.settings.waterGoal),
    protein: dayStreak(d => Store.totals(d).protein >= s.settings.proteinGoal),
    log: dayStreak(d => Store.foodOf(d).length > 0 || Store.waterOf(d).length > 0)
  };
}
function badgeContext() {
  const s = S();
  const best = {};
  s.sessions.forEach(x => x.exercises.forEach(e => e.sets.forEach(st => { if (st.t !== 'w') best[e.ex] = Math.max(best[e.ex] || 0, st.kg); })));
  return {
    n: s.sessions.length, sessions: s.sessions,
    vol: s.sessions.reduce((a, x) => a + x.volume, 0),
    best: (id) => best[id] || 0,
    uniq: new Set(s.sessions.flatMap(x => x.exercises.map(e => e.ex))).size,
    st: streaks()
  };
}
const BADGES = [
  { id: 'first', ic: 'dumbbell', name: 'İlk Adım', desc: 'İlk antrenmanını tamamla', prog: c => [c.n, 1] },
  { id: 'w10', ic: 'flame', name: 'Isınıyoruz', desc: '10 antrenman tamamla', prog: c => [c.n, 10] },
  { id: 'w25', ic: 'flame', name: 'Kararlı', desc: '25 antrenman tamamla', prog: c => [c.n, 25] },
  { id: 'w50', ic: 'shield', name: 'Demir İrade', desc: '50 antrenman tamamla', prog: c => [c.n, 50] },
  { id: 'w100', ic: 'trophy', name: 'Efsane', desc: '100 antrenman tamamla', prog: c => [c.n, 100] },
  { id: 'vol10', ic: 'layers', name: '10 Ton', desc: 'Toplam 10 ton kaldır', prog: c => [Math.round(c.vol / 1000), 10] },
  { id: 'vol100', ic: 'layers', name: '100 Ton', desc: 'Toplam 100 ton kaldır', prog: c => [Math.round(c.vol / 1000), 100] },
  { id: 'bench60', ic: 'g_chest', name: 'Bench 60', desc: 'Bench press\'te 60 kg', prog: c => [c.best('bench-press'), 60] },
  { id: 'bench100', ic: 'g_chest', name: 'Bench 100', desc: 'Bench press\'te 100 kg', prog: c => [c.best('bench-press'), 100] },
  { id: 'squat100', ic: 'g_leg', name: 'Squat 100', desc: 'Squat\'ta 100 kg', prog: c => [c.best('squat'), 100] },
  { id: 'dead140', ic: 'g_back', name: 'Deadlift 140', desc: 'Deadlift\'te 140 kg', prog: c => [c.best('deadlift'), 140] },
  { id: 'week4', ic: 'calendar', name: '4 Hafta Seri', desc: '4 hafta üst üste programını tamamla', prog: c => [c.st.weeks, 4] },
  { id: 'water7', ic: 'drop', name: 'Su Ustası', desc: '7 gün üst üste su hedefi', prog: c => [c.st.water, 7] },
  { id: 'protein7', ic: 'shaker', name: 'Protein Avcısı', desc: '7 gün üst üste protein hedefi', prog: c => [c.st.protein, 7] },
  { id: 'log30', ic: 'apple', name: 'Düzenli Kayıt', desc: '30 gün üst üste beslenme/su kaydı', prog: c => [c.st.log, 30] },
  { id: 'variety', ic: 'book', name: 'Kaşif', desc: '20 farklı egzersiz yap', prog: c => [c.uniq, 20] },
  { id: 'early', ic: 'zap', name: 'Erkenci', desc: 'Saat 08:00\'den önce antrenman', test: c => c.sessions.some(x => new Date(x.startedAt).getHours() < 8) },
  { id: 'night', ic: 'moon', name: 'Gece Kuşu', desc: 'Saat 22:00\'den sonra antrenman', test: c => c.sessions.some(x => new Date(x.startedAt).getHours() >= 22) },
  { id: 'superset', ic: 'refresh', name: 'Süperset', desc: 'Bir antrenmanda süperset yap', test: c => c.sessions.some(x => x.exercises.some(e => e.ss)) },
  { id: 'custom', ic: 'star', name: 'Kendi Yolum', desc: 'Kendi programını oluştur', test: () => S().programs.length > 0 },
  { id: 'measure', ic: 'ruler', name: 'Ölçülü', desc: 'İlk vücut ölçünü kaydet', test: () => S().measurements.length > 0 }
];
const badgeDone = (b, c) => b.test ? b.test(c) : (() => { const [v, t] = b.prog(c); return v >= t; })();

let badgeBusy = false;
function checkBadges(silent = false) {
  if (badgeBusy || !S().onboarded) return;
  badgeBusy = true;
  try {
    const c = badgeContext();
    const got = S().badges;
    const fresh = BADGES.filter(b => !got[b.id] && badgeDone(b, c));
    if (fresh.length) {
      fresh.forEach(b => { got[b.id] = DateUtil.today(); });
      Store.save();
      if (!silent) {
        if (fresh.length === 1) toast(`🏆 Yeni rozet: <b>${fresh[0].name}</b>`, 'info');
        else toast(`🏆 ${fresh.length} yeni rozet kazandın!`, 'info');
        buzz([60, 40, 60]);
      }
    }
  } finally { badgeBusy = false; }
}

function pageBadges() {
  const c = badgeContext();
  const got = S().badges;
  const st = c.st;
  const streakCard = (ic, label, val, unit, tone) => `<div class="card stat-card tone-${tone}"><span class="stat-icon">${icon(ic)}</span><span class="stat-label">${label}</span><span class="stat-value">${val} <small>${unit}</small></span><span class="stat-sub">${val ? 'Seriyi bozma! 🔥' : 'Bugün başla'}</span></div>`;
  const unlocked = BADGES.filter(b => got[b.id]).length;
  return `
  ${pageHead('Başarılar', `${unlocked} / ${BADGES.length} rozet açıldı`)}
  <div class="grid g-4">
    ${streakCard('calendar', 'Antrenman Serisi', st.weeks, 'hafta', 'red')}
    ${streakCard('drop', 'Su Serisi', st.water, 'gün', 'blue')}
    ${streakCard('shaker', 'Protein Serisi', st.protein, 'gün', 'violet')}
    ${streakCard('apple', 'Kayıt Serisi', st.log, 'gün', 'green')}
  </div>
  <div class="card">
    <div class="card-head"><span class="card-title">${icon('award')} Rozetler</span>${Charts.progress(unlocked, BADGES.length)}</div>
    <div class="badge-grid">${BADGES.map(b => {
      const on = !!got[b.id];
      const p = b.prog ? b.prog(c) : null;
      return `<div class="badge-card${on ? ' on' : ''}">
        <div class="bc-ic">${icon(on ? b.ic : 'lock')}</div>
        <b>${b.name}</b><small>${b.desc}</small>
        ${on ? `<span class="bc-date">${DateUtil.format(got[b.id])}</span>` : p ? `<div class="bc-prog">${Charts.progress(Math.min(p[0], p[1]), p[1])}<span>${fmt(Math.min(p[0], p[1]))} / ${fmt(p[1])}</span></div>` : '<span class="bc-date muted">Kilitli</span>'}
      </div>`;
    }).join('')}</div>
  </div>`;
}

/* =========================================================
   5) KAS ISI HARİTASI (İstatistikler) + seriler (Ana sayfa)
   ========================================================= */
function muscleHeat(from, to) {
  const sets = {};
  Store.sessionsBetween(from, to).forEach(x => x.exercises.forEach(e => {
    const ex = EX_BY_ID[e.ex]; if (!ex) return;
    const n = e.sets.filter(st => st.t !== 'w').length;
    ex.muscles.forEach((m, i) => { sets[m] = (sets[m] || 0) + n * (i === 0 ? 1 : 0.5); });
  }));
  const max = Math.max(1, ...Object.values(sets));
  const heat = {};
  Object.entries(sets).forEach(([m, v]) => { heat[m] = v / max; });
  return { sets, heat };
}
function heatCard() {
  const B = rangeBuckets(ui.statsRange);
  const { sets, heat } = muscleHeat(B[0].from, B[B.length - 1].to);
  const top = Object.entries(sets).sort((a, b) => b[1] - a[1]);
  const all = Object.keys(MUSCLE_NAMES);
  const missing = all.filter(m => !sets[m]);
  return `<div class="card">
    <div class="card-head"><span class="card-title">${icon('body')} Çalışan Kaslar</span><span class="muted sm">Set sayısına göre ısı haritası</span></div>
    ${top.length ? `<div class="heat-wrap">${Charts.bodyMap([], heat)}
      <div class="heat-list">${top.slice(0, 8).map(([m, v]) => `<div class="hl-row"><span>${MUSCLE_NAMES[m]}</span>${Charts.progress(v, top[0][1])}<b>${fmt(Math.round(v * 10) / 10)}</b></div>`).join('')}
      ${missing.length ? `<p class="hint">Bu aralıkta hiç çalışılmayan: ${missing.map(m => MUSCLE_NAMES[m]).join(', ')}</p>` : ''}</div></div>`
      : emptyState('body', 'Veri yok', 'Bu aralıkta antrenman kaydı olmadığı için ısı haritası boş.')}
  </div>`;
}
function streakStrip() {
  const st = streaks();
  return `<div class="card streak-card">
    <div class="card-head"><span class="card-title">${icon('flame')} Serilerin</span><a href="#/badges" class="card-link">Başarılar ${icon('right')}</a></div>
    <div class="streak-row">
      <div><b>${st.weeks}</b><small>hafta antrenman</small></div>
      <div><b>${st.water}</b><small>gün su hedefi</small></div>
      <div><b>${st.protein}</b><small>gün protein</small></div>
      <div><b>${Object.keys(S().badges).length}</b><small>rozet</small></div>
    </div></div>`;
}
(() => {
  const homeOrig = ROUTES.home;
  ROUTES.home = (p) => {
    const html = homeOrig(p);
    const k = html.indexOf('<div class="grid home-mid">');
    return k === -1 ? html + streakStrip() : html.slice(0, k) + streakStrip() + html.slice(k);
  };
  const statsOrig = ROUTES.stats;
  ROUTES.stats = (p) => {
    const html = statsOrig(p);
    const k = html.indexOf('Kişisel Rekorlar');
    const at = k === -1 ? -1 : html.lastIndexOf('<div class="card">', k);
    return at === -1 ? html + heatCard() : html.slice(0, at) + heatCard() + html.slice(at);
  };
  Object.assign(ROUTES, { tools: pageTools, body: pageBody, badges: pageBadges });
})();

/* =========================================================
   6) BESİN SEÇİCİ, FAVORİLER, BARKOD
   ========================================================= */
const autoMealNow = () => { const h = new Date().getHours(); return h < 11 ? 'Kahvaltı' : h < 15 ? 'Öğle Yemeği' : h < 21 ? 'Akşam Yemeği' : 'Ara Öğün'; };
const foodDate = () => (currentPage === 'nutrition' ? ui.nutDate : DateUtil.today());

Object.assign(ACTIONS, {
  'food-pick': (el) => {
    const f = el.dataset.fav ? (S().favorites || []).find(x => x.id === el.dataset.fav) : FOODS[+el.dataset.i];
    if (!f) return;
    const form = el.closest('form');
    ui.foodBase = { label: f.name, kcal: f.kcal, protein: f.protein, carbs: f.carbs, fat: f.fat, per: 0 };
    form.portion.value = 1;
    applyFoodBase(form);
    form.querySelectorAll('.food-opt').forEach(b => b.classList.toggle('active', b === el));
    form.portion.focus({ preventScroll: true });
  },
  'food-cat': (el) => {
    ui.foodCat = el.dataset.c;
    document.querySelectorAll('#foodCats .chip').forEach(c => c.classList.toggle('active', c === el));
    $('#foodResults').innerHTML = foodResults(ui.foodQuery || '', ui.foodCat);
  },
  'meal-copy': (el) => {
    const d = ui.nutDate, prev = Store.foodOf(DateUtil.addDays(d, -1)).filter(f => f.meal === el.dataset.meal);
    prev.forEach(f => Store.addFood(d, f));
    rerender(); toast(`${el.dataset.meal}: dünden ${prev.length} kayıt kopyalandı`);
  },
  'fav-add': (el) => {
    const f = (S().favorites || []).find(x => x.id === el.dataset.id); if (!f) return;
    Store.addFood(foodDate(), Object.assign({}, f, { meal: autoMealNow() }));
    rerender(); toast(`${esc(f.name)} eklendi`);
  },
  'fav-del': (el) => { S().favorites = S().favorites.filter(x => x.id !== el.dataset.id); Store.save(); rerender(); },
  'barcode-open': (el) => openBarcodeModal(el.dataset.meal || autoMealNow()),
  'scan-start': () => startScanner()
});

let scanner = null;
function stopScanner() {
  if (scanner) { const s = scanner; scanner = null; try { s.stop().catch(() => {}).finally(() => { try { s.clear(); } catch (e) { /* yok */ } }); } catch (e) { /* yok */ } }
}
(() => { const orig = closeModal; closeModal = function () { stopScanner(); orig(); }; ACTIONS['modal-close'] = () => closeModal(); })();

function openBarcodeModal(meal) {
  ui.barcodeMeal = meal;
  openModal('Barkod ile Ekle', `
    <div id="scanArea" class="scan-area"><button class="scan-start" data-action="scan-start">${icon('camera')}<b>Kamerayla Tara</b><small>Barkodu çerçevenin içine getir</small></button></div>
    <form data-form="barcode" class="form inline-form">
      <div class="field grow"><label>veya barkod numarasını yaz</label><input name="code" inputmode="numeric" pattern="[0-9]{6,14}" required placeholder="Örn. 8690504010012"></div>
      <button class="btn btn-primary" type="submit">${icon('search')} Ara</button>
    </form>
    <p class="hint">Ürün bilgileri açık kaynak Open Food Facts veritabanından alınır; internet bağlantısı gerekir. Değerler 100 g üzerinden gelir.</p>`);
}
function loadScript(src) {
  return new Promise((res, rej) => {
    if (window.Html5Qrcode) { res(); return; }
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}
function startScanner() {
  const area = $('#scanArea'); if (!area) return;
  area.innerHTML = `<div class="scan-loading">${icon('camera')} Kamera açılıyor…</div>`;
  loadScript('js/vendor/html5-qrcode.min.js').then(() => {
    if (!$('#scanArea')) return;
    $('#scanArea').innerHTML = '<div id="scanVideo"></div>';
    const F = window.Html5QrcodeSupportedFormats;
    scanner = new window.Html5Qrcode('scanVideo', { formatsToSupport: [F.EAN_13, F.EAN_8, F.UPC_A, F.UPC_E, F.CODE_128], verbose: false });
    return scanner.start({ facingMode: 'environment' }, { fps: 12, qrbox: { width: 260, height: 140 } }, (code) => {
      stopScanner(); buzz(80); lookupBarcode(code);
    }, () => {});
  }).catch(() => {
    const a = $('#scanArea');
    if (a) a.innerHTML = `<div class="scan-loading">${icon('info')} Kamera açılamadı. İzin verdiğinden emin ol ya da numarayı elle gir.</div>`;
  });
}
function lookupBarcode(code) {
  code = String(code).replace(/\D/g, '');
  if (code.length < 6) { toast('Geçerli bir barkod gir', 'err'); return; }
  toast('Ürün aranıyor…', 'info');
  fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,product_name_tr,brands,nutriments`)
    .then(r => r.json())
    .then(j => {
      const p = j && j.product;
      const n = p && p.nutriments;
      if (!p || !n || j.status === 0) { toast('Ürün bulunamadı. Değerleri elle girebilirsin.', 'err'); openFoodModal(ui.barcodeMeal); return; }
      const kcal = n['energy-kcal_100g'] != null ? +n['energy-kcal_100g'] : n.energy_100g != null ? +n.energy_100g / 4.184 : 0;
      const name = [(p.product_name_tr || p.product_name || 'Ürün').trim(), p.brands ? `(${String(p.brands).split(',')[0].trim()})` : ''].filter(Boolean).join(' ').slice(0, 50);
      const base = { label: name, per: 100, unitShort: 'g', kcal, protein: +n.proteins_100g || 0, carbs: +n.carbohydrates_100g || 0, fat: +n.fat_100g || 0 };
      openFoodModal(ui.barcodeMeal, { name: `${name} (100 g)`, unit: 'Miktar (g)', portion: 100, base, kcal: Math.round(kcal), protein: round1(base.protein), carbs: round1(base.carbs), fat: round1(base.fat) });
      toast('Ürün bulundu ✓');
    })
    .catch(() => toast('Bağlantı hatası. İnternetini kontrol et.', 'err'));
}
FORMS.barcode = (d) => { stopScanner(); lookupBarcode(d.code); };

/* =========================================================
   7) ANDROID BİLDİRİMLERİ (uygulama kapalıyken de)
   ========================================================= */
function syncReminders() {
  if (!window.FitBridge || !window.FitBridge.setReminders) return;
  try {
    const st = S().settings;
    const [h, m] = String(st.workoutTime || '18:00').split(':').map(Number);
    const mask = Store.programSchedule(st.program, DateUtil.weekStart()).map(k => (k ? '1' : '0')).join('');
    window.FitBridge.setReminders(!!st.notifyWater, !!st.notifyWorkout, h || 18, m || 0, mask);
  } catch (e) { /* isteğe bağlı */ }
}

/* Kayıt sonrası: widget + bildirim + rozet kontrolü */
(() => {
  const orig = onStoreSaved;
  let t = null;
  onStoreSaved = function () {
    orig();
    clearTimeout(t);
    t = setTimeout(() => { syncReminders(); checkBadges(); }, 700);
  };
})();

/* Sayfa çizildikten sonra çalışacak işler */
(() => {
  const orig = render;
  render = function (keep) {
    orig(keep);
    if (currentPage === 'body') renderPhotos();
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => { checkBadges(true); syncReminders(); }, 1200);
});
