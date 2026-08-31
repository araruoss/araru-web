import { CheckCircle2, CircleAlert, Edit3, ExternalLink, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api, apiErrorMessage } from '../../../lib/api.js';
import { Dialog, DialogContent } from '../../../components/ui/dialog';
import { AdminPage, inputClass } from '../components/AdminPrimitives.jsx';
import { useLocale } from '../../../context/LocaleContext.jsx';

const newLibrary = () => ({ id: '', name: '', provider: 'local', location: '', enabled: true });
const newSource = (libraryId = '') => ({ id: '', libraryId, connectionId: '', name: '', pathOrPrefix: '', enabled: true, scanMode: 'incremental' });
const newConnection = () => ({ name: '', provider: 'local', enabled: true, config: { path: '' }, credentials: {} });
const labels = {
  'pt-BR': {
    title: 'Bibliotecas', description: 'Gerencie bibliotecas, fontes e conexões de armazenamento do seu acervo.', summary: 'Resumo', libraries: 'Bibliotecas', sources: 'Fontes', connections: 'Conexões', newLibrary: 'Nova biblioteca', editLibrary: 'Editar biblioteca', newSource: 'Nova fonte', editSource: 'Editar fonte', newConnection: 'Nova conexão', name: 'Nome', provider: 'Provedor', path: 'Caminho ou prefixo', location: 'Localização', library: 'Biblioteca', connection: 'Conexão', scanMode: 'Modo de scan', incremental: 'Incremental', full: 'Completo', save: 'Salvar', saveConnection: 'Salvar conexão', edit: 'Editar', addSource: 'Adicionar fonte', active: 'Ativa', inactive: 'Desativada', attention: 'Requer atenção', credentials: 'Credenciais configuradas', noCredentials: 'Sem credenciais', test: 'Testar', scan: 'Escanear catálogo', emptyLibraries: 'Nenhuma biblioteca configurada.', emptySources: 'Nenhuma fonte configurada.', emptyConnections: 'Nenhuma conexão configurada.', close: 'Fechar', cancel: 'Cancelar', remove: 'Remover', confirmRemove: 'Remover esta fonte?', oauth: 'Esta conexão usa o fluxo OAuth existente; nenhum token é solicitado manualmente.', saved: 'Alterações salvas.', tested: 'Conexão validada.', started: 'Scan enfileirado.', managedStorage: 'Storage gerenciado pelo provider', requiredPath: 'O caminho é obrigatório para conexões locais.'
  },
  en: {
    title: 'Libraries', description: 'Manage the libraries, sources, and storage connections used by your collection.', summary: 'Summary', libraries: 'Libraries', sources: 'Sources', connections: 'Connections', newLibrary: 'New library', editLibrary: 'Edit library', newSource: 'New source', editSource: 'Edit source', newConnection: 'New connection', name: 'Name', provider: 'Provider', path: 'Path or prefix', location: 'Location', library: 'Library', connection: 'Connection', scanMode: 'Scan mode', incremental: 'Incremental', full: 'Full', save: 'Save', saveConnection: 'Save connection', edit: 'Edit', addSource: 'Add source', active: 'Active', inactive: 'Disabled', attention: 'Needs attention', credentials: 'Credentials configured', noCredentials: 'No credentials', test: 'Test', scan: 'Scan catalog', emptyLibraries: 'No libraries configured.', emptySources: 'No sources configured.', emptyConnections: 'No connections configured.', close: 'Close', cancel: 'Cancel', remove: 'Remove', confirmRemove: 'Remove this source?', oauth: 'This connection uses the existing OAuth flow; no credentials are requested manually.', saved: 'Changes saved.', tested: 'Connection validated.', started: 'Catalog scan queued.', managedStorage: 'Provider-managed storage', requiredPath: 'A path is required for local connections.'
  }
};

