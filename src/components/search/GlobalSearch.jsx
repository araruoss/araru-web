import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce, useLivros } from '../../hooks/useLivros.js';
import { apiErrorMessage, fetchJson, queryKeys } from '../../lib/api.js';
import { useLocale } from '../../context/LocaleContext.jsx';
import SearchDialog from './SearchDialog.jsx';
import SearchEmptyState from './SearchEmptyState.jsx';
import SearchInput from './SearchInput.jsx';
import SearchResults from './SearchResults.jsx';

const MIN_QUERY_LENGTH = 2;
const LIMITS = { works: 5, authors: 3, series: 3, categories: 3 };
const normalize = (value = '') => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const displayText = (value, fallback = '') => {
  if (Array.isArray(value)) return value.map((item) => displayText(item)).filter(Boolean).join(', ') || fallback;
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (value && typeof value === 'object') return displayText(value.name || value.title || value.label, fallback);
  return fallback;
};
const listFrom = (payload, keys = ['items', 'data']) => {
  for (const key of keys) if (Array.isArray(payload?.[key])) return payload[key];
  return Array.isArray(payload) ? payload : [];
};
const workTitle = (work) => displayText(work?.nome || work?.canonical_title || work?.title, 'Untitled work');
const workAuthors = (work) => displayText(work?.autor || work?.authors || work?.author);

