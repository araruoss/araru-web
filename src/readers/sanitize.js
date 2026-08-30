import createDOMPurify from 'dompurify';

const SAFE_SCHEMES = new Set(['http:', 'https:', 'blob:']);
const SAFE_DATA_IMAGE = /^data:image\/(?:png|jpeg|gif|webp|avif);(?:base64,)[a-z0-9+/=]+$/i;

function decodeForValidation(value) {
  let current = String(value || '').replace(/[\u0000-\u0020\u007f]/g, '');
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const decoded = decodeURIComponent(current);
      if (decoded === current) break;
      current = decoded;
    } catch {
      break;
    }
  }
  return current.trim();
}

export function sanitizeReaderUrl(value, { allowDataImage = true } = {}) {
  const candidate = decodeForValidation(value);
  if (!candidate || candidate.startsWith('#')) return candidate || null;
  if (/^data:/i.test(candidate)) return allowDataImage && SAFE_DATA_IMAGE.test(candidate) ? candidate : null;
  if (/^(?:javascript|vbscript|file):/i.test(candidate)) return null;
  try {
    const parsed = new URL(candidate, globalThis.location?.origin || 'http://localhost');
    if (!SAFE_SCHEMES.has(parsed.protocol)) return null;
    return candidate;
  } catch {
    return null;
  }
}

let purifier;
function getPurifier() {
  if (purifier || typeof window === 'undefined') return purifier;
  purifier = createDOMPurify(window);
  purifier.addHook('uponSanitizeAttribute', (_node, data) => {
    if (/^(?:href|src|poster|xlink:href|action|formaction)$/i.test(data.attrName)) {
      const safe = sanitizeReaderUrl(data.attrValue, { allowDataImage: /^(?:src|poster|xlink:href)$/i.test(data.attrName) });
      if (!safe) data.keepAttr = false;
      else data.attrValue = safe;
    }
    if (/^on/i.test(data.attrName)) data.keepAttr = false;
  });
  purifier.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName !== 'A' || !node.hasAttribute('href')) return;
    const href = sanitizeReaderUrl(node.getAttribute('href'), { allowDataImage: false });
    if (!href) {
      node.removeAttribute('href');
      return;
    }
    if (/^https?:/i.test(href)) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
  return purifier;
}

export function sanitizeReaderHtml(html = '') {
  const value = String(html || '');
  const activePurifier = getPurifier();
  if (!activePurifier) return value;
  return activePurifier.sanitize(value, {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: ['a', 'abbr', 'b', 'blockquote', 'br', 'caption', 'code', 'col', 'colgroup', 'dd', 'del', 'div', 'dl', 'dt', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'li', 'mark', 'ol', 'p', 'pre', 'q', 's', 'small', 'span', 'strong', 'sub', 'sup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'u', 'ul'],
    ALLOWED_ATTR: ['alt', 'class', 'colspan', 'height', 'href', 'id', 'name', 'poster', 'rel', 'rowspan', 'src', 'style', 'target', 'title', 'width'],
    FORBID_TAGS: ['base', 'button', 'embed', 'form', 'iframe', 'input', 'meta', 'object', 'script', 'select', 'style', 'svg', 'textarea', 'video'],
    FORBID_ATTR: ['srcset', 'xlink:href']
  });
}
