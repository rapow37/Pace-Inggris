import { describe, expect, it } from "vitest";

import { accuracy, accuracyBonus, comboBonus, computeXp, maxConsecutive, XP_BASE } from "./xp";

describe("gamification/xp", () => {
  it("computes accuracy", () => {
    expect(accuracy(4, 5)).toBeCloseTo(0.8);
    expect(accuracy(0, 0)).toBe(0);
  });

  it("rounds accuracy bonus to 0-5", () => {
    expect(accuracyBonus(1)).toBe(5);
    expect(accuracyBonus(0.5)).toBe(3);
    expect(accuracyBonus(0.8)).toBe(4);
    expect(accuracyBonus(0)).toBe(0);
  });

  it("caps combo bonus at 5", () => {
    expect(comboBonus(0)).toBe(0);
    expect(comboBonus(3)).toBe(1);
    expect(comboBonus(15)).toBe(5);
    expect(comboBonus(30)).toBe(5);
  });

  it("finds the longest correct run", () => {
    expect(maxConsecutive([true, true, false, true, true, true, true])).toBe(4);
    expect(maxConsecutive([])).toBe(0);
    expect(maxConsecutive([false, false])).toBe(0);
  });

  it("computes xp = base + accuracy + combo", () => {
    const perfect = computeXp({ correctness: Array(8).fill(true) });
    expect(perfect.accuracy).toBe(1);
    expect(perfect.combo).toBe(8);
    expect(perfect.xp).toBe(XP_BASE + 5 + 2);

    const half = computeXp({ correctness: [true, false, true, false, true, false, true, false] });
    expect(half.accuracy).toBeCloseTo(0.5);
    expect(half.combo).toBe(1);
    expect(half.xp).toBe(XP_BASE + 3 + 0);
  });
});
