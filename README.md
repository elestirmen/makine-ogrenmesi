# Makine Öğrenmesi Oyun Alanı

Giriş seviyesi lisans Makine Öğrenmesi dersinde **canlı gösterim** için yirmi üç
etkileşimli deney. Tek HTML dosyası, bağımlılık yok.

**Yayında:** https://ml.perinet.org · https://ml.urgup.keenetic.link

## Ders sırası

Modül sırası dersin haftalık programını izler: soldaki numara menüde görünen numaradır,
sağdaki sütun o modülün hangi haftaya denk geldiğini söyler.

| # | Modül | Konu | Hafta |
|---|-------|------|-------|
| | **Temeller** | | |
| 01 | Ortalama mı, medyan mı | mean/median, IQR, boxplot, outlier | 2 |
| 02 | Metre ile kilometre | öznitelik ölçekleme, min–max ve z-score | 2 |
| 03 | En iyi doğru | linear regression, artıklar, least squares | 5 |
| | **Denetimli öğrenme** | | |
| 04 | İki öznitelik, bir düzlem | multiple linear regression, katsayının anlamı, confounding, multicollinearity | 5 |
| 05 | Eğri de doğrusal olabilir | polynomial regression, tasarım matrisi, öznitelik türetme, extrapolation | 5 |
| 06 | Yüzde kaç? | logistic regression, sigmoid, log loss | 6 |
| 07 | Komşuna bak | k-NN, decision boundary, k'nın etkisi | 9 |
| 08 | Bölerek karar ver | decision tree, Gini kazancı, derinlik ve ezber | 10 |
| 09 | Kırk ağaç | bagging, random forest, OOB doğruluğu | 11 |
| 10 | En geniş koridor | SVM, margin, support vector, kernel, C ve gamma | 12 |
| | **Genelleme** | | |
| 11 | Ezber mi, öğrenme mi | overfitting / underfitting, eğitim–test hata eğrisi | 3 |
| 12 | Yanlılık mı, varyans mı | bias–variance ayrışması, indirgenemez hata | 4 |
| 13 | Katsayıya ceza | regularization, L1 (lasso) sparsity, L2 (ridge) shrinkage | 8 |
| | **Optimizasyon** | | |
| 14 | Yamaçtan aşağı | gradient descent, learning rate, yerel minimum | 5 |
| | **Değerlendirme** | | |
| 15 | Eşiği nereye koyalım | confusion matrix, precision–recall, ROC/AUC | 8 |
| 16 | Şansı ortalamak | k-fold cross-validation, katlar arası varyans | 4 |
| | **Denetimsiz öğrenme** | | |
| 17 | Etiketsiz gruplama | k-means, başlangıca duyarlılık | 14 |
| 18 | Kaç küme var? | elbow yöntemi, silhouette skoru | 14 |
| 19 | Küme yuvarlak olmak zorunda mı | DBSCAN, eps/minPts, hiyerarşik (Ward) | 14 |
| 20 | İki sayı yerine bir | PCA, boyut indirgeme | 13 |
| | **Derin öğrenme** | | |
| 21 | Tek nöron | perceptron, linear separability, XOR sorunu | — |
| 22 | Gizli katman | MLP, backpropagation, XOR'un çözümü | — |
| 23 | Filtre gezdirmek | convolution, kernel size, padding, stride, ReLU, pooling | — |

Son üç modül haftalık programın dışında; dönem sonunda derin öğrenmeye giriş olarak
kullanılabilir. 1. ve 7. haftaların (giriş kavramları ve uçtan uca uygulama)
etkileşimli karşılığı yok: ikisi de ekranda gösterilecek bir mekanizma değil,
sınıfta yürütülecek bir tartışma ve bir kod oturumu.

**Terimler.** Cümleler Türkçe, adlandırılmış yöntem ve metrik adları İngilizce
(`bagging`, `overfitting`, `precision`, `epoch`, `kernel` …); her terim modül başına
bir kez `İngilizce (Türkçe)` biçiminde açılır. Arama kutusu iki dili de tanır —
"bagging" da "torbalama" da Modül 09'u getirir. Ayrıntı: `CLAUDE.md`.

