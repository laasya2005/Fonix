import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const targetWord = formData.get("word") as string;
  const targetSentence = formData.get("sentence") as string;
  const tip = formData.get("tip") as string;
  const audioFile = formData.get("audio") as File | null;

  const openai = getOpenAIClient();

  // Step 1: Use Whisper to get phonetic-level transcription
  // (Used as a TOOL for accent analysis, not as the primary feature)
  let heardText = targetWord || targetSentence;
  if (audioFile && audioFile.size > 0) {
    try {
      const whisperResponse = await openai.audio.transcriptions.create({
        model: "whisper-1",
        file: audioFile,
        language: "en",
        // Prompt Whisper to capture pronunciation variants
        prompt: `Non-native speaker attempting American English pronunciation of: "${targetWord || targetSentence}". Transcribe exactly what you hear, including mispronunciations.`,
      });
      heardText = whisperResponse.text.trim();
    } catch {
      // Whisper unavailable — provide generic feedback
    }
  }

  // Step 2: GPT analyzes accent differences (NOT grammar)
  const isWord = !!targetWord;
  const target = targetWord || targetSentence;

  const prompt = `You are an American English pronunciation coach. A non-native speaker just tried to say "${target}" in an American accent.

Whisper heard: "${heardText}"
${tip ? `Known focus area: ${tip}` : ""}

YOUR TASK — ACCENT ONLY, NOT GRAMMAR:
1. Identify exactly 1 specific pronunciation issue (the most important one)
2. Focus ONLY on how they SOUND, not what words they used
3. Prioritize these American English features:
   - Flap T: "water" should sound like "wah-der" not "wah-ter"
   - TH sound: tongue between teeth, not substituting T/D
   - American R: tongue curls back, doesn't tap roof
   - V vs W: V = teeth on lip, W = rounded lips
   - Vowel sounds: American vowels differ from British/Indian
   - Word stress: which syllable gets emphasis
   - Rhythm and linking: how words blend together

4. Give feedback as if speaking directly to the person:
   - Be specific about mouth/tongue position
   - Use "say it like..." examples
   - Keep it to 1-2 short sentences max

${isWord ? "This is a single word drill — focus on the exact sound." : "This is a sentence — focus on the most important sound issue."}

Respond in JSON:
{
  "focus": "th_sound|flap_t|v_w|r_sound|stress|vowel|linking",
  "feedback": "Your specific coaching tip (1-2 sentences)",
  "example": "Say it like: ___"
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 150,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    return NextResponse.json({
      focus: "general",
      feedback: "Try to match the American pronunciation as closely as you can.",
      example: "",
    });
  }

  return NextResponse.json(JSON.parse(content));
}
