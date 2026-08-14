import React from 'react';
import { ChevronRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
}

export function SectionHeader({ title, subtitle, onSeeAll }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div>
        <h2 className="text-lg font-bold text-[var(--color-txt)]">{title}</h2>
        {subtitle && (
          <p className="text-xs text-[var(--color-txt-muted)] mt-0.5">{subtitle}</p>
        )}
      </div>
      {onSeeAll && (
        <button
          onClick={onSeeAll}
          className="flex items-center gap-0.5 text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors font-medium"
        >
          See All
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}
