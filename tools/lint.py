#!/usr/bin/env python3
"""index.html bütünlük denetimi: id eşleşmesi, token kullanımı, sözleşme, yerleşim eşikleri."""
import re,sys,io
p=sys.argv[1] if len(sys.argv)>1 else "/opt/ml/index.html"
s=io.open(p,encoding="utf-8").read()
script=s[s.index("<script>")+8:s.rindex("</script>")]
html=s[:s.index("<script>")]
bad=[]; warn=[]

# 1 · $("#id") ile sorgulanan her id HTML'de veya JS'te üretiliyor mu
ids_html=set(re.findall(r'id="([^"]+)"',html))
made=set(re.findall(r'\.id\s*=\s*["\']([^"\']+)',script))
# $("#id"), setR/press/txt("#id", …) ve dizi içinde tutulan ["#id",deger] çiftleri:
# script'teki her "#id" dizgisi bir seçici sayılıyor
q=set(re.findall(r'"#([\w-]+)"',script))
q={i for i in q if not i.isdigit()}          # yorumdaki "#09" gibi örnekler seçici değil
missing=sorted(q-ids_html-made)
if missing: bad.append(f"HTML'de olmayan id sorgulanıyor: {missing}")

# 2 · HTML'de tanımlı ama hiç kullanılmayan id (ölü işaretleyici)
unused=sorted(i for i in ids_html-q-{"nav","q","prog","gohome","homelist","homemeta"}
              if i.startswith(("knn-","fit-","gd-","per-","km-","dt-","cm-","cn-","lin-","sc-","lg-")))
if unused: warn.append(f"kullanılmayan id: {unused}")

# 3 · canvas içinde sabit renk
for m in re.finditer(r'(fillStyle|strokeStyle)\s*=\s*["\'](#[0-9a-fA-F]{3,8}|rgb)',script):
    bad.append(f"canvas'ta sabit renk: {m.group(0)}")

# 4 · reg() sözleşmesi
regs=re.findall(r'reg\(\{([^\n]*)',script)
ids_reg=re.findall(r'reg\(\{id:"([^"]+)"',script)
sections=re.findall(r'<section id="(m-[^"]+)"',html)
for r in ids_reg:
    if r not in sections: bad.append(f"reg() var ama <section> yok: {r}")
for sec in sections:
    if sec=="m-home": continue
    if sec not in ids_reg: bad.append(f"<section> var ama reg() yok: {sec}")

# 5 · META ↔ MODULES hizası
meta=re.search(r'const META=\[(.*?)\n\];',script,re.S)
nmeta=len(re.findall(r'\n  \[',meta.group(1))) if meta else 0
if nmeta!=len(ids_reg): bad.append(f"META satırı {nmeta}, reg() {len(ids_reg)} — hiza bozuk")

# 6 · her draw() fit() ile başlıyor mu
for m in re.finditer(r'function draw\(\)\{\s*\n?\s*([^\n]*)',script):
    if "if(!fit()) return;" not in m.group(1): warn.append(f"draw() fit() ile başlamıyor: {m.group(1)[:50]}")

# 7 · GROUPS kapsaması
groups=re.search(r'const GROUPS=\[(.*?)\];',script)
gset=set(re.findall(r'"([^"]+)"',groups.group(1))) if groups else set()
if meta:
    rows=re.findall(r'\["(\d+)"\s*,\s*"(m-[^"]+)"\s*,\s*"([^"]*)"\s*,\s*"([^"]*)"\s*,\s*"([^"]*)"',meta.group(1))
    used={r[4] for r in rows}
    orphan=sorted(used-gset)
    if orphan: bad.append(f"GROUPS'ta olmayan grup: {orphan} (modül menüde görünmez)")
    mids=[r[1] for r in rows]
    for mid in mids:
        if mid not in ids_reg: bad.append(f"META'da var ama reg() yok: {mid}")
    for rid in ids_reg:
        if rid not in mids: bad.append(f"reg() var ama META'da yok: {rid} (menüde görünmez)")
    nos=[r[0] for r in rows]
    if nos!=sorted(nos): bad.append(f"modül numaraları sıralı değil: {nos}")
    if len(set(nos))!=len(nos): bad.append("yinelenen modül numarası var")

# 8 · setInterval varsa stop
for blk in re.split(r'/\* ═+ ',script)[1:]:
    mid=re.search(r'reg\(\{id:"([^"]+)"',blk)
    if not mid: continue
    if "setInterval" in blk and "stop:" not in blk:
        bad.append(f"{mid.group(1)}: setInterval var ama stop: yok")

# 9 · TH önizleme kapsaması
th=set(re.findall(r'TH\["([^"]+)"\]',script))
noth=sorted(set(ids_reg)-th)
if noth: warn.append(f"önizlemesi olmayan modül: {noth}")

print(f"modül: {len(ids_reg)} · META: {nmeta} · önizleme: {len(th)} · sorgulanan id: {len(q)}")
for b in bad:  print("  HATA  ",b)
for w in warn: print("  uyarı ",w)
print("TEMİZ" if not bad else f"{len(bad)} HATA")
sys.exit(1 if bad else 0)
