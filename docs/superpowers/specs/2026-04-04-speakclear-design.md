# SpeakClear — Pronunciation Coach MVP Design Spec

## Overview

SpeakClear is a web application that helps non-native English speakers improve their American English pronunciation. Users read prompted sentences aloud, the system detects mispronounced or unclear words, highlights them, and coaches the user through targeted practice.

**Core philosophy:** Feels like a coach, not a tool. Feedback is encouraging, not critical.

## Architecture

**Stack:** Next.js (App Router) full-stack, deployed to Vercel.

**Hybrid pronunciation engine:**
- Browser-side: Web Speech API for real-time transcription + confidence scores (free, instant)
- Server-side: OpenAI GPT-4o-mini for deep phoneme analysis of flagged words (accurate, cost-controlled)
- OpenAI TTS (`tts-1`, `alloy` voice) for correct pronunciation playback

**No auth, no database.** Single-user self-practice app. Progress stored in browser localStorage.

## User Flow

### Sentence Mode (main screen)

1. App displays a prompted sentence from the sentence bank
2. User taps the mic button and reads the sentence aloud
3. Web Speech API transcribes in real-time (shown live under the sentence)
4. On completion, the client-side pre-filter compares transcript against expected tokens:
   - Flags words where: transcript mismatches OR confidence < 0.7 OR index is in `focusIndices`
   - Sorts flagged words by confidence (ascending)
   - Sends top 1–2 worst words to `/api/analyze`
   - Remaining flagged words get local-only feedback (marked `IMPROVING` with generic tip from tags)
5. Transcript re-renders with problem words highlighted (amber for IMPROVING, red for NEEDS_PRACTICE)
6. Results summary appears: "Focus on these words: [x, y]" with encouragement message
7. User clicks a highlighted word OR clicks inline "Practice" button to open Word Detail Card

### Word Detail Card (slide-up drawer)

Shown when user clicks a highlighted word. Contains:
- **"You said" vs "Correct"** comparison (e.g., "wader" vs "water")
- IPA pronunciation (e.g., /ˈwɔːtər/)
- Syllable breakdown (e.g., wa·ter)
- Plain-English tip (e.g., "Say 'WAH-ter' — soft T, quick D tap")
- Play correct pronunciation button (OpenAI TTS, cached)
- "Practice this word" button

### Practice Mode

1. App shows the target word prominently with its IPA and tip
2. User taps mic and says the word
3. Web Speech API captures it
4. Sent to `/api/evaluate-word` with `previousBand` and `attemptNumber`
5. Score band displayed with encouraging feedback:
   - **GREAT** — "That sounded clear!" (move on)
   - **IMPROVING** — "Getting closer!" (retry with refined tip)
   - **NEEDS_PRACTICE** — "Let's try again" (retry with tip)
6. User can retry or go back to the sentence
7. "Next sentence" CTA appears after practice

## Pronunciation Detection (3 Signals)

Words are flagged using three independent signals, combined before the OpenAI call:

1. **Transcript mismatch** — Web Speech API heard something different than the expected token
2. **Low confidence** — Web Speech API confidence score < 0.7 for a word, even if transcript matches
3. **Known difficulty** — Word index appears in `focusIndices` for the sentence (common mispronunciation patterns)

**Pre-filter logic (runs client-side in `lib/analyzer.ts`):**
- Compare `tokens[i]` vs Web Speech output word-by-word (lowercase)
- Apply all three signals to build a flagged words list
- Sort by confidence ascending
- Send only top 1–2 to OpenAI for deep analysis
- Others get local feedback from their pronunciation tags
- If 0 words are flagged, skip the API call entirely and show a "Great job!" result with all words marked CORRECT

**Reason enum:** `TRANSCRIPT_MISMATCH`, `LOW_CONFIDENCE`, `KNOWN_DIFFICULTY`

## API Routes

### POST `/api/analyze`

Receives the expected sentence data and user's speech results. Sends top problem words to OpenAI GPT-4o-mini with structured JSON output.

**Request:**
```json
{
  "sentence": {
    "tokens": ["the", "water", "is", "cold"],
    "focus": [
      { "word": "water", "tags": ["FLAP_T", "VOWEL_SHIFT"] }
    ]
  },
  "flaggedWords": [
    {
      "index": 1,
      "expected": "water",
      "heard": "wader",
      "confidence": 0.42,
      "reason": "TRANSCRIPT_MISMATCH",
      "tags": ["FLAP_T", "VOWEL_SHIFT"]
    }
  ]
}
```

**Response:**
```json
{
  "words": [
    {
      "index": 1,
      "word": "water",
      "status": "NEEDS_PRACTICE",
      "reason": "TRANSCRIPT_MISMATCH",
      "youSaid": "wader",
      "ipa": "/ˈwɔːtər/",
      "tip": "Say 'WAH-ter' — soft T, quick D tap",
      "syllables": "wa·ter",
      "shouldPractice": true
    }
  ],
  "summary": "Focus on: water",
  "encouragement": "You nailed 'the' and 'is' perfectly!"
}
```

### POST `/api/evaluate-word`

Evaluates a single word during practice mode.

