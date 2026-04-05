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
1. The correct IPA pronunciation (ipa)
2. An approximate IPA of how the user likely pronounced it based on what was heard (youSaidIpa). For example if they said "wader" instead of "water", their IPA would be /ˈweɪdər/
3. A syllable breakdown of the correct word (using · as separator)
4. A short, encouraging tip in plain English (like talking to a friend, not a textbook)
5. Whether the status is "NEEDS_PRACTICE" (word was clearly wrong) or "IMPROVING" (close but needs work)
6. Whether the user should practice this word

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
      "youSaidIpa": "<approximate IPA of user pronunciation>",
      "ipa": "<correct IPA pronunciation>",
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

  parsed.words = parsed.words.map((w) => ({
    ...w,
    status:
      w.status === "NEEDS_PRACTICE" ? Band.NEEDS_PRACTICE : Band.IMPROVING,
  }));

  return NextResponse.json<AnalyzeResponse>(parsed);
}
