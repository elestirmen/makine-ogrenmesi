/* 17 modülün PEDAGOJİK İDDİALARINI sına: çökme değil, ".ask kutusu ve rehberli
   adım metni ne vaat ediyor, gösterge ne diyor" karşılaştırması.
   Kural: her chk() bir METİN cümlesinden türetilir. Metin değişirse sınama da değişir.
   Eşikler ölçülerek konmuştur; rastgele veri üreten modüllerde ORTALAMA alınır
   (tek örneklem gürültüsü yanlış alarm veriyordu). */
const {boot}=require('./harness.js');
const F=process.argv[2];
let fail=0;
const chk=(ok,msg,extra)=>{ console.log(`  ${ok?'OK   ':'HATA '} ${msg}${extra?'  ['+extra+']':''}`); if(!ok)fail++; };
/* Üstel gösterimi de oku: m-fit'in test RMSE'si 1e4'ü geçince gösterge "1.2e7"
   yazıyor ve eski desen yalnız mantisi ("1.2") alıyordu — 14. derecenin ağır kuyruğu
   ölçümde 1'lerin arasında kayboluyor, "daha çok veri → hata düşüyor" denetimi
   rastgele düşüyordu. */
const num=(s)=>{const m=/(-?[\d.]+(?:e[-+]?\d+)?)/i.exec(String(s));return m?parseFloat(m[1]):NaN;};
/* kısayollar: kaydırıcı sür, gösterge oku, N örneklemin ortalaması */
const S=(el,id,v)=>{const e=el(id);e.value=String(v);e.dispatchEvent({type:'input'});};
const T=(el,id)=>el(id).textContent;
const V=(el,id)=>num(T(el,id));
const mean=(a)=>a.reduce((x,y)=>x+y,0)/a.length;
/* 14. derecenin test RMSE'si ağır kuyruklu (40 turda medyan 7.4, en büyük 9917):
   ORTALAMA tek bir uç örneklemle savruluyor ve denetim üç koşudan birinde
   düşüyordu. Böyle yerlerde medyan kullanılıyor. */
const med=(a)=>{const x=[...a].sort((p,q)=>p-q);return x.length%2?x[(x.length-1)/2]:(x[x.length/2-1]+x[x.length/2])/2;};
const head=(t)=>console.log(`\n=== ${t} ===`);
/* aria-pressed ANAHTARLARINI mutlak konuma getir — tekrar tekrar click() etmek
   düğmeyi her turda geri çeviriyor ve iki koşul birbirine karışıyor */
const P=(el,id,on)=>{const e=el(id); if((e.getAttribute('aria-pressed')==='true')!==on) e.click();};

/* ── 16 · Çok katmanlı ağ: h=1 XOR'u çözemez, h≥2 çözer ── */
{
  console.log("=== Modül 16 · Gizli katman (XOR) ===");
  const r=[];
  for(const h of [1,4]){
    const {el,tick}=boot(F);
    el('mlp-xor').click();
    const hs=el('mlp-h'); hs.value=String(h); hs.dispatchEvent({type:'input'});
    el('mlp-reset').click();
    el('mlp-run').click();      // setInterval kuyruğa girer
    tick(4000);                 // eğitimi sürükle
    r.push({h, acc:num(el('mlp-acc').textContent), loss:num(el('mlp-loss').textContent),
            ep:num(el('mlp-ep').textContent), st:el('mlp-st').textContent});
  }
  r.forEach(x=>console.log(`       h=${x.h}: devir=${x.ep} doğruluk=${x.acc}% log-kayıp=${x.loss} durum="${x.st}"`));
  chk(r[0].acc<90, "h=1 XOR'u çözemiyor (doğruluk < %90)", `h=1 → %${r[0].acc}`);
  chk(r[1].acc>=95, "h=4 XOR'u çözüyor (doğruluk ≥ %95)", `h=4 → %${r[1].acc}`);
  chk(r[1].acc>r[0].acc+15, "gizli nöron eklemek belirgin fark yaratıyor");
}

/* ── 06 · Rastgele orman: çok ağaç tek ağacı geçer ── */
{
  console.log("\n=== Modül 06 · Kırk ağaç (torbalama / OOB) ===");
  const {el,tick}=boot(F);
  /* TEK veri kümesiyle ölçmek kırılgandı: özgün sürümde de 40 kümenin ~1'inde
     fark 1.5 puanın altına düşüyordu (ort 5.0, min 0.8). Ortalama alınıyor. */
  const N=10, k1=[], k40=[], one40=[], tr40=[];
  for(let t=0;t<N;t++){
    el('ens-new').click();
    const ks=el('ens-k');
    ks.value='1';  ks.dispatchEvent({type:'input'}); tick(200);
    k1.push(num(el('ens-oob').textContent));
    ks.value='40'; ks.dispatchEvent({type:'input'}); tick(200);
    k40.push(num(el('ens-oob').textContent));
    one40.push(num(el('ens-one').textContent));
    tr40.push(num(el('ens-tr').textContent));
  }
  const out=[{k:1, oob:mean(k1)}, {k:40, oob:mean(k40), one:mean(one40), tr:mean(tr40)}];
  console.log(`       ${N} veri kümesi ortalaması`);
  console.log(`       1 ağaç : OOB=%${out[0].oob.toFixed(1)}`);
  console.log(`       40 ağaç: eğitim=%${out[1].tr.toFixed(1)} OOB=%${out[1].oob.toFixed(1)} tek ağaç OOB=%${out[1].one.toFixed(1)}`);
  chk(Number.isFinite(out[1].oob), "40 ağaçta OOB doğruluğu hesaplanıyor");
  /* k=1'in OOB'si tek bir ağacın torba dışı örneklerinden gelir, yüksek varyanslı:
     40 ağaçla doğrudan karşılaştırmak %8 oranında yanlış alarm veriyordu. Modülün
     kendi "Tek ağaç (OOB)" göstergesi (ağaçlar üzerinden ortalama) kararlı referans. */
  chk(out[1].oob>out[1].one, "orman OOB'si tek ağaç OOB'sini geçiyor", `orman %${out[1].oob.toFixed(1)} vs tek %${out[1].one.toFixed(1)}`);
  chk(out[1].oob-out[1].one>1.5, "fark anlamlı (>1.5 puan)", `+${(out[1].oob-out[1].one).toFixed(1)} puan`);
}

