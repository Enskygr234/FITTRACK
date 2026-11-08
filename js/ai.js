/* =========================================================
   FITTRACK — Yapay zeka (Google Gemini)
   1) Gemini istemcisi + Ayarlar kartı (API anahtarı cihazda)
   2) Yapay Zeka Koç (antrenman/beslenme verilerini bilen sohbet)
   3) Fotoğraftan kalori (yemek fotoğrafı → kalori ve makrolar)
   API anahtarı uygulama verisinden AYRI saklanır; yedeklere girmez.
   ========================================================= */
'use strict';

Object.assign(ICONS, {
  sparkle: '<path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  send: '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>'
});

/* =========================================================
   1) GEMINI İSTEMCİSİ
   ========================================================= */
const AI = {
  KEY: 'fittrack-gemini-key',
  MODEL_KEY: 'fittrack-gemini-model',
  MODELS: [
    ['gemini-3.5-flash-lite', 'Gemini 3.5 Flash-Lite (hızlı, ucuz — önerilen)'],
    ['gemini-flash-lite-latest', 'Gemini Flash-Lite (her zaman en yenisi)'],
    ['gemini-3.6-flash', 'Gemini 3.6 Flash (daha akıllı, biraz daha pahalı)']
  ],
  FALLBACK: 'gemini-flash-lite-latest',
  get(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } },
  set(k, v) { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (e) { /* depolama yok */ } },
  key() { return this.get(this.KEY).trim(); },
  model() { return this.get(this.MODEL_KEY) || this.MODELS[0][0]; },
  ready() { return !!this.key(); },

  /** Gemini'ye istek atar, metin döndürür. parts: [{text}|{inline_data}] */
  async ask({ system = '', contents, json = false, maxTokens = 1400 }) {
    const key = this.key();
    if (!key) throw new Error('Önce Ayarlar → Yapay Zeka bölümüne Gemini API anahtarını gir.');
    const body = { contents, generationConfig: { maxOutputTokens: maxTokens } };
    if (system) body.systemInstruction = { parts: [{ text: system }] };
    if (json) body.generationConfig.responseMimeType = 'application/json';
    const models = [this.model()];
    if (models[0] !== this.FALLBACK) models.push(this.FALLBACK);
    let lastErr = null;
    for (const m of models) {
      let r;
      try {
        r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent?key=${encodeURIComponent(key)}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        });
      } catch (e) { throw new Error('İnternet bağlantısı yok ya da Gemini\'ye ulaşılamadı.'); }
      const j = await r.json().catch(() => ({}));
      if (r.status === 404) { lastErr = new Error(`"${m}" modeli bulunamadı.`); continue; } // yedek modele geç
      if (!r.ok) throw new Error(this.errText(r.status, j));
      const cand = j.candidates && j.candidates[0];
      const text = ((cand && cand.content && cand.content.parts) || []).filter(p => p.text && !p.thought).map(p => p.text).join('').trim();
      if (!text) throw new Error(j.promptFeedback && j.promptFeedback.blockReason ? 'Gemini bu isteği yanıtlamadı (güvenlik filtresi).' : 'Gemini boş yanıt döndürdü, tekrar dene.');
      return text;
    }
    throw lastErr || new Error('Model bulunamadı.');
  },
  errText(status, j) {
    const msg = (j && j.error && j.error.message) || '';
    if (status === 400 && /API key|API_KEY/i.test(msg)) return 'API anahtarı geçersiz. Ayarlar → Yapay Zeka bölümünden kontrol et.';
    if (status === 403) return 'Bu API anahtarının Gemini\'ye erişim izni yok.';
    if (status === 429) return 'Gemini kotası doldu. Biraz bekleyip tekrar dene.';
    if (status >= 500) return 'Gemini şu an yanıt vermiyor, biraz sonra tekrar dene.';
    return `Gemini hatası (${status})${msg ? ': ' + esc(msg.slice(0, 140)) : ''}`;
  },
  /** JSON yanıtı güvenle ayrıştır (```json bloklarını da temizler) */
  parseJSON(text) {
    const t = String(text).replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    try { return JSON.parse(t); } catch (e) {
      const a = t.indexOf('{'), b = t.lastIndexOf('}');
      if (a !== -1 && b > a) return JSON.parse(t.slice(a, b + 1));
      throw new Error('Yapay zeka yanıtı okunamadı, tekrar dene.');
    }
  }
};

