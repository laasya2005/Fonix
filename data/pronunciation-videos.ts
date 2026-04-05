/**
 * YouTube video IDs for pronunciation tutorials.
 * These are from well-known pronunciation channels:
 * - Rachel's English
 * - Sounds American
 * - English with Lucy
 * - Pronunciation Pro
 *
 * To update: search YouTube for "[sound name] American English pronunciation"
 * and replace the video ID (the part after ?v= in the URL)
 */
export const PRONUNCIATION_VIDEOS: Record<string, { videoId: string; title: string; channel: string }> = {
  th_sound: { videoId: "EZb_EWVCUoE", title: "How to Pronounce TH", channel: "Rachel's English" },
  flap_t: { videoId: "MiVEOEEJPbw", title: "The American T Sound", channel: "Rachel's English" },
  v_w: { videoId: "oSCnE4IFb1g", title: "V vs W Pronunciation", channel: "Rachel's English" },
  r_sound: { videoId: "3XRTN5gW4oU", title: "How to Pronounce R", channel: "Rachel's English" },
  l_sound: { videoId: "vBek34CRgjk", title: "How to Pronounce L", channel: "Rachel's English" },
  stress: { videoId: "AHDLkQOq3ks", title: "Word Stress in English", channel: "Rachel's English" },
  vowels: { videoId: "eeaghqkd9Kk", title: "American Vowel Sounds", channel: "Rachel's English" },
  connected: { videoId: "bxUw3J7PYXU", title: "Connected Speech", channel: "Rachel's English" },
  final_consonants: { videoId: "ER0Da50Blpw", title: "Final Consonant Sounds", channel: "Rachel's English" },
  schwa: { videoId: "d_2ZEBb5jNY", title: "The Schwa Sound", channel: "Rachel's English" },
};
