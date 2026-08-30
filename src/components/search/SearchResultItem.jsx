import { BookOpen, FileText, Layers3, Tag, UserRound } from 'lucide-react';
import { useState } from 'react';
import { bookCoverUrl } from '../../lib/api.js';

const icons = { author: UserRound, series: Layers3, category: Tag };

export default function SearchResultItem({ item, active, onSelect, onHover, itemRef }) {
  const [coverFailed, setCoverFailed] = useState(false);
  const Icon = item.type === 'work' ? BookOpen : icons[item.type] || FileText;
  const cover = item.type === 'work' && !coverFailed ? bookCoverUrl(item.work) : '';
  return <button ref={itemRef} id={item.id} type="button" role="option" aria-selected={active} className={`search-result${active ? ' is-active' : ''}`} onClick={() => onSelect(item)} onMouseEnter={onHover}>
    <span className="search-result__icon" aria-hidden="true">
      {cover ? <img src={cover} alt="" loading="lazy" onError={() => setCoverFailed(true)} /> : <Icon className="h-4 w-4" />}
    </span>
    <span className="search-result__copy">
      <span className="search-result__title">{item.label}</span>
      {item.detail && <span className="search-result__detail">{item.detail}</span>}
    </span>
    {active && <span className="search-result__enter" aria-hidden="true">↵</span>}
  </button>;
}