/* Basit ve güvenli markdown: **kalın**, madde işaretleri, satır sonları */
function miniMd(text) {
  const lines = esc(text).split(/\n/);
  let html = '', inList = false;
  lines.forEach(raw => {
    const l = raw.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|\s)\*(?!\s)(.+?)\*(?=\s|$|[.,!?])/g, '$1<i>$2</i>');
    const m = l.match(/^\s*(?:[-•*]|\d+[.)])\s+(.*)$/);
    if (m) { if (!inList) { html += '<ul>'; inList = true; } html += `<li>${m[1]}</li>`; return; }
    if (inList) { html += '</ul>'; inList = false; }
    const h = l.match(/^\s*#{1,4}\s+(.*)$/);
    if (h) html += `<p><b>${h[1]}</b></p>`;
    else if (l.trim()) html += `<p>${l}</p>`;
  });
  return html + (inList ? '</ul>' : '');
}

/* ---------------- Ayarlar kartı ---------------- */
function aiSettingsCard() {
  const has = AI.ready();
  const k = AI.key();
  return `<div class="card ai-set-card">
    <div class="card-head"><span class="card-title">${icon('sparkle')} Yapay Zeka (Gemini)</span>${has ? '<span class="badge badge-green">Bağlı</span>' : '<span class="badge badge-gray">Kapalı</span>'}</div>
    <p class="muted sm">Koç, fotoğraftan kalori ve ev antrenmanında özel hareketler için Google Gemini kullanılır. Anahtar yalnızca bu cihazda saklanır ve yedeklere eklenmez.</p>
    <form data-form="ai-key" class="form inline-form mt" autocomplete="off">
      <div class="field grow"><label>Gemini API anahtarı</label><input name="key" type="password" autocomplete="off" spellcheck="false" placeholder="${has ? '••••••••' + esc(k.slice(-4)) : 'AIza…'}" aria-label="Gemini API anahtarı"></div>
      <button class="btn btn-primary" type="submit">${icon('key')} Kaydet</button>
    </form>
    <div class="field mt"><label>Model</label><select data-change="ai-model" aria-label="Gemini modeli">${AI.MODELS.map(([id, label]) => `<option value="${id}"${id === AI.model() ? ' selected' : ''}>${label}</option>`).join('')}</select></div>
    <div class="ai-set-actions">
      ${has ? `<button class="btn btn-ghost btn-sm" data-action="ai-test">${icon('zap')} Bağlantıyı test et</button><button class="btn btn-ghost btn-sm danger-text" data-action="ai-key-del">${icon('trash')} Anahtarı sil</button>` : ''}
      <button class="btn btn-ghost btn-sm" data-action="ai-help">${icon('info')} Anahtarı nasıl alırım?</button>
    </div>
  </div>`;
}
FORMS['ai-key'] = (d, form) => {
  const k = String(d.key || '').trim();
  if (!k) { toast('Anahtarı yapıştır', 'err'); return; }
  if (!/^[A-Za-z0-9_\-]{20,}$/.test(k)) { toast('Bu bir Gemini API anahtarına benzemiyor', 'err'); return; }
  AI.set(AI.KEY, k); form.reset(); rerender(); toast('API anahtarı kaydedildi ✓');
};
EXTRA_CHANGES['ai-model'] = (el) => { AI.set(AI.MODEL_KEY, el.value); toast('Model değiştirildi'); };

