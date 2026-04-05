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

export interface AwardContext {
  sentenceCompleted?: boolean;
  perfectScore?: boolean;
  coachExchange?: boolean;
  greatWord?: boolean;
  dailyChallengeCompleted?: boolean;
  thSoundGreat?: boolean;
  category?: string;
}

export interface AwardResult {
  newXP: number;
  leveledUp: boolean;
  newLevel: number;
  newBadges: string[];
  streakUpdated: boolean;
  streakCount: number;
}

export const LEVELS: { level: number; name: string; minXP: number }[] = [
  { level: 1, name: "Newcomer", minXP: 0 },
  { level: 2, name: "Speaker", minXP: 100 },
  { level: 3, name: "Communicator", minXP: 300 },
  { level: 4, name: "Presenter", minXP: 600 },
  { level: 5, name: "Fluent", minXP: 1000 },
];

export const BADGES: { id: string; name: string; icon: string; condition: string }[] = [
  { id: "first_words", name: "First Words", icon: "1", condition: "Complete 1 sentence" },
  { id: "perfect_score", name: "Perfect Score", icon: "P", condition: "All words correct on a sentence" },
  { id: "on_fire", name: "On Fire", icon: "3d", condition: "3-day streak" },
  { id: "committed", name: "Committed", icon: "7d", condition: "7-day streak" },
  { id: "chatterbox", name: "Chatterbox", icon: "10", condition: "10 coach exchanges" },
  { id: "leveling_up", name: "Leveling Up", icon: "L2", condition: "Reach Level 2" },
  { id: "halfway_there", name: "Halfway There", icon: "L3", condition: "Reach Level 3" },
  { id: "th_master", name: "TH Master", icon: "TH", condition: "5 TH words at GREAT" },
  { id: "public_speaker", name: "Public Speaker", icon: "SP", condition: "Complete all Speaking drills" },
  { id: "interview_ready", name: "Interview Ready", icon: "IN", condition: "Complete all Interview drills" },
  { id: "daily_hero", name: "Daily Hero", icon: "5x", condition: "Complete 5 daily challenges" },
  { id: "fluent", name: "Fluent", icon: "F", condition: "Reach Level 5" },
];

const DEFAULT_STATE: GamificationState = {
  xp: 0,
  level: 1,
  streak: { count: 0, lastDate: "" },
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
};

export function getGamificationState(): GamificationState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE, streak: { ...DEFAULT_STATE.streak }, dailyChallenge: { ...DEFAULT_STATE.dailyChallenge }, badges: [] };
    return JSON.parse(raw) as GamificationState;
  } catch {
    return { ...DEFAULT_STATE, streak: { ...DEFAULT_STATE.streak }, dailyChallenge: { ...DEFAULT_STATE.dailyChallenge }, badges: [] };
  }
}

function saveState(state: GamificationState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetGamification(): void {
  localStorage.removeItem(STORAGE_KEY);
}

function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

function calcLevel(xp: number): number {
  let level = 1;
  for (const entry of LEVELS) {
    if (xp >= entry.minXP) {
      level = entry.level;
    }
  }
  return level;
}

function checkBadges(state: GamificationState): string[] {
  const earned: string[] = [];
  const already = new Set(state.badges);

  const check = (id: string, condition: boolean) => {
    if (!already.has(id) && condition) {
      earned.push(id);
    }
  };

  check("first_words", state.totalSentences >= 1);
  check("perfect_score", state.totalPerfectScores >= 1);
  check("on_fire", state.streak.count >= 3);
  check("committed", state.streak.count >= 7);
  check("chatterbox", state.totalCoachExchanges >= 10);
  check("leveling_up", state.level >= 2);
  check("halfway_there", state.level >= 3);
  check("th_master", state.thSoundGreatCount >= 5);
  check("public_speaker", state.publicSpeakingCompleted >= 1);
  check("interview_ready", state.interviewCompleted >= 1);
  check("daily_hero", state.totalDailyChallenges >= 5);
  check("fluent", state.level >= 5);

  return earned;
}

export function awardXP(amount: number, context?: AwardContext): AwardResult {
  const state = getGamificationState();
  const today = todayString();

  // Update streak
  let streakUpdated = false;
  let streakBonus = 0;
  const lastDate = state.streak.lastDate;

  if (lastDate !== today) {
    let newCount: number;
    let isContinuation = false;
    if (lastDate === "") {
      newCount = 1;
    } else {
      const last = new Date(lastDate);
      const now = new Date(today);
      const diffMs = now.getTime() - last.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        newCount = state.streak.count + 1;
        isContinuation = true;
      } else {
        newCount = 1;
      }
    }
    state.streak = { count: newCount, lastDate: today };
    streakUpdated = true;
    // Bonus only applies when continuing an existing streak (not day 1 or reset)
    streakBonus = isContinuation ? 5 * newCount : 0;
  }

  // Update counters from context
  if (context?.sentenceCompleted) state.totalSentences += 1;
  if (context?.perfectScore) state.totalPerfectScores += 1;
  if (context?.coachExchange) state.totalCoachExchanges += 1;
  if (context?.greatWord) state.totalGreatWords += 1;
  if (context?.dailyChallengeCompleted) state.totalDailyChallenges += 1;
  if (context?.thSoundGreat) state.thSoundGreatCount += 1;

  // Award XP including streak bonus
  const totalXP = amount + streakBonus;
  state.xp += totalXP;

  // Update level
  const prevLevel = state.level;
  const newLevel = calcLevel(state.xp);
  state.level = newLevel;
  const leveledUp = newLevel > prevLevel;

  // Check badges
  const newBadges = checkBadges(state);
  state.badges = [...state.badges, ...newBadges];

  saveState(state);

  return {
    newXP: state.xp,
    leveledUp,
    newLevel,
    newBadges,
    streakUpdated,
    streakCount: state.streak.count,
  };
}

export function getDailyChallenge(totalSentences: number): number {
  if (totalSentences <= 1) return 0;
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return dayOfYear % totalSentences;
}

export function isDailyChallengeCompleted(): boolean {
  const state = getGamificationState();
  return state.dailyChallenge.completedDate === todayString();
}

export function completeDailyChallenge(): AwardResult {
  const state = getGamificationState();
  state.dailyChallenge.completedDate = todayString();
  state.totalDailyChallenges += 1;
  saveState(state);
  // awardXP will re-increment totalDailyChallenges via context if passed, so we
  // save the date first then call awardXP without the dailyChallengeCompleted flag.
  // But we already incremented totalDailyChallenges above, so pass without flag.
  return awardXP(50);
}

export function getUnlockedLevels(level: number): string[] {
  const unlocked: string[] = ["beginner"];
  if (level >= 2) unlocked.push("intermediate");
  if (level >= 3) unlocked.push("advanced");
  return unlocked;
}

export function isCoachUnlocked(level: number): boolean {
  return level >= 4;
}
