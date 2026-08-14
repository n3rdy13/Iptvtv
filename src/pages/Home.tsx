import { useNavigate } from 'react-router-dom';
import { useApp } from '../components/AppProvider';
import {
  Tv,
  Film,
  MonitorPlay,
  Heart,
  Activity,
  BookOpen,
  Plus,
  RefreshCw,
  ChevronRight,
  Clock,
  ListVideo,
  Trash2,
} from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { EmptyState } from '../components/LoadingSpinner';

export default function Home() {
  const navigate = useNavigate();
  const { playlists, content, favorites, history } = useApp();

  const activePlaylist = playlists.getActivePlaylist();
  const playlistFavorites = activePlaylist
    ? favorites.getFavoritesByPlaylist(activePlaylist.id)
    : [];
  const playlistHistory = activePlaylist
    ? history.getHistoryByPlaylist(activePlaylist.id)
    : [];
  const recentHistory = playlistHistory.slice(0, 20);

  const liveCount =
    activePlaylist?.type === 'xtream'
      ? content.content.liveStreams.length
      : content.content.m3uGroups
        ? Array.from(content.content.m3uGroups.live.values()).reduce((sum, arr) => sum + arr.length, 0)
        : 0;
  const movieCount =
    activePlaylist?.type === 'xtream'
      ? content.content.vodStreams.length
      : content.content.m3uGroups
        ? Array.from(content.content.m3uGroups.vod.values()).reduce((sum, arr) => sum + arr.length, 0)
        : 0;
  const seriesCount =
    activePlaylist?.type === 'xtream'
      ? content.content.seriesList.length
      : content.content.m3uGroups
        ? Array.from(content.content.m3uGroups.series.values()).reduce((sum, arr) => sum + arr.length, 0)
        : 0;

  const handleRefresh = async () => {
    if (activePlaylist) {
      try {
        await content.loadContent(activePlaylist, false);
      } catch (err) {
        console.error('Failed to refresh content:', err);
      }
    }
  };

  if (playlists.playlists.length === 0 && !playlists.loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
        <div className="w-20 h-20 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center mb-6">
          <ListVideo size={40} className="text-[var(--color-primary)]" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-txt)] mb-2">Welcome to IPTV Player</h1>
        <p className="text-[var(--color-txt-secondary)] text-center mb-8 max-w-sm">
          Add your first playlist to start watching live TV, movies, and series.
        </p>
        <button
          onClick={() => navigate('/add-playlist')}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-txt-on-primary)] font-semibold hover:bg-[var(--color-primary-dark)] transition-colors"
        >
          <Plus size={20} />
          Add Playlist
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-txt)]">Home</h1>
          {activePlaylist && (
            <p className="text-sm text-[var(--color-txt-secondary)] mt-0.5">
              {activePlaylist.name}
              {activePlaylist.type === 'xtream' && activePlaylist.userInfo?.status === 'Active' && (
                <span className="ml-2 text-[var(--color-success)]">● Active</span>
              )}
            </p>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={content.loading}
          className="p-2.5 rounded-xl bg-[var(--color-bg-elevated)] text-[var(--color-txt-secondary)] hover:text-[var(--color-txt)] hover:bg-[var(--color-bg-card-hover)] transition-colors disabled:opacity-50"
        >
          <RefreshCw size={20} className={content.loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Loading progress */}
      {content.loading && content.loadingProgress && (
        <div className="px-4 py-3 rounded-xl bg-[var(--color-info)]/10 border border-[var(--color-info)]/20">
          <p className="text-sm text-[var(--color-info)] font-medium">{content.loadingProgress}</p>
        </div>
      )}

      {/* Quick access tiles */}
      <div className="grid grid-cols-2 gap-3">
        <QuickTile
          icon={<Tv size={24} />}
          label="Live TV"
          count={liveCount}
          color="var(--color-primary)"
          onClick={() => navigate('/live')}
        />
        <QuickTile
          icon={<Film size={24} />}
          label="Movies"
          count={movieCount}
          color="var(--color-success)"
          onClick={() => navigate('/movies')}
        />
        <QuickTile
          icon={<MonitorPlay size={24} />}
          label="Series"
          count={seriesCount}
          color="var(--color-warning)"
          onClick={() => navigate('/series')}
        />
        <QuickTile
          icon={<Heart size={24} />}
          label="Favorites"
          count={playlistFavorites.length}
          color="var(--color-error)"
          onClick={() => navigate('/favorites')}
        />
      </div>

      {/* Tool tiles */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/health')}
          className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-card-hover)] transition-colors text-left"
        >
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--color-info) 15%, transparent)' }}>
            <Activity size={20} className="text-[var(--color-info)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-txt)]">Health Check</p>
            <p className="text-xs text-[var(--color-txt-muted)]">Stream status</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/epg')}
          className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-card-hover)] transition-colors text-left"
        >
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--color-warning) 15%, transparent)' }}>
            <BookOpen size={20} className="text-[var(--color-warning)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-txt)]">EPG Guide</p>
            <p className="text-xs text-[var(--color-txt-muted)]">Program guide</p>
          </div>
        </button>
      </div>

      {/* Recently watched */}
      {recentHistory.length > 0 && (
        <div>
          <SectionHeader
            title="Recently Watched"
            onSeeAll={() => navigate('/history')}
          />
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {recentHistory.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.type === 'live') {
                    navigate(`/player?streamId=${item.streamId}&name=${encodeURIComponent(item.name)}&type=live&playlistId=${item.playlistId}`);
                  } else if (item.type === 'vod') {
                    navigate(`/vod-detail?streamId=${item.streamId}&name=${encodeURIComponent(item.name)}&playlistId=${item.playlistId}`);
                  } else {
                    navigate(`/series-detail?seriesId=${item.streamId}&name=${encodeURIComponent(item.name)}&playlistId=${item.playlistId}`);
                  }
                }}
                className="flex-shrink-0 w-32 group"
              >
                <div className="w-32 h-20 rounded-lg bg-[var(--color-bg-elevated)] overflow-hidden mb-2 flex items-center justify-center">
                  {item.logo ? (
                    <img src={item.logo} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <Clock size={24} className="text-[var(--color-txt-muted)]" />
                  )}
                </div>
                <p className="text-xs text-[var(--color-txt)] font-medium truncate group-hover:text-[var(--color-primary)] transition-colors">
                  {item.name}
                </p>
                <p className="text-[10px] text-[var(--color-txt-muted)] capitalize">{item.type}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Playlists */}
      <div>
        <SectionHeader title="Playlists" subtitle={`${playlists.playlists.length} playlist${playlists.playlists.length !== 1 ? 's' : ''}`} />
        <div className="space-y-2">
          {playlists.playlists.map((pl) => (
            <div
              key={pl.id}
              className={`flex items-center gap-3 p-3.5 rounded-xl transition-colors cursor-pointer ${
                pl.active
                  ? 'bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30'
                  : 'bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-card-hover)] border border-transparent'
              }`}
              onClick={() => {
                playlists.setActivePlaylist(pl.id);
              }}
            >
              <div className={`p-2 rounded-lg ${pl.active ? 'bg-[var(--color-primary)]/20' : 'bg-[var(--color-bg-elevated)]'}`}>
                <ListVideo size={20} className={pl.active ? 'text-[var(--color-primary)]' : 'text-[var(--color-txt-muted)]'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--color-txt)] truncate">{pl.name}</p>
                <p className="text-xs text-[var(--color-txt-muted)] capitalize">
                  {pl.type === 'xtream' ? 'Xtream Codes' : 'M3U Playlist'}
                  {pl.active && <span className="ml-1.5 text-[var(--color-primary)]">• Active</span>}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Delete "${pl.name}"?`)) {
                    playlists.deletePlaylist(pl.id);
                  }
                }}
                className="p-2 rounded-lg text-[var(--color-txt-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate('/add-playlist')}
          className="flex items-center justify-center gap-2 w-full mt-3 p-3 rounded-xl border-2 border-dashed border-[var(--color-border)] text-[var(--color-txt-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
        >
          <Plus size={18} />
          <span className="text-sm font-medium">Add Playlist</span>
        </button>
      </div>
    </div>
  );
}

function QuickTile({
  icon,
  label,
  count,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-card-hover)] transition-colors text-left"
    >
      <div
        className="p-2.5 rounded-lg"
        style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`, color }}
      >
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold text-[var(--color-txt)]">{count.toLocaleString()}</p>
        <p className="text-xs text-[var(--color-txt-muted)]">{label}</p>
      </div>
    </button>
  );
}
