import { Routes, Route, Navigate } from 'react-router-dom';
import { TabLayout } from './pages/TabLayout';
import HomeScreen from './pages/Home';
import LiveScreen from './pages/Live';
import MoviesScreen from './pages/Movies';
import SeriesScreen from './pages/Series';
import SettingsScreen from './pages/Settings';
import AddPlaylistScreen from './pages/AddPlaylist';
import PlayerScreen from './pages/Player';
import VodDetailScreen from './pages/VodDetail';
import SeriesDetailScreen from './pages/SeriesDetail';
import EpgScreen from './pages/Epg';
import HealthScreen from './pages/Health';
import FavoritesScreen from './pages/Favorites';
import HistoryScreen from './pages/History';
import NotFoundScreen from './pages/NotFound';

export function App() {
  return (
    <Routes>
      <Route element={<TabLayout />}>
        <Route index element={<HomeScreen />} />
        <Route path="live" element={<LiveScreen />} />
        <Route path="movies" element={<MoviesScreen />} />
        <Route path="series" element={<SeriesScreen />} />
        <Route path="settings" element={<SettingsScreen />} />
      </Route>
      <Route path="add-playlist" element={<AddPlaylistScreen />} />
      <Route path="player" element={<PlayerScreen />} />
      <Route path="vod-detail" element={<VodDetailScreen />} />
      <Route path="series-detail" element={<SeriesDetailScreen />} />
      <Route path="epg" element={<EpgScreen />} />
      <Route path="health" element={<HealthScreen />} />
      <Route path="favorites" element={<FavoritesScreen />} />
      <Route path="history" element={<HistoryScreen />} />
      <Route path="*" element={<NotFoundScreen />} />
    </Routes>
  );
}
