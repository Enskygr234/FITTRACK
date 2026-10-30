/* =========================================================
   FITTRACK — Uygulama mantığı
   Yönlendirme, sayfalar, olaylar, antrenman sistemi
   ========================================================= */
'use strict';

/* ---------------- Yardımcılar ---------------- */
const S = () => Store.state;
const $ = (sel, root = document) => root.querySelector(sel);
const fmt = Charts.fmt;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (name, cls = '') =>
  `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const IN_APP = /; wv\)/.test(navigator.userAgent); // Android WebView içinde mi?
const pct = (v, m) => m ? Math.round((v / m) * 100) : 0;

function fmtDur(sec) {
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} dk`;
  return `${Math.floor(m / 60)} sa ${m % 60} dk`;
}
function clock(sec) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  const mm = String(m).padStart(2, '0'), ss = String(s).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
function initials(name) {
  const p = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!p.length) return icon('user');
  return esc((p[0][0] + (p[1] ? p[1][0] : '')).toLocaleUpperCase('tr-TR'));
}
function dayLabel(key) {
  const t = DateUtil.today();
  if (key === t) return 'Bugün';
  if (key === DateUtil.addDays(t, -1)) return 'Dün';
  return DateUtil.format(key);
}
const typeBadge = (type) => {
  const t = TPL_TYPES[type];
  return t ? `<span class="badge ${t.badge}">${t.label}</span>` : '<span class="badge">Serbest</span>';
};
const level = () => {
  const n = S().sessions.length;
  return { lvl: 1 + Math.floor(n / 8), progress: (n % 8) / 8, left: 8 - (n % 8) };
};
const thumb = (ex, cls = '') => `<div class="thumb photo ${cls} t-${ex.region}"><img src="${ex.thumb}" alt="" loading="lazy" decoding="async"></div>`;
/* Ortak egzersiz arama/filtreleme (kütüphane ve seçici) */
const trLower = (x) => String(x).toLocaleLowerCase('tr-TR');
function filterExercises({ q = '', group = 'Tümü', equip = '' } = {}) {
  const words = trLower(q).trim().split(/\s+/).filter(Boolean);
  return EXERCISES.filter(e => (group === 'Tümü' || e.group === group) && (!equip || e.equipment.startsWith(equip)) &&
    (!words.length || words.every(w => {
      const hay = `${trLower(e.name)} ${trLower(e.alias || '')} ${trLower(e.group)} ${trLower(e.equipment)} ${e.muscles.map(m => trLower(MUSCLE_NAMES[m])).join(' ')}`;
      return hay.includes(w);
    })));
}
const regionBadge = (e) => e.region === 'upper' ? '<span class="badge badge-red">Üst</span>' : e.region === 'lower' ? '<span class="badge badge-blue">Alt</span>' : `<span class="badge badge-violet">${e.group}</span>`;
const photoBg = (src, cls = '') => `<div class="photo-bg ${cls}" style="background-image:url('${src}')" aria-hidden="true"></div>`;
const emptyState = (ic, title, text, btn = '') => `<div class="empty">${icon(ic)}<b>${title}</b><p>${text}</p>${btn}</div>`;

/* ---------------- Navigasyon ---------------- */
const NAV = [
  { id: 'home', label: 'Ana Sayfa', icon: 'home' },
  { id: 'workout', label: 'Antrenman', icon: 'dumbbell' },
  { id: 'programs', label: 'Programlar', icon: 'calendar' },
  { id: 'nutrition', label: 'Beslenme', icon: 'apple' },
  { id: 'protein', label: 'Protein Takibi', icon: 'shaker' },
  { id: 'calories', label: 'Kalori Takibi', icon: 'flame' },
  { id: 'water', label: 'Su Takibi', icon: 'drop' },
  { id: 'stats', label: 'İstatistikler', icon: 'chart' },
  { id: 'library', label: 'Egzersiz Kütüphanesi', icon: 'book' },
  { id: 'profile', label: 'Profil', icon: 'user' },
  { id: 'settings', label: 'Ayarlar', icon: 'settings' }
];
const BOTTOM_NAV = ['home', 'workout', 'nutrition', 'stats'];
const TITLES = Object.fromEntries(NAV.map(n => [n.id, n.label]));
TITLES.exercise = 'Egzersiz Detayı';
TITLES.programs = 'Antrenman Programları';

const ui = {
  nutDate: DateUtil.today(), statsRange: 'week', libGroup: 'Tümü', libQuery: '',
  progTpl: 'upperA', libLimit: 40, libEquip: '', pickQuery: '', pickGroup: 'Tümü', pickTarget: '', openSession: null, histAll: false, tdee: null, foodModal: null
};

function parseRoute() {
  const h = location.hash.replace(/^#\/?/, '');
  const [page, ...rest] = h.split('/');
  return { page: page || 'home', param: rest.length ? decodeURIComponent(rest.join('/')) : null };
}
const go = (page) => { location.hash = `#/${page}`; };

let currentPage = null;
function render(keepScroll = false) {
  const { page, param } = parseRoute();
  const key = ROUTES[page] ? page : 'home';
  const view = $('#view');
  const y = window.scrollY;
  const same = keepScroll && currentPage === key;
  view.innerHTML = `<div class="page page-${key}${same ? '' : ' enter'}">${ROUTES[key](param)}</div>`;
  updateChrome(key);
  window.scrollTo(0, same ? y : 0);
  currentPage = key;
  tickSession();
}
const rerender = () => render(true);

function buildNav() {
  $('#nav').innerHTML = NAV.map(n =>
    `<a href="#/${n.id}" class="nav-link" data-page="${n.id}">${icon(n.icon)}<span>${n.label}</span></a>`).join('');
  $('#bottomNav').innerHTML = BOTTOM_NAV.map(id => {
    const n = NAV.find(x => x.id === id);
    return `<a href="#/${id}" class="bn-item" data-page="${id}">${icon(n.icon)}<span>${n.label.split(' ')[0]}</span></a>`;
  }).join('') + `<button class="bn-item" data-action="open-drawer">${icon('grid')}<span>Menü</span></button>`;
  document.querySelectorAll('[data-icon]').forEach(el => { el.outerHTML = icon(el.dataset.icon); });
}

function updateChrome(page) {
  const active = page === 'exercise' ? 'library' : page;
  document.querySelectorAll('[data-page]').forEach(a => a.classList.toggle('active', a.dataset.page === active));
  $('#topbarTitle').innerHTML = page === 'home'
    ? `<span class="tb-brand">FIT<b>TRACK</b></span>` : esc(TITLES[page] || '');
  $('#topbarDate').textContent = DateUtil.format(DateUtil.today());
  const p = S().profile;
  $('#topbarAvatar').innerHTML = initials(p.name);
  const lv = level();
  const w = Store.currentWeight();
  $('#sidebarFoot').innerHTML = `
    <div class="motto"><span class="motto-line"></span>Daha iyi bir sen<br>mümkün!</div>
    <a href="#/profile" class="mini-user">
      <span class="avatar sm">${initials(p.name)}</span>
      <span><b>${esc(p.name || 'Sporcu')}</b><small>Seviye ${lv.lvl}${w ? ` · ${fmt(w)} kg` : ''}</small></span>
    </a>`;
  document.title = `${TITLES[page] || 'FITTRACK'} · FITTRACK`;
}

function openDrawer() { document.body.classList.add('drawer-open'); }
function closeDrawer() { document.body.classList.remove('drawer-open'); }

/* ---------------- Bildirim / modal ---------------- */
function toast(msg, type = 'ok') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `${icon(type === 'err' ? 'info' : type === 'info' ? 'bell' : 'check')}<span>${msg}</span>`;
  $('#toastWrap').appendChild(el);
  setTimeout(() => el.classList.add('out'), 2600);
  setTimeout(() => el.remove(), 3000);
}

let pendingConfirm = null;
function openModal(title, body, { closable = true, wide = false } = {}) {
  $('#modalRoot').innerHTML = `
    <div class="modal-backdrop" ${closable ? 'data-action="modal-bg"' : ''}>
      <div class="modal${wide ? ' modal-wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <div class="modal-head"><h3>${title}</h3>${closable ? `<button class="btn-icon" data-action="modal-close" aria-label="Kapat">${icon('x')}</button>` : ''}</div>
        <div class="modal-body">${body}</div>
      </div>
    </div>`;
  document.body.classList.add('modal-open');
  const first = $('#modalRoot input:not([type=hidden]), #modalRoot select, #modalRoot textarea');
  if (first && window.innerWidth > 760) setTimeout(() => first.focus(), 50);
}
function closeModal() {
  $('#modalRoot').innerHTML = '';
  document.body.classList.remove('modal-open');
  pendingConfirm = null;
}
function confirmBox(title, text, yes, cb, danger = true) {
  openModal(title, `<p class="muted">${text}</p>
    <div class="modal-actions"><button class="btn btn-ghost" data-action="modal-close">Vazgeç</button>
    <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-action="confirm-yes">${yes}</button></div>`);
  pendingConfirm = cb;
}

/* ---------------- Ses / titreşim ---------------- */
let audioCtx = null;
function beep() {
  if (!S().settings.sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25, 0.5].forEach((t, i) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = 'sine'; o.frequency.value = i === 2 ? 1046 : 784;
      g.gain.setValueAtTime(0.0001, audioCtx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.3, audioCtx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + t + 0.2);
      o.connect(g).connect(audioCtx.destination);
      o.start(audioCtx.currentTime + t); o.stop(audioCtx.currentTime + t + 0.22);
    });
  } catch (e) { /* ses desteklenmiyor */ }
}
function buzz(p = [200, 100, 200]) { if (S().settings.vibrate && navigator.vibrate) navigator.vibrate(p); }

/* ---------------- Dinlenme sayacı ---------------- */
const Rest = {
  end: 0, total: 0, timer: null,
  start(sec) {
    sec = +sec || S().settings.restDefault;
    this.total = sec; this.end = Date.now() + sec * 1000;
    $('#restTimer').hidden = false;
    document.body.classList.add('resting');
    clearInterval(this.timer);
    this.timer = setInterval(() => this.tick(), 250);
    this.tick();
  },
  add(sec) {
    if (!this.timer) return;
    this.end = Math.max(Date.now() + 1000, this.end + sec * 1000);
    this.total = Math.max(this.total + sec, 1);
    this.tick();
  },
  stop() {
    clearInterval(this.timer); this.timer = null;
    $('#restTimer').hidden = true;
    document.body.classList.remove('resting');
  },
  tick() {
    const left = Math.max(0, Math.ceil((this.end - Date.now()) / 1000));
    $('#rtTime').textContent = clock(left);
    const r = 22, c = 2 * Math.PI * r, p = clamp(left / this.total, 0, 1);
    $('#rtRing').innerHTML = `<svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="${r}" fill="none" stroke="var(--ring-track)" stroke-width="5"/>
      <circle cx="26" cy="26" r="${r}" fill="none" stroke="var(--red)" stroke-width="5" stroke-linecap="round"
      stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p)}" transform="rotate(-90 26 26)"/></svg>${icon('timer')}`;
    if (left <= 0) {
      this.stop(); beep(); buzz();
      toast('Dinlenme bitti! Sıradaki sete geç 💪', 'info');
    }
  }
};

/* Aktif antrenman saati */
function tickSession() {
  const a = S().active;
  const el = $('#sessionClock');
  if (a && el) el.textContent = clock(Math.floor((Date.now() - a.startedAt) / 1000));
}

/* ---------------- Ortak parçalar ---------------- */
function statCard({ ic, label, value, sub = '', bar = '', to = '', tone = 'red' }) {
  return `<${to ? `button data-action="go" data-to="${to}"` : 'div'} class="card stat-card tone-${tone}">
    <span class="stat-icon">${icon(ic)}</span>
    <span class="stat-label">${label}</span>
    <span class="stat-value">${value}</span>
    ${sub ? `<span class="stat-sub">${sub}</span>` : ''}${bar}
  </${to ? 'button' : 'div'}>`;
}
function pageHead(title, sub = '', actions = '') {
  return `<div class="page-head"><div><h1>${title}</h1>${sub ? `<p class="muted">${sub}</p>` : ''}</div>${actions ? `<div class="head-actions">${actions}</div>` : ''}</div>`;
}
function macroLegend(t) {
  const total = t.carbs * 4 + t.protein * 4 + t.fat * 9;
  const row = (c, name, g, kcal) => `<li><i style="background:${c}"></i><span>${name}</span><b>${fmt(Math.round(g))} g</b><em>${total ? Math.round((kcal / total) * 100) : 0}%</em></li>`;
  return `<ul class="legend">
    ${row('var(--blue)', 'Karbonhidrat', t.carbs, t.carbs * 4)}
    ${row('var(--violet)', 'Protein', t.protein, t.protein * 4)}
    ${row('var(--orange)', 'Yağ', t.fat, t.fat * 9)}</ul>`;
}
function kcalRing(t, size = 170) {
  return Charts.macroRing({
    size,
    segments: [{ value: t.carbs * 4, color: 'var(--blue)' }, { value: t.protein * 4, color: 'var(--violet)' }, { value: t.fat * 9, color: 'var(--orange)' }],
    center: `<b class="rc-big">${fmt(t.kcal)}</b><span>/ ${fmt(S().settings.kcalGoal)} kcal</span>`
  });
}
function lastNDays(n, fn) {
  const t = DateUtil.today();
  return Array.from({ length: n }, (_, i) => {
    const d = DateUtil.addDays(t, i - n + 1);
    return { label: DAY_SHORT[DateUtil.weekday(d)], date: d, value: fn(d) };
  });
}

/* =========================================================
   SAYFALAR
   ========================================================= */

