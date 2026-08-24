import { ArrowLeft, BookOpen, Clock3, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import LibrarySidebar from '../components/LibrarySidebar.jsx';
import SlidingPanel from '../components/SlidingPanel.jsx';
import ReaderPreferences from '../components/ReaderPreferences.jsx';
import OfflineManager from '../components/OfflineManager.jsx';
import { useLocale } from '../context/LocaleContext.jsx';
import { useLivros } from '../hooks/useLivros.js';
import { clearReadingProgress, getAllReadingProgress, getUltimosLidos } from '../utils/localStorage.js';
import { bookCoverUrl } from '../lib/api.js';

function formatarAtualizacao(timestamp, locale, empty) {
  if (!timestamp) return empty;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(timestamp));
}

function capaDoLivro(livro) {
  return bookCoverUrl(livro);
}

function CapaHistorico({ livro }) {
  const fallbackUrl = bookCoverUrl(livro.id, livro.fileFingerprint);
  const [src, setSrc] = useState(() => capaDoLivro(livro));
  const [indisponivel, setIndisponivel] = useState(false);

  useEffect(() => {
    setSrc(capaDoLivro(livro));
    setIndisponivel(false);
  }, [livro.id, livro.capa, livro.capaUrl]);

  if (indisponivel) {
    return (
      <div className="fallback-cover flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
        <BookOpen className="h-6 w-6 opacity-55" />
        <p className="line-clamp-5 text-base font-semibold leading-tight">{livro.nome}</p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`Capa de ${livro.nome}`}
      className="h-full w-full object-cover"
      loading="lazy"
      onError={() => {
        if (src !== fallbackUrl) {
          setSrc(fallbackUrl);
          return;
        }
        setIndisponivel(true);
      }}
    />
  );
}

