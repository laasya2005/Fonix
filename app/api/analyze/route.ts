import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";
import type { AnalyzeResponse } from "@/lib/types";
import { Band } from "@/lib/types";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const expectedTokens = JSON.parse(formData.get("tokens") as string) as string[];
  const focus = JSON.parse(formData.get("focus") as string) as Array<{ word: string; tags: string[] }>;
  const browserTranscript = formData.get("browserTranscript") as string;
  const audioFile = formData.get("audio") as File | null;

  const openai = getOpenAIClient();

  // Step 1: Transcribe with Whisper if audio is available
  // Whisper captures accent-influenced pronunciation more accurately
  let whisperTranscript = browserTranscript;

  if (audioFile && audioFile.size > 0) {
    try {
      const whisperResponse = await openai.audio.transcriptions.create({
        model: "whisper-1",
        file: audioFile,
        language: "en",
        prompt: `The speaker is a non-native English speaker. Transcribe exactly what they say, including any mispronunciations. Expected sentence: "${expectedTokens.join(" ")}"`,
      });
      whisperTranscript = whisperResponse.text.toLowerCase().replace(/[.,!?]/g, "").trim();
    } catch {
      // Whisper not available — fall back to browser transcript
    }
  }

  // Step 2: Build word-by-word comparison for GPT
  const whisperWords = whisperTranscript.split(/\s+/);
  const focusWordList = focus.map(
    (f) => `"${f.word}" (challenges: ${f.tags.join(", ")})`
  ).join(", ");

  const prompt = `You are an expert American English pronunciation coach. A non-native English speaker just read this sentence aloud.

EXPECTED SENTENCE: "${expectedTokens.join(" ")}"
WHAT SPEECH RECOGNITION HEARD: "${whisperTranscript}"
BROWSER TRANSCRIPT: "${browserTranscript}"
FOCUS WORDS TO EVALUATE: ${focusWordList}

YOUR TASK:
1. Compare the two transcripts against the expected sentence word by word
2. For each focus word AND any word where the transcripts differ from expected:
   - Generate the CORRECT American English IPA
   - Generate the APPROXIMATE IPA of how the user likely pronounced it (based on their accent — this MUST be different from the correct IPA if they mispronounced it)
   - Provide a specific, practical pronunciation tip
3. Even if both transcripts show the correct word, evaluate the focus words for likely accent issues:
   - FLAP_T: Did they use a hard T instead of the American soft D? ("water" should be /ˈwɑːɾɚ/ not /ˈwɑːtɚ/)
   - TH_SOUND: Did they substitute t/d/s/z for th? ("think" → /tɪŋk/ instead of /θɪŋk/)
   - VOWEL_SHIFT: Wrong vowel sounds? ("hot" should be /hɑːt/ not /hɒt/)
   - STRESS_PATTERN: Wrong syllable stressed?
   - R_L_DISTINCTION: R and L confusion?
   - V_W_DISTINCTION: V and W confusion?
   - FINAL_CONSONANT: Dropped ending sounds?
   - VOWEL_REDUCTION: Not using schwa in unstressed syllables?

IMPORTANT: The "youSaidIpa" MUST reflect the non-American pronunciation. If the word has a TH_SOUND tag, show /t/ or /d/ instead of /θ/ or /ð/. If FLAP_T, show hard /t/ instead of /ɾ/. This is the whole point — showing the user the difference.

Set status to "NEEDS_PRACTICE" for clear accent differences, "IMPROVING" for minor ones.
Set shouldPractice=true for any word where the IPAs differ.

Respond in JSON:
{
  "words": [
    {
      "index": <position in expected tokens (0-based)>,
      "word": "<expected word>",
      "status": "NEEDS_PRACTICE" or "IMPROVING",
      "reason": "<TRANSCRIPT_MISMATCH or LOW_CONFIDENCE or KNOWN_DIFFICULTY>",
      "youSaid": "<what user actually said or likely said>",
      "youSaidIpa": "<IPA of user's accented pronunciation>",
      "ipa": "<correct American IPA>",
      "tip": "<practical American pronunciation tip>",
      "syllables": "<syllable breakdown with · separator>",
      "shouldPractice": true or false
    }
  ],
  "summary": "<what to focus on>",
  "encouragement": "<encouraging message>"
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 1000,
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
