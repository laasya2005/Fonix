import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SOUNDS = [
  {
    id: "th_sound",
    prompt: "Medical illustration cross-section diagram of a human mouth showing the TH sound pronunciation. Side view cutaway showing the tongue sticking out slightly between the upper and lower front teeth, with air flowing over the tongue. Clean white background, anatomical style, labeled arrows showing tongue position and airflow direction. Professional speech therapy educational diagram. No text labels, just the visual.",
  },
  {
    id: "flap_t",
    prompt: "Medical illustration cross-section diagram of a human mouth showing the American flap T sound (as in 'water'). Side view cutaway showing the tongue tip quickly tapping the alveolar ridge (the bumpy area right behind the upper front teeth), with a small arrow showing the quick tapping motion. Clean white background, anatomical style, professional speech therapy educational diagram. No text labels.",
  },
  {
    id: "v_w",
    prompt: "Medical illustration showing TWO side-by-side cross-section diagrams of a human mouth. LEFT: V sound - upper teeth gently biting the lower lip with vibration lines. RIGHT: W sound - lips pushed forward in a small round circle, no teeth touching lip. Clean white background, anatomical style, professional speech therapy diagram showing the contrast. No text labels.",
  },
  {
    id: "r_sound",
    prompt: "Medical illustration cross-section diagram of a human mouth showing the American R sound pronunciation. Side view cutaway showing the tongue curled backward in the mouth, NOT touching the roof, with the sides of the tongue touching the upper back teeth. The tongue tip points backward. Clean white background, anatomical style, professional speech therapy educational diagram. No text labels.",
  },
  {
    id: "l_sound",
    prompt: "Medical illustration cross-section diagram of a human mouth showing the L sound pronunciation. Side view cutaway showing the tongue tip pressing firmly against the alveolar ridge (behind upper front teeth), with air flowing around the sides of the tongue. Clean white background, anatomical style, professional speech therapy educational diagram. No text labels.",
  },
  {
    id: "stress",
    prompt: "Clean educational diagram showing the concept of word stress in English pronunciation. Visual representation of the word 'ba-NA-na' with the middle syllable shown larger and bolder, with a sound wave above it that peaks at the stressed syllable. Minimal, modern design on white background. Professional linguistics educational illustration. No photographs.",
  },
  {
    id: "vowels",
    prompt: "Medical illustration showing four front-view diagrams of mouth openings for different American English vowel sounds arranged in a 2x2 grid. Top-left: wide open mouth (as in 'hot'). Top-right: wide stretched mouth (as in 'cat'). Bottom-left: slightly open relaxed mouth (as in 'but'). Bottom-right: rounded forward lips (as in 'food'). Clean white background, anatomical style. No text labels.",
  },
  {
    id: "connected",
    prompt: "Clean modern educational illustration showing connected speech in English. Two words 'GOT' and 'IT' shown merging together with a flowing arrow connecting them into one smooth sound 'GODIT'. Minimal design with sound wave graphics showing smooth connection. White background, professional linguistics diagram. No photographs.",
  },
  {
    id: "final_consonants",
    prompt: "Medical illustration cross-section diagram showing mouth positions for final consonant sounds. Side view showing the tongue and lips in position to release a final T sound - tongue pressed against alveolar ridge about to release with a small puff of air shown. Clean white background, anatomical style, professional speech therapy diagram. No text labels.",
  },
  {
    id: "schwa",
    prompt: "Medical illustration front view of a human mouth showing the schwa sound (the lazy 'uh' sound). Mouth is slightly open, very relaxed, tongue is flat and resting low in the mouth, jaw dropped slightly. The most relaxed possible mouth position. Clean white background, anatomical style, professional speech therapy diagram. No text labels.",
  },
];

async function generate() {
  for (const sound of SOUNDS) {
    const outPath = path.join("public", "mouth", `${sound.id}.png`);

    if (fs.existsSync(outPath)) {
      console.log(`Skipping ${sound.id} — already exists`);
      continue;
    }

    console.log(`Generating ${sound.id}...`);
    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: sound.prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      const imageUrl = response.data[0]?.url;
      if (!imageUrl) {
        console.log(`  No URL returned for ${sound.id}`);
        continue;
      }

      const imageResponse = await fetch(imageUrl);
      const buffer = Buffer.from(await imageResponse.arrayBuffer());
      fs.writeFileSync(outPath, buffer);
      console.log(`  Saved ${outPath}`);
    } catch (err) {
      console.log(`  Error generating ${sound.id}:`, err.message);
    }
  }
  console.log("Done!");
}

generate();
