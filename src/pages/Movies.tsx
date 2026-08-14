import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../components/AppProvider';
import { SearchBar } from '../components/SearchBar';
import { CategoryTabs } from '../components/CategoryTabs';
import { PosterCard } from '../components/PosterCard';
import { LoadingSpinner, EmptyState } from '../components/LoadingSpinner';

export default function Movies() {
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
        ? content.content.vodStreams.length > 0
        : content.content.m3uGroups !== null;
    if (!hasContent && !content.loading) {
      content.loadContent(activePlaylist).catch(console.error);
    }
  }, [activePlaylist?.id]);

  // Build categories list
  const categories = useMemo(() => {
    if (!activePlaylist) return [];
    if (activePlaylist.type === 'xtream') {
      return content.content.vodCategories.map((c) => ({
        id: c.category_id,
        name: c.category_name,
      }));
    }
    // M3U: groups as categories
    if (content.content.m3uGroups) {
      return Array.from(content.content.m3uGroups.vod.keys()).map((group) => ({
        id: group,
        name: group,
      }));
    }
    return [];
  }, [activePlaylist, content.content]);

  // Build unified movie list
  const allMovies = useMemo(() => {
    if (!activePlaylist) return [];
    if (activePlaylist.type === 'xtream') {
      return content.content.vodStreams.map((vod) => ({
        id: String(vod.stream_id),
        name: vod.name,
        poster: vod.stream_icon || undefined,
        rating: vod.rating_5based > 0 ? vod.rating_5based : undefined,
        categoryId: vod.category_id,
        ext: vod.container_extension,
      }));
    }
    // M3U
    if (content.content.m3uGroups) {
      const entries: { id: string; name: string; poster?: string; rating?: number; categoryId: string; ext?: string }[] = [];
      for (const [group, items] of content.content.m3uGroups.vod) {
        for (const item of items) {
          entries.push({
            id: item.url,
            name: item.name,
            poster: item.logo,
            categoryId: group,
          });
        }
      }
      return entries;
    }
    return [];
  }, [activePlaylist, content.content]);

  // Filter by category and search
  const filteredMovies = useMemo(() => {
    let result = allMovies;
    if (activeCategory) {
      result = result.filter((m) => m.categoryId === activeCategory);
    }
    if (search.trim()) {
      const query = search.toLowerCase().trim();
      result = result.filter((m) => m.name.toLowerCase().includes(query));
    }
    return result;
  }, [allMovies, activeCategory, search]);

  const handlePress = useCallback(
    (movie: { id: string; name: string; ext?: string }) => {
      if (!activePlaylist) return;
      const params = new URLSearchParams({
        streamId: movie.id,
        name: movie.name,
        playlistId: activePlaylist.id,
      });
      if (movie.ext) params.set('ext', movie.ext);
      navigate(`/vod-detail?${params.toString()}`);
    },
    [activePlaylist, navigate],
  );

  const handleToggleFavorite = useCallback(
    (movie: { id: string; name: string; poster?: string }) => {
      if (!activePlaylist) return;
      favorites.toggleFavorite(activePlaylist.id, movie.id, movie.name, 'vod', movie.poster);
    },
    [activePlaylist, favorites],
  );

  if (!activePlaylist) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] px-6">
        <EmptyState title="No Active Playlist" subtitle="Add a playlist from the Home screen to browse movies." />
      </div>
    );
  }

  if (content.loading) {
    return <LoadingSpinner message={content.loadingProgress || 'Loading movies...'} fullScreen />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-2xl font-bold text-[var(--color-txt)] mb-4">Movies</h1>
        <SearchBar value={search} onChange={setSearch} placeholder="Search movies..." />
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

      {/* Movie count */}
      <div className="px-4 py-2">
        <p className="text-xs text-[var(--color-txt-muted)]">
          {filteredMovies.length} movie{filteredMovies.length !== 1 ? 's' : ''}
          {activeCategory && ` in ${categories.find((c) => c.id === activeCategory)?.name ?? 'category'}`}
        </p>
      </div>

      {/* Movie grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filteredMovies.length === 0 ? (
          <EmptyState
            title="No movies found"
            subtitle={search ? 'Try a different search term.' : 'No movies in this category.'}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredMovies.map((movie) => (
              <PosterCard
                key={movie.id}
                title={movie.name}
                poster={movie.poster}
                rating={movie.rating}
                isFavorite={favorites.isFavorite(activePlaylist.id, movie.id)}
                onPress={() => handlePress(movie)}
                onToggleFavorite={() => handleToggleFavorite(movie)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
