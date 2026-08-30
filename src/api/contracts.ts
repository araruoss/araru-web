export type WorkFormat = 'epub' | 'pdf' | 'mobi' | 'cbz' | 'cbr' | string;

export interface Work {
  id: string;
  title: string;
  authors?: string[];
  categories?: string[];
  formats?: WorkFormat[];
  favorite?: boolean;
  completed?: boolean;
  coverUrl?: string;
  [key: string]: unknown;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface WorksFilters {
  libraryId?: string;
  author?: string;
  category?: string;
  format?: WorkFormat;
  favorite?: boolean;
  completed?: boolean;
  sort?: 'title' | 'author' | 'createdAt' | 'updatedAt' | string;
  order?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  q?: string;
}

export interface Session {
  authenticated: boolean;
  user?: { id: string; email?: string; displayName?: string };
  profile?: { id: string; name: string };
  permissions?: string[];
}
