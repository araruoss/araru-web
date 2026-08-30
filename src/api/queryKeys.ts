import type { WorksFilters } from './contracts';

export const queryKeys = {
  session: ['session'] as const,
  home: ['home'] as const,
  works: {
    all: ['works'] as const,
    list: (filters: WorksFilters = {}) => ['works', 'list', filters] as const,
    detail: (id: string) => ['works', 'detail', id] as const,
  },
  series: ['series'] as const,
  authors: ['authors'] as const,
  libraries: ['libraries'] as const,
  search: (query: string) => ['search', query] as const,
  admin: {
    all: ['admin'] as const,
    jobs: ['admin', 'jobs'] as const,
    overview: ['admin', 'overview'] as const,
  },
} as const;
