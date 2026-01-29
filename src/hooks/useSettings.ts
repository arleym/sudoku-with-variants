import { useState, useEffect, useCallback } from 'react';
import type { GameSettings } from '../types/settings';
import { defaultSettings } from '../types/settings';

const STORAGE_KEY = 'sudoku-settings';

function loadSettings(): GameSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.warn('Failed to load settings:', e);
  }
  return defaultSettings;
}

function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings:', e);
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<GameSettings>(loadSettings);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof GameSettings>(
    key: K,
    value: GameSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleSetting = useCallback((key: keyof GameSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  return {
    settings,
    updateSetting,
    toggleSetting,
    resetSettings,
  };
}