export default function Historico() {
  const { idioma, t } = useLocale();
  const navigate = useNavigate();
  const location = useLocation();
  const { livros, loading } = useLivros();
  const historico = getUltimosLidos();
  const [painelAtivo, setPainelAtivo] = useState(null);
  const [sidebarExpandida, setSidebarExpandida] = useState(false);
  const [revision, setRevision] = useState(0);

  const leiturasParaContinuar = useMemo(() => {
    const catalogoPorId = new Map(livros.map((livro) => [livro.id, livro]));
    const progressos = getAllReadingProgress();
    const leituras = new Map();

    historico.forEach((registro) => {
      const livroAtual = catalogoPorId.get(registro.id);
      const livro = livroAtual ? { ...registro, ...livroAtual, lidoEm: registro.lidoEm } : registro;
      const progresso = progressos[livro.id] || null;
      const percentual = Number(progresso?.progress || 0);
      leituras.set(livro.id, {
        livro,
        progresso,
        emAndamento: percentual > 0 && percentual < 0.98,
        ultimaAtividade: Number(progresso?.updatedAt || new Date(registro.lidoEm || 0).getTime() || 0)
      });
    });

    livros.forEach((livro) => {
      const progresso = progressos[livro.id];
      const percentual = Number(progresso?.progress || 0);
      if (percentual <= 0 || percentual >= 0.98 || leituras.has(livro.id)) return;
      leituras.set(livro.id, {
        livro,
        progresso,
        emAndamento: true,
        ultimaAtividade: Number(progresso.updatedAt || 0)
      });
    });

    return [...leituras.values()].sort((a, b) => {
      if (a.emAndamento !== b.emAndamento) return a.emAndamento ? -1 : 1;
      return b.ultimaAtividade - a.ultimaAtividade;
    });
  }, [historico, livros, revision]);

  const leiturasEmAndamento = leiturasParaContinuar.filter((leitura) => leitura.emAndamento);
  const ultimaLeitura = leiturasParaContinuar[0] || null;

  const resumoPeriodo = useMemo(() => {
    if (!ultimaLeitura?.ultimaAtividade) return t('history.noRecent');

    return new Intl.DateTimeFormat(idioma, {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date(ultimaLeitura.ultimaAtividade));
  }, [ultimaLeitura, idioma, t]);

  return (
    <div className="library-shell min-h-screen text-slate-950 dark:text-white">
      <Header
        busca=""
        onBuscaChange={() => {}}
        title={t('history.title')}
        showSearch={false}
        onOpenNavigation={() => setPainelAtivo('navegacao')}
      />

      <div className="mx-auto flex max-w-[1560px] gap-4 px-3 pb-8 sm:px-5 lg:px-8">
        <div className="hidden pt-5 lg:block">
          <LibrarySidebar
            expanded={sidebarExpandida}
            activeKey="recentes"
            onToggleExpanded={() => setSidebarExpandida((value) => !value)}
            onOpenSettings={() => setPainelAtivo('configuracoes')}
            onSelectHome={() => navigate('/')}
            onSelectRecent={() => navigate('/')}
            onSelectFavorites={() => navigate('/')}
          />
        </div>

        <main className="min-w-0 flex-1 pt-6 lg:pt-8">
          <div className="mx-auto max-w-[1440px] space-y-8">
            <section className="history-hero rounded-[2rem] border border-slate-200/80 p-6 dark:border-slate-800 sm:p-7 lg:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-4">
                  <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">
                    <ArrowLeft className="h-4 w-4" />
                    {t('history.back')}
                  </Link>

                  <div className="space-y-3">
                    <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                      <Clock3 className="h-4 w-4" />
                      {t('history.reading')}
                    </p>
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                      {t('history.title')}
                    </h1>
                    <p className="max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {t('history.description')}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[580px]">
                  <ResumoHistorico
                    label={t('history.available')}
                    value={`${leiturasParaContinuar.length}`}
                    caption={leiturasParaContinuar.length === 1 ? '1 livro para abrir' : `${leiturasParaContinuar.length} livros para abrir`}
                  />
                  <ResumoHistorico
                    label={t('history.inProgress')}
                    value={`${leiturasEmAndamento.length}`}
                    caption={leiturasEmAndamento.length === 1 ? '1 livro para retomar' : `${leiturasEmAndamento.length} livros para retomar`}
                  />
                  <ResumoHistorico
                    label={t('history.lastActivity')}
                    value={ultimaLeitura ? t('history.mostRecent') : t('history.noActivity')}
                    caption={resumoPeriodo}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{t('history.title')}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {t('history.saved')}
                  </p>
                </div>
                {!loading && leiturasParaContinuar.length > 0 && (
                  <span className="hidden rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-900/80 dark:text-slate-300 sm:inline-flex">
                    {leiturasParaContinuar.length} {leiturasParaContinuar.length === 1 ? 'livro' : 'livros'}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, index) => <div key={index} className="aspect-[2/3] animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800" />)}
                </div>
              ) : leiturasParaContinuar.length > 0 ? (
                <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
                  {leiturasParaContinuar.map(({ livro, progresso, emAndamento, ultimaAtividade }) => {
                    const percentual = Math.max(1, Math.round(Number(progresso?.progress || 0) * 100));
                    const readerState = { livro, from: { pathname: location.pathname, search: location.search, hash: location.hash, state: location.state } };

                    return (
                      <article key={livro.id} className="group min-w-0">
                        <Link to={`/livro/${livro.id}`} state={readerState} className="block">
                          <div className="relative aspect-[2/3] overflow-hidden rounded-3xl bg-slate-200 shadow-sm transition group-hover:-translate-y-1 group-hover:shadow-xl dark:bg-slate-800">
                            <CapaHistorico livro={livro} />
                            <span className="absolute inset-x-3 bottom-3 rounded-full bg-slate-950/80 px-3 py-2 text-center text-xs font-semibold text-white backdrop-blur-sm">
                              {emAndamento ? t('history.completed',{progress:percentual}) : t('history.openAgain')}
                            </span>
                          </div>
                          <h3 className="mt-3 line-clamp-2 text-[15px] font-semibold leading-snug sm:text-base">{livro.nome}</h3>
                          <p className="mt-1 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">{formatarAtualizacao(ultimaAtividade, idioma, t('history.noActivity'))}</p>
                        </Link>
                        <div className="mt-3 flex gap-2">
                          <Link to={`/livro/${livro.id}`} state={readerState} className="inline-flex h-9 items-center gap-2 rounded-xl bg-slate-950 px-3 text-xs font-semibold text-white dark:bg-white dark:text-slate-950">
                            <Play className="h-3.5 w-3.5" /> {emAndamento ? t('history.resume') : t('history.open')}
                          </Link>
                          {emAndamento && (
                            <button
                              type="button"
                              onClick={() => {
                                clearReadingProgress(livro.id);
                                setRevision((value) => value + 1);
                              }}
                              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:text-slate-950 dark:border-slate-700 dark:text-slate-400 dark:hover:text-white"
                              aria-label={`Reiniciar progresso de ${livro.nome}`}
                              title={t('history.restart')}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white/70 px-6 py-8 text-center dark:border-slate-700 dark:bg-slate-900/65">
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t('history.empty')}</p>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      <SlidingPanel
        open={painelAtivo === 'navegacao'}
        side="left"
        title={t('navigation.navigation')}
        onClose={() => setPainelAtivo(null)}
      >
        <LibrarySidebar
          mobile
          expanded
          activeKey="recentes"
          onToggleExpanded={() => {}}
          onOpenSettings={() => setPainelAtivo('configuracoes')}
          onSelectHome={() => {
            navigate('/');
            setPainelAtivo(null);
          }}
          onSelectRecent={() => {
            navigate('/');
            setPainelAtivo(null);
          }}
          onSelectFavorites={() => {
            navigate('/');
            setPainelAtivo(null);
          }}
        />
      </SlidingPanel>

      <SlidingPanel
        open={painelAtivo === 'configuracoes'}
        title={t('navigation.settings')}
        onClose={() => setPainelAtivo(null)}
      >
        <div className="space-y-4">
          <ReaderPreferences />
          <OfflineManager />
        </div>
      </SlidingPanel>
    </div>
  );
}

function ResumoHistorico({ label, value, caption }) {
  return (
    <div className="history-stat rounded-[1.5rem] border border-slate-200/80 p-4 dark:border-slate-800">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-lg font-semibold text-slate-950 dark:text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{caption}</p>
    </div>
  );
}
