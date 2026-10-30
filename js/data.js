/* =========================================================
   FITTRACK — Statik veriler
   İkonlar, egzersiz kütüphanesi, program şablonları, besinler
   ========================================================= */
'use strict';

/* ---------- İkon seti (24x24, çizgi stili) ---------- */
const ICONS = {
  home: '<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z"/>',
  dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  apple: '<path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/><path d="M10 2c1 .5 2 2 2 5"/>',
  shaker: '<path d="M7 8h10l-1.4 13H8.4z"/><path d="M8 3h8v5H8zM8.5 13h7"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  drop: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  chart: '<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
  book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  play: '<path d="M7 4.5v15l12.5-7.5z"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  scale: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M7.5 10a6 6 0 0 1 9 0M12 10l1.5-2"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/>',
  utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  glass: '<path d="M5 2h14l-2 20H7z"/><path d="M6 8h12"/>',
  volume: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
  vibrate: '<rect x="8" y="4" width="8" height="16" rx="1.5"/><path d="M4 8v8M20 8v8"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>',
  history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
  body: '<circle cx="12" cy="4.5" r="2.5"/><path d="M5 9h14M12 9v6M12 15l-3.5 7M12 15l3.5 7M7 9l-1 6M17 9l1 6"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  stop: '<rect x="5" y="5" width="14" height="14" rx="2"/>',
  calc: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h8"/>',
  star: '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
  /* kas grubu ikonları */
  g_chest: '<path d="M7 3h10l2.5 4L17 10v11H7V10L4.5 7z"/><path d="M8 9.5c1.6 1.8 6.4 1.8 8 0M12 10.5v4"/>',
  g_back: '<path d="M12 3 7 6l-3 6 2 9h12l2-9-3-6z"/><path d="M12 3v18M8 12h8"/>',
  g_shoulder: '<circle cx="12" cy="5" r="2.5"/><path d="M5 13c0-3 2-5 4-5h6c2 0 4 2 4 5M5 13v6M19 13v6M9 8v13M15 8v13"/>',
  g_arm: '<path d="M5 20c-1-4 0-8 2-11l3-5c1-1 3-.5 3 1l-1 4c3-1.5 7 0 8 3.5 1 4.5-3 7.5-8 7.5z"/>',
  g_leg: '<path d="M8 2h8l-1 9-1 11h-3l.5-8-1.5-3-1 11H6.5L8 11z"/>',
  g_core: '<rect x="6" y="3" width="12" height="18" rx="4"/><path d="M12 3v18M6 9h12M6 15h12"/>'
};

/* ---------- Kas grupları ---------- */
const MUSCLE_GROUPS = ['Göğüs', 'Sırt', 'Omuz', 'Kol', 'Bacak', 'Karın'];
const GROUP_ICON = { 'Göğüs': 'g_chest', 'Sırt': 'g_back', 'Omuz': 'g_shoulder', 'Kol': 'g_arm', 'Bacak': 'g_leg', 'Karın': 'g_core' };

const MUSCLE_NAMES = {
  chest: 'Göğüs', frontDelt: 'Ön Omuz', sideDelt: 'Yan Omuz', rearDelt: 'Arka Omuz',
  biceps: 'Biceps', triceps: 'Triceps', forearms: 'Ön Kol', lats: 'Kanat (Lat)',
  traps: 'Trapez', lowerBack: 'Bel', abs: 'Karın', obliques: 'Yan Karın',
  quads: 'Ön Bacak', hamstrings: 'Arka Bacak', glutes: 'Kalça', calves: 'Baldır'
};

