# Proje: Makine Öğrenmesi Oyun Alanı

Kapadokya Üniversitesi, Bilişim Sistemleri ve Teknolojileri bölümünde verilen
**giriş seviyesi lisans Makine Öğrenmesi dersi** için tarayıcıda çalışan canlı
gösterim uygulaması. Derste projeksiyona yansıtılıp kaydırıcılarla oynatılır.

## Temel kurallar

- **Tek dosya, sıfır bağımlılık.** `index.html` içinde HTML + CSS + JS. Build adımı yok,
  npm yok, framework yok. Amaç: dosyayı sunucuya kopyala, çalışsın.
- **Vanilla JS + Canvas 2D.** Grafik kütüphanesi eklenmez; her modül kendi çizimini yapar.
- **Arayüz dili Türkçe, terimler İngilizce.** Cümlenin dili Türkçedir; *adlandırılmış*
  yöntem, metrik ve olgu adları İngilizce yazılır ve modül başına **bir kez**,
  `.head` paragrafında `<b>English</b> (Türkçe)` biçiminde açılır. Sonraki geçişlerde
  yalnız İngilizcesi kullanılır. Motamot çeviri yasak: öğrenci o terimi kütüphane
  belgesinde, sınavda ve makalede İngilizce görecek.

  | İngilizce (birincil) | parantezdeki Türkçe |
  |---|---|
  | bagging · bootstrap · out-of-bag (OOB) · random forest | torbalama · yerine koyarak örnekleme · torba dışı · rastgele orman |
  | overfitting · underfitting · bias–variance | aşırı öğrenme · yetersiz öğrenme · yanlılık–varyans |
  | regularization · ridge · lasso · sparsity | düzenlileştirme · L2 · L1 · seyreklik |
  | gradient descent · learning rate · epoch | gradyan inişi · öğrenme oranı · devir |
  | precision · recall · confusion matrix · log loss | kesinlik · duyarlılık · konfüzyon matrisi · log-kayıp |
  | cross-validation (k-fold) · least squares | çapraz doğrulama · en küçük kareler |
  | k-means · WCSS · elbow · silhouette · PCA | k-ortalamalar · küme içi kareli hata · dirsek · siluet · ana bileşen analizi |
  | k-NN · decision tree · logistic/linear regression | k-en yakın komşu · karar ağacı · lojistik/doğrusal regresyon |
  | perceptron · hidden layer · MLP · backpropagation | — · gizli katman · çok katmanlı ağ · geri yayılım |
  | convolution · kernel · feature map · pooling · ReLU | konvolüsyon · çekirdek · öznitelik haritası · havuzlama · — |
  | decision boundary · linearly separable · z-score · min–max | karar sınırı · doğrusal ayrılabilir · z-skoru · min–maks |

  **Türkçe kalan sözcükler** (calque değil, cümlenin dokusu): eşik, öznitelik, katsayı,
  eğim, kesişim, ağırlık, artık, hata, doğruluk, küme, merkez, ağaç, derinlik, yaprak,
  bölme, nokta, sınıf, olasılık, varyans, gürültü, veri. Bunlar İngilizceye çevrilirse
  metin Türkçe–İngilizce karışımına döner.

  `META`'nın 6. alanı (arama etiketleri) **her iki dili de** içerir — öğrenci "bagging"
  yazınca da "torbalama" yazınca da modülü bulmalı. `aria-label` görünür metin sayılır.
- **Tema token'ları.** Bütün renkler `:root` içindeki CSS değişkenlerinden gelir
  (`--ink`, `--surface`, `--accent`, `--a`, `--b`, `--good`, `--warn`, `--bad`).
  Canvas içinde renk `css("--token")` ile okunur, asla sabit hex yazılmaz.
  Açık ve koyu tema ayrı ayrı tanımlıdır; yeni renk eklerken ikisine de eklenir.
  `--accent` zeminine yazan metin `--on-accent` / `--on-accent-soft` kullanır —
  koyu temada beyaz yazı okunmuyor (kontrast 2.8), token koyu mürekkebe geçiyor.
- **Pedagoji zorunlu.** Her modülün altında bir `.ask` kutusu vardır: hocanın derste
  soracağı iki soru. Yeni modül eklerken bu kutu boş bırakılmaz.

## Dosya haritası

```
index.html                   tek sayfa uygulama (tüm modüller burada)
deploy/docker-compose.yml    nginx:alpine konteyneri (npm-net ağında, ml-web)
deploy/nginx.conf.example    konteyner içi nginx — yalnız index.html'i yayınlar
deploy/deploy.sh             rsync ile sunucuya yükleme
tools/lint.py                bütünlük denetimi (id, sözleşme, META, renk)
tools/harness.js             tarayıcısız çalıştırma (DOM/Canvas taklidi)
tools/behaviour.js           17 modülün pedagojik iddialarını sınar (metin ↔ gösterge)
tools/contrast.js            tuval etiketlerinin iki temada WCAG kontrastı
```

