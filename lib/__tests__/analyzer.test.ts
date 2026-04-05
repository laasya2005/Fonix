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
    const sentence = makeSentence({ focusIndices: [], focus: [] });
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
    expect(result.flaggedWords.length).toBe(3);
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
