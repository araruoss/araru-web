const featureDefaults = { offlineDownload: true, profiles: true, range: true };

export function useFeatureFlags() {
  return { flags: featureDefaults, enabled: (name, fallback = false) => featureDefaults[name] ?? fallback };
}
