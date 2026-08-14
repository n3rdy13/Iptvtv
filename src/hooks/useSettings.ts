import { useState, useEffect, useCallback } from 'react';
import type { AppSettings, BufferSettings } from '../lib/types';
import { loadSettings, saveSettings } from '../lib/storage';

const DEFAULT_SETTINGS: AppSettings = {
  bufferSettings: {
    preset: 'auto',
    cacheSize: 30,
    initialBufferMs: 1000,
    rebufferThresholdMs: 500,
    maxBufferMs: 30000,
  },
  theme: 'dark',
  defaultCategory: '',
  epgRefreshIntervalMin: 60,
  hideDeadChannels: false,
  healthCheckConcurrency: 10,
  healthCheckTimeoutMs: 10000,
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Load settings from storage on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await loadSettings();
        if (!cancelled) {
          if (stored) {
            // Merge with defaults to pick up any new keys added in future versions
            setSettings({ ...DEFAULT_SETTINGS, ...stored });
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateSettings = useCallback(
    (partial: Partial<AppSettings>): void => {
      setSettings((prev) => {
        const updated = { ...prev, ...partial };
        saveSettings(updated);
        return updated;
      });
    },
    [],
  );

  const updateBufferSettings = useCallback(
    (partial: Partial<BufferSettings>): void => {
      setSettings((prev) => {
        const updated = {
          ...prev,
          bufferSettings: { ...prev.bufferSettings, ...partial },
        };
        saveSettings(updated);
        return updated;
      });
    },
    [],
  );

  return {
    settings,
    updateSettings,
    updateBufferSettings,
  };
}
