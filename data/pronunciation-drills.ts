export interface DrillWord {
  text: string;
  phonetic: string;
  tip: string;
}

export interface SoundCategory {
  id: string;
  name: string;
  description: string;
  minLevel: number;
  words: DrillWord[];
}

export interface ShadowingSentence {
  text: string;
  focus: string[];
  tip: string;
  minLevel: number;
}

export const SOUND_CATEGORIES: SoundCategory[] = [
  {
    id: "th_sound",
    name: "TH Sound",
    description: "Tongue between teeth — voiced and voiceless",
    minLevel: 1,
    words: [
      { text: "think", phonetic: "/θɪŋk/", tip: "Tongue between teeth, blow air — not 'tink'" },
      { text: "this", phonetic: "/ðɪs/", tip: "Same position but vibrate your throat" },
      { text: "three", phonetic: "/θriː/", tip: "Start with TH, not 'tree'" },
      { text: "that", phonetic: "/ðæt/", tip: "Voiced TH — feel the buzz in your throat" },
      { text: "thought", phonetic: "/θɔːt/", tip: "Voiceless TH — just air, no vibration" },
      { text: "the", phonetic: "/ðə/", tip: "Quick voiced TH — tongue barely touches teeth" },
      { text: "weather", phonetic: "/ˈwɛðɚ/", tip: "The TH in the middle — tongue peeks out briefly" },
      { text: "bathroom", phonetic: "/ˈbæθruːm/", tip: "TH before R — tongue out then back quickly" },
      { text: "brother", phonetic: "/ˈbrʌðɚ/", tip: "Voiced TH in the middle — feel the vibration" },
      { text: "nothing", phonetic: "/ˈnʌθɪŋ/", tip: "TH after N — tongue moves forward to teeth" },
      { text: "healthy", phonetic: "/ˈhɛlθi/", tip: "TH after L — tricky combo, practice slowly" },
      { text: "through", phonetic: "/θruː/", tip: "TH + R blend — tongue out then curls back" },
    ],
  },
  {
    id: "flap_t",
    name: "Flap T",
    description: "Americans turn T into a soft D between vowels",
    minLevel: 1,
    words: [
      { text: "water", phonetic: "/ˈwɑːɾɚ/", tip: "Say 'wah-der' — T becomes a quick D tap" },
      { text: "better", phonetic: "/ˈbeɾɚ/", tip: "Say 'beh-der' — soft, quick tongue tap" },
      { text: "city", phonetic: "/ˈsɪɾi/", tip: "Say 'si-dee' — T is barely there" },
      { text: "butter", phonetic: "/ˈbʌɾɚ/", tip: "Say 'buh-der' — light tongue tap" },
      { text: "little", phonetic: "/ˈlɪɾəl/", tip: "Say 'li-dul' — TT becomes a quick D" },
      { text: "matter", phonetic: "/ˈmæɾɚ/", tip: "Say 'mah-der' — same soft D tap" },
      { text: "getting", phonetic: "/ˈɡeɾɪŋ/", tip: "Say 'geh-ding' — the TT softens" },
      { text: "putting", phonetic: "/ˈpʊɾɪŋ/", tip: "Say 'puh-ding' — tongue barely taps" },
      { text: "meeting", phonetic: "/ˈmiːɾɪŋ/", tip: "Say 'mee-ding' — fast tongue tap" },
      { text: "whatever", phonetic: "/wʌɾˈɛvɚ/", tip: "The T in 'what' becomes a D sound" },
      { text: "photograph", phonetic: "/ˈfoʊɾəɡræf/", tip: "The T becomes a soft D between vowels" },
      { text: "got it", phonetic: "/ˈɡɑːɾɪt/", tip: "Blends into 'gah-dit' — one smooth sound" },
    ],
  },
  {
    id: "v_w",
    name: "V vs W",
    description: "V = teeth on lip, W = rounded lips",
    minLevel: 1,
    words: [
      { text: "vine", phonetic: "/vaɪn/", tip: "Upper teeth touch lower lip, then release" },
      { text: "wine", phonetic: "/waɪn/", tip: "Round lips like blowing a candle — no teeth" },
      { text: "very", phonetic: "/ˈvɛri/", tip: "Start with teeth on lip — feel the vibration" },
      { text: "west", phonetic: "/wɛst/", tip: "Round lips, no teeth touching lip at all" },
      { text: "visit", phonetic: "/ˈvɪzɪt/", tip: "V = teeth bite lower lip gently" },
      { text: "wish", phonetic: "/wɪʃ/", tip: "W = lips make a small O shape" },
      { text: "vowel", phonetic: "/vaʊəl/", tip: "Starts with teeth on lip — V sound" },
      { text: "wow", phonetic: "/waʊ/", tip: "Lips round forward — no teeth involved" },
      { text: "oven", phonetic: "/ˈʌvən/", tip: "V in the middle — teeth on lip briefly" },
      { text: "twelve", phonetic: "/twɛlv/", tip: "Ends with V — teeth touch lip at the end" },
      { text: "wave", phonetic: "/weɪv/", tip: "Starts with W (lips), ends with V (teeth)" },
      { text: "vivid", phonetic: "/ˈvɪvɪd/", tip: "Two V sounds — teeth on lip both times" },
    ],
  },
  {
    id: "r_sound",
    name: "R Sound",
    description: "American R — tongue curls back, never taps",
    minLevel: 2,
    words: [
      { text: "car", phonetic: "/kɑːr/", tip: "Curl tongue tip back, don't tap the roof" },
      { text: "work", phonetic: "/wɜːrk/", tip: "Tongue pulls back and bunches up" },
      { text: "right", phonetic: "/raɪt/", tip: "Tongue never touches the roof of mouth" },
      { text: "world", phonetic: "/wɜːrld/", tip: "Keep tongue curled back throughout" },
      { text: "girl", phonetic: "/ɡɜːrl/", tip: "The R colors the whole vowel sound" },
      { text: "mirror", phonetic: "/ˈmɪrɚ/", tip: "Two R sounds — tongue stays back" },
      { text: "computer", phonetic: "/kəmˈpjuːɾɚ/", tip: "Final R — tongue curls at the end" },
      { text: "park", phonetic: "/pɑːrk/", tip: "R after vowel — tongue moves back" },
      { text: "already", phonetic: "/ɔːlˈrɛdi/", tip: "R after L — tongue transitions back" },
      { text: "three", phonetic: "/θriː/", tip: "TH + R combo — tongue out then curls back" },
      { text: "surprise", phonetic: "/sɚˈpraɪz/", tip: "Two R sounds in one word" },
      { text: "restaurant", phonetic: "/ˈrɛstərɑːnt/", tip: "R at the start — tongue back from the beginning" },
    ],
  },
  {
    id: "l_sound",
    name: "L Sound",
    description: "Light L vs Dark L — tongue tip touches ridge",
    minLevel: 2,
    words: [
      { text: "light", phonetic: "/laɪt/", tip: "Tongue tip touches the ridge behind upper teeth" },
      { text: "full", phonetic: "/fʊl/", tip: "Dark L — tongue tip up, back of tongue raised" },
      { text: "feel", phonetic: "/fiːl/", tip: "Dark L at the end — tongue stays up" },
      { text: "really", phonetic: "/ˈriːli/", tip: "Light L in the middle — quick tongue tap" },
      { text: "pull", phonetic: "/pʊl/", tip: "Dark L — hold tongue at the ridge" },
      { text: "life", phonetic: "/laɪf/", tip: "Light L at start — clear and bright" },
      { text: "apple", phonetic: "/ˈæpəl/", tip: "Dark L at the end — don't drop the L" },
      { text: "world", phonetic: "/wɜːrld/", tip: "R + L combo — hardest English sound pair" },
      { text: "little", phonetic: "/ˈlɪɾəl/", tip: "Light L start + Dark L end" },
      { text: "people", phonetic: "/ˈpiːpəl/", tip: "Dark L — tongue stays at ridge" },
      { text: "real", phonetic: "/riːl/", tip: "R then L — tongue curls back then forward" },
      { text: "actually", phonetic: "/ˈæktʃuəli/", tip: "Light L near the end — don't swallow it" },
    ],
  },
  {
    id: "stress",
    name: "Word Stress",
    description: "Which syllable gets the emphasis",
    minLevel: 3,
    words: [
      { text: "develop", phonetic: "/dɪˈvɛləp/", tip: "de-VEL-op — stress on the second syllable" },
      { text: "comfortable", phonetic: "/ˈkʌmftɚbəl/", tip: "COMF-ter-bul — 3 syllables, not 4" },
      { text: "interesting", phonetic: "/ˈɪntrɪstɪŋ/", tip: "IN-tres-ting — 3 syllables, stress on IN" },
      { text: "experience", phonetic: "/ɪkˈspɪriəns/", tip: "ik-SPEER-ee-ens — stress on second" },
      { text: "photography", phonetic: "/fəˈtɑːɡrəfi/", tip: "fuh-TOG-ruh-fee — stress on TOG" },
      { text: "advertisement", phonetic: "/ˌædvɚˈtaɪzmənt/", tip: "ad-ver-TIZE-ment — stress on TIZE" },
      { text: "presentation", phonetic: "/ˌprɛzənˈteɪʃən/", tip: "prezen-TAY-shun — stress on TAY" },
      { text: "communicate", phonetic: "/kəˈmjuːnɪkeɪt/", tip: "kuh-MYOO-nih-kate — stress on MYOO" },
      { text: "technology", phonetic: "/tɛkˈnɑːlədʒi/", tip: "tek-NOL-uh-jee — stress on NOL" },
      { text: "opportunity", phonetic: "/ˌɑːpɚˈtuːnɪɾi/", tip: "ah-per-TOO-nih-dee — stress on TOO" },
      { text: "environment", phonetic: "/ɪnˈvaɪrənmənt/", tip: "in-VY-run-ment — stress on VY" },
      { text: "organization", phonetic: "/ˌɔːrɡənəˈzeɪʃən/", tip: "or-guh-nuh-ZAY-shun — stress on ZAY" },
    ],
  },
  {
    id: "vowels",
    name: "Vowel Sounds",
    description: "American vowels differ from other accents",
    minLevel: 2,
    words: [
      { text: "hot", phonetic: "/hɑːt/", tip: "American: open 'ah' sound — not British 'o'" },
      { text: "cat", phonetic: "/kæt/", tip: "Wide open mouth — 'æ' sound, not 'eh'" },
      { text: "but", phonetic: "/bʌt/", tip: "Short 'uh' — mouth barely open" },
      { text: "bird", phonetic: "/bɜːrd/", tip: "R-colored vowel — tongue curls back" },
      { text: "about", phonetic: "/əˈbaʊt/", tip: "First syllable is schwa 'uh' — unstressed" },
      { text: "cop", phonetic: "/kɑːp/", tip: "Same 'ah' as 'hot' — not 'o' like British" },
      { text: "caught", phonetic: "/kɔːt/", tip: "Rounded 'aw' — lips slightly rounded" },
      { text: "food", phonetic: "/fuːd/", tip: "Long 'oo' — lips pushed forward" },
      { text: "good", phonetic: "/ɡʊd/", tip: "Short 'oo' — relaxed, not as tight" },
      { text: "face", phonetic: "/feɪs/", tip: "Diphthong 'ay' — mouth moves from open to smile" },
      { text: "price", phonetic: "/praɪs/", tip: "Diphthong 'eye' — wide open then closes" },
      { text: "goat", phonetic: "/ɡoʊt/", tip: "Diphthong 'oh' — starts open, lips round" },
    ],
  },
  {
    id: "connected",
    name: "Connected Speech",
    description: "How words blend together in natural American English",
    minLevel: 4,
    words: [
      { text: "got it", phonetic: "/ˈɡɑːɾɪt/", tip: "Blends into 'gah-dit' — one smooth sound" },
      { text: "want to", phonetic: "/ˈwɑːnə/", tip: "Say 'wanna' — T disappears completely" },
      { text: "going to", phonetic: "/ˈɡʌnə/", tip: "Say 'gonna' — three words become two syllables" },
      { text: "let me", phonetic: "/ˈlɛmmi/", tip: "Say 'lemme' — T becomes M" },
      { text: "give me", phonetic: "/ˈɡɪmmi/", tip: "Say 'gimme' — V becomes M" },
      { text: "don't know", phonetic: "/doʊnoʊ/", tip: "Say 'dunno' — T drops out" },
      { text: "kind of", phonetic: "/ˈkaɪndə/", tip: "Say 'kinda' — 'of' reduces to 'uh'" },
      { text: "a lot of", phonetic: "/əˈlɑːɾə/", tip: "Say 'a lah-duh' — T becomes D, 'of' becomes 'uh'" },
      { text: "what are you", phonetic: "/wʌɾɚju/", tip: "Say 'wuh-der-you' — blends together" },
      { text: "should have", phonetic: "/ˈʃʊdəv/", tip: "Say 'should-uv' — 'have' becomes 'uv'" },
      { text: "out of", phonetic: "/ˈaʊɾə/", tip: "Say 'ouh-duh' — T becomes D, 'of' becomes 'uh'" },
      { text: "come on", phonetic: "/ˈkʌmɑːn/", tip: "Say 'kuh-mahn' — words link together" },
    ],
  },
  {
    id: "final_consonants",
    name: "Final Consonants",
    description: "Don't drop the ending sounds",
    minLevel: 3,
    words: [
      { text: "helped", phonetic: "/hɛlpt/", tip: "Say the final 'pt' — don't drop the T" },
      { text: "asked", phonetic: "/æskt/", tip: "Three consonants at the end: S-K-T" },
      { text: "months", phonetic: "/mʌnθs/", tip: "End with TH + S — tongue out then hiss" },
      { text: "worked", phonetic: "/wɜːrkt/", tip: "End with K-T — two pops at the end" },
      { text: "described", phonetic: "/dɪˈskraɪbd/", tip: "End with B-D — voice the final sounds" },
      { text: "changed", phonetic: "/tʃeɪndʒd/", tip: "End with J-D — don't drop the D" },
      { text: "finished", phonetic: "/ˈfɪnɪʃt/", tip: "End with SH-T — the T is important" },
      { text: "development", phonetic: "/dɪˈvɛləpmənt/", tip: "End clearly with '-ment' not '-men'" },
      { text: "product", phonetic: "/ˈprɑːdʌkt/", tip: "End with K-T — release both sounds" },
      { text: "fact", phonetic: "/fækt/", tip: "End with K-T — don't say just 'fak'" },
      { text: "accept", phonetic: "/əkˈsɛpt/", tip: "End with P-T — both lips and tongue" },
      { text: "next", phonetic: "/nɛkst/", tip: "End with K-S-T — three consonants" },
    ],
  },
  {
    id: "schwa",
    name: "Schwa Sound",
    description: "The most common vowel in English — the lazy 'uh'",
    minLevel: 3,
    words: [
      { text: "about", phonetic: "/əˈbaʊt/", tip: "First syllable: lazy 'uh' not 'ay'" },
      { text: "banana", phonetic: "/bəˈnænə/", tip: "Three schwas — buh-NAN-uh" },
      { text: "problem", phonetic: "/ˈprɑːbləm/", tip: "Second syllable: 'lum' not 'lem'" },
      { text: "today", phonetic: "/təˈdeɪ/", tip: "First syllable: quick 'tuh' not 'too'" },
      { text: "support", phonetic: "/səˈpɔːrt/", tip: "First syllable: quick 'suh'" },
      { text: "company", phonetic: "/ˈkʌmpəni/", tip: "Last two syllables: 'puh-nee'" },
      { text: "percent", phonetic: "/pɚˈsɛnt/", tip: "First syllable: 'per' with R-colored schwa" },
      { text: "official", phonetic: "/əˈfɪʃəl/", tip: "First and last: both schwa — 'uh-FISH-ul'" },
      { text: "information", phonetic: "/ˌɪnfɚˈmeɪʃən/", tip: "Unstressed syllables all reduce to schwa" },
      { text: "difficult", phonetic: "/ˈdɪfɪkəlt/", tip: "Third syllable: 'kult' with schwa" },
      { text: "general", phonetic: "/ˈdʒɛnɚəl/", tip: "Last syllables: 'ner-ul' — schwas everywhere" },
      { text: "particular", phonetic: "/pɚˈtɪkjəlɚ/", tip: "Multiple schwas — per-TIK-yuh-ler" },
    ],
  },
];

