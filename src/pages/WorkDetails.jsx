import { ArrowLeft, BookOpen, Check, FileText, Heart, Layers3 } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { apiFetch, bookCoverUrl, fetchJson, queryKeys } from '../lib/api.js';
import { useLocale } from '../context/LocaleContext.jsx';

const formatLabels = { pdf: 'PDF', epub: 'EPUB', mobi: 'MOBI', cbz: 'CBZ', cbr: 'CBR' };

export default function WorkDetails() {
  const { id } = useParams();
  const { t } = useLocale();
  const client = useQueryClient();
  const [actionBusy, setActionBusy] = useState(false);
  const query = useQuery({ queryKey: queryKeys.work(id), queryFn: ({ signal }) => fetchJson(`/works/${encodeURIComponent(id)}`, { signal }), enabled: Boolean(id), staleTime: 5 * 60_000 });
  const work = query.data?.work || query.data?.data || query.data;
  if (query.isPending) return <div className="grid min-h-dvh place-items-center text-sm text-muted">{t('common.loading')}</div>;
  if (!work) return <div className="grid min-h-dvh place-items-center text-sm text-muted">Obra não encontrada.</div>;
  const title = typeof (work.canonical_title || work.title || work.nome) === 'string' ? (work.canonical_title || work.title || work.nome) : 'Obra sem título';
  const authors = Array.isArray(work.authors || work.autor) ? (work.authors || work.autor) : [];
  const files = work.files || [];
  const progress = work.reading?.progress?.[id];
  const favorite = (work.reading?.favorites || []).includes(id);
  const progressValue = Math.max(0, Math.min(100, Number(progress?.progress || 0)));
  const series = work.series_name ? `${work.series_name}${work.volume_number ? ` · Vol. ${work.volume_number}` : ''}` : '';

  async function toggleFavorite() {
    setActionBusy(true);
    await apiFetch(`/works/${encodeURIComponent(id)}/favorite`, { method: favorite ? 'DELETE' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ version: work.reading?.version }) });
    await client.invalidateQueries({ queryKey: queryKeys.work(id) });
    setActionBusy(false);
  }

  return (
    <>
      <Header />
      <main className="mx-auto min-h-dvh max-w-6xl px-4 py-6 pb-24 text-primary sm:px-6 lg:py-10 lg:pb-12">
        <Link
          to="/library"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-body-sm font-medium text-secondary transition hover:bg-surface-raised hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('common.back')}
        </Link>
        <div className="mt-6 grid gap-8 md:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
          <div className="aspect-[2/3] overflow-hidden rounded-2xl bg-surface-raised shadow-raised max-w-[280px] mx-auto md:max-w-none w-full">
            {bookCoverUrl(work) ? (
              <img
                src={bookCoverUrl(work)}
                alt={`Capa de ${title}`}
                className="h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="grid h-full place-items-center p-5 text-center text-muted">
                <div>
                  <FileText className="mx-auto h-10 w-10 opacity-60" />
                  <span className="mt-3 block text-sm font-medium text-secondary">{title}</span>
                  <span className="mt-1 block text-caption text-muted">Sem capa</span>
                </div>
              </div>
            )}
          </div>
          <section className="min-w-0">
            <p className="text-caption font-semibold uppercase tracking-[.18em] text-info">Detalhes da obra</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">{title}</h1>
            <p className="mt-2.5 text-body-lg text-secondary">{Array.isArray(authors) ? authors.join(', ') : authors}</p>
            {series && (
              <p className="mt-2 inline-flex items-center gap-2 text-body-sm text-info font-medium">
                <Layers3 className="h-4 w-4" />
                {series}
              </p>
            )}
            {progressValue > 0 && (
              <div className="mt-6 max-w-xl rounded-xl border border-border-subtle bg-surface-raised p-4 shadow-subtle">
                <div className="flex justify-between text-caption text-secondary font-medium">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-accent" />
                    {progress?.completed ? 'Concluída' : 'Progresso de leitura'}
                  </span>
                  <span>{Math.round(progressValue)}%</span>
                </div>
                <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-background-subtle">
                  <div className="h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${progressValue}%` }} />
                </div>
              </div>
            )}
            {typeof work.description === 'string' && work.description && (
              <p className="mt-6 max-w-2xl whitespace-pre-line text-body leading-relaxed text-secondary">{work.description}</p>
            )}
            {!!work.tags?.length && (
              <div className="mt-6 flex flex-wrap gap-1.5">
                {work.tags
                  .filter((tag) => typeof tag === 'string' || typeof tag === 'number')
                  .map((tag) => (
                    <span key={tag} className="rounded-full border border-border bg-surface-raised/50 px-3 py-1 text-caption text-secondary">
                      {String(tag)}
                    </span>
                  ))}
              </div>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={`/reader/${encodeURIComponent(id)}`}
                className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-accent px-6 text-body-sm font-semibold text-accent-foreground shadow-subtle transition hover:bg-accent-hover active:scale-[0.99]"
              >
                <BookOpen className="h-4 w-4" />
                {progressValue > 0 ? 'Continuar leitura' : 'Começar leitura'}
              </Link>
              <button
                type="button"
                disabled={actionBusy}
                onClick={toggleFavorite}
                className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-border bg-surface px-5 text-body-sm font-semibold hover:bg-surface-raised disabled:opacity-50 transition"
                aria-pressed={favorite}
              >
                <Heart className={`h-4 w-4 ${favorite ? 'fill-current text-danger' : 'text-secondary'}`} />
                {favorite ? 'Favoritada' : 'Favoritar'}
              </button>
            </div>
            <section className="mt-10 border-t border-border-subtle pt-6" aria-labelledby="formats-title">
              <h2 id="formats-title" className="text-heading-sm font-semibold">Arquivos disponíveis</h2>
              {files.length ? (
                <div className="mt-4 grid gap-2.5 sm:grid-cols-2 max-w-xl">
                  {files.map((file) => (
                    <div
                      key={file.id || file.fileId || file.formato}
                      className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface px-4 py-3 text-body-sm shadow-subtle"
                    >
                      <FileText className="h-4 w-4 text-info" />
                      <span className="font-medium">{formatLabels[file.formato] || file.formato || 'Arquivo'}</span>
                      {file.isPrimary && <Check className="ml-auto h-4 w-4 text-success" aria-label="Formato principal" />}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-body-sm text-secondary">Nenhum formato disponível.</p>
              )}
            </section>
          </section>
        </div>
      </main>
    </>
  );
}
