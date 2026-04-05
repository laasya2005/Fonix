import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";
import type { AnalyzeRequest, AnalyzeResponse } from "@/lib/types";
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
        `- Word: "${w.expected}", Heard as: "${w.heard}", Confidence: ${w.confidence.toFixed(2)}, Reason: ${w.reason}, Pronunciation challenges: ${w.tags.join(", ")}`
    )
    .join("\n");

  const prompt = `You are an expert American English pronunciation coach helping non-native speakers (especially from South Asian, East Asian, and other backgrounds) sound more natural in American English.

CRITICAL: The speech recognition system transcribes what the user says, but it CANNOT detect accent-level issues. Even if the transcript shows the correct word, the user likely pronounced it with their native accent, NOT with American pronunciation. Your job is to evaluate based on the pronunciation tags.

Sentence: "${body.sentence.tokens.join(" ")}"

Words to evaluate:
${wordDescriptions}

PRONUNCIATION TAG MEANINGS — use these to determine what the user likely got wrong:
- FLAP_T: American English uses a soft "d" sound for T between vowels (e.g., "water" = "wah-der", "better" = "beh-der"). Non-native speakers often use a hard T.
- TH_SOUND: The "th" sound (/θ/ or /ð/) — non-native speakers often substitute "t", "d", "s", or "z" (e.g., "think" → "tink", "the" → "da").
- VOWEL_SHIFT: American vowels differ from other accents (e.g., "hot" uses /ɑː/ not /ɒ/, "can't" uses /æ/ not /ɑː/).
- STRESS_PATTERN: American English stresses specific syllables. Non-native speakers often stress the wrong syllable (e.g., "develop" stress on DEV, not de-VEL-op).
- R_L_DISTINCTION: Mixing up R and L sounds, or not using the American retroflex R.
- V_W_DISTINCTION: Mixing "v" and "w" sounds (e.g., "very" → "wery", "wine" → "vine").
- FINAL_CONSONANT: Dropping or softening final consonants (e.g., "cold" → "col", "build" → "buil").
- VOWEL_REDUCTION: Unstressed syllables should use schwa /ə/ in American English. Non-native speakers often give full pronunciation to every syllable.

For EACH word:
1. Assume the user pronounced it with their native accent based on the tags
2. Provide the correct American IPA
3. Provide the likely non-American IPA they used (this should be DIFFERENT from the correct IPA)
4. Give a specific, practical tip for the American pronunciation
5. Set status to "NEEDS_PRACTICE" if it's a significant accent difference, "IMPROVING" if minor
6. Set shouldPractice to true for words with clear pronunciation differences

Respond in JSON:
{
  "words": [
    {
      "index": <token index from input>,
      "word": "<the expected word>",
      "status": "NEEDS_PRACTICE" or "IMPROVING",
      "reason": "<reason from input>",
      "youSaid": "<what user likely said with accent>",
      "youSaidIpa": "<IPA of accented pronunciation — MUST differ from correct>",
      "ipa": "<correct American IPA>",
      "tip": "<specific American pronunciation tip>",
      "syllables": "<syllable breakdown with · separator>",
      "shouldPractice": true or false
    }
  ],
  "summary": "<what to focus on>",
  "encouragement": "<encouraging comment about effort>"
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 800,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    return NextResponse.json(
      { error: "No response from AI" },
      { status: 500 }
    );
  }

  const parsed = JSON.parse(content) as AnalyzeResponse;

  parsed.words = parsed.words.map((w) => ({
    ...w,
    status:
      w.status === "NEEDS_PRACTICE" ? Band.NEEDS_PRACTICE : Band.IMPROVING,
  }));

  return NextResponse.json<AnalyzeResponse>(parsed);
}