/* ── 08 · Düzenlileştirme: L1 katsayıları sıfırlar, L2 sıfırlamaz ── */
{
  console.log("\n=== Modül 08 · Katsayıya ceza (L1 / L2) ===");
  const {el,tick}=boot(F);
  const ds=el('reg-d'); ds.value='12'; ds.dispatchEvent({type:'input'});
  const read=()=>({nz:num(el('reg-nz').textContent), tr:num(el('reg-tr').textContent),
                   te:num(el('reg-te').textContent), raw:el('reg-nz').textContent});
  const set=(lam)=>{const s=el('reg-lam'); s.value=String(lam); s.dispatchEvent({type:'input'});};
  el('reg-l2').click(); set(0);  const l2lo=read();
  set(100);                       const l2hi=read();
  el('reg-l1').click(); set(0);  const l1lo=read();
  set(100);                       const l1hi=read();
  console.log(`       L2  λ düşük: sıfır olmayan=${l2lo.raw} eğitim=${l2lo.tr}   λ yüksek: ${l2hi.raw} eğitim=${l2hi.tr}`);
  console.log(`       L1  λ düşük: sıfır olmayan=${l1lo.raw} eğitim=${l1lo.tr}   λ yüksek: ${l1hi.raw} eğitim=${l1hi.tr}`);
  chk(l1hi.nz<l1lo.nz, "L1 yüksek λ'da katsayıları sıfıra düşürüyor (seyreklik)", `${l1lo.nz} → ${l1hi.nz}`);
  chk(l2hi.nz>=l1hi.nz, "L2 aynı λ'da L1 kadar seyreklik üretmiyor", `L2=${l2hi.nz}, L1=${l1hi.nz}`);
  chk(l2hi.tr>=l2lo.tr-1e-9, "λ büyüyünce eğitim hatası artıyor (ceza çalışıyor)", `${l2lo.tr} → ${l2hi.tr}`);
}

/* ── 11 · Çapraz doğrulama: katlar ve ortalama tutarlı ── */
{
  console.log("\n=== Modül 11 · Şansı ortalamak (k-katlı) ===");
  const {el,tick}=boot(F);
  const run=(k)=>{
    const s=el('cv-k'); s.value=String(k); s.dispatchEvent({type:'input'});
    el('cv-run').click(); tick(600);
    return {k, mean:num(el('cv-vm').textContent), std:num(el('cv-vs').textContent),
            range:num(el('cv-vr').textContent), vk:el('cv-vk').textContent};
  };
  const a=run(2), b=run(10);
  console.log(`       k=2 : ortalama=${a.mean} std=${a.std} aralık=${a.range} (${a.vk})`);
  console.log(`       k=10: ortalama=${b.mean} std=${b.std} aralık=${b.range} (${b.vk})`);
  chk(Number.isFinite(a.mean)&&Number.isFinite(b.mean), "her iki k için ortalama hata hesaplanıyor");
  chk(Number.isFinite(a.std)&&Number.isFinite(b.std), "katlar arası standart sapma hesaplanıyor");
  chk(a.mean>0&&b.mean>0, "hata değerleri pozitif ve anlamlı");
  chk(Math.abs(a.mean-b.mean)/Math.max(a.mean,b.mean)<0.6, "iki k benzer ortalamaya yakınsıyor",
      `k=2 → ${a.mean}, k=10 → ${b.mean}`);
}

/* ── 01 · Doğrusal regresyon: kapalı formül gerçekten en iyisini buluyor ── */
{
  head("Modül 01 · En iyi doğru (least squares)");
  const {el}=boot(F); const r=[];
  for(let t=0;t<20;t++){
    el('lin-new').click();
    S(el,'lin-a',-100); S(el,'lin-b',120);            // bilerek kötü doğru
    const bad=V(el,'lin-sse');
    el('lin-fit').click();                             // "Least squares çözümü"
    r.push({bad, got:V(el,'lin-sse'), best:V(el,'lin-best'), st:T(el,'lin-st')});
  }
  const worse=r.filter(x=>x.got>x.best+1e-3).length;
  const notBest=r.filter(x=>!/En iyi/.test(x.st)).length;
  console.log(`       kötü doğru SSE ort ${mean(r.map(x=>x.bad)).toFixed(3)} → çözümden sonra ${mean(r.map(x=>x.got)).toFixed(3)} (en iyi ${mean(r.map(x=>x.best)).toFixed(3)})`);
  chk(worse===0, "kapalı formül en küçük SSE'yi buluyor (adım: 'tek bir dip nokta')", `${worse}/20 sapma`);
  chk(notBest===0, "durum göstergesi 'En iyi' diyor", `${notBest}/20 değil`);
  chk(mean(r.map(x=>x.bad))>mean(r.map(x=>x.got))*3, "elle konan kötü doğru belirgin daha kötü");
}

/* ── 02 · Ölçekleme: ".ask: aralığı 400'e çekin, maaş uzaklığın %99'unu belirliyor" ── */
{
  head("Modül 02 · Metre ile kilometre (ölçekleme)");
  const {el}=boot(F);
  const read=(r)=>{S(el,'sc-r',r);return {r, boy:V(el,'sc-d1'), maas:V(el,'sc-d2')};};
  const a=read(1), b=read(400);
  console.log(`       aralık=1  : boy %${a.boy} · maaş %${a.maas}`);
  console.log(`       aralık=400: boy %${b.boy} · maaş %${b.maas}`);
  chk(b.maas>=95, "aralık 400'de maaş uzaklığın neredeyse tamamını belirliyor", `%${b.maas}`);
  chk(b.boy<=5, "boy özniteliği hesaba fiilen girmiyor", `%${b.boy}`);
  chk(a.boy>b.boy+50, "küçük aralıkta tablo tersine dönüyor (ölçek sorunu, veri sorunu değil)",
      `%${a.boy} → %${b.boy}`);
}

