import { BookOpen, Check, FileText, Globe2, Hash, MoreHorizontal, Pencil, PlayCircle, RefreshCw, Save, Tag, UserRound, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import OfflineButton from './OfflineButton.jsx';
import { apiFetch, bookCoverUrl } from '../lib/api.js';
import { getReadingProgress } from '../utils/localStorage.js';
import { Dialog, DialogContent } from './ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu';

function imageUrl(value = '') {
  return /^https?:\/\//i.test(value) || value.startsWith('data:') || value.startsWith('/');
}

function textOf(value, fallback = '') {
  if (Array.isArray(value)) return value.map((item) => textOf(item)).filter(Boolean).join(', ') || fallback;
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (value && typeof value === 'object') return textOf(value.name || value.title || value.label, fallback);
  return fallback;
}

function authorOf(work) {
  return textOf(work.autor || work.author, 'Autor não informado');
}

export default function LivroDetalhesModal({ livro, onClose, onMetadataQueued }) {
  const location = useLocation();
  const [details, setDetails] = useState(null);
  const [work, setWork] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    if (!livro) return undefined;
    const controller = new AbortController();
    setDetails(null);
    setWork(null);
    setSelectedFile(null);
    setExpanded(false);
    apiFetch(`/works/${encodeURIComponent(livro.id)}/metadata`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (payload?.data) setDetails(payload.data);
      })
      .catch(() => {});
    apiFetch('/session', { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => setCanManage(Boolean(payload?.permissions?.includes('admin.access'))))
      .catch(() => {});
    if (livro.workId) {
      apiFetch(`/works/${encodeURIComponent(livro.workId)}`, { signal: controller.signal })
        .then((response) => (response.ok ? response.json() : null))
        .then((payload) => {
          if (payload?.data) setWork(payload.data);
        })
        .catch(() => {});
    }
    return () => controller.abort();
  }, [livro]);

  const displayed = selectedFile || details || livro;
  const progressState = livro ? getReadingProgress(livro.id) : null;
  const progress = Math.max(0, Math.min(1, Number(progressState?.progress || 0)));
  const title = textOf(displayed?.nome || displayed?.title, 'Obra');
  const description = textOf(displayed?.descricao || displayed?.description);
  const cover = displayed ? bookCoverUrl(displayed) : '';
  const files = Array.isArray(work?.files) ? work.files : Array.isArray(livro?.files) ? livro.files : [];

  const metadata = useMemo(
    () =>
      [
        ['Formato', textOf(displayed?.formato || displayed?.format || textOf(displayed?.nome).split('.').pop()).toUpperCase()],
        ['Origem', displayed?.fonte === 'local' ? 'Arquivo local' : displayed?.fonte ? 'Google Drive' : ''],
        ['Categoria', textOf(displayed?.categoria || displayed?.category)],
        ['Idioma', textOf(displayed?.idioma || displayed?.language)],
        ['Ano', textOf(displayed?.ano || displayed?.year)]
      ].filter(([, value]) => value),
    [displayed]
  );

  if (!livro) return null;

  function startEditing() {
    setForm({
      nome: displayed.nome || '',
      autor: Array.isArray(displayed.autor) ? displayed.autor.join(', ') : displayed.autor || '',
      isbn: displayed.isbn13 || displayed.isbn || '',
      editora: displayed.editora || '',
      ano: displayed.ano || '',
      tags: (displayed.tags || []).join(', ')
    });
    setEditing(true);
  }

  async function saveEditing(event) {
    event.preventDefault();
    const response = await apiFetch(`/admin/works/${encodeURIComponent(displayed.id)}/metadata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const payload = await response.json().catch(() => null);
    if (payload?.data) setDetails(payload.data);
    setEditing(false);
    onMetadataQueued?.();
  }

  async function enrich() {
    await apiFetch(`/admin/works/${encodeURIComponent(displayed.id)}/enrich`, { method: 'POST' });
    setDetails((current) => ({ ...(current || displayed), metadataStatus: 'processing' }));
    onMetadataQueued?.();
  }

  const safeTags = Array.isArray(displayed.tags) ? displayed.tags.map((tag) => textOf(tag)).filter(Boolean) : [];
  const seriesName = textOf(displayed.serie || displayed.series_name);
  const volume = textOf(displayed.volume || displayed.volume_number);

  return (
    <Dialog open={Boolean(livro)} onOpenChange={(open) => { if (!open) onClose?.(); }}>
      <DialogContent className="w-[min(94vw,860px)] max-h-[88vh] max-w-none rounded-2xl bg-surface p-0 shadow-raised overflow-hidden flex flex-col">
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4 sm:px-7">
          <span className="text-caption font-semibold uppercase tracking-[.18em] text-muted">Detalhes da obra</span>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-lg text-muted transition hover:bg-surface-raised hover:text-primary focus-visible:outline-2 focus-visible:outline-info"
            aria-label="Fechar detalhes"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-6 overflow-y-auto p-5 sm:p-7 md:grid-cols-[220px_minmax(0,1fr)] md:gap-8">
          <div className="mx-auto w-full max-w-[220px]">
            <div className="aspect-[2/3] overflow-hidden rounded-xl bg-surface-raised shadow-subtle">
              {imageUrl(cover) ? (
                <img src={cover} alt={`Capa de ${title}`} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center p-5 text-center text-muted">
                  <div>
                    <FileText className="mx-auto h-8 w-8 opacity-60" />
                    <p className="mt-3 text-sm font-medium">{title}</p>
                    <p className="mt-1 text-caption text-muted">Sem capa</p>
                  </div>
                </div>
              )}
            </div>

            <Link
              to={`/livro/${encodeURIComponent(displayed.id)}`}
              state={{
                livro: displayed,
                from: { pathname: location.pathname, search: location.search, hash: location.hash, state: location.state }
              }}
              onClick={onClose}
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 text-body-sm font-semibold text-accent-foreground shadow-subtle transition hover:bg-accent-hover active:scale-[0.99]"
            >
              <PlayCircle className="h-5 w-5" />
              {progress > 0 ? 'Continuar leitura' : 'Ler agora'}
            </Link>

            <div className="mt-2.5">
              <OfflineButton livro={displayed} />
            </div>

            {files.length > 1 && (
              <div className="mt-4 space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Formatos</span>
                {files.map((file) => (
                  <button
                    type="button"
                    key={file.id || file.fileId || file.formato}
                    onClick={() => setSelectedFile(file)}
                    className={`flex min-h-10 w-full items-center justify-between rounded-lg border px-3 text-caption transition ${
                      displayed.id === file.id ? 'border-accent bg-accent/10 font-semibold text-primary' : 'border-border text-secondary hover:bg-surface-raised'
                    }`}
                  >
                    <strong>{textOf(file.formato || file.format, 'ARQUIVO').toUpperCase()}</strong>
                    <span className="text-muted text-[11px]">{file.fonte === 'local' ? 'Local' : 'Drive'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-5">
            <div>
              <h2 className="text-2xl font-semibold leading-snug text-primary sm:text-3xl">{title}</h2>
              <p className="mt-2 flex items-center gap-2 text-body-sm text-secondary">
                <UserRound className="h-4 w-4 shrink-0 text-muted" />
                <span>{authorOf(displayed)}</span>
              </p>
              {seriesName && (
                <p className="mt-1.5 text-body-sm text-info font-medium">
                  {seriesName}
                  {volume ? ` · Volume ${volume}` : ''}
                </p>
              )}
            </div>

            {progress > 0 && (
              <div className="rounded-xl border border-border-subtle bg-surface-raised p-4 shadow-subtle">
                <div className="flex items-center justify-between gap-3 text-body-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <BookOpen className="h-4 w-4 text-accent" />
                    {progress >= 0.98 ? 'Concluído' : `${Math.round(progress * 100)}% concluído`}
                  </span>
                  {progressState?.page && (
                    <span className="text-caption text-muted">
                      Página {textOf(progressState.page)}
                      {progressState.pageCount ? ` de ${textOf(progressState.pageCount)}` : ''}
                    </span>
                  )}
                </div>
                <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-background-subtle">
                  <span className="block h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${progress * 100}%` }} />
                </div>
              </div>
            )}

            {description && (
              <div>
                <p
                  className="text-body-sm leading-relaxed text-secondary line-clamp-4"
                  style={expanded ? { display: 'block' } : undefined}
                >
                  {description}
                </p>
                {description.length > 280 && (
                  <button
                    type="button"
                    onClick={() => setExpanded((value) => !value)}
                    className="mt-1.5 text-caption font-semibold text-link transition hover:text-link-hover"
                  >
                    {expanded ? 'Ver menos' : 'Ver mais'}
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2 text-caption text-muted">
              {metadata.map(([label, value]) => (
                <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-raised/40 px-3 py-1 text-secondary">
                  {label === 'Idioma' && <Globe2 className="h-3.5 w-3.5 text-muted" />}
                  {label === 'Ano' && <Hash className="h-3.5 w-3.5 text-muted" />}
                  <span className="font-medium text-muted">{label}:</span> {value}
                </span>
              ))}
            </div>

            {safeTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {safeTags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-surface-raised px-2.5 py-1 text-caption text-secondary">
                    <Tag className="h-3 w-3 text-muted" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {canManage && (
              <div className="flex justify-end pt-2">
                <DropdownMenu>
                  <DropdownMenu.Trigger
                    render={
                      <button
                        type="button"
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-caption font-semibold text-secondary hover:bg-surface-raised"
                        aria-label="Ações administrativas"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        Ações
                      </button>
                    }
                  />
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={startEditing}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar metadados
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={enrich}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Atualizar metadados
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {editing && (
              <form onSubmit={saveEditing} className="grid gap-3 rounded-xl border border-border-subtle bg-surface-raised p-4 sm:grid-cols-2">
                {[
                  ['nome', 'Título'],
                  ['autor', 'Autor'],
                  ['isbn', 'ISBN'],
                  ['editora', 'Editora'],
                  ['ano', 'Ano'],
                  ['tags', 'Tags']
                ].map(([key, label]) => (
                  <label key={key} className="text-caption font-medium text-secondary">
                    {label}
                    <input
                      className="mt-1 h-10 w-full rounded-lg border border-border bg-surface px-3 text-body-sm text-primary outline-none focus:border-focus-ring"
                      value={form[key] || ''}
                      onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                    />
                  </label>
                ))}
                <div className="flex gap-2 sm:col-span-2 pt-1">
                  <button
                    type="submit"
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-accent px-4 text-caption font-semibold text-accent-foreground"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="rounded-lg px-3 text-caption text-muted hover:bg-surface"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

