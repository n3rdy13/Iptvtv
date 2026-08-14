import React from 'react';
import { Loader2, Inbox } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ message, fullScreen }: LoadingSpinnerProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 size={32} className="animate-spin text-[var(--color-primary)]" />
      {message && (
        <p className="text-sm text-[var(--color-txt-secondary)]">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)]">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-16">
      {content}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  subtitle?: string;
}

export function EmptyState({ title, subtitle }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Inbox size={48} className="text-[var(--color-txt-muted)]" />
      <h3 className="text-lg font-semibold text-[var(--color-txt)]">{title}</h3>
      {subtitle && (
        <p className="text-sm text-[var(--color-txt-secondary)] text-center max-w-xs">
          {subtitle}
        </p>
      )}
    </div>
  );
}
