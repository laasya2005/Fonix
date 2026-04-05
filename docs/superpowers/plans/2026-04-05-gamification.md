# Clario Gamification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Duolingo-style gamification (XP, levels, streaks, badges, daily challenge, unlock gates) to make Clario addictive.

**Architecture:** A new `lib/gamification.ts` module owns all gamification state and logic. Existing components call `awardXP()` after practice actions. New UI components (LevelBar, DailyChallenge, BadgeGrid, popups) are added to the Dashboard. Skill tracks and AI Coach respect level-based unlock gates.

**Tech Stack:** React, TypeScript, localStorage, CSS animations (existing animation system in globals.css)

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/gamification.ts` | Core logic: state management, `awardXP()`, `checkBadges()`, `getDailyChallenge()`, level thresholds, streak tracking |
| `lib/__tests__/gamification.test.ts` | Tests for all gamification logic |
| `components/LevelBar.tsx` | XP progress bar with level name and "X XP to next level" |
| `components/DailyChallenge.tsx` | Daily challenge card with countdown timer |
| `components/BadgeGrid.tsx` | Badge display grid (earned + locked) |
| `components/BadgePopup.tsx` | Celebration overlay when badge earned |
| `components/LevelUpPopup.tsx` | Level-up celebration overlay |
| `components/Dashboard.tsx` | **Modify**: integrate LevelBar, DailyChallenge, BadgeGrid, streak, unlock gates on skill tracks |
| `components/AICoach.tsx` | **Modify**: add XP award on coach exchange, lock scenarios below Level 4 |
| `components/PracticeMode.tsx` | **Modify**: add XP award when word reaches GREAT |
| `app/page.tsx` | **Modify**: add XP award on sentence completion, pass gamification state for popups |
| `app/globals.css` | **Modify**: add celebration/confetti animations |

---

### Task 1: Core Gamification Module

**Files:**
- Create: `lib/gamification.ts`
- Test: `lib/__tests__/gamification.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// lib/__tests__/gamification.test.ts
import { describe, test, expect, beforeEach } from "vitest";
import {
  getGamificationState,
  resetGamification,
  awardXP,
  getDailyChallenge,
  LEVELS,
  BADGES,
} from "../gamification";

// Mock localStorage
const store: Record<string, string> = {};
beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  global.localStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    length: 0,
    key: () => null,
  };
  resetGamification();
});

describe("getGamificationState", () => {
  test("returns default state for new user", () => {
    const s = getGamificationState();
    expect(s.xp).toBe(0);
    expect(s.level).toBe(1);
    expect(s.streak.count).toBe(0);
    expect(s.badges).toEqual([]);
  });
});

describe("awardXP", () => {
  test("adds XP to state", () => {
    const result = awardXP(10);
    expect(result.newXP).toBe(10);
    expect(getGamificationState().xp).toBe(10);
  });

  test("triggers level up at 100 XP", () => {
    awardXP(99);
    const result = awardXP(1);
    expect(result.leveledUp).toBe(true);
    expect(getGamificationState().level).toBe(2);
  });

  test("does not level up below threshold", () => {
    const result = awardXP(50);
    expect(result.leveledUp).toBe(false);
    expect(getGamificationState().level).toBe(1);
  });

  test("awards first_words badge on sentence completion", () => {
    const result = awardXP(10, { sentenceCompleted: true });
    expect(result.newBadges).toContain("first_words");
  });

  test("awards perfect_score badge", () => {
    const result = awardXP(25, { perfectScore: true });
    expect(result.newBadges).toContain("perfect_score");
  });

  test("updates streak on first action of the day", () => {
    const result = awardXP(10);
    expect(result.streakUpdated).toBe(true);
    expect(getGamificationState().streak.count).toBe(1);
  });

  test("does not double-update streak same day", () => {
    awardXP(10);
    const result = awardXP(10);
    expect(result.streakUpdated).toBe(false);
  });
});

describe("getDailyChallenge", () => {
  test("returns a sentence index deterministically", () => {
    const idx1 = getDailyChallenge(60);
    const idx2 = getDailyChallenge(60);
    expect(idx1).toBe(idx2);
    expect(idx1).toBeGreaterThanOrEqual(0);
    expect(idx1).toBeLessThan(60);
  });
});

