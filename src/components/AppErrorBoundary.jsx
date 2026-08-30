import { Component } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default class AppErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) { return { error }; }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) console.error('[ui-boundary]', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return <main className="grid min-h-dvh place-items-center bg-slate-950 p-6 text-white"><section role="alert" className="max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 text-center"><AlertTriangle className="mx-auto h-8 w-8 text-amber-400" /><h1 className="mt-4 text-xl font-semibold">Esta tela encontrou um problema.</h1><p className="mt-2 text-sm text-white/65">Seus dados permanecem salvos. Recarregue para tentar novamente.</p><button type="button" onClick={() => window.location.reload()} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-slate-950"><RefreshCcw className="h-4 w-4" />Recarregar</button></section></main>;
  }
}
