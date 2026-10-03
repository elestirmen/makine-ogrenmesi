#!/usr/bin/env python3
"""Modül 25 (m-dig) ağını yeniden üret: MNIST indir, 196 → 32 → 10 MLP eğit, gömülecek
veriyi yaz. Uygulama bu betiği çalıştırmaz; ağırlıklar index.html'de gömülü durur.

    python3 tools/mnist_train.py [çalışma_dizini]     # numpy gerekir, ~10 sn

Çıktı: <dizin>/embed.json → {"q": {W1,b1,W2,b2: [base64 int8, ölçek]}, "S": [22 örnek]}.
index.html'deki m-dig IIFE'sinde Q ve SAMPLES bu dosyadan gelir. Veri depoya girmez.

Kurulum (değişirse ders notundaki sayılar ve behaviour.js eşikleri de değişir):
  · girdi 28×28 MNIST'in 2×2 ortalaması (14×14 = 196); MNIST rakamları zaten 20 px
    kutuya sığdırılıp ağırlık merkezinden ortalanmış, çizim de uygulamada aynı yoldan geçer
  · gizli katman 32 sigmoid, çıkış 10 softmax, log loss
  · mini-batch SGD 64, lr 0.5, L2 2e-4, 30 epoch, tohum 0 → test %96.2
  · int8 nicemleme, katman başına tek ölçek (gerçek = q · s)
  · örnekler: her rakamdan ilk iki doğru bilinen + ilk iki yanlış bilinen (16 gri seviye)
"""
import gzip, json, base64, os, sys, urllib.request
import numpy as np

D = sys.argv[1] if len(sys.argv) > 1 else "/tmp/mnist"
os.makedirs(D, exist_ok=True)
URL = "https://storage.googleapis.com/cvdf-datasets/mnist/"
F = ["train-images-idx3-ubyte", "train-labels-idx1-ubyte", "t10k-images-idx3-ubyte", "t10k-labels-idx1-ubyte"]
for f in F:
    p = os.path.join(D, f + ".gz")
    if not os.path.exists(p):
        urllib.request.urlretrieve(URL + f + ".gz", p)

def imgs(f): return np.frombuffer(gzip.open(os.path.join(D, f + ".gz")).read(), np.uint8, offset=16).reshape(-1, 28, 28).astype(np.float32) / 255
def labs(f): return np.frombuffer(gzip.open(os.path.join(D, f + ".gz")).read(), np.uint8, offset=8).astype(np.int64)
down = lambda X: X.reshape(-1, 14, 2, 14, 2).mean(axis=(2, 4)).reshape(-1, 196)
Xtr, ytr = down(imgs(F[0])), labs(F[1])
Xte, yte = down(imgs(F[2])), labs(F[3])

rng = np.random.default_rng(0); H = 32
W1 = rng.normal(0, 1 / np.sqrt(196), (196, H)).astype(np.float32); b1 = np.zeros(H, np.float32)
W2 = rng.normal(0, 1 / np.sqrt(H), (H, 10)).astype(np.float32); b2 = np.zeros(10, np.float32)
sig = lambda z: 1 / (1 + np.exp(-z))
def fwd(X, W1, b1, W2, b2):
    h = sig(X @ W1 + b1); z = h @ W2 + b2; z = z - z.max(1, keepdims=True); p = np.exp(z); return h, p / p.sum(1, keepdims=True)
lr, lam, bs = 0.5, 2e-4, 64
for ep in range(30):
    idx = rng.permutation(len(Xtr))
    for i in range(0, len(idx), bs):
        j = idx[i:i + bs]; X = Xtr[j]; Y = np.eye(10, dtype=np.float32)[ytr[j]]
        h, p = fwd(X, W1, b1, W2, b2)
        dz = (p - Y) / len(j); gW2 = h.T @ dz + lam * W2; gb2 = dz.sum(0)
        dh = dz @ W2.T * h * (1 - h); gW1 = X.T @ dh + lam * W1; gb1 = dh.sum(0)
        W1 -= lr * gW1; b1 -= lr * gb1; W2 -= lr * gW2; b2 -= lr * gb2
def q(a): s = np.abs(a).max() / 127; return np.round(a / s).astype(np.int8), float(s)
Q = {k: q(v) for k, v in dict(W1=W1, b1=b1, W2=W2, b2=b2).items()}
dq = {k: v[0].astype(np.float32) * v[1] for k, v in Q.items()}
Xq = np.round(Xte * 15) / 15
pred = fwd(Xq, dq["W1"].reshape(196, H), dq["b1"], dq["W2"].reshape(H, 10), dq["b2"])[1].argmax(1)
print("test doğruluğu (nicemli, 16 seviye):", (pred == yte).mean())
sel = []
for d in range(10): sel += [i for i in range(len(yte)) if yte[i] == d and pred[i] == d][:2]
bad = [i for i in range(len(yte)) if pred[i] != yte[i]][:2]
order = [sel[d * 2 + k] for k in range(2) for d in range(10)]
order.insert(7, bad[0]); order.append(bad[1])
S = [{"p": "".join("%x" % int(round(v * 15)) for v in Xte[i]), "y": int(yte[i])} for i in order]
out = {"q": {k: [base64.b64encode(v[0].tobytes()).decode(), round(v[1], 9)] for k, v in Q.items()}, "S": S}
json.dump(out, open(os.path.join(D, "embed.json"), "w"), separators=(",", ":"))
print("yazıldı:", os.path.join(D, "embed.json"))
