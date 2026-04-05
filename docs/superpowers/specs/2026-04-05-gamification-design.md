# Clario Gamification System — Design Spec

## Goal

Transform Clario from a useful-but-forgettable practice tool into an addictive daily habit by adding Duolingo-style gamification. All mechanics run on localStorage — no accounts required.

## Architecture

Six interlocking systems wrap around the existing app without replacing any current features:

```
User practices → Earns XP → Fills level bar → Levels up → Unlocks content
                                                         → Earns badges
                                                         → Streak tracked daily
                                                         → Daily challenge for bonus XP
```

## 1. XP System

Every meaningful action earns XP. XP is the single currency that drives progression.

| Action | XP |
|---|---|
| Complete a sentence drill | +10 |
| Perfect score (all words correct) | +25 |
| AI Coach conversation (per exchange) | +15 |
| Practice a struggled word → GREAT | +20 |
| Complete daily challenge | +50 |
| Daily streak bonus | +5 × streak days |

XP is cumulative and never lost. Stored in `localStorage` as part of the gamification state.

## 2. Levels

5 levels with XP thresholds. Each level has a name and unlocks content.

| Level | Name | XP Required | Unlocks |
|---|---|---|---|
| 1 | Newcomer | 0 | Beginner sentences only |
| 2 | Speaker | 100 | Intermediate sentences |
| 3 | Communicator | 300 | Advanced sentences |
| 4 | Presenter | 600 | AI Coach scenarios |
| 5 | Fluent | 1000 | All content, "Fluent" badge |

The dashboard shows a level bar (current XP / next level threshold) with the level name and a fill animation.

### Unlock gates

- When a user selects a skill track (e.g., Job Interviews), only sentences at their unlocked levels are shown.
- Locked levels show a lock icon with "Reach Level X to unlock".
- AI Coach scenario selection shows locked scenarios at Level 1-3, unlocked at Level 4+.

## 3. Streaks

Consecutive days with at least one completed practice action.

- Stored as `{ count: number, lastDate: string }` in localStorage key `clario_streak`.
- A "day" is defined by the local calendar date (ISO date string).
- If `lastDate` is yesterday → increment count. If `lastDate` is today → no change. If older → reset to 1.
- Streak is updated when XP is earned (not on page load).
- Dashboard shows streak count with fire icon when active.
- Streak bonus XP: `5 × streak_days` added once per day on first practice action.

### Streak freeze (future consideration)

Not in this version. Can be added later as a reward for reaching certain badge milestones.

## 4. Daily Challenge

One sentence highlighted as the "Daily Challenge" each day.

- **Selection**: Deterministic based on date. `sentenceIndex = dayOfYear % totalSentences`. Uses a sentence from the user's current level or one level above (stretch goal).
- **Display**: Highlighted card on the dashboard with a countdown timer ("12h 34m remaining").
- **Reward**: +50 XP bonus on completion, in addition to normal sentence XP.
- **State**: `{ completedDate: string }` in localStorage. Resets daily. One challenge per day.
- **Visual**: Distinct styling on dashboard — not just another sentence card.

## 5. Badges

12 collectible achievements. Each has a name, icon (emoji), description, and unlock condition.

| Badge | Icon | Condition |
|---|---|---|
| First Words | 🎯 | Complete 1 sentence |
| Perfect Score | ⭐ | All words correct on a sentence |
| On Fire | 🔥 | 3-day streak |
| Committed | 💪 | 7-day streak |
| Chatterbox | 🗣️ | 10 AI Coach exchanges |
| Leveling Up | 📈 | Reach Level 2 |
| Halfway There | 🏆 | Reach Level 3 |
| TH Master | 👄 | 5 TH_SOUND words at GREAT band |
| Public Speaker | 🎤 | Complete all Public Speaking drills |
| Interview Ready | 💼 | Complete all Interview drills |
| Daily Hero | 📅 | Complete 5 daily challenges |
| Fluent | 🌟 | Reach Level 5 |

- Badges are checked after every XP-earning action.
- Newly earned badges trigger a celebration overlay (brief animation + badge name).
- All earned badges are visible in a "Badges" section on the dashboard.
- Unearned badges show as locked/grayed with their unlock condition.

## 6. Dashboard Changes

The dashboard becomes the gamification hub. New layout (top to bottom):

1. **Breadcrumb**: Home / Dashboard
2. **Level bar**: Level name + XP progress bar + "X XP to next level"
3. **AI Avatar orb** (existing) — tap to start AI Coach
4. **Daily Challenge card**: highlighted sentence with countdown timer + "50 XP bonus"
5. **Stats row**: Streak | Sentences | Words practiced
6. **Badges grid**: earned badges shown, unearned grayed
7. **Skill tracks** (existing) — with lock icons on gated content
8. **Words to review** link (existing)

## Data Model

All gamification state stored in a single localStorage key `clario_gamification`:

```typescript
interface GamificationState {
  xp: number;
  level: number;
  streak: { count: number; lastDate: string };
  dailyChallenge: { completedDate: string };
  badges: string[]; // array of earned badge IDs
  totalCoachExchanges: number;
  totalDailyChallenges: number;
}
```

Default state for new users:
```typescript
{
  xp: 0,
  level: 1,
  streak: { count: 0, lastDate: "" },
  dailyChallenge: { completedDate: "" },
  badges: [],
  totalCoachExchanges: 0,
  totalDailyChallenges: 0,
}
```

## Integration Points

Where XP is awarded (existing code that needs hooks):

1. **`page.tsx` → `handleNextSentence`**: after sentence analysis, award +10 XP (or +25 if perfect).
2. **`AICoach.tsx` → `onFinalResult` callback**: after each coach exchange, award +15 XP.
3. **`PracticeMode.tsx` → `saveWordAttempt`**: when band is GREAT, award +20 XP.
4. **Dashboard daily challenge completion**: award +50 XP.
5. **First practice action of the day**: award streak bonus (+5 × streak days).

Each hook calls a central `awardXP(amount, reason)` function in a new `lib/gamification.ts` module that:
- Adds XP
- Checks for level-up
- Updates streak if first action today
- Checks all badge conditions
- Returns `{ leveledUp: boolean, newBadges: string[], streakUpdated: boolean }` for UI reactions.

## New Files

| File | Purpose |
|---|---|
| `lib/gamification.ts` | Core gamification logic: `awardXP()`, `getGamificationState()`, `checkBadges()`, `getDailyChallenge()`, level thresholds |
| `components/LevelBar.tsx` | XP progress bar with level name |
| `components/DailyChallenge.tsx` | Daily challenge card with countdown |
| `components/BadgeGrid.tsx` | Badge display grid (earned + locked) |
| `components/BadgePopup.tsx` | Celebration overlay when badge earned |
| `components/LevelUpPopup.tsx` | Level-up celebration overlay |

## What Does NOT Change

- All existing pronunciation analysis, speech recognition, Whisper integration, GPT coaching
- The AI Coach conversation flow
- The sentence drill recording/analysis flow
- The word practice mode
- The progress tracking in `lib/progress.ts` (gamification is a separate system)
- The white/purple theme and visual design language

## Success Criteria

- User sees XP earned after every practice action
- Level bar visually fills and triggers a celebration on level-up
- Locked content is clearly gated with "Reach Level X" messaging
- Daily challenge is prominent on dashboard with countdown
- Badge popup appears immediately when a badge is earned
- Streak counter is visible and updates correctly
- All state persists across browser sessions via localStorage
