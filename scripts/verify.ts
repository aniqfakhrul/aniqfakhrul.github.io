import fs from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import assert from 'node:assert/strict';
const root = path.resolve('dist');
async function walk(dir: string): Promise<string[]> {
  return (
    await Promise.all(
      (await fs.readdir(dir, { withFileTypes: true })).map((e) =>
        e.isDirectory()
          ? walk(path.join(dir, e.name))
          : [path.join(dir, e.name)],
      ),
    )
  ).flat();
}
const files = await walk(root);
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const missing = new Set<string>();
let linkCount = 0;
for (const file of htmlFiles) {
  const html = await fs.readFile(file, 'utf8');
  const pathname = '/' + path.relative(root, file).replace(/index\.html$/, '');
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const href = match[1].replace(/&amp;/g, '&');
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) continue;
    const url = new URL(href, `https://notebook.test${pathname}`);
    if (url.hostname !== 'notebook.test') continue;
    let target = path.join(root, decodeURIComponent(url.pathname));
    if (url.pathname.endsWith('/')) target = path.join(target, 'index.html');
    if (!files.includes(target))
      missing.add(`${path.relative(root, file)} → ${href}`);
    linkCount++;
  }
}
assert.equal(
  missing.size,
  0,
  `Broken generated links:\n${[...missing].join('\n')}`,
);
const home = await fs.readFile(path.join(root, 'index.html'));
const css = [...home.toString().matchAll(/href="([^"]+\.css)"/g)].map((m) =>
  path.join(root, m[1]),
);
let initialBytes = gzipSync(home).length;
for (const file of new Set(css))
  initialBytes += gzipSync(await fs.readFile(file)).length;
const js = [...home.toString().matchAll(/src="([^"]+\.js)"/g)].map((m) =>
  path.join(root, m[1]),
);
for (const file of new Set(js))
  initialBytes += gzipSync(await fs.readFile(file)).length;
assert.ok(
  initialBytes < 30_000,
  `Homepage HTML/CSS/JS exceeds 30 KB gzip: ${initialBytes}`,
);
await fs.access(path.join(root, 'pagefind/pagefind.js'));
console.log(
  `Verified ${htmlFiles.length} pages and ${linkCount} local references. Homepage HTML + CSS + JS: ${(initialBytes / 1024).toFixed(1)} KiB gzip (30 KB budget).`,
);
