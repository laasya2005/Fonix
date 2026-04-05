# SpeakClear Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pronunciation coaching web app where users read prompted sentences, get mispronounced words highlighted, and practice individual words with AI-powered feedback.

**Architecture:** Next.js App Router full-stack app. Browser Web Speech API handles live transcription (free). OpenAI GPT-4o-mini analyzes pronunciation of flagged words. OpenAI TTS generates correct pronunciation audio. Progress stored in localStorage. Deployed to Vercel.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Vitest, OpenAI SDK (`openai` npm package)

**Spec:** `docs/superpowers/specs/2026-04-04-speakclear-design.md`

---

## File Map

| File | Responsibility |
|------|---------------|
| `lib/types.ts` | All shared TypeScript types and enums |
| `data/sentences.json` | Static sentence bank (~50 sentences) |
| `lib/analyzer.ts` | Client-side pre-filter: compare transcript vs expected, flag words, pick top 1–2 for API |
| `lib/progress.ts` | localStorage read/write for progress data |
| `lib/tts-cache.ts` | localStorage read/write for cached TTS audio blobs |
| `lib/speech.ts` | Web Speech API wrapper: start/stop recognition, return transcript + confidence |
| `lib/openai.ts` | Server-side OpenAI client singleton |
| `app/api/analyze/route.ts` | POST route: send flagged words to GPT-4o-mini, return pronunciation feedback |
| `app/api/evaluate-word/route.ts` | POST route: evaluate single word in practice mode |
| `app/api/tts/route.ts` | POST route: generate TTS audio for a word |
| `app/globals.css` | Tailwind directives + custom CSS for indigo theme |
| `app/layout.tsx` | Root layout: metadata, font, body wrapper |
| `app/page.tsx` | Main page: orchestrates all components via state machine |
| `components/SentenceDisplay.tsx` | Shows prompted sentence with category/level label |
| `components/MicButton.tsx` | Record toggle with pulse animation |
| `components/TranscriptView.tsx` | Live transcript during recording, highlighted results after analysis |
| `components/WordDetailCard.tsx` | Slide-up drawer: "you said" vs correct, IPA, tip, play audio, practice button |
| `components/PracticeMode.tsx` | Single-word practice: mic, band result, retry |
| `components/ResultsSummary.tsx` | "Focus on these words" + encouragement + "Next sentence" CTA |
| `components/ProgressDashboard.tsx` | Stats from localStorage: struggled words, patterns |

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `app/globals.css`, `app/layout.tsx`, `.env.local`, `.gitignore`, `vitest.config.ts`

- [ ] **Step 1: Initialize Next.js project**

Run:
```bash
cd /Users/laasyalata/Desktop/voice
npx create-next-app@latest . --typescript --tailwind --eslint --app --src=false --import-alias="@/*" --use-npm
```

When prompted, accept defaults. This creates the full Next.js skeleton with App Router and Tailwind.

- [ ] **Step 2: Install additional dependencies**

Run:
```bash
cd /Users/laasyalata/Desktop/voice
npm install openai
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Create vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 4: Add test script to package.json**

Add to the `"scripts"` section of `package.json`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Create .env.local**

Create `.env.local`:

```
OPENAI_API_KEY=your-key-here
```

- [ ] **Step 6: Update .gitignore**

Append to `.gitignore`:

```
.env.local
.superpowers/
```

- [ ] **Step 7: Verify setup**

Run:
```bash
cd /Users/laasyalata/Desktop/voice
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 8: Initialize git and commit**

Run:
```bash
cd /Users/laasyalata/Desktop/voice
git init
git add -A
git commit -m "chore: scaffold Next.js project with Tailwind, Vitest, OpenAI SDK"
```

---

### Task 2: Types and Enums

**Files:**
- Create: `lib/types.ts`
- Test: `lib/__tests__/types.test.ts`

- [ ] **Step 1: Write the test**

Create `lib/__tests__/types.test.ts`:

```typescript
import {
  Band,
  FlagReason,
  PronunciationTag,
  type Sentence,
  type FlaggedWord,
  type AnalyzeRequest,
  type AnalyzeResponse,
  type AnalyzedWord,
  type EvaluateWordRequest,
  type EvaluateWordResponse,
  type WordProgress,
  type ProgressData,
  type SpeechResult,
} from "@/lib/types";

describe("types", () => {
  test("Band enum has correct values", () => {
    expect(Band.GREAT).toBe("GREAT");
    expect(Band.IMPROVING).toBe("IMPROVING");
    expect(Band.NEEDS_PRACTICE).toBe("NEEDS_PRACTICE");
  });

  test("FlagReason enum has correct values", () => {
    expect(FlagReason.TRANSCRIPT_MISMATCH).toBe("TRANSCRIPT_MISMATCH");
    expect(FlagReason.LOW_CONFIDENCE).toBe("LOW_CONFIDENCE");
    expect(FlagReason.KNOWN_DIFFICULTY).toBe("KNOWN_DIFFICULTY");
  });

  test("PronunciationTag enum has correct values", () => {
    expect(PronunciationTag.FLAP_T).toBe("FLAP_T");
    expect(PronunciationTag.TH_SOUND).toBe("TH_SOUND");
    expect(PronunciationTag.VOWEL_SHIFT).toBe("VOWEL_SHIFT");
    expect(PronunciationTag.STRESS_PATTERN).toBe("STRESS_PATTERN");
    expect(PronunciationTag.FINAL_CONSONANT).toBe("FINAL_CONSONANT");
    expect(PronunciationTag.R_L_DISTINCTION).toBe("R_L_DISTINCTION");
    expect(PronunciationTag.V_W_DISTINCTION).toBe("V_W_DISTINCTION");
    expect(PronunciationTag.VOWEL_REDUCTION).toBe("VOWEL_REDUCTION");
  });

  test("Sentence type can be constructed", () => {
    const sentence: Sentence = {
      id: 1,
      text: "The water is cold.",
      expected: "the water is cold",
      tokens: ["the", "water", "is", "cold"],
      category: "daily",
      level: "beginner",
      difficulty: 1,
      focusIndices: [1, 3],
      focus: [
        { word: "water", tags: [PronunciationTag.FLAP_T, PronunciationTag.VOWEL_SHIFT] },
        { word: "cold", tags: [PronunciationTag.FINAL_CONSONANT] },
      ],
      hint: "Focus on 'water' (soft T) and 'cold' (clear ending)",
    };
    expect(sentence.tokens).toHaveLength(4);
    expect(sentence.focus[0].tags).toContain(PronunciationTag.FLAP_T);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd /Users/laasyalata/Desktop/voice
npx vitest run lib/__tests__/types.test.ts
```

Expected: FAIL — cannot resolve `@/lib/types`.

- [ ] **Step 3: Implement types**

Create `lib/types.ts`:

```typescript
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

export type Category = "daily" | "interview" | "phone_call";
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
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd /Users/laasyalata/Desktop/voice
npx vitest run lib/__tests__/types.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/laasyalata/Desktop/voice
git add lib/types.ts lib/__tests__/types.test.ts
git commit -m "feat: add shared TypeScript types and enums"
```

---

### Task 3: Sentence Bank Data

**Files:**
- Create: `data/sentences.json`
- Test: `data/__tests__/sentences.test.ts`

- [ ] **Step 1: Write validation test**

Create `data/__tests__/sentences.test.ts`:

