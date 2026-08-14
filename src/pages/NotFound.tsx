import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <AlertCircle size={56} className="mx-auto text-[var(--color-txt-muted)] opacity-50" />
        <h1 className="text-4xl font-bold text-[var(--color-txt)]">404</h1>
        <p className="text-lg text-[var(--color-txt-secondary)]">Page Not Found</p>
        <p className="text-sm text-[var(--color-txt-muted)]">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-[var(--color-txt-on-primary)] font-semibold hover:bg-[var(--color-primary-dark)] transition-colors"
        >
          <Home size={18} />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
