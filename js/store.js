/* =========================================================
   FITTRACK — Veri katmanı (LocalStorage)
   ========================================================= */
'use strict';

const STORAGE_KEY = 'fittrack:v1';

/* ---------- Tarih yardımcıları (yerel saat) ---------- */
const DateUtil = {
  key(d = new Date()) {
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },
  today() { return DateUtil.key(new Date()); },
  parse(key) { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d); },
  addDays(key, n) { const d = DateUtil.parse(key); d.setDate(d.getDate() + n); return DateUtil.key(d); },
  /* Pazartesi = 0 */
  weekday(key) { return (DateUtil.parse(key).getDay() + 6) % 7; },
  weekStart(key = DateUtil.today()) { return DateUtil.addDays(key, -DateUtil.weekday(key)); },
  diffDays(a, b) { return Math.round((DateUtil.parse(a) - DateUtil.parse(b)) / 86400000); },
  format(key, opts = {}) {
    const d = DateUtil.parse(key);
    const base = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
    return opts.year === false ? base : `${base} ${d.getFullYear()}`;
  },
  formatShort(key) { const d = DateUtil.parse(key); return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`; },
  time(ts = Date.now()) { const d = new Date(ts); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; }
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clone = (o) => JSON.parse(JSON.stringify(o));
const round1 = (n) => Math.round(n * 10) / 10;

function defaultState() {
  return {
    version: 1,
    onboarded: false,
    demo: false,
    profile: { name: '', gender: 'male', age: null, height: null, weight: null, goalWeight: null, activity: 1.55, goals: ['muscle'], createdAt: DateUtil.today() },
    settings: {
      days: 3, kcalGoal: 2500, proteinGoal: 150, carbGoal: 300, fatGoal: 80, waterGoal: 3000,
      restDefault: 90, autoRest: true, sound: true, vibrate: true, theme: 'dark', reminders: false,
      programStart: DateUtil.weekStart()
    },
    templates: clone(DEFAULT_TEMPLATES),
    sessions: [],   // tamamlanan antrenmanlar
    active: null,   // devam eden antrenman
    food: {},       // { 'YYYY-MM-DD': [ {id,name,meal,kcal,protein,carbs,fat,time} ] }
    water: {},      // { 'YYYY-MM-DD': [ {id,ml,time} ] }
    weights: []     // [ {date,kg} ]
  };
}

/* Eksik alanları varsayılanlarla tamamla (eski sürüm verileri için) */
function migrate(s) {
  const d = defaultState();
  const out = Object.assign(d, s);
  out.profile = Object.assign(defaultState().profile, s.profile || {});
  out.settings = Object.assign(defaultState().settings, s.settings || {});
  out.templates = Object.assign(clone(DEFAULT_TEMPLATES), s.templates || {});
  ['sessions', 'weights'].forEach(k => { if (!Array.isArray(out[k])) out[k] = []; });
  ['food', 'water'].forEach(k => { if (!out[k] || typeof out[k] !== 'object') out[k] = {}; });
  return out;
}

const Store = {
  state: null,

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.state = raw ? migrate(JSON.parse(raw)) : defaultState();
    } catch (e) {
      console.warn('Veri okunamadı, varsayılanlar kullanılıyor.', e);
      this.state = defaultState();
    }
    return this.state;
  },

  save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state)); }
    catch (e) { console.error('Kaydetme hatası', e); }
  },

  reset() { this.state = defaultState(); this.save(); },

  importJSON(text) {
    const data = JSON.parse(text);
    if (!data || typeof data !== 'object' || !data.settings) throw new Error('Geçersiz yedek dosyası');
    this.state = migrate(data);
    this.save();
  },

  /* ---------------- Beslenme ---------------- */
  foodOf(date) { return this.state.food[date] || []; },
  addFood(date, entry) {
    const e = {
      id: uid(), time: DateUtil.time(), meal: entry.meal || 'Ara Öğün', name: (entry.name || 'Besin').trim(),
      kcal: Math.max(0, Math.round(+entry.kcal || 0)), protein: Math.max(0, round1(+entry.protein || 0)),
      carbs: Math.max(0, round1(+entry.carbs || 0)), fat: Math.max(0, round1(+entry.fat || 0))
    };
    (this.state.food[date] ||= []).push(e);
    this.save();
    return e;
  },
  removeFood(date, id) {
    this.state.food[date] = this.foodOf(date).filter(f => f.id !== id);
    this.save();
  },
  totals(date) {
    return this.foodOf(date).reduce((t, f) => {
      t.kcal += f.kcal; t.protein += f.protein; t.carbs += f.carbs; t.fat += f.fat; return t;
    }, { kcal: 0, protein: 0, carbs: 0, fat: 0 });
  },

  /* ---------------- Su ---------------- */
  waterOf(date) { return this.state.water[date] || []; },
  addWater(date, ml) {
    ml = Math.round(+ml);
    if (!ml || ml <= 0) return;
    (this.state.water[date] ||= []).push({ id: uid(), ml, time: DateUtil.time() });
    this.save();
  },
  removeWater(date, id) {
    this.state.water[date] = this.waterOf(date).filter(w => w.id !== id);
    this.save();
  },
  waterTotal(date) { return this.waterOf(date).reduce((a, w) => a + w.ml, 0); },

  /* ---------------- Vücut ağırlığı ---------------- */
  addWeight(date, kg) {
    kg = round1(+kg);
    if (!kg || kg < 20 || kg > 400) return false;
    const list = this.state.weights.filter(w => w.date !== date);
    list.push({ date, kg });
    list.sort((a, b) => a.date.localeCompare(b.date));
    this.state.weights = list;
    this.state.profile.weight = list[list.length - 1].kg;
    this.save();
    return true;
  },
  removeWeight(date) {
    this.state.weights = this.state.weights.filter(w => w.date !== date);
    const last = this.state.weights[this.state.weights.length - 1];
    if (last) this.state.profile.weight = last.kg;
    this.save();
  },
  currentWeight() {
    const w = this.state.weights;
    return w.length ? w[w.length - 1].kg : (this.state.profile.weight || null);
  },

  /* ---------------- Program / takvim ---------------- */
  /* Bir haftanın planı: 3 gün → üst/alt/üst şeklinde dönerek devam eder */
  weekPlan(weekStartKey = DateUtil.weekStart()) {
    const days = this.state.settings.days === 4 ? 4 : 3;
    const slots = SCHEDULE_SLOTS[days];
    const weekIndex = Math.floor(DateUtil.diffDays(weekStartKey, this.state.settings.programStart) / 7);
    return Array.from({ length: 7 }, (_, i) => {
      const date = DateUtil.addDays(weekStartKey, i);
      const slot = slots.indexOf(i);
      let tpl = null;
      if (slot !== -1) {
        const idx = days === 4 ? slot : (((weekIndex * 3 + slot) % 4) + 4) % 4;
        tpl = TEMPLATE_ORDER[idx];
      }
      const done = this.state.sessions.some(s => s.date === date);
      return { date, dayIdx: i, tpl, done };
    });
  },
  todayPlan() { const t = DateUtil.today(); return this.weekPlan().find(d => d.date === t); },
  nextWorkout() {
    const t = DateUtil.today();
    const plans = [...this.weekPlan(), ...this.weekPlan(DateUtil.addDays(DateUtil.weekStart(), 7))];
    return plans.find(d => d.tpl && !d.done && d.date >= t) || null;
  },

  /* ---------------- Antrenman oturumu ---------------- */
  startSession(tplKey) {
    const tpl = tplKey ? this.state.templates[tplKey] : null;
    const exercises = (tpl ? tpl.items : []).map(it => this.buildSessionExercise(it.ex, it.sets, it.reps));
    this.state.active = {
      id: uid(), date: DateUtil.today(), startedAt: Date.now(), tpl: tplKey || null,
      title: tpl ? tpl.name : 'Serbest Antrenman', type: tpl ? tpl.type : 'mixed', exercises
    };
    this.save();
    return this.state.active;
  },
  buildSessionExercise(exId, sets, reps) {
    const ex = EX_BY_ID[exId];
    const last = this.lastPerformance(exId);
    const n = sets || (ex ? ex.sets : 3);
    const target = String(reps || (ex ? ex.reps : '10'));
    const defReps = parseInt(target, 10) || 10;
    return {
      ex: exId, target,
      sets: Array.from({ length: n }, (_, i) => {
        const prev = last && (last.sets[i] || last.sets[last.sets.length - 1]);
        return { kg: prev ? prev.kg : '', reps: prev ? prev.reps : defReps, done: false };
      })
    };
  },
  addExerciseToActive(exId) {
    if (!this.state.active) this.startSession(null);
    const ex = EX_BY_ID[exId];
    this.state.active.exercises.push(this.buildSessionExercise(exId, ex.sets, ex.reps));
    this.save();
  },
  finishSession() {
    const a = this.state.active;
    if (!a) return null;
    const durationSec = Math.max(60, Math.round((Date.now() - a.startedAt) / 1000));
    const exercises = a.exercises
      .map(e => ({ ex: e.ex, target: e.target, sets: e.sets.filter(s => s.done).map(s => ({ kg: +s.kg || 0, reps: +s.reps || 0 })) }))
      .filter(e => e.sets.length);
    const volume = exercises.reduce((v, e) => v + e.sets.reduce((a2, s) => a2 + s.kg * s.reps, 0), 0);
    const setCount = exercises.reduce((n, e) => n + e.sets.length, 0);
    const kg = this.currentWeight() || 75;
    const burned = Math.round(5 * kg * (durationSec / 3600)); // MET≈5 (direnç antrenmanı), tahmini
    const session = { id: a.id, date: a.date, tpl: a.tpl, title: a.title, type: a.type, startedAt: a.startedAt, durationSec, exercises, volume: Math.round(volume), setCount, burned };
    this.state.active = null;
    if (setCount > 0) this.state.sessions.push(session);
    this.state.sessions.sort((x, y) => x.startedAt - y.startedAt);
    this.save();
    return setCount > 0 ? session : null;
  },
  discardSession() { this.state.active = null; this.save(); },
  deleteSession(id) { this.state.sessions = this.state.sessions.filter(s => s.id !== id); this.save(); },

  lastPerformance(exId) {
    for (let i = this.state.sessions.length - 1; i >= 0; i--) {
      const e = this.state.sessions[i].exercises.find(x => x.ex === exId);
      if (e && e.sets.length) return { date: this.state.sessions[i].date, sets: e.sets };
    }
    return null;
  },
  exerciseHistory(exId) {
    return this.state.sessions
      .map(s => {
        const e = s.exercises.find(x => x.ex === exId);
        if (!e || !e.sets.length) return null;
        const best = e.sets.reduce((b, st) => (st.kg > b.kg || (st.kg === b.kg && st.reps > b.reps)) ? st : b, e.sets[0]);
        const e1rm = Math.max(...e.sets.map(st => st.kg * (1 + st.reps / 30)));
        return { date: s.date, sets: e.sets, best, e1rm: Math.round(e1rm) };
      })
      .filter(Boolean);
  },
  burnedOn(date) { return this.state.sessions.filter(s => s.date === date).reduce((a, s) => a + (s.burned || 0), 0); },
  sessionsBetween(from, to) { return this.state.sessions.filter(s => s.date >= from && s.date <= to); },

  /* ---------------- Demo verisi (açıkça işaretlenir) ---------------- */
  loadDemo() {
    const s = defaultState();
    s.onboarded = true; s.demo = true;
    s.profile = Object.assign(s.profile, { name: 'Demo Kullanıcı', gender: 'male', age: 25, height: 178, weight: 78, goalWeight: 75, goals: ['muscle', 'health'] });
    const today = DateUtil.today();
    const start = DateUtil.weekStart(DateUtil.addDays(today, -35));
    s.settings.programStart = start;
    this.state = s;
    const rand = (a, b) => a + Math.random() * (b - a);
    // Antrenmanlar
    for (let w = 0; w < 6; w++) {
      const plan = this.weekPlan(DateUtil.addDays(start, w * 7));
      plan.forEach(p => {
        if (!p.tpl || p.date >= today) return;
        const tpl = s.templates[p.tpl];
        const startedAt = DateUtil.parse(p.date).getTime() + 18 * 3600000;
        const exercises = tpl.items.map(it => {
          const ex = EX_BY_ID[it.ex];
          const base = { 'bench-press': 60, 'squat': 80, 'deadlift': 100, 'barbell-row': 55, 'shoulder-press': 22, 'romanian-deadlift': 70, 'leg-press': 140, 'incline-db-press': 24, 'lat-pulldown': 50, 'seated-cable-row': 50, 'hip-thrust': 80 }[it.ex] || (ex.bodyweight ? 0 : 15);
          const kg = base ? Math.round((base + w * base * 0.025) * 2) / 2 : 0;
          const reps = parseInt(it.reps, 10) || 10;
          return { ex: it.ex, target: it.reps, sets: Array.from({ length: it.sets }, () => ({ kg, reps: Math.max(1, reps + Math.round(rand(-1, 1))) })) };
        });
        const volume = exercises.reduce((v, e) => v + e.sets.reduce((a2, st) => a2 + st.kg * st.reps, 0), 0);
        const durationSec = Math.round(rand(55, 80) * 60);
        s.sessions.push({ id: uid(), date: p.date, tpl: p.tpl, title: tpl.name, type: tpl.type, startedAt, durationSec, exercises, volume: Math.round(volume), setCount: exercises.reduce((n, e) => n + e.sets.length, 0), burned: Math.round(5 * 78 * durationSec / 3600) });
      });
    }
    // Beslenme, su, kilo (son 35 gün)
    for (let i = 35; i >= 0; i--) {
      const d = DateUtil.addDays(today, -i);
      {
        const meals = [
          ['Kahvaltı', 'Yulaf + süt + muz', 410, 16, 72, 8],
          ['Öğle Yemeği', 'Tavuk göğsü + pilav', 520, 45, 60, 9],
          ['Ara Öğün', 'Whey protein', 120, 24, 3, 1.5],
          ['Akşam Yemeği', 'Somon + patates + salata', 620, 32, 45, 28]
        ];
        meals.forEach(([meal, name, kcal, protein, carbs, fat]) => {
          if (i === 0 && meal === 'Akşam Yemeği') return;
          const f = rand(0.85, 1.15);
          (s.food[d] ||= []).push({ id: uid(), time: '12:00', meal, name, kcal: Math.round(kcal * f), protein: round1(protein * f), carbs: round1(carbs * f), fat: round1(fat * f) });
        });
        const glasses = i === 0 ? 3 : Math.round(rand(5, 9));
        s.water[d] = Array.from({ length: glasses }, () => ({ id: uid(), ml: [250, 500, 500, 330][Math.floor(rand(0, 4))], time: '10:00' }));
      }
      if (i % 3 === 0) s.weights.push({ date: d, kg: round1(80.5 - (35 - i) * 0.07 + rand(-0.3, 0.3)) });
    }
    s.profile.weight = s.weights[s.weights.length - 1].kg;
    s.sessions.sort((x, y) => x.startedAt - y.startedAt);
    this.save();
  }
};
