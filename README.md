# Makine Öğrenmesi Oyun Alanı

Giriş seviyesi lisans Makine Öğrenmesi dersinde **canlı gösterim** için on yedi
etkileşimli deney. Tek HTML dosyası, bağımlılık yok.

**Yayında:** https://ml.perinet.org · https://ml.urgup.keenetic.link

## Ders sırası

| # | Modül | Konu |
|---|-------|------|
| | **Temeller** | |
| 01 | En iyi doğru | doğrusal regresyon, artıklar, en küçük kareler |
| 02 | Metre ile kilometre | öznitelik ölçekleme, min–maks ve z-skoru |
| | **Denetimli öğrenme** | |
| 03 | Komşuna bak | k-EN yakın komşu, karar sınırı, k'nın etkisi |
| 04 | Yüzde kaç? | lojistik regresyon, sigmoid, log-kayıp |
| 05 | Bölerek karar ver | karar ağacı, Gini kazancı, derinlik ve ezber |
| 06 | Kırk ağaç | torbalama, rastgele orman, OOB doğruluğu |
| | **Genelleme** | |
| 07 | Ezber mi, öğrenme mi | aşırı/yetersiz öğrenme, eğitim–test hata eğrisi |
| 08 | Katsayıya ceza | düzenlileştirme, L1 seyreklik, L2 büzülme |
| | **Optimizasyon** | |
| 09 | Yamaçtan aşağı | gradyan inişi, öğrenme oranı, yerel minimum |
| | **Değerlendirme** | |
| 10 | Eşiği nereye koyalım | konfüzyon matrisi, kesinlik–duyarlılık, ROC/AUC |
| 11 | Şansı ortalamak | k-katlı çapraz doğrulama, katlar arası varyans |
| | **Denetimsiz öğrenme** | |
| 12 | Etiketsiz gruplama | k-ortalamalar, başlangıca duyarlılık |
| 13 | Kaç küme var? | dirsek yöntemi, siluet skoru |
| 14 | İki sayı yerine bir | ana bileşen analizi, boyut indirgeme |
| | **Derin öğrenme** | |
| 15 | Tek nöron | perceptron, doğrusal ayrılabilirlik, XOR sorunu |
| 16 | Gizli katman | çok katmanlı ağ, geri yayılım, XOR'un çözümü |
| 17 | Filtre gezdirmek | konvolüsyon, çekirdek, ReLU, maks havuzlama |

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

**Tuval.** Tıkla → nokta ekle · sürükle → taşı · `Alt`+tık veya sağ tık → sil.

## Yerelde çalıştırma

```bash
python3 -m http.server 8080
# http://localhost:8080
```

Dosya sisteminden (`file://`) açmak da çalışır; sunucu şart değil.

## Sunucuya yükleme

### Bu sunucuda (Docker + Nginx Proxy Manager)
Site `npm-net` ağındaki `ml-web` konteynerinden yayınlanıyor; konteyner `/opt/ml`
dizinini salt-okunur bağlıyor, 80/443'ü Nginx Proxy Manager karşılıyor ve
Let's Encrypt sertifikasını o yönetiyor.

```bash
docker compose -f /opt/ml/deploy/docker-compose.yml up -d
```

Dosya bağlı olduğu için güncelleme `index.html`'i yerine koymaktan ibaret —
konteyneri yeniden başlatmaya gerek yok. `deploy/deploy.sh` bunu rsync ile yapar.

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