/* ---------- Egzersiz kütüphanesi ----------
   region: upper | lower  (program bölümü)
   sets/reps/rest: önerilen varsayılan değerler
   bodyweight: true ise ağırlık isteğe bağlıdır
---------------------------------------------- */
const EXERCISES = [
  { id: 'bench-press', name: 'Bench Press', group: 'Göğüs', region: 'upper', muscles: ['chest', 'frontDelt', 'triceps'], equipment: 'Barbell, düz bench', level: 'Orta', sets: 4, reps: '8-10', rest: 120,
    desc: 'Göğüs kaslarını, ön omuzları ve tricepsleri çalıştıran temel itiş egzersizi. Üst vücut kuvvetinin en önemli göstergelerinden biridir.',
    steps: ['Bench\'e sırt üstü uzan, gözlerin barın hizasında olsun.', 'Barı omuz genişliğinden biraz geniş tut, kürek kemiklerini geriye ve aşağı sık.', 'Barı kontrollü şekilde göğsünün alt kısmına indir.', 'Ayaklarını yere bastırarak barı güçlü bir şekilde yukarı it.'],
    tips: ['Belini aşırı kavislendirme, kalçan bench\'ten kalkmasın.', 'Dirseklerini gövdeye yaklaşık 45° açıda tut.', 'Ağır setlerde mutlaka spotter kullan.'] },
  { id: 'incline-db-press', name: 'Incline Dumbbell Press', group: 'Göğüs', region: 'upper', muscles: ['chest', 'frontDelt', 'triceps'], equipment: 'Dumbbell, eğimli bench', level: 'Orta', sets: 3, reps: '10-12', rest: 90,
    desc: 'Göğsün üst bölümünü hedefleyen, dumbbell ile hareket açıklığını artıran itiş egzersizi.',
    steps: ['Bench\'i 30–45° eğime ayarla.', 'Dumbbell\'ları omuz hizasında tut, avuç içleri ileri baksın.', 'Ağırlıkları yukarıda birbirine yaklaştırarak it.', 'Kontrollü şekilde başlangıç pozisyonuna indir.'],
    tips: ['Eğimi çok artırırsan yük omuza kayar.', 'Alt noktada göğüste hafif bir gerilme hisset.'] },
  { id: 'push-up', name: 'Şınav (Push-up)', group: 'Göğüs', region: 'upper', muscles: ['chest', 'triceps', 'frontDelt', 'abs'], equipment: 'Vücut ağırlığı', level: 'Başlangıç', sets: 3, reps: '12-15', rest: 60, bodyweight: true,
    desc: 'Ekipmansız yapılabilen, göğüs, triceps ve core bölgesini birlikte çalıştıran klasik egzersiz.',
    steps: ['Ellerini omuz genişliğinde yere koy, vücudunu düz bir çizgide tut.', 'Göğsün yere yaklaşana kadar dirseklerini bükerek alçal.', 'Avuç içlerinden iterek başlangıç pozisyonuna dön.'],
    tips: ['Kalçanı düşürme veya yukarı kaldırma.', 'Zorlanırsan dizlerin üzerinde başla.'] },
  { id: 'cable-fly', name: 'Cable Fly', group: 'Göğüs', region: 'upper', muscles: ['chest', 'frontDelt'], equipment: 'Kablo istasyonu', level: 'Orta', sets: 3, reps: '12-15', rest: 60,
    desc: 'Göğüs kaslarını sürekli gerilim altında tutan izolasyon hareketi.',
    steps: ['Kabloları omuz hizasının biraz üzerine ayarla.', 'Bir adım öne çık, dirseklerin hafif bükük kalsın.', 'Kolları yay çizer gibi önde birleştir.', 'Gerilmeyi hissederek yavaşça aç.'],
    tips: ['Hareketi kollarla değil göğüsle yap.', 'Ağırlık yerine kasılmaya odaklan.'] },
  { id: 'dips', name: 'Dips', group: 'Göğüs', region: 'upper', muscles: ['chest', 'triceps', 'frontDelt'], equipment: 'Paralel bar', level: 'İleri', sets: 3, reps: '8-12', rest: 90, bodyweight: true,
    desc: 'Alt göğüs ve tricepsleri güçlü şekilde çalıştıran vücut ağırlığı egzersizi.',
    steps: ['Paralel barlarda kolların düz şekilde destek al.', 'Gövdeni hafif öne eğerek dirseklerini bük.', 'Omuzların dirsek hizasına gelince yukarı it.'],
    tips: ['Omuz ağrın varsa hareket açıklığını kısalt.', 'Ek ağırlık için dip kemeri kullanabilirsin.'] },

  { id: 'lat-pulldown', name: 'Lat Pulldown', group: 'Sırt', region: 'upper', muscles: ['lats', 'biceps', 'rearDelt'], equipment: 'Kablo makinesi', level: 'Başlangıç', sets: 3, reps: '10-12', rest: 90,
    desc: 'Sırtın genişliğini sağlayan kanat kaslarını hedefleyen çekiş egzersizi.',
    steps: ['Barı omuz genişliğinden geniş kavra.', 'Göğsünü hafifçe yukarı kaldır, hafif geriye yaslan.', 'Barı üst göğsüne doğru dirseklerini aşağı çekerek indir.', 'Kontrollü şekilde kolları uzat.'],
    tips: ['Barı ensenin arkasına çekme.', 'Hareketi dirseklerle yönlendirdiğini düşün.'] },
  { id: 'barbell-row', name: 'Barbell Row', group: 'Sırt', region: 'upper', muscles: ['lats', 'traps', 'rearDelt', 'biceps', 'lowerBack'], equipment: 'Barbell', level: 'Orta', sets: 4, reps: '8-10', rest: 120,
    desc: 'Sırt kalınlığı ve genel çekiş kuvveti için temel bileşik hareket.',
    steps: ['Barı omuz genişliğinde tut, dizlerini hafif bük.', 'Kalçadan menteşe yaparak gövdeni yaklaşık 45° öne eğ.', 'Barı göbek hizasına çek, kürek kemiklerini sık.', 'Kontrollü şekilde indir.'],
    tips: ['Belini nötr pozisyonda tut, kamburlaşma.', 'Gövdeyle savurarak çekme.'] },
  { id: 'seated-cable-row', name: 'Seated Cable Row', group: 'Sırt', region: 'upper', muscles: ['lats', 'traps', 'rearDelt', 'biceps'], equipment: 'Kablo makinesi', level: 'Başlangıç', sets: 3, reps: '10-12', rest: 90,
    desc: 'Orta sırt ve kanat kaslarını kontrollü şekilde çalıştıran oturarak çekiş hareketi.',
    steps: ['Ayaklarını platforma yerleştir, dizlerin hafif bükük olsun.', 'Tutamağı karnına doğru çek.', 'Kürek kemiklerini birbirine yaklaştır.', 'Yavaşça uzatarak başlangıca dön.'],
    tips: ['Gövdeni sabit tut, ileri geri sallanma.'] },
  { id: 'pull-up', name: 'Barfiks (Pull-up)', group: 'Sırt', region: 'upper', muscles: ['lats', 'biceps', 'rearDelt', 'forearms'], equipment: 'Barfiks barı', level: 'İleri', sets: 4, reps: '6-10', rest: 120, bodyweight: true,
    desc: 'Vücut ağırlığıyla yapılan en etkili sırt geliştirme egzersizlerinden biri.',
    steps: ['Barı omuz genişliğinden geniş, avuç içleri önde kavra.', 'Kürek kemiklerini aşağı çekerek hareketi başlat.', 'Çenen barın üzerine çıkana kadar çekil.', 'Kontrollü şekilde tamamen in.'],
    tips: ['Yapamıyorsan lastik bant veya asistli makine kullan.', 'Sallanmadan, temiz tekrarlar yap.'] },
  { id: 'deadlift', name: 'Deadlift', group: 'Sırt', region: 'lower', muscles: ['hamstrings', 'glutes', 'lowerBack', 'traps', 'quads', 'forearms'], equipment: 'Barbell', level: 'İleri', sets: 4, reps: '5', rest: 180,
    desc: 'Arka zincirin tamamını çalıştıran, tüm vücut kuvveti için temel hareket.',
    steps: ['Ayakların kalça genişliğinde, bar orta ayağının üzerinde olsun.', 'Kalçadan menteşe yaparak barı omuz genişliğinde kavra.', 'Göğsünü kaldır, belini nötr tut ve barı bacaklarına yakın kaldır.', 'Kalça ve dizleri birlikte açarak dik konuma gel, kontrollü indir.'],
    tips: ['Barı vücuduna yakın tut.', 'Belini asla yuvarlama; ağırlığı formun belirlesin.'] },

  { id: 'shoulder-press', name: 'Shoulder Press', group: 'Omuz', region: 'upper', muscles: ['frontDelt', 'sideDelt', 'triceps'], equipment: 'Dumbbell veya barbell', level: 'Orta', sets: 3, reps: '10-12', rest: 90,
    desc: 'Omuzların ön ve yan bölümlerini geliştiren, baş üstü itiş egzersizi.',
    steps: ['Dumbbell\'ları omuz hizasında, avuç içleri önde tut.', 'Core\'unu sık, ağırlıkları baş üstüne it.', 'Kontrollü şekilde omuz hizasına indir.'],
    tips: ['Belini aşırı kavislendirme.', 'Dirsekleri tamamen kilitleme.'] },
  { id: 'lateral-raise', name: 'Lateral Raise', group: 'Omuz', region: 'upper', muscles: ['sideDelt'], equipment: 'Dumbbell', level: 'Başlangıç', sets: 3, reps: '12-15', rest: 60,
    desc: 'Yan omuzu izole ederek omuz genişliği kazandıran hareket.',
    steps: ['Dumbbell\'ları yanlarında tut.', 'Dirseklerin hafif bükük şekilde kollarını omuz hizasına kaldır.', 'Yavaşça indir.'],
    tips: ['Hafif ağırlıkla, temiz formla çalış.', 'Trapezle yukarı silkme yapma.'] },
  { id: 'face-pull', name: 'Face Pull', group: 'Omuz', region: 'upper', muscles: ['rearDelt', 'traps'], equipment: 'Kablo + halat', level: 'Başlangıç', sets: 3, reps: '15', rest: 60,
    desc: 'Arka omuz ve omuz sağlığı için önemli bir çekiş hareketi.',
    steps: ['Halatı yüz hizasına ayarla.', 'Halatı yüzüne doğru çekerken uçları ayır.', 'Dirseklerini yukarıda tut, kısa süre bekle ve bırak.'],
    tips: ['Postür ve omuz sağlığı için her üst vücut gününe eklenebilir.'] },

  { id: 'bicep-curl', name: 'Bicep Curl', group: 'Kol', region: 'upper', muscles: ['biceps', 'forearms'], equipment: 'Dumbbell veya barbell', level: 'Başlangıç', sets: 3, reps: '10-12', rest: 60,
    desc: 'Pazı kaslarını izole eden temel kol egzersizi.',
    steps: ['Ağırlıkları avuç içleri önde olacak şekilde tut.', 'Dirseklerini gövdene sabitleyip ağırlığı kaldır.', 'Tepe noktada sık, yavaşça indir.'],
    tips: ['Gövdeyle savurma.', 'İniş fazını en az 2 saniye tut.'] },
  { id: 'hammer-curl', name: 'Hammer Curl', group: 'Kol', region: 'upper', muscles: ['biceps', 'forearms'], equipment: 'Dumbbell', level: 'Başlangıç', sets: 3, reps: '10-12', rest: 60,
    desc: 'Biceps ve ön kol kaslarını birlikte çalıştıran nötr tutuşlu curl.',
    steps: ['Dumbbell\'ları avuç içleri birbirine bakacak şekilde tut.', 'Dirsekleri sabit tutarak kaldır.', 'Kontrollü şekilde indir.'],
    tips: ['Bileklerini düz tut.'] },
  { id: 'triceps-extension', name: 'Triceps Extension', group: 'Kol', region: 'upper', muscles: ['triceps'], equipment: 'Dumbbell veya kablo', level: 'Başlangıç', sets: 3, reps: '12', rest: 60,
    desc: 'Arka kolu baş üstü pozisyonda uzatarak çalıştıran izolasyon hareketi.',
    steps: ['Dumbbell\'ı iki elinle baş üstünde tut.', 'Dirseklerini sabit tutarak ağırlığı başının arkasına indir.', 'Tricepsini sıkarak kollarını uzat.'],
    tips: ['Dirsekleri dışa açma.'] },
  { id: 'triceps-pushdown', name: 'Triceps Pushdown', group: 'Kol', region: 'upper', muscles: ['triceps'], equipment: 'Kablo', level: 'Başlangıç', sets: 3, reps: '12-15', rest: 60,
    desc: 'Kablo ile tricepsleri sürekli gerilim altında çalıştıran hareket.',
    steps: ['Bar veya halatı göğüs hizasında kavra.', 'Dirsekleri gövdene sabitle.', 'Kollarını tamamen aşağı uzat, yavaşça geri bırak.'],
    tips: ['Omuzlarını öne düşürme.'] },

  { id: 'squat', name: 'Squat', group: 'Bacak', region: 'lower', muscles: ['quads', 'glutes', 'hamstrings', 'lowerBack', 'abs'], equipment: 'Barbell, squat rack', level: 'Orta', sets: 4, reps: '6-8', rest: 150,
    desc: 'Alt vücudun kral egzersizi. Ön bacak, kalça ve core bölgesini birlikte geliştirir.',
    steps: ['Barı üst sırtına yerleştir, ayaklar omuz genişliğinde olsun.', 'Nefes al, core\'unu sık.', 'Kalçanı geriye ve aşağı göndererek uyluklar en az yere paralel olana kadar çök.', 'Topuklarından iterek yukarı kalk.'],
    tips: ['Dizler ayak uçlarıyla aynı yöne baksın.', 'Topukların yerden kalkmasın.'] },
  { id: 'leg-press', name: 'Leg Press', group: 'Bacak', region: 'lower', muscles: ['quads', 'glutes'], equipment: 'Leg press makinesi', level: 'Başlangıç', sets: 3, reps: '10-12', rest: 90,
    desc: 'Bel yükü olmadan ön bacak ve kalçayı yüksek hacimle çalıştırır.',
    steps: ['Ayaklarını platformda omuz genişliğinde yerleştir.', 'Kilidi aç, dizlerini göğsüne doğru bük.', 'Platformu topuklarınla iterek kolları uzat (dizleri kilitleme).'],
    tips: ['Belinin koltuktan ayrılmasına izin verme.'] },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', group: 'Bacak', region: 'lower', muscles: ['hamstrings', 'glutes', 'lowerBack'], equipment: 'Barbell veya dumbbell', level: 'Orta', sets: 3, reps: '8-10', rest: 120,
    desc: 'Arka bacak ve kalçayı esneme altında çalıştıran menteşe hareketi.',
    steps: ['Barı kalça hizasında tut, dizler hafif bükük.', 'Kalçanı geriye iterek barı bacaklarına yakın şekilde indir.', 'Arka bacakta gerilme hissedince kalçayı öne iterek kalk.'],
    tips: ['Sırtını düz tut, barı dizin biraz altına kadar indirmen yeterli.'] },
  { id: 'lunge', name: 'Lunge', group: 'Bacak', region: 'lower', muscles: ['quads', 'glutes', 'hamstrings'], equipment: 'Dumbbell (isteğe bağlı)', level: 'Başlangıç', sets: 3, reps: '10', rest: 90,
    desc: 'Tek bacak kuvveti ve dengesi için etkili bir hareket.',
    steps: ['Dik dur, bir adım öne at.', 'Arka diz yere yaklaşana kadar alçal.', 'Ön ayağından iterek başlangıca dön, bacak değiştir.'],
    tips: ['Ön diz ayak ucunu çok geçmesin.', 'Gövdeni dik tut.'] },
  { id: 'leg-extension', name: 'Leg Extension', group: 'Bacak', region: 'lower', muscles: ['quads'], equipment: 'Leg extension makinesi', level: 'Başlangıç', sets: 3, reps: '12-15', rest: 60,
    desc: 'Ön bacak kaslarını izole eden makine hareketi.',
    steps: ['Makineye otur, pedi ayak bileğinin önüne yerleştir.', 'Bacaklarını tamamen uzat, tepe noktada sık.', 'Yavaşça indir.'],
    tips: ['Ağırlığı savurma, kontrollü çalış.'] },
  { id: 'leg-curl', name: 'Leg Curl', group: 'Bacak', region: 'lower', muscles: ['hamstrings'], equipment: 'Leg curl makinesi', level: 'Başlangıç', sets: 3, reps: '12', rest: 60,
    desc: 'Arka bacak kaslarını izole eden makine hareketi.',
    steps: ['Makineye yerleş, pedi ayak bileğinin arkasına al.', 'Topuklarını kalçana doğru çek.', 'Kontrollü şekilde geri bırak.'],
    tips: ['Kalçanı pedden kaldırma.'] },
  { id: 'hip-thrust', name: 'Hip Thrust', group: 'Bacak', region: 'lower', muscles: ['glutes', 'hamstrings'], equipment: 'Barbell, bench', level: 'Orta', sets: 3, reps: '10', rest: 90,
    desc: 'Kalça kaslarını en etkili şekilde hedefleyen egzersizlerden biri.',
    steps: ['Sırtının üst kısmını bench\'e daya, barı kalçana yerleştir.', 'Topuklarından iterek kalçanı gövdeyle düz çizgi olana kadar kaldır.', 'Tepe noktada kalçanı sık, kontrollü indir.'],
    tips: ['Bar için ped kullan.', 'Çeneni hafif göğsüne yakın tut.'] },
  { id: 'calf-raise', name: 'Calf Raise', group: 'Bacak', region: 'lower', muscles: ['calves'], equipment: 'Makine veya basamak', level: 'Başlangıç', sets: 4, reps: '15', rest: 60,
    desc: 'Baldır kaslarını geliştiren parmak ucu yükselme hareketi.',
    steps: ['Ayak uçlarını basamağın kenarına yerleştir.', 'Topuklarını olabildiğince yukarı kaldır.', 'Yavaşça topukları basamak seviyesinin altına indir.'],
    tips: ['Tepe noktada 1 saniye bekle.'] },

  { id: 'plank', name: 'Plank', group: 'Karın', region: 'lower', muscles: ['abs', 'obliques', 'lowerBack'], equipment: 'Vücut ağırlığı', level: 'Başlangıç', sets: 3, reps: '45 sn', rest: 60, bodyweight: true,
    desc: 'Core stabilitesini artıran izometrik egzersiz.',
    steps: ['Ön kolların üzerinde, dirsekler omuz altında olacak şekilde pozisyon al.', 'Vücudunu baştan topuğa düz bir çizgide tut.', 'Karın ve kalçanı sıkarak süre boyunca bekle.'],
    tips: ['Kalçanı düşürme.', 'Nefesini tutma.'] },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', group: 'Karın', region: 'lower', muscles: ['abs', 'obliques'], equipment: 'Barfiks barı', level: 'Orta', sets: 3, reps: '12', rest: 60, bodyweight: true,
    desc: 'Alt karın bölgesini güçlü şekilde çalıştıran asılı bacak kaldırma.',
    steps: ['Bara asıl, omuzlarını aktif tut.', 'Bacaklarını kontrollü şekilde kalça hizasına veya üstüne kaldır.', 'Sallanmadan yavaşça indir.'],
    tips: ['Zor gelirse dizleri bükerek başla.'] },
  { id: 'cable-crunch', name: 'Cable Crunch', group: 'Karın', region: 'lower', muscles: ['abs'], equipment: 'Kablo + halat', level: 'Orta', sets: 3, reps: '15', rest: 60,
    desc: 'Karın kaslarını ağırlıkla çalıştırmaya imkân veren kablo hareketi.',
    steps: ['Kablonun önünde diz çök, halatı başının yanında tut.', 'Karnını sıkarak gövdeni aşağı kıvır.', 'Kontrollü şekilde başlangıca dön.'],
    tips: ['Hareketi kalçadan değil omurgayı bükerek yap.'] }
];

