// Generates one index.html per locale from tools/index.template.html and i18n.js:
//   /index.html (zh-Hant), /en/index.html, /ja/index.html
// Local assets are referenced with ?v=<content hash> so browsers and CDNs fetch new versions after changes.
// Run after editing the template, i18n.js, game.js or style.css: `node tools/build-pages.mjs`
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ORIGIN = 'https://bushwhack.yustellar.dev/';
const DEFAULT_LOCALE = 'zh-Hant';
const root = fileURLToPath(new URL('..', import.meta.url));
const read = file => readFileSync(`${root}${file}`, 'utf8');

const sandbox = {}; sandbox.globalThis = sandbox;
vm.runInNewContext(read('i18n.js'), sandbox);
const locales = sandbox.BUSHWHACK_I18N;
const template = read('tools/index.template.html');
const hashes = Object.fromEntries(['style.css', 'i18n.js', 'game.js'].map(file => [file, createHash('sha256').update(readFileSync(`${root}${file}`)).digest('hex').slice(0, 10)]));

const escape = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pageKeys = new Set(Object.keys(locales[DEFAULT_LOCALE].page));
for (const [lang, locale] of Object.entries(locales)) {
  const missing = [...pageKeys].filter(key => !(key in locale.page)).concat(Object.keys(locales[DEFAULT_LOCALE].game).filter(key => !(key in locale.game)));
  if (missing.length) throw new Error(`${lang} is missing keys: ${missing.join(', ')}`);
}

for (const [lang, locale] of Object.entries(locales)) {
  const base = '../'.repeat(locale.path.split('/').filter(Boolean).length);
  const values = {
    lang, base, origin: ORIGIN, url: ORIGIN + locale.path, ogLocale: locale.ogLocale,
    alternates: [...Object.entries(locales).map(([code, l]) => `  <link rel="alternate" hreflang="${code}" href="${ORIGIN}${l.path}">`), `  <link rel="alternate" hreflang="x-default" href="${ORIGIN}${locales[DEFAULT_LOCALE].path}">`].join('\n'),
    ogAlternates: Object.entries(locales).filter(([code]) => code !== lang).map(([, l]) => `  <meta property="og:locale:alternate" content="${l.ogLocale}">`).join('\n'),
    langSwitch: Object.entries(locales).map(([code, l]) => `<a href="${base}${l.path || './'}" hreflang="${code}" lang="${code}"${code === lang ? ' aria-current="page"' : ''}>${escape(l.label)}</a>`).join('')
  };
  const html = template.replace(/\{\{([\w.:-]+)\}\}/g, (_, key) => {
    if (key.startsWith('t.')) { const text = locale.page[key.slice(2)]; if (text === undefined) throw new Error(`Unknown page key ${key}`); return escape(text); }
    if (key.startsWith('asset:')) { const file = key.slice(6); if (!hashes[file]) throw new Error(`Unknown asset ${file}`); return `${base}${file}?v=${hashes[file]}`; }
    if (!(key in values)) throw new Error(`Unknown placeholder ${key}`);
    return values[key];
  });
  if (locale.path) mkdirSync(`${root}${locale.path}`, { recursive: true });
  writeFileSync(`${root}${locale.path}index.html`, html);
  console.log(`${locale.path || './'}index.html (${lang})`);
}
console.log(Object.entries(hashes).map(([file, hash]) => `${file}?v=${hash}`).join('\n'));