/* ── 03 · kNN: ".ask: k=1'de eğitim hatası tam olarak sıfır" ── */
{
  head("Modül 03 · Komşuna bak (k-NN)");
  const {el}=boot(F); const e1=[], e21=[];
  for(let t=0;t<20;t++){ el('knn-demo').click();
    S(el,'knn-k',1);  e1.push(V(el,'knn-e'));
    S(el,'knn-k',21); e21.push(V(el,'knn-e')); }
  console.log(`       k=1 : eğitim hatası ort %${mean(e1).toFixed(1)} (max %${Math.max(...e1)})`);
  console.log(`       k=21: eğitim hatası ort %${mean(e21).toFixed(1)} (max %${Math.max(...e21)})`);
  chk(e1.every(x=>x===0), "k=1'de eğitim hatası TAM olarak sıfır", `max %${Math.max(...e1)}`);
  chk(mean(e21)>1.5, "k=21'de artık sıfır değil (.ask: '%0'dan %4–5'e çıkıyor')", `ort %${mean(e21).toFixed(1)}`);
  chk(mean(e21)<15, "ama modeli körleştirmiyor — metin 'çoğunluk sınıfı' DEMEMELİ", `ort %${mean(e21).toFixed(1)}`);
}

/* ── 04 · Lojistik: ayrılabilir veride log loss sıfıra yaklaşır, karışıkta yaklaşamaz ── */
{
  head("Modül 04 · Yüzde kaç? (logistic regression)");
  const {el,tick}=boot(F); const E=[], H=[], EA=[], HA=[];
  /* DİKKAT: lg-fit bir ANAHTAR (koşarken tekrar basmak durdurur) ve iç sayacı
     400 tık. Eğitim bitmeden bir sonraki tura girilirse o tıklama eğitimi
     durduruyor, ölçüm yarı eğitilmiş modelden okunuyordu. Bitene kadar sür. */
  let yarim=0;
  const egit=()=>{ el('lg-fit').click(); tick(600);
    if(T(el,'lg-fit')!=='Eğit'){ tick(600); if(T(el,'lg-fit')!=='Eğit') yarim++; } };
  for(let t=0;t<10;t++){
    P(el,'lg-hard',false); el('lg-new').click(); egit();
    E.push(V(el,'lg-loss')); EA.push(V(el,'lg-acc'));
    P(el,'lg-hard',true);                        // anahtar demo()'yu kendisi çağırıyor
    egit();
    H.push(V(el,'lg-loss')); HA.push(V(el,'lg-acc'));
  }
  chk(yarim===0, "her eğitim sonuna kadar koştu (yarım ölçüm yok)", `${yarim} yarım`);
  console.log(`       kolay veri  : log loss ort ${mean(E).toFixed(3)} · doğruluk ort %${mean(EA).toFixed(1)}`);
  console.log(`       karışık veri: log loss ort ${mean(H).toFixed(3)} · doğruluk ort %${mean(HA).toFixed(1)}`);
  chk(Math.min(...E)>0, "log loss sıfıra yaklaşır ama HİÇ ulaşmaz (.ask'in sorusu)", `min ${Math.min(...E).toFixed(3)}`);
  /* 6 koşuda ölçülen: kolay 0.207–0.333, karışık 0.611–0.837, oran 2.40–3.39,
     doğruluk farkı 20.4–27.8 puan. Eşikler ölçülen en düşüğün altına konuldu. */
  chk(mean(H)>mean(E)*1.8, "karışık veride hiçbir w kaybı sıfırlayamıyor", `${mean(E).toFixed(3)} → ${mean(H).toFixed(3)}`);
  chk(mean(HA)<mean(EA)-10, "karışık veride doğruluk da düşüyor", `%${mean(EA).toFixed(1)} → %${mean(HA).toFixed(1)}`);
}

/* ── 05 · Karar ağacı: düğme kaydırıcının ulaşabildiği en iyi bölmeyi buluyor ── */
{
  head("Modül 05 · Bölerek karar ver (decision tree)");
  const {el}=boot(F);
  let lost=0; const leaves=[], accs=[], d1=[];
  for(let t=0;t<8;t++){
    el('dt-demo').click(); el('dt-best').click();
    const g=V(el,'dt-g1');
    let gmin=Infinity;
    for(let i=2;i<=98;i++){ S(el,'dt-t',i); const x=V(el,'dt-g1'); if(x<gmin) gmin=x; }
    if(gmin<g-1e-9) lost++;
    el('dt-best').click();                              // tarama eşiği bozdu, geri koy
    S(el,'dt-d',1); d1.push(V(el,'dt-acc'));
    S(el,'dt-d',5); leaves.push(V(el,'dt-leaf')); accs.push(V(el,'dt-acc'));
  }
  console.log(`       derinlik 1: doğruluk ort %${mean(d1).toFixed(1)}`);
  console.log(`       derinlik 5: yaprak ort ${mean(leaves).toFixed(1)} [${Math.min(...leaves)}–${Math.max(...leaves)}] · doğruluk ort %${mean(accs).toFixed(1)}`);
  chk(lost===0, "'En iyi bölmeyi bul' kaydırıcı ızgarasında yenilmiyor", `${lost}/8 yenildi`);
  chk(mean(accs)>96, "derinlik 5 ezberliyor (.ask: '%99'a çıkarıyor')", `%${mean(accs).toFixed(1)}`);
  chk(mean(leaves)>=3 && mean(leaves)<=6, "yaprak sayısı metindeki dört-beş civarında", `ort ${mean(leaves).toFixed(1)}`);
  chk(mean(accs)>mean(d1), "derinlik artınca eğitim doğruluğu yükseliyor", `%${mean(d1).toFixed(1)} → %${mean(accs).toFixed(1)}`);
}

