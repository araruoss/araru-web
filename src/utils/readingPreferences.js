import { useCallback, useEffect, useState } from 'react';
import { getActiveReadingProfile, getStorageItem, setStorageItem } from './localStorage.js';

export const READING_PREFERENCES_DEFAULTS = {
  readerTheme: 'system', fontFamily: 'serif', fontSize: 100, lineHeight: 1.6,
  letterSpacing: 0, margins: 'comfortable', contentWidth: 'medium', readingMode: 'page',
  navigationDirection: 'horizontal', pageAnimation: 'smooth', showProgress: true,
  tapControls: true, autoHideControls: true, fullscreen: false, resume: true,
  history: true, completionThreshold: 95, comicLayout: 'single', comicFit: 'width'
};

function preferencesKey(userId) {
  const profile = getActiveReadingProfile() || 'default';
  return `araru:reading-preferences:v2:${userId || 'anonymous'}:${profile}`;
}

export function readReadingPreferences(userId) {
  return { ...READING_PREFERENCES_DEFAULTS, ...getStorageItem(preferencesKey(userId), {}) };
}

export function saveReadingPreferences(userId, preferences) {
  const next = { ...READING_PREFERENCES_DEFAULTS, ...preferences };
  setStorageItem(preferencesKey(userId), next);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('araru:reading-preferences-changed'));
  return next;
}

export function useReadingPreferences(userId) {
  const [preferences, setPreferences] = useState(() => readReadingPreferences(userId));
  useEffect(() => setPreferences(readReadingPreferences(userId)), [userId]);
  const update = useCallback((field, value) => {
    setPreferences((current) => saveReadingPreferences(userId, { ...current, [field]: value }));
  }, [userId]);
  return { preferences, update, reset: () => setPreferences(saveReadingPreferences(userId, READING_PREFERENCES_DEFAULTS)) };
}
