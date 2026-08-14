import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search...' }: SearchBarProps) {
  return (
    <div className="relative flex items-center">
      <Search
        size={18}
        className="absolute left-3 text-[var(--color-txt-muted)] pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-3 rounded-xl bg-[var(--color-bg-input)] text-[var(--color-txt)] placeholder-[var(--color-txt-muted)] border border-[var(--color-border)] focus:border-[var(--color-border-active)] focus:outline-none transition-colors text-sm"
      />
      {value.length > 0 && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 p-0.5 rounded-full text-[var(--color-txt-muted)] hover:text-[var(--color-txt)] hover:bg-[var(--color-bg-card)] transition-colors"
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