/* 1) Ana Sayfa */
function pageHome() {
  const s = S(), t = DateUtil.today();
  const tot = Store.totals(t), water = Store.waterTotal(t);
  const plan = Store.weekPlan();
  const doneDays = plan.filter(p => p.done).length;
  const today = plan.find(p => p.date === t);
  const todayTpl = today && today.tpl ? s.templates[today.tpl] : null;
  const last = s.sessions[s.sessions.length - 1];
  const name = s.profile.name || 'Sporcu';
  const weekKcal = plan.map(p => ({ label: DAY_SHORT[p.dayIdx], value: Store.totals(p.date).kcal }));

  let todayCard;
  if (s.active) {
    todayCard = `<div class="tw-state"><span class="badge badge-red pulse">Devam ediyor</span><h3>${esc(s.active.title)}</h3>
      <p class="muted">${s.active.exercises.length} egzersiz · <span id="sessionClock">00:00</span></p></div>
      <button class="btn btn-primary btn-block" data-action="go" data-to="workout">${icon('play')} Antrenmana Dön</button>`;
  } else if (todayTpl && today.done) {
    todayCard = `<div class="tw-state">${icon('trophy', 'ic-xl')}<h3>Bugünkü antrenman tamamlandı</h3><p class="muted">Harika iş! Toparlanmaya ve beslenmene odaklan.</p></div>
      <button class="btn btn-ghost btn-block" data-action="go" data-to="stats">İlerlemeni Gör</button>`;
  } else if (todayTpl) {
    todayCard = `<div class="tw-banner">${photoBg(tplPhoto(todayTpl))}<div class="tw-banner-text"><h3>${esc(todayTpl.name)}</h3><p>${esc(todayTpl.focus)}</p></div>${typeBadge(todayTpl.type)}</div>
      <ul class="tw-list">${todayTpl.items.slice(0, 4).map(it => `<li><span>${esc(EX_BY_ID[it.ex].name)}</span><em>${it.sets} × ${esc(it.reps)}</em></li>`).join('')}
      ${todayTpl.items.length > 4 ? `<li class="muted">+${todayTpl.items.length - 4} egzersiz daha</li>` : ''}</ul>
      <button class="btn btn-primary btn-block" data-action="start-workout" data-tpl="${today.tpl}">${icon('play')} Antrenmanı Başlat</button>`;
  } else {
    const next = Store.nextWorkout();
    todayCard = `<div class="tw-state">${icon('moon', 'ic-xl')}<h3>Bugün dinlenme günü</h3>
      <p class="muted">${next ? `Sıradaki: <b>${esc(s.templates[next.tpl].name)}</b> · ${DAY_NAMES[next.dayIdx]}` : 'Kaslar dinlenirken büyür.'}</p></div>
      <button class="btn btn-ghost btn-block" data-action="go" data-to="workout">Yine de Antrenman Yap</button>`;
  }

  return `
  <section class="greet">
    <div><h1>Merhaba ${esc(name)} <span class="wave">👋</span></h1><p class="muted">Hedeflerine bir adım daha yaklaşıyorsun!</p></div>
    ${s.demo ? '<span class="badge badge-gray" title="Bu veriler örnek amaçlıdır">Demo veri</span>' : ''}
  </section>

  <div class="grid home-top">
    <div class="card hero">
      ${photoBg('assets/img/ex/bench-press-1.jpg', 'hero-photo')}
      <div class="hero-text">
        <h2>Disiplin<br>başarıyı <span>getirir.</span></h2>
        <span class="accent-line"></span>
        <button class="btn btn-primary" data-action="go" data-to="workout">${icon('play')} Antrenmana Başla</button>
      </div>
    </div>
    <div class="card week-card">
      <div class="card-head"><span class="card-title">Haftalık Antrenman</span><a href="#/programs" class="card-link">Program ${icon('right')}</a></div>
      <div class="big-num">${doneDays}<small>/${plan.filter(p => p.tpl).length}</small></div>
      ${Charts.progress(doneDays, plan.filter(p => p.tpl).length || 1)}
      <div class="week-dots">${plan.map(p => `
        <div class="wd${p.tpl ? ' is-plan' : ''}${p.done ? ' is-done' : ''}${p.date === t ? ' is-today' : ''}" title="${DAY_NAMES[p.dayIdx]}${p.tpl ? ' · ' + esc(s.templates[p.tpl].name) : ''}">
          <span>${DAY_SHORT[p.dayIdx]}</span><i></i></div>`).join('')}</div>
    </div>
  </div>

  <div class="grid g-4">
    ${statCard({ ic: 'flame', label: 'Aktif Kalori', value: `${fmt(Store.burnedOn(t))} <small>kcal</small>`, sub: 'Bugün antrenmanla (tahmini)', to: 'calories' })}
    ${statCard({ ic: 'dumbbell', label: 'Bugünkü Egzersiz', value: todayTpl ? todayTpl.items.length : 0, sub: todayTpl ? esc(todayTpl.name) : 'Dinlenme günü', to: 'workout', tone: 'green' })}
    ${statCard({ ic: 'drop', label: 'Su Tüketimi', value: `${fmt(water / 1000)} <small>L</small>`, sub: `Hedef: ${fmt(s.settings.waterGoal / 1000)} L`, bar: Charts.progress(water, s.settings.waterGoal, 'blue'), to: 'water', tone: 'blue' })}
    ${statCard({ ic: 'shaker', label: 'Protein', value: `${fmt(Math.round(tot.protein))} <small>g</small>`, sub: `Hedef: ${s.settings.proteinGoal} g`, bar: Charts.progress(tot.protein, s.settings.proteinGoal, 'violet'), to: 'protein', tone: 'violet' })}
  </div>

  <div class="grid home-mid">
    <div class="card">
      <div class="card-head"><span class="card-title">Günlük Kalori</span><a href="#/nutrition" class="card-link">Beslenme ${icon('right')}</a></div>
      <div class="ring-row">${kcalRing(tot, 150)}${macroLegend(tot)}</div>
    </div>
    <div class="card">
      <div class="card-head"><span class="card-title">Haftalık Kalori</span><a href="#/stats" class="card-link">Detaylar ${icon('right')}</a></div>
      ${Charts.bars(weekKcal, { height: 170, goal: s.settings.kcalGoal, highlight: DateUtil.weekday(t), empty: 'Bu hafta henüz besin kaydı yok' })}
    </div>
    <div class="card today-workout">
      <div class="card-head"><span class="card-title">Bugünün Antrenmanı</span><span class="muted sm">${DAY_NAMES[DateUtil.weekday(t)]}</span></div>
      ${todayCard}
    </div>
  </div>

  <div class="grid g-2">
    <div class="card">
      <div class="card-head"><span class="card-title">Son Antrenman</span><a href="#/workout" class="card-link">Geçmiş ${icon('right')}</a></div>
      ${last ? `<div class="last-w">
          ${last.exercises[0] && EX_BY_ID[last.exercises[0].ex] ? thumb(EX_BY_ID[last.exercises[0].ex]) : `<div class="thumb">${icon('dumbbell')}</div>`}
          <div class="li-body"><b>${esc(last.title)}</b><span class="muted">${dayLabel(last.date)} · ${fmtDur(last.durationSec)}</span></div>
          <span class="badge badge-green">Tamamlandı</span></div>
          <div class="kv-row"><div><small>Set</small><b>${last.setCount}</b></div><div><small>Hacim</small><b>${fmt(last.volume)} kg</b></div><div><small>Kalori</small><b>${fmt(last.burned)} kcal</b></div></div>`
        : emptyState('history', 'Henüz antrenman yok', 'İlk antrenmanını tamamladığında burada göreceksin.')}
    </div>
    <div class="card promo">
      ${photoBg('assets/img/ex/pull-up-1.jpg', 'promo-photo')}
      <div class="promo-text"><h3>Hayalindeki vücuda<br>bir adım daha yakınsın!</h3><p class="muted">Programını takip et, ağırlıklarını kaydet, gelişimini gör.</p>
      <button class="btn btn-primary btn-sm" data-action="go" data-to="programs">Programı İncele ${icon('right')}</button></div>
    </div>
  </div>`;
}

/* 2) Antrenman (aktif oturum + geçmiş) */
function pageWorkout() {
  const s = S();
  if (s.active) return activeWorkoutView(s.active);
  const today = Store.todayPlan();
  const tpl = today && today.tpl ? s.templates[today.tpl] : null;
  const next = Store.nextWorkout();
  const hist = [...s.sessions].reverse();
  const shown = ui.histAll ? hist : hist.slice(0, 8);

  const planCard = tpl ? `
      <div class="tw-banner lg">${photoBg(tplPhoto(tpl))}<div class="tw-banner-text"><span class="eyebrow">Bugün · ${DAY_NAMES[today.dayIdx]}</span><h2>${esc(tpl.name)}</h2><p>${esc(tpl.focus)} · ${tpl.items.length} egzersiz</p></div>${typeBadge(tpl.type)}</div>
      ${today.done ? '<div class="note ok">' + icon('check') + '<span>Bugünkü antrenmanı tamamladın. İstersen ek bir antrenman başlatabilirsin.</span></div>' : ''}
      <div class="ex-list">${tpl.items.map((it, i) => {
        const ex = EX_BY_ID[it.ex];
        return `<a href="#/exercise/${ex.id}" class="list-item">${thumb(ex)}<div class="li-body"><span class="li-title">${i + 1}. ${esc(ex.name)}</span><span class="li-sub">${it.sets} set × ${esc(it.reps)} tekrar · ${ex.rest} sn dinlenme</span></div>${icon('right', 'li-end')}</a>`;
      }).join('')}</div>
      <button class="btn btn-primary btn-block btn-lg" data-action="start-workout" data-tpl="${today.tpl}">${icon('play')} Tüm Antrenmanı Başlat</button>`
    : `<div class="tw-state">${icon('moon', 'ic-xl')}<h2>Bugün dinlenme günü</h2>
       <p class="muted">${next ? `Sıradaki antrenman: <b>${esc(s.templates[next.tpl].name)}</b> — ${DAY_NAMES[next.dayIdx]}, ${DateUtil.format(next.date, { year: false })}` : 'Toparlanma da antrenmanın bir parçası.'}</p>
       ${next ? `<button class="btn btn-ghost" data-action="start-workout" data-tpl="${next.tpl}">${icon('play')} ${esc(s.templates[next.tpl].name)} — Şimdi Başlat</button>` : ''}</div>`;

  return `
  ${pageHead('Antrenman', 'Setlerini, tekrarlarını ve ağırlıklarını kaydet.')}
  <div class="grid workout-grid">
    <div class="card">${planCard}</div>
    <div class="col">
      <div class="card">
        <div class="card-head"><span class="card-title">Hızlı Başlat</span></div>
        <div class="quick-tpls">
          ${Store.templateKeys().filter(k => s.templates[k].items.length).map(k => `<button class="qt t-${s.templates[k].type}" data-action="start-workout" data-tpl="${k}">${photoBg(tplPhoto(s.templates[k]), 'qt-photo')}
            <span class="qt-ic">${icon(s.templates[k].type === 'lower' || s.templates[k].type === 'legs' ? 'g_leg' : s.templates[k].type === 'upper' ? 'g_chest' : 'dumbbell')}</span>
            <b>${esc(s.templates[k].name)}</b><small>${s.templates[k].items.length} egzersiz</small></button>`).join('')}
          <button class="qt qt-free" data-action="start-workout" data-tpl=""><span class="qt-ic">${icon('plus')}</span><b>Serbest Antrenman</b><small>Kendin oluştur</small></button>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><span class="card-title">Bu Hafta</span><a href="#/programs" class="card-link">Program ${icon('right')}</a></div>
        <div class="week-strip">${Store.weekPlan().map(p => `<div class="ws${p.tpl ? ' t-' + s.templates[p.tpl].type : ''}${p.done ? ' is-done' : ''}${p.date === DateUtil.today() ? ' is-today' : ''}">
          <small>${DAY_SHORT[p.dayIdx]}</small><b>${p.tpl ? (TPL_TYPES[s.templates[p.tpl].type] || TPL_TYPES.full).short : '—'}</b>${p.done ? icon('check') : ''}</div>`).join('')}</div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-head"><span class="card-title">${icon('history')} Antrenman Geçmişi</span><span class="muted sm">${hist.length} antrenman</span></div>
    ${hist.length ? `<div class="hist">${shown.map(historyItem).join('')}</div>
      ${hist.length > 8 ? `<button class="btn btn-ghost btn-block" data-action="hist-all">${ui.histAll ? 'Daha az göster' : `Tümünü göster (${hist.length})`}</button>` : ''}`
      : emptyState('history', 'Geçmiş boş', 'Tamamladığın antrenmanlar tarih, süre ve hacim bilgisiyle burada listelenir.')}
  </div>`;
}

function historyItem(x) {
  const open = ui.openSession === x.id;
  const d = DateUtil.parse(x.date);
  return `<div class="hist-item${open ? ' open' : ''}">
    <button class="hist-head" data-action="session-toggle" data-id="${x.id}" aria-expanded="${open}">
      <div class="hist-date"><b>${d.getDate()}</b><span>${MONTHS_SHORT[d.getMonth()]}</span></div>
      <div class="li-body"><span class="li-title">${esc(x.title)}</span><span class="li-sub">${fmtDur(x.durationSec)} · ${x.setCount} set · ${fmt(x.volume)} kg hacim</span></div>
      ${typeBadge(x.type)}${icon('right', 'chev')}
    </button>
    ${open ? `<div class="hist-body">
      ${x.exercises.map(e => {
        const ex = EX_BY_ID[e.ex] || { name: e.ex };
        return `<div class="hb-row"><a href="#/exercise/${e.ex}">${esc(ex.name)}${e.ss ? ' <span class="badge badge-violet">SS</span>' : ''}</a><span>${e.sets.map(st => `${st.t === 'w' ? 'I:' : st.t === 'd' ? 'D:' : ''}${st.kg ? `${fmt(st.kg)}×${st.reps}` : `${st.reps} tkr`}${st.rpe ? ` @${st.rpe}` : ''}`).join(' · ')}</span></div>${e.note ? `<div class="hb-note">${esc(e.note)}</div>` : ''}`;
      }).join('')}
      ${x.note ? `<div class="hb-note">${icon('edit')} ${esc(x.note)}</div>` : ''}
      <div class="hb-foot"><span class="muted sm">${DateUtil.format(x.date)} · ${DateUtil.time(x.startedAt)} · ~${fmt(x.burned)} kcal</span>
      <button class="btn btn-ghost btn-sm danger-text" data-action="session-delete" data-id="${x.id}">${icon('trash')} Sil</button></div>
    </div>` : ''}
  </div>`;
}

function activeWorkoutView(a) {
  const work = (st) => st.t !== 'w';
  const total = a.exercises.reduce((n, e) => n + e.sets.length, 0);
  const done = a.exercises.reduce((n, e) => n + e.sets.filter(st => st.done).length, 0);
  const vol = a.exercises.reduce((v, e) => v + e.sets.filter(st => st.done && work(st)).reduce((x, st) => x + (+st.kg || 0) * (+st.reps || 0), 0), 0);
  const blocks = a.exercises.map((e, i) => exerciseBlock(e, i) + (e.ss && i < a.exercises.length - 1
    ? `<div class="ss-link"><span>${icon('refresh')} Süperset — iki hareketi dinlenmeden art arda yap</span><button class="btn-icon sm" data-action="ss-toggle" data-ei="${i}" aria-label="Süperseti kaldır">${icon('x')}</button></div>` : '')).join('');
  return `
  <div class="page-head">
    <div><span class="eyebrow pulse-dot">Antrenman devam ediyor</span><h1>${esc(a.title)}</h1></div>
    <div class="head-actions"><div class="session-clock">${icon('clock')}<span id="sessionClock">00:00</span></div></div>
  </div>
  <div class="card session-bar">
    <div class="sb-stats">
      <div><small>Tamamlanan Set</small><b>${done}<span>/${total}</span></b></div>
      <div><small>Hacim</small><b>${fmt(vol)} <span>kg</span></b></div>
      <div><small>Egzersiz</small><b>${a.exercises.length}</b></div>
    </div>
    ${Charts.progress(done, total)}
    <div class="sb-actions">
      <button class="btn btn-ghost btn-sm" data-action="ex-picker">${icon('plus')} Egzersiz Ekle</button>
      <button class="btn btn-ghost btn-sm" data-action="rest-start" data-sec="${S().settings.restDefault}">${icon('timer')} Dinlenme</button>
      <button class="btn btn-ghost btn-sm" data-action="go" data-to="tools">${icon('calc')} Araçlar</button>
      <button class="btn btn-ghost btn-sm danger-text" data-action="cancel-workout">${icon('x')} İptal</button>
    </div>
  </div>
  ${a.exercises.length ? blocks : `<div class="card">${emptyState('dumbbell', 'Henüz egzersiz eklenmedi', 'Kütüphaneden egzersiz ekleyerek antrenmanını oluştur.', `<button class="btn btn-primary" data-action="ex-picker">${icon('plus')} Egzersiz Ekle</button>`)}</div>`}
  <div class="card">
    <div class="card-head"><span class="card-title">${icon('edit')} Antrenman Notu</span><span class="muted sm">İsteğe bağlı</span></div>
    <textarea class="note-input" data-input="session-note" rows="2" maxlength="500" placeholder="Bugün nasıl hissettin? Ağrı, enerji, uyku…">${esc(a.note || '')}</textarea>
  </div>
  <div class="finish-bar"><button class="btn btn-primary btn-block btn-lg" data-action="finish-workout">${icon('check')} Antrenmanı Bitir ve Kaydet</button></div>`;
}

/* Kademeli yüklenme önerisi: geçen antrenmanda tüm çalışma setlerinde hedefin üst sınırına ulaşıldıysa ağırlık artır */
function topReps(target) {
  const m = String(target).match(/(\d+)\s*-\s*(\d+)/);
  if (m) return +m[2];
  const n = parseInt(target, 10);
  return /sn|dk/.test(String(target)) ? 0 : (n || 0);
}
function overloadSuggestion(ex, e, last) {
  if (!last || ex.bodyweight) return null;
  const upper = topReps(e.target);
  const sets = last.sets.filter(st => st.t !== 'w' && st.t !== 'd');
  if (!upper || !sets.length) return null;
  const kg = Math.max(...sets.map(st => st.kg));
  if (!kg) return null;
  if (!sets.every(st => st.reps >= upper)) return null;
  const inc = ex.region === 'lower' && /barbell|makine/i.test(ex.equipment) ? 5 : 2.5;
  return { kg: kg + inc, from: kg };
}
function setLabel(st, idx) {
  if (st.t === 'w') return 'I';
  if (st.t === 'd') return 'D';
  if (st.t === 'f') return 'B';
  return String(idx);
}

