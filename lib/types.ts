// --- Enums ---

export enum Band {
  GREAT = "GREAT",
  IMPROVING = "IMPROVING",
  NEEDS_PRACTICE = "NEEDS_PRACTICE",
}

export enum FlagReason {
  TRANSCRIPT_MISMATCH = "TRANSCRIPT_MISMATCH",
  LOW_CONFIDENCE = "LOW_CONFIDENCE",
  KNOWN_DIFFICULTY = "KNOWN_DIFFICULTY",
}

export enum PronunciationTag {
  FLAP_T = "FLAP_T",
  VOWEL_SHIFT = "VOWEL_SHIFT",
  TH_SOUND = "TH_SOUND",
  STRESS_PATTERN = "STRESS_PATTERN",
  FINAL_CONSONANT = "FINAL_CONSONANT",
  R_L_DISTINCTION = "R_L_DISTINCTION",
  V_W_DISTINCTION = "V_W_DISTINCTION",
  VOWEL_REDUCTION = "VOWEL_REDUCTION",
}

// --- Sentence Bank ---

export interface FocusWord {
  word: string;
  tags: PronunciationTag[];
}

export type Category = "interview" | "public_speaking" | "customer_service" | "sales" | "social";
export type Level = "beginner" | "intermediate" | "advanced";

export interface Sentence {
  id: number;
  text: string;
  expected: string;
  tokens: string[];
  category: Category;
  level: Level;
  difficulty: number;
  focusIndices: number[];
  focus: FocusWord[];
  hint: string;
}

// --- Speech ---

export interface SpeechWordResult {
  word: string;
  confidence: number;
}

export interface SpeechResult {
  transcript: string;
  words: SpeechWordResult[];
}

// --- Analyzer ---

export interface FlaggedWord {
  index: number;
  expected: string;
  heard: string;
  confidence: number;
  reason: FlagReason;
  tags: PronunciationTag[];
}

export interface AnalyzerResult {
  flaggedWords: FlaggedWord[];
  allCorrect: boolean;
}

// --- API: /api/analyze ---

export interface AnalyzeRequest {
  sentence: {
    tokens: string[];
    focus: FocusWord[];
  };
  flaggedWords: FlaggedWord[];
}

export interface AnalyzedWord {
  index: number;
  word: string;
  status: Band;
  reason: FlagReason;
  youSaid: string;
  youSaidIpa: string;
  ipa: string;
  tip: string;
  syllables: string;
  shouldPractice: boolean;
}

export interface AnalyzeResponse {
  words: AnalyzedWord[];
  summary: string;
  encouragement: string;
}

// --- API: /api/evaluate-word ---

export interface EvaluateWordRequest {
  word: string;
  userSaid: string;
  previousBand: Band | null;
  attemptNumber: number;
}

export interface EvaluateWordResponse {
  band: Band;
  feedback: string;
  keepGoing: boolean;
}

// --- Progress (localStorage) ---

export interface WordProgress {
  attempts: number;
  lastBand: Band;
  bestBand: Band;
  lastPracticed: string;
  tags: PronunciationTag[];
}

export interface ProgressData {
  wordsAttempted: Record<string, WordProgress>;
  sessionsCompleted: number;
  sentencesCompleted: number[];
  currentLevel: Level;
  lastSessionDate: string;
}
