import { describe, expect, it } from "vitest";

import { gradeExercise, levenshtein, matchesText, normalizeAnswer } from "./answer";
import type { Exercise } from "./schema";

const mc: Exercise = {
  id: "1",
  type: "multiple_choice",
  prompt: "pilih",
  options: ["a", "b", "c"],
  correctIndex: 1,
};
const build: Exercise = {
  id: "2",
  type: "translate_build",
  prompt: "susun",
  answerTokens: ["I", "drink", "water"],
  distractors: ["eat"],
  acceptedVariants: [["I", "am", "drinking", "water"]],
};
const typed: Exercise = {
  id: "3",
  type: "type_answer",
  prompt: "tulis",
  answer: "market",
  acceptedVariants: [],
};
const pairs: Exercise = {
  id: "4",
  type: "match_pairs",
  pairs: [
    { left: "pasar", right: "market" },
    { left: "ikan", right: "fish" },
  ],
};

describe("lesson/answer", () => {
  it("normalizes case, punctuation and spacing", () => {
    expect(normalizeAnswer("  Market!  ")).toBe("market");
    expect(normalizeAnswer("I   drink, water.")).toBe("i drink water");
  });

  it("computes levenshtein distance", () => {
    expect(levenshtein("kitten", "sitting")).toBe(3);
    expect(levenshtein("market", "market")).toBe(0);
  });

  it("tolerates a single typo", () => {
    expect(matchesText("markett", ["market"])).toBe(true);
    expect(matchesText("merkat", ["market"])).toBe(false);
  });

  it("grades multiple choice", () => {
    expect(gradeExercise(mc, { kind: "index", index: 1 })).toBe(true);
    expect(gradeExercise(mc, { kind: "index", index: 0 })).toBe(false);
  });

  it("grades translate build incl. accepted variants", () => {
    expect(gradeExercise(build, { kind: "tokens", tokens: ["I", "drink", "water"] })).toBe(true);
    expect(gradeExercise(build, { kind: "tokens", tokens: ["I", "am", "drinking", "water"] })).toBe(
      true,
    );
    expect(gradeExercise(build, { kind: "tokens", tokens: ["water", "drink", "I"] })).toBe(false);
  });

  it("grades typed and listening answers", () => {
    expect(gradeExercise(typed, { kind: "text", text: "Markt" })).toBe(true);
    expect(gradeExercise(typed, { kind: "text", text: "merkat" })).toBe(false);
    expect(gradeExercise(typed, { kind: "index", index: 0 })).toBe(false);
  });

  it("grades match pairs", () => {
    const correct = {
      kind: "pairs" as const,
      pairs: [
        { left: "pasar", right: "market" },
        { left: "ikan", right: "fish" },
      ],
    };
    const wrong = {
      kind: "pairs" as const,
      pairs: [
        { left: "pasar", right: "fish" },
        { left: "ikan", right: "market" },
      ],
    };
    expect(gradeExercise(pairs, correct)).toBe(true);
    expect(gradeExercise(pairs, wrong)).toBe(false);
  });
});
