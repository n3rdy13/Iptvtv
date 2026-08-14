import type {
  XtreamUserInfo,
  LiveCategory,
  VodCategory,
  SeriesCategory,
  LiveChannel,
  VodStream,
  Series,
  SeriesInfo,
  SeriesEpisode,
  VodInfo,
  Playlist,
} from './types';

function buildBaseUrl(playlist: Playlist): string {
  const server = (playlist.serverUrl || '').replace(/\/$/, '');
  const user = encodeURIComponent(playlist.username || '');
  const pass = encodeURIComponent(playlist.password || '');
  return `${server}/player_api.php?username=${user}&password=${pass}`;
}

async function fetchJson<T>(url: string, timeoutMs = 15000): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function authenticate(
  serverUrl: string,
  username: string,
  password: string,
): Promise<XtreamUserInfo> {
  const server = serverUrl.replace(/\/$/, '');
  const user = encodeURIComponent(username);
  const pass = encodeURIComponent(password);
  const url = `${server}/player_api.php?username=${user}&password=${pass}`;
  const data = await fetchJson<{ user_info: XtreamUserInfo }>(url);
  if (!data.user_info || data.user_info.auth === 0) {
    throw new Error('Invalid credentials or server unreachable');
  }
  return data.user_info;
}

export async function getLiveCategories(playlist: Playlist): Promise<LiveCategory[]> {
  const url = `${buildBaseUrl(playlist)}&action=get_live_categories`;
  return fetchJson<LiveCategory[]>(url);
}

export async function getVodCategories(playlist: Playlist): Promise<VodCategory[]> {
  const url = `${buildBaseUrl(playlist)}&action=get_vod_categories`;
  return fetchJson<VodCategory[]>(url);
}

export async function getSeriesCategories(playlist: Playlist): Promise<SeriesCategory[]> {
  const url = `${buildBaseUrl(playlist)}&action=get_series_categories`;
  return fetchJson<SeriesCategory[]>(url);
}

export async function getLiveStreams(playlist: Playlist, categoryId?: string): Promise<LiveChannel[]> {
  let url = `${buildBaseUrl(playlist)}&action=get_live_streams`;
  if (categoryId) url += `&category_id=${categoryId}`;
  return fetchJson<LiveChannel[]>(url);
}

export async function getVodStreams(playlist: Playlist, categoryId?: string): Promise<VodStream[]> {
  let url = `${buildBaseUrl(playlist)}&action=get_vod_streams`;
  if (categoryId) url += `&category_id=${categoryId}`;
  return fetchJson<VodStream[]>(url);
}

export async function getSeries(playlist: Playlist, categoryId?: string): Promise<Series[]> {
  let url = `${buildBaseUrl(playlist)}&action=get_series`;
  if (categoryId) url += `&category_id=${categoryId}`;
  return fetchJson<Series[]>(url);
}

export async function getVodInfo(playlist: Playlist, vodId: number): Promise<VodInfo> {
  const url = `${buildBaseUrl(playlist)}&action=get_vod_info&vod_id=${vodId}`;
  return fetchJson<VodInfo>(url);
}

export async function getSeriesInfo(playlist: Playlist, seriesId: number): Promise<{
  info: SeriesInfo['info'];
  seasons: SeriesInfo['seasons'];
  episodes: Record<string, SeriesEpisode[]>;
}> {
  const url = `${buildBaseUrl(playlist)}&action=get_series_info&series_id=${seriesId}`;
  return fetchJson(url);
}

export async function getEpgUrl(playlist: Playlist): Promise<string | null> {
  const server = (playlist.serverUrl || '').replace(/\/$/, '');
  const user = encodeURIComponent(playlist.username || '');
  const pass = encodeURIComponent(playlist.password || '');
  const url = `${server}/xmltv.php?username=${user}&password=${pass}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) return url;
    return null;
  } catch {
    return null;
  }
}

export function buildStreamUrl(playlist: Playlist, streamId: number, type: 'live' | 'vod' | 'series', ext?: string): string {
  const server = (playlist.serverUrl || '').replace(/\/$/, '');
  const user = encodeURIComponent(playlist.username || '');
  const pass = encodeURIComponent(playlist.password || '');
  if (type === 'live') {
    return `${server}/live/${user}/${pass}/${streamId}.ts`;
  }
  if (type === 'vod') {
    const container = ext || 'mp4';
    return `${server}/movie/${user}/${pass}/${streamId}.${container}`;
  }
  // series
  const container = ext || 'mp4';
  return `${server}/series/${user}/${pass}/${streamId}.${container}`;
}

export function buildLiveStreamUrl(playlist: Playlist, streamId: number, format?: string): string {
  const server = (playlist.serverUrl || '').replace(/\/$/, '');
  const user = encodeURIComponent(playlist.username || '');
  const pass = encodeURIComponent(playlist.password || '');
  const ext = format || 'm3u8';
  return `${server}/live/${user}/${pass}/${streamId}.${ext}`;
}
