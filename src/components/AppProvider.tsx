import React, { createContext, useContext, type ReactNode } from 'react';
import { usePlaylists } from '../hooks/usePlaylists';
import { useContent } from '../hooks/useContent';
import { useFavorites } from '../hooks/useFavorites';
import { useHistory } from '../hooks/useHistory';
import { useSettings } from '../hooks/useSettings';

type AppContextType = {
  playlists: ReturnType<typeof usePlaylists>;
  content: ReturnType<typeof useContent>;
  favorites: ReturnType<typeof useFavorites>;
  history: ReturnType<typeof useHistory>;
  settings: ReturnType<typeof useSettings>;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const playlists = usePlaylists();
  const content = useContent();
  const favorites = useFavorites();
  const history = useHistory();
  const settings = useSettings();

  return (
    <AppContext.Provider value={{ playlists, content, favorites, history, settings }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
}
