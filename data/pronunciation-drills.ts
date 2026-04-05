export interface DrillWord {
  text: string;
  phonetic: string;
  tip: string;
}

export interface SoundCategory {
  id: string;
  name: string;
  description: string;
  words: DrillWord[];
}

export interface ShadowingSentence {
  text: string;
  focus: string[];
  tip: string;
}

export const SOUND_CATEGORIES: SoundCategory[] = [
  {
    id: "th_sound",
    name: "TH Sound",
    description: "Place tongue between teeth",
    words: [
      { text: "think", phonetic: "/θɪŋk/", tip: "Tongue between teeth, blow air — not 'tink'" },
      { text: "this", phonetic: "/ðɪs/", tip: "Same position but vibrate your throat" },
      { text: "three", phonetic: "/θriː/", tip: "Start with TH, not 'tree'" },
      { text: "that", phonetic: "/ðæt/", tip: "Voiced TH — feel the buzz in your throat" },
      { text: "thought", phonetic: "/θɔːt/", tip: "Voiceless TH — just air, no vibration" },
      { text: "the", phonetic: "/ðə/", tip: "Quick voiced TH — tongue barely touches teeth" },
    ],
  },
  {
    id: "flap_t",
    name: "Flap T",
    description: "The soft 'd' sound Americans use",
    words: [
      { text: "water", phonetic: "/ˈwɑːɾɚ/", tip: "Say 'wah-der' — T becomes a quick D tap" },
      { text: "better", phonetic: "/ˈbeɾɚ/", tip: "Say 'beh-der' — soft, quick tongue tap on roof of mouth" },
      { text: "city", phonetic: "/ˈsɪɾi/", tip: "Say 'si-dee' — T is barely there" },
      { text: "butter", phonetic: "/ˈbʌɾɚ/", tip: "Say 'buh-der' — light tongue tap, not a hard T" },
      { text: "little", phonetic: "/ˈlɪɾəl/", tip: "Say 'li-dul' — TT becomes a quick D" },
      { text: "matter", phonetic: "/ˈmæɾɚ/", tip: "Say 'mah-der' — same soft D tap" },
    ],
  },
  {
    id: "v_w",
    name: "V vs W",
    description: "Two different mouth shapes",
    words: [
      { text: "vine", phonetic: "/vaɪn/", tip: "Bite lower lip lightly, then release — not 'wine'" },
      { text: "wine", phonetic: "/waɪn/", tip: "Round lips like blowing a candle — no lip biting" },
      { text: "very", phonetic: "/ˈvɛri/", tip: "Upper teeth touch lower lip" },
      { text: "west", phonetic: "/wɛst/", tip: "Round lips, no teeth touching lip" },
      { text: "visit", phonetic: "/ˈvɪzɪt/", tip: "Start with teeth on lip — feel the vibration" },
      { text: "wish", phonetic: "/wɪʃ/", tip: "Lips rounded in an O shape, no teeth" },
    ],
  },
  {
    id: "r_sound",
    name: "R Sound",
    description: "The American R — tongue curls back",
    words: [
      { text: "car", phonetic: "/kɑːr/", tip: "Curl tongue tip back, don't tap the roof" },
      { text: "work", phonetic: "/wɜːrk/", tip: "Tongue pulls back and bunches up" },
      { text: "right", phonetic: "/raɪt/", tip: "Tongue never touches the roof of mouth" },
      { text: "world", phonetic: "/wɜːrld/", tip: "Keep tongue curled back throughout" },
      { text: "girl", phonetic: "/ɡɜːrl/", tip: "The R colors the whole vowel sound" },
      { text: "mirror", phonetic: "/ˈmɪrɚ/", tip: "Two R sounds — tongue stays back" },
    ],
  },
  {
    id: "stress",
    name: "Word Stress",
    description: "Stress the right syllable",
    words: [
      { text: "develop", phonetic: "/dɪˈvɛləp/", tip: "Stress on VEL — de-VEL-op, not DE-vel-op" },
      { text: "comfortable", phonetic: "/ˈkʌmftɚbəl/", tip: "Say 'COMF-ter-bul' — only 3 syllables in American English" },
      { text: "interesting", phonetic: "/ˈɪntrɪstɪŋ/", tip: "Say 'IN-tres-ting' — 3 syllables, stress on IN" },
      { text: "experience", phonetic: "/ɪkˈspɪriəns/", tip: "Stress on SPEER — ik-SPEER-ee-ens" },
      { text: "photography", phonetic: "/fəˈtɑːɡrəfi/", tip: "Stress on TOG — fuh-TOG-ruh-fee" },
      { text: "advertisement", phonetic: "/ˌædvɚˈtaɪzmənt/", tip: "Stress on TIZE — ad-ver-TIZE-ment" },
    ],
  },
];

export const SHADOWING_SENTENCES: ShadowingSentence[] = [
  { text: "I got it", focus: ["flap_t"], tip: "'Got it' blends into 'gah-dit' — the T is soft" },
  { text: "Better late than never", focus: ["flap_t", "th_sound"], tip: "'Better' → 'beh-der', 'than' → tongue between teeth" },
  { text: "Can I get a glass of water", focus: ["flap_t"], tip: "'Water' → 'wah-der', 'get a' → 'geh-duh'" },
  { text: "I think that works", focus: ["th_sound"], tip: "Two TH sounds — 'think' and 'that' — both need tongue between teeth" },
  { text: "What are you working on", focus: ["r_sound", "flap_t"], tip: "'Working' → American R, 'what are' → 'wuh-dar'" },
  { text: "I have three years of experience", focus: ["th_sound", "r_sound", "stress"], tip: "'Three' with TH, 'years' with American R, stress on 'exPERience'" },
  { text: "The weather is really nice today", focus: ["th_sound", "flap_t", "r_sound"], tip: "'The' and 'weather' both have TH, 'really' has American R, 'weather' → 'weh-der'" },
  { text: "I visited the city last week", focus: ["v_w", "flap_t"], tip: "'Visited' starts with V (teeth on lip), 'city' → 'si-dee'" },
  { text: "We had a very good time", focus: ["v_w"], tip: "'Very' — upper teeth touch lower lip, vibrate" },
  { text: "Let me think about it", focus: ["th_sound", "flap_t"], tip: "'Think' with TH, 'about it' → 'abou-dit'" },
  { text: "That was a great presentation", focus: ["th_sound", "stress"], tip: "'That' with TH, stress on 'presen-TA-tion'" },
  { text: "I would rather not", focus: ["r_sound", "flap_t"], tip: "'Rather' → American R + 'ra-der' soft T" },
];
