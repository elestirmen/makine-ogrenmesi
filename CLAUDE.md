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
- **Pedagoji zorunlu.** Her modülün üç ayrı metin katmanı var ve hiçbiri boş bırakılmaz:
  `.ask` kutusu (hocanın derste soracağı iki soru), `steps` (rehberli anlatım) ve
  `CONTENT[id].lesson` — « Ders notu » düğmesinin açtığı kutu. Ayrıca her modülde
  **en az iki somut veri kümesi** olur (`CONTENT[id].sets`): soyut "x₁ / x₂" ekseni
  yerine "kanat açıklığı / hız" yazar ve aynı dersi başka bir hikâyeyle tekrar eder.
  `tools/harness.js` bu iki kuralı denetliyor (eksik alan = HATA).

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
tools/layout.js              (isteğe bağlı) gerçek Chromium'da projeksiyon yerleşimi
```

## Ders içeriği: `CONTENT`

Metnin tamamı script bloğunun başındaki tek bir kayıtta durur — modül IIFE'leri
kendi eksen adlarını kurulurken oradan okuduğu için blok **modüllerden önce** gelir
(`const`, TDZ). `META` / `GROUPS` / `TH` dosyanın sonunda kalır.

```js
CONTENT["m-knn"] = {
  pick:"Veri seti",        // seçicinin başlığı: "Veri seti" · "Hata yüzeyi" · "Görüntü" · "Senaryo"
  ui:false,                // (isteğe bağlı) seçici modülün kendi düğmelerinde; araç çubuğuna eklenmesin
  sets:[ {name, note, x, y, cls:[…], gen:"rings"}, … ],
  lesson:{ q, idea:[…], read:[[başlık,metin],…], terms:[[en,tr,açıklama],…], life:[…], trap, next }
};
```

- `sets[]` **eksen adı, sınıf adı ve üreteç adını** taşır; üretecin kendisi (nokta
  bulutu, eğri, görüntü) modülün içindedir — `gen` alanı hangisi olduğunu söyler.
  1D regresyon modülleri (`m-fit`, `m-reg`, `m-cv`) ortak `CURVES` listesini paylaşır:
  aynı veri üç modülde, üç ayrı ders. `note` alanı ders notu kutusunda görünür,
  bu yüzden **ölçülmüş** olmalı — "en iyi derece çoğunlukla 5" gibi bir cümle
  `tools/behaviour.js`'te sınanır.
- `lesson` kutusu: `q` bir soru, `idea` fikir, `read` ekranı okuma rehberi,
  `terms` İngilizce/Türkçe terim tablosu, `life` gerçek kullanım, `trap` sık yapılan
  hata, `next` sonraki durak. Kutu `mountTools()`'un eklediği « Ders notu » düğmesi
  ya da klavyede `?` ile açılır; `Esc` kapatır (modal açıkken Esc modülü değil kutuyu
  kapatır), perdeye tıklamak da kapatır.
- **Modül 17 (`m-cn`) hiperparametreleri kontrolden yönetir:** girdi boyu (64/128/256),
  çekirdek boyu (3×3/5×5), padding (0/1/2) ve stride (1/2/3) segment düğmelerinde,
  sonuç `⌊(girdi+2·dolgu−çekirdek)/adım⌋+1` formülüyle göstergede. Konvolüsyon
  etikete göre önbellekli (`CACHE`): imlecin her hareketinde yeniden hesaplanırsa
  256² girdi + 5×5 çekirdekte 1.6 M çarpma her karede tekrarlanır. Pencere
  **kalıcı** — fare tuvalden çıkınca aritmetik ekranda kalır, yoksa hoca anlatmaya
  başladığı anda ekran boşalıyor. Kendi görüntüsü dosya / sürükle-bırak / yapıştır
  ile geliyor ve griye çevrilip anında işleniyor (renkli görüntüde çekirdek
  3×3×3 = 27 ağırlık olur; bu not ders notunda yazıyor).
- Veri kümesi seçici, `.stage` kartının **içinde**, tuvalin üstündeki `.tools`
  şeridine girer (alt `.bar`'ın simetriği: aynı zemin, aynı hairline) ve
  uygulamanın kendi "birini seç" bileşenini — birleşik `.seg` — kullanır.
  Denenip bırakılanlar: `.bar`'a üçüncü satır (göstergeleri perdeden düşürüyor),
  kartın dışında serbest satır (`.head` ile `.stage` arası **0 px**; şerit oraya
  sıkışıp kartın üstüne 4 px biniyordu), üç ayrı `.btn` (aralarındaki 6 px beş eşit
  kutu görüntüsü veriyor, hiyerarşi kayboluyor).

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
   | `steps` | önerilir | rehberli anlatım: `[{t,d,set?,run()}]` — `d` içinde `<b>` kullanılabilir |
   | `scenarios` | ✓ (veri kümesi) | `CONTENT[id].sets`'ten üretilir: `DS.map((d,i)=>({name:d.name,apply(){useSet(i);}}))` |
   | `scenarioLabel` | `scenarios` varsa | seçicinin başlığı, `CONTENT[id].pick` |
   | `undo` | tuval düzenlenebilirse | `editable()`'ın döndürdüğü `undo` |

   `steps[].run()` modülün içine elle dokunmaz; kontrolleri kullanıcı gibi sürer:
   `setR("#id",değer)`, `press("#id")`, `setPressed("#id",true)`. Böylece adımlar
   mevcut olay işleyicilerini kullanır, mantık iki yerde tekrarlanmaz.
   Adım veri kümesi de değiştirebilir: `run()` içinde `useSet()` **çağırmak yerine**
   `set:2` alanı yazılır — kabuk senaryo düğmesine basar (`mod.__pick`), böylece
   düğmenin basılı hâli ekranda görünenle tutarlı kalır.

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
4. `CONTENT`'e bir kayıt ekle: en az iki `sets` girdisi (her birinde `name` + `note`)
   ve tam bir `lesson` (`q`, `idea`, `read` ≥ 2 satır, `terms` ≥ 2 terim, `life`, `trap`).
   Modülün içinde `const DS=SETS("m-XXX"); let dsi=0; const S=()=>DS[dsi];` kurup
   eksen ve sınıf adlarını `S().x` / `S().cls[0]` üzerinden çiz — tuvale sabit dizgi
   yazma. `useSet(i)` hem veriyi üretir hem gösterge adlarını (`txt("#id",…)`) yeniler.
5. `TH["m-XXX"]=(c,w,h)=>{...}` ile giriş sayfası kartı için küçük bir önizleme çiz.
   `thumbBase(c,w,h)` zemini hazırlar, `tdot(c,x,y,r,renk)` nokta koyar. Burada da
   renkler token'dan gelir.
6. `tools/behaviour.js`'e o modül için bir blok ekle. **Kural: her `chk()` bir METİN
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
# Ayrıca CONTENT kapsaması: eksik ders notu, tek veri kümesi, kutuda kalan "undefined".
# ML_W ile DAR yerleşim dalları da sınanır: 930 tek başına yetmez, çünkü panel
# gizleme eşiklerinin altındaki kod yolu hiç çalıştırılmamış olur.
for w in 930 800 676 560; do ML_W=$w node tools/harness.js index.html || break; done

# 17 modülün pedagojik iddialarını sına — ".ask / adım / ders notu metni ne vaat ediyor,
# gösterge ne diyor" karşılaştırması (h=1 XOR'u çözemez, L1 katsayıyı sıfırlar,
# lr=0.60 gerçekten ıraksar, uzama=0'da PCA %60 der …). ~1 dk sürer.
node tools/behaviour.js index.html   # 86 denetim: 17 modül + alternatif veri kümeleri

# tuvale yazılan her etiket rengini açık VE koyu temada zemine karşı ölç
# (label(...) çağrılarını ayıklar; 4.5 altındakileri bildirir)
node tools/contrast.js

# yerel önizleme
python3 -m http.server 8080   # → http://localhost:8080
```

