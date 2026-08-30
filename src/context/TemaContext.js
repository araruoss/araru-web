import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getStorageItem, setStorageItem } from '../utils/localStorage.js';

const TemaContext = createContext(null);

function temaEscuroResolvido(tema) {
  return tema === 'dark' || (tema === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
}

function aplicarClasseDoTema(tema) {
  document.documentElement.classList.toggle('dark', temaEscuroResolvido(tema));
}

export function TemaProvider({ children }) {
  const [tema, setTema] = useState(() => getStorageItem('araru:tema-global', getStorageItem('biblioteca:tema', 'dark')));

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => aplicarClasseDoTema(tema);
    apply();
    const onChange = () => { if (tema === 'system') apply(); };
    media.addEventListener?.('change', onChange);
    return () => media.removeEventListener?.('change', onChange);
  }, [tema]);

  useEffect(() => {
    setStorageItem('araru:tema-global', tema);
    setStorageItem('biblioteca:tema', tema);
  }, [tema]);

  const aplicarTemaDoPerfil = useCallback((profileId, profileTheme = 'system') => {
    const override = profileId ? getStorageItem(`araru:tema:perfil:${profileId}`, null) : null;
    const next = override || (['light', 'dark'].includes(profileTheme) ? profileTheme : getStorageItem('araru:tema-global', 'dark'));
    const normalized = ['light', 'dark', 'system'].includes(next) ? next : 'dark';
    aplicarClasseDoTema(normalized);
    setTema(normalized);
  }, []);

  const alternarTemaDoPerfil = useCallback((profileId) => {
    const atual = profileId ? getStorageItem(`araru:tema:perfil:${profileId}`, tema) : tema;
    const next = temaEscuroResolvido(atual) ? 'light' : 'dark';
    if (profileId) setStorageItem(`araru:tema:perfil:${profileId}`, next);
    aplicarClasseDoTema(next);
    setTema(next);
  }, [tema]);

  const definirTema = useCallback((novoTema) => {
    const normalized = ['light', 'dark', 'system'].includes(novoTema) ? novoTema : 'dark';
    aplicarClasseDoTema(normalized);
    setTema(normalized);
  }, []);

  const value = useMemo(
    () => ({
      tema,
      definirTema,
      aplicarTemaDoPerfil,
      alternarTemaDoPerfil,
      alternarTema: () => setTema((atual) => (atual === 'dark' ? 'light' : 'dark'))
    }),
    [aplicarTemaDoPerfil, alternarTemaDoPerfil, definirTema, tema]
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