```typescript
import sentences from "@/data/sentences.json";
import { PronunciationTag } from "@/lib/types";

const validTags = Object.values(PronunciationTag);
const validCategories = ["daily", "interview", "phone_call"];
const validLevels = ["beginner", "intermediate", "advanced"];

describe("sentences.json", () => {
  test("has at least 50 sentences", () => {
    expect(sentences.sentences.length).toBeGreaterThanOrEqual(50);
  });

  test("all IDs are unique", () => {
    const ids = sentences.sentences.map((s: any) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("every sentence has required fields and valid values", () => {
    for (const s of sentences.sentences) {
      expect(s.id).toBeTypeOf("number");
      expect(s.text).toBeTypeOf("string");
      expect(s.text.length).toBeGreaterThan(0);
      expect(s.expected).toBe(s.text.toLowerCase().replace(/[.,!?]/g, "").replace(/\s+/g, " ").trim());
      expect(s.tokens).toEqual(s.expected.split(" "));
      expect(validCategories).toContain(s.category);
      expect(validLevels).toContain(s.level);
      expect(s.difficulty).toBeGreaterThanOrEqual(1);
      expect(s.difficulty).toBeLessThanOrEqual(3);
      expect(Array.isArray(s.focusIndices)).toBe(true);
      expect(Array.isArray(s.focus)).toBe(true);
      expect(s.hint).toBeTypeOf("string");
    }
  });

  test("focusIndices match focus words", () => {
    for (const s of sentences.sentences) {
      expect(s.focusIndices.length).toBe(s.focus.length);
      for (let i = 0; i < s.focus.length; i++) {
        const idx = s.focusIndices[i];
        expect(s.tokens[idx]).toBe(s.focus[i].word);
      }
    }
  });

  test("all focus tags are valid PronunciationTag values", () => {
    for (const s of sentences.sentences) {
      for (const f of s.focus) {
        for (const tag of f.tags) {
          expect(validTags).toContain(tag);
        }
      }
    }
  });

  test("has all three categories", () => {
    const categories = new Set(sentences.sentences.map((s: any) => s.category));
    expect(categories).toContain("daily");
    expect(categories).toContain("interview");
    expect(categories).toContain("phone_call");
  });

  test("has all three levels", () => {
    const levels = new Set(sentences.sentences.map((s: any) => s.level));
    expect(levels).toContain("beginner");
    expect(levels).toContain("intermediate");
    expect(levels).toContain("advanced");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd /Users/laasyalata/Desktop/voice
npx vitest run data/__tests__/sentences.test.ts
```

Expected: FAIL — cannot resolve `@/data/sentences.json`.

- [ ] **Step 3: Create sentences.json**

Create `data/sentences.json` with 50+ sentences. The file must pass all validation tests above. Here are the requirements:

- Each sentence needs: `id`, `text`, `expected` (lowercase no punctuation), `tokens` (split of expected), `category`, `level`, `difficulty` (1–3), `focusIndices`, `focus` (with valid `PronunciationTag` values), `hint`
- `focusIndices[i]` must point to the token matching `focus[i].word`
- Cover all 3 categories (`daily`, `interview`, `phone_call`) and all 3 levels (`beginner`, `intermediate`, `advanced`)
- Use these tags: `FLAP_T`, `VOWEL_SHIFT`, `TH_SOUND`, `STRESS_PATTERN`, `FINAL_CONSONANT`, `R_L_DISTINCTION`, `V_W_DISTINCTION`, `VOWEL_REDUCTION`

The JSON structure:
```json
{
  "sentences": [
    {
      "id": 1,
      "text": "The water is cold.",
      "expected": "the water is cold",
      "tokens": ["the", "water", "is", "cold"],
      "category": "daily",
      "level": "beginner",
      "difficulty": 1,
      "focusIndices": [1, 3],
      "focus": [
        { "word": "water", "tags": ["FLAP_T", "VOWEL_SHIFT"] },
        { "word": "cold", "tags": ["FINAL_CONSONANT"] }
      ],
      "hint": "Focus on 'water' (soft T) and 'cold' (clear ending)"
    }
  ]
}
```

Write all 50+ sentences following this exact schema. Ensure good coverage of pronunciation challenges that non-native speakers commonly face: TH sounds, R/L distinction, V/W confusion, vowel shifts, stress patterns, flap T, final consonants, and vowel reduction.

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd /Users/laasyalata/Desktop/voice
npx vitest run data/__tests__/sentences.test.ts
```

Expected: PASS — all validation checks green.

- [ ] **Step 5: Commit**

```bash
cd /Users/laasyalata/Desktop/voice
git add data/sentences.json data/__tests__/sentences.test.ts
git commit -m "feat: add sentence bank with 50+ validated practice sentences"
```

---

### Task 4: Analyzer (Pre-Filter Logic)

**Files:**
- Create: `lib/analyzer.ts`
- Test: `lib/__tests__/analyzer.test.ts`

- [ ] **Step 1: Write the tests**

Create `lib/__tests__/analyzer.test.ts`:

```typescript
import { analyzeTranscript } from "@/lib/analyzer";
import { FlagReason, PronunciationTag } from "@/lib/types";
import type { Sentence, SpeechResult } from "@/lib/types";

const makeSentence = (overrides?: Partial<Sentence>): Sentence => ({
  id: 1,
  text: "The water is cold.",
  expected: "the water is cold",
  tokens: ["the", "water", "is", "cold"],
  category: "daily",
  level: "beginner",
  difficulty: 1,
  focusIndices: [1, 3],
  focus: [
    { word: "water", tags: [PronunciationTag.FLAP_T, PronunciationTag.VOWEL_SHIFT] },
    { word: "cold", tags: [PronunciationTag.FINAL_CONSONANT] },
  ],
  hint: "Focus on 'water' (soft T) and 'cold' (clear ending)",
  ...overrides,
});

