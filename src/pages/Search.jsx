import { BookOpen, Search as SearchIcon, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { bookCoverUrl, fetchJson, queryKeys } from '../lib/api.js';
import { useLocale } from '../context/LocaleContext.jsx';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const { t } = useLocale();
  const normalized = query.trim();
  const result = useQuery({ queryKey: queryKeys.search.global(normalized), queryFn: ({ signal }) => fetchJson('/search', { signal, params: { q: normalized, page: 1, pageSize: 30 } }), enabled: normalized.length > 1, staleTime: 60_000 });
  const works = result.data?.works || [];
  const authors = result.data?.authors || [];
  const series = result.data?.series || [];
  return <><Header /><main className="mx-auto min-h-dvh max-w-7xl px-4 py-8 text-primary sm:px-6 lg:px-10">
    <div className="mx-auto max-w-3xl"><p className="text-caption font-semibold uppercase tracking-[.18em] text-info">{t('search.works')}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{t('search.placeholder')}</h1><label className="mt-6 flex min-h-14 items-center gap-3 rounded-md border border-border bg-surface px-4 shadow-subtle"><SearchIcon className="h-5 w-5 text-muted" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('search.placeholder')} className="min-w-0 flex-1 bg-transparent outline-none" aria-label={t('search.placeholder')} /></label></div>
    {result.isFetching && <p className="mx-auto mt-8 max-w-5xl text-body-sm text-secondary" aria-live="polite">{t('search.searching')}</p>}
    {!normalized && <p className="mx-auto mt-10 max-w-3xl text-body-sm text-secondary">{t('search.start')}</p>}
    {normalized.length > 1 && !result.isFetching && !works.length && !authors.length && !series.length && <p className="mx-auto mt-10 max-w-3xl text-body-sm text-secondary">{t('search.noResults')}</p>}
    {!!authors.length && <section className="mx-auto mt-8 max-w-5xl" aria-labelledby="authors-results"><h2 id="authors-results" className="text-heading-sm font-semibold"><UserRound className="mr-2 inline h-4 w-4 text-info" />{t('search.authors')}</h2><div className="mt-3 flex flex-wrap gap-2">{authors.map((author) => <Link key={author.id} to={`/library?autor=${encodeURIComponent(author.name)}`} className="rounded-full border border-border px-3 py-2 text-body-sm text-secondary hover:bg-surface-raised">{author.name}</Link>)}</div></section>}
    {!!series.length && <section className="mx-auto mt-8 max-w-5xl" aria-labelledby="series-results"><h2 id="series-results" className="text-heading-sm font-semibold"><BookOpen className="mr-2 inline h-4 w-4 text-info" />{t('search.series')}</h2><div className="mt-3 flex flex-wrap gap-2">{series.map((item) => <Link key={item.id} to={`/series/${encodeURIComponent(item.id)}`} className="rounded-full border border-border px-3 py-2 text-body-sm text-secondary hover:bg-surface-raised">{item.name}</Link>)}</div></section>}
    {!!works.length && <section className="mx-auto mt-8 max-w-5xl" aria-labelledby="works-results"><h2 id="works-results" className="text-heading-sm font-semibold">{t('search.works')}</h2><div className="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">{works.map((work) => <Link key={work.id} to={`/works/${encodeURIComponent(work.id)}`} className="group"><div className="aspect-[2/3] overflow-hidden rounded-md bg-background-subtle"><img src={bookCoverUrl(work)} alt={`Capa de ${work.canonical_title || work.title || work.nome || 'obra'}`} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" /></div><p className="mt-2 line-clamp-2 text-body-sm font-medium">{work.canonical_title || work.title || work.nome}</p><p className="mt-1 line-clamp-1 text-caption text-secondary">{Array.isArray(work.authors) ? work.authors.join(', ') : ''}</p></Link>)}</div></section>}
  </main></>;
}
