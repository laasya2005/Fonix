const STORAGE_KEY = "speakclear_tts_cache";

function getCache(): Record<string, string> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  return JSON.parse(raw);
}

function saveCache(cache: Record<string, string>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
}

export function getTtsCacheKey(word: string, accent: string): string {
  return `tts:${word}:${accent}`;
}

export function getCachedTts(word: string, accent: string): string | null {
  const cache = getCache();
  const key = getTtsCacheKey(word, accent);
  return cache[key] ?? null;
}

export function cacheTts(word: string, accent: string, base64Audio: string): void {
  const cache = getCache();
  const key = getTtsCacheKey(word, accent);
  cache[key] = base64Audio;
  saveCache(cache);
}
