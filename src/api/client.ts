/// <reference types="vite/client" />

import type { Paginated, Work, WorksFilters } from './contracts';

const configuredBase = String(import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '');
export const API_BASE_URL = configuredBase === '/api' ? '/api/v1' : configuredBase;

export function apiUrl(path = ''): string {
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const normalized = path.startsWith('/api/v1') ? path.slice('/api/v1'.length) : path;
  return `${API_BASE_URL}${normalized.startsWith('/') ? normalized : `/${normalized}`}`;
}

export async function getWorks(filters: WorksFilters = {}, signal?: AbortSignal): Promise<Paginated<Work>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  const response = await fetch(apiUrl(`/works?${params}`), { credentials: 'include', signal });
  if (!response.ok) throw new Error(`works_${response.status}`);
  return response.json() as Promise<Paginated<Work>>;
}
