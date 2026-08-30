import assert from 'node:assert/strict';
import test from 'node:test';
import { sanitizeReaderHtml, sanitizeReaderUrl } from '../src/readers/sanitize.js';

test('reader URL policy rejects dangerous schemes and encoded variants', () => {
  for (const value of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'javascript%3Aalert(1)', 'vbscript:msgbox(1)', 'file:///etc/passwd', 'data:text/html;base64,PHNjcmlwdD4=','data:image/svg+xml;base64,PHN2Zz4=']) {
    assert.equal(sanitizeReaderUrl(value), null, value);
  }
  assert.equal(sanitizeReaderUrl('chapter-1.xhtml'), 'chapter-1.xhtml');
  assert.equal(sanitizeReaderUrl('data:image/png;base64,AAAA'), 'data:image/png;base64,AAAA');
  assert.equal(sanitizeReaderUrl('https://example.com/book.jpg'), 'https://example.com/book.jpg');
});

test('sanitization API is fail-safe outside the browser and does not alter normal markup', () => {
  const html = '<p><strong>Texto legítimo</strong></p>';
  assert.equal(sanitizeReaderHtml(html), html);
});
