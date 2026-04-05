import { getTtsCacheKey, getCachedTts, cacheTts } from "@/lib/tts-cache";

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
};
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
});

describe("tts-cache", () => {
  test("getTtsCacheKey formats correctly", () => {
    expect(getTtsCacheKey("water", "us")).toBe("tts:water:us");
  });

  test("getCachedTts returns null when not cached", () => {
    expect(getCachedTts("water", "us")).toBeNull();
  });

  test("cacheTts stores and getCachedTts retrieves", () => {
    cacheTts("water", "us", "base64audiodata");
    expect(getCachedTts("water", "us")).toBe("base64audiodata");
  });
});