function exerciseBlock(e, ei) {
  const ex = EX_BY_ID[e.ex];
  const last = Store.lastPerformance(e.ex);
  const doneN = e.sets.filter(st => st.done).length;
  const complete = e.sets.length && doneN === e.sets.length;
  const sug = overloadSuggestion(ex, e, last);
  const firstPending = e.sets.find(st => !st.done && st.t !== 'w');
  const showSug = sug && firstPending && (+firstPending.kg || 0) < sug.kg;
  let n = 0, wi = 0;
  return `<div class="card ex-block${complete ? ' is-complete' : ''}${e.ss ? ' is-ss' : ''}">
    <div class="ex-head">
      ${thumb(ex)}
      <div class="li-body"><a class="li-title" href="#/exercise/${ex.id}">${esc(ex.name)}</a>
        <span class="li-sub">Hedef: ${e.sets.filter(st => st.t !== 'w').length} set × ${esc(e.target)} · ${doneN}/${e.sets.length} tamamlandı${last ? ` · Son: ${DateUtil.formatShort(last.date)}` : ''}</span></div>
      ${complete ? `<span class="badge badge-green">${icon('check')} Bitti</span>` : ''}
      <button class="btn-icon sm" data-action="ex-menu" data-ei="${ei}" aria-label="Egzersiz seçenekleri"><svg class="ic" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg></button>
    </div>
    ${showSug ? `<div class="ex-suggest">${icon('zap')}<span>Geçen sefer tüm setlerde hedefe ulaştın. <b>${fmt(sug.kg)} kg</b> dene!</span><button class="btn btn-sm btn-primary" data-action="apply-suggest" data-ei="${ei}" data-kg="${sug.kg}">Uygula</button></div>` : ''}
    ${e.note ? `<div class="ex-note">${icon('edit')}<span>${esc(e.note)}</span></div>` : ''}
    <div class="set-table">
      <div class="set-row set-head"><span>Set</span><span>Önceki</span><span>kg</span><span>Tekrar</span><span>✓</span></div>
      ${e.sets.map((st, si) => {
        const isWork = st.t !== 'w';
        if (isWork) n++; else wi++;
        const prev = last && isWork ? last.sets[n - 1] : null;
        return `<div class="set-row${st.done ? ' done' : ''}${st.t ? ' t-' + st.t : ''}">
          <button class="set-no" data-action="set-opts" data-ei="${ei}" data-si="${si}" aria-label="Set seçenekleri">${setLabel(st, n)}${st.rpe ? `<sup>${st.rpe}</sup>` : ''}</button>
          <span class="set-prev">${prev ? (prev.kg ? `${fmt(prev.kg)} × ${prev.reps}` : `${prev.reps} tkr`) : st.t === 'w' ? 'Isınma' : '—'}</span>
          <input type="number" inputmode="decimal" step="0.5" min="0" max="999" value="${esc(st.kg)}" placeholder="${ex.bodyweight ? 'VA' : '0'}" data-set data-ei="${ei}" data-si="${si}" data-f="kg" aria-label="Set ${si + 1} ağırlık">
          <input type="number" inputmode="numeric" step="1" min="0" max="999" value="${esc(st.reps)}" data-set data-ei="${ei}" data-si="${si}" data-f="reps" aria-label="Set ${si + 1} tekrar">
          <button class="set-check" data-action="set-toggle" data-ei="${ei}" data-si="${si}" aria-label="Set ${si + 1} tamamla" aria-pressed="${st.done}">${icon('check')}</button>
        </div>`;
      }).join('')}
    </div>
    <div class="ex-foot">
      <button class="btn btn-ghost btn-sm" data-action="set-add" data-ei="${ei}">${icon('plus')} Set</button>
      <button class="btn btn-ghost btn-sm" data-action="set-remove" data-ei="${ei}" ${e.sets.length <= 1 ? 'disabled' : ''}>${icon('minus')} Set</button>
      <button class="btn btn-ghost btn-sm" data-action="rest-start" data-sec="${ex.rest}">${icon('timer')} ${ex.rest} sn</button>
      <button class="btn btn-ghost btn-sm" data-action="ex-menu" data-ei="${ei}">Isınma · Dropset · Süperset</button>
    </div>
  </div>`;
}

/* 3) Antrenman Programları */
function programDaysText(sched) {
  const d = sched.map((k, i) => (k ? DAY_SHORT[i] : null)).filter(Boolean);
  return d.length ? `${d.length} gün · ${d.join(', ')}` : 'Henüz gün atanmadı';
}
function pagePrograms() {
  const s = S(), t = DateUtil.today();
  const plan = Store.weekPlan();
  const nextPlan = Store.weekPlan(DateUtil.addDays(DateUtil.weekStart(), 7));
  const active = Store.activeProgram();
  if (!s.templates[ui.progTpl]) ui.progTpl = 'upperA';
  const key = ui.progTpl;
  const tpl = s.templates[key];
  const keys = Store.templateKeys();
  const dayCard = (p) => {
    const tp = p.tpl ? s.templates[p.tpl] : null;
    const tt = tp ? (TPL_TYPES[tp.type] || TPL_TYPES.full) : null;
    const status = p.done ? `<span class="dc-status ok">${icon('check')} Tamamlandı</span>`
      : p.date === t ? `<span class="dc-status now">${tp ? 'Bugün' : 'Bugün · Dinlenme'}</span>`
      : tp ? (p.date < t ? '<span class="dc-status miss">Kaçırıldı</span>' : '<span class="dc-status">Bekliyor</span>') : '<span class="dc-status">Dinlenme</span>';
    return `<div class="day-card${tp ? ' t-' + tp.type : ' is-rest'}${p.date === t ? ' is-today' : ''}${p.done ? ' is-done' : ''}">
      <span class="dc-day"><span class="full">${DAY_NAMES[p.dayIdx]}</span><span class="short">${DAY_SHORT[p.dayIdx]}</span></span>
      <b>${tt ? `<span class="short">${tt.short}</span><span class="full">${tt.label}</span>` : '—'}</b>
      <small>${tp ? esc(tp.name) : 'Toparlanma'}</small>${status}</div>`;
  };
  const progCard = (p) => {
    const sched = Store.programSchedule(p.id, DateUtil.weekStart());
    const on = p.id === active.id;
    return `<div class="prog-card${on ? ' active' : ''}">
      <div class="pc-top"><div class="pc-ic">${icon(p.builtin ? 'calendar' : 'star')}</div>
        <div class="li-body"><b>${esc(p.name)}</b><small>${p.builtin ? esc(p.desc) : programDaysText(sched)}</small></div>
        ${on ? '<span class="badge badge-red">Aktif</span>' : ''}</div>
      <div class="pc-dots">${sched.map((k, i) => `<span class="${k ? 't-' + (s.templates[k] || {}).type : ''}" title="${DAY_NAMES[i]}${k ? ' · ' + esc(s.templates[k].name) : ''}">${DAY_SHORT[i]}</span>`).join('')}</div>
      <div class="pc-actions">
        ${on ? '' : `<button class="btn btn-primary btn-sm" data-action="program-set" data-id="${p.id}">${icon('check')} Seç</button>`}
        ${p.builtin ? '' : `<button class="btn btn-ghost btn-sm" data-action="program-edit" data-id="${p.id}">${icon('edit')} Düzenle</button>
        <button class="btn-icon sm" data-action="program-delete" data-id="${p.id}" aria-label="Programı sil">${icon('trash')}</button>`}
      </div>
    </div>`;
  };
  return `
  ${pageHead('Antrenman Programları', 'Hazır üst/alt programlardan birini seç ya da kendi programını oluştur.', `<button class="btn btn-primary" data-action="program-edit">${icon('plus')} Kendi Programını Oluştur</button>`)}
  <div class="card">
    <div class="card-head"><span class="card-title">${icon('calendar')} Programlarım</span><span class="muted sm">${Store.programs().length} program</span></div>
    <div class="prog-grid">
      ${Store.programs().map(progCard).join('')}
      <button class="prog-card prog-new" data-action="program-edit">${icon('plus')}<b>Yeni Program</b><small>Günleri ve antrenmanları sen belirle</small></button>
    </div>
  </div>

  <div class="card">
    <div class="card-head"><span class="card-title">Bu Hafta · ${esc(active.name)}</span><span class="muted sm">${DateUtil.format(plan[0].date, { year: false })} – ${DateUtil.format(plan[6].date)}</span></div>
    <div class="day-grid">${plan.map(dayCard).join('')}</div>
    <div class="card-head mt"><span class="card-title">Gelecek Hafta</span></div>
    <div class="day-grid compact">${nextPlan.map(dayCard).join('')}</div>
    ${active.id === 'ul3' ? `<div class="note">${icon('info')}<span>3 günlük programda Pazartesi–Çarşamba–Cuma günleri <b>Üst → Alt → Üst</b> ile başlanır, sonraki hafta <b>Alt → Üst → Alt</b> olarak dönüşümlü devam eder. A/B varyasyonları sırayla uygulanır.</span></div>`
      : active.id === 'ul4' ? `<div class="note">${icon('info')}<span>4 günlük programda Pazartesi (Üst A), Salı (Alt A), Perşembe (Üst B) ve Cuma (Alt B) uygulanır.</span></div>`
      : `<div class="note">${icon('info')}<span>Kendi programındaki günleri ve antrenmanları "Düzenle" ile istediğin zaman değiştirebilirsin.</span></div>`}
  </div>

  <div class="card">
    <div class="card-head"><span class="card-title">${icon('dumbbell')} Antrenmanlar</span><span class="muted sm">Egzersiz, set ve tekrarları düzenleyebilirsin</span></div>
    <div class="tabs">${keys.map(k => `<button class="tab${k === key ? ' active' : ''}" data-action="tpl-tab" data-tpl="${k}">${s.templates[k].custom ? icon('star') : ''}${esc(s.templates[k].name)}</button>`).join('')}
      <button class="tab tab-new" data-action="tpl-new">${icon('plus')} Yeni Antrenman</button></div>
    <div class="tpl-head"><div><h3>${esc(tpl.name)}</h3><p class="muted">${esc(tpl.focus)} · ${tpl.items.length} egzersiz · ${tpl.items.reduce((n, i) => n + (+i.sets || 0), 0)} set</p></div>
      <div class="tpl-head-actions">${typeBadge(tpl.type)}
        <button class="btn-icon sm" data-action="tpl-edit" aria-label="Adı ve türü düzenle">${icon('edit')}</button>
        ${tpl.custom ? `<button class="btn-icon sm" data-action="tpl-delete" aria-label="Antrenmanı sil">${icon('trash')}</button>` : ''}</div></div>
    ${tpl.items.length ? `<div class="tpl-list">
      <div class="tpl-row tpl-row-head"><span></span><span>Egzersiz</span><span>Set</span><span>Tekrar</span><span></span></div>
      ${tpl.items.map((it, i) => {
        const ex = EX_BY_ID[it.ex];
        if (!ex) return '';
        return `<div class="tpl-row">
          ${thumb(ex, 'sm')}
          <a href="#/exercise/${encodeURIComponent(ex.id)}" class="tpl-name"><b>${esc(ex.name)}</b><small>${ex.group}</small></a>
          <input type="number" min="1" max="10" value="${it.sets}" data-change="tpl-field" data-i="${i}" data-f="sets" aria-label="Set sayısı">
          <input type="text" maxlength="8" value="${esc(it.reps)}" data-change="tpl-field" data-i="${i}" data-f="reps" aria-label="Tekrar">
          <div class="tpl-btns">
            <button class="btn-icon sm" data-action="tpl-move" data-i="${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="Yukarı taşı"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 15-6-6-6 6"/></svg></button>
            <button class="btn-icon sm" data-action="tpl-move" data-i="${i}" data-dir="1" ${i === tpl.items.length - 1 ? 'disabled' : ''} aria-label="Aşağı taşı"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></button>
            <button class="btn-icon sm" data-action="tpl-remove" data-i="${i}" aria-label="Kaldır">${icon('trash')}</button>
          </div>
        </div>`;
      }).join('')}
    </div>` : emptyState('dumbbell', 'Bu antrenman boş', '873 egzersizlik kütüphaneden istediğin hareketleri ekle.', `<button class="btn btn-primary" data-action="ex-picker" data-target="tpl">${icon('plus')} Egzersiz Ekle</button>`)}
    <div class="row-actions">
      <button class="btn btn-ghost" data-action="ex-picker" data-target="tpl">${icon('plus')} Egzersiz Ekle</button>
      ${tpl.custom ? '' : `<button class="btn btn-ghost" data-action="tpl-reset">${icon('refresh')} Varsayılana Sıfırla</button>`}
      <button class="btn btn-primary" data-action="start-workout" data-tpl="${key}" ${tpl.items.length ? '' : 'disabled'}>${icon('play')} Bu Antrenmanı Başlat</button>
    </div>
  </div>`;
}

function openProgramModal(id) {
  const s = S();
  const p = id ? s.programs.find(x => x.id === id) : null;
  const sched = p ? p.schedule : [null, null, null, null, null, null, null];
  const opts = (sel) => `<option value="">Dinlenme</option>
    ${Store.templateKeys().map(k => `<option value="${k}"${sel === k ? ' selected' : ''}>${esc(s.templates[k].name)}${s.templates[k].items.length ? '' : ' (boş)'}</option>`).join('')}
    <option value="__new__">+ Yeni boş antrenman</option>`;
  openModal(p ? 'Programı Düzenle' : 'Kendi Programını Oluştur', `
    <form data-form="program" class="form">
      <input type="hidden" name="id" value="${p ? p.id : ''}">
      <div class="field"><label>Program adı</label><input name="name" required maxlength="40" value="${esc(p ? p.name : '')}" placeholder="Örn. Push / Pull / Legs"></div>
      <p class="hint">Her gün için bir antrenman seç ya da dinlenme bırak. "Yeni boş antrenman" seçersen kaydettikten sonra içine egzersiz ekleyebilirsin.</p>
      <div class="sched-list">${DAY_NAMES.map((d, i) => `<div class="sched-row"><span>${d}</span><select name="d${i}" aria-label="${d}">${opts(sched[i])}</select></div>`).join('')}</div>
      <label class="check-row"><input type="checkbox" name="activate" ${!p || s.settings.program === p.id ? 'checked' : ''}><span>Aktif programım yap</span></label>
      <div class="modal-actions"><button type="button" class="btn btn-ghost" data-action="modal-close">Vazgeç</button><button class="btn btn-primary" type="submit">${icon('check')} Kaydet</button></div>
    </form>`);
}

function openTemplateModal(key) {
  const t = key ? S().templates[key] : null;
  openModal(t ? 'Antrenmanı Düzenle' : 'Yeni Antrenman', `
    <form data-form="template" class="form">
      <input type="hidden" name="key" value="${key || ''}">
      <div class="field"><label>Antrenman adı</label><input name="name" required maxlength="40" value="${esc(t ? t.name : '')}" placeholder="Örn. Push Günü"></div>
      <div class="form-row">
        <div class="field grow"><label>Tür</label><select name="type">${Object.entries(TPL_TYPES).map(([k, v]) => `<option value="${k}"${(t ? t.type : 'full') === k ? ' selected' : ''}>${v.label}</option>`).join('')}</select></div>
        <div class="field grow"><label>Odak (isteğe bağlı)</label><input name="focus" maxlength="40" value="${esc(t ? t.focus : '')}" placeholder="Örn. Göğüs · Omuz · Triceps"></div>
      </div>
      <div class="modal-actions"><button type="button" class="btn btn-ghost" data-action="modal-close">Vazgeç</button><button class="btn btn-primary" type="submit">${icon('check')} ${t ? 'Kaydet' : 'Oluştur'}</button></div>
    </form>`);
}

/* 4) Egzersiz Detayı */
function pageExercise(id) {
  const ex = EX_BY_ID[id];
  if (!ex) return `<div class="card">${emptyState('search', 'Egzersiz bulunamadı', 'Aradığın egzersiz kütüphanede yok.', '<a class="btn btn-primary" href="#/library">Kütüphaneye Dön</a>')}</div>`;
  const hist = Store.exerciseHistory(id);
  const useReps = ex.bodyweight && !hist.some(h => h.best.kg > 0);
  const chartData = hist.slice(-12).map(h => ({ label: DateUtil.formatShort(h.date), value: useReps ? h.best.reps : h.best.kg }));
  const pr = hist.reduce((b, h) => (!b || h.best.kg > b.best.kg ? h : b), null);
  return `
  <button class="back-link" data-action="back">${icon('left')} Geri</button>
  <div class="card ex-hero t-${ex.region}">
    <div class="ex-media" data-action="ex-frame" title="Pozisyonu değiştirmek için dokun">
      <img class="f0" src="${ex.img[0]}" alt="${esc(ex.name)} başlangıç pozisyonu" onerror="this.onerror=null;this.src='${ex.thumb}'">
      <img class="f1" src="${ex.img[1]}" alt="${esc(ex.name)} bitiş pozisyonu" onerror="this.onerror=null;this.src='${ex.thumb}'">
      <div class="ex-media-shade"></div>
      <div class="ex-frames"><span class="fr fr0">Başlangıç</span><span class="fr fr1">Bitiş</span></div>
      <div class="ex-hero-title">
        <div class="badges"><span class="badge badge-red">${ex.group}</span>${ex.region === 'other' ? '' : `<span class="badge">${ex.region === 'upper' ? 'Üst Vücut' : 'Alt Vücut'}</span>`}</div>
        <h1>${esc(ex.name)}</h1>
      </div>
    </div>
    <div class="ex-hero-text">
      <p>${esc(ex.desc)}</p>
      <span class="badge">${icon('dumbbell')} ${ex.equipment}</span>
    </div>
  </div>
  <div class="grid g-4">
    ${statCard({ ic: 'refresh', label: 'Set', value: ex.sets })}
    ${statCard({ ic: 'activity', label: 'Tekrar', value: esc(ex.reps), tone: 'violet' })}
    ${statCard({ ic: 'timer', label: 'Dinlenme', value: `${ex.rest} <small>sn</small>`, tone: 'blue' })}
    ${statCard({ ic: 'zap', label: 'Zorluk', value: ex.level, tone: 'green' })}
  </div>
  <div class="grid g-2">
    <div class="card">
      <div class="card-head"><span class="card-title">Çalışan Kas Grupları</span></div>
      ${Charts.bodyMap(ex.muscles)}
      <div class="chips static">${ex.muscles.length ? '' : '<span class="muted sm">Belirli bir kas grubu yok</span>'}${ex.muscles.map((m, i) => `<span class="chip${i === 0 ? ' active' : ''}">${MUSCLE_NAMES[m]}</span>`).join('')}</div>
    </div>
    <div class="card">
      <div class="card-head"><span class="card-title">Nasıl Yapılır?</span>${ex.en ? '<span class="badge badge-gray" title="Bu egzersizin talimatları kaynak veritabanında İngilizcedir">EN</span>' : ''}</div>
      ${ex.steps.length ? `<ol class="steps"${ex.en ? ' lang="en"' : ''}>${ex.steps.map(st => `<li>${esc(st)}</li>`).join('')}</ol>` : '<p class="muted">Bu egzersiz için adım bilgisi yok.</p>'}
      ${ex.tips.length ? `<div class="card-head mt"><span class="card-title">İpuçları</span></div>
      <ul class="tips">${ex.tips.map(tp => `<li>${icon('check')}<span>${esc(tp)}</span></li>`).join('')}</ul>` : ''}
      <div class="kv-grid mt"><div><small>Ekipman</small><b class="sm">${esc(ex.equipment)}</b></div><div><small>Seviye</small><b class="sm">${ex.level}</b></div>${ex.cat ? `<div><small>Kategori</small><b class="sm">${ex.cat[0].toLocaleUpperCase('tr-TR') + ex.cat.slice(1)}</b></div>` : ''}<div><small>Kas grubu</small><b class="sm">${ex.group}</b></div></div>
    </div>
  </div>
  <div class="grid g-2">
    <div class="card">
      <div class="card-head"><span class="card-title">Gelişim</span><span class="muted sm">${useReps ? 'En iyi tekrar' : 'En iyi ağırlık (kg)'}</span></div>
      ${Charts.line(chartData, { height: 200, unit: useReps ? ' tkr' : ' kg', empty: 'Bu egzersizi kaydettiğinde gelişim grafiği burada oluşur.' })}
      ${pr && pr.best.kg ? `<div class="pr-line">${icon('trophy')} Kişisel rekor: <b>${fmt(pr.best.kg)} kg × ${pr.best.reps}</b> <span class="muted">(${DateUtil.format(pr.date)}) · Tahmini 1RM ≈ ${fmt(Math.max(...hist.map(h => h.e1rm)))} kg</span></div>` : ''}
    </div>
    <div class="card">
      <div class="card-head"><span class="card-title">Egzersiz Geçmişi</span><span class="muted sm">${hist.length} kayıt</span></div>
      ${hist.length ? `<div class="mini-hist">${hist.slice(-8).reverse().map(h => `<div class="mh-row"><span>${DateUtil.format(h.date)}</span><b>${h.sets.length} × ${h.best.reps} × ${h.best.kg ? fmt(h.best.kg) + ' kg' : 'VA'}</b></div>`).join('')}</div>`
        : emptyState('history', 'Kayıt yok', 'Bu egzersizi bir antrenmanda tamamladığında setlerin burada görünür.')}
    </div>
  </div>
  <div class="row-actions sticky-actions">
    <button class="btn btn-ghost" data-action="rest-start" data-sec="${ex.rest}">${icon('timer')} Dinlenme Sayacı</button>
    <button class="btn btn-primary" data-action="ex-add-to-workout" data-id="${ex.id}">${icon('play')} ${S().active ? 'Antrenmana Ekle' : 'Sete Başla'}</button>
  </div>`;
}

