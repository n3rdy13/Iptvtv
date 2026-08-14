import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Trash2, Play, Film, Tv, Radio } from 'lucide-react';
import { useApp } from '../components/AppProvider';

const typeIcons = {
  live: <Radio size={16} className="text-[var(--color-error)]" />,
  vod: <Film size={16} className="text-[var(--color-primary)]" />,
  series: <Tv size={16} className="text-[var(--color-info)]" />,
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - ts;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (d.toDateString() === new Date(now.getTime() - 86400000).toDateString()) return 'Yesterday';
  return d.toLocaleDateString();
}

function formatDuration(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function History() {
  const navigate = useNavigate();
  const { playlists, history } = useApp();

  const activePlaylist = playlists.getActivePlaylist();
  const items = activePlaylist
    ? history.getHistoryByPlaylist(activePlaylist.id)
    : [];

  const handleResume = (item: typeof items[0]) => {
    const params = new URLSearchParams({
      streamId: item.streamId,
      type: item.type,
      name: item.name,
      playlistId: item.playlistId,
    });
    if (item.logo) params.set('logo', item.logo);
    navigate(`/player?${params.toString()}`);
  };

  const handleClearAll = () => {
    if (!window.confirm('Clear all watch history? This cannot be undone.')) return;
    history.clearHistory();
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-txt)]">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-[var(--color-bg-elevated)] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <Clock size={20} className="text-[var(--color-info)]" />
          <h1 className="text-xl font-bold">Watch History</h1>
          {items.length > 0 && (
            <button
              onClick={handleClearAll}
              className="ml-auto flex items-center gap-1 text-sm text-[var(--color-error)] hover:text-[var(--color-error)]/80 transition-colors"
            >
              <Trash2 size={14} />
              Clear All
            </button>
          )}
        </div>

        {!activePlaylist && (
          <p className="text-center text-[var(--color-txt-muted)] py-12">
            No active playlist selected.
          </p>
        )}

        {activePlaylist && items.length === 0 && (
          <div className="text-center py-12 text-[var(--color-txt-muted)]">
            <Clock size={48} className="mx-auto mb-3 opacity-30" />
            <p>No watch history yet</p>
            <p className="text-sm mt-1">Start watching to see your history here</p>
          </div>
        )}

        {items.length > 0 && (
          <div className="space-y-2">
            {items.map((item) => {
              const progressPercent =
                item.duration > 0
                  ? Math.min(100, (item.position / item.duration) * 100)
                  : 0;

              return (
                <button
                  key={item.id}
                  onClick={() => handleResume(item)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border-light)] hover:bg-[var(--color-bg-card-hover)] transition-colors text-left"
                >
                  {/* Logo / icon */}
                  {item.logo ? (
                    <img
                      src={item.logo}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-[var(--color-bg-elevated)]"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-[var(--color-bg-elevated)] flex items-center justify-center flex-shrink-0">
                      {typeIcons[item.type]}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <div className="flex items-center gap-2 text-xs text-[var(--color-txt-muted)]">
                      <span>{formatDate(item.watchedAt)}</span>
                      {item.duration > 0 && (
                        <span>
                          {formatDuration(item.position)} / {formatDuration(item.duration)}
                        </span>
                      )}
                    </div>
                    {/* Progress bar */}
                    {item.duration > 0 && (
                      <div className="w-full h-1 bg-[var(--color-bg-elevated)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--color-primary)] rounded-full"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Play icon */}
                  <div className="p-2 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex-shrink-0">
                    <Play size={16} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
