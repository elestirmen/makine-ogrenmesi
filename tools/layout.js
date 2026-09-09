#!/usr/bin/env node
/* Projeksiyon yerleşimi: gösterge satırı (.stats) perdenin İÇİNDE mi?
   Öteki araçlar bunu göremiyor — harness.js sahte DOM'da yerleşim hesaplamıyor,
   lint sabit eşiklere bakıyor. Oysa ölçtüğümüzde 1280×720'de .stats her modülde
   perdenin altında kalıyordu (+22 … +256 px): hoca ders ortasında sayıları görmek
   için kaydırmak zorundaydı.

   Gerçek Chromium gerekiyor, o yüzden İSTEĞE BAĞLI kapı: bulunamazsa sessizce
   atlanır, öteki kapılar bağımsız çalışır.

   TEK SEFERLİK kurulum (sudo gerekmez, makinede kalıcı — her oturumda yeniden
   indirilmez):

     npm install -g puppeteer
        modül    → ~/.npm-global/lib/node_modules   (npm prefix'i neyse orası)
        tarayıcı → ~/.cache/puppeteer/              (Chrome + headless-shell, ~650 MB,
                                                     bir kez; oturumlar arası kalıcı)

   Sonrası hiçbir ortam değişkeni istemez:   node tools/layout.js [--shots]

   Araç puppeteer'ı şu sırayla arar: doğrudan require (yerel node_modules ya da
   NODE_PATH) → npm global kökü → puppeteer-core + sistemdeki chromium/chrome
   (apt ile kurulmuşsa o da olur). Uygulamanın "sıfır bağımlılık" kuralı
   bozulmuyor: bağımlılık depoda değil MAKİNEDE duruyor ve yalnız bu geliştirme
   aracı kullanıyor.

   --shots verilirse geçici dizine açık/koyu ekran görüntüsü de bırakır. */
const {execSync}=require('child_process');
const path=require('path'), fs=require('fs'), os=require('os');

/* puppeteer nerede? (yerel → npm global → puppeteer-core) */
function findPuppeteer(){
  const tryReq=(id)=>{ try{ return require(id); }catch(e){ return null; } };
  let pp=tryReq('puppeteer');
  if(pp) return {pp, nasil:'require("puppeteer")'};
  let root=null;
  try{ root=execSync('npm root -g',{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim(); }catch(e){}
  if(root){
    pp=tryReq(path.join(root,'puppeteer'));
    if(pp) return {pp, nasil:'npm global · '+root};
    pp=tryReq(path.join(root,'puppeteer-core'));
    if(pp) return {pp, core:true, nasil:'npm global puppeteer-core · '+root};
  }
  pp=tryReq('puppeteer-core');
  return pp?{pp, core:true, nasil:'require("puppeteer-core")'}:null;
}
/* puppeteer-core kendi tarayıcısını getirmez: sistemdekini ya da indirilmiş
   Chrome-for-Testing'i bul */
function findBrowser(){
  const list=['/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome',
              '/usr/bin/google-chrome-stable','/snap/bin/chromium'];
  const cache=path.join(os.homedir(),'.cache','puppeteer','chrome');
  try{
    for(const d of fs.readdirSync(cache).sort().reverse()){
      const c=path.join(cache,d,'chrome-linux64','chrome');
      if(fs.existsSync(c)) list.unshift(c);
    }
  }catch(e){}
  return list.find(f=>{ try{ fs.accessSync(f,fs.constants.X_OK); return true; }catch(e){ return false; } })||null;
}
const found=findPuppeteer();
if(!found){
  console.log("puppeteer bulunamadı — yerleşim kapısı atlandı.");
  console.log("tek seferlik kurulum:  npm install -g puppeteer");
  process.exit(0);
}
const puppeteer=found.pp;
const EXEC=found.core?findBrowser():null;
if(found.core&&!EXEC){
  console.log("puppeteer-core var ama çalıştırılabilir tarayıcı yok — kapı atlandı.");
  console.log("tek seferlik kurulum:  npm install -g puppeteer");
  process.exit(0);
}
console.log(`tarayıcı: ${found.nasil}${EXEC?' · '+EXEC:''}`);

const FILE='file://'+path.resolve(process.argv.find(a=>a.endsWith('.html'))||'/opt/ml/index.html');
const SHOTS=process.argv.includes('--shots');
const OUT=path.join(os.tmpdir(),'ml-shots');
/* 720 = F11 tam ekran · 610 = tarayıcı sekme + adres çubuğu açık */
const VIEWS=[[1280,720,25],[1280,610,120]];      // [genişlik, yükseklik, kutu toleransı]
/* Gösterge DEĞERİ için pay: .v elemanının kutusu satır yüksekliği kadar rakamların
   altından taşar, o yüzden 1–3 px görünür bir kırpma değil. */
const DEGER_TOL=3;

/* İsteğe bağlı kapı asla yığın iziyle çökmemeli: tarayıcı açılmazsa önce
   sistemdekiyle dene, yine olmazsa kapıyı atla. */
async function launch(){
  const args=['--no-sandbox','--disable-dev-shm-usage'];
  try{ return await puppeteer.launch({args, ...(EXEC?{executablePath:EXEC}:{})}); }
  catch(e){
    const alt=EXEC?null:findBrowser();
    if(alt){ try{ return await puppeteer.launch({args,executablePath:alt}); }catch(_){ } }
    console.log("tarayıcı başlatılamadı — yerleşim kapısı atlandı: "+String(e.message).split("\n")[0]);
    console.log("tek seferlik kurulum:  npx puppeteer browsers install chrome");
    process.exit(0);
  }
}

(async()=>{
  const b=await launch();
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
