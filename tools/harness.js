/* Minimal DOM/Canvas taklidi — 17 modülü gerçekten çalıştırıp hata avlar. */
const fs=require('fs'), vm=require('vm');
function boot(FILE){
const src=fs.readFileSync(FILE,'utf8');
const script=src.slice(src.indexOf('<script>')+8, src.lastIndexOf('</script>'));
const html=src.slice(0,src.indexOf('<script>'));

const TOK={'--ink':'#12181A','--ink-soft':'#5C6A6B','--surface':'#FFFFFF','--surface-2':'#EAEEEA',
 '--bg':'#F3F5F2','--line':'#D8DED8','--grid':'#E6EBE6','--accent':'#C4186B','--a':'#12707A',
 '--b':'#B85C15','--c':'#6D4AA8','--d':'#4C7A21','--good':'#2E7D46','--warn':'#B4610F','--bad':'#B02020',
 '--on-accent':'#FFFFFF','--on-accent-soft':'rgba(255,255,255,.88)','--r':'10px'};

/* Referans genişlik 930 px = 1280x720 projeksiyonda tuvale kalan yer.
   ML_W/ML_H ile dar yerleşim dalları da sınanabilir (bkz. CLAUDE.md · Doğrulama). */
const W=+(process.env.ML_W||930), H=+(process.env.ML_H||520);
let warnings=[];
function ctx2d(){
  const nan=(...a)=>{for(const v of a) if(typeof v==='number'&&!Number.isFinite(v)) warnings.push('canvas çizimine NaN/Infinity geldi: '+a.join(','));};
  const h={get(t,k){
    if(k==='canvas') return t.__cv;
    if(k==='createImageData') return (w,hh)=>({width:w,height:hh,data:new Uint8ClampedArray(w*hh*4)});
    if(k==='getImageData') return (x,y,w,hh)=>({width:w,height:hh,data:new Uint8ClampedArray(w*hh*4)});
    if(k==='measureText') return ()=>({width:10});
    if(typeof k==='string'&&['fillRect','strokeRect','clearRect','moveTo','lineTo','arc','ellipse','rect','fillText','strokeText','translate','rotate','scale','setTransform','drawImage','putImageData','beginPath','closePath','stroke','fill','save','restore','clip','setLineDash','quadraticCurveTo','bezierCurveTo','createLinearGradient','roundRect'].includes(k))
      return (...a)=>{nan(...a.filter(v=>typeof v==='number')); if(k==='createLinearGradient') return {addColorStop(){}}; };
    return t[k];
  },set(t,k,v){ if(typeof v==='number') nan(v); t[k]=v; return true; }};
  return new Proxy({__cv:null},h);
}
function mkEl(tag,id){
  const el={tagName:(tag||'div').toUpperCase(),id:id||'',value:'',textContent:'',innerHTML:'',
    className:'',style:{},dataset:{},hidden:false,children:[],disabled:false,checked:false,
    __attrs:{},
    setAttribute(k,v){this.__attrs[k]=String(v); if(k==='id')this.id=v;},
    getAttribute(k){return this.__attrs[k]??null;},
    removeAttribute(k){delete this.__attrs[k];},
    addEventListener(){},removeEventListener(){},
    appendChild(c){this.children.push(c);return c;},
    insertBefore(c){this.children.unshift(c);return c;},
    removeChild(){},
    querySelector(){return mkEl('div');},
    querySelectorAll(){return [mkEl('div'),mkEl('div'),mkEl('div')];},
    click(){ if(this.onclick) this.onclick({currentTarget:this,target:this,preventDefault(){}}); },
    dispatchEvent(e){ if(e&&e.type==='input'&&this.oninput) this.oninput({target:this,currentTarget:this}); return true; },
    focus(){},scrollIntoView(){},setPointerCapture(){},releasePointerCapture(){},
    getBoundingClientRect(){return {left:0,top:0,width:W,height:H,right:W,bottom:H};},
    get firstChild(){return this.children[0]||null;},
    get firstElementChild(){return this.children[0]||null;},
    get nextElementSibling(){return null;},
    get offsetWidth(){return W;},
    classList:{add(){},remove(){},contains(){return false;},toggle(){}},
  };
  /* "bu gösterge draw() sonrası hiç yazıldı mı" denetimi için yazımları işaretle */
  el.__written=false;
  { let _tc=''; Object.defineProperty(el,'textContent',
      {get:()=>_tc, set:(v)=>{_tc=String(v); el.__written=true;}, configurable:true}); }
  el.width=W; el.height=H;
  { const c=ctx2d(); c.__cv=el; el.getContext=()=>c; }
  return el;
}
const TIMERS=[];
const REG=new Map();
for(const m of html.matchAll(/id="([^"]+)"/g)){ REG.set(m[1], mkEl(m[1].startsWith('c-')?'canvas':'div', m[1])); }
for(const m of html.matchAll(/<(input|button|output|section|canvas|nav|main|aside)[^>]*id="([^"]+)"/g)){
  REG.set(m[2], mkEl(m[1], m[2]));
}
/* her modülün .stats değer kutuları: <span class="v" id="..."> */
const STATS=new Map();
for(const m of html.matchAll(/<section id="(m-[\w-]+)"[^>]*>([\s\S]*?)<\/section>/g)){
  STATS.set(m[1], [...m[2].matchAll(/class="v" id="([\w-]+)"/g)].map(x=>x[1]));
}
const doc={
  documentElement:mkEl('html'),
  body:mkEl('body'),
  getElementById:(i)=>REG.get(i)||mkEl('div',i),
  querySelector:(s)=>{ const m=/^#([\w-]+)$/.exec(s); if(m) return REG.get(m[1])||null;
    if(s==='main') return mkEl('main'); return mkEl('div'); },
  querySelectorAll:(s)=>{ if(/section/.test(s)) return [...REG.values()].filter(e=>e.tagName==='SECTION');
    return [mkEl('div'),mkEl('div'),mkEl('div')]; },
  createElement:(t)=>mkEl(t),
  addEventListener(){},
};
const sandbox={
  console:{log(){},warn(...a){warnings.push('console.warn: '+a.join(' '));},error(...a){warnings.push('console.error: '+a.join(' '));}},
  document:doc, devicePixelRatio:1,
  getComputedStyle:()=>({getPropertyValue:(n)=>TOK[n]??'#888888'}),
  requestAnimationFrame:(f)=>{try{f(0);}catch(e){warnings.push('rAF: '+e.message);}return 1;},
  cancelAnimationFrame(){}, setTimeout:(f)=>1, clearTimeout(){},
  setInterval:(f)=>{ TIMERS.push(f); return TIMERS.length; },
  clearInterval:(id)=>{ if(id) TIMERS[id-1]=null; },
  matchMedia:()=>({matches:false,addEventListener(){},addListener(){}}),
  addEventListener(){}, Event:class{constructor(t){this.type=t;}},
  Math,JSON,Number,String,Array,Object,Float64Array,Float32Array,Uint8ClampedArray,Set,Map,Date,isNaN,parseFloat,parseInt,Infinity,NaN,undefined,
};
sandbox.window=sandbox; sandbox.globalThis=sandbox;
/* adres çubuğu taklidi: uygulama hash yönlendirmesi kullanıyor */
sandbox.location={hash:'',pathname:'/',search:'',href:'/'};
sandbox.history={
  pushState(_a,_b,url){ const u=String(url==null?'':url);
    sandbox.location.hash = u.startsWith('#') ? u : ''; },
  replaceState(_a,_b,url){ sandbox.history.pushState(_a,_b,url); },
  back(){}, forward(){}, go(){},
};
vm.createContext(sandbox);
try{
  vm.runInContext(script+"\n;globalThis.__M=MODULES;globalThis.__SEQ=SEQ;globalThis.__META=META;globalThis.__C=CONTENT;",sandbox,{timeout:20000});
}catch(e){ throw new Error("YÜKLEME HATASI: "+e.message+"\n"+(e.stack||'').split('\n').slice(0,4).join('\n')); }

