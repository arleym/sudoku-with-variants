import { useState, useEffect, useCallback } from 'react';
import type { GameSettings, ColorMode } from '../types/settings';
import { defaultSettings } from '../types/settings';

const STORAGE_KEY = 'sudoku-settings';

function loadSettings(): GameSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = { ...defaultSettings, ...JSON.parse(stored) };
      // Migrate old 'autumn' value to 'autumn-dark'
      if (parsed.colorMode === 'autumn') parsed.colorMode = 'autumn-dark';
      return parsed;
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

function getResolvedTheme(mode: ColorMode): string {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

function applyTheme(mode: ColorMode) {
  const resolved = getResolvedTheme(mode);
  document.documentElement.setAttribute('data-theme', resolved);
}

export function useSettings() {
  const [settings, setSettings] = useState<GameSettings>(loadSettings);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Apply theme on mount and when colorMode changes
  useEffect(() => {
    applyTheme(settings.colorMode);

    if (settings.colorMode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('system');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [settings.colorMode]);

  const updateSetting = useCallback(<K extends keyof GameSettings>(
    key: K,
    value: GameSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleSetting = useCallback((key: keyof GameSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const setColorMode = useCallback((mode: ColorMode) => {
    setSettings(prev => ({ ...prev, colorMode: mode }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  return {
    settings,
    updateSetting,
    toggleSetting,
    setColorMode,
    resetSettings,
  };
}
