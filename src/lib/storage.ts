import type {
  Playlist,
  Favorite,
  WatchHistoryItem,
  AppSettings,
  HealthCheckResult,
} from './types';

const KEYS = {
  PLAYLISTS: '@iptv_playlists',
  FAVORITES: '@iptv_favorites',
  HISTORY: '@iptv_history',
  SETTINGS: '@iptv_settings',
  HEALTH: '@iptv_health',
  CACHED_CONTENT: '@iptv_cached_content',
  CACHED_EPG: '@iptv_cached_epg',
};

function getItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // quota exceeded – silently fail
  }
}

function removeItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {}
}

export async function loadPlaylists(): Promise<Playlist[]> {
  const data = getItem(KEYS.PLAYLISTS);
  return data ? JSON.parse(data) : [];
}

export async function savePlaylists(playlists: Playlist[]): Promise<void> {
  setItem(KEYS.PLAYLISTS, JSON.stringify(playlists));
}

export async function loadFavorites(): Promise<Favorite[]> {
  const data = getItem(KEYS.FAVORITES);
  return data ? JSON.parse(data) : [];
}

export async function saveFavorites(favorites: Favorite[]): Promise<void> {
  setItem(KEYS.FAVORITES, JSON.stringify(favorites));
}

export async function loadHistory(): Promise<WatchHistoryItem[]> {
  const data = getItem(KEYS.HISTORY);
  return data ? JSON.parse(data) : [];
}

export async function saveHistory(history: WatchHistoryItem[]): Promise<void> {
  setItem(KEYS.HISTORY, JSON.stringify(history));
}

export async function loadSettings(): Promise<AppSettings | null> {
  const data = getItem(KEYS.SETTINGS);
  return data ? JSON.parse(data) : null;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

export async function loadHealthResults(playlistId: string): Promise<HealthCheckResult[]> {
  const data = getItem(`${KEYS.HEALTH}_${playlistId}`);
  return data ? JSON.parse(data) : [];
}

export async function saveHealthResults(playlistId: string, results: HealthCheckResult[]): Promise<void> {
  setItem(`${KEYS.HEALTH}_${playlistId}`, JSON.stringify(results));
}

export async function loadCachedContent(playlistId: string): Promise<any> {
  const data = getItem(`${KEYS.CACHED_CONTENT}_${playlistId}`);
  return data ? JSON.parse(data) : null;
}

export async function saveCachedContent(playlistId: string, content: any): Promise<void> {
  setItem(`${KEYS.CACHED_CONTENT}_${playlistId}`, JSON.stringify(content));
}

export async function loadCachedEpg(playlistId: string): Promise<any> {
  const data = getItem(`${KEYS.CACHED_EPG}_${playlistId}`);
  return data ? JSON.parse(data) : null;
}

export async function saveCachedEpg(playlistId: string, epg: any): Promise<void> {
  setItem(`${KEYS.CACHED_EPG}_${playlistId}`, JSON.stringify(epg));
}

export async function clearPlaylistData(playlistId: string): Promise<void> {
  removeItem(`${KEYS.CACHED_CONTENT}_${playlistId}`);
  removeItem(`${KEYS.CACHED_EPG}_${playlistId}`);
  removeItem(`${KEYS.HEALTH}_${playlistId}`);
}

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
