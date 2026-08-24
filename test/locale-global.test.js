import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('mantém PT-BR e inglês e traduz as seções da página inicial', async () => {
  const [pt, en, home, access, settings] = await Promise.all([
    import('../src/locales/pt-BR.js'), import('../src/locales/en.js'),
    readFile(new URL('../src/components/ReadingHome.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/AccessGate.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/features/admin/pages/AdminSettingsPages.jsx', import.meta.url), 'utf8')
  ]);
  assert.equal(pt.default.library.continueReading, 'Continue lendo');
  assert.equal(en.default.library.continueReading, 'Continue reading');
  assert.equal(en.default.library.recentlyAdded, 'Recently added');
  assert.match(home, /t\('library\.continueReading'\)/);
  assert.match(home, /t\('library\.recentlyAdded'\)/);
  assert.match(access, /system\.publicSettings/);
  assert.match(settings, /window\.location\.reload\(\)/);
});
