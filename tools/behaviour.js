/* 23 modülün PEDAGOJİK İDDİALARINI sına: çökme değil, ".ask kutusu ve rehberli
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
  console.log("=== Modül 22 · Gizli katman (XOR) ===");
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

/* ── 07 · Rastgele orman: çok ağaç tek ağacı geçer ── */
{
  console.log("\n=== Modül 09 · Kırk ağaç (torbalama / OOB) ===");
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
  console.log("\n=== Modül 13 · Katsayıya ceza (L1 / L2) ===");
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

/* ── 14 · Çapraz doğrulama: katlar ve ortalama tutarlı ── */
{
  console.log("\n=== Modül 16 · Şansı ortalamak (k-katlı) ===");
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
  head("Modül 03 · En iyi doğru (least squares)");
  const {el,M,tick,TIMERS}=boot(F); const r=[];
  /* tuval metni sahte DOM'da okunmuyor; denklem ve "cevap gizli mi" tuvalin
     aria-label'ında da yazıyor. Katsayılar "−" (U+2212) ile yazılıyor. */
  const AR=()=>el('c-lin').getAttribute('aria-label')||'';
  const sv=(s)=>num(String(s).replace(/−/g,'-'));
  /* "Senin doğrun: y = 0.030x + 2.00, yani fiyat = 0.030 · alan + 2.00." — iki biçim */
  const eqOf=(txt,who)=>{const m=new RegExp(who+': y = (−?[\\d.]+)x ([+−]) ([\\d.]+), yani \\S+ = (−?[\\d.]+) · \\S+ ([+−]) ([\\d.]+)\\.').exec(txt);
    return m?{A:sv(m[1]), B:sv((m[2]==='−'?'-':'')+m[3]), A2:sv(m[4]), B2:sv((m[5]==='−'?'-':'')+m[6])}:null;};
  const alive=()=>TIMERS.filter(Boolean).length;
  for(let t=0;t<20;t++){
    el('lin-new').click();
    const hid=AR();                                    // yeni bulut: cevap gizli olmalı
    S(el,'lin-a',-100); S(el,'lin-b',120);            // bilerek kötü doğru
    const bad=V(el,'lin-sse'), stBad=T(el,'lin-st');
    const eqU=eqOf(AR(),'Senin doğrun'), ao=sv(T(el,'lin-ao')), bo=sv(T(el,'lin-bo'));
    const t0=alive();
    el('lin-fit').click();                             // "Least squares çözümü" — animasyon başlar
    const after=AR(), ghost=/Son tahminin kesikli çizgide, SSE (\d+\.\d+)/.exec(after);
    r.push({bad, got:V(el,'lin-sse'), best:V(el,'lin-best'), st:T(el,'lin-st'), stBad,
      hidden:/henüz gizli/.test(hid)&&!/Least squares:/.test(hid),
      open:/Least squares:/.test(after), ghost:ghost?+ghost[1]:NaN,
      eqOk:!!eqU&&Math.abs(eqU.A-ao)<1e-9&&Math.abs(eqU.B-bo)<1e-9&&eqU.A===eqU.A2&&eqU.B===eqU.B2});
    const ch=/Adım adım çözüm: SSE (\d+\.\d+) → (\d+\.\d+) → (\d+\.\d+)/.exec(after);
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
  /* ders notu · Denklem: "iki biçimde: y = 0.035x + 1.80, yani fiyat = …" ve
     "Kaydırıcıların yanındaki iki sayı bu iki katsayı" */
  chk(r.every(x=>x.eqOk), "y = ax + b ile verinin dilindeki denklem ve kaydırıcılar aynı katsayıyı söylüyor",
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
  chk(ar.every(v=>v<0), "Araç yaşı: formül eğimi her seferinde eksi buluyor (adım 6)", `${ar.filter(v=>v>=0).length}/40 artı`);
  pick(0);
}

/* ── 04 · Çoklu doğrusal regresyon: düzlem, "öteki sabitken", karıştırıcı etki ── */
{
  head("Modül 04 · İki öznitelik, bir düzlem (multiple linear regression)");
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

  /* veri kümesi notları: "tek başına" = yalnız x₁'li doğru (Modül 03), "birlikte" = düzlem.
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
  head("Modül 05 · Eğri de doğrusal olabilir (polynomial regression)");
  const {el,M,TIMERS,tick}=boot(F); const mod=M.find(m=>m.id==='m-poly');
  const AR=()=>el('c-poly').getAttribute('aria-label')||'';
  const alive=()=>TIMERS.filter(Boolean).length;
  /* « Least squares çözümü » (m-lin kuralı): eğri kendiliğinden oturmaz, göstergeler basıldığı
     anda son değerde, çizim ~1.2 sn'de kayar. Ölçümler bu düğmeye basılarak alınıyor. */
  { mod.__pick(0); el('poly-d1').click(); const r=[];
    for(let t=0;t<12;t++){
      el('poly-new').click();
      const r2new=T(el,'poly-r2'), flatBad=!/ok/.test(el('poly-rmse').className);
      const t0=alive(); el('poly-fit').click(); const on=alive()>t0;
      const fitOk=T(el,'poly-rmse')===T(el,'poly-best')&&/ok/.test(el('poly-rmse').className)&&/^Least squares:/.test(/\. (Least squares|Model):/.exec(AR())?.[1]+':');
      const ghost=/Önceki eğri kesikli çizgide/.test(AR());
      tick(38); const at38=alive()>t0; tick(4); const at42=alive()>t0;
      const r1=V(el,'poly-r2'); el('poly-d2').click();            // yeni sütun, ağırlığı 0
      const kept=Math.abs(V(el,'poly-r2')-r1)<1e-9&&!/ok/.test(el('poly-rmse').className);
      el('poly-fit').click(); const r2=V(el,'poly-r2');
      el('poly-fit').click();                                     // geçiş sürerken ikinci basış
      const skip=alive()===t0;
      el('poly-d1').click();
      r.push({r2new,flatBad,on,fitOk,ghost,at38,at42,kept,up:r2>r1,skip});
    }
    const bad=(k)=>r.filter(x=>!x[k]).length;
    chk(r.every(x=>x.r2new==='0.000'&&x.flatBad), "yeni veride model düz çizgi: R² 0, RMSE en iyisi değil (adım 1)", `${r.filter(x=>!(x.r2new==='0.000'&&x.flatBad)).length}/12`);
    chk(r.every(x=>x.fitOk), "« Least squares çözümü » en iyi ağırlıkları buluyor (RMSE = en iyi RMSE, yeşil)", `${bad('fitOk')}/12 sapma`);
    chk(r.every(x=>x.on&&x.at38&&!x.at42), "eğri ~1.2 sn'de yerine iniyor ve geçiş kendiliğinden bitiyor", `başladı ${12-bad('on')} · 38. tıkta süren ${12-bad('at38')} · 42. tıkta süren ${12-bad('at42')}`);
    chk(r.every(x=>x.ghost), "önceki eğri kesikli çizgide kalıyor (adım 2)");
    chk(r.every(x=>x.kept), "yeni sütunun ağırlığı 0'dan başlıyor: eğri kıpırdamıyor (adım 2)", `${bad('kept')}/12 değişti`);
    chk(r.every(x=>x.up), "düğmeye basınca yeni sütun R²'yi yükseltiyor");
    chk(r.every(x=>x.skip), "geçiş sürerken ikinci basış sona atlıyor");
  }
  const sv=(s)=>num(String(s).replace(/−/g,'-'));
  /* veri dışı tahmin ve gerçek değer aria-label'da: "20:00 tahmini: model 30.6 °C, gerçek 20.1 °C." */
  const ex=()=>{const m=/model (−?[\d.]+) \S+, gerçek (−?[\d.]+)/.exec(AR()); return m?{pe:sv(m[1]),te:sv(m[2])}:{pe:NaN,te:NaN};};
  const run=(k,N)=>{ mod.__pick(k); const R={1:[],2:[],3:[],4:[]};
    for(let t=0;t<N;t++){ el('poly-new').click();
      for(let d=1;d<=4;d++){ el('poly-d'+d).click(); el('poly-fit').click(); const e=ex();
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
  head("Modül 07 · Komşuna bak (k-NN)");
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
  head("Modül 06 · Yüzde kaç? (logistic regression)");
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

/* ── 06 · Karar ağacı: düğme kaydırıcının ulaşabildiği en iyi bölmeyi buluyor ── */
{
  head("Modül 08 · Bölerek karar ver (decision tree)");
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

/* ── 09 · Aşırı öğrenme: Durum göstergesi en iyi derecede uyarı VERMEMELİ ── */
{
  head("Modül 11 · Ezber mi, öğrenme mi (overfitting)");
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

/* ── 12 · Gradyan inişi: kaydırıcının ULAŞABİLDİĞİ bir değerde ıraksamalı ── */
{
  head("Modül 14 · Yamaçtan aşağı (gradient descent)");
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
  head("Modül 15 · Eşiği nereye koyalım (precision / recall)");
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
  head("Modül 17 · Etiketsiz gruplama (k-means)");
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

/* ── 16 · Kaç küme: ayrık veride her iki ölçüt de gerçek k'yı bulmalı ── */
{
  head("Modül 18 · Kaç küme var? (elbow / silhouette)");
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
  head("Modül 20 · İki sayı yerine bir (PCA)");
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
  head("Modül 21 · Tek nöron (perceptron)");
  const go=(btn)=>{const {el,tick}=boot(F); el(btn).click(); el('per-run').click(); tick(900);
    return {m:V(el,'per-m'), u:V(el,'per-u'), raw:T(el,'per-m')};};
  const sep=go('per-sep'), xor=go('per-xor');
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
  head("Modül 23 · Filtre gezdirmek (convolution)");
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
  head("Modül 07 · veri kümesi « Baz istasyonu » (halka)");
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

/* ── 05 · k-NN · "Kredi riski": sınıflar iç içe ── */
{
  head("Modül 07 · veri kümesi « Kredi riski » (gürültülü sınır)");
  const {el,M}=boot(F); const e1=[],e21=[];
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
  head("Modül 11 · üç eğri, üç ayrı « doğru derece »");
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
  head("Modül 14 · üç hata yüzeyi (convex / dik kanyon)");
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

/* ── 06 · Karar ağacı · "Sahte işlem": pozitif sınıf bir kutunun içinde ── */
{
  head("Modül 08 · veri kümesi « Sahte işlem » (tek eşik yetmiyor)");
  const {el,M}=boot(F); const d1=[],d3=[];
  for(let t=0;t<10;t++){ PK(M,'m-dt',1); el('dt-best').click();
    S(el,'dt-d',1); d1.push(V(el,'dt-acc'));
    S(el,'dt-d',3); d3.push(V(el,'dt-acc')); }
  console.log(`       eğitim doğruluğu: derinlik 1 → %${mean(d1).toFixed(1)} · derinlik 3 → %${mean(d3).toFixed(1)}`);
  chk(mean(d3)-mean(d1)>8, "iki eşik bir eşikten belirgin biçimde iyi (adım 5: 'tek eşikle kutuyu ayıramıyoruz')",
      `+${(mean(d3)-mean(d1)).toFixed(1)} puan`);
  chk(mean(d1)<92, "derinlik 1 kutuyu ayıramıyor", `%${mean(d1).toFixed(1)}`);
}

/* ── 07 · Orman · "Pivot sulama": sınır kapalı bir eğri ── */
{
  head("Modül 09 · veri kümesi « Pivot sulama » (halka sınır)");
  const {el,M,tick}=boot(F); const oob=[],one=[];
  for(let t=0;t<8;t++){ PK(M,'m-ens',1); S(el,'ens-d',4); S(el,'ens-k',40); tick(50);
    oob.push(V(el,'ens-oob')); one.push(V(el,'ens-one')); }
  console.log(`       40 ağaç OOB %${mean(oob).toFixed(1)} · tek ağaç OOB %${mean(one).toFixed(1)}`);
  chk(mean(oob)-mean(one)>2, "topluluk halka sınırında da tek ağacı geçiyor (adım 5)",
      `+${(mean(oob)-mean(one)).toFixed(1)} puan`);
}

/* ── 13 · Eşik · üç senaryo, üç ayrı maliyet ── */
{
  head("Modül 15 · üç senaryo (İHA / kanser / spam)");
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

/* ── 08 · SVM: C koridoru daraltır, RBF halkayı çözer ── */
{
  head("Modül 10 · En geniş koridor (C ve kernel)");
  const {el,M}=boot(F);
  const wide=[], mid=[], narrow=[], svN=[];
  for(let t=0;t<10;t++){
    PK(M,'m-svm',0); P(el,'svm-lin',true);
    S(el,'svm-c',0);   wide.push(V(el,'svm-m'));
    S(el,'svm-c',50);  mid.push(V(el,'svm-m'));
    S(el,'svm-c',100); narrow.push(V(el,'svm-m'));
    svN.push(V(el,'svm-sv'));
  }
  console.log(`       marj: C=0.01 → ${mean(wide).toFixed(3)} · C=1 → ${mean(mid).toFixed(3)} · C=100 → ${mean(narrow).toFixed(3)}`);
  chk(mean(wide)>mean(narrow), "C büyüdükçe marj koridoru daralıyor (adım 2–3)",
      `${mean(wide).toFixed(3)} → ${mean(narrow).toFixed(3)}`);
  chk(mean(svN)<36, "modeli 36 noktanın yalnız bir kısmı belirliyor (.ask: 'kaçını gerçekten kullanıyor')",
      `ortalama ${mean(svN).toFixed(1)} destek vektörü / 36 nokta`);
  const linErr=[], rbfErr=[];
  for(let t=0;t<10;t++){
    PK(M,'m-svm',2);                                   // halka
    P(el,'svm-lin',true); S(el,'svm-c',60); linErr.push(V(el,'svm-err'));
    P(el,'svm-rbf',true); S(el,'svm-g',45); rbfErr.push(V(el,'svm-err'));
  }
  console.log(`       halka verisi · yanlış sınıflanan: doğrusal ${mean(linErr).toFixed(1)} · RBF ${mean(rbfErr).toFixed(1)}`);
  chk(mean(linErr)>3*Math.max(mean(rbfErr),0.2), "doğrusal çekirdek halkada çaresiz, RBF çözüyor (adım 5)",
      `doğrusal ${mean(linErr).toFixed(1)} → RBF ${mean(rbfErr).toFixed(1)}`);
}

/* ── 10 · Yanlılık–varyans: karmaşıklık ikisini ters yönde hareket ettiriyor ── */
{
  head("Modül 12 · Yanlılık mı, varyans mı (ayrışma)");
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
  head("Modül 19 · Küme yuvarlak olmak zorunda mı (DBSCAN)");
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
  head("Modül 19 · çekirdek nokta (adım 3: 'Çekirdek, sınır, gürültü')");
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
  head("Modül 22 · 4 nöron birkaç düzine epoch'ta (adım 4)");
  const {el,tick}=boot(F); const ep=[]; let miss=0;
  for(let t=0;t<8;t++){
    el('mlp-xor').click(); S(el,'mlp-h',4); el('mlp-reset').click();
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
  head("Modül 16 · karıştırmalar arası yayılım (.ask ve adım 4)");
  const {el}=boot(F);
  const spread=(k)=>{ S(el,'cv-k',k); S(el,'cv-d',3); const r=[];
    for(let i=0;i<10;i++){ el('cv-shuf').click(); r.push(V(el,'cv-vm')); }
    const m=mean(r); return Math.sqrt(mean(r.map(x=>(x-m)**2))); };
  const s2=[],s10=[];
  for(let t=0;t<6;t++){ el('cv-new').click(); s2.push(spread(2)); s10.push(spread(10)); }
  console.log(`       karıştırma ortalamalarının std'si: k=2 → ${mean(s2).toFixed(4)} · k=10 → ${mean(s10).toFixed(4)}`);
  chk(mean(s10)<mean(s2)*0.75, "k büyüyünce karıştırmadan karıştırmaya ortalama daha kararlı", `${mean(s2).toFixed(4)} → ${mean(s10).toFixed(4)}`);
}

/* ── 19 · Perceptron: "Tek düzeltme: yanlış taraftaki ilk noktayı bulup çizgiyi itiyor" ── */
{
  head("Modül 21 · tek düzeltme (adım 2)");
  let moved=0, one=0, N=10;
  for(let t=0;t<N;t++){
    const {el}=boot(F); el('per-sep').click();
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
  head("Modül 08 · kurallar ağacı (adım 4–5)");
  const {el,M}=boot(F); const dt=M.find(m=>m.id==='m-dt');
  let bad=0;
  for(let t=0;t<6;t++){ el('dt-demo').click(); P(el,'dt-tree',true);
    for(const d of [1,2,3,5]){ S(el,'dt-d',d); try{ dt.draw(); }catch(e){ bad++; } } }
  chk(bad===0, "ağaç görünümü her derinlikte çiziliyor", `${bad} hata`);
}

console.log(`\n${fail?fail+" DENETİM DÜŞTÜ":"tüm davranış denetimleri geçti"}`);
process.exit(fail?1:0);
