# Proje: Makine Öğrenmesi Oyun Alanı

Kapadokya Üniversitesi, Bilişim Sistemleri ve Teknolojileri bölümünde verilen
**giriş seviyesi lisans Makine Öğrenmesi dersi** için tarayıcıda çalışan canlı
gösterim uygulaması. Derste projeksiyona yansıtılıp kaydırıcılarla oynatılır.

## Temel kurallar

- **Tek dosya, sıfır bağımlılık.** `index.html` içinde HTML + CSS + JS. Build adımı yok,
  npm yok, framework yok. Amaç: dosyayı sunucuya kopyala, çalışsın.
- **Vanilla JS + Canvas 2D.** Grafik kütüphanesi eklenmez; her modül kendi çizimini yapar.
- **Arayüz dili Türkçe.** Değişken/fonksiyon adları İngilizce olabilir, kullanıcıya
  görünen her metin Türkçedir. Terimler: eşik, kesinlik, duyarlılık, aşırı öğrenme,
  yanlılık–varyans, öznitelik haritası, çekirdek.
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
tools/behaviour.js           pedagojik iddiaların sayısal sınaması
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

## Doğrulama

Değişiklikten sonra en az şunlar kontrol edilir:

```bash
# JS sözdizimi
sed -n '/^<script>/,/^<\/script>/p' index.html | sed '1d;$d' > /tmp/check.js && node --check /tmp/check.js

# bütünlük denetimi: sorgulanan id'ler var mı, reg() sözleşmesi, META/GROUPS
# tutarlılığı, canvas'ta sabit renk, setInterval↔stop eşleşmesi, önizleme kapsaması
python3 tools/lint.py index.html

# 17 modülü tarayıcısız çalıştır: draw(), bütün adımlar ve senaryolar —
# null referans, istisna ve canvas'a giden NaN yakalar
node tools/harness.js index.html

# ajanların/yeni modüllerin pedagojik iddialarını sına (h=1 XOR'u çözemez,
# L1 katsayıyı sıfırlar, orman tek ağacı geçer …)
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

## Yapılmayacaklar

- Google Fonts dışında dış kaynak eklenmesi (derslikte internet kesilebilir;
  yazı tipleri için her zaman gerçek bir fallback yığını bulunmalı).
- `requestAnimationFrame` ile ölçüm/test yapmak: sekme arka plandayken rAF durur,
  tarayıcı otomasyonunda ölçüm sonsuza kadar bekler. Test ederken `setTimeout` kullan.
- `localStorage` bağımlılığı — uygulama her açılışta çalışır durumda olmalı.
- Modülleri ayrı dosyalara bölme (tek dosya kuralı bilinçli bir tercihtir;
  değiştirilecekse önce konuşulur).
