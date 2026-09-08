#!/usr/bin/env bash
# index.html'i sunucuya yükler. Konteyner /opt/ml'i salt-okunur bağladığı için
# dosyayı yerine koymak yeterli; yeniden başlatmaya gerek yok.
#
#   ./deploy/deploy.sh                 -> varsayılan hedefe
#   HOST=kullanici@sunucu ./deploy/deploy.sh
#   SKIP_SLOW=1 ./deploy/deploy.sh     -> yalnız hızlı kapılar (behaviour ~1 dk sürer)
set -euo pipefail

HOST="${HOST:-ertugrul@urgup.perinet.org}"
DEST="${DEST:-/opt/ml/}"
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# CLAUDE.md dört doğrulama kapısı tanımlıyor ama bu betik yalnız sözdizimine
# bakıyordu: harness'ta çöken bir sürüm doğrudan yayına gidebiliyordu.
echo "· sözdizimi"
sed -n '/^<script>/,/^<\/script>/p' "$SRC/index.html" | sed '1d;$d' > /tmp/ml-check.js
node --check /tmp/ml-check.js
rm -f /tmp/ml-check.js

echo "· bütünlük denetimi"
python3 "$SRC/tools/lint.py" "$SRC/index.html"

echo "· tarayıcısız çalıştırma (930 / 800 / 676 px)"
for w in 930 800 676; do ML_W=$w node "$SRC/tools/harness.js" "$SRC/index.html" >/dev/null; done

echo "· tuval etiketi kontrastı"
( cd "$SRC" && node tools/contrast.js >/dev/null )

if [ "${SKIP_SLOW:-0}" = "1" ]; then
  echo "· davranış denetimi ATLANDI (SKIP_SLOW=1)"
else
  echo "· pedagojik iddialar (~1 dk)"
  node "$SRC/tools/behaviour.js" "$SRC/index.html" >/dev/null
fi

# --delete ile eski sürümün kopyası kalmıyordu: ders başlamadan 10 dakika önce
# geri dönülecek dosya yok demekti. Değişen/silinen dosyalar .prev'e taşınıyor.
echo "· $SRC -> $HOST:$DEST"
rsync -avz --delete \
  --backup --backup-dir="${DEST}.prev" \
  --include='index.html' \
  --include='README.md' \
  --include='CLAUDE.md' \
  --include='deploy/' --include='deploy/**' \
  --include='tools/' --include='tools/**' \
  --exclude='*' \
  "$SRC/" "$HOST:$DEST"

echo "· bitti — https://ml.perinet.org   (geri dönüş: ${DEST}.prev/index.html)"
