import { NextRequest, NextResponse } from "next/server";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

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
  const tip = formData.get("tip") as string;
  const soundCategory = formData.get("category") as string;
  const audioFile = formData.get("audio") as File | null;

  const target = targetWord || targetSentence || "";
  const speechKey = process.env.AZURE_SPEECH_KEY;
  const speechRegion = process.env.AZURE_SPEECH_REGION;

  // If no Azure key or no audio, return self-check tips
  if (!speechKey || !speechRegion || !audioFile || audioFile.size === 0) {
    const catTip = SOUND_TIPS[soundCategory || ""] || "Listen to both recordings and compare.";
    return NextResponse.json({
      verdict: "compare",
      overallScore: null,
      phonemeScores: [],
      feedback: catTip,
      example: "",
    });
  }

  try {
    const wavBuffer = Buffer.from(await audioFile.arrayBuffer());

    // Audio arrives as WAV (16kHz, 16-bit, mono) from the browser recorder
    // Azure Speech Pronunciation Assessment
    const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
    speechConfig.speechRecognitionLanguage = "en-US";

    const pronunciationConfig = sdk.PronunciationAssessmentConfig.fromJSON(JSON.stringify({
      referenceText: target,
      gradingSystem: "HundredMark",
      granularity: "Phoneme",
      dimension: "Comprehensive",
      enableMiscue: true,
    }));

    // Push WAV PCM data into the stream (skip 44-byte WAV header)
    const format = sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1);
    const pushStream = sdk.AudioInputStream.createPushStream(format);
    const pcmData = wavBuffer.slice(44);
    pushStream.write(pcmData.buffer.slice(pcmData.byteOffset, pcmData.byteOffset + pcmData.byteLength));
    pushStream.close();

    const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
    pronunciationConfig.applyTo(recognizer);

    const result = await new Promise<sdk.SpeechRecognitionResult>((resolve, reject) => {
      recognizer.recognizeOnceAsync(
        (res) => { recognizer.close(); resolve(res); },
        (err) => { recognizer.close(); reject(err); }
      );
    });

    if (result.reason === sdk.ResultReason.RecognizedSpeech) {
      const assessment = sdk.PronunciationAssessmentResult.fromResult(result);

      const overallScore = Math.round(assessment.pronunciationScore);
      const accuracyScore = Math.round(assessment.accuracyScore);
      const fluencyScore = Math.round(assessment.fluencyScore);
      const completenessScore = Math.round(assessment.completenessScore);

      // Get word-level and phoneme-level details
      const wordResults: Array<{ word: string; score: number; phonemes: Array<{ phoneme: string; score: number }> }> = [];

      const detailResult = result.properties.getProperty(
        sdk.PropertyId.SpeechServiceResponse_JsonResult
      );

      if (detailResult) {
        try {
          const parsed = JSON.parse(detailResult);
          const nBest = parsed?.NBest?.[0];
          if (nBest?.Words) {
            for (const w of nBest.Words) {
              const phonemes = (w.Phonemes || []).map((p: { Phoneme: string; PronunciationAssessment: { AccuracyScore: number } }) => ({
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
        } catch { /* parsing failed, use summary scores */ }
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
        // Find the worst phoneme
        const weakPhonemes = wordResults.flatMap((w) => w.phonemes).filter((p) => p.score < 60);
        if (weakPhonemes.length > 0) {
          const worst = weakPhonemes.sort((a, b) => a.score - b.score)[0];
          feedback = `Score: ${overallScore}/100 — The "${worst.phoneme}" sound scored ${worst.score}/100. Focus on that sound.`;
        } else {
          feedback = `Score: ${overallScore}/100 — Almost there. Listen to the American version again and try to match it more closely.`;
        }
        example = SOUND_TIPS[soundCategory || ""] || "Compare your recording with the American version.";
      } else {
        verdict = "needs_work";
        feedback = `Score: ${overallScore}/100 — Listen to the American version carefully, then try again.`;
        example = SOUND_TIPS[soundCategory || ""] || "Watch the tutorial video and focus on mouth position.";
      }

      return NextResponse.json({
        verdict,
        overallScore,
        scores: { accuracy: accuracyScore, fluency: fluencyScore, completeness: completenessScore },
        words: wordResults,
        feedback,
        example,
      });
    }

    // Speech not recognized
    return NextResponse.json({
      verdict: "needs_work",
      overallScore: null,
      feedback: "Could not recognize your speech. Try speaking louder and closer to the mic.",
      example: "",
    });
  } catch (err) {
    // Azure error — fall back to self-check
    const catTip = SOUND_TIPS[soundCategory || ""] || "Listen to both recordings and compare.";
    return NextResponse.json({
      verdict: "compare",
      overallScore: null,
      feedback: catTip,
      example: String(err).includes("401") ? "Azure key issue — check your credentials." : "",
    });
  }
}