**Request:**
```json
{
  "word": "water",
  "userSaid": "water",
  "previousBand": "NEEDS_PRACTICE",
  "attemptNumber": 2
}
```

**Response:**
```json
{
  "band": "GREAT",
  "feedback": "That sounded clear! The T was much softer this time.",
  "keepGoing": false
}
```

**Band enum:** `GREAT`, `IMPROVING`, `NEEDS_PRACTICE`

### POST `/api/tts`

Generates pronunciation audio for a word using OpenAI TTS.

**Request:**
```json
{
  "word": "water",
  "accent": "us"
}
```

**Response:** Audio blob (MP3), cached client-side in localStorage with key `tts:{word}:{accent}`.

## Sentence Bank Schema

Stored as `data/sentences.json`. Static file, no database.

```json
{
  "sentences": [
    {
      "id": 1,
      "text": "The water is cold.",
      "expected": "the water is cold",
      "tokens": ["the", "water", "is", "cold"],
      "category": "daily",
      "level": "beginner",
      "difficulty": 1,
      "focusIndices": [1, 3],
      "focus": [
        { "word": "water", "tags": ["FLAP_T", "VOWEL_SHIFT"] },
        { "word": "cold", "tags": ["FINAL_CONSONANT"] }
      ],
      "hint": "Focus on 'water' (soft T) and 'cold' (clear ending)"
    }
  ]
}
```

**Categories:** `daily`, `interview`, `phone_call`
**Levels:** `beginner`, `intermediate`, `advanced`
**Difficulty:** 1–3 within each level
**Pronunciation tags:** `FLAP_T`, `VOWEL_SHIFT`, `TH_SOUND`, `STRESS_PATTERN`, `FINAL_CONSONANT`, `R_L_DISTINCTION`, `V_W_DISTINCTION`, `VOWEL_REDUCTION`

MVP ships with ~50 sentences across all levels and categories.

## localStorage Schema

```json
{
  "speakclear_progress": {
    "wordsAttempted": {
      "water": {
        "attempts": 3,
        "lastBand": "IMPROVING",
        "bestBand": "IMPROVING",
        "lastPracticed": "2026-04-04T12:00:00Z",
        "tags": ["FLAP_T", "VOWEL_SHIFT"]
      }
    },
    "sessionsCompleted": 5,
    "sentencesCompleted": [1, 2, 3, 7],
    "currentLevel": "beginner",
    "lastSessionDate": "2026-04-04"
  },
  "speakclear_tts_cache": {
    "tts:water:us": "<base64 audio blob>"
  }
}
```

Tags on word entries let the progress dashboard surface patterns (e.g., "You struggle with TH sounds") without re-analyzing.

## UI Design

**Layout:** Centered single card, Duolingo-style. Everything stacks vertically. Mobile-first.

**Color theme:** Calm Indigo
- Primary: Indigo (#6366f1) — mic button, brand, CTAs
- Background: Soft indigo gradient (#eef2ff → #f8fafc)
- Card: White with subtle indigo shadow
- Score bands:
  - GREAT: Indigo/blue badge (#c7d2fe / #3730a3)
  - IMPROVING: Amber badge (#fef3c7 / #92400e)
  - NEEDS_PRACTICE: Rose badge (#fce7f3 / #9d174d)
- Highlighted words in transcript:
  - IMPROVING: Amber background (#fef3c7), amber text
  - NEEDS_PRACTICE: Rose background (#fee2e2), red text
  - CORRECT: No highlight (default text)

**Typography:** System font stack. Clean, readable.

**Components:**
- `SentenceDisplay` — Shows prompted sentence with category/level label
- `MicButton` — Large centered circle, indigo gradient, pulse animation while recording
- `TranscriptView` — Live text during recording, then highlighted results post-analysis
- `WordDetailCard` — Slide-up drawer with "You said" vs "Correct", IPA, tip, play audio, practice button
- `PracticeMode` — Focused view: large word, IPA, tip, mic button, band result
- `ResultsSummary` — "Focus on these words" message + encouragement + "Next sentence" CTA
- `ProgressDashboard` — Simple stats view showing commonly struggled words and patterns

## Folder Structure

```
voice/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── api/
│       ├── analyze/route.ts
│       ├── evaluate-word/route.ts
│       └── tts/route.ts
├── components/
│   ├── SentenceDisplay.tsx
│   ├── MicButton.tsx
│   ├── TranscriptView.tsx
│   ├── WordDetailCard.tsx
│   ├── PracticeMode.tsx
│   ├── ResultsSummary.tsx
│   ├── ProgressDashboard.tsx
│   └── ui/
├── lib/
│   ├── speech.ts
│   ├── analyzer.ts
│   ├── openai.ts
│   ├── progress.ts
│   ├── tts-cache.ts
│   └── types.ts
├── data/
│   └── sentences.json
├── public/
│   └── fonts/
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.local
```

## Future Improvements (post-MVP)

- User accounts and cloud progress sync
- Real-time feedback mode (live hints while speaking)
- Accent-specific coaching (detect native language, tailor tips)
- Custom sentence input (free speech mode)
- Leaderboards / streaks / gamification
- Real-time accent conversion
- Structured lesson curriculum
- Audio recording playback (hear yourself vs correct)