export const SHADOWING_SENTENCES: ShadowingSentence[] = [
  // Level 1 — basic sounds
  { text: "I think that works", focus: ["th_sound"], tip: "Two TH sounds — tongue between teeth for both", minLevel: 1 },
  { text: "Better late than never", focus: ["flap_t", "th_sound"], tip: "'Better' is 'beh-der', 'than' needs tongue between teeth", minLevel: 1 },
  { text: "We had a very good time", focus: ["v_w"], tip: "'Very' — upper teeth touch lower lip, vibrate", minLevel: 1 },
  { text: "I visited the city last week", focus: ["v_w", "flap_t"], tip: "'Visited' starts with V (teeth on lip), 'city' is 'si-dee'", minLevel: 1 },
  { text: "Can I get a glass of water", focus: ["flap_t"], tip: "'Water' is 'wah-der', 'get a' becomes 'geh-duh'", minLevel: 1 },
  // Level 2 — R, L, vowels
  { text: "What are you working on", focus: ["r_sound"], tip: "'Working' has the American R — tongue curls back", minLevel: 2 },
  { text: "The weather is really nice today", focus: ["th_sound", "flap_t", "r_sound"], tip: "'Weather' is 'weh-der' with TH, 'really' has American R", minLevel: 2 },
  { text: "I would rather not", focus: ["r_sound", "flap_t"], tip: "'Rather' has American R + 'ra-der' soft T", minLevel: 2 },
  { text: "I have three years of experience", focus: ["th_sound", "r_sound", "stress"], tip: "'Three' with TH, 'years' with American R, stress on 'exPERience'", minLevel: 2 },
  // Level 3 — stress, schwa, final consonants
  { text: "That was a great presentation", focus: ["th_sound", "stress"], tip: "'That' with TH, stress on 'presen-TAY-tion'", minLevel: 3 },
  { text: "I worked on developing that feature", focus: ["final_consonants", "stress", "flap_t"], tip: "'Worked' — say the final KT, 'developing' — stress on VEL", minLevel: 3 },
  { text: "Let me think about it", focus: ["th_sound", "schwa"], tip: "'Think' with TH, 'about' starts with schwa 'uh'", minLevel: 3 },
  { text: "Actually it is kind of difficult", focus: ["schwa", "l_sound"], tip: "'Actually' — don't drop the L, 'difficult' has schwa", minLevel: 3 },
  // Level 4 — connected speech, fluency
  { text: "I got it", focus: ["flap_t", "connected"], tip: "'Got it' blends into 'gah-dit' — one smooth sound", minLevel: 4 },
  { text: "Do you want to grab a coffee", focus: ["connected", "flap_t"], tip: "'Want to' becomes 'wanna', 'grab a' links together", minLevel: 4 },
  { text: "I should have called earlier", focus: ["connected", "schwa"], tip: "'Should have' becomes 'should-uv', 'earlier' has R", minLevel: 4 },
  { text: "We are going to need more people", focus: ["connected", "schwa"], tip: "'Going to' becomes 'gonna', 'people' ends with dark L", minLevel: 4 },
  { text: "Can you give me a little more time", focus: ["connected", "flap_t"], tip: "'Give me' becomes 'gimme', 'little' is 'li-dul'", minLevel: 4 },
];