/* ── 07 · Aşırı öğrenme: Durum göstergesi en iyi derecede uyarı VERMEMELİ ── */
{
  head("Modül 07 · Ezber mi, öğrenme mi (overfitting)");
  const {el}=boot(F);
  let bad4=0, ok14=0; const t14=[], t40=[];
  for(let t=0;t<20;t++){
    S(el,'fit-m',14); el('fit-new').click();     // önceki turun 40'ı sızmasın
    S(el,'fit-d',4);  if(/Aşırı/.test(T(el,'fit-vs'))) bad4++;
    S(el,'fit-d',14); if(/Aşırı/.test(T(el,'fit-vs'))) ok14++;
    S(el,'fit-m',14); t14.push(V(el,'fit-vte'));
    S(el,'fit-m',40); t40.push(V(el,'fit-vte'));
  }
  console.log(`       derece 4'te "Aşırı öğrenme": ${bad4}/20 · derece 14'te: ${ok14}/20`);
  console.log(`       derece 14 test hatası: veri 14 → medyan ${med(t14).toFixed(2)} · veri 40 → medyan ${med(t40).toFixed(3)}`);
  /* 100 örneklemde en iyi derece %3 turda 1 çıkıyor (14 gürültülü noktaya bazen düz
     doğru en iyi uyuyor) ve rozet o turda "Aşırı öğrenme" diyor. Eşik 2 iken on
     koşudan biri bu kuyruktan düşüyordu; kopma hâlinde sayı 15+/20 olur. */
  chk(bad4<=4, "en iyiye yakın derecede yanlış uyarı yok (adım 2: 'dengede')", `${bad4}/20`);
  chk(ok14>=18, "14. derecede uyarı korunuyor (adım 3: 'model gürültüyü ezberledi')", `${ok14}/20`);
  chk(med(t40)<med(t14)/3, "adım 4: aynı derece, daha çok veri → test hatası düşüyor",
      `medyan ${med(t14).toFixed(2)} → ${med(t40).toFixed(3)}`);
  /* B1: 15 katsayı / 14 nokta ile interpolasyon MÜMKÜN. Normal denklemler bunu
     kaçırıyordu (eğitim RMSE ~0.044, noktalardan ~19 px ıska); QR ile sıfıra iniyor.
     ".ask ve adım 3: bütün eğitim noktalarından geçiyor" cümlesinin karşılığı budur. */
  const trQ=[];
  for(let t=0;t<10;t++){ S(el,'fit-m',14); el('fit-new').click(); S(el,'fit-d',14);
    trQ.push(V(el,'fit-vtr')); }
  console.log(`       derece 14 eğitim RMSE ort ${mean(trQ).toExponential(2)} (max ${Math.max(...trQ).toExponential(2)})`);
  chk(Math.max(...trQ)<0.005, "14. derece eğri bütün eğitim noktalarından geçiyor (QR)",
      `max ${Math.max(...trQ).toExponential(2)}`);
}

/* ── 09 · Gradyan inişi: kaydırıcının ULAŞABİLDİĞİ bir değerde ıraksamalı ── */
{
  head("Modül 09 · Yamaçtan aşağı (gradient descent)");
  const run=(lr,x0)=>{const {el,tick}=boot(F);S(el,'gd-lr',lr);S(el,'gd-x0',x0);
    el('gd-run').click();tick(400);
    return {st:T(el,'gd-s'), i:V(el,'gd-i'), x:V(el,'gd-x'), L:V(el,'gd-l')};};
  const big=run(600,-230), okr=run(60,-230), tiny=run(5,-230);
  console.log(`       lr=0.600: durum="${big.st}" adım=${big.i}`);
  console.log(`       lr=0.060: durum="${okr.st}" konum=${okr.x} adım=${okr.i}`);
  console.log(`       lr=0.005: durum="${tiny.st}" konum=${tiny.x} adım=${tiny.i}`);
  chk(/raksad/.test(big.st), "adım 3: kaydırıcının içindeki bir lr GERÇEKTEN ıraksıyor", big.st);
  chk(!/raksad/.test(okr.st), "makul lr'de ıraksamıyor", okr.st);
  chk(tiny.i>okr.i*5, "adım 2: küçük adım aynı yere ÇOK daha fazla adımda varıyor ('adım sayacına bakın')",
      `${tiny.i} adım vs ${okr.i} adım`);
  chk(/[Yy]erel/.test(okr.st), "adım 4: soldan başlayınca yerel minimuma takılıyor", okr.st);
}

/* ── 10 · Eşik: precision ↑ recall ↓, AUC eşikten bağımsız ── */
{
  head("Modül 10 · Eşiği nereye koyalım (precision / recall)");
  const {el}=boot(F);
  const rows=[20,50,80].map(t=>{S(el,'cm-t',t);
    return {t, pre:V(el,'cm-pre'), rec:V(el,'cm-rec'), auc:V(el,'cm-auc'), acc:V(el,'cm-acc')};});
  rows.forEach(r=>console.log(`       eşik=${(r.t/100).toFixed(2)}: precision %${r.pre} · recall %${r.rec} · AUC ${r.auc}`));
  chk(rows[0].pre<rows[1].pre && rows[1].pre<rows[2].pre, "eşik sağa gidince precision yükseliyor");
  chk(rows[0].rec>rows[1].rec && rows[1].rec>rows[2].rec, "aynı anda recall düşüyor (.ask: ikisi birden yükselmiyor)");
  chk(Math.abs(rows[0].auc-rows[2].auc)<1e-9, "AUC eşikten bağımsız — eşik modelin değil bizim kararımız",
      `${rows[0].auc} / ${rows[2].auc}`);
  S(el,'cm-pr',3); S(el,'cm-t',95);
  const trap={acc:V(el,'cm-acc'), rec:V(el,'cm-rec')};
  console.log(`       pozitif oranı %3 + eşik 0.95: doğruluk %${trap.acc} · recall %${trap.rec}`);
  chk(trap.acc>90 && trap.rec<25, "dengesiz sınıf tuzağı: doğruluk yüksek ama model hiçbir şeyi bulmuyor",
      `doğruluk %${trap.acc}, recall %${trap.rec}`);
}