/* 5) Beslenme */
function pageNutrition() {
  const s = S(), d = ui.nutDate, t = DateUtil.today();
  const tot = Store.totals(d);
  const items = Store.foodOf(d);
  const goalBar = (label, v, g, color, unit = 'g') => `<div class="goal-bar"><div class="gb-top"><span>${label}</span><b>${fmt(Math.round(v))} / ${fmt(g)} ${unit}</b></div>${Charts.progress(v, g, color)}</div>`;
  return `
  ${pageHead('Beslenme', 'Öğünlerini, kalorini ve makrolarını takip et.', `<button class="btn btn-primary" data-action="food-open">${icon('plus')} Yemek Ekle</button>`)}
  <div class="date-nav">
    <button class="btn-icon" data-action="nut-date" data-d="-1" aria-label="Önceki gün">${icon('left')}</button>
    <b>${dayLabel(d)}</b>
    <button class="btn-icon" data-action="nut-date" data-d="1" ${d >= t ? 'disabled' : ''} aria-label="Sonraki gün">${icon('right')}</button>
  </div>
  <div class="grid g-2">
    <div class="card">
      <div class="card-head"><span class="card-title">Günlük Özet</span><span class="muted sm">Kalan: ${fmt(Math.max(0, s.settings.kcalGoal - tot.kcal))} kcal</span></div>
      <div class="ring-row">${kcalRing(tot, 170)}${macroLegend(tot)}</div>
    </div>
    <div class="card">
      <div class="card-head"><span class="card-title">Makro Hedefleri</span><a href="#/settings" class="card-link">Düzenle ${icon('right')}</a></div>
      ${goalBar('Kalori', tot.kcal, s.settings.kcalGoal, '', 'kcal')}
      ${goalBar('Karbonhidrat', tot.carbs, s.settings.carbGoal, 'blue')}
      ${goalBar('Protein', tot.protein, s.settings.proteinGoal, 'violet')}
      ${goalBar('Yağ', tot.fat, s.settings.fatGoal, 'orange')}
    </div>
  </div>
  <div class="card">
    <div class="card-head"><span class="card-title">${icon('utensils')} Öğünler</span><span class="muted sm">${items.length} kayıt</span></div>
    <div class="meals">${MEAL_TYPES.map(m => {
      const list = items.filter(f => f.meal === m);
      const kc = list.reduce((a, f) => a + f.kcal, 0);
      return `<div class="meal">
        <div class="meal-head"><b>${m}</b><span class="muted">${fmt(kc)} kcal</span>
          ${Store.foodOf(DateUtil.addDays(d, -1)).some(f => f.meal === m) ? `<button class="btn-icon sm" data-action="meal-copy" data-meal="${m}" title="Dünden kopyala" aria-label="${m}: dünden kopyala">${icon('copy')}</button>` : ''}
          <button class="btn-icon sm" data-action="food-open" data-meal="${m}" aria-label="${m} için ekle">${icon('plus')}</button></div>
        ${list.length ? list.map(foodRow).join('') : '<div class="meal-empty muted">Henüz eklenmedi</div>'}
      </div>`;
    }).join('')}</div>
  </div>
  <div class="card">
    <div class="card-head"><span class="card-title">${icon('star')} Favori Öğünler</span><span class="muted sm">Tek dokunuşla ekle</span></div>
    ${(s.favorites || []).length ? `<div class="fav-list">${s.favorites.map(f => `<div class="fav-chip"><button data-action="fav-add" data-id="${f.id}"><b>${esc(f.name)}</b><small>${fmt(f.kcal)} kcal · P ${fmt(f.protein)} g</small></button><button class="fav-x" data-action="fav-del" data-id="${f.id}" aria-label="Favoriden çıkar">${icon('x')}</button></div>`).join('')}</div>`
      : `<p class="muted sm">Yemek eklerken "Favorilerime ekle" kutusunu işaretle; sık yediklerin burada tek dokunuşla eklenir.</p>`}
  </div>
  <div class="grid g-3">
    ${statCard({ ic: 'shaker', label: 'Protein Takibi', value: `${fmt(Math.round(Store.totals(t).protein))} <small>g</small>`, sub: 'Bugün', to: 'protein', tone: 'violet' })}
    ${statCard({ ic: 'flame', label: 'Kalori Takibi', value: `${fmt(Store.totals(t).kcal)} <small>kcal</small>`, sub: 'Bugün', to: 'calories' })}
    ${statCard({ ic: 'drop', label: 'Su Takibi', value: `${fmt(Store.waterTotal(t) / 1000)} <small>L</small>`, sub: 'Bugün', to: 'water', tone: 'blue' })}
  </div>`;
}
function foodRow(f, date = ui.nutDate) {
  return `<div class="food-row">
    <div class="li-body"><span class="li-title">${esc(f.name)}</span><span class="li-sub">${f.time} · P ${fmt(f.protein)} g · K ${fmt(f.carbs)} g · Y ${fmt(f.fat)} g</span></div>
    <b class="food-kcal">${fmt(f.kcal)} <small>kcal</small></b>
    <button class="btn-icon sm" data-action="food-del" data-id="${f.id}" data-date="${date}" aria-label="Sil">${icon('trash')}</button>
  </div>`;
}

function foodResults(q = '', cat = 'Tümü') {
  const s = S();
  const words = trLower(q).trim().split(/\s+/).filter(Boolean);
  const match = (name) => !words.length || words.every(w => trLower(name).includes(w));
  const favs = (s.favorites || []).filter(f => (cat === 'Tümü' || cat === 'Favoriler') && match(f.name));
  const foods = cat === 'Favoriler' ? [] : FOODS.map((f, i) => ({ f, i })).filter(({ f }) => (cat === 'Tümü' || f.cat === cat) && match(f.name));
  const row = (f, attr, star) => `<button type="button" class="food-opt" ${attr}><span>${star ? icon('star') : ''}${esc(f.name)}</span><small>${fmt(f.kcal)} kcal · P ${fmt(f.protein)} g</small></button>`;
  const html = favs.map(f => row(f, `data-action="food-pick" data-fav="${f.id}"`, true)).join('') + foods.slice(0, 60).map(({ f, i }) => row(f, `data-action="food-pick" data-i="${i}"`, false)).join('');
  return html || `<p class="hint center">Sonuç yok — değerleri aşağıya elle girebilirsin.</p>`;
}

function openFoodModal(meal = '', preset = null) {
  const hour = new Date().getHours();
  const autoMeal = meal || (hour < 11 ? 'Kahvaltı' : hour < 15 ? 'Öğle Yemeği' : hour < 21 ? 'Akşam Yemeği' : 'Ara Öğün');
  const p = preset || {};
  ui.foodBase = preset && preset.base ? preset.base : null;
  ui.foodCat = (S().favorites || []).length ? 'Tümü' : 'Tümü';
  openModal('Yemek Ekle', `
    <form data-form="food" class="form" autocomplete="off">
      <div class="food-search">
        <div class="search">${icon('search')}<input type="search" data-input="food-search" placeholder="Besin ara… (tavuk, lahmacun, yulaf)" aria-label="Besin ara"></div>
        <button type="button" class="btn btn-ghost" data-action="barcode-open" data-meal="${autoMeal}" aria-label="Barkod okut">${icon('barcode')}<span class="hide-sm">Barkod</span></button>
      </div>
      <div class="chips picker-chips" id="foodCats">${['Tümü', ...((S().favorites || []).length ? ['Favoriler'] : []), ...FOOD_CATEGORIES].map(c => `<button type="button" class="chip${c === 'Tümü' ? ' active' : ''}" data-action="food-cat" data-c="${c}">${c === 'Favoriler' ? '★ ' : ''}${c}</button>`).join('')}</div>
      <div class="food-results" id="foodResults">${foodResults()}</div>
      <div class="form-row">
        <div class="field grow"><label>Besin adı</label><input name="name" required maxlength="60" placeholder="Örn. Tavuklu salata" value="${esc(p.name || '')}"></div>
        <div class="field w-sm"><label>${p.unit ? esc(p.unit) : 'Porsiyon'}</label><input name="portion" type="number" min="0.1" step="any" value="${p.portion || 1}" data-input="food-portion"></div>
      </div>
      <div class="field"><label>Öğün</label><select name="meal">${MEAL_TYPES.map(m => `<option${m === autoMeal ? ' selected' : ''}>${m}</option>`).join('')}</select></div>
      <div class="form-row four">
        <div class="field"><label>Kalori (kcal)</label><input name="kcal" type="number" min="0" step="1" required value="${p.kcal ?? ''}"></div>
        <div class="field"><label>Protein (g)</label><input name="protein" type="number" min="0" step="0.1" value="${p.protein ?? ''}"></div>
        <div class="field"><label>Karb. (g)</label><input name="carbs" type="number" min="0" step="0.1" value="${p.carbs ?? ''}"></div>
        <div class="field"><label>Yağ (g)</label><input name="fat" type="number" min="0" step="0.1" value="${p.fat ?? ''}"></div>
      </div>
      <label class="check-row"><input type="checkbox" name="fav"><span>${icon('star')} Favorilerime ekle (tek dokunuşla tekrar eklemek için)</span></label>
      <p class="hint">Hazır besin değerleri yaklaşıktır; ürün etiketine göre düzenleyebilirsin.</p>
      <div class="modal-actions"><button type="button" class="btn btn-ghost" data-action="modal-close">Vazgeç</button><button class="btn btn-primary" type="submit">${icon('plus')} Ekle</button></div>
    </form>`, { wide: true });
}
function applyFoodBase(form) {
  const b = ui.foodBase;
  if (!b) return;
  const k = (+form.portion.value || 1) / (b.per || 1);
  form.name.value = b.label ? `${b.label}${b.per ? ` (${form.portion.value} ${b.unitShort || 'g'})` : (k === 1 ? '' : ` ×${String(+k.toFixed(2)).replace('.', ',')}`)}` : form.name.value;
  form.kcal.value = Math.round(b.kcal * k);
  form.protein.value = round1(b.protein * k);
  form.carbs.value = round1(b.carbs * k);
  form.fat.value = round1(b.fat * k);
}

/* 6) Protein Takibi */
function pageProtein() {
  const s = S(), t = DateUtil.today();
  const tot = Store.totals(t);
  const goal = s.settings.proteinGoal;
  const w = Store.currentWeight();
  const list = Store.foodOf(t).filter(f => f.protein > 0);
  const week = lastNDays(7, d => Math.round(Store.totals(d).protein));
  const avg = Math.round(week.reduce((a, x) => a + x.value, 0) / 7);
  const quick = [['Whey (1 ölçek)', 24, 120], ['Yumurta', 6, 72], ['Tavuk 100 g', 31, 165], ['Yoğurt 200 g', 20, 146]];
  return `
  ${pageHead('Protein Takibi', 'Kas gelişimi için günlük protein alımını gram olarak kaydet.')}
  <div class="grid g-2">
    <div class="card center-card">
      ${Charts.ring({ value: tot.protein, max: goal, size: 200, stroke: 16, colors: ['#8b5cf6', '#ff2d3d'],
        center: `<b class="rc-big">${fmt(Math.round(tot.protein))}<small> g</small></b><span>/ ${goal} g</span>` })}
      <div class="ring-meta"><span class="badge ${tot.protein >= goal ? 'badge-green' : 'badge-violet'}">%${pct(tot.protein, goal)}</span>
        <span class="muted">${tot.protein >= goal ? 'Günlük hedefe ulaştın! 🎉' : `Hedefe ${fmt(Math.max(0, Math.round(goal - tot.protein)))} g kaldı`}</span></div>
    </div>
    <div class="card">
      <div class="card-head"><span class="card-title">Hızlı Ekle</span></div>
      <div class="quick-grid">${quick.map(([n, g, k]) => `<button class="quick-btn" data-action="protein-quick" data-name="${n}" data-g="${g}" data-k="${k}"><b>+${g} g</b><small>${n}</small></button>`).join('')}</div>
      <form data-form="protein" class="form inline-form">
        <div class="field grow"><label>Kaynak</label><input name="name" maxlength="50" placeholder="Örn. Protein bar"></div>
        <div class="field w-sm"><label>Protein (g)</label><input name="g" type="number" min="1" max="300" step="0.5" required></div>
        <button class="btn btn-primary" type="submit">${icon('plus')} Ekle</button>
      </form>
    </div>
  </div>
  <div class="grid g-2">
    <div class="card">
      <div class="card-head"><span class="card-title">Son 7 Gün</span><span class="muted sm">Ortalama ${avg} g/gün</span></div>
      ${Charts.bars(week, { tone: 'violet', goal, unit: ' g', highlight: 6, empty: 'Son 7 günde protein kaydı yok' })}
    </div>
    <div class="card">
      <div class="card-head"><span class="card-title">${icon('target')} Hedef Önerisi</span></div>
      ${w ? `<p class="muted">Düzenli direnç antrenmanı yapanlar için genel öneri vücut ağırlığının kilogramı başına <b>1,6–2,2 g</b> proteindir. ${fmt(w)} kg için:</p>
        <div class="quick-grid three">${[1.6, 2.0, 2.2].map(f => `<button class="quick-btn${Math.round(w * f) === goal ? ' active' : ''}" data-action="protein-goal" data-v="${Math.round(w * f)}"><b>${Math.round(w * f)} g</b><small>${String(f).replace('.', ',')} g/kg</small></button>`).join('')}</div>`
        : `<p class="muted">Kişisel öneri için profiline kilonu ekle.</p><button class="btn btn-ghost" data-action="profile-edit">Profili Düzenle</button>`}
      <form data-form="goal-one" class="form inline-form mt"><input type="hidden" name="key" value="proteinGoal">
        <div class="field grow"><label>Günlük protein hedefi (g)</label><input name="v" type="number" min="20" max="400" value="${goal}" required></div>
        <button class="btn btn-ghost" type="submit">Kaydet</button></form>
    </div>
  </div>
  <div class="card">
    <div class="card-head"><span class="card-title">Bugünün Protein Kaynakları</span><span class="muted sm">${list.length} kayıt</span></div>
    ${list.length ? list.map(f => foodRow(f, t)).join('') : emptyState('shaker', 'Kayıt yok', 'Hızlı ekle butonlarıyla veya beslenme sayfasından protein ekleyebilirsin.')}
  </div>`;
}

