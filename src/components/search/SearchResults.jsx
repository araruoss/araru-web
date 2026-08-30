import SearchResultItem from './SearchResultItem.jsx';

export default function SearchResults({ groups, activeIndex, onSelect, onHover, itemRefs, resultsLabel, busy }) {
  if (!groups.length) return null;
  let index = 0;
  return <div id="global-search-results" className="search-results" role="listbox" aria-label={resultsLabel} aria-busy={busy}>
    {groups.map((group) => <section key={group.id} className="search-group" aria-labelledby={`${group.id}-label`}>
      <h2 id={`${group.id}-label`} className="search-group__title">{group.label}</h2>
      <div>
        {group.items.map((item) => {
          const itemIndex = index;
          index += 1;
          return <SearchResultItem key={item.id} item={item} active={itemIndex === activeIndex} onSelect={onSelect} onHover={() => onHover(itemIndex)} itemRef={(node) => { if (node) itemRefs.current[itemIndex] = node; }} />;
        })}
      </div>
    </section>)}
  </div>;
}
