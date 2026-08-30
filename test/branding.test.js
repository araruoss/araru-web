import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

test('apresenta Araru como produto no HTML, manifest e componentes principais', async () => {
  const [html, manifestSource, header, access] = await Promise.all([
    readFile(new URL('../index.html', import.meta.url), 'utf8'),
    readFile(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/Header.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/AccessGate.jsx', import.meta.url), 'utf8')
  ]);
  const manifest = JSON.parse(manifestSource);
  assert.match(html, /<title>Araru<\/title>/);
  assert.equal(manifest.name, 'Araru');
  assert.equal(manifest.short_name, 'Araru');
  assert.match(header, /brand = 'Araru'/);
  assert.match(access, />Araru</);
});

test('preserva dados locais e usa o namespace de cache do Araru', async () => {
  const [storage, offline, worker] = await Promise.all([
    readFile(new URL('../src/utils/localStorage.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/lib/offlineLibrary.js', import.meta.url), 'utf8'),
    readFile(new URL('../public/sw.js', import.meta.url), 'utf8')
  ]);
  assert.match(storage, /biblioteca:reading-progress:v1/);
  assert.match(offline, /biblioteca-digital-offline/);
  assert.match(worker, /araru-web-/);
  assert.match(worker, /\/api\/v1/);
});

test('registra os assets visuais do Araru no HTML e no PWA', async () => {
  const [html, manifestSource] = await Promise.all([
    readFile(new URL('../index.html', import.meta.url), 'utf8'),
    readFile(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8')
  ]);
  const manifest = JSON.parse(manifestSource);
  assert.match(html, /\/favicon\.ico/);
  assert.match(html, /\/icons\/apple-touch-icon\.png/);
  assert.deepEqual(manifest.icons.map((icon) => icon.src), ['/icons/icon-192.png', '/icons/icon-512.png']);
  for (const asset of ['brand/araru-favicon.png', 'brand/araru-mascot.png', 'icons/icon-192.png', 'icons/icon-512.png', 'favicon.ico']) {
    await access(new URL(`../public/${asset}`, import.meta.url));
  }
});