function aiHelpModal() {
  openModal('Gemini API anahtarı', `
    <ol class="steps">
      <li><span><b>aistudio.google.com/apikey</b> adresini aç ve Google hesabınla giriş yap.</span></li>
      <li><span><b>Create API key</b> (API anahtarı oluştur) düğmesine bas.</span></li>
      <li><span>Çıkan anahtarı (AIza… ile başlar) kopyala.</span></li>
      <li><span>FITTRACK → Ayarlar → Yapay Zeka bölümüne yapıştırıp <b>Kaydet</b>'e bas.</span></li>
    </ol>
    <p class="hint">Gemini'nin ücretsiz kullanım kotası günlük kişisel kullanım için genelde yeterlidir. Anahtarını kimseyle paylaşma.</p>
    <p class="hint">Yapay zeka özelliklerini kullandığında yazdığın mesajlar, özet antrenman/beslenme verilerin ve gönderdiğin fotoğraf yanıt üretilmesi için Google'a iletilir. Diğer tüm veriler cihazında kalır.</p>
    <div class="modal-actions"><button class="btn btn-primary" data-action="modal-close">Tamam</button></div>`);
}

/* =========================================================
   2) YAPAY ZEKA KOÇ
   ========================================================= */
const COACH_KEY = 'fittrack-coach-chat';
const coach = {
  msgs: null, busy: false,
  load() { if (!this.msgs) { try { this.msgs = JSON.parse(localStorage.getItem(COACH_KEY) || '[]'); } catch (e) { this.msgs = []; } } return this.msgs; },
  save() { try { localStorage.setItem(COACH_KEY, JSON.stringify(this.msgs.slice(-40))); } catch (e) { /* dolu */ } }
};

