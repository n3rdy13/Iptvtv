import { useState, useEffect, useCallback } from 'react';
import type { Favorite } from '../lib/types';
import { loadFavorites, saveFavorites, generateId } from '../lib/storage';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  // Load favorites from storage on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await loadFavorites();
        if (!cancelled) setFavorites(stored);
      } catch (err) {
        console.error('Failed to load favorites:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist whenever favorites change
  const persist = useCallback((updated: Favorite[]) => {
    setFavorites(updated);
    saveFavorites(updated);
  }, []);

  const toggleFavorite = useCallback(
    (
      playlistId: string,
      streamId: string,
      name: string,
      type: 'live' | 'vod' | 'series',
      logo?: string,
    ): void => {
      setFavorites((prev) => {
        const existing = prev.find(
          (f) => f.playlistId === playlistId && f.streamId === streamId,
        );

        let updated: Favorite[];
        if (existing) {
          // Remove from favorites
          updated = prev.filter(
            (f) => !(f.playlistId === playlistId && f.streamId === streamId),
          );
        } else {
          // Add to favorites
          const newFavorite: Favorite = {
            id: generateId(),
            playlistId,
            streamId,
            name,
            type,
            logo,
            addedAt: Date.now(),
          };
          updated = [...prev, newFavorite];
        }

        saveFavorites(updated);
        return updated;
      });
    },
    [],
  );

  const isFavorite = useCallback(
    (playlistId: string, streamId: string): boolean => {
      return favorites.some(
        (f) => f.playlistId === playlistId && f.streamId === streamId,
      );
    },
    [favorites],
  );

  const getFavoritesByPlaylist = useCallback(
    (playlistId: string): Favorite[] => {
      return favorites.filter((f) => f.playlistId === playlistId);
    },
    [favorites],
  );

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    getFavoritesByPlaylist,
  };
}
