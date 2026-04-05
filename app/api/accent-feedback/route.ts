import { NextRequest, NextResponse } from "next/server";

// The accent feedback API now returns targeted coaching tips
// based on the sound category — NOT AI-judged pass/fail
// because Whisper+GPT cannot reliably detect accent-level differences.
// The real feedback comes from the user's own A/B comparison.

const TIPS: Record<string, { feedback: string; reminder: string }> = {
  th_sound: {
    feedback: "Listen back: does your TH sound airy (correct) or like a hard T/D (needs work)?",
    reminder: "Tongue should be visible between your teeth. If it's behind your teeth, you're making a T sound.",
  },
  flap_t: {
    feedback: "Listen back: does the T sound soft like a quick D (correct) or like a hard T (needs work)?",
    reminder: "The tongue should barely tap the roof — like saying 'da' very quickly. Not a strong T.",
  },
  v_w: {
    feedback: "Listen back: for V, can you hear the buzzy teeth-on-lip sound? For W, is it smooth with no buzz?",
    reminder: "V = upper teeth touch lower lip (you feel vibration). W = lips round forward, no teeth.",
  },
  r_sound: {
    feedback: "Listen back: does your R sound thick and American (correct) or light/tapped (needs work)?",
    reminder: "Tongue curls back and NEVER touches the roof. If your tongue taps, it's not the American R.",
  },
  l_sound: {
    feedback: "Listen back: at the end of words, can you still hear the L or does it disappear?",
    reminder: "For dark L (end of words), tongue tip stays pressed on the ridge. Don't drop it.",
  },
  stress: {
    feedback: "Listen back: is one syllable clearly LOUDER and LONGER than the others?",
    reminder: "The stressed syllable should pop out. Unstressed syllables should be quick and quiet.",
  },
  vowels: {
    feedback: "Listen back: does your vowel match the American version or does it sound different?",
    reminder: "American vowels are often more open and relaxed. 'Hot' = wide open 'ah', not rounded 'o'.",
  },
  connected: {
    feedback: "Listen back: do the words flow together smoothly or do they sound choppy and separate?",
    reminder: "Don't pause between words. Let them blend: 'want to' → 'wanna', 'got it' → 'gadit'.",
  },
  final_consonants: {
    feedback: "Listen back: can you hear the ending sounds clearly or do they get swallowed?",
    reminder: "Exaggerate the ending at first. 'Worked' = work-T. Make sure the final sound comes out.",
  },
  schwa: {
    feedback: "Listen back: are your unstressed syllables quick and lazy ('uh') or are you pronouncing every vowel fully?",
    reminder: "Unstressed syllables should be fast and reduced to 'uh'. 'banana' = buh-NAN-uh, not ba-NA-na.",
  },
};

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const targetWord = formData.get("word") as string;
  const targetSentence = formData.get("sentence") as string;
  const tip = formData.get("tip") as string;

  // Determine which sound category this belongs to
  // Look for keywords in the tip to match a category
  let category = "general";
  const tipLower = (tip || "").toLowerCase();
  if (tipLower.includes("th") || tipLower.includes("tongue between teeth")) category = "th_sound";
  else if (tipLower.includes("flap") || tipLower.includes("wah-der") || tipLower.includes("soft d") || tipLower.includes("beh-der")) category = "flap_t";
  else if (tipLower.includes("v ") || tipLower.includes("w ") || tipLower.includes("teeth on lip") || tipLower.includes("rounded lip")) category = "v_w";
  else if (tipLower.includes("curl") || tipLower.includes("american r")) category = "r_sound";
  else if (tipLower.includes("light l") || tipLower.includes("dark l") || tipLower.includes("ridge")) category = "l_sound";
  else if (tipLower.includes("stress") || tipLower.includes("syllable")) category = "stress";
  else if (tipLower.includes("vowel") || tipLower.includes("open") || tipLower.includes("rounded")) category = "vowels";
  else if (tipLower.includes("blend") || tipLower.includes("wanna") || tipLower.includes("gonna") || tipLower.includes("link")) category = "connected";
  else if (tipLower.includes("ending") || tipLower.includes("final") || tipLower.includes("drop")) category = "final_consonants";
  else if (tipLower.includes("schwa") || tipLower.includes("lazy") || tipLower.includes("uh")) category = "schwa";

  const matched = TIPS[category] || {
    feedback: "Listen to both recordings — does yours match the American version?",
    reminder: "Focus on matching the exact sounds, not just the words.",
  };

  return NextResponse.json({
    verdict: "compare",
    feedback: matched.feedback,
    example: matched.reminder,
  });
}