/* ── 12 · k-ortalamalar: WCSS atama öncesi yalan söylememeli, sonra hep azalmalı ── */
{
  head("Modül 12 · Etiketsiz gruplama (k-means)");
  const {el}=boot(F);
  chk(T(el,'km-j')==="—", "atama yapılmadan WCSS '—' (0.0000 'mümkün en iyi' yalanıydı)", T(el,'km-j'));
  const seq=[];
  for(let i=0;i<12;i++){ el('km-step').click(); const j=V(el,'km-j'); if(Number.isFinite(j)) seq.push(j); }
  console.log(`       WCSS dizisi: ${seq.map(x=>x.toFixed(3)).join(' → ')}`);
  const rise=seq.filter((v,i)=>i&&v>seq[i-1]+1e-9).length;
  chk(seq.length>2, "adımlar WCSS üretiyor");
  chk(rise===0, "algoritmanın küçülttüğü nicelik hiçbir adımda artmıyor", `${rise} artış`);
  el('km-seed').click();
  chk(T(el,'km-j')==="—", "merkezler yeniden atılınca gösterge tekrar '—'", T(el,'km-j'));
}

/* ── 13 · Kaç küme: ayrık veride her iki ölçüt de gerçek k'yı bulmalı ── */
{
  head("Modül 13 · Kaç küme var? (elbow / silhouette)");
  const {el}=boot(F); const r=[];
  S(el,'kch-true',4); S(el,'kch-sep',100);
  for(let t=0;t<12;t++){ el('kch-new').click();
    r.push({elb:V(el,'kch-elb'), sil:V(el,'kch-sug'), s:V(el,'kch-sil')}); }
  const silOk=r.filter(x=>x.sil===4).length, elbOk=r.filter(x=>x.elb===4).length;
  console.log(`       gerçek k=4, ayrıklık 100: silhouette ${silOk}/12 doğru · elbow ${elbOk}/12 doğru`);
  chk(silOk>=11, "silhouette ayrık veride gerçek küme sayısını buluyor (.ask)", `${silOk}/12`);
  chk(elbOk>=10, "elbow da aynı sayıyı söylüyor (adım 1: 'iki ölçüt de aynı sayıyı')", `${elbOk}/12`);
  chk(mean(r.map(x=>x.s))>0.45, "ayrık veride silhouette skoru yüksek", mean(r.map(x=>x.s)).toFixed(3));
  /* B2: dirsek log(WCSS) üzerinde hesaplanıyor. Ham WCSS'te gerçek küme 5 ya da 6
     iken ayrıklık %100'de bile 0/15 doğru çıkıyordu — ".ask: iki ölçüt de gerçek
     küme sayısını buluyor" cümlesi kaydırıcının yarısında yalandı. */
  S(el,'kch-sep',100);
  const perK=[];
  for(const tk of [2,3,4,5,6]){
    S(el,'kch-true',tk);
    let hit=0;
    for(let t=0;t<8;t++){ el('kch-new').click(); if(V(el,'kch-elb')===tk) hit++; }
    perK.push(`k=${tk}:${hit}/8`);
    chk(hit>=7, `ayrık veride elbow gerçek k=${tk}'yı buluyor`, `${hit}/8`);
  }
  console.log(`       ayrıklık 100'de elbow isabeti: ${perK.join(' · ')}`);
}

/* ── 14 · PCA: uzama kaydırıcısı yuvarlak ↔ uzun karşıtlığını KURMALI ── */
{
  head("Modül 14 · İki sayı yerine bir (PCA)");
  const {el}=boot(F);
  /* pca-cor her input'ta yeniden örnekliyor: aynı değeri 12 kez sürüp ortalıyoruz */
  const at=(c)=>{const v=[];for(let i=0;i<12;i++){S(el,'pca-cor',c);v.push(V(el,'pca-v1'));}return mean(v);};
  const p0=at(0), p50=at(50), p90=at(90);
  console.log(`       uzama=0 → 1. bileşen %${p0.toFixed(1)} · uzama=50 → %${p50.toFixed(1)} · uzama=90 → %${p90.toFixed(1)}`);
  chk(p0<70, "uzama=0'da bulut yuvarlak: iki bileşen kabaca yarı yarıya (.ask '%60 civarı')", `%${p0.toFixed(1)}`);
  chk(p90>85, "uzama=90'da 1. bileşen varyansın %85'inden fazlasını açıklıyor (adım 1)", `%${p90.toFixed(1)}`);
  chk(p0<p50 && p50<p90, "kaydırıcı monoton: yuvarlaktan uzuna tek yönde gidiyor",
      `%${p0.toFixed(1)} → %${p50.toFixed(1)} → %${p90.toFixed(1)}`);
}

/* ── 15 · Perceptron: ayrılabilirde durur, XOR'da durmaz ── */
{
  head("Modül 15 · Tek nöron (perceptron)");
  const go=(btn)=>{const {el,tick}=boot(F); el(btn).click(); el('per-run').click(); tick(900);
    return {m:V(el,'per-m'), u:V(el,'per-u'), raw:T(el,'per-m')};};
  const sep=go('per-sep'), xor=go('per-xor');
  console.log(`       ayrılabilir: yanlış=${sep.raw} güncelleme=${sep.u}`);
  console.log(`       XOR        : yanlış=${xor.raw} güncelleme=${xor.u}`);
  chk(sep.m===0, "ayrılabilir veride yanlış sınıflanan sıfıra düşüyor (yakınsama teoremi)", sep.raw);
  chk(xor.m>0, "XOR'da hiç duramıyor — tek katman düz çizgiden başkasını çizemez", xor.raw);
  chk(xor.u>sep.u*10, "XOR'da güncellemeler bitmiyor", `${sep.u} vs ${xor.u}`);
}

