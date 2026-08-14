import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Tv, Calendar } from 'lucide-react';
import { useApp } from '../components/AppProvider';
import { fetchEpg } from '../lib/epg';
import { getEpgUrl } from '../lib/xtream';
import type { EpgData, EpgChannel, EpgProgram } from '../lib/types';

const HOUR_WIDTH = 240; // pixels per hour
const CHANNEL_HEIGHT = 56;
const CHANNEL_LIST_WIDTH = 180;

function formatHour(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Epg() {
  const navigate = useNavigate();
  const { playlists } = useApp();

  const [epgData, setEpgData] = useState<EpgData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const timelineRef = useRef<HTMLDivElement>(null);

  const activePlaylist = playlists.getActivePlaylist();

  useEffect(() => {
    if (!activePlaylist) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        let epgUrl: string | null = null;
        if (activePlaylist.type === 'xtream') {
          epgUrl = await getEpgUrl(activePlaylist);
        } else if (activePlaylist.epgUrl) {
          epgUrl = activePlaylist.epgUrl;
        }

        if (!epgUrl) {
          if (!cancelled) setError('No EPG URL available for this playlist');
          return;
        }

        const data = await fetchEpg(epgUrl);
        if (!cancelled) setEpgData(data);
      } catch (err) {
        // The raw message can contain text chosen by the remote guide source.
        console.error('Failed to load EPG data:', err);
        if (!cancelled) setError('Could not load the TV guide. Please try again later.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activePlaylist?.id]);

  // Scroll to current time on load
  useEffect(() => {
    if (!epgData || !timelineRef.current) return;
    const now = Date.now();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const hoursFromStart = (now - startOfDay.getTime()) / 3600000;
    const scrollX = hoursFromStart * HOUR_WIDTH - HOUR_WIDTH;
    timelineRef.current.scrollLeft = Math.max(0, scrollX);
  }, [epgData]);

  const channels = epgData ? Array.from(epgData.channels.values()) : [];
  const now = Date.now();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const dayStartMs = startOfDay.getTime();
  const totalHours = 24;

  const getProgramStyle = (program: EpgProgram) => {
    const left = ((program.start - dayStartMs) / 3600000) * HOUR_WIDTH;
    const width = ((program.stop - program.start) / 3600000) * HOUR_WIDTH;
    return {
      left: `${Math.max(0, left)}px`,
      width: `${Math.max(40, width)}px`,
    };
  };

  const currentTimeOffset = ((now - dayStartMs) / 3600000) * HOUR_WIDTH;

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <Loader2 size={32} className="text-[var(--color-primary)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-txt)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[var(--color-border-light)]">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-[var(--color-bg-elevated)] transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <Calendar size={20} className="text-[var(--color-primary)]" />
        <h1 className="text-lg font-bold">Program Guide</h1>
      </div>

      {error && (
        <div className="p-3 m-4 rounded-xl bg-[var(--color-error)]/10 text-[var(--color-error)] text-sm">
          {error}
        </div>
      )}

      {!error && channels.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--color-txt-muted)]">
          <Tv size={48} className="mb-3 opacity-50" />
          <p>No EPG data available</p>
        </div>
      )}

      {channels.length > 0 && (
        <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 73px)' }}>
          {/* Channel list (fixed left column) */}
          <div
            className="flex-shrink-0 border-r border-[var(--color-border-light)] overflow-y-auto"
            style={{ width: CHANNEL_LIST_WIDTH }}
          >
            {/* Header spacer for time row */}
            <div
              className="flex items-center px-3 text-xs font-semibold text-[var(--color-txt-muted)] border-b border-[var(--color-border-light)] bg-[var(--color-bg-elevated)]"
              style={{ height: 32 }}
            >
              Channels
            </div>
            {channels.map((ch) => (
              <div
                key={ch.id}
                className="flex items-center px-3 border-b border-[var(--color-border-light)] truncate text-sm"
                style={{ height: CHANNEL_HEIGHT }}
              >
                {ch.displayName}
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div ref={timelineRef} className="flex-1 overflow-auto">
            {/* Time header */}
            <div
              className="relative border-b border-[var(--color-border-light)] bg-[var(--color-bg-elevated)]"
              style={{ width: totalHours * HOUR_WIDTH, height: 32 }}
            >
              {Array.from({ length: totalHours }, (_, i) => (
                <div
                  key={i}
                  className="absolute top-0 h-full flex items-center px-2 text-xs text-[var(--color-txt-muted)] border-l border-[var(--color-border-light)]"
                  style={{ left: i * HOUR_WIDTH }}
                >
                  {formatHour(dayStartMs + i * 3600000)}
                </div>
              ))}
            </div>

            {/* Programs grid */}
            <div className="relative" style={{ width: totalHours * HOUR_WIDTH }}>
              {/* Current time indicator */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-[var(--color-error)] z-10"
                style={{ left: currentTimeOffset }}
              />

              {channels.map((ch) => (
                <div
                  key={ch.id}
                  className="relative border-b border-[var(--color-border-light)]"
                  style={{ height: CHANNEL_HEIGHT }}
                >
                  {ch.programs
                    .filter((p) => {
                      const dayEnd = dayStartMs + 24 * 3600000;
                      return p.stop > dayStartMs && p.start < dayEnd;
                    })
                    .map((prog) => {
                      const style = getProgramStyle(prog);
                      const isCurrent = prog.start <= now && prog.stop > now;
                      return (
                        <div
                          key={prog.id}
                          className={`absolute top-1 bottom-1 rounded-lg px-2 py-1 overflow-hidden text-xs cursor-default border transition-colors ${
                            isCurrent
                              ? 'bg-[var(--color-primary)]/20 border-[var(--color-primary)]/40 text-[var(--color-txt)]'
                              : 'bg-[var(--color-bg-card)] border-[var(--color-border-light)] text-[var(--color-txt-secondary)] hover:bg-[var(--color-bg-card-hover)]'
                          }`}
                          style={style}
                          title={`${prog.title}\n${formatHour(prog.start)} - ${formatHour(prog.stop)}\n${prog.desc}`}
                        >
                          <p className="font-medium truncate">{prog.title}</p>
                          <p className="text-[10px] opacity-70 truncate">
                            {formatHour(prog.start)} - {formatHour(prog.stop)}
                          </p>
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
