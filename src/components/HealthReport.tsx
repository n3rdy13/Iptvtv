import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import type { HealthCheckSummary } from '../lib/types';

interface HealthReportProps {
  summary: HealthCheckSummary;
  lastChecked?: number;
}

const statusConfig = [
  { key: 'alive' as const, label: 'Alive', color: 'var(--color-success)', icon: CheckCircle },
  { key: 'dead' as const, label: 'Dead', color: 'var(--color-error)', icon: XCircle },
  { key: 'expired' as const, label: 'Expired', color: 'var(--color-warning)', icon: AlertTriangle },
  { key: 'unknown' as const, label: 'Unknown', color: 'var(--color-txt-muted)', icon: HelpCircle },
];

export function HealthReport({ summary, lastChecked }: HealthReportProps) {
  const { total, alive, dead, expired, unknown } = summary;
  const alivePercent = total > 0 ? Math.round((alive / total) * 100) : 0;

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-4">
      {/* Percentage headline */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-2xl font-bold text-[var(--color-txt)]">{alivePercent}%</span>
          <span className="text-sm text-[var(--color-txt-secondary)] ml-2">streams alive</span>
        </div>
        <span className="text-xs text-[var(--color-txt-muted)]">
          {total} total
        </span>
      </div>

      {/* Color bar */}
      {total > 0 && (
        <div className="flex h-3 rounded-full overflow-hidden bg-[var(--color-bg-elevated)]">
          {alive > 0 && (
            <div
              className="h-full transition-all"
              style={{ width: `${(alive / total) * 100}%`, backgroundColor: 'var(--color-success)' }}
            />
          )}
          {dead > 0 && (
            <div
              className="h-full transition-all"
              style={{ width: `${(dead / total) * 100}%`, backgroundColor: 'var(--color-error)' }}
            />
          )}
          {expired > 0 && (
            <div
              className="h-full transition-all"
              style={{ width: `${(expired / total) * 100}%`, backgroundColor: 'var(--color-warning)' }}
            />
          )}
          {unknown > 0 && (
            <div
              className="h-full transition-all"
              style={{ width: `${(unknown / total) * 100}%`, backgroundColor: 'var(--color-txt-muted)' }}
            />
          )}
        </div>
      )}

      {/* Stat items */}
      <div className="grid grid-cols-2 gap-3">
        {statusConfig.map(({ key, label, color, icon: Icon }) => (
          <div
            key={key}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[var(--color-bg-elevated)]"
          >
            <Icon size={18} style={{ color }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--color-txt-muted)]">{label}</p>
              <p className="text-sm font-semibold text-[var(--color-txt)]">{summary[key]}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Last checked */}
      {lastChecked && (
        <p className="text-xs text-[var(--color-txt-muted)] text-center">
          Last checked: {formatTime(lastChecked)}
        </p>
      )}
    </div>
  );
}
