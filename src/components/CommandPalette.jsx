import { Search, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce, useLivros } from '../hooks/useLivros.js';
import { fetchJson, queryKeys } from '../lib/api.js';

const normalize = (value = '') => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function CommandPalette() {
  const { livros, categorias } = useLivros();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 120);
  const inputRef = useRef(null);
  const normalizedQuery = debounced.trim();
  const search = useQuery({
    queryKey: queryKeys.commandSearch(normalizedQuery),
    queryFn: ({ signal }) => fetchJson('/livros/busca', { signal, params: { q: normalizedQuery } }),
    enabled: open && normalizedQuery.length > 0,
    staleTime: 60_000
  });
  const series = useQuery({
    queryKey: queryKeys.series,
    queryFn: ({ signal }) => fetchJson('/series', { signal }),
    enabled: open,
    staleTime: 5 * 60_000
  });
  useEffect(() => {
    const keydown = (event) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setOpen(true); } if (event.key === 'Escape') setOpen(false); };
    const external = () => setOpen(true);
    window.addEventListener('keydown', keydown); window.addEventListener('biblioteca:open-search', external);
    return () => { window.removeEventListener('keydown', keydown); window.removeEventListener('biblioteca:open-search', external); };
  }, []);
  useEffect(() => { if (open) requestAnimationFrame(() => inputRef.current?.focus()); }, [open]);
  const groups = useMemo(() => {
    const q = normalize(debounced.trim()); if (!q) return [];
    const unique = (values) => [...new Set(values.filter(Boolean))].filter((value) => normalize(value).includes(q)).slice(0, 5);
    const serverBooks = search.data?.data || livros.filter((book) => normalize([book.nome, ...(Array.isArray(book.autor) ? book.autor : [book.autor]), ...(book.tags || []), book.categoria].filter(Boolean).join(' ')).includes(q));
    const seenWorks = new Set();
    const books = serverBooks.filter((book) => { const key = book.workId || book.id; if (seenWorks.has(key)) return false; seenWorks.add(key); return true; }).slice(0, 8);
    return [
      { label: 'Obras', items: books.map((book) => ({ id: book.id, label: book.nome, detail: Array.isArray(book.autor) ? book.autor.join(', ') : book.autor, action: () => navigate(`/livro/${encodeURIComponent(book.id)}`, { state: { livro: book, from: { pathname: '/', search: window.location.search } } }) })) },
      { label: 'Autores', items: unique(livros.flatMap((book) => Array.isArray(book.autor) ? book.autor : [book.autor])).map((author) => ({ id: author, label: author, action: () => navigate(`/?autor=${encodeURIComponent(author)}`) })) },
      { label: 'Séries', items: (series.data?.data || []).filter((item) => normalize(item.name).includes(q)).slice(0, 5).map((item) => ({ id: item.id, label: item.name, detail: `${item.volumes} volumes`, action: () => navigate(`/series/${encodeURIComponent(item.id)}`) })) },
      { label: 'Categorias', items: categorias.filter((item) => normalize(item.nome).includes(q)).slice(0, 5).map((item) => ({ id: item.nome, label: item.nome, detail: `${item.total || 0} livros`, action: () => navigate(`/?categoria=${encodeURIComponent(item.nome)}&secao=categorias`) })) },
      { label: 'Tags', items: unique(livros.flatMap((book) => book.tags || [])).map((tag) => ({ id: tag, label: tag, action: () => navigate(`/?tag=${encodeURIComponent(tag)}`) })) }
    ].filter((group) => group.items.length);
  }, [categorias, debounced, livros, navigate, search.data, series.data]);
  if (!open) return null;
  return <div className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:p-6 sm:pt-[10vh]" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}><section role="dialog" aria-modal="true" aria-label="Busca rápida" className="flex h-dvh w-full flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-950 sm:h-auto sm:max-h-[76vh] sm:max-w-2xl sm:rounded-3xl sm:border sm:border-slate-800"><div className="flex items-center gap-3 border-b border-slate-200 px-4 dark:border-slate-800"><Search className="h-5 w-5 text-slate-400" /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar obras, autores, séries, categorias ou tags" className="h-16 min-w-0 flex-1 bg-transparent text-base outline-none dark:text-white" /><kbd className="hidden rounded border px-2 py-1 text-xs text-slate-400 sm:block">Esc</kbd><button type="button" onClick={() => setOpen(false)} aria-label="Fechar busca" className="grid h-11 w-11 place-items-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><X /></button></div><div aria-busy={search.isFetching} className="flex-1 overflow-y-auto p-3">{groups.length ? groups.map((group) => <div key={group.label} className="mb-4"><h2 className="px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">{group.label}</h2>{group.items.map((item) => <button key={item.id} type="button" onClick={() => { item.action(); setOpen(false); }} className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"><span className="min-w-0 flex-1 truncate text-sm font-medium">{item.label}</span>{item.detail && <span className="max-w-[40%] truncate text-xs text-slate-400">{item.detail}</span>}</button>)}</div>) : <p className="p-8 text-center text-sm text-slate-500">{query ? (search.isFetching ? 'Pesquisando…' : 'Nenhum resultado.') : 'Comece a digitar para pesquisar.'}</p>}</div></section></div>;
}