/* Koçun bildiği kullanıcı özeti (kısa tutulur) */
function coachContext() {
  const s = S(), t = DateUtil.today(), st = s.settings, p = s.profile;
  const L = [];
  const goalNames = (p.goals || []).map(g => (GOALS[g] && GOALS[g].label) || g).join(', ');
  L.push(`Bugün: ${DateUtil.format(t)} (${DAY_NAMES[(new Date().getDay() + 6) % 7]}).`);
  L.push(`Profil: ${p.name || 'isim yok'}, ${p.gender === 'female' ? 'kadın' : 'erkek'}${p.age ? ', ' + p.age + ' yaş' : ''}${p.height ? ', ' + p.height + ' cm' : ''}${Store.currentWeight() ? ', ' + fmt(Store.currentWeight()) + ' kg' : ''}${p.goalWeight ? ', hedef kilo ' + p.goalWeight + ' kg' : ''}. Hedefler: ${goalNames || '—'}.`);
  L.push(`Günlük hedefler: ${st.kcalGoal} kcal, protein ${st.proteinGoal} g, karbonhidrat ${st.carbGoal} g, yağ ${st.fatGoal} g, su ${st.waterGoal} ml.`);
  const tot = Store.totals(t);
  L.push(`Bugün yenen: ${fmt(tot.kcal)} kcal, protein ${Math.round(tot.protein)} g, karb ${Math.round(tot.carbs)} g, yağ ${Math.round(tot.fat)} g; su ${fmt(Store.waterTotal(t))} ml. Öğünler: ${Store.foodOf(t).map(f => f.name).slice(0, 12).join(', ') || 'henüz yok'}.`);
  const days = Array.from({ length: 7 }, (_, i) => DateUtil.addDays(t, -i - 1));
  const avg = (fn) => Math.round(days.reduce((a, d) => a + fn(d), 0) / 7);
  L.push(`Son 7 gün ortalaması: ${avg(d => Store.totals(d).kcal)} kcal, protein ${avg(d => Store.totals(d).protein)} g, su ${avg(d => Store.waterTotal(d))} ml.`);
  const plan = Store.todayPlan();
  const tpl = plan && plan.tpl ? s.templates[plan.tpl] : null;
  L.push(`Bugünkü program: ${tpl ? `${tpl.name} (${tpl.items.map(it => (EX_BY_ID[it.ex] || {}).name).filter(Boolean).join(', ')})${plan.done ? ' — tamamlandı' : ''}` : 'dinlenme günü'}.`);
  if (s.active) L.push(`Şu an devam eden antrenman: ${s.active.title}.`);
  const sess = s.sessions.slice(-8).reverse();
  if (sess.length) {
    L.push('Son antrenmanlar:');
    sess.forEach(x => {
      const ex = x.exercises.slice(0, 7).map(e => {
        const w = e.sets.filter(st2 => st2.t !== 'w');
        const best = w.reduce((b, q) => (q.kg > b.kg || (q.kg === b.kg && q.reps > b.reps)) ? q : b, w[0] || { kg: 0, reps: 0 });
        return `${(EX_BY_ID[e.ex] || { name: e.ex }).name} ${w.length}set en iyi ${best.kg ? fmt(best.kg) + 'kg×' : ''}${best.reps}`;
      }).join('; ');
      L.push(`- ${x.date} ${x.title}, ${Math.round(x.durationSec / 60)} dk${ex ? ': ' + ex : ''}`);
    });
  } else L.push('Henüz kayıtlı antrenman yok.');
  // Son 7 günde çalışılmayan kas grupları
  const worked = new Set();
  Store.sessionsBetween(DateUtil.addDays(t, -7), t).forEach(x => x.exercises.forEach(e => { const ex = EX_BY_ID[e.ex]; if (ex) worked.add(ex.group); }));
  const idle = MUSCLE_GROUPS.filter(g => !['Kardiyo', 'Esneme'].includes(g) && !worked.has(g));
  if (s.sessions.length) L.push(`Son 7 günde hiç çalışılmayan kas grupları: ${idle.join(', ') || 'yok'}.`);
  const m = s.measurements[s.measurements.length - 1];
  if (m) L.push(`Son vücut ölçüsü (${m.date}): ${['waist', 'chest', 'arm', 'thigh', 'hip', 'neck'].filter(k => m[k]).map(k => `${{ waist: 'bel', chest: 'göğüs', arm: 'kol', thigh: 'uyluk', hip: 'kalça', neck: 'boyun' }[k]} ${m[k]} cm`).join(', ')}.`);
  const wts = s.weights.slice(-5);
  if (wts.length > 1) L.push(`Kilo seyri: ${wts.map(w => `${w.date} ${fmt(w.kg)}`).join(' → ')}.`);
  return L.join('\n');
}
const COACH_SYSTEM = `Sen FITTRACK uygulamasının içindeki kişisel fitness koçusun. Adın "FIT Koç".
- Her zaman Türkçe, samimi ama net konuş; kullanıcıya "sen" diye hitap et.
- Kısa yaz: telefon ekranında okunacak. Çoğu yanıt 3-8 satır olsun; gerekirse kısa madde işaretleri kullan. Başlık kullanma.
- Aşağıdaki kullanıcı verilerini kullanarak kişiye özel, uygulanabilir öneriler ver (set, tekrar, kilo, gram gibi somut sayılarla).
- Veri yoksa tahmin uydurma; neyi kaydetmesi gerektiğini söyle.
- Güvenlik: Ağrı, sakatlık, baş dönmesi, göğüs ağrısı gibi durumlarda hareketi bırakmasını ve doktora/fizyoterapiste görünmesini söyle. Teşhis koyma, ilaç ya da takviye dozu önerme.
- Aşırı düşük kalorili diyet, kusma, aç kalma gibi sağlıksız yöntemleri asla önerme; günlük kaloriyi kadınlarda 1200, erkeklerde 1500 kcal altına indirme.
- Motive edici ol ama abartma; emoji en fazla bir-iki tane.`;

