// R2'ye yüklenen dosyaların listesinden (C:\MangaDepo\uploaded.log)
// remote-manifest.json üretir. Kullanım:
//   node scripts/generate-remote-manifest.js <R2_BASE_URL>
// Örn: node scripts/generate-remote-manifest.js https://pub-xxx.r2.dev
const fs = require('fs');
const path = require('path');

const base = (process.argv[2] || '').replace(/\/$/, '');
if (!base) {
  console.error("Kullanım: node scripts/generate-remote-manifest.js <R2_BASE_URL>");
  process.exit(1);
}

const logPath = 'C:\\MangaDepo\\uploaded.log';
if (!fs.existsSync(logPath)) {
  console.error("uploaded.log bulunamadı:", logPath);
  process.exit(1);
}

const lines = fs.readFileSync(logPath, 'utf-8').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
// lines: mangas/<slug>/<Chapter>/<file>
const groups = {};
for (const line of lines) {
  const m = line.match(/^mangas\/([^/]+)\/(Chapter[^/]+)\/([^/]+)$/);
  if (!m) continue;
  const [, slug, chapter, file] = m;
  if (!/cover\.(jpg|jpeg|png|webp|gif)$/i.test(file)) {
    // kapaklar manifest'e girmez (mangaCover kullanır)
  }
  const key = `${slug}/${chapter}`;
  groups[key] = groups[key] || [];
  groups[key].push(file);
}

const out = {};
for (const [key, files] of Object.entries(groups)) {
  const sorted = files
    .filter((f) => /\.(jpg|jpeg|png|webp|gif)$/i.test(f) && !/^cover\./i.test(f))
    .sort((a, b) => parseInt(a.split('.')[0]) - parseInt(b.split('.')[0]));
  out[key] = sorted.map((f) => `${base}/mangas/${key}/${f}`);
}

const outPath = path.join(__dirname, '..', 'src', 'data', 'remote-manifest.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
const totalPages = Object.values(out).reduce((s, a) => s + a.length, 0);
console.log(`remote-manifest yazıldı: ${Object.keys(out).length} bölüm, ${totalPages} sayfa.`);