/* ── 17 · Konvolüsyon: dört hiperparametre ve BOYUT FORMÜLÜ ──
   Modülün ekranda yazdığı formül: çıktı = ⌊(girdi + 2·dolgu − çekirdek)/adım⌋ + 1.
   .ask kutusu bunun üç somut sonucunu vaat ediyor (5×5 → 124, dolgu 2 → 128,
   stride 2 → yarısı) — üçü de burada sınanıyor, ayrıca 54 kombinasyonun
   tamamında gösterge formülle karşılaştırılıyor. */
{
  head("Modül 17 · Filtre gezdirmek (convolution)");
  const {el,M}=boot(F);
  const cn=M.find(m=>m.id==='m-cn');
  const setK=(k)=>el(k===3?'cn-k3':'cn-k5').click();
  const setP=(p)=>el('cn-p'+p).click();
  const setS=(v)=>el('cn-s'+v).click();
  const setI=(v)=>el('cn-i'+v).click();
  const dim=(t)=>num(String(t).split('×')[0]);
  const size=()=>dim(T(el,'cn-size'));
  const F2=(S,p,k,st)=>Math.floor((S+2*p-k)/st)+1;

  /* göstergeler formülle birebir örtüşüyor mu (girdi × çekirdek × dolgu × adım) */
  P(el,'cn-pool',false); P(el,'cn-relu',false);
  let mismatch=[];
  for(const S of [64,128,256]){ setI(S);
    for(const k of [3,5]){ setK(k);
      for(const p of [0,1,2]){ setP(p);
        for(const st of [1,2,3]){ setS(st);
          const want=F2(S,p,k,st), got=size();
          if(got!==want) mismatch.push(`${S}/k${k}/p${p}/s${st}: ${got}≠${want}`);
        }}}}
  console.log(`       54 kombinasyon denendi · uyuşmayan: ${mismatch.length}`);
  chk(mismatch.length===0, "çıktı boyutu ⌊(girdi+2·dolgu−çekirdek)/adım⌋+1 formülüne uyuyor",
      mismatch.slice(0,3).join(" · "));

  /* .ask: "5×5 yapın → 124, padding 2 → 128, stride 2 → yarısı" */
  setI(128); setP(0); setS(1); setK(3);
  const s3=size();
  setK(5); const s5=size();
  setP(2);  const s5p=size();
  setK(3); setP(1); setS(2); const half=size();
  console.log(`       128 girdi: 3×3/p0 → ${s3} · 5×5/p0 → ${s5} · 5×5/p2 → ${s5p} · 3×3/p1/s2 → ${half}`);
  chk(s3===126, "3×3, dolgu yok: kenarlardan birer piksel gidiyor (adım 1: 126×126)", String(s3));
  chk(s5===124, ".ask: çekirdek 5×5 olunca çıktı 124'e düşüyor", String(s5));
  chk(s5p===128, ".ask: dolgu 2 çıktıyı 128'e geri getiriyor (k/2 kuralı)", String(s5p));
  chk(half===64, ".ask: stride 2 çıktıyı yarıya indiriyor", String(half));
  chk(T(el,'cn-par').indexOf('9')===0, "stride ağırlık sayısını değiştirmiyor: 9 + 1 bias", T(el,'cn-par'));
  setK(5); chk(T(el,'cn-par').indexOf('25')===0, "5×5'te ağırlık 25 + 1 bias (adım 6)", T(el,'cn-par'));

  /* çekirdek toplamı: birim 1, kenar bulucu 0 — ön ayar düğmelerinin id'si yok,
     rehberli adımların kendisi sürülüyor (başlıkla bulunuyor, sıraya bağlı değil) */
  const step=(re)=>cn.steps.find(x=>re.test(x.t));
  setK(3); setP(0); setS(1);
  step(/Birim/).run();  const sum1=V(el,'cn-sum'), base=T(el,'cn-size');
  step(/Kenar/).run();  const sum0=V(el,'cn-sum');
  console.log(`       birim çekirdek toplamı ${sum1} · kenar bulucu ${sum0} · çıktı ${base}`);
  chk(sum1===1, "birim çekirdek toplamı 1 — 'çıktı girdinin aynısı' (adım 1)", String(sum1));
  chk(sum0===0, "kenar bulucunun toplamı 0 — 'düz alanlar sıfırlanıyor' (adım 3)", String(sum0));

  /* ReLU + 2×2 pooling: boyut tam yarıya iniyor */
  setP(1); setS(1);
  const before=size();
  P(el,'cn-relu',true); P(el,'cn-pool',true);
  const pooled=size();
  console.log(`       ReLU+pooling: ${before}×${before} → ${pooled}×${pooled}`);
  chk(pooled===Math.floor(before/2), "2×2 max pooling boyutu tam yarıya indiriyor (adım 7)",
      `${before} → ${pooled}`);
  chk(/M|K/.test(T(el,'cn-dense')), "'tam bağlantılı olsa' göstergesi ağırlık paylaşımının bedelini yazıyor",
      T(el,'cn-dense'));
  /* filtre bankası çizimi patlamıyor (dört konvolüsyon birden) */
  P(el,'cn-pool',false); P(el,'cn-bank',true); cn.draw();
  chk(size()>0, "filtre bankası açıkken de çizim ve göstergeler ayakta", `${T(el,'cn-size')}`);
  P(el,'cn-bank',false);
}

/* ══ Alternatif veri kümeleri ══
   Her modülde "aynı dersi başka bir hikâyeyle tekrar eden" 2–3 somut veri var.
   Buradaki her chk() o veri kümesinin METNİNDEN (CONTENT.sets[].note ya da
   steps[].d) türetildi; eşikler 8–12 turluk ORTALAMA ölçümle konuldu.
   PK(M,id,j) veri kümesini senaryo düğmesine basarak seçer — uygulamadaki yol. */
const PK=(M,id,j)=>{const m=M.find(x=>x.id===id); if(!m||!m.__pick) throw new Error(id+": __pick yok");m.__pick(j);};

