import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { TemaProvider } from './context/TemaContext.js';
import './index.css';
import { startReadingStateSync } from './utils/readingSync.js';
import AccessGate from './components/AccessGate.jsx';
import AppErrorBoundary from './components/AppErrorBoundary.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { startLocalWebVitals } from './lib/telemetry.js';
import { API_BASE_URL } from './lib/api.js';
import { LocaleProvider } from './context/LocaleContext.jsx';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, gcTime: 15 * 60_000, retry: 1, refetchOnWindowFocus: false } } });

startReadingStateSync();
startLocalWebVitals();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      const configure = () => {
        const worker = navigator.serviceWorker.controller || registration.active || registration.waiting;
        worker?.postMessage({ type: 'CONFIGURE_API', apiBaseUrl: new URL(API_BASE_URL, window.location.origin).href });
      };
      configure();
      navigator.serviceWorker.ready.then(configure);
      navigator.serviceWorker.addEventListener('controllerchange', configure, { once: true });
    }).catch((error) => {
      console.warn('Não foi possível ativar o modo offline.', error);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
      <TemaProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <LocaleProvider>
            <QueryClientProvider client={queryClient}>
              <AppErrorBoundary><AccessGate><App /></AccessGate></AppErrorBoundary>
            </QueryClientProvider>
            <Toaster position="bottom-right" toastOptions={{ duration: 2200 }} />
          </LocaleProvider>
        </BrowserRouter>
      </TemaProvider>
  </React.StrictMode>
);
