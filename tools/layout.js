#!/usr/bin/env node
/* Projeksiyon yerleşimi: gösterge satırı (.stats) perdenin İÇİNDE mi?
   Öteki araçlar bunu göremiyor — harness.js sahte DOM'da yerleşim hesaplamıyor,
   lint sabit eşiklere bakıyor. Oysa ölçtüğümüzde 1280×720'de .stats her modülde
   perdenin altında kalıyordu (+22 … +256 px): hoca ders ortasında sayıları görmek
   için kaydırmak zorundaydı.

   Gerçek Chromium gerekiyor, o yüzden İSTEĞE BAĞLI kapı. Kurulum (depoya değil,
   geçici bir dizine — uygulamanın sıfır bağımlılık kuralı bozulmasın):

     mkdir -p /tmp/ml-visual && cd /tmp/ml-visual && npm init -y
     PUPPETEER_CACHE_DIR=/tmp/ml-visual/.chrome npm i puppeteer

   Çalıştırma:
     NODE_PATH=/tmp/ml-visual/node_modules PUPPETEER_CACHE_DIR=/tmp/ml-visual/.chrome \
       node tools/layout.js [--shots]

   --shots verilirse /tmp/ml-visual/shots altına açık/koyu ekran görüntüsü de bırakır. */
let puppeteer;
try{ puppeteer=require('puppeteer'); }
catch(e){
  console.log("puppeteer kurulu değil — bu kapı atlandı (kurulum: dosyanın başındaki not).");
  process.exit(0);
}
const path=require('path'), fs=require('fs');
const FILE='file://'+path.resolve(process.argv.find(a=>a.endsWith('.html'))||'/opt/ml/index.html');
const SHOTS=process.argv.includes('--shots');
const OUT='/tmp/ml-visual/shots';
/* 720 = F11 tam ekran · 610 = tarayıcı sekme + adres çubuğu açık */
const VIEWS=[[1280,720,25],[1280,610,120]];      // [genişlik, yükseklik, kutu toleransı]
/* Gösterge DEĞERİ için pay: .v elemanının kutusu satır yüksekliği kadar rakamların
   altından taşar, o yüzden 1–3 px görünür bir kırpma değil. */
const DEGER_TOL=3;

(async()=>{
  const b=await puppeteer.launch({args:['--no-sandbox','--disable-dev-shm-usage']});
  const p=await b.newPage();
  await p.setViewport({width:1280,height:720});
  await p.goto(FILE,{waitUntil:'networkidle2'});
  const ids=await p.evaluate(()=>window.__SEQIDS||
    [...document.querySelectorAll('main>section')].map(s=>s.id).filter(i=>i!=='m-home'));
  let fail=0;
  if(SHOTS) fs.mkdirSync(OUT,{recursive:true});
  for(const [W,H,TOL] of VIEWS){
    await p.setViewport({width:W,height:H});
    console.log(`\n=== ${W}×${H} (tolerans ${TOL} px) ===`);
    for(const id of ids){
      await p.goto(FILE+'#'+id,{waitUntil:'networkidle2'});
      /* Yazı tipi ŞART: Bricolage yüklenmeden başlık bir satır görünüyor, yüklenince
         ikiye çıkıyor (+48 px) ve ölçüm olduğundan iyi çıkıyordu. */
      await p.evaluate(()=>document.fonts.ready).catch(()=>{});
      await new Promise(r=>setTimeout(r,220));
      const g=await p.evaluate((id)=>{
        const sec=document.getElementById(id);
        const st=sec.querySelector('.stats'), cv=sec.querySelector('canvas');
        const v=sec.querySelector('.stats .v');
        const cs=getComputedStyle(sec);
        return {stats:st?Math.round(st.getBoundingClientRect().bottom):null,
                deger:v?Math.round(v.getBoundingClientRect().bottom):null,
                tuval:cv?Math.round(cv.getBoundingClientRect().height):0,
                halka:cs.outlineStyle!=='none'};
      },id);
      const over=g.stats-H, degerOver=g.deger-H;
      const bad=over>TOL || degerOver>DEGER_TOL || g.halka;
      if(bad) fail++;
      console.log(`  ${bad?'HATA ':'OK   '} ${id.padEnd(8)} tuval ${String(g.tuval).padStart(3)} · stats altı ${g.stats} (${over>0?'+'+over:over})`+
        (degerOver>DEGER_TOL?` · GÖSTERGE DEĞERİ perdenin altında (+${degerOver})`:'')+
        (g.halka?' · bölümde görünür odak halkası':''));
    }
  }
  if(SHOTS){
    for(const [id,theme] of [['m-knn','acik'],['m-knn','koyu'],['m-cn','acik'],['m-reg','acik']]){
      await p.setViewport({width:1280,height:720,deviceScaleFactor:1.5});
      await p.goto(FILE+'#'+id,{waitUntil:'networkidle2'});
      await new Promise(r=>setTimeout(r,500));
      if(theme==='koyu'){ await p.click('#theme'); await new Promise(r=>setTimeout(r,400)); }
      await p.screenshot({path:`${OUT}/${id}-${theme}.png`});
      await p.evaluate(()=>window.openLesson&&window.openLesson(0));
      await new Promise(r=>setTimeout(r,350));
      await p.screenshot({path:`${OUT}/${id}-${theme}-dersnotu.png`});
    }
    console.log(`\nekran görüntüleri: ${OUT}`);
  }
  console.log(`\n${fail?fail+' YERLEŞİM UYARISI':'yerleşim temiz: gösterge değerleri perdenin içinde'}`);
  await b.close();
  process.exit(fail?1:0);
})();
