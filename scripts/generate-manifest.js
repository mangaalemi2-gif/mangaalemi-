const fs = require('fs');
const path = require('path');

function generateManifest() {
  const publicMangasDir = path.join(__dirname, '..', 'public', 'mangas');
  const manifest = {};

  if (!fs.existsSync(publicMangasDir)) {
    console.log("No mangas directory found.");
    return manifest;
  }

  const slugs = fs.readdirSync(publicMangasDir);
  for (const slug of slugs) {
    const slugPath = path.join(publicMangasDir, slug);
    if (!fs.statSync(slugPath).isDirectory()) continue;

    const chapters = fs.readdirSync(slugPath);
    for (const chapter of chapters) {
      const chapterPath = path.join(slugPath, chapter);
      if (!fs.statSync(chapterPath).isDirectory()) continue;

      const files = fs.readdirSync(chapterPath);
      const images = files
        .filter(f => f.match(/\.(jpg|jpeg|png|webp)$/i))
        .sort((a, b) => {
          const numA = parseInt(a.split('.')[0]);
          const numB = parseInt(b.split('.')[0]);
          return numA - numB;
        });

      // Key format: slug/chapter (e.g., "dragon-ball-1984/Chapter1")
      const key = `${slug}/${chapter}`;
      manifest[key] = images.map(img => `/mangas/${slug}/${chapter}/${img}`);
    }
  }

  return manifest;
}

const data = generateManifest();
const outDir = path.join(__dirname, '..', 'src', 'data');
const outPath = path.join(outDir, 'manga-manifest.json');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
console.log(`Manifest generated at ${outPath} with ${Object.keys(data).length} chapters.`);