Bu üç araç `tools/` altında. Tek dosya kuralı **uygulamayı** kapsar; geliştirme
araçları ayrı dosyada durur. `harness.js` küçük bir DOM/Canvas taklidi kurup
`index.html`'in script'ini gerçekten çalıştırır — tarayıcı gerekmez.

```bash
# projeksiyon yerleşimi: gösterge DEĞERLERİ perdenin içinde mi (gerçek Chromium)
node tools/layout.js index.html [--shots]
```

Bu kapı isteğe bağlı ve **tarayıcı yoksa sessizce atlanır**. Makinede bir kez
kurulur, sonra ortam değişkeni istemez (sudo da gerekmez):

```bash
npm install -g puppeteer     # modül npm prefix'ine, tarayıcı ~/.cache/puppeteer'a (~650 MB)
```

Araç puppeteer'ı sırayla arar: yerel `node_modules` / `NODE_PATH` → `npm root -g`
→ `puppeteer-core` + sistemdeki chromium. Tarayıcı açılmazsa yığın iziyle çökmez,
kapıyı atlar. Tek dosya kuralı bozulmuyor: bağımlılık depoda değil makinede.

Bu kapı olmadan görünmeyen iki kusur şöyle bulundu: (1) `.stats` satırı 1280×720'de
**her modülde** perdenin altında kalıyordu (+22 … +256 px), yani hoca gösterge
değerlerini görmek için kaydırıyordu; (2) `show()` bölüme programatik odak veriyor
ve Chrome `:focus-visible`'ı üstünde tuttuğu için 930 px genişliğinde accent bir
dikdörtgen sürekli ekranda duruyordu (tıklamayla da kaybolmuyordu). İkisi de
`harness.js`'in sahte DOM'unda görünmez — yerleşim hesaplanmıyor.

**Dikey bütçe.** Yükseklik iki kırılımla sıkışır (`index.html` içinde ölçüm notlarıyla):
`≤820px` başlık/boşluk/çubuk/gösterge kutuları ve tuval (58vh → 50vh) kısılır,
kontrol çubuğundaki tek satırlık `.hint` gizlenir; `≤660px` (tam ekran değilse
pencere ~600 px kalıyor) başlık paragrafı da gizlenir — aynı metnin daha iyisi ders
notu kutusunda ve düğmesi tam altında. Bu yüzden `.head` paragrafları **kısa**
tutulur; uzun anlatım `CONTENT[id].lesson`'a yazılır.

Ayrıca: açık ve koyu temada okunabilirlik, konsolda hata olmaması.

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
- HTML kısmına `<script>` dizgisini **yorum içinde bile** yazmak: `tools/lint.py` ve
  `tools/harness.js` dosyayı ilk `<script>` geçtiği yerden ikiye bölüyor; yorumda kalan
  bir tanesi bütün id denetimini ve tarayıcısız koşumu sessizce bozar.