const M=sandbox.__M, SEQ=sandbox.__SEQ, META=sandbox.__META, CONTENT=sandbox.__C;
const tick=(n)=>{ for(let i=0;i<n;i++){ let alive=false;
  for(const f of TIMERS){ if(f){ alive=true; try{f();}catch(e){warnings.push('timer: '+e.message);} } }
  if(!alive) break; } };
const el=(id)=>REG.get(id);
return {sandbox,M,SEQ,META,CONTENT,tick,el,REG,warnings,TIMERS,STATS,W,H};
}
if(require.main!==module){ module.exports={boot}; } else {
const {M,SEQ,META,CONTENT,sandbox:SB,warnings:warn2,STATS,el:EL,W:BW,H:BH}=boot(process.argv[2]);
console.log(`yüklendi · MODULES=${M.length} SEQ=${SEQ.length} META=${META.length} · tuval ${BW}×${BH}\n`);
/* Yalnız imleç hareketiyle ya da eğitim sırasında yazılan göstergeler: draw()
   bunlara dokunmaz, bu beklenen davranıştır. Listeye ekleme yapmadan önce
   göstergenin GERÇEKTEN olaya bağlı olduğundan emin ol — dar yerleşimde donan
   bir gösterge de burada "hiç yazılmadı" diye görünür ve asıl yakalanmak istenen o. */
const OLAYA_BAGLI=new Set(['knn-p','knn-v','cn-val','cn-par','sc-ch','sc-flip','mlp-st']);
const warnings=warn2;
let fail=0;
for(let i=0;i<SEQ.length;i++){
  const mod=SEQ[i], no=META[i][0], name=META[i][2];
  const before=warnings.length;
  let err=null;
  try{ mod.draw(); }catch(e){ err=e; }
  // rehberli adımları da çalıştır
  let stepErr=null;
  if(!err && mod.steps) for(const st of mod.steps){
    /* st.set adımın veri kümesi: uygulamada senaryo düğmesine basılıyor, burada da öyle */
    try{ if(st.set!==undefined && mod.__pick) mod.__pick(st.set);
         st.run&&st.run(); mod.draw(); }catch(e){ stepErr=stepErr||`"${st.t}": ${e.message}`; }
  }
  // senaryolar
  let scErr=null;
  if(!err && mod.scenarios) for(const sc of mod.scenarios){
    try{ sc.apply(); mod.draw(); }catch(e){ scErr=scErr||`"${sc.name}": ${e.message}`; }
  }
  /* draw() bu modülün hangi göstergesine hiç dokunmadı? (dar yerleşim dalında
     unutulan gösterge derste son geniş çizimin değerinde donup kalıyor) */
  const sessiz=(STATS.get(mod.id)||[]).filter(id=>!OLAYA_BAGLI.has(id)&&!EL(id).__written);
  const w=warnings.slice(before);
  const bad=err||stepErr||scErr||w.length||sessiz.length;
  if(bad) fail++;
  console.log(`${bad?'HATA ':'OK   '} ${no} ${name}`);
  if(err) console.log(`        draw(): ${err.message}`);
  if(stepErr) console.log(`        adım ${stepErr}`);
  if(scErr) console.log(`        senaryo ${scErr}`);
  if(sessiz.length) console.log(`        draw() hiç yazmadı: ${sessiz.join(', ')}`);
  [...new Set(w)].slice(0,3).forEach(x=>console.log(`        ${x}`));
}
/* ── ders notu ve veri kümesi kapsaması ──
   İçeriği olmayan modül derste "bu ekran ne anlatıyor" sorusuna cevapsız kalıyor;
   tek veri kümesi kalan modülde de "alternatif somut örnek" vaadi boşa düşüyor. */
const eksik=[];
for(const mod of SEQ){
  const c=CONTENT&&CONTENT[mod.id];
  if(!c){ eksik.push(`${mod.id}: CONTENT kaydı yok`); continue; }
  const L=c.lesson;
  if(!L) eksik.push(`${mod.id}: ders notu (lesson) yok`);
  else{
    if(!L.q||!(L.idea||[]).length)   eksik.push(`${mod.id}: lesson.q / lesson.idea eksik`);
    if((L.read||[]).length<2)        eksik.push(`${mod.id}: lesson.read en az iki satır olmalı`);
    if((L.terms||[]).length<2)       eksik.push(`${mod.id}: lesson.terms en az iki terim olmalı`);
    if(!(L.life||[]).length)         eksik.push(`${mod.id}: lesson.life eksik`);
    if(!L.trap)                      eksik.push(`${mod.id}: lesson.trap eksik`);
  }
  if((c.sets||[]).length<2) eksik.push(`${mod.id}: en az iki veri kümesi olmalı`);
  else (c.sets||[]).forEach((x,i)=>{ if(!x.name||!x.note) eksik.push(`${mod.id}: sets[${i}] name/note eksik`); });
  /* seçici ya araç çubuğunda (scenarios) ya da modülün kendi düğmelerinde (ui:false) */
  if(c.ui!==false && (mod.scenarios||[]).length!==(c.sets||[]).length)
    eksik.push(`${mod.id}: senaryo düğmeleri veri kümeleriyle eşleşmiyor`);
}
/* ders notu kutusunu gerçekten kur: eksik alan "undefined" olarak PERDEYE düşer */
for(let i=0;i<SEQ.length;i++){
  const mod=SEQ[i];
  try{
    SB.openLesson(i);
    const body=EL('lesson-b').innerHTML||"", ttl=EL('lesson-t').textContent||"";
    if(body.length<600) eksik.push(`${mod.id}: ders notu kutusu neredeyse boş (${body.length} karakter)`);
    if(/undefined|\[object/.test(body+ttl)) eksik.push(`${mod.id}: ders notu kutusunda undefined kaldı`);
    if(!ttl) eksik.push(`${mod.id}: ders notu başlığı yazılmadı`);
  }catch(e){ eksik.push(`${mod.id}: ders notu açılamadı — ${e.message}`); }
}
if(eksik.length){ fail++; console.log("\nİÇERİK EKSİĞİ"); eksik.forEach(x=>console.log("        "+x)); }
else console.log(`\nders notu + veri kümesi: ${SEQ.length}/${SEQ.length} modül tam`);

console.log(`\n${SEQ.length-fail}/${SEQ.length} modül temiz`);
process.exit(fail?1:0);
}
