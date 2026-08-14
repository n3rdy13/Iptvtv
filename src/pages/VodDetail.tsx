import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Heart,
  Star,
  Clock,
  Film,
  Loader2,
} from 'lucide-react';
import { useApp } from '../components/AppProvider';
import { getVodInfo } from '../lib/xtream';
import type { VodInfo } from '../lib/types';

export default function VodDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { playlists, favorites } = useApp();

  const streamId = searchParams.get('streamId') || '';
  const name = searchParams.get('name') || 'Unknown';
  const playlistId = searchParams.get('playlistId') || '';
  const ext = searchParams.get('ext') || 'mp4';

  const [vodInfo, setVodInfo] = useState<VodInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const playlist = playlists.playlists.find((p) => p.id === playlistId);
  const isFav = favorites.isFavorite(playlistId, streamId);

  useEffect(() => {
    if (!playlist || playlist.type !== 'xtream' || !streamId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const info = await getVodInfo(playlist, Number(streamId));
        if (!cancelled) setVodInfo(info);
      } catch (err) {
        // The raw message can contain text chosen by the remote provider.
        console.error('Failed to load VOD info:', err);
        if (!cancelled) setError('Could not load the details for this title. Please try again later.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [playlist, streamId]);

  const handlePlay = () => {
    const params = new URLSearchParams({
      streamId,
      type: 'vod',
      name: vodInfo?.movie_data?.name || name,
      playlistId,
      ext,
    });
    if (vodInfo?.info?.movie_image) params.set('logo', vodInfo.info.movie_image);
    navigate(`/player?${params.toString()}`);
  };

  const handleToggleFavorite = () => {
    favorites.toggleFavorite(
      playlistId,
      streamId,
      vodInfo?.movie_data?.name || name,
      'vod',
      vodInfo?.info?.movie_image,
    );
  };

  const info = vodInfo?.info;
  const poster = info?.movie_image || '';
  const title = vodInfo?.movie_data?.name || name;

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <Loader2 size={32} className="text-[var(--color-primary)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-txt)]">
      {/* Backdrop */}
      {info?.backdrop_path?.[0] && (
        <div className="relative h-64 overflow-hidden">
          <img
            src={info.backdrop_path[0]}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--color-bg)]" />
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 pb-8">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[var(--color-txt-secondary)] hover:text-[var(--color-txt)] py-4 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm">Back</span>
        </button>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-[var(--color-error)]/10 text-[var(--color-error)] text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-5">
          {/* Poster */}
          {poster ? (
            <img
              src={poster}
              alt={title}
              className="w-32 h-48 rounded-xl object-cover flex-shrink-0 shadow-lg"
            />
          ) : (
            <div className="w-32 h-48 rounded-xl bg-[var(--color-bg-elevated)] flex items-center justify-center flex-shrink-0">
              <Film size={32} className="text-[var(--color-txt-muted)]" />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-3">
            <h1 className="text-xl font-bold leading-tight">{title}</h1>

            <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-txt-secondary)]">
              {info?.rating && (
                <span className="flex items-center gap-1">
                  <Star size={14} className="text-[var(--color-warning)]" />
                  {info.rating}
                </span>
              )}
              {info?.duration && (
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {info.duration}
                </span>
              )}
              {info?.genre && <span>{info.genre}</span>}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handlePlay}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-[var(--color-txt-on-primary)] font-semibold hover:bg-[var(--color-primary-dark)] transition-colors"
              >
                <Play size={18} />
                Play
              </button>
              <button
                onClick={handleToggleFavorite}
                className={`p-2.5 rounded-xl border transition-colors ${
                  isFav
                    ? 'bg-[var(--color-error)]/10 border-[var(--color-error)]/30 text-[var(--color-error)]'
                    : 'bg-[var(--color-bg-elevated)] border-[var(--color-border-light)] text-[var(--color-txt-secondary)] hover:text-[var(--color-error)]'
                }`}
              >
                <Heart size={18} fill={isFav ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="mt-6 space-y-4">
          {info?.plot && (
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-txt-secondary)] mb-1">Plot</h3>
              <p className="text-sm text-[var(--color-txt)] leading-relaxed">{info.plot}</p>
            </div>
          )}
          {info?.cast && (
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-txt-secondary)] mb-1">Cast</h3>
              <p className="text-sm text-[var(--color-txt-muted)]">{info.cast}</p>
            </div>
          )}
          {info?.director && (
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-txt-secondary)] mb-1">Director</h3>
              <p className="text-sm text-[var(--color-txt-muted)]">{info.director}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
