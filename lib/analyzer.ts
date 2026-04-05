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
  const hardFlagged: FlaggedWord[] = [];
  const knownDifficultyFlagged: FlaggedWord[] = [];

  for (let i = 0; i < sentence.tokens.length; i++) {
    const expected = sentence.tokens[i];
    const spokenWord = speech.words[i];
    const heard = spokenWord?.word ?? "";
    const confidence = spokenWord?.confidence ?? 0;

    const focusIdx = sentence.focusIndices.indexOf(i);
    const tags: PronunciationTag[] =
      focusIdx !== -1 ? sentence.focus[focusIdx].tags : [];

    if (heard.toLowerCase() !== expected.toLowerCase()) {
      hardFlagged.push({
        index: i,
        expected,
        heard,
        confidence,
        reason: FlagReason.TRANSCRIPT_MISMATCH,
        tags,
      });
    } else if (confidence < CONFIDENCE_THRESHOLD) {
      hardFlagged.push({
        index: i,
        expected,
        heard,
        confidence,
        reason: FlagReason.LOW_CONFIDENCE,
        tags,
      });
    } else if (sentence.focusIndices.includes(i)) {
      knownDifficultyFlagged.push({
        index: i,
        expected,
        heard,
        confidence,
        reason: FlagReason.KNOWN_DIFFICULTY,
        tags,
      });
    }
  }

  // Only use hard flags (mismatch or low confidence).
  // Known difficulty words that were pronounced correctly should NOT be flagged.
  hardFlagged.sort((a, b) => a.confidence - b.confidence);

  return { flaggedWords: hardFlagged, allCorrect: hardFlagged.length === 0 };
}
