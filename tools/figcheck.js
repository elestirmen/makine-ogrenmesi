/* Ders notu figürü denetimi: node tools/figcheck.js a.svg [b.svg …] [--png]
   Kurallar tools/figspec.md'de; uygulamanın içindeki FIGS'i lint.py / contrast.js / layout.js denetler.
   Statik: yasak öğe/öznitelik, sabit renk, metin rengi, yazı boyu, viewBox, boyut.
   Canlı (Chromium varsa): metin kutuları çakışıyor mu, viewBox'tan taşıyor mu;
   --png ile iki temada PNG (out/<ad>.light.png, out/<ad>.dark.png). */
const fs=require('fs'), path=require('path');
const files=process.argv.slice(2).filter(a=>!a.startsWith('--'));
const PNG=process.argv.includes('--png');
const TEXT_OK=new Set(['--ink','--ink-soft','--a','--c','--accent','--bad']);
const TOK_OK=new Set(['--ink','--ink-soft','--line','--grid','--surface','--surface-2','--a','--b','--c','--d',
  '--accent','--good','--warn','--bad','--tint']);
const THEMES={
  light:{'--surface':'#FFFFFF','--surface-2':'#EAEEEA','--ink':'#12181A','--ink-soft':'#5C6A6B','--line':'#D8DED8',
    '--grid':'#E6EBE6','--accent':'#C4186B','--a':'#12707A','--b':'#B85C15','--c':'#6D4AA8','--d':'#4C7A21',
    '--good':'#2E7D46','--warn':'#B4610F','--bad':'#B02020','--tint':'rgba(196,24,107,.07)'},
  dark:{'--surface':'#161D20','--surface-2':'#1D2629','--ink':'#E9EFEB','--ink-soft':'#93A2A3','--line':'#273134',
    '--grid':'#1C2528','--accent':'#FF5FA2','--a':'#37C4CB','--b':'#F0913F','--c':'#A98BE8','--d':'#8CC63F',
    '--good':'#5FCB84','--warn':'#E0A23C','--bad':'#F0736A','--tint':'rgba(255,95,162,.10)'}};

