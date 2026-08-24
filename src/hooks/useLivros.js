import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiErrorMessage, fetchJson, queryKeys } from '../lib/api.js';

function normalizar(texto = '') {
  return texto
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function mensagemErroApi(error) {
  if (error?.code === 'ERR_CANCELED') {
    return 'A requisicao foi cancelada. Aguarde o backend terminar de reiniciar e atualize a pagina.';
  }

  if (!error?.response) {
    return 'Nao foi possivel conectar ao backend. Confira a URL da API e se o servidor esta disponivel.';
  }

  return error.response.data?.message || `Erro ao carregar a biblioteca (${error.response.status}).`;
}

export function useLivros() {
  const queryClient = useQueryClient();
  const catalog = useQuery({ queryKey: queryKeys.catalog, queryFn: ({ signal }) => fetchJson('/livros', { signal }) });
  const categories = useQuery({ queryKey: queryKeys.categories, queryFn: ({ signal }) => fetchJson('/categorias', { signal }) });
  const tree = useQuery({ queryKey: queryKeys.categoryTree, queryFn: ({ signal }) => fetchJson('/categorias/arvore', { signal }) });
  const recarregar = useCallback(async () => {
    await fetchJson('/livros', { params: { refresh: 'true' } });
    await queryClient.invalidateQueries({ queryKey: queryKeys.catalog });
    await queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    await queryClient.invalidateQueries({ queryKey: queryKeys.categoryTree });
  }, [queryClient]);
  const tentarNovamente = useCallback(async () => {
    await Promise.allSettled([catalog.refetch(), categories.refetch(), tree.refetch()]);
  }, [catalog, categories, tree]);

  return {
    livros: catalog.data?.data || [],
    categorias: categories.data?.data || [],
    arvoreCategorias: tree.data?.data || [],
    loading: catalog.isPending || categories.isPending || tree.isPending,
    refreshing: catalog.isFetching || categories.isFetching || tree.isFetching,
    error: [catalog.error, categories.error, tree.error].find(Boolean) ? apiErrorMessage([catalog.error, categories.error, tree.error].find(Boolean), 'Erro ao carregar a biblioteca') : '',
    recarregar,
    tentarNovamente
  };
}

function coletarTexto(valor) {
  if (Array.isArray(valor)) {
    return valor.join(' ');
  }

  return valor || '';
}

export function useLivrosFiltrados(livros, categoriaSelecionada, termoBusca, filtros = {}, subcategoriaSelecionada = '', categoryPath = [], incluirSubpastas = true) {
  return useMemo(() => {
    const categoria = normalizar(categoriaSelecionada);
    const termo = normalizar(termoBusca);
    const autor = normalizar(filtros.autor);
    const editora = normalizar(filtros.editora);
    const tag = normalizar(filtros.tag);
    const formato = normalizar(filtros.formato);
    const idioma = normalizar(filtros.idioma);
    const anoMin = filtros.anoMin ? Number(filtros.anoMin) : null;
    const anoMax = filtros.anoMax ? Number(filtros.anoMax) : null;
    const avaliacaoMin = filtros.avaliacaoMin ? Number(filtros.avaliacaoMin) : null;
    const caminhoNormalizado = categoryPath.map(normalizar);

    return livros.filter((livro) => {
      const combinaCategoria = !categoria || categoria === 'todos' || normalizar(livro.categoria) === categoria;
      const combinaSubcategoria = !subcategoriaSelecionada || (livro.subcategorias || []).some((item) => normalizar(typeof item === 'string' ? item : item.nome) === normalizar(subcategoriaSelecionada));
      const caminhoLivro = (livro.categoryPath || []).map(normalizar);
      const combinaCaminho = !caminhoNormalizado.length || (
        incluirSubpastas
          ? caminhoNormalizado.every((item, index) => caminhoLivro[index] === item)
          : caminhoLivro.length === caminhoNormalizado.length && caminhoNormalizado.every((item, index) => caminhoLivro[index] === item)
      );
      const campoBusca = [
        livro.nome,
        coletarTexto(livro.autor),
        livro.editora,
        livro.descricao,
        livro.isbn,
        livro.isbn10,
        livro.isbn13,
        livro.normalizedTitle,
        livro.normalizedAuthor,
        coletarTexto(livro.tags),
        coletarTexto(livro.subcategorias)
      ]
        .filter(Boolean)
        .join(' ');
      const combinaBusca = !termo || normalizar(campoBusca).includes(termo);
      const combinaAutor = !autor || normalizar(coletarTexto(livro.autor)).includes(autor);
      const combinaEditora = !editora || normalizar(livro.editora).includes(editora);
      const combinaTag = !tag || normalizar(coletarTexto(livro.tags)).includes(tag);
      const formatosDisponiveis = livro.availableFormats?.length ? livro.availableFormats : [livro.formato];
      const combinaFormato = !formato || formatosDisponiveis.some((item) => normalizar(item) === formato);
      const combinaIdioma = !idioma || normalizar(livro.idioma) === idioma;
      const combinaAno = (!anoMin || Number(livro.ano) >= anoMin) && (!anoMax || Number(livro.ano) <= anoMax);
      const combinaAvaliacao = !avaliacaoMin || Number(livro.avaliacao || 0) >= avaliacaoMin;

      return combinaCategoria && combinaSubcategoria && combinaCaminho && combinaBusca && combinaAutor && combinaEditora && combinaTag && combinaFormato && combinaIdioma && combinaAno && combinaAvaliacao;
    });
  }, [livros, categoriaSelecionada, subcategoriaSelecionada, termoBusca, filtros, categoryPath, incluirSubpastas]);
}