export default function LibrariesPage() {
  const { idioma } = useLocale();
  const language = labels[idioma] || labels.en;
  const [libraries, setLibraries] = useState([]);
  const [connections, setConnections] = useState([]);
  const [providers, setProviders] = useState([]);
  const [libraryForm, setLibraryForm] = useState(newLibrary());
  const [sourceForm, setSourceForm] = useState(newSource());
  const [connectionForm, setConnectionForm] = useState(newConnection());
  const [dialog, setDialog] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [libraryResponse, connectionResponse, providerResponse] = await Promise.all([
      api.get('/admin/libraries'),
      api.get('/admin/connections'),
      api.get('/admin/connections/providers')
    ]);
    const items = libraryResponse.data.items || [];
    const withSources = await Promise.all(items.map(async (library) => {
      const response = await api.get(`/admin/libraries/${encodeURIComponent(library.id)}/sources`);
      return { ...library, sources: response.data.data || [] };
    }));
    setLibraries(withSources);
    setConnections(connectionResponse.data.data || []);
    setProviders(providerResponse.data.data || []);
  };

  useEffect(() => { load().catch((cause) => setError(apiErrorMessage(cause))); }, []);

  const connectionById = useMemo(() => new Map(connections.map((connection) => [connection.id, connection])), [connections]);
  const sourceCount = libraries.reduce((total, library) => total + (library.sources?.length || 0), 0);
  const activeLibraries = libraries.filter((library) => library.enabled).length;
  const activeConnections = connections.filter((connection) => connection.enabled).length;

  const close = () => { if (!busy) setDialog(null); };
  const saveLibrary = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (libraryForm.id) await api.patch(`/admin/libraries/${encodeURIComponent(libraryForm.id)}`, libraryForm);
      else await api.post('/admin/libraries', libraryForm);
      setMessage(language.saved); setDialog(null); await load();
    } catch (cause) { setError(apiErrorMessage(cause)); } finally { setBusy(false); }
  };
  const saveSource = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const payload = { connectionId: sourceForm.connectionId, name: sourceForm.name, pathOrPrefix: sourceForm.pathOrPrefix, enabled: sourceForm.enabled, scanMode: sourceForm.scanMode };
      if (sourceForm.id) await api.patch(`/admin/libraries/${encodeURIComponent(sourceForm.libraryId)}/sources/${encodeURIComponent(sourceForm.id)}`, payload);
      else await api.post(`/admin/libraries/${encodeURIComponent(sourceForm.libraryId)}/sources`, payload);
      setMessage(language.saved); setDialog(null); await load();
    } catch (cause) { setError(apiErrorMessage(cause)); } finally { setBusy(false); }
  };
  const saveConnection = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try { await api.post('/admin/connections', connectionForm); setMessage(language.saved); setDialog(null); setConnectionForm(newConnection()); await load(); } catch (cause) { setError(apiErrorMessage(cause)); } finally { setBusy(false); }
  };
  const patchLibrary = async (library, enabled) => {
    setBusy(true); setError('');
    try { await api.patch(`/admin/libraries/${encodeURIComponent(library.id)}`, { enabled }); setMessage(language.saved); await load(); } catch (cause) { setError(apiErrorMessage(cause)); } finally { setBusy(false); }
  };
  const patchSource = async (library, source, enabled) => {
    setBusy(true); setError('');
    try { await api.patch(`/admin/libraries/${encodeURIComponent(library.id)}/sources/${encodeURIComponent(source.id)}`, { ...source, enabled }); setMessage(language.saved); await load(); } catch (cause) { setError(apiErrorMessage(cause)); } finally { setBusy(false); }
  };
  const removeSource = async (library, source) => {
    if (!window.confirm(language.confirmRemove)) return;
    setBusy(true); setError('');
    try { await api.delete(`/admin/libraries/${encodeURIComponent(library.id)}/sources/${encodeURIComponent(source.id)}`); setMessage(language.saved); await load(); } catch (cause) { setError(apiErrorMessage(cause)); } finally { setBusy(false); }
  };
  const testConnection = async (id) => {
    setBusy(true); setError('');
    try { await api.post(`/admin/connections/${encodeURIComponent(id)}/test`); setMessage(language.tested); await load(); } catch (cause) { setError(apiErrorMessage(cause)); } finally { setBusy(false); }
  };
  const scan = async () => {
    setBusy(true); setError('');
    try { await api.post('/admin/libraries/scan'); setMessage(language.started); } catch (cause) { setError(apiErrorMessage(cause)); } finally { setBusy(false); }
  };

  const openLibrary = (library = null) => { setLibraryForm(library ? { ...library } : newLibrary()); setDialog('library'); };
  const openSource = (library, source = null) => { setSourceForm(source ? { ...source, libraryId: library.id } : newSource(library.id)); setDialog('source'); };
  const openConnection = () => { setConnectionForm(newConnection()); setDialog('connection'); };
  const setConnectionConfig = (key, value) => setConnectionForm((current) => ({ ...current, config: { ...current.config, [key]: value } }));
  const setCredential = (key, value) => setConnectionForm((current) => ({ ...current, credentials: { ...current.credentials, [key]: value } }));
  const selectedConnection = connectionById.get(sourceForm.connectionId);

  return <AdminPage title={language.title} description={language.description} actions={<><button type="button" onClick={scan} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--app-border)] px-4 text-sm font-semibold disabled:opacity-50"><RefreshCw className="h-4 w-4" />{language.scan}</button><button type="button" onClick={() => openConnection()} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--app-border)] px-4 text-sm font-semibold disabled:opacity-50"><Plus className="h-4 w-4" />{language.newConnection}</button><button type="button" onClick={() => openLibrary()} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 text-sm font-semibold text-[var(--accent-foreground)] disabled:opacity-50"><Plus className="h-4 w-4" />{language.newLibrary}</button></>}>
    {error && <p role="alert" className="mb-5 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-3 text-sm text-[var(--danger)]">{error}</p>}
    {message && <p role="status" className="mb-5 text-sm text-[var(--text-muted)]">{message}</p>}
    <div className="space-y-8">
      <section><h2 className="text-sm font-semibold">{language.summary}</h2><div className="mt-3 grid gap-3 sm:grid-cols-3"><Summary label={language.libraries} value={`${activeLibraries}/${libraries.length}`} /><Summary label={language.sources} value={sourceCount} /><Summary label={language.connections} value={`${activeConnections}/${connections.length}`} /></div></section>
      <section><div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold">{language.libraries}</h2><span className="text-xs text-[var(--text-muted)]">{language.sources}</span></div><div className="mt-3 grid gap-4 xl:grid-cols-2">{libraries.map((library) => <LibraryCard key={library.id} library={library} language={language} connectionById={connectionById} busy={busy} onEdit={openLibrary} onAddSource={openSource} onToggle={patchLibrary} onEditSource={openSource} onToggleSource={patchSource} onRemoveSource={removeSource} />)}</div>{!libraries.length && <p className="py-8 text-sm text-[var(--text-muted)]">{language.emptyLibraries}</p>}</section>
      <section><div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold">{language.connections}</h2>{message && <p className="text-xs text-[var(--text-muted)]">{message}</p>}</div><div className="mt-3 divide-y divide-[var(--app-border)] border-y border-[var(--app-border)]">{connections.map((connection) => <article key={connection.id} className="flex flex-wrap items-center gap-4 py-4"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--background-subtle)]">{connection.status === 'error' || connection.status === 'warning' ? <CircleAlert className="h-4 w-4 text-[var(--warning)]" /> : <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />}</div><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold">{connection.name}</h3><p className="mt-1 text-xs text-[var(--text-muted)]">{connection.provider} · {connection.credentialsConfigured ? language.credentials : language.noCredentials} · {connection.enabled ? language.active : language.inactive}</p></div><button type="button" disabled={busy} onClick={() => testConnection(connection.id)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[var(--app-border)] px-3 text-xs font-medium hover:bg-[var(--background-subtle)] disabled:opacity-50">{language.test}<ExternalLink className="h-3.5 w-3.5" /></button></article>)}{!connections.length && <p className="py-8 text-sm text-[var(--text-muted)]">{language.emptyConnections}</p>}</div></section>
    </div>
    <Dialog.Root open={dialog === 'library'} onOpenChange={(open) => !open && close()}><DialogContent className="w-[min(92vw,600px)]"><DialogHeader title={libraryForm.id ? language.editLibrary : language.newLibrary} close={close} closeLabel={language.close} /><form onSubmit={saveLibrary} className="mt-5 grid gap-4"><Field label={language.name}><input className={inputClass} value={libraryForm.name} onChange={(event) => setLibraryForm({ ...libraryForm, name: event.target.value })} required /></Field><Field label={language.provider}><select className={inputClass} value={libraryForm.provider} onChange={(event) => setLibraryForm({ ...libraryForm, provider: event.target.value })}><option value="local">Local</option><option value="drive">Google Drive</option><option value="r2">Cloudflare R2</option></select></Field><Field label={language.location}><input className={inputClass} value={libraryForm.location || ''} onChange={(event) => setLibraryForm({ ...libraryForm, location: event.target.value })} placeholder={language.managedStorage} /></Field><Toggle label={libraryForm.enabled ? language.active : language.inactive} checked={libraryForm.enabled} onChange={(value) => setLibraryForm({ ...libraryForm, enabled: value })} /><DialogActions language={language} busy={busy} onCancel={close} /></form></DialogContent></Dialog.Root>
    <Dialog.Root open={dialog === 'source'} onOpenChange={(open) => !open && close()}><DialogContent className="w-[min(92vw,600px)]"><DialogHeader title={sourceForm.id ? language.editSource : language.newSource} close={close} closeLabel={language.close} /><form onSubmit={saveSource} className="mt-5 grid gap-4"><Field label={language.library}><select className={inputClass} value={sourceForm.libraryId} disabled={Boolean(sourceForm.id)} onChange={(event) => setSourceForm({ ...sourceForm, libraryId: event.target.value })} required><option value="">—</option>{libraries.map((library) => <option key={library.id} value={library.id}>{library.name}</option>)}</select></Field><Field label={language.connection}><select className={inputClass} value={sourceForm.connectionId} onChange={(event) => setSourceForm({ ...sourceForm, connectionId: event.target.value })} required><option value="">—</option>{connections.map((connection) => <option key={connection.id} value={connection.id}>{connection.name} · {connection.provider}</option>)}</select></Field><Field label={language.name}><input className={inputClass} value={sourceForm.name} onChange={(event) => setSourceForm({ ...sourceForm, name: event.target.value })} required /></Field><Field label={language.path} help={selectedConnection?.provider === 'local' ? language.requiredPath : undefined}><input className={inputClass} value={sourceForm.pathOrPrefix} onChange={(event) => setSourceForm({ ...sourceForm, pathOrPrefix: event.target.value })} required={selectedConnection?.provider === 'local'} placeholder={selectedConnection?.provider === 'local' ? '/library/books' : 'optional-prefix'} /></Field><Field label={language.scanMode}><select className={inputClass} value={sourceForm.scanMode} onChange={(event) => setSourceForm({ ...sourceForm, scanMode: event.target.value })}><option value="incremental">{language.incremental}</option><option value="full">{language.full}</option></select></Field><Toggle label={sourceForm.enabled ? language.active : language.inactive} checked={sourceForm.enabled} onChange={(value) => setSourceForm({ ...sourceForm, enabled: value })} /><DialogActions language={language} busy={busy} onCancel={close} /></form></DialogContent></Dialog.Root>
    <Dialog.Root open={dialog === 'connection'} onOpenChange={(open) => !open && close()}><DialogContent className="w-[min(92vw,600px)]"><DialogHeader title={language.newConnection} close={close} closeLabel={language.close} /><form onSubmit={saveConnection} className="mt-5 grid gap-4"><Field label={language.name}><input className={inputClass} value={connectionForm.name} onChange={(event) => setConnectionForm({ ...connectionForm, name: event.target.value })} required /></Field><Field label={language.provider}><select className={inputClass} value={connectionForm.provider} onChange={(event) => setConnectionForm({ ...newConnection(), provider: event.target.value })}>{providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select></Field>{connectionForm.provider === 'local' && <Field label={language.path}><input className={inputClass} value={connectionForm.config.path} onChange={(event) => setConnectionConfig('path', event.target.value)} placeholder="/library/books" required /></Field>}{connectionForm.provider === 'cloudflare_r2' && <><Field label="Endpoint"><input className={inputClass} type="url" value={connectionForm.config.endpoint || ''} onChange={(event) => setConnectionConfig('endpoint', event.target.value)} required /></Field><Field label="Bucket"><input className={inputClass} value={connectionForm.config.bucket || ''} onChange={(event) => setConnectionConfig('bucket', event.target.value)} required /></Field><Field label="Access key"><input className={inputClass} value={connectionForm.credentials.accessKeyId || ''} onChange={(event) => setCredential('accessKeyId', event.target.value)} required /></Field><Field label="Secret key"><input className={inputClass} type="password" value={connectionForm.credentials.secretAccessKey || ''} onChange={(event) => setCredential('secretAccessKey', event.target.value)} required /></Field></>}{connectionForm.provider === 'google_drive' && <p className="text-sm text-[var(--text-muted)]">{language.oauth}</p>}<DialogActions language={language} busy={busy} onCancel={close} submitLabel={language.saveConnection} /></form></DialogContent></Dialog.Root>
  </AdminPage>;
}

