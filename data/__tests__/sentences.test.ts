import sentences from "@/data/sentences.json";
import { PronunciationTag } from "@/lib/types";

const validTags = Object.values(PronunciationTag);
const validCategories = ["daily", "interview", "phone_call"];
const validLevels = ["beginner", "intermediate", "advanced"];

describe("sentences.json", () => {
  test("has at least 50 sentences", () => {
    expect(sentences.sentences.length).toBeGreaterThanOrEqual(50);
  });

  test("all IDs are unique", () => {
    const ids = sentences.sentences.map((s: any) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("every sentence has required fields and valid values", () => {
    for (const s of sentences.sentences) {
      expect(s.id).toBeTypeOf("number");
      expect(s.text).toBeTypeOf("string");
      expect(s.text.length).toBeGreaterThan(0);
      expect(s.expected).toBe(s.text.toLowerCase().replace(/[.,!?]/g, "").replace(/\s+/g, " ").trim());
      expect(s.tokens).toEqual(s.expected.split(" "));
      expect(validCategories).toContain(s.category);
      expect(validLevels).toContain(s.level);
      expect(s.difficulty).toBeGreaterThanOrEqual(1);
      expect(s.difficulty).toBeLessThanOrEqual(3);
      expect(Array.isArray(s.focusIndices)).toBe(true);
      expect(Array.isArray(s.focus)).toBe(true);
      expect(s.hint).toBeTypeOf("string");
    }
  });

  test("focusIndices match focus words", () => {
    for (const s of sentences.sentences) {
      expect(s.focusIndices.length).toBe(s.focus.length);
      for (let i = 0; i < s.focus.length; i++) {
        const idx = s.focusIndices[i];
        expect(s.tokens[idx]).toBe(s.focus[i].word);
      }
    }
  });

  test("all focus tags are valid PronunciationTag values", () => {
    for (const s of sentences.sentences) {
      for (const f of s.focus) {
        for (const tag of f.tags) {
          expect(validTags).toContain(tag);
        }
      }
    }
  });

  test("has all three categories", () => {
    const categories = new Set(sentences.sentences.map((s: any) => s.category));
    expect(categories).toContain("daily");
    expect(categories).toContain("interview");
    expect(categories).toContain("phone_call");
  });

  test("has all three levels", () => {
    const levels = new Set(sentences.sentences.map((s: any) => s.level));
    expect(levels).toContain("beginner");
    expect(levels).toContain("intermediate");
    expect(levels).toContain("advanced");
  });
});
