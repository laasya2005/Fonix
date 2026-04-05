import {
  FlagReason,
  type AnalyzerResult,
  type FlaggedWord,
  type Sentence,
  type SpeechResult,
  type PronunciationTag,
} from "./types";

const CONFIDENCE_THRESHOLD = 0.7;

/**
 * Check if two words are similar enough to be a pronunciation variant
 * (not a completely different word from alignment shift).
 * Uses a simple heuristic: shares at least 40% of characters or starts with same 2 chars.
 */
function isSimilarWord(a: string, b: string): boolean {
  const la = a.toLowerCase();
  const lb = b.toLowerCase();
  if (la === lb) return true;
  // Same first 2 characters (e.g., "water" vs "wader")
  if (la.length >= 2 && lb.length >= 2 && la.slice(0, 2) === lb.slice(0, 2)) return true;
  // Character overlap: count shared characters
  const setA = new Set(la.split(""));
  const setB = new Set(lb.split(""));
  let shared = 0;
  for (const c of setA) {
    if (setB.has(c)) shared++;
  }
  const overlap = shared / Math.max(setA.size, setB.size);
  return overlap >= 0.5;
}

/**
 * Align spoken words to expected tokens using greedy matching.
 * Returns a map: expectedIndex -> { heard, confidence }
 * Handles insertions (extra words spoken) and deletions (words skipped).
 */
function alignWords(
  expected: string[],
  spoken: SpeechResult["words"]
): Map<number, { heard: string; confidence: number }> {
  const aligned = new Map<number, { heard: string; confidence: number }>();
  let si = 0; // spoken index

  for (let ei = 0; ei < expected.length; ei++) {
    if (si >= spoken.length) {
      // User stopped speaking — remaining expected words are missing
      aligned.set(ei, { heard: "", confidence: 0 });
      continue;
    }

    const exp = expected[ei].toLowerCase();
    const sp = spoken[si].word.toLowerCase();

    if (exp === sp) {
      // Exact match — aligned
      aligned.set(ei, { heard: spoken[si].word, confidence: spoken[si].confidence });
      si++;
    } else if (isSimilarWord(exp, sp)) {
      // Similar word — likely a mispronunciation
      aligned.set(ei, { heard: spoken[si].word, confidence: spoken[si].confidence });
      si++;
    } else {
      // Mismatch — check if the expected word appears later in spoken (user added extra words)
      // or if the spoken word appears later in expected (user skipped a word)
      const lookAheadSpoken = 3;
      const lookAheadExpected = 3;

      let foundInSpoken = -1;
      for (let k = si + 1; k < Math.min(si + lookAheadSpoken + 1, spoken.length); k++) {
        if (spoken[k].word.toLowerCase() === exp || isSimilarWord(exp, spoken[k].word)) {
          foundInSpoken = k;
          break;
        }
      }

      let foundInExpected = -1;
      for (let k = ei + 1; k < Math.min(ei + lookAheadExpected + 1, expected.length); k++) {
        if (expected[k].toLowerCase() === sp || isSimilarWord(expected[k], sp)) {
          foundInExpected = k;
          break;
        }
      }

      if (foundInSpoken !== -1 && (foundInExpected === -1 || foundInSpoken - si <= foundInExpected - ei)) {
        // Expected word found later in spoken — user inserted extra words, skip spoken words
        aligned.set(ei, { heard: spoken[foundInSpoken].word, confidence: spoken[foundInSpoken].confidence });
        si = foundInSpoken + 1;
      } else if (foundInExpected !== -1) {
        // Spoken word matches a later expected word — user skipped this expected word
        aligned.set(ei, { heard: "", confidence: 0 });
        // Don't advance si — this spoken word will be matched to the later expected word
      } else {
        // No good alignment — treat as mismatch at current position
        aligned.set(ei, { heard: spoken[si].word, confidence: spoken[si].confidence });
        si++;
      }
    }
  }

  return aligned;
}

export function analyzeTranscript(
  sentence: Sentence,
  speech: SpeechResult
): AnalyzerResult {
  const flagged: FlaggedWord[] = [];
  const aligned = alignWords(sentence.tokens, speech.words);

  for (let i = 0; i < sentence.tokens.length; i++) {
    const expected = sentence.tokens[i];
    const match = aligned.get(i);
    const heard = match?.heard ?? "";
    const confidence = match?.confidence ?? 0;

    const focusIdx = sentence.focusIndices.indexOf(i);
    const tags: PronunciationTag[] =
      focusIdx !== -1 ? sentence.focus[focusIdx].tags : [];

    if (heard === "") {
      // Word was skipped entirely
      flagged.push({
        index: i,
        expected,
        heard: "(skipped)",
        confidence: 0,
        reason: FlagReason.TRANSCRIPT_MISMATCH,
        tags,
      });
    } else if (heard.toLowerCase() !== expected.toLowerCase()) {
      // Mispronounced — only flag if the words are similar enough
      // (a true pronunciation error, not an alignment artifact)
      if (isSimilarWord(expected, heard)) {
        flagged.push({
          index: i,
          expected,
          heard,
          confidence,
          reason: FlagReason.TRANSCRIPT_MISMATCH,
          tags,
        });
      }
    } else if (confidence < CONFIDENCE_THRESHOLD) {
      flagged.push({
        index: i,
        expected,
        heard,
        confidence,
        reason: FlagReason.LOW_CONFIDENCE,
        tags,
      });
    }
  }

  flagged.sort((a, b) => a.confidence - b.confidence);

  return { flaggedWords: flagged, allCorrect: flagged.length === 0 };
}
