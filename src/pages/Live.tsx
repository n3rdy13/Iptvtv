import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../components/AppProvider';
import { SearchBar } from '../components/SearchBar';
import { CategoryTabs } from '../components/CategoryTabs';
import { ChannelCard } from '../components/ChannelCard';
import { LoadingSpinner, EmptyState } from '../components/LoadingSpinner';
import type { HealthCheckResult, HealthStatus } from '../lib/types';

interface ChannelItem {
  id: string;
  name: string;
  logo?: string;
  categoryId: string;
}

export default function Live() {
  const navigate = useNavigate();
  const { playlists, content, favorites, settings } = useApp();

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [healthResults, setHealthResults] = useState<Map<string, HealthCheckResult>>(new Map());
  const [healthLoading, setHealthLoading] = useState(false);

  const activePlaylist = playlists.getActivePlaylist();

  // Load content on mount if not already loaded
  useEffect(() => {
    if (!activePlaylist) return;
    const hasContent =
      activePlaylist.type === 'xtream'
        ? content.content.liveStreams.length > 0
        : content.content.m3uGroups !== null;
    if (!hasContent && !content.loading) {
      content.loadContent(activePlaylist).catch(console.error);
    }
  }, [activePlaylist?.id]);

  // Build categories list
  const categories = useMemo(() => {
    if (!activePlaylist) return [];
    if (activePlaylist.type === 'xtream') {
      return content.content.liveCategories.map((c) => ({
        id: c.category_id,
        name: c.category_name,
      }));
    }
    // M3U: groups as categories
    if (content.content.m3uGroups) {
      return Array.from(content.content.m3uGroups.live.keys()).map((group) => ({
        id: group,
        name: group,
      }));
    }
    return [];
  }, [activePlaylist, content.content]);

  // Build unified channel list
  const allChannels = useMemo((): ChannelItem[] => {
    if (!activePlaylist) return [];
    if (activePlaylist.type === 'xtream') {
      return content.content.liveStreams.map((ch) => ({
        id: String(ch.stream_id),
        name: ch.name,
        logo: ch.stream_icon || undefined,
        categoryId: ch.category_id,
      }));
    }
    // M3U
    if (content.content.m3uGroups) {
      const entries: ChannelItem[] = [];
      for (const [group, items] of content.content.m3uGroups.live) {
        for (const item of items) {
          entries.push({
            id: item.url,
            name: item.name,
            logo: item.logo,
            categoryId: group,
          });
        }
      }
      return entries;
    }
    return [];
  }, [activePlaylist, content.content]);

  // Filter by category and search
  const filteredChannels = useMemo(() => {
    let result = allChannels;
    if (activeCategory) {
      result = result.filter((ch) => ch.categoryId === activeCategory);
    }
    if (search.trim()) {
      const query = search.toLowerCase().trim();
      result = result.filter((ch) => ch.name.toLowerCase().includes(query));
    }
    if (settings.settings.hideDeadChannels) {
      result = result.filter((ch) => {
        const hr = healthResults.get(ch.id);
        return !hr || hr.status !== 'dead';
      });
    }
    return result;
  }, [allChannels, activeCategory, search, settings.settings.hideDeadChannels, healthResults]);

  const getHealthStatus = useCallback(
    (channelId: string): HealthStatus | undefined => {
      return healthResults.get(channelId)?.status;
    },
    [healthResults],
  );

  const handlePlay = useCallback(
    (channel: { id: string; name: string }) => {
      if (!activePlaylist) return;
      navigate(
        `/player?streamId=${encodeURIComponent(channel.id)}&name=${encodeURIComponent(channel.name)}&type=live&playlistId=${activePlaylist.id}`,
      );
    },
    [activePlaylist, navigate],
  );

  const handleToggleFavorite = useCallback(
    (channel: { id: string; name: string; logo?: string }) => {
      if (!activePlaylist) return;
      favorites.toggleFavorite(activePlaylist.id, channel.id, channel.name, 'live', channel.logo);
    },
    [activePlaylist, favorites],
  );

  if (!activePlaylist) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] px-6">
        <EmptyState title="No Active Playlist" subtitle="Add a playlist from the Home screen to start watching." />
      </div>
    );
  }

  if (content.loading) {
    return <LoadingSpinner message={content.loadingProgress || 'Loading channels...'} fullScreen />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-2xl font-bold text-[var(--color-txt)] mb-4">Live TV</h1>
        <SearchBar value={search} onChange={setSearch} placeholder="Search channels..." />
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

      {/* Channel count */}
      <div className="px-4 py-2 flex items-center justify-between">
        <p className="text-xs text-[var(--color-txt-muted)]">
          {filteredChannels.length} channel{filteredChannels.length !== 1 ? 's' : ''}
          {activeCategory && ` in ${categories.find((c) => c.id === activeCategory)?.name ?? 'category'}`}
        </p>
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {filteredChannels.length === 0 ? (
          <EmptyState
            title="No channels found"
            subtitle={search ? 'Try a different search term.' : 'No channels in this category.'}
          />
        ) : (
          filteredChannels.map((channel) => (
            <ChannelCard
              key={channel.id}
              name={channel.name}
              logo={channel.logo}
              isFavorite={favorites.isFavorite(activePlaylist.id, channel.id)}
              onPlay={() => handlePlay(channel)}
              onToggleFavorite={() => handleToggleFavorite(channel)}
              healthStatus={getHealthStatus(channel.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