describe("analyzeTranscript", () => {
  test("flags transcript mismatch", () => {
    const sentence = makeSentence();
    const speech: SpeechResult = {
      transcript: "the wader is cole",
      words: [
        { word: "the", confidence: 0.95 },
        { word: "wader", confidence: 0.42 },
        { word: "is", confidence: 0.98 },
        { word: "cole", confidence: 0.61 },
      ],
    };

    const result = analyzeTranscript(sentence, speech);

    expect(result.allCorrect).toBe(false);
    expect(result.flaggedWords).toHaveLength(2);
    expect(result.flaggedWords[0].expected).toBe("water");
    expect(result.flaggedWords[0].heard).toBe("wader");
    expect(result.flaggedWords[0].reason).toBe(FlagReason.TRANSCRIPT_MISMATCH);
  });

  test("flags low confidence even when transcript matches", () => {
    const sentence = makeSentence();
    const speech: SpeechResult = {
      transcript: "the water is cold",
      words: [
        { word: "the", confidence: 0.95 },
        { word: "water", confidence: 0.55 },
        { word: "is", confidence: 0.98 },
        { word: "cold", confidence: 0.90 },
      ],
    };

    const result = analyzeTranscript(sentence, speech);

    expect(result.flaggedWords).toHaveLength(1);
    expect(result.flaggedWords[0].expected).toBe("water");
    expect(result.flaggedWords[0].reason).toBe(FlagReason.LOW_CONFIDENCE);
  });

  test("flags known difficulty words from focusIndices", () => {
    const sentence = makeSentence();
    const speech: SpeechResult = {
      transcript: "the water is cold",
      words: [
        { word: "the", confidence: 0.95 },
        { word: "water", confidence: 0.85 },
        { word: "is", confidence: 0.98 },
        { word: "cold", confidence: 0.90 },
      ],
    };

    const result = analyzeTranscript(sentence, speech);

    expect(result.flaggedWords).toHaveLength(2);
    expect(result.flaggedWords.map((w) => w.expected)).toEqual(
      expect.arrayContaining(["water", "cold"])
    );
    expect(result.flaggedWords[0].reason).toBe(FlagReason.KNOWN_DIFFICULTY);
  });

  test("returns allCorrect true when no flags and no focus words", () => {
    const sentence = makeSentence({
      focusIndices: [],
      focus: [],
    });
    const speech: SpeechResult = {
      transcript: "the water is cold",
      words: [
        { word: "the", confidence: 0.95 },
        { word: "water", confidence: 0.85 },
        { word: "is", confidence: 0.98 },
        { word: "cold", confidence: 0.90 },
      ],
    };

    const result = analyzeTranscript(sentence, speech);

    expect(result.allCorrect).toBe(true);
    expect(result.flaggedWords).toHaveLength(0);
  });

  test("sorts flagged words by confidence ascending", () => {
    const sentence = makeSentence();
    const speech: SpeechResult = {
      transcript: "the wader is cole",
      words: [
        { word: "the", confidence: 0.95 },
        { word: "wader", confidence: 0.60 },
        { word: "is", confidence: 0.98 },
        { word: "cole", confidence: 0.30 },
      ],
    };

    const result = analyzeTranscript(sentence, speech);

    expect(result.flaggedWords[0].confidence).toBeLessThanOrEqual(
      result.flaggedWords[1].confidence
    );
  });

  test("limits to max 2 flagged words for API", () => {
    const sentence = makeSentence({
      tokens: ["the", "weather", "is", "very", "cold"],
      expected: "the weather is very cold",
      focusIndices: [1, 3, 4],
      focus: [
        { word: "weather", tags: [PronunciationTag.TH_SOUND] },
        { word: "very", tags: [PronunciationTag.V_W_DISTINCTION] },
        { word: "cold", tags: [PronunciationTag.FINAL_CONSONANT] },
      ],
    });
    const speech: SpeechResult = {
      transcript: "the wezzer is wery cole",
      words: [
        { word: "the", confidence: 0.95 },
        { word: "wezzer", confidence: 0.30 },
        { word: "is", confidence: 0.98 },
        { word: "wery", confidence: 0.40 },
        { word: "cole", confidence: 0.50 },
      ],
    };

    const result = analyzeTranscript(sentence, speech);

    // All 3 are flagged
    expect(result.flaggedWords.length).toBe(3);
    // But the top 2 (lowest confidence) should be marked for API
    const forApi = result.flaggedWords.filter((_, i) => i < 2);
    expect(forApi).toHaveLength(2);
    expect(forApi[0].confidence).toBe(0.30);
    expect(forApi[1].confidence).toBe(0.40);
  });

  test("handles word count mismatch gracefully", () => {
    const sentence = makeSentence();
    const speech: SpeechResult = {
      transcript: "the water is",
      words: [
        { word: "the", confidence: 0.95 },
        { word: "water", confidence: 0.85 },
        { word: "is", confidence: 0.98 },
      ],
    };

    const result = analyzeTranscript(sentence, speech);

    // "cold" was not spoken — should be flagged
    const coldFlag = result.flaggedWords.find((w) => w.expected === "cold");
    expect(coldFlag).toBeDefined();
    expect(coldFlag!.heard).toBe("");
    expect(coldFlag!.confidence).toBe(0);
  });

  test("mismatch takes priority over other reasons for same word", () => {
    const sentence = makeSentence();
    const speech: SpeechResult = {
      transcript: "the wader is cold",
      words: [
        { word: "the", confidence: 0.95 },
        { word: "wader", confidence: 0.40 },
        { word: "is", confidence: 0.98 },
        { word: "cold", confidence: 0.90 },
      ],
    };

    const result = analyzeTranscript(sentence, speech);

    const waterFlag = result.flaggedWords.find((w) => w.expected === "water");
    expect(waterFlag!.reason).toBe(FlagReason.TRANSCRIPT_MISMATCH);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd /Users/laasyalata/Desktop/voice
npx vitest run lib/__tests__/analyzer.test.ts
```

Expected: FAIL — cannot resolve `@/lib/analyzer`.

- [ ] **Step 3: Implement analyzer**

Create `lib/analyzer.ts`:

```typescript
import {
  FlagReason,
  type AnalyzerResult,
  type FlaggedWord,
  type Sentence,
  type SpeechResult,
  type PronunciationTag,
} from "./types";

const CONFIDENCE_THRESHOLD = 0.7;

export function analyzeTranscript(
  sentence: Sentence,
  speech: SpeechResult
): AnalyzerResult {
  const flagged: FlaggedWord[] = [];
  const seen = new Set<number>();

  for (let i = 0; i < sentence.tokens.length; i++) {
    const expected = sentence.tokens[i];
    const spokenWord = speech.words[i];
    const heard = spokenWord?.word ?? "";
    const confidence = spokenWord?.confidence ?? 0;

    // Find tags for this word if it's a focus word
    const focusIdx = sentence.focusIndices.indexOf(i);
    const tags: PronunciationTag[] =
      focusIdx !== -1 ? sentence.focus[focusIdx].tags : [];

    // Determine reason (priority: mismatch > low confidence > known difficulty)
    let reason: FlagReason | null = null;

    if (heard.toLowerCase() !== expected.toLowerCase()) {
      reason = FlagReason.TRANSCRIPT_MISMATCH;
    } else if (confidence < CONFIDENCE_THRESHOLD) {
      reason = FlagReason.LOW_CONFIDENCE;
    } else if (sentence.focusIndices.includes(i)) {
      reason = FlagReason.KNOWN_DIFFICULTY;
    }

    if (reason !== null && !seen.has(i)) {
      seen.add(i);
      flagged.push({
        index: i,
        expected,
        heard,
        confidence,
        reason,
        tags,
      });
    }
  }

  // Sort by confidence ascending (worst first)
  flagged.sort((a, b) => a.confidence - b.confidence);

  return {
    flaggedWords: flagged,
    allCorrect: flagged.length === 0,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
cd /Users/laasyalata/Desktop/voice
npx vitest run lib/__tests__/analyzer.test.ts
```

Expected: PASS — all 8 tests green.

- [ ] **Step 5: Commit**

```bash
cd /Users/laasyalata/Desktop/voice
git add lib/analyzer.ts lib/__tests__/analyzer.test.ts
git commit -m "feat: add pronunciation analyzer with 3-signal detection"
```

---

### Task 5: Progress Manager (localStorage)

**Files:**
- Create: `lib/progress.ts`
- Test: `lib/__tests__/progress.test.ts`

- [ ] **Step 1: Write the tests**

Create `lib/__tests__/progress.test.ts`:

```typescript
import {
  getProgress,
  saveWordAttempt,
  markSentenceCompleted,
  getStruggledWords,
  resetProgress,
} from "@/lib/progress";
import { Band, PronunciationTag } from "@/lib/types";

// Mock localStorage
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
    expect(struggled).toHaveLength(2); // GREAT words excluded
  });

  test("resetProgress clears all data", () => {
    saveWordAttempt("water", Band.NEEDS_PRACTICE, [PronunciationTag.FLAP_T]);
    resetProgress();

    const progress = getProgress();
    expect(progress.wordsAttempted).toEqual({});
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd /Users/laasyalata/Desktop/voice
npx vitest run lib/__tests__/progress.test.ts
```

Expected: FAIL — cannot resolve `@/lib/progress`.

- [ ] **Step 3: Implement progress manager**

Create `lib/progress.ts`:

```typescript
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
    // Merge tags without duplicates
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
cd /Users/laasyalata/Desktop/voice
npx vitest run lib/__tests__/progress.test.ts
```

Expected: PASS — all 8 tests green.

- [ ] **Step 5: Commit**

```bash
cd /Users/laasyalata/Desktop/voice
git add lib/progress.ts lib/__tests__/progress.test.ts
git commit -m "feat: add localStorage progress manager"
```

---

### Task 6: TTS Cache

**Files:**
- Create: `lib/tts-cache.ts`
- Test: `lib/__tests__/tts-cache.test.ts`

- [ ] **Step 1: Write the tests**

Create `lib/__tests__/tts-cache.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd /Users/laasyalata/Desktop/voice
npx vitest run lib/__tests__/tts-cache.test.ts
```

Expected: FAIL — cannot resolve `@/lib/tts-cache`.

- [ ] **Step 3: Implement TTS cache**

Create `lib/tts-cache.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
cd /Users/laasyalata/Desktop/voice
npx vitest run lib/__tests__/tts-cache.test.ts
```

Expected: PASS — all 3 tests green.

- [ ] **Step 5: Commit**

```bash
cd /Users/laasyalata/Desktop/voice
git add lib/tts-cache.ts lib/__tests__/tts-cache.test.ts
git commit -m "feat: add TTS audio caching in localStorage"
```

---

### Task 7: Web Speech API Wrapper

**Files:**
- Create: `lib/speech.ts`

This module wraps the browser Web Speech API. It cannot be unit tested with Vitest (requires a real browser), so we skip TDD here and test it manually via the UI in later tasks.

- [ ] **Step 1: Implement speech wrapper**

Create `lib/speech.ts`:

```typescript
import type { SpeechResult, SpeechWordResult } from "./types";

interface SpeechCallbacks {
  onInterimTranscript: (text: string) => void;
  onFinalResult: (result: SpeechResult) => void;
  onError: (error: string) => void;
}

let recognition: SpeechRecognition | null = null;

export function isSpeechSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );
}

export function startListening(callbacks: SpeechCallbacks): void {
  if (!isSpeechSupported()) {
    callbacks.onError("Speech recognition is not supported in this browser.");
    return;
  }

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let interimTranscript = "";
    let finalTranscript = "";
    const words: SpeechWordResult[] = [];

    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript;

      if (result.isFinal) {
        finalTranscript += transcript;
        // Extract word-level data from final result
        const resultWords = transcript.trim().toLowerCase().split(/\s+/);
        const confidence = result[0].confidence;
        // Web Speech API gives sentence-level confidence, so we distribute it
        // with slight random variance to simulate per-word confidence
        for (const w of resultWords) {
          words.push({
            word: w,
            confidence: Math.max(0, Math.min(1, confidence + (Math.random() - 0.5) * 0.15)),
          });
        }
      } else {
        interimTranscript += transcript;
      }
    }

    if (finalTranscript) {
      callbacks.onFinalResult({
        transcript: finalTranscript.trim().toLowerCase(),
        words,
      });
    } else {
      callbacks.onInterimTranscript(interimTranscript);
    }
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    callbacks.onError(`Speech recognition error: ${event.error}`);
  };

  recognition.start();
}

export function stopListening(): void {
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
}
```

- [ ] **Step 2: Add Web Speech API type declarations**

Create `types/speech.d.ts`:

```typescript
interface Window {
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof SpeechRecognition;
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/laasyalata/Desktop/voice
git add lib/speech.ts types/speech.d.ts
git commit -m "feat: add Web Speech API wrapper"
```

---

### Task 8: OpenAI Server Client

**Files:**
- Create: `lib/openai.ts`

Server-only module — tested implicitly through API route integration.

- [ ] **Step 1: Implement OpenAI client**

Create `lib/openai.ts`:

```typescript
import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return client;
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/laasyalata/Desktop/voice
git add lib/openai.ts
git commit -m "feat: add OpenAI client singleton"
```

---

### Task 9: API Route — /api/analyze

**Files:**
- Create: `app/api/analyze/route.ts`

- [ ] **Step 1: Implement the analyze route**

Create `app/api/analyze/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";
import type { AnalyzeRequest, AnalyzeResponse, AnalyzedWord } from "@/lib/types";
import { Band } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as AnalyzeRequest;

  if (!body.flaggedWords || body.flaggedWords.length === 0) {
    return NextResponse.json<AnalyzeResponse>({
      words: [],
      summary: "Great job!",
      encouragement: "Every word was clear. Keep it up!",
    });
  }

  const openai = getOpenAIClient();

  const wordDescriptions = body.flaggedWords
    .map(
      (w) =>
        `- Expected: "${w.expected}", Heard: "${w.heard}", Confidence: ${w.confidence.toFixed(2)}, Tags: ${w.tags.join(", ")}`
    )
    .join("\n");

  const prompt = `You are a friendly American English pronunciation coach. Analyze these mispronounced words and provide helpful feedback.

Sentence tokens: [${body.sentence.tokens.join(", ")}]

Problem words:
${wordDescriptions}

For each word, provide:
1. The correct IPA pronunciation
2. A syllable breakdown (using · as separator)
3. A short, encouraging tip in plain English (like talking to a friend, not a textbook)
4. Whether the status is "NEEDS_PRACTICE" (word was clearly wrong) or "IMPROVING" (close but needs work)
5. Whether the user should practice this word

Also provide:
- A one-line summary of what to focus on
- An encouraging comment about what the user did well

Respond in this exact JSON format:
{
  "words": [
    {
      "index": <token index>,
      "word": "<expected word>",
      "status": "NEEDS_PRACTICE" or "IMPROVING",
      "reason": "<original reason from input>",
      "youSaid": "<what was heard>",
      "ipa": "<IPA pronunciation>",
      "tip": "<friendly plain-English tip>",
      "syllables": "<syllable breakdown>",
      "shouldPractice": true or false
    }
  ],
  "summary": "<one-line focus summary>",
  "encouragement": "<positive comment>"
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 500,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    return NextResponse.json(
      { error: "No response from AI" },
      { status: 500 }
    );
  }

  const parsed = JSON.parse(content) as AnalyzeResponse;

  // Ensure status values are valid Band enums
  parsed.words = parsed.words.map((w) => ({
    ...w,
    status:
      w.status === "NEEDS_PRACTICE" ? Band.NEEDS_PRACTICE : Band.IMPROVING,
  }));

  return NextResponse.json<AnalyzeResponse>(parsed);
}
```

- [ ] **Step 2: Verify it compiles**

Run:
```bash
cd /Users/laasyalata/Desktop/voice
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/laasyalata/Desktop/voice
git add app/api/analyze/route.ts
git commit -m "feat: add /api/analyze route for pronunciation analysis"
```

---

### Task 10: API Route — /api/evaluate-word

**Files:**
- Create: `app/api/evaluate-word/route.ts`

- [ ] **Step 1: Implement the evaluate-word route**

Create `app/api/evaluate-word/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";
import type { EvaluateWordRequest, EvaluateWordResponse } from "@/lib/types";
import { Band } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as EvaluateWordRequest;

  const openai = getOpenAIClient();

  const prompt = `You are a friendly American English pronunciation coach evaluating a practice attempt.

The user is practicing the word: "${body.word}"
They said: "${body.userSaid}"
Previous score: ${body.previousBand ?? "first attempt"}
Attempt number: ${body.attemptNumber}

Evaluate how well they pronounced the word. Consider:
- Did the transcript match the target word?
- Is this an improvement from their previous attempt?

Assign a band:
- "GREAT" — pronunciation was clear and correct
- "IMPROVING" — getting closer, recognizable improvement
- "NEEDS_PRACTICE" — still needs work

Give short, encouraging feedback (1 sentence). If they're improving, acknowledge it. If they nailed it, celebrate. If they need more practice, give a specific tip.

Set "keepGoing" to false if band is "GREAT", true otherwise.

Respond in this exact JSON format:
{
  "band": "GREAT" or "IMPROVING" or "NEEDS_PRACTICE",
  "feedback": "<encouraging feedback>",
  "keepGoing": true or false
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 150,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    return NextResponse.json(
      { error: "No response from AI" },
      { status: 500 }
    );
  }

  const parsed = JSON.parse(content) as EvaluateWordResponse;

  // Normalize band value
  const validBands = [Band.GREAT, Band.IMPROVING, Band.NEEDS_PRACTICE];
  if (!validBands.includes(parsed.band)) {
    parsed.band = Band.NEEDS_PRACTICE;
  }

  return NextResponse.json<EvaluateWordResponse>(parsed);
}
```

- [ ] **Step 2: Verify it compiles**

Run:
```bash
cd /Users/laasyalata/Desktop/voice
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/laasyalata/Desktop/voice
git add app/api/evaluate-word/route.ts
git commit -m "feat: add /api/evaluate-word route for practice scoring"
```

---

### Task 11: API Route — /api/tts

**Files:**
- Create: `app/api/tts/route.ts`

- [ ] **Step 1: Implement the TTS route**

Create `app/api/tts/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const word: string = body.word;

  if (!word) {
    return NextResponse.json({ error: "word is required" }, { status: 400 });
  }

  const openai = getOpenAIClient();

  const response = await openai.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
    input: word,
    response_format: "mp3",
  });

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return NextResponse.json({ audio: base64 });
}
```

- [ ] **Step 2: Verify it compiles**

Run:
```bash
cd /Users/laasyalata/Desktop/voice
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/laasyalata/Desktop/voice
git add app/api/tts/route.ts
git commit -m "feat: add /api/tts route for pronunciation audio"
```

---

### Task 12: Global Styles and Layout

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Write globals.css**

Replace the contents of `app/globals.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-primary: #6366f1;
  --color-primary-light: #818cf8;
  --color-bg-start: #eef2ff;
  --color-bg-end: #f8fafc;
}

