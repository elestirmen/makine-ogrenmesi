/* Ajanların yazdığı 4 modülün PEDAGOJİK İDDİALARINI sına.
   Çökme değil, matematik doğru mu — göstergelerden okuyarak. */
const {boot}=require('./harness.js');
const F=process.argv[2];
let fail=0;
const chk=(ok,msg,extra)=>{ console.log(`  ${ok?'OK   ':'HATA '} ${msg}${extra?'  ['+extra+']':''}`); if(!ok)fail++; };
const num=(s)=>{const m=/(-?[\d.]+)/.exec(String(s));return m?parseFloat(m[1]):NaN;};

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
  const out=[];
  for(const k of [1,40]){
    const ks=el('ens-k'); ks.value=String(k); ks.dispatchEvent({type:'input'});
    tick(200);
    out.push({k, oob:num(el('ens-oob').textContent), tr:num(el('ens-tr').textContent),
              one:num(el('ens-one').textContent), cnt:el('ens-cnt').textContent});
  }
  out.forEach(x=>console.log(`       ${x.k} ağaç: eğitim=%${x.tr} OOB=%${x.oob} tek ağaç OOB=%${x.one}`));
  chk(Number.isFinite(out[1].oob), "40 ağaçta OOB doğruluğu hesaplanıyor");
  /* k=1'in OOB'si tek bir ağacın torba dışı örneklerinden gelir, yüksek varyanslı:
     40 ağaçla doğrudan karşılaştırmak %8 oranında yanlış alarm veriyordu. Modülün
     kendi "Tek ağaç (OOB)" göstergesi (ağaçlar üzerinden ortalama) kararlı referans. */
  chk(out[1].oob>out[1].one-1, "orman OOB'si tek ağaç OOB'sini geçiyor", `orman %${out[1].oob} vs tek %${out[1].one}`);
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

console.log(`\n${fail?fail+" DENETİM DÜŞTÜ":"tüm davranış denetimleri geçti"}`);
process.exit(fail?1:0);
