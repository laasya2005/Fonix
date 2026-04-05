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

  const validBands = [Band.GREAT, Band.IMPROVING, Band.NEEDS_PRACTICE];
  if (!validBands.includes(parsed.band)) {
    parsed.band = Band.NEEDS_PRACTICE;
  }

  return NextResponse.json<EvaluateWordResponse>(parsed);
}
