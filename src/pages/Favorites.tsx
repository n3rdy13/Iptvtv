import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Trash2, Play, Film, Tv, Radio } from 'lucide-react';
import { useApp } from '../components/AppProvider';

const typeIcons = {
  live: <Radio size={16} className="text-[var(--color-error)]" />,
  vod: <Film size={16} className="text-[var(--color-primary)]" />,
  series: <Tv size={16} className="text-[var(--color-info)]" />,
};

export default function Favorites() {
  const navigate = useNavigate();
  const { playlists, favorites } = useApp();

  const activePlaylist = playlists.getActivePlaylist();
  const items = activePlaylist
    ? favorites.getFavoritesByPlaylist(activePlaylist.id)
    : [];

  const handlePlay = (fav: typeof items[0]) => {
    const params = new URLSearchParams({
      streamId: fav.streamId,
      type: fav.type,
      name: fav.name,
      playlistId: fav.playlistId,
    });
    if (fav.logo) params.set('logo', fav.logo);
    navigate(`/player?${params.toString()}`);
  };

  const handleRemove = (fav: typeof items[0]) => {
    favorites.toggleFavorite(
      fav.playlistId,
      fav.streamId,
      fav.name,
      fav.type,
      fav.logo,
    );
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
          <Heart size={20} className="text-[var(--color-error)]" />
          <h1 className="text-xl font-bold">Favorites</h1>
          <span className="text-sm text-[var(--color-txt-muted)] ml-auto">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </span>
        </div>

        {!activePlaylist && (
          <p className="text-center text-[var(--color-txt-muted)] py-12">
            No active playlist selected.
          </p>
        )}

        {activePlaylist && items.length === 0 && (
          <div className="text-center py-12 text-[var(--color-txt-muted)]">
            <Heart size={48} className="mx-auto mb-3 opacity-30" />
            <p>No favorites yet</p>
            <p className="text-sm mt-1">Tap the heart icon on any stream to add it here</p>
          </div>
        )}

        {items.length > 0 && (
          <div className="space-y-2">
            {items.map((fav) => (
              <div
                key={fav.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border-light)] hover:bg-[var(--color-bg-card-hover)] transition-colors"
              >
                {/* Logo / icon */}
                {fav.logo ? (
                  <img
                    src={fav.logo}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-[var(--color-bg-elevated)]"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-elevated)] flex items-center justify-center flex-shrink-0">
                    {typeIcons[fav.type]}
                  </div>
                )}

                {/* Info */}
                <button
                  onClick={() => handlePlay(fav)}
                  className="flex-1 min-w-0 text-left"
                >
                  <p className="font-medium text-sm truncate">{fav.name}</p>
                  <p className="text-xs text-[var(--color-txt-muted)] capitalize">{fav.type}</p>
                </button>

                {/* Play button */}
                <button
                  onClick={() => handlePlay(fav)}
                  className="p-2 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition-colors"
                >
                  <Play size={16} />
                </button>

                {/* Remove button */}
                <button
                  onClick={() => handleRemove(fav)}
                  className="p-2 rounded-lg text-[var(--color-txt-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-bg-elevated)] transition-colors"
                  aria-label={`Remove ${fav.name} from favorites`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
