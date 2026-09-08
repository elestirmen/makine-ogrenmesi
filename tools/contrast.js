/* Her modülün label(...) ile tuvale yazdığı metin rengini iki temada zemine karşı ölç. */
const fs=require('fs');
const src=fs.readFileSync('/opt/ml/index.html','utf8');
const sc=src.slice(src.indexOf('<script>'));

/* temaları CSS'ten oku */
function tokens(block){
  const t={};
  for(const m of block.matchAll(/(--[\w-]+)\s*:\s*(#[0-9A-Fa-f]{3,8}|rgba?\([^)]*\))/g)) t[m[1]]=m[2];
  return t;
}
const css=src.slice(0,src.indexOf('<script>'));
const light=tokens(css.slice(css.indexOf(':root{'), css.indexOf('@media (prefers-color-scheme: dark)')));
const darkBlk=css.slice(css.indexOf(':root[data-theme="dark"]'));
const dark={...light,...tokens(darkBlk.slice(0,darkBlk.indexOf('}')))};

const rgb=(c)=>{
  if(c.startsWith('#')){const n=c.length===4?c.replace(/#(.)(.)(.)/,'#$1$1$2$2$3$3'):c;
    return [1,3,5].map(i=>parseInt(n.slice(i,i+2),16));}
  const m=c.match(/rgba?\(([^)]+)\)/); const p=m[1].split(',').map(x=>parseFloat(x));
  return [p[0],p[1],p[2],p[3]??1];
};
const lin=(v)=>{v/=255;return v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4);};
const lum=(c)=>0.2126*lin(c[0])+0.7152*lin(c[1])+0.0722*lin(c[2]);
const cr=(f,b)=>{const a=lum(f),d=lum(b);const[h,l]=a>d?[a,d]:[d,a];return (h+0.05)/(l+0.05);};
const over=(fg,al,bg)=>fg.slice(0,3).map((v,i)=>al*v+(1-al)*bg[i]);

/* modül bloklarını ayır */
const blocks=[];
for(const m of sc.matchAll(/\/\* ═+ ([^═]*?) ═+ \*\/([\s\S]*?)(?=\/\* ═+ |\/\* ───────────── gezinme)/g))
  blocks.push({name:m[1].trim(), body:m[2]});

let bad=0, checked=0;
for(const b of blocks){
  const id=(b.body.match(/reg\(\{id:"([^"]+)"/)||[])[1];
  if(!id) continue;
  const rows=[];
  /* label(ctx, metin, x, y, RENK, ...) — 5. argüman */
  for(const m of b.body.matchAll(/label\(\s*(?:ctx|c|rcx)\s*,[\s\S]{0,200}?,\s*(css\("(--[\w-]+)"\)|hexA\("(--[\w-]+)"\s*,\s*([\d.]+)\))/g)){
    const tok=m[2]||m[3], al=m[4]?parseFloat(m[4]):1;
    rows.push({tok,al});
  }
  const uniq=[...new Map(rows.map(r=>[r.tok+'|'+r.al,r])).values()];
  for(const r of uniq){
    checked++;
    const res=[['açık',light],['koyu',dark]].map(([nm,T])=>{
      const fg=rgb(T[r.tok]||'#888'), bg=rgb(T['--surface']);
      const eff=r.al<1?over(fg,r.al,bg):fg.slice(0,3);
      return {nm, v:cr(eff,bg)};
    });
    const worst=Math.min(...res.map(x=>x.v));
    if(worst<4.5){
      bad++;
      console.log(`  ZAYIF ${id.padEnd(9)} ${r.tok}${r.al<1?' α'+r.al:''}  ` +
        res.map(x=>`${x.nm}=${x.v.toFixed(2)}`).join('  '));
    }
  }
}
console.log(`\n${checked} farklı etiket rengi denetlendi · ${bad} tanesi 4.5'in altında`);
console.log(bad?'-> gözden geçirilmeli':'-> hepsi WCAG AA eşiğinin üstünde (iki temada da)');
