import { describe, test, expect, beforeEach } from "vitest";
import {
  getGamificationState,
  resetGamification,
  awardXP,
  getDailyChallenge,
  isDailyChallengeCompleted,
  completeDailyChallenge,
  getUnlockedLevels,
  isCoachUnlocked,
  LEVELS,
  BADGES,
} from "@/lib/gamification";

const STORAGE_KEY = "clario_gamification";

beforeEach(() => {
  localStorage.clear();
});

describe("LEVELS", () => {
  test("has 5 entries", () => {
    expect(LEVELS).toHaveLength(5);
  });

  test("has correct XP thresholds", () => {
    expect(LEVELS[0]).toMatchObject({ level: 1, minXP: 0, name: "Newcomer" });
    expect(LEVELS[1]).toMatchObject({ level: 2, minXP: 100, name: "Speaker" });
    expect(LEVELS[2]).toMatchObject({ level: 3, minXP: 300, name: "Communicator" });
    expect(LEVELS[3]).toMatchObject({ level: 4, minXP: 600, name: "Presenter" });
    expect(LEVELS[4]).toMatchObject({ level: 5, minXP: 1000, name: "Fluent" });
  });
});

describe("BADGES", () => {
  test("has 12 entries", () => {
    expect(BADGES).toHaveLength(12);
  });

  test("contains expected badge IDs", () => {
    const ids = BADGES.map((b) => b.id);
    expect(ids).toContain("first_words");
    expect(ids).toContain("perfect_score");
    expect(ids).toContain("on_fire");
    expect(ids).toContain("committed");
    expect(ids).toContain("chatterbox");
    expect(ids).toContain("leveling_up");
    expect(ids).toContain("halfway_there");
    expect(ids).toContain("th_master");
    expect(ids).toContain("public_speaker");
    expect(ids).toContain("interview_ready");
    expect(ids).toContain("daily_hero");
    expect(ids).toContain("fluent");
  });

  test("each badge has id, name, icon, and condition", () => {
    for (const badge of BADGES) {
      expect(badge).toHaveProperty("id");
      expect(badge).toHaveProperty("name");
      expect(badge).toHaveProperty("icon");
      expect(badge).toHaveProperty("condition");
    }
  });
});

describe("getGamificationState", () => {
  test("returns default state for a new user", () => {
    const state = getGamificationState();
    expect(state.xp).toBe(0);
    expect(state.level).toBe(1);
    expect(state.streak.count).toBe(0);
    expect(state.streak.lastDate).toBe("");
    expect(state.dailyChallenge.completedDate).toBe("");
    expect(state.badges).toEqual([]);
    expect(state.totalCoachExchanges).toBe(0);
    expect(state.totalDailyChallenges).toBe(0);
    expect(state.totalSentences).toBe(0);
    expect(state.totalPerfectScores).toBe(0);
    expect(state.totalGreatWords).toBe(0);
    expect(state.thSoundGreatCount).toBe(0);
    expect(state.publicSpeakingCompleted).toBe(0);
    expect(state.interviewCompleted).toBe(0);
  });

  test("returns stored state if present", () => {
    const stored = {
      xp: 50,
      level: 1,
      streak: { count: 3, lastDate: "2026-04-01" },
      dailyChallenge: { completedDate: "" },
      badges: ["first_words"],
      totalCoachExchanges: 5,
      totalDailyChallenges: 2,
      totalSentences: 10,
      totalPerfectScores: 1,
      totalGreatWords: 3,
      thSoundGreatCount: 1,
      publicSpeakingCompleted: 0,
      interviewCompleted: 0,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    const state = getGamificationState();
    expect(state.xp).toBe(50);
    expect(state.streak.count).toBe(3);
    expect(state.badges).toContain("first_words");
  });
});

describe("resetGamification", () => {
  test("clears localStorage", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ xp: 999 }));
    resetGamification();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  test("getGamificationState returns defaults after reset", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ xp: 999 }));
    resetGamification();
    const state = getGamificationState();
    expect(state.xp).toBe(0);
  });
});

