import { useState, useEffect, useCallback } from 'react';
import type { Playlist } from '../lib/types';
import {
  loadPlaylists,
  savePlaylists,
  generateId,
  clearPlaylistData,
} from '../lib/storage';
import { authenticate } from '../lib/xtream';
import { assertSafeFetchUrl } from '../lib/url';

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  // Load playlists from storage on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await loadPlaylists();
        if (!cancelled) setPlaylists(stored);
      } catch (err) {
        console.error('Failed to load playlists:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist whenever playlists change (skip during initial load)
  useEffect(() => {
    if (!loading) {
      savePlaylists(playlists);
    }
  }, [playlists, loading]);

  const addXtreamPlaylist = useCallback(
    async (
      name: string,
      serverUrl: string,
      username: string,
      password: string,
    ): Promise<Playlist> => {
      assertSafeFetchUrl(serverUrl, 'Server URL');

      const userInfo = await authenticate(serverUrl, username, password);

      const newPlaylist: Playlist = {
        id: generateId(),
        name,
        type: 'xtream',
        serverUrl,
        username,
        password,
        active: false,
        createdAt: Date.now(),
        userInfo,
      };

      setPlaylists((prev) => {
        const updated = [...prev, newPlaylist];
        // If this is the first playlist, make it active
        if (updated.length === 1) {
          updated[0] = { ...updated[0], active: true };
        }
        return updated;
      });

      return newPlaylist;
    },
    [],
  );

  const addM3UPlaylist = useCallback(
    async (name: string, m3uUrl: string, epgUrl?: string): Promise<Playlist> => {
      assertSafeFetchUrl(m3uUrl, 'M3U URL');
      if (epgUrl) assertSafeFetchUrl(epgUrl, 'EPG URL');

      const newPlaylist: Playlist = {
        id: generateId(),
        name,
        type: 'm3u',
        m3uUrl,
        epgUrl,
        active: false,
        createdAt: Date.now(),
      };

      setPlaylists((prev) => {
        const updated = [...prev, newPlaylist];
        if (updated.length === 1) {
          updated[0] = { ...updated[0], active: true };
        }
        return updated;
      });

      return newPlaylist;
    },
    [],
  );

  const deletePlaylist = useCallback(async (id: string): Promise<void> => {
    await clearPlaylistData(id);
    setPlaylists((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      // If we deleted the active playlist and others remain, activate the first
      const hasActive = filtered.some((p) => p.active);
      if (!hasActive && filtered.length > 0) {
        filtered[0] = { ...filtered[0], active: true };
      }
      return filtered;
    });
  }, []);

  const setActivePlaylist = useCallback((id: string): void => {
    setPlaylists((prev) =>
      prev.map((p) => ({
        ...p,
        active: p.id === id,
      })),
    );
  }, []);

  const getActivePlaylist = useCallback((): Playlist | undefined => {
    return playlists.find((p) => p.active);
  }, [playlists]);

  return {
    playlists,
    loading,
    addXtreamPlaylist,
    addM3UPlaylist,
    deletePlaylist,
    setActivePlaylist,
    getActivePlaylist,
  };
}
