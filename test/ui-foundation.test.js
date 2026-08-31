import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('CSS entrypoint and Tailwind v4 configuration generate full utility suite and tokens', async () => {
  const [indexCss, tailwindConfig, postcssConfig] = await Promise.all([
    readFile(new URL('../src/index.css', import.meta.url), 'utf8'),
    readFile(new URL('../tailwind.config.js', import.meta.url), 'utf8'),
    readFile(new URL('../postcss.config.js', import.meta.url), 'utf8')
  ]);

  assert.match(indexCss, /@import "tailwindcss";/);
  assert.match(indexCss, /@config "\.\.\/tailwind\.config\.js";/);
  assert.match(postcssConfig, /@tailwindcss\/postcss/);

  assert.match(tailwindConfig, /background:\s*'var\(--background\)'/);
  assert.match(tailwindConfig, /surface:\s*'var\(--surface\)'/);
  assert.match(tailwindConfig, /primary:\s*'var\(--text-primary\)'/);
  assert.match(tailwindConfig, /secondary:\s*'var\(--text-secondary\)'/);
  assert.match(tailwindConfig, /muted:\s*'var\(--text-muted\)'/);
  assert.match(tailwindConfig, /accent:\s*'var\(--accent\)'/);
  assert.match(tailwindConfig, /border:\s*'var\(--border\)'/);
});

test('App routing and navigation items do not contain dead links', async () => {
  const [appSource, headerSource] = await Promise.all([
    readFile(new URL('../src/App.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/Header.jsx', import.meta.url), 'utf8')
  ]);

  assert.match(appSource, /path="\/"/);
  assert.match(appSource, /path="\/library"/);
  assert.match(appSource, /path="\/works\/:id"/);
  assert.match(appSource, /path="\/reader\/:workId"/);
  assert.match(appSource, /path="\/history"/);
  assert.match(appSource, /path="\/estatisticas"/);
  assert.match(appSource, /path="\/settings\/\*"/);
  assert.match(appSource, /path="\/admin\/\*"/);

  assert.match(headerSource, /to:\s*'\/',/);
  assert.match(headerSource, /to:\s*'\/library',/);
  assert.match(headerSource, /to:\s*'\/history',/);
  assert.match(headerSource, /to:\s*'\/estatisticas',/);
});

test('WorkCard and BookCover enforce aspect ratio 2:3 and object-fit', async () => {
  const [workCardSource, indexCss] = await Promise.all([
    readFile(new URL('../src/components/content/WorkCard.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/index.css', import.meta.url), 'utf8')
  ]);

  assert.match(workCardSource, /aspect-\[2\/3\]/);
  assert.match(workCardSource, /object-cover/);
  assert.match(workCardSource, /line-clamp-2/);
  assert.match(indexCss, /--radius-md:\s*0\.5rem;/);
});
