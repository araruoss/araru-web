import { BookOpen, Check, Heart, ImageOff, MoreHorizontal } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookCoverUrl } from '../../lib/api.js';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { Skeleton } from '../ui/skeleton';

export type WorkCardData = { id: string; nome?: string; title?: string; autor?: string[] | string; author?: string; progress?: number; readingProgress?: number; completed?: boolean; [key: string]: unknown };

function displayText(value: unknown, fallback: string) {
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string' || typeof item === 'number').join(', ') || fallback;
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (value && typeof value === 'object') {
    const candidate = value as { name?: unknown; title?: unknown };
    return displayText(candidate.name || candidate.title, fallback);
  }
  return fallback;
}

export function WorkCard({ work, favorite = false, compact = false, onOpen, onToggleFavorite, onAction }: { work: WorkCardData; favorite?: boolean; compact?: boolean; onOpen?: (work: WorkCardData) => void; onToggleFavorite?: (work: WorkCardData) => void; onAction?: (action: string, work: WorkCardData) => void }) {
  const navigate = useNavigate(); const [loaded, setLoaded] = useState(false); const [failed, setFailed] = useState(false);
  const title = displayText(work.title || work.nome, 'Untitled work');
  const author = displayText(work.autor || work.author, 'Unknown author');
  const progress = Math.max(0, Math.min(1, Number(work.readingProgress ?? work.progress ?? 0)));
  const cover = bookCoverUrl(work);
  const open = () => onOpen?.(work) || navigate(`/works/${encodeURIComponent(work.id)}`);
  const keyOpen = (event: KeyboardEvent) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } };
  const stop = (event: { stopPropagation: () => void }) => event.stopPropagation();
  return <article className={cn('group min-w-0 cursor-pointer rounded-md outline-none transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-info/70', compact && 'grid grid-cols-[72px_1fr] gap-3')} role="button" tabIndex={0} aria-label={`Open details for ${title}`} onClick={open} onKeyDown={keyOpen}>
    <div className={cn('relative overflow-hidden rounded-md bg-surface-raised', compact ? 'aspect-[2/3]' : 'aspect-[2/3]')}>
      {!loaded && !failed && <Skeleton className="absolute inset-0 rounded-none" />}
      {failed || !cover ? <div className="absolute inset-0 grid place-items-center p-3 text-muted"><ImageOff className="h-5 w-5" aria-hidden="true" /><span className="sr-only">Cover unavailable</span></div> : <img src={cover} alt={`Cover of ${title}`} loading="lazy" decoding="async" onLoad={() => setLoaded(true)} onError={() => setFailed(true)} className={cn('h-full w-full object-cover transition duration-[var(--motion-normal)] group-hover:scale-[1.02]', loaded ? 'opacity-100' : 'opacity-0')} />}
      <div className="absolute inset-x-2 top-2 flex justify-end gap-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
        <Button type="button" variant={favorite ? 'primary' : 'secondary'} size="icon" aria-label={favorite ? 'Remove favorite' : 'Add favorite'} onClick={(event) => { stop(event); onToggleFavorite?.(work); }} className="h-9 w-9 bg-surface/95"><Heart className="h-4 w-4" fill={favorite ? 'currentColor' : 'none'} /></Button>
        <DropdownMenu><DropdownMenu.Trigger render={<Button type="button" variant="secondary" size="icon" aria-label={`Open actions for ${title}`} className="h-9 w-9 bg-surface/95"><MoreHorizontal className="h-4 w-4" /></Button>} onClick={stop} /><DropdownMenuContent><DropdownMenuItem onClick={() => onAction?.('offline', work)}>Make available offline</DropdownMenuItem><DropdownMenuItem onClick={() => onAction?.('details', work)}>Open details</DropdownMenuItem><DropdownMenuItem onClick={() => onAction?.('metadata', work)}>Metadata</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
      </div>
      {progress > 0 && <div className="absolute inset-x-0 bottom-0 h-1 bg-black/20" aria-label={`${Math.round(progress * 100)}% read`}><span className="block h-full bg-accent" style={{ width: `${progress * 100}%` }} /></div>}
      {work.completed && <span className="absolute bottom-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-success text-inverse" title="Completed"><Check className="h-4 w-4" /></span>}
    </div>
    <div className={cn('min-w-0 pt-3', compact && 'pt-1')}><h2 className="line-clamp-2 text-body-sm font-semibold text-primary">{title}</h2><p className="mt-1 line-clamp-1 text-label text-secondary">{author}</p>{progress > 0 && <p className="mt-2 flex items-center gap-1 text-caption text-muted"><BookOpen className="h-3 w-3" />{Math.round(progress * 100)}% read</p>}</div>
  </article>;
}