function stat(f,s){
  const E=[];
  if(!/^<svg[\s>]/.test(s.trim())) E.push('dosya <svg ile başlamıyor');
  if(!/<\/svg>\s*$/.test(s)) E.push('dosya </svg> ile bitmiyor');
  if(s.length>7600) E.push(`boyut ${s.length} bayt (> 7.5 KB)`);
  const vb=s.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
  if(!vb) E.push('viewBox="0 0 640 H" yok');
  else{ if(+vb[1]!==640) E.push(`viewBox genişliği ${vb[1]} (640 olmalı)`);
        if(+vb[2]<200||+vb[2]>360) E.push(`viewBox yüksekliği ${vb[2]} (220–340)`); }
  const open=s.match(/<svg[^>]*>/); if(open){
    if(/\s(width|height)=/.test(open[0])) E.push('<svg> üzerinde width/height var');
    if(!/role="img"/.test(open[0])) E.push('role="img" yok');
    if(!/aria-label="[^"]{12,}"/.test(open[0])) E.push('aria-label yok ya da çok kısa');
  }
  for(const t of ['script','style','foreignObject','image','use','marker','filter','linearGradient','radialGradient','pattern','clipPath','mask'])
    if(new RegExp('<'+t+'[\\s>/]','i').test(s)) E.push(`yasak öğe <${t}>`);
  for(const a of [' id=',' class=',' href=','xlink:','url(#','currentColor','style="'])
    if(s.includes(a)) E.push(`yasak öznitelik/değer: ${a.trim()}`);
  for(const m of s.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/g)) E.push(`sabit renk: ${m[0]}`);
  for(const m of s.matchAll(/(fill|stroke)="([^"]*)"/g)){
    const v=m[2]; if(v==='none') continue;
    const t=v.match(/^var\((--[\w-]+)\)$/);
    if(!t) E.push(`${m[1]}="${v}" (yalnız var(--token) ya da none)`);
    else if(!TOK_OK.has(t[1])) E.push(`bilinmeyen token ${t[1]}`);
  }
  for(const m of s.matchAll(/font-size="([\d.]+)"/g)) if(+m[1]<13) E.push(`font-size ${m[1]} (< 13)`);
  if(/&(?!amp;|lt;|gt;|quot;|apos;)[a-z#]/.test(s)) E.push('HTML entity var (Türkçe karakteri doğrudan yaz; & yerine &amp;)');
  if(/`|\$\{/.test(s)) E.push('ters tırnak ya da ${ var (JS dizgisine gömülecek)');
  if(/<!--/.test(s)) E.push('yorum var (kaldır)');
  return E;
}

/* Tarayıcısız yaklaşık yerleşim: <g> mirası (fill, font-size, text-anchor, font-family,
   translate) izlenir, metin kutusu karakter sayısı × em genişliğiyle kestirilir. */
function approx(s){
  const E=[], vb=s.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/); if(!vb) return {E,fills:[]};
  const W=+vb[1], H=+vb[2], stack=[{fill:null,fs:16,anchor:'start',mono:false,tx:0,ty:0,bold:false}], boxes=[], fills=[];
  const re=/<(\/?)(\w+)([^>]*?)(\/?)>|([^<]+)/g; let m, cur=null;
  const at=(a,k)=>{const r=a.match(new RegExp('\\s'+k+'="([^"]*)"'));return r?r[1]:null;};
  while((m=re.exec(s))){
    if(m[5]!==undefined){ if(cur) cur.txt+=m[5]; continue; }
    const [_,close,tag,attrs,self]=m;
    if(close){ if(tag==='text'&&cur){ boxes.push(cur); cur=null; } if(tag==='g'||tag==='text') stack.pop(); continue; }
    if(tag!=='g'&&tag!=='text'&&tag!=='tspan') continue;
    const p=stack[stack.length-1], st={...p};
    const f=at(attrs,'fill'); if(f) st.fill=f;
    const fs=at(attrs,'font-size'); if(fs) st.fs=+fs;
    const an=at(attrs,'text-anchor'); if(an) st.anchor=an;
    const ff=at(attrs,'font-family'); if(ff) st.mono=/mono/i.test(ff);
    const fw=at(attrs,'font-weight'); if(fw) st.bold=+fw>=600||fw==='bold';
    const tr=at(attrs,'transform'); if(tr){ const t=tr.match(/translate\(\s*([-\d.]+)[ ,]+([-\d.]+)\s*\)/);
      if(t){st.tx+=+t[1];st.ty+=+t[2];} if(/rotate|scale|matrix/.test(tr)) E.push(`transform "${tr}" yaklaşık denetlenemiyor`); }
    if(tag==='tspan') continue;
    if(!self) stack.push(st);
    if(tag==='text'){ cur={x:+(at(attrs,'x')||0)+st.tx, y:+(at(attrs,'y')||0)+st.ty, st, txt:''};
      if(self){ stack.pop(); cur=null; } }
  }
  for(const b of boxes){
    const t=b.txt.replace(/&[a-z]+;/g,'x').trim(); if(!t) continue;
    const em=b.st.mono?0.60:(b.st.bold?0.58:0.54), w=[...t].length*em*b.st.fs, h=b.st.fs;
    const x0=b.st.anchor==='middle'?b.x-w/2:b.st.anchor==='end'?b.x-w:b.x;
    b.box={x:x0,y:b.y-0.78*h,w,h:0.98*h,t:t.slice(0,28)};
    const fm=(b.st.fill||'').match(/var\((--[\w-]+)\)/); fills.push(fm?fm[1]:(b.st.fill||'(yok)'));
    if(x0<4||b.box.y<2||x0+w>W-4||b.box.y+b.box.h>H-2) E.push(`taşıyor (yaklaşık): "${b.box.t}"`);
  }
  const bx=boxes.filter(b=>b.box).map(b=>b.box);
  for(let i=0;i<bx.length;i++)for(let j=i+1;j<bx.length;j++){
    const a=bx[i],c=bx[j]; const ox=Math.min(a.x+a.w,c.x+c.w)-Math.max(a.x,c.x), oy=Math.min(a.y+a.h,c.y+c.h)-Math.max(a.y,c.y);
    if(ox>3&&oy>3) E.push(`çakışıyor (yaklaşık): "${a.t}" ↔ "${c.t}"`);
  }
  return {E,fills};
}

(async()=>{
  let bad=0; const pages=[];
  for(const f of files){
    const s=fs.readFileSync(f,'utf8'); const E=stat(f,s);
    pages.push({f,s,E});
  }
  let browser=null;
  try{
    let root=''; try{ root=require('child_process').execSync('npm root -g',{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim(); }catch(e){}
    let pp; try{ pp=require('puppeteer'); }catch(e){ pp=require(path.join(root,'puppeteer')); }
    browser=await pp.launch({headless:true,args:['--no-sandbox','--disable-gpu']});
  }catch(e){ console.log('(Chromium açılamadı; metin kutuları karakter sayısından KESTİRİLİYOR: '+String(e.message).split('\n')[0]+')'); }
  for(const P of pages){
    if(!browser && !P.E.some(e=>e.startsWith('dosya'))){
      const r=approx(P.s); P.E.push(...r.E);
      for(const f of new Set(r.fills)) if(!TEXT_OK.has(f)) P.E.push(`metin rengi ${f} (izinli: ${[...TEXT_OK].join(' ')})`);
    }
    if(browser && !P.E.some(e=>e.startsWith('dosya'))){
      for(const th of ['light','dark']){
        const page=await browser.newPage();
        await page.setViewport({width:700,height:420,deviceScaleFactor:1.5});
        const vars=Object.entries(THEMES[th]).map(([k,v])=>`${k}:${v}`).join(';');
        await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
          :root{${vars}} body{margin:0;padding:24px 30px;background:var(--surface);color:var(--ink);
          font-family:"Inter",ui-sans-serif,system-ui,sans-serif;width:630px}
          svg{display:block;width:100%;height:auto;overflow:visible}</style></head><body>${P.s}</body></html>`);
        if(th==='light'){
          const r=await page.evaluate(()=>{
            const svg=document.querySelector('svg'); const out={err:[],n:0};
            if(!svg){out.err.push('SVG çözümlenemedi');return out;}
            const vb=svg.viewBox.baseVal; const T=[...svg.querySelectorAll('text')]; out.n=T.length;
            const R=svg.getBoundingClientRect(), k=vb.width/R.width;
            const bx=T.map(t=>{const b=t.getBoundingClientRect();return {t:t.textContent.trim().slice(0,28),
              x:(b.left-R.left)*k,y:(b.top-R.top)*k,w:b.width*k,h:b.height*k*0.82,
              fill:(t.closest('[fill]')||t).getAttribute('fill')};});
            for(const b of bx){
              if(b.x<4||b.y<2||b.x+b.w>vb.width-4||b.y+b.h>vb.height-2) out.err.push(`taşıyor: "${b.t}"`);
              const f=(b.fill||'').match(/var\((--[\w-]+)\)/);
              out.fills=out.fills||[]; out.fills.push(f?f[1]:(b.fill||'(yok)'));
            }
            for(let i=0;i<bx.length;i++)for(let j=i+1;j<bx.length;j++){
              const a=bx[i],c=bx[j]; const ox=Math.min(a.x+a.w,c.x+c.w)-Math.max(a.x,c.x), oy=Math.min(a.y+a.h,c.y+c.h)-Math.max(a.y,c.y);
              if(ox>1.5&&oy>2.5) out.err.push(`çakışıyor: "${a.t}" ↔ "${c.t}"`);
            }
            return out;
          });
          P.E.push(...r.err);
          for(const f of new Set(r.fills||[])) if(!TEXT_OK.has(f)) P.E.push(`metin rengi ${f} (izinli: ${[...TEXT_OK].join(' ')})`);
        }
        if(PNG){ fs.mkdirSync('out',{recursive:true});
          await page.screenshot({path:`out/${path.basename(P.f,'.svg')}.${th}.png`,fullPage:true}); }
        await page.close();
      }
    }
    if(P.E.length){bad++; console.log(`HATA ${P.f}`); [...new Set(P.E)].forEach(e=>console.log('   · '+e));}
    else console.log(`TEMİZ ${P.f}  (${P.s.length} bayt)`);
  }
  if(browser) await browser.close();
  process.exit(bad?1:0);
})();