export default function GlobalSearch() {
  const { livros, categorias } = useLivros();
  const { t } = useLocale();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const itemRefs = useRef([]);
  const previousFocusRef = useRef(null);
  const wasOpenRef = useRef(false);
  const debounced = useDebounce(query, 180);
  const normalizedQuery = debounced.trim();
  const canSearch = normalizedQuery.length >= MIN_QUERY_LENGTH;
  const search = useQuery({ queryKey: queryKeys.search.global(normalizedQuery), queryFn: ({ signal }) => fetchJson('/search', { signal, params: { q: normalizedQuery } }), enabled: open && canSearch, staleTime: 60_000, gcTime: 5 * 60_000 });
  const series = useQuery({ queryKey: queryKeys.search.series, queryFn: ({ signal }) => fetchJson('/series', { signal }), enabled: open && canSearch, staleTime: 5 * 60_000, gcTime: 15 * 60_000 });

  const openSearch = useCallback(() => {
    if (!open) previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpen(true);
  }, [open]);
  const closeSearch = useCallback(() => { setOpen(false); setQuery(''); setActiveIndex(-1); }, []);

  useEffect(() => {
    const keydown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openSearch(); return; }
      if (event.key === 'Escape' && open) { event.preventDefault(); closeSearch(); }
    };
    const external = () => openSearch();
    window.addEventListener('keydown', keydown);
    window.addEventListener('biblioteca:open-search', external);
    return () => { window.removeEventListener('keydown', keydown); window.removeEventListener('biblioteca:open-search', external); };
  }, [closeSearch, open, openSearch]);

  useEffect(() => {
    if (open) { wasOpenRef.current = true; requestAnimationFrame(() => inputRef.current?.focus()); }
    else if (wasOpenRef.current) { wasOpenRef.current = false; requestAnimationFrame(() => previousFocusRef.current?.focus?.()); }
  }, [open]);

  const selectItem = useCallback((item) => { closeSearch(); item.action(); }, [closeSearch]);
  const groups = useMemo(() => {
    if (!canSearch) return [];
    const q = normalize(normalizedQuery);
    const serverWorks = listFrom(search.data, ['works', 'items', 'data']);
    const fallbackWorks = livros.filter((book) => normalize([workTitle(book), workAuthors(book), ...(book.tags || []), book.categoria].filter(Boolean).join(' ')).includes(q));
    const works = (serverWorks.length ? serverWorks : (search.isError ? [] : fallbackWorks)).filter(Boolean);
    const unique = (values) => [...new Set(values.map((value) => displayText(value)).filter(Boolean))].filter((value) => normalize(value).includes(q));
    const seriesItems = listFrom(series.data).filter((item) => normalize(displayText(item.name || item.title)).includes(q));
    const categoryItems = categorias.filter((item) => normalize(displayText(item.nome || item.name)).includes(q));
    const apiAuthors = listFrom(search.data, ['authors']).map((author) => author?.name || author?.label || author);
    const authorItems = unique(apiAuthors.length ? apiAuthors : livros.flatMap((book) => Array.isArray(book.autor) ? book.autor : [book.autor]));
    return [
      { id: 'works', label: t('search.works'), items: works.slice(0, LIMITS.works).map((work) => ({ id: `work-${work.id}`, type: 'work', work, label: workTitle(work), detail: [workAuthors(work), displayText(work.formato || work.format)].filter(Boolean).join(' · '), action: () => navigate(`/works/${encodeURIComponent(work.id)}`) })) },
      { id: 'authors', label: t('search.authors'), items: authorItems.slice(0, LIMITS.authors).map((author) => ({ id: `author-${author}`, type: 'author', label: author, action: () => navigate(`/library?author=${encodeURIComponent(author)}`) })) },
      { id: 'series', label: t('search.series'), items: seriesItems.slice(0, LIMITS.series).map((item) => ({ id: `series-${item.id}`, type: 'series', label: displayText(item.name || item.title, 'Untitled series'), detail: `${item.volumes || item.items?.length || 0} ${t('search.volumes')}`, action: () => navigate(`/series/${encodeURIComponent(item.id)}`) })) },
      { id: 'categories', label: t('search.categories'), items: categoryItems.slice(0, LIMITS.categories).map((item) => { const name = displayText(item.nome || item.name); return { id: `category-${name}`, type: 'category', label: name, action: () => navigate(`/library?secao=categorias&categoria=${encodeURIComponent(name)}`) }; }) }
    ].filter((group) => group.items.length);
  }, [canSearch, categorias, livros, navigate, normalizedQuery, search.data, search.isError, series.data, t]);
  const flatItems = useMemo(() => groups.flatMap((group) => group.items), [groups]);
  const hasMore = Boolean(search.data?.pagination?.total > flatItems.length || search.data?.total > flatItems.length || listFrom(search.data, ['works', 'items', 'data']).length > LIMITS.works);
  const activeItem = flatItems[activeIndex];

  useEffect(() => { setActiveIndex((current) => flatItems.length ? Math.min(current, flatItems.length - 1) : -1); itemRefs.current = []; }, [flatItems.length, normalizedQuery]);
  useEffect(() => { itemRefs.current[activeIndex]?.scrollIntoView?.({ block: 'nearest' }); }, [activeIndex]);

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!flatItems.length) return;
      setActiveIndex((current) => event.key === 'ArrowDown' ? (current + 1) % flatItems.length : (current - 1 + flatItems.length) % flatItems.length);
    } else if (event.key === 'Enter' && activeItem) { event.preventDefault(); selectItem(activeItem); }
  };
  const emptyState = !canSearch ? 'start' : search.isError ? 'error' : search.isFetching ? 'loading' : 'empty';
  const emptyMessage = emptyState === 'start' ? t('search.start') : emptyState === 'error' ? apiErrorMessage(search.error, t('search.error')) : emptyState === 'loading' ? t('search.searching') : t('search.noResults');
  const allResults = () => { closeSearch(); navigate(`/search?q=${encodeURIComponent(query.trim())}`); };

  return <SearchDialog open={open} onOpenChange={(nextOpen) => nextOpen ? openSearch() : closeSearch()} title={t('search.title')}>
    <div className="search-palette">
      <SearchInput inputRef={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={handleKeyDown} onClose={closeSearch} onClear={() => { setQuery(''); setActiveIndex(-1); inputRef.current?.focus(); }} placeholder={t('search.placeholder')} clearLabel={t('search.clear')} closeLabel={t('search.close')} searching={search.isFetching} resultsId="global-search-results" activeDescendant={activeItem?.id} />
      <div className="search-palette__body" aria-live="polite" aria-atomic="false">
        {groups.length ? <SearchResults groups={groups} activeIndex={activeIndex} onSelect={selectItem} onHover={setActiveIndex} itemRefs={itemRefs} resultsLabel={t('search.results')} busy={search.isFetching} /> : <SearchEmptyState state={emptyState === 'error' ? 'error' : 'empty'} message={emptyMessage} retryLabel={t('search.retry')} onRetry={emptyState === 'error' ? search.refetch : undefined} />}
      </div>
      {groups.length > 0 && <div className="search-palette__footer"><span>{t('search.navigate')}</span>{hasMore && <button type="button" onClick={allResults}>{t('search.all')}</button>}</div>}
    </div>
  </SearchDialog>;
}
