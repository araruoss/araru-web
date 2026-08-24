import { createContext, useContext, useMemo, useState } from 'react';
import ptBR from '../locales/pt-BR.js';
import en from '../locales/en.js';
const locales={'pt-BR':ptBR,en}; const LocaleContext=createContext(null);
const lookup=(object,path)=>String(path).split('.').reduce((value,key)=>value?.[key],object);
const interpolate=(message,variables={})=>String(message).replace(/\{\{(\w+)\}\}/g,(_,key)=>variables[key]??'');
export function LocaleProvider({children}){const[idioma,setIdioma]=useState(()=>localStorage.getItem('araru:idioma-global')||'pt-BR');const definirIdioma=value=>{const next=locales[value]?value:'pt-BR';setIdioma(next);localStorage.setItem('araru:idioma-global',next);document.documentElement.lang=next;};const value=useMemo(()=>({idioma,idiomas:Object.keys(locales),definirIdioma,t:(key,variables)=>interpolate(lookup(locales[idioma],key)??lookup(ptBR,key)??key,variables)}),[idioma]);return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>}
export function useLocale(){return useContext(LocaleContext)}