describe("LEVELS", () => {
  test("has 5 levels with increasing thresholds", () => {
    expect(LEVELS).toHaveLength(5);
    expect(LEVELS[0].xpRequired).toBe(0);
    expect(LEVELS[1].xpRequired).toBe(100);
    expect(LEVELS[4].xpRequired).toBe(1000);
  });
});

describe("BADGES", () => {
  test("has 12 badges", () => {
    expect(BADGES).toHaveLength(12);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/__tests__/gamification.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```typescript
// lib/gamification.ts

const STORAGE_KEY = "clario_gamification";

export interface GamificationState {
  xp: number;
  level: number;
  streak: { count: number; lastDate: string };
  dailyChallenge: { completedDate: string };
  badges: string[];
  totalCoachExchanges: number;
  totalDailyChallenges: number;
  totalSentences: number;
  totalPerfectScores: number;
  totalGreatWords: number;
  thSoundGreatCount: number;
  publicSpeakingCompleted: number;
  interviewCompleted: number;
}

export interface AwardResult {
  newXP: number;
  leveledUp: boolean;
  newLevel: number;
  newBadges: string[];
  streakUpdated: boolean;
  streakCount: number;
}

export interface AwardContext {
  sentenceCompleted?: boolean;
  perfectScore?: boolean;
  coachExchange?: boolean;
  greatWord?: boolean;
  dailyChallengeCompleted?: boolean;
  thSoundGreat?: boolean;
  category?: string;
}

export const LEVELS = [
  { level: 1, name: "Newcomer", xpRequired: 0 },
  { level: 2, name: "Speaker", xpRequired: 100 },
  { level: 3, name: "Communicator", xpRequired: 300 },
  { level: 4, name: "Presenter", xpRequired: 600 },
  { level: 5, name: "Fluent", xpRequired: 1000 },
];

export const BADGES = [
  { id: "first_words", name: "First Words", icon: "🎯", condition: "Complete 1 sentence" },
  { id: "perfect_score", name: "Perfect Score", icon: "⭐", condition: "All words correct on a sentence" },
  { id: "on_fire", name: "On Fire", icon: "🔥", condition: "3-day streak" },
  { id: "committed", name: "Committed", icon: "💪", condition: "7-day streak" },
  { id: "chatterbox", name: "Chatterbox", icon: "🗣️", condition: "10 AI Coach exchanges" },
  { id: "leveling_up", name: "Leveling Up", icon: "📈", condition: "Reach Level 2" },
  { id: "halfway_there", name: "Halfway There", icon: "🏆", condition: "Reach Level 3" },
  { id: "th_master", name: "TH Master", icon: "👄", condition: "5 TH words at GREAT" },
  { id: "public_speaker", name: "Public Speaker", icon: "🎤", condition: "Complete all Speaking drills" },
  { id: "interview_ready", name: "Interview Ready", icon: "💼", condition: "Complete all Interview drills" },
  { id: "daily_hero", name: "Daily Hero", icon: "📅", condition: "Complete 5 daily challenges" },
  { id: "fluent", name: "Fluent", icon: "🌟", condition: "Reach Level 5" },
];

function getDefaultState(): GamificationState {
  return {
    xp: 0, level: 1,
    streak: { count: 0, lastDate: "" },
    dailyChallenge: { completedDate: "" },
    badges: [],
    totalCoachExchanges: 0, totalDailyChallenges: 0,
    totalSentences: 0, totalPerfectScores: 0, totalGreatWords: 0,
    thSoundGreatCount: 0, publicSpeakingCompleted: 0, interviewCompleted: 0,
  };
}

export function getGamificationState(): GamificationState {
  if (typeof window === "undefined") return getDefaultState();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return getDefaultState();
  return { ...getDefaultState(), ...JSON.parse(raw) };
}

function saveState(state: GamificationState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetGamification(): void {
  if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
}

function computeLevel(xp: number): number {
  let lvl = 1;
  for (const l of LEVELS) {
    if (xp >= l.xpRequired) lvl = l.level;
  }
  return lvl;
}

function updateStreak(state: GamificationState): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (state.streak.lastDate === today) return false;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  if (state.streak.lastDate === yesterdayStr) {
    state.streak.count += 1;
  } else {
    state.streak.count = 1;
  }
  state.streak.lastDate = today;
  return true;
}

function checkBadges(state: GamificationState): string[] {
  const newBadges: string[] = [];
  const has = (id: string) => state.badges.includes(id);

  if (!has("first_words") && state.totalSentences >= 1) newBadges.push("first_words");
  if (!has("perfect_score") && state.totalPerfectScores >= 1) newBadges.push("perfect_score");
  if (!has("on_fire") && state.streak.count >= 3) newBadges.push("on_fire");
  if (!has("committed") && state.streak.count >= 7) newBadges.push("committed");
  if (!has("chatterbox") && state.totalCoachExchanges >= 10) newBadges.push("chatterbox");
  if (!has("leveling_up") && state.level >= 2) newBadges.push("leveling_up");
  if (!has("halfway_there") && state.level >= 3) newBadges.push("halfway_there");
  if (!has("th_master") && state.thSoundGreatCount >= 5) newBadges.push("th_master");
  if (!has("public_speaker") && state.publicSpeakingCompleted >= 12) newBadges.push("public_speaker");
  if (!has("interview_ready") && state.interviewCompleted >= 12) newBadges.push("interview_ready");
  if (!has("daily_hero") && state.totalDailyChallenges >= 5) newBadges.push("daily_hero");
  if (!has("fluent") && state.level >= 5) newBadges.push("fluent");

  return newBadges;
}

export function awardXP(amount: number, context?: AwardContext): AwardResult {
  const state = getGamificationState();
  const oldLevel = state.level;

  // Update counters from context
  if (context?.sentenceCompleted) state.totalSentences++;
  if (context?.perfectScore) state.totalPerfectScores++;
  if (context?.coachExchange) state.totalCoachExchanges++;
  if (context?.dailyChallengeCompleted) state.totalDailyChallenges++;
  if (context?.greatWord) state.totalGreatWords++;
  if (context?.thSoundGreat) state.thSoundGreatCount++;
  if (context?.category === "public_speaking" && context?.sentenceCompleted) state.publicSpeakingCompleted++;
  if (context?.category === "interview" && context?.sentenceCompleted) state.interviewCompleted++;

  // Update streak
  const streakUpdated = updateStreak(state);
  if (streakUpdated) {
    // Streak bonus XP: 5 × streak days (first action of the day)
    amount += 5 * state.streak.count;
  }

  // Add XP and compute level
  state.xp += amount;
  state.level = computeLevel(state.xp);
  const leveledUp = state.level > oldLevel;

  // Check badges
  const newBadges = checkBadges(state);
  state.badges = [...state.badges, ...newBadges];

  saveState(state);

  return {
    newXP: state.xp,
    leveledUp,
    newLevel: state.level,
    newBadges,
    streakUpdated,
    streakCount: state.streak.count,
  };
}

export function getDailyChallenge(totalSentences: number): number {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return dayOfYear % totalSentences;
}

export function isDailyChallengeCompleted(): boolean {
  const state = getGamificationState();
  const today = new Date().toISOString().slice(0, 10);
  return state.dailyChallenge.completedDate === today;
}

export function completeDailyChallenge(): AwardResult {
  const state = getGamificationState();
  state.dailyChallenge.completedDate = new Date().toISOString().slice(0, 10);
  saveState(state);
  return awardXP(50, { dailyChallengeCompleted: true });
}

export function getUnlockedLevels(level: number): string[] {
  const levels: string[] = ["beginner"];
  if (level >= 2) levels.push("intermediate");
  if (level >= 3) levels.push("advanced");
  return levels;
}

export function isCoachUnlocked(level: number): boolean {
  return level >= 4;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/__tests__/gamification.test.ts`
Expected: All 10 tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/gamification.ts lib/__tests__/gamification.test.ts
git commit -m "feat: add core gamification module with XP, levels, streaks, badges"
```

---

### Task 2: Celebration Animations (CSS)

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add celebration animations to globals.css**

Add these after the existing `/* Dashboard animations */` section:

```css
/* Celebration animations */
@keyframes confetti-fall {
  0% { transform: translateY(-100%) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}

@keyframes badge-reveal {
  0% { transform: scale(0) rotate(-30deg); opacity: 0; }
  60% { transform: scale(1.2) rotate(5deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
.animate-badge-reveal {
  animation: badge-reveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes level-up-glow {
  0% { box-shadow: 0 0 0 0 rgba(124,92,252,0.4); }
  50% { box-shadow: 0 0 40px 20px rgba(124,92,252,0.1); }
  100% { box-shadow: 0 0 0 0 rgba(124,92,252,0); }
}
.animate-level-up {
  animation: level-up-glow 1s ease-out;
}

@keyframes xp-float {
  0% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(-2rem); opacity: 0; }
}
.animate-xp-float {
  animation: xp-float 1.2s ease-out forwards;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/globals.css
git commit -m "feat: add celebration CSS animations for gamification"
```

---

### Task 3: LevelBar Component

**Files:**
- Create: `components/LevelBar.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

import { LEVELS } from "@/lib/gamification";

interface LevelBarProps {
  xp: number;
  level: number;
}

export function LevelBar({ xp, level }: LevelBarProps) {
  const currentLevel = LEVELS.find((l) => l.level === level) || LEVELS[0];
  const nextLevel = LEVELS.find((l) => l.level === level + 1);
  const xpInLevel = xp - currentLevel.xpRequired;
  const xpForNext = nextLevel ? nextLevel.xpRequired - currentLevel.xpRequired : 0;
  const pct = nextLevel ? Math.min((xpInLevel / xpForNext) * 100, 100) : 100;

  return (
    <div style={{
      background: 'var(--surface)', borderRadius: '0.85rem',
      border: '1px solid var(--border)', padding: '0.75rem 1rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)' }}>
            Level {level}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {currentLevel.name}
          </span>
        </div>
        <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', fontWeight: 500 }}>
          {xp} XP {nextLevel ? `/ ${nextLevel.xpRequired}` : ""}
        </span>
      </div>
      <div style={{ width: '100%', height: '0.35rem', borderRadius: '1rem', background: 'var(--surface-raised)', overflow: 'hidden' }}>
        <div className="animate-progress" style={{
          height: '100%', borderRadius: '1rem', background: 'var(--accent)',
          width: `${pct}%`, transition: 'width 0.5s ease',
        }} />
      </div>
      {nextLevel && (
        <p style={{ fontSize: '0.55rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
          {nextLevel.xpRequired - xp} XP to {nextLevel.name}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/LevelBar.tsx
git commit -m "feat: add LevelBar component"
```

---

### Task 4: DailyChallenge Component

**Files:**
- Create: `components/DailyChallenge.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

import { useState, useEffect } from "react";
import type { Sentence } from "@/lib/types";

interface DailyChallengeProps {
  sentence: Sentence;
  completed: boolean;
  onStart: () => void;
}

export function DailyChallenge({ sentence, completed, onStart }: DailyChallengeProps) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    function updateTimer() {
      const now = new Date();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diff = endOfDay.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${h}h ${m}m`);
    }
    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      background: 'var(--surface)', borderRadius: '0.85rem',
      border: '1px solid var(--border)', padding: '0.85rem 1rem',
      opacity: completed ? 0.6 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <span style={{ fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)' }}>
          Daily Challenge
        </span>
        <span style={{ fontSize: '0.55rem', color: 'var(--text-dim)' }}>
          {completed ? "Completed" : timeLeft + " left"}
        </span>
      </div>
      <p style={{
        fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 500,
        color: 'var(--text)', lineHeight: 1.5, fontStyle: 'italic', marginBottom: '0.5rem',
      }}>
        &ldquo;{sentence.text}&rdquo;
      </p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.6rem', color: 'var(--accent)', fontWeight: 600 }}>+50 XP bonus</span>
        {!completed && (
          <button onClick={onStart} className="touch-manipulation" style={{
            padding: '0.4rem 0.85rem', borderRadius: '0.5rem',
            border: '1px solid var(--text)', background: 'var(--text)', color: 'var(--bg)',
            fontWeight: 600, fontSize: '0.65rem', cursor: 'pointer',
          }}>
            Start
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/DailyChallenge.tsx
git commit -m "feat: add DailyChallenge component with countdown timer"
```

---

### Task 5: BadgeGrid and Popup Components

**Files:**
- Create: `components/BadgeGrid.tsx`
- Create: `components/BadgePopup.tsx`
- Create: `components/LevelUpPopup.tsx`

- [ ] **Step 1: Create BadgeGrid**

```typescript
"use client";

import { BADGES } from "@/lib/gamification";

interface BadgeGridProps {
  earned: string[];
}

export function BadgeGrid({ earned }: BadgeGridProps) {
  return (
    <div>
      <p style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.5rem' }}>
        Badges ({earned.length} / {BADGES.length})
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
        {BADGES.map((badge) => {
          const isEarned = earned.includes(badge.id);
          return (
            <div key={badge.id} style={{
              padding: '0.5rem 0.25rem', borderRadius: '0.6rem', textAlign: 'center',
              background: isEarned ? 'var(--surface)' : 'var(--surface-raised)',
              border: `1px solid ${isEarned ? 'var(--border-glow)' : 'var(--border)'}`,
              opacity: isEarned ? 1 : 0.4,
            }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{badge.icon}</div>
              <p style={{ fontSize: '0.45rem', fontWeight: 600, color: 'var(--text-muted)', lineHeight: 1.2 }}>{badge.name}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create BadgePopup**

```typescript
"use client";

import { useEffect } from "react";
import { BADGES } from "@/lib/gamification";

interface BadgePopupProps {
  badgeId: string;
  onClose: () => void;
}

export function BadgePopup({ badgeId, onClose }: BadgePopupProps) {
  const badge = BADGES.find((b) => b.id === badgeId);
  if (!badge) return null;

  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div className="animate-badge-reveal" style={{
        background: 'var(--surface)', borderRadius: '1rem',
        border: '1px solid var(--border)', padding: '2rem',
        textAlign: 'center', maxWidth: '16rem',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>{badge.icon}</div>
        <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.25rem' }}>
          Badge earned
        </p>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>
          {badge.name}
        </p>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          {badge.condition}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create LevelUpPopup**

```typescript
"use client";

import { useEffect } from "react";
import { LEVELS } from "@/lib/gamification";

interface LevelUpPopupProps {
  newLevel: number;
  onClose: () => void;
}

export function LevelUpPopup({ newLevel, onClose }: LevelUpPopupProps) {
  const level = LEVELS.find((l) => l.level === newLevel);
  if (!level) return null;

  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div className="animate-badge-reveal animate-level-up" style={{
        background: 'var(--surface)', borderRadius: '1rem',
        border: '1px solid var(--border)', padding: '2rem',
        textAlign: 'center', maxWidth: '16rem',
      }}>
        <p style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎉</p>
        <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', fontWeight: 700, marginBottom: '0.25rem' }}>
          Level up!
        </p>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)' }}>
          Level {newLevel}: {level.name}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/BadgeGrid.tsx components/BadgePopup.tsx components/LevelUpPopup.tsx
git commit -m "feat: add BadgeGrid, BadgePopup, and LevelUpPopup components"
```

---

### Task 6: Integrate Gamification into Dashboard

**Files:**
- Modify: `components/Dashboard.tsx`

- [ ] **Step 1: Update Dashboard imports and state**

Add these imports at the top of `components/Dashboard.tsx`:

```typescript
import { getGamificationState, getDailyChallenge, isDailyChallengeCompleted, getUnlockedLevels, isCoachUnlocked } from "@/lib/gamification";
import { LevelBar } from "./LevelBar";
import { DailyChallenge } from "./DailyChallenge";
import { BadgeGrid } from "./BadgeGrid";
```

Add to the `DashboardProps` interface:

```typescript
interface DashboardProps {
  onSelect: (category: Category) => void;
  onConversationMode: () => void;
  onPracticeWord: (word: string) => void;
  onDailyChallenge: (sentenceIndex: number) => void;
}
```

Add gamification state inside the component:

```typescript
const [gState, setGState] = useState({ xp: 0, level: 1, streak: { count: 0, lastDate: "" }, badges: [] as string[] });
const [dailyChallengeCompleted, setDailyChallengeCompleted] = useState(false);
const [dailySentenceIdx, setDailySentenceIdx] = useState(0);
```

Update the `useEffect` to load gamification state:

```typescript
useEffect(() => {
  const p = getProgress();
  const struggled = getStruggledWords();
  setStruggledWords(struggled);
  setStats({
    sentencesCompleted: p.sentencesCompleted.length,
    wordsAttempted: Object.keys(p.wordsAttempted).length,
    struggled: struggled.length,
  });

  const g = getGamificationState();
  setGState({ xp: g.xp, level: g.level, streak: g.streak, badges: g.badges });
  setDailyChallengeCompleted(isDailyChallengeCompleted());

  // Daily challenge sentence
  const totalSentences = (require("@/data/sentences.json") as { sentences: any[] }).sentences.length;
  setDailySentenceIdx(getDailyChallenge(totalSentences));
}, []);
```

- [ ] **Step 2: Add LevelBar after breadcrumb, before the avatar**

Insert after the breadcrumb nav `</div>` and before the `{/* ═══ HERO WITH AI AVATAR ═══ */}` section:

```tsx
{/* ═══ LEVEL BAR ═══ */}
<section style={{ ...container, marginTop: '0.5rem' }}>
  <LevelBar xp={gState.xp} level={gState.level} />
</section>
```

- [ ] **Step 3: Add streak to stats row**

Replace the existing stats array with:

```typescript
{[
  { label: 'Streak', value: gState.streak.count > 0 ? `🔥 ${gState.streak.count}d` : '—' },
  { label: 'Sentences', value: stats.sentencesCompleted },
  { label: 'To review', value: stats.struggled },
].map((s) => (
```

- [ ] **Step 4: Add Daily Challenge card after the "Your progress" section**

Insert after the progress section closing `</section>` and before the `{/* ═══ RECOMMENDED ═══ */}`:

```tsx
{/* ═══ DAILY CHALLENGE ═══ */}
<section style={{ ...container, marginTop: '0.75rem' }}>
  <DailyChallenge
    sentence={allSentences[dailySentenceIdx]}
    completed={dailyChallengeCompleted}
    onStart={() => onDailyChallenge(dailySentenceIdx)}
  />
</section>
```

Where `allSentences` is imported at the top: `import sentencesData from "@/data/sentences.json";` and `const allSentences = sentencesData.sentences as Sentence[];`

- [ ] **Step 5: Add BadgeGrid after skill tracks, before bottom spacing**

Insert before `{/* Bottom spacing */}`:

```tsx
{/* ═══ BADGES ═══ */}
<section style={{ ...container, marginTop: '1rem', paddingBottom: '0.25rem' }}>
  <BadgeGrid earned={gState.badges} />
</section>
```

- [ ] **Step 6: Add lock icons to skill track cards**

Inside the TRACKS `.map()`, add a lock check and overlay for locked levels:

```typescript
const unlockedLevels = getUnlockedLevels(gState.level);
const isLocked = false; // Tracks are always accessible, but sentences inside are filtered by level
```

For the AI Coach recommended card, add a lock check:

```typescript
const coachLocked = !isCoachUnlocked(gState.level);
```

If `coachLocked`, show the card with reduced opacity and "Reach Level 4 to unlock" text instead of the normal subtitle.

- [ ] **Step 7: Commit**

```bash
git add components/Dashboard.tsx
git commit -m "feat: integrate gamification into Dashboard with LevelBar, DailyChallenge, BadgeGrid"
```

---

### Task 7: Wire XP Awards into Existing Flows

**Files:**
- Modify: `app/page.tsx`
- Modify: `components/AICoach.tsx`
- Modify: `components/PracticeMode.tsx`

- [ ] **Step 1: Add XP to sentence completion in page.tsx**

Import `awardXP` at top of `app/page.tsx`:

```typescript
import { awardXP } from "@/lib/gamification";
```

In the `onFinalResult` callback (around line 140-155), after `markSentenceCompleted(sentence.id)` and the word progress loop, add:

```typescript
// Award XP
const isPerfect = data.words.length === 0 || data.words.every((w) => !w.shouldPractice);
awardXP(isPerfect ? 25 : 10, {
  sentenceCompleted: true,
  perfectScore: isPerfect,
  category: sentence.category,
});
```

- [ ] **Step 2: Add XP to AI Coach exchanges in AICoach.tsx**

Import `awardXP` at top of `components/AICoach.tsx`:

```typescript
import { awardXP } from "@/lib/gamification";
```

In the `onFinalResult` callback, after `setState("idle")` at the end of the successful coach response handling, add:

```typescript
// Award XP for coach exchange
awardXP(15, { coachExchange: true });
```

- [ ] **Step 3: Add XP to word practice in PracticeMode.tsx**

Import `awardXP` at top of `components/PracticeMode.tsx`:

```typescript
import { awardXP } from "@/lib/gamification";
```

In the `onFinalResult` callback, after `saveWordAttempt(word.word, evalResult.band, [])`, add:

```typescript
if (evalResult.band === Band.GREAT) {
  awardXP(20, { greatWord: true });
}
```

- [ ] **Step 4: Add daily challenge handler to page.tsx**

Add a new callback in `page.tsx`:

```typescript
const handleDailyChallenge = useCallback((sentenceIdx: number) => {
  // Find the sentence and start practicing it
  const dailySentence = allSentences[sentenceIdx];
  if (dailySentence) {
    setSelectedModule(dailySentence.category as Category);
    setSentenceIndex(sentenceIdx);
    setState("idle");
  }
}, []);
```

Pass it to Dashboard:

```tsx
<Dashboard
  onSelect={handleModuleSelect}
  onConversationMode={handleConversationMode}
  onPracticeWord={handlePracticeWord}
  onDailyChallenge={handleDailyChallenge}
/>
```

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx components/AICoach.tsx components/PracticeMode.tsx
git commit -m "feat: wire XP awards into sentence drills, AI Coach, and word practice"
```

---

### Task 8: XP Float Toast and Popup Triggers

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Add popup state to page.tsx**

Add state variables:

```typescript
const [badgePopup, setBadgePopup] = useState<string | null>(null);
const [levelUpPopup, setLevelUpPopup] = useState<number | null>(null);
const [xpFloat, setXpFloat] = useState<number | null>(null);
```

Import popup components:

```typescript
import { BadgePopup } from "@/components/BadgePopup";
import { LevelUpPopup } from "@/components/LevelUpPopup";
```

- [ ] **Step 2: Create a helper to handle award results**

```typescript
const handleAwardResult = useCallback((result: { leveledUp: boolean; newLevel: number; newBadges: string[] }, xpAmount: number) => {
  setXpFloat(xpAmount);
  setTimeout(() => setXpFloat(null), 1500);

  if (result.leveledUp) {
    setLevelUpPopup(result.newLevel);
  } else if (result.newBadges.length > 0) {
    setBadgePopup(result.newBadges[0]);
  }
}, []);
```

Update the existing `awardXP` calls to use this helper:

```typescript
const result = awardXP(isPerfect ? 25 : 10, { ... });
handleAwardResult(result, isPerfect ? 25 : 10);
```

- [ ] **Step 3: Render popups at the bottom of the main return**

Add before the closing `</>` of the main return:

```tsx
{/* XP float */}
{xpFloat && (
  <div className="animate-xp-float" style={{
    position: 'fixed', bottom: '6rem', left: '50%', transform: 'translateX(-50%)',
    fontSize: '1rem', fontWeight: 700, color: 'var(--accent)', zIndex: 55,
    pointerEvents: 'none',
  }}>
    +{xpFloat} XP
  </div>
)}

{/* Badge popup */}
{badgePopup && <BadgePopup badgeId={badgePopup} onClose={() => setBadgePopup(null)} />}

{/* Level up popup */}
{levelUpPopup && <LevelUpPopup newLevel={levelUpPopup} onClose={() => setLevelUpPopup(null)} />}
```

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add XP float toast, badge popup, and level-up popup triggers"
```

---

### Task 9: Run All Tests and Verify

**Files:**
- All test files

- [ ] **Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass (existing + new gamification tests)

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: No errors in non-test files

- [ ] **Step 3: Manual smoke test**

1. Open http://localhost:3000
2. Dashboard shows Level 1 bar, daily challenge, empty badges
3. Complete a sentence → see "+10 XP" float, level bar fills
4. Complete enough sentences to reach 100 XP → see level-up popup
5. Open AI Coach → exchange earns +15 XP
6. Complete daily challenge → +50 XP bonus
7. Check badges section → "First Words" badge should be earned
8. Refresh page → all progress persisted

- [ ] **Step 4: Commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address issues found during smoke test"
```
