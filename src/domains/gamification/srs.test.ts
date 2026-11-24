import { describe, expect, it } from "vitest";

import { DEFAULT_ITEM_STATE, review } from "./srs";

const now = new Date("2026-01-01T00:00:00Z");

describe("gamification/srs", () => {
  it("schedules the first correct review one day out", () => {
    const result = review(DEFAULT_ITEM_STATE, true, now);
    expect(result.intervalDays).toBe(1);
    expect(result.reps).toBe(1);
    expect(result.ease).toBeCloseTo(2.55);
    expect(result.dueAt.getTime()).toBe(now.getTime() + 86_400_000);
  });

  it("uses a 3-day step on the second correct review", () => {
    const first = review(DEFAULT_ITEM_STATE, true, now);
    const second = review(first, true, now);
    expect(second.intervalDays).toBe(3);
    expect(second.reps).toBe(2);
  });

  it("multiplies by ease afterwards", () => {
    const first = review(DEFAULT_ITEM_STATE, true, now);
    const second = review(first, true, now);
    const third = review(second, true, now);
    expect(third.intervalDays).toBe(Math.round(3 * second.ease));
  });

  it("resets on a wrong answer and lowers ease", () => {
    const learned = { ease: 2.5, intervalDays: 10, reps: 3, lapses: 0 };
    const result = review(learned, false, now);
    expect(result.intervalDays).toBe(1);
    expect(result.lapses).toBe(1);
    expect(result.reps).toBe(0);
    expect(result.ease).toBeCloseTo(2.3);
  });

  it("clamps ease to the configured bounds", () => {
    expect(review({ ease: 1.3, intervalDays: 1, reps: 1, lapses: 1 }, false, now).ease).toBe(1.3);
    expect(review({ ease: 2.8, intervalDays: 1, reps: 3, lapses: 0 }, true, now).ease).toBe(2.8);
  });
});
