import { CalendarDays, FileText, Globe2, Hash, Pencil, PlayCircle, RefreshCw, Save, Tag, UserRound, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import OfflineButton from './OfflineButton.jsx';
import { apiFetch, bookCoverUrl } from '../lib/api.js';

function isImageUrl(value = '') {
  return /^https?:\/\//i.test(value) || value.startsWith('data:') || value.startsWith('/');
}

function autoresDo(livro) {
  return Array.isArray(livro.autor) ? livro.autor.join(', ') : livro.autor || 'Autor não informado';
}

export default function LivroDetalhesModal({ livro, onClose, onMetadataQueued }) {
  const location = useLocation();
  const [detalhes, setDetalhes] = useState(null);
  const [editando, setEditando] = useState(false);
  const [formulario, setFormulario] = useState({});
  const [obra, setObra] = useState(null);
  const [arquivoEscolhido, setArquivoEscolhido] = useState(null);

  useEffect(() => {
    if (!livro) {
      setDetalhes(null);
      setEditando(false);
      return undefined;
    }

    const controller = new AbortController();
    setDetalhes(null);
    setObra(null); setArquivoEscolhido(null);

    apiFetch(`/livros/${encodeURIComponent(livro.id)}/metadados`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (payload?.data) setDetalhes(payload.data);
      })
      .catch(() => {});
    if (livro.workId) apiFetch(`/works/${encodeURIComponent(livro.workId)}`, { signal: controller.signal }).then((response)=>response.ok?response.json():null).then((payload)=>{if(payload?.data)setObra(payload.data);}).catch(()=>{});

    return () => controller.abort();
  }, [livro]);

  if (!livro) return null;

  const exibido = arquivoEscolhido || detalhes || livro;
  const origem = exibido.fonte === 'local' ? 'Arquivo local' : 'Google Drive';
  const capa = bookCoverUrl(exibido);
  const linhasInfo = [
    ['Editora', exibido.editora],
    ['Ano', exibido.ano],
    ['ISBN', exibido.isbn],
    ['Páginas', exibido.numeroPaginas],
    ['Idioma', exibido.idioma],
    ['Formato', (exibido.formato || exibido.nome?.split('.').pop() || '').toUpperCase()],
    ['Origem', origem],
    ['Categoria', exibido.categoria]
  ].filter(([, valor]) => valor);

  async function atualizarMetadados() {
    await apiFetch(`/livros/${encodeURIComponent(exibido.id)}/enriquecer?mode=force`, { method: 'POST' });
    setDetalhes((atual) => ({ ...(atual || exibido), metadataStatus: 'processing' }));
    onMetadataQueued?.();
  }

  function iniciarEdicao() {
    setFormulario({
      nome: exibido.nome || '', autor: Array.isArray(exibido.autor) ? exibido.autor.join(', ') : exibido.autor || '',
      isbn: exibido.isbn13 || exibido.isbn || '', editora: exibido.editora || '', ano: exibido.ano || '', tags: (exibido.tags || []).join(', ')
    });
    setEditando(true);
  }

  async function salvarEdicao(event) {
    event.preventDefault();
    const response = await apiFetch(`/livros/${encodeURIComponent(exibido.id)}/atualizar`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formulario)
    });
    const payload = await response.json().catch(() => null);
    if (payload?.data) setDetalhes(payload.data);
    setEditando(false);
    onMetadataQueued?.();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/72 px-4 py-6 backdrop-blur-md"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="livro-modal-titulo"
        onMouseDown={(event) => event.stopPropagation()}
        className="mx-auto flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-[rgba(250,249,245,0.98)] shadow-2xl dark:border-slate-800 dark:bg-[rgba(18,20,24,0.98)]"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-7">
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
            Biblioteca
          </span>
          <button
            type="button"
            onClick={onClose}
            className="quiet-action grid h-10 w-10 place-items-center text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Fechar detalhes"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto">
          <div className="grid gap-8 px-5 py-6 sm:px-7 sm:py-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-12">
            <div className="mx-auto w-full max-w-[280px]">
              <div className="book-cover aspect-[2/3] overflow-hidden">
                {isImageUrl(capa) ? (
                  <img src={capa} alt={`Capa de ${exibido.nome}`} className="h-full w-full object-contain" />
                ) : (
                  <div className="fallback-cover flex h-full flex-col justify-between p-6 text-center">
                    <FileText className="mx-auto h-7 w-7 opacity-55" />
                    <div className="space-y-3">
                      <p className="text-xl font-semibold leading-tight">{exibido.nome}</p>
                      <p className="text-[11px] font-medium uppercase tracking-[0.18em] opacity-70">
                        {autoresDo(exibido)}
                      </p>
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.24em] opacity-45">Sem capa</span>
                  </div>
                )}
              </div>

              <Link
                to={`/livro/${exibido.id}`}
                state={{ livro: exibido, from: { pathname: location.pathname, search: location.search, hash: location.hash, state: location.state } }}
                onClick={onClose}
                className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                <PlayCircle className="h-4 w-4" />
                Ler
              </Link>
              <OfflineButton livro={exibido} />
              {(obra?.files || livro.files)?.length > 1 && <div className="mt-3"><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Escolher formato</p><div className="space-y-1">{(obra?.files || livro.files).map((file)=><button type="button" key={file.id} onClick={()=>setArquivoEscolhido(file)} className={`flex min-h-11 w-full items-center justify-between rounded-xl border px-3 text-sm ${exibido.id===file.id?'border-cyan-500 bg-cyan-500/10':'border-slate-200 dark:border-slate-800'}`}><strong>{String(file.formato||'arquivo').toUpperCase()}</strong><span className="text-xs text-slate-500">{file.fileSize?`${(file.fileSize/1024/1024).toFixed(1)} MB`:''} · {file.fonte==='local'?'Local':'Drive'}</span></button>)}</div></div>}
            </div>

            <div className="min-w-0 space-y-7">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">{origem}</span>
                  {exibido.categoria && <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">{exibido.categoria}</span>}
                  {exibido.metadataStatus === 'completed' && <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">Metadados verificados</span>}
                  {exibido.needsReview && <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">Revisão recomendada</span>}
                </div>

                <div>
                  <h2 id="livro-modal-titulo" className="font-serif text-3xl font-semibold leading-tight text-slate-950 dark:text-white sm:text-4xl">
                    {exibido.nome}
                  </h2>
                  <p className="mt-3 flex items-center gap-2 text-base text-slate-500 dark:text-slate-400">
                    <UserRound className="h-4 w-4 shrink-0" />
                    {autoresDo(exibido)}
                  </p>
                  {(exibido.editora || exibido.ano) && (
                    <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
                      {[exibido.editora, exibido.ano].filter(Boolean).join(' • ')}
                    </p>
                  )}
                </div>
              </div>

              {exibido.tags?.length > 0 && (
                <div className="space-y-3">
                  <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                    <Tag className="h-4 w-4" />
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {exibido.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {exibido.descricao && (
                <div className="space-y-3 border-t border-slate-200 pt-6 dark:border-slate-800">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                    Sobre o livro
                  </p>
                  <p className="max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {exibido.descricao}
                  </p>
                </div>
              )}

              <div className="space-y-4 border-t border-slate-200 pt-6 dark:border-slate-800">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                  Informações
                </p>
                <dl className="divide-y divide-slate-200 dark:divide-slate-800">
                  {linhasInfo.map(([label, valor]) => (
                    <div key={label} className="grid gap-1 py-3 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-6">
                      <dt className="text-sm text-slate-400 dark:text-slate-500">{label}</dt>
                      <dd className="text-sm font-medium text-slate-800 dark:text-slate-200">{valor}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
                {exibido.ano && (
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {exibido.ano}
                  </span>
                )}
                {exibido.idioma && (
                  <span className="inline-flex items-center gap-2">
                    <Globe2 className="h-4 w-4" />
                    {exibido.idioma}
                  </span>
                )}
                {exibido.isbn && (
                  <span className="inline-flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    {exibido.isbn}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-4">
                <button type="button" onClick={atualizarMetadados} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white">
                  <RefreshCw className="h-4 w-4" />Atualizar metadados
                </button>
                <button type="button" onClick={iniciarEdicao} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white">
                  <Pencil className="h-4 w-4" />Editar metadados
                </button>
              </div>

              {editando && (
                <form onSubmit={salvarEdicao} className="grid gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800 sm:grid-cols-2">
                  {[
                    ['nome', 'Título'], ['autor', 'Autor'], ['isbn', 'ISBN'], ['editora', 'Editora'], ['ano', 'Ano'], ['tags', 'Tags separadas por vírgula']
                  ].map(([campo, label]) => (
                    <label key={campo} className={`text-xs font-medium text-slate-500 dark:text-slate-400 ${campo === 'nome' || campo === 'autor' ? 'sm:col-span-2' : ''}`}>
                      {label}
                      <input value={formulario[campo] || ''} onChange={(event) => setFormulario((atual) => ({ ...atual, [campo]: event.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
                    </label>
                  ))}
                  <div className="flex gap-2 sm:col-span-2">
                    <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white dark:bg-white dark:text-slate-950"><Save className="h-3.5 w-3.5" />Salvar e proteger</button>
                    <button type="button" onClick={() => setEditando(false)} className="rounded-full px-4 py-2 text-xs font-semibold text-slate-500">Cancelar</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
