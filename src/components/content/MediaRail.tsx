import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { WorkCard, type WorkCardData } from './WorkCard';

export function MediaRail({
  title,
  works,
  favoriteIds,
  onOpen,
  onToggleFavorite,
  actionLabel,
  actionTo,
  className = ''
}: {
  title: string;
  works: WorkCardData[];
  favoriteIds?: Set<string>;
  onOpen?: (work: WorkCardData) => void;
  onToggleFavorite?: (work: WorkCardData) => void;
  actionLabel?: string;
  actionTo?: string;
  className?: string;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const scroll = (amount: number) => railRef.current?.scrollBy({ left: amount, behavior: 'smooth' });

  if (!works.length) return null;
  const headingId = `rail-${title.replace(/\W+/g, '-')}`;

  return (
    <section className={cn('space-y-3.5', className)} aria-labelledby={headingId}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 id={headingId} className="text-lg font-semibold tracking-tight text-primary sm:text-xl">
            {title}
          </h2>
          <span className="rounded-full bg-surface-raised px-2 py-0.5 text-caption font-medium text-muted">
            {works.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {actionLabel && actionTo && (
            <Link
              to={actionTo}
              className="hidden rounded-lg px-2.5 py-1 text-caption font-medium text-link transition hover:bg-surface-raised hover:text-link-hover sm:inline-flex"
            >
              {actionLabel}
            </Link>
          )}
          <div className="hidden gap-1 sm:flex">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={() => scroll(-360)}
              aria-label={`Previous ${title}`}
              className="h-8 w-8 rounded-lg shadow-subtle hover:scale-105 transition-transform"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={() => scroll(360)}
              aria-label={`Next ${title}`}
              className="h-8 w-8 rounded-lg shadow-subtle hover:scale-105 transition-transform"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div
        ref={railRef}
        className="media-rail grid auto-cols-[148px] xs:auto-cols-[164px] sm:auto-cols-[176px] md:auto-cols-[192px] grid-flow-col gap-4 overflow-x-auto overscroll-x-contain pb-2 pt-1 scroll-smooth snap-x snap-mandatory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info"
        tabIndex={0}
      >
        {works.slice(0, 16).map((work) => (
          <div key={work.id} className="snap-start">
            <WorkCard
              work={work}
              favorite={favoriteIds?.has(work.id)}
              onOpen={onOpen}
              onToggleFavorite={onToggleFavorite}
            />
          </div>
        ))}
      </div>

      {actionLabel && actionTo && (
        <div className="pt-0.5 sm:hidden">
          <Link
            to={actionTo}
            className="inline-flex text-caption font-medium text-link hover:text-link-hover"
          >
            {actionLabel} →
          </Link>
        </div>
      )}
    </section>
  );
}

