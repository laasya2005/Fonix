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

  // Collect already-corrected words from conversation history to avoid repeating
  const alreadyCorrected = new Set<string>();
  for (const msg of messages) {
    if (msg.text && typeof msg.text === "string") {
      // Check if previous messages contained correction data (stored in text)
      const corrMatch = msg.text.match(/\[corrected:([^\]]+)\]/);
      if (corrMatch) corrMatch[1].split(",").forEach((w: string) => alreadyCorrected.add(w.trim().toLowerCase()));
    }
  }
  const alreadyCorrectedList = alreadyCorrected.size > 0 ? Array.from(alreadyCorrected).join(", ") : "none";

  const systemPrompt = `You are Fonix, an American English ACCENT coach. You help non-native speakers sound more American.

SCENARIO: ${modeContext}

CRITICAL RULES:
1. ONLY correct pronunciation/accent. NEVER correct grammar or phrasing.
2. Respond with 1-2 SHORT sentences. Keep the conversation natural.
3. Give at most 1 correction per response. If nothing stands out, give 0 corrections — just reply naturally.
4. NEVER repeat a correction you already gave. Words already corrected: ${alreadyCorrectedList}. Pick a DIFFERENT word or give no correction.
5. Only correct words that are genuinely hard to pronounce or have clear accent markers. Don't nitpick common simple words.
6. Focus on: flap T, TH sound, American R, V/W, word stress, vowel sounds, connected speech.
7. If you do correct, your spokenResponse should naturally include the correction — don't say "by the way". Just weave it in: "That sounded great! Just make sure 'water' sounds more like 'wah-der'."

BROWSER HEARD: "${browserTranscript}"
WHISPER HEARD: "${whisperTranscript}"

Respond ONLY in JSON:
{
  "spokenResponse": "Your conversational reply with correction woven in naturally (1-2 sentences)",
  "corrections": [
    {"original": "word", "suggested": "how to say it (say: ___)", "type": "pronunciation"}
  ],
  "tip": ""
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

  const corrections = parsed.corrections || [];
  const fullSpoken = parsed.spokenResponse || "";

  // Tag corrected words so we can track them in conversation history
  const correctedWords = corrections.map((c: { original: string }) => c.original.toLowerCase());

  // Generate TTS for the spoken response (corrections are woven in naturally)
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

  // Append corrected words tag to spokenResponse so conversation history tracks them
  const responseText = correctedWords.length > 0
    ? `${parsed.spokenResponse || ""} [corrected:${correctedWords.join(",")}]`
    : parsed.spokenResponse || "";

  return NextResponse.json({
    spokenResponse: parsed.spokenResponse || "",
    responseTextForHistory: responseText,
    corrections: corrections.map((c: { original: string; suggested: string; type: string }, i: number) => ({
      ...c,
      audio: correctionAudios[i] || "",
    })),
    tip: parsed.tip || "",
    audio: audioBase64,
  });
}
