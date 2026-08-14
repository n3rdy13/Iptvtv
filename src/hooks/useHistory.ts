import { useState, useEffect, useCallback } from 'react';
import type { WatchHistoryItem } from '../lib/types';
import { loadHistory, saveHistory, generateId } from '../lib/storage';

const MAX_HISTORY_ITEMS = 100;

export function useHistory() {
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);

  // Load history from storage on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await loadHistory();
        if (!cancelled) setHistory(stored);
      } catch (err) {
        console.error('Failed to load history:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addOrUpdateHistory = useCallback(
    (item: {
      playlistId: string;
      streamId: string;
      name: string;
      type: 'live' | 'vod' | 'series';
      logo?: string;
      position: number;
      duration: number;
      episodeId?: string;
      episodeNum?: number;
      seasonNum?: number;
    }): void => {
      setHistory((prev) => {
        // Check if this item already exists
        const existingIndex = prev.findIndex(
          (h) =>
            h.playlistId === item.playlistId &&
            h.streamId === item.streamId &&
            (item.episodeId ? h.episodeId === item.episodeId : true),
        );

        let updated: WatchHistoryItem[];

        if (existingIndex !== -1) {
          // Update existing entry and move it to the front
          const existing = prev[existingIndex];
          const updatedItem: WatchHistoryItem = {
            ...existing,
            ...item,
            id: existing.id,
            watchedAt: Date.now(),
          };
          updated = [
            updatedItem,
            ...prev.filter((_, i) => i !== existingIndex),
          ];
        } else {
          // Add new entry at the front
          const newItem: WatchHistoryItem = {
            ...item,
            id: generateId(),
            watchedAt: Date.now(),
          };
          updated = [newItem, ...prev];
        }

        // Trim to max items
        if (updated.length > MAX_HISTORY_ITEMS) {
          updated = updated.slice(0, MAX_HISTORY_ITEMS);
        }

        saveHistory(updated);
        return updated;
      });
    },
    [],
  );

  const getHistoryByPlaylist = useCallback(
    (playlistId: string): WatchHistoryItem[] => {
      return history.filter((h) => h.playlistId === playlistId);
    },
    [history],
  );

  const getResumePosition = useCallback(
    (playlistId: string, streamId: string): number => {
      const item = history.find(
        (h) => h.playlistId === playlistId && h.streamId === streamId,
      );
      return item ? item.position : 0;
    },
    [history],
  );

  const clearHistory = useCallback((): void => {
    setHistory([]);
    saveHistory([]);
  }, []);

  return {
    history,
    addOrUpdateHistory,
    getHistoryByPlaylist,
    getResumePosition,
    clearHistory,
  };
}