/* 7) Kalori Takibi */
function pageCalories() {
  const s = S(), t = DateUtil.today();
  const tot = Store.totals(t);
  const goal = s.settings.kcalGoal;
  const burned = Store.burnedOn(t);
  const week = lastNDays(7, d => Store.totals(d).kcal);
  const p = s.profile;
  const r = ui.tdee;
  return `
  ${pageHead('Kalori Takibi', 'Aldığın ve antrenmanla yaktığın kaloriyi takip et.', `<button class="btn btn-primary" data-action="food-open">${icon('plus')} Yemek Ekle</button>`)}
  <div class="grid g-2">
    <div class="card center-card">
      ${Charts.ring({ value: tot.kcal, max: goal, size: 200, stroke: 16, colors: tot.kcal > goal * 1.1 ? ['#f59e0b', '#ff2d3d'] : ['#ff2d3d', '#ff7a45'],
        center: `<b class="rc-big">${fmt(tot.kcal)}</b><span>/ ${fmt(goal)} kcal</span>` })}
      <div class="ring-meta"><span class="muted">${tot.kcal <= goal ? `Kalan: <b>${fmt(goal - tot.kcal)} kcal</b>` : `Hedefi <b>${fmt(tot.kcal - goal)} kcal</b> aştın`}</span></div>
    </div>
    <div class="card">
      <div class="kv-grid">
        <div><small>Alınan</small><b>${fmt(tot.kcal)}</b><span>kcal</span></div>
        <div><small>Yakılan (antrenman)</small><b>${fmt(burned)}</b><span>kcal · tahmini</span></div>
        <div><small>Net</small><b>${fmt(tot.kcal - burned)}</b><span>kcal</span></div>
        <div><small>Hedef</small><b>${fmt(goal)}</b><span>kcal</span></div>
      </div>
      <form data-form="kcal" class="form inline-form mt">
        <div class="field grow"><label>Hızlı kalori ekle</label><input name="name" maxlength="50" placeholder="Örn. Atıştırmalık"></div>
        <div class="field w-sm"><label>kcal</label><input name="kcal" type="number" min="1" max="5000" required></div>
        <button class="btn btn-primary" type="submit">${icon('plus')}</button>
      </form>
    </div>
  </div>
  <div class="grid g-2">
    <div class="card">
      <div class="card-head"><span class="card-title">Son 7 Gün</span><span class="muted sm">Ortalama ${fmt(Math.round(week.reduce((a, x) => a + x.value, 0) / 7))} kcal</span></div>
      ${Charts.bars(week, { goal, unit: ' kcal', highlight: 6, empty: 'Son 7 günde kalori kaydı yok' })}
    </div>
    <div class="card">
      <div class="card-head"><span class="card-title">${icon('calc')} Günlük Kalori İhtiyacı</span></div>
      <form data-form="tdee" class="form">
        <div class="form-row four">
          <div class="field"><label>Cinsiyet</label><select name="gender"><option value="male"${p.gender === 'male' ? ' selected' : ''}>Erkek</option><option value="female"${p.gender === 'female' ? ' selected' : ''}>Kadın</option></select></div>
          <div class="field"><label>Yaş</label><input name="age" type="number" min="13" max="100" required value="${p.age ?? ''}"></div>
          <div class="field"><label>Boy (cm)</label><input name="height" type="number" min="120" max="230" required value="${p.height ?? ''}"></div>
          <div class="field"><label>Kilo (kg)</label><input name="weight" type="number" min="30" max="300" step="0.1" required value="${Store.currentWeight() ?? ''}"></div>
        </div>
        <div class="form-row">
          <div class="field grow"><label>Aktivite</label><select name="activity">
            ${[[1.2, 'Hareketsiz'], [1.375, 'Hafif aktif (1–3 gün)'], [1.55, 'Orta aktif (3–5 gün)'], [1.725, 'Çok aktif (6–7 gün)']].map(([v, l]) => `<option value="${v}"${+p.activity === v ? ' selected' : ''}>${l}</option>`).join('')}</select></div>
          <div class="field grow"><label>Hedef</label><select name="goal"><option value="-400">Yağ yakımı (−400)</option><option value="0" selected>Koruma</option><option value="300">Kas kazanımı (+300)</option></select></div>
        </div>
        <button class="btn btn-ghost btn-block" type="submit">Hesapla</button>
      </form>
      ${r ? `<div class="tdee-res"><div><small>Bazal (BMR)</small><b>${fmt(r.bmr)}</b></div><div><small>Günlük (TDEE)</small><b>${fmt(r.tdee)}</b></div><div class="hi"><small>Önerilen</small><b>${fmt(r.target)}</b></div></div>
        <p class="hint">Mifflin-St Jeor formülüyle tahmini değerdir. Önerilen makrolar: P ${r.protein} g · Y ${r.fat} g · K ${r.carbs} g</p>
        <button class="btn btn-primary btn-block" data-action="tdee-apply">${icon('check')} Hedef Olarak Kaydet</button>` : ''}
    </div>
  </div>
  <div class="card">
    <div class="card-head"><span class="card-title">Bugünün Kayıtları</span><a href="#/nutrition" class="card-link">Beslenme ${icon('right')}</a></div>
    ${Store.foodOf(t).length ? Store.foodOf(t).map(f => foodRow(f, t)).join('') : emptyState('flame', 'Bugün kayıt yok', 'Yediklerini ekledikçe kalori özetin burada oluşur.')}
  </div>`;
}

/* 8) Su Takibi */
function pageWater() {
  const s = S(), t = DateUtil.today();
  const total = Store.waterTotal(t), goal = s.settings.waterGoal;
  const list = [...Store.waterOf(t)].reverse();
  const week = lastNDays(7, d => Store.waterTotal(d) / 1000);
  const w = Store.currentWeight();
  return `
  ${pageHead('Su Takibi', 'Gün boyunca yeterli su içtiğinden emin ol.')}
  <div class="grid g-2">
    <div class="card center-card water-card">
      ${Charts.ring({ value: total, max: goal, size: 210, stroke: 16, colors: ['#38bdf8', '#2563eb'],
        center: `${icon('drop', 'ring-ic')}<b class="rc-big">${fmt(total / 1000)} L</b><span>/ ${fmt(goal / 1000)} L</span>` })}
      <div class="ring-meta"><span class="badge badge-blue">%${pct(total, goal)}</span><span class="muted">${total >= goal ? 'Bugünkü hedef tamam! 💧' : `${fmt(Math.max(0, goal - total))} ml kaldı`}</span></div>
      <div class="glass-row">${[250, 500, 750, 1000].map(ml => `<button class="glass-btn" data-action="water-add" data-ml="${ml}">${icon('glass')}<span>${ml >= 1000 ? '1 L' : ml + ' ml'}</span></button>`).join('')}</div>
    </div>
    <div class="card">
      <div class="card-head"><span class="card-title">Bugünün Geçişleri</span><span class="muted sm">${list.length} kayıt</span></div>
      <form data-form="water" class="form inline-form">
        <div class="field grow"><label>Özel miktar (ml)</label><input name="ml" type="number" min="10" max="3000" step="10" required placeholder="Örn. 330"></div>
        <button class="btn btn-primary" type="submit">${icon('plus')} Su Ekle</button>
      </form>
      <div class="water-list">${list.length ? list.map(x => `<div class="water-row">${icon('glass')}<b>${x.ml} ml</b><span class="muted">${x.time}</span>
        <button class="btn-icon sm" data-action="water-del" data-id="${x.id}" aria-label="Sil">${icon('trash')}</button></div>`).join('')
        : emptyState('drop', 'Henüz su eklenmedi', 'Bardak butonlarıyla hızlıca ekleyebilirsin.')}</div>
    </div>
  </div>
  <div class="grid g-2">
    <div class="card">
      <div class="card-head"><span class="card-title">Son 7 Gün</span><span class="muted sm">Litre</span></div>
      ${Charts.bars(week, { tone: 'blue', goal: goal / 1000, unit: ' L', highlight: 6, empty: 'Son 7 günde su kaydı yok' })}
    </div>
    <div class="card">
      <div class="card-head"><span class="card-title">${icon('target')} Günlük Hedef</span></div>
      <form data-form="goal-one" class="form inline-form"><input type="hidden" name="key" value="waterGoal">
        <div class="field grow"><label>Hedef (ml)</label><input name="v" type="number" min="500" max="8000" step="50" value="${goal}" required></div>
        <button class="btn btn-ghost" type="submit">Kaydet</button></form>
      ${w ? `<p class="hint">Genel öneri: kilogram başına yaklaşık 30–40 ml. ${fmt(w)} kg için ≈ <b>${fmt(Math.round(w * 35 / 50) * 50)} ml</b>. Antrenman günlerinde biraz daha fazlası gerekebilir.</p>` : ''}
      <div class="set-item mt"><span class="si-ic">${icon('bell')}</span><div class="si-body"><b>Su hatırlatıcı</b><small>Uygulama açıkken her 2 saatte bir hatırlatır</small></div>
        <label class="switch"><input type="checkbox" data-change="setting-bool" data-key="notifyWater"${s.settings.notifyWater ? ' checked' : ''}><span></span></label></div>
    </div>
  </div>`;
}

/* 9) İstatistikler */
function rangeBuckets(range) {
  const t = DateUtil.today();
  if (range === 'year') {
    const now = DateUtil.parse(t);
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const to = DateUtil.key(end) > t ? t : DateUtil.key(end);
      return { label: MONTHS_SHORT[d.getMonth()], from: DateUtil.key(d), to };
    });
  }
  const n = range === 'month' ? 30 : 7;
  return Array.from({ length: n }, (_, i) => {
    const d = DateUtil.addDays(t, i - n + 1);
    return { label: range === 'week' ? DAY_SHORT[DateUtil.weekday(d)] : String(DateUtil.parse(d).getDate()), from: d, to: d };
  });
}
function daysIn(b) { const out = []; for (let d = b.from; d <= b.to; d = DateUtil.addDays(d, 1)) out.push(d); return out; }
function avgLogged(b, fn) {
  const vals = daysIn(b).map(fn).filter(v => v > 0);
  return vals.length ? vals.reduce((a, v) => a + v, 0) / vals.length : 0;
}

