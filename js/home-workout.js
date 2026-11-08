/* =========================================================
   FITTRACK — Ekipmansız Mod (Evde Antrenman)
   Evdeki eşyaları seç → hedef/süre/seviyeye göre devre antrenmanı
   oluşturulur → sesli, zamanlayıcılı oynatıcı ile yapılır.
   Listede olmayan eşyalar için isteğe bağlı Gemini desteği.
   ========================================================= */
'use strict';

TPL_TYPES.home = { label: 'Evde', short: 'Ev', badge: 'badge-green' };

/* ---------------- Eşyalar ---------------- */
const HOME_ITEMS = [
  ['sandalye', '🪑', 'Sandalye'],
  ['duvar', '🧱', 'Duvar'],
  ['merdiven', '🪜', 'Merdiven / basamak'],
  ['canta', '🎒', 'Sırt çantası'],
  ['sise', '💧', 'Su şişesi (1,5 L)'],
  ['havlu', '🧺', 'Havlu'],
  ['kanepe', '🛋️', 'Kanepe / yatak'],
  ['masa', '🍽️', 'Sağlam masa'],
  ['supurge', '🧹', 'Süpürge sapı']
];
const HOME_ITEM = Object.fromEntries(HOME_ITEMS.map(([k, e, n]) => [k, { e, n }]));

/* ---------------- Hareketler ----------------
   need: bu eşyalardan biri gerekir ([] = hiçbir şey gerekmez)
   cat: push | pull | legs | glute | shoulder | arms | core | cardio | stretch
   lvl: 1 kolay, 2 orta, 3 zor · uni: tek taraflı (süreyi iki tarafa böl)
   ex: kütüphanedeki fotoğraf/egzersiz kimliği */