function pageCoach() {
  const msgs = coach.load();
  if (!AI.ready()) {
    return `${pageHead('Yapay Zeka Koç', 'Antrenman ve beslenme verilerini bilen kişisel koçun.')}
    <div class="card ai-hero">
      <div class="ai-hero-ic">${icon('sparkle')}</div>
      <h2>Koçunu açmak için 1 adım kaldı</h2>
      <p class="muted">FIT Koç, Google Gemini ile çalışır. Ücretsiz bir API anahtarı alıp aşağıya yapıştır; antrenman geçmişine, öğünlerine ve hedeflerine bakarak sana özel öneriler versin.</p>
    </div>
    <div class="grid g-2">${aiSettingsCard()}
      <div class="card"><div class="card-head"><span class="card-title">${icon('zap')} Koça neler sorabilirsin?</span></div>
        <ul class="tips">${['"Bugün ne çalışayım?"', '"Bu haftamı değerlendir."', '"Bench press\'te takıldım, ne yapayım?"', '"Akşam için 40 g proteinli yemek öner."'].map(x => `<li>${icon('check')}<span>${x}</span></li>`).join('')}</ul></div>
    </div>`;
  }
  const chips = ['Bugün ne çalışayım?', 'Bu haftamı değerlendir', 'Protein hedefime nasıl ulaşırım?', 'Akşam yemeği öner', 'Gelişimim nasıl?', 'Hangi kası ihmal ediyorum?'];
  return `${pageHead('Yapay Zeka Koç', 'Verilerini bilen kişisel koçun. Sor, cevaplasın.', msgs.length ? `<button class="btn btn-ghost btn-sm" data-action="coach-clear">${icon('trash')} Temizle</button>` : '')}
  <div class="card chat-card">
    <div class="chat" id="chat">
      ${msgs.length ? '' : `<div class="chat-welcome">${icon('sparkle')}<b>Selam${S().profile.name ? ' ' + esc(S().profile.name.split(' ')[0]) : ''}! Ben FIT Koç.</b><p class="muted">Antrenmanlarını, öğünlerini ve hedeflerini görüyorum. Aşağıdan bir soru seç ya da kendin yaz.</p></div>`}
      ${msgs.map(m => `<div class="msg ${m.role === 'user' ? 'me' : 'ai'}${m.err ? ' err' : ''}">${m.role === 'user' ? esc(m.text).replace(/\n/g, '<br>') : miniMd(m.text)}</div>`).join('')}
      ${coach.busy ? '<div class="msg ai typing"><i></i><i></i><i></i></div>' : ''}
      <div id="chatEnd"></div>
    </div>
    <div class="chips chat-chips">${chips.map(c => `<button class="chip" data-action="coach-ask" data-q="${esc(c)}"${coach.busy ? ' disabled' : ''}>${esc(c)}</button>`).join('')}</div>
    <form data-form="coach" class="chat-form" autocomplete="off">
      <textarea name="q" rows="1" maxlength="1500" placeholder="Koçuna bir şey sor…" aria-label="Mesaj" data-input="chat-grow"></textarea>
      <button class="btn btn-primary chat-send" type="submit" aria-label="Gönder"${coach.busy ? ' disabled' : ''}>${icon('send')}</button>
    </form>
  </div>
  <p class="hint center">FIT Koç bir yapay zekadır, hata yapabilir. Ağrı veya sağlık sorunlarında bir uzmana danış.</p>`;
}
EXTRA_INPUTS['chat-grow'] = (el) => { el.style.height = 'auto'; el.style.height = Math.min(140, el.scrollHeight) + 'px'; };
function scrollChat() { const e = $('#chatEnd'); if (e) e.scrollIntoView({ block: 'end' }); }

