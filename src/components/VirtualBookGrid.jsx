import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import LivroCard from './LivroCard.jsx';

function columnsFor(width, mode) {
  if (mode === 'list') return 1;
  if (width >= 1280) return 5;
  if (width >= 1024) return 4;
  if (width >= 640) return 3;
  return 2;
}

export default function VirtualBookGrid({ livros, mode = 'grid', favoritoIds, onToggleFavorito, onOpen, onShowCategory }) {
  const rootRef = useRef(null);
  const [width, setWidth] = useState(() => window.innerWidth);
  const [scrollMargin, setScrollMargin] = useState(0);
  const columns = columnsFor(width, mode);
  const rows = useMemo(() => Array.from({ length: Math.ceil(livros.length / columns) }, (_, row) => livros.slice(row * columns, row * columns + columns)), [columns, livros]);
  const gap = mode === 'list' ? 12 : width >= 1280 ? 48 : 40;
  const cardWidth = Math.max(140, (Math.min(width, 1500) - (columns - 1) * 28) / columns);
  const estimate = mode === 'list' ? 150 : cardWidth * 1.5 + 116 + gap;
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

  useEffect(() => virtualizer.measure(), [columns, mode, virtualizer]);

  return <div ref={rootRef} data-testid="virtual-catalog" style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
    {virtualizer.getVirtualItems().map((virtualRow) => <div
      key={virtualRow.key}
      ref={virtualizer.measureElement}
      data-index={virtualRow.index}
      className={mode === 'list' ? 'grid grid-cols-1 gap-3 pb-3' : 'book-grid grid grid-cols-2 gap-x-5 pb-10 sm:grid-cols-3 lg:grid-cols-4 xl:gap-x-7 xl:pb-12 2xl:grid-cols-5'}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${virtualRow.start - scrollMargin}px)` }}
    >
      {rows[virtualRow.index].map((livro) => <LivroCard key={livro.id} livro={livro} compact={mode === 'list'} favorito={favoritoIds.has(livro.id)} onToggleFavorito={onToggleFavorito} onOpen={onOpen} onShowCategory={onShowCategory} />)}
    </div>)}
  </div>;
}