const HOME_MOVES = [
  // Ekipmansız
  { id: 'sinav', n: 'Şınav', ex: 'push-up', cat: 'push', lvl: 2, need: [], cue: 'Gövde dümdüz, göğüs yere yaklaşsın. Zorlanırsan dizlerini yere koy.' },
  { id: 'dizsinav', n: 'Dizüstü Şınav', ex: 'push-up', cat: 'push', lvl: 1, need: [], cue: 'Dizler yerde, kalça ile omuz aynı hizada. Yavaş in, güçlü it.' },
  { id: 'pike', n: 'Pike Şınav (Omuz)', ex: 'Handstand_Push-Ups', cat: 'shoulder', lvl: 2, need: [], cue: 'Kalçayı yukarı kaldırıp ters V ol, başını ellerinin arasına doğru indir.' },
  { id: 'squat', n: 'Squat', ex: 'Bodyweight_Squat', cat: 'legs', lvl: 1, need: [], cue: 'Kalçayı geriye it, dizler ayak ucu yönünde, topuklar yerde kalsın.' },
  { id: 'jumpsquat', n: 'Zıplamalı Squat', ex: 'Freehand_Jump_Squat', cat: 'cardio', lvl: 3, need: [], cue: 'Squat\'a in, patlayıcı şekilde zıpla, yumuşak dizlerle yere in.' },
  { id: 'lunge', n: 'Geri Lunge', ex: 'Bodyweight_Walking_Lunge', cat: 'legs', lvl: 2, need: [], uni: true, cue: 'Bir adım geri at, iki diz de 90 dereceye insin. Taraf değiştirerek devam.' },
  { id: 'bridge', n: 'Glute Bridge', ex: 'Butt_Lift_Bridge', cat: 'glute', lvl: 1, need: [], cue: 'Sırtüstü yat, topuklardan iterek kalçayı kaldır, tepede 1 sn sık.' },
  { id: 'tekbridge', n: 'Tek Bacak Köprü', ex: 'Single_Leg_Glute_Bridge', cat: 'glute', lvl: 2, need: [], uni: true, cue: 'Bir bacak havada, diğer topuktan iterek kalçayı kaldır.' },
  { id: 'plank', n: 'Plank', ex: 'plank', cat: 'core', lvl: 1, need: [], cue: 'Dirsekler omuz altında, karnı ve kalçayı sık, bel çökmesin.' },
  { id: 'yanplank', n: 'Yan Plank', ex: 'Side_Bridge', cat: 'core', lvl: 2, need: [], uni: true, cue: 'Tek dirsek üstünde, vücut düz bir çizgi. Süre yarısında taraf değiştir.' },
  { id: 'mountain', n: 'Mountain Climber', ex: 'Mountain_Climbers', cat: 'cardio', lvl: 2, need: [], cue: 'Şınav pozisyonunda dizleri sırayla hızlıca göğse çek.' },
  { id: 'mekik', n: 'Mekik', ex: 'Crunches', cat: 'core', lvl: 1, need: [], cue: 'Bel yerde kalsın, kürek kemiklerini kaldırıp karnı sık.' },
  { id: 'tersmekik', n: 'Ters Mekik', ex: 'Reverse_Crunch', cat: 'core', lvl: 2, need: [], cue: 'Dizleri göğse çekip kalçayı yerden hafifçe kaldır, yavaş indir.' },
  { id: 'russian', n: 'Russian Twist', ex: 'Russian_Twist', cat: 'core', lvl: 2, need: [], cue: 'Hafif geriye yaslan, gövdeni sağa sola çevir. Su şişesi tutarak zorlaştır.' },
  { id: 'deadbug', n: 'Dead Bug', ex: 'Dead_Bug', cat: 'core', lvl: 1, need: [], cue: 'Sırtüstü, karşı kol ve bacağı yavaşça uzat, bel yere yapışık kalsın.' },
  { id: 'flutter', n: 'Flutter Kick', ex: 'Flutter_Kicks', cat: 'core', lvl: 2, need: [], cue: 'Bacaklar yerden 15 cm yukarıda, küçük ve hızlı makas hareketi.' },
  { id: 'capraz', n: 'Çapraz Dirsek–Diz', ex: 'Elbow_to_Knee', cat: 'core', lvl: 1, need: [], cue: 'Sağ dirseği sol dize, sol dirseği sağ dize götür.' },
  { id: 'superman', n: 'Superman', ex: 'Superman', cat: 'pull', lvl: 1, need: [], cue: 'Yüzüstü yat, kol ve bacakları aynı anda kaldırıp 2 sn tut.' },
  { id: 'jack', n: 'Jumping Jack', ex: null, cat: 'cardio', lvl: 1, need: [], cue: 'Zıplarken kolları başın üstünde birleştir, bacakları aç.' },
  { id: 'burpee', n: 'Burpee', ex: null, cat: 'cardio', lvl: 3, need: [], cue: 'Çömel, ayakları geri at, şınav pozisyonu, toplan ve zıpla.' },
  { id: 'highknee', n: 'Yüksek Diz Koşusu', ex: null, cat: 'cardio', lvl: 2, need: [], cue: 'Yerinde koş, dizleri kalça hizasına kadar kaldır.' },
  { id: 'splitjump', n: 'Split Jump', ex: 'Split_Jump', cat: 'cardio', lvl: 3, need: [], cue: 'Lunge pozisyonunda zıpla, havada bacak değiştir.' },
  { id: 'skater', n: 'Paten Zıplaması', ex: null, cat: 'cardio', lvl: 2, need: [], cue: 'Yana doğru tek ayakla zıpla, diğer ayak arkadan çapraz geçsin.' },
  // Esneme
  { id: 'kedi', n: 'Kedi–Deve Esnetmesi', ex: 'Cat_Stretch', cat: 'stretch', lvl: 1, need: [], cue: 'Dört ayak üstünde, sırtı yavaşça yuvarlayıp çukurlaştır. Nefesle uyumlu.' },
  { id: 'wgs', n: 'Dünyanın En İyi Esnetmesi', ex: 'Worlds_Greatest_Stretch', cat: 'stretch', lvl: 1, need: [], uni: true, cue: 'Derin lunge, aynı taraf dirseği yere yaklaştır, sonra kolu tavana aç.' },
  { id: 'kalcaon', n: 'Kalça Ön Esnetme', ex: 'Kneeling_Hip_Flexor', cat: 'stretch', lvl: 1, need: [], uni: true, cue: 'Bir diz yerde, kalçayı öne it, arka bacağın önünde gerilmeyi hisset.' },
  { id: 'arkabacak', n: 'Arka Bacak Esnetme', ex: 'Hamstring_Stretch', cat: 'stretch', lvl: 1, need: [], cue: 'Bacakları uzat, sırt düz şekilde kalçadan öne eğil. Zorlamadan.' },
  { id: 'cocuk', n: 'Çocuk Pozu', ex: null, cat: 'stretch', lvl: 1, need: [], cue: 'Dizler yerde, kalçayı topuklara oturt, kolları öne uzatıp derin nefes al.' },
  { id: 'dizgogus', n: 'Dizleri Göğse Çek', ex: 'Hug_Knees_To_Chest', cat: 'stretch', lvl: 1, need: [], cue: 'Sırtüstü, dizlere sarıl ve beli yere yay. Hafifçe sağa sola sallan.' },
  // Sandalye
  { id: 'dips', n: 'Sandalyede Triceps Dips', ex: 'Bench_Dips', cat: 'arms', lvl: 2, need: ['sandalye', 'kanepe'], cue: 'Ellerin sandalyenin kenarında, dirsekleri geriye bükerek in ve it.' },
  { id: 'egimsinav', n: 'Eğimli Şınav', ex: 'Incline_Push-Up', cat: 'push', lvl: 1, need: ['sandalye', 'masa', 'kanepe'], cue: 'Ellerin sandalye/masa kenarında, gövde düz, göğsü kenara yaklaştır.' },
  { id: 'declinesinav', n: 'Ayaklar Yüksekte Şınav', ex: 'Decline_Push-Up', cat: 'push', lvl: 3, need: ['sandalye', 'kanepe', 'merdiven'], cue: 'Ayakların sandalyede, eller yerde. Üst göğüs ve omuzları yakar.' },
  { id: 'bulgar', n: 'Bulgar Split Squat', ex: 'Split_Squats', cat: 'legs', lvl: 3, need: ['sandalye', 'kanepe'], uni: true, cue: 'Arka ayağın sandalyede, öndeki bacakla dik in. Süre yarısında değiştir.' },
  { id: 'stepup', n: 'Step-up', ex: 'Step-up_with_Knee_Raise', cat: 'legs', lvl: 2, need: ['sandalye', 'merdiven'], uni: true, cue: 'Sağlam basamağa/sandalyeye çık, öndeki topuktan it. Sandalyeyi duvara daya.' },
  { id: 'otkalk', n: 'Sandalyeye Otur–Kalk', ex: 'Sit_Squats', cat: 'legs', lvl: 1, need: ['sandalye', 'kanepe'], cue: 'Kollar önde, kalçan sandalyeye değince hemen kalk.' },
  { id: 'dizcek', n: 'Oturarak Diz Çekme', ex: 'Seated_Leg_Tucks', cat: 'core', lvl: 2, need: ['sandalye'], cue: 'Sandalyenin önüne otur, ellerle tutun, dizleri göğse çek ve uzat.' },
  { id: 'hipthrust', n: 'Hip Thrust', ex: 'hip-thrust', cat: 'glute', lvl: 2, need: ['kanepe', 'sandalye'], cue: 'Sırtın kanepeye dayalı, kalçayı kaldır, tepede sık. Çantayı kalçana koyabilirsin.' },
  // Duvar
  { id: 'wallsit', n: 'Duvarda Oturma', ex: null, cat: 'legs', lvl: 2, need: ['duvar'], cue: 'Sırtın duvarda, dizler 90 derece. Görünmez sandalyede otur ve bekle.' },
  { id: 'duvarsinav', n: 'Duvar Şınavı', ex: null, cat: 'push', lvl: 1, need: ['duvar'], cue: 'Ellerin duvarda omuz hizasında, göğsünü duvara yaklaştırıp it.' },
  { id: 'duvarmelek', n: 'Duvar Meleği', ex: null, cat: 'shoulder', lvl: 1, need: ['duvar'], cue: 'Sırt ve kollar duvarda, kolları yavaşça yukarı-aşağı kaydır.' },
  { id: 'baldiresnet', n: 'Baldır Esnetme', ex: 'Calf_Stretch_Hands_Against_Wall', cat: 'stretch', lvl: 1, need: ['duvar'], uni: true, cue: 'Eller duvarda, arka bacak düz ve topuk yerde.' },
  // Merdiven
  { id: 'calf', n: 'Basamakta Calf Raise', ex: 'calf-raise', cat: 'legs', lvl: 1, need: ['merdiven'], cue: 'Ayak uçların basamakta, topukları aşağı sarkıt ve parmak ucuna yüksel.' },
  { id: 'merdivenkos', n: 'Merdiven Koşusu', ex: null, cat: 'cardio', lvl: 3, need: ['merdiven'], cue: 'Basamakları hızlı çık, yavaş ve dikkatli in. Tırabzana yakın dur.' },
  // Sırt çantası (kitap/su şişesiyle doldur)
  { id: 'cantasquat', n: 'Çantalı Goblet Squat', ex: 'Bodyweight_Squat', cat: 'legs', lvl: 2, need: ['canta'], cue: 'Dolu çantayı göğsünde tut, derin squat yap.' },
  { id: 'cantarow', n: 'Çantayla Eğilerek Kürek', ex: 'barbell-row', cat: 'pull', lvl: 2, need: ['canta'], cue: 'Kalçadan eğil, sırt düz; çantayı karnına çek, kürek kemiklerini sık.' },
  { id: 'cantapres', n: 'Çantayla Omuz Pres', ex: 'shoulder-press', cat: 'shoulder', lvl: 2, need: ['canta'], cue: 'Çantayı iki elle göğüs hizasından başın üstüne it.' },
  { id: 'cantardl', n: 'Çantayla Romanian Deadlift', ex: 'romanian-deadlift', cat: 'glute', lvl: 2, need: ['canta'], cue: 'Dizler hafif bükük, kalçayı geri iterek eğil, sırtın düz kalsın.' },
  { id: 'cantaswing', n: 'Çanta Swing', ex: null, cat: 'cardio', lvl: 2, need: ['canta'], cue: 'Çantayı bacak arasından kalça gücüyle göğüs hizasına savur.' },
  // Su şişesi
  { id: 'curl', n: 'Şişeyle Biceps Curl', ex: 'bicep-curl', cat: 'arms', lvl: 1, need: ['sise', 'canta'], cue: 'Dirsekler gövdeye yapışık, şişeleri yavaşça kaldır ve indir.' },
  { id: 'yanaacis', n: 'Şişeyle Yana Açış', ex: 'lateral-raise', cat: 'shoulder', lvl: 1, need: ['sise'], cue: 'Kollar hafif bükük, şişeleri omuz hizasına kadar yana kaldır.' },
  { id: 'sisepres', n: 'Şişeyle Omuz Pres', ex: 'shoulder-press', cat: 'shoulder', lvl: 1, need: ['sise'], cue: 'Şişeleri omuz hizasından başın üstüne it.' },
  { id: 'triceps', n: 'Şişeyle Triceps Extension', ex: 'triceps-extension', cat: 'arms', lvl: 1, need: ['sise', 'canta'], cue: 'Şişeyi iki elle başın arkasına indir, dirsekler yukarıda sabit.' },
  { id: 'hammer', n: 'Şişeyle Çekiç Curl', ex: 'hammer-curl', cat: 'arms', lvl: 1, need: ['sise'], cue: 'Avuç içleri birbirine bakarak şişeleri kaldır.' },
  // Havlu
  { id: 'havlulat', n: 'Havlu Lat Çekişi', ex: null, cat: 'pull', lvl: 1, need: ['havlu'], cue: 'Havluyu başın üstünde gergin tut, dışa doğru çekerek ense arkasına indir.' },
  { id: 'havlukayma', n: 'Havlu Kaydırmalı Climber', ex: 'Mountain_Climbers', cat: 'cardio', lvl: 2, need: ['havlu'], cue: 'Ayaklar kaygan zeminde havlu üstünde, dizleri sırayla kaydırarak çek.' },
  { id: 'havluham', n: 'Havlulu Arka Bacak Esnetme', ex: 'Leg-Up_Hamstring_Stretch', cat: 'stretch', lvl: 1, need: ['havlu'], uni: true, cue: 'Sırtüstü, havluyu ayak tabanından geçirip bacağı düz şekilde kendine çek.' },
  { id: 'havlucurl', n: 'Havlulu Hamstring Curl', ex: 'Floor_Glute-Ham_Raise', cat: 'glute', lvl: 3, need: ['havlu'], cue: 'Köprü pozisyonunda topuklar havluda, bacakları kaydırarak uzat ve geri çek.' },
  // Masa
  { id: 'masarow', n: 'Masa Altında Ters Kürek', ex: 'Inverted_Row', cat: 'pull', lvl: 2, need: ['masa'], cue: 'Sadece ÇOK sağlam masada! Masanın altına uzan, kenarı tut, göğsünü masaya çek.' },
  // Süpürge sapı
  { id: 'omuzac', n: 'Süpürgeyle Omuz Açma', ex: null, cat: 'stretch', lvl: 1, need: ['supurge'], cue: 'Sapı geniş tut, kollar düz şekilde önden başın üstünden arkaya götür.' },
  { id: 'goodmorning', n: 'Süpürgeyle Good Morning', ex: null, cat: 'glute', lvl: 1, need: ['supurge'], cue: 'Sap omuzlarında, sırt düz şekilde kalçadan öne eğil ve kalk.' },
  { id: 'rotasyon', n: 'Süpürgeyle Gövde Rotasyonu', ex: null, cat: 'core', lvl: 1, need: ['supurge'], cue: 'Sap omuzlarında, kalça sabit; gövdeni kontrollü şekilde sağa sola çevir.' }
];
const HOME_MOVE = Object.fromEntries(HOME_MOVES.map(m => [m.id, m]));

