// Soumission IndexNow — notifie instantanément Bing (+ Yandex, Naver, Seznam) de toutes les URLs.
// Usage : npm run build  puis  npm run indexnow
// La clé est vérifiée par les moteurs via https://ultimauto.fr/<KEY>.txt

import fs from 'node:fs';

const KEY = '719ba22ab06582fa79d87a5004b67be6';
const HOST = 'ultimauto.fr';
const SITEMAP = 'dist/sitemap-0.xml';

if (!fs.existsSync(SITEMAP)) {
  console.error(`✗ ${SITEMAP} introuvable — lance d'abord : npm run build`);
  process.exit(1);
}

const xml = fs.readFileSync(SITEMAP, 'utf8');
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

if (!urlList.length) {
  console.error('✗ Aucune URL trouvée dans le sitemap.');
  process.exit(1);
}

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: `https://${HOST}/${KEY}.txt`,
    urlList,
  }),
});

const body = await res.text().catch(() => '');
console.log(`${urlList.length} URLs soumises → IndexNow : HTTP ${res.status} ${body}`);
console.log(res.ok ? '✓ Accepté (200/202 = OK)' : '✗ Échec — vérifie que le fichier de clé est bien en ligne.');