async function coachSend(q) {
  q = String(q || '').trim();
  if (!q || coach.busy) return;
  const msgs = coach.load();
  msgs.push({ role: 'user', text: q });
  coach.busy = true; coach.save();
  if (currentPage === 'coach') { rerender(); scrollChat(); }
  try {
    const hist = msgs.filter(m => !m.err).slice(-14).map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));
    const text = await AI.ask({ system: `${COACH_SYSTEM}\n\nKULLANICI VERİLERİ (güncel):\n${coachContext()}`, contents: hist, maxTokens: 900 });
    msgs.push({ role: 'model', text });
  } catch (e) {
    msgs.push({ role: 'model', text: e.message, err: true });
  }
  coach.busy = false; coach.save();
  if (currentPage === 'coach') { rerender(); scrollChat(); }
  else toast('FIT Koç yanıt verdi 💬', 'info');
}
FORMS.coach = (d, form) => { form.q.value = ''; coachSend(d.q); };
document.addEventListener('keydown', (e) => {
  // Enter = gönder, Shift+Enter = yeni satır (masaüstü)
  if (e.key === 'Enter' && !e.shiftKey && e.target.matches && e.target.matches('.chat-form textarea') && window.innerWidth > 760) {
    e.preventDefault(); e.target.form.requestSubmit();
  }
});

/* =========================================================
   3) FOTOĞRAFTAN KALORİ
   ========================================================= */
const FOOD_PHOTO_PROMPT = `Bu fotoğraftaki yemeği/içeceği analiz et ve görünen porsiyonun besin değerlerini tahmin et.
Türk mutfağını iyi tanı (lahmacun, mercimek çorbası, pilav, döner, simit, menemen vb.).
Tabak, kaşık, ekmek gibi ipuçlarından porsiyon büyüklüğünü kestir. Birden fazla yiyecek varsa hepsini ayrı listele ve toplamı ver.
SADECE şu JSON'u döndür:
{"yemek_mi": true, "ad": "kısa Türkçe ad (en fazla 45 karakter)", "porsiyon": "ör. 1 tabak (~300 g)", "kalori": 0, "protein": 0, "karbonhidrat": 0, "yag": 0,
 "parcalar": [{"ad": "", "miktar": "", "kalori": 0}], "guven": "yüksek|orta|düşük", "not": "kısa bir ipucu ya da uyarı (en fazla 1 cümle)"}
Sayılar gram/kcal cinsinden tam sayı olsun. Fotoğrafta yiyecek yoksa {"yemek_mi": false, "not": "neden"} döndür.`;

function photoPickButton(meal, cls = 'btn btn-ghost') {
  return `<label class="${cls} ai-photo-btn" role="button" aria-label="Fotoğraftan kalori hesapla">${icon('camera')}<span class="hide-sm">Fotoğraf</span>
    <input type="file" accept="image/*" capture="environment" data-change="ai-photo" data-meal="${esc(meal || '')}" hidden></label>`;
}
EXTRA_CHANGES['ai-photo'] = (el) => {
  const file = el.files && el.files[0];
  if (!file) return;
  const form = el.closest('form');
  const meal = (form && form.meal && form.meal.value) || el.dataset.meal || autoMealNow();
  el.value = '';
  if (!AI.ready()) { aiNeedKey('Fotoğraftan kalori hesaplamak için'); return; }
  analyzeFoodPhoto(file, meal);
};
function aiNeedKey(why) {
  openModal('Yapay zeka kapalı', `<p class="muted">${why} Gemini API anahtarı gerekiyor. Bir kere girmen yeterli.</p>
    <div class="modal-actions"><button class="btn btn-ghost" data-action="ai-help">Nasıl alırım?</button><button class="btn btn-primary" data-action="go-settings-ai">${icon('settings')} Ayarlara git</button></div>`);
}