const HOME_GOALS = {
  guc: { label: 'Güç', emoji: '💪', slots: ['push', 'legs', 'pull', 'glute', 'shoulder|arms', 'core', 'push', 'legs'], met: 5 },
  yag: { label: 'Yağ Yakma', emoji: '🔥', slots: ['cardio', 'legs', 'push', 'cardio', 'core', 'glute', 'cardio', 'pull'], met: 8 },
  karin: { label: 'Karın', emoji: '🎯', slots: ['core', 'core', 'cardio', 'core', 'glute', 'core', 'core', 'cardio'], met: 4.5 },
  esneme: { label: 'Esneme', emoji: '🧘', slots: ['stretch', 'stretch', 'stretch', 'stretch', 'stretch', 'stretch', 'stretch', 'stretch'], met: 2.5 }
};
const HOME_LEVELS = { 1: ['Kolay', 30, 30], 2: ['Orta', 40, 20], 3: ['Zor', 45, 15] };
const CAT_ICON = { push: '💪', pull: '🚣', legs: '🦵', glute: '🍑', shoulder: '🙆', arms: '💪', core: '🎯', cardio: '🔥', stretch: '🧘' };

function homeCfg() {
  const s = S();
  if (!s.homeCfg) s.homeCfg = { items: [], goal: 'yag', min: 20, lvl: 2 };
  return s.homeCfg;
}
const hasItem = (m, items) => !m.need.length || m.need.some(n => items.includes(n));
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ---------------- Program oluşturucu ---------------- */
function buildHomePlan(cfg, aiMoves = []) {
  const goal = HOME_GOALS[cfg.goal] || HOME_GOALS.yag;
  const [, W0, R0] = HOME_LEVELS[cfg.lvl] || HOME_LEVELS[2];
  const work = cfg.goal === 'esneme' ? 40 : W0;
  const rest = cfg.goal === 'esneme' ? 10 : R0;
  const n = cfg.goal === 'esneme' ? Math.min(8, Math.max(5, Math.round(cfg.min / 3))) : cfg.min <= 10 ? 5 : cfg.min <= 20 ? 6 : cfg.min <= 30 ? 7 : 8;
  const rounds = Math.max(1, Math.round((cfg.min * 60) / (n * (work + rest))));
  const pool = HOME_MOVES.filter(m => hasItem(m, cfg.items) && m.lvl <= cfg.lvl + 1);
  const used = new Set();
  const moves = goal.slots.slice(0, n).map(slot => {
    const cats = slot.split('|');
    const score = (m) => Math.random() + (m.need.length ? 1.1 : 0) + (m.lvl === cfg.lvl ? 0.4 : 0) - (m.lvl > cfg.lvl ? 0.6 : 0);
    let c = pool.filter(m => cats.includes(m.cat) && !used.has(m.id));
    if (!c.length) c = pool.filter(m => !used.has(m.id) && (cfg.goal === 'esneme' ? m.cat === 'stretch' : m.cat !== 'stretch'));
    if (!c.length) c = HOME_MOVES.filter(m => !m.need.length && !used.has(m.id));
    const pick = c.map(m => [m, score(m)]).sort((a, b) => b[1] - a[1])[0][0];
    used.add(pick.id);
    return pick.id;
  });
  // Yapay zekanın bulduğu hareketleri uygun yerlere yerleştir
  const replaced = new Set();
  aiMoves.slice(0, Math.ceil(n / 2)).forEach(am => {
    let i = moves.findIndex((id, k) => !replaced.has(k) && HOME_MOVE[id] && HOME_MOVE[id].cat === am.cat);
    if (i === -1) i = moves.findIndex((id, k) => !replaced.has(k));
    if (i !== -1) { moves[i] = am.id; replaced.add(i); }
  });
  return { goal: cfg.goal, lvl: cfg.lvl, min: cfg.min, work, rest, rounds, moves, created: Date.now() };
}
const moveOf = (id) => HOME_MOVE[id] || (ui.hwAi || []).find(m => m.id === id) || { id, n: 'Hareket', cat: 'core', cue: '', need: [] };
const moveThumb = (m, cls = '') => {
  const ex = m.ex && EX_BY_ID[m.ex];
  return ex ? `<div class="thumb photo ${cls}"><img src="${ex.thumb}" alt="" loading="lazy" decoding="async"></div>`
    : `<div class="thumb hw-emoji ${cls}">${m.ai ? '✨' : CAT_ICON[m.cat] || '⭐'}</div>`;
};
const planSeconds = (p) => p.rounds * p.moves.length * (p.work + p.rest) - p.rest + 10;