Modüller birbirine bağlanır: 03 bir doğru uydurur, 04 ikinci özniteliği ekleyip doğruyu
düzleme çevirir, 05 ikinci sütunu birincinin karesi yapıp eğri çizer; 11 aynı sütunları
14. dereceye kadar çoğaltınca ne olduğunu gösterir. 21 perceptron'un XOR'da çaresiz kaldığını
gösterir, 22 onu çözer. 11 aşırı öğrenmeyi gösterir, 13 çözer. 08 tek ağacın ezberlediğini
gösterir, 09 ormanla düzeltir. 17 k'yı sorar, 18 doğru k'yı nasıl bulacağını anlatır; 19 ise k'nın hiç sorulmadığı yolu gösterir.

## Derste kullanım

**Ders notu.** Her modülün başlığının altında *Ders notu* düğmesi var (klavyede `?`).
Açılan kutu tek ekranda şunları verir: modülün cevapladığı soru ve iki üç cümlelik
**kısa cevabı**, fikrin günlük dille anlatımı, **ekranda ne var** rehberi (hangi panel neyi gösteriyor), veri kümelerinin
tek satırlık özetleri, İngilizce–Türkçe terim tablosu, gerçek hayattaki kullanımı ve
o konuda **sık yapılan hata**. Öğrenci kaydırıcıyı çevirip hiçbir şey anlamadan
geçmesin diye var; kutunun altındaki *Adım adım anlat* düğmesi doğrudan rehberli
anlatımı başlatır.

**Adım adım modu.** *Ders notu*'nun hemen yanındaki *Adım adım* düğmesi: hoca ileri
bastıkça tuval sırayla kurulur ve tuvalin **üstündeki** şeritte o adımın ne gösterdiği
yazar (tuval şerit kadar kısalır, gösterge satırı perdede kalır). Adımın sözünü ettiği
gösterge ya da kontrol birkaç saniye **vurgulanır** ("eğitim hatasına bakın" dendiğinde
göz doğrudan o kutuya gider); sonucu bir animasyon olan adımlar (iniş, eğitim, çapraz
doğrulama) o animasyonu kendisi başlatır. Kaydırıcılar serbest kalır, istediğiniz an
araya girebilirsiniz.

**Ekranda görünen mekanizmalar.** Her modülde soyut kavramın kendisi çizilir:

| modül | tuvalde |
|---|---|
| 01 ortalama/medyan | noktalar üst üste yığılır; ortalama tahterevallinin **denge noktası** (▲), medyan ortadaki noktanın halkası |
| 03 en iyi doğru | « Kareler »: her artık gerçek bir kare, **SSE = kırmızı alanın toplamı** |
| 04 çoklu regresyon | 3B nokta bulutu ve **düzlem**; yandan bakınca üç paralel çizgi (katsayı = "öteki sabitken" eğim) ve kesikli tek değişkenli doğru; yanında iki katsayının **SSE kasesi** |
| 05 polinom | eğri **terimlerine ayrılır** (w₀ seviye, w₁·x eğim, w₂·x² kavis …); sağda **tasarım matrisi**: 1, x, x², x³ sütunları, seçili satırda sütun × ağırlık = ŷ; gri kenarlarda veri dışı tahmin ile gerçek |
| 08 karar ağacı | « Ağacı çiz »: sağ panel **kurallar ağacına** döner (soru kutuları, evet/hayır dalları, yaprak sayıları) |
| 09 orman | « Bir ağacın torbası »: k'ıncı ağacın bootstrap örneklemi (tekrar çekilenler halkalı, OOB içi boş) ve kendi merdiven sınırı |
| 10 SVM | RBF'de de marj görünür: karar sınırı f = 0 ve marj eğrileri f = ±1 |
| 12 yanlılık–varyans | ders kitabının şekli: yanlılık² iner, varyans çıkar, toplam **U** çizer |
| 14 gradyan inişi | tuvalin üstünde bir sonraki adımın hesabı: `w ← w − lr · eğim`, sayılarıyla |
| 15 eşik | histogramda eşiğin yanlış tarafı taralı: **FN ve FP alanları**, dört sayı matrisle aynı |
| 17 k-means | her merkezin **etki alanı** (bölge = atama kuralı); merkezler yeni yerine kayar |
| 19 DBSCAN | **çekirdek** (dolu) / sınır (halka) / gürültü (gri), eps komşulukları, fareyle komşu sayısı |
| 20 PCA | fareyle bir **deneme ekseni** çevrilir; o yöndeki yayılım yazar, en büyüğü 1. bileşen |
| 21 perceptron | her düzeltmede önceki çizgi kesikli kalır; köşede kuralın kendisi: `w ← w + lr · y · x` |
| 22 MLP | canlı **ağ diyagramı**: çizgi kalınlığı ağırlık, renk işaret; fareyle ileri yayılım izlenir |

