import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import NetworkStatus from './components/NetworkStatus.jsx';

const Leitura = lazy(() => import('./pages/Leitura.jsx'));
const CommandPalette = lazy(() => import('./components/CommandPalette.jsx'));
const Serie = lazy(() => import('./pages/Serie.jsx'));
const Biblioteca = lazy(() => import('./pages/Biblioteca.jsx'));
const Estatisticas = lazy(() => import('./pages/Estatisticas.jsx'));
const Historico = lazy(() => import('./pages/Historico.jsx'));
const Admin = lazy(() => import('./pages/Admin.jsx'));
const Screen = ({children}) => <Suspense fallback={<div className="grid min-h-dvh place-items-center text-sm text-slate-500">Carregando…</div>}>{children}</Suspense>;

function ReaderRoute() {
  return <Suspense fallback={<div className="grid min-h-screen place-items-center bg-slate-950 text-sm text-slate-400">Preparando leitor…</div>}><Leitura /></Suspense>;
}

export default function App() {
  return <>
    <Suspense fallback={null}><CommandPalette /></Suspense>
    <NetworkStatus />
    <Routes>
      <Route path="/" element={<Screen><Biblioteca /></Screen>} />
      <Route path="/livro/:id" element={<ReaderRoute />} />
      <Route path="/historico" element={<Screen><Historico /></Screen>} />
      <Route path="/continuar" element={<Navigate replace to="/historico" />} />
      <Route path="/estatisticas" element={<Screen><Estatisticas /></Screen>} />
      <Route path="/admin/*" element={<Screen><Admin /></Screen>} />
      <Route path="/series/:id" element={<Suspense fallback={null}><Serie /></Suspense>} />
    </Routes>
  </>;
}