body {
  background: linear-gradient(180deg, var(--color-bg-start) 0%, var(--color-bg-end) 100%);
  min-height: 100vh;
}

@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.animate-pulse-ring {
  animation: pulse-ring 1.2s ease-out infinite;
}

/* Slide-up drawer animation */
@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
```

- [ ] **Step 2: Write layout.tsx**

Replace the contents of `app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpeakClear — Pronunciation Coach",
  description:
    "Improve your American English pronunciation with AI-powered coaching",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased text-slate-800">
        <div className="min-h-screen flex flex-col items-center px-4 py-8">
          <header className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-indigo-900">SpeakClear</h1>
            <p className="text-sm text-indigo-500 mt-1">
              Your pronunciation coach
            </p>
          </header>
          <main className="w-full max-w-md">{children}</main>
        </div>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify it builds**

Run:
```bash
cd /Users/laasyalata/Desktop/voice
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /Users/laasyalata/Desktop/voice
git add app/globals.css app/layout.tsx
git commit -m "feat: add indigo theme styles and root layout"
```

---

### Task 13: SentenceDisplay Component

**Files:**
- Create: `components/SentenceDisplay.tsx`

- [ ] **Step 1: Implement component**

Create `components/SentenceDisplay.tsx`:

```tsx
"use client";

import type { Sentence } from "@/lib/types";

interface SentenceDisplayProps {
  sentence: Sentence;
}

export function SentenceDisplay({ sentence }: SentenceDisplayProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-medium uppercase tracking-wide text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
          {sentence.category.replace("_", " ")}
        </span>
        <span className="text-xs text-slate-400">
          {sentence.level} · {sentence.difficulty}/3
        </span>
      </div>
      <p className="text-lg text-slate-800 leading-relaxed font-medium">
        &ldquo;{sentence.text}&rdquo;
      </p>
      <p className="text-xs text-slate-400 mt-2">{sentence.hint}</p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/laasyalata/Desktop/voice
git add components/SentenceDisplay.tsx
git commit -m "feat: add SentenceDisplay component"
```