/* ---------------- Sayfa ---------------- */
function pageHome2() {
  const cfg = homeCfg();
  const plan = ui.hwPlan;
  const chip = (attr, active, label) => `<button class="chip${active ? ' active' : ''}" ${attr}>${label}</button>`;
  return `
  ${pageHead('Evde Antrenman', 'Salon yok mu? Evdeki eşyalarla sana özel program.')}
  <div class="card hw-hero">
    ${photoBg('assets/img/ex/push-up-1.jpg', 'hw-hero-photo')}
    <div class="hw-hero-text"><span class="eyebrow">Ekipmansız Mod</span><h2>Evdeki her şey<br>bir spor aleti.</h2><p>Sandalye, çanta, havlu… Seç, gerisini FITTRACK halletsin.</p></div>
  </div>
  <div class="grid g-2">
    <div class="card">
      <div class="card-head"><span class="card-title">${icon('home')} Evinde neler var?</span><span class="muted sm">${cfg.items.length ? cfg.items.length + ' seçili' : 'Hiçbiri de olur'}</span></div>
      <div class="hw-items">${HOME_ITEMS.map(([k, e, n]) => `<button class="hw-item${cfg.items.includes(k) ? ' active' : ''}" data-action="hw-item" data-k="${k}" aria-pressed="${cfg.items.includes(k)}"><span>${e}</span><small>${n}</small></button>`).join('')}</div>
      <div class="hw-ai">
        <form data-form="hw-ai" class="inline-form" autocomplete="off">
          <div class="field grow"><label>${icon('sparkle')} Listede olmayan bir şey mi var?</label><input name="items" maxlength="80" placeholder="Örn. ütü masası, bidon, pet şişe dolu kasa"></div>
          <button class="btn btn-ghost" type="submit"${ui.hwAiBusy ? ' disabled' : ''}>${ui.hwAiBusy ? icon('refresh') + ' Düşünüyor…' : icon('sparkle') + ' Hareket bul'}</button>
        </form>
        ${(ui.hwAi || []).length ? `<div class="hw-ai-list">${ui.hwAi.map(m => `<span class="badge badge-violet">✨ ${esc(m.n)}</span>`).join('')}<button class="btn-icon sm" data-action="hw-ai-clear" aria-label="Yapay zeka hareketlerini temizle">${icon('x')}</button></div>` : ''}
      </div>
    </div>
    <div class="card">
      <div class="card-head"><span class="card-title">${icon('target')} Hedef ve süre</span></div>
      <label class="lbl">Hedef</label>
      <div class="chips">${Object.entries(HOME_GOALS).map(([k, g]) => chip(`data-action="hw-set" data-f="goal" data-v="${k}"`, cfg.goal === k, `${g.emoji} ${g.label}`)).join('')}</div>
      <label class="lbl">Süre</label>
      <div class="chips">${[10, 20, 30, 45].map(m => chip(`data-action="hw-set" data-f="min" data-v="${m}"`, cfg.min === m, `${m} dk`)).join('')}</div>
      <label class="lbl">Seviye</label>
      <div class="chips">${Object.entries(HOME_LEVELS).map(([k, [l, w, r]]) => chip(`data-action="hw-set" data-f="lvl" data-v="${k}"`, cfg.lvl === +k, `${l} <small>${w}/${r} sn</small>`)).join('')}</div>
      <button class="btn btn-primary btn-block btn-lg" data-action="hw-build">${icon('zap')} Programımı Oluştur</button>
    </div>
  </div>
  ${plan ? homePlanCard(plan) : ''}
  ${homeHistory()}`;
}