/* ── 03 · k-NN · "Baz istasyonu": kapsama alanı bir HALKA ── */
{
  head("Modül 03 · veri kümesi « Baz istasyonu » (halka)");
  const {el,M}=boot(F); const e1=[],e5=[],e21=[];
  for(let t=0;t<12;t++){ PK(M,'m-knn',1);
    S(el,'knn-k',1);  e1.push(V(el,'knn-e'));
    S(el,'knn-k',5);  e5.push(V(el,'knn-e'));
    S(el,'knn-k',21); e21.push(V(el,'knn-e')); }
  console.log(`       eğitim hatası: k=1 %${mean(e1).toFixed(1)} · k=5 %${mean(e5).toFixed(1)} · k=21 %${mean(e21).toFixed(1)}`);
  chk(mean(e5)<9, "k-NN halka sınırını öğreniyor (note: 'k-NN eğri sınırı hiç zorlanmadan öğrenir')", `k=5 → %${mean(e5).toFixed(1)}`);
  chk(mean(e21)>15, "k=21'de halka eriyip kayboluyor (adım 5)", `k=21 → %${mean(e21).toFixed(1)}`);
  chk(e1.every(x=>x===0), "k=1 bu veride de tam olarak %0 (ezber her veri kümesinde ezber)", `max %${Math.max(...e1)}`);
}

/* ── 03 · k-NN · "Kredi riski": sınıflar iç içe ── */
{
  head("Modül 03 · veri kümesi « Kredi riski » (gürültülü sınır)");
  const {el,M}=boot(F); const e1=[],e21=[];
  for(let t=0;t<12;t++){ PK(M,'m-knn',2);
    S(el,'knn-k',1);  e1.push(V(el,'knn-e'));
    S(el,'knn-k',21); e21.push(V(el,'knn-e')); }
  console.log(`       eğitim hatası: k=1 %${mean(e1).toFixed(1)} · k=21 %${mean(e21).toFixed(1)}`);
  chk(e1.every(x=>x===0), "k=1 gürültüyü ezberliyor: hata %0 (note: 'k = 1 bu gürültüyü ezberler')");
  chk(mean(e21)>10, "aynı veride k=21 dürüst bir hata gösteriyor", `%${mean(e21).toFixed(1)}`);
}

/* ── 07 · Aşırı öğrenme · "doğru derece veriye bağlı" ──
   İki ölçüt: (a) 3. derecede "Yetersiz" rozeti kaç turda çıkıyor, (b) test RMSE'yi
   en küçük yapan derece kaç turda 5 ve üstünde. Durum rozeti tek örneklemde
   zıplıyor (14 nokta + 0.12 gürültü), o yüzden 16 tur sayılıyor. Ölçüm:
   Ölçüm (100 örneklem, üstel gösterimi doğru okuyan num() ile): 3. derecede
   "Yetersiz" oranı sıcaklıkta %17, doygunlukta %7, titreşimde %79 — gürültü seviyesi
   bu oranları değiştirmiyor. Eşikler dağılımların ~3 σ ötesine konuldu (30 turda 18);
   daha dar eşiklerle (24'te 18) on koşudan ikisi kırılganlıktan düşüyordu. */
{
  head("Modül 07 · üç eğri, üç ayrı « doğru derece »");
  const {el,M}=boot(F);
  const scan=(j,N)=>{
    let yet=0, hi=0; const best=[];
    for(let t=0;t<N;t++){
      PK(M,'m-fit',j); S(el,'fit-m',14);
      S(el,'fit-d',3); if(T(el,'fit-vs')==="Yetersiz") yet++;
      let b=1,bv=Infinity;
      for(let d=1;d<=14;d++){ S(el,'fit-d',d); const v=V(el,'fit-vte'); if(v<bv){bv=v;b=d;} }
      best.push(b); if(b>=5) hi++;
    }
    return {yet, hi, N, best:mean(best)};
  };
  const a=scan(0,12), b=scan(1,12), c=scan(2,30);
  console.log(`       sıcaklık : 3. derece yetersiz ${a.yet}/${a.N} · en iyi derece ort ${a.best.toFixed(1)} (≥5: ${a.hi}/${a.N})`);
  console.log(`       doygunluk: 3. derece yetersiz ${b.yet}/${b.N} · en iyi derece ort ${b.best.toFixed(1)} (≥5: ${b.hi}/${b.N})`);
  console.log(`       titreşim : 3. derece yetersiz ${c.yet}/${c.N} · en iyi derece ort ${c.best.toFixed(1)} (≥5: ${c.hi}/${c.N})`);
  console.log(`       (ölçüm: sıcaklık %17 · doygunluk %7 · titreşim %79)`);
  chk(c.yet>=18, "titreşim eğrisinde 3. derece YETERSİZ rozetini alıyor (adım 5: 'on örneklemin sekizinde')", `${c.yet}/30`);
  chk(a.yet<=6 && b.yet<=5, "aynı derece öteki iki eğride kural olarak yetersiz DEĞİL", `sıcaklık ${a.yet}/12 · doygunluk ${b.yet}/12`);
  chk(c.hi>=18, "titreşimde en iyi derece 5 ve üstü (note: 'en iyi derece çoğunlukla 5')", `${c.hi}/30`);
  chk(b.hi<=5, "doygunlukta düşük derece yetiyor (note: '2. derece bile yakalıyor')", `≥5 olan ${b.hi}/12`);
  chk(c.best>b.best+1, "üç eğrinin « doğru derecesi » aynı değil", `doygunluk ${b.best.toFixed(1)} → titreşim ${c.best.toFixed(1)}`);
}