async function analyzeFoodPhoto(file, meal) {
  let dataUrl;
  try { dataUrl = await resizeImage(file, 1024); } catch (e) { toast('Fotoğraf okunamadı', 'err'); return; }
  openModal('Fotoğraf analiz ediliyor', `<div class="ai-scan"><img src="${dataUrl}" alt="Yemek fotoğrafı"><div class="ai-scan-line"></div></div>
    <p class="center muted ai-scan-text">${icon('sparkle')} Gemini yemeği tanıyor ve kalorisini hesaplıyor…</p>`, { closable: true });
  try {
    const b64 = dataUrl.split(',')[1];
    const text = await AI.ask({
      contents: [{ role: 'user', parts: [{ inline_data: { mime_type: 'image/jpeg', data: b64 } }, { text: FOOD_PHOTO_PROMPT }] }],
      json: true, maxTokens: 700
    });
    if (!$('#modalRoot .ai-scan')) return; // kullanıcı kapattı
    const r = AI.parseJSON(text);
    if (r.yemek_mi === false) {
      openModal('Yemek bulunamadı', `<div class="ai-photo-mini"><img src="${dataUrl}" alt=""></div><p class="muted center">${esc(r.not || 'Fotoğrafta bir yiyecek göremedim.')}</p>
        <div class="modal-actions"><button class="btn btn-ghost" data-action="modal-close">Kapat</button><button class="btn btn-primary" data-action="food-open" data-meal="${esc(meal)}">Elle ekle</button></div>`);
      return;
    }
    const num = (x) => Math.max(0, Math.round(+x || 0));
    const name = String(r.ad || 'Yemek').slice(0, 50);
    const base = { label: name, kcal: num(r.kalori), protein: num(r.protein), carbs: num(r.karbonhidrat), fat: num(r.yag), per: 0 };
    openFoodModal(meal, { name, portion: 1, base, kcal: base.kcal, protein: base.protein, carbs: base.carbs, fat: base.fat });
    const body = $('#modalRoot .modal-body');
    const conf = { 'yüksek': 'badge-green', 'orta': 'badge-orange', 'düşük': 'badge-red' }[r.guven] || 'badge-gray';
    const parts = Array.isArray(r.parcalar) ? r.parcalar.filter(p => p && p.ad).slice(0, 8) : [];
    if (body) body.insertAdjacentHTML('afterbegin', `<div class="ai-result">
      <img src="${dataUrl}" alt="">
      <div class="ai-result-body">
        <div class="ai-result-top"><span class="badge badge-violet">${icon('sparkle')} Yapay zeka tahmini</span>${r.guven ? `<span class="badge ${conf}">Güven: ${esc(r.guven)}</span>` : ''}</div>
        <b>${esc(name)}</b>${r.porsiyon ? `<small class="muted">${esc(r.porsiyon)}</small>` : ''}
        ${parts.length > 1 ? `<ul class="ai-parts">${parts.map(p => `<li><span>${esc(p.ad)}${p.miktar ? ` <em>${esc(p.miktar)}</em>` : ''}</span><b>${num(p.kalori)} kcal</b></li>`).join('')}</ul>` : ''}
        ${r.not ? `<p class="hint">${esc(r.not)}</p>` : ''}
      </div></div>
      <p class="hint ai-edit-hint">${icon('edit')}<span>Değerler tahmindir; porsiyonu ya da sayıları düzeltip <b>Ekle</b>'ye bas.</span></p>`);
    ['#foodResults', '#foodCats', '#modalRoot .food-search'].forEach(q => { const n = $(q); if (n) n.style.display = 'none'; });
  } catch (e) {
    if (!$('#modalRoot .ai-scan')) return;
    openModal('Analiz yapılamadı', `<p class="muted">${esc(e.message)}</p>
      <div class="modal-actions"><button class="btn btn-ghost" data-action="modal-close">Kapat</button><button class="btn btn-primary" data-action="food-open" data-meal="${esc(meal)}">Elle ekle</button></div>`);
  }
}

/* Yemek ekleme penceresine "Fotoğraf" düğmesi */
(() => {
  const orig = openFoodModal;
  openFoodModal = function (meal = '', preset = null) {
    orig(meal, preset);
    const bc = $('#modalRoot [data-action="barcode-open"]');
    if (bc && !preset) bc.insertAdjacentHTML('beforebegin', photoPickButton(meal || autoMealNow()));
  };
})();

/* =========================================================
   Menü, sayfalar, ana sayfa ve ayarlar entegrasyonu
   ========================================================= */