function pageStats() {
  const s = S(), range = ui.statsRange;
  const B = rangeBuckets(range);
  const from = B[0].from, to = B[B.length - 1].to;
  const every = range === 'month' ? 5 : 1;
  const weightData = B.map(b => {
    const inB = s.weights.filter(w => w.date >= b.from && w.date <= b.to);
    return { label: b.label, value: inB.length ? inB[inB.length - 1].kg : null };
  });
  const sess = Store.sessionsBetween(from, to);
  const volData = B.map(b => ({ label: b.label, value: Math.round(Store.sessionsBetween(b.from, b.to).reduce((a, x) => a + x.volume, 0)) }));
  const kcalData = B.map(b => ({ label: b.label, value: Math.round(range === 'year' ? avgLogged(b, d => Store.totals(d).kcal) : Store.totals(b.from).kcal) }));
  const protData = B.map(b => ({ label: b.label, value: Math.round(range === 'year' ? avgLogged(b, d => Store.totals(d).protein) : Store.totals(b.from).protein) }));
  const waterData = B.map(b => ({ label: b.label, value: Math.round((range === 'year' ? avgLogged(b, d => Store.waterTotal(d)) : Store.waterTotal(b.from)) / 100) / 10 }));

  const w = Store.currentWeight();
  const hM = s.profile.height ? s.profile.height / 100 : null;
  const bmi = w && hM ? w / (hM * hM) : null;
  const bmiCat = !bmi ? '' : bmi < 18.5 ? 'Zayıf' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Fazla kilolu' : 'Obez';
  const bf = bmi && s.profile.age ? clamp(1.2 * bmi + 0.23 * s.profile.age - 10.8 * (s.profile.gender === 'male' ? 1 : 0) - 5.4, 3, 60) : null;
  const firstW = s.weights.find(x => x.date >= from);
  const change = firstW && w ? round1(w - firstW.kg) : null;
  const waterAvg = avgLogged({ from, to }, d => Store.waterTotal(d));
  const rangeLabel = { week: 'Son 7 gün', month: 'Son 30 gün', year: 'Son 12 ay' }[range];

  const prs = EXERCISES.map(ex => {
    const h = Store.exerciseHistory(ex.id);
    if (!h.length) return null;
    const best = h.reduce((b, x) => x.best.kg > b.best.kg ? x : b, h[0]);
    return { ex, best, e1rm: Math.max(...h.map(x => x.e1rm)) };
  }).filter(x => x && x.best.best.kg > 0).sort((a, b) => b.e1rm - a.e1rm).slice(0, 5);

  return `
  ${pageHead('İstatistikler', 'Gelişimini grafiklerle takip et.')}
  <div class="seg wide" role="tablist">
    ${[['week', 'Haftalık'], ['month', 'Aylık'], ['year', 'Yıllık']].map(([k, l]) => `<button class="seg-btn${k === range ? ' active' : ''}" data-action="stats-range" data-r="${k}">${l}</button>`).join('')}
  </div>
  <div class="grid g-4">
    ${statCard({ ic: 'scale', label: 'Kilo', value: w ? `${fmt(w)} <small>kg</small>` : '—', sub: change != null ? `<span class="${change <= 0 ? 'up' : 'down'}">${change > 0 ? '+' : ''}${fmt(change)} kg</span> · ${rangeLabel}` : 'Kilo kaydı ekle' })}
    ${statCard({ ic: 'body', label: 'Vücut Kitle İndeksi', value: bmi ? fmt(round1(bmi)) : '—', sub: bmi ? `<span class="badge ${bmiCat === 'Normal' ? 'badge-green' : 'badge-orange'}">${bmiCat}</span>` : 'Boy ve kilo gerekli', tone: 'green' })}
    ${statCard({ ic: 'activity', label: 'Yağ Oranı (tahmini)', value: bf ? `%${fmt(round1(bf))}` : '—', sub: bf ? 'VKİ tabanlı tahmin' : 'Yaş, boy, kilo gerekli', tone: 'orange' })}
    ${statCard({ ic: 'drop', label: 'Su Ortalaması', value: `${fmt(Math.round(waterAvg / 100) / 10)} <small>L</small>`, sub: `Hedefin %${pct(waterAvg, s.settings.waterGoal)}'i`, tone: 'blue' })}
  </div>
  <div class="grid g-2-1">
    <div class="card">
      <div class="card-head"><span class="card-title">Kilo Takibi</span>${w ? `<span class="badge badge-red">${fmt(w)} kg</span>` : ''}</div>
      ${Charts.line(weightData, { height: 230, unit: ' kg', labelEvery: every, empty: 'Bu aralıkta kilo kaydı yok. Sağdaki formdan ekleyebilirsin.' })}
    </div>
    <div class="card">
      <div class="card-head"><span class="card-title">Kilo Ekle</span></div>
      <form data-form="weight" class="form">
        <div class="form-row"><div class="field grow"><label>Tarih</label><input name="date" type="date" max="${DateUtil.today()}" value="${DateUtil.today()}" required></div>
        <div class="field grow"><label>Kilo (kg)</label><input name="kg" type="number" min="20" max="400" step="0.1" required value="${w ?? ''}"></div></div>
        <button class="btn btn-primary btn-block" type="submit">${icon('plus')} Kaydet</button>
      </form>
      <div class="mini-hist mt">${[...s.weights].reverse().slice(0, 5).map(x => `<div class="mh-row"><span>${DateUtil.format(x.date)}</span><b>${fmt(x.kg)} kg</b>
        <button class="btn-icon sm" data-action="weight-del" data-date="${x.date}" aria-label="Sil">${icon('trash')}</button></div>`).join('')}</div>
    </div>
  </div>
  <div class="card">
    <div class="card-head"><span class="card-title">İlerleme Özeti</span><span class="muted sm">${rangeLabel}</span></div>
    <div class="kv-grid five">
      <div><small>Antrenman</small><b>${sess.length}</b></div>
      <div><small>Toplam Set</small><b>${fmt(sess.reduce((a, x) => a + x.setCount, 0))}</b></div>
      <div><small>Toplam Hacim</small><b>${fmt(Math.round(sess.reduce((a, x) => a + x.volume, 0) / 100) / 10)}</b><span>ton</span></div>
      <div><small>Ort. Süre</small><b>${sess.length ? Math.round(sess.reduce((a, x) => a + x.durationSec, 0) / sess.length / 60) : 0}</b><span>dk</span></div>
      <div><small>Yakılan</small><b>${fmt(sess.reduce((a, x) => a + (x.burned || 0), 0))}</b><span>kcal</span></div>
    </div>
  </div>
  <div class="grid g-2">
    <div class="card"><div class="card-head"><span class="card-title">Antrenman Hacmi</span><span class="muted sm">kg × tekrar</span></div>
      ${Charts.bars(volData, { unit: ' kg', labelEvery: every, empty: 'Bu aralıkta antrenman yok' })}</div>
    <div class="card"><div class="card-head"><span class="card-title">Kalori</span><span class="muted sm">${range === 'year' ? 'Aylık ortalama' : 'Günlük'}</span></div>
      ${Charts.bars(kcalData, { goal: s.settings.kcalGoal, unit: ' kcal', labelEvery: every })}</div>
    <div class="card"><div class="card-head"><span class="card-title">Protein</span><span class="muted sm">gram</span></div>
      ${Charts.bars(protData, { tone: 'violet', goal: s.settings.proteinGoal, unit: ' g', labelEvery: every })}</div>
    <div class="card"><div class="card-head"><span class="card-title">Su</span><span class="muted sm">litre</span></div>
      ${Charts.bars(waterData, { tone: 'blue', goal: s.settings.waterGoal / 1000, unit: ' L', labelEvery: every })}</div>
  </div>
  <div class="card">
    <div class="card-head"><span class="card-title">${icon('trophy')} Kişisel Rekorlar</span><span class="muted sm">Tahmini 1RM'e göre</span></div>
    ${prs.length ? `<div class="pr-list">${prs.map((p, i) => `<a href="#/exercise/${p.ex.id}" class="pr-item"><span class="pr-rank">${i + 1}</span>${thumb(p.ex, 'sm')}
      <div class="li-body"><span class="li-title">${esc(p.ex.name)}</span><span class="li-sub">${fmt(p.best.best.kg)} kg × ${p.best.best.reps} · ${DateUtil.format(p.best.date)}</span></div><b>${fmt(p.e1rm)} <small>kg</small></b></a>`).join('')}</div>`
      : emptyState('trophy', 'Henüz rekor yok', 'Ağırlıklı egzersizleri kaydettikçe en iyi performansların burada listelenir.')}
  </div>`;
}

/* 10) Egzersiz Kütüphanesi */
function libraryList() {
  const list = filterExercises({ q: ui.libQuery, group: ui.libGroup, equip: ui.libEquip });
  const shown = list.slice(0, ui.libLimit);
  return `<div class="muted sm lib-count">${list.length} egzersiz${list.length > shown.length ? ` · ${shown.length} gösteriliyor` : ''}</div>` + (list.length ? `<div class="lib-grid">${shown.map(e => `
    <a href="#/exercise/${e.id}" class="list-item lib-item">${thumb(e)}
      <div class="li-body"><span class="li-title">${esc(e.name)}</span><span class="li-sub">${e.group} · ${esc(e.equipment)} · ${e.level}</span></div>
      ${regionBadge(e)}${icon('right', 'li-end')}</a>`).join('')}</div>
      ${list.length > shown.length ? `<button class="btn btn-ghost btn-block mt" data-action="lib-more">Daha fazla göster (${list.length - shown.length} kaldı)</button>` : ''}`
    : emptyState('search', 'Sonuç bulunamadı', 'Farklı bir arama, kas grubu veya ekipman dene.'));
}
function pageLibrary() {
  return `
  ${pageHead('Egzersiz Kütüphanesi', `${EXERCISES.length} egzersiz · fotoğraflar, kas haritası ve uygulama adımları`)}
  <div class="card">
    <div class="lib-tools">
      <div class="search">${icon('search')}<input type="search" placeholder="Egzersiz, kas veya ekipman ara... (örn. bench, dumbbell, biceps)" value="${esc(ui.libQuery)}" data-input="lib-search" aria-label="Egzersiz ara"></div>
      <select data-change="lib-equip" aria-label="Ekipman filtresi"><option value="">Tüm ekipmanlar</option>${EQUIPMENTS.map(q => `<option${q === ui.libEquip ? ' selected' : ''}>${esc(q)}</option>`).join('')}</select>
    </div>
    <div class="chips">${['Tümü', ...MUSCLE_GROUPS].map(g => `<button class="chip${g === ui.libGroup ? ' active' : ''}" data-action="lib-group" data-g="${g}">${g}</button>`).join('')}</div>
    <div id="libList">${libraryList()}</div>
  </div>`;
}

/* 11) Profil */
function pageProfile() {
  const s = S(), p = s.profile, lv = level();
  const totalVol = s.sessions.reduce((a, x) => a + x.volume, 0);
  const totalSec = s.sessions.reduce((a, x) => a + x.durationSec, 0);
  const w = Store.currentWeight();
  const hM = p.height ? p.height / 100 : null;
  const bmi = w && hM ? round1(w / (hM * hM)) : null;
  const startW = s.weights.length ? s.weights[0].kg : null;
  let goalProg = null;
  if (p.goalWeight && startW && w && startW !== p.goalWeight) goalProg = clamp((startW - w) / (startW - p.goalWeight), 0, 1);
  return `
  ${pageHead('Profil', '', `<button class="btn btn-ghost" data-action="profile-edit">${icon('edit')} Düzenle</button>`)}
  <div class="card profile-head">
    <div class="avatar xl">${initials(p.name)}</div>
    <div class="ph-body">
      <h2>${esc(p.name || 'Sporcu')}</h2>
      <p class="muted">Hedef: ${(p.goals || []).map(g => GOALS[g] ? GOALS[g].label : '').filter(Boolean).join(', ') || 'Belirlenmedi'}</p>
      <div class="lvl"><span class="badge badge-red">Seviye ${lv.lvl}</span><span class="muted sm">Sonraki seviyeye ${lv.left} antrenman</span></div>
      ${Charts.progress(lv.progress, 1)}
    </div>
  </div>
  <div class="grid g-3">
    ${statCard({ ic: 'dumbbell', label: 'Toplam Antrenman', value: s.sessions.length })}
    ${statCard({ ic: 'trophy', label: 'Toplam Hacim', value: `${fmt(Math.round(totalVol / 100) / 10)} <small>ton</small>`, tone: 'violet' })}
    ${statCard({ ic: 'clock', label: 'Toplam Süre', value: `${fmt(Math.round(totalSec / 360) / 10)} <small>saat</small>`, tone: 'blue' })}
  </div>
  <div class="grid g-2">
    <div class="card">
      <div class="card-head"><span class="card-title">Vücut Bilgileri</span></div>
      <div class="kv-grid">
        <div><small>Boy</small><b>${p.height ?? '—'}</b><span>cm</span></div>
        <div><small>Kilo</small><b>${w ? fmt(w) : '—'}</b><span>kg</span></div>
        <div><small>Yaş</small><b>${p.age ?? '—'}</b></div>
        <div><small>VKİ</small><b>${bmi ? fmt(bmi) : '—'}</b></div>
        <div><small>Hedef Kilo</small><b>${p.goalWeight ? fmt(p.goalWeight) : '—'}</b><span>kg</span></div>
        <div><small>Cinsiyet</small><b>${p.gender === 'female' ? 'Kadın' : 'Erkek'}</b></div>
      </div>
      ${goalProg != null ? `<div class="goal-bar mt"><div class="gb-top"><span>Hedef kiloya ilerleme</span><b>%${Math.round(goalProg * 100)}</b></div>${Charts.progress(goalProg, 1)}</div>` : ''}
    </div>
    <div class="card">
      <div class="card-head"><span class="card-title">Hedefler</span><span class="muted sm">Seçmek için dokun</span></div>
      <div class="goal-list">${Object.entries(GOALS).map(([k, g]) => {
        const on = (p.goals || []).includes(k);
        return `<button class="goal-item${on ? ' active' : ''}" data-action="goal-toggle" data-k="${k}" aria-pressed="${on}"><span class="gi-ic">${icon(g.icon)}</span><b>${g.label}</b>${on ? icon('check', 'gi-check') : ''}</button>`;
      }).join('')}</div>
    </div>
  </div>
  <div class="card">
    <div class="card-head"><span class="card-title">Son Aktiviteler</span><a href="#/workout" class="card-link">Tümü ${icon('right')}</a></div>
    ${s.sessions.length ? `<div class="hist">${[...s.sessions].reverse().slice(0, 4).map(historyItem).join('')}</div>` : emptyState('activity', 'Henüz aktivite yok', 'Antrenmanların burada görünecek.')}
  </div>`;
}
function openProfileModal() {
  const p = S().profile;
  openModal('Profili Düzenle', `
    <form data-form="profile" class="form">
      <div class="field"><label>Ad</label><input name="name" maxlength="40" value="${esc(p.name)}" placeholder="Adın"></div>
      <div class="form-row four">
        <div class="field"><label>Cinsiyet</label><select name="gender"><option value="male"${p.gender === 'male' ? ' selected' : ''}>Erkek</option><option value="female"${p.gender === 'female' ? ' selected' : ''}>Kadın</option></select></div>
        <div class="field"><label>Yaş</label><input name="age" type="number" min="13" max="100" value="${p.age ?? ''}"></div>
        <div class="field"><label>Boy (cm)</label><input name="height" type="number" min="120" max="230" value="${p.height ?? ''}"></div>
        <div class="field"><label>Kilo (kg)</label><input name="weight" type="number" min="30" max="300" step="0.1" value="${Store.currentWeight() ?? ''}"></div>
      </div>
      <div class="form-row">
        <div class="field grow"><label>Hedef kilo (kg)</label><input name="goalWeight" type="number" min="30" max="300" step="0.1" value="${p.goalWeight ?? ''}"></div>
        <div class="field grow"><label>Aktivite</label><select name="activity">${[[1.2, 'Hareketsiz'], [1.375, 'Hafif aktif'], [1.55, 'Orta aktif'], [1.725, 'Çok aktif']].map(([v, l]) => `<option value="${v}"${+p.activity === v ? ' selected' : ''}>${l}</option>`).join('')}</select></div>
      </div>
      <div class="modal-actions"><button type="button" class="btn btn-ghost" data-action="modal-close">Vazgeç</button><button class="btn btn-primary" type="submit">Kaydet</button></div>
    </form>`);
}

/* 12) Ayarlar */
function pageSettings() {
  const st = S().settings;
  const toggle = (key, ic, title, sub) => `<div class="set-item"><span class="si-ic">${icon(ic)}</span><div class="si-body"><b>${title}</b><small>${sub}</small></div>
    <label class="switch"><input type="checkbox" data-change="setting-bool" data-key="${key}"${st[key] ? ' checked' : ''}><span></span></label></div>`;
  const link = (action, ic, title, sub, cls = '') => `<button class="set-item link ${cls}" data-action="${action}"><span class="si-ic">${icon(ic)}</span><div class="si-body"><b>${title}</b><small>${sub}</small></div>${icon('right', 'li-end')}</button>`;
  return `
  ${pageHead('Ayarlar', 'Uygulamayı kendine göre düzenle.')}
  <div class="grid g-2 settings-grid">
    <div class="col">
      <div class="card">
        <div class="card-head"><span class="card-title">${icon('calendar')} Antrenman</span></div>
        <div class="set-item"><span class="si-ic">${icon('dumbbell')}</span><div class="si-body"><b>Aktif program</b><small>Haftalık plan bu programa göre oluşur</small></div>
          <select data-change="program-select" aria-label="Aktif program">${Store.programs().map(p => `<option value="${p.id}"${p.id === st.program ? ' selected' : ''}>${esc(p.name)}</option>`).join('')}</select></div>
        ${link('go-programs', 'calendar', 'Kendi programını oluştur', 'Günleri ve antrenmanları sen belirle')}
        <div class="set-item"><span class="si-ic">${icon('timer')}</span><div class="si-body"><b>Varsayılan dinlenme</b><small>Serbest dinlenme sayacı süresi</small></div>
          <select data-change="setting-num" data-key="restDefault" aria-label="Varsayılan dinlenme">${[45, 60, 90, 120, 150, 180, 240].map(v => `<option value="${v}"${st.restDefault === v ? ' selected' : ''}>${v} sn</option>`).join('')}</select></div>
        ${toggle('autoRest', 'refresh', 'Otomatik dinlenme sayacı', 'Set tamamlandığında sayacı başlat')}
        ${toggle('sound', 'volume', 'Ses', 'Dinlenme bitince sesli uyarı')}
        ${toggle('vibrate', 'vibrate', 'Titreşim', 'Destekleyen cihazlarda titreşim')}
      </div>
      <div class="card">
        <div class="card-head"><span class="card-title">${icon('target')} Günlük Hedefler</span></div>
        <form data-form="goals" class="form">
          <div class="form-row">
            <div class="field grow"><label>Kalori (kcal)</label><input name="kcalGoal" type="number" min="800" max="8000" value="${st.kcalGoal}" required></div>
            <div class="field grow"><label>Su (ml)</label><input name="waterGoal" type="number" min="500" max="8000" step="50" value="${st.waterGoal}" required></div>
          </div>
          <div class="form-row">
            <div class="field grow"><label>Protein (g)</label><input name="proteinGoal" type="number" min="20" max="400" value="${st.proteinGoal}" required></div>
            <div class="field grow"><label>Karbonhidrat (g)</label><input name="carbGoal" type="number" min="0" max="1000" value="${st.carbGoal}" required></div>
            <div class="field grow"><label>Yağ (g)</label><input name="fatGoal" type="number" min="0" max="400" value="${st.fatGoal}" required></div>
          </div>
          <button class="btn btn-primary btn-block" type="submit">Hedefleri Kaydet</button>
        </form>
      </div>
    </div>
    <div class="col">
      <div class="card">
        <div class="card-head"><span class="card-title">${icon('moon')} Görünüm ve Bildirimler</span></div>
        <div class="set-item"><span class="si-ic">${icon('moon')}</span><div class="si-body"><b>Tema</b><small>Koyu lacivert veya tam siyah</small></div>
          <div class="seg sm"><button class="seg-btn${st.theme === 'dark' || !st.theme ? ' active' : ''}" data-action="theme" data-v="dark">Koyu</button><button class="seg-btn${st.theme === 'amoled' ? ' active' : ''}" data-action="theme" data-v="amoled">Siyah</button><button class="seg-btn${st.theme === 'light' ? ' active' : ''}" data-action="theme" data-v="light">Açık</button></div></div>
        ${toggle('notifyWater', 'drop', 'Su hatırlatıcı', IN_APP ? '09:00–21:00 arası 2 saatte bir bildirim (uygulama kapalıyken de)' : 'Uygulama açıkken 2 saatte bir')}
        ${toggle('notifyWorkout', 'bell', 'Antrenman hatırlatıcı', IN_APP ? 'Antrenman günlerinde seçtiğin saatte bildirim' : 'Yalnızca Android uygulamasında')}
        <div class="set-item"><span class="si-ic">${icon('clock')}</span><div class="si-body"><b>Antrenman bildirimi saati</b><small>Program günlerinde</small></div>
          <select data-change="setting-str" data-key="workoutTime" aria-label="Bildirim saati">${Array.from({ length: 17 }, (_, i) => `${String(i + 6).padStart(2, '0')}:00`).flatMap(h => [h, h.replace(':00', ':30')]).map(t => `<option${t === (st.workoutTime || '18:00') ? ' selected' : ''}>${t}</option>`).join('')}</select></div>
        ${link('widget-help', 'grid', 'Ana ekran widget\'ı', 'Su, protein ve kalori özetini ana ekranda gör')}
      </div>
      <div class="card">
        <div class="card-head"><span class="card-title">${icon('database')} Veri</span></div>
        ${link('profile-edit', 'user', 'Hesap bilgileri', 'Ad, boy, kilo ve hedefler')}
        ${link('export', 'download', 'Veri yedekleme', 'Tüm verileri JSON olarak dışa aktar')}
        ${link('import-open', 'upload', 'Yedekten geri yükle', 'Daha önce aldığın yedeği içe aktar')}
        ${link('demo-load', 'star', S().demo ? 'Demo verisi yüklü' : 'Örnek veri yükle', S().demo ? 'Örnek veriler gösteriliyor — sıfırlayarak temizleyebilirsin' : 'Uygulamayı denemek için örnek veriler (mevcut veriler silinir)')}
        ${link('reset-all', 'trash', 'Tüm verileri sıfırla', 'Bu işlem geri alınamaz', 'danger')}
      </div>
      <div class="card">
        <div class="card-head"><span class="card-title">${icon('info')} Hakkında</span></div>
        ${link('about', 'info', 'Uygulama hakkında', 'FITTRACK v2.0.0')}
        ${link('privacy', 'shield', 'Gizlilik', 'Verilerin yalnızca bu cihazda saklanır')}
      </div>
      <div class="card brand-card">
        ${photoBg('assets/img/ex/hammer-curl-1.jpg', 'brand-photo')}
        <div class="brand-card-text"><h3>Disiplin,<br>özgürlüğü <span>getirir.</span></h3>
        <span class="brand-text">${icon('dumbbell')} FIT<span>TRACK</span></span></div>
      </div>
    </div>
  </div>`;
}

const ROUTES = {
  home: pageHome, workout: pageWorkout, programs: pagePrograms, exercise: pageExercise,
  nutrition: pageNutrition, protein: pageProtein, calories: pageCalories, water: pageWater,
  stats: pageStats, library: pageLibrary, profile: pageProfile, settings: pageSettings
};

/* =========================================================
   MODAL: egzersiz seçici, onboarding, yedekleme
   ========================================================= */
function pickerList() {
  const list = filterExercises({ q: ui.pickQuery, group: ui.pickGroup });
  const shown = list.slice(0, 60);
  return list.length ? shown.map(e => `<button class="list-item" data-action="pick-ex" data-id="${e.id}" data-target="${ui.pickTarget}">
      ${thumb(e, 'sm')}<div class="li-body"><span class="li-title">${esc(e.name)}</span><span class="li-sub">${e.group} · ${esc(e.equipment)}</span></div>${icon('plus', 'li-end')}</button>`).join('')
    + (list.length > shown.length ? `<p class="hint center">${list.length - shown.length} sonuç daha var — aramayı daralt.</p>` : '')
    : emptyState('search', 'Sonuç yok', 'Farklı bir kelime dene.');
}
function openExercisePicker(target) {
  ui.pickTarget = target || '';
  ui.pickQuery = '';
  ui.pickGroup = 'Tümü';
  openModal('Egzersiz Ekle', `
    <div class="search">${icon('search')}<input type="search" placeholder="${EXERCISES.length} egzersiz içinde ara..." data-input="picker-search" aria-label="Egzersiz ara"></div>
    <div class="chips picker-chips">${['Tümü', ...MUSCLE_GROUPS].map(g => `<button class="chip${g === 'Tümü' ? ' active' : ''}" data-action="pick-group" data-g="${g}">${g}</button>`).join('')}</div>
    <div class="picker-list" id="pickerList">${pickerList()}</div>`, { wide: true });
}

function openOnboarding() {
  openModal('FITTRACK\'e Hoş Geldin', `
    <div class="onb-banner">${photoBg('assets/img/ex/squat-0.jpg')}<div><b>Daha güçlü bir sen</b><span>Programını, beslenmeni ve gelişimini tek yerden takip et.</span></div></div>
    <p class="muted">Sana uygun hedefleri hesaplayabilmemiz için birkaç bilgi gir. Tüm veriler yalnızca bu cihazda saklanır.</p>
    <form data-form="onboard" class="form">
      <div class="field"><label>Adın</label><input name="name" maxlength="40" placeholder="Adın" autocomplete="given-name"></div>
      <div class="form-row four">
        <div class="field"><label>Cinsiyet</label><select name="gender"><option value="male">Erkek</option><option value="female">Kadın</option></select></div>
        <div class="field"><label>Yaş</label><input name="age" type="number" min="13" max="100" placeholder="—"></div>
        <div class="field"><label>Boy (cm)</label><input name="height" type="number" min="120" max="230" placeholder="—"></div>
        <div class="field"><label>Kilo (kg)</label><input name="weight" type="number" min="30" max="300" step="0.1" placeholder="—"></div>
      </div>
      <div class="field"><label>Haftada kaç gün antrenman?</label>
        <div class="radio-seg"><label><input type="radio" name="days" value="3" checked><span>3 gün · Üst/Alt</span></label><label><input type="radio" name="days" value="4"><span>4 gün · Üst/Alt</span></label></div></div>
      <div class="field"><label>Ana hedefin</label><select name="goal">${Object.entries(GOALS).map(([k, g]) => `<option value="${k}">${g.label}</option>`).join('')}</select></div>
      <div class="modal-actions"><button type="button" class="btn btn-ghost" data-action="onboard-skip">Şimdilik Atla</button><button class="btn btn-primary" type="submit">Başlayalım ${icon('right')}</button></div>
    </form>`, { closable: false });
}

function calcTDEE({ gender, age, height, weight, activity }) {
  const bmr = 10 * weight + 6.25 * height - 5 * age + (gender === 'female' ? -161 : 5);
  return { bmr: Math.round(bmr), tdee: Math.round(bmr * activity) };
}
function macrosFor(kcal, weight) {
  const protein = Math.round((weight || 75) * 1.8);
  const fat = Math.round((kcal * 0.25) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { protein, fat, carbs };
}

function exportData() {
  const json = JSON.stringify(S(), null, 2);
  openModal('Veri Yedekleme', `
    <p class="muted">Aşağıdaki yedek tüm antrenman, beslenme, su ve profil verilerini içerir. Dosya olarak indirebilir veya kopyalayıp güvenli bir yerde saklayabilirsin.</p>
    <textarea class="code" readonly id="backupText" rows="8">${esc(json)}</textarea>
    <div class="modal-actions"><button class="btn ${IN_APP ? 'btn-primary' : 'btn-ghost'}" data-action="copy-backup">${icon('copy')} Kopyala</button>${IN_APP ? '' : `<button class="btn btn-primary" data-action="download-backup">${icon('download')} Dosya Olarak İndir</button>`}</div>
    ${IN_APP ? '<p class="hint">Uygulama içinde yedeği kopyalayıp bir not veya mesaj olarak saklayabilirsin.</p>' : ''}`, { wide: true });
}
function openImport() {
  openModal('Yedekten Geri Yükle', `
    <form data-form="import" class="form">
      ${IN_APP ? '' : '<div class="field"><label>Yedek dosyası (.json)</label><input type="file" accept="application/json,.json" data-change="import-file"></div>'}
      <div class="field"><label>${IN_APP ? 'Yedek metnini yapıştır' : 'veya yedek metnini yapıştır'}</label><textarea name="json" class="code" rows="7" placeholder='{"version":1, ...}' required></textarea></div>
      <p class="hint">Mevcut verilerin, yedekteki verilerle değiştirilecek.</p>
      <div class="modal-actions"><button type="button" class="btn btn-ghost" data-action="modal-close">Vazgeç</button><button class="btn btn-primary" type="submit">${icon('upload')} Geri Yükle</button></div>
    </form>`, { wide: true });
}

/* =========================================================
   OLAYLAR
   ========================================================= */
function startWorkout(tpl) {
  const go2 = () => { Store.startSession(tpl || null); toast(tpl ? `${S().templates[tpl].name} başladı. Başarılar! 💪` : 'Serbest antrenman başladı'); if (currentPage === 'workout') rerender(); else go('workout'); };
  if (S().active) confirmBox('Devam eden antrenman var', 'Mevcut antrenman kaydedilmeden kapatılıp yenisi başlatılsın mı?', 'Yeni Başlat', go2);
  else go2();
}

/* Ek modüllerin (extras.js) girdi/değişim işleyicileri */
const EXTRA_INPUTS = {};
const EXTRA_CHANGES = {};

const ACTIONS = {
  'go': (el) => go(el.dataset.to),
  'ex-frame': (el) => { el.classList.toggle('manual'); el.classList.toggle('show1'); },
  'back': () => { if (history.length > 1) history.back(); else go('library'); },
  'open-drawer': openDrawer,
  'close-drawer': closeDrawer,
  'modal-close': closeModal,
  'modal-bg': (el, e) => { if (e.target === el) closeModal(); },
  'confirm-yes': () => { const cb = pendingConfirm; closeModal(); if (cb) cb(); },

  /* Antrenman */
  'start-workout': (el) => startWorkout(el.dataset.tpl),
  'set-toggle': (el) => {
    const a = S().active; const e = a.exercises[+el.dataset.ei]; const st = e.sets[+el.dataset.si];
    st.done = !st.done;
    if (st.done && (st.reps === '' || +st.reps <= 0)) st.reps = parseInt(e.target, 10) || 10;
    Store.save();
    if (st.done) {
      buzz(40);
      const allDone = a.exercises.every(x => x.sets.every(y => y.done));
      if (allDone) toast('Tüm setler tamamlandı! Antrenmanı bitirip kaydedebilirsin 🏆');
      else if (S().settings.autoRest) {
        const ei = +el.dataset.ei;
        if (e.ss && ei < a.exercises.length - 1) toast(`Süperset: şimdi ${esc(EX_BY_ID[a.exercises[ei + 1].ex].name)} 🔁`, 'info');
        else if (st.t !== 'w') Rest.start(EX_BY_ID[e.ex].rest || S().settings.restDefault);
      }
    }
    rerender();
  },
  'set-add': (el) => {
    const e = S().active.exercises[+el.dataset.ei];
    const last = e.sets[e.sets.length - 1] || { kg: '', reps: parseInt(e.target, 10) || 10 };
    e.sets.push({ kg: last.kg, reps: last.reps, done: false });
    Store.save(); rerender();
  },
  'set-remove': (el) => {
    const e = S().active.exercises[+el.dataset.ei];
    if (e.sets.length > 1) { e.sets.pop(); Store.save(); rerender(); }
  },
  'ex-remove': (el) => {
    const i = +el.dataset.ei;
    const name = EX_BY_ID[S().active.exercises[i].ex].name;
    confirmBox('Egzersizi kaldır', `<b>${esc(name)}</b> bu antrenmandan kaldırılsın mı?`, 'Kaldır', () => { S().active.exercises.splice(i, 1); Store.save(); rerender(); });
  },
  'ex-picker': (el) => openExercisePicker(el.dataset.target || ''),
  'pick-ex': (el) => {
    const id = el.dataset.id, ex = EX_BY_ID[id];
    if (el.dataset.target === 'tpl') {
      S().templates[ui.progTpl].items.push({ ex: id, sets: ex.sets, reps: ex.reps });
      Store.save(); rerender(); toast(`${esc(ex.name)} eklendi — eklemeye devam edebilirsin`);
      el.classList.add('picked'); el.disabled = true;
    } else {
      Store.addExerciseToActive(id); closeModal(); toast(`${ex.name} eklendi`);
      if (currentPage === 'workout') rerender(); else go('workout');
    }
  },
  'ex-add-to-workout': (el) => {
    const ex = EX_BY_ID[el.dataset.id];
    Store.addExerciseToActive(ex.id);
    toast(`${ex.name} antrenmana eklendi`);
    go('workout');
  },
  'finish-workout': () => {
    const a = S().active;
    const done = a.exercises.reduce((n, e) => n + e.sets.filter(st => st.done).length, 0);
    if (!done) {
      confirmBox('Tamamlanan set yok', 'Hiç set işaretlenmedi. Antrenman kaydedilmeden kapatılsın mı?', 'Kapat', () => { Store.discardSession(); Rest.stop(); rerender(); });
      return;
    }
    confirmBox('Antrenmanı bitir', `${done} tamamlanan set kaydedilecek. İşaretlenmemiş setler kaydedilmez.`, 'Bitir ve Kaydet', () => {
      const sess = Store.finishSession(); Rest.stop();
      if (sess) {
        ui.openSession = sess.id;
        openModal('Antrenman Tamamlandı 🏆', `
          <div class="done-modal">${icon('trophy', 'ic-xl')}<h3>${esc(sess.title)}</h3>
          <div class="kv-grid"><div><small>Süre</small><b>${fmtDur(sess.durationSec)}</b></div><div><small>Set</small><b>${sess.setCount}</b></div>
          <div><small>Hacim</small><b>${fmt(sess.volume)}</b><span>kg</span></div><div><small>Kalori</small><b>~${fmt(sess.burned)}</b><span>kcal</span></div></div></div>
          <div class="modal-actions"><button class="btn btn-primary btn-block" data-action="modal-close">Harika!</button></div>`);
      }
      rerender();
    }, false);
  },
  'cancel-workout': () => confirmBox('Antrenmanı iptal et', 'Bu antrenmandaki kayıtlar silinecek. Emin misin?', 'İptal Et', () => { Store.discardSession(); Rest.stop(); rerender(); toast('Antrenman iptal edildi', 'info'); }),
  'session-toggle': (el) => { ui.openSession = ui.openSession === el.dataset.id ? null : el.dataset.id; rerender(); },
  'session-delete': (el) => confirmBox('Antrenmanı sil', 'Bu antrenman kaydı kalıcı olarak silinecek.', 'Sil', () => { Store.deleteSession(el.dataset.id); rerender(); toast('Antrenman silindi', 'info'); }),
  'hist-all': () => { ui.histAll = !ui.histAll; rerender(); },

  /* Dinlenme */
  'rest-start': (el) => Rest.start(+el.dataset.sec),
  'rest-add': (el) => Rest.add(+el.dataset.sec),
  'rest-stop': () => Rest.stop(),

  /* Program */
  'days-set': (el) => ACTIONS['program-set']({ dataset: { id: +el.dataset.days === 4 ? 'ul4' : 'ul3' } }),
  'program-set': (el) => {
    const p = Store.programs().find(x => x.id === el.dataset.id);
    if (!p || S().settings.program === p.id) return;
    Store.setProgram(p.id); rerender();
    toast(`Aktif program: ${esc(p.name)}`);
  },
  'program-edit': (el) => openProgramModal(el.dataset.id || null),
  'program-delete': (el) => {
    const p = S().programs.find(x => x.id === el.dataset.id);
    if (!p) return;
    confirmBox('Programı sil', `<b>${esc(p.name)}</b> silinsin mi? İçindeki antrenmanlar silinmez.`, 'Sil', () => { Store.deleteProgram(p.id); rerender(); toast('Program silindi', 'info'); });
  },
  'tpl-new': () => openTemplateModal(null),
  'tpl-edit': () => openTemplateModal(ui.progTpl),
  'tpl-delete': () => {
    const t = S().templates[ui.progTpl];
    if (!t || !t.custom) return;
    confirmBox('Antrenmanı sil', `<b>${esc(t.name)}</b> silinsin mi? Programlardaki ilgili günler dinlenme olarak kalır.`, 'Sil', () => {
      Store.deleteTemplate(ui.progTpl); ui.progTpl = 'upperA'; rerender(); toast('Antrenman silindi', 'info');
    });
  },
  'lib-more': () => { ui.libLimit += 60; $('#libList').innerHTML = libraryList(); },
  'pick-group': (el) => {
    ui.pickGroup = el.dataset.g;
    document.querySelectorAll('.picker-chips .chip').forEach(c => c.classList.toggle('active', c === el));
    $('#pickerList').innerHTML = pickerList(); $('#pickerList').scrollTop = 0;
  },
  'tpl-tab': (el) => { ui.progTpl = el.dataset.tpl; rerender(); },
  'tpl-remove': (el) => {
    const items = S().templates[ui.progTpl].items;
    if (items.length <= 1) return toast('Şablonda en az bir egzersiz olmalı', 'err');
    items.splice(+el.dataset.i, 1); Store.save(); rerender();
  },
  'tpl-move': (el) => {
    const items = S().templates[ui.progTpl].items, i = +el.dataset.i, j = i + +el.dataset.dir;
    if (j < 0 || j >= items.length) return;
    [items[i], items[j]] = [items[j], items[i]]; Store.save(); rerender();
  },
  'tpl-reset': () => confirmBox('Şablonu sıfırla', `${S().templates[ui.progTpl].name} varsayılan egzersizlere döndürülsün mü?`, 'Sıfırla', () => {
    S().templates[ui.progTpl] = clone(DEFAULT_TEMPLATES[ui.progTpl]); Store.save(); rerender(); toast('Şablon sıfırlandı');
  }),

  /* Beslenme */
  'nut-date': (el) => {
    const nd = DateUtil.addDays(ui.nutDate, +el.dataset.d);
    if (nd > DateUtil.today()) return;
    ui.nutDate = nd; rerender();
  },
  'food-open': (el) => openFoodModal(el.dataset.meal || ''),
  'food-del': (el) => { Store.removeFood(el.dataset.date, el.dataset.id); rerender(); toast('Kayıt silindi', 'info'); },
  'protein-quick': (el) => {
    Store.addFood(DateUtil.today(), { name: el.dataset.name, meal: 'Ara Öğün', protein: +el.dataset.g, kcal: +el.dataset.k });
    rerender(); toast(`+${el.dataset.g} g protein eklendi`);
  },
  'protein-goal': (el) => { S().settings.proteinGoal = +el.dataset.v; Store.save(); rerender(); toast(`Protein hedefi ${el.dataset.v} g oldu`); },
  'tdee-apply': () => {
    const r = ui.tdee; if (!r) return;
    Object.assign(S().settings, { kcalGoal: r.target, proteinGoal: r.protein, fatGoal: r.fat, carbGoal: r.carbs });
    Store.save(); ui.tdee = null; rerender(); toast('Kalori ve makro hedeflerin güncellendi');
  },

  /* Su */
  'water-add': (el) => {
    const before = Store.waterTotal(DateUtil.today());
    Store.addWater(DateUtil.today(), +el.dataset.ml);
    const after = Store.waterTotal(DateUtil.today());
    rerender();
    if (before < S().settings.waterGoal && after >= S().settings.waterGoal) toast('Günlük su hedefine ulaştın! 💧');
    else toast(`+${el.dataset.ml} ml su eklendi`);
  },
  'water-del': (el) => { Store.removeWater(DateUtil.today(), el.dataset.id); rerender(); },

  /* İstatistik */
  'stats-range': (el) => { ui.statsRange = el.dataset.r; rerender(); },
  'weight-del': (el) => { Store.removeWeight(el.dataset.date); rerender(); },

  /* Kütüphane */
  'lib-group': (el) => { ui.libGroup = el.dataset.g; ui.libLimit = 40; rerender(); },

  /* Profil */
  'profile-edit': openProfileModal,
  'goal-toggle': (el) => {
    const g = S().profile.goals || (S().profile.goals = []);
    const k = el.dataset.k, i = g.indexOf(k);
    if (i >= 0) g.splice(i, 1); else g.push(k);
    Store.save(); rerender();
  },

  /* Ayarlar */
  'theme': (el) => { S().settings.theme = el.dataset.v; Store.save(); applyTheme(); rerender(); },
  'export': exportData,
  'go-programs': () => go('programs'),
  'widget-help': () => openModal('Ana Ekran Widget\'ı', `
    <div class="widget-demo"><div class="wd-top"><b>FIT<span>TRACK</span></b><small>Bugün: Üst Vücut A</small></div>
      <div class="wd-cells"><div><small>Su</small><b>1250 ml</b><i style="--p:42%;--c:var(--sky)"></i></div><div><small>Protein</small><b>88 g</b><i style="--p:59%;--c:#a78bfa"></i></div><div><small>Kalori</small><b>1.082 kcal</b><i style="--p:43%;--c:var(--red)"></i></div></div>
      <div class="wd-btn">+ 250 ml su ekle</div></div>
    <ol class="steps"><li><span>Telefonunda ana ekranda boş bir yere uzun bas.</span></li><li><span><b>Widget'lar</b>'a dokun ve listede <b>FITTRACK</b>'i bul.</span></li><li><span>Widget'ı ana ekrana sürükle. Uygulamada yaptığın her kayıt widget'a otomatik yansır.</span></li><li><span><b>+250 ml su ekle</b> butonuyla uygulamayı açmadan su ekleyebilirsin; uygulamayı açtığında kayda işlenir.</span></li></ol>
    ${IN_APP ? '' : '<p class="hint">Widget yalnızca Android uygulamasında (APK) kullanılabilir.</p>'}`),
  'copy-backup': () => {
    const ta = $('#backupText');
    const done = () => toast('Yedek panoya kopyalandı');
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(ta.value).then(done, () => { ta.select(); document.execCommand('copy'); done(); });
    else { ta.select(); document.execCommand('copy'); done(); }
  },
  'download-backup': () => {
    const blob = new Blob([JSON.stringify(S(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `fittrack-yedek-${DateUtil.today()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Yedek dosyası hazırlandı');
  },
  'import-open': openImport,
  'demo-load': () => confirmBox('Örnek veri yükle', 'Mevcut tüm verilerin silinecek ve yerine açıkça "Demo" olarak işaretlenmiş örnek veriler yüklenecek. Devam edilsin mi?', 'Yükle', () => {
    Store.loadDemo(); applyTheme(); go('home'); render(); toast('Örnek veriler yüklendi');
  }, false),
  'reset-all': () => confirmBox('Tüm verileri sıfırla', 'Antrenman, beslenme, su, kilo ve profil verilerinin tamamı silinecek. Bu işlem geri alınamaz.', 'Her Şeyi Sil', () => {
    Rest.stop(); Store.reset(); applyTheme(); go('home'); render(); openOnboarding();
  }),
  'about': () => openModal('FITTRACK Hakkında', `
    <div class="about"><div class="brand big">${icon('dumbbell')}<span class="brand-text">FIT<span>TRACK</span></span></div>
    <p class="muted">Sürüm 2.0.0 · Daha güçlü bir sen.</p>
    <p>FITTRACK; üst/alt vücut bölünmüş antrenman programı, set–tekrar–ağırlık takibi, dinlenme sayacı, beslenme, protein, kalori ve su takibini tek bir yerde toplayan, tamamen çevrimdışı çalışan bir fitness uygulamasıdır.</p>
    <p class="hint">Egzersiz fotoğrafları: Free Exercise DB (kamu malı, Unlicense). HTML5, CSS3 ve saf JavaScript ile geliştirilmiştir. Kalori ve vücut yağı hesaplamaları tahminidir; tıbbi tavsiye yerine geçmez.</p></div>`),
  'privacy': () => openModal('Gizlilik', `
    <p>FITTRACK hiçbir sunucuya veri göndermez. Girdiğin tüm bilgiler yalnızca bu cihazdaki tarayıcı depolamasında (LocalStorage) tutulur.</p>
    <ul class="tips">${['Hesap veya giriş gerekmez.', 'Reklam ve takip aracı yoktur.', 'Verilerini istediğin zaman yedekleyebilir veya tamamen silebilirsin.'].map(x => `<li>${icon('check')}<span>${x}</span></li>`).join('')}</ul>`),
  'onboard-skip': () => { S().onboarded = true; S().profile.name = S().profile.name || ''; Store.save(); closeModal(); render(); }
};