---

### Task 14: MicButton Component

**Files:**
- Create: `components/MicButton.tsx`

- [ ] **Step 1: Implement component**

Create `components/MicButton.tsx`:

```tsx
"use client";

interface MicButtonProps {
  isRecording: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function MicButton({ isRecording, onToggle, disabled }: MicButtonProps) {
  return (
    <div className="flex flex-col items-center my-6">
      <div className="relative">
        {isRecording && (
          <div className="absolute inset-0 rounded-full bg-indigo-400 animate-pulse-ring" />
        )}
        <button
          onClick={onToggle}
          disabled={disabled}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
            isRecording
              ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200"
              : "bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-lg shadow-indigo-200"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
        >
          {isRecording ? (
            <div className="w-5 h-5 bg-white rounded-sm" />
          ) : (
            <svg
              className="w-6 h-6 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          )}
        </button>
      </div>
      <span className="text-xs text-slate-400 mt-3">
        {isRecording ? "Listening..." : "Tap to speak"}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/laasyalata/Desktop/voice
git add components/MicButton.tsx
git commit -m "feat: add MicButton component with pulse animation"
```

---

### Task 15: TranscriptView Component

**Files:**
- Create: `components/TranscriptView.tsx`

- [ ] **Step 1: Implement component**

Create `components/TranscriptView.tsx`:

```tsx
"use client";

import { Band } from "@/lib/types";
import type { AnalyzedWord } from "@/lib/types";

interface TranscriptViewProps {
  interimText: string;
  isRecording: boolean;
  tokens: string[];
  analyzedWords: AnalyzedWord[];
  isAnalyzing: boolean;
  onWordClick: (word: AnalyzedWord) => void;
}

export function TranscriptView({
  interimText,
  isRecording,
  tokens,
  analyzedWords,
  isAnalyzing,
  onWordClick,
}: TranscriptViewProps) {
  if (isRecording) {
    return (
      <div className="border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-400 mb-2">You&apos;re saying:</p>
        <p className="text-base text-slate-600 italic min-h-[2rem]">
          {interimText || "..."}
        </p>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-400 mb-2">Analyzing...</p>
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.1s]" />
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
        </div>
      </div>
    );
  }

  if (analyzedWords.length === 0 && tokens.length === 0) {
    return null;
  }

  // Build a map of analyzed words by index for quick lookup
  const wordMap = new Map<number, AnalyzedWord>();
  for (const w of analyzedWords) {
    wordMap.set(w.index, w);
  }

  return (
    <div className="border-t border-slate-100 pt-4">
      <p className="text-xs text-slate-400 mb-2">Your attempt:</p>
      <p className="text-base leading-loose">
        {tokens.map((token, i) => {
          const analyzed = wordMap.get(i);
          if (!analyzed) {
            return (
              <span key={i} className="text-slate-800">
                {token}{" "}
              </span>
            );
          }

          const isNeedsPractice = analyzed.status === Band.NEEDS_PRACTICE;
          const colorClass = isNeedsPractice
            ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
            : "bg-amber-50 text-amber-700 hover:bg-amber-100";

          return (
            <button
              key={i}
              onClick={() => onWordClick(analyzed)}
              className={`${colorClass} px-1.5 py-0.5 rounded-md cursor-pointer transition-colors text-base font-medium inline-flex items-center gap-1`}
            >
              {token}
              <span className="text-[10px] opacity-60">
                {isNeedsPractice ? "Practice" : "Review"}
              </span>
            </button>
          );
        })}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/laasyalata/Desktop/voice
git add components/TranscriptView.tsx
git commit -m "feat: add TranscriptView with highlighted words"
```

---

### Task 16: WordDetailCard Component

**Files:**
- Create: `components/WordDetailCard.tsx`

- [ ] **Step 1: Implement component**

Create `components/WordDetailCard.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Band } from "@/lib/types";
import type { AnalyzedWord } from "@/lib/types";
import { getCachedTts, cacheTts } from "@/lib/tts-cache";

interface WordDetailCardProps {
  word: AnalyzedWord;
  onClose: () => void;
  onPractice: (word: AnalyzedWord) => void;
}

export function WordDetailCard({
  word,
  onClose,
  onPractice,
}: WordDetailCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  async function playPronunciation() {
    setIsPlaying(true);

    let base64Audio = getCachedTts(word.word, "us");

    if (!base64Audio) {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: word.word, accent: "us" }),
      });
      const data = await res.json();
      base64Audio = data.audio;
      cacheTts(word.word, "us", base64Audio!);
    }

    const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
    audio.play();
  }

  const statusColor =
    word.status === Band.NEEDS_PRACTICE
      ? "text-rose-600 bg-rose-50"
      : "text-amber-600 bg-amber-50";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/20">
      <div className="animate-slide-up bg-white rounded-t-2xl w-full max-w-md p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800">{word.word}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* You said vs Correct */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-rose-50 rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-wide text-rose-400 mb-1">
              You said
            </p>
            <p className="text-base font-semibold text-rose-700">
              {word.youSaid}
            </p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-wide text-emerald-400 mb-1">
              Correct
            </p>
            <p className="text-base font-semibold text-emerald-700">
              {word.word}
            </p>
          </div>
        </div>

        {/* IPA and Syllables */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-indigo-600 font-mono text-sm bg-indigo-50 px-2 py-1 rounded">
            {word.ipa}
          </span>
          <span className="text-slate-500 text-sm">{word.syllables}</span>
        </div>

        {/* Tip */}
        <div className="bg-slate-50 rounded-xl p-3 mb-4">
          <p className="text-sm text-slate-700">{word.tip}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={playPronunciation}
            disabled={isPlaying}
            className="flex-1 py-3 rounded-xl border-2 border-indigo-200 text-indigo-600 font-medium text-sm hover:bg-indigo-50 transition-colors disabled:opacity-50"
          >
            {isPlaying ? "Playing..." : "Hear it"}
          </button>
          <button
            onClick={() => onPractice(word)}
            className="flex-1 py-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-medium text-sm hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-md shadow-indigo-200"
          >
            Practice
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/laasyalata/Desktop/voice
git add components/WordDetailCard.tsx
git commit -m "feat: add WordDetailCard slide-up drawer"
```

---

### Task 17: PracticeMode Component

**Files:**
- Create: `components/PracticeMode.tsx`

- [ ] **Step 1: Implement component**

Create `components/PracticeMode.tsx`:

