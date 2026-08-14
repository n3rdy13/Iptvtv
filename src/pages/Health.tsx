import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Square,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Activity,
} from 'lucide-react';
import { useApp } from '../components/AppProvider';
import { HealthReport } from '../components/HealthReport';
import { runHealthChecks, summarizeHealthResults } from '../lib/health';
import { buildStreamUrl, getLiveStreams } from '../lib/xtream';
import type { HealthCheckResult, HealthCheckSummary, HealthStatus } from '../lib/types';

const statusIcons: Record<HealthStatus, React.ReactNode> = {
  alive: <CheckCircle size={16} className="text-[var(--color-success)]" />,
  dead: <XCircle size={16} className="text-[var(--color-error)]" />,
  expired: <AlertTriangle size={16} className="text-[var(--color-warning)]" />,
  unknown: <HelpCircle size={16} className="text-[var(--color-txt-muted)]" />,
};

const statusColors: Record<HealthStatus, string> = {
  alive: 'var(--color-success)',
  dead: 'var(--color-error)',
  expired: 'var(--color-warning)',
  unknown: 'var(--color-txt-muted)',
};

export default function Health() {
  const navigate = useNavigate();
  const { playlists, settings } = useApp();

  const [results, setResults] = useState<HealthCheckResult[]>([]);
  const [summary, setSummary] = useState<HealthCheckSummary | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [error, setError] = useState('');
  const abortRef = useRef(false);

  const activePlaylist = playlists.getActivePlaylist();

  const startCheck = useCallback(async () => {
    if (!activePlaylist) return;

    setRunning(true);
    setError('');
    setResults([]);
    setSummary(null);
    abortRef.current = false;

    try {
      let streams: { url: string; name: string; streamId: string }[] = [];

      if (activePlaylist.type === 'xtream') {
        const liveStreams = await getLiveStreams(activePlaylist);
        streams = liveStreams.map((s) => ({
          url: buildStreamUrl(activePlaylist, s.stream_id, 'live'),
          name: s.name,
          streamId: String(s.stream_id),
        }));
      }

      if (streams.length === 0) {
        setError('No streams found to check');
        setRunning(false);
        return;
      }

      setProgress({ completed: 0, total: streams.length });

      const checkResults = await runHealthChecks(
        streams,
        settings.settings.healthCheckConcurrency,
        settings.settings.healthCheckTimeoutMs,
        (completed, total, result) => {
          if (abortRef.current) return;
          setProgress({ completed, total });
          setResults((prev) => [...prev, result]);
        },
      );

      if (!abortRef.current) {
        setSummary(summarizeHealthResults(checkResults));
      }
    } catch (err) {
      // The raw message can contain text chosen by the remote provider.
      console.error('Health check failed:', err);
      if (!abortRef.current) {
        setError('The channel check could not be completed. Please try again later.');
      }
    } finally {
      setRunning(false);
    }
  }, [activePlaylist, settings.settings.healthCheckConcurrency, settings.settings.healthCheckTimeoutMs]);

  const stopCheck = () => {
    abortRef.current = true;
    setRunning(false);
    if (results.length > 0) {
      setSummary(summarizeHealthResults(results));
    }
  };

  const progressPercent = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-txt)]">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-[var(--color-bg-elevated)] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <Activity size={20} className="text-[var(--color-primary)]" />
          <h1 className="text-xl font-bold">Health Check</h1>
        </div>

        {!activePlaylist && (
          <p className="text-center text-[var(--color-txt-muted)] py-8">
            No active playlist. Add a playlist first.
          </p>
        )}

        {activePlaylist && (
          <>
            {/* Summary report */}
            {summary && (
              <div className="p-4 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border-light)]">
                <HealthReport summary={summary} lastChecked={summary.checkedAt} />
              </div>
            )}

            {/* Progress bar */}
            {running && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-[var(--color-txt-secondary)]">
                  <span className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Checking streams...
                  </span>
                  <span>
                    {progress.completed} / {progress.total}
                  </span>
                </div>
                <div className="w-full h-2 bg-[var(--color-bg-elevated)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-primary)] rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Start/Stop button */}
            <button
              onClick={running ? stopCheck : startCheck}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-colors ${
                running
                  ? 'bg-[var(--color-error)] text-white hover:bg-[var(--color-error)]/80'
                  : 'bg-[var(--color-primary)] text-[var(--color-txt-on-primary)] hover:bg-[var(--color-primary-dark)]'
              }`}
            >
              {running ? (
                <>
                  <Square size={18} />
                  Stop Check
                </>
              ) : (
                <>
                  <Play size={18} />
                  Start Health Check
                </>
              )}
            </button>

            {error && (
              <div className="p-3 rounded-xl bg-[var(--color-error)]/10 text-[var(--color-error)] text-sm">
                {error}
              </div>
            )}

            {/* Results list */}
            {results.length > 0 && (
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[var(--color-txt-secondary)] mb-2">
                  Results ({results.length})
                </h3>
                {results.map((r) => (
                  <div
                    key={r.streamId}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border-light)]"
                  >
                    {statusIcons[r.status]}
                    <span className="flex-1 min-w-0 text-sm truncate">{r.name}</span>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        color: statusColors[r.status],
                        backgroundColor: `color-mix(in srgb, ${statusColors[r.status]} 15%, transparent)`,
                      }}
                    >
                      {r.status}
                    </span>
                    <span className="text-xs text-[var(--color-txt-muted)]">
                      {r.responseTime}ms
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
