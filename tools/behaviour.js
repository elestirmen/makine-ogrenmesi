/* 26 modülün PEDAGOJİK İDDİALARINI sına: çökme değil, ".ask kutusu ve rehberli
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

/* ── 20 · Çok katmanlı ağ: h=1 XOR'u çözemez, h≥2 çözer ── */
{
  console.log("=== Modül 23 · Gizli katman (XOR) ===");
  const r=[];
  for(const h of [1,4]){
    const {el,tick,M}=boot(F);
    M.find(x=>x.id==='m-mlp').__pick(0);        // PK() aşağıda const (TDZ)
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

/* ── 07 · Rastgele orman: çok ağaç tek ağacı geçer ── */
{
  console.log("\n=== Modül 15 · Kırk ağaç (torbalama / OOB) ===");
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

/* ── 11 · Düzenlileştirme: L1 katsayıları sıfırlar, L2 sıfırlamaz ── */
{
  console.log("\n=== Modül 12 · Katsayıya ceza (L1 / L2) ===");
  const {el,tick}=boot(F);
  const ds=el('reg-d'); ds.value='12'; ds.dispatchEvent({type:'input'});
  const read=()=>({nz:num(el('reg-nz').textContent), tr:num(el('reg-tr').textContent),
                   te:num(el('reg-te').textContent), raw:el('reg-nz').textContent});
  const set=(lam)=>{const s=el('reg-lam'); s.value=String(lam); s.dispatchEvent({type:'input'});};
  el('reg-l2').click(); set(0);  const l2lo=read();
  set(100);                       const l2hi=read();
  el('reg-l1').click(); set(0);  const l1lo=read();
  set(100);                       const l1hi=read();
  console.log(`       L2  α düşük: sıfır olmayan=${l2lo.raw} eğitim=${l2lo.tr}   α yüksek: ${l2hi.raw} eğitim=${l2hi.tr}`);
  console.log(`       L1  α düşük: sıfır olmayan=${l1lo.raw} eğitim=${l1lo.tr}   α yüksek: ${l1hi.raw} eğitim=${l1hi.tr}`);
  chk(l1hi.nz<l1lo.nz, "L1 yüksek α'da katsayıları sıfıra düşürüyor (seyreklik)", `${l1lo.nz} → ${l1hi.nz}`);
  chk(l2hi.nz>=l1hi.nz, "L2 aynı α'da L1 kadar seyreklik üretmiyor", `L2=${l2hi.nz}, L1=${l1hi.nz}`);
  chk(l2hi.tr>=l2lo.tr-1e-9, "α büyüyünce eğitim hatası artıyor (ceza çalışıyor)", `${l2lo.tr} → ${l2hi.tr}`);
  /* ders notu · Sağ alt: "En iyi α eğitim noktalarında 5 katlı CV ile seçiliyor; yeşil bant
     çoğunlukla test dibinin yakınına düşer". Test RMSE'si CV seçiminde / test dibinde oranı,
     16–20 örneklemde medyan L2 1.3–1.5, L1 1.2 ölçüldü (arada bir 10× üstü: küçük veride CV gürültülü). */
  { el('reg-l2').click(); const rt=[];
    for(let t=0;t<16;t++){ el('reg-new').click();
      const te=[]; for(let i=0;i<=100;i+=2){ set(i); te.push(num(el('reg-te').textContent)); }
      const b=el('reg-best').textContent; let bi=-1;
      for(let i=0;i<=100&&bi<0;i++){ set(i); if(el('reg-lamo').textContent===b) bi=i; }
      set(bi); rt.push(num(el('reg-te').textContent)/Math.min(...te)); }
    chk(med(rt)<=2, "CV ile seçilen α'nın test hatası çoğunlukla test dibine yakın (Sağ alt)", `medyan oran ${med(rt).toFixed(2)}`); }
  /* Elastic Net (ρ = 0.5) · adım "Elastic Net · ikisinin karışımı": aynı α'da (kaydırıcı 42)
     "L2 on ikisini de tutuyordu, L1 çoğunlukla üç dördünü, Elastic Net dört ile altı arasını".
     Ölçüm (16 örneklemlik 7 blok, sıcaklık): L1 ort 2.6–3.9, Elastic Net 4.2–5.9, fark +0.75…+2.3;
     tek örneklemde Elastic Net ≥ L1 16 turun 15–16'sında. Öteki iki eğride de sıra aynı
     (doygunluk L1 3.3 / EN 4.7, titreşim 3.9 / 5.9). */
  { const nz={l2:[],en:[],l1:[]}; let enGeL1=0;
    for(let t=0;t<16;t++){ el('reg-new').click();
      for(const m of ['l2','en','l1']){ P(el,'reg-'+m,true); set(42); nz[m].push(num(el('reg-nz').textContent)); }
      if(nz.en[t]>=nz.l1[t]) enGeL1++; }
    const m2=mean(nz.l2), me=mean(nz.en), m1=mean(nz.l1);
    console.log(`       α kaydırıcı 42, 16 örneklem: sıfır olmayan L2 ${m2.toFixed(2)} · Elastic Net ${me.toFixed(2)} · L1 ${m1.toFixed(2)} (EN ≥ L1: ${enGeL1}/16)`);
    chk(m2===12 && me<12 && nz.en.every(v=>v<12), "Elastic Net L2 gibi hepsini tutmuyor: bazı katsayılar tam sıfır", `L2 ${m2.toFixed(1)} · EN ${me.toFixed(2)}`);
    chk(me>m1+0.3 && enGeL1>=13, "Elastic Net L1'den az katsayı sıfırlıyor (sıfır olmayan L1 ile L2 arasında)", `EN ${me.toFixed(2)} > L1 ${m1.toFixed(2)}, ${enGeL1}/16 turda ≥`);
    chk(me>=3.5&&me<=7 && m1>=2&&m1<=4.5, "adımdaki sayılar: L1 üç dört, Elastic Net dört ile altı arası", `L1 ${m1.toFixed(2)} · EN ${me.toFixed(2)}`);
    P(el,'reg-en',true); set(100);
    chk(num(el('reg-nz').textContent)===0, "Elastic Net'te de α en büyükken 0 / 12 kalıyor", el('reg-nz').textContent);
    /* "5 katlı CV ile α seçimi bu modda da çalışsın": seçimin test hatası test dibine oranı,
       16 örneklemde medyan 1.05–1.22 (sıcaklık / doygunluk) ölçüldü — L2 ile aynı ölçüt */
    const rt=[];
    for(let t=0;t<16;t++){ el('reg-new').click();
      const te=[]; for(let i=0;i<=100;i+=2){ set(i); te.push(num(el('reg-te').textContent)); }
      const b=el('reg-best').textContent; let bi=-1;
      for(let i=0;i<=100&&bi<0;i++){ set(i); if(el('reg-lamo').textContent===b) bi=i; }
      set(bi); rt.push(num(el('reg-te').textContent)/Math.min(...te)); }
    chk(med(rt)<=2, "Elastic Net'te de CV ile seçilen α'nın test hatası test dibine yakın", `medyan oran ${med(rt).toFixed(2)}`); }
}

/* ── 14 · Çapraz doğrulama: katlar ve ortalama tutarlı ── */
{
  console.log("\n=== Modül 05 · Şansı ortalamak (k-katlı) ===");
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

/* ── 03 · Doğrusal regresyon: kapalı formül gerçekten en iyisini buluyor ── */
{
  head("Modül 06 · En iyi doğru (least squares)");
  const {el,M,tick,TIMERS}=boot(F); const r=[];
  /* tuval metni sahte DOM'da okunmuyor; denklem ve "cevap gizli mi" tuvalin
     aria-label'ında da yazıyor. Katsayılar "−" (U+2212) ile yazılıyor. */
  const AR=()=>el('c-lin').getAttribute('aria-label')||'';
  const sv=(s)=>num(String(s).replace(/−/g,'-'));
  /* "Senin doğrun: ŷ = 2.00 + 0.030x, yani fiyat = 2.00 + 0.030 · alan." — iki biçim,
     sunumdaki sırayla (Hafta 5: ŷ = β₀ + β₁x) */
  const eqOf=(txt,who)=>{const m=new RegExp(who+': ŷ = (−?[\\d.]+) ([+−]) ([\\d.]+)x, yani \\S+ = (−?[\\d.]+) ([+−]) ([\\d.]+) · \\S+\\.').exec(txt);
    return m?{B:sv(m[1]), A:sv((m[2]==='−'?'-':'')+m[3]), B2:sv(m[4]), A2:sv((m[5]==='−'?'-':'')+m[6])}:null;};
  const alive=()=>TIMERS.filter(Boolean).length;
  for(let t=0;t<20;t++){
    el('lin-new').click();
    const hid=AR();                                    // yeni bulut: cevap gizli olmalı
    S(el,'lin-a',-100); S(el,'lin-b',120);            // bilerek kötü doğru
    const bad=V(el,'lin-sse'), stBad=T(el,'lin-st');
    const eqU=eqOf(AR(),'Senin doğrun'), ao=sv(T(el,'lin-ao')), bo=sv(T(el,'lin-bo'));
    const t0=alive();
    el('lin-fit').click();                             // "Least squares çözümü" — animasyon başlar
    /* SSE verinin biriminde (milyon ₺², puan²) ve üç anlamlı basamakla: 100'ün üstü tamsayı */
    const after=AR(), ghost=/Son tahminin kesikli çizgide, SSE (\d+(?:\.\d+)?)/.exec(after);
    r.push({bad, got:V(el,'lin-sse'), best:V(el,'lin-best'), st:T(el,'lin-st'), stBad,
      hidden:/henüz gizli/.test(hid)&&!/Least squares:/.test(hid),
      open:/Least squares:/.test(after), ghost:ghost?+ghost[1]:NaN,
      eqOk:!!eqU&&Math.abs(eqU.A-ao)<1e-9&&Math.abs(eqU.B-bo)<1e-9&&eqU.A===eqU.A2&&eqU.B===eqU.B2});
    const ch=/Adım adım çözüm: SSE (\d+(?:\.\d+)?) → (\d+(?:\.\d+)?) → (\d+(?:\.\d+)?)/.exec(after);
    r[t].chain=ch?[+ch[1],+ch[2],+ch[3]]:null;
    /* animasyon yalnız ÇİZİM: göstergeler tık beklemeden son değerde (yukarıda okundu);
       67 tıkta (× 30 ms ≈ 2 sn) biter */
    r[t].animOn=alive()>t0; tick(60); r[t].at60=alive()>t0; tick(8); r[t].at68=alive()>t0;
    S(el,'lin-b',60);                                  // cevaptan sonra kaydırıcıya dokun
    const touch=AR(); r[t].touchOk=/Least squares:/.test(touch)&&!/Son tahminin/.test(touch);
  }
  const worse=r.filter(x=>x.got>x.best+1e-3).length;
  const notBest=r.filter(x=>!/En iyi/.test(x.st)).length;
  console.log(`       kötü doğru SSE ort ${mean(r.map(x=>x.bad)).toFixed(3)} → çözümden sonra ${mean(r.map(x=>x.got)).toFixed(3)} (en iyi ${mean(r.map(x=>x.best)).toFixed(3)})`);
  chk(worse===0, "kapalı formül en küçük SSE'yi buluyor (adım: 'tek bir dip nokta')", `${worse}/20 sapma`);
  chk(notBest===0, "durum göstergesi 'En iyi' diyor", `${notBest}/20 değil`);
  chk(mean(r.map(x=>x.bad))>mean(r.map(x=>x.got))*3, "elle konan kötü doğru belirgin daha kötü");
  /* ders notu · Sol panel: "en iyi doğru başta gizli: önce sen dene" */
  chk(r.every(x=>x.hidden), "yeni bulutta least squares doğrusu gizli (adım 1: 'cevap şimdilik gizli')",
      `${r.filter(x=>!x.hidden).length}/20 açık`);
  chk(r.every(x=>x.open), "« Least squares çözümü » cevabı açıyor");
  /* adım 1: "Durum ne kadar yaklaştığınızı söylüyor" — cevaba bakmadan yön */
  chk(r.every(x=>/Uzak|Yakın/.test(x.stBad)), "kötü doğruda Durum 'En iyi' demiyor",
      [...new Set(r.map(x=>x.stBad))].join(','));
  /* adım 5: "Son denemeniz kesikli gri çizgi olarak kaldı, SSE'si yanında yazıyor" */
  chk(r.every(x=>Math.abs(x.ghost-x.bad)<1e-3), "son deneme cevaptan sonra ekranda, SSE'siyle",
      `${r.filter(x=>!(Math.abs(x.ghost-x.bad)<1e-3)).length}/20 eksik ya da yanlış`);
  /* ders notu: "Sonra kaydırıcıya dokunursan en iyi doğru kesikli yeşil çizgiyle görünür" */
  chk(r.every(x=>x.touchOk), "cevaptan sonra kaydırıcıya dokununca least squares kalıyor, son deneme siliniyor");
  /* adım 5: "Her adımda SSE düşüyor" — son değer en iyi SSE */
  chk(r.every(x=>x.chain&&x.chain[0]>=x.chain[1]&&x.chain[1]>=x.chain[2]&&Math.abs(x.chain[2]-x.best)<1e-3),
      "çözüm adımlarında SSE her adımda düşüyor ve en iyiye iniyor (adım 5)",
      `${r.filter(x=>!(x.chain&&x.chain[0]>=x.chain[1]&&x.chain[1]>=x.chain[2])).length}/20 bozuk`);
  /* adım 5: "Doğru iki saniyede üç adımla iniyor" */
  chk(r.every(x=>x.animOn&&x.at60&&!x.at68), "çözüm animasyonu ~2 sn sürüp kendiliğinden bitiyor",
      `başladı ${r.filter(x=>x.animOn).length}/20 · 60. tıkta süren ${r.filter(x=>x.at60).length} · 68. tıkta süren ${r.filter(x=>x.at68).length}`);
  { el('lin-new').click(); S(el,'lin-a',-100); const t0=alive(); el('lin-fit').click(); const on=alive()>t0;
    el('lin-fit').click();                             // ikinci basış: sona atla
    chk(on&&alive()===t0&&/En iyi/.test(T(el,'lin-st')), "animasyon sürerken ikinci basış sona atlıyor"); }
  /* ders notu · Denklem: "iki biçimde: ŷ = 1.80 + 0.035x, yani fiyat = …" ve
     "Kaydırıcıların yanındaki iki sayı bu iki katsayı" */
  chk(r.every(x=>x.eqOk), "ŷ = β₀ + β₁x ile verinin dilindeki denklem ve kaydırıcılar aynı katsayıyı söylüyor",
      `${r.filter(x=>!x.eqOk).length}/20 farklı`);

  /* veri kümesi notları: eğimin tipik aralığı (40 turun ORTALAMASI değil, payı:
     "çoğunlukla" diyor; ölçümde üç kümede de ~%90) ve araç kümesinde eğimin işareti */
  /* PK() dosyada bu bloktan SONRA const ile tanımlı (TDZ): seçiciyi burada kur */
  const pick=(j)=>M.find(x=>x.id==='m-lin').__pick(j);
  const slopes=(j)=>{pick(j); const s=[];
    for(let t=0;t<40;t++){ el('lin-new').click(); el('lin-fit').click(); s.push(sv(T(el,'lin-ao'))); }
    return s;};
  const share=(s,lo,hi)=>s.filter(v=>v>=lo&&v<=hi).length/s.length;
  const ev=slopes(0), ca=slopes(1), ar=slopes(2);
  console.log(`       eğim · ev ${Math.min(...ev)}…${Math.max(...ev)} · çalışma ${Math.min(...ca)}…${Math.max(...ca)} · araç ${Math.min(...ar)}…${Math.max(...ar)}`);
  chk(share(ev,0.02,0.05)>=0.75, "Ev fiyatı: eğim çoğunlukla 0.02–0.05 milyon ₺/m² (not)", `pay ${share(ev,0.02,0.05).toFixed(2)}`);
  chk(share(ca,1,3)>=0.75, "Çalışma → not: eğim çoğunlukla 1–3 puan/saat (not)", `pay ${share(ca,1,3).toFixed(2)}`);
  chk(share(ar,-110,-50)>=0.75, "Araç yaşı: her yıl çoğunlukla 50–110 bin ₺ düşüş (not)", `pay ${share(ar,-110,-50).toFixed(2)}`);
  chk(ar.every(v=>v<0), "Araç yaşı: formül eğimi her seferinde eksi buluyor (adım 9)", `${ar.filter(v=>v>=0).length}/40 artı`);
  pick(0);
}

/* ── 06 · « Beş öğrenci » (Hafta 5'in elle çözümü), temel model, RMSE ve R² ──
   Sabit veri: sayılar BİREBİR sunumdaki gibi çıkmalı (ŷ = 44 + 4x, SSE 6, RMSE 1.10,
   SST 646, R² 0.9907, temel RMSE 11.4). SSE / RMSE verinin biriminde (puan², puan). */
{
  head("Modül 06 · Beş öğrenci, temel model, RMSE ve R²");
  const {el,M,tick}=boot(F); const mod=M.find(x=>x.id==='m-lin');
  const AR=()=>el('c-lin').getAttribute('aria-label')||'';
  mod.__pick(3); P(el,'lin-base',false);
  chk(/henüz gizli/.test(AR())&&T(el,'lin-n')==='5', "beş öğrenci: beş nokta, cevap başta gizli (m-lin kuralı)", T(el,'lin-n'));
  el('lin-fit').click(); tick(70);
  /* not ve adım 6: "« Least squares çözümü » ŷ = 44 + 4x verir: SSE 6, RMSE 1.10 puan, R² 0.9907" */
  chk(/Least squares: ŷ = 44 \+ 4x, yani not = 44 \+ 4 · saat\./.test(AR())&&T(el,'lin-ao')==='4'&&T(el,'lin-bo')==='44',
      "least squares ŷ = 44 + 4x, kaydırıcılar 4 ve 44 (not, adım 6)", `${T(el,'lin-bo')} + ${T(el,'lin-ao')}x`);
  chk(T(el,'lin-sse')==='6.00'&&T(el,'lin-best')==='6.00', "SSE 6 = 1 + 0 + 4 + 0 + 1 (not, elle hesap)", T(el,'lin-sse'));
  chk(T(el,'lin-rmse')==='1.10'&&T(el,'lin-ru')==='puan', "RMSE √(6 / 5) ≈ 1.10 puan (not, adım 6)", `${T(el,'lin-rmse')} ${T(el,'lin-ru')}`);
  chk(T(el,'lin-r2')==='0.9907'&&/En iyi/.test(T(el,'lin-st')), "R² 0.9907 ve Durum 'En iyi' (not)", T(el,'lin-r2'));
  /* adım 7: "turuncu karelerin toplamı SST = 646 … R² = 1 − 6 / 646 = 0.9907 … temel modelin RMSE'si 11.4" */
  P(el,'lin-base',true);
  chk(/Temel model ŷ = 68: SST 646, RMSE 11\.4 puan\./.test(AR()), "temel model herkese 68 der: SST 646, RMSE 11.4 puan (adım 7, not)");
  chk(/R² = 1 − SSE\/SST = 1 − 6\.00\/646 = 0\.9907\./.test(AR()), "köşede R² = 1 − 6/646 = 0.9907 (adım 7)");
  /* adım 8: "Eğimi 0, kesme terimini 68 yapın … SSE = SST = 646 ve R² tam 0 … ters yöne: R² eksiye" */
  S(el,'lin-a',0); S(el,'lin-b',68);
  chk(T(el,'lin-r2')==='0.0000'&&T(el,'lin-sse')==='646', "eğim 0, kesme terimi 68: SSE = SST = 646, R² tam 0 (adım 8)", `SSE ${T(el,'lin-sse')} · R² ${T(el,'lin-r2')}`);
  S(el,'lin-a',-10);
  chk(V(el,'lin-r2')<0, "eğim ters yöne dönünce R² eksiye düşüyor, doğru ortalamadan kötü (adım 8)", T(el,'lin-r2'));
  /* not: "Bu küme sabit: « Yeni veri » aynı beş öğrenciyi getirir" */
  el('lin-new').click(); el('lin-fit').click(); tick(70);
  chk(T(el,'lin-best')==='6.00'&&T(el,'lin-r2')==='0.9907', "« Yeni veri » aynı beş öğrenciyi geri getiriyor (not)", T(el,'lin-best'));
  /* ders notu · Göstergeler: "RMSE = √(SSE / n)" ve "R² = 1 − SSE / SST" — üç rastgele kümede
     gösterge ile köşedeki satır aynı şeyi söylüyor (üç anlamlı basamağın yuvarlama payıyla) */
  let bad=0, n=0;
  for(const j of [0,1,2]){ mod.__pick(j);
    for(let t=0;t<5;t++){ el('lin-new').click(); S(el,'lin-a',30+10*t); S(el,'lin-b',30); n++;
      const sse=V(el,'lin-sse'), k=V(el,'lin-n'), rm=V(el,'lin-rmse'), r2=V(el,'lin-r2');
      const m=/SST (\d+(?:\.\d+)?), RMSE/.exec(AR()), sst=m?+m[1]:NaN;
      if(!(Math.abs(Math.sqrt(sse/k)-rm)<=0.02*rm) || !(Math.abs(1-sse/sst-r2)<=0.02*Math.max(1,Math.abs(r2)))) bad++; } }
  chk(bad===0, "RMSE = √(SSE / n) ve R² = 1 − SSE / SST üç kümede tutarlı (ders notu · Göstergeler)", `${bad}/${n}`);
  mod.__pick(0); P(el,'lin-base',false);
}

/* ── 04 · Çoklu doğrusal regresyon: düzlem, "öteki sabitken", karıştırıcı etki ── */
{
  head("Modül 07 · İki öznitelik, bir düzlem (multiple linear regression)");
  const {el,M,TIMERS}=boot(F); const mod=M.find(m=>m.id==='m-mlr');
  /* denklem ve "cevap gizli mi" tuval metninde; sahte DOM'da okunmadığı için aria-label'dan */
  const AR=()=>el('c-mlr').getAttribute('aria-label')||'';
  const sv=(s)=>num(String(s).replace(/−/g,'-'));
  const alive=()=>TIMERS.filter(Boolean).length;
  /* adım 1: "İki katsayı da sıfırken düzlem yatay; her eve ortalama fiyatı söylüyor ve R² tam 0" */
  mod.__pick(0); S(el,'mlr-a1',0); S(el,'mlr-a2',0);
  chk(T(el,'mlr-r2')==='0.000', "iki katsayı sıfırken R² tam 0 (adım 1)", T(el,'mlr-r2'));
  const r=[];
  for(let t=0;t<20;t++){
    el('mlr-new').click();
    const hid=/henüz gizli/.test(AR())&&!/Least squares:/.test(AR())&&T(el,'mlr-m1')==='—';
    S(el,'mlr-a1',-100); S(el,'mlr-a2',100);           // bilerek kötü düzlem
    const bad=V(el,'mlr-sse'), t0=alive();
    el('mlr-fit').click();
    r.push({hid, bad, got:V(el,'mlr-sse'), best:V(el,'mlr-best'), cls:el('mlr-sse').className,
            open:/Least squares:/.test(AR())&&T(el,'mlr-m1')!=='—', anim:alive()>t0});
  }
  chk(r.every(x=>x.hid), "yeni veride en iyi düzlem ve 'birlikte' katsayısı gizli", `${r.filter(x=>!x.hid).length}/20 açık`);
  chk(r.every(x=>x.open), "« Least squares çözümü » cevabı açıyor");
  /* adım 4: "Kasenin dibi yine tek formülle bulunuyor" */
  chk(r.every(x=>Math.abs(x.got-x.best)<1e-3&&/ok/.test(x.cls)), "kapalı formül kasenin dibini buluyor (SSE = en iyi SSE, yeşil)",
      `${r.filter(x=>!(Math.abs(x.got-x.best)<1e-3)).length}/20 sapma`);
  chk(mean(r.map(x=>x.bad))>mean(r.map(x=>x.got))*3, "elle konan kötü düzlem belirgin daha kötü",
      `${mean(r.map(x=>x.bad)).toFixed(3)} → ${mean(r.map(x=>x.got)).toFixed(3)}`);
  chk(r.every(x=>x.anim), "çözüm düzlemi kaydırarak getiriyor (geçiş zamanlayıcısı başlıyor)");
  { el('mlr-new').click(); S(el,'mlr-a1',-100); const t0=alive(); el('mlr-fit').click(); const on=alive()>t0;
    el('mlr-fit').click();                               // ikinci basış: sona atla
    chk(on&&alive()===t0&&/ok/.test(el('mlr-sse').className), "geçiş sürerken ikinci basış sona atlıyor"); }

  /* veri kümesi notları: "tek başına" = yalnız x₁'li doğru (Modül 06), "birlikte" = düzlem.
     R² tek başına aria-label'da ("Yalnız alan: … , R² 0.776"). Paylar 100'er turda ölçüldü. */
  const run=(k,N)=>{ mod.__pick(k); const o={s1:[],m1:[],r2s:[],r2:[]};
    for(let t=0;t<N;t++){ el('mlr-new').click();
      const m=/, R² (\d\.\d+)\./.exec(AR()); o.r2s.push(m?+m[1]:NaN);
      el('mlr-fit').click(); o.s1.push(sv(T(el,'mlr-s1'))); o.m1.push(sv(T(el,'mlr-m1'))); o.r2.push(V(el,'mlr-r2')); }
    return o; };
  const share=(a,f)=>a.filter(f).length/a.length;
  const sd=(a)=>{const m=mean(a); return Math.sqrt(mean(a.map(x=>(x-m)**2)));};
  /* 80 tur: pay ve sd denetimleri 40 turda sınırdaydı (sd oranı uzun vadede ~2.4, 40 turluk
     tahmin 8 koşudan birinde 1.8'in altına düşüyordu; %87'lik pay 0.75 eşiğine yaklaşıyordu) */
  const e0=run(0,80), e1=run(1,80), e2=run(2,100);
  console.log(`       Ev · alan + yaş   : tek başına ort ${mean(e0.s1).toFixed(1)} · birlikte ort ${mean(e0.m1).toFixed(1)} bin ₺/m² · R² ${mean(e0.r2s).toFixed(3)} → ${mean(e0.r2).toFixed(3)}`);
  console.log(`       Araç · yaş + km   : tek başına ort ${mean(e1.s1).toFixed(1)} (sd ${sd(e1.s1).toFixed(1)}) · birlikte ort ${mean(e1.m1).toFixed(1)} (sd ${sd(e1.m1).toFixed(1)}) bin ₺/yıl · R² ${mean(e1.r2s).toFixed(3)} → ${mean(e1.r2).toFixed(3)}`);
  console.log(`       Ev · yaş + uzaklık: tek başına ort ${mean(e2.s1).toFixed(1)} · birlikte ort ${mean(e2.m1).toFixed(1)} bin ₺/yıl`);
  /* not: "Yaşı modele eklemek alanın katsayısını neredeyse hiç değiştirmiyor: tek başına da
     birlikte de metrekare başına 30–40 bin ₺. R² ise yaklaşık 0.8'den 0.9'un üstüne çıkıyor" */
  const rel=e0.s1.map((x,i)=>Math.abs(e0.m1[i]-x)/Math.abs(x));
  chk(share(rel,x=>x<.15)>=.8, "Ev · alan + yaş: ikinci öznitelik katsayıyı neredeyse değiştirmiyor (<%15)", `pay ${share(rel,x=>x<.15).toFixed(2)}`);
  chk(share(e0.s1,x=>x>=30&&x<=40)>=.75&&share(e0.m1,x=>x>=30&&x<=40)>=.9, "Ev · alan + yaş: iki katsayı da çoğunlukla 30–40 bin ₺/m²",
      `tek ${share(e0.s1,x=>x>=30&&x<=40).toFixed(2)} · birlikte ${share(e0.m1,x=>x>=30&&x<=40).toFixed(2)}`);
  chk(mean(e0.r2s)>.7&&mean(e0.r2s)<.86&&mean(e0.r2)>.9, "Ev · alan + yaş: R² yaklaşık 0.8'den 0.9'un üstüne",
      `${mean(e0.r2s).toFixed(3)} → ${mean(e0.r2).toFixed(3)}`);
  /* not ve adım 7: "Yaş tek başına yılda 60–75 bin ₺ düşüş … yaklaşık yarısı kilometreye geçiyor.
     R² ise neredeyse hiç artmıyor" · "'birlikte' katsayısı örneklemden örnekleme çok daha fazla oynuyor" */
  const half=e1.m1.map((x,i)=>x/e1.s1[i]);
  chk(share(e1.s1,x=>x>=-75&&x<=-60)>=.85, "Araç · yaş + km: yaş tek başına yılda 60–75 bin ₺ düşüş", `pay ${share(e1.s1,x=>x>=-75&&x<=-60).toFixed(2)}`);
  chk(share(half,x=>x>=.3&&x<=.7)>=.75, "Araç · yaş + km: kilometre girince yaşın payı yaklaşık yarıya iniyor", `oran ort ${mean(half).toFixed(2)} · pay ${share(half,x=>x>=.3&&x<=.7).toFixed(2)}`);
  chk(mean(e1.r2)-mean(e1.r2s)<.05, "Araç · yaş + km: R² neredeyse hiç artmıyor", `${mean(e1.r2s).toFixed(3)} → ${mean(e1.r2).toFixed(3)}`);
  chk(sd(e1.m1)>1.7*sd(e1.s1), "Araç · yaş + km: 'birlikte' katsayısı örneklemden örnekleme çok daha fazla oynuyor (multicollinearity)",
      `sd ${sd(e1.s1).toFixed(1)} → ${sd(e1.m1).toFixed(1)}`);
  /* not, .ask ve adım 6: "işaret yüz örneklemin 95'inden fazlasında dönüyor" */
  const flip=e2.s1.map((x,i)=>x>0&&e2.m1[i]<0);
  chk(share(flip,x=>x)>=.95, "Ev · yaş + uzaklık: yaş tek başına artı, uzaklıkla birlikte eksi (confounding)", `${flip.filter(x=>x).length}/100`);
  mod.__pick(0);
}

/* ── 05 · Polinom regresyon: yeni sütunlar, veri dışı tahmin ── */
{
  head("Modül 09 · Eğri de doğrusal olabilir (polynomial regression)");
  const {el,M,TIMERS,tick}=boot(F); const mod=M.find(m=>m.id==='m-poly');
  const AR=()=>el('c-poly').getAttribute('aria-label')||'';
  const alive=()=>TIMERS.filter(Boolean).length;
  /* « Least squares çözümü » (m-lin kuralı): eğri kendiliğinden oturmaz, göstergeler basıldığı
     anda son değerde, çizim ~1.2 sn'de kayar. Ölçümler bu düğmeye basılarak alınıyor. */
  { mod.__pick(0); S(el,'poly-d',1); const r=[];
    for(let t=0;t<12;t++){
      el('poly-new').click();
      const r2new=T(el,'poly-r2'), flatBad=!/ok/.test(el('poly-rmse').className);
      const t0=alive(); el('poly-fit').click(); const on=alive()>t0;
      const fitOk=T(el,'poly-rmse')===T(el,'poly-best')&&/ok/.test(el('poly-rmse').className)&&/^Least squares:/.test(/\. (Least squares|Model):/.exec(AR())?.[1]+':');
      const ghost=/Önceki eğri kesikli çizgide/.test(AR());
      tick(38); const at38=alive()>t0; tick(4); const at42=alive()>t0;
      const r1=V(el,'poly-r2'); S(el,'poly-d',2);            // yeni sütun, ağırlığı 0
      /* adım 2'nin iddiası "eğri kıpırdamadı": R² aynı kalmalı. Eskiden RMSE'nin yeşil OLMAMASI da
         isteniyordu; x²'nin katkısı üç haneye sığmayacak kadar küçük çıkınca (12'de ~1) düşüyordu. */
      const kept=Math.abs(V(el,'poly-r2')-r1)<1e-9;
      el('poly-fit').click(); const r2=V(el,'poly-r2');
      el('poly-fit').click();                                     // geçiş sürerken ikinci basış
      const skip=alive()===t0;
      S(el,'poly-d',1);
      r.push({r2new,flatBad,on,fitOk,ghost,at38,at42,kept,r1,r2,skip});
    }
    const bad=(k)=>r.filter(x=>!x[k]).length;
    chk(r.every(x=>x.r2new==='0.000'&&x.flatBad), "yeni veride model düz çizgi: R² 0, RMSE en iyisi değil (adım 1)", `${r.filter(x=>!(x.r2new==='0.000'&&x.flatBad)).length}/12`);
    chk(r.every(x=>x.fitOk), "« Least squares çözümü » en iyi ağırlıkları buluyor (RMSE = en iyi RMSE, yeşil)", `${bad('fitOk')}/12 sapma`);
    chk(r.every(x=>x.on&&x.at38&&!x.at42), "eğri ~1.2 sn'de yerine iniyor ve geçiş kendiliğinden bitiyor", `başladı ${12-bad('on')} · 38. tıkta süren ${12-bad('at38')} · 42. tıkta süren ${12-bad('at42')}`);
    chk(r.every(x=>x.ghost), "önceki eğri kesikli çizgide kalıyor (adım 2)");
    chk(r.every(x=>x.kept), "yeni sütunun ağırlığı 0'dan başlıyor: eğri kıpırdamıyor (adım 2)", `${bad('kept')}/12 değişti`);
    /* nested least squares: R² hiç düşmez; gösterge 3 haneli, küçük artış "eşit" okunabiliyor */
    chk(r.every(x=>x.r2>=x.r1)&&mean(r.map(x=>x.r2-x.r1))>.1, "düğmeye basınca yeni sütun R²'yi yükseltiyor (adım 2)",
        `ort +${mean(r.map(x=>x.r2-x.r1)).toFixed(3)}`);
    chk(r.every(x=>x.skip), "geçiş sürerken ikinci basış sona atlıyor");
  }
  const sv=(s)=>num(String(s).replace(/−/g,'-'));
  /* veri dışı tahmin ve gerçek değer aria-label'da: "20:00 tahmini: model 30.6 °C, gerçek 20.1 °C." */
  const ex=()=>{const m=/model (−?[\d.]+) \S+, gerçek (−?[\d.]+)/.exec(AR()); return m?{pe:sv(m[1]),te:sv(m[2])}:{pe:NaN,te:NaN};};
  const run=(k,N)=>{ mod.__pick(k); const R={1:[],2:[],3:[],4:[]};
    for(let t=0;t<N;t++){ el('poly-new').click();
      for(let d=1;d<=4;d++){ S(el,'poly-d',d); el('poly-fit').click(); const e=ex();
        R[d].push({r2:V(el,'poly-r2'), rm:V(el,'poly-rmse'), pe:e.pe, te:e.te, k:V(el,'poly-k')}); } }
    return R; };
  const col=(a,k)=>a.map(x=>x[k]);
  const sd=(a)=>{const m=mean(a); return Math.sqrt(mean(a.map(x=>(x-m)**2)));};
  const share=(a,f)=>a.filter(f).length/a.length;
  const err=(a)=>a.map(x=>x.pe-x.te);
  /* 60 tur: fidanda "yaklaşık yarısında eksi" payı ~0.45 (30 turda payın sd'si 0.09);
     sıcaklıkta kenar sd oranı ağır kuyruklu, 30 turda on koşudan birinde 3'ün altına düşüyordu */
  const H=run(0,60), B=run(1,30), G=run(2,60);
  for(const [nm,R] of [["Gün içi sıcaklık",H],["Fren mesafesi",B],["Fidan boyu",G]])
    console.log(`       ${nm.padEnd(16)}: R² `+[1,2,3,4].map(d=>mean(col(R[d],'r2')).toFixed(3)).join(' · ')+
      `  |  kenar tahmini `+[1,2,3,4].map(d=>mean(col(R[d],'pe')).toFixed(1)+'±'+sd(col(R[d],'pe')).toFixed(1)).join(' · ')+`  (gerçek ${R[1][0].te})`);
  chk([1,2,3,4].every(d=>H[d].every(x=>x.k===d+1)), "katsayı sayısı = sütun sayısı + 1 (sabit)");
  /* not ve adım 1–2: "Tek sütunlu doğru … (R² 0.8 civarı), x² ekleyince 0.9'u geçiyor. Doğru akşam
     20:00 için yaklaşık 30 °C söylüyor; gerçek 20 °C." */
  chk(mean(col(H[1],'r2'))>.7&&mean(col(H[1],'r2'))<.87&&mean(col(H[2],'r2'))>.9, "Gün içi sıcaklık: R² 0.8 civarından x² ile 0.9'un üstüne",
      `${mean(col(H[1],'r2')).toFixed(3)} → ${mean(col(H[2],'r2')).toFixed(3)}`);
  chk(Math.abs(mean(col(H[1],'pe'))-30)<2.5&&Math.abs(H[1][0].te-20)<.6, "Gün içi sıcaklık: doğru 20:00 için yaklaşık 30 °C diyor, gerçek 20 °C",
      `model ort ${mean(col(H[1],'pe')).toFixed(1)} · gerçek ${H[1][0].te}`);
  /* adım 5: "aralığın içi hep benzer kalıyor, kenar her seferinde başka yere savruluyor" */
  /* 40 × 60 turda oran en az 3.3, %5'lik dilim 4.6, medyan 6.6 (kuyruk ağır: eşik 2.5) */
  chk(sd(col(H[4],'pe'))>2.5*sd(col(H[2],'pe')), "dört sütunda kenar tahmini örneklemden örnekleme savruluyor",
      `sd x² ${sd(col(H[2],'pe')).toFixed(1)} → x⁴ ${sd(col(H[4],'pe')).toFixed(1)}`);
  chk(mean(col(H[4],'rm'))<=mean(col(H[2],'rm')), "ama aralığın içinde dört sütun daha kötü uymuyor",
      `RMSE ${mean(col(H[2],'rm')).toFixed(2)} → ${mean(col(H[4],'rm')).toFixed(2)}`);
  /* adım 6 ve ders notu: "Derece 10 … RMSE ve R² 4. dereceden de iyi … 20:00 tahmini örneklemlerin
     neredeyse hepsinde 100 °C'den, çoğunda 1000 °C'den fazla şaşıyor". 10 × 40 turda paylar
     0.95–0.97 ve 0.68–0.88; RMSE her turda düştü. */
  { mod.__pick(0); const e10=[]; let low=0, r2up=0; const N=40;
    for(let t=0;t<N;t++){ el('poly-new').click(); S(el,'poly-d',4); el('poly-fit').click();
      const r4=V(el,'poly-rmse'), q4=V(el,'poly-r2'); S(el,'poly-d',10); el('poly-fit').click();
      if(V(el,'poly-rmse')<r4) low++; if(V(el,'poly-r2')>=q4) r2up++; const e=ex(); e10.push(Math.abs(e.pe-e.te)); }
    S(el,'poly-d',1);
    chk(low===N&&r2up===N, "derece 10: RMSE ve R² 4. dereceden de iyi (eğitim noktalarında)", `RMSE düştü ${low}/${N} · R² arttı ${r2up}/${N}`);
    chk(share(e10,x=>x>100)>=.85&&share(e10,x=>x>1000)>=.55, "derece 10: 20:00 tahmini neredeyse hep 100 °C'den, çoğunlukla 1000 °C'den fazla şaşıyor",
        `>100: ${share(e10,x=>x>100).toFixed(2)} · >1000: ${share(e10,x=>x>1000).toFixed(2)}`); }
  /* not ve adım 6–7: "Tek sütunla R² yine de yüksek (ortalama 0.96), ama doğru 130 km/sa'te
     mesafeyi 17 m kadar eksik söylüyor. x² ekleyince tahmin birkaç metreye kadar gerçeğe iniyor;
     x⁴'e kadar çıkınca kenar yine savruluyor." */
  const med=(a)=>{const x=[...a].sort((p,q)=>p-q);return x[x.length>>1];};
  const e1=err(B[1]), e2=err(B[2]).map(Math.abs), e4=err(B[4]).map(Math.abs);
  chk(mean(col(B[1],'r2'))>.94, "Fren mesafesi: tek sütunla R² yüksek (ortalama 0.96)", mean(col(B[1],'r2')).toFixed(3));
  chk(mean(e1)>-21&&mean(e1)<-14, "Fren mesafesi: doğru 130 km/sa'te mesafeyi 17 m kadar eksik söylüyor", `ort ${mean(e1).toFixed(1)} m`);
  /* 25 × 30 turda medyan sapma 3–7 m */
  chk(med(e2)<10&&med(e2)<Math.abs(mean(e1))/2, "Fren mesafesi: x² ile kenar tahmini birkaç metreye iniyor", `medyan sapma ${med(e2).toFixed(1)} m`);
  chk(med(e4)>3*med(e2), "Fren mesafesi: x⁴'te kenar yine savruluyor", `medyan ${med(e2).toFixed(1)} → ${med(e4).toFixed(1)} m`);
  /* not ve adım 8: "x² eklemek hatayı neredeyse hiç düşürmüyor … x³ ekleyince RMSE yaklaşık yarıya
     iniyor. Ama … 24. haftada fidanı 51 cm yerine sıfır boy civarına indiriyor; örneklemlerin
     yaklaşık yarısında tahmin eksiye düşüyor." · "Aralığın içinde R² 0.99" */
  const r21=mean(G[2].map((x,i)=>x.rm/G[1][i].rm)), r32=mean(G[3].map((x,i)=>x.rm/G[2][i].rm));
  chk(r21>.88, "Fidan boyu: x² RMSE'yi neredeyse hiç düşürmüyor", `oran ${r21.toFixed(2)}`);
  chk(r32>.45&&r32<.7, "Fidan boyu: x³ ile RMSE yaklaşık yarıya iniyor", `oran ${r32.toFixed(2)}`);
  chk(mean(col(G[3],'r2'))>=.985, "Fidan boyu: üç sütunla aralığın içinde R² 0.99", mean(col(G[3],'r2')).toFixed(3));
  const p3=col(G[3],'pe');
  chk(Math.abs(G[3][0].te-51)<1&&Math.abs(med(p3))<12, "Fidan boyu: 24. haftada 51 cm yerine sıfır boy civarı", `medyan tahmin ${med(p3).toFixed(1)} cm`);
  chk(share(p3,x=>x<0)>.28&&share(p3,x=>x<0)<.72, "Fidan boyu: örneklemlerin yaklaşık yarısında tahmin eksi", `pay ${share(p3,x=>x<0).toFixed(2)}`);
  mod.__pick(0);
}

/* ── 05 · Artık grafiği ("röntgen") ve « Elektrik · sıcaklık » (Hafta 5 senaryo 3) ──
   aria-label: "Artık grafiği: kenarlarda ortalama 41 MWh, ortada −81 MWh; artı/eksi 3 kez
   değişiyor (rastgele olsa ~9); desen var: gülümseme." ve "Parabolün dibi (en az tüketim):
   17.7 °C." 200 örneklemle ölçülen değerler not'ta: elektrik R² 0.48 → 0.93, gülümseme %92,
   x² desensiz %99; sıcaklık kubbe %88, x² desensiz %96. Burada 60 tur. */
{
  head("Modül 09 · artık grafiği ve « Elektrik · sıcaklık »");
  const {el,M}=boot(F); const mod=M.find(m=>m.id==='m-poly');
  const AR=()=>el('c-poly').getAttribute('aria-label')||'';
  const sv=(s)=>num(String(s).replace(/−/g,'-'));
  const share=(a,f)=>a.filter(f).length/a.length;
  P(el,'poly-vr',true);
  const run=(k,N)=>{ mod.__pick(k); const R={1:[],2:[],4:[]};
    for(let t=0;t<N;t++){ el('poly-new').click();
      for(const d of [1,2,4]){ S(el,'poly-d',d); el('poly-fit').click(); const a=AR();
        const ex=/model (−?[\d.]+) \S+, gerçek (−?[\d.]+)/.exec(a)||[], dv=/\(en az tüketim\): (−?[\d.]+)/.exec(a), hv=/\(en sıcak saat\): (\d\d):(\d\d)/.exec(a);
        R[d].push({r2:V(el,'poly-r2'), pat:(/desen var: ([^.;]+)\./.exec(a)||[])[1]||'yok', art:/Artık grafiği: /.test(a),
          vx:dv?sv(dv[1]):hv?(+hv[1]+hv[2]/60):NaN, pe:sv(ex[1]), te:sv(ex[2])}); } }
    return R; };
  const E=run(3,60), H=run(0,60);
  const col=(a,k)=>a.map(x=>x[k]);
  console.log(`       elektrik: R² ${mean(col(E[1],'r2')).toFixed(3)} → ${mean(col(E[2],'r2')).toFixed(3)} · gülümseme ${share(E[1],x=>x.pat==='gülümseme').toFixed(2)} · x² desensiz ${share(E[2],x=>x.pat==='yok').toFixed(2)} · dip medyan ${med(col(E[2],'vx')).toFixed(1)} °C`);
  console.log(`       elektrik 42 °C: doğru ${med(col(E[1],'pe')).toFixed(0)} · x² ${med(col(E[2],'pe')).toFixed(0)} · x⁴ sapma medyan ${med(E[4].map(x=>Math.abs(x.pe-x.te))).toFixed(0)} · gerçek ${E[1][0].te}`);
  console.log(`       sıcaklık: kubbe ${share(H[1],x=>x.pat==='kubbe').toFixed(2)} · x² desensiz ${share(H[2],x=>x.pat==='yok').toFixed(2)} · tepe medyan ${med(col(H[2],'vx').filter(Number.isFinite)).toFixed(2)} saat`);
  chk(E[1].every(x=>x.art), "artık grafiği görünümünde desen özeti hesaplanıyor (aria-label)");
  /* adım 10, not: "düz doğrunun R²'si ortalama 0.48 … artıklar %92'sinde gülümsüyor" */
  chk(mean(col(E[1],'r2'))>.4&&mean(col(E[1],'r2'))<.56, "Elektrik: düz doğrunun R²'si 0.5 civarı (adım 10, not)", mean(col(E[1],'r2')).toFixed(3));
  chk(share(E[1],x=>x.pat==='gülümseme')>=.8, "Elektrik: düz doğrunun artıkları gülümsüyor — iki uç artı, orta eksi (adım 10, not)", share(E[1],x=>x.pat==='gülümseme').toFixed(2));
  /* adım 11, not: "x² ile R² 0.93, desen kayboluyor, parabolün dibi 17–18 °C" · "18 °C civarında" */
  chk(mean(col(E[2],'r2'))>.9, "Elektrik: x² ile R² 0.9'un üstünde (adım 11, not 0.93)", mean(col(E[2],'r2')).toFixed(3));
  chk(share(E[2],x=>x.pat==='yok')>=.9, "Elektrik: x² ile artıklarda belirgin desen yok (adım 11)", share(E[2],x=>x.pat==='yok').toFixed(2));
  chk(Math.abs(med(col(E[2],'vx'))-18)<1&&share(E[2],x=>Math.abs(x.vx-18)<2)>=.9, "Elektrik: parabolün dibi 18 °C civarında (adım 11, not)", `medyan ${med(col(E[2],'vx')).toFixed(1)} °C`);
  /* adım 12, not: "42 °C'de doğru 655 MWh der, x²'li model 1931 (formüldeki gerçek 1937);
     4. derecede bu tahmin yine savruluyor" · Kendini sına 1 */
  const d2=E[2].map(x=>Math.abs(x.pe-x.te)), d4=E[4].map(x=>Math.abs(x.pe-x.te));
  chk(Math.abs(E[2][0].te-1937)<1, "Elektrik: 42 °C'nin gerçek değeri formülden 1937 MWh (not)", String(E[2][0].te));
  chk(med(d2)<150, "Elektrik: x²'li modelin 42 °C tahmini gerçeğe yakın (adım 12)", `medyan sapma ${med(d2).toFixed(0)} MWh`);
  chk(med(col(E[1],'pe'))<900, "Elektrik: düz doğru 42 °C'de tüketimi çok az söylüyor (not 655)", med(col(E[1],'pe')).toFixed(0));
  chk(med(d4)>3*med(d2), "Elektrik: 4. derecede 42 °C tahmini yine savruluyor (not)", `${med(d2).toFixed(0)} → ${med(d4).toFixed(0)} MWh`);
  /* sıcaklık notu: "doğrunun artıkları kubbe çiziyor … (%88); x² ile desen kayboluyor ve
     parabolün tepesi 15:00 civarına oturuyor" */
  chk(share(H[1],x=>x.pat==='kubbe')>=.75, "Gün içi sıcaklık: doğrunun artıkları kubbe çiziyor (not)", share(H[1],x=>x.pat==='kubbe').toFixed(2));
  chk(share(H[2],x=>x.pat==='yok')>=.85, "Gün içi sıcaklık: x² ile artıklarda desen kayboluyor (not)", share(H[2],x=>x.pat==='yok').toFixed(2));
  const hv=col(H[2],'vx').filter(Number.isFinite);
  chk(hv.length>=50&&Math.abs(med(hv)-15)<0.75, "Gün içi sıcaklık: parabolün tepesi 15:00 civarında (not)", `medyan ${med(hv).toFixed(2)} saat`);
  P(el,'poly-vm',true); mod.__pick(0);
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

/* ── 05 · kNN: ".ask: k=1'de eğitim hatası tam olarak sıfır" ── */
{
  head("Modül 13 · Komşuna bak (KNN)");
  /* karar bölgesi kapalı: her k değişiminde binlerce hücre yeniden oylanıyor (yavaş) */
  const {el}=boot(F); const e1=[], e21=[]; P(el,'knn-bnd',false);
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
  head("Modül 10 · Yüzde kaç? (logistic regression)");
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

/* ── 10 · Lojistik · odds, logit, odds ratio, birimli eksen, « Doğru uydur » (Hafta 6) ──
   Tuval metni sahte DOM'da okunmuyor; seçili x'in hesabı ve doğru uydurma satırları
   tuvalin aria-label'ında. PK() dosyada daha aşağıda const (TDZ): seçici burada kurulur. */
{
  head("Modül 10 · odds, logit, odds ratio ve « Doğru uydur »");
  const {el,M,tick}=boot(F); const pick=(j)=>M.find(x=>x.id==='m-log').__pick(j);
  const AR=()=>el('c-log').getAttribute('aria-label')||'';
  /* adım 5: "β₀ = −2.8, β₁ = 0.050. 60 saat: z = 0.20, p̂ = 0.55. Odds = 1.22 … Logit = 0.20, z'nin kendisi" */
  pick(1); P(el,'lg-lin',false); S(el,'lg-w',50); S(el,'lg-b',-28); S(el,'lg-x',120);
  chk(T(el,'lg-wo')==='0.050'&&T(el,'lg-bo')==='−2.8'&&T(el,'lg-xo')==='60.0 saat', "kaydırıcılar verinin biriminde: β₁ = 0.050 saat başına, β₀ = −2.8, x = 60 saat (adım 5)", `${T(el,'lg-wo')} · ${T(el,'lg-bo')} · ${T(el,'lg-xo')}`);
  chk(/z = 0\.20, p̂ = 0\.550, odds = 1\.22, logit = 0\.20;/.test(AR())&&T(el,'lg-odds')==='1.22', "60 saat: z = 0.20, p̂ 0.55, odds 1.22, logit = z (adım 5, ex)", T(el,'lg-odds'));
  /* ex 3. adım ve not: "sınır 56 saat" — Hafta 6: sınır birimle okunur */
  chk(T(el,'lg-bnd')==='56.0 saat', "decision boundary verinin biriminde: 2.8 / 0.05 = 56.0 saat (ex, not)", T(el,'lg-bnd'));
  /* adım 6: "her saat odds'u e^β₁ = 1.05 ile çarpar … 80 saatte 3.32, p̂ 0.77" */
  chk(T(el,'lg-or')==='1.05', "odds ratio e^β₁ = e^0.05 ≈ 1.05 (adım 6)", T(el,'lg-or'));
  const o60=Math.exp(+(/z = (−?[\d.]+), p̂/.exec(AR())[1].replace('−','-')));
  S(el,'lg-x',160);
  const pz=/z = (−?[\d.]+), p̂ = ([\d.]+), odds/.exec(AR());
  chk(T(el,'lg-odds')==='3.32'&&Math.abs(+pz[2]-0.77)<0.005, "80 saat: odds 3.32, p̂ 0.77 (adım 6, ex)", `${T(el,'lg-odds')} · p̂ ${pz[2]}`);
  chk(Math.abs(Math.exp(+pz[1])/o60-Math.E)<0.03, "20 saat daha: z 1 artıyor, odds e ≈ 2.718 katına çıkıyor (adım 6)", (Math.exp(+pz[1])/o60).toFixed(3));
  /* ders notu · Seçili x: "odds = p̂ / (1 − p̂) = e^z ve logit = ln(odds), yani yine z" — rastgele ayarlarda */
  let tut=0; const N=20;
  /* p̂ üç ondalıkla, odds üç anlamlı basamakla yazılıyor: p̂ / (1 − p̂)'yi yuvarlanmış p̂'den
     hesaplamak uçlarda (p̂ 0.002, 0.999) %20 sapıyordu. Ters yönden sınanır: odds / (1 + odds) = p̂;
     pay iki yuvarlamanın toplamı (p̂ ±0.0005, odds ±%0.3 → ±0.0008). */
  for(let t=0;t<N;t++){ pick(t%3); S(el,'lg-w',-60+6*t); S(el,'lg-b',25-2.5*t); S(el,'lg-x',10*t);
    const m=/z = (−?[\d.]+), p̂ = ([\d.]+), odds = ([\d.e+-]+), logit = (−?[\d.]+);/.exec(AR());
    if(!m) continue; const z=+m[1].replace('−','-'), p=+m[2], o=+m[3];
    if(m[1]===m[4]&&Math.abs(Math.log(o)-z)<=0.011&&Math.abs(o/(1+o)-p)<=0.0015) tut++; }
  chk(tut===N, "odds = p̂ / (1 − p̂) = e^z ve logit = z her ayarda (ders notu · Seçili x)", `${tut}/${N}`);
  /* ders notu · S eğrisi: "Yatay eksen verinin biriminde (mm, saat, m/s)" */
  pick(0); S(el,'lg-w',40); S(el,'lg-b',-20);
  const u0=T(el,'lg-bnd'); pick(2); S(el,'lg-w',40); S(el,'lg-b',-20); const u2=T(el,'lg-bnd');
  chk(u0==='20.0 mm'&&u2==='10.0 m/s', "aynı sigmoid, iki kümede iki birim: 20.0 mm / 10.0 m/s (ders notu · S eğrisi)", `${u0} · ${u2}`);
  /* adım 7 ve not: 12 öğrencinin doğrusu 0 saatte −0.14, 20 saatte 1.82; sınır 6.5 → 7.5 saat;
     logistic regression'ınki iki durumda da 6.4 saat */
  pick(3); P(el,'lg-lin',true);
  chk(/least squares, 12 öğrenci: x = 0 → −0\.14 · x = 20 saat → 1\.82;/.test(AR()), "12 öğrenci: doğru 0 saatte −0.14, 20 saatte 1.82 der — olasılık olamaz (adım 7, not)");
  chk(/doğrunun sınırı 6\.5 saat → uzak öğrenciyle 7\.5 saat;/.test(AR()), "40 saatlik tek öğrenci doğrunun sınırını 6.5'ten 7.5 saate kaydırıyor (adım 7, not)");
  chk(/logistic regression sınırı 6\.4 saat → 6\.4 saat\./.test(AR()), "logistic regression'ın sınırı yerinde: 6.4 → 6.4 saat (adım 7, not)");
  S(el,'lg-w',238); S(el,'lg-b',-38); S(el,'lg-x',35);
  chk(T(el,'lg-bnd')==='6.4 saat'&&/Seçili x = 7\.0 saat: z = 0\.37, p̂ = 0\.59/.test(AR()), "adım 7'nin sigmoid'i: sınır 6.4 saat, 7 saate p̂ 0.59", T(el,'lg-bnd'));
  /* « Eğit » de aynı yere iniyor (en çok olabilirlik 6.45 saat; gradient descent 400 adımda) */
  el('lg-fit').click(); tick(600); if(T(el,'lg-fit')!=='Eğit') tick(600);
  chk(T(el,'lg-fit')==='Eğit'&&Math.abs(V(el,'lg-bnd')-6.45)<=0.15, "uzak öğrenci kümesinde « Eğit » de 6.4–6.5 saate iniyor", T(el,'lg-bnd'));
  el('lg-new').click();
  chk(T(el,'lg-it')==='0'&&/13 nokta/.test(AR())&&/7\.5 saat/.test(AR()), "« Yeni veri » aynı 13 öğrenciyi getiriyor (not)");
  /* .head ve ders notu · Doğru uydur: "sınıflandırmada 0'ın altına, 1'in üstüne taşar" — rastgele kümelerde */
  let tas=0, top=0;
  for(const j of [0,1,2]) for(let t=0;t<8;t++){ pick(j); top++;
    const m=/least squares doğrusu: x = 0 → (−?[\d.]+) · x = [\d.]+ \S+ → (−?[\d.]+);/.exec(AR());
    if(m&&+m[1].replace('−','-')<0&&+m[2]>1) tas++; }
  chk(tas===top, "doğru eksenin iki ucunda da 0–1'in dışına taşıyor (.head, ders notu · Doğru uydur)", `${tas}/${top}`);
  P(el,'lg-lin',false); pick(0);
}

/* ── 06 · Karar ağacı: düğme kaydırıcının ulaşabildiği en iyi bölmeyi buluyor ──
   İki ölçütle de (Gini ve entropi): ağaç, eşik eğrisi ve göstergeler seçilen
   ölçütle kuruluyor, « En iyi bölmeyi bul » da onunla aramalı. */
{
  head("Modül 14 · Bölerek karar ver (decision tree)");
  const {el}=boot(F);
  let lost=0; const d1=[], d5=[], ax=[], tq=[], gain=[];
  for(const c of ['dt-gini','dt-ent']) for(let t=0;t<6;t++){
    el(c).click(); el('dt-demo').click(); el('dt-best').click();
    const g=V(el,'dt-g1');
    let gmin=Infinity;
    for(let i=2;i<=98;i++){ S(el,'dt-t',i); const x=V(el,'dt-g1'); if(x<gmin) gmin=x; }
    if(gmin<g-1e-9) lost++;
    el('dt-best').click();                              // tarama eşiği bozdu, geri koy
    S(el,'dt-d',1); d1.push(V(el,'dt-acc'));
    S(el,'dt-d',5); d5.push(V(el,'dt-acc'));
    S(el,'dt-d',1);
  }
  el('dt-gini').click();
  for(let t=0;t<20;t++){ el('dt-demo').click(); el('dt-best').click();
    ax.push(el('dt-av').getAttribute('aria-pressed')==='true'); tq.push(V(el,'dt-to')); gain.push(V(el,'dt-gain')); }
  console.log(`       eğitim doğruluğu: derinlik 1 ort %${mean(d1).toFixed(1)} → derinlik 5 ort %${mean(d5).toFixed(1)}`);
  console.log(`       en iyi kök: dikey eksen ${ax.filter(Boolean).length}/20 · sıcaklık eşiği medyan ${med(tq)} [${Math.min(...tq)}–${Math.max(...tq)}]`);
  chk(lost===0, "'En iyi bölmeyi bul' kaydırıcı ızgarasında yenilmiyor (Gini ve entropi)", `${lost}/12 yenildi`);
  chk(mean(d5)>mean(d1), "derinlik artınca eğitim doğruluğu yükseliyor", `%${mean(d1).toFixed(1)} → %${mean(d5).toFixed(1)}`);
  /* adım 3: "Bu veride kazanan hep sıcaklık: 21 °C civarında bir eşik" (40 çekimde 40/40,
     eşik 18.4–23.7, medyan 20.6) */
  chk(ax.every(Boolean), "Bağ verisinde en iyi kök sorusu hep sıcaklık (adım 3)", `${ax.filter(Boolean).length}/20`);
  chk(med(tq)>=19.5&&med(tq)<=22.5, "kök eşiği 21 °C civarı, veri biriminde yazılıyor (adım 3)", `medyan ${med(tq)}`);
  chk(mean(gain)>0.02, "Gini kazancı en iyi bölmede belirgin (adım 3)", `ort ${mean(gain).toFixed(3)}`);
  /* adım 1: "Eşik verinin kendi biriminde yazıyor: nem %70" — kaydırıcı 50, yatay eksen */
  el('dt-au').click(); S(el,'dt-t',50);
  const ar=el('c-dt').getAttribute('aria-label')||'';
  chk(T(el,'dt-to')==='70' && /kök nem < 70 /.test(ar), "kaydırıcının ortası « nem < 70 » (adım 1, brief: 0.50 değil)", `${T(el,'dt-to')} · ${ar.slice(0,60)}`);
}

/* ── 09 · Aşırı öğrenme: Durum göstergesi en iyi derecede uyarı VERMEMELİ ── */
{
  head("Modül 03 · Ezber mi, öğrenme mi (overfitting)");
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
  /* 300 örneklemde biri 0.005'i aşıyordu (iki x birbirine çok yakın düşünce çözüm kötü
     koşullanıyor): her koşunun ~%3'ü bu tek örneklemden düşüyordu. 10'da 9 + üst sınır. */
  chk(trQ.filter(v=>v<0.005).length>=9&&Math.max(...trQ)<0.05, "14. derece eğri bütün eğitim noktalarından geçiyor (QR)",
      `${trQ.filter(v=>v<0.005).length}/10 · max ${Math.max(...trQ).toExponential(2)}`);
}

/* ── 03 · Temel model, test R² ve öğrenme eğrisi (Hafta 3 Soru 4, Hafta 4 teşhis) ──
   Test R² ve rozet tek örneklemden okunuyor (20 tur, medyan / pay). Öğrenme eğrisi
   tohumlu (21 örneklemin medyanı): aynı veri kümesi + gürültü + derecede birebir aynı
   sayılar, o yüzden tek okuma yeterli; eşikler ölçülen değerlerin çevresinde. */
{
  head("Modül 03 · temel model, test R² ve öğrenme eğrisi");
  const {el,M}=boot(F); const mf=M.find(m=>m.id==='m-fit');
  const AR=()=>el('c-fit').getAttribute('aria-label')||'';
  const sv=(s)=>num(String(s).replace(/−/g,'-'));
  const N=20; P(el,'fit-byd',true);
  /* adım 3: "« Test R² » eksiye düştü: model … temel modelden bile kötü" (20/20 ölçüldü) */
  let neg=0;
  for(let t=0;t<N;t++){ mf.__pick(0); S(el,'fit-n',12); S(el,'fit-m',14); S(el,'fit-d',14); if(sv(T(el,'fit-vr2'))<0) neg++; }
  chk(neg>=19, "14. derecede test R² eksi: temel modelden kötü (adım 3)", `${neg}/${N}`);
  /* adım 6 ve Kendini sına 3 (Hafta 3 Soru 4): titreşimde düz doğru — test hatası temel
     modele neredeyse eşit, R² sıfıra yakın, rozet « Yetersiz ». Ölçüm: medyan 0.01, 20/20. */
  const r2=[]; let yet=0;
  for(let t=0;t<N;t++){ mf.__pick(2); S(el,'fit-m',14); S(el,'fit-d',1); r2.push(sv(T(el,'fit-vr2'))); if(T(el,'fit-vs')==='Yetersiz') yet++; }
  console.log(`       titreşim 1. derece: test R² medyan ${med(r2).toFixed(3)} · « Yetersiz » ${yet}/${N}`);
  chk(Math.abs(med(r2))<0.15, "titreşimde 1. derece: test R² sıfıra yakın (adım 6)", `medyan ${med(r2).toFixed(3)}`);
  chk(yet>=19, "titreşimde 1. derece: rozet « Yetersiz » (adım 6, Soru 4)", `${yet}/${N}`);
  /* ders notu · Göstergeler: "test hatası temel modele çok yakınsa (test R² 0.2'nin altında)
     da « Yetersiz » der". Üç veri kümesi × derece 1–14: R² < 0.2 olan her durumda rozet
     Yetersiz ya da (ezber R²'yi de eksiye indirir) Aşırı öğrenme olmalı. */
  let low=0, wrong=0;
  for(const j of [0,1,2]) for(let t=0;t<4;t++){ mf.__pick(j); S(el,'fit-m',14);
    for(let d=1;d<=14;d++){ S(el,'fit-d',d); if(sv(T(el,'fit-vr2'))<0.2){ low++; if(T(el,'fit-vs')==='Dengede') wrong++; } } }
  chk(low>0&&wrong===0, "test R² 0.2'nin altındayken rozet hiçbir zaman « Dengede » demiyor (ders notu · Göstergeler)", `${low} durumda ${wrong} yanlış`);
  /* öğrenme eğrisi (adım 7–8, .ask, ders notu). aria-label: "20 örnekte eğitim 0.057, test 22.823; …" */
  P(el,'fit-byn',true);
  const lc=()=>{ const a=AR(), g=(m)=>{const r=new RegExp(m+' örnekte eğitim (\\d+\\.\\d+), test (\\d+(?:\\.\\d+)?(?:e\\+?\\d+)?)').exec(a); return r?{tr:+r[1],te:+r[2]}:{tr:NaN,te:NaN};};
    return {a20:g(20),a50:g(50),a100:g(100),a200:g(200),base:num((/Temel model test RMSE ([\d.]+)/.exec(a)||[])[1])}; };
  mf.__pick(0); S(el,'fit-n',12); S(el,'fit-m',14); S(el,'fit-d',14); const V14=lc();
  const gap=(e)=>e.te-e.tr;
  console.log(`       sıcaklık 14. derece: 20 → ${V14.a20.tr}/${V14.a20.te} · 50 → ${V14.a50.tr}/${V14.a50.te} · 100 → ${V14.a100.tr}/${V14.a100.te} · 200 → ${V14.a200.tr}/${V14.a200.te}`);
  /* "20 örnekte eğitim hatası sıfıra yakın, test hatası ölçeğin dışında" (ölçek tavanı 1.26) */
  chk(V14.a20.tr<0.08&&V14.a20.te>1.26, "öğrenme eğrisi 14. derece: 20 örnekte eğitim sıfıra yakın, test ölçeğin dışında (adım 7)", `${V14.a20.tr} / ${V14.a20.te}`);
  /* "Örnek arttıkça boşluk kapanıyor; 200 örnekte iki eğri de gürültü tabanına (0.12) iniyor" */
  chk(gap(V14.a20)>gap(V14.a50)&&gap(V14.a50)>gap(V14.a100)&&gap(V14.a100)>gap(V14.a200)&&gap(V14.a200)<0.03,
      "öğrenme eğrisi 14. derece: boşluk veri arttıkça kapanıyor (adım 7)", `boşluk ${gap(V14.a20).toFixed(2)} → ${gap(V14.a50).toFixed(3)} → ${gap(V14.a100).toFixed(3)} → ${gap(V14.a200).toFixed(3)}`);
  chk(Math.abs(V14.a200.te-0.12)<0.02&&Math.abs(V14.a200.tr-0.12)<0.02, "200 örnekte iki eğri de gürültü tabanında (adım 7)", `${V14.a200.tr} / ${V14.a200.te}`);
  /* "eğri titremesin": tohumlu — « Yeni veri » ve derece gidip gelince aynı sayılar */
  const before=AR(); el('fit-new').click(); S(el,'fit-d',4); S(el,'fit-d',14);
  chk(AR()===before, "öğrenme eğrisi « Yeni veri » ve derece gidip gelince değişmiyor (titremiyor)");
  /* adım 8: "Titreşim, 1. derece: iki eğri baştan birbirine yakın ve 0.5 civarında, temel
     model çizgisinin hemen altında birleşiyor; 200 örnekte de aynı yerdeler" */
  mf.__pick(2); S(el,'fit-n',12); S(el,'fit-d',1); const V1=lc();
  console.log(`       titreşim 1. derece: 20 → ${V1.a20.tr}/${V1.a20.te} · 200 → ${V1.a200.tr}/${V1.a200.te} · temel ${V1.base}`);
  chk(gap(V1.a20)<0.06&&Math.abs(gap(V1.a200))<0.02, "öğrenme eğrisi 1. derece: iki eğri baştan yakın, sonda birleşik (adım 8)", `boşluk ${gap(V1.a20).toFixed(3)} → ${gap(V1.a200).toFixed(3)}`);
  chk(V1.a200.te>0.45&&V1.a200.te<0.55&&V1.a200.te<V1.base&&V1.a200.te>0.9*V1.base,
      "0.5 civarında, temel model çizgisinin hemen altında (adım 8)", `test ${V1.a200.te} · temel ${V1.base}`);
  chk(Math.abs(V1.a50.te-V1.a200.te)<0.02, "veri eklemek hiçbir şey değiştirmiyor (adım 8)", `50 → ${V1.a50.te}, 200 → ${V1.a200.te}`);
  P(el,'fit-byd',true);
}

/* ── 12 · Gradyan inişi: kaydırıcının ULAŞABİLDİĞİ bir değerde ıraksamalı ── */
{
  head("Modül 08 · Yamaçtan aşağı (gradient descent)");
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

/* ── 13 · Eşik: precision ↑ recall ↓, AUC eşikten bağımsız ── */
{
  head("Modül 11 · Eşiği nereye koyalım (precision / recall)");
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

/* ── 15 · k-ortalamalar: WCSS atama öncesi yalan söylememeli, sonra hep azalmalı ── */
{
  head("Modül 18 · Etiketsiz gruplama (k-ortalamalar)");
  const {el}=boot(F);
  chk(T(el,'km-j')==="—", "atama yapılmadan WCSS '—' (0.0000 'mümkün en iyi' yalanıydı)", T(el,'km-j'));
  const seq=[];
  for(let i=0;i<12;i++){ el('km-step').click(); const j=V(el,'km-j'); if(Number.isFinite(j)) seq.push(j); }
  console.log(`       WCSS dizisi: ${seq.map(x=>x.toFixed(3)).join(' → ')}`);
  const rise=seq.filter((v,i)=>i&&v>seq[i-1]+1e-9).length;
  chk(seq.length>2, "adımlar WCSS üretiyor");
  chk(rise===0, "algoritmanın küçülttüğü nicelik hiçbir adımda artmıyor", `${rise} artış`);
  el('km-ir').click();   // « Rastgele »ye yeniden basmak = yeni başlangıç (eski « Merkezleri yeniden at »)
  chk(T(el,'km-j')==="—", "merkezler yeniden atılınca gösterge tekrar '—'", T(el,'km-j'));
}

/* ── 16 · Kaç küme: ayrık veride her iki ölçüt de gerçek k'yı bulmalı ── */
{
  head("Modül 19 · Kaç küme var? (elbow / silhouette)");
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

/* ── 18 · PCA: uzama kaydırıcısı yuvarlak ↔ uzun karşıtlığını KURMALI ── */
{
  head("Modül 17 · İki sayı yerine bir (PCA)");
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

/* ── 19 · Perceptron: ayrılabilirde durur, XOR'da durmaz ── */
{
  head("Modül 22 · Tek nöron öğreniyor (perceptron)");
  const go=(j)=>{const {el,tick,M}=boot(F); M.find(x=>x.id==='m-per').__pick(j); el('per-run').click(); tick(900);
    return {m:V(el,'per-m'), u:V(el,'per-u'), raw:T(el,'per-m')};};
  const sep=go(0), xor=go(1);
  console.log(`       ayrılabilir: yanlış=${sep.raw} güncelleme=${sep.u}`);
  console.log(`       XOR        : yanlış=${xor.raw} güncelleme=${xor.u}`);
  chk(sep.m===0, "ayrılabilir veride yanlış sınıflanan sıfıra düşüyor (yakınsama teoremi)", sep.raw);
  chk(xor.m>0, "XOR'da hiç duramıyor — tek katman düz çizgiden başkasını çizemez", xor.raw);
  chk(xor.u>sep.u*10, "XOR'da güncellemeler bitmiyor", `${sep.u} vs ${xor.u}`);
}

/* ── 21 · Konvolüsyon: dört hiperparametre ve BOYUT FORMÜLÜ ──
   Modülün ekranda yazdığı formül: çıktı = ⌊(girdi + 2·dolgu − çekirdek)/adım⌋ + 1.
   .ask kutusu bunun üç somut sonucunu vaat ediyor (5×5 → 124, dolgu 2 → 128,
   stride 2 → yarısı) — üçü de burada sınanıyor, ayrıca 54 kombinasyonun
   tamamında gösterge formülle karşılaştırılıyor. */
{
  head("Modül 26 · Filtre gezdirmek (convolution)");
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

/* ── 05 · k-NN · "Baz istasyonu": kapsama alanı bir HALKA ── */
{
  head("Modül 13 · veri kümesi « Baz istasyonu » (halka)");
  const {el,M}=boot(F); P(el,'knn-bnd',false); const e1=[],e5=[],e21=[];
  for(let t=0;t<12;t++){ PK(M,'m-knn',1);
    S(el,'knn-k',1);  e1.push(V(el,'knn-e'));
    S(el,'knn-k',5);  e5.push(V(el,'knn-e'));
    S(el,'knn-k',21); e21.push(V(el,'knn-e')); }
  console.log(`       eğitim hatası: k=1 %${mean(e1).toFixed(1)} · k=5 %${mean(e5).toFixed(1)} · k=21 %${mean(e21).toFixed(1)}`);
  chk(mean(e5)<9, "k-NN halka sınırını öğreniyor (note: 'k-NN eğri sınırı hiç zorlanmadan öğrenir')", `k=5 → %${mean(e5).toFixed(1)}`);
  chk(mean(e21)>15, "k=21'de halka eriyip kayboluyor (adım 5)", `k=21 → %${mean(e21).toFixed(1)}`);
  chk(e1.every(x=>x===0), "k=1 bu veride de tam olarak %0 (ezber her veri kümesinde ezber)", `max %${Math.max(...e1)}`);
}

/* ── 05 · k-NN · "Kredi riski": sınıflar iç içe ── */
{
  head("Modül 13 · veri kümesi « Kredi riski » (gürültülü sınır)");
  const {el,M}=boot(F); P(el,'knn-bnd',false); const e1=[],e21=[];
  for(let t=0;t<12;t++){ PK(M,'m-knn',2);
    S(el,'knn-k',1);  e1.push(V(el,'knn-e'));
    S(el,'knn-k',21); e21.push(V(el,'knn-e')); }
  console.log(`       eğitim hatası: k=1 %${mean(e1).toFixed(1)} · k=21 %${mean(e21).toFixed(1)}`);
  chk(e1.every(x=>x===0), "k=1 gürültüyü ezberliyor: hata %0 (note: 'k = 1 bu gürültüyü ezberler')");
  chk(mean(e21)>10, "aynı veride k=21 dürüst bir hata gösteriyor", `%${mean(e21).toFixed(1)}`);
}

/* ── 09 · Aşırı öğrenme · "doğru derece veriye bağlı" ──
   İki ölçüt: (a) 3. derecede "Yetersiz" rozeti kaç turda çıkıyor, (b) test RMSE'yi
   en küçük yapan derece kaç turda 5 ve üstünde. Durum rozeti tek örneklemde
   zıplıyor (14 nokta + 0.12 gürültü), o yüzden 16 tur sayılıyor. Ölçüm:
   Ölçüm (100 örneklem, üstel gösterimi doğru okuyan num() ile): 3. derecede
   "Yetersiz" oranı sıcaklıkta %17, doygunlukta %7, titreşimde %79 — gürültü seviyesi
   bu oranları değiştirmiyor. Eşikler dağılımların ~3 σ ötesine konuldu (30 turda 18);
   daha dar eşiklerle (24'te 18) on koşudan ikisi kırılganlıktan düşüyordu. */
{
  head("Modül 03 · üç eğri, üç ayrı « doğru derece »");
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

/* ── 12 · Gradyan inişi · üç hata yüzeyi ── */
{
  head("Modül 08 · üç hata yüzeyi (convex / dik kanyon)");
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

/* ── 08 · Gradyan inişi · « Beş öğrenci · β₁ » (Hafta 5 · sl. 35): sunumun dört α senaryosu ──
   β₀ = 44 sabit, J(β₁) = 1.2 + 44·(β₁ − 4)², başlangıç β₁ = 0. Sayılar birebir sunumdaki. */
{
  head("Modül 08 · Beş öğrenci · β₁ (dört learning rate)");
  const {el,M,tick}=boot(F);
  PK(M,'m-gd',3);
  /* not: "Bu yüzeyde learning rate kaydırıcısı 0.001 ile 0.030 arasında"; "β₁ = 0'dan, J = 705.2" */
  chk(+el('gd-lr').min===1&&+el('gd-lr').max===30&&T(el,'gd-lro')==='0.010', "learning rate kaydırıcısı bu yüzeyde 0.001–0.030 (not)", `${el('gd-lr').min}–${el('gd-lr').max} · ${T(el,'gd-lro')}`);
  chk(T(el,'gd-x')==='0.000'&&T(el,'gd-l')==='705.200'&&T(el,'gd-k1')==='β₁'&&T(el,'gd-k2')==='J(β₁)', "başlangıç β₁ = 0, J = 705.2; göstergeler β₁ der (not, ders notu)", `${T(el,'gd-x')} · ${T(el,'gd-l')} · ${T(el,'gd-k1')}`);
  const walk=(lr,k)=>{S(el,'gd-lr',lr); S(el,'gd-x0',0); const xs=[],Ls=[];
    for(let i=0;i<k;i++){ el('gd-step').click(); xs.push(V(el,'gd-x')); Ls.push(V(el,'gd-l')); } return {xs,Ls};};
  const a=walk(2,10);
  chk(Math.abs(a.xs[9]-3.42)<0.005&&T(el,'gd-i')==='10', "α = 0.002: on adımda β₁ ancak 3.42 (adım 6, not)", a.xs[9]);
  const b=walk(10,3);
  chk(Math.abs(b.xs[0]-3.52)<0.005&&Math.abs(b.xs[2]-3.99)<0.005, "α = 0.01: ilk adımda 3.52, üçüncüde 3.99 (adım 7, not)", b.xs.join(' → '));
  /* adım 8: "dibin üstünden atlıyor, karşı yamaca konuyor … her seferinde biraz daha yaklaşıyor ve sonunda dibe varıyor" */
  const c=walk(20,8), zz=c.xs.every((x,i)=>i===0||Math.sign(x-4)!==Math.sign(c.xs[i-1]-4)),
        yak=c.xs.every((x,i)=>i===0||Math.abs(x-4)<Math.abs(c.xs[i-1]-4));
  chk(zz&&yak, "α = 0.02: dibin iki yanında zikzak, her adımda biraz daha yakın (adım 8)", c.xs.map(x=>x.toFixed(2)).join(' '));
  const koş=(lr)=>{S(el,'gd-lr',lr); S(el,'gd-x0',0); el('gd-run').click(); tick(600);
    if(T(el,'gd-run')!=='Koştur') tick(600); return {st:T(el,'gd-s'), x:V(el,'gd-x'), bitti:T(el,'gd-run')==='Koştur'};};
  const k20=koş(20);
  chk(k20.bitti&&/Global/.test(k20.st)&&Math.abs(k20.x-4)<0.001, "α = 0.02 sonunda dibe varıyor: β₁ = 4 (adım 8, not)", `${k20.st} ${k20.x}`);
  /* adım 9: "Dört adımda maliyet 705'ten 3028'e çıktı; Sonuç 'Yükseliyor' diyor" */
  const d=walk(25,4);
  chk(Math.abs(d.Ls[3]-3028)<1&&d.Ls.every((L,i)=>L>(i?d.Ls[i-1]:705.2)), "α = 0.025: J her adımda büyüyor, dört adımda 705 → 3028 (adım 9, not)", d.Ls.map(L=>L.toFixed(0)).join(' → '));
  chk(T(el,'gd-s')==='Yükseliyor', "ıraksarken Sonuç 'İniyor' değil 'Yükseliyor' diyor (adım 9)", T(el,'gd-s'));
  /* not ve adım 9: "Sınır α = 2 / 88 ≈ 0.0227" — kaydırıcının iki komşu adımı iki yanında */
  const k22=koş(22), k23=koş(23);
  chk(/Global/.test(k22.st)&&/raksad/.test(k23.st), "sınır 2/88 ≈ 0.0227: 0.022 varıyor, 0.023 ıraksıyor (not, adım 9)", `0.022 → ${k22.st} · 0.023 → ${k23.st}`);
  /* öteki yüzeye dönünce kaydırıcı eski aralığına ve α 0.06'ya döner (0.06 beş öğrencide ıraksardı) */
  PK(M,'m-gd',0);
  chk(+el('gd-lr').max===650&&T(el,'gd-lro')==='0.060'&&T(el,'gd-k1')==='θ', "öteki yüzeyde kaydırıcı 0.001–0.650 ve θ'ya dönüyor", `${el('gd-lr').max} · ${T(el,'gd-lro')} · ${T(el,'gd-k1')}`);
}

/* ── 06 · Karar ağacı · "Sahte işlem": pozitif sınıf bir kutunun içinde ── */
{
  head("Modül 14 · veri kümesi « Sahte işlem » (tek eşik yetmiyor)");
  const {el,M}=boot(F); const d1=[],d3=[];
  for(let t=0;t<10;t++){ PK(M,'m-dt',1); el('dt-best').click();
    S(el,'dt-d',1); d1.push(V(el,'dt-acc'));
    S(el,'dt-d',3); d3.push(V(el,'dt-acc')); }
  console.log(`       eğitim doğruluğu: derinlik 1 → %${mean(d1).toFixed(1)} · derinlik 3 → %${mean(d3).toFixed(1)}`);
  chk(mean(d3)-mean(d1)>8, "iki eşik bir eşikten belirgin biçimde iyi (adım 5: 'tek eşikle kutuyu ayıramıyoruz')",
      `+${(mean(d3)-mean(d1)).toFixed(1)} puan`);
  chk(mean(d1)<92, "derinlik 1 kutuyu ayıramıyor", `%${mean(d1).toFixed(1)}`);
  /* not: "Test doğruluğu derinlik 1'de %79, derinlik 2'de %92" (40 çekim: 79 / 92) */
  const t1=[],t2=[];
  for(let t=0;t<16;t++){ PK(M,'m-dt',1); el('dt-best').click();
    S(el,'dt-d',1); t1.push(V(el,'dt-tacc')); S(el,'dt-d',2); t2.push(V(el,'dt-tacc')); }
  console.log(`       test doğruluğu: derinlik 1 → %${mean(t1).toFixed(1)} · derinlik 2 → %${mean(t2).toFixed(1)}`);
  chk(Math.abs(mean(t1)-79)<=5 && Math.abs(mean(t2)-92)<=4, "test doğruluğu derinlik 1'de ~%79, 2'de ~%92 (not)", `%${mean(t1).toFixed(1)} → %${mean(t2).toFixed(1)}`);
}

/* ── 07 · Orman · "Pivot sulama": sınır kapalı bir eğri ── */
{
  head("Modül 15 · veri kümesi « Pivot sulama » (halka sınır)");
  const {el,M,tick}=boot(F); const oob=[],one=[];
  for(let t=0;t<8;t++){ PK(M,'m-ens',1); S(el,'ens-d',4); S(el,'ens-k',40); tick(50);
    oob.push(V(el,'ens-oob')); one.push(V(el,'ens-one')); }
  console.log(`       40 ağaç OOB %${mean(oob).toFixed(1)} · tek ağaç OOB %${mean(one).toFixed(1)}`);
  chk(mean(oob)-mean(one)>2, "topluluk halka sınırında da tek ağacı geçiyor (adım 7)",
      `+${(mean(oob)-mean(one)).toFixed(1)} puan`);
}

/* ── 15 · Orman · "Abonelik": güçlü sütun, kökte aynı soru, ρ ──
   .ask 2. paragraf, adım 5–6 ve veri kümesi notu: bagging'de 40 ağacın 40'ı kökte
   x₁'i soruyor, random forest'ta 20 civarı (P = m/p = 1/2); tek ağaç 2–3 puan
   geriliyor, ormanın OOB'si düşmüyor. Ölçüm (20 veri): kök 40.0 → 19.9 (14–27),
   tek ağaç −2.5 (20/20), orman +0.5. */
{
  head("Modül 15 · « Abonelik » (kökte aynı soru · m/p)");
  const {el,M}=boot(F); const rb=[],rr=[],tb=[],tr=[],ob=[],or=[],ri=[];
  for(let t=0;t<16;t++){ PK(M,'m-ens',2); P(el,'ens-id',false); el('ens-hard').click(); S(el,'ens-d',4); S(el,'ens-k',40);
    el('ens-m2').click(); rb.push(V(el,'ens-root')); tb.push(V(el,'ens-one')); ob.push(V(el,'ens-oob'));
    el('ens-m1').click(); rr.push(V(el,'ens-root')); tr.push(V(el,'ens-one')); or.push(V(el,'ens-oob'));
    P(el,'ens-id',true); ri.push(V(el,'ens-root')); P(el,'ens-id',false); }
  console.log(`       kökte x₁: bagging ${mean(rb).toFixed(1)}/40 · random forest ${mean(rr).toFixed(1)}/40 (${Math.min(...rr)}–${Math.max(...rr)}) · kimlikle RF ${mean(ri).toFixed(1)}/40`);
  console.log(`       tek ağaç OOB: bagging %${mean(tb).toFixed(1)} → RF %${mean(tr).toFixed(1)} · orman: %${mean(ob).toFixed(1)} → %${mean(or).toFixed(1)}`);
  chk(mean(rb)>=39, "bagging'de 40 ağacın (neredeyse) hepsi kökte x₁'i soruyor (adım 5)", `${mean(rb).toFixed(1)}/40`);
  chk(mean(rr)>=16&&mean(rr)<=24, "random forest'ta kökte x₁ soran 20 civarı: P = m/p = 1/2 (adım 6, .ask)", `${mean(rr).toFixed(1)}/40`);
  chk(Math.min(...rr)>=10&&Math.max(...rr)<=30, "tek tek veri kümelerinde de yarıya yakın (not: en az 14, en çok 27)", `${Math.min(...rr)}–${Math.max(...rr)}`);
  chk(mean(ri)>=10&&mean(ri)<=17, "kimlik sütunu açıkken kökte x₁ soran üçte bir civarı (p = 3, ders notu · Göstergeler)", `${mean(ri).toFixed(1)}/40`);
  chk(mean(tb)-mean(tr)>=1&&mean(tb)-mean(tr)<=4.5, "random forest'ta tek ağaç OOB'si 2–3 puan geriliyor (adım 6, .ask)", `−${(mean(tb)-mean(tr)).toFixed(1)} puan`);
  chk(mean(or)>=mean(ob)-0.5, "ama ormanın OOB'si düşmüyor (adım 6, .ask)", `${(mean(or)-mean(ob)>=0?"+":"")+(mean(or)-mean(ob)).toFixed(1)} puan`);
}

/* ── 15 · Orman · hard ve soft voting ──
   Adım 8: derinlik 2'de iki sınır haritanın yaklaşık beşte birinde ayrışıyor, OOB
   ortalama 6–7 puan artıyor; derinlik 6'da fark alanın %2'sine iniyor.
   Ölçüm (20 veri, pivot, RF, 40 ağaç): d2 +6.7 puan, alan %19.5; d6 +0.3, %2.0. */
{
  head("Modül 15 · hard / soft voting (pivot, derinlik 2 ve 6)");
  const {el,M}=boot(F);
  const area=()=>{const m=/haritanın %([\d.]+)/.exec(el('c-ens').getAttribute('aria-label')); return m?+m[1]:NaN;};
  const r={2:{h:[],s:[],a:[]},6:{h:[],s:[],a:[]}};
  for(let t=0;t<16;t++) for(const d of [2,6]){ PK(M,'m-ens',1); P(el,'ens-id',false); el('ens-m1').click();
    S(el,'ens-d',d); S(el,'ens-k',40);
    el('ens-hard').click(); r[d].h.push(V(el,'ens-oob'));
    el('ens-soft').click(); r[d].s.push(V(el,'ens-oob')); r[d].a.push(area()); el('ens-hard').click(); }
  for(const d of [2,6]) console.log(`       derinlik ${d}: OOB hard %${mean(r[d].h).toFixed(1)} · soft %${mean(r[d].s).toFixed(1)} · farklı alan %${mean(r[d].a).toFixed(1)}`);
  const g2=mean(r[2].s)-mean(r[2].h);
  chk(g2>=4&&g2<=10, "derinlik 2'de soft voting OOB'yi ortalama 6–7 puan artırıyor (adım 8)", `+${g2.toFixed(1)} puan`);
  chk(mean(r[2].a)>=12&&mean(r[2].a)<=28, "iki sınır haritanın yaklaşık beşte birinde ayrışıyor (adım 8)", `%${mean(r[2].a).toFixed(1)}`);
  chk(mean(r[6].a)<=4, "derinlik 6'da fark alanın %2'si civarına iniyor (adım 8)", `%${mean(r[6].a).toFixed(1)}`);
  chk(Math.abs(mean(r[6].s)-mean(r[6].h))<1.5, "derin ağaçta iki oylama neredeyse aynı karar veriyor", `${(mean(r[6].s)-mean(r[6].h)).toFixed(1)} puan`);
}

/* ── 15 · Orman · kimlik sütunu: Gini önemi kayırır, permütasyon önemi 0 der ──
   Adım 9 ve ders notu (Sağ panel, altta). Ölçüm (12 veri, kredi, RF, derinlik 6):
   Gini kimlik 0.171 (en az 0.149), permütasyon 0.001 (en çok 0.025). */
{
  head("Modül 15 · kimlik sütunu (Gini ↔ permütasyon önemi)");
  const {el,M}=boot(F);
  const imp=(re)=>{const m=re.exec(el('c-ens').getAttribute('aria-label')); return m?m[1].split(', ').map(x=>parseFloat(x.split(' ').pop().replace('−','-'))):[NaN,NaN,NaN];};
  const g=[],p=[];
  for(let t=0;t<14;t++){ PK(M,'m-ens',0); el('ens-hard').click(); el('ens-m1').click(); S(el,'ens-d',6); S(el,'ens-k',40);
    P(el,'ens-id',true);
    g.push(imp(/Gini önemi: (.*?)\. Permütasyon/)); p.push(imp(/Permütasyon önemi: (.*?)\.$/)); P(el,'ens-id',false); }
  const gk=mean(g.map(x=>x[2])), pk=mean(p.map(x=>x[2])), px=mean(p.map(x=>x[0]));
  console.log(`       kimlik: Gini ${gk.toFixed(3)} · permütasyon ${pk.toFixed(3)} (x₁'in permütasyonu ${px.toFixed(3)})`);
  chk(gk>=0.12&&gk<=0.23, "Gini önemi kimliğe 0.15–0.20 arası pay veriyor (adım 9)", gk.toFixed(3));
  chk(Math.abs(pk)<0.02, "permütasyon önemi kimliğe 0 diyor (adım 9)", pk.toFixed(3));
  chk(px>5*Math.max(Math.abs(pk),0.005), "permütasyon gerçek sütunu (x₁) yine görüyor", `${px.toFixed(3)} ≫ ${pk.toFixed(3)}`);
}

/* ── 13 · Eşik · üç senaryo, üç ayrı maliyet ── */
{
  head("Modül 11 · üç senaryo (İHA / kanser / spam)");
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
  /* spam note: "Eşik YUKARI, 0.90'a çekilir: precision %100 ... spam'in ancak %13'ü yakalanıyor".
     Ölçüm (12 tur): precision 100.0, recall 12.6 ± 0.5 [11.9, 13.6] */
  chk(spam.t==="0.90", "spam senaryosunun eşiği sunumdaki gibi 0.90", spam.t);
  chk(spam.pre>=99.5 && spam.rec>=9 && spam.rec<=17, "spam note: precision %100, recall ancak %13 civarı",
      `precision %${spam.pre} · recall %${spam.rec}`);
}

/* ── Modül 11 · temel model, specificity, PR eğrisi ve maliyetle eşik ──
   Sayılar tuvalin aria-label'ından okunuyor (matris, temel model, ROC-AUC, PR-AUC,
   maliyet eğrisinin dibi); tuval metni sahte DOM'da görünmüyor. 10 000 örnek olduğu için
   turdan tura oynama küçük, yine de 12 turun ORTALAMASI alınıyor. */
{
  head("Modül 11 · temel model, PR eğrisi, maliyetle eşik");
  const {el,M}=boot(F);
  const AR=()=>el('c-cm').getAttribute('aria-label')||'';
  const rd=()=>{ const a=AR(), g=(re)=>{const m=re.exec(a);return m?parseFloat(m[1]):NaN;};
    return {acc:g(/Doğruluk ([\d.]+)%/), base:g(/temel model ([\d.]+)%/), spec:g(/Specificity ([\d.]+)%/),
      roc:g(/ROC-AUC ([\d.]+)/), ap:g(/PR-AUC ([\d.]+)/), taban:g(/taban \(pozitif oranı\) ([\d.]+)/),
      cost:g(/bu eşikte (\d+)/), best:g(/en ucuz eşik ([\d.]+)/), cmin:g(/→ (\d+) ₺/),
      TP:g(/TP (\d+)/), FP:g(/FP (\d+)/), FN:g(/FN (\d+)/),
      pre:V(el,'cm-pre'), rec:V(el,'cm-rec'), f1:V(el,'cm-f1'), accCls:el('cm-acc').className}; };
  const avg=(setup,N=12)=>{ const R=[]; for(let i=0;i<N;i++){ el('cm-new').click(); setup(); R.push(rd()); }
    const o={runs:R}; for(const k of Object.keys(R[0])) if(typeof R[0][k]==='number') o[k]=mean(R.map(r=>r[k])); return o; };
  const f=(v,d=1)=>v.toFixed(d);

  /* adım « Dengesiz sınıf tuzağı »: "herkese 'negatif' diyen tembel model de %97 alıyor,
     gösterge bu yüzden kırmızı. Specificity %100'e yakın, recall yerlerde" */
  P(el,'cm-vroc',true);
  const tr=avg(()=>{PK(M,'m-cm',0); S(el,'cm-pr',3); S(el,'cm-t',95);});
  console.log(`       tuzak: doğruluk %${f(tr.acc)} · temel model %${f(tr.base)} · specificity %${f(tr.spec)} · recall %${f(tr.rec)}`);
  chk(Math.abs(tr.base-97)<=1, "tembel « hep negatif » modelin doğruluğu %97 (matrisin altı)", `%${f(tr.base)}`);
  chk(tr.runs.every(r=>r.acc<=r.base+0.5 && /\bbd\b/.test(r.accCls)), "model temel modeli geçemiyor → Doğruluk göstergesi kırmızı",
      `doğruluk − temel = ${f(tr.acc-tr.base,2)} puan`);
  chk(tr.spec>=99.5 && tr.rec<5, "specificity %100'e yakın, recall yerlerde", `spec %${f(tr.spec)} · recall %${f(tr.rec)}`);

  /* adımlar « PR eğrisi · dengeli veri » ve « Aynı model, %1 pozitif » (Hafta 8 slayt 28:
     AUC 0.95, dengelide R .80 → P .92, %1'de P .11). Ölçüm (12 tur): dengeli ROC .949,
     PR-AUC .950, R 80.1, P 91.9 · %1: ROC .949 ± .010, PR-AUC .399 ± .040, R 80.8 ± 3.7,
     P 10.2 ± 0.7, TP 80, FP 707 ± 25 */
  P(el,'cm-vpr',true);
  const kStep=(pr)=>()=>{PK(M,'m-cm',1); S(el,'cm-sep',30); S(el,'cm-pr',pr); S(el,'cm-t',54);};
  const d50=avg(kStep(50));
  chk(T(el,'cm-auck')==="PR-AUC" && Math.abs(V(el,'cm-auc')-d50.runs[d50.runs.length-1].ap)<1e-9,
      "PR görünümünde son gösterge PR-AUC'yi yazıyor", `${T(el,'cm-auck')} ${T(el,'cm-auc')}`);
  const d01=avg(kStep(1));
  console.log(`       %50 pozitif: ROC-AUC ${f(d50.roc,3)} · PR-AUC ${f(d50.ap,3)} · recall %${f(d50.rec)} · precision %${f(d50.pre)}`);
  console.log(`       %1 pozitif : ROC-AUC ${f(d01.roc,3)} · PR-AUC ${f(d01.ap,3)} · recall %${f(d01.rec)} · precision %${f(d01.pre)} · TP ${f(d01.TP,0)} · FP ${f(d01.FP,0)}`);
  chk(Math.abs(d50.roc-0.95)<=0.01 && Math.abs(d50.ap-0.95)<=0.02, "dengeli veride ROC-AUC 0.95, PR-AUC de 0.95", `${f(d50.roc,3)} / ${f(d50.ap,3)}`);
  chk(Math.abs(d50.rec-80)<=2 && Math.abs(d50.pre-92)<=2, "eşik 0.54'te recall %80, precision %92", `%${f(d50.rec)} / %${f(d50.pre)}`);
  chk(Math.abs(d01.roc-d50.roc)<=0.02, "pozitif oranı %1'e inince ROC-AUC yerinde kalıyor", `${f(d50.roc,3)} → ${f(d01.roc,3)}`);
  chk(d01.ap>=0.3 && d01.ap<=0.5 && d50.ap-d01.ap>0.4, "PR-AUC ise 0.95'ten 0.40 civarına çöküyor", `${f(d50.ap,3)} → ${f(d01.ap,3)}`);
  chk(Math.abs(d01.rec-80)<=4 && d01.pre>=8.5 && d01.pre<=12, "aynı eşikte recall yine %80, precision %10 civarı", `%${f(d01.rec)} / %${f(d01.pre)}`);
  chk(d01.TP>=70 && d01.TP<=90 && d01.FP>=600 && d01.FP<=800, "80 hastaya karşı 700 kadar yanlış alarm", `TP ${f(d01.TP,0)} · FP ${f(d01.FP,0)}`);
  chk(Math.abs(d01.taban-0.01)<0.003, "PR'nin taban çizgisi pozitif oranı (0.01)", f(d01.taban,3));

  /* « Müşteri kaybı » note ve adımlar « Maliyetle eşik » / « En ucuz eşik » (Hafta 7:
     P .393, R .857, F1 .539, doğruluk .795 ↔ temel .860; kampanya 300, FN 660 TL).
     Ölçüm (12 tur): eşik .50'de ROC .886, P 39.9, R 80.8, F1 53.4, doğruluk 80.2, temel 86.0,
     maliyet 690 ± 13 bin; en ucuz eşik .576 ± .010 [.56, .59]; .58'de 561 bin */
  P(el,'cm-vcost',true);
  chk(!el('cm-cfpc').hidden && !el('cm-cfnc').hidden && el('cm-aucs').hidden && !el('cm-costs').hidden,
      "« Maliyet »te birim bedel kaydırıcıları ve toplam maliyet göstergesi görünüyor");
  const ch=(t,fp=300)=>()=>{PK(M,'m-cm',3); S(el,'cm-cfp',fp); S(el,'cm-cfn',660); S(el,'cm-t',t);};
  const c50=avg(ch(50)), c58=avg(ch(58));
  console.log(`       churn .50: ROC ${f(c50.roc,3)} · P %${f(c50.pre)} · R %${f(c50.rec)} · F1 %${f(c50.f1)} · doğruluk %${f(c50.acc)} (temel %${f(c50.base)}) · maliyet ${f(c50.cost/1000,0)} bin`);
  console.log(`       en ucuz eşik ${f(c50.best,3)} (${f(c50.cmin/1000,0)} bin) · .58'de ${f(c58.cost/1000,0)} bin · fark ${f((c50.cost-c58.cost)/1000,0)} bin`);
  chk(Math.abs(c50.roc-0.88)<=0.015, "churn note: ROC-AUC 0.88", f(c50.roc,3));
  chk(Math.abs(c50.pre-40)<=2 && Math.abs(c50.rec-81)<=2 && Math.abs(c50.f1-53)<=1.5, "churn note: eşik 0.50'de precision %40, recall %81, F1 0.53",
      `%${f(c50.pre)} · %${f(c50.rec)} · %${f(c50.f1)}`);
  chk(Math.abs(c50.acc-80)<=1.5 && Math.abs(c50.base-86)<=1 && c50.acc<c50.base, "churn note: doğruluk %80, herkese 'kalır' diyen temel model %86",
      `%${f(c50.acc)} ↔ %${f(c50.base)}`);
  chk(c50.cost>=650000 && c50.cost<=730000, "adım: eşik 0.50'de toplam maliyet ~690 bin ₺", `${f(c50.cost/1000,0)} bin`);
  chk(c50.runs.every(r=>r.best>0.5) && c50.best>=0.55 && c50.best<=0.61, "en ucuz eşik 0.5'in sağında, 0.58 civarında", `ort ${f(c50.best,3)}`);
  const sv=c50.cost-c58.cost;
  chk(sv>=100000 && sv<=160000, "eşik 0.58'e gelince toplam maliyet ~130 bin ₺ düşüyor", `${f(sv/1000,0)} bin`);
  chk(c58.FP<c50.FP && c58.FN>c50.FN, "yanlış alarm azaldı, kaçan üye arttı", `FP ${f(c50.FP,0)}→${f(c58.FP,0)} · FN ${f(c50.FN,0)}→${f(c58.FN,0)}`);
  /* gösterge ile eğri aynı ızgarada: kaydırıcı en ucuz eşiğe gidince gösterge eğrinin dibini okur */
  { const r=c58.runs[c58.runs.length-1]; S(el,'cm-t',Math.round(r.best*100)); const q=rd();
    chk(q.cost===q.cmin && /\bok\b/.test(el('cm-cost').className), "kaydırıcı en ucuz eşikteyken gösterge eğrinin dibini okuyor (yeşil)", `${q.cost} = ${q.cmin}`); }

  /* idea: "Kaçırmak pahalıysa ya da yanlış alarm ucuzsa en ucuz eşik sola kayar; tersi
     olursa sağa." Ölçüm: İHA 50/800 → .389; churn FP 100 → .491 (FP 300'de .576);
     İHA FP 500 / FN 40 → sağda. (.ask'ın sorusu: FP ₺ inince yeşil çizgi nereye?) */
  const cheap=avg(ch(50,100));
  const ihaL=avg(()=>{PK(M,'m-cm',0); S(el,'cm-cfp',50); S(el,'cm-cfn',800);});
  const ihaR=avg(()=>{PK(M,'m-cm',0); S(el,'cm-cfp',500); S(el,'cm-cfn',40);});
  console.log(`       en ucuz eşik: churn FP 300 → ${f(c50.best,3)}, FP 100 → ${f(cheap.best,3)} · İHA 50/800 → ${f(ihaL.best,3)}, 500/40 → ${f(ihaR.best,3)}`);
  chk(cheap.best<c50.best-0.04, "yanlış alarm ucuzlayınca en ucuz eşik sola kayıyor (Hafta 7'nin sorusu)", `${f(c50.best,3)} → ${f(cheap.best,3)}`);
  chk(ihaL.best<0.45, "kaçırmak pahalıysa (50 / 800) en ucuz eşik 0.5'in solunda", f(ihaL.best,3));
  chk(ihaR.best>0.55, "yanlış alarm pahalıysa en ucuz eşik 0.5'in sağında", f(ihaR.best,3));
  P(el,'cm-vroc',true);
  chk(el('cm-cfpc').hidden && !el('cm-aucs').hidden && el('cm-costs').hidden && T(el,'cm-auck')==="ROC-AUC",
      "ROC'a dönünce maliyet kaydırıcıları gizleniyor, gösterge yine ROC-AUC");
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

/* ══════════ Yeni modüller ══════════ */

/* ── 01 · Ortalama / medyan: uç değer birini sürükler, diğerini sürüklemez ── */
{
  head("Modül 01 · Ortalama mı, medyan mı (dayanıklılık)");
  const {el,M}=boot(F);
  const dm=[], dmed=[], dsd=[], diqr=[];
  for(let t=0;t<12;t++){
    PK(M,'m-stat',1);                       // sınav notu · simetriğe yakın
    S(el,'st-n',24);
    S(el,'st-out',55);
    const m0=V(el,'st-mean'), md0=V(el,'st-med'), sd0=V(el,'st-sd'), iq0=V(el,'st-iqr');
    S(el,'st-out',99);
    dm.push(Math.abs(V(el,'st-mean')-m0));
    dmed.push(Math.abs(V(el,'st-med')-md0));
    dsd.push(Math.abs(V(el,'st-sd')-sd0));
    diqr.push(Math.abs(V(el,'st-iqr')-iq0));
  }
  console.log(`       uç değer sağa: ortalama ${mean(dm).toFixed(2)} puan oynadı, medyan ${mean(dmed).toFixed(2)}`);
  console.log(`       aynı hamlede: std sapma ${mean(dsd).toFixed(2)} oynadı, IQR ${mean(diqr).toFixed(2)}`);
  chk(mean(dm)>3*Math.max(mean(dmed),0.05), "ortalama uç değerin peşinden gidiyor, medyan yerinde duruyor (adım 2)",
      `ortalama ${mean(dm).toFixed(2)} · medyan ${mean(dmed).toFixed(2)}`);
  chk(mean(dsd)>mean(diqr), "standart sapma zıplıyor, IQR dayanıklı kalıyor (adım 5)",
      `std ${mean(dsd).toFixed(2)} · IQR ${mean(diqr).toFixed(2)}`);
  const gap=[];
  for(let t=0;t<12;t++){ PK(M,'m-stat',0); S(el,'st-n',30); S(el,'st-out',60);
    gap.push(V(el,'st-mean')-V(el,'st-med')); }
  console.log(`       maaş verisi: ortalama − medyan = ${mean(gap).toFixed(1)} bin ₺`);
  chk(mean(gap)>2, "çarpık veride ortalama medyanın üstünde kalıyor (adım 4 · set notu)",
      `+${mean(gap).toFixed(1)} bin ₺`);
}

/* ── 28 · Korelasyon: sunumun sayıları, aykırı nokta, Anscombe, kemer, ortak sebep ──
   Göstergeler "−" (U+2212) yazıyor; num() eksiyi okumuyor, burada ayrı ayrıştırılır.
   Tuval metni aria-label'da (r üç ondalık, toplamlar, katkılar, sıcaklık satırı). */
{
  head("Modül 28 · Birlikte artıyorlar mı (korelasyon)");
  const {el,M}=boot(F);
  const mod=M.find(x=>x.id==='m-corr');
  const sn=(s)=>{const m=/(−|-)?(\d+(?:\.\d+)?)/.exec(String(s)); return m?(m[1]?-1:1)*parseFloat(m[2]):NaN;};
  const AR=()=>el('c-corr').getAttribute('aria-label');
  const R=()=>sn((/ r = (−?[\d.]+), r² =/.exec(AR())||[])[1]);
  const RS=()=>T(el,'corr-r');
  const ML=()=>{const m=/x̄ = ([^,]+), ȳ = (.+?)\. Σ/.exec(AR())||[]; return [m[1],m[2]];};
  const SUMS=()=>{const m=/Σ\(x−x̄\)\(y−ȳ\) = ([^,]+), Σ\(x−x̄\)² = ([^,]+), Σ\(y−ȳ\)² = (.+?)\. r =/.exec(AR())||[]; return [m[1],m[2],m[3]];};
  const LINE=()=>(/En iyi doğru: (ŷ = .+?x)\./.exec(AR())||[])[1];
  const KAT=()=>{const m=/Artı katkı (\d+) nokta \(([^)]+)\), eksi katkı (\d+) nokta \(([^)]+)\), sıfır (\d+)/.exec(AR())||[];
    return {np:+m[1],pos:sn(m[2]),nn:+m[3],neg:sn(m[4]),nz:+m[5]};};
  const TS=()=>{const m=/Sıcaklık–dondurma r = (−?[\d.]+), sıcaklık–boğulma r = (−?[\d.]+), sıcaklık sabitken r = (−?[\d.]+)/.exec(AR())||[];
    return {rt1:sn(m[1]),rt2:sn(m[2]),part:sn(m[3])};};
  const OUTP=()=>sn((/çarpımı (−?[\d.]+)/.exec(AR())||[])[1]);
  /* adımı kabuk gibi uygula: önce veri kümesi (set), sonra run() */
  const step=(i)=>{const s=mod.steps[i]; if(s.set!==undefined) mod.__pick(s.set); s.run(); return s;};

  /* adım 1–4, ders notu ex, figür, « Beş öğrenci » notu: Hafta 2 · sl. 35 */
  step(0);
  const [mx,my]=ML(), [sxy,sxx,syy]=SUMS();
  console.log(`       beş öğrenci: x̄ ${mx} ȳ ${my} · Σ ${sxy} / ${sxx} / ${syy} · r ${RS()} r² ${T(el,'corr-r2')} kov ${T(el,'corr-cov')} · ${T(el,'corr-st')}`);
  chk(mx==="3"&&my==="65", "x̄ = 3 saat, ȳ = 65 puan (adım 1, ex)", `${mx} · ${my}`);
  chk(sxy==="80"&&sxx==="10"&&syy==="750", "üç toplam 80, 10, 750 (adım 3, ex, figür)", `${sxy} · ${sxx} · ${syy}`);
  chk(RS()==="0.92"&&T(el,'corr-r2')==="0.85", "r = 0.92, r² = 0.85 (adım 3, ex, not)", `${RS()} · ${T(el,'corr-r2')}`);
  chk(T(el,'corr-cov')==="20", "kovaryans 80 / 4 = 20 saat·puan (adım 4, ex)", T(el,'corr-cov'));
  chk(T(el,'corr-st')==="güçlü pozitif", "Yorum: güçlü pozitif (sunum: 'güçlü, pozitif, doğrusal')", T(el,'corr-st'));
  { const k=KAT(); chk(k.np===3&&k.nn===0&&k.nz===2, "A, B, E artı; C ve D sıfır; kırmızı bölgede nokta yok (adım 2, figür, not)", JSON.stringify(k)); }
  chk(LINE()==="ŷ = 41 + 8x", "beş öğrencinin doğrusu ŷ = 41 + 8x", LINE());

  /* .ask 1, adım 5, not: 7 saatlik aykırı öğrenci notu 0 → −0.43, 40 → −0.02, 100 → 0.97 */
  step(4);
  const r0=RS(), st0=T(el,'corr-st'), op=OUTP(), k0=KAT();
  S(el,'corr-oy',40); const r40=RS(), st40=T(el,'corr-st');
  S(el,'corr-oy',100); const r100=RS();
  console.log(`       aykırı (7 saat): not 0 → r ${r0} (${st0}), 40 → ${r40} (${st40}), 100 → ${r100} · aykırının çarpımı ${op}, öteki artılar ${k0.pos}`);
  chk(T(el,'corr-n')==="6" && /Aykırı nokta \(7, 100\)/.test(AR()), "aykırı nokta 7 saatte, altıncı öğrenci (.ask, adım 5)", T(el,'corr-n'));
  chk(r0==="−0.43"&&r100==="0.97", "aykırı not 0'da r −0.43, 100'de 0.97 (.ask, adım 5, not)", `${r0} · ${r100}`);
  chk(r40==="−0.02", "aykırı not 40'ta r −0.02 (not)", r40);
  chk(st0==="orta negatif", "not 0'da işaret dönüyor: Yorum 'orta negatif' (adım 5)", st0);
  chk(op<0&&Math.abs(op)>k0.pos, "aykırının çarpımı en büyüğü: öteki artıların toplamından büyük (.ask ipucu, adım 5)", `${op} vs +${k0.pos}`);
  P(el,'corr-out',false); el('corr-new').click();
  chk(RS()==="0.92"&&T(el,'corr-n')==="5", "« Yeni veri » aynı beş öğrenciyi geri getiriyor (not)", `${T(el,'corr-n')} nokta · r ${RS()}`);

  /* adım 6–9, not, ders notu: Anscombe — dördünde x̄ 9, ȳ 7.50, r 0.82, ŷ = 3.00 + 0.500x */
  const an=[];
  for(const i of [5,6,7,8]){ step(i); an.push({r:RS(),m:ML().join('/'),l:LINE(),h:el('corr-aset').hidden,ln:el('corr-line').getAttribute('aria-pressed')}); }
  console.log(`       Anscombe: ${an.map((a,i)=>['I','II','III','IV'][i]+' r '+a.r+' '+a.m+' '+a.l).join(' · ')}`);
  chk(an.every(a=>a.r==="0.82"), "dört Anscombe verisinde r = 0.82 (adım 6–9, not)", an.map(a=>a.r).join(' '));
  chk(an.every(a=>a.m==="9/7.50"), "dördünde x̄ = 9, ȳ = 7.50 (adım 6, not)", an.map(a=>a.m).join(' '));
  chk(an.every(a=>a.l==="ŷ = 3.00 + 0.500x"), "dördünde aynı doğru ŷ = 3.00 + 0.500x (adım 6, not)", an.map(a=>a.l).join(' '));
  chk(an.every(a=>!a.h&&a.ln==="true"), "Anscombe seçicisi görünüyor, « Doğru » açık", JSON.stringify(an.map(a=>a.h)));
  /* "sağ üstteki noktayı sil → r tanımsız" (adım 9) ve "III'ün aykırısı doğruya konunca r ≈ 1"
     sağ tık / sürükleme ister; sahte DOM'da işaretçi olayı yok, gerçek tarayıcıda denendi
     (faz4 ekran görüntüsü betiği: IV'te sağ tık → 10 nokta, r —, Yorum 'tanımsız'). */
  chk(el('corr-temp').hidden, "Anscombe'da « Sıcaklık rengi » gizli");

  /* adım 10, .ask 2, Soru 4, not: kahve r −0.02, doğru yatay, katkılar birbirini götürüyor */
  step(9);
  const kk=KAT(), kl=LINE(), b1=sn((/([−+-]) ([\d.]+)x$/.exec(kl)||[])[0]?.replace(/ /g,''));
  console.log(`       kahve: r ${RS()} · ${T(el,'corr-st')} · ${kl} · artı ${kk.pos} (${kk.np}) eksi ${kk.neg} (${kk.nn})`);
  chk(RS()==="−0.02", "kahve ve not: açılışta r = −0.02 (adım 10, not, Soru 4)", RS());
  chk(T(el,'corr-st')==="doğrusal yok", "Yorum 'doğrusal yok' (.ask 2, read)", T(el,'corr-st'));
  chk(Math.abs(b1)*6<2, "doğru neredeyse yatay: 6 fincanda 2 puandan az değişiyor (adım 10)", kl);
  chk(Math.abs(kk.pos+kk.neg)<0.1*kk.pos&&kk.np>=8&&kk.nn>=8, "artı ve eksi katkılar birbirini götürüyor (adım 10, idea)", `${kk.pos} ${kk.neg}`);
  const kr=[]; for(let t=0;t<20;t++){ el('corr-new').click(); kr.push(Math.abs(R())); }
  console.log(`       kahve 20 yeni örneklem: |r| ort ${mean(kr).toFixed(3)}, en büyük ${Math.max(...kr).toFixed(3)}`);
  /* 100 000 örneklem: ort |r| 0.052, %99'u 0.167, %99.9'u 0.211 altında, en uç 0.36 */
  chk(kr.filter(v=>v<=0.17).length>=18&&Math.max(...kr)<=0.3&&mean(kr)<0.1, "« Yeni veri »de de r sıfıra yakın: %99'unda |r| < 0.17, ortalama 0.05 (not)", `ort ${mean(kr).toFixed(3)} · en ${Math.max(...kr).toFixed(3)}`);

  /* adım 11–12, .ask 2, not: dondurma r 0.89; sıcaklıkla 0.96 / 0.92; sıcaklık sabitken −0.01 */
  step(10);
  chk(RS()==="0.89"&&T(el,'corr-st')==="güçlü pozitif", "dondurma–boğulma r = 0.89, güçlü pozitif (adım 11, .ask: 0.8'in üstünde)", RS());
  chk(!el('corr-temp').hidden&&el('corr-aset').hidden, "dondurmada « Sıcaklık rengi » görünüyor, Anscombe seçicisi gizli");
  chk(!/Sıcaklık–dondurma/.test(AR()), "sıcaklık satırı yalnız « Sıcaklık rengi » açıkken");
  step(11);
  const t0=TS();
  console.log(`       sıcaklık: dondurma ${t0.rt1} · boğulma ${t0.rt2} · sabitken ${t0.part}`);
  chk(Math.abs(t0.rt1-0.964)<0.0015&&Math.abs(t0.rt2-0.922)<0.0015, "sıcaklıkla dondurma 0.96, sıcaklıkla boğulma 0.92 (adım 12)", `${t0.rt1} · ${t0.rt2}`);
  chk(Math.abs(t0.part)<0.015, "sıcaklığın payı çıkarılınca r −0.01 (adım 12, not)", String(t0.part));
  const dr=[], d1=[], d2=[], dp=[];
  for(let t=0;t<40;t++){ el('corr-new').click(); const q=TS(); dr.push(R()); d1.push(q.rt1); d2.push(q.rt2); dp.push(q.part); }
  console.log(`       dondurma 40 yeni örneklem: r ort ${mean(dr).toFixed(3)} [${Math.min(...dr).toFixed(3)}, ${Math.max(...dr).toFixed(3)}] · sıcaklıkla ${mean(d1).toFixed(3)} / ${mean(d2).toFixed(3)} · sabitken |ort| ${mean(dp.map(Math.abs)).toFixed(3)}, ±0.3 içinde ${dp.filter(v=>Math.abs(v)<=0.3).length}/40`);
  /* 4000 tohum: r %5–95 aralığı 0.844–0.934, sıcaklık sabitken ±0.288 (ölçüm notları index.html'de) */
  const inR=dr.filter(v=>v>=0.84&&v<=0.93).length;
  chk(dr.filter(v=>v>=0.8).length>=36&&mean(dr)>0.85&&mean(dr)<0.93, "dondurma r 0.8'in üstünde (.ask 2)", `ort ${mean(dr).toFixed(3)} · en küçük ${Math.min(...dr).toFixed(3)}`);
  chk(inR>=29, "yeni örneklemlerin %90'ında r 0.84–0.93 (not)", `${inR}/40`);
  chk(Math.abs(mean(d1)-0.96)<0.02&&Math.abs(mean(d2)-0.92)<0.025, "sıcaklıkla r ≈ 0.96 ve ≈ 0.92 (not)", `${mean(d1).toFixed(3)} · ${mean(d2).toFixed(3)}`);
  chk(dp.filter(v=>Math.abs(v)<=0.3).length>=31&&mean(dp.map(Math.abs))<0.2, "sıcaklık sabitken r sıfıra yakın, %90'ında ±0.3 içinde (not, idea)", `${dp.filter(v=>Math.abs(v)<=0.3).length}/40`);
  P(el,'corr-temp',false);
}

/* ── 16 · SVM: C yolu daraltır, test doğruluğu ezberi gösterir, kernel halkayı çözer ──
   Çözücü b'yi cezalandırmıyor (SMO) ve deterministik; rastgelelik yalnız veride.
   C kaydırıcısı 0–40: C = 10^(v/10 − 2) → 0 = 0.01, 20 = 1, 40 = 100.
   gamma kaydırıcısı 0–30: γ = 10^(v/10 − 1) → 0 = 0.1, 13 = 2.0, 30 = 100. */
{
  head("Modül 16 · « Dört ev » (Hafta 12'nin elle çözümü)");
  const {el,M}=boot(F);
  const aria=()=>el('c-svm').getAttribute('aria-label');
  PK(M,'m-svm',3); P(el,'svm-z',false); P(el,'svm-lin',true); S(el,'svm-c',20);
  const m1=T(el,'svm-m'), sv1=T(el,'svm-sv'), a1=aria();
  S(el,'svm-c',10); const m01=T(el,'svm-m'), sv01=T(el,'svm-sv');
  S(el,'svm-c',40); const m100=T(el,'svm-m'); S(el,'svm-c',20);
  console.log(`       C=1: margin ${m1} · SV ${sv1} · ${(/Doğrusal: ([^,]+)/.exec(a1)||[])[1]}`);
  console.log(`       C=0.1: margin ${m01} · SV ${sv01} · C=100: margin ${m100}`);
  chk(/w = \(0\.50, 0\.50\), b = −2\.00/.test(a1), "ekranda w = (0.50, 0.50), b = −2.00 (adım 2, not)", (/w = [^m]+/.exec(a1)||[''])[0]);
  chk(m1==="2.83", "margin veri biriminde 2.83 (adım 2, figür, elle hesap)", m1);
  chk(sv1==="3 / 4", "üç ev support vector, (4, 4) değil (adım 2)", sv1);
  chk(m100==="2.83", "C = 100'de de aynı yol (not: 'C = 1 ve üstünde sonuç aynı')", m100);
  chk(m01==="6.19"&&sv01==="4 / 4", "C = 0.1'de yol 6.19'a açılıyor, dört ev de support vector (not)", `${m01} · ${sv01}`);
}
{
  head("Modül 16 · « Kalite kontrol » (C yolu daraltır)");
  const {el,M}=boot(F);
  const r={0:{m:[],sv:[],tr:[],te:[]},20:{m:[],sv:[],tr:[],te:[]},40:{m:[],sv:[],tr:[],te:[]}};
  for(let t=0;t<16;t++){ PK(M,'m-svm',0); P(el,'svm-z',false); P(el,'svm-lin',true);
    for(const c of [0,20,40]){ S(el,'svm-c',c); r[c].m.push(V(el,'svm-m')); r[c].sv.push(V(el,'svm-sv')); r[c].tr.push(V(el,'svm-tr')); r[c].te.push(V(el,'svm-te')); } }
  for(const c of [0,20,40]) console.log(`       C=${[0.01,1,100][c/20]}: margin ${mean(r[c].m).toFixed(2)} · SV ${mean(r[c].sv).toFixed(1)}/36 · eğitim %${mean(r[c].tr).toFixed(1)} · test %${mean(r[c].te).toFixed(1)}`);
  chk(mean(r[0].m)>mean(r[20].m)&&mean(r[20].m)>mean(r[40].m), "C büyüdükçe yol daralıyor (adım 3–4)", [0,20,40].map(c=>mean(r[c].m).toFixed(2)).join(" → "));
  chk(mean(r[40].m)>=2.2&&mean(r[40].m)<=3.0, "C = 100'de yol ortalama 2.6 birim (adım 3, not)", mean(r[40].m).toFixed(2));
  chk(mean(r[40].sv)<=3.5, "C = 100'de support vector 2–3'e iniyor (adım 3)", mean(r[40].sv).toFixed(1));
  chk(mean(r[0].m)>=8&&mean(r[0].m)<=10.5, "C = 0.01'de yol 9 birime açılıyor (adım 4, not)", mean(r[0].m).toFixed(2));
  chk(mean(r[0].sv)>=35, "C = 0.01'de bütün noktalar support vector (adım 4, not)", `${mean(r[0].sv).toFixed(1)}/36`);
  chk(mean(r[0].tr)>=99&&mean(r[0].te)>=99, "yine de eğitim ve test %100: çok support vector ≠ ezber (adım 4)", `%${mean(r[0].tr).toFixed(1)} / %${mean(r[0].te).toFixed(1)}`);
  chk(mean(r[20].sv)<36, "modeli 36 noktanın yalnız birkaçı belirliyor (.ask: 'kaçını gerçekten kullanıyor')", `${mean(r[20].sv).toFixed(1)} / 36`);
  chk([0,20,40].every(c=>mean(r[c].te)>=98), "test doğruluğu her C'de %100'e yakın (not)", [0,20,40].map(c=>mean(r[c].te).toFixed(1)).join(" · "));
}
{
  head("Modül 16 · « Kredi riski » (iç içe sınıflar · C büyürse test düşebilir)");
  const {el,M}=boot(F);
  /* 12'lik bloklarda test farkı 3.8–12.4 oynadı (ort ~7): 36 örneklem, fark ≥ 2 */
  const best=[], tr1=[], te1=[], tr100=[], te100=[]; let fell=0; const N=36;
  for(let t=0;t<N;t++){ PK(M,'m-svm',1); P(el,'svm-z',false); P(el,'svm-lin',true);
    let b=0; for(let c=0;c<=40;c+=10){ S(el,'svm-c',c); b=Math.max(b,V(el,'svm-tr')); } best.push(b);
    P(el,'svm-rbf',true); S(el,'svm-g',13);
    S(el,'svm-c',20); tr1.push(V(el,'svm-tr')); te1.push(V(el,'svm-te'));
    S(el,'svm-c',40); tr100.push(V(el,'svm-tr')); te100.push(V(el,'svm-te'));
    if(te100[t]<te1[t]) fell++; }
  console.log(`       doğrusal: en iyi C'de eğitim ort %${mean(best).toFixed(1)} (en çok %${Math.max(...best)})`);
  console.log(`       RBF γ=2: C=1 eğitim %${mean(tr1).toFixed(1)} test %${mean(te1).toFixed(1)} → C=100 eğitim %${mean(tr100).toFixed(1)} test %${mean(te100).toFixed(1)} · test düştü ${fell}/${N}`);
  chk(Math.max(...best)<100, "doğrusal kernel'de hiçbir C eğitimi %100'e çıkarmıyor (adım 5)", `en çok %${Math.max(...best)}`);
  chk(mean(best)>=80&&mean(best)<=88, "en iyisi %84 civarı (adım 5, not)", `%${mean(best).toFixed(1)}`);
  chk(mean(tr100)>=mean(tr1)+6&&mean(tr100)>=96, "RBF'te C 1 → 100: eğitim %87'den %99'a çıkıyor (adım 6, not)", `%${mean(tr1).toFixed(1)} → %${mean(tr100).toFixed(1)}`);
  /* Eşli fark tek tek veride oynak (12 veride 7/12 ile 15/16 arası ölçüldü): metin
     "ortalama" diyor ve "tek bir veride fark oynak" uyarısını veriyor, sınama da ortalamaya bakıyor. */
  chk(mean(te1)-mean(te100)>=2, "aynı hamlede test doğruluğu ortalama %76 → %68 civarı düşüyor (adım 6, not)", `%${mean(te1).toFixed(1)} → %${mean(te100).toFixed(1)} · düştü ${fell}/${N}`);
  chk(mean(te1)>=70&&mean(te1)<=80&&mean(te100)>=60&&mean(te100)<=75, "C = 1'de test %76, C = 100'de %68 civarı (adım 6, not)", `%${mean(te1).toFixed(1)} / %${mean(te100).toFixed(1)}`);
}
{
  head("Modül 16 · « Baz istasyonu » (doğru yetmiyor · z = x₁² + x₂² · RBF)");
  const {el,M}=boot(F);
  const zacc=()=>{const m=/eşik doğruluğu %([\d.]+)\./.exec(el('c-svm').getAttribute('aria-label')); return m?+m[1]:NaN;};
  const ltr=[], lm=[], z=[], g2tr=[], g2te=[], g100tr=[], g100te=[]; const N=12;
  for(let t=0;t<N;t++){ PK(M,'m-svm',2); P(el,'svm-z',false); P(el,'svm-lin',true); S(el,'svm-c',20);
    ltr.push(V(el,'svm-tr')); lm.push(T(el,'svm-m'));
    P(el,'svm-z',true); z.push(zacc()); P(el,'svm-z',false);
    P(el,'svm-rbf',true); S(el,'svm-g',13); g2tr.push(V(el,'svm-tr')); g2te.push(V(el,'svm-te'));
    S(el,'svm-g',30); g100tr.push(V(el,'svm-tr')); g100te.push(V(el,'svm-te')); }
  console.log(`       doğrusal: eğitim %${mean(ltr).toFixed(1)} · margin "${lm[0]}" · z eşiği %${mean(z).toFixed(1)} (en az %${Math.min(...z)})`);
  console.log(`       RBF γ=2: eğitim %${mean(g2tr).toFixed(1)} test %${mean(g2te).toFixed(1)} · γ=100: eğitim %${mean(g100tr).toFixed(1)} test %${mean(g100te).toFixed(1)}`);
  /* 40 örneklemde 39'unda w ≈ 0 (birinde rastgele asimetri bir yön veriyor): metin "çoğu örneklemde" */
  chk(lm.filter(s=>/∞/.test(s)).length>=N-2, "doğrusal kernel çoğu örneklemde yön bulamıyor: w ≈ 0 (adım 7, not)", `${lm.filter(s=>/∞/.test(s)).length}/${N}`);
  chk(mean(ltr)>=60&&mean(ltr)<=70, "herkese 'kapsama dışı': doğruluk %65 (adım 7, not)", `%${mean(ltr).toFixed(1)}`);
  chk(mean(z)>=99, "z = x₁² + x₂² eklenince düz eşik hepsini ayırıyor (adım 8, not)", `%${mean(z).toFixed(1)}`);
  chk(mean(g2tr)>=mean(ltr)+25, "doğrusal çekirdek halkada çaresiz, RBF çözüyor (adım 9)", `%${mean(ltr).toFixed(1)} → %${mean(g2tr).toFixed(1)}`);
  chk(mean(g2te)>=97&&mean(g2tr)>=97, "RBF γ = 2: eğitim ve test %99 civarı (adım 9, not)", `%${mean(g2tr).toFixed(1)} / %${mean(g2te).toFixed(1)}`);
  chk(mean(g100te)<=80&&mean(g100tr)>=99, "γ = 100'de test %74'e iniyor, eğitim %100 (not)", `%${mean(g100tr).toFixed(1)} / %${mean(g100te).toFixed(1)}`);
}
{
  head("Modül 16 · « Kızılırmak » (gamma: düz · kıvrım · ada)");
  const {el,M}=boot(F);
  const r={0:{tr:[],te:[]},13:{tr:[],te:[]},30:{tr:[],te:[]}}; let up=0, mono=0; const N=14;
  for(let t=0;t<N;t++){ PK(M,'m-svm',4); P(el,'svm-z',false); P(el,'svm-rbf',true); S(el,'svm-c',20);
    for(const g of [0,13,30]){ S(el,'svm-g',g); r[g].tr.push(V(el,'svm-tr')); r[g].te.push(V(el,'svm-te')); }
    if(r[13].te[t]>r[0].te[t]) up++;
    if(r[0].tr[t]<=r[13].tr[t]&&r[13].tr[t]<=r[30].tr[t]) mono++; }
  const M_=(g,k)=>mean(r[g][k]);
  for(const g of [0,13,30]) console.log(`       γ=${({0:"0.1",13:"2",30:"100"})[g]}: eğitim %${M_(g,'tr').toFixed(1)} · test %${M_(g,'te').toFixed(1)}`);
  console.log(`       γ 0.1 → 2 testte iyileşti ${up}/${N} · eğitim hep arttı ${mono}/${N}`);
  chk(M_(0,'tr')>=75&&M_(0,'tr')<=88&&M_(0,'te')>=74&&M_(0,'te')<=88, "γ = 0.1: eğitim de test de %80 civarı, underfitting (adım 10, .ask, not)", `%${M_(0,'tr').toFixed(1)} / %${M_(0,'te').toFixed(1)}`);
  chk(M_(13,'tr')>=90&&M_(13,'tr')<=97.5&&M_(13,'te')>=85&&M_(13,'te')<=94, "γ = 2: eğitim %90'ın üstünde (not: %91–96), test %90 civarı (adım 11, .ask, not)", `%${M_(13,'tr').toFixed(1)} / %${M_(13,'te').toFixed(1)}`);
  chk(M_(30,'tr')>=99&&M_(30,'te')>=57&&M_(30,'te')<=73, "γ = 100: eğitim %100, test %65 civarı (adım 12, .ask, not)", `%${M_(30,'tr').toFixed(1)} / %${M_(30,'te').toFixed(1)}`);
  chk(M_(13,'te')>=M_(0,'te')+4&&M_(13,'te')>=M_(30,'te')+15, "test doğruluğu önce artıp sonra düşüyor (.ask)", `${M_(0,'te').toFixed(1)} → ${M_(13,'te').toFixed(1)} → ${M_(30,'te').toFixed(1)}`);
  chk(mono>=0.8*N, "eğitim doğruluğu gamma ile hep artıyor (.ask)", `${mono}/${N}`);
}
/* ── 10 · Yanlılık–varyans: karmaşıklık ikisini ters yönde hareket ettiriyor ── */
{
  head("Modül 04 · Yanlılık mı, varyans mı (ayrışma)");
  const {el,M}=boot(F);
  const b1=[],v1=[],b9=[],v9=[],v6=[],t1=[],t4=[],t9=[];
  for(let t=0;t<10;t++){
    PK(M,'m-bv',0); S(el,'bv-m',20); S(el,'bv-n',24);
    S(el,'bv-d',1); b1.push(V(el,'bv-b')); v1.push(V(el,'bv-v')); t1.push(V(el,'bv-t'));
    S(el,'bv-d',3); t4.push(V(el,'bv-t'));
    S(el,'bv-d',4); b9.push(V(el,'bv-b')); v9.push(V(el,'bv-v'));
    S(el,'bv-d',6); v6.push(V(el,'bv-v')); t9.push(V(el,'bv-t'));
  }
  console.log(`       derece 1: yanlılık² ${mean(b1).toFixed(4)} · varyans ${mean(v1).toFixed(4)}`);
  console.log(`       derece 4: yanlılık² ${mean(b9).toFixed(4)} · varyans ${mean(v9).toFixed(4)} · derece 6 varyans ${mean(v6).toFixed(4)}`);
  chk(mean(b9)<mean(b1), "karmaşıklık artınca yanlılık düşüyor (adım 2)",
      `${mean(b1).toFixed(4)} → ${mean(b9).toFixed(4)}`);
  chk(mean(v9)>mean(v1), "aynı hamlede varyans yükseliyor (adım 2)",
      `${mean(v1).toFixed(4)} → ${mean(v9).toFixed(4)}`);
  chk(mean(v6)>mean(v9), "derece 6'da varyans daha da patlıyor (adım 3)",
      `${mean(v9).toFixed(4)} → ${mean(v6).toFixed(4)}`);
  chk(mean(t4)<mean(t1)&&mean(t4)<mean(t9), "toplam hata uçlarda değil ortada en küçük (adım 3)",
      `d1 ${mean(t1).toFixed(3)} · d3 ${mean(t4).toFixed(3)} · d6 ${mean(t9).toFixed(3)}`);
  const vSmall=[],vBig=[],bSmall=[],bBig=[];
  for(let t=0;t<10;t++){
    PK(M,'m-bv',0); S(el,'bv-d',6);
    S(el,'bv-n',12); vSmall.push(V(el,'bv-v')); bSmall.push(V(el,'bv-b'));
    S(el,'bv-n',60); vBig.push(V(el,'bv-v'));   bBig.push(V(el,'bv-b'));
  }
  console.log(`       n=12 → varyans ${mean(vSmall).toFixed(4)} · n=60 → varyans ${mean(vBig).toFixed(4)}`);
  chk(mean(vBig)<mean(vSmall), "örnek sayısı artınca varyans düşüyor (adım 4)",
      `${mean(vSmall).toFixed(4)} → ${mean(vBig).toFixed(4)}`);
}

/* ── 17 · DBSCAN: eps iki uçta anlamsızlaşır, ortada hilalleri bulur ── */
{
  head("Modül 20 · Küme yuvarlak olmak zorunda mı (DBSCAN)");
  const {el,M}=boot(F);
  const okN=[],tinyN=[],hugeN=[],ringN=[],tinyNoise=[];
  for(let t=0;t<8;t++){
    PK(M,'m-dbs',0); P(el,'db-dbscan',true); S(el,'db-mp',4); S(el,'db-k',2);
    S(el,'db-eps',8);  okN.push(V(el,'db-rn'));
    S(el,'db-eps',2);  tinyN.push(V(el,'db-rn')); tinyNoise.push(V(el,'db-noise'));
    S(el,'db-eps',30); hugeN.push(V(el,'db-rn'));
    PK(M,'m-dbs',1); S(el,'db-eps',10); ringN.push(V(el,'db-rn'));
  }
  console.log(`       hilal · eps=0.08 → ${mean(okN).toFixed(2)} küme · eps=0.02 → ${mean(tinyN).toFixed(2)} · eps=0.30 → ${mean(hugeN).toFixed(2)}`);
  console.log(`       halka · eps=0.10 → ${mean(ringN).toFixed(2)} küme`);
  chk(Math.abs(mean(okN)-2)<0.3, "hilal verisinde DBSCAN iki kümeyi buluyor (adım 2)", mean(okN).toFixed(2));
  chk(mean(tinyNoise)>60, "eps çok küçükken noktaların çoğu gürültüye düşüyor (adım 3)",
      `110 noktanın ${mean(tinyNoise).toFixed(0)} tanesi gürültü`);
  chk(mean(hugeN)<=1.2, "eps çok büyükken her şey tek kümeye düşüyor (adım 4)", mean(hugeN).toFixed(2));
  chk(Math.abs(mean(ringN)-2)<0.4, "iç içe halkada da iki kümeyi ayırıyor (adım 6)", mean(ringN).toFixed(2));
}

/* ══════════ Görselleştirme turu (2026-09) ile gelen metin iddiaları ══════════ */

/* ── 17 · DBSCAN: "dolu noktalar çekirdek" — eps küçülünce çekirdek azalıyor ── */
{
  head("Modül 20 · çekirdek nokta (adım 3: 'Çekirdek, sınır, gürültü')");
  const {el,M}=boot(F); const cOk=[],cTiny=[],nOk=[];
  for(let t=0;t<8;t++){
    PK(M,'m-dbs',0); P(el,'db-dbscan',true); S(el,'db-mp',4);
    S(el,'db-eps',8); cOk.push(V(el,'db-core')); nOk.push(V(el,'db-n'));
    S(el,'db-eps',2); cTiny.push(V(el,'db-core'));
  }
  console.log(`       eps=0.08 → çekirdek ${mean(cOk).toFixed(1)}/${mean(nOk).toFixed(0)} · eps=0.02 → ${mean(cTiny).toFixed(1)}`);
  chk(mean(cOk)>0.8*mean(nOk), "uygun eps'te noktaların çoğu çekirdek (dolu) nokta", `${mean(cOk).toFixed(1)}/${mean(nOk).toFixed(0)}`);
  chk(mean(cTiny)<0.3*mean(cOk), "eps çok küçükken çekirdek nokta sayısı çöküyor (adım 4)", `${mean(cOk).toFixed(1)} → ${mean(cTiny).toFixed(1)}`);
  P(el,'db-hier',true);
  chk(T(el,'db-core')==="—", "hiyerarşik yöntemde 'çekirdek' kavramı yok, gösterge '—'", T(el,'db-core'));
}

/* ── 20 · MLP: "Nöron 4: her başlangıçtan çözüyor, hem de birkaç düzine epoch'ta" ──
   Ölçüm (400 başlangıç, uygulamanın eğitiminin birebir kopyası): h=4 %100 çözüyor,
   ≥%98 doğruluğa medyan 29 epoch, %90'lık dilim 65 epoch; tek bir başlangıç
   2429 epoch sürdü. Tek koşuya değil MEDYANA bakılıyor. */
{
  head("Modül 23 · 4 nöron birkaç düzine epoch'ta (adım 4)");
  const {el,tick,M}=boot(F); const ep=[]; let miss=0;
  for(let t=0;t<8;t++){
    PK(M,'m-mlp',0); S(el,'mlp-h',4); el('mlp-reset').click();
    P(el,'mlp-run',true);
    let got=-1;
    for(let k=0;k<400;k++){ tick(1); if(V(el,'mlp-acc')>=98){ got=V(el,'mlp-ep'); break; } }
    P(el,'mlp-run',false);
    if(got<0) miss++; else ep.push(got);
  }
  console.log(`       h=4 · %98 doğruluğa epoch: ${ep.join(', ')} · 800 epoch'ta çözemeyen ${miss}/8`);
  chk(miss<=1, "4 nöron neredeyse her başlangıçtan çözüyor", `${miss}/8 çözemedi`);
  chk(ep.length>0 && med(ep)<=60, "medyan çözüm süresi birkaç düzine epoch", `medyan ${ep.length?med(ep):'—'}`);
}

/* ── 14 · k-fold: "k = 2'de dağınıklar, k = 10'da neredeyse tek çizgiye biniyorlar" ──
   Soluk yeşil çizgiler karıştırma başına ortalama hata; burada aynı sayılar
   « Ortalama hata » göstergesinden her karıştırmadan sonra okunuyor. */
{
  head("Modül 05 · karıştırmalar arası yayılım (.ask ve adım 4)");
  const {el}=boot(F);
  const spread=(k)=>{ S(el,'cv-k',k); S(el,'cv-d',3); const r=[];
    for(let i=0;i<10;i++){ el('cv-shuf').click(); r.push(V(el,'cv-vm')); }
    const m=mean(r); return Math.sqrt(mean(r.map(x=>(x-m)**2))); };
  const s2=[],s10=[];
  for(let t=0;t<6;t++){ el('cv-new').click(); s2.push(spread(2)); s10.push(spread(10)); }
  console.log(`       karıştırma ortalamalarının std'si: k=2 → ${mean(s2).toFixed(4)} · k=10 → ${mean(s10).toFixed(4)}`);
  chk(mean(s10)<mean(s2)*0.75, "k büyüyünce karıştırmadan karıştırmaya ortalama daha kararlı", `${mean(s2).toFixed(4)} → ${mean(s10).toFixed(4)}`);
}

/* ── 05 · Zaman sırası (TimeSeriesSplit) ve « Kafe satışı » (Hafta 4 senaryo 3) ──
   Bölmenin kendisi aria-label'dan ("2. tur: eğitim 1–20, doğrulama 21–30, …") okunuyor.
   Kafe oranları 20 örneklemin ortalaması; 100 örneklemle ölçülen değerler not'ta:
   1. derece 54 ↔ 80 (1.49 kat), 2. derece 54 ↔ 149 (2.76 kat), 10. derece 31 ↔ ~4100
   bardak. 16–20 örneklemlik koşularda 2. derecenin oranı 2.6–2.8 arasında oynadı. */
{
  head("Modül 05 · zaman sırası (TimeSeriesSplit) ve kafe satışı");
  const {el,M,tick}=boot(F); const mc=M.find(m=>m.id==='m-cv');
  const AR=()=>el('c-cv').getAttribute('aria-label')||'';
  /* adım 6 ve ders notu: "eğitim hep doğrulamadan önce … her turda doğrulama bir dilim ileri
     kayıyor, eğitim penceresi büyüyor" */
  mc.__pick(3); S(el,'cv-n',60); S(el,'cv-k',5); S(el,'cv-d',2); P(el,'cv-ts',true);
  el('cv-run').click(); const tu=[];
  for(let k=0;k<5;k++){ const m=/(\d+)\. tur: eğitim 1–(\d+), doğrulama (\d+)–(\d+)/.exec(AR()); tu.push(m?{tr:+m[2],a:+m[3],b:+m[4]}:null); tick(1); }
  const okT=tu.every(Boolean)&&tu.every(x=>x.a===x.tr+1)&&tu.every((x,i)=>!i||(x.tr>tu[i-1].tr&&x.a===tu[i-1].b+1))&&tu[4].b===60;
  console.log(`       turlar: `+tu.map(x=>x?`eğitim 1–${x.tr} → doğrulama ${x.a}–${x.b}`:'?').join(' · '));
  chk(okT, "zaman sırası: eğitim hep doğrulamadan önce, pencere ileri kayıyor, eğitim büyüyor (adım 6)");
  /* ders notu · Bölme: "Zaman sırası karıştırılmaz: « Yeniden karıştır » turları değiştirmez" */
  /* karşılaştırma çizgisi (karıştırılmış KFold) karıştırmayla değişir; zaman sırasının kendisi değişmez */
  const tsPart=()=>AR().split('; karıştırılmış KFold')[0];
  const m0=T(el,'cv-vm'), a0=tsPart(); el('cv-shuf').click(); el('cv-shuf').click();
  chk(T(el,'cv-vm')===m0&&tsPart()===a0, "zaman sırasında « Yeniden karıştır » turları ve notu değiştirmiyor (ders notu · Bölme)", `${m0} → ${T(el,'cv-vm')}`);
  /* ders notu · Bölme: "Yalnız zamanı olan veride açılır; reklam bütçesi zaman değil" */
  mc.__pick(1); el('cv-ts').click();
  chk(el('cv-ts').disabled===true&&el('cv-kf').getAttribute('aria-pressed')==='true'&&/karıştırılmış \(KFold\)/.test(AR()),
      "reklam bütçesinde « Zaman sırası » kapalı, bölme « Karıştır »a dönüyor (ders notu · Bölme)");
  mc.__pick(0);
  chk(el('cv-ts').disabled===false, "zamanı olan veride « Zaman sırası » yeniden açık");
  /* not ve adım 5–7 */
  mc.__pick(3); S(el,'cv-k',5); S(el,'cv-n',60);
  const kf={1:[],2:[],10:[]}, ts={1:[],2:[],10:[]};
  for(let t=0;t<20;t++){ el('cv-new').click();
    for(const d of [1,2,10]){ S(el,'cv-d',d); P(el,'cv-kf',true); kf[d].push(V(el,'cv-vm')); P(el,'cv-ts',true); ts[d].push(V(el,'cv-vm')); } }
  const r1=mean(ts[1])/mean(kf[1]), r2=mean(ts[2])/mean(kf[2]);
  console.log(`       kafe (20 örneklem): 1. derece ${mean(kf[1]).toFixed(1)} ↔ ${mean(ts[1]).toFixed(1)} (${r1.toFixed(2)} kat) · 2. derece ${mean(kf[2]).toFixed(1)} ↔ ${mean(ts[2]).toFixed(1)} (${r2.toFixed(2)} kat) · 10. derece ${mean(kf[10]).toFixed(1)} ↔ ${mean(ts[10]).toFixed(0)}`);
  chk(mean(kf[2])>48&&mean(kf[2])<63, "kafe, 2. derece: karıştırılmış KFold 55 bardak civarı (adım 5, not)", mean(kf[2]).toFixed(1));
  chk(mean(ts[2])>125&&mean(ts[2])<175, "kafe, 2. derece: zaman sırası 150 bardak civarı (adım 6, not 149)", mean(ts[2]).toFixed(1));
  chk(r2>2.35&&r2<3.3, "kafe, 2. derece: zaman sırası KFold'un iki buçuk ile üç katı arası (adım 6, not 2.8)", r2.toFixed(2));
  chk(r1>1.3&&r1<1.75, "kafe, düz doğru: 1.5 kat (not)", r1.toFixed(2));
  chk(mean(ts[10])>1000, "kafe, 10. derece: zaman sırasında binlerce bardak (adım 7, not)", mean(ts[10]).toFixed(0));
  chk(mean(kf[10])<mean(kf[2])&&mean(kf[10])>22&&mean(kf[10])<40, "kafe, 10. derece: karıştırılmış KFold 30 civarı, 2. dereceden iyi görünüyor (adım 7, not)", mean(kf[10]).toFixed(1));
}

/* ── 19 · Perceptron: "Tek düzeltme: yanlış taraftaki ilk noktayı bulup çizgiyi itiyor" ── */
{
  head("Modül 22 · tek düzeltme (adım 2)");
  let moved=0, one=0, N=10;
  for(let t=0;t<N;t++){
    const {el,M}=boot(F); PK(M,'m-per',0);
    const w0=T(el,'per-w'), m0=V(el,'per-m');
    el('per-step').click();
    if(m0>0){ if(V(el,'per-u')===1) one++; if(T(el,'per-w')!==w0) moved++; }
    else { one++; moved++; }                     // başlangıç zaten doğruysa düzeltme yok
  }
  chk(one===N, "bir basış = bir güncelleme", `${one}/${N}`);
  chk(moved===N, "düzeltme ağırlıkları değiştiriyor (çizgi hareket ediyor)", `${moved}/${N}`);
}

/* ── 06 · Karar ağacı: "Ağacı çiz" yaprak sayısı göstergesiyle aynı ağacı çiziyor ── */
{
  head("Modül 14 · kurallar ağacı (adım 4–5)");
  const {el,M}=boot(F); const dt=M.find(m=>m.id==='m-dt');
  let bad=0;
  for(let t=0;t<6;t++){ el('dt-demo').click(); P(el,'dt-tree',true);
    for(const d of [1,2,3,5,8]){ S(el,'dt-d',d); try{ dt.draw(); }catch(e){ bad++; } } }
  /* « Kredi onayı »nda derinlik 8: 30 civarı yaprak, sorular sığmıyor (iskelet çizimi) */
  PK(M,'m-dt',3); el('dt-best').click(); S(el,'dt-d',8);
  try{ dt.draw(); }catch(e){ bad++; }
  for(const v of ['dt-vd','dt-vt']){ el(v).click(); try{ dt.draw(); }catch(e){ bad++; } }
  chk(bad===0, "ağaç, eşik ve derinlik görünümü her derinlikte çiziliyor", `${bad} hata`);
}

/* ── 21 · Yapay nöron: adım metinleri, elle hesap ve veri kümesi notları ──
   Adımlar senaryo düğmesine basıp (useSet → başlangıç ağırlıkları) kaydırıcıları
   kullanıcı gibi sürüyor; burada da aynı yol. Kaydırıcı değeri ağırlığın 10 katı. */
{
  head("Modül 21 · Bir nöron ne hesaplar (artificial neuron)");
  const {el,M}=boot(F);
  const neu=M.find(m=>m.id==='m-neu');
  const W=(a,b,c)=>{ S(el,'neu-w1',a*10); S(el,'neu-w2',b*10); S(el,'neu-b',c*10); };
  const acc=()=>T(el,'neu-acc');
  /* adım 1 + elle hesap: "x₁ = 12 / 30 = 0.40, x₂ = 7 / 10 = 0.70" */
  neu.__pick(0); P(el,'neu-step',true);
  chk(T(el,'neu-x')==='0.40, 0.70', "balon: ilk sabahın girdisi 0.40, 0.70 (adım 1)", T(el,'neu-x'));
  /* not: "w₁ = +1 ile başlıyor ... 20 sabahın 10'u doğru" */
  chk(acc()==='10 / 20', "balon: başlangıç ağırlıklarıyla 20 sabahın 10'u doğru (not)", acc());
  /* adım 2: w₁ = −4, w₂ = 3 (b = −1 kalıyor) → "hâlâ yalnız 12'si doğru" */
  S(el,'neu-w1',-40); S(el,'neu-w2',30);
  chk(acc()==='12 / 20', "balon: yön doğru ama b = −1 iken 12 / 20 (adım 2)", acc());
  /* adım 3: b = 0.5 → "20 sabahın 20'si" */
  S(el,'neu-b',5);
  chk(acc()==='20 / 20', "balon: b = 0.5 ile 20 / 20 (adım 3)", acc());
  /* adım 4 + elle hesap: z = 1.00, basamak 1, karar Uçar */
  chk(T(el,'neu-z')==='1.00'&&T(el,'neu-y')==='1'&&T(el,'neu-d')==='Uçar',
      "ilk sabah: z = 1.00, basamak ŷ = 1, karar Uçar (adım 4, elle hesap)", `${T(el,'neu-z')} · ${T(el,'neu-y')} · ${T(el,'neu-d')}`);
  P(el,'neu-sig',true);
  chk(T(el,'neu-y')==='0.73', "sigmoid(1.00) = 0.73 (adım 5, elle hesap)", T(el,'neu-y'));
  P(el,'neu-relu',true);
  chk(T(el,'neu-y')==='1.00', "ReLU(1.00) = 1.00 (adım 6)", T(el,'neu-y'));
  /* adım 7 + kendini sına 1: aktivasyon sınırı oynatmaz → doğru bilinen ve her örneğin
     kararı dört aktivasyonda aynı; ŷ'ler de kendi aralığında. Rastgele ağırlıklarla 12 tur. */
  let same=0, rangeOk=0, linZ=0;
  for(let t=0;t<12;t++){
    W(Math.round(Math.random()*80-40)/10, Math.round(Math.random()*80-40)/10, Math.round(Math.random()*60-30)/10);
    const row=[];
    for(const a of ['neu-step','neu-sig','neu-relu','neu-lin']){
      P(el,a,true); const dec=[], ys=[];
      for(let k=0;k<20;k++){ dec.push(T(el,'neu-d')); ys.push(num(T(el,'neu-y').replace('−','-'))); el('neu-next').click(); }
      row.push({a, acc:acc(), dec:dec.join(','), ys, z:num(T(el,'neu-z').replace('−','-'))});
    }
    if(row.every(r=>r.acc===row[0].acc&&r.dec===row[0].dec)) same++;
    const [st,sg2,re]=row;
    if(st.ys.every(v=>v===0||v===1)&&sg2.ys.every(v=>v>=0&&v<=1)&&re.ys.every(v=>v>=0)) rangeOk++;
    P(el,'neu-lin',true); if(num(T(el,'neu-y').replace('−','-'))===num(T(el,'neu-z').replace('−','-'))) linZ++;
  }
  chk(same===12, "aktivasyon değişince karar ve doğru bilinen değişmiyor (adım 7, kendini sına 1)", `${same}/12`);
  chk(rangeOk===12, "basamak 0/1, sigmoid 0–1, ReLU ≥ 0", `${rangeOk}/12`);
  chk(linZ===12, "aktivasyon yok: ŷ = z (adım 7)", `${linZ}/12`);
  /* adım 8: kredi, « Örnek ağırlıklar » 20 / 20 */
  neu.__pick(1); el('neu-good').click();
  chk(acc()==='20 / 20', "kredi: örnek ağırlıklarla 20 başvurunun 20'si (adım 8, not)", acc());
  chk(T(el,'neu-w1o')==='4.0'&&T(el,'neu-w2o')==='−5.0', "kredi: gelire artı, borca eksi ağırlık (not)", `${T(el,'neu-w1o')} · ${T(el,'neu-w2o')}`);
  /* adım 9 + kendini sına 2: b = −0.5 OR (4'te 2), b = −1.5 AND (4'te 4) */
  neu.__pick(2); P(el,'neu-step',true);
  const outs=()=>{ const o=[]; for(let k=0;k<4;k++){ o.push(T(el,'neu-y')); el('neu-next').click(); } return o.join(''); };
  const orA=acc(), orO=outs();            // satır sırası (0,0) (1,0) (0,1) (1,1)
  S(el,'neu-b',-15); const andA=acc(), andO=outs();
  chk(orA==='2 / 4'&&orO==='0111', "lamba: b = −0.5 'en az biri açık' (OR), 4 durumun 2'si doğru (adım 9)", `${orA} · ${orO}`);
  chk(andA==='4 / 4'&&andO==='0001', "lamba: b = −1.5 AND, dördü de doğru (adım 9)", `${andA} · ${andO}`);
  /* tek nöron XOR'u kuramaz: kaydırıcıların bütün ızgarasında (w₁, w₂, b) XOR tablosunu
     veren ağırlık yok. Gösterge AND'e göre saydığı için çıktıyı köşe köşe okuyoruz. */
  let xorHit=0;
  for(let a=-50;a<=50;a+=20) for(let c=-50;c<=50;c+=20) for(let b2=-50;b2<=50;b2+=10){
    S(el,'neu-w1',a); S(el,'neu-w2',c); S(el,'neu-b',b2); if(outs()==='0110') xorHit++; }
  chk(xorHit===0, "hiçbir w₁, w₂, b XOR'u vermiyor (adım 9, .ask)", `${xorHit} isabet`);
}

/* ── 24 · Oyun alanı: rehber adımları ve veri kümesi notları ──
   Eğitim rastgele başlangıçla, tık başına 2 epoch. Eşikler 8 koşuluk ölçümden
   (sarmalda 3): gizli katmansız daire 31–71 (ort ~54), 2×4 ReLU 100 epoch'ta 97–100,
   doğrusal 27–68 (16 koşu, ort ~48), kare öznitelikle 98–100, XOR 1×4 200 epoch'ta 83–100, tek nöronla
   41–68, lr 3'te 47–61. Tek koşuya değil ORTALAMAYA bakılır. */
{
  head("Modül 24 · Katman ekle, nöron ekle (oyun alanı)");
  const tr=(set,L,n,act,lr,sq,ticks)=>{ const {el,M,tick}=boot(F), m=M.find(x=>x.id==='m-lay');
    m.__pick(set); P(el,'lay-sq',sq); S(el,'lay-n',n); S(el,'lay-L',L); S(el,'lay-lr',lr); el(act).click();
    P(el,'lay-run',true); tick(ticks);
    return {acc:num(T(el,'lay-acc').slice(1)), te:V(el,'lay-te'), par:V(el,'lay-par'), ep:V(el,'lay-ep')}; };
  const runs=(k,...a)=>Array.from({length:k},()=>tr(...a));
  const mA=(r)=>mean(r.map(x=>x.acc));
  { const {el}=boot(F); chk(T(el,'lay-par')==='37', "varsayılan 2 → 4 → 4 → 1 ağ: 37 parametre (Göstergeler, kendini sına 1)", T(el,'lay-par')); }
  /* 16 koşuluk ölçüm (3. aşama birleştirmesi): gizli katmansız daire 29–69 (ort 51), XOR tek nöron
     32–78 (ort 51), 2×4 ReLU 100 epoch'ta 96–100 (ayrıca birer kez 88), kare öznitelik 97–100
     (birer kez 94). "Civarında" iddiaları 8 koşunun ORTALAMASIYLA, "%95'i geçiyor" 5 koşunun
     MEDYANIYLA sınanır; eskiden tek koşunun %95'in altına düşmesi bütün denetimi düşürüyordu. */
  const d0=runs(8,0,0,4,'lay-relu',4,false,150);
  chk(mA(d0)>=40&&mA(d0)<=62, "daire, gizli katman yok: %50 civarında (adım 1, not)", d0.map(x=>x.acc).join(' '));
  const d24=runs(5,0,2,4,'lay-relu',4,false,50);
  chk(med(d24.map(x=>x.acc))>=95&&d24[0].ep===100, "daire, 2×4 ReLU: 100 epoch'ta %95'in üstü (adım 3, not)", d24.map(x=>x.acc).join(' '));
  /* 16 koşuda 27–65, ortalama 48; koşuların ~%15'i 65'e değiyor. Eskiden üç koşunun HER
     BİRİ < 65 isteniyordu ve arada bir 68 gelip düşüyordu: 6 koşunun ortalamasına bakılır. */
  const dl=runs(6,0,2,4,'lay-lin',4,false,150);
  chk(mA(dl)<62, "doğrusal aktivasyon: daire çözülmüyor, çoğunlukla %30–65, yazı turaya yakın (adım 4)", dl.map(x=>x.acc).join(' '));
  const dq=runs(5,0,0,4,'lay-relu',4,true,150);
  chk(med(dq.map(x=>x.acc))>=95&&dq[0].par===6, "kare özniteliklerle gizli katmansız daire çözülüyor (adım 5)", dq.map(x=>x.acc).join(' '));
  const x0=runs(8,1,0,4,'lay-relu',4,false,100), x14=runs(4,1,1,4,'lay-relu',4,false,100);
  chk(mA(x0)>=40&&mA(x0)<=62, "XOR, tek nöron: %50 civarında (not)", x0.map(x=>x.acc).join(' '));
  chk(mA(x14)>=85, "XOR, 1 gizli katman 4 nöron yetiyor (adım 6, not; tek tük koşu yavaş kalır)", x14.map(x=>x.acc).join(' '));
  const g0=runs(2,2,0,4,'lay-relu',4,false,50);
  chk(g0.every(x=>x.acc>=98), "iki öbek: tek nöron bile %100'e çıkıyor (not)", g0.map(x=>x.acc).join(' '));
  /* 20 koşuda 43–57 (ort 50); nadiren ReLU'lar ölmeden ağ öğreniyor (bir kez 84): 5 koşunun medyanı */
  const lr3=runs(5,0,2,4,'lay-relu',7,false,100);
  chk(med(lr3.map(x=>x.acc))<=60&&med(lr3.map(x=>x.te))>=.6, "learning rate 3: ağ öğrenmiyor, kayıp 0.69 civarı (adım 8)", lr3.map(x=>`${x.acc}/${x.te}`).join(' '));
  const s3=runs(3,3,3,8,'lay-relu',4,false,400), s1=runs(3,3,1,8,'lay-relu',4,false,400);
  chk(mA(s3)>=mA(s1)+8&&mA(s1)<=65, "sarmal: 3×8 tek katmandan belirgin iyi, tek katman %50–60'ta (adım 7, not)", `3×8 ${s3.map(x=>x.acc).join(' ')} · 1×8 ${s1.map(x=>x.acc).join(' ')}`);
}

/* ── 25 · Rakamı tanıyan ağ: gömülü ağırlıklar ve test örnekleri ── */
{
  head("Modül 25 · Rakamı tanıyan ağ (MNIST, softmax)");
  const {el,M}=boot(F), m=M.find(x=>x.id==='m-dig');
  const AR=()=>el('c-dig').getAttribute('aria-label')||'';
  chk(T(el,'dig-par')==='6634', "196 · 32 + 32 + 32 · 10 + 10 = 6634 parametre (adım 8, elle hesap)", T(el,'dig-par'));
  chk(T(el,'dig-p')==='—', "kendi çizimin: kutu boş başlıyor, tahmin yok", T(el,'dig-p'));
  m.__pick(1);
  chk(T(el,'dig-acc')==='20 / 22', "test örnekleri: 22'nin 20'si doğru (not, adım 4)", T(el,'dig-acc'));
  chk(T(el,'dig-p')==='0'&&/ok/.test(el('dig-p').className), "ilk örnek bir 0 ve ağ 0 diyor (adım 1)", T(el,'dig-p'));
  let sumOk=0;
  for(let k=0;k<22;k++){ const sm=/Softmax: ([^.]+(?:\.\d+[^.]*)*)\./.exec(AR()), ps=[...AR().matchAll(/\d (\d\.\d{3})/g)].map(x=>+x[1]);
    if(ps.length===10&&Math.abs(ps.reduce((a,b)=>a+b,0)-1)<=0.006) sumOk++;
    if(k<21) el('dig-next').click(); }
  chk(sumOk===22, "softmax: on yüzdenin toplamı her örnekte 1 (adım 3)", `${sumOk}/22`);
  m.__pick(1); for(let k=0;k<7;k++) el('dig-next').click();
  chk(/gerçek rakam 5/.test(AR())&&T(el,'dig-p')==='6'&&T(el,'dig-c')==='%89', "sekizinci örnek bir 5, ağ %89 ile 6 diyor (adım 4)", `${T(el,'dig-p')} ${T(el,'dig-c')}`);
  m.__pick(2);
  chk(el('dig-cen').getAttribute('aria-pressed')==='false'&&T(el,'dig-acc')==='0 / 22', "kaymış rakamlar, ortalamasız: 22'nin hiçbiri (adım 6, not)", T(el,'dig-acc'));
  P(el,'dig-cen',true);
  chk(T(el,'dig-acc')==='21 / 22', "« Ortala » açılınca 21 / 22 (adım 7, not)", T(el,'dig-acc'));
}

/* ══ 3. aşama: Hafta 13–14 sunumlarından gelen etkileşimler ══
   Sunumun sayıları (beş öğrenci, altı nokta) SABİT veride birebir sınanır; rastgele
   veride ORTALAMA ve pay kullanılır (eşikler 20–30 turluk ölçümle konuldu). */

/* ── 17 · PCA: beş öğrenci, açıya göre varyans, birim anahtarı ── */
{
  head("Modül 17 · beş öğrenci, açı eğrisi ve birim anahtarı (Hafta 13)");
  const {el,M}=boot(F); const AR=()=>el('c-pca').getAttribute('aria-label')||'';
  const ang=()=>num((/PC1 (-?[\d.]+)°/.exec(AR())||[])[1]);
  PK(M,'m-pca',1);
  chk(T(el,'pca-v1')==='%99.52', "beş öğrenci: PC1 varyansın %99.52'si (adım 6, not, ex)", T(el,'pca-v1'));
  chk(T(el,'pca-lam')==='248.79 · 1.21', "özdeğerler n − 1 paydayla λ₁ = 248.79, λ₂ = 1.21 (adım 6)", T(el,'pca-lam'));
  chk(/PC1 40\.1° · v₁ = \(0\.765, 0\.644\)/.test(AR()), "PC1 yaklaşık 40°, v₁ = (0.765, 0.644) (adım 6, ex)", (/PC1 [^·]+· v₁ = \([^)]+\)/.exec(AR())||[''])[0]);
  chk(/0° → 146\.00, 90° → 104\.00/.test(AR()), "açı eğrisi: 0°'de matematiğin varyansı 146, 90°'de fiziğin 104 (adım 7)");
  chk(/tepe 40\.1° → 248\.79, dip 130\.1° → 1\.21/.test(AR()), "eğrinin tepesi 40°'de λ₁ = 248.79, dibi 130°'de λ₂ = 1.21 (adım 7)");
  { const g=(re)=>num((re.exec(AR())||[])[1]);
    const tot1=g(/0° → ([\d.]+)/)+g(/90° → ([\d.]+)/), tot2=g(/λ₁ ([\d.]+)/)+g(/λ₂ ([\d.]+)/);
    chk(Math.abs(tot1-250)<0.02&&Math.abs(tot2-250)<0.02, "toplam varyans korunuyor: 146 + 104 = 248.79 + 1.21 = 250 (adım 7, figür)", `${tot1.toFixed(2)} / ${tot2.toFixed(2)}`); }
  PK(M,'m-pca',3);
  chk(el('pca-units').hidden===false&&el('pca-corl').hidden===true&&el('pca-rotl').hidden===true,
      "birim anahtarı yalnız « Not ve süre »de görünür, uzama / dönme sabit tabloda gizli (ders notu)");
  el('pca-uh').click(); const h={a:ang(),p:V(el,'pca-v1')};
  el('pca-um').click(); const mi={a:ang(),p:V(el,'pca-v1')};
  el('pca-uz').click(); const z={a:ang(),p:V(el,'pca-v1'),l:T(el,'pca-lam')};
  console.log(`       saat ${h.a}° %${h.p} · dakika ${mi.a}° %${mi.p} · standart ${z.a}° %${z.p} (λ ${z.l})`);
  chk(Math.abs(h.a-5)<1&&Math.abs(h.p-99.2)<0.1, "süre saatle: PC1 yaklaşık 5°, %99.2 — neredeyse yalnız matematik (adım 8, not)", `${h.a}° %${h.p}`);
  chk(Math.abs(mi.a-85)<1&&Math.abs(mi.p-99.2)<0.1, "süre dakikayla: PC1 yaklaşık 85°, yine %99.2 (adım 9, not)", `${mi.a}° %${mi.p}`);
  chk(Math.abs(z.a-45)<0.05&&Math.abs(z.p-85.3)<0.05, "standartlaştırınca PC1 45°'de, %85.3 (adım 10, not, kendini sına)", `${z.a}° %${z.p}`);
  chk(z.l==='1.71 · 0.29', "standartta λ₁ = 1 + r = 1.71 (adım 10)", z.l);
  PK(M,'m-pca',0);
  chk(el('pca-units').hidden===true&&el('pca-corl').hidden===false, "rastgele bulutta kaydırıcılar geri, birim anahtarı gizli");
  chk(T(el,'pca-lam')==='—', "rastgele (birimsiz) bulutta özdeğer yazılmıyor (ders notu: göstergeler)", T(el,'pca-lam'));
}

/* ── 18 · k-ortalamalar: altı nokta, iyi / kötü başlangıç, veri biriminde J ── */
{
  head("Modül 18 · altı nokta: iyi ve kötü başlangıç (Hafta 14)");
  const {el,M,tick}=boot(F); const AR=()=>el('c-km').getAttribute('aria-label')||'';
  PK(M,'m-km',3);
  chk(T(el,'km-ko')==='2'&&el('km-fix').hidden===false&&el('km-init').hidden===true, "altı noktada k = 2 ve seçici iyi / kötü başlangıç (ders notu)");
  el('km-bad').click();
  const seq=[]; let mid='';
  for(let i=0;i<4;i++){ el('km-step').click(); seq.push(T(el,'km-j')); if(i===1) mid=AR(); }
  console.log(`       kötü başlangıç J: ${seq.join(' → ')}`);
  chk(seq.join(' → ')==='189.00 → 77.60 → 39.04 → 6.67', "kötü başlangıç (μ = A, B): J 189 → 77.6 → 39.04 → 6.67 (adım 10–13, not, ex)", seq.join(' → '));
  chk(/merkezler \(1\.00, 2\.00\) \(5\.80, 5\.80\)/.test(mid), "ilk güncellemede μ₂ (5.8, 5.8)'e kayıyor, μ₁ A'da (adım 11)");
  chk(/J geçmişi: 189\.00 → 77\.60 → 39\.04 → 6\.67/.test(AR()), "köşedeki J dizisi adım adım okunuyor (adım 13)");
  chk(/merkezler \(2\.00, 2\.33\) \(8\.00, 8\.00\)/.test(AR()), "merkezler (2, 2.33) ve (8, 8)'e varıyor (adım 13, ex)");
  el('km-step').click();
  chk(T(el,'km-i')==='3'&&T(el,'km-j')==='6.67', "kötü başlangıç üçüncü atamada duruyor: 3 iterasyon (adım 13, not)", `${T(el,'km-i')} · ${T(el,'km-j')}`);
  el('km-good').click(); el('km-run').click();
  for(let g=0;g<20&&T(el,'km-run')!=='Yakınsat';g++) tick(10);
  chk(T(el,'km-run')==='Yakınsat'&&T(el,'km-i')==='2'&&T(el,'km-j')==='6.67', "iyi başlangıç (μ = (2, 2), (8, 8)): 2 iterasyon, J = 6.67 (adım 9, not)", `${T(el,'km-i')} · ${T(el,'km-j')}`);
}

/* ── 18 · « 10 kez dene » (n_init) ve k-means++ ──
   Ölçüm (300 tur, uydu pikselleri, k = 3): rastgele başlangıçla on denemede ortalama
   2.68 farklı sonuç (sd 1.1; 20 turluk ortalamalar 2.35–3.05), k-means++ ile 1.15
   (sd 0.36). Müşteri verisinde (3 ya da 4 öbek, iç içe) fark yok — metin bu yüzden
   uydu piksellerini söylüyor. */
{
  head("Modül 18 · 10 kez dene (n_init) ve k-means++");
  const {el,M}=boot(F); const AR=()=>el('c-km').getAttribute('aria-label')||'';
  const dR=[], dP=[]; let kept=0; const N=20;
  for(let t=0;t<N;t++){
    PK(M,'m-km',2); S(el,'km-k',3);
    el('km-ir').click(); el('km-ten').click(); dR.push(V(el,'km-nd'));
    const Js=(AR().split('10 deneme: ')[1]||'').split(' ').map(Number);
    if(Js.length===10&&Math.abs(Math.min(...Js)-V(el,'km-j'))<1e-4) kept++;
    el('km-ip').click(); el('km-ten').click(); dP.push(V(el,'km-nd'));
  }
  console.log(`       uydu pikselleri k=3, ${N} tur: farklı sonuç rastgele ${mean(dR).toFixed(2)} · k-means++ ${mean(dP).toFixed(2)}`);
  chk(kept===N, "« 10 kez dene » on sonucun J'si en küçük olanını tutuyor (adım 7)", `${kept}/${N}`);
  chk(Math.abs(mean(dR)-2.7)<0.8, "rastgele başlangıçta on denemeden ortalama 2.7 farklı sonuç (adım 7)", mean(dR).toFixed(2));
  chk(Math.abs(mean(dP)-1.15)<0.3&&mean(dP)<mean(dR)-0.8, "k-means++ ile farklı sonuç azalıyor, ortalama 1.1 (adım 8, .ask)", mean(dP).toFixed(2));
}

/* ── 20 · hierarchical: dendrogram, linkage, kesme yüksekliği ──
   Ölçüm (20–30 tur): hilalde Single %100 (20/20), Ward %78.8 doğru, k-ortalamalar
   %75.8; halkada Single 20/20, Ward %61; öbek + gürültüde (100 tur) Single k = 3'te
   76'sında bir iki noktalık küme, Ward 100'de 100, Average 98 üç öbek. */
{
  head("Modül 20 · dendrogram ve linkage (Hafta 14)");
  const {el,M}=boot(F); const AR=()=>el('c-dbs').getAttribute('aria-label')||'';
  const uy=()=>[...AR().matchAll(/uyum %(\d+)/g)].map(x=>+x[1]);
  const boy=()=>((/boylar ([\d /]+)/.exec(AR())||[])[1]||'').split(' / ').map(Number);
  PK(M,'m-dbs',3);
  chk(el('db-hier').getAttribute('aria-pressed')==='true'&&el('db-lavg').getAttribute('aria-pressed')==='true'&&T(el,'db-ko')==='2',
      "« Altı nokta » seçilince sağ panel hierarchical, average linkage, k = 2 (not)");
  chk(/son birleşmeler 1\.41, 1\.41, 1\.71, 2\.24, 8\.30/.test(AR()), "average linkage yükseklikleri 1.41 / 1.41 / 1.71 / 2.24 / 8.30 (adım 11, ex, figür)",
      (/son birleşmeler [\d., ]+/.exec(AR())||[''])[0]);
  chk(/kesme 5\.27/.test(AR())&&T(el,'db-rn')==='2'&&boy().join('/')==='3/3', "k = 2 ağacı 5.27'den kesiyor: {A, B, C} ve {D, E, F} (adım 11)");
  S(el,'db-k',3);
  chk(/kesme 1\.97/.test(AR())&&boy().join('/')==='3/2/1', "k = 3: kesme 1.97, {A, B, C}, {D, F} ve tek başına {E} (adım 12)", boy().join('/'));
  const sg=[], wd=[], km=[];
  for(let t=0;t<16;t++){
    PK(M,'m-dbs',0); P(el,'db-hier',true); S(el,'db-k',2);
    el('db-lwar').click(); const u=uy(); km.push(u[0]); wd.push(u[1]);
    el('db-lsin').click(); sg.push(uy()[1]);
  }
  console.log(`       hilal k=2, 16 tur: k-ortalamalar %${mean(km).toFixed(1)} · Ward %${mean(wd).toFixed(1)} · Single %${mean(sg).toFixed(1)} doğru`);
  chk(sg.every(x=>x===100), "Single linkage hilalleri her seferinde ayırıyor (adım 7, .ask)", `${sg.filter(x=>x===100).length}/16`);
  chk(Math.abs(100-mean(wd)-20)<7, "Ward hilallerin yaklaşık beşte birini yanlış tarafa koyuyor (adım 6)", `%${(100-mean(wd)).toFixed(1)} yanlış`);
  chk(Math.abs(100-mean(km)-25)<7, "k-ortalamalar yaklaşık dörtte birini (adım 6)", `%${(100-mean(km)).toFixed(1)} yanlış`);
  let ring=0; const ringW=[];
  for(let t=0;t<12;t++){ PK(M,'m-dbs',1); P(el,'db-hier',true); S(el,'db-k',2);
    el('db-lsin').click(); if(uy()[1]===100) ring++;
    el('db-lwar').click(); ringW.push(uy()[1]); }
  chk(ring===12, "iç içe halkada yalnız Single ayırıyor (not)", `${ring}/12`);
  chk(Math.abs(mean(ringW)-61)<6, "Ward halkaları ortadan bölüp ~%61 tutturuyor (not)", `%${mean(ringW).toFixed(1)}`);
  let tiny=0, wOk=0, aOk=0; const N=30;
  for(let t=0;t<N;t++){ PK(M,'m-dbs',2); P(el,'db-hier',true); S(el,'db-k',3);
    el('db-lsin').click(); if(boy().some(x=>x<=2)) tiny++;
    el('db-lwar').click(); if(boy().every(x=>x>=20)) wOk++;
    el('db-lavg').click(); if(boy().every(x=>x>=20)) aOk++; }
  console.log(`       öbek + gürültü k=3, ${N} tur: Single'da bir iki noktalık küme ${tiny} · üç öbek Ward ${wOk}, Average ${aOk}`);
  /* p = 0.76 için 30 turda ≥ 17'nin altına düşme olasılığı ~%0.4 */
  chk(tiny>=17, "öbek + gürültüde Single k = 3'te çoğu zaman bir kümesi bir iki gürültü noktası (adım 9, not)", `${tiny}/${N}`);
  chk(wOk>=N-1, "Ward üç öbeği buluyor (adım 9: 'Ward'a geç', not)", `${wOk}/${N}`);
  chk(aOk>=N-4, "Average da neredeyse her seferinde (not: 100'de 98)", `${aOk}/${N}`);
  P(el,'db-dbscan',true);
  chk(el('db-link').hidden===true&&el('db-epsl').hidden===false, "DBSCAN'de linkage gizli, eps / min_samples görünür (ders notu)");
  P(el,'db-hier',true);
  chk(el('db-link').hidden===false&&el('db-epsl').hidden===true&&el('db-mpl').hidden===true, "hierarchical'da eps / min_samples yerine linkage seçicisi");
}

/* ══ 3. aşama · Modül 13 (KNN): uzaklık, ağırlıklı oy, test hatası ══
   Tuval metni sahte DOM'da okunmuyor; KNN tuvalinin aria-label'ı k, ölçü, oy,
   eğitim/test hatası, en düşük test hatasının k'sı, √n ve sorgunun komşularını
   (veri biriminde uzaklıkla) yazıyor. Karar bölgesi (knn-bnd) ölçümde kapalı:
   her k değişiminde binlerce hücre yeniden oylanıyor ve sınama yavaşlıyordu. */
{
  head("Modül 13 · test hatası ve k–hata eğrisi");
  const {el,M}=boot(F); P(el,'knn-bnd',false); P(el,'knn-euc',true); P(el,'knn-uni',true);
  const AR=()=>el('c-knn').getAttribute('aria-label')||'';
  const sweep=(j,N,ks)=>{ const tr={},te={},best=[]; ks.forEach(k=>{tr[k]=[];te[k]=[];});
    for(let t=0;t<N;t++){ PK(M,'m-knn',j);
      ks.forEach(k=>{ S(el,'knn-k',k); tr[k].push(V(el,'knn-e')); te[k].push(V(el,'knn-t')); });
      best.push(+(/en düşük test hatası k = (\d+)/.exec(AR())||[0,0])[1]); }
    return {tr,te,best}; };
  /* « Uçak / Kuş »: adım 2 "test hatası sıfır değil, %8 civarında"; not "k ≥ 5'te %5
     civarı, büyük k bile bozmuyor" (60 çekim: k=1 %7.7, k=7 %5.3, k=41 %4.8) */
  const a=sweep(0,20,[1,5,21,41]);
  console.log(`       Uçak/Kuş test hatası: k=1 %${mean(a.te[1]).toFixed(1)} · k=5 %${mean(a.te[5]).toFixed(1)} · k=41 %${mean(a.te[41]).toFixed(1)}`);
  chk(a.te[1].every(x=>x>0), "k=1'de test hatası sıfır DEĞİL (adım 2, .ask)", `min %${Math.min(...a.te[1])}`);
  chk(mean(a.te[1])>=5&&mean(a.te[1])<=11, "k=1'de test hatası %8 civarı (adım 2, not)", `%${mean(a.te[1]).toFixed(1)}`);
  chk(mean(a.te[5])<mean(a.te[1])&&mean(a.te[5])<=7.5, "k=5'te %5 civarına iniyor (not)", `%${mean(a.te[5]).toFixed(1)}`);
  chk(mean(a.te[41])<=7.5, "bulutlar ayrık: k=41 bile bozmuyor (not)", `%${mean(a.te[41]).toFixed(1)}`);
  /* « İki vadi »: adım 4–6 ve not — U eğrisi. 100 çekim: k=1 %18.8, k=7 %12.5, k=41 %20.7;
     tek çekimde U (k=1 ve k=41 ikisi de k=7'den kötü) 93/100; en düşük test k'sı 3–11'de 91/100 */
  const v=sweep(3,30,[1,7,41]);
  const u=v.te[1].filter((x,i)=>x>v.te[7][i]&&v.te[41][i]>v.te[7][i]).length;
  const mid=v.best.filter(b=>b>=3&&b<=11).length;
  console.log(`       İki vadi test hatası: k=1 %${mean(v.te[1]).toFixed(1)} · k=7 %${mean(v.te[7]).toFixed(1)} · k=41 %${mean(v.te[41]).toFixed(1)} · U ${u}/30 · en iyi k 3–11'de ${mid}/30`);
  console.log(`       İki vadi eğitim hatası: k=1 %${mean(v.tr[1]).toFixed(1)} · k=41 %${mean(v.tr[41]).toFixed(1)}`);
  chk(v.tr[1].every(x=>x===0), "İki vadi: k=1'de eğitim hatası %0 (adım 4)");
  chk(Math.abs(mean(v.te[1])-19)<=3.5, "İki vadi: k=1'de test hatası %19 civarı (adım 4, not)", `%${mean(v.te[1]).toFixed(1)}`);
  chk(Math.abs(mean(v.te[7])-12)<=3, "İki vadi: k=5–7'de %12 civarı (not)", `%${mean(v.te[7]).toFixed(1)}`);
  chk(Math.abs(mean(v.te[41])-21)<=3.5 && mean(v.tr[41])>18, "İki vadi: k=41'de test %21 civarı, eğitim %20'nin üstünde (adım 5)", `test %${mean(v.te[41]).toFixed(1)} · eğitim %${mean(v.tr[41]).toFixed(1)}`);
  chk(u>=24, "tek çekimde de U: iki uç ortadan kötü (adım 6: 'önce iniyor, sonra çıkıyor')", `${u}/30`);
  chk(mid>=23, "en düşük test hatası çoğunlukla k = 3–11'de (adım 6, not)", `${mid}/30`);
  chk(/√n ≈ 8\.9/.test(AR()), "√n ≈ 9 (80 eğitim noktası; adım 6, not)", (/√n ≈ [\d.]+/.exec(AR())||[''])[0]);
  /* Göstergeler (ders notu): "ağırlıklı oyda HER k'da %0" */
  P(el,'knn-dw',true); let w0=0;
  for(let t=0;t<6;t++){ PK(M,'m-knn',3); for(const k of [1,7,21,41]){ S(el,'knn-k',k); if(V(el,'knn-e')!==0) w0++; } }
  chk(w0===0, "ağırlıklı oyda eğitim hatası her k'da %0 (ders notu · Göstergeler)", `${w0} sıfır olmayan`);
  P(el,'knn-uni',true);
  /* « Baz istasyonu » notu: "k = 41'de ... test hatası %50'ye yaklaşır" (30 çekim: %48) */
  const b=sweep(1,12,[41]);
  chk(mean(b.te[41])>40, "Baz istasyonu: k=41'de iç öbek yutuluyor, test hatası %50'ye yakın (not)", `%${mean(b.te[41]).toFixed(1)}`);
  /* « Kredi riski » notu: "test hatası %35 civarı. k = 21'de %27'ye iner" (100 çekim: 34.3 / 27.5) */
  const c=sweep(2,24,[1,21]);
  chk(Math.abs(mean(c.te[1])-35)<=5 && Math.abs(mean(c.te[21])-27)<=4, "Kredi riski: k=1 %35 civarı, k=21 %27 civarı (not)", `%${mean(c.te[1]).toFixed(1)} → %${mean(c.te[21]).toFixed(1)}`);
}

/* ── Modül 13 · sabit örnekler: Hafta 9'un Q = (5, 5)'i ve altı daire ── */
{
  head("Modül 13 · uzaklık ölçüsü ve ağırlıklı oy (sabit örnekler)");
  const {el,M}=boot(F); P(el,'knn-bnd',false);
  const AR=()=>el('c-knn').getAttribute('aria-label')||'';
  /* « İki eczane » (adım 8, not, .ask): k = 1; Öklid A 4.24, Manhattan B 5 < 6, Chebyshev A 3 */
  PK(M,'m-knn',5); P(el,'knn-uni',true); S(el,'knn-k',1);
  const run=(id)=>{ el(id).click(); return {p:T(el,'knn-p'), ar:AR()}; };
  const e=run('knn-euc'), m=run('knn-man'), ch=run('knn-che');
  console.log(`       Öklid → ${e.p} · Manhattan → ${m.p} · Chebyshev → ${ch.p}`);
  chk(e.p==='A eczanesi' && /komşular A 4\.24/.test(e.ar), "Öklid: en yakın A, 4.24 sokak (adım 8, not)", e.ar.slice(-40));
  chk(m.p==='B eczanesi' && /komşular B 5\.00/.test(m.ar), "Manhattan: tahmin B'ye dönüyor, 5 sokak (adım 8, .ask)", m.ar.slice(-40));
  chk(ch.p==='A eczanesi' && /komşular A 3\.00/.test(ch.ar), "Chebyshev: en büyük fark, A 3 (not)", ch.ar.slice(-40));
  S(el,'knn-k',3); el('knn-man').click();
  chk(/B 5\.00, A 6\.00/.test(AR()), "Manhattan'da A 3 + 3 = 6 sokak (adım 8)", AR().slice(-30));
  el('knn-euc').click();
  chk(/A 4\.24, B 5\.00/.test(AR()), "Öklid'de A 4.24, B 5.00 (adım 8)", AR().slice(-30));
  /* « Altı daire » (adım 9, not, ders notu ex): k = 3 → D 0.305, B 0.650, C 1.242; 2–1 pahalı,
     P = 0.67; ağırlıklı P = 0.73 (D 3.28 + C 0.81 = 4.1 · B 1.54); k = 5 → 3–2 pahalı değil */
  PK(M,'m-knn',4); P(el,'knn-euc',true); P(el,'knn-uni',true); S(el,'knn-k',3);
  console.log(`       altı daire k=3: ${T(el,'knn-p')} · ${T(el,'knn-v')} · ${AR().split('komşular ')[1]}`);
  chk(/komşular D 0\.305, B 0\.650, C 1\.242/.test(AR()), "en yakın üç daire D 0.305, B 0.650, C 1.242 (ders notu ex, adım 9)", AR().split('komşular ')[1]);
  chk(T(el,'knn-p')==='Pahalı' && T(el,'knn-v')==='2 – 1 · P = 0.67', "eşit oy 2–1 pahalı, P = 0.67 (adım 9, .ask)", T(el,'knn-v'));
  el('knn-dw').click();
  chk(T(el,'knn-v')==='4.1 – 1.5 · P = 0.73', "ağırlıklı oy: Σw 4.1 – 1.5, P = 0.73 (adım 9, .ask)", T(el,'knn-v'));
  el('knn-uni').click(); S(el,'knn-k',5);
  chk(T(el,'knn-p')==='Pahalı değil' && /^2 – 3 /.test(T(el,'knn-v')), "k = 5'te 3–2 « pahalı değil »e dönüyor (not, figür)", `${T(el,'knn-p')} · ${T(el,'knn-v')}`);
}

/* ══ 3. aşama · Modül 14 (karar ağacı): ölçüt, test doğruluğu, derinlik eğrisi ══ */
{
  head("Modül 14 · Gini ↔ entropi (On başvuru) ve derinlik eğrisi");
  const {el,M}=boot(F);
  const AR=()=>el('c-dt').getAttribute('aria-label')||'';
  const KT=(id)=>String(el(id).innerHTML||'').replace(/<[^>]+>/g,'');
  /* « On başvuru » (adım 7–8, not, ders notu ex): kök « gelir < 38 »; Gini 0.500 → 0.320,
     kazanç 0.180; entropi 1.000 → 0.722, information gain 0.278 */
  el('dt-gini').click(); PK(M,'m-dt',4); S(el,'dt-d',1); el('dt-best').click();
  const g=[T(el,'dt-g0'),T(el,'dt-g1'),T(el,'dt-gain')].join(' / ');
  chk(g==='0.500 / 0.320 / 0.180' && KT('dt-kg')==='Gini kazancı', "Gini: 0.500 → 0.320, Gini kazancı 0.180 (adım 7, not)", `${g} · ${KT('dt-kg')}`);
  chk(T(el,'dt-to')==='38.0' && /kök gelir < 38\.0/.test(AR()), "kök sorusu « gelir < 38 », veri biriminde (adım 7)", T(el,'dt-to'));
  el('dt-ent').click();
  const h=[T(el,'dt-g0'),T(el,'dt-g1'),T(el,'dt-gain')].join(' / ');
  chk(h==='1.000 / 0.722 / 0.278' && KT('dt-kg')==='Information gain' && KT('dt-k0')==='Kök entropi',
      "entropi: 1.000 → 0.722, information gain 0.278; gösterge adları değişiyor (adım 7, brief)", `${h} · ${KT('dt-k0')} · ${KT('dt-kg')}`);
  el('dt-best').click();
  chk(T(el,'dt-to')==='38.0', "entropiyle de seçilen eşik aynı yerde (adım 7)", T(el,'dt-to'));
  /* not: "Gecikme de aynı kazancı veriyor" — dikey eksende en iyi eşik de 0.180 */
  el('dt-gini').click(); el('dt-av').click(); let gv=0;
  for(let i=2;i<=98;i++){ S(el,'dt-t',i); gv=Math.max(gv,V(el,'dt-gain')); }
  chk(Math.abs(gv-0.18)<1e-9, "gecikme sorusu da 0.180 kazanç veriyor, beraberlikte gelir seçiliyor (not)", `dikey en iyi ${gv}`);
  el('dt-best').click();
  chk(el('dt-au').getAttribute('aria-pressed')==='true', "« En iyi bölmeyi bul » beraberlikte ilk sütunu (gelir) seçiyor (not, ders notu ex)");
  /* adım 8 ve not: "Derinlik 3: 6 yaprak, eğitim %100; yaprakların 4'ünde tek başvuru" */
  S(el,'dt-d',3);
  const tek=(AR().match(/\(1\)/g)||[]).length;
  chk(T(el,'dt-leaf')==='6' && T(el,'dt-acc')==='100%' && tek===4, "derinlik 3: 6 yaprak, %100, 4 yaprakta tek başvuru (adım 8, not)", `${T(el,'dt-leaf')} yaprak · ${T(el,'dt-acc')} · tek ${tek}`);
  /* Gini ve entropi en iyi eşiği çoğunlukla aynı yerde bulur (ders notu idea; Bağ verisinde 39/40) */
  let same=0;
  for(let t=0;t<16;t++){ el('dt-gini').click(); PK(M,'m-dt',0); el('dt-best').click(); const a=el('dt-t').value, ax=el('dt-av').getAttribute('aria-pressed');
    el('dt-ent').click(); el('dt-best').click(); if(el('dt-t').value===a && el('dt-av').getAttribute('aria-pressed')===ax) same++; }
  chk(same>=13, "Gini ve entropi en iyi bölmeyi çoğunlukla aynı yerde buluyor (ders notu, .ask)", `${same}/16`);
  el('dt-gini').click();
  /* « Bağ hastalığı » notu: "test doğruluğu derinlik 2'den sonra %94–95'te kalıyor" */
  const bt=[];
  for(let t=0;t<16;t++){ PK(M,'m-dt',0); el('dt-best').click(); const r=[]; for(const d of [2,4,8]){ S(el,'dt-d',d); r.push(V(el,'dt-tacc')); } bt.push(r); }
  const bm=[0,1,2].map(i=>mean(bt.map(r=>r[i])));
  chk(bm.every(x=>x>=91&&x<=98), "Bağ: test doğruluğu derinlik 2–8'de %94–95 civarı (not)", bm.map(x=>'%'+x.toFixed(1)).join(' '));
  /* « Kalite kontrol » notu: "derinlik 2'de test doğruluğu %98" */
  const kq=[]; for(let t=0;t<12;t++){ PK(M,'m-dt',2); el('dt-best').click(); S(el,'dt-d',2); kq.push(V(el,'dt-tacc')); }
  chk(mean(kq)>=95, "Kalite kontrol: derinlik 2'de test %98 civarı (not)", `%${mean(kq).toFixed(1)}`);
  /* « Kredi onayı » (adım 5–6, not, .ask, trap). 100 çekim: derinlik 1 %74/%71, 3 %85/%78,
     8 %98/%73, yaprak 31.3; en iyi test derinliği 2–4'te 89/100 (20 çekimde 15/20 da
     görüldü: eşik 30 çekimde 22, binom alt kuyruğu ~%0.5) */
  const K={tr:[[],[],[]],te:[[],[],[]],lf:[],bd:[]};
  for(let t=0;t<30;t++){ PK(M,'m-dt',3); el('dt-best').click();
    [1,3,8].forEach((d,i)=>{ S(el,'dt-d',d); K.tr[i].push(V(el,'dt-acc')); K.te[i].push(V(el,'dt-tacc')); if(d===8) K.lf.push(V(el,'dt-leaf')); });
    K.bd.push(+(/en iyi test derinliği (\d+)/.exec(AR())||[0,0])[1]); }
  const kt=K.tr.map(mean), ke=K.te.map(mean), bd24=K.bd.filter(d=>d>=2&&d<=4).length;
  console.log(`       Kredi onayı eğitim/test: d1 %${kt[0].toFixed(1)}/%${ke[0].toFixed(1)} · d3 %${kt[1].toFixed(1)}/%${ke[1].toFixed(1)} · d8 %${kt[2].toFixed(1)}/%${ke[2].toFixed(1)} · yaprak d8 ${mean(K.lf).toFixed(1)} · en iyi 2–4: ${bd24}/30`);
  chk(Math.abs(kt[0]-74)<=4 && Math.abs(ke[0]-71)<=4, "derinlik 1: eğitim %74, test %71 civarı (not)", `%${kt[0].toFixed(1)} / %${ke[0].toFixed(1)}`);
  chk(Math.abs(kt[1]-85)<=4 && Math.abs(ke[1]-78)<=4, "derinlik 3: eğitim %85, test %78 civarı (adım 5, not)", `%${kt[1].toFixed(1)} / %${ke[1].toFixed(1)}`);
  chk(kt[2]>=96 && Math.abs(ke[2]-73)<=4, "derinlik 8: eğitim %98, test %73 civarı (adım 6, .ask, trap)", `%${kt[2].toFixed(1)} / %${ke[2].toFixed(1)}`);
  chk(ke[1]>ke[2]+2.5 && kt[2]>kt[1]+8, "makas: eğitim yükselirken test düşüyor (adım 6)", `test %${ke[1].toFixed(1)} → %${ke[2].toFixed(1)}`);
  chk(mean(K.lf)>=24 && mean(K.lf)<=37, "derinlik 8'de 30 civarı yaprak (adım 6, .ask)", `ort ${mean(K.lf).toFixed(1)}`);
  chk(bd24>=22, "en iyi test derinliği çoğunlukla 2–4 (adım 5, not)", `${bd24}/30`);
}

console.log(`\n${fail?fail+" DENETİM DÜŞTÜ":"tüm davranış denetimleri geçti"}`);
process.exit(fail?1:0);
