import { BookOpen, Check, Headphones, Heart, ImageOff, MoreHorizontal } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookCoverUrl } from '../../lib/api.js';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { Skeleton } from '../ui/skeleton';

export type WorkCardData = {
  id: string;
  nome?: string;
  title?: string;
  autor?: string[] | string;
  author?: string;
  formato?: string;
  format?: string;
  mediaType?: string;
  availableFormats?: string[];
  progress?: number;
  readingProgress?: number;
  completed?: boolean;
  [key: string]: unknown;
};

function displayText(value: unknown, fallback: string) {
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string' || typeof item === 'number').join(', ') || fallback;
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (value && typeof value === 'object') {
    const candidate = value as { name?: unknown; title?: unknown };
    return displayText(candidate.name || candidate.title, fallback);
  }
  return fallback;
}

function detectFormat(work: WorkCardData): { label: string; isAudio: boolean } | null {
  const isAudio = work.mediaType === 'audiobook' || ['m4b', 'mp3', 'flac', 'ogg'].includes(String(work.formato || work.format || '').toLowerCase());
  const formatRaw = String(work.formato || work.format || work.availableFormats?.[0] || '').toLowerCase().trim();
  if (isAudio) return { label: 'ÁUDIO', isAudio: true };
  if (formatRaw && ['pdf', 'epub', 'mobi', 'cbz', 'cbr', 'fb2', 'azw', 'azw3'].includes(formatRaw)) {
    return { label: formatRaw.toUpperCase(), isAudio: false };
  }
  return null;
}

export function WorkCard({
  work,
  favorite = false,
  compact = false,
  onOpen,
  onToggleFavorite,
  onAction
}: {
  work: WorkCardData;
  favorite?: boolean;
  compact?: boolean;
  onOpen?: (work: WorkCardData) => void;
  onToggleFavorite?: (work: WorkCardData) => void;
  onAction?: (action: string, work: WorkCardData) => void;
}) {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const title = displayText(work.title || work.nome, 'Untitled work');
  const author = displayText(work.autor || work.author, 'Unknown author');
  const progress = Math.max(0, Math.min(1, Number(work.readingProgress ?? work.progress ?? 0)));
  const cover = bookCoverUrl(work);
  const formatInfo = detectFormat(work);

  const open = () => onOpen?.(work) || navigate(`/works/${encodeURIComponent(work.id)}`);
  const keyOpen = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      open();
    }
  };
  const stop = (event: { stopPropagation: () => void }) => event.stopPropagation();

  return (
    <article
      className={cn(
        'group min-w-0 cursor-pointer rounded-xl outline-none transition-all duration-200 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-focus-ring/70',
        compact && 'grid grid-cols-[76px_1fr] gap-3'
      )}
      role="button"
      tabIndex={0}
      aria-label={`Open details for ${title}`}
      onClick={open}
      onKeyDown={keyOpen}
    >
      <div className={cn('relative overflow-hidden rounded-xl bg-surface-raised shadow-subtle transition-shadow duration-200 group-hover:shadow-raised', compact ? 'aspect-[2/3]' : 'aspect-[2/3]')}>
        {!loaded && !failed && <Skeleton className="absolute inset-0 rounded-none" />}
        {failed || !cover ? (
          <div className="absolute inset-0 grid place-items-center p-3 text-muted bg-surface-raised">
            <div className="text-center">
              <ImageOff className="mx-auto h-6 w-6 opacity-60" aria-hidden="true" />
              <span className="mt-2 block line-clamp-2 px-1 text-[11px] font-medium text-secondary">{title}</span>
            </div>
          </div>
        ) : (
          <img
            src={cover}
            alt={`Cover of ${title}`}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={cn('h-full w-full object-cover transition-transform duration-300 group-hover:scale-105', loaded ? 'opacity-100' : 'opacity-0')}
          />
        )}

        {/* Format Badge */}
        {formatInfo && (
          <div className="absolute left-2 top-2 z-10 pointer-events-none">
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-950/75 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-white backdrop-blur-md shadow-sm">
              {formatInfo.isAudio && <Headphones className="h-2.5 w-2.5" />}
              {formatInfo.label}
            </span>
          </div>
        )}

        {/* Actions Overlay */}
        <div className="absolute inset-x-2 top-2 flex justify-end gap-1.5 z-10 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
          <Button
            type="button"
            variant={favorite ? 'primary' : 'secondary'}
            size="icon"
            aria-label={favorite ? 'Remove favorite' : 'Add favorite'}
            onClick={(event) => {
              stop(event);
              onToggleFavorite?.(work);
            }}
            className="h-8 w-8 rounded-lg bg-surface/90 backdrop-blur shadow-sm hover:scale-105 transition-transform"
          >
            <Heart className={`h-3.5 w-3.5 ${favorite ? 'fill-current text-danger' : 'text-secondary'}`} />
          </Button>
          <DropdownMenu>
            <DropdownMenu.Trigger
              render={
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  aria-label={`Open actions for ${title}`}
                  className="h-8 w-8 rounded-lg bg-surface/90 backdrop-blur shadow-sm hover:scale-105 transition-transform"
                >
                  <MoreHorizontal className="h-3.5 w-3.5 text-secondary" />
                </Button>
              }
              onClick={stop}
            />
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onAction?.('offline', work)}>Make available offline</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction?.('details', work)}>Open details</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction?.('metadata', work)}>Metadata</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Progress Bar */}
        {progress > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/40 backdrop-blur-sm" aria-label={`${Math.round(progress * 100)}% read`}>
            <span className="block h-full bg-accent transition-all duration-300" style={{ width: `${progress * 100}%` }} />
          </div>
        )}

        {/* Completed Badge */}
        {work.completed && (
          <span className="absolute bottom-2 right-2 grid h-6 w-6 place-items-center rounded-full bg-success text-inverse shadow-sm" title="Completed">
            <Check className="h-3.5 w-3.5 stroke-[3]" />
          </span>
        )}
      </div>

      <div className={cn('min-w-0 pt-2.5', compact && 'pt-0.5')}>
        <h2 className="line-clamp-2 text-body-sm font-semibold text-primary group-hover:text-link transition-colors leading-snug">{title}</h2>
        <p className="mt-0.5 line-clamp-1 text-label text-secondary">{author}</p>
        {progress > 0 && (
          <p className="mt-1.5 flex items-center gap-1.5 text-caption font-medium text-muted">
            <BookOpen className="h-3 w-3 text-accent" />
            <span>{Math.round(progress * 100)}% lido</span>
          </p>
        )}
      </div>
    </article>
  );
}
