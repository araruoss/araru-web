import axios from 'axios';

function normalizeApiBase(value = '') {
  const configured = String(value || '').trim() || '/api';

  if (/^https?:\/\//i.test(configured)) {
    const url = new URL(configured);
    if (!url.pathname || url.pathname === '/') url.pathname = '/api';
    return url.toString().replace(/\/$/, '');
  }

  const relative = configured.startsWith('/') ? configured : `/${configured}`;
  return (relative === '/' ? '/api' : relative).replace(/\/$/, '');
}

export const API_BASE_URL = normalizeApiBase(import.meta.env?.VITE_API_URL);

export function apiUrl(path = '') {
  if (!path) return API_BASE_URL;
  if (/^(https?:|data:|blob:)/i.test(path)) return path;

  let suffix = String(path);
  if (suffix === '/api') suffix = '';
  else if (suffix.startsWith('/api/')) suffix = suffix.slice(4);
  if (!suffix.startsWith('/')) suffix = `/${suffix}`;
  return `${API_BASE_URL}${suffix}`;
}

export function backendUrl(value = '') {
  if (!value || /^(https?:|data:|blob:)/i.test(value)) return value;
  if (value === '/api' || value.startsWith('/api/')) return apiUrl(value);

  if (/^https?:\/\//i.test(API_BASE_URL) && value.startsWith('/')) {
    return new URL(value, API_BASE_URL).toString();
  }

  return value;
}

export function bookCoverUrl(bookOrId, fingerprint = '') {
  const book = typeof bookOrId === 'object' ? bookOrId : null;
  const id = book?.id || bookOrId;
  const source = book?.capaUrl || book?.capa;
  if (source && (/^(https?:|data:|blob:)/i.test(source) || source.startsWith('/'))) {
    return backendUrl(source);
  }
  const version = book?.fileFingerprint || fingerprint;
  return apiUrl(`/livros/${encodeURIComponent(id)}/capa${version ? `?v=${encodeURIComponent(version)}` : ''}`);
}

export function bookContentUrl(book) {
  const source = book?.contentUrl || book?.previewUrl;
  return source ? backendUrl(source) : (book?.id ? apiUrl(`/livros/${encodeURIComponent(book.id)}/conteudo`) : '');
}

export function bookPagesUrl(bookOrId) {
  const id = typeof bookOrId === 'object' ? bookOrId?.id : bookOrId;
  return id ? apiUrl(`/livros/${encodeURIComponent(id)}/paginas`) : '';
}

export function comicPageUrl(bookOrId, page) {
  return `${bookPagesUrl(bookOrId)}/${encodeURIComponent(page)}`;
}

export function mobiResourceUrl(bookOrId, resourceIndex) {
  const id = typeof bookOrId === 'object' ? bookOrId?.id : bookOrId;
  return apiUrl(`/livros/${encodeURIComponent(id)}/recursos/mobi/${encodeURIComponent(resourceIndex)}`);
}

export function isApiCoverUrl(value = '') {
  try {
    const url = new URL(value, typeof window === 'undefined' ? 'http://localhost' : window.location.origin);
    return /^\/api\/livros\/[^/]+\/capa$/.test(url.pathname);
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
  catalog: ['catalog'],
  categories: ['categories'],
  categoryTree: ['category-tree'],
  profiles: ['profiles'],
  jobs: ['jobs'],
  series: ['series'],
  commandSearch: (query) => ['command-search', query],
  works: ['works'],
  work: (id) => ['work', id]
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