/* ── 09 · Gradyan inişi · üç hata yüzeyi ── */
{
  head("Modül 09 · üç hata yüzeyi (convex / dik kanyon)");
  const run=(j,lr,x0)=>{const {el,M,tick}=boot(F); PK(M,'m-gd',j);
    S(el,'gd-lr',lr); if(x0!==undefined) S(el,'gd-x0',x0);
    el('gd-run').click(); tick(500);
    return {st:T(el,'gd-s'), x:V(el,'gd-x')};};
  const cL=run(1,60,-230), cR=run(1,60,450);
  console.log(`       convex: soldan başla → ${cL.st} w=${cL.x} · sağdan başla → ${cR.st} w=${cR.x}`);
  chk(!/raksad/.test(cL.st)&&!/raksad/.test(cR.st), "tek vadide iki başlangıç da yakınsıyor");
  chk(Math.abs(cL.x-cR.x)<0.1, "ikisi de AYNI dibe iniyor (note: 'başlangıç noktası hiç önemli değil')",
      `${cL.x} ve ${cR.x}`);
  const sOk=run(2,60), sBad=run(2,200);
  console.log(`       dik kanyon: lr=0.060 → ${sOk.st} w=${sOk.x} · lr=0.200 → ${sBad.st}`);
  chk(!/raksad/.test(sOk.st), "dik kanyonda 0.06 hâlâ iş görüyor (note: '0.06 iş görür')", sOk.st);
  chk(/raksad/.test(sBad.st), "aynı yüzeyde 0.20 ıraksıyor — learning rate yüzeye bağlı (note: '0.20'yi deneyin — patlar')", sBad.st);
}

/* ── 05 · Karar ağacı · "Sahte işlem": pozitif sınıf bir kutunun içinde ── */
{
  head("Modül 05 · veri kümesi « Sahte işlem » (tek eşik yetmiyor)");
  const {el,M}=boot(F); const d1=[],d3=[];
  for(let t=0;t<10;t++){ PK(M,'m-dt',1); el('dt-best').click();
    S(el,'dt-d',1); d1.push(V(el,'dt-acc'));
    S(el,'dt-d',3); d3.push(V(el,'dt-acc')); }
  console.log(`       eğitim doğruluğu: derinlik 1 → %${mean(d1).toFixed(1)} · derinlik 3 → %${mean(d3).toFixed(1)}`);
  chk(mean(d3)-mean(d1)>8, "iki eşik bir eşikten belirgin biçimde iyi (adım 5: 'tek eşikle kutuyu ayıramıyoruz')",
      `+${(mean(d3)-mean(d1)).toFixed(1)} puan`);
  chk(mean(d1)<92, "derinlik 1 kutuyu ayıramıyor", `%${mean(d1).toFixed(1)}`);
}

/* ── 06 · Orman · "Pivot sulama": sınır kapalı bir eğri ── */
{
  head("Modül 06 · veri kümesi « Pivot sulama » (halka sınır)");
  const {el,M,tick}=boot(F); const oob=[],one=[];
  for(let t=0;t<8;t++){ PK(M,'m-ens',1); S(el,'ens-d',4); S(el,'ens-k',40); tick(50);
    oob.push(V(el,'ens-oob')); one.push(V(el,'ens-one')); }
  console.log(`       40 ağaç OOB %${mean(oob).toFixed(1)} · tek ağaç OOB %${mean(one).toFixed(1)}`);
  chk(mean(oob)-mean(one)>2, "topluluk halka sınırında da tek ağacı geçiyor (adım 5)",
      `+${(mean(oob)-mean(one)).toFixed(1)} puan`);
}

/* ── 10 · Eşik · üç senaryo, üç ayrı maliyet ── */
{
  head("Modül 10 · üç senaryo (İHA / kanser / spam)");
  const {el,M}=boot(F);
  /* Senaryo seçimi veriyi yeniden üretiyor: tek örneklem İHA'da precision–recall
     farkını bazen 15'in üstüne atıyordu (ölçüldü: %77.5 / %93.2). 10 turun
     ORTALAMASI alınıyor — CLAUDE.md kuralı: rastgele veride tek örneklem değil ortalama. */
  const at=(j)=>{ const pre=[],rec=[],auc=[]; let t="";
    for(let r=0;r<10;r++){ PK(M,'m-cm',j); t=T(el,'cm-to'); pre.push(V(el,'cm-pre')); rec.push(V(el,'cm-rec')); auc.push(V(el,'cm-auc')); }
    const f=(a)=>+mean(a).toFixed(1);
    return {t, pre:f(pre), rec:f(rec), auc:f(auc)}; };
  const iha=at(0), kanser=at(1), spam=at(2);
  console.log(`       İHA    eşik ${iha.t}: precision %${iha.pre} · recall %${iha.rec}`);
  console.log(`       kanser eşik ${kanser.t}: precision %${kanser.pre} · recall %${kanser.rec}`);
  console.log(`       spam   eşik ${spam.t}: precision %${spam.pre} · recall %${spam.rec}`);
  chk(kanser.rec>kanser.pre+20, "kanser taramasında recall öne geçiyor (note: 'eşik AŞAĞI çekilir')",
      `recall %${kanser.rec} vs precision %${kanser.pre}`);
  chk(spam.pre>spam.rec+20, "spam filtresinde precision öne geçiyor (note: 'eşik YUKARI çekilir')",
      `precision %${spam.pre} vs recall %${spam.rec}`);
  chk(Math.abs(iha.pre-iha.rec)<15, "İHA senaryosu ikisini dengede tutuyor (note: 'iki maliyetin pazarlığı')",
      `%${iha.pre} / %${iha.rec}`);
}

/* ── 02 · Ölçekleme · gösterge adı veri kümesiyle birlikte değişiyor ──
   Veri kümesi anahtarı yalnız noktaları değil METNİ de değiştirmeli; yoksa ekranda
   "boy payı" yazarken tuvalde yıldız puanı durur. */
{
  head("Modül 02 · gösterge adları veri kümesini izliyor");
  const {el,M}=boot(F);
  const names=[0,1,2].map(j=>{ PK(M,'m-scale',j); return T(el,'sc-k1')+" / "+T(el,'sc-k2'); });
  names.forEach((n,j)=>console.log(`       set${j}: ${n}`));
  chk(new Set(names).size===3, "üç veri kümesi üç ayrı gösterge adı yazıyor", names.join(" · "));
  chk(/y(ı|i)ld(ı|i)z/i.test(names[1]), "otel verisinde gösterge 'yıldız puanı' diyor", names[1]);
}

console.log(`\n${fail?fail+" DENETİM DÜŞTÜ":"tüm davranış denetimleri geçti"}`);
process.exit(fail?1:0);
