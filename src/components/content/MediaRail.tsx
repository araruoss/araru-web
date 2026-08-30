import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { WorkCard, type WorkCardData } from './WorkCard';

export function MediaRail({ title, works, favoriteIds, onOpen, onToggleFavorite, actionLabel, actionTo, className = '' }: { title: string; works: WorkCardData[]; favoriteIds?: Set<string>; onOpen?: (work: WorkCardData) => void; onToggleFavorite?: (work: WorkCardData) => void; actionLabel?: string; actionTo?: string; className?: string }) {
  const railRef = useRef<HTMLDivElement>(null);
  const scroll = (amount: number) => railRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
  if (!works.length) return null;
  const headingId = `rail-${title.replace(/\W+/g, '-')}`;
  return <section className={cn('space-y-3', className)} aria-labelledby={headingId}><div className="flex items-center justify-between gap-3"><h2 id={headingId} className="text-heading-sm font-semibold text-primary">{title}</h2><div className="flex items-center gap-2">{actionLabel && actionTo && <Link to={actionTo} className="hidden rounded-sm px-2 py-1 text-caption font-medium text-link transition hover:bg-surface-raised hover:text-link-hover sm:inline-flex">{actionLabel}</Link>}<div className="hidden gap-1 sm:flex"><Button type="button" variant="ghost" size="icon" onClick={() => scroll(-360)} aria-label={`Previous ${title}`}><ChevronLeft className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" onClick={() => scroll(360)} aria-label={`Next ${title}`}><ChevronRight className="h-4 w-4" /></Button></div></div></div><div ref={railRef} className="media-rail grid auto-cols-[148px] grid-flow-col gap-4 overflow-x-auto overscroll-x-contain pb-1 sm:auto-cols-[160px]" tabIndex={0}>{works.slice(0, 12).map((work) => <WorkCard key={work.id} work={work} favorite={favoriteIds?.has(work.id)} onOpen={onOpen} onToggleFavorite={onToggleFavorite} />)}</div>{actionLabel && actionTo && <Link to={actionTo} className="inline-flex text-caption font-medium text-link hover:text-link-hover sm:hidden">{actionLabel}</Link>}</section>;
}
