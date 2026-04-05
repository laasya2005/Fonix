import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";

interface CoachMessage {
  role: "coach" | "user";
  text: string;
}

const WHISPER_TIMEOUT_MS = 3000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

const MODE_CONTEXT: Record<string, string> = {
  interview: "You are a hiring manager conducting a friendly job interview. Ask about their experience, skills, and goals. Probe naturally.",
  small_talk: "You are a colleague making casual conversation. Talk about weekends, hobbies, weather, food — keep it light and natural.",
  sales: "You are a potential client. The user is pitching their product or service to you. Ask tough but fair questions.",
  customer_service: "You are a frustrated but polite customer calling about a problem. Let the user practice handling your issue professionally.",
};

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const messagesJson = formData.get("messages") as string;
  const mode = formData.get("mode") as string;
  const browserTranscript = formData.get("browserTranscript") as string;
  const audioFile = formData.get("audio") as File | null;

  const messages: CoachMessage[] = messagesJson ? JSON.parse(messagesJson) : [];
  const openai = getOpenAIClient();

  // Whisper transcription for accent-accurate input
  let whisperTranscript = browserTranscript;
  if (audioFile && audioFile.size > 0) {
    const whisperResult = await withTimeout(
      openai.audio.transcriptions.create({
        model: "whisper-1",
        file: audioFile,
        language: "en",
        prompt: `Non-native English speaker in a conversation.`,
      }).catch(() => null),
      WHISPER_TIMEOUT_MS
    );
    if (whisperResult) {
      whisperTranscript = whisperResult.text.trim();
    }
  }

  const modeContext = MODE_CONTEXT[mode] || MODE_CONTEXT.small_talk;

  const systemPrompt = `You are Fonix, an American English ACCENT coach. You help non-native speakers sound more American.

SCENARIO: ${modeContext}

CRITICAL RULES — ACCENT ONLY:
1. DO NOT correct grammar. DO NOT correct phrasing. ONLY correct pronunciation and accent.
2. Respond with 1-2 SHORT sentences. Keep the conversation going naturally.
3. After the user speaks, give exactly 1 pronunciation tip based on how they likely SOUND (not what words they used).
4. Focus on these American English accent features:
   - Flap T: "water" sounds like "wah-der", "better" like "beh-der"
   - TH sound: tongue between teeth, not T or D substitution
   - American R: tongue curls back, doesn't tap
   - V vs W: V = teeth on lip, W = rounded lips
   - Word stress: which syllable is emphasized
   - Vowel sounds: American vowels (e.g. "hot" = /hɑːt/ not /hɒt/)
   - Connected speech: how words blend together ("got it" → "gah-dit")
5. Always include a "say it like..." example in your tip.
6. Ignore grammar mistakes completely — even if they say "I am go yesterday", only comment on accent.

BROWSER HEARD: "${browserTranscript}"
WHISPER HEARD: "${whisperTranscript}"

Compare these transcripts. Differences reveal pronunciation issues (words the speaker mispronounced so badly that transcription differed).

Respond ONLY in JSON:
{
  "spokenResponse": "Your conversational reply (1-2 sentences)",
  "corrections": [
    {"original": "word they mispronounced", "suggested": "correct pronunciation guide (say: ___)", "type": "pronunciation"}
  ],
  "tip": "1 specific accent tip with mouth/tongue position guidance"
}`;

  const gptMessages: Array<{ role: "system" | "assistant" | "user"; content: string }> = [
    { role: "system", content: systemPrompt },
  ];

  // Add conversation history
  for (const msg of messages) {
    gptMessages.push({
      role: msg.role === "coach" ? "assistant" : "user",
      content: msg.text,
    });
  }

  // Add latest user input
  if (browserTranscript) {
    gptMessages.push({ role: "user", content: browserTranscript });
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: gptMessages,
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 250,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    return NextResponse.json({ error: "No response" }, { status: 500 });
  }

  const parsed = JSON.parse(content);

  // Build full spoken text: response + corrections spoken naturally
  const corrections = parsed.corrections || [];
  let fullSpoken = parsed.spokenResponse || "";

  if (corrections.length > 0) {
    const correctionPhrases = corrections.map(
      (c: { original: string; suggested: string }) =>
        `By the way, instead of saying "${c.original}", try saying "${c.suggested}".`
    );
    fullSpoken += " " + correctionPhrases.join(" ");
  }

  // Generate TTS for the full response including corrections
  let audioBase64 = "";
  try {
    const ttsResponse = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: fullSpoken,
      speed: 0.95,
    });
    const arrayBuffer = await ttsResponse.arrayBuffer();
    audioBase64 = Buffer.from(arrayBuffer).toString("base64");
  } catch {
    // TTS failed — client will show text only
  }

  // Generate individual TTS for each correction (for replay)
  const correctionAudios: string[] = [];
  for (const c of corrections) {
    try {
      const tts = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: c.suggested,
        speed: 0.85,
      });
      const buf = Buffer.from(await tts.arrayBuffer());
      correctionAudios.push(buf.toString("base64"));
    } catch {
      correctionAudios.push("");
    }
  }

  return NextResponse.json({
    spokenResponse: parsed.spokenResponse || "",
    corrections: corrections.map((c: { original: string; suggested: string; type: string }, i: number) => ({
      ...c,
      audio: correctionAudios[i] || "",
    })),
    tip: parsed.tip || "",
    audio: audioBase64,
  });
}
