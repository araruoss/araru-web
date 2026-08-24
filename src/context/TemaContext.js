import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react';
import { getStorageItem, setStorageItem } from '../utils/localStorage.js';

const TemaContext = createContext(null);

export function TemaProvider({ children }) {
  const [tema, setTema] = useState(() => getStorageItem('araru:tema-global', getStorageItem('biblioteca:tema', 'system')));

  useEffect(() => {
    const dark = tema === 'dark' || (tema === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
    setStorageItem('araru:tema-global', tema);
    setStorageItem('biblioteca:tema', tema);
  }, [tema]);

  const value = useMemo(
    () => ({
      tema,
      definirTema: (novoTema) => setTema(['light', 'dark', 'system'].includes(novoTema) ? novoTema : 'system'),
      alternarTema: () => setTema((atual) => (atual === 'dark' ? 'light' : 'dark'))
    }),
    [tema]
  );

  return createElement(TemaContext.Provider, { value }, children);
}

export function useTema() {
  const context = useContext(TemaContext);
  if (!context) {
    throw new Error('useTema deve ser usado dentro de TemaProvider.');
  }
  return context;
}
