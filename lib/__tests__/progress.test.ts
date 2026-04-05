import {
  getProgress,
  saveWordAttempt,
  markSentenceCompleted,
  getStruggledWords,
  resetProgress,
} from "@/lib/progress";
import { Band, PronunciationTag } from "@/lib/types";

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

describe("progress", () => {
  test("getProgress returns default when empty", () => {
    const progress = getProgress();
    expect(progress.wordsAttempted).toEqual({});
    expect(progress.sessionsCompleted).toBe(0);
    expect(progress.sentencesCompleted).toEqual([]);
    expect(progress.currentLevel).toBe("beginner");
  });

  test("saveWordAttempt creates new entry", () => {
    saveWordAttempt("water", Band.NEEDS_PRACTICE, [PronunciationTag.FLAP_T]);
    const progress = getProgress();
    expect(progress.wordsAttempted["water"]).toBeDefined();
    expect(progress.wordsAttempted["water"].attempts).toBe(1);
    expect(progress.wordsAttempted["water"].lastBand).toBe(Band.NEEDS_PRACTICE);
    expect(progress.wordsAttempted["water"].bestBand).toBe(Band.NEEDS_PRACTICE);
    expect(progress.wordsAttempted["water"].tags).toContain(PronunciationTag.FLAP_T);
  });

  test("saveWordAttempt updates existing entry and tracks best", () => {
    saveWordAttempt("water", Band.NEEDS_PRACTICE, [PronunciationTag.FLAP_T]);
    saveWordAttempt("water", Band.IMPROVING, [PronunciationTag.FLAP_T]);
    const progress = getProgress();
    expect(progress.wordsAttempted["water"].attempts).toBe(2);
    expect(progress.wordsAttempted["water"].lastBand).toBe(Band.IMPROVING);
    expect(progress.wordsAttempted["water"].bestBand).toBe(Band.IMPROVING);
  });

  test("saveWordAttempt preserves best band on regression", () => {
    saveWordAttempt("water", Band.GREAT, [PronunciationTag.FLAP_T]);
    saveWordAttempt("water", Band.NEEDS_PRACTICE, [PronunciationTag.FLAP_T]);
    const progress = getProgress();
    expect(progress.wordsAttempted["water"].lastBand).toBe(Band.NEEDS_PRACTICE);
    expect(progress.wordsAttempted["water"].bestBand).toBe(Band.GREAT);
  });

  test("markSentenceCompleted adds sentence ID", () => {
    markSentenceCompleted(1);
    markSentenceCompleted(5);
    const progress = getProgress();
    expect(progress.sentencesCompleted).toEqual([1, 5]);
  });

  test("markSentenceCompleted does not duplicate", () => {
    markSentenceCompleted(1);
    markSentenceCompleted(1);
    const progress = getProgress();
    expect(progress.sentencesCompleted).toEqual([1]);
  });

  test("getStruggledWords returns words sorted by worst band", () => {
    saveWordAttempt("water", Band.NEEDS_PRACTICE, [PronunciationTag.FLAP_T]);
    saveWordAttempt("cold", Band.IMPROVING, [PronunciationTag.FINAL_CONSONANT]);
    saveWordAttempt("think", Band.GREAT, [PronunciationTag.TH_SOUND]);
    const struggled = getStruggledWords();
    expect(struggled[0].word).toBe("water");
    expect(struggled[1].word).toBe("cold");
    expect(struggled).toHaveLength(2);
  });

  test("resetProgress clears all data", () => {
    saveWordAttempt("water", Band.NEEDS_PRACTICE, [PronunciationTag.FLAP_T]);
    resetProgress();
    const progress = getProgress();
    expect(progress.wordsAttempted).toEqual({});
  });
});