function homePlanCard(p) {
  const g = HOME_GOALS[p.goal];
  const total = planSeconds(p);
  const kcal = Math.round(g.met * (Store.currentWeight() || 75) * total / 3600);
  return `<div class="card hw-plan" id="hwPlan">
    <div class="card-head"><span class="card-title">${g.emoji} ${g.label} Devresi</span><span class="badge badge-green">${HOME_LEVELS[p.lvl][0]}</span></div>
    <div class="hw-meta">
      <div><b>${Math.round(total / 60)}</b><small>dakika</small></div>
      <div><b>${p.rounds}</b><small>tur</small></div>
      <div><b>${p.work}/${p.rest}</b><small>sn çalış/dinlen</small></div>
      <div><b>~${kcal}</b><small>kcal</small></div>
    </div>
    <div class="ex-list">${p.moves.map((id, i) => {
      const m = moveOf(id);
      const need = m.need.length ? m.need.filter(n => homeCfg().items.includes(n)).map(n => HOME_ITEM[n] ? HOME_ITEM[n].e : '').join('') : '';
      return `<div class="list-item">${moveThumb(m)}<div class="li-body"><span class="li-title">${i + 1}. ${esc(m.n)} ${need}${m.ai ? ' <span class="badge badge-violet">AI</span>' : ''}</span><span class="li-sub">${esc(m.cue)}</span></div>
        <button class="btn-icon sm" data-action="hw-swap" data-i="${i}" aria-label="${esc(m.n)} yerine başka hareket">${icon('refresh')}</button></div>`;
    }).join('')}</div>
    <p class="hint">${icon('info')} Her harekette ${p.work} sn çalış, ${p.rest} sn dinlen. Liste bitince baştan başla: toplam ${p.rounds} tur. Bir hareketi beğenmezsen ${icon('refresh')} ile değiştir.</p>
    <div class="hw-plan-actions">
      <button class="btn btn-ghost" data-action="hw-build">${icon('refresh')} Karıştır</button>
      <button class="btn btn-primary btn-lg grow" data-action="hw-start">${icon('play')} Başlat</button>
    </div>
  </div>`;
}

function homeHistory() {
  const list = S().sessions.filter(x => x.type === 'home').slice(-5).reverse();
  if (!list.length) return '';
  return `<div class="card"><div class="card-head"><span class="card-title">${icon('history')} Son ev antrenmanları</span></div>
    ${list.map(x => `<div class="hist-row"><b>${esc(x.title)}</b><span class="muted sm">${dayLabel(x.date)} · ${fmtDur(x.durationSec)} · ${x.setCount} set · ~${x.burned} kcal</span></div>`).join('')}</div>`;
}