describe("awardXP", () => {
  test("adds XP to state", () => {
    const result = awardXP(20);
    expect(result.newXP).toBe(20);
    const state = getGamificationState();
    expect(state.xp).toBe(20);
  });

  test("accumulates XP across multiple calls", () => {
    awardXP(30);
    const result = awardXP(40);
    expect(result.newXP).toBe(70);
  });

  test("triggers level up at 100 XP threshold", () => {
    const result = awardXP(100);
    expect(result.leveledUp).toBe(true);
    expect(result.newLevel).toBe(2);
  });

  test("does not level up below threshold", () => {
    const result = awardXP(99);
    expect(result.leveledUp).toBe(false);
    expect(result.newLevel).toBe(1);
  });

  test("levels up to correct level with large XP award", () => {
    const result = awardXP(600);
    expect(result.leveledUp).toBe(true);
    expect(result.newLevel).toBe(4);
  });

  test("updates streak on first action of a new day", () => {
    // Simulate lastDate as yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        xp: 0,
        level: 1,
        streak: { count: 2, lastDate: yesterdayStr },
        dailyChallenge: { completedDate: "" },
        badges: [],
        totalCoachExchanges: 0,
        totalDailyChallenges: 0,
        totalSentences: 0,
        totalPerfectScores: 0,
        totalGreatWords: 0,
        thSoundGreatCount: 0,
        publicSpeakingCompleted: 0,
        interviewCompleted: 0,
      })
    );
    const result = awardXP(10);
    expect(result.streakUpdated).toBe(true);
    expect(result.streakCount).toBe(3);
  });

  test("does not double-update streak on the same day", () => {
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        xp: 10,
        level: 1,
        streak: { count: 5, lastDate: today },
        dailyChallenge: { completedDate: "" },
        badges: [],
        totalCoachExchanges: 0,
        totalDailyChallenges: 0,
        totalSentences: 0,
        totalPerfectScores: 0,
        totalGreatWords: 0,
        thSoundGreatCount: 0,
        publicSpeakingCompleted: 0,
        interviewCompleted: 0,
      })
    );
    const result = awardXP(10);
    expect(result.streakUpdated).toBe(false);
    expect(result.streakCount).toBe(5);
  });

  test("resets streak if lastDate is older than yesterday", () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const oldDate = twoDaysAgo.toISOString().split("T")[0];
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        xp: 0,
        level: 1,
        streak: { count: 10, lastDate: oldDate },
        dailyChallenge: { completedDate: "" },
        badges: [],
        totalCoachExchanges: 0,
        totalDailyChallenges: 0,
        totalSentences: 0,
        totalPerfectScores: 0,
        totalGreatWords: 0,
        thSoundGreatCount: 0,
        publicSpeakingCompleted: 0,
        interviewCompleted: 0,
      })
    );
    const result = awardXP(10);
    expect(result.streakUpdated).toBe(true);
    expect(result.streakCount).toBe(1);
  });

  test("applies streak bonus XP on first action of day", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        xp: 0,
        level: 1,
        streak: { count: 3, lastDate: yesterdayStr },
        dailyChallenge: { completedDate: "" },
        badges: [],
        totalCoachExchanges: 0,
        totalDailyChallenges: 0,
        totalSentences: 0,
        totalPerfectScores: 0,
        totalGreatWords: 0,
        thSoundGreatCount: 0,
        publicSpeakingCompleted: 0,
        interviewCompleted: 0,
      })
    );
    // Streak count becomes 4; bonus = 5 * 4 = 20
    const result = awardXP(10);
    // newXP = 10 (base) + 20 (bonus) = 30
    expect(result.newXP).toBe(30);
  });

  test("earns first_words badge on sentenceCompleted", () => {
    const result = awardXP(10, { sentenceCompleted: true });
    expect(result.newBadges).toContain("first_words");
  });

  test("earns perfect_score badge on perfectScore", () => {
    const result = awardXP(10, { perfectScore: true });
    expect(result.newBadges).toContain("perfect_score");
  });

  test("does not re-award already earned badge", () => {
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        xp: 0,
        level: 1,
        streak: { count: 1, lastDate: today },
        dailyChallenge: { completedDate: "" },
        badges: ["first_words"],
        totalCoachExchanges: 0,
        totalDailyChallenges: 0,
        totalSentences: 1,
        totalPerfectScores: 0,
        totalGreatWords: 0,
        thSoundGreatCount: 0,
        publicSpeakingCompleted: 0,
        interviewCompleted: 0,
      })
    );
    const result = awardXP(10, { sentenceCompleted: true });
    expect(result.newBadges).not.toContain("first_words");
  });

  test("increments totalSentences when sentenceCompleted", () => {
    awardXP(10, { sentenceCompleted: true });
    const state = getGamificationState();
    expect(state.totalSentences).toBe(1);
  });

  test("increments totalPerfectScores when perfectScore", () => {
    awardXP(10, { perfectScore: true });
    const state = getGamificationState();
    expect(state.totalPerfectScores).toBe(1);
  });

  test("increments totalCoachExchanges when coachExchange", () => {
    awardXP(5, { coachExchange: true });
    const state = getGamificationState();
    expect(state.totalCoachExchanges).toBe(1);
  });

  test("increments totalGreatWords when greatWord", () => {
    awardXP(5, { greatWord: true });
    const state = getGamificationState();
    expect(state.totalGreatWords).toBe(1);
  });

  test("increments thSoundGreatCount when thSoundGreat", () => {
    awardXP(5, { thSoundGreat: true });
    const state = getGamificationState();
    expect(state.thSoundGreatCount).toBe(1);
  });
});

