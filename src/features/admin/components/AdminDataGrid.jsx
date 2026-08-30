import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

export function StatusBadge({ children, tone = 'neutral' }) {
  const toneClass = tone === 'good' ? 'bg-[var(--success)]/15 text-[var(--success)]' : tone === 'bad' ? 'bg-[var(--danger)]/15 text-[var(--danger)]' : 'bg-[var(--app-bg)] text-[var(--text-muted)]';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${toneClass}`}>{children}</span>;
}

export function AdminDataGrid({ columns, rows, loading, error, search = '', onSearch, searchPlaceholder, empty, page, pagination, onPageChange, actions, children }) {
  const currentPage = Number(page) || 1;
  const pageInfo = { page: currentPage, pages: 1, total: Array.isArray(rows) ? rows.length : 0, ...(pagination || {}) };
  const handlePageChange = onPageChange || (() => {});
  const handleSearch = onSearch || (() => {});
  const gridColumns = columns.map((column) => column.width || '1fr').join(' ');
  const style = { '--grid-columns': gridColumns };
  return <div className="space-y-4" style={style}>
    {children || <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><label className="flex min-h-11 flex-1 items-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] px-3"><Search className="h-4 w-4 text-[var(--text-muted)]" /><input className="min-w-0 flex-1 bg-transparent text-sm outline-none" value={search} onChange={(event) => handleSearch(event.target.value)} placeholder={searchPlaceholder} /></label>{actions}</div>}
    {error && <div role="alert" className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]">{error}</div>}
    <div className="overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)]"><div className="hidden grid-cols-[var(--grid-columns)] gap-4 border-b border-[var(--app-border)] bg-[var(--app-bg)] px-5 py-3 text-xs font-semibold uppercase tracking-[.12em] text-[var(--text-muted)] md:grid">{columns.map((column) => <span key={column.key} className={column.align === 'right' ? 'text-right' : ''}>{column.label}</span>)}</div><div className="divide-y divide-[var(--app-border)]">{loading ? Array.from({ length: 4 }, (_, index) => <div key={index} className="grid animate-pulse gap-4 px-5 py-5 md:grid-cols-[var(--grid-columns)]">{columns.map((column) => <span key={column.key} className="h-4 rounded bg-[var(--app-border)]" />)}</div>) : rows.map((row) => <div key={row.id} className="grid gap-3 px-5 py-4 transition hover:bg-[var(--app-bg)] md:grid-cols-[var(--grid-columns)] md:items-center">{columns.map((column) => <div key={column.key} className={column.align === 'right' ? 'md:text-right' : ''}>{column.render ? column.render(row) : row[column.key]}</div>)}</div>)}{!loading && !rows.length && <div className="px-5 py-10 text-sm text-[var(--text-muted)]">{empty}</div>}</div></div>
    <div className="flex items-center justify-between text-sm text-[var(--text-muted)]"><span>{pageInfo.total || 0} registros · Página {pageInfo.page || currentPage} de {Math.max(1, pageInfo.pages || 1)}</span><span className="flex gap-2"><button type="button" disabled={currentPage <= 1} onClick={() => handlePageChange(currentPage - 1)} className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--app-border)] disabled:opacity-40" aria-label="Página anterior"><ChevronLeft className="h-4 w-4" /></button><button type="button" disabled={currentPage >= (pageInfo.pages || 1)} onClick={() => handlePageChange(currentPage + 1)} className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--app-border)] disabled:opacity-40" aria-label="Próxima página"><ChevronRight className="h-4 w-4" /></button></span></div>
  </div>;
}