/* ---------------- Oynatıcı ---------------- */
const HW = {
  steps: [], i: 0, left: 0, paused: false, timer: null, startedAt: 0, plan: null, doneWork: 0, lock: null, lastTick: 0,
  start(plan) {
    this.plan = plan;
    this.steps = [{ t: 'prep', sec: 10, m: plan.moves[0], r: 1 }];
    for (let r = 1; r <= plan.rounds; r++) {
      plan.moves.forEach((id, k) => {
        this.steps.push({ t: 'work', sec: plan.work, m: id, r });
        const last = r === plan.rounds && k === plan.moves.length - 1;
        if (!last) {
          const next = plan.moves[(k + 1) % plan.moves.length];
          const roundEnd = k === plan.moves.length - 1;
          this.steps.push({ t: 'rest', sec: roundEnd ? Math.max(plan.rest, 45) : plan.rest, m: next, r: roundEnd ? r + 1 : r, roundEnd });
        }
      });
    }
    this.i = 0; this.doneWork = 0; this.startedAt = Date.now(); this.paused = false;
    this.left = this.steps[0].sec;
    document.body.classList.add('hw-on');
    let el = $('#hwPlayer');
    if (!el) { el = document.createElement('div'); el.id = 'hwPlayer'; el.className = 'hw-player'; document.body.appendChild(el); }
    this.keepAwake(true);
    this.announce();
    this.draw();
    clearInterval(this.timer);
    this.lastTick = Date.now();
    this.timer = setInterval(() => this.tick(), 250);
  },
  tick() {
    const now = Date.now();
    const dt = (now - this.lastTick) / 1000;
    this.lastTick = now;
    if (this.paused) return;
    const before = Math.ceil(this.left);
    this.left -= dt;
    const after = Math.ceil(this.left);
    if (after !== before && after <= 3 && after > 0) hwTick(after === 1 ? 880 : 660);
    if (this.left <= 0) return this.next();
    this.drawTime();
  },
  next(skip = false) {
    const cur = this.steps[this.i];
    if (cur && cur.t === 'work' && !skip) this.doneWork++;
    this.i++;
    if (this.i >= this.steps.length) return this.finish(true);
    this.left = this.steps[this.i].sec;
    buzz(this.steps[this.i].t === 'work' ? [120, 60, 120] : 150);
    if (this.steps[this.i].t === 'work') hwTick(1046, 0.25);
    this.announce();
    this.draw();
  },
  prev() {
    let j = this.i - 1;
    while (j > 0 && this.steps[j].t !== 'work') j--;
    if (j < 0) j = 0;
    this.i = j; this.left = this.steps[j].sec; this.announce(); this.draw();
  },
  toggle() { this.paused = !this.paused; this.lastTick = Date.now(); this.draw(); },
  announce() {
    const st = this.steps[this.i]; if (!st) return;
    const m = moveOf(st.m);
    const text = st.t === 'prep' ? `Hazırlan. İlk hareket: ${m.n}` : st.t === 'work' ? `${m.n}. Başla!` : st.roundEnd ? `Tur bitti, dinlen. Sıradaki: ${m.n}` : `Dinlen. Sıradaki: ${m.n}`;
    hwSay(text);
  },
  draw() {
    const el = $('#hwPlayer'); if (!el) return;
    const st = this.steps[this.i]; const p = this.plan;
    const m = moveOf(st.m);
    const workIdx = this.steps.slice(0, this.i + 1).filter(x => x.t === 'work').length;
    const totalWork = p.rounds * p.moves.length;
    const nextWork = this.steps.slice(this.i + 1).find(x => x.t === 'work');
    const label = st.t === 'prep' ? 'Hazırlan' : st.t === 'work' ? 'Çalış' : st.roundEnd ? 'Tur arası' : 'Dinlen';
    const ex = m.ex && EX_BY_ID[m.ex];
    el.className = `hw-player ph-${st.t}${this.paused ? ' paused' : ''}`;
    el.innerHTML = `
      <div class="hwp-top">
        <button class="btn-icon" data-action="hw-stop" aria-label="Bitir">${icon('x')}</button>
        <div class="hwp-progress"><span style="width:${Math.round(((workIdx - (st.t === 'work' ? 1 : 0)) / totalWork) * 100)}%"></span></div>
        <span class="hwp-round">Tur ${st.r}/${p.rounds}</span>
      </div>
      <div class="hwp-phase">${label}</div>
      <div class="hwp-ring" id="hwRing">${Charts.ring({ value: Math.max(0, this.left), max: st.sec, size: 230, stroke: 14, colors: st.t === 'work' ? ['#ff2d3d', '#ff8a3d'] : ['#22c55e', '#38bdf8'], center: `<b class="hwp-time" id="hwTime">${Math.max(0, Math.ceil(this.left))}</b>` })}</div>
      <div class="hwp-move">
        ${ex ? `<img src="${hwBigImg(ex, st.t === 'work' ? 1 : 0)}" alt="" class="hwp-img">` : `<div class="hwp-emoji">${m.ai ? '✨' : CAT_ICON[m.cat] || '⭐'}</div>`}
        <div><small>${st.t === 'work' ? `Hareket ${workIdx}/${totalWork}` : 'Sıradaki'}</small><h2>${esc(m.n)}</h2><p>${esc(m.cue)}${m.uni && st.t === 'work' ? ' <b>Süre yarısında taraf değiştir.</b>' : ''}</p></div>
      </div>
      ${st.t === 'work' && nextWork ? `<div class="hwp-next">Sonra: <b>${esc(moveOf(nextWork.m).n)}</b></div>` : ''}
      <div class="hwp-controls">
        <button class="btn btn-ghost" data-action="hw-prev" aria-label="Önceki">${icon('left')}</button>
        <button class="btn btn-primary btn-lg hwp-pause" data-action="hw-toggle">${this.paused ? icon('play') + ' Devam' : icon('pause') + ' Duraklat'}</button>
        <button class="btn btn-ghost" data-action="hw-skip" aria-label="Atla">${icon('right')}</button>
      </div>`;
  },
  drawTime() {
    const st = this.steps[this.i];
    const ring = $('#hwRing');
    if (ring) ring.innerHTML = Charts.ring({ value: Math.max(0, this.left), max: st.sec, size: 230, stroke: 14, colors: st.t === 'work' ? ['#ff2d3d', '#ff8a3d'] : ['#22c55e', '#38bdf8'], center: `<b class="hwp-time">${Math.max(0, Math.ceil(this.left))}</b>` });
  },
  close() {
    clearInterval(this.timer); this.timer = null;
    const el = $('#hwPlayer'); if (el) el.remove();
    document.body.classList.remove('hw-on');
    this.keepAwake(false);
    try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) { /* yok */ }
  },
  finish(complete) {
    const p = this.plan;
    const sets = this.doneWork;
    const durationSec = Math.max(60, Math.round((Date.now() - this.startedAt) / 1000));
    this.close();
    if (!sets) { toast('Antrenman kaydedilmedi (tamamlanan hareket yok)', 'info'); return; }
    const g = HOME_GOALS[p.goal];
    const kg = Store.currentWeight() || 75;
    const burned = Math.round(g.met * kg * durationSec / 3600);
    // Kas haritası ve geçmiş için: kütüphanede karşılığı olan vücut ağırlığı hareketleri
    const perMove = {};
    let counted = 0;
    for (let r = 0; r < p.rounds && counted < sets; r++) {
      for (const id of p.moves) { if (counted >= sets) break; perMove[id] = (perMove[id] || 0) + 1; counted++; }
    }
    const byEx = {};
    Object.entries(perMove).forEach(([id, n]) => {
      const m = moveOf(id); const ex = m.ex && EX_BY_ID[m.ex];
      if (!ex || !/Vücut ağırlığı|Ekipmansız/.test(ex.equipment) || m.cat === 'stretch') return;
      byEx[ex.id] = (byEx[ex.id] || 0) + n;
    });
    const exercises = Object.entries(byEx).map(([exId, n]) => ({ ex: exId, target: `${p.work} sn`, sets: Array.from({ length: n }, () => ({ kg: 0, reps: Math.max(1, Math.round(p.work / 3.5)) })) }));
    const title = `Evde ${g.label}${complete ? '' : ' (yarım)'}`;
    const session = { id: uid(), date: DateUtil.today(), tpl: null, title, type: 'home', startedAt: this.startedAt, durationSec, exercises, volume: 0, setCount: sets, burned };
    S().sessions.push(session);
    S().sessions.sort((x, y) => x.startedAt - y.startedAt);
    Store.save();
    if (complete) hwSay('Antrenman bitti. Harika iş çıkardın!');
    openModal(complete ? 'Tebrikler! 🎉' : 'Antrenman kaydedildi', `
      <div class="hw-done">
        <div class="hw-done-ic">${complete ? '🏆' : '💪'}</div>
        <p class="muted">${complete ? 'Devreyi baştan sona tamamladın.' : 'Yarıda bıraktın ama yaptığın her set sayılır.'}</p>
        <div class="hw-meta">
          <div><b>${fmtDur(durationSec)}</b><small>süre</small></div>
          <div><b>${sets}</b><small>hareket</small></div>
          <div><b>~${burned}</b><small>kcal</small></div>
        </div>
      </div>
      <div class="modal-actions"><button class="btn btn-ghost" data-action="modal-close">Kapat</button>${AI.ready() ? `<button class="btn btn-primary" data-action="hw-coach">${icon('sparkle')} Koça yorumlat</button>` : ''}</div>`);
    if (currentPage === 'evde') rerender();
  },
  async keepAwake(on) {
    try {
      if (on && navigator.wakeLock) this.lock = await navigator.wakeLock.request('screen');
      else if (!on && this.lock) { this.lock.release(); this.lock = null; }
    } catch (e) { /* desteklenmiyor */ }
  }
};

