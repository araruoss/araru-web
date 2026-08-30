import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('theme toggle swaps the icon without a theme animation', async () => {
  const [component, main, styles, packageSource] = await Promise.all([
    readFile(new URL('../src/components/theme/ThemeToggleButton.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/main.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/index.css', import.meta.url), 'utf8'),
    readFile(new URL('../package.json', import.meta.url), 'utf8')
  ]);
  const packageJson = JSON.parse(packageSource);

  assert.match(component, /alternarTemaDoPerfil/);
  assert.match(component, /isDark \? <Moon/);
  assert.match(component, /aria-label/);
  assert.doesNotMatch(component, /Lottie|ThemeTransition|overlay|startViewTransition|clip-path/);
  assert.doesNotMatch(main, /ThemeTransitionProvider|theme-transition/);
  assert.match(styles, /theme-toggle/);
  assert.doesNotMatch(styles, /theme-transition-overlay|view-transition|clip-path|theme-toggle__icon/);
  assert.equal(packageJson.dependencies['lottie-react'], undefined);
});
