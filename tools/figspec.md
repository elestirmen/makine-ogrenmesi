# Ders notu figürü — teknik kurallar (HER figür için geçerli)

> Bu dosya `FIGS[id]` figürlerini çizen Codex'e (`codex exec`, gpt-6-luna) verilen şartname.
> Kullanım: bir klasöre bu dosyayı, `figcheck.js`'i ve `briefs/<id>.md` (figürün içeriği:
> hangi paneller, hangi sayılar) koy; Codex'ten `<id>.svg`'yi yazmasını ve
> `node figcheck.js <id>.svg` TEMİZ diyene kadar düzeltmesini iste. Sonra gerçek render'a
> bak (`node figcheck.js <id>.svg --png` → `out/<id>.light.png` / `.dark.png`) ve
> düzeltmeleri PNG'yi `codex exec -i` ile ekleyerek iste. SVG `index.html`'de `FIGS`
> kaydına tek satır olarak girer; lint / contrast / layout onu uygulamanın içinde yeniden denetler.

Bağlam: Kapadokya Üniversitesi'nde giriş seviyesi lisans Makine Öğrenmesi dersi için
tarayıcıda çalışan tek dosyalık bir uygulama. Her modülde « Ders notu » düğmesi bir
kutu açıyor (içerik genişliği ~630 px). Bu kutuya bir **ders kitabı figürü** giriyor:
kavramın mekanizmasını tek bakışta gösteren, sakin, düz, statik bir şema. Okur ön bilgisi
olmayan bir birinci/ikinci sınıf öğrencisi. Figür derste projeksiyonda da gösterilebilir.

## Çıktı biçimi
- Tek bir `<svg>` öğesi; başında/sonunda başka hiçbir şey yok (XML bildirimi, DOCTYPE, yorum yok).
- `<svg viewBox="0 0 640 H" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="…">`
  — genişlik 640 sabit, yükseklik H 220 ile 340 arası. `width`/`height` özniteliği YAZMA.
- `aria-label`: figürün ne gösterdiğini anlatan tek Türkçe cümle.
- Dosyayı UTF-8 olarak kaydet. Türkçe karakterleri (ç ğ ı İ ö ş ü) doğrudan yaz, entity kullanma.

## Renk — EN ÖNEMLİ KURAL
Uygulamanın açık ve koyu teması var; renkler CSS değişkenlerinden gelir. SVG sayfaya
satır içi gömüleceği için `var(--token)` çalışır. **Yalnız şu token'lar kullanılır:**

| token | anlamı |
|---|---|
| `var(--ink)` | ana metin, ana çizgi |
| `var(--ink-soft)` | ikincil metin, eksen, ok |
| `var(--line)` | ince ayırıcı çizgi, kutu kenarı |
| `var(--grid)` | çok soluk ızgara |
| `var(--surface)` | kutu zemini (figürün zemini zaten bu; arka plan dikdörtgeni ÇİZME) |
| `var(--surface-2)` | hafif ayrık panel zemini |
| `var(--a)` | 1. sınıf / 1. seri (camgöbeği) |
| `var(--b)` | 2. sınıf / 2. seri (turuncu) |
| `var(--c)` | 3. seri (mor) |
| `var(--d)` | 4. seri (yeşil) |
| `var(--accent)` | vurgu (pembe): "işte burası" — figür başına en fazla 1–2 öğe |
| `var(--good)` `var(--warn)` `var(--bad)` | doğru / dikkat / yanlış |

- `fill="var(--a)"` biçiminde öznitelik olarak yaz. Saydamlık gerekirse `fill-opacity` /
  `stroke-opacity` kullan (0.12–0.35 arası dolgu için iyi).
- **Yasak:** `#hex`, `rgb()`, `hsl()`, renk adları (`black`, `white`, `red`…), `currentColor`.
  Tek istisna `none`.
