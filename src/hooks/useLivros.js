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

export function useLivros(filters = {}) {
  const queryClient = useQueryClient();
  const catalog = useQuery({
    queryKey: queryKeys.works.list(filters),
    queryFn: ({ signal }) => fetchJson('/works', { signal, params: { page: 1, pageSize: 100, sort: 'title', order: 'asc', ...filters } })
  });
  const livros = useMemo(() => (catalog.data?.items || catalog.data?.data || []).map((work) => ({
    ...work,
    nome: typeof (work.nome || work.canonical_title) === 'string' ? (work.nome || work.canonical_title) : 'Untitled work',
    autor: Array.isArray(work.autor || work.authors) ? (work.autor || work.authors) : [],
    formato: work.formato || work.format || '',
    workId: work.workId || work.id,
    categoria: work.categoria || work.category || '',
    availableFormats: work.availableFormats || []
  })), [catalog.data]);
  const categories = useMemo(() => {
    const counts = new Map();
    for (const work of livros) {
      for (const category of work.categoryPath || (work.category ? [work.category] : [])) {
        if (category) counts.set(category, (counts.get(category) || 0) + 1);
      }
    }
    return [...counts.entries()].map(([nome, total]) => ({ nome, total })).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [livros]);
  const tree = useMemo(() => {
    const root = [];
    for (const category of categories) {
      const existing = root.find((item) => item.name === category.nome);
      if (!existing) root.push({ name: category.nome, total: category.total, children: [] });
    }
    return root;
  }, [categories]);
  const recarregar = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.works.all });
  }, [queryClient]);
  const tentarNovamente = useCallback(async () => {
    await catalog.refetch();
  }, [catalog]);

  return {
    livros,
    categorias: categories,
    arvoreCategorias: tree,
    loading: catalog.isPending,
    refreshing: catalog.isFetching,
    error: catalog.error ? apiErrorMessage(catalog.error, 'Erro ao carregar a biblioteca') : '',
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