Sunucuda 80/443'ü **Nginx Proxy Manager** karşılıyor; site host nginx'ine değil,
`npm-net` ağındaki `ml-web` konteynerine bağlı. Alan adları:
`ml.perinet.org` (Cloudflare) ve `ml.urgup.keenetic.link`.

`index.html` içindeki sıra: `<style>` (temel + premium katman) → `<aside class="rail">`
(arama, ilerleme, gruplu menü) → `<main>` içinde önce `#m-home` giriş sayfası, sonra her
modül için bir `<section>` → `<script>` içinde önce yardımcılar, sonra her modül için bir
IIFE, en sonda `META` / `GROUPS` / `TH` ve kabuk kodu.

## Yeni modül nasıl eklenir

1. `<main>` içine yeni bir `<section id="m-XXX" hidden>` ekle: `.head`, `.stage`
   (canvas + `.bar` kontroller + `.stats`), `.ask` kutusu.
2. `<script>` içine bir IIFE ekle; sonunda `reg({...})` çağır. Sözleşme:

   | alan | zorunlu | ne işe yarar |
   |------|---------|--------------|
   | `id` | ✓ | `<section>` id'si |
   | `draw` | ✓ | tuvali sıfırdan çizer, `if(!fit()) return;` ile başlar |
   | `space` | ✓ | boşluk tuşunun eylemi |
   | `init` | ✓ | ilk veri (sayfa açılırken bir kez) |
   | `stop` | `setInterval` varsa | modül değişince zamanlayıcıyı durdurur |
   | `steps` | önerilir | rehberli anlatım: `[{t,d,run()}]` |
   | `scenarios` | isteğe bağlı | hazır kurulumlar: `[{name,apply()}]` |
   | `undo` | tuval düzenlenebilirse | `editable()`'ın döndürdüğü `undo` |

   `steps[].run()` modülün içine elle dokunmaz; kontrolleri kullanıcı gibi sürer:
   `setR("#id",değer)`, `press("#id")`, `setPressed("#id",true)`. Böylece adımlar
   mevcut olay işleyicilerini kullanır, mantık iki yerde tekrarlanmaz.

   Tuvale nokta eklenen modüllerde `editable(cv,{pts,setPts,toPx,toData,add,draw,commit})`
   kullanılır — sürükleme, silme ve geri almayı tek yerden getirir. `commit` pahalı
   yeniden hesabı yapar (önbellek geçersiz kılma), `draw` sürükleme sırasındaki ucuz çizim.
   - `draw()` her çağrıldığında canvas'ı sıfırdan çizmeli (resize ve tema değişiminde
     yeniden çağrılıyor).
   - Canvas ölçekleme için `setupCanvas(cv)` ve `makeMap(cv,pad)` yardımcıları kullanılır.
3. `META` dizisine satır ekle — **altı alan**:
   `["09","m-XXX","Kısa başlık","alt açıklama","Grup","arama etiketleri"]`

   `META` ders sırasını tanımlar, `MODULES` ise IIFE çalışma sırasını. **İkisi
   bağımsızdır**; eşleşme ikinci alandaki `id` üzerinden kurulur (`SEQ` dizisi).
   Yani yeni bir modülü dosyanın sonuna yazıp `META`'da müfredatın ortasına
   koyabilirsin. Numaralar `META` sırasıyla aynı gitmeli (01, 02, …) ve bölümün
   `.eyebrow` içindeki "Modül NN · Grup" metni bu satırla birebir aynı olmalı.
   Grup adı `GROUPS` dizisinde geçmeli, yoksa modül menüde görünmez.
   Etiketler yalnız arama içindir, ekranda görünmez.
4. `TH["m-XXX"]=(c,w,h)=>{...}` ile giriş sayfası kartı için küçük bir önizleme çiz.
   `thumbBase(c,w,h)` zemini hazırlar, `tdot(c,x,y,r,renk)` nokta koyar. Burada da
   renkler token'dan gelir.
5. `tools/behaviour.js`'e o modül için bir blok ekle. **Kural: her `chk()` bir METİN
   cümlesinden türetilir** — `.ask` kutusu ya da bir `steps[].d` ne vaat ediyorsa
   gösterge onu doğrulamalı. Bu araç olmadığı için "%50 der" yazıp %95 gösteren,
   "ıraksar" deyip global minimuma inen beş modül derse kadar fark edilmedi.
   - Eşiği **ölçerek** koy, tahminle değil; rastgele veri üreten modülde tek örneklem
     değil **ortalama** al (`mean`, 12–20 tur), yoksa sınama kırılgan olur.
   - Tek `boot()` üzerinde döngü kur (her tur yeniden `boot()` yavaş), ama
     `aria-pressed` anahtarlarını `P(el,id,true/false)` ile **mutlak konuma** getir —
     `click()` tekrarı anahtarı geri çevirir ve iki koşul birbirine karışır.
   - Kaydırıcıyı bir tarama döngüsünde sürdüysen turun sonunda **eski değere döndür**.
   - Çalıştır düğmeleri de anahtardır: eğitim koşarken tekrar basmak onu DURDURUR.
     `tick(n)` yeterli değilse ölçüm yarı eğitilmiş modelden okunur. Bitişi düğme
     metninden doğrula (`"Eğit"`e döndü mü) ve dönmediyse sürmeye devam et —
     Modül 04'ün iç sayacı 400 tık, `tick(400)` tam sınırda kalıp kırılganlık üretti.