(() => {
  const i = NAV.findIndex(n => n.id === 'workout');
  NAV.splice(i + 1, 0, { id: 'coach', label: 'Yapay Zeka Koç', icon: 'sparkle' });
  TITLES.coach = 'Yapay Zeka Koç';
  ROUTES.coach = pageCoach;

  const settingsOrig = ROUTES.settings;
  ROUTES.settings = (p) => {
    const html = settingsOrig(p);
    const k = html.indexOf('Hakkında</span>');
    const at = k === -1 ? -1 : html.lastIndexOf('<div class="card">', k);
    return at === -1 ? html + aiSettingsCard() : html.slice(0, at) + aiSettingsCard() + html.slice(at);
  };

  const nutOrig = ROUTES.nutrition;
  ROUTES.nutrition = (p) => nutOrig(p).replace(`<button class="btn btn-primary" data-action="food-open">`,
    `${photoPickButton('', 'btn btn-ghost')}<button class="btn btn-primary" data-action="food-open">`);

  const homeOrig = ROUTES.home;
  ROUTES.home = (p) => {
    const html = homeOrig(p);
    const strip = `<div class="ai-strip">
      <button class="ai-tile t-violet" data-action="go" data-to="coach">${icon('sparkle')}<b>Yapay Zeka Koç</b><small>Bugün ne yapmalısın? Sor.</small></button>
      <label class="ai-tile t-orange">${icon('camera')}<b>Fotoğraftan Kalori</b><small>Yemeğin fotoğrafını çek</small><input type="file" accept="image/*" capture="environment" data-change="ai-photo" hidden></label>
      <button class="ai-tile t-green" data-action="go" data-to="evde">${icon('home')}<b>Evde Antrenman</b><small>Evdeki eşyalarla program</small></button>
    </div>`;
    const k = html.indexOf('<div class="grid home-top">');
    return k === -1 ? html + strip : html.slice(0, k) + strip + html.slice(k);
  };
})();

Object.assign(ACTIONS, {
  'coach-ask': (el) => coachSend(el.dataset.q),
  'coach-clear': () => confirmBox('Sohbeti temizle', 'Koçla olan tüm mesajlar silinsin mi?', 'Temizle', () => { coach.msgs = []; coach.save(); closeModal(); rerender(); }),
  'ai-help': () => aiHelpModal(),
  'go-settings-ai': () => { closeModal(); go('settings'); setTimeout(() => { const c = $('.ai-set-card'); if (c) c.scrollIntoView({ block: 'center' }); }, 120); },
  'ai-key-del': () => confirmBox('API anahtarını sil', 'Yapay zeka özellikleri kapanacak. Emin misin?', 'Sil', () => { AI.set(AI.KEY, ''); closeModal(); rerender(); toast('Anahtar silindi'); }),
  'ai-test': async (el) => {
    el.disabled = true; const old = el.innerHTML; el.innerHTML = `${icon('refresh')} Test ediliyor…`;
    try { const r = await AI.ask({ contents: [{ role: 'user', parts: [{ text: 'Sadece "Tamam" yaz.' }] }], maxTokens: 20 }); toast(`Gemini bağlı ✓ (${esc(r.slice(0, 20))})`); }
    catch (e) { toast(e.message, 'err'); }
    el.disabled = false; el.innerHTML = old;
  }
});

/* Sohbet sayfası açılınca en alta kaydır */
(() => {
  const orig = render;
  render = function (keep) { orig(keep); if (currentPage === 'coach' && coach.load().length) setTimeout(scrollChat, 0); };
})();

/* Gizlilik metnine yapay zeka notu */
(() => {
  const orig = ACTIONS.privacy;
  ACTIONS.privacy = (el) => {
    orig(el);
    const b = $('#modalRoot .modal-body');
    if (b) b.insertAdjacentHTML('beforeend', `<p class="hint">${icon('sparkle')} Yapay zeka özellikleri (Koç, fotoğraftan kalori, ev antrenmanında özel hareket) yalnızca sen kullandığında çalışır: yazdığın mesaj, özet verilerin ya da fotoğraf yanıt üretmek için Google Gemini'ye gönderilir. API anahtarın sadece bu cihazda saklanır.</p>`);
  };
})();