- Metin rengi (`<text fill=…>`) YALNIZ `var(--ink)`, `var(--ink-soft)`, `var(--a)`,
  `var(--c)`, `var(--accent)` ya da `var(--bad)` olabilir (bunlar iki temada, iki zeminde
  de WCAG 4.5'in üstünde). `var(--b)`, `var(--d)`, `var(--good)`, `var(--warn)` metin
  rengi olarak KULLANILMAZ (açık temada kontrast düşük); bu renkleri yalnız
  şekil/nokta/çizgi için kullan. Turuncu sınıfın etiketini `var(--ink)` yaz, yanına
  turuncu bir nokta koy.
- Metin her zaman bir `<text>` öğesinde, `fill` özniteliği metnin kendisinde ya da
  kapsayan `<g>`'de olsun.

## Yazı
- `font-family` yazma (sayfanın yazı tipini miras alsın). Formül/sayı için
  `font-family="IBM Plex Mono, ui-monospace, monospace"` kullanabilirsin.
- En küçük yazı `font-size="13"`; olağan etiket 14–15; başlık gerekiyorsa 15–16 ve
  `font-weight="700"`. 12 ve altı YASAK (projeksiyonda okunmuyor).
- Metin kısa: etiket 1–5 sözcük. Figürün içine paragraf yazma; açıklamayı figür altı
  yazısı (caption) yapacak, onu sen yazmıyorsun.
- Dil kuralı: cümle Türkçe, yöntem/metrik adları İngilizce (k-NN, decision boundary,
  residual, learning rate, Gini, margin, support vector…). Motamot çeviri yok.
- Metinler birbirinin ve şekillerin üstüne BİNMESİN; kenardan taşmasın (x 8…632 içinde).
  `text-anchor` ile hizala, uzun etiketi iki `<text>` satırına böl.

## Yapı
- **Yasak:** `<script>`, `<style>`, `<foreignObject>`, `<image>`, `<use>`, dış bağlantı,
  `id` özniteliği, `class` özniteliği, `href`, `url(#…)`, `<marker>`, filtre, gradyan.
  (Figürler aynı sayfada yan yana yaşıyor; id çakışır, tema bozulur.)
- Ok başlarını küçük bir `<path>`/`<polygon>` üçgenle kendin çiz.
- Çizgi kalınlığı 1.5–2.5; nokta yarıçapı 5–7. Düz ve sakin: gölge, 3B efekt, dekor yok.
- Veri noktaları gerçekçi dağılsın ama figür elle hesaplanabilir kadar basit kalsın.
  Figürdeki sayılar (uzaklık, oy, hata…) birbiriyle TUTARLI olmalı; bir öğrenci cetvelle
  ölçse aynı hikâyeyi görmeli.
- Genellikle 2 panel yan yana (örn. "k = 1" | "k = 7", "önce" | "sonra") güçlü bir
  anlatım; panel başlığı üstte, 14–15 px, `var(--ink)`.
- Toplam boyut 7 KB'ı geçmesin. Koordinatları tamsayı ya da tek ondalık yaz.

## Teslim
İstenen dosyayı istenen yola yaz. Başka dosya oluşturma, başka dosyaya dokunma.
Bitince `node figcheck.js <dosya>` çalıştır (bu klasörde); HATA veriyorsa düzelt ve tekrar çalıştır.

## Yerleşim dersleri (ilk figürden)
- Alanı KULLAN: öğeler birbirine sıkışmasın. Nokta bulutları panelin en az yarısını kaplasın;
  birbirine bağlanan iki öğe arasındaki çizgi en az 25 px olsun (yoksa görünmüyor).
- viewBox yüksekliği içeriğe otursun: en alttaki öğenin altında 16 px'ten fazla boşluk kalmasın,
  en üstteki öğenin üstünde de. Gerekirse H'yi küçült.
- Kum havuzunda Chromium açılmıyor; figcheck.js o zaman metin kutularını karakter sayısından
  KESTİRİR. Bu yeterli. PNG'ye bakmaya, başka görüntüleyici aramaya, ImageMagick ile render
  etmeye UĞRAŞMA (var(--token) renklerini tanımıyor). Görsel incelemeyi ben gerçek tarayıcıda yapacağım.
