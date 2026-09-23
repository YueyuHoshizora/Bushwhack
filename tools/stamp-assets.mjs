// Rewrites index.html so each local script/stylesheet reference carries ?v=<content hash>.
// Run after editing game.js or style.css: `node tools/stamp-assets.mjs`
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const assets = ['style.css', 'game.js'];
const htmlPath = `${root}index.html`;
let html = readFileSync(htmlPath, 'utf8');
for (const asset of assets) {
  const hash = createHash('sha256').update(readFileSync(`${root}${asset}`)).digest('hex').slice(0, 10);
  const pattern = new RegExp(`((?:src|href)=")${asset.replace('.', '\\.')}(?:\\?v=[0-9a-f]+)?(")`, 'g');
  if (!pattern.test(html)) throw new Error(`index.html does not reference ${asset}`);
  html = html.replace(pattern, `$1${asset}?v=${hash}$2`);
  console.log(`${asset}?v=${hash}`);
}
writeFileSync(htmlPath, html);