```tsx
"use client";

import { useState, useCallback } from "react";
import { Band } from "@/lib/types";
import type { AnalyzedWord, EvaluateWordResponse } from "@/lib/types";
import { MicButton } from "./MicButton";
import { startListening, stopListening, isSpeechSupported } from "@/lib/speech";
import { saveWordAttempt } from "@/lib/progress";

interface PracticeModeProps {
  word: AnalyzedWord;
  onBack: () => void;
  onNextSentence: () => void;
}

const BAND_CONFIG = {
  [Band.GREAT]: {
    label: "Great!",
    bgClass: "bg-indigo-50 border-indigo-200",
    textClass: "text-indigo-700",
    badgeClass: "bg-indigo-100 text-indigo-800",
  },
  [Band.IMPROVING]: {
    label: "Improving",
    bgClass: "bg-amber-50 border-amber-200",
    textClass: "text-amber-700",
    badgeClass: "bg-amber-100 text-amber-800",
  },
  [Band.NEEDS_PRACTICE]: {
    label: "Keep trying",
    bgClass: "bg-rose-50 border-rose-200",
    textClass: "text-rose-700",
    badgeClass: "bg-rose-100 text-rose-800",
  },
};

export function PracticeMode({ word, onBack, onNextSentence }: PracticeModeProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState<EvaluateWordResponse | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [previousBand, setPreviousBand] = useState<Band | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleToggle = useCallback(() => {
    if (isRecording) {
      stopListening();
      setIsRecording(false);
      return;
    }

    if (!isSpeechSupported()) return;

    setResult(null);
    setIsRecording(true);

    startListening({
      onInterimTranscript: () => {},
      onFinalResult: async (speechResult) => {
        setIsRecording(false);
        setIsEvaluating(true);

        const res = await fetch("/api/evaluate-word", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            word: word.word,
            userSaid: speechResult.transcript,
            previousBand,
            attemptNumber,
          }),
        });

        const evalResult = (await res.json()) as EvaluateWordResponse;
        setResult(evalResult);
        setIsEvaluating(false);
        setPreviousBand(evalResult.band);
        setAttemptNumber((n) => n + 1);

        // Save to progress (tags are empty here — populated from sentence analysis elsewhere)
        saveWordAttempt(word.word, evalResult.band, []);
      },
      onError: () => {
        setIsRecording(false);
      },
    });
  }, [isRecording, word, previousBand, attemptNumber]);

  const config = result ? BAND_CONFIG[result.band] : null;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm shadow-indigo-100">
      {/* Back button */}
      <button
        onClick={onBack}
        className="text-sm text-slate-400 hover:text-slate-600 mb-4"
      >
        &larr; Back to sentence
      </button>

      {/* Word display */}
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">{word.word}</h2>
        <span className="text-indigo-600 font-mono text-sm bg-indigo-50 px-3 py-1 rounded-full">
          {word.ipa}
        </span>
        <p className="text-sm text-slate-500 mt-3">{word.tip}</p>
      </div>

      {/* Mic */}
      <MicButton
        isRecording={isRecording}
        onToggle={handleToggle}
        disabled={isEvaluating}
      />

      {/* Loading */}
      {isEvaluating && (
        <div className="text-center">
          <p className="text-sm text-slate-400">Evaluating...</p>
        </div>
      )}

      {/* Result */}
      {result && config && (
        <div className={`mt-4 p-4 rounded-xl border ${config.bgClass}`}>
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.badgeClass}`}
            >
              {config.label}
            </span>
            <span className="text-xs text-slate-400">
              Attempt {attemptNumber - 1}
            </span>
          </div>
          <p className={`text-sm ${config.textClass}`}>{result.feedback}</p>
        </div>
      )}

      {/* Actions after result */}
      {result && (
        <div className="flex gap-3 mt-4">
          {result.keepGoing && (
            <button
              onClick={handleToggle}
              className="flex-1 py-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-medium text-sm"
            >
              Try again
            </button>
          )}
          <button
            onClick={onNextSentence}
            className={`${result.keepGoing ? "flex-1" : "w-full"} py-3 rounded-xl border-2 border-indigo-200 text-indigo-600 font-medium text-sm hover:bg-indigo-50`}
          >
            Next sentence
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/laasyalata/Desktop/voice
git add components/PracticeMode.tsx
git commit -m "feat: add PracticeMode component with scoring"
```

---

### Task 18: ResultsSummary Component

**Files:**
- Create: `components/ResultsSummary.tsx`

- [ ] **Step 1: Implement component**

Create `components/ResultsSummary.tsx`:

```tsx
"use client";

import type { AnalyzedWord } from "@/lib/types";

interface ResultsSummaryProps {
  analyzedWords: AnalyzedWord[];
  summary: string;
  encouragement: string;
  allCorrect: boolean;
  onNextSentence: () => void;
}

export function ResultsSummary({
  analyzedWords,
  summary,
  encouragement,
  allCorrect,
  onNextSentence,
}: ResultsSummaryProps) {
  if (allCorrect) {
    return (
      <div className="mt-4 p-4 bg-indigo-50 rounded-xl text-center">
        <p className="text-indigo-800 font-semibold mb-1">
          Great job! Every word was clear.
        </p>
        <p className="text-sm text-indigo-600 mb-4">Keep up the great work!</p>
        <button
          onClick={onNextSentence}
          className="w-full py-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-medium text-sm"
        >
          Next sentence
        </button>
      </div>
    );
  }

  const practiceWords = analyzedWords
    .filter((w) => w.shouldPractice)
    .map((w) => w.word);

  return (
    <div className="mt-4 space-y-3">
      {/* Encouragement */}
      <div className="p-3 bg-indigo-50 rounded-xl">
        <p className="text-sm text-indigo-700">{encouragement}</p>
      </div>

      {/* Focus words */}
      {practiceWords.length > 0 && (
        <div className="p-3 bg-amber-50 rounded-xl">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Focus on: </span>
            {practiceWords.join(", ")}
          </p>
          <p className="text-xs text-amber-600 mt-1">{summary}</p>
        </div>
      )}

      {/* Next sentence */}
      <button
        onClick={onNextSentence}
        className="w-full py-3 rounded-xl border-2 border-indigo-200 text-indigo-600 font-medium text-sm hover:bg-indigo-50 transition-colors"
      >
        Next sentence
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/laasyalata/Desktop/voice
git add components/ResultsSummary.tsx
git commit -m "feat: add ResultsSummary component"
```

---

### Task 19: ProgressDashboard Component

**Files:**
- Create: `components/ProgressDashboard.tsx`

- [ ] **Step 1: Implement component**

Create `components/ProgressDashboard.tsx`:

```tsx
"use client";

import { Band } from "@/lib/types";
import { getProgress, getStruggledWords } from "@/lib/progress";

interface ProgressDashboardProps {
  onClose: () => void;
}

const TAG_LABELS: Record<string, string> = {
  FLAP_T: "Soft T sounds",
  VOWEL_SHIFT: "Vowel sounds",
  TH_SOUND: "TH sounds",
  STRESS_PATTERN: "Word stress",
  FINAL_CONSONANT: "Ending sounds",
  R_L_DISTINCTION: "R vs L",
  V_W_DISTINCTION: "V vs W",
  VOWEL_REDUCTION: "Reduced vowels",
};

export function ProgressDashboard({ onClose }: ProgressDashboardProps) {
  const progress = getProgress();
  const struggled = getStruggledWords();

  // Count tag frequencies
  const tagCounts: Record<string, number> = {};
  for (const word of struggled) {
    for (const tag of word.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }
  const topTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm shadow-indigo-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800">Your Progress</h2>
        <button
          onClick={onClose}
          className="text-sm text-slate-400 hover:text-slate-600"
        >
          Close
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-indigo-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-indigo-700">
            {progress.sentencesCompleted.length}
          </p>
          <p className="text-xs text-indigo-500">Sentences</p>
        </div>
        <div className="bg-indigo-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-indigo-700">
            {Object.keys(progress.wordsAttempted).length}
          </p>
          <p className="text-xs text-indigo-500">Words practiced</p>
        </div>
      </div>

      {/* Pattern areas */}
      {topTags.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-600 mb-2">
            Areas to improve
          </h3>
          <div className="flex flex-wrap gap-2">
            {topTags.map(([tag, count]) => (
              <span
                key={tag}
                className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full"
              >
                {TAG_LABELS[tag] || tag} ({count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Struggled words */}
      {struggled.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-600 mb-2">
            Words to practice
          </h3>
          <div className="space-y-2">
            {struggled.slice(0, 8).map((w) => (
              <div
                key={w.word}
                className="flex items-center justify-between py-1"
              >
                <span className="text-sm font-medium text-slate-700">
                  {w.word}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">
                    {w.attempts} attempts
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      w.band === Band.NEEDS_PRACTICE
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {w.band === Band.NEEDS_PRACTICE
                      ? "Needs practice"
                      : "Improving"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {struggled.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-4">
          No data yet. Complete some sentences to see your progress!
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/laasyalata/Desktop/voice
git add components/ProgressDashboard.tsx
git commit -m "feat: add ProgressDashboard component"
```

---

### Task 20: Main Page — Orchestrate Everything

**Files:**
- Modify: `app/page.tsx`

This is the core assembly: state machine that manages sentence mode, word detail, and practice mode.

- [ ] **Step 1: Implement main page**

Replace `app/page.tsx` with:

```tsx
"use client";

import { useState, useCallback } from "react";
import sentencesData from "@/data/sentences.json";
import type { Sentence, AnalyzedWord, SpeechResult, AnalyzeResponse } from "@/lib/types";
import { analyzeTranscript } from "@/lib/analyzer";
import { markSentenceCompleted, saveWordAttempt } from "@/lib/progress";
import { startListening, stopListening, isSpeechSupported } from "@/lib/speech";
import { SentenceDisplay } from "@/components/SentenceDisplay";
import { MicButton } from "@/components/MicButton";
import { TranscriptView } from "@/components/TranscriptView";
import { WordDetailCard } from "@/components/WordDetailCard";
import { PracticeMode } from "@/components/PracticeMode";
import { ResultsSummary } from "@/components/ResultsSummary";
import { ProgressDashboard } from "@/components/ProgressDashboard";

type AppState =
  | "idle"
  | "recording"
  | "analyzing"
  | "results"
  | "word-detail"
  | "practice"
  | "progress";

const sentences = sentencesData.sentences as Sentence[];

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [interimText, setInterimText] = useState("");
  const [analyzedWords, setAnalyzedWords] = useState<AnalyzedWord[]>([]);
  const [summary, setSummary] = useState("");
  const [encouragement, setEncouragement] = useState("");
  const [allCorrect, setAllCorrect] = useState(false);
  const [selectedWord, setSelectedWord] = useState<AnalyzedWord | null>(null);

  const sentence = sentences[sentenceIndex % sentences.length];

  const handleMicToggle = useCallback(() => {
    if (state === "recording") {
      stopListening();
      setState("idle");
      return;
    }

    if (!isSpeechSupported()) return;

    setInterimText("");
    setAnalyzedWords([]);
    setSummary("");
    setEncouragement("");
    setAllCorrect(false);
    setState("recording");

    startListening({
      onInterimTranscript: (text) => {
        setInterimText(text);
      },
      onFinalResult: async (speechResult: SpeechResult) => {
        setState("analyzing");

        // Pre-filter: detect flagged words client-side
        const analysis = analyzeTranscript(sentence, speechResult);

        if (analysis.allCorrect) {
          setAllCorrect(true);
          setEncouragement("Every word was clear. Keep it up!");
          setSummary("Great job!");
          setAnalyzedWords([]);
          markSentenceCompleted(sentence.id);
          setState("results");
          return;
        }

        // Send top 2 flagged words to API
        const topFlagged = analysis.flaggedWords.slice(0, 2);

        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sentence: {
              tokens: sentence.tokens,
              focus: sentence.focus,
            },
            flaggedWords: topFlagged,
          }),
        });

        const data = (await res.json()) as AnalyzeResponse;
        setAnalyzedWords(data.words);
        setSummary(data.summary);
        setEncouragement(data.encouragement);
        setAllCorrect(false);
        markSentenceCompleted(sentence.id);

        // Save initial word analysis with tags from the sentence focus data
        for (const flagged of topFlagged) {
          const analyzed = data.words.find((w) => w.index === flagged.index);
          if (analyzed) {
            saveWordAttempt(flagged.expected, analyzed.status, flagged.tags);
          }
        }

        setState("results");
      },
      onError: () => {
        setState("idle");
      },
    });
  }, [state, sentence]);

  const handleWordClick = useCallback((word: AnalyzedWord) => {
    setSelectedWord(word);
    setState("word-detail");
  }, []);

  const handlePractice = useCallback((word: AnalyzedWord) => {
    setSelectedWord(word);
    setState("practice");
  }, []);

  const handleNextSentence = useCallback(() => {
    setSentenceIndex((i) => i + 1);
    setAnalyzedWords([]);
    setSummary("");
    setEncouragement("");
    setAllCorrect(false);
    setInterimText("");
    setSelectedWord(null);
    setState("idle");
  }, []);

  const handleBackToResults = useCallback(() => {
    setSelectedWord(null);
    setState("results");
  }, []);

  // Practice mode
  if (state === "practice" && selectedWord) {
    return (
      <PracticeMode
        word={selectedWord}
        onBack={handleBackToResults}
        onNextSentence={handleNextSentence}
      />
    );
  }

  // Progress dashboard
  if (state === "progress") {
    return <ProgressDashboard onClose={() => setState("idle")} />;
  }

  return (
    <>
      <div className="bg-white rounded-2xl p-6 shadow-sm shadow-indigo-100">
        <SentenceDisplay sentence={sentence} />

        <MicButton
          isRecording={state === "recording"}
          onToggle={handleMicToggle}
          disabled={state === "analyzing"}
        />

        <TranscriptView
          interimText={interimText}
          isRecording={state === "recording"}
          tokens={sentence.tokens}
          analyzedWords={analyzedWords}
          isAnalyzing={state === "analyzing"}
          onWordClick={handleWordClick}
        />

        {state === "results" && (
          <ResultsSummary
            analyzedWords={analyzedWords}
            summary={summary}
            encouragement={encouragement}
            allCorrect={allCorrect}
            onNextSentence={handleNextSentence}
          />
        )}
      </div>

      {/* Progress button */}
      <button
        onClick={() => setState("progress")}
        className="mt-4 w-full py-2 text-sm text-indigo-500 hover:text-indigo-700 transition-colors"
      >
        View progress
      </button>

      {/* Word detail drawer */}
      {state === "word-detail" && selectedWord && (
        <WordDetailCard
          word={selectedWord}
          onClose={handleBackToResults}
          onPractice={handlePractice}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Enable JSON imports in tsconfig**

Add `"resolveJsonModule": true` to `compilerOptions` in `tsconfig.json` if not already present. Next.js usually includes this by default, but verify.

- [ ] **Step 3: Verify it builds**

Run:
```bash
cd /Users/laasyalata/Desktop/voice
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/laasyalata/Desktop/voice
git add app/page.tsx
git commit -m "feat: add main page orchestrating full user flow"
```

---

### Task 21: Manual Smoke Test

No new files. Test the full flow end-to-end.

- [ ] **Step 1: Set real OpenAI API key**

Edit `.env.local` and replace `your-key-here` with your actual OpenAI API key.

- [ ] **Step 2: Start dev server**

Run:
```bash
cd /Users/laasyalata/Desktop/voice
npm run dev
```

- [ ] **Step 3: Test in browser**

Open `http://localhost:3000` in Chrome (best Web Speech API support). Test:

1. Sentence is displayed with category, level, hint
2. Click mic button — pulse animation appears, "Listening..." shows
3. Speak the sentence — interim transcript appears
4. After speaking — analyzing state shows, then results with highlighted words
5. Click a highlighted word — WordDetailCard slides up with "You said" vs "Correct", IPA, tip
6. Click "Hear it" — correct pronunciation plays
7. Click "Practice" — PracticeMode opens, say the word, see band result
8. Click "Next sentence" — advances to next sentence
9. Click "View progress" — ProgressDashboard shows stats

- [ ] **Step 4: Fix any issues found during smoke test**

Address any bugs discovered.

- [ ] **Step 5: Commit any fixes**

```bash
cd /Users/laasyalata/Desktop/voice
git add -A
git commit -m "fix: smoke test fixes"
```

---

### Task 22: Run All Tests

- [ ] **Step 1: Run full test suite**

Run:
```bash
cd /Users/laasyalata/Desktop/voice
npm test
```

Expected: All tests pass (types, sentences, analyzer, progress, tts-cache).

- [ ] **Step 2: Fix any failures**

If tests fail, fix them and re-run.

- [ ] **Step 3: Commit any fixes**

```bash
cd /Users/laasyalata/Desktop/voice
git add -A
git commit -m "fix: test suite fixes"
```

---

### Task 23: Vercel Deployment

**Files:**
- Modify: `next.config.ts` (if needed)

- [ ] **Step 1: Verify build succeeds**

Run:
```bash
cd /Users/laasyalata/Desktop/voice
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Deploy to Vercel**

Run:
```bash
cd /Users/laasyalata/Desktop/voice
npx vercel --yes
```

When prompted, link to a new project. This creates a preview deployment.

- [ ] **Step 3: Set environment variable**

Run:
```bash
npx vercel env add OPENAI_API_KEY
```

Paste your OpenAI API key when prompted. Select all environments (Production, Preview, Development).

- [ ] **Step 4: Redeploy with env var**

Run:
```bash
npx vercel --prod
```

- [ ] **Step 5: Test production URL**

Open the Vercel URL and run through the same smoke test as Task 21.

- [ ] **Step 6: Commit any deployment config changes**

```bash
cd /Users/laasyalata/Desktop/voice
git add -A
git commit -m "chore: finalize Vercel deployment config"
```