const EX_BY_ID = Object.fromEntries(EXERCISES.map(e => [e.id, e]));

/* ---------- Program şablonları (Üst / Alt bölünmüş) ---------- */
const DEFAULT_TEMPLATES = {
  upperA: { name: 'Üst Vücut A', type: 'upper', focus: 'Göğüs · Sırt · Omuz', items: [
    { ex: 'bench-press', sets: 4, reps: '8-10' },
    { ex: 'barbell-row', sets: 4, reps: '8-10' },
    { ex: 'shoulder-press', sets: 3, reps: '10-12' },
    { ex: 'lat-pulldown', sets: 3, reps: '10-12' },
    { ex: 'bicep-curl', sets: 3, reps: '10-12' },
    { ex: 'triceps-pushdown', sets: 3, reps: '12-15' }
  ] },
  lowerA: { name: 'Alt Vücut A', type: 'lower', focus: 'Ön Bacak · Kalça', items: [
    { ex: 'squat', sets: 4, reps: '6-8' },
    { ex: 'romanian-deadlift', sets: 3, reps: '8-10' },
    { ex: 'leg-press', sets: 3, reps: '10-12' },
    { ex: 'leg-curl', sets: 3, reps: '12' },
    { ex: 'calf-raise', sets: 4, reps: '15' },
    { ex: 'plank', sets: 3, reps: '45 sn' }
  ] },
  upperB: { name: 'Üst Vücut B', type: 'upper', focus: 'Üst Göğüs · Kanat · Kol', items: [
    { ex: 'incline-db-press', sets: 4, reps: '8-10' },
    { ex: 'pull-up', sets: 4, reps: '6-10' },
    { ex: 'seated-cable-row', sets: 3, reps: '10-12' },
    { ex: 'lateral-raise', sets: 3, reps: '12-15' },
    { ex: 'hammer-curl', sets: 3, reps: '10-12' },
    { ex: 'triceps-extension', sets: 3, reps: '12' }
  ] },
  lowerB: { name: 'Alt Vücut B', type: 'lower', focus: 'Arka Zincir · Kalça', items: [
    { ex: 'deadlift', sets: 4, reps: '5' },
    { ex: 'lunge', sets: 3, reps: '10' },
    { ex: 'hip-thrust', sets: 3, reps: '10' },
    { ex: 'leg-extension', sets: 3, reps: '12-15' },
    { ex: 'calf-raise', sets: 4, reps: '15' },
    { ex: 'hanging-leg-raise', sets: 3, reps: '12' }
  ] }
};
const TEMPLATE_ORDER = ['upperA', 'lowerA', 'upperB', 'lowerB'];

