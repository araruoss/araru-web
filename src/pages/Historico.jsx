import { Check, Clock3, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { useLocale } from '../context/LocaleContext.jsx';
import { useLivros } from '../hooks/useLivros.js';
import { bookCoverUrl } from '../lib/api.js';
import { clearReadingProgress, getAllReadingProgress, getUltimosLidos } from '../utils/localStorage.js';

function CapaHistorico({ livro }) {
  const [src, setSrc] = useState(() => bookCoverUrl(livro));
  const [failed, setFailed] = useState(false);
  useEffect(() => { setSrc(bookCoverUrl(livro)); setFailed(false); }, [livro.id, livro.capa, livro.capaUrl]);
  if (failed) return <div className="flex h-full items-center justify-center bg-surface-raised px-3 text-center text-caption font-medium text-muted">{livro.nome}</div>;
  return <img src={src} alt={`Capa de ${livro.nome}`} className="h-full w-full object-cover" loading="lazy" onError={() => setFailed(true)} />;
}

function grupoDaData(timestamp, now, t, idioma) {
  const date = new Date(timestamp); const today = new Date(now);
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.round((current - day) / 86_400_000);
  if (diff === 0) return t('history.today');
  if (diff === 1) return t('history.yesterday');
  if (diff < 7) return t('history.thisWeek');
  return new Intl.DateTimeFormat(idioma, { day: 'numeric', month: 'long', year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric' }).format(date);
}

function formatarHorario(timestamp, idioma) {
  return new Intl.DateTimeFormat(idioma, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(timestamp));
}

function autorDoLivro(livro) {
  return Array.isArray(livro.autor) ? livro.autor.join(', ') : livro.autor || livro.author || '';
}

function ReadingHistoryItem({ entry, location, t, idioma, onReset }) {
  const { livro, progresso, emAndamento, ultimaAtividade } = entry;
  const percentage = Math.round(Math.max(0, Math.min(1, Number(progresso?.progress || 0))) * 100);
  const readerState = { livro, from: { pathname: location.pathname, search: location.search, hash: location.hash, state: location.state } };
  return (
    <article className="group flex gap-4 border-b border-border-subtle py-4 first:pt-2 last:border-0 sm:gap-5">
      <Link
        to={`/reader/${encodeURIComponent(livro.id)}`}
        state={readerState}
        className="h-28 w-[4.65rem] shrink-0 overflow-hidden rounded-xl bg-surface-raised shadow-subtle transition hover:scale-105 group-hover:shadow-raised sm:h-32 sm:w-[5.35rem]"
      >
        <CapaHistorico livro={livro} />
      </Link>
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <Link to={`/works/${encodeURIComponent(livro.id)}`} className="line-clamp-2 text-body-sm font-semibold text-primary hover:text-link transition-colors">
              {livro.nome}
            </Link>
            {autorDoLivro(livro) && <p className="mt-1 line-clamp-1 text-label text-secondary">{autorDoLivro(livro)}</p>}
          </div>
          {!emAndamento && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-caption font-medium text-success">
              <Check className="h-3.5 w-3.5" />
              {t('history.finished')}
            </span>
          )}
        </div>
        <div className="mt-2.5 flex items-center gap-2 text-caption text-muted">
          <span>{emAndamento ? t('history.progress', { progress: percentage }) : t('history.finished')}</span>
          <span aria-hidden="true">·</span>
          <span>{formatarHorario(ultimaAtividade, idioma)}</span>
        </div>
        {emAndamento && (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background-subtle" aria-label={t('history.progress', { progress: percentage })}>
            <span className="block h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${percentage}%` }} />
          </div>
        )}
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <Link
            to={`/reader/${encodeURIComponent(livro.id)}`}
            state={readerState}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-accent px-3.5 text-caption font-semibold text-accent-foreground shadow-subtle transition hover:bg-accent-hover active:scale-[0.99]"
          >
            <Play className="h-3.5 w-3.5" />
            {emAndamento ? t('history.resume') : t('history.open')}
          </Link>
          {emAndamento && (
            <button
              type="button"
              onClick={() => onReset(livro.id)}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-caption text-muted transition hover:bg-surface-raised hover:text-primary"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t('history.restart')}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function Historico() {
  const { idioma, t } = useLocale();
  const location = useLocation();
  const { livros, loading } = useLivros();
  const [revision, setRevision] = useState(0);
  const [filter, setFilter] = useState('all');

  const entries = useMemo(() => {
    const catalog = new Map(livros.map((book) => [book.id, book]));
    const progress = getAllReadingProgress();
    const history = getUltimosLidos();
    const items = new Map();
    history.forEach((record) => {
      const livro = catalog.get(record.id) ? { ...record, ...catalog.get(record.id), lidoEm: record.lidoEm } : record;
      const progresso = progress[livro.id] || null;
      const value = Number(progresso?.progress || 0);
      items.set(livro.id, {
        livro,
        progresso,
        emAndamento: value > 0 && value < 0.98,
        ultimaAtividade: Number(progresso?.updatedAt || Date.parse(record.lidoEm || '') || 0)
      });
    });
    Object.entries(progress).forEach(([id, progresso]) => {
      const livro = catalog.get(id);
      const value = Number(progresso?.progress || 0);
      if (!livro || value <= 0 || value >= 0.98 || items.has(id)) return;
      items.set(id, { livro, progresso, emAndamento: true, ultimaAtividade: Number(progresso.updatedAt || 0) });
    });
    return [...items.values()].sort((a, b) => b.ultimaAtividade - a.ultimaAtividade);
  }, [livros, revision]);

  const filtered = entries.filter((entry) => filter === 'all' || (filter === 'progress' ? entry.emAndamento : !entry.emAndamento));
  const grouped = useMemo(() => {
    const groups = new Map();
    filtered.forEach((entry) => {
      const label = grupoDaData(entry.ultimaAtividade, Date.now(), t, idioma);
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(entry);
    });
    return [...groups.entries()];
  }, [filtered, idioma, t]);

  const reset = (id) => {
    clearReadingProgress(id);
    setRevision((value) => value + 1);
  };

  return (
    <div className="library-shell min-h-screen text-primary">
      <Header />
      <main className="mx-auto max-w-[1040px] px-4 pb-24 pt-7 sm:px-6 lg:px-8 lg:pt-9 lg:pb-12">
        <header className="flex flex-col gap-4 border-b border-border-subtle pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-caption font-semibold uppercase tracking-[.16em] text-muted">
              <Clock3 className="h-4 w-4" />
              {t('history.reading')}
            </p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">{t('history.title')}</h1>
            <p className="mt-2 text-body-sm text-secondary">{t('history.description')}</p>
          </div>
          {entries.length > 0 && <p className="text-caption text-muted">{t('history.records', { count: entries.length })}</p>}
        </header>
        <nav className="mt-5 flex gap-1.5" aria-label={t('history.filters')}>
          {[
            ['all', t('history.all')],
            ['progress', t('history.inProgress')],
            ['completed', t('history.completedFilter')]
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`min-h-10 rounded-lg px-3.5 text-body-sm transition ${
                filter === key ? 'bg-surface-raised font-medium text-primary shadow-subtle' : 'text-muted hover:bg-surface-raised hover:text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
        <section className="mt-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-32 animate-pulse rounded-2xl bg-surface-raised" />
              ))}
            </div>
          ) : grouped.length ? (
            grouped.map(([label, items]) => (
              <section key={label} className="mb-7" aria-label={label}>
                <h2 className="mb-2.5 text-caption font-semibold uppercase tracking-[.14em] text-muted">{label}</h2>
                <div className="rounded-2xl border border-border-subtle bg-surface px-4 sm:px-6 shadow-subtle">
                  {items.map((entry) => (
                    <ReadingHistoryItem key={entry.livro.id} entry={entry} location={location} t={t} idioma={idioma} onReset={reset} />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border px-5 py-12 text-center bg-surface/50">
              <p className="text-body-sm text-muted">{filter === 'all' ? t('history.empty') : t('history.filterEmpty')}</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
