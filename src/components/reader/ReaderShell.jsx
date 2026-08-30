import { Component } from 'react';
import { AlertTriangle, RefreshCcw, X } from 'lucide-react';

export function ReaderShell({ children, capabilities = {}, engine = 'unknown' }) {
  return <div data-reader-engine={engine} data-reader-capabilities={Object.entries(capabilities).filter(([, enabled]) => enabled).map(([key]) => key).join(',')} className="relative h-dvh min-h-dvh w-screen overflow-hidden bg-slate-950">{children}</div>;
}

export function ReaderViewport({ children, className = '', ...props }) {
  return <div className={`reader-viewport h-full w-full ${className}`} {...props}>{children}</div>;
}

export function ReaderDock({ children, className = '' }) {
  return <div role="toolbar" aria-label="Navegação do leitor" className={`reader-toolbar fixed left-1/2 -translate-x-1/2 z-50 flex max-w-[calc(100vw-16px)] flex-wrap items-center justify-center gap-0.5 rounded-2xl border border-white/10 bg-slate-950/75 p-1 text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:max-w-[calc(100vw-24px)] ${className}`} style={{ bottom: 'calc(10px + env(safe-area-inset-bottom))' }}>{children}</div>;
}

export function ReaderTopBar({ title, onClose }) {
  return <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex min-h-14 items-center justify-between bg-gradient-to-b from-black/45 to-transparent px-3 text-white"><span className="truncate text-sm font-medium opacity-80">{title}</span>{onClose && <button type="button" onClick={onClose} aria-label="Fechar livro" className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-black/35 backdrop-blur"><X className="h-5 w-5" /></button>}</header>;
}

export function ReaderSettings({ open, onClose, children }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[60] flex items-end bg-black/35 p-3" onClick={onClose}><div role="dialog" aria-modal="true" aria-label="Configurações de leitura" className="w-full rounded-2xl bg-slate-950 p-4 text-white shadow-2xl" onClick={(event) => event.stopPropagation()}>{children}</div></div>;
}

export function ReaderProgress({ value = 0, label }) {
  return <div aria-label={label || `Progresso ${Math.round(value * 100)}%`} className="h-1 overflow-hidden rounded-full bg-white/15"><span className="block h-full bg-white/75" style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }} /></div>;
}

export class ReaderErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidUpdate(previous) { if (previous.readerKey !== this.props.readerKey && this.state.error) this.setState({ error: null }); }
  render() {
    if (!this.state.error) return this.props.children;
    return <section role="alert" className="grid h-full place-items-center p-6 text-center text-white"><div><AlertTriangle className="mx-auto h-8 w-8 text-amber-400" /><p className="mt-3 font-semibold">Não foi possível abrir o livro.</p><div className="mt-5 flex justify-center gap-2"><button type="button" onClick={() => this.setState({ error: null })} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-slate-950"><RefreshCcw className="h-4 w-4" />Tentar novamente</button><button type="button" onClick={this.props.onExit} className="min-h-11 rounded-full border border-white/20 px-4 text-sm">Voltar</button></div></div></section>;
  }
}
