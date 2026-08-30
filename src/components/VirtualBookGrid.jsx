import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { WorkCard } from './content/WorkCard.tsx';

function columnsFor(width) {
  const maximum = width >= 1280 ? 6 : width >= 1024 ? 5 : width >= 640 ? 4 : 2;
  return Math.min(6, maximum);
}

export default function VirtualBookGrid({ livros, favoritoIds, onToggleFavorito, onOpen, onShowCategory }) {
  const rootRef = useRef(null);
  const [width, setWidth] = useState(() => window.innerWidth);
  const [scrollMargin, setScrollMargin] = useState(0);
  const columns = columnsFor(width);
  const rows = useMemo(() => Array.from({ length: Math.ceil(livros.length / columns) }, (_, row) => livros.slice(row * columns, row * columns + columns)), [columns, livros]);
  const gap = width >= 1280 ? 48 : 40;
  const cardWidth = Math.max(140, (Math.min(width, 1500) - (columns - 1) * 28) / columns);
  const estimate = cardWidth * 1.5 + 116 + gap;
  const virtualizer = useWindowVirtualizer({ count: rows.length, estimateSize: () => estimate, overscan: 2, scrollMargin });

  useLayoutEffect(() => {
    const update = () => {
      setWidth(rootRef.current?.clientWidth || window.innerWidth);
      setScrollMargin(rootRef.current?.offsetTop || 0);
    };
    update();
    const observer = new ResizeObserver(update);
    if (rootRef.current) observer.observe(rootRef.current);
    window.addEventListener('resize', update);
    return () => { observer.disconnect(); window.removeEventListener('resize', update); };
  }, []);

  useEffect(() => virtualizer.measure(), [columns, virtualizer]);

  return <div ref={rootRef} data-testid="virtual-catalog" style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
    {virtualizer.getVirtualItems().map((virtualRow) => <div
      key={virtualRow.key}
      ref={virtualizer.measureElement}
      data-index={virtualRow.index}
      className="book-grid grid gap-x-5 pb-10 xl:gap-x-7 xl:pb-12"
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, transform: `translateY(${virtualRow.start - scrollMargin}px)` }}
    >
      {rows[virtualRow.index].map((livro) => <WorkCard key={livro.id} work={livro} favorite={favoritoIds.has(livro.id)} onToggleFavorite={onToggleFavorito} onOpen={onOpen} />)}
    </div>)}
  </div>;
}