function LibraryCard({ library, language, connectionById, busy, onEdit, onAddSource, onToggle, onEditSource, onToggleSource, onRemoveSource }) {
  return <article className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="font-semibold">{library.name}</h3><p className="mt-1 text-xs text-[var(--text-muted)]">{library.provider} · {library.location || language.managedStorage}</p></div><Toggle label={library.enabled ? language.active : language.inactive} checked={library.enabled} disabled={busy} onChange={(value) => onToggle(library, value)} /></div><div className="mt-5 flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => onEdit(library)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[var(--app-border)] px-3 text-xs font-semibold disabled:opacity-50"><Edit3 className="h-3.5 w-3.5" />{language.edit}</button><button type="button" disabled={busy || !library.enabled} onClick={() => onAddSource(library)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[var(--brand-primary)] px-3 text-xs font-semibold text-[var(--accent-foreground)] disabled:opacity-50"><Plus className="h-3.5 w-3.5" />{language.addSource}</button></div><div className="mt-5 border-t border-[var(--app-border)] pt-4"><div className="mb-2 flex items-center justify-between"><h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{language.sources}</h4><span className="text-xs text-[var(--text-muted)]">{library.sources?.length || 0}</span></div>{library.sources?.map((source) => <div key={source.id} className="flex flex-wrap items-center gap-3 border-b border-[var(--app-border)] py-3 last:border-0"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{source.name}</p><p className="mt-1 truncate text-xs text-[var(--text-muted)]">{connectionById.get(source.connectionId)?.name || source.connectionId} · {source.pathOrPrefix || language.managedStorage}</p></div><Toggle label={source.enabled ? language.active : language.inactive} checked={source.enabled} disabled={busy || !library.enabled} onChange={(value) => onToggleSource(library, source, value)} /><button type="button" disabled={busy} onClick={() => onEditSource(library, source)} aria-label={`${language.edit}: ${source.name}`} className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--app-border)] disabled:opacity-50"><Edit3 className="h-3.5 w-3.5" /></button><button type="button" disabled={busy} onClick={() => onRemoveSource(library, source)} aria-label={`${language.remove}: ${source.name}`} className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--app-border)] text-[var(--danger)] disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /></button></div>)}{!library.sources?.length && <p className="py-3 text-sm text-[var(--text-muted)]">{language.emptySources}</p>}</div></article>;
}

