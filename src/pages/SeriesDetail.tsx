import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Film,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../components/AppProvider';
import { getSeriesInfo } from '../lib/xtream';
import type { SeriesInfo, SeriesEpisode } from '../lib/types';

export default function SeriesDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { playlists } = useApp();

  const seriesId = searchParams.get('seriesId') || '';
  const name = searchParams.get('name') || 'Unknown Series';
  const playlistId = searchParams.get('playlistId') || '';

  const [seriesInfo, setSeriesInfo] = useState<SeriesInfo['info'] | null>(null);
  const [episodes, setEpisodes] = useState<Record<string, SeriesEpisode[]>>({});
  const [seasons, setSeasons] = useState<string[]>([]);
  const [activeSeason, setActiveSeason] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const playlist = playlists.playlists.find((p) => p.id === playlistId);

  useEffect(() => {
    if (!playlist || playlist.type !== 'xtream' || !seriesId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await getSeriesInfo(playlist, Number(seriesId));
        if (cancelled) return;
        setSeriesInfo(data.info);
        setEpisodes(data.episodes || {});
        const seasonKeys = Object.keys(data.episodes || {}).sort(
          (a, b) => Number(a) - Number(b),
        );
        setSeasons(seasonKeys);
        if (seasonKeys.length > 0) setActiveSeason(seasonKeys[0]);
      } catch (err) {
        // The raw message can contain text chosen by the remote provider.
        console.error('Failed to load series info:', err);
        if (!cancelled) setError('Could not load the details for this series. Please try again later.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [playlist, seriesId]);

  const handlePlayEpisode = (ep: SeriesEpisode) => {
    const params = new URLSearchParams({
      streamId: ep.id,
      type: 'series',
      name: ep.title || `Episode ${ep.episode_num}`,
      playlistId,
      ext: ep.container_extension || 'mp4',
    });
    navigate(`/player?${params.toString()}`);
  };

  const cover = seriesInfo?.movie_image || '';
  const title = seriesInfo?.name || name;
  const currentEpisodes = episodes[activeSeason] || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <Loader2 size={32} className="text-[var(--color-primary)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-txt)]">
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

        {/* Header */}
        <div className="flex gap-5 mb-6">
          {cover ? (
            <img
              src={cover}
              alt={title}
              className="w-32 h-48 rounded-xl object-cover flex-shrink-0 shadow-lg"
            />
          ) : (
            <div className="w-32 h-48 rounded-xl bg-[var(--color-bg-elevated)] flex items-center justify-center flex-shrink-0">
              <Film size={32} className="text-[var(--color-txt-muted)]" />
            </div>
          )}
          <div className="flex-1 min-w-0 space-y-3">
            <h1 className="text-xl font-bold leading-tight">{title}</h1>
            {seriesInfo?.genre && (
              <p className="text-sm text-[var(--color-txt-secondary)]">{seriesInfo.genre}</p>
            )}
            {seriesInfo?.rating && (
              <p className="text-sm text-[var(--color-txt-secondary)]">Rating: {seriesInfo.rating}</p>
            )}
          </div>
        </div>

        {/* Plot */}
        {seriesInfo?.plot && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-[var(--color-txt-secondary)] mb-1">Plot</h3>
            <p className="text-sm leading-relaxed">{seriesInfo.plot}</p>
          </div>
        )}

        {/* Cast */}
        {seriesInfo?.cast && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-[var(--color-txt-secondary)] mb-1">Cast</h3>
            <p className="text-sm text-[var(--color-txt-muted)]">{seriesInfo.cast}</p>
          </div>
        )}

        {/* Season tabs */}
        {seasons.length > 0 && (
          <>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
              {seasons.map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveSeason(s)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeSeason === s
                      ? 'bg-[var(--color-primary)] text-[var(--color-txt-on-primary)]'
                      : 'bg-[var(--color-bg-elevated)] text-[var(--color-txt-secondary)] hover:bg-[var(--color-bg-card-hover)]'
                  }`}
                >
                  Season {s}
                </button>
              ))}
            </div>

            {/* Episode list */}
            <div className="space-y-2">
              {currentEpisodes.length === 0 ? (
                <p className="text-sm text-[var(--color-txt-muted)] text-center py-8">
                  No episodes found for this season
                </p>
              ) : (
                currentEpisodes.map((ep) => (
                  <button
                    key={ep.id}
                    onClick={() => handlePlayEpisode(ep)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border-light)] hover:bg-[var(--color-bg-card-hover)] transition-colors text-left"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--color-bg-elevated)] flex-shrink-0">
                      <Play size={16} className="text-[var(--color-primary)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        E{ep.episode_num}. {ep.title || `Episode ${ep.episode_num}`}
                      </p>
                      {ep.info?.duration && (
                        <p className="text-xs text-[var(--color-txt-muted)]">{ep.info.duration}</p>
                      )}
                      {ep.info?.plot && (
                        <p className="text-xs text-[var(--color-txt-muted)] truncate mt-0.5">
                          {ep.info.plot}
                        </p>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-[var(--color-txt-muted)] flex-shrink-0" />
                  </button>
                ))
              )}
            </div>
          </>
        )}

        {seasons.length === 0 && !loading && (
          <p className="text-sm text-[var(--color-txt-muted)] text-center py-8">
            No season data available
          </p>
        )}
      </div>
    </div>
  );
}
