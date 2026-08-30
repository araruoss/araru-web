import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import NetworkStatus from './components/NetworkStatus.jsx';

const Leitura = lazy(() => import('./pages/Leitura.jsx'));
const GlobalSearch = lazy(() => import('./components/search/GlobalSearch.jsx'));
const Serie = lazy(() => import('./pages/Serie.jsx'));
const Search = lazy(() => import('./pages/Search.jsx'));
const Profiles = lazy(() => import('./pages/Profiles.jsx'));
const WorkDetails = lazy(() => import('./pages/WorkDetails.jsx'));
const Biblioteca = lazy(() => import('./pages/Biblioteca.jsx'));
const Home = lazy(() => import('./pages/Home.jsx'));
const Estatisticas = lazy(() => import('./pages/Estatisticas.jsx'));
const Historico = lazy(() => import('./pages/Historico.jsx'));
const Admin = lazy(() => import('./pages/Admin.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const Screen = ({children}) => <Suspense fallback={<div className="grid min-h-dvh place-items-center text-sm text-slate-500">Carregando…</div>}>{children}</Suspense>;

function ReaderRoute() {
  return <Suspense fallback={<div className="grid min-h-screen place-items-center bg-slate-950 text-sm text-slate-400">Preparando leitor…</div>}><Leitura /></Suspense>;
}

function LegacyReaderRedirect() {
  const { id } = useParams();
  return <Navigate replace to={`/reader/${encodeURIComponent(id)}`} />;
}

export default function App() {
  return <>
    <Suspense fallback={null}><GlobalSearch /></Suspense>
    <NetworkStatus />
    <Routes>
      <Route path="/" element={<Screen><Home /></Screen>} />
      <Route path="/library" element={<Screen><Biblioteca /></Screen>} />
      <Route path="/categories" element={<Navigate replace to="/library?secao=categorias" />} />
      <Route path="/works/:id" element={<Screen><WorkDetails /></Screen>} />
      <Route path="/reader/:workId" element={<ReaderRoute />} />
      <Route path="/livro/:id" element={<LegacyReaderRedirect />} />
      <Route path="/history" element={<Screen><Historico /></Screen>} />
      <Route path="/historico" element={<Navigate replace to="/history" />} />
      <Route path="/continuar" element={<Navigate replace to="/history" />} />
      <Route path="/search" element={<Screen><Search /></Screen>} />
      <Route path="/series" element={<Navigate replace to="/library" />} />
      <Route path="/profiles" element={<Screen><Profiles /></Screen>} />
      <Route path="/estatisticas" element={<Screen><Estatisticas /></Screen>} />
      <Route path="/settings/*" element={<Screen><Settings /></Screen>} />
      <Route path="/admin/*" element={<Screen><Admin /></Screen>} />
      <Route path="/series/:id" element={<Suspense fallback={null}><Serie /></Suspense>} />
    </Routes>
  </>;
}
