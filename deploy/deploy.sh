#!/usr/bin/env bash
# index.html'i sunucuya yükler. Konteyner /opt/ml'i salt-okunur bağladığı için
# dosyayı yerine koymak yeterli; yeniden başlatmaya gerek yok.
#
#   ./deploy/deploy.sh                 -> varsayılan hedefe
#   HOST=kullanici@sunucu ./deploy/deploy.sh
set -euo pipefail

HOST="${HOST:-ertugrul@urgup.perinet.org}"
DEST="${DEST:-/opt/ml/}"
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "· sözdizimi denetimi"
sed -n '/^<script>/,/^<\/script>/p' "$SRC/index.html" | sed '1d;$d' > /tmp/ml-check.js
node --check /tmp/ml-check.js
rm -f /tmp/ml-check.js

echo "· $SRC -> $HOST:$DEST"
rsync -avz --delete \
  --include='index.html' \
  --include='README.md' \
  --include='CLAUDE.md' \
  --include='deploy/' --include='deploy/**' \
  --exclude='*' \
  "$SRC/" "$HOST:$DEST"

echo "· bitti — https://ml.perinet.org"
