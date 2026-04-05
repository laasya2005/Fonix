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
