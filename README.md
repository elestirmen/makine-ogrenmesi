# Makine Öğrenmesi Oyun Alanı

Giriş seviyesi lisans Makine Öğrenmesi dersinde **canlı gösterim** için on yedi
etkileşimli deney. Tek HTML dosyası, bağımlılık yok.

**Yayında:** https://ml.perinet.org · https://ml.urgup.keenetic.link

## Ders sırası

| # | Modül | Konu |
|---|-------|------|
| | **Temeller** | |
| 01 | En iyi doğru | linear regression, artıklar, least squares |
| 02 | Metre ile kilometre | öznitelik ölçekleme, min–max ve z-score |
| | **Denetimli öğrenme** | |
| 03 | Komşuna bak | k-NN, decision boundary, k'nın etkisi |
| 04 | Yüzde kaç? | logistic regression, sigmoid, log loss |
| 05 | Bölerek karar ver | decision tree, Gini kazancı, derinlik ve ezber |
| 06 | Kırk ağaç | bagging, random forest, OOB doğruluğu |
| | **Genelleme** | |
| 07 | Ezber mi, öğrenme mi | overfitting / underfitting, eğitim–test hata eğrisi |
| 08 | Katsayıya ceza | regularization, L1 (lasso) sparsity, L2 (ridge) shrinkage |
| | **Optimizasyon** | |
| 09 | Yamaçtan aşağı | gradient descent, learning rate, yerel minimum |
| | **Değerlendirme** | |
| 10 | Eşiği nereye koyalım | confusion matrix, precision–recall, ROC/AUC |
| 11 | Şansı ortalamak | k-fold cross-validation, katlar arası varyans |
| | **Denetimsiz öğrenme** | |
| 12 | Etiketsiz gruplama | k-means, başlangıca duyarlılık |
| 13 | Kaç küme var? | elbow yöntemi, silhouette skoru |
| 14 | İki sayı yerine bir | PCA, boyut indirgeme |
| | **Derin öğrenme** | |
| 15 | Tek nöron | perceptron, linear separability, XOR sorunu |
| 16 | Gizli katman | MLP, backpropagation, XOR'un çözümü |
| 17 | Filtre gezdirmek | convolution, kernel size, padding, stride, ReLU, pooling |

**Terimler.** Cümleler Türkçe, adlandırılmış yöntem ve metrik adları İngilizce
(`bagging`, `overfitting`, `precision`, `epoch`, `kernel` …); her terim modül başına
bir kez `İngilizce (Türkçe)` biçiminde açılır. Arama kutusu iki dili de tanır —
"bagging" da "torbalama" da Modül 06'yı getirir. Ayrıntı: `CLAUDE.md`.

Modüller birbirine bağlanır: 15 perceptron'un XOR'da çaresiz kaldığını gösterir,
16 onu çözer. 07 aşırı öğrenmeyi gösterir, 08 çözer. 05 tek ağacın ezberlediğini
gösterir, 06 ormanla düzeltir. 12 k'yı sorar, 13 doğru k'yı nasıl bulacağını anlatır.

## Derste kullanım

**Ders notu.** Her modülün başlığının altında *Ders notu* düğmesi var (klavyede `?`).
Açılan kutu tek ekranda şunları verir: modülün cevapladığı soru, fikrin iki paragraflık
anlatımı, **ekranda ne var** rehberi (hangi panel neyi gösteriyor), veri kümelerinin
tek satırlık özetleri, İngilizce–Türkçe terim tablosu, gerçek hayattaki kullanımı ve
o konuda **sık yapılan hata**. Öğrenci kaydırıcıyı çevirip hiçbir şey anlamadan
geçmesin diye var; kutunun altındaki *Adım adım anlat* düğmesi doğrudan rehberli
anlatımı başlatır.

**Adım adım modu.** *Ders notu*'nun hemen yanındaki *Adım adım* düğmesi: hoca ileri
bastıkça tuval sırayla kurulur ve tuvalin **üstündeki** şeritte o adımın ne gösterdiği
yazar (tuval şerit kadar kısalır, gösterge satırı perdede kalır). Kaydırıcılar serbest
kalır, istediğiniz an araya girebilirsiniz.

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
| 03 k-NN | uçak / kuş (kanat açıklığı–hız) · baz istasyonu kapsaması (halka sınır) · kredi riski (iç içe sınıflar) |
| 05 karar ağacı | bağ hastalığı · sahte işlem (tek eşik yetmez) · kalite kontrol (şerit) |
| 07 · 08 · 11 | gün içi sıcaklık · reklam → satış (doygunluk) · titreşim ölçümü — *aynı veri üç modülde* |
| 09 gradient descent | iki vadi · tek vadi (convex) · dik kanyon (0.06 iyi, 0.20 patlar) |
| 10 eşik | İHA tespiti · kanser taraması (recall öne geçer) · spam filtresi (precision öne geçer) |
| 12 k-means | müşteri segmenti · artçı sarsıntılar (uzun kümeler) · uydu pikselleri |
| 14 PCA | boy–kilo · matematik–fizik notu · uydu bantları (bitki örtüsü ekseni) |
| 15 · 16 | kalite kontrol (ayrılabilir) · ilaç etkileşimi (XOR) · baz istasyonu (halka) |
| 17 convolution | hava fotoğrafı · tarla parselleri · test deseni · **kendi görüntün** (dosya, sürükle-bırak ya da Ctrl+V) |

Kalan modüllerde de en az iki set var (01 ev fiyatı / araç yaşı → negatif eğim,
02 boy–maaş / otel puanı–yorum / araç yaşı–kilometre, 04 tümör / sınav / balon turu,
06 kredi onayı / pivot sulama, 13 üç ayrı "kaç küme var" hikâyesi).

**Modül 17 · convolution.** Dört hiperparametre de kontrolde: girdi boyu (64/128/256),
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
`#13`. Yenileme, tarayıcı Geri tuşu ve "öğrenciye link atma" bu sayede çalışır.

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
`lint.py`, üç genişlikte `harness.js`, `contrast.js` ve `behaviour.js`) çalıştırır,
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