const FORMS = {
  food(d) {
    if (d.fav) {
      const favs = S().favorites || (S().favorites = []);
      const nm = d.name.trim();
      if (!favs.some(f => f.name === nm)) favs.push({ id: uid(), name: nm, kcal: Math.round(+d.kcal || 0), protein: round1(+d.protein || 0), carbs: round1(+d.carbs || 0), fat: round1(+d.fat || 0) });
    }
    Store.addFood(ui.nutDate && currentPage === 'nutrition' ? ui.nutDate : DateUtil.today(), d);
    closeModal(); rerender(); toast(`${esc(d.name)} eklendi`);
  },
  protein(d) {
    const g = +d.g;
    Store.addFood(DateUtil.today(), { name: d.name || 'Protein', meal: 'Ara Öğün', protein: g, kcal: Math.round(g * 4) });
    rerender(); toast(`+${fmt(g)} g protein eklendi`);
  },
  kcal(d) {
    Store.addFood(DateUtil.today(), { name: d.name || 'Hızlı kalori', meal: 'Ara Öğün', kcal: +d.kcal });
    rerender(); toast(`+${d.kcal} kcal eklendi`);
  },
  water(d) { Store.addWater(DateUtil.today(), +d.ml); rerender(); toast(`+${d.ml} ml su eklendi`); },
  'goal-one'(d) { S().settings[d.key] = Math.round(+d.v); Store.save(); rerender(); toast('Hedef güncellendi'); },
  goals(d) {
    ['kcalGoal', 'proteinGoal', 'carbGoal', 'fatGoal', 'waterGoal'].forEach(k => { S().settings[k] = Math.round(+d[k]); });
    Store.save(); rerender(); toast('Hedefler kaydedildi');
  },
  weight(d) {
    if (Store.addWeight(d.date, d.kg)) { rerender(); toast('Kilo kaydedildi'); } else toast('Geçerli bir kilo gir', 'err');
  },
  tdee(d) {
    const v = { gender: d.gender, age: +d.age, height: +d.height, weight: +d.weight, activity: +d.activity };
    const { bmr, tdee } = calcTDEE(v);
    const target = Math.round((tdee + +d.goal) / 10) * 10;
    ui.tdee = { bmr, tdee, target, ...macrosFor(target, v.weight) };
    Object.assign(S().profile, { gender: v.gender, age: v.age, height: v.height, activity: v.activity });
    if (v.weight && v.weight !== Store.currentWeight()) Store.addWeight(DateUtil.today(), v.weight);
    Store.save(); rerender();
  },
  program(d) {
    const created = [];
    const schedule = DAY_NAMES.map((day, i) => {
      const v = d['d' + i];
      if (v === '__new__') {
        const k = Store.createTemplate(`${(d.name || 'Program').trim()} · ${day}`, 'full', 'Özel antrenman');
        created.push(k);
        return k;
      }
      return v || null;
    });
    if (!schedule.some(Boolean)) { toast('En az bir güne antrenman ata', 'err'); return; }
    const p = Store.saveProgram({ id: d.id, name: d.name, schedule });
    if (d.activate) Store.setProgram(p.id);
    closeModal();
    if (created.length) ui.progTpl = created[0];
    rerender();
    toast(created.length ? `${esc(p.name)} kaydedildi. Şimdi yeni antrenmanlara egzersiz ekle 💪` : `${esc(p.name)} kaydedildi`);
    if (created.length) setTimeout(() => { const el = $('.tpl-head'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
  },
  template(d) {
    if (d.key) { Store.updateTemplate(d.key, d); toast('Antrenman güncellendi'); }
    else { ui.progTpl = Store.createTemplate(d.name, d.type, d.focus); toast(`${esc(d.name)} oluşturuldu — şimdi egzersiz ekle`); }
    closeModal();
    if (currentPage === 'programs') rerender(); else go('programs');
  },
  profile(d) {
    const p = S().profile;
    p.name = d.name.trim();
    p.gender = d.gender;
    p.age = d.age ? +d.age : null;
    p.height = d.height ? +d.height : null;
    p.goalWeight = d.goalWeight ? +d.goalWeight : null;
    p.activity = +d.activity;
    if (d.weight && +d.weight !== Store.currentWeight()) Store.addWeight(DateUtil.today(), d.weight);
    Store.save(); closeModal(); render(true); toast('Profil güncellendi');
  },
  onboard(d) {
    const s = S(), p = s.profile;
    p.name = (d.name || '').trim();
    p.gender = d.gender;
    p.age = d.age ? +d.age : null;
    p.height = d.height ? +d.height : null;
    p.goals = [d.goal];
    Store.setProgram(+d.days === 4 ? 'ul4' : 'ul3');
    s.settings.programStart = DateUtil.weekStart();
    if (d.weight) {
      Store.addWeight(DateUtil.today(), d.weight);
      const w = +d.weight;
      s.settings.waterGoal = clamp(Math.round(w * 35 / 250) * 250, 2000, 4500);
      if (p.age && p.height) {
        const adj = d.goal === 'muscle' ? 300 : d.goal === 'fatloss' ? -400 : 0;
        const kcal = Math.round((calcTDEE({ gender: p.gender, age: p.age, height: p.height, weight: w, activity: 1.55 }).tdee + adj) / 10) * 10;
        const m = macrosFor(kcal, w);
        Object.assign(s.settings, { kcalGoal: kcal, proteinGoal: m.protein, fatGoal: m.fat, carbGoal: m.carbs });
      } else s.settings.proteinGoal = Math.round(w * 1.8);
    }
    s.onboarded = true;
    Store.save(); closeModal(); render();
    toast(p.name ? `Hoş geldin ${esc(p.name)}! Hedeflerin hazır.` : 'Hoş geldin! Hedeflerin hazır.');
  },
  import(d) {
    try { Store.importJSON(d.json); closeModal(); applyTheme(); render(); toast('Yedek başarıyla geri yüklendi'); }
    catch (e) { toast('Yedek okunamadı: geçersiz veri', 'err'); }
  }
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const fn = ACTIONS[el.dataset.action];
  if (!fn) return;
  if (el.tagName === 'A' || el.tagName === 'BUTTON') e.preventDefault();
  fn(el, e);
});

document.addEventListener('submit', (e) => {
  const form = e.target.closest('form[data-form]');
  if (!form) return;
  e.preventDefault();
  const fn = FORMS[form.dataset.form];
  if (fn) fn(Object.fromEntries(new FormData(form)), form);
});

document.addEventListener('change', (e) => {
  const el = e.target;
  const kind = el.dataset.change;
  if (!kind) return;
  if (EXTRA_CHANGES[kind]) { EXTRA_CHANGES[kind](el); return; }
  if (kind === 'setting-bool') {
    S().settings[el.dataset.key] = el.checked; Store.save();
    if (/^notify/.test(el.dataset.key) && el.checked) {
      if (window.FitBridge && window.FitBridge.requestNotifPermission) { try { window.FitBridge.requestNotifPermission(); } catch (e) { /* yok */ } }
      toast(el.dataset.key === 'notifyWater' ? 'Su hatırlatıcı açıldı 💧' : 'Antrenman hatırlatıcı açıldı 💪', 'info');
    }
  } else if (kind === 'program-select') {
    ACTIONS['program-set']({ dataset: { id: el.value } });
  } else if (kind === 'lib-equip') {
    ui.libEquip = el.value; ui.libLimit = 40; $('#libList').innerHTML = libraryList();
  } else if (kind === 'setting-str') {
    S().settings[el.dataset.key] = el.value; Store.save(); toast('Ayar kaydedildi');
  } else if (kind === 'setting-num') {
    S().settings[el.dataset.key] = +el.value; Store.save(); toast('Ayar kaydedildi');
  } else if (kind === 'tpl-field') {
    const it = S().templates[ui.progTpl].items[+el.dataset.i];
    if (el.dataset.f === 'sets') it.sets = clamp(parseInt(el.value, 10) || 1, 1, 10);
    else it.reps = el.value.trim() || '10';
    Store.save(); rerender();
  } else if (kind === 'import-file') {
    const file = el.files && el.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => { el.closest('form').json.value = r.result; };
    r.readAsText(file);
  }
});

let saveTimer = null;
document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.dataset.input && EXTRA_INPUTS[el.dataset.input]) { EXTRA_INPUTS[el.dataset.input](el); return; }
  if (el.hasAttribute('data-set')) {
    const a = S().active; if (!a) return;
    const st = a.exercises[+el.dataset.ei].sets[+el.dataset.si];
    st[el.dataset.f] = el.value === '' ? '' : +el.value;
    clearTimeout(saveTimer); saveTimer = setTimeout(() => Store.save(), 300);
  } else if (el.dataset.input === 'lib-search') {
    ui.libQuery = el.value; ui.libLimit = 40;
    clearTimeout(saveTimer); saveTimer = setTimeout(() => { $('#libList').innerHTML = libraryList(); }, 120);
  } else if (el.dataset.input === 'food-search') {
    ui.foodQuery = el.value;
    const r = $('#foodResults'); if (r) r.innerHTML = foodResults(el.value, ui.foodCat || 'Tümü');
  } else if (el.dataset.input === 'food-portion') {
    applyFoodBase(el.closest('form'));
  } else if (el.dataset.input === 'session-note') {
    if (S().active) { S().active.note = el.value; clearTimeout(saveTimer); saveTimer = setTimeout(() => Store.save(), 400); }
  } else if (el.dataset.input === 'picker-search') {
    ui.pickQuery = el.value;
    clearTimeout(saveTimer); saveTimer = setTimeout(() => { const pl = $('#pickerList'); if (pl) { pl.innerHTML = pickerList(); pl.scrollTop = 0; } }, 120);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if ($('#modalRoot .modal-backdrop[data-action]')) closeModal();
    closeDrawer();
  }
});

