import { motion } from 'framer-motion';
import { BookMarked, Ellipsis, Heart, Play, Tag } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { backendUrl, bookCoverUrl, isApiCoverUrl, prefetchBookIntent } from '../lib/api.js';

function isImageUrl(value = '') {
  return /^https?:\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:') || value.startsWith('/');
}

export default function LivroCard({ livro, favorito, onToggleFavorito, onOpen, onShowCategory, compact = false }) {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [menuAberto, setMenuAberto] = useState(false);
  const [capaFalhou, setCapaFalhou] = useState(false);
  const [capaIndisponivel, setCapaIndisponivel] = useState(false);
  const [capaCacheada, setCapaCacheada] = useState('');
  const [capaCarregada, setCapaCarregada] = useState(false);
  const [modoCapa, setModoCapa] = useState('contain');
  const cardRef = useRef(null);
  const capaOriginalBruta = livro.capaUrl || (isImageUrl(livro.capa) ? livro.capa : '');
  const capaOriginal = backendUrl(capaOriginalBruta);
  const capaLocal = bookCoverUrl(livro.id, livro.fileFingerprint);
  const usarCapaLocal = !capaOriginal || capaFalhou || isApiCoverUrl(capaOriginal);
  const capaUrl = capaIndisponivel ? '' : (usarCapaLocal ? capaCacheada : capaOriginal);
  const autor = Array.isArray(livro.autor) ? livro.autor.join(', ') : livro.autor;
  const infoComplementar = [livro.categoria, livro.ano].filter(Boolean).join(' · ');

  useEffect(() => {
    setCapaFalhou(false);
    setCapaIndisponivel(false);
    setCapaCacheada('');
    setCapaCarregada(false);
    setModoCapa('contain');
  }, [livro.id, livro.fileFingerprint, capaOriginal]);

  useEffect(() => {
    if (!usarCapaLocal || capaIndisponivel || !cardRef.current) return undefined;
    let cancelado = false;
    let objectUrl = '';
    const controller = new AbortController();

    const carregarCapa = async () => {
      try {
        const cacheKey = new Request(capaLocal, { credentials: 'include' });
        const storage = 'caches' in window ? await caches.open('biblioteca-capas-v1') : null;
        let resposta = storage ? await storage.match(cacheKey) : null;
        if (!resposta) {
          resposta = await fetch(capaLocal, { signal: controller.signal, credentials: 'include' });
          if (!resposta.ok) throw new Error(`Capa indisponível (${resposta.status})`);
          if (storage) await storage.put(cacheKey, resposta.clone());
        }
        const blob = await resposta.blob();
        if (!blob.type.startsWith('image/')) throw new Error('Resposta não é uma imagem');
        objectUrl = URL.createObjectURL(blob);
        if (!cancelado) setCapaCacheada(objectUrl);
      } catch (error) {
        if (!cancelado && error.name !== 'AbortError') setCapaIndisponivel(true);
      }
    };

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      carregarCapa();
    }, { rootMargin: '400px' });
    observer.observe(cardRef.current);

    return () => {
      cancelado = true;
      controller.abort();
      observer.disconnect();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [capaIndisponivel, capaLocal, usarCapaLocal]);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.28 }}
      className={`book-item group relative ${compact ? 'flex min-h-[136px] gap-4 rounded-2xl border border-slate-200/80 bg-white/75 p-3 dark:border-slate-800 dark:bg-slate-900/70' : ''}`}
      ref={cardRef}
      onPointerEnter={() => prefetchBookIntent(queryClient, livro)}
      onPointerDown={() => prefetchBookIntent(queryClient, livro)}
      onFocusCapture={() => prefetchBookIntent(queryClient, livro)}
      onTouchStart={() => prefetchBookIntent(queryClient, livro)}
    >
      <div className={`relative ${compact ? 'w-20 shrink-0 sm:w-24' : ''}`}>
        <button
          type="button"
          onClick={() => onOpen(livro)}
          className="block w-full text-left"
          aria-label={`Abrir detalhes de ${livro.nome}`}
        >
          <div className={`book-cover relative aspect-[2/3] overflow-hidden ${modoCapa === 'cover' ? 'cover-fill' : 'cover-contain'} ${capaCarregada ? 'cover-ready' : ''}`}>
            <div className="fallback-cover flex h-full flex-col justify-between p-5 text-center">
              <BookMarked className="mx-auto h-6 w-6 opacity-55" />
              <div className="space-y-3">
                <p className="line-clamp-5 text-lg font-semibold leading-tight">{livro.nome}</p>
                <p className="line-clamp-2 text-[11px] font-medium uppercase tracking-[0.18em] opacity-70">
                  {autor || 'Autor não informado'}
                </p>
              </div>
              <span className="text-[10px] uppercase tracking-[0.24em] opacity-45">{capaIndisponivel ? 'Sem capa' : 'Carregando capa'}</span>
            </div>
            {capaUrl ? (
              <img
                src={capaUrl}
                alt={`Capa de ${livro.nome}`}
                className={`absolute inset-0 h-full w-full ${modoCapa === 'cover' ? 'object-cover' : 'object-contain'} transition duration-500 group-hover:scale-[1.02] ${capaCarregada ? 'opacity-100' : 'opacity-0'}`}
                loading="lazy"
                decoding="async"
                onLoad={(event) => {
                  const { naturalWidth: width, naturalHeight: height } = event.currentTarget;
                  // A estante prioriza cartões totalmente preenchidos. O recorte
                  // é proporcional (nunca deforma a arte) e centralizado.
                  setModoCapa('cover');
                  setCapaCarregada(true);
                }}
                onError={() => {
                  if (!usarCapaLocal) setCapaFalhou(true);
                  else setCapaIndisponivel(true);
                }}
              />
            ) : null}
          </div>
        </button>

        {favorito && (
          <span className="absolute left-3 top-3 inline-flex h-8 items-center gap-1 rounded-full bg-white/88 px-2.5 text-[11px] font-semibold text-rose-600 shadow-sm backdrop-blur-sm dark:bg-slate-950/85">
            <Heart className="h-3.5 w-3.5 fill-current" />
            Salvo
          </span>
        )}

        <div className="absolute right-3 top-3 flex items-center gap-2 opacity-100 transition md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorito(livro);
            }}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/88 text-slate-700 shadow-sm backdrop-blur-sm transition hover:text-rose-600 dark:bg-slate-950/85 dark:text-slate-100"
            aria-label={favorito ? 'Remover favorito' : 'Adicionar favorito'}
            title={favorito ? 'Remover favorito' : 'Adicionar favorito'}
          >
            <Heart className={favorito ? 'h-[18px] w-[18px] fill-current' : 'h-[18px] w-[18px]'} />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setMenuAberto((value) => !value);
              }}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/88 text-slate-700 shadow-sm backdrop-blur-sm transition hover:text-slate-950 dark:bg-slate-950/85 dark:text-slate-100"
              aria-label="Ações do livro"
              title="Ações do livro"
            >
              <Ellipsis className="h-[18px] w-[18px]" />
            </button>

            {menuAberto && (
              <div className="book-context-menu absolute right-0 top-11 z-20 min-w-[180px] p-1.5" onClick={(event) => event.stopPropagation()}>
                <Link
                  to={`/livro/${livro.id}`}
                  state={{ livro, from: { pathname: location.pathname, search: location.search, hash: location.hash, state: location.state } }}
                  className="context-menu-item"
                  onClick={() => setMenuAberto(false)}
                >
                  <Play className="h-4 w-4" />
                  Ler
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMenuAberto(false);
                    onOpen(livro);
                  }}
                  className="context-menu-item w-full"
                >
                  <BookMarked className="h-4 w-4" />
                  Detalhes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuAberto(false);
                    onToggleFavorito(livro);
                  }}
                  className="context-menu-item w-full"
                >
                  <Heart className={favorito ? 'h-4 w-4 fill-current' : 'h-4 w-4'} />
                  {favorito ? 'Remover dos favoritos' : 'Favoritar'}
                </button>
                {livro.categoria && onShowCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuAberto(false);
                      onShowCategory(livro.categoria);
                    }}
                    className="context-menu-item w-full"
                  >
                    <Tag className="h-4 w-4" />
                    Mostrar categoria
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={compact ? 'min-w-0 flex-1 self-center py-2' : 'pt-3'}>
        {capaUrl ? (
          <>
            <h2 className="line-clamp-2 text-[15px] font-semibold leading-snug text-slate-900 transition group-hover:text-slate-700 dark:text-white dark:group-hover:text-slate-200 sm:text-[16px]">
              {livro.nome}
            </h2>
            <p className="mt-1 line-clamp-1 text-sm text-slate-500 dark:text-slate-400">
              {autor || 'Autor não informado'}
            </p>
          </>
        ) : (
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
            {infoComplementar || 'Abrir detalhes'}
          </p>
        )}

        {infoComplementar && capaUrl && (
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {infoComplementar}
          </p>
        )}
      </div>
    </motion.article>
  );
}
