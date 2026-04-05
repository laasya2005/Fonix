import { NextRequest, NextResponse } from "next/server";

const SOUND_TIPS: Record<string, string> = {
  th_sound: "Tongue should be between your teeth.",
  flap_t: "The T should be a quick, soft tongue tap.",
  v_w: "V = teeth on lip. W = rounded lips.",
  r_sound: "Curl tongue backward, don't tap the roof.",
  l_sound: "Tongue tip touches ridge behind upper teeth.",
  stress: "Stressed syllable should be LOUDER and LONGER.",
  vowels: "American vowels are open and relaxed.",
  connected: "Let words flow together smoothly.",
  final_consonants: "Release the final sounds clearly.",
  schwa: "Unstressed syllables = quick lazy 'uh'.",
};

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const targetWord = formData.get("word") as string;
  const targetSentence = formData.get("sentence") as string;
  const soundCategory = formData.get("category") as string;
  const audioFile = formData.get("audio") as File | null;

  const target = targetWord || targetSentence || "";
  const speechKey = process.env.AZURE_SPEECH_KEY;
  const speechRegion = process.env.AZURE_SPEECH_REGION || "eastus";

  // Check prerequisites
  if (!speechKey) {
    return NextResponse.json({ verdict: "compare", overallScore: null, words: [], feedback: "[1] Azure key missing from env vars", example: "" });
  }
  if (!audioFile) {
    return NextResponse.json({ verdict: "compare", overallScore: null, words: [], feedback: "[2] No audio file received", example: "" });
  }
  if (audioFile.size === 0) {
    return NextResponse.json({ verdict: "compare", overallScore: null, words: [], feedback: "[3] Audio file is 0 bytes", example: "" });
  }

  try {
    const audioBuffer = await audioFile.arrayBuffer();

    const pronAssessmentParams = {
      ReferenceText: target,
      GradingSystem: "HundredMark",
      Granularity: "Phoneme",
      Dimension: "Comprehensive",
    };
    const pronHeader = Buffer.from(JSON.stringify(pronAssessmentParams)).toString("base64");

    // Read sample rate from WAV header to verify format
    const wavView = new DataView(audioBuffer);
    const wavSampleRate = audioBuffer.byteLength >= 28 ? wavView.getUint32(24, true) : 16000;

    const response = await fetch(
      `https://${speechRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": speechKey,
          "Content-Type": "audio/wav",
          "Pronunciation-Assessment": pronHeader,
        },
        body: new Uint8Array(audioBuffer),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      // Parse WAV header for debug info
      const wavView = new DataView(audioBuffer);
      const wavSampleRate = audioBuffer.byteLength >= 28 ? wavView.getUint32(24, true) : 0;
      const wavChannels = audioBuffer.byteLength >= 23 ? wavView.getUint16(22, true) : 0;
      const wavBits = audioBuffer.byteLength >= 35 ? wavView.getUint16(34, true) : 0;
      return NextResponse.json({ verdict: "compare", overallScore: null, words: [], feedback: `[4] Azure ${response.status}: ${errText.slice(0, 100)} | ${audioBuffer.byteLength}b, ${wavSampleRate}Hz, ${wavChannels}ch, ${wavBits}bit, "${target}"`, example: "" });
    }

    const result = await response.json();

    if (result.RecognitionStatus !== "Success") {
      return NextResponse.json({ verdict: "needs_work", overallScore: null, words: [], feedback: `[5] Azure status: ${result.RecognitionStatus}. Speak louder/closer to mic.`, example: "" });
    }

    const nBest = result.NBest?.[0];
    if (!nBest) {
      return NextResponse.json({ verdict: "compare", overallScore: null, words: [], feedback: `[6] No NBest in response: ${JSON.stringify(result).slice(0, 300)}`, example: "" });
    }

    // Azure REST API returns scores directly on NBest[0], not nested under PronunciationAssessment
    const overallScore = Math.round(nBest.PronScore ?? nBest.PronunciationAssessment?.PronScore ?? 0);

    const wordResults: Array<{ word: string; score: number; phonemes: Array<{ phoneme: string; score: number }> }> = [];
    if (nBest.Words) {
      for (const w of nBest.Words) {
        const phonemes = (w.Phonemes || []).map((p: { Phoneme: string; AccuracyScore?: number; PronunciationAssessment?: { AccuracyScore?: number } }) => ({
          phoneme: p.Phoneme,
          score: Math.round(p.AccuracyScore ?? p.PronunciationAssessment?.AccuracyScore ?? 0),
        }));
        wordResults.push({
          word: w.Word,
          score: Math.round(w.AccuracyScore ?? w.PronunciationAssessment?.AccuracyScore ?? 0),
          phonemes,
        });
      }
    }

    let verdict: string;
    let feedback: string;
    let example = "";
    const tip = SOUND_TIPS[soundCategory || ""] || "";

    if (overallScore >= 80) {
      verdict = "pass";
      feedback = `Score: ${overallScore}/100 — Good pronunciation!`;
    } else if (overallScore >= 50) {
      verdict = "close";
      const weak = wordResults.flatMap((w) => w.phonemes).filter((p) => p.score < 60).sort((a, b) => a.score - b.score);
      feedback = weak.length > 0
        ? `Score: ${overallScore}/100 — The "${weak[0].phoneme}" sound scored ${weak[0].score}. Focus on that.`
        : `Score: ${overallScore}/100 — Almost there.`;
      example = tip;
    } else {
      verdict = "needs_work";
      feedback = `Score: ${overallScore}/100 — Listen to the American version and try again.`;
      example = tip;
    }

    return NextResponse.json({ verdict, overallScore, words: wordResults, feedback, example });

  } catch (err) {
    return NextResponse.json({ verdict: "compare", overallScore: null, words: [], feedback: `[7] Error: ${String(err).slice(0, 200)}`, example: "" });
  }
}
