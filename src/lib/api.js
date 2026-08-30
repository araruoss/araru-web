import axios from 'axios';

function normalizeApiBase(value = '') {
  const configured = String(value || '').trim() || '/api/v1';

  if (/^https?:\/\//i.test(configured)) {
    const url = new URL(configured);
    if (!url.pathname || url.pathname === '/') url.pathname = '/api/v1';
    else if (url.pathname === '/api') url.pathname = '/api/v1';
    return url.toString().replace(/\/$/, '');
  }

  const relative = configured.startsWith('/') ? configured : `/${configured}`;
  if (relative === '/' || relative === '/api') return '/api/v1';
  return relative.replace(/\/$/, '');
}

export const API_BASE_URL = normalizeApiBase(import.meta.env?.VITE_API_URL);

export function apiUrl(path = '') {
  if (!path) return API_BASE_URL;
  if (/^(https?:|data:|blob:)/i.test(path)) return path;

  let suffix = String(path);
  if (suffix === '/api' || suffix === '/api/v1') suffix = '';
  else if (suffix.startsWith('/api/v1/')) suffix = suffix.slice(7);
  if (!suffix.startsWith('/')) suffix = `/${suffix}`;
  return `${API_BASE_URL}${suffix}`;
}

export function backendUrl(value = '') {
  if (!value || /^(https?:|data:|blob:)/i.test(value)) return value;
  if (value === '/api' || value.startsWith('/api/v1/')) return apiUrl(value);

  if (/^https?:\/\//i.test(API_BASE_URL) && value.startsWith('/')) {
    return new URL(value, API_BASE_URL).toString();
  }

  return value;
}

export function bookCoverUrl(bookOrId, fingerprint = '') {
  const book = typeof bookOrId === 'object' ? bookOrId : null;
  const id = book?.id || bookOrId;
  const source = book?.capaUrl || book?.coverUrl || book?.capa;
  if (typeof source === 'string' && source && (/^(https?:|data:|blob:)/i.test(source) || source.startsWith('/'))) {
    return backendUrl(source);
  }
  const primaryFile = book?.files?.find((file) => file?.isPrimary) || book?.files?.[0];
  const format = String(book?.formato || book?.format || primaryFile?.formato || primaryFile?.format || '').toLowerCase();
  if (format && !new Set(['pdf', 'epub', 'mobi', 'cbz', 'cbr']).has(format)) return '';
  if (!id || typeof id !== 'string' && typeof id !== 'number') return '';
  const version = book?.fileFingerprint || fingerprint;
  return apiUrl(`/works/${encodeURIComponent(id)}/cover${version ? `?v=${encodeURIComponent(version)}` : ''}`);
}

export function bookContentUrl(book) {
  const source = book?.contentUrl || book?.previewUrl;
  return source ? backendUrl(source) : (book?.id ? apiUrl(`/works/${encodeURIComponent(book.id)}/content`) : '');
}

export function bookPagesUrl(bookOrId) {
  const id = typeof bookOrId === 'object' ? bookOrId?.id : bookOrId;
  return id ? apiUrl(`/works/${encodeURIComponent(id)}/pages`) : '';
}

export function comicPageUrl(bookOrId, page) {
  return `${bookPagesUrl(bookOrId)}/${encodeURIComponent(page)}`;
}

export function mobiResourceUrl(bookOrId, resourceIndex) {
  const id = typeof bookOrId === 'object' ? bookOrId?.id : bookOrId;
  return apiUrl(`/works/${encodeURIComponent(id)}/resources/mobi/${encodeURIComponent(resourceIndex)}`);
}

export function isApiCoverUrl(value = '') {
  try {
    const url = new URL(value, typeof window === 'undefined' ? 'http://localhost' : window.location.origin);
    return /^\/api\/v1\/works\/[^/]+\/cover$/.test(url.pathname);
  } catch {
    return false;
  }
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true
});

export function apiFetch(path, options = {}) {
  return fetch(apiUrl(path), { credentials: 'include', ...options });
}

export function apiErrorMessage(error, fallback = 'Não foi possível concluir a operação.') {
  if (error?.code === 'ERR_CANCELED') return 'Operação cancelada.';
  if (!error?.response) return 'Servidor indisponível. Verifique sua conexão e tente novamente.';
  return error.response.data?.message || `${fallback} (${error.response.status})`;
}

export const queryKeys = {
  catalog: ['works'],
  categories: ['categories'],
  categoryTree: ['category-tree'],
  profiles: ['profiles'],
  jobs: ['jobs'],
  series: ['series'],
  search: { global: (query) => ['search', 'global', query], series: ['search', 'series'] },
  commandSearch: (query) => ['search', 'global', query],
  works: { all: ['works'], list: (filters = {}) => ['works', filters], detail: (id) => ['works', 'detail', id] },
  work: (id) => ['works', 'detail', id],
  session: ['session'],
  home: ['home'],
  admin: { all: ['admin'], jobs: ['admin', 'jobs'], settings: ['admin', 'settings'] }
};

export async function fetchJson(path, { signal, params } = {}) {
  const response = await api.get(path, { signal, params });
  return response.data;
}

export async function prefetchBookIntent(queryClient, livro) {
  if (!livro?.id) return;
  if (livro.workId) {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.work(livro.workId),
      queryFn: ({ signal }) => fetchJson(`/works/${encodeURIComponent(livro.workId)}`, { signal }),
      staleTime: 5 * 60_000
    }).catch(() => {});
  }
  const format = String(livro.formato || '').toLowerCase();
  if (format === 'pdf') void import('../readers/pdfEngine.js');
  if (format === 'epub') void import('../readers/epubParser.js');
  if (format === 'mobi') void import('../readers/mobiParser.js');
  if (format === 'cbz' || format === 'cbr') void import('../readers/comicClient.js');
}
