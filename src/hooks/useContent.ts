import { useState, useCallback } from 'react';
import type {
  Playlist,
  LiveCategory,
  VodCategory,
  SeriesCategory,
  LiveChannel,
  VodStream,
  Series,
  M3UEntry,
} from '../lib/types';
import { loadCachedContent, saveCachedContent } from '../lib/storage';
import {
  getLiveCategories,
  getVodCategories,
  getSeriesCategories,
  getLiveStreams,
  getVodStreams,
  getSeries,
} from '../lib/xtream';
import { fetchM3U, parseM3U, groupM3UEntries } from '../lib/m3u';

export interface ContentData {
  liveCategories: LiveCategory[];
  vodCategories: VodCategory[];
  seriesCategories: SeriesCategory[];
  liveStreams: LiveChannel[];
  vodStreams: VodStream[];
  seriesList: Series[];
  m3uGroups: {
    live: Map<string, M3UEntry[]>;
    vod: Map<string, M3UEntry[]>;
    series: Map<string, M3UEntry[]>;
  } | null;
}

const emptyContent: ContentData = {
  liveCategories: [],
  vodCategories: [],
  seriesCategories: [],
  liveStreams: [],
  vodStreams: [],
  seriesList: [],
  m3uGroups: null,
};

export function useContent() {
  const [content, setContent] = useState<ContentData>(emptyContent);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState('');

  const loadContent = useCallback(
    async (playlist: Playlist, useCache = true): Promise<ContentData> => {
      setLoading(true);
      setLoadingProgress('Checking cache...');

      try {
        // Check cached content first
        if (useCache) {
          const cached = await loadCachedContent(playlist.id);
          if (cached) {
            // Restore Map objects for m3u groups (JSON serialization converts Maps to plain objects)
            if (cached.m3uGroups) {
              cached.m3uGroups = {
                live: new Map(Object.entries(cached.m3uGroups.live || {})),
                vod: new Map(Object.entries(cached.m3uGroups.vod || {})),
                series: new Map(Object.entries(cached.m3uGroups.series || {})),
              };
            }
            setContent(cached);
            setLoadingProgress('');
            return cached;
          }
        }

        let result: ContentData;

        if (playlist.type === 'xtream') {
          result = await loadXtreamContent(playlist);
        } else {
          result = await loadM3UContent(playlist);
        }

        // Cache the result (convert Maps to serializable objects for storage)
        const toCache = {
          ...result,
          m3uGroups: result.m3uGroups
            ? {
                live: Object.fromEntries(result.m3uGroups.live),
                vod: Object.fromEntries(result.m3uGroups.vod),
                series: Object.fromEntries(result.m3uGroups.series),
              }
            : null,
        };
        await saveCachedContent(playlist.id, toCache);

        setContent(result);
        return result;
      } catch (err) {
        console.error('Failed to load content:', err);
        throw err;
      } finally {
        setLoading(false);
        setLoadingProgress('');
      }
    },
    [],
  );

  async function loadXtreamContent(playlist: Playlist): Promise<ContentData> {
    setLoadingProgress('Loading live categories...');
    const liveCategories = await getLiveCategories(playlist);

    setLoadingProgress('Loading VOD categories...');
    const vodCategories = await getVodCategories(playlist);

    setLoadingProgress('Loading series categories...');
    const seriesCategories = await getSeriesCategories(playlist);

    setLoadingProgress('Loading live streams...');
    const liveStreams = await getLiveStreams(playlist);

    setLoadingProgress('Loading VOD streams...');
    const vodStreams = await getVodStreams(playlist);

    setLoadingProgress('Loading series...');
    const seriesList = await getSeries(playlist);

    return {
      liveCategories: liveCategories || [],
      vodCategories: vodCategories || [],
      seriesCategories: seriesCategories || [],
      liveStreams: liveStreams || [],
      vodStreams: vodStreams || [],
      seriesList: seriesList || [],
      m3uGroups: null,
    };
  }

  async function loadM3UContent(playlist: Playlist): Promise<ContentData> {
    if (!playlist.m3uUrl) {
      throw new Error('M3U URL is required');
    }

    setLoadingProgress('Fetching M3U playlist...');
    const m3uText = await fetchM3U(playlist.m3uUrl);

    setLoadingProgress('Parsing M3U entries...');
    const entries = parseM3U(m3uText);

    setLoadingProgress('Grouping content...');
    const groups = groupM3UEntries(entries);

    return {
      liveCategories: [],
      vodCategories: [],
      seriesCategories: [],
      liveStreams: [],
      vodStreams: [],
      seriesList: [],
      m3uGroups: groups,
    };
  }

  return {
    content,
    loading,
    loadingProgress,
    loadContent,
  };
}