## Doğrulama

Değişiklikten sonra en az şunlar kontrol edilir:

```bash
# JS sözdizimi
sed -n '/^<script>/,/^<\/script>/p' index.html | sed '1d;$d' > /tmp/check.js && node --check /tmp/check.js

# bütünlük denetimi: sorgulanan id'ler var mı, reg() sözleşmesi, META/GROUPS
# tutarlılığı, canvas'ta sabit renk, setInterval↔stop eşleşmesi, önizleme kapsaması
python3 tools/lint.py index.html

# 17 modülü tarayıcısız çalıştır: draw(), bütün adımlar ve senaryolar — null referans,
# istisna, canvas'a giden NaN ve "draw() bu göstergeye hiç dokunmadı" durumu.
# ML_W ile DAR yerleşim dalları da sınanır: 930 tek başına yetmez, çünkü panel
# gizleme eşiklerinin altındaki kod yolu hiç çalıştırılmamış olur.
for w in 930 800 676 560; do ML_W=$w node tools/harness.js index.html || break; done

# 17 modülün pedagojik iddialarını sına — ".ask/adım metni ne vaat ediyor,
# gösterge ne diyor" karşılaştırması (h=1 XOR'u çözemez, L1 katsayıyı sıfırlar,
# lr=0.60 gerçekten ıraksar, uzama=0'da PCA %60 der …). ~1 dk sürer.
node tools/behaviour.js index.html

# tuvale yazılan her etiket rengini açık VE koyu temada zemine karşı ölç
# (label(...) çağrılarını ayıklar; 4.5 altındakileri bildirir)
node tools/contrast.js

# yerel önizleme
python3 -m http.server 8080   # → http://localhost:8080
```

Bu üç araç `tools/` altında. Tek dosya kuralı **uygulamayı** kapsar; geliştirme
araçları ayrı dosyada durur. `harness.js` küçük bir DOM/Canvas taklidi kurup
`index.html`'in script'ini gerçekten çalıştırır — tarayıcı gerekmez.

Ayrıca: açık ve koyu temada okunabilirlik, 1280×720 projeksiyon çözünürlüğünde
taşma olmaması, konsolda hata olmaması.

1280×720'de tuval **930 px** kalır (1280 − 280 rail − 68 kenar boşluğu). Çok
panelli modüllerde yerleşim eşiği bunun altında olmalı; aksi halde panel derste
hiç görünmez (Modül 07'nin ROC eğrisi bir süre böyle kayıptı).

Eşiği 930'un hemen altına koymak da yetmez: tek kademe tarayıcı zoom'u (%110 →
~815 px, Chrome bunu alan adı başına hatırlıyor) paneli yine götürür. Modül 10'un
üç panel eşiği bu yüzden 900'den **780**'e indirildi. Kural iki parçalı:

- Yerleşim eşiği ≤ **780**; dar dalda küçülen metin varsa boyutu eşiğe bağla
  (Modül 10'un matris alt yazısı 930 px'te 10.5, dar hücrede 9.5 — projeksiyon
  çözünürlüğünde yazı KÜÇÜLMEMELİ, yalnız zoom'lu/dar durumda küçülür).
- Bir gösterge yalnız geniş dalda yazılıyorsa dar yerleşimde son geniş çizimin
  değerinde **donar**. Hesabı çizimden ayır, göstergeyi daldan çıkar.
  `harness.js` bunu artık yakalıyor ("draw() hiç yazmadı: …"); yalnız imleçle
  yazılan göstergeler `OLAYA_BAGLI` listesinde muaf tutulur.

## Yapılmayacaklar

- Google Fonts dışında dış kaynak eklenmesi (derslikte internet kesilebilir;
  yazı tipleri için her zaman gerçek bir fallback yığını bulunmalı).
- `requestAnimationFrame` ile ölçüm/test yapmak: sekme arka plandayken rAF durur,
  tarayıcı otomasyonunda ölçüm sonsuza kadar bekler. Test ederken `setTimeout` kullan.
- `localStorage` bağımlılığı — uygulama her açılışta çalışır durumda olmalı.
- Modülleri ayrı dosyalara bölme (tek dosya kuralı bilinçli bir tercihtir;
  değiştirilecekse önce konuşulur).