describe("getDailyChallenge", () => {
  test("returns a deterministic index based on day of year", () => {
    const total = 50;
    const index1 = getDailyChallenge(total);
    const index2 = getDailyChallenge(total);
    expect(index1).toBe(index2);
  });

  test("returns a value in range [0, total)", () => {
    const total = 20;
    const index = getDailyChallenge(total);
    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThan(total);
  });

  test("returns 0 when total is 0 or 1", () => {
    expect(getDailyChallenge(0)).toBe(0);
    expect(getDailyChallenge(1)).toBe(0);
  });
});

describe("isDailyChallengeCompleted", () => {
  test("returns false when not completed today", () => {
    expect(isDailyChallengeCompleted()).toBe(false);
  });

  test("returns true when completed today", () => {
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        xp: 0,
        level: 1,
        streak: { count: 0, lastDate: "" },
        dailyChallenge: { completedDate: today },
        badges: [],
        totalCoachExchanges: 0,
        totalDailyChallenges: 0,
        totalSentences: 0,
        totalPerfectScores: 0,
        totalGreatWords: 0,
        thSoundGreatCount: 0,
        publicSpeakingCompleted: 0,
        interviewCompleted: 0,
      })
    );
    expect(isDailyChallengeCompleted()).toBe(true);
  });

  test("returns false when completed on a previous day", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        xp: 0,
        level: 1,
        streak: { count: 0, lastDate: "" },
        dailyChallenge: { completedDate: "2026-01-01" },
        badges: [],
        totalCoachExchanges: 0,
        totalDailyChallenges: 0,
        totalSentences: 0,
        totalPerfectScores: 0,
        totalGreatWords: 0,
        thSoundGreatCount: 0,
        publicSpeakingCompleted: 0,
        interviewCompleted: 0,
      })
    );
    expect(isDailyChallengeCompleted()).toBe(false);
  });
});

describe("completeDailyChallenge", () => {
  test("marks today as completed and awards 50 XP", () => {
    const result = completeDailyChallenge();
    expect(result.newXP).toBeGreaterThanOrEqual(50);
    const state = getGamificationState();
    const today = new Date().toISOString().split("T")[0];
    expect(state.dailyChallenge.completedDate).toBe(today);
    expect(state.totalDailyChallenges).toBe(1);
  });
});

describe("getUnlockedLevels", () => {
  test("returns only beginner at level 1", () => {
    const unlocked = getUnlockedLevels(1);
    expect(unlocked).toContain("beginner");
    expect(unlocked).not.toContain("intermediate");
    expect(unlocked).not.toContain("advanced");
  });

  test("returns beginner and intermediate at level 2", () => {
    const unlocked = getUnlockedLevels(2);
    expect(unlocked).toContain("beginner");
    expect(unlocked).toContain("intermediate");
    expect(unlocked).not.toContain("advanced");
  });

  test("returns beginner, intermediate, and advanced at level 3+", () => {
    const unlocked3 = getUnlockedLevels(3);
    expect(unlocked3).toContain("beginner");
    expect(unlocked3).toContain("intermediate");
    expect(unlocked3).toContain("advanced");

    const unlocked5 = getUnlockedLevels(5);
    expect(unlocked5).toContain("beginner");
    expect(unlocked5).toContain("intermediate");
    expect(unlocked5).toContain("advanced");
  });
});

describe("isCoachUnlocked", () => {
  test("returns false below level 4", () => {
    expect(isCoachUnlocked(1)).toBe(false);
    expect(isCoachUnlocked(2)).toBe(false);
    expect(isCoachUnlocked(3)).toBe(false);
  });

  test("returns true at level 4 and above", () => {
    expect(isCoachUnlocked(4)).toBe(true);
    expect(isCoachUnlocked(5)).toBe(true);
  });
});