/* Haftanın günleri: 0 = Pazartesi */
const DAY_NAMES = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const DAY_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const MONTHS_SHORT = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

/* Antrenman günleri (hafta içi indeksleri) */
const SCHEDULE_SLOTS = { 3: [0, 2, 4], 4: [0, 1, 3, 4] };

/* ---------- Hazır besinler (porsiyon başına, yaklaşık değerler) ---------- */
const FOODS = [
  { name: 'Yumurta (1 adet)', kcal: 72, protein: 6.3, carbs: 0.4, fat: 4.8 },
  { name: 'Tavuk göğsü (100 g, pişmiş)', kcal: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: 'Dana kıyma (100 g, pişmiş)', kcal: 217, protein: 26, carbs: 0, fat: 12 },
  { name: 'Somon (100 g)', kcal: 208, protein: 20, carbs: 0, fat: 13 },
  { name: 'Ton balığı (1 kutu, süzülmüş)', kcal: 95, protein: 21, carbs: 0, fat: 1 },
  { name: 'Whey protein (1 ölçek)', kcal: 120, protein: 24, carbs: 3, fat: 1.5 },
  { name: 'Süzme yoğurt (200 g)', kcal: 146, protein: 20, carbs: 8, fat: 4 },
  { name: 'Lor peyniri (100 g)', kcal: 98, protein: 11, carbs: 3.4, fat: 4.3 },
  { name: 'Süt (250 ml, yarım yağlı)', kcal: 115, protein: 8.5, carbs: 12, fat: 3.8 },
  { name: 'Yulaf (50 g)', kcal: 190, protein: 6.5, carbs: 33, fat: 3.5 },
  { name: 'Pirinç pilavı (100 g)', kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { name: 'Tam buğday ekmeği (1 dilim)', kcal: 80, protein: 4, carbs: 14, fat: 1 },
  { name: 'Haşlanmış patates (200 g)', kcal: 174, protein: 3.8, carbs: 40, fat: 0.2 },
  { name: 'Mercimek çorbası (1 kase)', kcal: 180, protein: 9, carbs: 28, fat: 4 },
  { name: 'Muz (1 orta boy)', kcal: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  { name: 'Elma (1 orta boy)', kcal: 95, protein: 0.5, carbs: 25, fat: 0.3 },
  { name: 'Badem (30 g)', kcal: 174, protein: 6, carbs: 6, fat: 15 },
  { name: 'Zeytinyağı (1 yemek kaşığı)', kcal: 119, protein: 0, carbs: 0, fat: 13.5 }
];

const MEAL_TYPES = ['Kahvaltı', 'Öğle Yemeği', 'Akşam Yemeği', 'Ara Öğün'];

const GOALS = {
  muscle: { label: 'Daha fazla kas kütlesi', icon: 'dumbbell' },
  fatloss: { label: 'Yağ yakımı', icon: 'flame' },
  cardio: { label: 'Daha iyi kondisyon', icon: 'heart' },
  health: { label: 'Sağlıklı yaşam', icon: 'shield' }
};

/* ---------- Kas haritası (ön / arka gövde) ---------- */
const BODY_FRONT = [
  ['c', 50, 13, 9, null], ['r', 46, 21, 8, 7, 2, null],
  ['e', 31, 39, 7, 6, ['frontDelt', 'sideDelt']], ['e', 69, 39, 7, 6, ['frontDelt', 'sideDelt']],
  ['r', 36.5, 33, 13, 16, 5, ['chest']], ['r', 50.5, 33, 13, 16, 5, ['chest']],
  ['e', 26, 56, 5, 10, ['biceps']], ['e', 74, 56, 5, 10, ['biceps']],
  ['e', 22, 78, 4.5, 11, ['forearms']], ['e', 78, 78, 4.5, 11, ['forearms']],
  ['c', 20.5, 92, 3, null], ['c', 79.5, 92, 3, null],
  ['r', 43, 51, 14, 31, 4, ['abs']],
  ['r', 36.5, 52, 5.5, 26, 3, ['obliques']], ['r', 58, 52, 5.5, 26, 3, ['obliques']],
  ['r', 37, 81, 26, 11, 5, null],
  ['e', 43, 111, 6.8, 18, ['quads']], ['e', 57, 111, 6.8, 18, ['quads']],
  ['c', 43, 132, 4, null], ['c', 57, 132, 4, null],
  ['e', 43, 151, 5, 14, ['calves']], ['e', 57, 151, 5, 14, ['calves']]
];
const BODY_BACK = [
  ['c', 50, 13, 9, null], ['r', 46, 21, 8, 7, 2, null],
  ['p', 'M38 30 L62 30 L67 37 L50 50 L33 37 Z', ['traps']],
  ['e', 31, 39, 7, 6, ['rearDelt', 'sideDelt']], ['e', 69, 39, 7, 6, ['rearDelt', 'sideDelt']],
  ['r', 36, 45, 12.5, 24, 5, ['lats']], ['r', 51.5, 45, 12.5, 24, 5, ['lats']],
  ['e', 26, 56, 5, 10, ['triceps']], ['e', 74, 56, 5, 10, ['triceps']],
  ['e', 22, 78, 4.5, 11, ['forearms']], ['e', 78, 78, 4.5, 11, ['forearms']],
  ['c', 20.5, 92, 3, null], ['c', 79.5, 92, 3, null],
  ['r', 43, 68, 14, 14, 4, ['lowerBack']],
  ['e', 43.5, 90, 7, 7.5, ['glutes']], ['e', 56.5, 90, 7, 7.5, ['glutes']],
  ['e', 43, 115, 6.5, 16, ['hamstrings']], ['e', 57, 115, 6.5, 16, ['hamstrings']],
  ['e', 43, 150, 5.5, 14, ['calves']], ['e', 57, 150, 5.5, 14, ['calves']]
];
