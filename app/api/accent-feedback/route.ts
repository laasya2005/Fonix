import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const targetWord = formData.get("word") as string;
  const targetSentence = formData.get("sentence") as string;
  const tip = formData.get("tip") as string;
  const audioFile = formData.get("audio") as File | null;

  const openai = getOpenAIClient();

  let heardText = targetWord || targetSentence;
  if (audioFile && audioFile.size > 0) {
    try {
      const whisperResponse = await openai.audio.transcriptions.create({
        model: "whisper-1",
        file: audioFile,
        language: "en",
        prompt: `Non-native speaker attempting American English pronunciation of: "${targetWord || targetSentence}". Transcribe exactly what you hear, including mispronunciations.`,
      });
      heardText = whisperResponse.text.trim();
    } catch {
      // Whisper unavailable
    }
  }

  const isWord = !!targetWord;
  const target = targetWord || targetSentence;

  const prompt = `You are an American English pronunciation coach. A non-native speaker just tried to say "${target}" in an American accent.

Whisper heard: "${heardText}"
${tip ? `Known focus area: ${tip}` : ""}

YOUR TASK — give a clear VERDICT on their pronunciation:

1. First, decide: did they pronounce it with a good American accent?
   - "pass" = sounds American enough, good job
   - "close" = almost there, one small thing to fix
   - "needs_work" = clearly non-American pronunciation, specific issue to fix

2. If "pass": give a short encouragement ("Great American R sound!" or "Perfect TH!")
3. If "close" or "needs_work": identify exactly 1 issue and give a specific fix

Focus ONLY on accent/pronunciation features:
- Flap T: "water" = "wah-der" not "wah-ter"
- TH sound: tongue between teeth
- American R: tongue curls back
- V vs W: V = teeth on lip, W = rounded lips
- Vowel sounds
- Word stress
- Connected speech

${isWord ? "This is a single word — judge the specific sound strictly." : "This is a sentence — judge overall American accent quality."}

Respond in JSON:
{
  "verdict": "pass|close|needs_work",
  "feedback": "1 sentence — what was good or what to fix",
  "example": "Say it like: ___  (only if close or needs_work, empty string if pass)"
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 120,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    return NextResponse.json({
      verdict: "close",
      feedback: "Try to match the American pronunciation more closely.",
      example: "",
    });
  }

  return NextResponse.json(JSON.parse(content));
}