/* ---------------- Android ana ekran widget'ı ---------------- */
/* Uygulama APK içinde çalışırken (FitBridge) günlük özet widget'a gönderilir. */
function syncWidget() {
  if (!window.FitBridge || !S()) return;
  try {
    const s = S(), t = DateUtil.today();
    const tot = Store.totals(t), water = Store.waterTotal(t);
    const plan = Store.todayPlan();
    const tpl = plan && plan.tpl ? s.templates[plan.tpl] : null;
    const line = s.active ? `▶ ${s.active.title}` : plan && plan.done ? '✓ Antrenman tamamlandı'
      : tpl ? `Bugün: ${tpl.name}` : 'Bugün dinlenme günü';
    window.FitBridge.update(t, line, Math.round(water), Math.round(s.settings.waterGoal),
      `${Math.round(tot.protein)} g`, clamp(pct(tot.protein, s.settings.proteinGoal), 0, 100),
      `${fmt(tot.kcal)} kcal`, clamp(pct(tot.kcal, s.settings.kcalGoal), 0, 100));
  } catch (e) { /* widget isteğe bağlıdır */ }
}
let widgetTimer = null;
function onStoreSaved() { clearTimeout(widgetTimer); widgetTimer = setTimeout(syncWidget, 400); }
/* Widget'taki "+250 ml" ile eklenen suyu uygulamaya aktar (Android onResume'da çağırır) */
window.fitOnResume = function () {
  if (!window.FitBridge) return;
  let ml = 0;
  try { ml = +window.FitBridge.takePendingWater() || 0; } catch (e) { ml = 0; }
  if (ml > 0) {
    const t = DateUtil.today();
    for (let i = 0; i < Math.floor(ml / 250); i++) Store.addWater(t, 250);
    if (ml % 250) Store.addWater(t, ml % 250);
    rerender();
    toast(`Widget'tan ${ml} ml su eklendi 💧`, 'info');
  } else syncWidget();
};

/* ---------------- Tema / hatırlatıcı ---------------- */
function applyTheme() {
  const th = S().settings.theme;
  document.documentElement.dataset.theme = th === 'amoled' || th === 'light' ? th : 'dark';
  const meta = document.querySelector('meta[name=theme-color]');
  if (meta) meta.content = th === 'light' ? '#f3f5fa' : th === 'amoled' ? '#000000' : '#07090f';
}
let lastReminder = Date.now();
function reminderTick() {
  const s = S();
  if (!s.settings.notifyWater || window.FitBridge) return;
  const h = new Date().getHours();
  if (Date.now() - lastReminder >= 2 * 3600 * 1000 && h >= 8 && h <= 22) {
    lastReminder = Date.now();
    const left = s.settings.waterGoal - Store.waterTotal(DateUtil.today());
    if (left > 0) { toast(`Su içme zamanı! Hedefe ${fmt(left)} ml kaldı 💧`, 'info'); buzz(150); }
  }
}

/* ---------------- Başlangıç ---------------- */
function init() {
  Store.load();
  applyTheme();
  buildNav();
  window.addEventListener('hashchange', () => { closeDrawer(); render(); });
  render();
  if (!S().onboarded) openOnboarding();
  window.fitOnResume();
  setInterval(tickSession, 1000);
  setInterval(reminderTick, 60 * 1000);
  // Gün değişimini yakala (uygulama gece açık kalırsa)
  let day = DateUtil.today();
  setInterval(() => { if (DateUtil.today() !== day) { day = DateUtil.today(); ui.nutDate = day; rerender(); } }, 60 * 1000);
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}
document.addEventListener('DOMContentLoaded', init);
