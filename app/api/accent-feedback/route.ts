import { NextRequest, NextResponse } from "next/server";

const SOUND_TIPS: Record<string, string> = {
  th_sound: "Tongue should be between your teeth. If it sounds like T or D, your tongue is behind your teeth.",
  flap_t: "The T should be a quick, soft tongue tap — like a fast D. Not a hard T.",
  v_w: "For V, upper teeth must touch lower lip. For W, just round your lips.",
  r_sound: "Curl your tongue backward — it should NOT touch the roof of your mouth.",
  l_sound: "Touch your tongue tip to the ridge behind your upper front teeth.",
  stress: "The stressed syllable should be LOUDER and LONGER than the others.",
  vowels: "American vowels are open and relaxed. Listen carefully to the model.",
  connected: "Let words flow together. Don't pause between each word.",
  final_consonants: "Make sure you release the final sounds. Don't swallow the ending.",
  schwa: "Unstressed syllables should be a quick, lazy 'uh' — not a full vowel.",
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

  if (!speechKey) {
    return NextResponse.json({ verdict: "compare", overallScore: null, feedback: "DEBUG: Azure Speech key not found in env vars.", example: "" });
  }
  if (!audioFile) {
    return NextResponse.json({ verdict: "compare", overallScore: null, feedback: "DEBUG: No audio file in form data.", example: "" });
  }
  if (audioFile.size === 0) {
    return NextResponse.json({ verdict: "compare", overallScore: null, feedback: "DEBUG: Audio file is empty (0 bytes).", example: "" });
  }

  try {
    const audioBuffer = await audioFile.arrayBuffer();
    console.log(`Audio received: ${audioBuffer.byteLength} bytes, type: ${audioFile.type}, target: "${target}"`);

    // Azure Pronunciation Assessment via REST API (no SDK needed)
    const pronAssessmentParams = {
      ReferenceText: target,
      GradingSystem: "HundredMark",
      Granularity: "Phoneme",
      Dimension: "Comprehensive",
      EnableMiscue: true,
    };

    const pronHeader = Buffer.from(JSON.stringify(pronAssessmentParams)).toString("base64");

    const response = await fetch(
      `https://${speechRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": speechKey,
          "Content-Type": "audio/wav",
          "Pronunciation-Assessment": pronHeader,
          "Accept": "application/json",
        },
        body: audioBuffer,
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Azure Speech error:", response.status, errText);
      return NextResponse.json({ verdict: "compare", overallScore: null, feedback: `Azure error ${response.status}: ${errText.slice(0, 150)}`, example: "" });
    }

    const result = await response.json();
    console.log("Azure result:", JSON.stringify(result).slice(0, 500));

    if (result.RecognitionStatus !== "Success") {
      return NextResponse.json({
        verdict: "needs_work",
        overallScore: null,
        feedback: "Could not recognize your speech. Try speaking louder and closer to the mic.",
        example: "",
      });
    }

    // Extract pronunciation assessment
    const nBest = result.NBest?.[0];
    if (!nBest?.PronunciationAssessment) {
      return NextResponse.json({
        verdict: "compare",
        overallScore: null,
        feedback: SOUND_TIPS[soundCategory || ""] || "Listen to both recordings and compare.",
        example: "",
      });
    }

    const assessment = nBest.PronunciationAssessment;
    const overallScore = Math.round(assessment.PronScore || 0);
    const accuracyScore = Math.round(assessment.AccuracyScore || 0);
    const fluencyScore = Math.round(assessment.FluencyScore || 0);
    const completenessScore = Math.round(assessment.CompletenessScore || 0);

    // Get word-level and phoneme-level details
    const wordResults: Array<{ word: string; score: number; phonemes: Array<{ phoneme: string; score: number }> }> = [];

    if (nBest.Words) {
      for (const w of nBest.Words) {
        const phonemes = (w.Phonemes || []).map((p: { Phoneme: string; PronunciationAssessment?: { AccuracyScore?: number } }) => ({
          phoneme: p.Phoneme,
          score: Math.round(p.PronunciationAssessment?.AccuracyScore || 0),
        }));
        wordResults.push({
          word: w.Word,
          score: Math.round(w.PronunciationAssessment?.AccuracyScore || 0),
          phonemes,
        });
      }
    }

    // Determine verdict
    let verdict: string;
    let feedback: string;
    let example = "";

    if (overallScore >= 80) {
      verdict = "pass";
      feedback = `Score: ${overallScore}/100 — Good American pronunciation!`;
    } else if (overallScore >= 50) {
      verdict = "close";
      const weakPhonemes = wordResults.flatMap((w) => w.phonemes).filter((p) => p.score < 60);
      if (weakPhonemes.length > 0) {
        const worst = weakPhonemes.sort((a, b) => a.score - b.score)[0];
        feedback = `Score: ${overallScore}/100 — The "${worst.phoneme}" sound scored ${worst.score}/100. Focus on that sound.`;
      } else {
        feedback = `Score: ${overallScore}/100 — Almost there. Listen to the American version again.`;
      }
      example = SOUND_TIPS[soundCategory || ""] || "";
    } else {
      verdict = "needs_work";
      feedback = `Score: ${overallScore}/100 — Listen to the American version carefully, then try again.`;
      example = SOUND_TIPS[soundCategory || ""] || "";
    }

    return NextResponse.json({
      verdict,
      overallScore,
      scores: { accuracy: accuracyScore, fluency: fluencyScore, completeness: completenessScore },
      words: wordResults,
      feedback,
      example,
    });
  } catch (err) {
    console.error("Accent feedback error:", err);
    return NextResponse.json({ verdict: "compare", overallScore: null, feedback: `Error: ${String(err).slice(0, 200)}`, example: "" });
  }
}
