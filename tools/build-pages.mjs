// Generates /index.html and /sitemap.xml from tools/index.template.html and i18n.js.
// The page is prefilled with the default locale; game.js swaps every marked string at runtime when ?lang= changes,
// so switching languages never reloads the page. Template placeholders:
//   {{t.key}}           page text, wrapped in <x-i18n data-i18n="key"> so it can be replaced at runtime
//   attr="{{a.key}}"    attribute text; the element gets data-i18n-attr="attr:key" for runtime replacement
//   {{s.key}}           static text in the default locale (for elements that cannot hold markup, e.g. <title>)
//   {{asset:file}}      local asset with ?v=<content hash> so browsers and CDNs fetch new versions after changes
// Every link in index.html is relative to the page so the site works from any host or subpath, except the share image:
// Open Graph requires absolute image URLs, so og:image and twitter:image use ORIGIN, as does sitemap.xml (the sitemap
// protocol requires absolute URLs).
// Run after editing the template, i18n.js, game.js, style.css or the icons: `node tools/build-pages.mjs`
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ORIGIN = 'https://bushwhack.yustellar.dev/';
const DEFAULT_LOCALE = 'en';
const root = fileURLToPath(new URL('..', import.meta.url));
const read = file => readFileSync(`${root}${file}`, 'utf8');

const sandbox = {}; sandbox.globalThis = sandbox;
vm.runInNewContext(read('i18n.js'), sandbox);
const locales = sandbox.BUSHWHACK_I18N;
const page = locales[DEFAULT_LOCALE].page;
const hashes = Object.fromEntries(['style.css', 'i18n.js', 'game.js', 'favicon.ico', 'assets/favicon.svg', 'assets/apple-touch-icon.png'].map(file => [file, createHash('sha256').update(readFileSync(`${root}${file}`)).digest('hex').slice(0, 10)]));

for (const [lang, locale] of Object.entries(locales)) {
  const missing = Object.keys(page).filter(key => !(key in locale.page)).concat(Object.keys(locales[DEFAULT_LOCALE].game).filter(key => !(key in locale.game)));
  if (missing.length) throw new Error(`${lang} is missing keys: ${missing.join(', ')}`);
}

const escape = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const text = key => { if (page[key] === undefined) throw new Error(`Unknown page key ${key}`); return escape(page[key]); };
// Default locale has no query so `./` stays canonical for it; other locales are `?lang=<code>` (relative to the page).
const localeLink = lang => lang === DEFAULT_LOCALE ? './' : `?lang=${lang}`;
const alternates = Object.keys(locales).map(code => [code, localeLink(code)]).concat([['x-default', './']]);
const absolute = link => new URL(link, ORIGIN).href;

const values = {
  lang: DEFAULT_LOCALE, ogLocale: locales[DEFAULT_LOCALE].ogLocale, ogImage: escape(absolute('assets/og-cover.png')),
  alternates: alternates.map(([code, url]) => `  <link rel="alternate" hreflang="${code}" href="${escape(url)}">`).join('\n'),
  ogAlternates: Object.entries(locales).filter(([code]) => code !== DEFAULT_LOCALE).map(([, l]) => `  <meta property="og:locale:alternate" content="${l.ogLocale}">`).join('\n'),
  langSwitch: Object.entries(locales).map(([code, l]) => `<a href="${localeLink(code)}" hreflang="${code}" lang="${code}" data-lang="${code}"${code === DEFAULT_LOCALE ? ' aria-current="page"' : ''}>${escape(l.label)}</a>`).join('')
};

const html = read('tools/index.template.html')
  // Tag pass: fill {{a.key}} attributes and record them in data-i18n-attr.
  .replace(/<[a-z][^>]*\{\{a\.[^>]*>/g, tag => {
    const pairs = [];
    const filled = tag.replace(/([\w:-]+)="\{\{a\.(\w+)\}\}"/g, (_, attr, key) => { pairs.push(`${attr}:${key}`); return `${attr}="${text(key)}"`; });
    return filled.replace(/\s*\/?>$/, end => ` data-i18n-attr="${pairs.join(',')}"${end}`);
  })
  .replace(/\{\{([\w.:\/-]+)\}\}/g, (_, key) => {
    if (key.startsWith('t.')) return `<x-i18n data-i18n="${key.slice(2)}">${text(key.slice(2))}</x-i18n>`;
    if (key.startsWith('s.')) return text(key.slice(2));
    if (key.startsWith('asset:')) { const file = key.slice(6); if (!hashes[file]) throw new Error(`Unknown asset ${file}`); return `${file}?v=${hashes[file]}`; }
    if (!(key in values)) throw new Error(`Unknown placeholder ${key}`);
    return values[key];
  });
writeFileSync(`${root}index.html`, html);

// Every public HTML page. The game is the only page; each locale variant lists all variants as hreflang alternates.
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${Object.keys(locales).map(lang => `  <url>
    <loc>${escape(absolute(localeLink(lang)))}</loc>
${alternates.map(([code, link]) => `    <xhtml:link rel="alternate" hreflang="${code}" href="${escape(absolute(link))}"/>`).join('\n')}
  </url>`).join('\n')}
</urlset>
`;
writeFileSync(`${root}sitemap.xml`, sitemap);
console.log(`index.html, sitemap.xml (${Object.keys(locales).join(', ')})`);
console.log(Object.entries(hashes).map(([file, hash]) => `${file}?v=${hash}`).join('\n'));
