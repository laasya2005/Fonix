import { Band, type Level, type ProgressData, type PronunciationTag } from "./types";

const STORAGE_KEY = "speakclear_progress";

const BAND_RANK: Record<Band, number> = {
  [Band.NEEDS_PRACTICE]: 0,
  [Band.IMPROVING]: 1,
  [Band.GREAT]: 2,
};

function getDefaultProgress(): ProgressData {
  return {
    wordsAttempted: {},
    sessionsCompleted: 0,
    sentencesCompleted: [],
    currentLevel: "beginner",
    lastSessionDate: "",
  };
}

export function getProgress(): ProgressData {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return getDefaultProgress();
  return JSON.parse(raw) as ProgressData;
}

function saveProgress(data: ProgressData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function saveWordAttempt(
  word: string,
  band: Band,
  tags: PronunciationTag[]
): void {
  const progress = getProgress();
  const existing = progress.wordsAttempted[word];

  if (existing) {
    existing.attempts += 1;
    existing.lastBand = band;
    if (BAND_RANK[band] > BAND_RANK[existing.bestBand]) {
      existing.bestBand = band;
    }
    existing.lastPracticed = new Date().toISOString();
    const tagSet = new Set([...existing.tags, ...tags]);
    existing.tags = [...tagSet];
  } else {
    progress.wordsAttempted[word] = {
      attempts: 1,
      lastBand: band,
      bestBand: band,
      lastPracticed: new Date().toISOString(),
      tags,
    };
  }

  saveProgress(progress);
}

export function markSentenceCompleted(sentenceId: number): void {
  const progress = getProgress();
  if (!progress.sentencesCompleted.includes(sentenceId)) {
    progress.sentencesCompleted.push(sentenceId);
  }
  saveProgress(progress);
}

export function getStruggledWords(): Array<{
  word: string;
  band: Band;
  attempts: number;
  tags: PronunciationTag[];
}> {
  const progress = getProgress();
  return Object.entries(progress.wordsAttempted)
    .filter(([, wp]) => wp.bestBand !== Band.GREAT)
    .map(([word, wp]) => ({
      word,
      band: wp.lastBand,
      attempts: wp.attempts,
      tags: wp.tags,
    }))
    .sort((a, b) => BAND_RANK[a.band] - BAND_RANK[b.band]);
}

export function resetProgress(): void {
  localStorage.removeItem(STORAGE_KEY);
}
