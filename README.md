# FITTRACK 🏋️

**Daha güçlü bir sen.** HTML5, CSS3 ve saf JavaScript ile yazılmış, tamamen çevrimdışı çalışan bir fitness takip uygulaması. Koyu lacivert/siyah tema ve kırmızı neon vurgularla modern bir dashboard sunar. Android için hazır bir APK sarmalayıcısı da içerir.

## Özellikler

- **Kendi programını oluştur**: haftanın her gününe istediğin antrenmanı ata, sınırsız özel antrenman (Tüm vücut, İtiş, Çekiş, Bacak, Kardiyo…) oluştur ve düzenle
- **Hazır üst / alt vücut programları**: haftada 3 gün (Pzt–Çar–Cum, Üst→Alt→Üst ve sonraki hafta Alt→Üst→Alt dönüşümlü) veya 4 gün (Üst A, Alt A, Üst B, Alt B)
- **Antrenman takibi**: set, tekrar ve ağırlık kaydı; önceki performans gösterimi; set ekleme/çıkarma; serbest antrenman
- **Dinlenme sayacı**: set tamamlanınca otomatik başlar, ±15 sn, sesli ve titreşimli uyarı
- **Antrenman geçmişi**: süre, set, hacim ve tahmini kalori ile
- **Düzenlenebilir şablonlar**: egzersiz ekle/çıkar/sırala, set ve tekrar değiştir
- **Egzersiz kütüphanesi**: 873 egzersiz, kas grubu ve ekipman filtresi, arama; her biri gerçek fotoğraflı, kas haritası, adım adım teknik, ipuçları, gelişim grafiği ve kişisel rekor
- **Beslenme**: öğün bazlı kayıt, hazır besin listesi, porsiyon çarpanı, makro hedefleri
- **Protein takibi**: gram olarak kayıt, hızlı ekleme, kiloya göre hedef önerisi (1,6–2,2 g/kg)
- **Kalori takibi**: alınan/yakılan/net, Mifflin-St Jeor ile günlük ihtiyaç hesaplayıcı
- **Su takibi**: bardak butonları, özel miktar, günlük hedef, hatırlatıcı
- **İstatistikler**: haftalık/aylık/yıllık kilo, hacim, kalori, protein ve su grafikleri, VKİ, tahmini yağ oranı, kişisel rekorlar
- **Profil ve ayarlar**: hedefler, tema (koyu/AMOLED siyah), ses/titreşim, JSON yedekleme/geri yükleme, sıfırlama
- **Android ana ekran widget'ı**: bugünkü antrenman, su, protein ve kalori özeti; uygulamayı açmadan +250 ml su ekleme
- **LocalStorage**: tüm veriler cihazda saklanır; sunucu, hesap veya takip yok
- **Duyarlı tasarım**: telefon (alt menü + çekmece), tablet (ikon menü), masaüstü (tam kenar çubuğu)

İlk açılışta kısa bir kurulum ekranı çıkar. Uygulamayı denemek için **Ayarlar → Örnek veri yükle** ile açıkça "Demo" etiketli örnek veriler yüklenebilir.

## Proje yapısı

```
fittrack/
├── index.html              # Uygulama kabuğu
├── css/style.css           # Tüm stiller (tema, bileşenler, duyarlı kurallar)
├── js/
│   ├── exercises-db.js     # 845 ek egzersiz (tools/build-exercise-db.py ile üretilir)
│   ├── data.js             # İkonlar, egzersizler, program şablonları, besinler
│   ├── store.js            # LocalStorage veri katmanı, takvim/rotasyon mantığı
│   ├── charts.js           # Bağımlılıksız SVG/HTML grafikler
│   └── script.js           # Yönlendirme, 12 sayfa, olaylar, dinlenme sayacı
├── assets/                 # Uygulama ikonları
│   ├── img/ex/             # Temel 28 egzersizin büyük fotoğrafları
│   └── img/th/             # Tüm egzersizlerin küçük resimleri
├── manifest.webmanifest    # PWA bildirimi
├── sw.js                   # Çevrimdışı önbellek (http/https üzerinde)
└── android/                # APK sarmalayıcısı (WebView)
    ├── AndroidManifest.xml
    ├── smali/…/MainActivity.smali   # WebView
    ├── smali/…/FitWidget.smali      # Ana ekran widget'ı
    ├── smali/…/Bridge.smali         # JS ↔ widget köprüsü
    ├── res/
    └── build-apk.sh
```

## Çalıştırma

Derleme gerekmez. `index.html` dosyasını tarayıcıda açman yeterli. PWA/servis çalışanı için yerel bir sunucu kullan:

```bash
npx serve .
# veya
python3 -m http.server 8080
```

## Android APK derleme

APK, web dosyalarını `assets/www` içine koyan küçük bir WebView sarmalayıcısıdır. Android SDK veya Gradle gerekmez; yalnızca Java 11+ yeterlidir.

```bash
cd android
mkdir -p tools
curl -L -o tools/apktool.jar https://github.com/iBotPeaches/Apktool/releases/download/v2.10.0/apktool_2.10.0.jar
curl -L -o tools/uber-apk-signer.jar https://github.com/patrickfav/uber-apk-signer/releases/download/v1.3.0/uber-apk-signer-1.3.0.jar
./build-apk.sh
# Çıktı: android/dist/FITTRACK-v1.3.0.apk
```

Varsayılan olarak hata ayıklama anahtarıyla imzalanır. Kendi anahtarınla imzalamak için:

```bash
KEYSTORE=benim.jks KS_ALIAS=fittrack KS_PASS=sifre ./build-apk.sh
```

Depo GitHub'a yüklendiğinde `.github/workflows/android.yml` her push'ta APK'yı otomatik derleyip "Artifacts" olarak ekler.

## Görseller

Egzersiz fotoğrafları [Free Exercise DB](https://github.com/yuhonas/free-exercise-db) projesinden alınmıştır (kamu malı, Unlicense). Temel 28 egzersizin içeriği Türkçe yazılmıştır ve fotoğrafları uygulamayla gelir. Diğer 845 egzersizin kategori, kas grubu, ekipman ve seviye bilgileri Türkçeleştirilmiştir; uygulama adımları kaynak veritabanındaki gibi İngilizcedir. Küçük resimler uygulamayla gelir, büyük fotoğraflar internet bağlantısı varsa CDN'den yüklenir (yoksa küçük resim gösterilir). Veritabanını yeniden üretmek için:

```bash
git clone https://github.com/yuhonas/free-exercise-db
python3 tools/build-exercise-db.py free-exercise-db --thumbs
```

## Notlar

- Kalori, yakılan enerji ve vücut yağı değerleri tahminidir; tıbbi tavsiye yerine geçmez.
- Hazır besin değerleri yaklaşıktır.

## Lisans

MIT
