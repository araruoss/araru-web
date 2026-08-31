import { AlertCircle, RefreshCcw } from 'lucide-react';
import { useState } from 'react';
import Header from '../components/Header.jsx';
import LivroDetalhesModal from '../components/LivroDetalhesModal.jsx';
import ReadingHome from '../components/ReadingHome.jsx';
import { useLocale } from '../context/LocaleContext.jsx';
import { useLivros } from '../hooks/useLivros.js';
import { getFavoritos, toggleFavorito } from '../utils/localStorage.js';

function HomeSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-3">
        <div className="h-6 w-44 rounded-md bg-surface-raised" />
        <div className="grid auto-cols-[148px] sm:auto-cols-[176px] grid-flow-col gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="aspect-[2/3] rounded-xl bg-surface-raised" />
              <div className="h-4 w-3/4 rounded-md bg-surface-raised" />
              <div className="h-3 w-1/2 rounded-md bg-surface-raised" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-6 w-52 rounded-md bg-surface-raised" />
        <div className="grid auto-cols-[148px] sm:auto-cols-[176px] grid-flow-col gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="aspect-[2/3] rounded-xl bg-surface-raised" />
              <div className="h-4 w-3/4 rounded-md bg-surface-raised" />
              <div className="h-3 w-1/2 rounded-md bg-surface-raised" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { t } = useLocale();
  const { livros, loading, error, recarregar, tentarNovamente } = useLivros();
  const [, setFavoritos] = useState(() => getFavoritos());
  const [livroSelecionado, setLivroSelecionado] = useState(null);

  return (
    <div className="library-shell min-h-screen text-slate-950 dark:text-white">
      <Header />
      <main className="mx-auto max-w-[1560px] px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-8 lg:pb-12">
        <section className="mb-7 max-w-3xl">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">{t('home.title')}</h1>
          <p className="mt-1.5 text-body-sm text-secondary">{t('home.description')}</p>
        </section>
        {error && (
          <div className="mb-8 flex items-center gap-3 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger shadow-subtle">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={tentarNovamente}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-current/20 px-3.5 font-medium transition hover:bg-danger/20"
            >
              <RefreshCcw className="h-4 w-4" />
              {t('library.retry')}
            </button>
          </div>
        )}
        {loading ? (
          <HomeSkeleton />
        ) : (
          <ReadingHome
            livros={livros}
            onOpen={setLivroSelecionado}
            onToggleFavorite={(livro) => setFavoritos(toggleFavorito(livro.id))}
          />
        )}
      </main>
      <LivroDetalhesModal livro={livroSelecionado} onClose={() => setLivroSelecionado(null)} onMetadataQueued={recarregar} />
    </div>
  );
}

