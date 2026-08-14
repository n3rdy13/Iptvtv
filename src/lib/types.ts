export type PlaylistType = 'xtream' | 'm3u';

export interface XtreamCredentials {
  serverUrl: string;
  username: string;
  password: string;
}

export interface Playlist {
  id: string;
  name: string;
  type: PlaylistType;
  // Xtream
  serverUrl?: string;
  username?: string;
  password?: string;
  // M3U
  m3uUrl?: string;
  epgUrl?: string;
  // metadata
  active: boolean;
  createdAt: number;
  lastHealthCheck?: number;
  // Xtream account info
  userInfo?: XtreamUserInfo;
}

export interface XtreamUserInfo {
  username: string;
  password: string;
  message: string;
  auth: number;
  status: string;
  exp_date: string | null;
  is_trial: string;
  active_cons: string;
  created_at: string;
  max_connections: string;
  allowed_output_formats: string[];
}

export type StreamCategory = {
  category_id: string;
  category_name: string;
  parent_id: number;
};

export type LiveCategory = StreamCategory;

export interface VodCategory extends StreamCategory {}

export interface SeriesCategory extends StreamCategory {}

export interface LiveChannel {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  epg_channel_id: string | null;
  added: string;
  category_id: string;
  custom_sid: string;
  tv_archive: number;
  direct_source: string;
  tv_archive_duration: number;
}

export interface VodStream {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  rating: string;
  rating_5based: number;
  added: string;
  category_id: string;
  container_extension: string;
  custom_sid: string;
  direct_source: string;
}

export interface Series {
  num: number;
  name: string;
  series_id: number;
  cover: string;
  plot: string;
  cast: string;
  director: string;
  genre: string;
  releaseDate: string;
  last_modified: string;
  rating: string;
  rating_5based: number;
  backdrop_path: string[];
  youtube_trailer: string;
  episode_run_time: string;
  category_id: string;
}

export interface SeriesInfo {
  info: {
    movie_image?: string;
    plot?: string;
    cast?: string;
    director?: string;
    genre?: string;
    releaseDate?: string;
    rating?: string;
    duration?: string;
    backdrop_path?: string[];
    youtube_trailer?: string;
    episode_run_time?: string;
    name?: string;
  };
  seasons: SeriesSeason[];
}

export interface SeriesSeason {
  season_number: number;
  name: string;
  cover: string;
  cover_big: string;
}

export interface SeriesEpisode {
  id: string;
  episode_num: number;
  title: string;
  container_extension: string;
  info: {
    movie_image?: string;
    plot?: string;
    duration?: string;
    rating?: string;
    season?: number;
  };
  episode_info?: {
    title?: string;
    plot?: string;
  };
}

export interface VodInfo {
  info: {
    movie_image?: string;
    backdrop_path?: string[];
    youtube_trailer?: string;
    genre?: string;
    plot?: string;
    cast?: string;
    rating?: string;
    director?: string;
    releasedate?: string;
    tmdb_id?: string;
    duration?: string;
    duration_secs?: number;
    bitrate?: number;
  };
  movie_data: {
    stream_id: number;
    name: string;
    added: string;
    category_id: string;
    container_extension: string;
    direct_source: string;
  };
}

// M3U entry
export interface M3UEntry {
  name: string;
  url: string;
  logo?: string;
  tvgId?: string;
  tvgName?: string;
  groupTitle?: string;
  type: 'live' | 'vod' | 'series';
  catchup?: string;
  duration?: number;
}

// EPG
export interface EpgProgram {
  start: number;
  stop: number;
  title: string;
  desc: string;
  category: string;
  id: string;
  channel: string;
}

export interface EpgChannel {
  id: string;
  displayName: string;
  programs: EpgProgram[];
}

export interface EpgData {
  channels: Map<string, EpgChannel>;
  generatedAt: number;
}

// Health check
export type HealthStatus = 'alive' | 'dead' | 'expired' | 'unknown';

export interface HealthCheckResult {
  streamId: string;
  url: string;
  name: string;
  status: HealthStatus;
  responseTime: number;
  checkedAt: number;
  httpStatus?: number;
}

export interface HealthCheckSummary {
  total: number;
  alive: number;
  dead: number;
  expired: number;
  unknown: number;
  checkedAt: number;
}

// Buffer settings
export type BufferPreset = 'auto' | 'low_data' | 'smooth' | 'custom';

export interface BufferSettings {
  preset: BufferPreset;
  cacheSize: number; // in MB
  initialBufferMs: number; // ms to buffer before playback
  rebufferThresholdMs: number; // ms below which we rebuffer
  maxBufferMs: number; // max buffer in ms
}

// Favorites
export interface Favorite {
  id: string;
  playlistId: string;
  streamId: string;
  name: string;
  type: 'live' | 'vod' | 'series';
  logo?: string;
  addedAt: number;
}

// Watch history
export interface WatchHistoryItem {
  id: string;
  playlistId: string;
  streamId: string;
  name: string;
  type: 'live' | 'vod' | 'series';
  logo?: string;
  position: number; // seconds
  duration: number; // seconds
  watchedAt: number;
  episodeId?: string;
  episodeNum?: number;
  seasonNum?: number;
}

// Settings
export interface AppSettings {
  bufferSettings: BufferSettings;
  theme: 'dark' | 'light';
  defaultCategory: string;
  epgRefreshIntervalMin: number;
  hideDeadChannels: boolean;
  healthCheckConcurrency: number;
  healthCheckTimeoutMs: number;
}