function DialogHeader({ title, close, closeLabel }) { return <div className="flex items-start justify-between gap-4"><h2 className="text-xl font-semibold">{title}</h2><button type="button" onClick={close} aria-label={closeLabel} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-[var(--background-subtle)]"><X className="h-4 w-4" /></button></div>; }
function DialogActions({ language, busy, onCancel, submitLabel = language.save }) { return <div className="mt-2 flex justify-end gap-2"><button type="button" onClick={onCancel} disabled={busy} className="min-h-11 rounded-xl border border-[var(--app-border)] px-4 text-sm font-semibold disabled:opacity-50">{language.cancel}</button><button disabled={busy} className="min-h-11 rounded-xl bg-[var(--brand-primary)] px-4 text-sm font-semibold text-[var(--accent-foreground)] disabled:opacity-50">{submitLabel}</button></div>; }
function Field({ label, help, children }) { return <label className="block min-w-0 text-sm font-medium">{label}<span className="mt-2 block">{children}</span>{help && <span className="mt-1.5 block text-xs font-normal leading-5 text-[var(--text-muted)]">{help}</span>}</label>; }
function Toggle({ label, checked, onChange, disabled = false }) { return <label className="inline-flex min-h-9 items-center gap-2 text-xs text-[var(--text-muted)]"><input type="checkbox" checked={Boolean(checked)} disabled={disabled} onChange={(event) => onChange?.(event.target.checked)} />{label}</label>; }
function Summary({ label, value }) { return <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] p-4"><strong className="block text-2xl tracking-tight">{value}</strong><span className="mt-1 block text-xs text-[var(--text-muted)]">{label}</span></div>; }