**Sunum modu.** Şeridin sağındaki *Sunum* düğmesi (klavyede `F`) sol menüyü gizler;
1280 px'lik perdede tuval 930'dan 1210 px'e çıkar. Aynı düğme (*Menü*) ya da `Esc`
geri getirir.

**İleri / geri.** Her modülün en altında *Önceki · Sonraki* kartları var: ders
sırasında fareyle ilerlemek için menüye dönmek gerekmez. Telefonda menü katlıdır
(☰ ile açılır); modüller arası geçiş bu kartlarla yapılır.

**Veri setleri.** Her modülde aynı dersi başka bir hikâyeyle tekrar eden 2–3 somut veri
var; tuvalin üstündeki şeritten seçilir ve eksen adları, sınıf adları, göstergeler
onunla birlikte değişir. Soyut "x₁ / x₂" yerine gerçek bir ölçüm:

| modül | veri setleri |
|---|---|
| 01 ortalama/medyan | maaş (sağa çarpık) · sınav notu (simetrik) · ev fiyatı |
| 04 çoklu regresyon | ev: alan + yaş (bağımsız, katsayı değişmez) · araç: yaş + km (birlikte büyür, katsayının yarısı km'ye geçer) · ev: yaş + merkeze uzaklık (**işaret döner**) |
| 05 polinom | gün içi sıcaklık (x² tepeyi yakalar) · fren mesafesi (fizik x² der, dışarıda da tutar) · fidan boyu (S eğrisi, x³ gerekir; 24. haftada fidan "küçülür") |
| 07 k-NN | uçak / kuş (kanat açıklığı–hız) · baz istasyonu kapsaması (halka sınır) · kredi riski (iç içe sınıflar) |
| 08 karar ağacı | bağ hastalığı · sahte işlem (tek eşik yetmez) · kalite kontrol (şerit) |
| 10 SVM | kalite kontrol (ayrılabilir) · kredi riski (örtüşen) · baz istasyonu (halka → RBF) |
| 11 · 12 · 13 · 16 | gün içi sıcaklık · reklam → satış (doygunluk) · titreşim ölçümü — *aynı veri dört modülde* |
| 14 gradient descent | iki vadi · tek vadi (convex) · dik kanyon (0.06 iyi, 0.20 patlar) |
| 15 eşik | İHA tespiti · kanser taraması (recall öne geçer) · spam filtresi (precision öne geçer) |
| 17 k-means | müşteri segmenti · artçı sarsıntılar (uzun kümeler) · uydu pikselleri |
| 19 DBSCAN | iki hilal · iç içe halka · öbek + gürültü |
| 20 PCA | boy–kilo · matematik–fizik notu · uydu bantları (bitki örtüsü ekseni) |
| 21 · 22 | kalite kontrol (ayrılabilir) · ilaç etkileşimi (XOR) · baz istasyonu (halka) |
| 23 convolution | hava fotoğrafı · tarla parselleri · test deseni · **kendi görüntün** (dosya, sürükle-bırak ya da Ctrl+V) |

Kalan modüllerde de en az iki set var (03 ev fiyatı / araç yaşı → negatif eğim,
02 boy–maaş / otel puanı–yorum / araç yaşı–kilometre, 06 tümör / sınav / balon turu,
09 kredi onayı / pivot sulama, 18 üç ayrı "kaç küme var" hikâyesi).

**Modül 23 · convolution.** Dört hiperparametre de kontrolde: girdi boyu (64/128/256),
çekirdek boyu (3×3/5×5), padding (0/1/2), stride (1/2/3) — çıktı boyutu
`⌊(girdi+2·dolgu−çekirdek)/adım⌋+1` formülüyle göstergede yazıyor. Tuvalde girdi,
`çekirdek ⊙ pencere = çarpımlar → Σ` tablosu ve öznitelik haritası yan yana; pencere
kalıcı, fareyi bıraktığınızda hesap ekranda kalır. *Pencereyi gezdir* çekirdeği baştan
sona yürütüp haritayı adım adım doldurur; *Filtre bankası* aynı görüntüye dört ayrı
çekirdek uygulayıp "bir katmanda 32–256 filtre var" fikrini gösterir. Kendi resminizi
yükleyebilirsiniz (griye çevrilip anında işlenir).

**Klavye**

| tuş | ne yapar |
|-----|----------|
| `←` `→` | modüller arası geçiş |
| `Boşluk` | modülün ana eylemi (animasyonu başlat/durdur) |
| `Esc` | tüm modüller sayfasına dön |
| `↑` `↓` | adım adım modda önceki/sonraki adım |
| `Ctrl`+`Z` | tuvale eklenen noktayı geri al |
| `?` | ders notu kutusu (açık kutuda `Esc` kapatır) |
| `/` | arama kutusuna atla |
| `T` | açık / koyu tema |
| `F` | sunum modu: menüyü gizle / göster |

**Tuval.** Tıkla → nokta ekle · sürükle → taşı · `Alt`+tık veya sağ tık → sil.
Dokunmatikte nokta parmağı kaldırınca eklenir (8 px'den az hareket ettiyse), böylece
tuvalin üstünden kaydırarak sayfayı gezmek veri kümesini bozmaz.

**Adres çubuğu.** Her modülün kendi adresi var: `ml.perinet.org/#m-kch` ya da
`#18`. Yenileme, tarayıcı Geri tuşu ve "öğrenciye link atma" bu sayede çalışır.

**Tema.** Sağ üstteki düğme (ya da `T`) açık/koyu arasında geçirir; varsayılan
işletim sistemi ayarıdır. Seçim oturum boyunca geçerlidir (`localStorage` yok).

**Projeksiyon.** 1280×720'de gösterge değerleri kaydırmadan görünür: pencere
kısaldıkça başlık, boşluklar ve tuval kademeli olarak sıkışır (`≤820px` ve `≤660px`).
Tam ekran (`F11`) en rahatı. Ölçüm: `node tools/layout.js` — gerçek Chromium'da
her modülü açıp gösterge değerlerinin perdeye sığıp sığmadığını denetler.
Tarayıcı yoksa sessizce atlanır; kalıcı kurulum tek satır: `npm install -g puppeteer`.

## Yerelde çalıştırma

```bash
python3 -m http.server 8080
# http://localhost:8080
```

Dosya sisteminden (`file://`) açmak da çalışır; sunucu şart değil. İnternet yoksa
yazı tipleri yerel yığına düşer, uygulama beklemeden açılır.

## Sunucuya yükleme

### Bu sunucuda (Docker + Nginx Proxy Manager)
Site `npm-net` ağındaki `ml-web` konteynerinden yayınlanıyor; konteyner `/opt/ml`
dizinini salt-okunur bağlıyor, 80/443'ü Nginx Proxy Manager karşılıyor ve
Let's Encrypt sertifikasını o yönetiyor.

```bash
docker compose -f /opt/ml/deploy/docker-compose.yml up -d
```

Dosya bağlı olduğu için güncelleme `index.html`'i yerine koymaktan ibaret —
konteyneri yeniden başlatmaya gerek yok. `deploy/deploy.sh` bunu rsync ile yapar: önce dört doğrulama kapısını (sözdizimi,
`lint.py`, üç genişlikte `harness.js`, `contrast.js`, `layout.js` ve `behaviour.js`) çalıştırır,
sonra yükler. Değişen dosyaların eski hâli `/opt/ml/.prev/` altına taşınır —
ders başlamadan geri dönmek gerekirse oradan alınır. Aceleyse `SKIP_SLOW=1`
davranış denetimini atlar.

### Başka bir sunucuda
`index.html` dosyasını web köküne kopyalamak yeterli:

```bash
scp index.html kullanici@sunucu:/var/www/ml/index.html
```

### Alternatifler
Statik olduğu için GitHub Pages, Netlify, Cloudflare Pages veya üniversite web
alanı — hepsi ek yapılandırma olmadan çalışır.

## Lisans / atıf

Ahmet Ertuğrul Arık — Kapadokya Üniversitesi, Bilişim Sistemleri ve Teknolojileri.
KÜN Geospatial AI & UAV Lab.
