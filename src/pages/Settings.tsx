import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  List,
  Plus,
  Trash2,
  CheckCircle,
  Radio,
  ChevronDown,
  ChevronUp,
  Heart,
  Clock,
  Activity,
  RefreshCw,
  Eye,
  EyeOff,
  Sliders,
  Database,
} from 'lucide-react';
import { useApp } from '../components/AppProvider';
import { BufferControlPanel } from '../components/BufferControlPanel';
import { clearPlaylistData } from '../lib/storage';

export default function Settings() {
  const { playlists, favorites, history, settings } = useApp();
  const [showBufferPanel, setShowBufferPanel] = useState(false);

  const activePlaylist = playlists.getActivePlaylist();
  const favCount = activePlaylist
    ? favorites.getFavoritesByPlaylist(activePlaylist.id).length
    : 0;
  const histCount = activePlaylist
    ? history.getHistoryByPlaylist(activePlaylist.id).length
    : 0;

  const handleDeletePlaylist = async (id: string, name: string) => {
    if (!window.confirm(`Delete playlist "${name}"? This will remove all cached data for this playlist.`)) return;
    await playlists.deletePlaylist(id);
  };

  const handleClearHistory = () => {
    if (!window.confirm('Clear all watch history? This cannot be undone.')) return;
    history.clearHistory();
  };

  const handleClearCache = async () => {
    if (!activePlaylist) return;
    if (!window.confirm('Clear cached data for the active playlist?')) return;
    await clearPlaylistData(activePlaylist.id);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-txt)] pb-8">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>

        {/* Playlists Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <List size={20} />
              Playlists
            </h2>
            <Link
              to="/add-playlist"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-[var(--color-txt-on-primary)] text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors"
            >
              <Plus size={16} />
              Add
            </Link>
          </div>

          {playlists.playlists.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-txt-muted)]">
              <Radio size={32} className="mx-auto mb-2 opacity-50" />
              <p>No playlists added yet</p>
              <Link
                to="/add-playlist"
                className="text-[var(--color-primary)] text-sm mt-1 inline-block"
              >
                Add your first playlist
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {playlists.playlists.map((pl) => (
                <div
                  key={pl.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border-light)]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{pl.name}</p>
                    <p className="text-xs text-[var(--color-txt-muted)] capitalize">
                      {pl.type} {pl.active && '• Active'}
                    </p>
                  </div>
                  {!pl.active && (
                    <button
                      onClick={() => playlists.setActivePlaylist(pl.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-bg-elevated)] text-[var(--color-txt-secondary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-txt-on-primary)] transition-colors"
                    >
                      <CheckCircle size={14} />
                      Activate
                    </button>
                  )}
                  {pl.active && (
                    <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-primary)] text-[var(--color-txt-on-primary)]">
                      <CheckCircle size={14} />
                      Active
                    </span>
                  )}
                  <button
                    onClick={() => handleDeletePlaylist(pl.id, pl.name)}
                    className="p-1.5 rounded-lg text-[var(--color-error)] hover:bg-[var(--color-bg-elevated)] transition-colors"
                    aria-label={`Delete ${pl.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Buffer Control Section */}
        <section className="space-y-3">
          <button
            onClick={() => setShowBufferPanel(!showBufferPanel)}
            className="flex items-center justify-between w-full text-lg font-semibold"
          >
            <span className="flex items-center gap-2">
              <Sliders size={20} />
              Buffer Control
            </span>
            {showBufferPanel ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          {showBufferPanel && (
            <div className="p-4 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border-light)]">
              <BufferControlPanel
                settings={settings.settings.bufferSettings}
                onChange={(bufferSettings) =>
                  settings.updateSettings({ bufferSettings })
                }
              />
            </div>
          )}
        </section>

        {/* Health Check Settings */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Activity size={20} />
            Health Check
          </h2>
          <div className="space-y-4 p-4 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border-light)]">
            {/* Hide dead channels toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {settings.settings.hideDeadChannels ? (
                  <EyeOff size={16} className="text-[var(--color-txt-secondary)]" />
                ) : (
                  <Eye size={16} className="text-[var(--color-txt-secondary)]" />
                )}
                <span className="text-sm">Hide dead channels</span>
              </div>
              <button
                onClick={() =>
                  settings.updateSettings({
                    hideDeadChannels: !settings.settings.hideDeadChannels,
                  })
                }
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  settings.settings.hideDeadChannels
                    ? 'bg-[var(--color-primary)]'
                    : 'bg-[var(--color-bg-elevated)]'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.settings.hideDeadChannels ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>

            {/* Concurrency slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-txt-secondary)]">Concurrency</span>
                <span className="text-sm font-medium">{settings.settings.healthCheckConcurrency}</span>
              </div>
              <input
                type="range"
                min={1}
                max={50}
                value={settings.settings.healthCheckConcurrency}
                onChange={(e) =>
                  settings.updateSettings({
                    healthCheckConcurrency: Number(e.target.value),
                  })
                }
                className="w-full accent-[var(--color-primary)]"
              />
            </div>

            {/* Timeout slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-txt-secondary)]">Timeout</span>
                <span className="text-sm font-medium">{settings.settings.healthCheckTimeoutMs / 1000}s</span>
              </div>
              <input
                type="range"
                min={2000}
                max={30000}
                step={1000}
                value={settings.settings.healthCheckTimeoutMs}
                onChange={(e) =>
                  settings.updateSettings({
                    healthCheckTimeoutMs: Number(e.target.value),
                  })
                }
                className="w-full accent-[var(--color-primary)]"
              />
            </div>
          </div>
        </section>

        {/* EPG Section */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <RefreshCw size={20} />
            EPG Settings
          </h2>
          <div className="p-4 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border-light)]">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-txt-secondary)]">Refresh interval</span>
                <span className="text-sm font-medium">{settings.settings.epgRefreshIntervalMin} min</span>
              </div>
              <input
                type="range"
                min={15}
                max={360}
                step={15}
                value={settings.settings.epgRefreshIntervalMin}
                onChange={(e) =>
                  settings.updateSettings({
                    epgRefreshIntervalMin: Number(e.target.value),
                  })
                }
                className="w-full accent-[var(--color-primary)]"
              />
            </div>
          </div>
        </section>

        {/* Data Section */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Database size={20} />
            Data
          </h2>
          <div className="space-y-2 p-4 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border-light)]">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Heart size={16} className="text-[var(--color-error)]" />
                <span className="text-sm">Favorites</span>
              </div>
              <span className="text-sm font-medium text-[var(--color-txt-secondary)]">{favCount}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-[var(--color-border-light)]">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[var(--color-info)]" />
                <span className="text-sm">Watch History</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--color-txt-secondary)]">{histCount}</span>
                {histCount > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="text-xs px-2 py-1 rounded-lg bg-[var(--color-bg-elevated)] text-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            {activePlaylist && (
              <div className="pt-2 border-t border-[var(--color-border-light)]">
                <button
                  onClick={handleClearCache}
                  className="w-full text-center text-sm py-2 rounded-lg bg-[var(--color-bg-elevated)] text-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-white transition-colors"
                >
                  Clear Cached Data
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
