import React from 'react';

interface Category {
  id: string;
  name: string;
}

interface CategoryTabsProps {
  categories: Category[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryTabs({ categories, activeId, onSelect }: CategoryTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
      <button
        onClick={() => onSelect(null)}
        className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          activeId === null
            ? 'bg-[var(--color-primary)] text-[var(--color-txt-on-primary)]'
            : 'bg-[var(--color-bg-card)] text-[var(--color-txt-secondary)] hover:bg-[var(--color-bg-card-hover)]'
        }`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
            activeId === cat.id
              ? 'bg-[var(--color-primary)] text-[var(--color-txt-on-primary)]'
              : 'bg-[var(--color-bg-card)] text-[var(--color-txt-secondary)] hover:bg-[var(--color-bg-card-hover)]'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
