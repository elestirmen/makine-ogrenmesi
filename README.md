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
| 17 | Filtre gezdirmek | convolution, kernel, ReLU, max pooling |

**Terimler.** Cümleler Türkçe, adlandırılmış yöntem ve metrik adları İngilizce
(`bagging`, `overfitting`, `precision`, `epoch`, `kernel` …); her terim modül başına
bir kez `İngilizce (Türkçe)` biçiminde açılır. Arama kutusu iki dili de tanır —
"bagging" da "torbalama" da Modül 06'yı getirir. Ayrıntı: `CLAUDE.md`.

Modüller birbirine bağlanır: 15 perceptron'un XOR'da çaresiz kaldığını gösterir,
16 onu çözer. 07 aşırı öğrenmeyi gösterir, 08 çözer. 05 tek ağacın ezberlediğini
gösterir, 06 ormanla düzeltir. 12 k'yı sorar, 13 doğru k'yı nasıl bulacağını anlatır.

## Derste kullanım

**Adım adım modu.** Her modülün kontrol çubuğunda *Adım adım* düğmesi var: hoca ileri
bastıkça tuval sırayla kurulur ve altta o adımın ne gösterdiği yazar. Kaydırıcılar
serbest kalır, istediğiniz an araya girebilirsiniz.

**Senaryolar.** Bazı modüllerde hazır kurulumlar var — Modül 10'da *Kanser taraması*
ile *Spam filtresi* aynı eşik kaydırıcısını taban tabana zıt yönde kullanmayı gösterir.

**Klavye**

| tuş | ne yapar |
|-----|----------|
| `←` `→` | modüller arası geçiş |
| `Boşluk` | modülün ana eylemi (animasyonu başlat/durdur) |
| `Esc` | tüm modüller sayfasına dön |
| `↑` `↓` | adım adım modda önceki/sonraki adım |
| `Ctrl`+`Z` | tuvale eklenen noktayı geri al |
| `/` | arama kutusuna atla |
| `T` | açık / koyu tema |

**Tuval.** Tıkla → nokta ekle · sürükle → taşı · `Alt`+tık veya sağ tık → sil.
Dokunmatikte nokta parmağı kaldırınca eklenir (8 px'den az hareket ettiyse), böylece
tuvalin üstünden kaydırarak sayfayı gezmek veri kümesini bozmaz.

**Adres çubuğu.** Her modülün kendi adresi var: `ml.perinet.org/#m-kch` ya da
`#13`. Yenileme, tarayıcı Geri tuşu ve "öğrenciye link atma" bu sayede çalışır.

**Tema.** Sağ üstteki düğme (ya da `T`) açık/koyu arasında geçirir; varsayılan
işletim sistemi ayarıdır. Seçim oturum boyunca geçerlidir (`localStorage` yok).

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
