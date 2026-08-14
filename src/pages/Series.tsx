import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../components/AppProvider';
import { SearchBar } from '../components/SearchBar';
import { CategoryTabs } from '../components/CategoryTabs';
import { PosterCard } from '../components/PosterCard';
import { LoadingSpinner, EmptyState } from '../components/LoadingSpinner';

interface SeriesItem {
  id: string;
  name: string;
  poster?: string;
  rating?: number;
  categoryId: string;
}

export default function Series() {
  const navigate = useNavigate();
  const { playlists, content, favorites } = useApp();

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const activePlaylist = playlists.getActivePlaylist();

  // Load content on mount if not already loaded
  useEffect(() => {
    if (!activePlaylist) return;
    const hasContent =
      activePlaylist.type === 'xtream'
        ? content.content.seriesList.length > 0
        : content.content.m3uGroups !== null;
    if (!hasContent && !content.loading) {
      content.loadContent(activePlaylist).catch(console.error);
    }
  }, [activePlaylist?.id]);

  // Build categories list
  const categories = useMemo(() => {
    if (!activePlaylist) return [];
    if (activePlaylist.type === 'xtream') {
      return content.content.seriesCategories.map((c) => ({
        id: c.category_id,
        name: c.category_name,
      }));
    }
    // M3U: groups as categories
    if (content.content.m3uGroups) {
      return Array.from(content.content.m3uGroups.series.keys()).map((group) => ({
        id: group,
        name: group,
      }));
    }
    return [];
  }, [activePlaylist, content.content]);

  // Build unified series list
  const allSeries = useMemo((): SeriesItem[] => {
    if (!activePlaylist) return [];

    if (activePlaylist.type === 'xtream') {
      return content.content.seriesList.map((s) => ({
        id: String(s.series_id),
        name: s.name,
        poster: s.cover || undefined,
        rating: s.rating_5based > 0 ? s.rating_5based : undefined,
        categoryId: s.category_id,
      }));
    }

    // M3U: group entries by base name to collapse episodes into a single series card
    if (content.content.m3uGroups) {
      const seriesMap = new Map<string, SeriesItem>();

      for (const [group, items] of content.content.m3uGroups.series) {
        for (const item of items) {
          // Extract base name by stripping trailing S##E##, episode numbers, etc.
          const baseName = item.name
            .replace(/\s*[Ss]\d+\s*[Ee]\d+.*$/, '')
            .replace(/\s*[Ee](?:pisode)?\s*\d+.*$/i, '')
            .replace(/\s*-?\s*\d+\s*$/, '')
            .trim();

          const key = `${group}::${baseName}`;
          if (!seriesMap.has(key)) {
            seriesMap.set(key, {
              id: key,
              name: baseName || item.name,
              poster: item.logo,
              categoryId: group,
            });
          }
        }
      }

      return Array.from(seriesMap.values());
    }

    return [];
  }, [activePlaylist, content.content]);

  // Filter by category and search
  const filteredSeries = useMemo(() => {
    let result = allSeries;
    if (activeCategory) {
      result = result.filter((s) => s.categoryId === activeCategory);
    }
    if (search.trim()) {
      const query = search.toLowerCase().trim();
      result = result.filter((s) => s.name.toLowerCase().includes(query));
    }
    return result;
  }, [allSeries, activeCategory, search]);

  const handlePress = useCallback(
    (series: SeriesItem) => {
      if (!activePlaylist) return;
      navigate(
        `/series-detail?seriesId=${encodeURIComponent(series.id)}&name=${encodeURIComponent(series.name)}&playlistId=${activePlaylist.id}`,
      );
    },
    [activePlaylist, navigate],
  );

  const handleToggleFavorite = useCallback(
    (series: SeriesItem) => {
      if (!activePlaylist) return;
      favorites.toggleFavorite(activePlaylist.id, series.id, series.name, 'series', series.poster);
    },
    [activePlaylist, favorites],
  );

  if (!activePlaylist) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] px-6">
        <EmptyState title="No Active Playlist" subtitle="Add a playlist from the Home screen to browse series." />
      </div>
    );
  }

  if (content.loading) {
    return <LoadingSpinner message={content.loadingProgress || 'Loading series...'} fullScreen />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-2xl font-bold text-[var(--color-txt)] mb-4">Series</h1>
        <SearchBar value={search} onChange={setSearch} placeholder="Search series..." />
      </div>

      {/* Category tabs */}
      {categories.length > 0 && (
        <div className="mt-2">
          <CategoryTabs
            categories={categories}
            activeId={activeCategory}
            onSelect={setActiveCategory}
          />
        </div>
      )}

      {/* Series count */}
      <div className="px-4 py-2">
        <p className="text-xs text-[var(--color-txt-muted)]">
          {filteredSeries.length} series
          {activeCategory && ` in ${categories.find((c) => c.id === activeCategory)?.name ?? 'category'}`}
        </p>
      </div>

      {/* Series grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filteredSeries.length === 0 ? (
          <EmptyState
            title="No series found"
            subtitle={search ? 'Try a different search term.' : 'No series in this category.'}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredSeries.map((series) => (
              <PosterCard
                key={series.id}
                title={series.name}
                poster={series.poster}
                rating={series.rating}
                isFavorite={favorites.isFavorite(activePlaylist.id, series.id)}
                onPress={() => handlePress(series)}
                onToggleFavorite={() => handleToggleFavorite(series)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