/* Büyük fotoğraf yalnızca uygulamanın içindeyse (internetsiz çalışsın), değilse küçük resim */
function hwBigImg(ex, i) {
  const src = ex.img && ex.img[i];
  return src && !/^https?:/.test(src) ? src : ex.thumb;
}
ICONS.pause = '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>';

let hwAudio = null;
function hwTick(freq = 660, dur = 0.12) {
  if (!S().settings.sound) return;
  try {
    hwAudio = hwAudio || new (window.AudioContext || window.webkitAudioContext)();
    const o = hwAudio.createOscillator(), g = hwAudio.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, hwAudio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.3, hwAudio.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, hwAudio.currentTime + dur);
    o.connect(g).connect(hwAudio.destination);
    o.start(); o.stop(hwAudio.currentTime + dur + 0.02);
  } catch (e) { /* ses yok */ }
}
function hwSay(text) {
  if (!S().settings.sound || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'tr-TR'; u.rate = 1.05;
    const v = speechSynthesis.getVoices().find(x => /^tr/i.test(x.lang));
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  } catch (e) { /* konuşma yok */ }
}

/* ---------------- Yapay zeka: listede olmayan eşyalar ---------------- */
FORMS['hw-ai'] = async (d) => {
  const items = String(d.items || '').trim();
  if (!items) { toast('Evde ne olduğunu yaz', 'err'); return; }
  if (!AI.ready()) { aiNeedKey('Listede olmayan eşyalar için hareket bulmak'); return; }
  const cfg = homeCfg();
  ui.hwAiBusy = true; rerender();
  try {
    const text = await AI.ask({
      contents: [{ role: 'user', parts: [{ text: `Evdeki şu eşyalarla yapılabilecek, GÜVENLİ ve yaratıcı 3-5 egzersiz öner: "${items.slice(0, 80)}".
Kullanıcının hedefi: ${HOME_GOALS[cfg.goal].label}, seviye: ${HOME_LEVELS[cfg.lvl][0]}.
Kırılabilecek, devrilebilecek ya da düşme riski olan kullanımları önerme. Eşya uygun değilse vücut ağırlığıyla alternatif öner.
SADECE şu JSON'u döndür: {"hareketler":[{"ad":"kısa Türkçe ad (en fazla 32 karakter)","nasil":"tek cümlelik net talimat (en fazla 120 karakter)","kategori":"push|pull|legs|glute|shoulder|arms|core|cardio|stretch","tek_tarafli":false}]}` }] }],
      json: true, maxTokens: 700
    });
    const r = AI.parseJSON(text);
    const cats = ['push', 'pull', 'legs', 'glute', 'shoulder', 'arms', 'core', 'cardio', 'stretch'];
    const list = (r.hareketler || []).filter(h => h && h.ad).slice(0, 5).map((h, i) => ({
      id: `ai-${Date.now().toString(36)}-${i}`, ai: true, n: String(h.ad).slice(0, 40), cue: String(h.nasil || '').slice(0, 160),
      cat: cats.includes(h.kategori) ? h.kategori : 'core', uni: !!h.tek_tarafli, lvl: cfg.lvl, need: [], ex: null
    }));
    if (!list.length) throw new Error('Uygun hareket bulunamadı, farklı bir eşya dene.');
    ui.hwAi = list;
    ui.hwPlan = buildHomePlan(cfg, list);
    toast(`${list.length} yeni hareket bulundu ✨`);
  } catch (e) { toast(e.message, 'err'); }
  ui.hwAiBusy = false;
  if (currentPage === 'evde') { rerender(); const pl = $('#hwPlan'); if (pl) pl.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
};

/* ---------------- Olaylar ---------------- */
Object.assign(ACTIONS, {
  'hw-item': (el) => {
    const cfg = homeCfg(); const k = el.dataset.k;
    cfg.items = cfg.items.includes(k) ? cfg.items.filter(x => x !== k) : [...cfg.items, k];
    Store.save(); rerender();
  },
  'hw-set': (el) => { const cfg = homeCfg(); cfg[el.dataset.f] = el.dataset.f === 'goal' ? el.dataset.v : +el.dataset.v; Store.save(); rerender(); },
  'hw-build': () => {
    ui.hwPlan = buildHomePlan(homeCfg(), ui.hwAi || []);
    rerender();
    const pl = $('#hwPlan'); if (pl) pl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
  'hw-swap': (el) => {
    const p = ui.hwPlan; if (!p) return;
    const i = +el.dataset.i; const cur = moveOf(p.moves[i]); const cfg = homeCfg();
    const pool = [...HOME_MOVES, ...(ui.hwAi || [])].filter(m => hasItem(m, cfg.items) && !p.moves.includes(m.id) && m.lvl <= cfg.lvl + 1);
    const same = pool.filter(m => m.cat === cur.cat);
    const c = same.length ? same : pool.filter(m => (cur.cat === 'stretch') === (m.cat === 'stretch'));
    if (!c.length) { toast('Başka uygun hareket yok', 'info'); return; }
    p.moves[i] = shuffle(c)[0].id; rerender();
  },
  'hw-ai-clear': () => { ui.hwAi = []; if (ui.hwPlan) ui.hwPlan = buildHomePlan(homeCfg()); rerender(); },
  'hw-start': () => {
    if (!ui.hwPlan) return;
    if (S().active) { toast('Önce devam eden salon antrenmanını bitir', 'err'); return; }
    // Mobil tarayıcılarda sesi kullanıcı dokunuşuyla aç
    hwTick(1, 0.01);
    HW.start(ui.hwPlan);
  },
  'hw-toggle': () => HW.toggle(),
  'hw-skip': () => HW.next(true),
  'hw-prev': () => HW.prev(),
  'hw-stop': () => {
    HW.paused = true; HW.draw();
    confirmBox('Antrenmanı bitir', HW.doneWork ? `Şu ana kadar ${HW.doneWork} hareket tamamladın. Kaydedip bitirelim mi?` : 'Henüz hareket tamamlanmadı. Çıkılsın mı?', HW.doneWork ? 'Kaydet ve Bitir' : 'Çık', () => { closeModal(); HW.finish(false); }, false);
  },
  'hw-coach': () => {
    closeModal(); go('coach');
    setTimeout(() => coachSend('Az önce bitirdiğim ev antrenmanımı kısaca değerlendir ve bir sonraki antrenman için 2 öneri ver.'), 150);
  }
});
/* Onay penceresi "Vazgeç" ile kapanırsa oynatıcı duraklatılmış kalır; kullanıcı Devam'a basar. */

/* ---------------- Menü + sayfa ---------------- */
(() => {
  const i = NAV.findIndex(n => n.id === 'programs');
  NAV.splice(i, 0, { id: 'evde', label: 'Evde Antrenman', icon: 'home' });
  TITLES.evde = 'Evde Antrenman';
  ROUTES.evde = pageHome2;

  // Antrenman sayfasında kısayol
  const wOrig = ROUTES.workout;
  ROUTES.workout = (p) => {
    const html = wOrig(p);
    if (S().active) return html;
    const card = `<button class="card hw-shortcut" data-action="go" data-to="evde"><span class="hw-sc-ic">🏠</span><span class="hw-sc-body"><b>Evde Antrenman</b><small>Salona gidemiyor musun? Evdeki eşyalarla program oluştur.</small></span>${icon('right', 'li-end')}</button>`;
    const k = html.indexOf('<div class="grid workout-grid">');
    return k === -1 ? html + card : html.slice(0, k) + card + html.slice(k);
  };
})();
