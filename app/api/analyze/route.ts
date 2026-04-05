import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";
import type { AnalyzeResponse } from "@/lib/types";
import { Band } from "@/lib/types";

const WHISPER_TIMEOUT_MS = 3000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const expectedTokens = JSON.parse(formData.get("tokens") as string) as string[];
  const focus = JSON.parse(formData.get("focus") as string) as Array<{ word: string; tags: string[] }>;
  const browserTranscript = formData.get("browserTranscript") as string;
  const audioFile = formData.get("audio") as File | null;

  const openai = getOpenAIClient();

  // Whisper transcription with timeout — fall back to browser transcript if slow
  let whisperTranscript = browserTranscript;

  if (audioFile && audioFile.size > 0) {
    const whisperResult = await withTimeout(
      openai.audio.transcriptions.create({
        model: "whisper-1",
        file: audioFile,
        language: "en",
        prompt: `Non-native English speaker reading: "${expectedTokens.join(" ")}"`,
      }).catch(() => null),
      WHISPER_TIMEOUT_MS
    );
    if (whisperResult) {
      whisperTranscript = whisperResult.text.toLowerCase().replace(/[.,!?]/g, "").trim();
    }
  }

  // Build focus word list with their indices in the expected tokens
  const focusWithIndices = focus.map((f) => {
    const idx = expectedTokens.findIndex(
      (t) => t.toLowerCase() === f.word.toLowerCase()
    );
    return { ...f, index: idx };
  });

  const focusWordList = focusWithIndices
    .map((f) => `"${f.word}" (index:${f.index}, tags:${f.tags.join(",")})`)
    .join(", ");

  const prompt = `American English pronunciation coach analyzing a non-native speaker.

SENTENCE: "${expectedTokens.join(" ")}"
HEARD: "${whisperTranscript}"
BROWSER: "${browserTranscript}"

ONLY analyze these focus words: ${focusWordList}

DO NOT include any other words in your response. ONLY the focus words listed above.

For EACH focus word:
- Generate the correct American English IPA (ipa field)
- Generate how a non-native speaker likely pronounced it based on their accent tags (youSaidIpa field). These MUST be different:
  FLAP_T → /t/ instead of /ɾ/
  TH_SOUND → /t,d/ instead of /θ,ð/
  VOWEL_SHIFT → different vowel
  STRESS_PATTERN → different stress marks
  R_L_DISTINCTION → /l/ vs /r/ swap
  V_W_DISTINCTION → /w/ vs /v/ swap
  FINAL_CONSONANT → omit final consonant
  VOWEL_REDUCTION → full vowel instead of /ə/
- Provide a short practical tip
- syllables: break the word into syllables separated by · (middle dot). Examples: "actually" → "ac·tu·al·ly", "interview" → "in·ter·view", "comfortable" → "com·fort·a·ble", "experience" → "ex·pe·ri·ence". Show the FULL syllable text, NOT a count.
- Set status: NEEDS_PRACTICE or IMPROVING
- Set shouldPractice: true
- Set reason: "KNOWN_DIFFICULTY"

JSON format:
{"words":[{"index":0,"word":"actually","status":"NEEDS_PRACTICE","reason":"KNOWN_DIFFICULTY","youSaid":"actually","youSaidIpa":"/ˈæk.tʃu.ə.li/","ipa":"/ˈæk.tʃu.ə.li/","tip":"...","syllables":"ac·tu·al·ly","shouldPractice":true}],"summary":"","encouragement":""}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 600,
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
